import React from 'react';
import { Card, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';

const TOPICS = ['Apex Trigger','Apex Classes','SOQL','LWC','Flow','Security','Integration','Async Apex','Testing','Deployment','Data Migration','Reports & Dashboards','Debugging','Project Explanation','HR + Behavioral'];
const LEVELS = ['Warm-up','Scenario','Deep Technical','Project-Based','Manager Round'];
const TYPES = ['Technical','Scenario','Manager','Project','HR'];
const TEMPLATES = [
  'Explain {topic} with one real Salesforce project example.',
  'A production issue happens in {topic}. How will you debug, fix and test it?',
  'Give a business scenario where you used {topic}. Explain requirement, solution and impact.',
  'What mistakes happen in {topic}, and how do you avoid them?',
  'Design a scalable solution using {topic}. Explain security, limits and deployment.',
  'Explain {topic} to a non-technical stakeholder and to a technical interviewer.',
  'What follow-up questions can come after {topic}, and how will you answer?'
];

function buildQuestions() {
  const list = [];
  let number = 1;
  while (list.length < 100) {
    for (const topic of TOPICS) {
      const template = TEMPLATES[(number - 1) % TEMPLATES.length];
      const type = topic.includes('HR') ? 'HR' : topic.includes('Project') ? 'Project' : TYPES[number % 3];
      list.push({
        id: `pro-interview-${number}`,
        number,
        topic,
        level: LEVELS[(number - 1) % LEVELS.length],
        type,
        question: template.replaceAll('{topic}', topic),
        modelAnswer: `Answer structure for ${topic}: direct definition, project example, implementation steps, testing, security or limits, deployment and business impact.`,
        followUps: [`How did you test ${topic}?`, `What edge case did you handle?`, `How did you make it scalable?`]
      });
      number += 1;
      if (list.length >= 100) break;
    }
  }
  return list;
}

const QUESTIONS = buildQuestions();
function shuffle(list) { const copy = [...list]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function wordCount(text = '') { return text.trim().split(/\s+/).filter(Boolean).length; }
function qualityScore(text = '') { const words = wordCount(text); const lower = text.toLowerCase(); let score = Math.min(35, words / 3); ['situation','task','action','result','project','security','test','impact','deployment','bulk'].forEach(k => { if (lower.includes(k)) score += 6; }); return Math.min(100, Math.round(score)); }

function InterviewHero({ readiness, saved, strong, weak }) {
  return <section className="interviewProHero"><div><p className="eyebrow">Professional Interview Room</p><h1>Salesforce Developer Interview Room</h1><p>Questions are shown in random order, so every practice session feels fresh and interview-like.</p><div className="professionalBadgeRow"><span>Random Queue</span><span>Apex</span><span>LWC</span><span>Flow</span><span>Security</span><span>Project Proof</span></div></div><div className="interviewReadyPanel"><b>{readiness}%</b><span>Interview Ready</span><Progress value={readiness}/><small>{weak > strong ? 'Revise weak answers first.' : saved < 5 ? 'Save 5 answers first.' : 'Continue random practice.'}</small></div></section>;
}

function AnswerQuality({ text }) { const score = qualityScore(text); const words = wordCount(text); return <div className="answerQualityPanel"><div><b>{score}%</b><span>Answer Quality</span></div><div><b>{words}</b><span>Words</span></div><div><b>{words >= 90 ? 'Good' : 'Short'}</b><span>Depth</span></div></div>; }

export function InterviewRoomPro() {
  const [filters, setFilters] = React.useState(() => readStore('interviewProFilters', { topic: 'All', level: 'All', type: 'All', search: '' }));
  const [answers, setAnswers] = React.useState(() => readStore('interviewProAnswers', {}));
  const [currentId, setCurrentId] = React.useState(() => readStore('interviewProCurrentId', 'pro-interview-1'));
  const [mode, setMode] = React.useState(() => readStore('interviewProMode', 'Random Practice'));
  const [seed, setSeed] = React.useState(() => Number(readStore('interviewShuffleSeed', Date.now())));
  const topics = ['All', ...TOPICS];
  const levels = ['All', ...LEVELS];
  const types = ['All', ...TYPES];
  const saved = Object.values(answers).filter(a => String(a?.text || '').trim()).length;
  const strong = Object.values(answers).filter(a => a?.status === 'Strong').length;
  const weak = Object.values(answers).filter(a => a?.status === 'Weak').length;
  const readiness = Math.min(100, Math.round(22 + saved * 0.5 + strong * 1.25 - weak * 0.25));
  const baseList = QUESTIONS.filter(q => (filters.topic === 'All' || q.topic === filters.topic) && (filters.level === 'All' || q.level === filters.level) && (filters.type === 'All' || q.type === filters.type) && (`${q.question} ${q.topic} ${q.type}`.toLowerCase().includes(filters.search.toLowerCase())) && (mode !== 'Weak Questions Only' || answers[q.id]?.status === 'Weak'));
  const list = React.useMemo(() => shuffle(baseList), [filters, mode, seed, answers]);
  const current = QUESTIONS.find(q => q.id === currentId) || list[0] || QUESTIONS[0];
  const record = answers[current.id] || {};
  const saveAnswer = (id, patch) => { const next = { ...answers, [id]: { ...(answers[id] || {}), ...patch, savedAt: new Date().toLocaleString() } }; setAnswers(next); writeStore('interviewProAnswers', next); };
  const updateFilters = patch => { const next = { ...filters, ...patch }; setFilters(next); writeStore('interviewProFilters', next); };
  const selectQuestion = id => { setCurrentId(id); writeStore('interviewProCurrentId', id); };
  const shuffleNow = () => { const nextSeed = Date.now(); setSeed(nextSeed); writeStore('interviewShuffleSeed', nextSeed); const first = shuffle(baseList)[0]; if (first) selectQuestion(first.id); };
  const randomQuestion = () => { const pool = baseList.length ? baseList : QUESTIONS; const next = pool[Math.floor(Math.random() * pool.length)]; if (next) selectQuestion(next.id); };
  const nextRandom = () => { const index = list.findIndex(q => q.id === current.id); const next = list[(index + 1) % Math.max(1, list.length)] || list[0]; if (next) selectQuestion(next.id); };
  const deleteAnswer = id => { const next = { ...answers }; delete next[id]; setAnswers(next); writeStore('interviewProAnswers', next); };
  const exportAll = () => downloadText('professional-interview-answers.txt', QUESTIONS.map(q => `Q${q.number}. ${q.question}\nTopic: ${q.topic}\nMy Answer:\n${answers[q.id]?.text || ''}\nModel Pattern:\n${q.modelAnswer}`).join('\n\n---\n\n'));

  return <Layout><Page><InterviewHero readiness={readiness} saved={saved} strong={strong} weak={weak}/>
    <div className="interviewProStats"><div><b>100</b><span>Questions</span></div><div><b>{saved}</b><span>Saved</span></div><div><b>{strong}</b><span>Strong</span></div><div><b>{weak}</b><span>Weak</span></div></div>
    <Card title="Interview Control Panel" subtitle="Questions are random by default. Use Shuffle or Random Question anytime."><div className="filterBar interviewFilter"><input placeholder="Search question, topic or skill..." value={filters.search} onChange={e => updateFilters({ search: e.target.value })}/><select value={filters.topic} onChange={e => updateFilters({ topic: e.target.value })}>{topics.map(x => <option key={x}>{x}</option>)}</select><select value={filters.level} onChange={e => updateFilters({ level: e.target.value })}>{levels.map(x => <option key={x}>{x}</option>)}</select><select value={filters.type} onChange={e => updateFilters({ type: e.target.value })}>{types.map(x => <option key={x}>{x}</option>)}</select><select value={mode} onChange={e => { setMode(e.target.value); writeStore('interviewProMode', e.target.value); }}>{['Random Practice','Practice','Revision','Weak Questions Only'].map(x => <option key={x}>{x}</option>)}</select><button className="btn cyan" onClick={shuffleNow}>Shuffle Questions</button><button className="btn ghost" onClick={randomQuestion}>Random Question</button><button className="btn ghost" onClick={exportAll}>Export All</button></div></Card>
    <div className="interviewProRoom"><Card title="Random Question Queue" subtitle={`${list.length} matching questions`} className="interviewProIndex"><div className="interviewProList">{list.map((q, index) => <button key={`${q.id}-${index}`} onClick={() => selectQuestion(q.id)} className={current.id === q.id ? 'active' : ''}><b>#{index + 1}</b><div><span>Q{q.number}. {q.topic}</span><small>{q.level} • {answers[q.id]?.status || 'Not marked'}</small></div></button>)}</div></Card><Card title={`Q${current.number}. ${current.topic}`} subtitle={`${current.level} • ${current.type}`} className="interviewProMain"><div className="interviewQuestionHeader"><h2>{current.question}</h2><span>{record.status || 'Not marked'}</span></div><div className="interviewProGuidance"><div><b>Professional Answer Framework</b><p>{current.modelAnswer}</p></div><div><b>Likely Follow-up Questions</b><ul>{current.followUps.map(x => <li key={x}>{x}</li>)}</ul></div></div><textarea className="answerBox interviewAnswerBox" value={record.text || ''} onChange={e => saveAnswer(current.id, { text: e.target.value, status: record.status || 'Saved' })} placeholder="Write your answer using STAR: Situation, Task, Action, Result, Technical Depth, Business Impact."/><AnswerQuality text={record.text || ''}/><div className="row"><button className="btn cyan" onClick={() => saveAnswer(current.id, { text: record.text || 'My structured interview answer saved.', status: 'Saved' })}>Save Answer</button><button className="btn ghost" onClick={nextRandom}>Next Random</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { status: 'Strong' })}>Strong</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { status: 'Weak' })}>Weak</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { text: 'Situation: \nTask: \nAction: \nResult: \nTechnical depth: \nBusiness impact: ', status: 'Draft' })}>STAR Template</button><button className="btn ghost" onClick={() => downloadText(`interview-q${current.number}.txt`, record.text || '')}>Export</button><button className="btn danger" onClick={() => deleteAnswer(current.id)}>Delete</button></div></Card></div>
  </Page></Layout>;
}
