import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

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
  return <section className="hero premiumHero"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{children}</section>;
}

export function Progress({ value }) {
  const v = Math.max(0, Math.min(100, Math.round(value || 0)));
  return <div className="progress"><i style={{ width: `${v}%` }} /><b>{v}%</b></div>;
}

export function Field({ label, value, onChange, type = 'text', area = false, placeholder = '' }) {
  return <label className="field"><span>{label}</span>{area ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}</label>;
}

export const navGroups = [
  { title: 'Core', items: [['Dashboard','/dashboard','🏠'], ['AI Mentor Agent','/ai-mentor','🤖'], ['Mentor Route','/mentor-route','🎯'], ['Focus Mode','/focus','✨'], ['Learning Coach','/learning-coach','📘']] },
  { title: 'Learning', items: [['100 Days English','/english','🗣️'], ['Practice Lab','/practice','💻'], ['Scenario Questions','/scenarios','🧩'], ['Use Cases','/use-cases','🏗️'], ['Weekly Tests','/weekly-tests','🧪']] },
  { title: 'Practice & Career', items: [['Interview Q&A','/interview','🎤'], ['Projects','/projects','🚀'], ['Job Tracker','/job-tracker','💼'], ['JD Matcher','/jd-matcher','🧾'], ['Resume Optimizer','/resume','📄']] },
  { title: 'Vault & Tools', items: [['24h Tracker','/time-tracker','⏱️'], ['Notes Library','/notes','📝'], ['Documents','/documents','🗂️'], ['Doubt Tracker','/doubts','❓'], ['Portfolio Manager','/portfolio-manager','🖼️'], ['More Tools','/more-tools','🧰'], ['Backup','/backup','💾']] },
];

const allTools = navGroups.flatMap(g => g.items.map(([label, to, icon]) => ({ label, to, icon, group: g.title })));
const quickCommands = [
  { label: 'Start 45m Salesforce Sprint', to: '/time-tracker', icon: '⚡' },
  { label: 'Find Weak Topics', to: '/practice', icon: '⚠️' },
  { label: 'Take Weekly Test', to: '/weekly-tests', icon: '🧪' },
  { label: 'Add Job Follow-up', to: '/job-tracker', icon: '💼' },
  { label: 'Update Portfolio Photo', to: '/portfolio-manager', icon: '🖼️' },
  { label: 'Ask AI Mentor', to: '/ai-mentor', icon: '🤖' },
];

function ThemeSwitcher() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'salesforce');
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  return <div className="themeSwitcher" aria-label="Theme selector">
    {['salesforce','glass','purple'].map(t => <button key={t} className={theme === t ? 'active' : ''} onClick={() => setTheme(t)} title={t}>{t === 'salesforce' ? '🔵' : t === 'glass' ? '🌙' : '🟣'}</button>)}
  </div>;
}

function CommandBar() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState('');
  const matches = [...quickCommands, ...allTools].filter(x => `${x.label} ${x.group || ''}`.toLowerCase().includes(q.toLowerCase())).slice(0, 7);
  const open = (to) => { setQ(''); navigate(to); };
  return <div className="commandBar">
    <span>⌘</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools, topics, questions, companies..." />
    {q && <div className="commandMenu">{matches.length ? matches.map(item => <button key={`${item.label}-${item.to}`} onClick={() => open(item.to)}><span>{item.icon}</span><div><b>{item.label}</b>{item.group && <small>{item.group}</small>}</div></button>) : <div className="commandEmpty">No tool found. Try Focus, Job, DSA, Mentor...</div>}</div>}
  </div>;
}

function FloatingActions() {
  const [open, setOpen] = React.useState(false);
  const actions = [
    ['Save Note','/notes','📝'], ['Add Doubt','/doubts','❓'], ['Start Sprint','/time-tracker','⏱️'], ['Ask Mentor','/ai-mentor','🤖'], ['Update Photo','/portfolio-manager','🖼️'], ['Add Job','/job-tracker','💼']
  ];
  return <div className="fabWrap">
    {open && <div className="fabMenu">{actions.map(([label,to,icon]) => <Link key={to} to={to} onClick={() => setOpen(false)}><span>{icon}</span>{label}</Link>)}</div>}
    <button className="fab" onClick={() => setOpen(!open)}>{open ? '×' : '+'}</button>
  </div>;
}

function MobileBottomNav() {
  const items = [['🏠','/dashboard','Dashboard'], ['🎯','/focus','Focus'], ['💻','/practice','Practice'], ['💼','/job-tracker','Jobs'], ['🤖','/ai-mentor','Mentor']];
  const location = useLocation();
  return <nav className="mobileBottomNav">{items.map(([icon,to,label]) => <Link key={to} className={location.pathname === to ? 'active' : ''} to={to}><span>{icon}</span><small>{label}</small></Link>)}</nav>;
}

export function Layout({ children }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  return <div className="appShell">
    <aside className="sidebar">
      <Link className="brand" to="/dashboard"><span>🤖</span><div><b>SFDC Mentor</b><small>AI Agent Portfolio</small></div></Link>
      {navGroups.map(group => <div className="navGroup" key={group.title}><h4>{group.title}</h4>{group.items.map(([label, to, icon]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'navItem active' : 'navItem'}><span>{icon}</span>{label}</NavLink>)}</div>)}
    </aside>
    <main className="main"><header className="topbar premiumTopbar"><div className="topGreeting"><p>{greet}, Abhishek Kumar</p><b>Build skills. Track proof. Prepare interviews. Show portfolio.</b></div><CommandBar/><div className="row topActions"><ThemeSwitcher/><Link className="btn cyan" to="/mentor-route">Continue Learning</Link><Link className="btn ghost" to="/portfolio">Portfolio</Link></div></header>{children}<FloatingActions/><MobileBottomNav/></main>
  </div>;
}

export function Page({ children }) {
  return <div className="page">{children}</div>;
}

export function EmptyState({ title, text, action }) {
  return <div className="empty premiumEmpty"><div className="emptyIcon">✨</div><h3>{title}</h3><p>{text}</p>{action}</div>;
}
