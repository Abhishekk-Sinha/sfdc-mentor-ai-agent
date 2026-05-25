import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CareerWatch } from './CareerWatch';
import {
  FLOATING_ACTIONS,
  LOCAL_SEARCH_ROUTES,
  MOBILE_NAV_ITEMS,
  NAV_GROUPS,
  QUICK_COMMANDS,
} from '../config/navigationConfig';

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
  const percentage = Math.max(0, Math.min(100, Math.round(value || 0)));
  return <div className="progress"><i style={{ width: `${percentage}%` }} /><b>{percentage}%</b></div>;
}

export function Field({ label, value, onChange, type = 'text', area = false, placeholder = '' }) {
  return <label className="field"><span>{label}</span>{area ? <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /> : <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />}</label>;
}

export const navGroups = NAV_GROUPS.map(group => ({
  ...group,
  items: group.items.map(item => [item.label, item.to, item.icon]),
}));

const allTools = NAV_GROUPS.flatMap(group => group.items.map(item => ({ ...item, group: group.title, kind: 'Tool' })));

function safeJson(raw) {
  try { return JSON.parse(raw); } catch { return raw; }
}

function toText(value) {
  if (value == null) return '';
  if (['string', 'number', 'boolean'].includes(typeof value)) return String(value);
  if (Array.isArray(value)) return value.map(toText).join(' ');
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${key} ${toText(item)}`).join(' ');
  return '';
}

function titleOf(value, fallback) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value.title || value.name || value.company || value.topic || value.question || value.prompt || value.label || fallback;
  return typeof value === 'string' ? value.slice(0, 70) : fallback;
}

function routeFor(storageKey, text) {
  const haystack = `${storageKey} ${text}`.toLowerCase();
  return LOCAL_SEARCH_ROUTES.find(route => route.words.some(word => haystack.includes(word))) || { to: '/dashboard', icon: '🔎', group: 'Saved Data' };
}

function rowsFromStorage(storageKey, parsed) {
  const route = routeFor(storageKey, toText(parsed));
  const rows = [];
  const addRow = (value, label, path) => {
    const text = toText(value).replace(/\s+/g, ' ').trim();
    if (!text || text.length < 2) return;
    rows.push({
      id: `${storageKey}-${path}`,
      label: titleOf(value, label),
      snippet: text.slice(0, 260),
      to: route.to,
      icon: route.icon,
      group: route.group,
      kind: 'Saved Local Data',
      storageKey,
      searchable: `${storageKey} ${label} ${text}`.toLowerCase(),
    });
  };
  if (Array.isArray(parsed)) parsed.slice(0, 300).forEach((item, index) => addRow(item, `${storageKey} #${index + 1}`, index));
  else if (parsed && typeof parsed === 'object') Object.entries(parsed).slice(0, 300).forEach(([key, value]) => addRow(value, key, key));
  else addRow(parsed, storageKey, 'value');
  return rows;
}

function getLocalSearchResults(query) {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  const results = [];
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || ['theme', 'session'].includes(key)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      rowsFromStorage(key, safeJson(raw)).forEach(row => {
        if (row.searchable.includes(normalizedQuery)) results.push(row);
      });
    }
  } catch {
    return [];
  }
  const unique = new Map();
  results.forEach(result => { if (!unique.has(result.id)) unique.set(result.id, result); });
  return [...unique.values()].slice(0, 12);
}

