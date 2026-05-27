import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cvSkills, experience, profile, projects } from '../data/profile';
import { Card, Field, Page } from '../components/UI';
import { readStore, writeStore } from '../utils/storage';

const API_BASE = 'http://127.0.0.1:8000';

const defaultPhoto = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#35d4ef"/><stop offset=".55" stop-color="#2563eb"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>
    <radialGradient id="r" cx="50%" cy="20%" r="70%"><stop stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="420" height="420" rx="72" fill="#07101f"/>
  <rect width="420" height="420" rx="72" fill="url(#g)" opacity=".38"/>
  <circle cx="210" cy="152" r="72" fill="#eaf2ff" opacity=".92"/>
  <path d="M84 350c20-82 73-126 126-126s106 44 126 126" fill="#eaf2ff" opacity=".92"/>
  <rect width="420" height="420" rx="72" fill="url(#r)"/>
  <text x="210" y="386" text-anchor="middle" font-family="Arial" font-size="34" font-weight="800" fill="#fff">AK</text>
</svg>`)};`;

async function apiPost(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || data?.message || 'Request failed');
  return data;
}

async function syncPhotoToBackend(photo) {
  try {
    await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'profilePhoto', type: 'profile', title: 'Profile Photo', data: photo })
    });
  } catch {
    // Local app still works without backend.
  }
}

async function loadPhotoFromBackend() {
  try {
    const response = await fetch(`${API_BASE}/api/items?key=profilePhoto&limit=1`);
    const data = await response.json();
    const saved = data?.items?.[0]?.payload;
    if (typeof saved === 'string' && saved.startsWith('data:image')) return saved;
  } catch {
    return null;
  }
  return null;
}

function useProfilePhoto() {
  const [photo, setPhoto] = React.useState(() => readStore('profilePhoto', defaultPhoto));
  const [status, setStatus] = React.useState('Saved in browser');

  React.useEffect(() => {
    let active = true;
    loadPhotoFromBackend().then(saved => {
      if (!active || !saved) return;
      setPhoto(saved);
      writeStore('profilePhoto', saved);
      setStatus('Saved in browser + SQLite');
    });
    return () => { active = false; };
  }, []);

  const upload = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const savedPhoto = reader.result;
      setPhoto(savedPhoto);
      writeStore('profilePhoto', savedPhoto);
      writeStore('profilePhotoSavedAt', new Date().toLocaleString());
      setStatus('Saved permanently in this browser');
      syncPhotoToBackend(savedPhoto).then(() => setStatus('Saved in browser + SQLite'));
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setPhoto(defaultPhoto);
    writeStore('profilePhoto', defaultPhoto);
    writeStore('profilePhotoSavedAt', new Date().toLocaleString());
    setStatus('Default photo restored');
    syncPhotoToBackend(defaultPhoto);
  };

  return { photo, upload, reset, status };
}

