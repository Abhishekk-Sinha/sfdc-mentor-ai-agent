import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cvSkills, experience, profile, projects } from '../data/profile';
import { Card, Field, Page } from '../components/UI';
import { readStore, writeStore } from '../utils/storage';

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

function useProfilePhoto() {
  const [photo, setPhoto] = React.useState(() => readStore('profilePhoto', defaultPhoto));
  const upload = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      writeStore('profilePhoto', reader.result);
    };
    reader.readAsDataURL(file);
  };
  return { photo, upload };
}

export function Login() {
  const nav = useNavigate();
  const { photo } = useProfilePhoto();
  const [show, setShow] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [form, setForm] = React.useState({ email: profile.email, password: '' });
  const login = () => { writeStore('session', { name: profile.name, email: form.email, type: 'user', remember }); nav('/dashboard'); };
  return <div className="loginPage premiumLoginPage">
    <section className="loginShowcase">
      <div className="loginPhotoFrame"><img src={photo} alt="Abhishek Kumar" /></div>
      <p className="eyebrow">Salesforce Career OS</p>
      <h1>Welcome back, Abhishek</h1>
      <p>Track skills, answers, projects, interviews, jobs and daily proof from one private mentor dashboard.</p>
      <div className="loginProofGrid">
        <span>⚡ 90-Day Mentor Route</span><span>🎯 Focus Mode</span><span>💼 Job Tracker</span><span>🤖 AI Mentor</span>
      </div>
    </section>
    <section className="loginCard premiumLoginCard">
      <div className="logoBig">SF</div>
      <h1>Login to Career OS</h1>
      <p>Private dashboard for learning, interview preparation, resume proof and Salesforce job tracking.</p>
      <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
      <label className="field"><span>Password</span><div className="passwordField"><input type={show ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter anything for local demo"/><button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></div></label>
      <div className="loginOptions"><label><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/> Remember me</label><button type="button">Forgot password?</button></div>
      <button className="btn cyan full" onClick={login}>Enter Dashboard</button>
      <Link className="btn ghost full" to="/portfolio">View Public Job Portfolio</Link>
      <div className="secureBadges"><span>🔐 Local data</span><span>⚙️ Offline-first</span><span>📦 Backup ready</span></div>
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
        <div className="portfolioHeroActions"><a className="btn cyan" href="#skills">View Skills</a><a className="btn ghost" href={profile.linkedin} target="_blank">LinkedIn</a><a className="btn ghost" href={profile.github} target="_blank">GitHub</a><Link className="btn ghost" to="/login">Career OS Login</Link></div>
        <div className="recruiterStats">{recruiterStats.map(([v,l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}</div>
      </div>
      <aside className="profileCard premiumProfileCard">
        <div className="profilePhotoRing"><img src={photo} alt="Abhishek Kumar" /></div>
        <h3>{profile.role}</h3>
        <p>{profile.location}</p>
        <div className="contactStack"><a href={`mailto:${profile.email}`}>{profile.email}</a><a href={`tel:${profile.phone}`}>{profile.phone}</a><a target="_blank" href={profile.trailhead}>Trailhead Profile</a></div>
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
  const { photo, upload } = useProfilePhoto();
  const [skills, setSkills] = React.useState(() => readStore('portfolioSkills', Object.values(cvSkills).flat()));
  const [newSkill, setNewSkill] = React.useState('');
  return <Page><Card title="Portfolio Content Manager" subtitle="Update profile photo and portfolio skills.">
    <div className="managerPhotoRow"><img src={photo} alt="Portfolio profile"/><label className="btn cyan">Upload Profile Photo<input type="file" accept="image/*" onChange={e => upload(e.target.files?.[0])} hidden/></label><Link className="btn ghost" to="/portfolio">Preview Portfolio</Link></div>
    <div className="row"><input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill" /><button className="btn" onClick={() => { if(newSkill.trim()){ const next=[...skills,newSkill.trim()]; setSkills(next); writeStore('portfolioSkills', next); setNewSkill(''); } }}>Add</button></div>
    <div className="crudList">{skills.map((s, i) => <div key={i}><input value={s} onChange={e => { const next=skills.map((x,j)=>j===i?e.target.value:x); setSkills(next); writeStore('portfolioSkills', next); }} /><button className="btn danger" onClick={()=>{ const next=skills.filter((_,j)=>j!==i); setSkills(next); writeStore('portfolioSkills', next); }}>Delete</button></div>)}</div>
  </Card></Page>;
}
