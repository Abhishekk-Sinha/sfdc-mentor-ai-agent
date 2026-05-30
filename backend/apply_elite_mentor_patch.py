from pathlib import Path

ROOT = Path(__file__).resolve().parent
main_path = ROOT / "app" / "main.py"
text = main_path.read_text(encoding="utf-8")

import_line = "from app.mentor_elite_prompt import build_elite_prompt\n"
if import_line not in text:
    text = text.replace("from pathlib import Path\n", "from pathlib import Path\n" + import_line)

old_prompt = 'prompt = build_mentor_prompt(original_question, app_context, saved, kb, news if wants_news(original_question) else [], req.answer_style or "professional")'
new_prompt = '''personal_context = "\\n".join([f"- {d['title']} ({d['type']}): {d['text'][:700]}" for d in saved[:10]])
    rag_context = "\\n".join([f"- {d['title']}: {d['text']} Source: {d.get('url','')}" for d in kb])
    news_context = "\\n".join([f"- {d['title']}: {d.get('text','')} Source: {d.get('url','')}" for d in (news if wants_news(original_question) else [])])
    prompt = build_elite_prompt(original_question, req.answer_style or "professional deep detailed", personal_context, rag_context, news_context)'''

if old_prompt in text:
    text = text.replace(old_prompt, new_prompt)
else:
    print("Elite prompt line was already patched or main.py changed. No prompt replacement done.")

text = text.replace('"version": "3.0.0"', '"version": "3.1.0-elite"')
text = text.replace('"source": "ollama-rag-v3"', '"source": "elite-mentor-ollama"')
text = text.replace('"source": "rag-fallback"', '"source": "elite-mentor-fallback"')

main_path.write_text(text, encoding="utf-8")
print("✅ Elite Mentor prompt connected to backend/app/main.py")
print("Next: restart backend with uvicorn app.main:app --reload")
