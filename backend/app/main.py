from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from email.message import EmailMessage
import hashlib, hmac, json, os, random, re, smtplib, sqlite3, time, urllib.parse, urllib.request
from pathlib import Path

app = FastAPI(title="SFDC Mentor Complete Backend", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).resolve().parent.parent / "mentor_storage.sqlite3"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "240"))
OTP_TTL_SECONDS = int(os.getenv("OTP_TTL_SECONDS", "600"))
APP_SECRET = os.getenv("APP_SECRET", "sfdc-mentor-local-secret-change-me")
LAST_EMAIL_ERROR = ""
LAST_EMAIL_PROVIDER = "none"
LAST_EMAIL_ATTEMPT = "not-attempted"

SALESFORCE_KB = [
    {"title": "Salesforce CRM", "url": "https://www.salesforce.com/crm/", "text": "Salesforce is a cloud-based CRM platform used to manage leads, accounts, contacts, opportunities, cases, automation, analytics and customer relationships."},
    {"title": "Apex Developer Guide", "url": "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/", "text": "Apex is Salesforce's strongly typed server-side language used for business logic, triggers, classes, async processing, integrations and transactional operations."},
    {"title": "Apex Triggers", "url": "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_triggers.htm", "text": "Apex triggers run before or after DML events such as insert, update, delete and undelete. Best practice is one trigger per object with handler pattern, bulkification and recursion control."},
    {"title": "Lightning Web Components", "url": "https://developer.salesforce.com/docs/platform/lwc/overview", "text": "Lightning Web Components are Salesforce's modern web component framework for building fast, reusable and reactive user interfaces using JavaScript, HTML and Apex integration."},
    {"title": "SOQL and SOSL", "url": "https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/", "text": "SOQL retrieves Salesforce records. Developers should write selective queries, use relationship queries carefully and avoid SOQL inside loops because of governor limits."},
    {"title": "Salesforce Flow", "url": "https://help.salesforce.com/s/articleView?id=sf.flow.htm&type=5", "text": "Salesforce Flow automates business processes declaratively. Flow is best for simple to medium automation, while Apex is better for complex, bulk-heavy or integration logic."},
    {"title": "Salesforce Security", "url": "https://developer.salesforce.com/docs/platform/security/guide/", "text": "Salesforce security includes org-wide defaults, roles, profiles, permission sets, sharing rules, CRUD, FLS and record-level access. Developers must respect security in Apex and LWC."},
    {"title": "Apex Testing", "url": "https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_testing.htm", "text": "Apex tests validate business logic, bulk behavior, positive and negative cases and deployment readiness. Salesforce requires minimum 75% org-wide coverage but professional projects target meaningful assertions."},
    {"title": "Integration Patterns", "url": "https://developer.salesforce.com/docs/atlas.en-us.integration_patterns_and_practices.meta/integration_patterns_and_practices/", "text": "Salesforce integrations use REST, SOAP, Platform Events, Named Credentials, OAuth and async patterns to connect external systems securely and reliably."},
    {"title": "Agentforce and Salesforce AI", "url": "https://www.salesforce.com/agentforce/", "text": "Salesforce Agentforce and Einstein features help businesses automate customer service, sales and employee workflows using AI agents and trusted CRM data."},
]

AI_TECH_SOURCES = [
    {"title": "Salesforce Newsroom", "url": "https://www.salesforce.com/news/", "text": "Salesforce newsroom for AI, Agentforce, CRM and enterprise technology updates."},
    {"title": "OpenAI News", "url": "https://openai.com/news/", "text": "OpenAI news and product updates for AI models, developer tools and research."},
    {"title": "Google AI Blog", "url": "https://blog.google/technology/ai/", "text": "Google AI news for Gemini, agents, cloud AI and research updates."},
    {"title": "Microsoft AI Blog", "url": "https://blogs.microsoft.com/ai/", "text": "Microsoft AI news for Copilot, Azure AI, enterprise AI and developer tooling."},
    {"title": "Hacker News AI stories", "url": "https://news.ycombinator.com/", "text": "Developer-focused AI and technology discussions."},
]

