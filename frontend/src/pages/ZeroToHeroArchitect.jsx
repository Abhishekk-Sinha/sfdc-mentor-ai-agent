import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';

const APP_NAME = 'Salesforce Career Accelerator';
const APP_VERSION = 'v4.0 Guided Learning Plan';

const tabs = [
  ['start', 'Start Today'],
  ['foundation', 'Foundation'],
  ['practice', 'Practice'],
  ['proof', 'Proof'],
  ['interview', 'Interview'],
  ['review', 'Review'],
];

const tracks = [
  { days: 30, name: '30 Days', purpose: 'Interview Sprint', note: 'Fast revision for high-impact interview readiness.' },
  { days: 45, name: '45 Days', purpose: 'Job Ready', note: 'Balanced Admin, Flow, Apex, LWC and interview practice.' },
  { days: 60, name: '60 Days', purpose: 'Deep Foundation', note: 'Deep project, architecture, security and integration readiness.' },
];

const phases = [
  { id: 1, days: '1-7', name: 'CRM + Salesforce Basics', focus: 'CRM, org navigation, objects, fields, records, page layouts, reports.', outcome: 'You can explain Salesforce basics clearly.' },
  { id: 2, days: '8-16', name: 'Admin + Security', focus: 'Profiles, permission sets, OWD, roles, sharing rules, validation, reports.', outcome: 'You can design a secure basic Salesforce app.' },
  { id: 3, days: '17-25', name: 'Flow + Automation', focus: 'Record-triggered flow, screen flow, scheduled flow, fault path, Flow vs Apex.', outcome: 'You can automate business processes safely.' },
  { id: 4, days: '26-38', name: 'Apex + SOQL + Trigger', focus: 'Apex class, SOQL, DML, trigger lifecycle, bulkification, test classes.', outcome: 'You can write and explain clean Apex logic.' },
  { id: 5, days: '39-50', name: 'LWC + Integration', focus: 'LWC basics, events, wire, imperative Apex, REST API, Named Credential.', outcome: 'You can build UI and integration features.' },
  { id: 6, days: '51-60', name: 'Projects + Interview', focus: 'Project proof, system design, deployment, production issue, mock interview.', outcome: 'You can explain your project like a job-ready Salesforce Developer.' },
];

