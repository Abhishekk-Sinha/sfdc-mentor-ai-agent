import React from 'react';
import { Card, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';

const TOPICS = ['Apex Trigger','Apex Classes','SOQL','LWC','Flow','Security','Integration','Async Apex','Testing','Deployment','Data Migration','Reports & Dashboards','Debugging','Project Explanation','HR + Behavioral'];
const LEVELS = ['Warm-up','Scenario','Deep Technical','Project-Based','Manager Round'];
const TYPES = ['Technical','Scenario','Manager','Project','HR'];
const MODES = ['Topic Practice','Random Interview','Project-Based Interview','Company Round'];
const COMPANIES = ['General Round','TCS','Infosys','Accenture','Deloitte','Capgemini','Cognizant','Wipro','IBM','Salesforce Partner','Startup'];
const PROJECT_QUESTIONS = ['Explain your Doctor Patient Management System project end-to-end.','How did you use LWC in your project?','How did you use Apex and SOQL in your project?','How did you handle role-based access and security?','How did you use reports and dashboards for business visibility?'];
const DAILY_MISSION = ['3 Apex questions','2 LWC questions','2 SOQL questions','1 Flow question','1 Security scenario','1 Project answer'];
const TEMPLATES = ['Explain {topic} with one real Salesforce project example.','A production issue happens in {topic}. How will you debug, fix and test it?','Give a business scenario where you used {topic}. Explain requirement, solution and impact.','What mistakes happen in {topic}, and how do you avoid them?','Design a scalable solution using {topic}. Explain security, limits and deployment.','Explain {topic} to a non-technical stakeholder and to a technical interviewer.'];
const FOCUS = { 'Apex Trigger':'handler pattern, bulkification, recursion guard and test coverage', 'Apex Classes':'service layer, exception handling and maintainability', SOQL:'selective queries, relationship queries and governor limits', LWC:'wire, imperative Apex, events and reusable components', Flow:'record-triggered flow, fault path and Flow vs Apex', Security:'profiles, permission sets, OWD, sharing and CRUD/FLS', Integration:'REST API, Named Credential, JSON parsing and retries', 'Async Apex':'future, queueable, batch and scheduled Apex', Testing:'test data factory, assertions and mocks', Deployment:'Gearset, validation, rollback plan and release checklist', 'Data Migration':'Data Loader, external IDs, upsert and cleanup', 'Reports & Dashboards':'KPIs, custom report types and stakeholder visibility', Debugging:'logs, limit analysis and root cause isolation', 'Project Explanation':'business problem, architecture, your role and impact', 'HR + Behavioral':'ownership, communication, teamwork and learning mindset' };
const COMPANY_STYLE = { TCS:'focus on basics, admin concepts and clear definitions', Infosys:'focus on basics, scenarios and communication clarity', Accenture:'focus on scenario-based problem solving and production support', Deloitte:'focus on project explanation, architecture and stakeholder impact', Capgemini:'focus on practical configuration, Apex/LWC and deployment', Cognizant:'focus on support scenarios, debugging and integrations', Wipro:'focus on fundamentals, testing and process discipline', IBM:'focus on integration, scalability and enterprise design', 'Salesforce Partner':'focus on client requirement analysis, best practices and delivery', Startup:'focus on ownership, speed, full-stack thinking and business impact' };

function buildQuestions() {
  const rows = [];
  let n = 1;
  while (rows.length < 100) {
    for (const topic of TOPICS) {
      const type = topic.includes('HR') ? 'HR' : topic.includes('Project') ? 'Project' : TYPES[n % 3];
      const focus = FOCUS[topic] || 'project clarity, testing and impact';
      rows.push({ id: `interview-${n}`, number: n, topic, level: LEVELS[(n - 1) % LEVELS.length], type, focus, question: TEMPLATES[(n - 1) % TEMPLATES.length].replaceAll('{topic}', topic), modelAnswer: `Use STAR: situation, task, action, result. Add ${focus}, security/testing and business impact.`, followUps: [`How did you test ${topic}?`, `What edge case did you handle?`, `How did you make it secure and scalable?`] });
      n += 1;
      if (rows.length >= 100) break;
    }
  }
  return rows;
}

const QUESTIONS = buildQuestions();
function shuffle(list) { const copy = [...list]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function wordCount(text = '') { return text.trim().split(/\s+/).filter(Boolean).length; }
function qualityScore(text = '') { const words = wordCount(text); const lower = text.toLowerCase(); let score = Math.min(40, words / 3); ['project','security','test','impact','deployment','governor','bulk','fls','sharing','result','requirement'].forEach(k => { if (lower.includes(k)) score += 6; }); return Math.min(100, Math.round(score)); }
function grade(score) { if (score >= 85) return 'Interview Ready'; if (score >= 65) return 'Good'; if (score >= 45) return 'Needs Depth'; return 'Too Short'; }
function feedbackFor(text = '') { const lower = text.toLowerCase(); const tips = []; if (wordCount(text) < 80) tips.push('Add more depth with requirement, action and result.'); if (!lower.includes('project')) tips.push('Add one real project example.'); if (!lower.includes('security') && !lower.includes('fls') && !lower.includes('sharing')) tips.push('Mention security: CRUD/FLS, profiles, permission sets or sharing.'); if (!lower.includes('test')) tips.push('Add testing approach: positive, negative, bulk and profile-based testing.'); if (!lower.includes('impact') && !lower.includes('result')) tips.push('Close with measurable business impact.'); return tips.length ? tips : ['Good structure. Make it concise and confident for interview delivery.']; }
function answerTemplate(q, company) { const style = COMPANY_STYLE[company] || 'focus on clear, practical and project-based answer'; return `Situation:\nTask:\nAction: ${q.focus}\nProject example: In my Doctor Patient Management System project, I used this in a practical business scenario.\nSecurity/Testing:\nCompany angle: ${style}.\nResult/Business impact:`; }
function improvedAnswer(q, current, company) { return `Interview-ready answer framework for ${company}:\n\n1. Start with a direct definition of ${q.topic}.\n2. Explain the business requirement and impacted users.\n3. Describe the implementation using ${q.focus}.\n4. Add security, testing, deployment and governor-limit considerations.\n5. Connect it with Doctor Patient Management System project.\n6. Close with measurable business impact.\n\nYour draft:\n${current || 'Write your original answer here, then improve it using this structure.'}`; }
function StatBox({ value, label }) { return <div><b>{value}</b><span>{label}</span></div>; }

function InterviewHero({ readiness, saved, strong, weak }) {
  return <section className="interviewProHero"><div><p className="eyebrow">Professional Interview Room</p><h1>Salesforce Developer Interview Room</h1><p>Clean practice workspace with smart modes, company rounds, answer feedback, follow-ups and project-based preparation.</p></div><div className="interviewReadyPanel"><b>{readiness}%</b><span>Interview Ready</span><Progress value={readiness}/><small>{weak > strong ? 'Revise weak answers first.' : saved < 5 ? 'Save 5 answers first.' : 'Keep improving structured answers.'}</small></div></section>;
}
function AnswerFeedback({ text }) { const score = qualityScore(text); return <div className="interviewProGuidance"><div><b>AI Feedback Panel</b><p><b>{score}%</b> · {grade(score)}</p>{feedbackFor(text).map(t => <p key={t}>• {t}</p>)}</div></div>; }

export function InterviewRoomPro() {
  const [filters, setFilters] = React.useState(() => readStore('interviewProFilters', { topic: 'All', level: 'All', type: 'All', search: '' }));
  const [answers, setAnswers] = React.useState(() => readStore('interviewProAnswers', {}));
  const [currentId, setCurrentId] = React.useState(() => readStore('interviewProCurrentId', 'interview-1'));
  const [mode, setMode] = React.useState(() => readStore('interviewModeClean', 'Topic Practice'));
  const [company, setCompany] = React.useState(() => readStore('interviewCompanyClean', 'General Round'));
  const [timerOn, setTimerOn] = React.useState(false);
  const [seconds, setSeconds] = React.useState(() => Number(readStore('interviewTimerSeconds', 120)));

  React.useEffect(() => { if (!timerOn) return undefined; const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000); return () => clearInterval(id); }, [timerOn]);
  React.useEffect(() => { writeStore('interviewTimerSeconds', seconds); }, [seconds]);

  const saved = Object.values(answers).filter(a => String(a?.text || '').trim()).length;
  const strong = Object.values(answers).filter(a => a?.status === 'Strong').length;
  const weak = Object.values(answers).filter(a => a?.status === 'Weak').length;
  const readiness = Math.max(0, Math.min(100, Math.round(28 + saved * 0.55 + strong * 1.5 - weak * 0.35)));
  const topics = ['All', ...TOPICS]; const levels = ['All', ...LEVELS]; const types = ['All', ...TYPES];
  const modeFiltered = QUESTIONS.filter(q => mode !== 'Project-Based Interview' || q.type === 'Project' || q.topic === 'Project Explanation');
  const filtered = modeFiltered.filter(q => (filters.topic === 'All' || q.topic === filters.topic) && (filters.level === 'All' || q.level === filters.level) && (filters.type === 'All' || q.type === filters.type) && (`${q.question} ${q.topic} ${q.type}`.toLowerCase().includes(filters.search.toLowerCase())));
  const list = React.useMemo(() => mode === 'Random Interview' ? shuffle(filtered) : filtered, [filters.search, filters.topic, filters.level, filters.type, mode]);
  const current = QUESTIONS.find(q => q.id === currentId) || list[0] || QUESTIONS[0];
  const record = answers[current.id] || {};
  const weakTopics = TOPICS.filter(topic => QUESTIONS.some(q => q.topic === topic && answers[q.id]?.status === 'Weak')).slice(0, 5);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0'); const ss = String(seconds % 60).padStart(2, '0');

  const saveAnswer = (id, patch) => { const next = { ...answers, [id]: { ...(answers[id] || {}), ...patch, savedAt: new Date().toLocaleString() } }; setAnswers(next); writeStore('interviewProAnswers', next); };
  const updateFilters = patch => { const next = { ...filters, ...patch }; setFilters(next); writeStore('interviewProFilters', next); };
  const selectQuestion = id => { setCurrentId(id); writeStore('interviewProCurrentId', id); };
  const randomQuestion = () => { const pool = list.length ? list : QUESTIONS; const next = pool[Math.floor(Math.random() * pool.length)]; if (next) selectQuestion(next.id); };
  const nextQuestion = () => { const index = list.findIndex(q => q.id === current.id); const next = list[(index + 1) % Math.max(1, list.length)] || list[0]; if (next) selectQuestion(next.id); };
  const deleteAnswer = id => { const next = { ...answers }; delete next[id]; setAnswers(next); writeStore('interviewProAnswers', next); };
  const exportAll = () => downloadText('salesforce-interview-room.txt', QUESTIONS.map(q => `Q${q.number}. ${q.question}\nTopic: ${q.topic}\nAnswer:\n${answers[q.id]?.text || ''}`).join('\n\n---\n\n'));
  const setModeSave = value => { setMode(value); writeStore('interviewModeClean', value); if (value === 'Random Interview') randomQuestion(); };
  const setCompanySave = value => { setCompany(value); writeStore('interviewCompanyClean', value); };

  return <Layout><Page><InterviewHero readiness={readiness} saved={saved} strong={strong} weak={weak}/>
    <div className="interviewProStats"><StatBox value="100" label="Questions"/><StatBox value={saved} label="Saved"/><StatBox value={strong} label="Strong"/><StatBox value={weak} label="Weak"/></div>

    <Card title="Interview Control Panel" subtitle="Simple filters for focused practice."><div className="filterBar interviewFilter"><input placeholder="Search question or topic..." value={filters.search} onChange={e => updateFilters({ search: e.target.value })}/><select value={mode} onChange={e => setModeSave(e.target.value)}>{MODES.map(x => <option key={x}>{x}</option>)}</select><select value={company} onChange={e => setCompanySave(e.target.value)}>{COMPANIES.map(x => <option key={x}>{x}</option>)}</select><select value={filters.topic} onChange={e => updateFilters({ topic: e.target.value })}>{topics.map(x => <option key={x}>{x}</option>)}</select><select value={filters.level} onChange={e => updateFilters({ level: e.target.value })}>{levels.map(x => <option key={x}>{x}</option>)}</select><select value={filters.type} onChange={e => updateFilters({ type: e.target.value })}>{types.map(x => <option key={x}>{x}</option>)}</select><button className="btn cyan" onClick={randomQuestion}>Random Question</button><button className="btn ghost" onClick={exportAll}>Export</button></div></Card>

    <div className="interviewProRoom"><Card title="Question Queue" subtitle={`${list.length} matching questions`} className="interviewProIndex"><div className="interviewProList">{list.map((q, index) => <button key={`${q.id}-${index}`} onClick={() => selectQuestion(q.id)} className={current.id === q.id ? 'active' : ''}><b>Q{q.number}</b><div><span>{q.topic}</span><small>{q.level} • {answers[q.id]?.status || 'Not marked'}</small></div></button>)}</div></Card>
      <Card title={`Q${current.number}. ${current.topic}`} subtitle={`${current.level} • ${current.type} • ${company}`} className="interviewProMain"><div className="interviewQuestionHeader"><h2>{current.question}</h2><span>{record.status || 'Not marked'}</span></div><div className="professionalBadgeRow"><span>Mode: {mode}</span><span>⏱ {mm}:{ss}</span><button className="btn small ghost" onClick={() => setTimerOn(!timerOn)}>{timerOn ? 'Pause Timer' : 'Start Timer'}</button><button className="btn small ghost" onClick={() => setSeconds(120)}>Reset 2 Min</button></div><div className="interviewProGuidance"><div><b>Professional Answer Framework</b><p>{current.modelAnswer}</p><p><b>Company angle:</b> {COMPANY_STYLE[company] || 'clear, practical and project-based answer'}</p></div><div><b>Follow-up Engine</b><ul>{current.followUps.map(x => <li key={x}>{x}</li>)}</ul></div></div><textarea className="answerBox interviewAnswerBox" value={record.text || ''} onChange={e => saveAnswer(current.id, { text: e.target.value, status: record.status || 'Saved' })} placeholder="Write your answer using STAR: Situation, Task, Action, Result, Technical Depth, Business Impact."/><AnswerFeedback text={record.text || ''}/><div className="row"><button className="btn cyan" onClick={() => saveAnswer(current.id, { text: record.text || answerTemplate(current, company), status: 'Saved' })}>Save Answer</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { text: answerTemplate(current, company), status: 'Draft' })}>Project Template</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { text: improvedAnswer(current, record.text, company), status: 'Improved' })}>Improve Answer</button><button className="btn ghost" onClick={nextQuestion}>Next Question</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { status: 'Strong' })}>Strong</button><button className="btn ghost" onClick={() => saveAnswer(current.id, { status: 'Weak' })}>Weak</button><button className="btn danger" onClick={() => deleteAnswer(current.id)}>Delete</button></div></Card></div>

    <div className="interviewProRoom"><Card title="Project-Based Answer Builder" subtitle="Connect answers with Doctor Patient Management System."><div className="interviewProList">{PROJECT_QUESTIONS.map((q, index) => <button key={q} onClick={() => saveAnswer(current.id, { text: `${q}\n\nProject angle: In my Doctor Patient Management System project, I used LWC, Apex, SOQL, role-based security and reports to solve a real business problem.\n\nSecurity/testing:\nBusiness impact:`, status: 'Draft' })}><b>P{index + 1}</b><div><span>{q}</span><small>LWC • Apex • SOQL • Security • Reports</small></div></button>)}</div></Card><Card title="Daily Interview Mission" subtitle="Small but useful daily practice plan."><ul>{DAILY_MISSION.map(x => <li key={x}>{x}</li>)}</ul><div className="interviewProGuidance"><div><b>Weak Topic Revision</b><p>{weakTopics.length ? weakTopics.join(', ') : 'No weak topics yet. Mark weak answers while practicing.'}</p></div></div></Card></div>
  </Page></Layout>;
}