// Silent automation keeps the app helpful without showing a confusing automation page.
function runSilentCareerAutomation() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const date = new Date();
    const week = `${date.getFullYear()}-W${Math.ceil((((date - new Date(date.getFullYear(), 0, 1)) / 86400000) + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
    const history = safeJson(localStorage.getItem('silentAutomationHistory') || '{}') || {};
    const notifications = safeJson(localStorage.getItem('silentNotifications') || '[]') || [];
    const weakStrong = safeJson(localStorage.getItem('weakStrong') || '{}') || {};
    const weakTopics = Object.entries(weakStrong).filter(([, status]) => status === 'Weak').map(([topic]) => topic);
    const strongTopics = Object.entries(weakStrong).filter(([, status]) => status === 'Strong').map(([topic]) => topic);
    const addNotification = (text, type = 'auto') => notifications.unshift({ id: Date.now() + Math.random(), text, type, date: new Date().toLocaleString() });

    if (history.daily !== today) {
      localStorage.setItem('autoTodayPlan', JSON.stringify([weakTopics[0] ? `Revise weak topic: ${weakTopics[0]}` : 'Learn one Salesforce concept', 'Solve one practice set and save the answer', 'Ask AI Mentor one doubt', 'Track proof in 24h Tracker']));
      localStorage.setItem('autoWeakRevisionQueue', JSON.stringify(weakTopics.slice(0, 8)));
      localStorage.setItem('autoStrongMaintenanceQueue', JSON.stringify(strongTopics.slice(0, 8)));
      localStorage.setItem('autoFocusSprint', JSON.stringify({ minutes: 45, topic: weakTopics[0] || 'Salesforce basics', date: today }));
      localStorage.setItem('autoInterviewQuestionOfDay', `Explain ${weakTopics[0] || 'Flow vs Apex'} with one real project example.`);
      addNotification('Daily learning plan updated automatically.', 'daily');
      history.daily = today;
    }

    if (new Date().getDay() === 0 && history.sunday !== week) {
      localStorage.setItem('autoSundayTest', JSON.stringify(['Salesforce security scenario', 'Apex trigger scenario', 'Flow fault path case', 'LWC communication answer', 'Integration retry strategy', 'DSA pattern question', 'System design question', 'Project STAR answer', 'Resume bullet improvement', 'Three job follow-ups']));
      addNotification('Sunday mixed test generated automatically.', 'weekly');
      history.sunday = week;
    }

    if (history.weeklyBackup !== week) {
      addNotification('Weekly backup reminder created automatically.', 'backup');
      history.weeklyBackup = week;
    }

    localStorage.setItem('silentNotifications', JSON.stringify(notifications.slice(0, 50)));
    localStorage.setItem('silentAutomationHistory', JSON.stringify(history));
    localStorage.setItem('automationLastRun', new Date().toLocaleString());
  } catch (error) {
    console.warn('Silent automation skipped', error);
  }
}

function ThemeSwitcher() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'salesforce');
  React.useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); }, [theme]);
  return <div className="themeSwitcher" aria-label="Theme selector">{['salesforce', 'glass', 'purple'].map(themeName => <button key={themeName} className={theme === themeName ? 'active' : ''} onClick={() => setTheme(themeName)} title={themeName}>{themeName === 'salesforce' ? '🔵' : themeName === 'glass' ? '🌙' : '🟣'}</button>)}</div>;
}

function CommandBar() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const toolMatches = [...QUICK_COMMANDS, ...allTools].filter(item => `${item.label} ${item.group || ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  const localMatches = React.useMemo(() => getLocalSearchResults(query), [query]);
  const open = item => {
    if (item.storageKey) localStorage.setItem('lastGlobalSearchResult', JSON.stringify(item));
    setQuery('');
    navigate(item.to);
  };
  return <div className="commandBar globalSearchBar"><span>⌘</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search saved data or open a tool..." />{query && <div className="commandMenu localSearchMenu"><div className="searchSectionTitle">Saved local data</div>{localMatches.length ? localMatches.map(item => <button key={item.id} className="localSearchResult" onClick={() => open(item)}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.kind} - {item.group} - key: {item.storageKey}</small><p>{item.snippet}</p></div></button>) : <div className="commandEmpty">No saved local data found for "{query}". Save notes/answers/jobs first, then search here.</div>}<div className="searchSectionTitle">Tools and quick actions</div>{toolMatches.length ? toolMatches.map(item => <button key={`${item.label}-${item.to}`} onClick={() => open(item)}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.kind || 'Tool'}{item.group ? ` - ${item.group}` : ''}</small></div></button>) : <div className="commandEmpty">No tool matched.</div>}</div>}</div>;
}

function FloatingActions() {
  const [open, setOpen] = React.useState(false);
  return <div className="fabWrap">{open && <div className="fabMenu">{FLOATING_ACTIONS.map(action => <Link key={action.to} to={action.to} onClick={() => setOpen(false)}><span>{action.icon}</span>{action.label}</Link>)}</div>}<button className="fab" onClick={() => setOpen(!open)}>{open ? '×' : '+'}</button></div>;
}

