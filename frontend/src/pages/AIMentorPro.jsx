import React from 'react';
import { Layout, Page, Hero, Card } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';
import { roadmap90 } from '../data/roadmap';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://sfdc-mentor-backend.onrender.com';

const MODES = ['Salesforce Mentor','Interview Coach','Project Explanation','Resume Bullet','Daily Study Planner','Weak Topic Fixer','DSA Hint Only','System Design'];
const LEVELS = ['Beginner','Intermediate','2+ Years','Advanced'];
const TONES = ['Professional English','Simple English','Hinglish','Deep Technical'];
const ENGINES = ['Smart Local Mentor','Ollama Local AI'];
const TEMPLATES = [
  'Explain Apex Trigger with bulk-safe handler pattern and interview answer',
  'Create today 8-hour Salesforce + DSA + System Design study plan',
  'Explain my Salesforce project for interview',
  'Make my answer STAR format and professional',
  'Give Salesforce Flow vs Apex scenario answer',
  'Create mock interview questions for 2+ years Salesforce Developer',
  'Convert my project into resume bullet points',
  'Fix my weak topic and give revision plan'
];

function rows(key, fallback) {
  const value = readStore(key, fallback);
  return Array.isArray(value) ? value : Object.values(value || {});
}

function textOf(item) {
  return `${item?.title || ''} ${item?.body || ''} ${item?.answer || ''} ${item?.text || ''} ${item?.task || ''} ${item?.notes || ''}`.trim();
}

function countAnswers() {
  const stores = ['answers','focusAnswers','interviewAnswers','interviewAnswersV2','weeklyAnswers','interviewProAnswers'];
  return stores.reduce((sum, key) => sum + rows(key, {}).filter(item => textOf(item).length > 20).length, 0);
}

function getContext() {
  const day = Number(readStore('mentorDay', readStore('timeCurrentDay', 1))) || 1;
  const route = roadmap90[(day - 1) % roadmap90.length] || roadmap90[0];
  const weakStrong = readStore('weakStrong', {});
  const jobs = rows('jobs', []);
  const allTasks = readStore('timeTasksByDay', {});
  const tasks = allTasks[day] || readStore('timeTasks', []);
  const recentNotes = rows('notes', []).slice(-5).map(textOf).filter(Boolean);
  const recentDoubts = rows('doubts', []).slice(-5).map(textOf).filter(Boolean);
  const recentAnswers = rows('interviewProAnswers', {}).slice(-5).map(textOf).filter(Boolean);
  return {
    day,
    route,
    weak: Object.values(weakStrong).filter(x => x === 'Weak').length,
    strong: Object.values(weakStrong).filter(x => x === 'Strong').length,
    applied: jobs.filter(j => j.applied || j.status === 'Applied').length,
    savedAnswers: countAnswers(),
    completed: Array.isArray(tasks) ? tasks.filter(t => t.done).length : 0,
    total: Array.isArray(tasks) ? tasks.length : 0,
    recentNotes,
    recentDoubts,
    recentAnswers
  };
}

function findSaved(question) {
  const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let best = null;
  ['answers','focusAnswers','interviewProAnswers','notes','doubts','journal','projects'].forEach(key => {
    rows(key, {}).forEach(item => {
      const text = textOf(item).toLowerCase();
      const score = words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
      if (score > 0 && (!best || score > best.score)) best = { key, item, score };
    });
  });
  return best && best.score >= 2 ? best : null;
}

function topic(question) {
  const q = question.toLowerCase();
  if (q.includes('trigger')) return 'Apex Trigger';
  if (q.includes('lwc')) return 'Lightning Web Component';
  if (q.includes('flow')) return 'Salesforce Flow';
  if (q.includes('soql')) return 'SOQL';
  if (q.includes('security') || q.includes('sharing')) return 'Security and Sharing';
  if (q.includes('api') || q.includes('integration')) return 'Integration';
  if (q.includes('dsa')) return 'DSA';
  if (q.includes('system design')) return 'System Design';
  if (q.includes('project')) return 'Project Explanation';
  if (q.includes('resume')) return 'Resume';
  return 'Salesforce Career';
}

function sec(title, body) {
  return `## ${title}\n${body}`;
}

