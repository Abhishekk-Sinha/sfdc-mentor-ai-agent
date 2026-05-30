import React from 'react';
import { Card, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';

const TOPICS = ['Apex Trigger','Apex Classes','SOQL','LWC','Flow','Security','Integration','Async Apex','Testing','Deployment','Data Migration','Reports & Dashboards','Debugging','Project Explanation','HR + Behavioral'];
const LEVELS = ['Warm-up','Scenario','Deep Technical','Project-Based','Manager Round'];
const TYPES = ['Technical','Scenario','Manager','Project','HR'];
const COMPANIES = ['General Round','TCS','Infosys','Accenture','Deloitte','Capgemini','Cognizant','Wipro','IBM','Salesforce Partner','Startup'];
const PROJECT_QUESTIONS = [
  'Explain your Doctor Patient Management System project end-to-end.',
  'How did you use LWC in your project?',
  'How did you use Apex and SOQL in your project?',
  'How did you handle role-based access and security?',
  'How did you use reports and dashboards for business visibility?',
  'What was the biggest production issue and how did you solve it?'
];
const DAILY_MISSION = ['3 Apex questions','2 LWC questions','2 SOQL questions','1 Flow question','1 Security scenario','1 Project answer'];
const TEMPLATES = [
  'Explain {topic} with one real Salesforce project example.',
  'A production issue happens in {topic}. How will you debug, fix and test it?',
  'Give a business scenario where you used {topic}. Explain requirement, solution and impact.',
  'What mistakes happen in {topic}, and how do you avoid them?',
  'Design a scalable solution using {topic}. Explain security, limits and deployment.',
  'Explain {topic} to a non-technical stakeholder and to a technical interviewer.',
  'What follow-up questions can come after {topic}, and how will you answer?'
];
const topicFocus = {
  'Apex Trigger': 'trigger context variables, handler pattern, bulkification, recursion guard, test coverage',
  'Apex Classes': 'service layer, selector pattern, exception handling, maintainability',
  'SOQL': 'selective queries, relationship query, aggregate query, indexes, governor limits',
  'LWC': 'wire, imperative Apex, lifecycle hooks, custom events, refresh, reusable components',
  'Flow': 'record-triggered flow, screen flow, fault path, before-save vs after-save, when to use Apex',
  'Security': 'OWD, profiles, permission sets, CRUD/FLS, sharing, with sharing',
  'Integration': 'REST API, Named Credential, OAuth, JSON parsing, retry, mock test',
  'Async Apex': 'future, queueable, batch, scheduled Apex, chaining, limits',
  'Testing': 'test data factory, assertions, startTest/stopTest, mock callouts',
  'Deployment': 'Gearset, validation, test run, rollback plan, metadata dependencies',
  'Data Migration': 'Data Loader, external IDs, upsert, duplicate rules, data cleanup',
  'Reports & Dashboards': 'custom report types, dashboard filters, KPIs, stakeholder visibility',
  'Debugging': 'debug logs, trace flags, limit analysis, root cause, safe hotfix',
  'Project Explanation': 'business problem, architecture, your role, challenge, impact',
  'HR + Behavioral': 'ownership, communication, teamwork, conflict, learning mindset'
};

function buildQuestions() {
  const list = [];
  let number = 1;
  while (list.length < 120) {
    for (const topic of TOPICS) {
      const template = TEMPLATES[(number - 1) % TEMPLATES.length];
      const type = topic.includes('HR') ? 'HR' : topic.includes('Project') ? 'Project' : TYPES[number % 3];
      const focus = topicFocus[topic] || 'real project clarity, testing and impact';
      list.push({
        id: `pro-interview-${number}`,
        number,
        topic,
        level: LEVELS[(number - 1) % LEVELS.length],
        type,
        question: template.replaceAll('{topic}', topic),
        modelAnswer: `Use this structure: definition → business scenario → implementation with ${focus} → testing/security → deployment → business impact.`,
        followUps: [`How did you test ${topic}?`, `What edge case did you handle?`, `How did you make ${topic} secure and scalable?`],
        focus,
      });
      number += 1;
      if (list.length >= 120) break;
    }
  }
  return list;
}

const QUESTIONS = buildQuestions();
function shuffle(list) { const copy = [...list]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function wordCount(text = '') { return text.trim().split(/\s+/).filter(Boolean).length; }
function qualityScore(text = '') { const words = wordCount(text); const lower = text.toLowerCase(); let score = Math.min(35, words / 3); ['situation','task','action','result','project','security','test','impact','deployment','bulk','governor','fls','permission','limit'].forEach(k => { if (lower.includes(k)) score += 5; }); return Math.min(100, Math.round(score)); }
function grade(score) { if (score >= 85) return 'Interview Ready'; if (score >= 65) return 'Good'; if (score >= 45) return 'Needs Depth'; return 'Too Short'; }
function answerTemplate(q, projectMode = false) {
  const projectLine = projectMode ? 'Project example: In my Doctor Patient Management System project, I handled patient/appointment data, role-based access, Apex logic, LWC UI and reporting impact.\n' : 'Project example: Connect this answer with one real Salesforce project.\n';
  return `Situation: \nTask: \nAction: \n${projectLine}Technical depth: ${q.focus}\nSecurity/testing: \nResult/business impact: `;
}
function improvedAnswer(q, current, company) {
  const base = current?.trim() || 'I worked on this requirement in a Salesforce project.';
  return `Interview-ready version for ${company}:\n\n${base}\n\nTo make this answer stronger, I would structure it like this:\n1. Start with a one-line definition of ${q.topic}.\n2. Explain the business requirement and impacted users.\n3. Describe my implementation around ${q.focus}.\n4. Mention security, governor limits, testing and deployment.\n5. Close with measurable business impact and what I learned.`;
}

function Metric({ label, value, note }) { return <div className="stat"><span>▣</span><p>{label}</p><b>{value}</b>{note && <small>{note}</small>}</div>; }
function TopicCard({ topic, total, saved, weak, strong, onOpen }) { const progress = Math.round((saved / Math.max(total, 1)) * 100); return <button className="card topicCard" onClick={onOpen}><div className="cardHead"><div><h2>{topic}</h2><p>{saved}/{total} practiced · {weak} weak</p></div><b className="pill">{progress}%</b></div><Progress value={progress}/><div className="row"><span className="pill">Strong {strong}</span><span className="pill">Start Practice</span></div></button>; }
function TimerBadge({ seconds }) { const mm = String(Math.floor(seconds / 60)).padStart(2, '0'); const ss = String(seconds % 60).padStart(2, '0'); return <span className="pill">⏱ {mm}:{ss}</span>; }

export function InterviewRoomPro() {
  const [filters, setFilters] = React.useState(() => readStore('interviewProFilters', { topic: 'All', level: 'All', type: 'All', search: '' }));
  const [answers, setAnswers] = React.useState(() => readStore('interviewProAnswers', {}));
  const [currentId, setCurrentId] = React.useState(() => readStore('interviewProCurrentId', 'pro-interview-1'));
  const [mode, setMode] = React.useState(() => readStore('interviewProMode', 'Real Interview Simulator'));
  const [company, setCompany] = React.useState(() => readStore('interviewCompanyMode', 'General Round'));
  const [seed, setSeed] = React.useState(() => Number(readStore('interviewShuffleSeed', Date.now())));
  const [timerOn, setTimerOn] = React.useState(false);
  const [seconds, setSeconds] = React.useState(() => Number(readStore('interviewTimerSeconds', 120)));
  const [showModel, setShowModel] = React.useState(false);
  const [projectMode, setProjectMode] = React.useState(false);

  React.useEffect(() => { if (!timerOn) return undefined; const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000); return () => clearInterval(id); }, [timerOn]);
  React.useEffect(() => { writeStore('interviewTimerSeconds', seconds); }, [seconds]);

  const topics = ['All', ...TOPICS]; const levels = ['All', ...LEVELS]; const types = ['All', ...TYPES];
  const saved = Object.values(answers).filter(a => String(a?.text || '').trim()).length;
  const strong = Object.values(answers).filter(a => a?.status === 'Strong').length;
  const weak = Object.values(answers).filter(a => a?.status === 'Weak').length;
  const mocks = Object.values(answers).filter(a => a?.mockCompleted).length;
  const readiness = Math.max(0, Math.min(100, Math.round(28 + saved * 0.45 + strong * 1.5 + mocks * 2 - weak * 0.35)));
  const baseList = QUESTIONS.filter(q => (filters.topic === 'All' || q.topic === filters.topic) && (filters.level === 'All' || q.level === filters.level) && (filters.type === 'All' || q.type === filters.type) && (`${q.question} ${q.topic} ${q.type}`.toLowerCase().includes(filters.search.toLowerCase())) && (mode !== 'Weak Questions Only' || answers[q.id]?.status === 'Weak'));
  const list = React.useMemo(() => shuffle(baseList), [filters, mode, seed, answers]);
  const current = QUESTIONS.find(q => q.id === currentId) || list[0] || QUESTIONS[0];
  const record = answers[current.id] || {};
  const qScore = qualityScore(record.text || '');
  const topicSummary = TOPICS.map(topic => { const qs = QUESTIONS.filter(q => q.topic === topic); const recs = qs.map(q => answers[q.id]).filter(Boolean); return { topic, total: qs.length, saved: recs.filter(a => String(a.text || '').trim()).length, weak: recs.filter(a => a.status === 'Weak').length, strong: recs.filter(a => a.status === 'Strong').length }; });
  const weakTopics = topicSummary.filter(t => t.weak > 0 || (t.saved > 0 && t.saved < 2)).slice(0, 6);
  const updateFilters = patch => { const next = { ...filters, ...patch }; setFilters(next); writeStore('interviewProFilters', next); };
  const saveAnswer = (id, patch) => { const next = { ...answers, [id]: { ...(answers[id] || {}), ...patch, savedAt: new Date().toLocaleString() } }; setAnswers(next); writeStore('interviewProAnswers', next); };
  const selectQuestion = id => { setCurrentId(id); writeStore('interviewProCurrentId', id); setShowModel(false); };
  const shuffleNow = () => { const nextSeed = Date.now(); setSeed(nextSeed); writeStore('interviewShuffleSeed', nextSeed); const first = shuffle(baseList)[0]; if (first) selectQuestion(first.id); };
  const randomQuestion = () => { const pool = baseList.length ? baseList : QUESTIONS; const next = pool[Math.floor(Math.random() * pool.length)]; if (next) selectQuestion(next.id); };
  const nextRandom = () => { const index = list.findIndex(q => q.id === current.id); const next = list[(index + 1) % Math.max(1, list.length)] || list[0]; if (next) selectQuestion(next.id); };
  const deleteAnswer = id => { const next = { ...answers }; delete next[id]; setAnswers(next); writeStore('interviewProAnswers', next); };
  const exportAll = () => downloadText('professional-interview-answers.txt', QUESTIONS.map(q => `Q${q.number}. ${q.question}\nTopic: ${q.topic}\nMy Answer:\n${answers[q.id]?.text || ''}\nModel Pattern:\n${q.modelAnswer}`).join('\n\n---\n\n'));
  const startMock = () => { setMode('Mock Interview'); writeStore('interviewProMode', 'Mock Interview'); setTimerOn(true); setSeconds(120); randomQuestion(); };
  const completeMock = () => saveAnswer(current.id, { mockCompleted: true, status: qScore >= 65 ? 'Strong' : 'Weak' });
  const openProjectQuestion = index => { const q = PROJECT_QUESTIONS[index % PROJECT_QUESTIONS.length]; const custom = { id: `project-custom-${index}`, number: 900 + index, topic: 'Project Explanation', level: 'Project-Based', type: 'Project', question: q, modelAnswer: 'Use STAR + project architecture + your role + challenge + impact.', followUps: ['What was your role?', 'How did you secure it?', 'How did you test it?'], focus: 'Doctor Patient Management System, LWC, Apex, SOQL, role-based access, reports' }; if (!QUESTIONS.find(x => x.id === custom.id)) QUESTIONS.push(custom); setProjectMode(true); selectQuestion(custom.id); };

  return <Layout><Page>
    <section className="interviewProHero"><div><p className="eyebrow">Professional Interview Room</p><h1>Salesforce Developer Interview Room</h1><p>Dashboard, topic progress, real interview simulator, AI improved answer panel, project mode, company round, daily mission and weak-topic revision.</p><div className="professionalBadgeRow"><span>{company}</span><span>{mode}</span><span>Random Queue</span><span>Project Proof</span></div></div><div className="interviewReadyPanel"><b>{readiness}%</b><span>Interview Ready</span><Progress value={readiness}/><small>{weak > strong ? 'Revise weak answers first.' : saved < 5 ? 'Save 5 answers first.' : 'Keep practicing company rounds.'}</small></div></section>

    <div className="interviewProStats"><Metric label="Questions" value="120" note="topic-wise"/><Metric label="Saved" value={saved}/><Metric label="Strong" value={strong}/><Metric label="Weak" value={weak}/><Metric label="Mocks" value={mocks}/></div>

    <Card title="Interview Control Center" subtitle="Choose mode, company, topic, level and start a real interview drill."><div className="filterBar interviewFilter"><input placeholder="Search question, topic or skill..." value={filters.search} onChange={e => updateFilters({ search: e.target.value })}/><select value={filters.topic} onChange={e => updateFilters({ topic: e.target.value })}>{topics.map(x => <option key={x}>{x}</option>)}</select><select value={filters.level} onChange={e => updateFilters({ level: e.target.value })}>{levels.map(x => <option key={x}>{x}</option>)}</select><select value={filters.type} onChange={e => updateFilters({ type: e.target.value })}>{types.map(x => <option key={x}>{x}</option>)}</select><select value={mode} onChange={e => { setMode(e.target.value); writeStore('interviewProMode', e.target.value); }}>{['Real Interview Simulator','Random Practice','Mock Interview','Project-Based Mode','Company Round','Weak Questions Only'].map(x => <option key={x}>{x}</option>)}</select><select value={company} onChange={e => { setCompany(e.target.value); writeStore('interviewCompanyMode', e.target.value); }}>{COMPANIES.map(x => <option key={x}>{x}</option>)}</select><button className="btn cyan" onClick={startMock}>Start Mock</button><button className="btn ghost" onClick={shuffleNow}>Shuffle</button><button className="btn ghost" onClick={randomQuestion}>Random</button><button className="btn ghost" onClick={exportAll}>Export</button></div></Card>

    <div className="interviewProStats">{topicSummary.slice(0, 10).map(t => <TopicCard key={t.topic} {...t} onOpen={() => updateFilters({ topic: t.topic })}/>)}</div>

    <div className="interviewProRoom"><Card title="Question Queue" subtitle={`${list.length} matching questions`} className="interviewProIndex"><div className="interviewProList">{list.map((q, index) => <button key={`${q.id}-${index}`} onClick={() => selectQuestion(q.id)} className={current.id === q.id ? 'active' : ''}><b>#{index + 1}</b><div><span>Q{q.number}. {q.topic}</span><small>{q.level} • {answers[q.id]?.status || 'Not marked'}</small></div></button>)}</div></Card>
      <Card title={`Q${current.number}. ${current.topic}`} subtitle={`${current.level} • ${current.type} • ${company}`} className="interviewProMain"><div className="interviewQuestionHeader"><h2>{current.question}</h2><span>{record.status || 'Not marked'}</span></div><div className="professionalBadgeRow"><TimerBadge seconds={seconds}/><button className="btn small ghost" onClick={() => setTimerOn(!timerOn)}>{timerOn ? 'Pause Timer' : 'Start Timer'}</button><button className="btn small ghost" onClick={() => setSeconds(120)}>Reset 2 Min</button><button className="btn small ghost" onClick={completeMock}>Complete Mock</button></div><div className="interviewProGuidance"><div><b>Professional Answer Framework</b><p>{current.modelAnswer}</p></div><div><b>Likely Follow-up Questions</b><ul>{current.followUps.map(x => <li key={x}>{x}</li>)}</ul></div></div><textarea className="answerBox interviewAnswerBox" value={record.text || ''} onChange={e => saveAnswer(current.id, { text: e.target.value, status: record.status || 'Saved' })} placeholder="Write your answer using STAR: Situation, Task, Action, Result, Technical Depth, Business Impact."/><div className="answerQualityPanel"><div><b>{qScore}%</b><span>Answer Quality</span></div><div><b>{wordCount(record.text || '')}</b><span>Words</span></div><div><b>{grade(qScore)}</b><span>Readiness</span></div></div><div className="row"><button className="btn cyan" onClick={() => saveAnswer(current.id, { text: record.text || answerTemplate(current, projectMode), status: 'Saved' })}>Save Answer</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { text: answerTemplate(current, projectMode), status: 'Draft' })}>STAR Template</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { text: improvedAnswer(current, record.text, company), status: 'Improved' })}>AI Improved Answer</button><button className="btn ghost" onClick={() => setShowModel(!showModel)}>Show Ideal Pattern</button><button className="btn ghost" onClick={nextRandom}>Next</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { status: 'Strong' })}>Strong</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { status: 'Weak' })}>Weak</button><button className="btn danger" onClick={() => deleteAnswer(current.id)}>Delete</button></div>{showModel && <div className="interviewProGuidance"><div><b>Ideal Answer Pattern</b><p>{current.modelAnswer}</p><p>Company style: {company}. Keep it concise, project-based and measurable.</p></div></div>}</Card></div>

    <div className="interviewProRoom"><Card title="Project-Based Interview Mode" subtitle="Connect every answer to Doctor Patient Management System."><div className="interviewProList">{PROJECT_QUESTIONS.map((q, i) => <button key={q} onClick={() => openProjectQuestion(i)}><b>P{i + 1}</b><div><span>{q}</span><small>LWC · Apex · SOQL · Security · Reports</small></div></button>)}</div></Card><Card title="Daily Interview Mission" subtitle="Complete these 10 items today."><ul>{DAILY_MISSION.map(x => <li key={x}>{x}</li>)}</ul><div className="interviewProGuidance"><div><b>Weak Topic Revision</b>{weakTopics.length ? weakTopics.map(t => <p key={t.topic}>Revise {t.topic}: {t.weak} weak / {t.saved} saved</p>) : <p>No weak topics yet. Mark weak answers during mock practice.</p>}</div></div></Card></div>
  </Page></Layout>;
}