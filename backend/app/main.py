from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import urllib.parse
import json
import urllib.request
import sqlite3
import time
import os
from pathlib import Path

app = FastAPI(title="SFDC Mentor Complete Backend", version="2.5.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

DB_PATH = Path(__file__).resolve().parent.parent / "mentor_storage.sqlite3"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "240"))


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
    return {
        "ok": True,
        "service": "mentor-backend",
        "mode": "free local + sqlite + ollama + search-links",
        "version": "2.5.0",
        "sqlite_db": str(DB_PATH),
        "ollama_base_url": OLLAMA_BASE_URL,
        "ollama_model": OLLAMA_MODEL,
        "ollama_timeout_seconds": OLLAMA_TIMEOUT,
    }


@app.post("/api/items")
def save_item(item: Dict[str, Any]):
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
        request = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/tags")
        with urllib.request.urlopen(request, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
        model_names = [m.get("name") for m in data.get("models", [])]
        return {
            "ok": True,
            "base_url": OLLAMA_BASE_URL,
            "configured_model": OLLAMA_MODEL,
            "model_available": OLLAMA_MODEL in model_names,
            "timeout_seconds": OLLAMA_TIMEOUT,
            "models": data.get("models", []),
        }
    except Exception as exc:
        return {"ok": False, "base_url": OLLAMA_BASE_URL, "configured_model": OLLAMA_MODEL, "timeout_seconds": OLLAMA_TIMEOUT, "error": str(exc)}


def call_ollama(prompt: str):
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.85,
            "num_predict": 650,
            "num_ctx": 2048,
        }
    }).encode("utf-8")
    request = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/generate", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=OLLAMA_TIMEOUT) as response:
        return json.loads(response.read().decode("utf-8"))


