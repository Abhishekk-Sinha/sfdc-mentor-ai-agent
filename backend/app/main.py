from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import urllib.parse
import json
import urllib.request
import sqlite3
import time
from pathlib import Path

app = FastAPI(title="SFDC Mentor Complete Backend", version="2.3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

DB_PATH = Path(__file__).resolve().parent.parent / "mentor_storage.sqlite3"

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_key TEXT UNIQUE,
            item_type TEXT,
            title TEXT,
            payload TEXT NOT NULL,
            created_at REAL,
            updated_at REAL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_items_key ON items(item_key)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)")
    conn.commit()
    return conn

def normalize_payload(item: Dict[str, Any]):
    now = time.time()
    item_key = str(item.get("key") or item.get("storageKey") or item.get("id") or item.get("name") or f"item-{int(now*1000)}")
    item_type = str(item.get("type") or item.get("category") or item.get("module") or "frontend-store")
    title = str(item.get("title") or item.get("label") or item.get("name") or item_key)[:250]
    if "data" in item and len(item.keys()) <= 5:
        payload_obj = item.get("data")
    else:
        payload_obj = item
    payload = json.dumps(payload_obj, ensure_ascii=False)
    return item_key, item_type, title, payload, now

def upsert_item(conn, item: Dict[str, Any]):
    item_key, item_type, title, payload, now = normalize_payload(item)
    existing = conn.execute("SELECT id FROM items WHERE item_key=?", (item_key,)).fetchone()
    if existing:
        conn.execute("UPDATE items SET item_type=?, title=?, payload=?, updated_at=? WHERE item_key=?", (item_type, title, payload, now, item_key))
        return existing["id"], item_key, item_type
    cur = conn.execute("INSERT INTO items(item_key,item_type,title,payload,created_at,updated_at) VALUES(?,?,?,?,?,?)", (item_key, item_type, title, payload, now, now))
    return cur.lastrowid, item_key, item_type

class MentorRequest(BaseModel):
    question: str
    mode: Optional[str] = "local"
    context: Optional[Dict[str, Any]] = None

class ReviewRequest(BaseModel):
    category: str
    question: str
    answer: str

class SearchRequest(BaseModel):
    query: str = ""
    limit: int = 20

class SyncRequest(BaseModel):
    items: Dict[str, Any]
    source: Optional[str] = "frontend-sync"

class RestoreRequest(BaseModel):
    items: Dict[str, Any]

@app.get("/")
def root():
    return {"status": "running", "app": "SFDC Mentor Complete Backend", "docs": "/docs", "sqlite_db": str(DB_PATH)}

@app.get("/api/health")
def health():
    return {"ok": True, "service": "mentor-backend", "mode": "free local + sqlite + ollama + search-links", "version": "2.3.0", "sqlite_db": str(DB_PATH)}

@app.post("/api/items")
def save_item(item: Dict[str, Any]):
    """Generic persistence endpoint used by frontend auto-sync.
    Accepts any JSON shape and stores it safely in SQLite.
    """
    conn = db()
    row_id, item_key, item_type = upsert_item(conn, item)
    conn.commit()
    conn.close()
    return {"ok": True, "id": row_id, "key": item_key, "type": item_type, "sqlite_db": str(DB_PATH)}

@app.get("/api/items")
def list_items(key: Optional[str] = None, type: Optional[str] = None, limit: int = 100):
    conn = db()
    sql = "SELECT * FROM items WHERE 1=1"
    params: List[Any] = []
    if key:
        sql += " AND item_key=?"
        params.append(key)
    if type:
        sql += " AND item_type=?"
        params.append(type)
    sql += " ORDER BY updated_at DESC LIMIT ?"
    params.append(max(1, min(limit, 500)))
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    out = []
    for r in rows:
        try:
            payload = json.loads(r["payload"])
        except Exception:
            payload = r["payload"]
        out.append({"id": r["id"], "key": r["item_key"], "type": r["item_type"], "title": r["title"], "payload": payload, "updated_at": r["updated_at"]})
    return {"ok": True, "items": out, "sqlite_db": str(DB_PATH)}