function makeLocalAnswer(question, mode, level, tone, ctx, saved) {
  const top = topic(question);
  if (saved) {
    return `${sec('Found From Your Saved Data', `${saved.key}:\n${textOf(saved.item)}`)}\n\n${sec('Professional Improvement', 'Rewrite it with clear context, exact action, testing/security point, result/impact, and a 60-second interview close.')}\n\n${sec('Next Action', 'Save the improved version to Notes, then mark the topic Weak or Strong.')}`;
  }
  if (mode === 'DSA Hint Only') {
    return `${sec('Pattern Hint', `Question: ${question}\nIdentify the pattern first: array, string, hashmap, two-pointer, sliding-window, stack, recursion or DP.`)}\n\n${sec('Do This', '1. Write brute force idea.\n2. Identify repeated work.\n3. Choose the right data structure.\n4. Dry run with two examples.\n5. Write time and space complexity.')}`;
  }
  if (mode === 'Daily Study Planner') {
    return `${sec('Today Command Plan', `Day ${ctx.day}: ${ctx.route?.phase || 'Career Sprint'}`)}\n\n${sec('8-Hour Split', `1. Salesforce Core: ${ctx.route?.salesforce}\n2. DSA: ${ctx.route?.dsa}\n3. System Design: ${ctx.route?.systemDesign}\n4. Project: ${ctx.route?.projectTask}\n5. Interview: ${ctx.route?.interviewTask}\n6. Revision: weak topics = ${ctx.weak}`)}\n\n${sec('Proof Required', 'Save one answer, complete one project/task block, add one note, and update 24 Hours Tracker.')}`;
  }
  if (mode === 'Resume Bullet') {
    return `${sec('Resume Bullets', `• Designed and implemented ${top} solution using Salesforce best practices, improving maintainability and delivery confidence.\n• Built secure and scalable CRM functionality with testing, documentation and deployment readiness.\n• Collaborated with stakeholders to convert requirements into measurable Salesforce outcomes.`)}\n\n${sec('Improve With Metrics', 'Add numbers: reduced manual effort, improved deployment quality, saved hours, improved visibility, or increased test coverage.')}`;
  }
  if (mode === 'Interview Coach') {
    return `${sec('Interview-Ready Answer', `For ${top}, answer like a ${level} Salesforce Developer.`)}\n\n${sec('STAR Format', `S: In a Salesforce project, the business needed a reliable solution for ${question}.\nT: My responsibility was to design, implement, test and explain the solution.\nA: I followed best practices: reusable design, security check, testing, error handling and deployment readiness.\nR: This improved maintainability, reduced manual effort and made the feature production-ready.`)}\n\n${sec('Likely Follow-ups', '1. How did you test it?\n2. What governor limits/security risks did you consider?\n3. How would you debug it in production?\n4. Why this approach instead of another?')}`;
  }
  let answer = `${sec('Simple Explanation', `${top} means solving this question in a practical Salesforce/project context: ${question}. Focus on what it is, why it is used, and how it helps the business.`)}\n\n${sec('Real Salesforce Project Use Case', `In a CRM project, ${top} can automate work, improve data quality, secure access, integrate systems, or make users more productive.`)}\n\n${sec('Step-by-Step Implementation', '1. Understand the requirement and impacted users.\n2. Identify object/data model and security.\n3. Choose the right tool: Flow, Apex, LWC, SOQL, Integration or Report.\n4. Build a small, reusable, testable solution.\n5. Test positive, negative and bulk/edge cases.\n6. Deploy with validation and rollback plan.')}\n\n${sec('Best Practices', '• Keep logic reusable and readable.\n• Respect CRUD/FLS/sharing/security.\n• Avoid governor limit issues.\n• Add meaningful tests and assertions.\n• Document business impact.')}\n\n${sec('Interview Answer', `I would explain ${top} with a real project example. First, I clarify the business requirement, then choose the right Salesforce approach, implement it with best practices, test edge cases, and deploy safely. My focus is security, scalability and measurable business impact.`)}\n\n${sec('Common Mistakes', '1. Giving textbook answer only.\n2. Missing security/testing.\n3. Not explaining business impact.\n4. Ignoring governor limits or edge cases.')}\n\n${sec('Your Next Action', `Today: complete Day ${ctx.day} route, save one answer, update 24 Hours Tracker, and revise weak topics (${ctx.weak}).`)}`;
  if (tone === 'Hinglish') answer += `\n\n${sec('Hinglish Summary', 'Interview mein answer simple rakho: concept kya hai, project mein kahan use kiya, tumne kya implement kiya, testing/security kaise handle kiya, aur result kya mila.')}`;
  return answer;
}