export function Login() {
  const nav = useNavigate();
  const { photo } = useProfilePhoto();
  const [mode, setMode] = React.useState('login');
  const [show, setShow] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [otpSent, setOtpSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [devOtp, setDevOtp] = React.useState('');
  const [form, setForm] = React.useState({ name: '', email: profile.email || '', mobile: '', password: '', otp: '' });

  const setValue = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const finishSession = user => {
    writeStore('session', { name: user.name, email: user.email, mobile: user.mobile, type: user.type || 'user', verified: true, remember });
    nav('/dashboard');
  };

  const login = async () => {
    setBusy(true);
    setStatus('');
    try {
      const data = await apiPost('/api/auth/login', { email: form.email, password: form.password });
      finishSession(data.user);
    } catch (err) {
      setStatus(err.message || 'Login failed. Please check email/password.');
    } finally {
      setBusy(false);
    }
  };

  const requestOtp = async () => {
    setBusy(true);
    setStatus('');
    setDevOtp('');
    try {
      const data = await apiPost('/api/auth/request-signup-otp', {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password
      });
      setOtpSent(true);
      setDevOtp(data.dev_otp || '');
      setStatus(data.message || 'OTP sent to your email.');
    } catch (err) {
      setStatus(err.message || 'Could not send OTP.');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setStatus('');
    try {
      const data = await apiPost('/api/auth/verify-signup-otp', { email: form.email, otp: form.otp });
      finishSession(data.user);
    } catch (err) {
      setStatus(err.message || 'OTP verification failed.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="loginPage premiumLoginPage">
    <section className="loginShowcase">
      <div className="loginPhotoFrame"><img src={photo} alt="Abhishek Kumar" /></div>
      <p className="eyebrow">Salesforce Career OS</p>
      <h1>{mode === 'signup' ? 'Create verified account' : 'Welcome back, Abhishek'}</h1>
      <p>Track skills, answers, projects, interviews, jobs and daily proof from one private mentor dashboard.</p>
      <div className="loginProofGrid">
        <span>Email OTP Verification</span><span>Mandatory Profile</span><span>Secure Password</span><span>Private Dashboard</span>
      </div>
    </section>
    <section className="loginCard premiumLoginCard">
      <div className="logoBig">SF</div>
      <h1>{mode === 'signup' ? 'Sign up with Email OTP' : 'Login to Career OS'}</h1>
      <p>{mode === 'signup' ? 'Name, email, mobile number and password are mandatory. Signup completes only after OTP verification.' : 'Use your verified email and password to enter the private dashboard.'}</p>

      <div className="loginOptions" style={{ justifyContent: 'center', gap: 10 }}>
        <button type="button" className={mode === 'login' ? 'btn cyan' : 'btn ghost'} onClick={() => { setMode('login'); setStatus(''); }}>Login</button>
        <button type="button" className={mode === 'signup' ? 'btn cyan' : 'btn ghost'} onClick={() => { setMode('signup'); setStatus(''); }}>Sign Up</button>
      </div>

      {mode === 'signup' && <Field label="Full Name *" value={form.name} onChange={v => setValue('name', v)} />}
      <Field label="Email *" value={form.email} onChange={v => setValue('email', v)} />
      {mode === 'signup' && <Field label="Mobile Number *" value={form.mobile} onChange={v => setValue('mobile', v)} />}
      <label className="field"><span>Password *</span><div className="passwordField"><input type={show ? 'text' : 'password'} value={form.password} onChange={e => setValue('password', e.target.value)} placeholder="Minimum 6 characters"/><button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></div></label>

      {mode === 'signup' && otpSent && <Field label="Email OTP *" value={form.otp} onChange={v => setValue('otp', v)} />}
      {devOtp && <p className="hint">Local testing OTP: <b>{devOtp}</b>. Configure SMTP to send real email.</p>}
      {status && <p className="hint">{status}</p>}

      {mode === 'login' && <>
        <div className="loginOptions"><label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Remember me</label><button type="button">Forgot password?</button></div>
        <button className="btn cyan full" disabled={busy} onClick={login}>{busy ? 'Checking...' : 'Enter Dashboard'}</button>
      </>}

      {mode === 'signup' && <>
        <div className="loginOptions"><label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Remember me</label><button type="button" onClick={requestOtp} disabled={busy}>{otpSent ? 'Resend OTP' : 'Send OTP'}</button></div>
        {!otpSent ? <button className="btn cyan full" disabled={busy} onClick={requestOtp}>{busy ? 'Sending OTP...' : 'Send OTP to Email'}</button> : <button className="btn cyan full" disabled={busy} onClick={verifyOtp}>{busy ? 'Verifying...' : 'Verify OTP & Create Account'}</button>}
      </>}

      <Link className="btn ghost full" to="/portfolio">View Public Job Portfolio</Link>
      <div className="secureBadges"><span>Email verified</span><span>SQLite user store</span><span>OTP protected</span></div>
    </section>
  </div>;
}

export function Portfolio() {
  const { photo } = useProfilePhoto();
  const recruiterStats = [
    ['2+','Years Experience'], ['90%+','Test Coverage Target'], ['60%','Automation Impact'], ['40%','Deployment Efficiency']
  ];
  const focusAreas = ['Apex Triggers', 'Lightning Web Components', 'Flows', 'Security & Sharing', 'REST API', 'SOQL/SOSL', 'Reports & Dashboards', 'Data Loader'];
  return <div className="portfolioPage premiumPortfolioPage">
    <Link className="cornerLogin" to="/login">Login</Link>
    <section className="portfolioHero premiumPortfolioHero">
      <div className="portfolioHeroText">
        <p className="eyebrow">Abhishek's Job Portfolio</p>
        <h1>{profile.name}</h1>
        <h2>{profile.headline}</h2>
        <p>{profile.summary}</p>
        <div className="portfolioHeroActions"><a className="btn cyan" href="#skills">View Skills</a><a className="btn ghost" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a className="btn ghost" href={profile.github} target="_blank" rel="noreferrer">GitHub</a><Link className="btn ghost" to="/login">Career OS Login</Link></div>
        <div className="recruiterStats">{recruiterStats.map(([v,l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}</div>
      </div>
      <aside className="profileCard premiumProfileCard">
        <div className="profilePhotoRing"><img src={photo} alt="Abhishek Kumar" /></div>
        <h3>{profile.role}</h3>
        <p>{profile.location}</p>
        <div className="contactStack"><a href={`mailto:${profile.email}`}>{profile.email}</a><a href={`tel:${profile.phone}`}>{profile.phone}</a><a target="_blank" rel="noreferrer" href={profile.trailhead}>Trailhead Profile</a></div>
        <div className="availabilityCard"><b>Available for</b><span>Salesforce Developer roles • Apex • LWC • Flow • Integration</span></div>
      </aside>
    </section>

    <section className="portfolioSection recruiterQuickView"><h2>Recruiter Quick View</h2><div className="quickViewGrid"><div><b>Primary Role</b><span>Salesforce Developer</span></div><div><b>Core Strength</b><span>Apex, LWC, Flow, Security</span></div><div><b>Project Proof</b><span>CRM, Healthcare, Real Estate, IoT</span></div><div><b>Interview Focus</b><span>Scenario-based Salesforce delivery</span></div></div></section>

    <section className="portfolioSection"><h2>Featured Strengths</h2><div className="strengthGrid">{focusAreas.map((x,i)=><div className="strengthCard" key={x}><span>{String(i+1).padStart(2,'0')}</span><b>{x}</b><small>Project-ready + interview-ready</small></div>)}</div></section>

    <section id="skills" className="portfolioSection"><h2>CV Skills</h2><div className="skillGroups">{Object.entries(cvSkills).map(([group, arr]) => <div className="skillGroup" key={group}><h3>{group}</h3><div>{arr.map(s => <span key={s}>{s}</span>)}</div></div>)}</div></section>

    <section className="portfolioSection"><h2>Featured Projects</h2><div className="grid3 premiumProjectGrid">{projects.map(p => <div className="projectCard premiumProjectCard" key={p.title}><p className="eyebrow">{p.company}</p><h3>{p.title}</h3><b>{p.tech}</b><p>{p.overview}</p><div className="projectImpact"><span>Impact</span><p>{p.impact}</p></div></div>)}</div></section>

    <section className="portfolioSection"><h2>Professional Experience</h2><div className="timeline premiumTimeline">{experience.map((e, i) => <div className="timelineCard" key={e.company}><b>0{i + 1}</b><h3>{e.role} — {e.company}</h3><p>{e.period}</p><ul>{e.points.map(p => <li key={p}>{p}</li>)}</ul></div>)}</div></section>

    <section className="portfolioSection hireMeSection"><div><p className="eyebrow">Why hire me</p><h2>Salesforce developer with practical CRM delivery mindset.</h2><p>I connect requirement understanding, Salesforce configuration, Apex/LWC development, security, testing and deployment into a clean business-ready solution.</p></div><Link className="btn cyan" to="/login">Open Private Career OS</Link></section>
  </div>;
}

export function PortfolioManager() {
  const { photo, upload, reset, status } = useProfilePhoto();
  const [skills, setSkills] = React.useState(() => readStore('portfolioSkills', Object.values(cvSkills).flat()));
  const [newSkill, setNewSkill] = React.useState('');
  const savedAt = readStore('profilePhotoSavedAt', 'Not uploaded yet');
  return <Page><Card title="Portfolio Content Manager" subtitle="Upload profile photo once. It stays saved in browser localStorage and syncs to SQLite when backend is running.">
    <div className="managerPhotoRow"><img src={photo} alt="Portfolio profile"/><label className="btn cyan">Upload & Save Photo<input type="file" accept="image/*" onChange={e => upload(e.target.files?.[0])} hidden/></label><button className="btn ghost" onClick={reset}>Reset Photo</button><Link className="btn ghost" to="/portfolio">Preview Portfolio</Link></div>
    <p className="hint">Photo status: {status}. Last saved: {savedAt}. You do not need to upload again unless you clear browser data or change browser/device.</p>
    <div className="row"><input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill" /><button className="btn" onClick={() => { if(newSkill.trim()){ const next=[...skills,newSkill.trim()]; setSkills(next); writeStore('portfolioSkills', next); setNewSkill(''); } }}>Add</button></div>
    <div className="crudList">{skills.map((s, i) => <div key={i}><input value={s} onChange={e => { const next=skills.map((x,j)=>j===i?e.target.value:x); setSkills(next); writeStore('portfolioSkills', next); }} /><button className="btn danger" onClick={()=>{ const next=skills.filter((_,j)=>j!==i); setSkills(next); writeStore('portfolioSkills', next); }}>Delete</button></div>)}</div>
  </Card></Page>;
}