const microLessons = {
  'CRM + Salesforce Basics': [
    { title: 'What is CRM?', explain: 'CRM means Customer Relationship Management. Salesforce stores customer data and helps teams manage sales, service and support processes.', example: 'A company stores Leads, Accounts, Contacts and Opportunities in Salesforce.', practice: 'Create a simple explanation of CRM in 5 lines.' },
    { title: 'Object vs Field vs Record', explain: 'An object is like a table, a field is like a column and a record is like one row of data.', example: 'Account is an object, Phone is a field and Acme Pvt Ltd is a record.', practice: 'Write 3 examples from a Student Management app.' },
    { title: 'Lookup vs Master-Detail', explain: 'Lookup is a loose relationship. Master-Detail is tightly connected and supports roll-up summary.', example: 'Student to Course can be lookup, Invoice to Invoice Line can be master-detail.', practice: 'Choose relationship for Doctor and Appointment and explain why.' },
    { title: 'Page Layout vs Lightning Record Page', explain: 'Page Layout controls fields/buttons/related lists. Lightning Record Page controls component placement and user experience.', example: 'Use page layout for required fields and Lightning page for dashboard-style record UI.', practice: 'Write one interview difference.' },
    { title: 'Basic Reports', explain: 'Reports show filtered and grouped Salesforce records for business visibility.', example: 'Course-wise student count or pending fee report.', practice: 'Design one report for your project.' },
  ],
  'Admin + Security': [
    { title: 'Profile vs Permission Set', explain: 'Profile gives base access. Permission Set gives extra access without changing profile.', example: 'Finance user gets extra Fee field access through permission set.', practice: 'Write a real scenario.' },
    { title: 'OWD and Sharing Rules', explain: 'OWD is default record access. Sharing rules open extra access based on owner or criteria.', example: 'Student records private, but pending fee students shared with Finance.', practice: 'Design one sharing scenario.' },
    { title: 'Role Hierarchy', explain: 'Role hierarchy opens record visibility upward to managers.', example: 'Manager can see counselor records.', practice: 'Explain role vs profile.' },
    { title: 'Field-Level Security', explain: 'FLS controls field visibility and editability.', example: 'Hide discount field from support users.', practice: 'Write one security mistake.' },
    { title: 'Validation Rule', explain: 'Validation rule blocks wrong data before save.', example: 'Phone must be 10 digits.', practice: 'Write one validation rule scenario.' },
  ],
  'Flow + Automation': [
    { title: 'Record-Triggered Flow', explain: 'Runs automatically when a record is created, updated or deleted.', example: 'Create follow-up task after lead creation.', practice: 'Write entry criteria and outcome.' },
    { title: 'Screen Flow', explain: 'Guided UI flow for collecting user input step by step.', example: 'Student admission form.', practice: 'Design two screens.' },
    { title: 'Flow Fault Path', explain: 'Fault path handles errors instead of failing silently.', example: 'Create error log record if update fails.', practice: 'Write one error handling plan.' },
    { title: 'Approval Process', explain: 'Approval process routes records for manager approval.', example: 'Discount above 20 percent needs approval.', practice: 'Write approval steps.' },
    { title: 'Flow vs Apex', explain: 'Use Flow for declarative automation. Use Apex for complex, reusable, bulk or integration-heavy logic.', example: 'Simple field update = Flow, complex callout = Apex.', practice: 'Decide solution for one requirement.' },
  ],
  'Apex + SOQL + Trigger': [
    { title: 'Apex Class Basics', explain: 'Apex class contains reusable server-side business logic.', example: 'StudentService calculates fee status.', practice: 'Write class responsibility.' },
    { title: 'SOQL Query Basics', explain: 'SOQL retrieves Salesforce records using SELECT, FROM and WHERE.', example: 'SELECT Id, Name FROM Account WHERE Industry = Technology.', practice: 'Write one query.' },
    { title: 'Trigger Lifecycle', explain: 'Triggers run before or after record DML events.', example: 'Before insert validates data, after insert creates related records.', practice: 'Explain before vs after.' },
    { title: 'Bulkification', explain: 'Code must handle many records at once and avoid SOQL/DML inside loops.', example: 'Use maps and one query for all records.', practice: 'Write bulk-safe checklist.' },
    { title: 'Test Class Pattern', explain: 'Test classes create data, execute logic and assert result.', example: 'Create Account, call service, assert updated field.', practice: 'Write test steps.' },
  ],
  'LWC + Integration': [
    { title: 'LWC Component Structure', explain: 'LWC uses HTML, JavaScript and metadata XML files.', example: 'PropertySearch component with filters and results.', practice: 'List files and their purpose.' },
    { title: 'Parent-to-Child Communication', explain: 'Parent passes data to child using public properties.', example: 'Parent sends selected record id to child detail component.', practice: 'Write one scenario.' },
    { title: 'Wire vs Imperative Apex', explain: 'Wire is reactive. Imperative is called manually on action.', example: 'Wire for list load, imperative for search button.', practice: 'Choose one for filter search.' },
    { title: 'REST API Basics', explain: 'REST API exchanges data between Salesforce and external systems.', example: 'Healthcare system sends appointment status.', practice: 'Write request and response fields.' },
    { title: 'Named Credential', explain: 'Named Credential stores endpoint and authentication securely.', example: 'Google Drive upload endpoint.', practice: 'Explain why it is safer.' },
  ],
  'Projects + Interview': [
    { title: 'Project STAR Story', explain: 'Explain project using Situation, Task, Action and Result.', example: 'Doctor Patient app improved appointment tracking and secure access.', practice: 'Write your STAR answer.' },
    { title: 'Production Issue Explanation', explain: 'Explain issue, root cause, fix, testing and prevention.', example: 'Flow failed due to missing field permission.', practice: 'Write one issue story.' },
    { title: 'Deployment Checklist', explain: 'Verify tests, permissions, dependencies, rollback and smoke testing.', example: 'Deploy Flow, Apex and permission set together.', practice: 'Write deployment steps.' },
    { title: 'System Design Answer', explain: 'Explain requirements, data model, security, automation, integration, testing and trade-offs.', example: 'Design appointment management in Salesforce.', practice: 'Write architecture notes.' },
    { title: 'Resume Project Bullet', explain: 'A good bullet shows action, technology and measurable impact.', example: 'Built LWC appointment module with Apex and role-based access.', practice: 'Create one resume bullet.' },
  ],
};