function buildOllamaPrompt(question, mode, level, tone, ctx, saved) {
  return `You are Abhishek's personal Salesforce Career Mentor. Do not give generic repeated template answers. Use the user's app data and answer exactly for the question.\n\nUSER APP CONTEXT:\nCurrent Day: ${ctx.day}\nToday Phase: ${ctx.route?.phase || ''}\nSalesforce Topic: ${ctx.route?.salesforce || ''}\nDSA Topic: ${ctx.route?.dsa || ''}\nSystem Design Topic: ${ctx.route?.systemDesign || ''}\nWeak Topics Count: ${ctx.weak}\nStrong Topics Count: ${ctx.strong}\nSaved Answers Count: ${ctx.savedAnswers}\nJobs Applied: ${ctx.applied}\n24h Tracker Progress: ${ctx.completed}/${ctx.total}\nRecent Notes: ${(ctx.recentNotes || []).join(' | ')}\nRecent Doubts: ${(ctx.recentDoubts || []).join(' | ')}\nRecent Answers: ${(ctx.recentAnswers || []).join(' | ')}\nMatched Saved Data: ${saved ? `${saved.key}: ${textOf(saved.item)}` : 'none'}\n\nRESPONSE RULES:\nMode: ${mode}\nCandidate Level: ${level}\nTone: ${tone}\nAnswer must be specific, not generic.\nUse Salesforce project examples wherever possible.\nUse this structure only when useful: Simple Explanation, Real Project Use Case, Step-by-Step, Interview Answer, Mistakes, Next Action.\nKeep answer practical and interview-ready.\n\nQUESTION:\n${question}`;
}

function links(question) {
  const e = encodeURIComponent(question);
  return [
    ['Salesforce Docs', `https://developer.salesforce.com/docs?q=${e}`],
    ['Trailhead', `https://trailhead.salesforce.com/search?keywords=${e}`],
    ['StackExchange', `https://salesforce.stackexchange.com/search?q=${e}`],
    ['Google', `https://www.google.com/search?q=${e}`]
  ];
}

