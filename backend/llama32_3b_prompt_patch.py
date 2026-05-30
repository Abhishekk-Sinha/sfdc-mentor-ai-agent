from pathlib import Path

main = Path(__file__).resolve().parent / "app" / "main.py"
text = main.read_text(encoding="utf-8")

start = text.find("def build_mentor_prompt(")
end = text.find("\ndef ask_ollama(", start)
if start == -1 or end == -1:
    raise SystemExit("Could not find build_mentor_prompt block")

new_block = r'''def build_mentor_prompt(question: str, app_context: Dict[str, Any], saved: List[Dict[str, Any]], kb: List[Dict[str, str]], news: List[Dict[str, str]], style: str) -> str:
    q = (question or "").strip()
    q_lower = q.lower()

    dsa_terms = ["dsa", "array", "string", "linked list", "stack", "queue", "tree", "graph", "binary search", "sorting", "sliding window", "two pointer", "dynamic programming", "recursion", "backtracking", "heap", "hashmap", "leetcode", "complexity"]
    sd_terms = ["system design", "url shortener", "rate limiter", "load balancer", "cache", "redis", "database design", "microservice", "api gateway", "notification system", "chat system", "scaling", "sharding", "replication", "capacity"]
    sf_terms = ["salesforce", "apex", "trigger", "lwc", "lightning", "flow", "soql", "sosl", "governor", "sharing", "profile", "permission", "batch apex", "queueable", "platform event", "agentforce", "einstein", "visualforce"]
    news_terms = ["latest", "news", "update", "recent", "current", "today", "release", "trend", "2026", "2025"]

    if any(x in q_lower for x in news_terms):
        mode = "Latest Technology / Salesforce Updates"
        format_rule = """
Use this format:
1. Direct latest update summary
2. Key points from available context
3. Why it matters for a Salesforce Developer
4. What to learn or build next
5. Sources summary if sources are provided
"""
    elif any(x in q_lower for x in dsa_terms):
        mode = "DSA"
        format_rule = """
Use this format:
1. Problem meaning
2. Brute force approach
3. Optimal approach
4. Dry run with example
5. Code if implementation is asked
6. Time complexity
7. Space complexity
8. Common mistakes
"""
    elif any(x in q_lower for x in sd_terms):
        mode = "System Design"
        format_rule = """
Use this format:
1. Requirements
2. Assumptions
3. API design
4. Database design
5. High-level architecture
6. Scaling strategy
7. Bottlenecks
8. Tradeoffs
"""
    elif any(x in q_lower for x in sf_terms):
        mode = "Salesforce"
        format_rule = """
Use this format:
1. Direct definition
2. Why it is used
3. Real Salesforce project use case
4. Step-by-step implementation
5. Governor limits / security / best practices
6. Testing approach
7. Interview-ready answer
"""
    else:
        mode = "General Software Engineering"
        format_rule = """
Use this format:
1. Direct answer
2. Detailed explanation
3. Example
4. Best practices
5. Interview-ready summary
"""

    kb_text = "\n".join([f"- {d.get('title','Source')}: {d.get('text','')}" for d in (kb or [])[:4]]) or "No internal knowledge context."
    saved_text = "\n".join([f"- {d.get('title','Saved')}: {str(d.get('text',''))[:350]}" for d in (saved or [])[:3]]) or "No saved user context."
    news_text = "\n".join([f"- {d.get('title','News')}: {d.get('text','')}" for d in (news or [])[:3]]) or "No latest/news context."

    return f"""
You are AI Mentor, a professional mentor for Salesforce, DSA, System Design and AI technology.

Important rules:
- Answer the exact question only.
- Do not give generic repeated answer.
- Do not mention internal system, RAG, LangGraph, score, metadata, or model limitations.
- Use clear professional English.
- Give deep but readable answer.
- Keep the answer structured with headings and bullet points.
- If Salesforce: include project example, security, governor limits, testing and interview answer.
- If DSA: include brute force, optimal approach, dry run and complexity.
- If System Design: include architecture, APIs, database, scaling and tradeoffs.
- If latest/news/update: use provided news context only. Do not invent news.

Detected mode: {mode}

Knowledge context:
{kb_text}

Saved user context:
{saved_text}

News context:
{news_text}

Question:
{q}

Required answer format:
{format_rule}

Now give the final professional answer.
""".strip()
'''

text = text[:start] + new_block + text[end:]

old_payload = '{"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "options": {"temperature": 0.25, "top_p": 0.9}}'
new_payload = '{"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "options": {"temperature": 0.1, "top_p": 0.85, "num_ctx": 4096, "num_predict": 1200, "repeat_penalty": 1.15}}'
text = text.replace(old_payload, new_payload)

main.write_text(text, encoding="utf-8")
print("Applied llama3.2:3b optimized prompt and Ollama options.")
