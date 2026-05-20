import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Page, Card, Hero } from '../components/UI';

function safeJson(raw) { try { return JSON.parse(raw); } catch { return raw; } }
function toText(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(toText).join(' ');
  if (typeof v === 'object') return Object.entries(v).map(([k, val]) => `${k}: ${toText(val)}`).join(' | ');
  return '';
}
function titleOf(v, fallback) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v.title || v.name || v.company || v.topic || v.question || v.prompt || v.label || fallback;
  return typeof v === 'string' ? v.slice(0, 70) : fallback;
}
function routeFor(key, text) {
  const hay = `${key} ${text}`.toLowerCase();
  const rules = [
    [['note'], '/notes', '📝', 'Notes'], [['doubt'], '/doubts', '❓', 'Doubts'], [['job','compan','applied'], '/job-tracker', '💼', 'Jobs'],
    [['time','hour','task'], '/time-tracker', '⏱️', 'Time'], [['answer','focus','weak','strong'], '/focus', '✨', 'Answers'],
    [['interview','mock'], '/interview', '🎤', 'Interview'], [['weekly','test'], '/weekly-tests', '🧪', 'Weekly Test'],
    [['project'], '/projects', '🚀', 'Projects'], [['resume','cv','ats'], '/resume', '📄', 'Resume'], [['mentor','chat','ai'], '/ai-mentor', '🤖', 'AI Mentor'],
    [['portfolio','photo','skill'], '/portfolio-manager', '🖼️', 'Portfolio'], [['document','file','upload'], '/documents', '🗂️', 'Documents'],
    [['journal'], '/journal', '📓', 'Journal'], [['cert'], '/certifications', '🏅', 'Certifications']
  ];
  const found = rules.find(([words]) => words.some(w => hay.includes(w)));
  return found ? { to: found[1], icon: found[2], group: found[3] } : { to: '/dashboard', icon: '🔎', group: 'Saved Data' };
}
function rowsFromStorage(key, parsed) {
  const route = routeFor(key, toText(parsed));
  const rows = [];
  const add = (value, label, path) => {
    const text = toText(value).replace(/\s+/g, ' ').trim();
    if (!text || text.length < 2 || text.startsWith('data:image')) return;
    rows.push({ id: `${key}-${path}`, label: titleOf(value, label), snippet: text.slice(0, 700), full: text, to: route.to, icon: route.icon, group: route.group, storageKey: key, searchable: `${key} ${label} ${text}`.toLowerCase() });
  };
  if (Array.isArray(parsed)) parsed.slice(0, 500).forEach((item, i) => add(item, `${key} #${i + 1}`, i));
  else if (parsed && typeof parsed === 'object') Object.entries(parsed).slice(0, 500).forEach(([subKey, value]) => add(value, subKey, subKey));
  else add(parsed, key, 'value');
  return rows;
}
function getAllRows(query = '') {
  const q = query.toLowerCase().trim();
  const rows = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || ['theme','session','profilePhoto'].includes(key)) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    rowsFromStorage(key, safeJson(raw)).forEach(row => { if (!q || row.searchable.includes(q)) rows.push(row); });
  }
  const unique = new Map();
  rows.forEach(r => { if (!unique.has(r.id)) unique.set(r.id, r); });
  return [...unique.values()];
}

export function SearchResults() {
  const last = safeJson(localStorage.getItem('lastGlobalSearchResult') || 'null');
  const [query, setQuery] = React.useState(last?.label || '');
  const rows = React.useMemo(() => getAllRows(query), [query]);
  const groups = rows.reduce((acc, row) => { acc[row.group] = (acc[row.group] || 0) + 1; return acc; }, {});
  return <Layout><Page>
    <Hero title="Global Saved Data Search" subtitle="Yahan localStorage mein saved notes, answers, doubts, jobs, tests, projects aur mentor chats sab ek jagah search hote hain.">
      <div className="scoreMini"><b>{rows.length}</b><span>Results</span></div>
    </Hero>
    <Card title="Search locally saved data" subtitle="Search is offline-first. Jo browser localStorage mein save hai, wahi yahan milega.">
      <div className="premiumSearchInput"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search apex, flow, company, doubt, answer, project..." autoFocus/><button className="btn ghost" onClick={() => setQuery('')}>Clear</button></div>
      <div className="searchGroupPills">{Object.entries(groups).map(([g,c]) => <span key={g}>{g}: {c}</span>)}</div>
    </Card>
    <div className="globalResultGrid">
      {rows.length ? rows.slice(0, 80).map(row => <Card key={row.id} className="globalResultCard" title={`${row.icon} ${row.label}`} subtitle={`${row.group} • key: ${row.storageKey}`} action={<Link className="btn small cyan" to={row.to}>Open Page</Link>}><p>{row.snippet}</p></Card>) : <Card title="No saved result found"><p>Abhi is keyword se saved local data nahi mila. Pehle notes, answers, jobs, doubts ya projects save karo.</p><Link className="btn cyan" to="/notes">Save Note</Link></Card>}
    </div>
  </Page></Layout>;
}
