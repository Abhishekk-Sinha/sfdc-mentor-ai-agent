from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from email.message import EmailMessage
import hashlib
import hmac
import json
import os
import random
import smtplib
import sqlite3
import time
import urllib.parse
import urllib.request
from pathlib import Path

app = FastAPI(title="SFDC Mentor Complete Backend", version="2.7.1")
ALLOWED_ORIGINS = [
    "https://abhishekk-sinha.github.io",
    "https://abhishekk-sinha.github.io/sfdc-mentor-ai-agent",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
extra_origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + extra_origins,
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


def now_ts() -> float:
    return time.time()


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def clean_text(value: str) -> str:
    return (value or "").strip()


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, digest = stored_hash.split("$", 1)
        check = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000).hex()
        return hmac.compare_digest(check, digest)
    except Exception:
        return False


def hash_otp(otp: str) -> str:
    return hmac.new(APP_SECRET.encode("utf-8"), otp.encode("utf-8"), hashlib.sha256).hexdigest()


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_key TEXT UNIQUE,
            item_type TEXT,
            title TEXT,
            payload TEXT NOT NULL,
            created_at REAL,
            updated_at REAL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_items_key ON items(item_key)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            mobile TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            is_verified INTEGER DEFAULT 0,
            created_at REAL,
            updated_at REAL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS signup_otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            mobile TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            expires_at REAL NOT NULL,
            attempts INTEGER DEFAULT 0,
            created_at REAL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_signup_otps_email ON signup_otps(email)")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp_hash TEXT NOT NULL,
            expires_at REAL NOT NULL,
            attempts INTEGER DEFAULT 0,
            created_at REAL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email)")
    conn.commit()
    return conn


def normalize_payload(item: Dict[str, Any]):
    now = now_ts()
    item_key = str(item.get("key") or item.get("storageKey") or item.get("id") or item.get("name") or f"item-{int(now*1000)}")
    item_type = str(item.get("type") or item.get("category") or item.get("module") or "frontend-store")
    title = str(item.get("title") or item.get("label") or item.get("name") or item_key)[:250]
    payload_obj = item.get("data") if "data" in item and len(item.keys()) <= 5 else item
    payload = json.dumps(payload_obj, ensure_ascii=False)
    return item_key, item_type, title, payload, now


def upsert_item(conn, item: Dict[str, Any]):
    item_key, item_type, title, payload, now = normalize_payload(item)
    existing = conn.execute("SELECT id FROM items WHERE item_key=?", (item_key,)).fetchone()
    if existing:
        conn.execute("UPDATE items SET item_type=?, title=?, payload=?, updated_at=? WHERE item_key=?", (item_type, title, payload, now, item_key))
        return existing["id"], item_key, item_type
    cur = conn.execute("INSERT INTO items(item_key,item_type,title,payload,created_at,updated_at) VALUES(?,?,?,?,?,?)", (item_key, item_type, title, payload, now, now))
    return cur.lastrowid, item_key, item_type


class MentorRequest(BaseModel):
    question: str
    mode: Optional[str] = "local"
    context: Optional[Dict[str, Any]] = None


class ReviewRequest(BaseModel):
    category: str
    question: str
    answer: str


class SearchRequest(BaseModel):
    query: str = ""
    limit: int = 20


class SyncRequest(BaseModel):
    items: Dict[str, Any]
    source: Optional[str] = "frontend-sync"


class RestoreRequest(BaseModel):
    items: Dict[str, Any]


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


