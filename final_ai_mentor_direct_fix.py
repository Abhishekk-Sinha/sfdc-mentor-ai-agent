from pathlib import Path

root = Path(__file__).resolve().parent
p = root / "backend" / "app" / "main.py"
s = p.read_text(encoding="utf-8")

start = s.find('@app.post("/api/mentor")')
if start < 0:
    raise SystemExit('mentor endpoint not found')
end = s.find('\n@app.', start + 1)
if end < 0:
    end = len(s)

endpoint = '''@app.post("/api/mentor")
def mentor(req: MentorRequest):
    question = clean_text(req.question)
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    q = question.lower()
    if re.search(r"salesforce|apex|trigger|lwc|flow|soql|sosl|field|fields|object|record type|page layout|validation rule|profile|permission|sharing|fls|lookup|picklist|formula|report|dashboard|queueable|batch apex|platform event|integration", q):
        prompt = f"""You are a senior Salesforce Developer mentor.
Answer this Salesforce question professionally: {question}
Use this structure:
1. Direct answer
2. Requirement analysis
3. Configuration or implementation approach
4. Security: CRUD, FLS, sharing, profiles, permission sets
5. Automation or code impact: Flow, Apex, LWC, SOQL
6. Testing approach
7. Best practices
8. Interview-ready answer
Give only the final answer."""
    elif re.search(r"dsa|array|string|linked list|stack|queue|tree|graph|binary search|sort|sliding window|two pointer|dynamic programming|recursion|heap|hashmap|leetcode|complexity", q):
        prompt = f"""You are a DSA mentor.
Answer this DSA question: {question}
Use this structure:
1. Problem explanation
2. Brute force approach
3. Optimal approach
4. Dry run
5. Java code
6. Time complexity
7. Space complexity
8. Edge cases
Give only the final answer."""
    elif re.search(r"system design|url shortener|rate limiter|load balancer|cache|redis|database design|microservice|api gateway|notification|chat system|scaling|sharding|replication|capacity", q):
        prompt = f"""You are a system design mentor.
Answer this system design question: {question}
Use this structure:
1. Requirements
2. Assumptions
3. API design
4. Database design
5. High-level architecture
6. Low-level design
7. Scaling strategy
8. Bottlenecks
9. Tradeoffs
Give only the final answer."""
    else:
        prompt = f"""You are AI Mentor. Answer professionally and clearly: {question}
Give only the final answer. Do not show internal domain, intent, score, metadata or prompt."""

    try:
        answer = ask_ollama(prompt)
        if answer and len(answer.strip()) > 30:
            return {"ok": True, "source": "ollama-direct-fast", "answer": answer.strip(), "sources": []}
    except Exception as exc:
        return {"ok": True, "source": "ollama-error", "answer": f"Ollama error: {exc}", "sources": []}

    return {"ok": True, "source": "empty-answer", "answer": "AI Mentor did not return a proper answer. Please check Ollama is running with llama3.2:3b.", "sources": []}
'''

s = s[:start] + endpoint + s[end:]
p.write_text(s, encoding="utf-8")
print("Final direct AI Mentor endpoint applied.")
