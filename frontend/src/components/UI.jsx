import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

export function Card({ title, subtitle, children, className = '', action }) {
  return <section className={`card ${className}`}>
    {(title || action) && <div className="cardHead"><div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
    {children}
  </section>;
}

export function Stat({ label, value, note, icon }) { return <div className="stat"><span>{icon}</span><p>{label}</p><b>{value}</b>{note && <small>{note}</small>}</div>; }
export function Hero({ eyebrow = 'SFDC Mentor AI Agent', title, subtitle, children }) { return <section className="hero premiumHero"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{children}</section>; }
export function Progress({ value }) { const v = Math.max(0, Math.min(100, Math.round(value || 0))); return <div className="progress"><i style={{ width: `${v}%` }} /><b>{v}%</b></div>; }
export function Field({ label, value, onChange, type = 'text', area = false, placeholder = '' }) { return <label className="field"><span>{label}</span>{area ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}</label>; }

export const navGroups = [
  { title: 'Start Here', items: [['Home Guide','/dashboard','🏠'], ['Learning Plan','/zero-to-hero','🎯'], ['Automation Center','/final-premium','⚙️'], ['Advanced Tools','/premium-features','🧰']] },
  { title: 'Daily Study', items: [['AI Mentor','/ai-mentor','🤖'], ['Daily Route','/mentor-route','🛣️'], ['Focus Practice','/focus','✨'], ['Learning Coach','/learning-coach','📘']] },
  { title: 'Practice', items: [['English Practice','/english','🗣️'], ['Question Bank','/practice','💻'], ['Scenario Practice','/scenarios','🧩'], ['Use Cases','/use-cases','🏗️'], ['Weekly Tests','/weekly-tests','🧪']] },
  { title: 'Career Prep', items: [['Interview Room','/interview','🎤'], ['My Projects','/projects','🚀'], ['Job Tracker','/job-tracker','💼'], ['JD Matcher','/jd-matcher','🧾'], ['Resume Optimizer','/resume','📄']] },
  { title: 'Data & Tools', items: [['24h Tracker','/time-tracker','⏱️'], ['Notes','/notes','📝'], ['Documents','/documents','🗂️'], ['Doubts','/doubts','❓'], ['Portfolio Editor','/portfolio-manager','🖼️'], ['All Tools','/more-tools','🧰'], ['Backup','/backup','💾']] },
];

const allTools = navGroups.flatMap(g => g.items.map(([label, to, icon]) => ({ label, to, icon, group: g.title, kind: 'Tool' })));
const quickCommands = [
  { label: 'Open Learning Plan', to: '/zero-to-hero', icon: '🎯', kind: 'Command' },
  { label: 'Run Automation Center', to: '/final-premium', icon: '⚙️', kind: 'Command' },
  { label: 'Open Advanced Tools', to: '/premium-features', icon: '🧰', kind: 'Command' },
  { label: 'Start 45m Salesforce Sprint', to: '/time-tracker', icon: '⚡', kind: 'Command' },
  { label: 'Find Weak Topics', to: '/practice', icon: '⚠️', kind: 'Command' },
  { label: 'Take Weekly Test', to: '/weekly-tests', icon: '🧪', kind: 'Command' },
  { label: 'Add Job Follow-up', to: '/job-tracker', icon: '💼', kind: 'Command' },
  { label: 'Ask AI Mentor', to: '/ai-mentor', icon: '🤖', kind: 'Command' },
];

const localRoutes = [
  { words: ['zerohero','architect','learningplan'], to: '/zero-to-hero', icon: '🎯', group: 'Learning Plan' },
  { words: ['finalpremium','automation'], to: '/final-premium', icon: '⚙️', group: 'Automation Center' },
  { words: ['premiumfeatures','advancedtools'], to: '/premium-features', icon: '🧰', group: 'Advanced Tools' },
  { words: ['note'], to: '/notes', icon: '📝', group: 'Notes' }, { words: ['doubt'], to: '/doubts', icon: '❓', group: 'Doubts' },
  { words: ['job', 'compan', 'applied'], to: '/job-tracker', icon: '💼', group: 'Job Tracker' }, { words: ['time', 'hour', 'task', 'block'], to: '/time-tracker', icon: '⏱️', group: '24h Tracker' },
  { words: ['answer', 'focus', 'weak', 'strong'], to: '/focus', icon: '✨', group: 'Answers' }, { words: ['interview', 'mock'], to: '/interview', icon: '🎤', group: 'Interview' },
  { words: ['weekly', 'test'], to: '/weekly-tests', icon: '🧪', group: 'Weekly Test' }, { words: ['project'], to: '/projects', icon: '🚀', group: 'Projects' },
  { words: ['resume', 'cv', 'ats'], to: '/resume', icon: '📄', group: 'Resume' }, { words: ['mentor', 'chat', 'ai'], to: '/ai-mentor', icon: '🤖', group: 'AI Mentor' },
  { words: ['portfolio', 'photo', 'skill'], to: '/portfolio-manager', icon: '🖼️', group: 'Portfolio' }, { words: ['document', 'file', 'upload'], to: '/documents', icon: '🗂️', group: 'Documents' },
  { words: ['journal', 'learning'], to: '/journal', icon: '📓', group: 'Journal' }, { words: ['cert'], to: '/certifications', icon: '🏅', group: 'Certifications' },
];
function safeJson(raw) { try { return JSON.parse(raw); } catch { return raw; } }
function toText(v) { if (v == null) return ''; if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v); if (Array.isArray(v)) return v.map(toText).join(' '); if (typeof v === 'object') return Object.entries(v).map(([k, val]) => `${k} ${toText(val)}`).join(' '); return ''; }
function titleOf(v, fallback) { if (v && typeof v === 'object' && !Array.isArray(v)) return v.title || v.name || v.company || v.topic || v.question || v.prompt || v.label || fallback; return typeof v === 'string' ? v.slice(0, 70) : fallback; }
function routeFor(key, text) { const hay = `${key} ${text}`.toLowerCase(); return localRoutes.find(r => r.words.some(w => hay.includes(w))) || { to: '/dashboard', icon: '🔎', group: 'Saved Data' }; }
function rowsFromStorage(key, parsed) { const route = routeFor(key, toText(parsed)); const rows = []; const add = (value, label, path) => { const text = toText(value).replace(/\s+/g, ' ').trim(); if (!text || text.length < 2) return; rows.push({ id: `${key}-${path}`, label: titleOf(value, label), snippet: text.slice(0, 260), to: route.to, icon: route.icon, group: route.group, kind: 'Saved Local Data', storageKey: key, searchable: `${key} ${label} ${text}`.toLowerCase() }); }; if (Array.isArray(parsed)) parsed.slice(0, 300).forEach((item, i) => add(item, `${key} #${i + 1}`, i)); else if (parsed && typeof parsed === 'object') Object.entries(parsed).slice(0, 300).forEach(([subKey, value]) => add(value, subKey, subKey)); else add(parsed, key, 'value'); return rows; }
function getLocalSearchResults(query) { const q = query.toLowerCase().trim(); if (!q) return []; const results = []; try { for (let i = 0; i < localStorage.length; i += 1) { const key = localStorage.key(i); if (!key || ['theme', 'session'].includes(key)) continue; const raw = localStorage.getItem(key); if (!raw) continue; rowsFromStorage(key, safeJson(raw)).forEach(row => { if (row.searchable.includes(q)) results.push(row); }); } } catch { return []; } const unique = new Map(); results.forEach(r => { if (!unique.has(r.id)) unique.set(r.id, r); }); return [...unique.values()].slice(0, 12); }

