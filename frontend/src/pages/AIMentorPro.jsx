import React from 'react';
import { Layout, Page, Hero, Card } from '../components/UI';
import './ai-mentor-pro.css';

const API_CANDIDATES = [
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'https://sfdc-mentor-backend.onrender.com'
];

function withTimeout(ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

async function findBestBackend() {
  for (const base of API_CANDIDATES) {
    const t = withTimeout(5000);
    try {
      const response = await fetch(base + '/api/ollama-status?ts=' + Date.now(), { signal: t.signal });
      const data = await readJson(response);
      t.done();
      if (data && data.model_available === true) return { base, status: data, label: 'AI Mentor Pro v3 · Local Ollama + RAG' };
    } catch { t.done(); }
  }
  for (const base of API_CANDIDATES) {
    const t = withTimeout(5000);
    try {
      const response = await fetch(base + '/api/health?ts=' + Date.now(), { signal: t.signal });
      const data = await readJson(response);
      t.done();
      if (response.ok || data?.ok) return { base, status: data, label: 'AI Mentor Pro v3 · RAG backend' };
    } catch { t.done(); }
  }
  return { base: API_CANDIDATES[0], status: null, label: 'AI Mentor Pro v3' };
}

function cleanAnswer(data) {
  if (!data) return '';
  return String(data.answer || data.response || data.text || '').trim();
}

function collectLocalContext() {
  const keys = Object.keys(localStorage || {});
  const important = keys.filter(k => /sfdc|mentor|answer|project|resume|weak|tracker|routine|calendar|proof|interview|job|dsa|system/i.test(k)).slice(0, 100);
  const snapshot = {};
  important.forEach(k => {
    try {
      const v = localStorage.getItem(k);
      snapshot[k] = v && v.length > 2500 ? v.slice(0, 2500) : v;
    } catch {}
  });
  return {
    role: 'Salesforce Developer',
    user: 'Abhishek',
    source: 'AI Mentor Pro v3',
    supportedDomains: ['Salesforce', 'Apex', 'LWC', 'Flow', 'SOQL', 'DSA', 'System Design', 'Interview', 'Resume', 'Projects', 'AI technology news'],
    localStorageKeys: important,
    localStorageSnapshot: snapshot
  };
}

function fallbackAnswer(question) {
  return `AI Mentor Pro answer\n\nI could not connect to the full AI backend right now, but here is the professional structure for your question:\n\n${question}\n\n1. Explain the direct definition.\n2. Connect it with a project or interview use case.\n3. Mention implementation approach.\n4. Add testing, edge cases and best practices.\n5. Finish with business impact.\n\nFor best dynamic answers, keep backend + Ollama running locally.`;
}

function renderInline(text, keyPrefix) {
  const parts = [];
  const regex = /(https?:\/\/[^\s)]+)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) {
      parts.push(<a key={`${keyPrefix}-url-${match.index}`} href={match[1]} target="_blank" rel="noreferrer">{match[1]}</a>);
    } else if (match[2] && match[3]) {
      parts.push(<a key={`${keyPrefix}-md-${match.index}`} href={match[3]} target="_blank" rel="noreferrer">{match[2]}</a>);
    } else if (match[4]) {
      parts.push(<strong key={`${keyPrefix}-b-${match.index}`}>{match[4]}</strong>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMentorAnswer(answer) {
  const lines = String(answer || '').split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="mentorBlank" />;
    if (/^#{1,3}\s+/.test(trimmed)) return <h3 key={i}>{renderInline(trimmed.replace(/^#{1,3}\s+/, ''), `h-${i}`)}</h3>;
    if (/^\*\*.+\*\*$/.test(trimmed)) return <h3 key={i}>{renderInline(trimmed, `strongh-${i}`)}</h3>;
    if (/^[-*•]\s+/.test(trimmed)) return <div key={i} className="mentorBullet">• <span>{renderInline(trimmed.replace(/^[-*•]\s+/, ''), `b-${i}`)}</span></div>;
    if (/^\d+[.)]\s+/.test(trimmed)) return <div key={i} className="mentorStep"><b>{trimmed.match(/^\d+/)?.[0]}.</b><span>{renderInline(trimmed.replace(/^\d+[.)]\s+/, ''), `s-${i}`)}</span></div>;
    return <p key={i}>{renderInline(line, `p-${i}`)}</p>;
  });
}

export function AIMentorPro() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [asked, setAsked] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [backendLabel, setBackendLabel] = React.useState('');
  const [sources, setSources] = React.useState([]);
  const [ragInfo, setRagInfo] = React.useState(null);

  async function ask(customQuestion) {
    const text = (customQuestion || question).trim();
    if (!text) return;
    setAsked(text);
    setLoading(true);
    setAnswer('');
    setSources([]);
    setRagInfo(null);
    try {
      const backend = await findBestBackend();
      setBackendLabel(backend.label);
      const t = withTimeout(180000);
      const response = await fetch(backend.base + '/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: t.signal,
        body: JSON.stringify({
          question: text,
          mode: 'ollama',
          use_web: true,
          answer_style: 'professional interview ready for Salesforce, DSA and System Design',
          context: { ...collectLocalContext(), originalQuestion: text }
        })
      });
      const data = await readJson(response);
      t.done();
      const aiAnswer = cleanAnswer(data);
      setAnswer(aiAnswer || fallbackAnswer(text));
      setSources(Array.isArray(data.sources) ? data.sources : Array.isArray(data.links) ? data.links : []);
      setRagInfo(data.rag || null);
    } catch {
      setAnswer(fallbackAnswer(text));
      setSources([]);
      setRagInfo(null);
    }
    setQuestion('');
    setLoading(false);
  }

  async function latestNews() {
    await ask('Tell me latest AI and technology news useful for a Salesforce Developer. Include Agentforce, AI agents, RAG, local LLM, developer tools and career impact. Do not include physics/science news unless it is directly AI or software technology related.');
  }

  return (
    <Layout>
      <Page>
        <Hero
          title="AI Mentor"
          subtitle=""
        />

        <Card title="Ask Mentor" subtitle="Ask Salesforce, DSA, System Design, interview, project, resume, weak-topic or AI technology questions.">
          <textarea
            className="mentorProTextarea"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Example: Explain Apex trigger handler pattern with project example..."
          />
          <div className="row">
            <button className="btn cyan" disabled={loading} onClick={() => ask()}>{loading ? 'Thinking with RAG...' : 'Ask Mentor'}</button>
            <button className="btn ghost" disabled={loading} onClick={latestNews}>Latest AI/Tech News</button>
            <button className="btn ghost" onClick={() => setQuestion('')}>Clear</button>
          </div>
        </Card>

        {answer ? (
          <Card title="Professional Mentor Answer" subtitle={asked}>
            <div className="mentorAnswerBox">{renderMentorAnswer(answer)}</div>
            {sources.length ? (
              <div className="sourceBox">
                <b>Sources</b>
                <div className="sourceList">
                  {sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer">{s.title || s.url}</a>)}
                </div>
              </div>
            ) : null}
            <div className="mentorActions">
              <button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(answer)}>Copy</button>
              <button className="btn small ghost" onClick={() => setAnswer('')}>Clear Answer</button>
              {backendLabel && <span className="pill">{backendLabel}</span>}
              {ragInfo && <span className="pill">RAG: {ragInfo.salesforce_kb?.length || 0} docs · {ragInfo.saved_context_count || 0} saved · {ragInfo.news_count || 0} news</span>}
            </div>
          </Card>
        ) : null}
      </Page>
    </Layout>
  );
}