const dailyActions = [
  ['Learn concept', 'Understand one small concept in simple words.'],
  ['Write note', 'Write meaning, use, example, interview line and mistake.'],
  ['Practice questions', 'Solve one easy, one scenario and one troubleshooting question.'],
  ['Speak answer', 'Speak a 60-second answer with example and impact.'],
  ['Create proof', 'Convert the topic into one resume/project bullet.'],
  ['Mark status', 'Mark the topic Weak or Strong and plan revision.'],
];

const diagnosticQuestions = [
  'I can explain what Salesforce CRM is.',
  'I know the difference between object, field and record.',
  'I know when to use Profile and Permission Set.',
  'I can explain Flow vs Apex at a basic level.',
  'I understand Apex trigger lifecycle.',
  'I can write a basic SOQL query.',
  'I understand LWC parent-child communication.',
  'I know how a REST API integration works.',
  'I know the basics of Salesforce deployment.',
  'I can explain one project in STAR format.',
];

const conceptLibrary = [
  ['Admin', 'CRM', 'Customer lifecycle, sales/service process, leads, accounts, contacts, opportunities.'],
  ['Admin', 'Data Model', 'Objects, fields, records, record types, lookup and master-detail relationships.'],
  ['Admin', 'Security', 'Profiles, permission sets, OWD, role hierarchy, sharing and field-level security.'],
  ['Admin', 'Automation', 'Validation rules, flows, approval process, assignment rules and scheduled paths.'],
  ['Developer', 'Apex', 'Classes, triggers, collections, DML, SOQL, exception handling and test coverage.'],
  ['Developer', 'LWC', 'Component structure, properties, events, wire service, imperative Apex and UI handling.'],
  ['Developer', 'Integration', 'REST API, authentication, Named Credentials, JSON, callouts and retry strategy.'],
  ['Project', 'Deployment', 'Sandbox, metadata, test execution, release checklist and rollback plan.'],
];

const scenarioPrompts = [
  'A sales manager wants automatic lead assignment based on city and product interest.',
  'Support users cannot see cases owned by another team. Design the security fix.',
  'A flow fails in production after deployment. Explain investigation and prevention.',
  'A client wants patient appointments, doctor notes, reports and role-based access.',
  'An external system must send payment status to Salesforce. Design the integration.',
  'A recruiter asks you to explain your Salesforce project in two minutes.',
];