function ThemeSwitcher() { const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'salesforce'); React.useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); }, [theme]); return <div className="themeSwitcher" aria-label="Theme selector">{['salesforce','glass','purple'].map(t => <button key={t} className={theme === t ? 'active' : ''} onClick={() => setTheme(t)} title={t}>{t === 'salesforce' ? '🔵' : t === 'glass' ? '🌙' : '🟣'}</button>)}</div>; }
function CommandBar() { const navigate = useNavigate(); const [q, setQ] = React.useState(''); const toolMatches = [...quickCommands, ...allTools].filter(x => `${x.label} ${x.group || ''}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6); const localMatches = React.useMemo(() => getLocalSearchResults(q), [q]); const open = (item) => { if (item.storageKey) localStorage.setItem('lastGlobalSearchResult', JSON.stringify(item)); setQ(''); navigate(item.to); }; return <div className="commandBar globalSearchBar"><span>⌘</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search saved data or open a tool..." />{q && <div className="commandMenu localSearchMenu"><div className="searchSectionTitle">Saved local data</div>{localMatches.length ? localMatches.map(item => <button key={item.id} className="localSearchResult" onClick={() => open(item)}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.kind} • {item.group} • key: {item.storageKey}</small><p>{item.snippet}</p></div></button>) : <div className="commandEmpty">No saved local data found for “{q}”. Save notes/answers/jobs first, then search here.</div>}<div className="searchSectionTitle">Tools and quick actions</div>{toolMatches.length ? toolMatches.map(item => <button key={`${item.label}-${item.to}`} onClick={() => open(item)}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.kind || 'Tool'}{item.group ? ` • ${item.group}` : ''}</small></div></button>) : <div className="commandEmpty">No tool matched.</div>}</div>}</div>; }
function FloatingActions() { const [open, setOpen] = React.useState(false); const actions = [['Save Note','/notes','📝'], ['Add Doubt','/doubts','❓'], ['Learning Plan','/zero-to-hero','🎯'], ['Automation','/final-premium','⚙️'], ['Ask Mentor','/ai-mentor','🤖'], ['Add Job','/job-tracker','💼']]; return <div className="fabWrap">{open && <div className="fabMenu">{actions.map(([label,to,icon]) => <Link key={to} to={to} onClick={() => setOpen(false)}><span>{icon}</span>{label}</Link>)}</div>}<button className="fab" onClick={() => setOpen(!open)}>{open ? '×' : '+'}</button></div>; }
function MobileBottomNav() { const items = [['🏠','/dashboard','Home'], ['🎯','/zero-to-hero','Plan'], ['✨','/focus','Focus'], ['💼','/job-tracker','Jobs'], ['🤖','/ai-mentor','Mentor']]; const location = useLocation(); return <nav className="mobileBottomNav">{items.map(([icon,to,label]) => <Link key={to} className={location.pathname === to ? 'active' : ''} to={to}><span>{icon}</span><small>{label}</small></Link>)}</nav>; }
function ToastCenter() { const [toasts, setToasts] = React.useState([]); React.useEffect(() => { const handler = e => { setToasts(t => [e.detail, ...t].slice(0, 3)); setTimeout(() => setToasts(t => t.filter(x => x.id !== e.detail.id)), 3200); }; window.addEventListener('mentor-toast', handler); return () => window.removeEventListener('mentor-toast', handler); }, []); return <div className="toastStack">{toasts.map(t => <div key={t.id} className={`toast ${t.type || 'success'}`}>{t.message}</div>)}</div>; }
export function Layout({ children }) { const hour = new Date().getHours(); const greet = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'; return <div className="appShell"><aside className="sidebar"><Link className="brand" to="/dashboard"><span>🤖</span><div><b>SFDC Mentor</b><small>Career OS</small></div></Link>{navGroups.map(group => <div className="navGroup" key={group.title}><h4>{group.title}</h4>{group.items.map(([label, to, icon]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'navItem active' : 'navItem'}><span>{icon}</span>{label}</NavLink>)}</div>)}</aside><main className="main"><header className="topbar premiumTopbar"><div className="topGreeting"><p>{greet}, Abhishek Kumar</p><b>Use Home Guide → Learning Plan → Daily Practice → Automation.</b></div><CommandBar/><div className="row topActions"><ThemeSwitcher/><Link className="btn cyan" to="/zero-to-hero">Learning Plan</Link><Link className="btn ghost" to="/portfolio">Portfolio</Link></div></header>{children}<ToastCenter/><FloatingActions/><MobileBottomNav/></main></div>; }
export function Page({ children }) { return <div className="page">{children}</div>; }
export function EmptyState({ title, text, action }) { return <div className="empty premiumEmpty"><div className="emptyIcon">✨</div><h3>{title}</h3><p>{text}</p>{action}</div>; }
