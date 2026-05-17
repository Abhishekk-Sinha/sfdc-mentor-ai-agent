import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cvSkills, experience, profile, projects } from '../data/profile';
import { Card, Field, Page } from '../components/UI';
import { readStore, writeStore } from '../utils/storage';

export function Login() {
  const nav = useNavigate();
  const [form, setForm] = React.useState({ email: profile.email, password: '' });
  const login = () => { writeStore('session', { name: profile.name, email: form.email, type: 'user' }); nav('/dashboard'); };
  return <div className="loginPage"><div className="loginCard"><div className="logoBig">SF</div><h1>Login to SFDC Mentor</h1><p>Local demo login. Enter anything and continue.</p><Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} /><Field label="Password" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} /><button className="btn cyan full" onClick={login}>Login</button><Link className="btn ghost full" to="/portfolio">View Job Portfolio</Link></div></div>;
}

export function Portfolio() {
  return <div className="portfolioPage"><Link className="cornerLogin" to="/login">Login</Link><section className="portfolioHero"><div><p className="eyebrow">Abhishek's Job Portfolio</p><h1>{profile.name}</h1><h2>{profile.headline}</h2><p>{profile.summary}</p><div className="row"><a className="btn cyan" href="#skills">View Skills</a><Link className="btn ghost" to="/login">Login to Career OS</Link></div></div><div className="profileCard"><div className="avatar">AK</div><h3>{profile.role}</h3><p>{profile.location}</p><p>{profile.email}</p><p>{profile.phone}</p></div></section><section id="skills" className="portfolioSection"><h2>CV Skills</h2><div className="skillGroups">{Object.entries(cvSkills).map(([group, arr]) => <div className="skillGroup" key={group}><h3>{group}</h3><div>{arr.map(s => <span key={s}>{s}</span>)}</div></div>)}</div></section><section className="portfolioSection"><h2>Professional Experience</h2><div className="timeline">{experience.map((e, i) => <div className="timelineCard" key={e.company}><b>0{i + 1}</b><h3>{e.role} — {e.company}</h3><p>{e.period}</p><ul>{e.points.map(p => <li key={p}>{p}</li>)}</ul></div>)}</div></section><section className="portfolioSection"><h2>Projects</h2><div className="grid3">{projects.map(p => <div className="projectCard" key={p.title}><h3>{p.title}</h3><b>{p.tech}</b><p>{p.overview}</p></div>)}</div></section></div>;
}

export function PortfolioManager() {
  const [skills, setSkills] = React.useState(() => readStore('portfolioSkills', Object.values(cvSkills).flat()));
  const [newSkill, setNewSkill] = React.useState('');
  return <Page><Card title="Portfolio Content Manager" subtitle="CRUD area for skills shown in job portfolio."><div className="row"><input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill" /><button className="btn" onClick={() => { if(newSkill.trim()){ const next=[...skills,newSkill.trim()]; setSkills(next); writeStore('portfolioSkills', next); setNewSkill(''); } }}>Add</button></div><div className="crudList">{skills.map((s, i) => <div key={i}><input value={s} onChange={e => { const next=skills.map((x,j)=>j===i?e.target.value:x); setSkills(next); writeStore('portfolioSkills', next); }} /><button className="btn danger" onClick={()=>{ const next=skills.filter((_,j)=>j!==i); setSkills(next); writeStore('portfolioSkills', next); }}>Delete</button></div>)}</div></Card></Page>;
}
