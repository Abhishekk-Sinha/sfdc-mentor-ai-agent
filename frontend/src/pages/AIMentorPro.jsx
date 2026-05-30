import React from 'react';
import { Layout, Page, Hero, Card } from '../components/UI';
import { analyzeMentorQuestion, scoreMentorAnswer } from './mentorNlp';
import './ai-mentor-pro.css';

const API_CANDIDATES = ['http://127.0.0.1:8000', 'http://localhost:8000', 'https://sfdc-mentor-backend.onrender.com'];

function withTimeout(ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}
async function readJson(response) { try { return await response.json(); } catch { return {}; } }

async function findBestBackend() {
  for (const base of API_CANDIDATES) {
    const t = withTimeout(5000);
    try {
      const response = await fetch(base + '/api/ollama-status?ts=' + Date.now(), { signal: t.signal });
      const data = await readJson(response);
      t.done();
      if (data && data.model_available === true) return { base, label: 'AI Mentor · Local Ollama + NLP' };
    } catch { t.done(); }
  }
  for (const base of API_CANDIDATES) {
    const t = withTimeout(5000);
    try {
      const response = await fetch(base + '/api/health?ts=' + Date.now(), { signal: t.signal });
      const data = await readJson(response);
      t.done();
      if (response.ok || data?.ok) return { base, label: 'AI Mentor · NLP/RAG backend' };
    } catch { t.done(); }
  }
  return { base: API_CANDIDATES[0], label: 'AI Mentor' };
}

function cleanAnswer(data) { return String(data?.answer || data?.response || data?.text || '').trim(); }

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
  return { role: 'Salesforce Developer', user: 'Abhishek', source: 'AI Mentor NLP', localStorageKeys: important, localStorageSnapshot: snapshot };
}

function fallbackAnswer(question, nlp) {
  return `AI Mentor answer\n\n${question}\n\nDetected domain: ${nlp.domain}\nDetected intent: ${nlp.intent}\n\nUse this answer structure:\n${nlp.format}\n\nNext best action:\n${nlp.nextAction}\n\nFor best dynamic answers, keep backend + Ollama running locally.`;
}

function renderInline(text, keyPrefix) {
  const parts = [];
  const regex = /(https?:\/\/[^\s)]+)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<a key={`${keyPrefix}-url-${match.index}`} href={match[1]} target="_blank" rel="noreferrer">{match[1]}</a>);
    else if (match[2] && match[3]) parts.push(<a key={`${keyPrefix}-md-${match.index}`} href={match[3]} target="_blank" rel="noreferrer">{match[2]}</a>);
    else if (match[4]) parts.push(<strong key={`${keyPrefix}-b-${match.index}`}>{match[4]}</strong>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMentorAnswer(answer) {
  return String(answer || '').split('\n').map((line, i) => {
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
  const [nlpInfo, setNlpInfo] = React.useState(null);
  const [answerScore, setAnswerScore] = React.useState(null);

  async function ask(customQuestion) {
    const text = (customQuestion || question).trim();
    if (!text) return;
    const nlp = analyzeMentorQuestion(text);
    setAsked(text);
    setNlpInfo(nlp);
    setLoading(true);
    setAnswer('');
    setAnswerScore(null);
    setSources([]);
    setRagInfo(null);
    try {
      const backend = await findBestBackend();
      setBackendLabel(backend.label);
      const t = withTimeout(180000);
      const response = await fetch(backend.base + '/api/mentor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: t.signal,
        body: JSON.stringify({
          question: text,
          mode: 'ollama',
          use_web: true,
          answer_style: `domain=${nlp.domain}; intent=${nlp.intent}; format=${nlp.format}`,
          context: { ...collectLocalContext(), originalQuestion: text, nlp }
        })
      });
      const data = await readJson(response);
      t.done();
      const finalAnswer = cleanAnswer(data) || fallbackAnswer(text, nlp);
      setAnswer(finalAnswer);
      setAnswerScore(scoreMentorAnswer(finalAnswer, nlp.domain, nlp.intent));
      setSources(Array.isArray(data.sources) ? data.sources : Array.isArray(data.links) ? data.links : []);
      setRagInfo(data.rag || null);
    } catch {
      const local = fallbackAnswer(text, nlp);
      setAnswer(local);
      setAnswerScore(scoreMentorAnswer(local, nlp.domain, nlp.intent));
    }
    setQuestion('');
    setLoading(false);
  }

  async function latestNews() { await ask('Tell me latest AI and technology news useful for a Salesforce Developer. Include Agentforce, AI agents, RAG, local LLM, developer tools and career impact.'); }

  return <Layout><Page><Hero title="AI Mentor" subtitle="" />
    <Card title="Ask Mentor" subtitle="Ask Salesforce, DSA, System Design, interview, project, resume, weak-topic or AI technology questions.">
      <textarea className="mentorProTextarea" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Example: Explain Apex trigger handler pattern with project example..." />
      <div className="row"><button className="btn cyan" disabled={loading} onClick={() => ask()}>{loading ? 'Thinking with NLP...' : 'Ask Mentor'}</button><button className="btn ghost" disabled={loading} onClick={latestNews}>Latest AI/Tech News</button><button className="btn ghost" onClick={() => setQuestion('')}>Clear</button></div>
    </Card>
    {nlpInfo ? <Card title="NLP Mentor Intelligence" subtitle="Question understood before answer generation."><div className="nlpGrid"><div><span>Domain</span><b>{nlpInfo.domain}</b></div><div><span>Intent</span><b>{nlpInfo.intent}</b></div><div><span>Confidence</span><b>{nlpInfo.confidence}</b></div><div><span>Next Action</span><b>{nlpInfo.nextAction}</b></div></div>{nlpInfo.weakTopics?.length ? <div className="weakPills">{nlpInfo.weakTopics.map(t => <span key={t}>{t}</span>)}</div> : null}</Card> : null}
    {answer ? <Card title="Professional Mentor Answer" subtitle={asked}><div className="mentorAnswerBox">{renderMentorAnswer(answer)}</div>{answerScore ? <div className="scoreGrid"><div><span>Overall</span><b>{answerScore.overall}/10</b></div><div><span>Clarity</span><b>{answerScore.clarity}/10</b></div><div><span>Depth</span><b>{answerScore.depth}/10</b></div><div><span>Interview</span><b>{answerScore.interviewReadiness}/10</b></div></div> : null}{sources.length ? <div className="sourceBox"><b>Sources</b><div className="sourceList">{sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer">{s.title || s.url}</a>)}</div></div> : null}<div className="mentorActions"><button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(answer)}>Copy</button><button className="btn small ghost" onClick={() => setAnswer('')}>Clear Answer</button>{backendLabel && <span className="pill">{backendLabel}</span>}{ragInfo && <span className="pill">RAG: {ragInfo.salesforce_kb?.length || 0} docs · {ragInfo.saved_context_count || 0} saved · {ragInfo.news_count || 0} news</span>}</div></Card> : null}
  </Page></Layout>;
}
