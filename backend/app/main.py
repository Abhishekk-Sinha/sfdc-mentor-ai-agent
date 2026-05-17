from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import urllib.parse
import json
import urllib.request

app = FastAPI(title="SFDC Mentor Complete Backend", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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
    return {"ok": True, "service": "mentor-backend", "mode": "local + ollama + search-links"}

@app.post("/api/mentor")
def mentor(req: MentorRequest):
    q = req.question.strip()
    if not q:
        return {"answer": "Please ask a question first.", "links": []}
    if req.mode == "ollama":
        try:
            payload = json.dumps({"model": "llama3.2", "prompt": q, "stream": False}).encode("utf-8")
            request = urllib.request.Request("http://127.0.0.1:11434/api/generate", data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.loads(response.read().decode("utf-8"))
            return {"answer": data.get("response", "Ollama returned no response."), "source": "ollama", "links": []}
        except Exception as exc:
            return {"answer": f"Ollama offline or unavailable: {exc}. Use search links below.", "source": "fallback", "links": search_links(q)}
    return {
        "answer": "Mentor answer format: definition → practical example → real scenario → interview answer → revision action. Save your answer and mark Weak/Strong.",
        "source": "local",
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

def search_links(q: str):
    e = urllib.parse.quote(q)
    return [
        {"title": "Google Search", "url": f"https://www.google.com/search?q={e}"},
        {"title": "Salesforce Help", "url": f"https://help.salesforce.com/s/search-result?q={e}"},
        {"title": "Salesforce Developer Docs", "url": f"https://developer.salesforce.com/docs?q={e}"},
        {"title": "Trailhead Search", "url": f"https://trailhead.salesforce.com/search?keywords={e}"},
        {"title": "StackExchange Salesforce", "url": f"https://salesforce.stackexchange.com/search?q={e}"},
        {"title": "LeetCode Search", "url": f"https://leetcode.com/problemset/?search={e}"},
    ]
