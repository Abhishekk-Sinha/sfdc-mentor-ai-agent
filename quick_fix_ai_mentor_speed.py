from pathlib import Path

p = Path(__file__).resolve().parent / "backend" / "app" / "langgraph_agent.py"
s = p.read_text(encoding="utf-8")

# Keep the same endpoint, but stop expensive graph orchestration for local llama3.2:3b.
s = s.replace("LANGGRAPH_AVAILABLE = True", "LANGGRAPH_AVAILABLE = False")

# Reduce context size so llama3.2:3b gives cleaner answers faster.
s = s.replace('state["kb"] = retrieve_kb(state["question"], 8)', 'state["kb"] = retrieve_kb(state["question"], 4)')
s = s.replace('state["saved"] = collect_saved(state["question"], 8)', 'state["saved"] = []')
s = s.replace('for x in kb[:8]', 'for x in kb[:4]')
s = s.replace('for x in saved[:6]', 'for x in saved[:2]')
s = s.replace('for x in news[:6]', 'for x in news[:3]')

# Add more Salesforce keywords if missing.
s = s.replace('"visualforce", "aura", "data loader", "gearset"', '"visualforce", "aura", "data loader", "gearset", "field", "fields", "object", "record type", "page layout", "fls", "validation rule", "permission set", "lookup", "picklist", "formula", "report", "dashboard"')

p.write_text(s, encoding="utf-8")
print("AI Mentor quick speed/quality fix applied.")