def validate_signup(req: SignupOtpRequest):
    name = clean_text(req.name)
    email = normalize_email(req.email)
    mobile = clean_text(req.mobile)
    password = req.password or ""
    if not name:
        raise HTTPException(status_code=400, detail="Name is mandatory.")
    if not email or "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Valid email is mandatory.")
    if not mobile or len("".join(ch for ch in mobile if ch.isdigit())) < 10:
        raise HTTPException(status_code=400, detail="Valid mobile number is mandatory.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    return name, email, mobile, password


def send_otp_email(email: str, name: str, otp: str, purpose: str = "signup") -> bool:
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    mail_from = os.getenv("MAIL_FROM", smtp_user or "no-reply@sfdcmentor.local").strip()
    if not smtp_host or not smtp_user or not smtp_password:
        print(f"[DEV {purpose.upper()} OTP] {email} -> {otp}")
        return False

    subject = "Your SFDC Mentor signup OTP" if purpose == "signup" else "Your SFDC Mentor password reset OTP"
    action = "signup" if purpose == "signup" else "password reset"
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = email
    msg.set_content(f"""Hi {name or 'there'},

Your SFDC Mentor Career OS {action} OTP is: {otp}

This OTP is valid for {OTP_TTL_SECONDS // 60} minutes.
Do not share it with anyone.

Regards,
SFDC Mentor Career OS
""")
    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
    return True


@app.get("/")
def root():
    return {"status": "running", "app": "SFDC Mentor Complete Backend", "docs": "/docs", "sqlite_db": str(DB_PATH)}


@app.get("/api/health")
def health():
    return {"ok": True, "service": "mentor-backend", "mode": "free local + sqlite + auth otp + password reset + ollama + search-links", "version": "2.7.1", "sqlite_db": str(DB_PATH), "ollama_base_url": OLLAMA_BASE_URL, "ollama_model": OLLAMA_MODEL, "ollama_timeout_seconds": OLLAMA_TIMEOUT}


@app.get("/api/cors-test")
def cors_test():
    return {"ok": True, "message": "CORS is configured for GitHub Pages and localhost.", "allowed_origins": ALLOWED_ORIGINS}


@app.post("/api/auth/request-signup-otp")
def request_signup_otp(req: SignupOtpRequest):
    name, email, mobile, password = validate_signup(req)
    conn = db()
    existing = conn.execute("SELECT id, is_verified FROM users WHERE email=?", (email,)).fetchone()
    if existing and int(existing["is_verified"] or 0) == 1:
        conn.close()
        raise HTTPException(status_code=409, detail="This email is already registered. Please login.")
    otp = f"{random.randint(100000, 999999)}"
    expires_at = now_ts() + OTP_TTL_SECONDS
    conn.execute("DELETE FROM signup_otps WHERE email=?", (email,))
    conn.execute("INSERT INTO signup_otps(email,otp_hash,name,mobile,password_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?,?,0,?)", (email, hash_otp(otp), name, mobile, hash_password(password), expires_at, now_ts()))
    conn.commit()
    conn.close()
    sent = send_otp_email(email, name, otp, "signup")
    response = {"ok": True, "message": "OTP sent to your email. Verify OTP to complete signup.", "email": email, "expires_in_seconds": OTP_TTL_SECONDS, "email_sent": sent}
    if not sent:
        response["dev_otp"] = otp
        response["message"] = "SMTP_USER/SMTP_PASSWORD is missing or SMTP is not configured. Use the dev OTP shown here and in Render logs."
    return response


@app.post("/api/auth/verify-signup-otp")
def verify_signup_otp(req: VerifySignupRequest):
    email = normalize_email(req.email)
    otp = clean_text(req.otp)
    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP are mandatory.")
    conn = db()
    row = conn.execute("SELECT * FROM signup_otps WHERE email=? ORDER BY created_at DESC LIMIT 1", (email,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="OTP not found. Please request a new OTP.")
    if now_ts() > float(row["expires_at"]):
        conn.execute("DELETE FROM signup_otps WHERE email=?", (email,))
        conn.commit()
        conn.close()
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new OTP.")
    if int(row["attempts"] or 0) >= 5:
        conn.close()
        raise HTTPException(status_code=429, detail="Too many wrong attempts. Please request a new OTP.")
    if not hmac.compare_digest(hash_otp(otp), row["otp_hash"]):
        conn.execute("UPDATE signup_otps SET attempts=attempts+1 WHERE id=?", (row["id"],))
        conn.commit()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid OTP.")
    now = now_ts()
    existing = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if existing:
        conn.execute("UPDATE users SET name=?, mobile=?, password_hash=?, is_verified=1, updated_at=? WHERE email=?", (row["name"], row["mobile"], row["password_hash"], now, email))
    else:
        conn.execute("INSERT INTO users(name,email,mobile,password_hash,is_verified,created_at,updated_at) VALUES(?,?,?,?,1,?,?)", (row["name"], email, row["mobile"], row["password_hash"], now, now))
    conn.execute("DELETE FROM signup_otps WHERE email=?", (email,))
    conn.commit()
    conn.close()
    return {"ok": True, "message": "Email verified. Signup completed.", "user": {"name": row["name"], "email": email, "mobile": row["mobile"], "type": "user", "verified": True}}


@app.post("/api/auth/login")
def auth_login(req: LoginRequest):
    email = normalize_email(req.email)
    password = req.password or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are mandatory.")
    conn = db()
    row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    if not row or not verify_password(password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if int(row["is_verified"] or 0) != 1:
        raise HTTPException(status_code=403, detail="Please verify your email before login.")
    return {"ok": True, "message": "Login successful.", "user": {"name": row["name"], "email": row["email"], "mobile": row["mobile"], "type": "user", "verified": True}}


@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    email = normalize_email(req.email)
    if not email:
        raise HTTPException(status_code=400, detail="Email is mandatory.")
    conn = db()
    user = conn.execute("SELECT name, email, is_verified FROM users WHERE email=?", (email,)).fetchone()
    if not user or int(user["is_verified"] or 0) != 1:
        conn.close()
        raise HTTPException(status_code=404, detail="No verified account found with this email.")
    otp = f"{random.randint(100000, 999999)}"
    expires_at = now_ts() + OTP_TTL_SECONDS
    conn.execute("DELETE FROM password_reset_otps WHERE email=?", (email,))
    conn.execute("INSERT INTO password_reset_otps(email,otp_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?)", (email, hash_otp(otp), expires_at, 0, now_ts()))
    conn.commit()
    conn.close()
    sent = send_otp_email(email, user["name"], otp, "password reset")
    response = {"ok": True, "message": "Password reset OTP sent to your email.", "email": email, "expires_in_seconds": OTP_TTL_SECONDS, "email_sent": sent}
    if not sent:
        response["dev_otp"] = otp
        response["message"] = "SMTP_USER/SMTP_PASSWORD is missing or SMTP is not configured. Use the reset OTP shown here and in Render logs."
    return response


@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    email = normalize_email(req.email)
    otp = clean_text(req.otp)
    new_password = req.new_password or ""
    if not email or not otp or not new_password:
        raise HTTPException(status_code=400, detail="Email, OTP and new password are mandatory.")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    conn = db()
    row = conn.execute("SELECT * FROM password_reset_otps WHERE email=? ORDER BY created_at DESC LIMIT 1", (email,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Reset OTP not found. Please request a new OTP.")
    if now_ts() > float(row["expires_at"]):
        conn.execute("DELETE FROM password_reset_otps WHERE email=?", (email,))
        conn.commit()
        conn.close()
        raise HTTPException(status_code=400, detail="Reset OTP expired. Please request a new OTP.")
    if int(row["attempts"] or 0) >= 5:
        conn.close()
        raise HTTPException(status_code=429, detail="Too many wrong attempts. Please request a new OTP.")
    if not hmac.compare_digest(hash_otp(otp), row["otp_hash"]):
        conn.execute("UPDATE password_reset_otps SET attempts=attempts+1 WHERE id=?", (row["id"],))
        conn.commit()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid reset OTP.")
    user = conn.execute("SELECT id, name, email, mobile FROM users WHERE email=? AND is_verified=1", (email,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="No verified account found with this email.")
    conn.execute("UPDATE users SET password_hash=?, updated_at=? WHERE email=?", (hash_password(new_password), now_ts(), email))
    conn.execute("DELETE FROM password_reset_otps WHERE email=?", (email,))
    conn.commit()
    conn.close()
    return {"ok": True, "message": "Password reset successful. You can login with your new password.", "user": {"name": user["name"], "email": user["email"], "mobile": user["mobile"], "type": "user", "verified": True}}


@app.post("/api/items")
def save_item(item: Dict[str, Any]):
    conn = db()
    row_id, item_key, item_type = upsert_item(conn, item)
    conn.commit()
    conn.close()
    return {"ok": True, "id": row_id, "key": item_key, "type": item_type, "sqlite_db": str(DB_PATH)}


@app.get("/api/items")
def list_items(key: Optional[str] = None, type: Optional[str] = None, limit: int = 100):
    conn = db()
    sql = "SELECT * FROM items WHERE 1=1"
    params: List[Any] = []
    if key:
        sql += " AND item_key=?"
        params.append(key)
    if type:
        sql += " AND item_type=?"
        params.append(type)
    sql += " ORDER BY updated_at DESC LIMIT ?"
    params.append(max(1, min(limit, 500)))
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    out = []
    for r in rows:
        try:
            payload = json.loads(r["payload"])
        except Exception:
            payload = r["payload"]
        out.append({"id": r["id"], "key": r["item_key"], "type": r["item_type"], "title": r["title"], "payload": payload, "updated_at": r["updated_at"]})
    return {"ok": True, "items": out, "sqlite_db": str(DB_PATH)}


@app.delete("/api/items/{key}")
def delete_item(key: str):
    conn = db()
    conn.execute("DELETE FROM items WHERE item_key=?", (key,))
    conn.commit()
    conn.close()
    return {"ok": True, "deleted_key": key}


@app.post("/api/sync-localstorage")
def sync_localstorage(req: SyncRequest):
    conn = db()
    count = 0
    for key, value in req.items.items():
        upsert_item(conn, {"key": key, "type": req.source or "frontend-sync", "title": key, "data": value})
        count += 1
    conn.commit()
    conn.close()
    return {"ok": True, "synced": count, "sqlite_db": str(DB_PATH)}


@app.post("/api/restore-localstorage")
def restore_localstorage(req: RestoreRequest):
    conn = db()
    count = 0
    for key, value in req.items.items():
        upsert_item(conn, {"key": key, "type": "restore", "title": key, "data": value})
        count += 1
    conn.commit()
    conn.close()
    return {"ok": True, "restored": count, "sqlite_db": str(DB_PATH)}


@app.get("/api/ollama-status")
def ollama_status():
    try:
        with urllib.request.urlopen(f"{OLLAMA_BASE_URL}/api/tags", timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        models = [m.get("name") for m in data.get("models", [])]
        return {"ok": True, "base_url": OLLAMA_BASE_URL, "models": models, "model_available": OLLAMA_MODEL in models}
    except Exception as exc:
        return {"ok": False, "base_url": OLLAMA_BASE_URL, "error": str(exc), "model_available": False}


@app.post("/api/mentor")
def mentor(req: MentorRequest):
    question = clean_text(req.question)
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    mode = (req.mode or "local").lower()
    context = req.context or {}
    if mode == "ollama":
        try:
            prompt = f"You are a Salesforce career mentor. Context: {json.dumps(context, ensure_ascii=False)}\n\nQuestion: {question}"
            payload = json.dumps({"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}).encode("utf-8")
            request = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/generate", data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(request, timeout=OLLAMA_TIMEOUT) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return {"ok": True, "source": "ollama", "answer": data.get("response", ""), "links": []}
        except Exception as exc:
            return {"ok": False, "source": "ollama-error", "answer": f"Ollama unavailable. Local fallback: {question}", "error": str(exc), "links": []}
    encoded = urllib.parse.quote(question)
    links = [
        {"title": "Google Search", "url": f"https://www.google.com/search?q={encoded}"},
        {"title": "Salesforce Docs", "url": f"https://developer.salesforce.com/docs?q={encoded}"},
        {"title": "Trailhead", "url": f"https://trailhead.salesforce.com/search?keywords={encoded}"},
        {"title": "Salesforce StackExchange", "url": f"https://salesforce.stackexchange.com/search?q={encoded}"},
    ]
    answer = f"Local mentor answer for: {question}\n\n1. Definition\n2. Real project use case\n3. Step-by-step implementation\n4. Best practices\n5. Interview-ready 60-second answer\n6. Follow-up revision task"
    return {"ok": True, "source": "local-fallback", "answer": answer, "links": links}
