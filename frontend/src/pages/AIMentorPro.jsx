import React from 'react';
import { Layout, Page, Hero, Card } from '../components/UI';

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
  const important = keys.filter(k => /sfdc|mentor|answer|project|resume|weak|tracker|routine|calendar|proof|interview|job/i.test(k)).slice(0, 80);
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
    localStorageKeys: important,
    localStorageSnapshot: snapshot
  };
}

function fallbackAnswer(question) {
  return `AI Mentor Pro answer\n\nI could not connect to the full AI backend right now, but here is the professional structure for your question:\n\n${question}\n\n1. Explain the direct definition.\n2. Connect it with a Salesforce project use case.\n3. Mention implementation approach.\n4. Add security, testing and governor-limit points.\n5. Finish with business impact.\n\nFor best dynamic answers, keep backend + Ollama running locally.`;
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
          answer_style: 'professional interview ready',
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
    await ask('Tell me latest AI and technology news useful for a Salesforce Developer. Include Agentforce, AI agents, RAG, local LLM, developer tools and career impact.');
  }

  return (
    <Layout>
      <Page>
        <Hero
          title="AI Mentor Pro v3"
          subtitle="Ollama + Personal RAG + Salesforce Knowledge + AI/Technology News + Source Links"
        />

        <Card title="Ask Mentor" subtitle="Ask any Salesforce, Apex, LWC, Flow, SOQL, interview, project, resume, weak-topic or AI technology question.">
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
            <pre className="mentorProAnswer">{answer}</pre>
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
