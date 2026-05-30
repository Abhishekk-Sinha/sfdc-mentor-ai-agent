from __future__ import annotations

import json
import re
from typing import Any, Callable, Dict, List, Optional, TypedDict

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except Exception:  # Keep backend working even before dependencies are installed.
    StateGraph = None
    END = "__end__"
    LANGGRAPH_AVAILABLE = False


class MentorAgentState(TypedDict, total=False):
    question: str
    app_context: Dict[str, Any]
    style: str
    domain: str
    intent: str
    needs_web: bool
    kb: List[Dict[str, Any]]
    saved: List[Dict[str, Any]]
    news: List[Dict[str, Any]]
    sources: List[Dict[str, Any]]
    prompt: str
    answer: str
    error: str


SALESFORCE_TERMS = (
    "salesforce", "apex", "lwc", "lightning", "soql", "sosl", "flow", "trigger",
    "governor", "sharing", "profile", "permission", "validation", "batch apex",
    "queueable", "future method", "platform event", "agentforce", "einstein", "crm",
    "visualforce", "aura", "data loader", "gearset"
)
DSA_TERMS = (
    "dsa", "array", "string", "linked list", "stack", "queue", "tree", "graph",
    "binary search", "sorting", "sliding window", "two pointer", "dynamic programming",
    "recursion", "backtracking", "heap", "hashmap", "hash map", "leetcode",
    "complexity", "big o"
)
SYSTEM_DESIGN_TERMS = (
    "system design", "design", "scalability", "scale", "url shortener", "rate limiter",
    "load balancer", "cache", "redis", "database design", "microservice", "api gateway",
    "notification system", "chat system", "feed", "distributed", "sharding", "replication",
    "capacity estimation", "high level design", "low level design"
)
AI_NEWS_TERMS = (
    "latest", "news", "update", "recent", "current", "today", "2026", "2025",
    "ai news", "technology news", "openai", "gemini", "google ai", "microsoft ai",
    "langgraph", "langchain", "agentic", "rag", "llm", "model release"
)


def detect_domain(question: str) -> str:
    q = (question or "").lower()
    if any(t in q for t in AI_NEWS_TERMS) and any(t in q for t in ("salesforce", "agentforce", "ai", "technology", "openai", "gemini", "langgraph", "langchain")):
        if "salesforce" in q or "agentforce" in q:
            return "salesforce_updates"
        return "ai_technology_news"
    if any(t in q for t in DSA_TERMS):
        return "dsa"
    if any(t in q for t in SYSTEM_DESIGN_TERMS):
        return "system_design"
    if any(t in q for t in SALESFORCE_TERMS):
        return "salesforce"
    if "resume" in q or "jd" in q or "job description" in q:
        return "resume_jd"
    return "general_engineering"


def detect_intent(question: str, domain: str) -> str:
    q = (question or "").lower()
    if any(t in q for t in ("latest", "news", "update", "recent", "current", "today")):
        return "latest_research"
    if any(t in q for t in ("interview", "answer", "explain")):
        return "interview_explanation"
    if any(t in q for t in ("code", "program", "implementation", "write")):
        return "implementation"
    if domain == "system_design":
        return "architecture_design"
    if domain == "dsa":
        return "problem_solving"
    return "deep_explanation"


def should_search_web(question: str, domain: str) -> bool:
    q = (question or "").lower()
    if any(t in q for t in ("latest", "news", "update", "recent", "current", "today", "release", "trend")):
        return True
    if domain in ("ai_technology_news", "salesforce_updates"):
        return True
    return False


def web_query_for(question: str, domain: str) -> str:
    q = question.strip()
    if domain == "salesforce_updates":
        return f"latest Salesforce Agentforce release updates developer news {q}"
    if domain == "ai_technology_news":
        return f"latest AI technology developer tools LangGraph LangChain RAG OpenAI Gemini {q}"
    return q