def professional_prompt(q: str, mode: str, difficulty: str, interview_mode: str, saved_context: str) -> str:
    context_block = saved_context[:1600] if saved_context else "No saved context yet."
    return f"""You are Abhishek's senior Salesforce Solution Architect mentor.
Answer in clear professional English. Be practical, interview-ready, and project-oriented.
Keep the answer concise but useful. Do not mention that you are an AI.

Mode: {mode}
Difficulty: {difficulty}
Interview round: {interview_mode}
Saved app context:
{context_block}

User question: {q}

Use this structure:
1. Simple definition
2. Real Salesforce use case
3. Step-by-step implementation guidance
4. Best practices and common mistakes
5. Interview answer in 60 seconds
6. Next action for Abhishek
"""


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
            data = call_ollama(professional_prompt(q, mode, difficulty, interview_mode, saved_context))
            response = data.get("response", "").strip()
            if not response:
                response = backend_mentor_answer(q, mode, difficulty, interview_mode, saved_context)
            return {"answer": response, "source": f"ollama-rag:{OLLAMA_MODEL}", "context": saved_context, "links": []}
        except Exception as exc:
            # Never show raw timeout/error as the main mentor answer. Keep user experience professional.
            answer = backend_mentor_answer(q, mode, difficulty, interview_mode, saved_context)
            answer += "\n\nNote: Local Ollama did not respond fast enough, so the backend used the professional offline mentor template. Your app is still working. For deeper local AI answers, keep Ollama running and ask shorter, focused questions."
            return {"answer": answer, "source": "professional-offline-fallback", "context": saved_context, "ollama_note": str(exc), "links": search_links(q)}
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
    q_lower = q.lower()
    context_line = ""
    if saved_context:
        context_line = "\nSaved context used: Your saved notes/answers were checked before generating this guidance.\n"

    if "apex trigger" in q_lower or "trigger" in q_lower:
        return f"""Professional mentor answer for: {q}

Mode: {mode} | Level: {difficulty} | Round: {interview_mode}{context_line}

1. Simple definition
An Apex trigger is server-side Salesforce logic that runs automatically before or after a DML operation such as insert, update, delete, or undelete. It is used when declarative automation is not enough or when you need complex bulk-safe logic.

2. Real Salesforce use case
Example: When multiple Opportunities are updated, update a custom Account field such as Latest_Opportunity_Amount__c or Total_Open_Pipeline__c. The trigger must handle 1 record and 200 records with the same logic.

3. Bulk-safe implementation pattern
- Never write SOQL or DML inside a for-loop.
- Collect record Ids in a Set.
- Query related records once.
- Use Map<Id, SObject> for fast lookup.
- Perform one final DML operation.
- Move business logic into a handler class.

Example structure:
trigger OpportunityTrigger on Opportunity (after insert, after update) {{
    if (Trigger.isAfter && (Trigger.isInsert || Trigger.isUpdate)) {{
        OpportunityTriggerHandler.updateAccountPipeline(Trigger.new);
    }}
}}

public class OpportunityTriggerHandler {{
    public static void updateAccountPipeline(List<Opportunity> newList) {{
        Set<Id> accountIds = new Set<Id>();
        for (Opportunity opp : newList) {{
            if (opp.AccountId != null) accountIds.add(opp.AccountId);
        }}
        if (accountIds.isEmpty()) return;

        List<Account> accountsToUpdate = new List<Account>();
        for (AggregateResult ar : [
            SELECT AccountId accId, SUM(Amount) totalAmount
            FROM Opportunity
            WHERE AccountId IN :accountIds AND IsClosed = false
            GROUP BY AccountId
        ]) {{
            accountsToUpdate.add(new Account(
                Id = (Id) ar.get('accId'),
                Total_Open_Pipeline__c = (Decimal) ar.get('totalAmount')
            ));
        }}
        if (!accountsToUpdate.isEmpty()) update accountsToUpdate;
    }}
}}

4. Best practices
- Use one trigger per object.
- Keep trigger logic thin and move logic to handler/service classes.
- Use recursion control if the trigger updates the same object again.
- Respect CRUD/FLS when exposing data through UI/API layers.
- Write test classes for single record, bulk records, null values, and edge cases.

5. 60-second interview answer
An Apex trigger is automation that executes before or after database events. I use it when Flow is not sufficient for complex or bulk logic. My trigger design follows a one-trigger-per-object pattern, with logic moved into a handler class. I collect record Ids, query related data once, use Maps for processing, and perform DML outside loops. For example, I built a bulk-safe Opportunity trigger to update Account pipeline summary using AggregateResult. I also cover test classes for bulk data, edge cases, and governor limits.

6. Next action
Save this answer in Interview Room, mark Apex Trigger as Strong after practicing it, and create one project proof bullet around bulk-safe trigger design."""

    if "flow" in q_lower and "apex" in q_lower:
        return f"""Professional mentor answer for: {q}

Use Flow for simple record automation, approvals, screen guided steps, and admin-maintainable processes. Use Apex when logic is complex, bulk-heavy, transaction-sensitive, integration-oriented, or requires advanced error handling.

Decision rule:
- Simple field update: Flow
- Guided UI form: Screen Flow
- Complex calculations across objects: Apex
- High-volume processing: Apex / Batch Apex
- External API call with custom retry/error handling: Apex
- Admin-maintainable business rule: Flow

Interview line:
I always evaluate maintainability, volume, governor limits, testing, security, and error handling before choosing Flow or Apex. I prefer declarative first, but I move to Apex when the solution needs scalability or advanced logic."""

    return f"""Professional mentor answer for: {q}

Mode: {mode} | Level: {difficulty} | Round: {interview_mode}{context_line}

1. Simple definition
This topic should be understood in terms of what it does, why it is used, and where it fits in a real Salesforce project.

2. Real Salesforce use case
Connect the concept to a business process such as lead management, case handling, appointment tracking, property management, reporting, or integration with an external system.

3. Implementation guidance
- Identify the business requirement.
- Decide the object/data model.
- Define security and access.
- Choose Flow, Apex, LWC, or Integration based on complexity.
- Add validation, testing, and deployment steps.
- Document the impact for interview and resume.

4. Architect view
Think about scalability, governor limits, record access, maintainability, auditability, deployment risk, and rollback plan.

5. Interview answer format
In my project, I would first understand the requirement, design the data model, apply security, choose the right automation/tool, test edge cases, and deploy using a controlled release process. I would also measure the impact in terms of reduced manual effort, improved accuracy, or better user experience.

6. Next action
Write one saved answer, create one project proof bullet, and mark the topic Weak or Strong based on your confidence."""


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