export function AIMentorPro() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState(null);
  const [mode, setMode] = React.useState('Salesforce Mentor');
  const [level, setLevel] = React.useState('2+ Years');
  const [tone, setTone] = React.useState('Professional English');
  const [engine, setEngine] = React.useState('Ollama Local AI');
  const [useSaved, setUseSaved] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState({ backend: 'checking', ollama: 'checking' });
  const [toast, setToast] = React.useState('');
  const ctx = getContext();

  React.useEffect(() => { checkStatus(); }, []);
  React.useEffect(() => { if (toast) { const id = setTimeout(() => setToast(''), 2200); return () => clearTimeout(id); } }, [toast]);

  async function checkStatus() {
    try { const r = await fetch(`${API_BASE}/api/health`); setStatus(s => ({ ...s, backend: r.ok ? 'online' : 'offline' })); } catch { setStatus(s => ({ ...s, backend: 'offline' })); }
    try { const r = await fetch(`${API_BASE}/api/ollama-status`); const d = await r.json(); setStatus(s => ({ ...s, ollama: d.model_available ? 'online' : 'offline' })); } catch { setStatus(s => ({ ...s, ollama: 'offline' })); }
  }

  async function ask() {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    const current = getContext();
    const saved = useSaved ? findSaved(q) : null;
    let text = '';
    let source = 'smart-local';
    if (engine === 'Ollama Local AI') {
      try {
        const prompt = buildOllamaPrompt(q, mode, level, tone, current, saved);
        const response = await fetch(`${API_BASE}/api/mentor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: prompt, mode: 'ollama', context: current })
        });
        const data = await response.json();
        if (data.ok && data.answer && !String(data.answer).includes('Ollama unavailable')) {
          text = data.answer;
          source = data.source || 'ollama';
        }
      } catch {
        source = 'ollama-offline-fallback';
      }
    }
    if (!text) text = makeLocalAnswer(q, mode, level, tone, current, saved);
    setAnswer({ text, prompt: q, time: new Date().toLocaleString(), source, links: links(q) });
    setQuestion('');
    setLoading(false);
    setToast(source === 'ollama' ? 'Ollama answer generated' : 'Fallback answer generated');
  }

  function saveNote() {
    if (!answer) return;
    const notes = readStore('notes', []);
    writeStore('notes', [...notes, { id: Date.now(), title: answer.prompt, body: answer.text, status: 'Mentor', createdAt: new Date().toLocaleString() }]);
    setToast('Saved to Notes');
  }

  function mark(value) {
    const weakStrong = readStore('weakStrong', {});
    writeStore('weakStrong', { ...weakStrong, [`mentor-${Date.now()}`]: value });
    setToast(`Marked ${value}`);
  }

  const cards = [['Current Day', `Day ${ctx.day}`, ctx.route?.phase], ['Saved Answers', ctx.savedAnswers, 'Interview proof'], ['Weak Topics', ctx.weak, 'Revise first'], ['Jobs Applied', ctx.applied, 'Career pipeline']];
  return <Layout><Page><Hero title="AI Mentor Agent Pro" subtitle="Connected to Ollama when available, with your app data added as context for exact answers."><div className="mentorStatus"><span className={status.backend === 'online' ? 'online' : 'offline'}>Backend {status.backend}</span><span className={status.ollama === 'online' ? 'online' : 'offline'}>Ollama {status.ollama}</span><span className="online">Context ready</span><button className="btn small ghost" onClick={checkStatus}>Refresh</button></div></Hero>{toast && <div className="toast">✅ {toast}</div>}<div className="mentorBrainCards">{cards.map(([a,b,c]) => <div key={a}><b>{b}</b><span>{a}</span><small>{c}</small></div>)}</div><Card title="Professional Mentor Setup" subtitle="Use Ollama Local AI for real AI answers. Smart Local is only fallback."><div className="mentorControls mentorControlsPro"><select value={mode} onChange={e => setMode(e.target.value)}>{MODES.map(x => <option key={x}>{x}</option>)}</select><select value={level} onChange={e => setLevel(e.target.value)}>{LEVELS.map(x => <option key={x}>{x}</option>)}</select><select value={tone} onChange={e => setTone(e.target.value)}>{TONES.map(x => <option key={x}>{x}</option>)}</select><select value={engine} onChange={e => setEngine(e.target.value)}>{ENGINES.map(x => <option key={x}>{x}</option>)}</select><label className="toggleLine"><input type="checkbox" checked={useSaved} onChange={e => setUseSaved(e.target.checked)} /> Use my saved app data first</label></div></Card><Card title="Ask Mentor" subtitle="Ollama receives your current day, weak topics, saved answers, notes, doubts and tracker context."><textarea className="mentorProTextarea" value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) ask(); }} placeholder="Example: Explain Apex trigger with bulk-safe handler pattern, project use case and interview answer..."/><div className="row"><button className="btn cyan" disabled={loading} onClick={ask}>{loading ? 'Thinking with Ollama...' : 'Ask Mentor'}</button><button className="btn ghost" onClick={() => setQuestion(`Create today's study plan for Day ${ctx.day}`)}>Today Plan</button><button className="btn ghost" onClick={() => setQuestion('Explain my Salesforce project in interview format')}>Project Answer</button><button className="btn ghost" onClick={() => setQuestion('Make this answer STAR format and professional')}>STAR Answer</button><button className="btn ghost" onClick={() => setQuestion('')}>Clear</button></div></Card>{answer ? <Card title="Professional Mentor Answer" subtitle={`${answer.source} • ${answer.time}`}><div className="promptChip">Prompt used: {answer.prompt}</div><pre className="mentorProAnswer">{answer.text}</pre><div className="linkCards">{answer.links.map(([t,u]) => <a key={u} href={u} target="_blank">{t}</a>)}</div><div className="mentorActions"><button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(answer.text)}>Copy</button><button className="btn small ghost" onClick={() => downloadText('mentor-answer.txt', answer.text)}>Export</button><button className="btn small cyan" onClick={saveNote}>Save Notes</button><button className="btn small ghost" onClick={() => mark('Weak')}>Weak</button><button className="btn small ghost" onClick={() => mark('Strong')}>Strong</button><button className="btn small danger" onClick={() => setAnswer(null)}>Delete</button></div></Card> : <Card title="Ready to mentor you with Ollama context" subtitle="Use the templates below or ask your own question."><div className="promptGrid">{TEMPLATES.map(p => <button key={p} className="btn ghost" onClick={() => setQuestion(p)}>{p}</button>)}</div></Card>}</Page></Layout>;
}
