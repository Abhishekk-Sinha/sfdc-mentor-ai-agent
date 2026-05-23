import React from 'react';
import { Card, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';

const TOPICS = [
  { name: 'Apex Trigger', focus: 'bulkification, trigger handler, recursion control, context variables and governor limits' },
  { name: 'Apex Classes', focus: 'service layer, reusable code, exception handling and maintainability' },
  { name: 'SOQL', focus: 'selective queries, relationship query, query limits and performance' },
  { name: 'LWC', focus: 'wire, imperative Apex, events, lifecycle hooks and reusable UI' },
  { name: 'Flow', focus: 'record-triggered flow, screen flow, fault path and Flow vs Apex decision' },
  { name: 'Security', focus: 'profile, permission set, OWD, sharing, CRUD/FLS and with sharing' },
  { name: 'Integration', focus: 'REST API, Named Credential, JSON, callout, retry and mock test' },
  { name: 'Async Apex', focus: 'future, queueable, batch, scheduled apex and large data processing' },
  { name: 'Testing', focus: 'test data factory, assertions, startTest/stopTest, mocks and quality coverage' },
  { name: 'Deployment', focus: 'Gearset, CI, test coverage, validation, rollback and release checklist' },
  { name: 'Data Migration', focus: 'Data Loader, external ID, upsert, duplicate handling and cleanup' },
  { name: 'Reports & Dashboards', focus: 'custom report type, KPIs, dashboard filters and business visibility' },
  { name: 'Debugging', focus: 'debug logs, limit analysis, root cause and production support communication' },
  { name: 'Project Explanation', focus: 'business problem, your role, architecture, challenges, impact and result' },
  { name: 'HR + Behavioral', focus: 'ownership, communication, teamwork, conflict, learning mindset and career clarity' },
];

const LEVELS = ['Warm-up', 'Scenario', 'Deep Technical', 'Project-Based', 'Manager Round'];
const TYPES = ['Technical', 'Scenario', 'Manager', 'Project', 'HR'];
const TEMPLATES = [
  'Explain {topic} in a way that proves 2+ years of hands-on Salesforce experience. Include {focus}.',
  'A production issue is reported related to {topic}. How will you debug, fix, test and communicate it?',
  'Give one real business scenario where you used {topic}. Explain requirement, solution, testing and impact.',
  'What common mistakes happen in {topic}, and how do you avoid them in real projects?',
  'Design a scalable solution using {topic}. Explain architecture, security, limits and deployment.',
  'How will you explain {topic} to a non-technical stakeholder and then to a technical interviewer?',
  'What follow-up questions can come after {topic}, and how will you answer confidently?',
];

function buildQuestions() {
  const questions = [];
  let number = 1;
  while (questions.length < 100) {
    for (const topic of TOPICS) {
      const template = TEMPLATES[(number - 1) % TEMPLATES.length];
      const level = LEVELS[(number - 1) % LEVELS.length];
      const type = topic.name.includes('HR') ? 'HR' : topic.name.includes('Project') ? 'Project' : TYPES[number % 3];
      questions.push({
        id: `pro-interview-${number}`,
        number,
        topic: topic.name,
        level,
        type,
        question: template.replaceAll('{topic}', topic.name).replaceAll('{focus}', topic.focus),
        modelAnswer: `Use this professional structure for ${topic.name}: direct definition, real Salesforce scenario, your implementation, ${topic.focus}, testing/security/deployment, and measurable business impact.`,
        strongPoints: [
          'Start direct. Do not give a textbook-only answer.',
          'Add one real project or production example.',
          'Mention testing, security, limits or deployment where relevant.',
          'Close with measurable business impact and ownership.',
        ],
        followUps: [`How did you test ${topic.name}?`, `What edge case did you handle?`, `How did you make it scalable and secure?`],
      });
      number += 1;
      if (questions.length >= 100) break;
    }
  }
  return questions;
}

const QUESTIONS = buildQuestions();

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function qualityScore(text = '') {
  const words = wordCount(text);
  const lower = text.toLowerCase();
  let score = Math.min(35, words / 3);
  ['situation', 'task', 'action', 'result', 'project', 'security', 'test', 'impact', 'deployment', 'governor', 'bulk'].forEach(keyword => {
    if (lower.includes(keyword)) score += 6;
  });
  return Math.min(100, Math.round(score));
}

function suggestedNextAction({ saved, strong, weak }) {
  if (saved < 5) return 'Save 5 interview answers first.';
  if (weak > strong) return 'Revise weak answers and convert them into Strong.';
  if (strong < 10) return 'Mark 10 best answers as Strong.';
  return 'Start mock interview and export your answer set.';
}

function InterviewHero({ readiness, saved, strong, weak }) {
  return <section className="interviewProHero">
    <div>
      <p className="eyebrow">Professional Interview Command Room</p>
      <h1>Salesforce Developer Interview Room</h1>
      <p>Practice 100 realistic 2+ years Salesforce Developer questions with STAR structure, project proof, technical depth and measurable impact.</p>
      <div className="professionalBadgeRow"><span>Apex</span><span>LWC</span><span>Flow</span><span>Security</span><span>Integration</span><span>Project Proof</span></div>
    </div>
    <div className="interviewReadyPanel"><b>{readiness}%</b><span>Interview Ready</span><Progress value={readiness}/><small>{suggestedNextAction({ saved, strong, weak })}</small></div>
  </section>;
}

function QuestionIndex({ list, currentId, answers, onSelect }) {
  return <Card title="Question Navigator" subtitle={`${list.length} matching questions`} className="interviewProIndex">
    <div className="interviewProList">{list.map(question => <button key={question.id} onClick={() => onSelect(question.id)} className={currentId === question.id ? 'active' : ''}>
      <b>Q{question.number}</b><div><span>{question.topic}</span><small>{question.level} • {answers[question.id]?.status || 'Not marked'}</small></div>
    </button>)}</div>
  </Card>;
}

function AnswerQuality({ text }) {
  const score = qualityScore(text);
  const words = wordCount(text);
  return <div className="answerQualityPanel">
    <div><b>{score}%</b><span>Answer Quality</span></div>
    <div><b>{words}</b><span>Words</span></div>
    <div><b>{words >= 90 ? 'Good' : 'Short'}</b><span>Depth</span></div>
  </div>;
}

export function InterviewRoomPro() {
  const [filters, setFilters] = React.useState(() => readStore('interviewProFilters', { topic: 'All', level: 'All', type: 'All', search: '' }));
  const [answers, setAnswers] = React.useState(() => readStore('interviewProAnswers', {}));
  const [currentId, setCurrentId] = React.useState(() => readStore('interviewProCurrentId', 'pro-interview-1'));
  const [mode, setMode] = React.useState(() => readStore('interviewProMode', 'Practice'));

  const topics = ['All', ...TOPICS.map(topic => topic.name)];
  const levels = ['All', ...LEVELS];
  const types = ['All', ...TYPES];
  const saved = Object.values(answers).filter(answer => String(answer?.text || '').trim()).length;
  const strong = Object.values(answers).filter(answer => answer?.status === 'Strong').length;
  const weak = Object.values(answers).filter(answer => answer?.status === 'Weak').length;
  const readiness = Math.min(100, Math.round(22 + saved * 0.5 + strong * 1.25 - weak * 0.25));

  const list = QUESTIONS.filter(question =>
    (filters.topic === 'All' || question.topic === filters.topic) &&
    (filters.level === 'All' || question.level === filters.level) &&
    (filters.type === 'All' || question.type === filters.type) &&
    (`${question.question} ${question.topic} ${question.type}`.toLowerCase().includes(filters.search.toLowerCase())) &&
    (mode !== 'Weak Questions Only' || answers[question.id]?.status === 'Weak')
  );
  const current = QUESTIONS.find(question => question.id === currentId) || list[0] || QUESTIONS[0];
  const record = answers[current.id] || {};

  const saveAnswer = (id, patch) => {
    const next = { ...answers, [id]: { ...(answers[id] || {}), ...patch, savedAt: new Date().toLocaleString() } };
    setAnswers(next);
    writeStore('interviewProAnswers', next);
  };
  const updateFilters = patch => {
    const next = { ...filters, ...patch };
    setFilters(next);
    writeStore('interviewProFilters', next);
  };
  const selectQuestion = id => {
    setCurrentId(id);
    writeStore('interviewProCurrentId', id);
  };
  const deleteAnswer = id => {
    const next = { ...answers };
    delete next[id];
    setAnswers(next);
    writeStore('interviewProAnswers', next);
  };
  const exportAll = () => downloadText('professional-interview-answers.txt', QUESTIONS.map(question => `Q${question.number}. ${question.question}\nTopic: ${question.topic}\nMy Answer:\n${answers[question.id]?.text || ''}\nModel Pattern:\n${question.modelAnswer}`).join('\n\n---\n\n'));

  return <Layout><Page>
    <InterviewHero readiness={readiness} saved={saved} strong={strong} weak={weak}/>

    <div className="interviewProStats">
      <div><b>100</b><span>Questions</span></div>
      <div><b>{saved}</b><span>Saved</span></div>
      <div><b>{strong}</b><span>Strong</span></div>
      <div><b>{weak}</b><span>Weak</span></div>
    </div>

    <Card title="Interview Control Panel" subtitle="Filter your preparation like a professional mock interview room.">
      <div className="filterBar interviewFilter">
        <input placeholder="Search question, topic or skill..." value={filters.search} onChange={event => updateFilters({ search: event.target.value })}/>
        <select value={filters.topic} onChange={event => updateFilters({ topic: event.target.value })}>{topics.map(item => <option key={item}>{item}</option>)}</select>
        <select value={filters.level} onChange={event => updateFilters({ level: event.target.value })}>{levels.map(item => <option key={item}>{item}</option>)}</select>
        <select value={filters.type} onChange={event => updateFilters({ type: event.target.value })}>{types.map(item => <option key={item}>{item}</option>)}</select>
        <select value={mode} onChange={event => { setMode(event.target.value); writeStore('interviewProMode', event.target.value); }}>{['Practice', 'Mock Interview', 'Revision', 'Weak Questions Only'].map(item => <option key={item}>{item}</option>)}</select>
        <button className="btn ghost" onClick={exportAll}>Export All</button>
      </div>
    </Card>

    <div className="interviewProRoom">
      <QuestionIndex list={list} currentId={current.id} answers={answers} onSelect={selectQuestion}/>
      <Card title={`Q${current.number}. ${current.topic}`} subtitle={`${current.level} • ${current.type}`} className="interviewProMain">
        <div className="interviewQuestionHeader"><h2>{current.question}</h2><span>{record.status || 'Not marked'}</span></div>
        <div className="interviewProGuidance">
          <div><b>Professional Answer Framework</b><p>{current.modelAnswer}</p></div>
          <div><b>Likely Follow-up Questions</b><ul>{current.followUps.map(item => <li key={item}>{item}</li>)}</ul></div>
        </div>
        <div className="strongPoints proStrongPoints"><b>Interviewer expects</b>{current.strongPoints.map(item => <span key={item}>{item}</span>)}</div>
        <textarea className="answerBox interviewAnswerBox" value={record.text || ''} onChange={event => saveAnswer(current.id, { text: event.target.value, status: record.status || 'Saved' })} placeholder="Write your answer using STAR: Situation, Task, Action, Result, Technical Depth, Business Impact."/>
        <AnswerQuality text={record.text || ''}/>
        <div className="row"><button className="btn cyan" onClick={() => saveAnswer(current.id, { text: record.text || 'My structured interview answer saved.', status: 'Saved' })}>Save Answer</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { status: 'Strong' })}>Strong</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { status: 'Weak' })}>Weak</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { text: 'Situation: \nTask: \nAction: \nResult: \nTechnical depth: \nBusiness impact: ', status: 'Draft' })}>STAR Template</button><button className="btn ghost" onClick={() => downloadText(`interview-q${current.number}.txt`, record.text || '')}>Export</button><button className="btn danger" onClick={() => deleteAnswer(current.id)}>Delete</button></div>
      </Card>
    </div>

    <Card title="Interview Crack Strategy" subtitle="Use this before every real interview.">
      <div className="crackGrid"><div><b>60-second answer</b><p>Give direct answer, project proof, technical depth and business impact.</p></div><div><b>2+ years proof</b><p>Mention testing, deployment, security, bulkification, debugging and production support.</p></div><div><b>Professional close</b><p>End with result: reduced effort, improved visibility, safer deployment or faster process.</p></div></div>
    </Card>
  </Page></Layout>;
}