@app.delete("/api/items/{key}")
def delete_item(key: str):
    conn = db()
    cur = conn.execute("DELETE FROM items WHERE item_key=?", (key,))
    conn.commit()
    conn.close()
    return {"ok": True, "deleted": cur.rowcount, "key": key}

@app.post("/api/sync")
def sync_items(req: SyncRequest):
    """Bulk mirror frontend localStorage into SQLite.
    The frontend can keep localStorage for instant UI, while SQLite becomes the durable backend copy.
    """
    conn = db()
    saved = 0
    for key, value in (req.items or {}).items():
        upsert_item(conn, {"key": key, "data": value, "source": req.source or "frontend-sync", "type": "frontend-store"})
        saved += 1
    conn.commit()
    conn.close()
    return {"ok": True, "saved": saved, "sqlite_db": str(DB_PATH)}

@app.get("/api/export")
def export_items():
    conn = db()
    rows = conn.execute("SELECT item_key, payload FROM items ORDER BY item_key").fetchall()
    conn.close()
    items: Dict[str, Any] = {}
    for r in rows:
        try:
            items[r["item_key"]] = json.loads(r["payload"])
        except Exception:
            items[r["item_key"]] = r["payload"]
    return {"ok": True, "items": items, "count": len(items), "sqlite_db": str(DB_PATH)}

@app.post("/api/restore")
def restore_items(req: RestoreRequest):
    conn = db()
    saved = 0
    for key, value in (req.items or {}).items():
        upsert_item(conn, {"key": key, "data": value, "source": "restore", "type": "frontend-store"})
        saved += 1
    conn.commit()
    conn.close()
    return {"ok": True, "saved": saved, "sqlite_db": str(DB_PATH)}

@app.post("/api/search")
def search_items(req: SearchRequest):
    q = (req.query or "").lower().strip()
    conn = db()
    rows = conn.execute("SELECT * FROM items ORDER BY updated_at DESC LIMIT 1000").fetchall()
    conn.close()
    results = []
    for r in rows:
        text = f"{r['item_key']} {r['item_type']} {r['title']} {r['payload']}".lower()
        if not q or q in text:
            snippet = r["payload"][:500]
            results.append({"id": r["id"], "key": r["item_key"], "type": r["item_type"], "title": r["title"], "snippet": snippet})
        if len(results) >= max(1, min(req.limit, 50)):
            break
    return {"ok": True, "query": req.query, "results": results}

@app.get("/api/search")
def search_items_get(q: str = "", limit: int = 20):
    return search_items(SearchRequest(query=q, limit=limit))

@app.get("/api/analytics")
def analytics():
    conn = db()
    total = conn.execute("SELECT COUNT(*) AS c FROM items").fetchone()["c"]
    rows = conn.execute("SELECT item_type, COUNT(*) AS c FROM items GROUP BY item_type").fetchall()
    conn.close()
    by_type = {r["item_type"]: r["c"] for r in rows}
    score = min(100, 20 + total * 2 + by_type.get("answer", 0) * 3 + by_type.get("job", 0) * 2)
    return {"ok": True, "items": total, "by_type": by_type, "job_ready_score": score, "sqlite_db": str(DB_PATH)}

@app.get("/api/ollama-status")
def ollama_status():
    try:
        request = urllib.request.Request("http://127.0.0.1:11434/api/tags")
        with urllib.request.urlopen(request, timeout=3) as response:
            data = json.loads(response.read().decode("utf-8"))
        return {"ok": True, "models": data.get("models", [])}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}

