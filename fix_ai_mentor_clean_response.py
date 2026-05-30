from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONT = ROOT / "frontend" / "src" / "pages" / "AIMentorPro.jsx"
BACK = ROOT / "backend" / "app" / "langgraph_agent.py"

# ---- Frontend fixes ----
text = FRONT.read_text(encoding="utf-8")

# Remove NLP import so frontend does not generate misleading domain/intent wrappers.
text = text.replace("import { analyzeMentorQuestion, scoreMentorAnswer } from './mentorNlp';\n", "")

# Replace fallbackAnswer body with a clean message instead of detected-domain template.
start = text.find("function fallbackAnswer(question")
end = text.find("\nfunction renderInline", start)
if start != -1 and end != -1:
    text = text[:start] + '''function fallbackAnswer(question) {
  const q = String(question || '').toLowerCase();
  const isSalesforce = /salesforce|apex|trigger|lwc|flow|soql|sosl|field|fields|object|record type|page layout|validation rule|profile|permission|sharing|fls|lookup|picklist|formula|report|dashboard|role|permission set/.test(q);
  const isDsa = /dsa|array|string|linked list|stack|queue|tree|graph|binary search|sort|sliding window|two pointer|dynamic programming|recursion|heap|hashmap|leetcode|complexity/.test(q);
  const isSystem = /system design|url shortener|rate limiter|load balancer|cache|redis|database design|microservice|api gateway|notification|chat system|scaling|sharding|replication|capacity/.test(q);
  if (isSalesforce) return `## Salesforce Answer\n\n### Requirement Analysis\nUnderstand the object, field/data need, users, security, automation, reporting and integration impact.\n\n### Configuration / Implementation\nChoose the right Salesforce feature such as field, object, record type, page layout, validation rule, Flow, Apex, LWC or SOQL.\n\n### Security\nConfigure field-level security, profiles, permission sets, page layout visibility, CRUD/FLS and sharing impact.\n\n### Testing\nTest positive, negative, security, user-profile and bulk scenarios. If Apex is impacted, update test classes.\n\n### Interview Answer\nI analyze the requirement, configure the solution securely, test it across profiles and scenarios, and explain the business impact clearly to the client.`;
  if (isDsa) return `## DSA Answer\n\n### Approach\nExplain brute force first, then optimize using the correct pattern.\n\n### Code\nAsk the exact problem statement and language, and I will generate full optimized code.\n\n### Complexity\nAlways include time and space complexity with edge cases.`;
  if (isSystem) return `## System Design Answer\n\n### Structure\nRequirements, APIs, database design, high-level design, scaling, bottlenecks and tradeoffs.`;
  return `## Professional Answer\n\n${question}`;
}
''' + text[end:]

# Remove NLP analysis/state usage and send only raw user question to backend.
text = text.replace("  const [nlpInfo, setNlpInfo] = React.useState(null);\n", "")
text = text.replace("  const [answerScore, setAnswerScore] = React.useState(null);\n", "")
text = text.replace("    const nlp = analyzeMentorQuestion(text);\n", "")
text = text.replace("    setNlpInfo(nlp);\n", "")
text = text.replace("    setAnswerScore(null);\n", "")
text = text.replace("          answer_style: `domain=${nlp.domain}; intent=${nlp.intent}; format=${nlp.format}`,\n          context: { ...collectLocalContext(), originalQuestion: text, nlp }", "          answer_style: 'professional-clean-answer',\n          context: { ...collectLocalContext(), originalQuestion: text }")
text = text.replace("      const finalAnswer = cleanAnswer(data) || fallbackAnswer(text, nlp);", "      const finalAnswer = cleanAnswer(data) || fallbackAnswer(text);")
text = text.replace("      setAnswerScore(scoreMentorAnswer(finalAnswer, nlp.domain, nlp.intent));\n", "")
text = text.replace("      const local = fallbackAnswer(text, nlp);", "      const local = fallbackAnswer(text);")
text = text.replace("      setAnswerScore(scoreMentorAnswer(local, nlp.domain, nlp.intent));\n", "")
text = text.replace("{loading ? 'Thinking with NLP...' : 'Ask Mentor'}", "{loading ? 'Thinking...' : 'Ask Mentor'}")

# Hide any leftover NLP/score UI blocks in a simple way.
text = text.replace("{nlpInfo ? <Card title=\"NLP Mentor Intelligence\" subtitle=\"Question understood before answer generation.\"><div className=\"nlpGrid\"><div><span>Domain</span><b>{nlpInfo.domain}</b></div><div><span>Intent</span><b>{nlpInfo.intent}</b></div><div><span>Confidence</span><b>{nlpInfo.confidence}</b></div><div><span>Next Action</span><b>{nlpInfo.nextAction}</b></div></div>{nlpInfo.weakTopics?.length ? <div className=\"weakPills\">{nlpInfo.weakTopics.map(t => <span key={t}>{t}</span>)}</div> : null}</Card> : null}", "")
text = text.replace("{answerScore ? <div className=\"scoreGrid\"><div><span>Overall</span><b>{answerScore.overall}/10</b></div><div><span>Clarity</span><b>{answerScore.clarity}/10</b></div><div><span>Depth</span><b>{answerScore.depth}/10</b></div><div><span>Interview</span><b>{answerScore.interviewReadiness}/10</b></div></div> : null}", "")
text = text.replace("{ragInfo && <span className=\"pill\">RAG: {ragInfo.salesforce_kb?.length || 0} docs · {ragInfo.saved_context_count || 0} saved · {ragInfo.news_count || 0} news</span>}", "")

FRONT.write_text(text, encoding="utf-8")

# ---- Backend classifier fixes ----
b = BACK.read_text(encoding="utf-8")
b = b.replace('"visualforce", "aura", "data loader", "gearset"', '"visualforce", "aura", "data loader", "gearset", "field", "fields", "object", "record type", "page layout", "field-level security", "fls", "validation rule", "permission set", "lookup", "master-detail", "formula", "picklist", "report", "dashboard"')
BACK.write_text(b, encoding="utf-8")

print("AI Mentor clean response patch applied successfully.")