def now_ts(): return time.time()
def normalize_email(email: str) -> str: return (email or "").strip().lower()
def clean_text(value: str) -> str: return (value or "").strip()
def clean_app_password(value: str) -> str: return (value or "").replace(" ", "").strip()

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000).hex()
    return f"{salt}${digest}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, digest = stored_hash.split("$", 1)
        check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000).hex()
        return hmac.compare_digest(check, digest)
    except Exception:
        return False

def hash_otp(otp: str) -> str:
    return hmac.new(APP_SECRET.encode(), otp.encode(), hashlib.sha256).hexdigest()

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT,item_key TEXT UNIQUE,item_type TEXT,title TEXT,payload TEXT NOT NULL,created_at REAL,updated_at REAL)""")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_items_key ON items(item_key)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)")
    conn.execute("""CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,mobile TEXT NOT NULL,password_hash TEXT NOT NULL,is_verified INTEGER DEFAULT 0,created_at REAL,updated_at REAL)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS signup_otps (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL,otp_hash TEXT NOT NULL,name TEXT NOT NULL,mobile TEXT NOT NULL,password_hash TEXT NOT NULL,expires_at REAL NOT NULL,attempts INTEGER DEFAULT 0,created_at REAL)""")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON signup_otps(email)")
    conn.execute("""CREATE TABLE IF NOT EXISTS password_reset_otps (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL,otp_hash TEXT NOT NULL,expires_at REAL NOT NULL,attempts INTEGER DEFAULT 0,created_at REAL)""")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email)")
    conn.commit()
    return conn

def normalize_payload(item: Dict[str, Any]):
    now = now_ts()
    item_key = str(item.get("key") or item.get("storageKey") or item.get("id") or item.get("name") or f"item-{int(now*1000)}")
    item_type = str(item.get("type") or item.get("category") or item.get("module") or "frontend-store")
    title = str(item.get("title") or item.get("label") or item.get("name") or item_key)[:250]
    payload_obj = item.get("data") if "data" in item and len(item.keys()) <= 5 else item
    return item_key, item_type, title, json.dumps(payload_obj, ensure_ascii=False), now

def upsert_item(conn, item: Dict[str, Any]):
    item_key, item_type, title, payload, now = normalize_payload(item)
    existing = conn.execute("SELECT id FROM items WHERE item_key=?", (item_key,)).fetchone()
    if existing:
        conn.execute("UPDATE items SET item_type=?, title=?, payload=?, updated_at=? WHERE item_key=?", (item_type, title, payload, now, item_key))
        return existing["id"], item_key, item_type
    cur = conn.execute("INSERT INTO items(item_key,item_type,title,payload,created_at,updated_at) VALUES(?,?,?,?,?,?)", (item_key, item_type, title, payload, now, now))
    return cur.lastrowid, item_key, item_type

class SignupOtpRequest(BaseModel):
    name: str
    email: str
    mobile: str
    password: str
class VerifySignupRequest(BaseModel):
    email: str
    otp: str
class LoginRequest(BaseModel):
    email: str
    password: str
class ForgotPasswordRequest(BaseModel):
    email: str
class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str
class MentorRequest(BaseModel):
    question: str
    mode: Optional[str] = "ollama"
    context: Optional[Dict[str, Any]] = None
    use_web: Optional[bool] = True
    answer_style: Optional[str] = "professional"
class SyncRequest(BaseModel):
    items: Dict[str, Any]
    source: Optional[str] = "frontend-sync"
class RestoreRequest(BaseModel):
    items: Dict[str, Any]

# ---------- Email/Auth helpers ----------
def validate_signup(req: SignupOtpRequest):
    name, email, mobile, password = clean_text(req.name), normalize_email(req.email), clean_text(req.mobile), req.password or ""
    if not name: raise HTTPException(status_code=400, detail="Name is mandatory.")
    if not email or "@" not in email or "." not in email.split("@")[-1]: raise HTTPException(status_code=400, detail="Valid email is mandatory.")
    if not mobile or len("".join(ch for ch in mobile if ch.isdigit())) < 10: raise HTTPException(status_code=400, detail="Valid mobile number is mandatory.")
    if len(password) < 6: raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    return name, email, mobile, password

def build_otp_email(name: str, otp: str, purpose: str):
    subject = "Your Career OS signup OTP" if purpose == "signup" else "Your Career OS password reset OTP"
    if purpose == "smtp test": subject = "Career OS SMTP test email"
    action = "signup" if purpose == "signup" else "password reset" if purpose == "password reset" else "SMTP test"
    text = f"Hi {name or 'there'},\n\nYour Career OS {action} OTP is: {otp}\n\nThis OTP is valid for {OTP_TTL_SECONDS // 60} minutes. Do not share it with anyone.\n\nRegards,\nCareer OS Mentor"
    html = f"<p>Hi {name or 'there'},</p><p>Your Career OS {action} OTP is:</p><h2>{otp}</h2><p>This OTP is valid for {OTP_TTL_SECONDS // 60} minutes. Do not share it with anyone.</p><p>Regards,<br/>Career OS Mentor</p>"
    return subject, text, html

def send_resend_email(to_email: str, name: str, otp: str, purpose: str) -> bool:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    if not api_key: return False
    mail_from = os.getenv("MAIL_FROM", "onboarding@resend.dev").strip() or "onboarding@resend.dev"
    subject, text, html = build_otp_email(name, otp, purpose)
    payload = json.dumps({"from": mail_from, "to": [to_email], "subject": subject, "html": html, "text": text}).encode()
    req = urllib.request.Request("https://api.resend.com/emails", data=payload, headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=25) as resp:
        return 200 <= resp.status < 300

def send_message_smtp(host: str, port: int, user: str, password: str, msg: EmailMessage):
    if port == 465:
        with smtplib.SMTP_SSL(host, 465, timeout=25) as server:
            server.login(user, password); server.send_message(msg)
        return
    with smtplib.SMTP(host, port, timeout=25) as server:
        server.ehlo(); server.starttls(); server.ehlo(); server.login(user, password); server.send_message(msg)

def send_smtp_email(to_email: str, name: str, otp: str, purpose: str) -> bool:
    global LAST_EMAIL_ATTEMPT
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip() or "smtp.gmail.com"
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = clean_app_password(os.getenv("SMTP_PASSWORD", ""))
    smtp_port = int(os.getenv("SMTP_PORT", "587") or "587")
    mail_from = os.getenv("MAIL_FROM", smtp_user or "no-reply@sfdcmentor.local").strip()
    if not smtp_user or not smtp_password: raise RuntimeError("SMTP not configured: SMTP_USER or SMTP_PASSWORD missing")
    subject, text, _ = build_otp_email(name, otp, purpose)
    msg = EmailMessage(); msg["Subject"] = subject; msg["From"] = mail_from; msg["To"] = to_email; msg.set_content(text)
    attempts = [(smtp_host, smtp_port)]
    if smtp_host == "smtp.gmail.com" and smtp_port != 465: attempts.append((smtp_host, 465))
    errors = []
    for host, port in attempts:
        LAST_EMAIL_ATTEMPT = f"smtp {host}:{port}"
        try:
            send_message_smtp(host, port, smtp_user, smtp_password, msg)
            LAST_EMAIL_ATTEMPT = f"smtp {host}:{port} success"
            return True
        except Exception as exc:
            errors.append(f"{host}:{port} {type(exc).__name__}: {exc}")
    raise RuntimeError(" | ".join(errors))

def send_otp_email(email: str, name: str, otp: str, purpose: str = "signup") -> bool:
    global LAST_EMAIL_ERROR, LAST_EMAIL_PROVIDER, LAST_EMAIL_ATTEMPT
    LAST_EMAIL_ERROR = ""; LAST_EMAIL_ATTEMPT = f"email requested for {email}"
    try:
        if os.getenv("RESEND_API_KEY", "").strip():
            LAST_EMAIL_PROVIDER = "resend"; LAST_EMAIL_ATTEMPT = "resend api"
            if send_resend_email(email, name, otp, purpose):
                LAST_EMAIL_ERROR = ""; LAST_EMAIL_ATTEMPT = "resend success"; return True
    except Exception as exc:
        LAST_EMAIL_ERROR = f"Resend {type(exc).__name__}: {exc}"; print(f"[RESEND ERROR] {LAST_EMAIL_ERROR}")
    try:
        LAST_EMAIL_PROVIDER = "smtp"
        if send_smtp_email(email, name, otp, purpose):
            LAST_EMAIL_ERROR = ""; return True
    except Exception as exc:
        LAST_EMAIL_ERROR = f"SMTP {type(exc).__name__}: {exc}"; print(f"[SMTP ERROR] {LAST_EMAIL_ERROR}")
    print(f"[OTP NOT EXPOSED IN API] {purpose.upper()} OTP generated for {email}")
    return False

# ---------- AI Mentor Pro v3 helpers ----------
def tokenize(text: str) -> List[str]:
    return [t for t in re.sub(r"[^a-zA-Z0-9]+", " ", (text or "").lower()).split() if len(t) > 2]

def score_doc(query: str, doc: Dict[str, str]) -> int:
    q = set(tokenize(query)); body = set(tokenize((doc.get("title", "") + " " + doc.get("text", ""))))
    return len(q & body)

def retrieve_salesforce_kb(query: str, top_k: int = 5) -> List[Dict[str, str]]:
    ranked = sorted(SALESFORCE_KB, key=lambda d: score_doc(query, d), reverse=True)
    return [d for d in ranked[:top_k] if score_doc(query, d) > 0] or ranked[:3]

def collect_saved_context(query: str, limit: int = 12) -> List[Dict[str, Any]]:
    conn = db()
    rows = conn.execute("SELECT item_key,item_type,title,payload,updated_at FROM items ORDER BY updated_at DESC LIMIT 200").fetchall()
    conn.close()
    docs = []
    for r in rows:
        raw = r["payload"] or ""
        try: payload = json.loads(raw)
        except Exception: payload = raw
        text = json.dumps(payload, ensure_ascii=False) if not isinstance(payload, str) else payload
        docs.append({"key": r["item_key"], "type": r["item_type"], "title": r["title"], "text": text[:1200], "updated_at": r["updated_at"]})
    ranked = sorted(docs, key=lambda d: score_doc(query, {"title": d["title"], "text": d["text"]}), reverse=True)
    return ranked[:limit]

def search_news_live(query: str = "AI technology Salesforce", limit: int = 5) -> List[Dict[str, str]]:
    results = []
    try:
        q = urllib.parse.quote(query)
        url = f"https://hn.algolia.com/api/v1/search_by_date?query={q}&tags=story&hitsPerPage={limit}"
        with urllib.request.urlopen(url, timeout=12) as resp:
            data = json.loads(resp.read().decode())
        for hit in data.get("hits", [])[:limit]:
            title = hit.get("title") or hit.get("story_title") or "AI technology story"
            link = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
            results.append({"title": title, "url": link, "text": f"Recent developer/technology story: {title}"})
    except Exception:
        pass
    if not results:
        results = AI_TECH_SOURCES[:limit]
    return results

def wants_news(question: str) -> bool:
    q = question.lower()
    return any(w in q for w in ["latest", "news", "trend", "current", "recent", "update", "technology", "ai news"])

def build_sources(kb: List[Dict[str, str]], news: List[Dict[str, str]]) -> List[Dict[str, str]]:
    sources = []
    seen = set()
    for item in kb + news:
        url = item.get("url", "")
        if url and url not in seen:
            sources.append({"title": item.get("title", "Source"), "url": url})
            seen.add(url)
    return sources[:10]

def professional_fallback(question: str, kb: List[Dict[str, str]], news: List[Dict[str, str]]) -> str:
    q = question.strip()
    context_line = kb[0]["text"] if kb else "Use Salesforce developer best practices, project examples and interview structure."
    if wants_news(q):
        bullets = "\n".join([f"- {n['title']}" for n in news[:5]])
        return f"Latest AI/Technology Mentor Brief\n\n{bullets}\n\nHow to use this for your Salesforce career:\n1. Learn AI agents, RAG and automation because Salesforce projects are moving toward Agentforce-style workflows.\n2. Practice Apex, LWC, Flow and integration basics because AI tools still need strong implementation knowledge.\n3. Build one portfolio feature: AI Mentor + RAG + source links.\n4. Prepare interview points around business impact, automation, security and scalability."
    return f"Direct Answer\n{context_line}\n\nProfessional Salesforce Explanation\n{q} should be explained with definition, real project use case, implementation approach, security/testing and business impact.\n\nInterview-ready Answer\nIn a Salesforce project, I first understand the requirement, identify the objects and security impact, choose the right tool such as Flow, Apex, LWC, SOQL or Integration, build a reusable solution, test positive/negative/bulk scenarios and deploy safely.\n\nNext Action\nCreate one saved interview answer and connect it with your Doctor Patient Management System project."

def build_mentor_prompt(question: str, app_context: Dict[str, Any], saved: List[Dict[str, Any]], kb: List[Dict[str, str]], news: List[Dict[str, str]], style: str) -> str:
    saved_text = "\n".join([f"- {d['title']} ({d['type']}): {d['text'][:500]}" for d in saved[:8]]) or "No saved personal data found yet."
    kb_text = "\n".join([f"- {d['title']}: {d['text']}" for d in kb])
    news_text = "\n".join([f"- {d['title']}: {d.get('text','')} ({d.get('url','')})" for d in news]) or "No live news requested."
    return f"""You are Abhishek's AI Mentor Pro v3 for Salesforce Developer career preparation.