@app.post("/api/mentor")
def mentor(req: MentorRequest):
    q = req.question.strip()
    if not q:
        return {"answer": "Please ask a question first.", "links": []}
    context = req.context or {}
    mode = context.get("mode", "General Mentor")
    difficulty = context.get("difficulty", "2+ Years")
    interview_mode = context.get("interviewMode", "Technical Round")
    saved_context = ""
    if req.mode in ["backend", "rag", "ollama"]:
        try:
            result = search_items(SearchRequest(query=q, limit=6))
            saved_context = "\n".join([f"[{r.get('key')}] {r.get('snippet')}" for r in result.get("results", [])])
        except Exception:
            saved_context = ""
    if req.mode == "ollama":
        try:
            prompt = f"""You are Abhishek's 20+ years Salesforce Solution Architect mentor. Use saved app context first, then answer practically in simple English.
Mode: {mode}
Difficulty: {difficulty}
Interview mode: {interview_mode}
Saved context:
{saved_context}
Question: {q}
Give: beginner explanation, deep architect view, project use case, interview answer, and next action."""
            payload = json.dumps({"model": "llama3.2", "prompt": prompt, "stream": False}).encode("utf-8")
            request = urllib.request.Request("http://127.0.0.1:11434/api/generate", data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(request, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
            return {"answer": data.get("response", "Ollama returned no response."), "source": "ollama-rag", "context": saved_context, "links": []}
        except Exception as exc:
            return {"answer": f"Ollama offline or unavailable: {exc}. Use saved context and search links below.\n\n{backend_mentor_answer(q, mode, difficulty, interview_mode, saved_context)}", "source": "fallback", "context": saved_context, "links": search_links(q)}
    return {"answer": backend_mentor_answer(q, mode, difficulty, interview_mode, saved_context), "source": "fastapi-sqlite-mentor" if saved_context else "fastapi-mentor", "context": saved_context, "links": search_links(q)}

@app.post("/api/review-answer")
def review_answer(req: ReviewRequest):
    text = req.answer.lower()
    score = min(100, 30 + len(req.answer) // 8)
    tips: List[str] = []
    for keyword in ["example", "scenario", "impact", "complexity", "test", "security"]:
        if keyword in text:
            score += 5
    if len(req.answer) < 150:
        tips.append("Add more detail and one practical example.")
    if req.category.lower() in ["dsa", "time complexity"] and "complexity" not in text:
        tips.append("Mention time complexity and space complexity.")
    if "salesforce" in req.category.lower() and "security" not in text:
        tips.append("Mention security, permission, or sharing impact.")
    if not tips:
        tips.append("Good answer. Now make it concise for a 60-second interview reply.")
    return {"score": min(100, score), "tips": tips}

@app.get("/api/search-links")
def api_search_links(q: str):
    return {"query": q, "links": search_links(q)}

@app.get("/api/dashboard-summary")
def dashboard_summary():
    data = analytics()
    return {"status": "ready", "job_ready_score": data.get("job_ready_score", 0), "items": data.get("items", 0), "sqlite_db": str(DB_PATH), "next_actions": ["Complete one 45-minute Salesforce sprint", "Save one interview answer", "Mark one topic Strong or Weak", "Apply/follow up on one job"]}

def backend_mentor_answer(q: str, mode: str, difficulty: str, interview_mode: str, saved_context: str = "") -> str:
    context_line = f"\nSaved app context found:\n{saved_context}\n" if saved_context else "\nNo saved context found yet. Save notes/answers/jobs first for RAG guidance.\n"
    return (f"Backend mentor answer for: {q}\n\nMode: {mode}\nDifficulty: {difficulty}\nInterview Round: {interview_mode}\n{context_line}\n1. Concept: define it in simple words.\n2. Beginner view: explain like you are starting from zero.\n3. Real scenario: connect it to CRM/business use case.\n4. Architect view: data model, security, limits, trade-offs, integration and deployment.\n5. Interview answer: use STAR + technical depth + measurable impact.\n6. Next action: save answer, create project proof, mark Weak/Strong, revise in weekly test.")

def search_links(q: str):
    e = urllib.parse.quote(q)
    return [
        {"title": "Google Search", "url": f"https://www.google.com/search?q={e}"},
        {"title": "Salesforce Help", "url": f"https://help.salesforce.com/s/search-result?q={e}"},
        {"title": "Salesforce Developer Docs", "url": f"https://developer.salesforce.com/docs?q={e}"},
        {"title": "Trailhead Search", "url": f"https://trailhead.salesforce.com/search?keywords={e}"},
        {"title": "StackExchange Salesforce", "url": f"https://salesforce.stackexchange.com/search?q={e}"},
        {"title": "LeetCode Search", "url": f"https://leetcode.com/problemset/?search={e}"},
        {"title": "HackerRank Search", "url": f"https://www.hackerrank.com/search?term={e}"},
    ]
