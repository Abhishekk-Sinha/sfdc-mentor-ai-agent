from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import urllib.parse
import json
import urllib.request

try:
    from .pro_persistence import register_persistence_routes, SearchRequest
except Exception:
    register_persistence_routes = None
    SearchRequest = None

app = FastAPI(title="SFDC Mentor Complete Backend", version="2.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
if register_persistence_routes:
    register_persistence_routes(app)

class MentorRequest(BaseModel):
    question: str
    mode: Optional[str] = "local"
    context: Optional[Dict[str, Any]] = None

class ReviewRequest(BaseModel):
    category: str
    question: str
    answer: str

@app.get("/")
def root():
    return {"status": "running", "app": "SFDC Mentor Complete Backend", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"ok": True, "service": "mentor-backend", "mode": "local + sqlite + ollama + search-links", "version": "2.1.0"}

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
    if SearchRequest and req.mode in ["backend", "rag", "ollama"]:
        try:
            for route in app.routes:
                if getattr(route, "path", "") == "/api/search":
                    result = route.endpoint(SearchRequest(query=q, limit=6))
                    saved_context = "\n".join([f"[{r.get('key')}] {r.get('snippet')}" for r in result.get("results", [])])
                    break
        except Exception:
            saved_context = ""
    if req.mode == "ollama":
        try:
            prompt = f"""You are Abhishek's 20+ years Salesforce Solution Architect mentor. Use saved app context first, then answer practically in simple English + Hinglish where helpful.
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
    return {
        "answer": backend_mentor_answer(q, mode, difficulty, interview_mode, saved_context),
        "source": "fastapi-sqlite-mentor" if saved_context else "fastapi-mentor",
        "context": saved_context,
        "links": search_links(q),
    }

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
    analytics = {"job_ready_score": 0, "items": 0}
    try:
        for route in app.routes:
            if getattr(route, "path", "") == "/api/analytics":
                analytics = route.endpoint()
                break
    except Exception:
        pass
    return {
        "status": "ready",
        "job_ready_score": analytics.get("job_ready_score", 0),
        "items": analytics.get("items", 0),
        "next_actions": [
            "Complete one 45-minute Salesforce sprint",
            "Save one interview answer",
            "Mark one topic Strong or Weak",
            "Apply/follow up on one job"
        ]
    }

def backend_mentor_answer(q: str, mode: str, difficulty: str, interview_mode: str, saved_context: str = "") -> str:
    context_line = f"\nSaved app context found:\n{saved_context}\n" if saved_context else "\nNo saved context found yet. Save notes/answers/jobs first for RAG guidance.\n"
    return (
        f"Backend mentor answer for: {q}\n\n"
        f"Mode: {mode}\nDifficulty: {difficulty}\nInterview Round: {interview_mode}\n"
        f"{context_line}\n"
        "1. Concept: define it in simple words.\n"
        "2. Beginner view: explain like you are starting from zero.\n"
        "3. Real scenario: connect it to CRM/business use case.\n"
        "4. Architect view: data model, security, limits, trade-offs, integration and deployment.\n"
        "5. Interview answer: use STAR + technical depth + measurable impact.\n"
        "6. Next action: save answer, create project proof, mark Weak/Strong, revise in weekly test."
    )

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