Answer the exact question. Do not give repeated generic template.
Use the user's saved data when relevant. Use Salesforce RAG knowledge. If news/trends are asked, use the provided latest technology/news context.
Keep answer professional, clear and interview-ready.

Style: {style}
User/App context JSON:
{json.dumps(app_context or {}, ensure_ascii=False)[:3000]}

Personal RAG from saved app/backend data:
{saved_text}

Salesforce Knowledge Base RAG:
{kb_text}

AI/Technology News Context:
{news_text}

Question:
{question}

Return answer with useful headings only. Include sources only if they are provided. No fake claims."""

def ask_ollama(prompt: str) -> str:
    payload = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "options": {"temperature": 0.25, "top_p": 0.9}}).encode()
    request = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/generate", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=OLLAMA_TIMEOUT) as resp:
        data = json.loads(resp.read().decode())
    return (data.get("response") or "").strip()

# ---------- Routes ----------
@app.get("/")
def root(): return {"status": "running", "app": "SFDC Mentor Complete Backend", "docs": "/docs", "sqlite_db": str(DB_PATH)}
@app.get("/api/health")
def health(): return {"ok": True, "service": "mentor-backend", "mode": "sqlite + auth otp + password reset + ai mentor pro v3 + ollama + rag + news + sources", "version": "3.0.0", "sqlite_db": str(DB_PATH), "ollama_base_url": OLLAMA_BASE_URL, "ollama_model": OLLAMA_MODEL, "ollama_timeout_seconds": OLLAMA_TIMEOUT}
@app.get("/api/cors-test")
def cors_test(): return {"ok": True, "message": "CORS is open for local development and GitHub Pages.", "allowed_origins": ["*"]}
@app.get("/api/debug/smtp")
def debug_smtp():
    return {"ok": True, "resend_api_key": bool(os.getenv("RESEND_API_KEY", "").strip()), "smtp_host": bool(os.getenv("SMTP_HOST", "smtp.gmail.com").strip()), "smtp_port": os.getenv("SMTP_PORT", "587"), "smtp_user": bool(os.getenv("SMTP_USER", "").strip()), "smtp_password": bool(clean_app_password(os.getenv("SMTP_PASSWORD", ""))), "smtp_password_length": len(clean_app_password(os.getenv("SMTP_PASSWORD", ""))), "mail_from": os.getenv("MAIL_FROM", ""), "last_email_provider": LAST_EMAIL_PROVIDER, "last_email_attempt": LAST_EMAIL_ATTEMPT, "last_email_error": LAST_EMAIL_ERROR}
@app.get("/api/debug/send-test-email")
def debug_send_test_email(to: Optional[str] = None):
    target = normalize_email(to or os.getenv("SMTP_USER", ""))
    if not target: raise HTTPException(status_code=400, detail="No target email. Add ?to=email@example.com or set SMTP_USER.")
    sent = send_otp_email(target, "Abhishek", "000000", "smtp test")
    return {"ok": sent, "target": target, "provider": LAST_EMAIL_PROVIDER, "attempt": LAST_EMAIL_ATTEMPT, "error": LAST_EMAIL_ERROR}

@app.post("/api/auth/request-signup-otp")
def request_signup_otp(req: SignupOtpRequest):
    name, email, mobile, password = validate_signup(req)
    conn = db(); existing = conn.execute("SELECT id, is_verified FROM users WHERE email=?", (email,)).fetchone()
    if existing and int(existing["is_verified"] or 0) == 1:
        conn.close(); raise HTTPException(status_code=409, detail="This email is already registered. Please login.")
    otp = f"{random.randint(100000, 999999)}"; expires_at = now_ts() + OTP_TTL_SECONDS
    conn.execute("DELETE FROM signup_otps WHERE email=?", (email,))
    conn.execute("INSERT INTO signup_otps(email,otp_hash,name,mobile,password_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?,?,0,?)", (email, hash_otp(otp), name, mobile, hash_password(password), expires_at, now_ts()))
    conn.commit(); conn.close(); sent = send_otp_email(email, name, otp, "signup")
    return {"ok": True, "message": "OTP sent to your email. Verify OTP to complete signup." if sent else "OTP generated, but email delivery failed. Check email provider settings.", "email": email, "expires_in_seconds": OTP_TTL_SECONDS, "email_sent": sent, "email_provider": LAST_EMAIL_PROVIDER}

@app.post("/api/auth/verify-signup-otp")
def verify_signup_otp(req: VerifySignupRequest):
    email, otp = normalize_email(req.email), clean_text(req.otp)
    if not email or not otp: raise HTTPException(status_code=400, detail="Email and OTP are mandatory.")
    conn = db(); row = conn.execute("SELECT * FROM signup_otps WHERE email=? ORDER BY created_at DESC LIMIT 1", (email,)).fetchone()
    if not row: conn.close(); raise HTTPException(status_code=400, detail="OTP not found. Please request a new OTP.")
    if now_ts() > float(row["expires_at"]): conn.execute("DELETE FROM signup_otps WHERE email=?", (email,)); conn.commit(); conn.close(); raise HTTPException(status_code=400, detail="OTP expired. Please request a new OTP.")
    if int(row["attempts"] or 0) >= 5: conn.close(); raise HTTPException(status_code=429, detail="Too many wrong attempts. Please request a new OTP.")
    if not hmac.compare_digest(hash_otp(otp), row["otp_hash"]): conn.execute("UPDATE signup_otps SET attempts=attempts+1 WHERE id=?", (row["id"],)); conn.commit(); conn.close(); raise HTTPException(status_code=400, detail="Invalid OTP.")
    now = now_ts(); existing = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if existing: conn.execute("UPDATE users SET name=?, mobile=?, password_hash=?, is_verified=1, updated_at=? WHERE email=?", (row["name"], row["mobile"], row["password_hash"], now, email))
    else: conn.execute("INSERT INTO users(name,email,mobile,password_hash,is_verified,created_at,updated_at) VALUES(?,?,?,?,1,?,?)", (row["name"], email, row["mobile"], row["password_hash"], now, now))
    conn.execute("DELETE FROM signup_otps WHERE email=?", (email,)); conn.commit(); conn.close()
    return {"ok": True, "message": "Email verified. Signup completed.", "user": {"name": row["name"], "email": email, "mobile": row["mobile"], "type": "user", "verified": True}}

@app.post("/api/auth/login")
def auth_login(req: LoginRequest):
    email, password = normalize_email(req.email), req.password or ""
    if not email or not password: raise HTTPException(status_code=400, detail="Email and password are mandatory.")
    conn = db(); row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone(); conn.close()
    if not row or not verify_password(password, row["password_hash"]): raise HTTPException(status_code=401, detail="Invalid email or password.")
    if int(row["is_verified"] or 0) != 1: raise HTTPException(status_code=403, detail="Please verify your email before login.")
    return {"ok": True, "message": "Login successful.", "user": {"name": row["name"], "email": row["email"], "mobile": row["mobile"], "type": "user", "verified": True}}

@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    email = normalize_email(req.email)
    if not email: raise HTTPException(status_code=400, detail="Email is mandatory.")
    conn = db(); user = conn.execute("SELECT name, email, is_verified FROM users WHERE email=?", (email,)).fetchone()
    if not user or int(user["is_verified"] or 0) != 1: conn.close(); raise HTTPException(status_code=404, detail="No verified account found with this email.")
    otp = f"{random.randint(100000, 999999)}"; expires_at = now_ts() + OTP_TTL_SECONDS
    conn.execute("DELETE FROM password_reset_otps WHERE email=?", (email,))
    conn.execute("INSERT INTO password_reset_otps(email,otp_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?)", (email, hash_otp(otp), expires_at, 0, now_ts()))
    conn.commit(); conn.close(); sent = send_otp_email(email, user["name"], otp, "password reset")
    return {"ok": True, "message": "Password reset OTP sent to your email." if sent else "Reset OTP generated, but email delivery failed. Check email provider settings.", "email": email, "expires_in_seconds": OTP_TTL_SECONDS, "email_sent": sent, "email_provider": LAST_EMAIL_PROVIDER}

@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    email, otp, new_password = normalize_email(req.email), clean_text(req.otp), req.new_password or ""
    if not email or not otp or not new_password: raise HTTPException(status_code=400, detail="Email, OTP and new password are mandatory.")
    if len(new_password) < 6: raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    conn = db(); row = conn.execute("SELECT * FROM password_reset_otps WHERE email=? ORDER BY created_at DESC LIMIT 1", (email,)).fetchone()
    if not row: conn.close(); raise HTTPException(status_code=400, detail="Reset OTP not found. Please request a new OTP.")
    if now_ts() > float(row["expires_at"]): conn.execute("DELETE FROM password_reset_otps WHERE email=?", (email,)); conn.commit(); conn.close(); raise HTTPException(status_code=400, detail="Reset OTP expired. Please request a new OTP.")
    if int(row["attempts"] or 0) >= 5: conn.close(); raise HTTPException(status_code=429, detail="Too many wrong attempts. Please request a new OTP.")
    if not hmac.compare_digest(hash_otp(otp), row["otp_hash"]): conn.execute("UPDATE password_reset_otps SET attempts=attempts+1 WHERE id=?", (row["id"],)); conn.commit(); conn.close(); raise HTTPException(status_code=400, detail="Invalid reset OTP.")
    user = conn.execute("SELECT id, name, email, mobile FROM users WHERE email=? AND is_verified=1", (email,)).fetchone()
    if not user: conn.close(); raise HTTPException(status_code=404, detail="No verified account found with this email.")
    conn.execute("UPDATE users SET password_hash=?, updated_at=? WHERE email=?", (hash_password(new_password), now_ts(), email)); conn.execute("DELETE FROM password_reset_otps WHERE email=?", (email,)); conn.commit(); conn.close()
    return {"ok": True, "message": "Password reset successful. You can login with your new password.", "user": {"name": user["name"], "email": user["email"], "mobile": user["mobile"], "type": "user", "verified": True}}

@app.post("/api/items")
def save_item(item: Dict[str, Any]):
    conn = db(); row_id, item_key, item_type = upsert_item(conn, item); conn.commit(); conn.close()
    return {"ok": True, "id": row_id, "key": item_key, "type": item_type, "sqlite_db": str(DB_PATH)}
@app.get("/api/items")
def list_items(key: Optional[str] = None, type: Optional[str] = None, limit: int = 100):
    conn = db(); sql = "SELECT * FROM items WHERE 1=1"; params: List[Any] = []
    if key: sql += " AND item_key=?"; params.append(key)
    if type: sql += " AND item_type=?"; params.append(type)
    sql += " ORDER BY updated_at DESC LIMIT ?"; params.append(max(1, min(limit, 500)))
    rows = conn.execute(sql, params).fetchall(); conn.close(); out = []
    for r in rows:
        try: payload = json.loads(r["payload"])
        except Exception: payload = r["payload"]
        out.append({"id": r["id"], "key": r["item_key"], "type": r["item_type"], "title": r["title"], "payload": payload, "updated_at": r["updated_at"]})
    return {"ok": True, "items": out, "sqlite_db": str(DB_PATH)}
@app.delete("/api/items/{key}")
def delete_item(key: str):
    conn = db(); conn.execute("DELETE FROM items WHERE item_key=?", (key,)); conn.commit(); conn.close(); return {"ok": True, "deleted_key": key}
@app.post("/api/sync-localstorage")
def sync_localstorage(req: SyncRequest):
    conn = db(); count = 0
    for key, value in req.items.items(): upsert_item(conn, {"key": key, "type": req.source or "frontend-sync", "title": key, "data": value}); count += 1
    conn.commit(); conn.close(); return {"ok": True, "synced": count, "sqlite_db": str(DB_PATH)}
@app.post("/api/restore-localstorage")
def restore_localstorage(req: RestoreRequest):
    conn = db(); count = 0
    for key, value in req.items.items(): upsert_item(conn, {"key": key, "type": "restore", "title": key, "data": value}); count += 1
    conn.commit(); conn.close(); return {"ok": True, "restored": count, "sqlite_db": str(DB_PATH)}

@app.get("/api/ollama-status")
def ollama_status():
    try:
        with urllib.request.urlopen(f"{OLLAMA_BASE_URL}/api/tags", timeout=5) as resp: data = json.loads(resp.read().decode())
        models = [m.get("name") for m in data.get("models", [])]
        return {"ok": True, "base_url": OLLAMA_BASE_URL, "models": models, "model_available": OLLAMA_MODEL in models}
    except Exception as exc:
        return {"ok": False, "base_url": OLLAMA_BASE_URL, "error": str(exc), "model_available": False}

@app.get("/api/rag/search")
def rag_search(q: str, limit: int = 5):
    kb = retrieve_salesforce_kb(q, limit)
    saved = collect_saved_context(q, min(limit, 10))
    return {"ok": True, "query": q, "salesforce_kb": kb, "saved_context": saved}

@app.get("/api/ai-news")
def ai_news(q: Optional[str] = None):
    query = q or "AI technology Salesforce Agentforce OpenAI Google developer tools"
    news = search_news_live(query, 8)
    return {"ok": True, "query": query, "items": news, "sources": build_sources([], news)}

@app.post("/api/mentor")
def mentor(req: MentorRequest):
    question = clean_text(req.question)
    if not question: raise HTTPException(status_code=400, detail="Question is required")
    app_context = req.context or {}
    # frontend may send originalQuestion to avoid prompting on prompt-wrapper text
    original_question = clean_text(str(app_context.get("originalQuestion") or question))
    kb = retrieve_salesforce_kb(original_question, 5)
    saved = collect_saved_context(original_question, 12)
    news = search_news_live(original_question if wants_news(original_question) else "AI technology Salesforce developer tools", 6) if req.use_web or wants_news(original_question) else []
    sources = build_sources(kb, news if wants_news(original_question) else [])
    prompt = build_mentor_prompt(original_question, app_context, saved, kb, news if wants_news(original_question) else [], req.answer_style or "professional")
    if (req.mode or "ollama").lower() == "ollama":
        try:
            answer = ask_ollama(prompt)
            if answer:
                return {"ok": True, "source": "ollama-rag-v3", "answer": answer, "sources": sources, "rag": {"salesforce_kb": kb, "saved_context_count": len(saved), "news_count": len(news)}}
        except Exception as exc:
            fallback = professional_fallback(original_question, kb, news)
            return {"ok": True, "source": "rag-fallback", "answer": fallback, "sources": sources, "ollama_error": str(exc), "rag": {"salesforce_kb": kb, "saved_context_count": len(saved), "news_count": len(news)}}
    fallback = professional_fallback(original_question, kb, news)
    return {"ok": True, "source": "rag-fallback", "answer": fallback, "sources": sources, "rag": {"salesforce_kb": kb, "saved_context_count": len(saved), "news_count": len(news)}}
