from pathlib import Path

ROOT = Path(__file__).resolve().parent
main_path = ROOT / "app" / "main.py"
text = main_path.read_text(encoding="utf-8")

# Make Ollama faster by limiting generation length and reducing sampling overhead.
old = 'payload = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "options": {"temperature": 0.25, "top_p": 0.9}}).encode()'
new = 'payload = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "options": {"temperature": 0.2, "top_p": 0.85, "num_predict": 900, "num_ctx": 4096}}).encode()'
text = text.replace(old, new)

# Reduce news timeout so normal answers do not wait too long.
text = text.replace('with urllib.request.urlopen(url, timeout=12) as resp:', 'with urllib.request.urlopen(url, timeout=5) as resp:')

# Reduce heavy context sizes in mentor endpoint.
text = text.replace('kb = retrieve_salesforce_kb(original_question, 5)', 'kb = retrieve_salesforce_kb(original_question, 4)')
text = text.replace('saved = collect_saved_context(original_question, 12)', 'saved = collect_saved_context(original_question, 5)')
text = text.replace('search_news_live(original_question if wants_news(original_question) else "AI technology Salesforce developer tools", 6)', 'search_news_live(original_question if wants_news(original_question) else "AI technology Salesforce developer tools", 4)')
text = text.replace('if req.use_web or wants_news(original_question) else []', 'if wants_news(original_question) else []')

# Limit prompt context used by the old prompt builder.
text = text.replace('saved[:8]', 'saved[:4]')
text = text.replace("d['text'][:500]", "d['text'][:350]")
text = text.replace('json.dumps(app_context or {}, ensure_ascii=False)[:3000]', 'json.dumps(app_context or {}, ensure_ascii=False)[:1200]')

# Health version update.
text = text.replace('"version": "3.0.0"', '"version": "3.1.1-fast"')
text = text.replace('"version": "3.1.0-elite"', '"version": "3.1.1-fast"')

main_path.write_text(text, encoding="utf-8")
print("✅ AI Mentor fast response patch applied.")
print("Restart backend: uvicorn app.main:app --reload")