function DraggableCareerWatch() {
  const [visible, setVisible] = React.useState(() => localStorage.getItem('careerWatchHidden') !== 'true');
  const [minimized, setMinimized] = React.useState(() => localStorage.getItem('careerWatchMinimized') === 'true');
  const [position, setPosition] = React.useState(() => safeJson(localStorage.getItem('careerWatchPosition') || '{"x":24,"y":120}'));
  const dragRef = React.useRef(null);

  React.useEffect(() => { localStorage.setItem('careerWatchHidden', String(!visible)); }, [visible]);
  React.useEffect(() => { localStorage.setItem('careerWatchMinimized', String(minimized)); }, [minimized]);
  React.useEffect(() => { localStorage.setItem('careerWatchPosition', JSON.stringify(position)); }, [position]);

  function startDrag(event) {
    const point = event.touches?.[0] || event;
    dragRef.current = { startX: point.clientX, startY: point.clientY, baseX: position.x, baseY: position.y };
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);
  }

  function onDrag(event) {
    if (!dragRef.current) return;
    event.preventDefault?.();
    const point = event.touches?.[0] || event;
    const nextX = Math.max(8, Math.min(window.innerWidth - 330, dragRef.current.baseX + point.clientX - dragRef.current.startX));
    const nextY = Math.max(72, Math.min(window.innerHeight - 170, dragRef.current.baseY + point.clientY - dragRef.current.startY));
    setPosition({ x: nextX, y: nextY });
  }

  function stopDrag() {
    dragRef.current = null;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchmove', onDrag);
    window.removeEventListener('touchend', stopDrag);
  }

  if (!visible) return <button className="careerWatchShowBtn" onClick={() => setVisible(true)}>⏱️ Career Watch</button>;
  return <div className={minimized ? 'floatingCareerWatch minimized' : 'floatingCareerWatch'} style={{ left: position.x, top: position.y }}>
    <div className="floatingWatchHandle" onMouseDown={startDrag} onTouchStart={startDrag}>
      <span>⠿ Career Watch</span>
      <div><button onClick={() => setMinimized(!minimized)}>{minimized ? 'Open' : 'Min'}</button><button onClick={() => setVisible(false)}>Hide</button></div>
    </div>
    {!minimized && <CareerWatch compact />}
  </div>;
}

function MobileBottomNav() {
  const location = useLocation();
  return <nav className="mobileBottomNav">{MOBILE_NAV_ITEMS.map(item => <Link key={item.to} className={location.pathname === item.to ? 'active' : ''} to={item.to}><span>{item.icon}</span><small>{item.label}</small></Link>)}</nav>;
}

function ToastCenter() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    const handler = event => {
      setToasts(current => [event.detail, ...current].slice(0, 3));
      setTimeout(() => setToasts(current => current.filter(item => item.id !== event.detail.id)), 3200);
    };
    window.addEventListener('mentor-toast', handler);
    return () => window.removeEventListener('mentor-toast', handler);
  }, []);
  return <div className="toastStack">{toasts.map(toast => <div key={toast.id} className={`toast ${toast.type || 'success'}`}>{toast.message}</div>)}</div>;
}

function Sidebar() {
  return <aside className="sidebar"><Link className="brand" to="/dashboard"><span>🤖</span><div><b>SFDC Mentor</b><small>Career OS</small></div></Link>{NAV_GROUPS.map(group => <div className="navGroup" key={group.title}><h4>{group.title}</h4>{group.items.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'navItem active' : 'navItem'}><span>{item.icon}</span>{item.label}</NavLink>)}</div>)}</aside>;
}

function Topbar() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  return <header className="topbar premiumTopbar"><div className="topGreeting"><p>{greeting}, Abhishek Kumar</p><b>Build skills. Save proof. Track progress.</b></div><CommandBar/><div className="row topActions"><ThemeSwitcher/><Link className="btn cyan" to="/practice">Question Bank</Link><Link className="btn ghost" to="/portfolio">Portfolio</Link></div></header>;
}

export function Layout({ children }) {
  React.useEffect(() => { runSilentCareerAutomation(); }, []);
  return <div className="appShell"><Sidebar/><main className="main"><Topbar/>{children}<ToastCenter/><DraggableCareerWatch/><FloatingActions/><MobileBottomNav/></main></div>;
}

export function Page({ children }) { return <div className="page">{children}</div>; }
export function EmptyState({ title, text, action }) { return <div className="empty premiumEmpty"><div className="emptyIcon">✨</div><h3>{title}</h3><p>{text}</p>{action}</div>; }