function todayDay() {
  const start = readStore('zeroHeroStart', new Date().toISOString());
  const diff = Math.floor((Date.now() - new Date(start).getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(60, diff));
}
function phaseForDay(day) {
  return phases.find(p => { const [a, b] = p.days.split('-').map(Number); return day >= a && day <= b; }) || phases[0];
}
function buildMentorPlan(day, phase, lesson) {
  return `Day ${day} Mentor Plan\n\nPhase: ${phase.name}\nLesson: ${lesson.title}\n\n90-minute plan:\n1. 20 min - Understand the concept.\n2. 15 min - Write the 5-line note.\n3. 20 min - Solve guided scenario.\n4. 15 min - Speak STAR answer.\n5. 20 min - Create project proof.\n\nInterview line:\n${lesson.explain}`;
}
function score(state) {
  const done = Object.values(state.done || {}).filter(Boolean).length;
  const diag = Object.values(state.diagnostic || {}).filter(Boolean).length;
  const proof = (state.projectProof || '').length > 70 ? 12 : 0;
  const interview = (state.interviewAnswer || '').length > 70 ? 12 : 0;
  const scenario = Object.values(state.scenario || {}).join('').length > 80 ? 12 : 0;
  return Math.min(100, Math.round(done * 3 + diag * 3 + proof + interview + scenario));
}

export function ZeroToHeroArchitect() {
  const [state, setState] = React.useState(() => readStore('zeroHeroArchitectV4', {
    day: todayDay(), track: 45, tab: 'start', activeLesson: '', mentorPlan: '', simpleNote: '', conceptQuery: '', conceptFilter: 'All', diagnostic: {}, done: {}, scenarioPrompt: scenarioPrompts[0], scenario: {}, decision: { type: 'Simple business automation', answer: '' }, projectProof: '', interview: {}, interviewAnswer: '', weekly: '', confidence: ''
  }));
  const save = patch => { const next = { ...state, ...patch }; setState(next); writeStore('zeroHeroArchitectV4', next); };
  const day = Math.min(Number(state.day || todayDay()), Number(state.track || 45));
  const phase = phaseForDay(day);
  const lessons = microLessons[phase.name] || microLessons['CRM + Salesforce Basics'];
  const lesson = lessons.find(x => x.title === state.activeLesson) || lessons[(day - 1) % lessons.length];
  const readiness = score(state);
  const diagnosticScore = Object.values(state.diagnostic || {}).filter(Boolean).length;
  const completedActions = Object.values(state.done || {}).filter(Boolean).length;
  const generatedBullet = state.projectProof || `Built a Salesforce ${lesson.title} solution using ${phase.name} concepts with security, testing and business impact.`;
  const generatedInterview = state.interviewAnswer || `Situation: A business needed a reliable Salesforce solution. Task: I had to understand ${lesson.title}. Action: I designed the data, security and automation approach. Result: The solution became easier to maintain and explain in interviews.`;
  const filteredConcepts = conceptLibrary.filter(([category, title, text]) => {
    const q = String(state.conceptQuery || '').toLowerCase();
    const okFilter = state.conceptFilter === 'All' || category === state.conceptFilter;
    const okSearch = !q || `${category} ${title} ${text}`.toLowerCase().includes(q);
    return okFilter && okSearch;
  });
  const startToday = () => save({ activeLesson: lesson.title, mentorPlan: buildMentorPlan(day, phase, lesson), simpleNote: `Topic: ${lesson.title}\nMeaning: ${lesson.explain}\nWhy it is used:\nReal Salesforce example: ${lesson.example}\nInterview answer line:\nCommon mistake:` });
  const toggle = key => save({ done: { ...state.done, [key]: !state.done?.[key] } });
  const toggleDiagnostic = key => save({ diagnostic: { ...state.diagnostic, [key]: !state.diagnostic?.[key] } });
  const updateScenario = (key, value) => save({ scenario: { ...(state.scenario || {}), [key]: value } });
  const updateInterview = (key, value) => save({ interview: { ...(state.interview || {}), [key]: value } });
  const exportPlan = () => downloadText('salesforce-learning-plan.txt', `Program: ${APP_NAME} ${APP_VERSION}\nDay: ${day}\nTrack: ${state.track} days\nPhase: ${phase.name}\nLesson: ${lesson.title}\nReadiness: ${readiness}%\n\nMentor Plan:\n${state.mentorPlan}\n\nNote:\n${state.simpleNote}\n\nProject Proof:\n${generatedBullet}\n\nInterview Answer:\n${generatedInterview}\n\nWeekly Review:\n${state.weekly}`);

  return <Layout><Page>
    <Hero eyebrow={APP_VERSION} title={APP_NAME} subtitle="A clean beginner-friendly learning plan: Start Today, Foundation, Practice, Proof, Interview and Review.">
      <div className="scoreMini"><b>{readiness}%</b><small>Readiness</small><Progress value={readiness}/></div>
    </Hero>

    <Card title="Today Summary" subtitle="This is the only summary you need before starting.">
      <div className="summaryGrid">
        <div><small>Today</small><b>Day {day}</b><span>{phase.name}</span></div>
        <div><small>Lesson</small><b>{lesson.title}</b><span>{lesson.practice}</span></div>
        <div><small>Time Needed</small><b>90 minutes</b><span>Learn, practice, speak, proof</span></div>
        <div><small>Status</small><b>{completedActions ? 'In Progress' : 'Not Started'}</b><span>{completedActions} actions completed</span></div>
      </div>
    </Card>

    <Card title="Learning Plan Pages" subtitle="Page -> Sub-page -> Action. Use tabs in order.">
      <div className="tabBar">{tabs.map(([id, label]) => <button key={id} className={state.tab === id ? 'active' : ''} onClick={() => save({ tab: id })}>{label}</button>)}</div>
    </Card>

    {state.tab === 'start' && <>
      <Card title="1. Fast Track Setup" subtitle="Choose one track. Do not change it every day.">
        <div className="trackCompactGrid">{tracks.map(track => <button key={track.days} className={Number(state.track) === track.days ? 'trackCompact active' : 'trackCompact'} onClick={() => save({ track: track.days, day: Math.min(day, track.days) })}><b>{track.name}</b><span>{track.purpose}</span><small>{track.note}</small></button>)}</div>
        <div className="row"><input type="number" min="1" max={state.track || 60} value={day} onChange={e => save({ day: Number(e.target.value) })}/><button className="btn cyan" onClick={startToday}>Start Today</button><button className="btn ghost" onClick={exportPlan}>Export Plan</button><button className="btn ghost" onClick={() => { writeStore('zeroHeroStart', new Date().toISOString()); save({ day: 1 }); }}>Reset Day 1</button></div>
      </Card>
      <Card title="2. Today Checklist" subtitle="Finish these six actions. Simple and clear.">
        <div className="checkActionList">{dailyActions.map(([title, text], index) => <label key={title} className={state.done?.[title] ? 'done' : ''}><input type="checkbox" checked={!!state.done?.[title]} onChange={() => toggle(title)}/><b>{index + 1}. {title}</b><span>{text}</span></label>)}</div>
      </Card>
      <Card title="3. Today Micro Lesson" subtitle="Left side lesson list, right side explanation and practice.">
        <div className="lessonSplit"><div className="lessonList">{lessons.map((item, i) => <button key={item.title} className={lesson.title === item.title ? 'active' : ''} onClick={() => save({ activeLesson: item.title })}><b>{i + 1}</b><span>{item.title}</span></button>)}</div><div className="lessonDetail"><h3>{lesson.title}</h3><p><b>Explanation:</b> {lesson.explain}</p><p><b>Example:</b> {lesson.example}</p><p><b>Practice:</b> {lesson.practice}</p><textarea value={state.mentorPlan} onChange={e => save({ mentorPlan: e.target.value })} placeholder="Click Start Today to generate mentor plan."/></div></div>
      </Card>
    </>}

    {state.tab === 'foundation' && <>
      <Card title="4. Simple Note Builder" subtitle="English-first 5-line note template."><textarea value={state.simpleNote} onChange={e => save({ simpleNote: e.target.value })} placeholder="Topic:\nMeaning:\nWhy it is used:\nReal Salesforce example:\nInterview answer line:\nCommon mistake:"/></Card>
      <Card title="5. Roadmap Accordion" subtitle="Open one phase at a time."><div className="roadmapAccordion">{phases.map(p => <details key={p.id} open={p.id === phase.id}><summary><b>{p.days} - {p.name}</b><span>{p.id === phase.id ? 'Current' : 'Open'}</span></summary><p>{p.focus}</p><small>{p.outcome}</small></details>)}</div></Card>
      <Card title="6. Diagnostic Score" subtitle="Repeat weekly to find weak basics."><div className="diagnosticScore"><b>{diagnosticScore}/10</b><span>Basics Score</span><Progress value={diagnosticScore * 10}/><p>Next action: {diagnosticScore < 4 ? 'Complete CRM and Data Model basics first.' : diagnosticScore < 8 ? 'Continue Security, Flow and Apex practice.' : 'Start deeper project and interview practice.'}</p></div><div className="grid2">{diagnosticQuestions.map(q => <label className="previewCard" key={q}><input type="checkbox" checked={!!state.diagnostic?.[q]} onChange={() => toggleDiagnostic(q)}/><b>{q}</b><small>{state.diagnostic?.[q] ? 'Known' : 'Need practice'}</small></label>)}</div></Card>
      <Card title="7. Searchable Concept Library" subtitle="Filter by Admin, Developer, Project or Interview."><div className="row"><input value={state.conceptQuery || ''} onChange={e => save({ conceptQuery: e.target.value })} placeholder="Search concept..."/><select value={state.conceptFilter || 'All'} onChange={e => save({ conceptFilter: e.target.value })}>{['All','Admin','Developer','Project'].map(x => <option key={x}>{x}</option>)}</select></div><div className="grid2">{filteredConcepts.map(([category, title, text]) => <div key={title} className="previewCard"><small>{category}</small><b>{title}</b><p>{text}</p><button className="btn small ghost" onClick={() => toggle(title)}>{state.done?.[title] ? 'Completed' : 'Mark Complete'}</button></div>)}</div></Card>
    </>}

    {state.tab === 'practice' && <>
      <Card title="8. Guided Scenario Practice" subtitle="Do not write one big paragraph. Fill each box."><select value={state.scenarioPrompt} onChange={e => save({ scenarioPrompt: e.target.value, scenario: {} })}>{scenarioPrompts.map(p => <option key={p}>{p}</option>)}</select><div className="guidedGrid">{['Requirement','Objects and Fields','Security','Automation or Code','Testing','Deployment','Business Impact'].map(key => <label key={key}><span>{key}</span><textarea value={state.scenario?.[key] || ''} onChange={e => updateScenario(key, e.target.value)} placeholder={`Write ${key.toLowerCase()} here...`}/></label>)}</div></Card>
      <Card title="9. Flow vs Apex Decision Helper" subtitle="Select requirement type and write reason."><div className="grid2"><select value={state.decision?.type || 'Simple business automation'} onChange={e => save({ decision: { ...(state.decision || {}), type: e.target.value } })}>{['Simple business automation','Complex reusable logic','Bulk data processing','External API integration','Custom UI requirement','Strict transaction control'].map(x => <option key={x}>{x}</option>)}</select><div className="previewCard"><b>Suggested Solution</b><p>{['Complex reusable logic','Bulk data processing','External API integration','Strict transaction control'].includes(state.decision?.type) ? 'Apex is usually better.' : state.decision?.type === 'Custom UI requirement' ? 'LWC with Apex is usually better.' : 'Flow is usually better.'}</p></div></div><textarea value={state.decision?.answer || ''} onChange={e => save({ decision: { ...(state.decision || {}), answer: e.target.value } })} placeholder="Reason: requirement, data model, security, limits, testing and deployment."/></Card>
    </>}

    {state.tab === 'proof' && <>
      <Card title="10. Project Proof Builder" subtitle="Generate resume bullet and interview explanation."><textarea value={state.projectProof} onChange={e => save({ projectProof: e.target.value })} placeholder="Built a Salesforce feature for [business problem] using [Flow/Apex/LWC] with [security/testing], improving [impact]."/><div className="grid2"><div className="previewCard"><b>Generated Resume Bullet</b><p>{generatedBullet}</p></div><div className="previewCard"><b>Generated Interview Explanation</b><p>I used {lesson.title} in a Salesforce scenario, considered data model, security, automation/code, testing and business impact.</p></div></div></Card>
      <Card title="11. Project Rule" subtitle="Every concept must become proof."><p className="continueCard">If you cannot connect a topic to a project, revise it again. A recruiter remembers project proof more than memorized definitions.</p></Card>
    </>}

    {state.tab === 'interview' && <>
      <Card title="12. STAR Interview Answer Builder" subtitle="Build answer in STAR plus technical depth."><div className="guidedGrid">{['Situation','Task','Action','Result','Technical Depth','Business Impact'].map(key => <label key={key}><span>{key}</span><textarea value={state.interview?.[key] || ''} onChange={e => updateInterview(key, e.target.value)} placeholder={`Write ${key.toLowerCase()}...`}/></label>)}</div><textarea value={state.interviewAnswer} onChange={e => save({ interviewAnswer: e.target.value })} placeholder="Final 60-second answer."/><div className="previewCard"><b>Generated Structure</b><p>{generatedInterview}</p></div></Card>
      <Card title="13. Interview Levels" subtitle="Answer in three levels."><div className="grid3"><div className="previewCard"><b>Basic</b><p>Definition and simple meaning.</p></div><div className="previewCard"><b>Practical</b><p>Real scenario, implementation and testing.</p></div><div className="previewCard"><b>Architect</b><p>Trade-offs, security, limits, deployment and impact.</p></div></div></Card>
    </>}

    {state.tab === 'review' && <>
      <Card title="14. Weekly Report Card" subtitle="Review what happened this week."><textarea value={state.weekly} onChange={e => save({ weekly: e.target.value })} placeholder="This week completed:\nWeak topics:\nStrong topics:\nSaved answers:\nProject proof:\nNext week plan:"/><div className="grid2"><div className="previewCard"><b>Completed Actions</b><p>{completedActions}</p></div><div className="previewCard"><b>Diagnostic Score</b><p>{diagnosticScore}/10</p></div></div></Card>
      <Card title="15. Next Best Actions" subtitle="Simple actions for tomorrow."><div className="checkActionList"><label><input type="checkbox"/><b>Revise weak topic</b><span>{diagnosticScore < 5 ? 'Start with CRM/Data Model.' : 'Move to Flow/Apex scenario.'}</span></label><label><input type="checkbox"/><b>Save one answer</b><span>Use STAR format and mark Weak or Strong.</span></label><label><input type="checkbox"/><b>Create one proof</b><span>Add one resume/project bullet.</span></label></div><div className="row"><Link className="btn cyan" to="/practice">Practice Lab</Link><Link className="btn ghost" to="/ai-mentor">Ask AI Mentor</Link><button className="btn ghost" onClick={exportPlan}>Export Report</button></div></Card>
    </>}
  </Page></Layout>;
}
