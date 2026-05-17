import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export function Card({ title, subtitle, children, className = '', action }) {
  return <section className={`card ${className}`}>
    {(title || action) && <div className="cardHead"><div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
    {children}
  </section>;
}

export function Stat({ label, value, note, icon }) {
  return <div className="stat"><span>{icon}</span><p>{label}</p><b>{value}</b>{note && <small>{note}</small>}</div>;
}

export function Hero({ eyebrow = 'SFDC Mentor AI Agent', title, subtitle, children }) {
  return <section className="hero"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{children}</section>;
}

export function Progress({ value }) {
  const v = Math.max(0, Math.min(100, Math.round(value || 0)));
  return <div className="progress"><i style={{ width: `${v}%` }} /><b>{v}%</b></div>;
}

export function Field({ label, value, onChange, type = 'text', area = false, placeholder = '' }) {
  return <label className="field"><span>{label}</span>{area ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}</label>;
}

export const navGroups = [
  { title: 'Career OS', items: [['Dashboard','/dashboard','🏠'], ['AI Mentor Agent','/ai-mentor','🤖'], ['Mentor Route','/mentor-route','🎯'], ['Focus Mode','/focus','✨'], ['Learning Coach','/learning-coach','📘']] },
  { title: 'Learning', items: [['100 Days English','/english','🗣️'], ['Practice Lab','/practice','💻'], ['Scenario Questions','/scenarios','🧩'], ['Use Cases','/use-cases','🏗️'], ['Weekly Tests','/weekly-tests','🧪']] },
  { title: 'Career Tools', items: [['Interview Q&A','/interview','🎤'], ['Projects','/projects','🚀'], ['Job Tracker','/job-tracker','💼'], ['JD Matcher','/jd-matcher','🧾'], ['Resume Optimizer','/resume','📄']] },
  { title: 'Productivity', items: [['24h Tracker','/time-tracker','⏱️'], ['Notes Library','/notes','📝'], ['Documents','/documents','🗂️'], ['Doubt Tracker','/doubts','❓'], ['More Tools','/more-tools','🧰']] },
];

export function Layout({ children }) {
  return <div className="appShell">
    <aside className="sidebar">
      <Link className="brand" to="/dashboard"><span>🤖</span><div><b>SFDC Mentor</b><small>AI Agent Portfolio</small></div></Link>
      {navGroups.map(group => <div className="navGroup" key={group.title}><h4>{group.title}</h4>{group.items.map(([label, to, icon]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'navItem active' : 'navItem'}><span>{icon}</span>{label}</NavLink>)}</div>)}
    </aside>
    <main className="main"><header className="topbar"><div><p>Welcome back, Abhishek Kumar</p><b>Build skills. Track proof. Prepare interviews. Show portfolio.</b></div><div className="row"><Link className="btn cyan" to="/mentor-route">Open Routine Page</Link><Link className="btn ghost" to="/portfolio">Show Portfolio</Link></div></header>{children}</main>
  </div>;
}

export function Page({ children }) {
  return <div className="page">{children}</div>;
}

export function EmptyState({ title, text, action }) {
  return <div className="empty"><h3>{title}</h3><p>{text}</p>{action}</div>;
}