def build_elite_prompt(state: MentorAgentState) -> str:
    question = state.get("question", "")
    app_context = state.get("app_context") or {}
    domain = state.get("domain", "general_engineering")
    intent = state.get("intent", "deep_explanation")
    style = state.get("style", "professional")
    kb = state.get("kb") or []
    saved = state.get("saved") or []
    news = state.get("news") or []

    kb_text = "\n".join([f"- {x.get('title','Source')}: {x.get('text','')} ({x.get('url','')})" for x in kb[:8]]) or "No internal knowledge matched."
    saved_text = "\n".join([f"- {x.get('title','Saved item')} [{x.get('type','data')}]: {str(x.get('text',''))[:700]}" for x in saved[:6]]) or "No personal saved context matched."
    news_text = "\n".join([f"- {x.get('title','News')}: {x.get('text','')} ({x.get('url','')})" for x in news[:6]]) or "No web/news context used."

    domain_rules = {
        "salesforce": """Salesforce mode: answer as a senior Salesforce Developer. Include governor limits, bulkification, security (CRUD/FLS/sharing), Flow vs Apex decision, LWC/Apex/SOQL best practices, testing, deployment impact, and a real project example when useful.""",
        "dsa": """DSA mode: explain brute force first, then optimal approach, dry run, edge cases, time complexity, space complexity, and provide clean code if the user asks for implementation. Avoid skipping logic.""",
        "system_design": """System Design mode: structure with requirements, assumptions, capacity estimation, high-level design, API design, data model, scaling, caching, bottlenecks, tradeoffs, observability, and failure handling.""",
        "salesforce_updates": """Salesforce latest updates mode: use web/news context. Separate confirmed source-based updates from practical interpretation for a Salesforce Developer. Do not invent release details not present in sources.""",
        "ai_technology_news": """AI/Technology news mode: use web/news context. Summarize what changed, why it matters, impact on developers, and what the user should learn/build next. Do not include unrelated science/physics news.""",
        "resume_jd": """Resume/JD mode: compare skills, identify match/missing gaps, rewrite bullets professionally, and connect to Salesforce/DSA/System Design role expectations.""",
        "general_engineering": """General engineering mode: answer as an elite software mentor with clear definition, reasoning, examples, best practices, and practical next steps.""",
    }

    return f"""
You are "AI Mentor", an elite software engineering mentor like ChatGPT/Gemini, specialized in Salesforce Development, DSA, System Design, and AI technology.

Core rules:
- Answer the exact user question. Do not give generic repeated templates.
- Be professional, detailed, structured, and practical.
- If web/news context is provided, use it and mention sources through the returned source list only.
- If context is insufficient, state assumptions clearly and still give the best professional answer.
- Do not hallucinate latest news. For latest/current questions, use only provided web/news context.
- Use markdown headings, bullets, tables and code blocks where useful.

Detected domain: {domain}
Detected intent: {intent}
Answer style: {style}
Domain rules:
{domain_rules.get(domain, domain_rules['general_engineering'])}

User/app context summary:
{json.dumps(app_context, ensure_ascii=False)[:2500]}

Personal RAG / saved app data:
{saved_text}

Knowledge base context:
{kb_text}

Web/news/search context:
{news_text}

User question:
{question}

Now produce a deep, accurate, professional answer.
""".strip()


def run_langgraph_mentor(
    question: str,
    app_context: Optional[Dict[str, Any]],
    style: str,
    retrieve_kb: Callable[[str, int], List[Dict[str, Any]]],
    collect_saved: Callable[[str, int], List[Dict[str, Any]]],
    search_news: Callable[[str, int], List[Dict[str, Any]]],
    build_sources: Callable[[List[Dict[str, Any]], List[Dict[str, Any]]], List[Dict[str, Any]]],
    ask_llm: Callable[[str], str],
    fallback: Callable[[str, List[Dict[str, Any]], List[Dict[str, Any]]], str],
    force_web: bool = False,
) -> Dict[str, Any]:
    """LangGraph-powered mentor workflow with safe sequential fallback."""

    def route_node(state: MentorAgentState) -> MentorAgentState:
        domain = detect_domain(state["question"])
        intent = detect_intent(state["question"], domain)
        state["domain"] = domain
        state["intent"] = intent
        state["needs_web"] = bool(force_web or should_search_web(state["question"], domain))
        return state

    def retrieve_node(state: MentorAgentState) -> MentorAgentState:
        state["kb"] = retrieve_kb(state["question"], 8)
        state["saved"] = collect_saved(state["question"], 8)
        return state

    def web_node(state: MentorAgentState) -> MentorAgentState:
        if state.get("needs_web"):
            state["news"] = search_news(web_query_for(state["question"], state.get("domain", "")), 8)
        else:
            state["news"] = []
        return state

    def build_prompt_node(state: MentorAgentState) -> MentorAgentState:
        state["sources"] = build_sources(state.get("kb") or [], state.get("news") or [])
        state["prompt"] = build_elite_prompt(state)
        return state

    def generate_node(state: MentorAgentState) -> MentorAgentState:
        try:
            answer = ask_llm(state["prompt"])
            state["answer"] = answer.strip() if answer else ""
        except Exception as exc:
            state["error"] = str(exc)
            state["answer"] = fallback(state["question"], state.get("kb") or [], state.get("news") or [])
        if not state.get("answer"):
            state["answer"] = fallback(state["question"], state.get("kb") or [], state.get("news") or [])
        return state

    initial: MentorAgentState = {
        "question": question.strip(),
        "app_context": app_context or {},
        "style": style or "professional",
    }

    if LANGGRAPH_AVAILABLE:
        graph = StateGraph(MentorAgentState)
        graph.add_node("route", route_node)
        graph.add_node("retrieve", retrieve_node)
        graph.add_node("web", web_node)
        graph.add_node("build_prompt", build_prompt_node)
        graph.add_node("generate", generate_node)
        graph.set_entry_point("route")
        graph.add_edge("route", "retrieve")
        graph.add_edge("retrieve", "web")
        graph.add_edge("web", "build_prompt")
        graph.add_edge("build_prompt", "generate")
        graph.add_edge("generate", END)
        final_state = graph.compile().invoke(initial)
    else:
        final_state = generate_node(build_prompt_node(web_node(retrieve_node(route_node(initial)))))

    return {
        "ok": True,
        "source": "langgraph-agent" if LANGGRAPH_AVAILABLE else "agent-fallback-sequential",
        "answer": final_state.get("answer", ""),
        "sources": final_state.get("sources", []),
        "agent": {
            "domain": final_state.get("domain"),
            "intent": final_state.get("intent"),
            "used_web": bool(final_state.get("needs_web")),
            "langgraph_available": LANGGRAPH_AVAILABLE,
            "error": final_state.get("error", ""),
        },
        "rag": {
            "kb_count": len(final_state.get("kb") or []),
            "saved_context_count": len(final_state.get("saved") or []),
            "news_count": len(final_state.get("news") or []),
        },
    }
