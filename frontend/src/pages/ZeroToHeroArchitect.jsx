import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';

const APP_NAME = 'Salesforce Architect Accelerator Pro';
const APP_VERSION = 'v3.0 Fast Track';

const tracks = [
  { days: 30, name: 'Interview Sprint', note: 'Only high-impact basics, project story, and mock interview readiness.' },
  { days: 45, name: 'Job-Ready Track', note: 'Balanced Salesforce Admin, Developer, LWC, Flow, and interview depth.' },
  { days: 60, name: 'Architect Foundation', note: 'Deep foundation with solution design, security, integration, and project proof.' },
];

const phases = [
  { id: 1, name: 'CRM + Salesforce Basics', days: '1-7', focus: 'CRM, Salesforce navigation, objects, fields, records, relationships, page layouts.', outcome: 'You can explain Salesforce basics clearly.' },
  { id: 2, name: 'Admin + Security', days: '8-16', focus: 'Profiles, permission sets, OWD, role hierarchy, sharing rules, validation rules, reports.', outcome: 'You can design a secure basic Salesforce app.' },
  { id: 3, name: 'Flow + Automation', days: '17-25', focus: 'Record-triggered flows, screen flows, approval process, fault path, Flow vs Apex decision.', outcome: 'You can automate business processes safely.' },
  { id: 4, name: 'Apex + SOQL + Trigger', days: '26-38', focus: 'Apex class, SOQL, DML, triggers, bulkification, governor limits, test classes.', outcome: 'You can write and explain clean Apex logic.' },
  { id: 5, name: 'LWC + Integration', days: '39-50', focus: 'LWC basics, events, wire, imperative Apex, REST API, Named Credentials, error handling.', outcome: 'You can build UI and integration features.' },
  { id: 6, name: 'Projects + Interview + Architecture', days: '51-60', focus: 'Project proof, system design, deployment checklist, production issues, mock interviews.', outcome: 'You can explain your project like a job-ready Salesforce Developer.' },
];

const conceptLibrary = [
  ['CRM', 'Customer lifecycle, sales/service process, leads, accounts, contacts, opportunities.'],
  ['Data Model', 'Objects, fields, records, record types, lookup vs master-detail relationships.'],
  ['Security', 'Profiles, permission sets, OWD, role hierarchy, sharing, field-level security.'],
  ['Automation', 'Validation rules, flows, approval process, assignment rules, scheduled paths.'],
  ['Apex', 'Classes, triggers, collections, DML, SOQL, exception handling, test coverage.'],
  ['LWC', 'Component structure, properties, events, wire service, imperative Apex, UI handling.'],
  ['Integration', 'REST API, authentication, Named Credentials, JSON, callouts, retry strategy.'],
  ['Deployment', 'Sandbox, metadata, test execution, release checklist, rollback plan.'],
];

const dailySystem = [
  { icon: 'ðŸ“˜', title: 'Learn', text: 'Read one small concept. Do not jump to advanced topics first.' },
  { icon: 'ðŸ“', title: 'Write', text: 'Write a simple 5-line note: what, why, where, example, mistake.' },
  { icon: 'ðŸ§ª', title: 'Practice', text: 'Solve one easy question, one scenario question, and one troubleshooting question.' },
  { icon: 'ðŸŽ¤', title: 'Explain', text: 'Speak a 60-second interview answer with definition, example, and impact.' },
  { icon: 'ðŸ—ï¸', title: 'Project Proof', text: 'Convert the topic into a project bullet for resume and interview.' },
  { icon: 'ðŸ”', title: 'Review', text: 'Mark the topic Weak or Strong and add it to revision.' },
];

const microLessons = {
  'CRM + Salesforce Basics': ['What is CRM?', 'Object vs Field vs Record', 'Lookup vs Master-Detail', 'Page Layout vs Lightning Record Page', 'Basic Reports'],
  'Admin + Security': ['Profile vs Permission Set', 'OWD and Sharing Rules', 'Role Hierarchy', 'Field-Level Security', 'Validation Rule'],
  'Flow + Automation': ['Record-Triggered Flow', 'Screen Flow', 'Flow Fault Path', 'Approval Process', 'Flow vs Apex'],
  'Apex + SOQL + Trigger': ['Apex Class Basics', 'SOQL Query Basics', 'Trigger Lifecycle', 'Bulkification', 'Test Class Pattern'],
  'LWC + Integration': ['LWC Component Structure', 'Parent-to-Child Communication', 'Wire vs Imperative Apex', 'REST API Basics', 'Named Credential'],
  'Projects + Interview + Architecture': ['Project STAR Story', 'Production Issue Explanation', 'Deployment Checklist', 'System Design Answer', 'Resume Project Bullet'],
};

const diagnosticQuestions = [
  'I can explain what Salesforce CRM is.',
  'I know the difference between object, field, and record.',
  'I know when to use Profile and Permission Set.',
  'I can explain Flow vs Apex at a basic level.',
  'I understand Apex trigger lifecycle.',
  'I can write a basic SOQL query.',
  'I understand LWC parent-child communication.',
  'I know how a REST API integration works.',
  'I know the basics of Salesforce deployment.',
  'I can explain one project in STAR format.',
];

const architectFramework = ['Requirement', 'Data Model', 'Security', 'Automation', 'Apex/LWC', 'Integration', 'Testing', 'Deployment', 'Monitoring', 'Trade-offs'];
const scenarioPrompts = [
  'A sales manager wants automatic lead assignment based on city and product interest.',
  'Support users cannot see cases owned by another team. Design the security fix.',
  'A flow fails in production after deployment. Explain investigation and prevention.',
  'A client wants patient appointments, doctor notes, reports, and role-based access.',
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
function score(state) {
  const done = Object.values(state.done || {}).filter(Boolean).length;
  const diag = Object.values(state.diagnostic || {}).filter(Boolean).length;
  const proof = (state.projectProof || '').length > 80 ? 12 : 0;
  const interview = (state.interviewAnswer || '').length > 80 ? 12 : 0;
  const decision = (state.architectDecision || '').length > 80 ? 12 : 0;
  return Math.min(100, Math.round(done * 3 + diag * 3 + proof + interview + decision));
}
function buildMentorPlan(day, phase, lesson) {
  return `Day ${day} Mentor Plan\n\nProgram: ${APP_NAME} ${APP_VERSION}\nPhase: ${phase.name}\nMain lesson: ${lesson}\n\n90-minute fast plan:\n1. 20 min - Learn the concept in simple words.\n2. 15 min - Write a 5-line note.\n3. 20 min - Solve one scenario question.\n4. 15 min - Speak a 60-second interview answer.\n5. 20 min - Create one project proof bullet.\n\nArchitect thinking checklist:\n- What is the business requirement?\n- What data model is needed?\n- Who can see and edit the data?\n- Should this be Flow, Apex, LWC, or integration?\n- How will you test and deploy it?`;
}

export function ZeroToHeroArchitect() {
  const [state, setState] = React.useState(() => readStore('zeroHeroArchitect', {
    day: todayDay(), track: 45, activeLesson: '', mentorPlan: '', simpleNote: '', scenarioAnswer: '', architectDecision: '', projectProof: '', interviewAnswer: '', confidence: '', diagnostic: {}, done: {}, currentScenario: scenarioPrompts[0]
  }));
  const save = patch => { const next = { ...state, ...patch }; setState(next); writeStore('zeroHeroArchitect', next); };
  const day = Math.min(Number(state.day || todayDay()), Number(state.track || 45));
  const phase = phaseForDay(day);
  const lessons = microLessons[phase.name] || microLessons['CRM + Salesforce Basics'];
  const lesson = state.activeLesson || lessons[(day - 1) % lessons.length];
  const readiness = score(state);
  const toggle = key => save({ done: { ...state.done, [key]: !state.done?.[key] } });
  const toggleDiagnostic = key => save({ diagnostic: { ...state.diagnostic, [key]: !state.diagnostic?.[key] } });
  const startToday = () => save({ activeLesson: lesson, mentorPlan: buildMentorPlan(day, phase, lesson), simpleNote: `Topic: ${lesson}\n\nWhat it means:\nWhy it is used:\nReal project example:\nInterview line:\nCommon mistake:` });
  const exportPlan = () => downloadText('salesforce-accelerator-pro-plan.txt', `Program: ${APP_NAME} ${APP_VERSION}\nDay: ${day}\nTrack: ${state.track} days\nPhase: ${phase.name}\nReadiness: ${readiness}%\n\nMentor Plan:\n${state.mentorPlan}\n\nSimple Note:\n${state.simpleNote}\n\nScenario Answer:\n${state.scenarioAnswer}\n\nProject Proof:\n${state.projectProof}\n\nInterview Answer:\n${state.interviewAnswer}`);

  return <Layout><Page>
    <div className="zero3dHero"><div className="zero3dOrb orb1"/><div className="zero3dOrb orb2"/><Hero eyebrow={APP_VERSION} title={APP_NAME} subtitle="A systematic English-first fast-track mentor to cover Salesforce from basics to job-ready project explanation in less time."><div className="scoreMini"><b>{readiness}%</b><small>Readiness</small><Progress value={readiness}/></div>
    <Card title="Learning Plan Structure" subtitle="Page -> Sub-page -> Action. Start from Basics, then move to Build, Interview and Review.">
      <div className="pageSubpageMap">
        <a href="#lp-start" className="pageSubpageCard"><b>Page 1: Start & Track</b><small>Sub-pages: Fast Track, Today Board, Micro Lessons</small><p>Use this first every day to know exactly what to learn.</p></a>
        <a href="#lp-foundation" className="pageSubpageCard"><b>Page 2: Foundation</b><small>Sub-pages: Simple Notes, Roadmap, Diagnostic, Concept Library</small><p>Build basics before advanced topics.</p></a>
        <a href="#lp-practice" className="pageSubpageCard"><b>Page 3: Practice</b><small>Sub-pages: Scenario Practice, Decision Framework</small><p>Practice like real Salesforce work.</p></a>
        <a href="#lp-proof" className="pageSubpageCard"><b>Page 4: Proof & Interview</b><small>Sub-pages: Project Proof, Interview Builder, Weekly Checkpoint</small><p>Convert learning into resume and interview proof.</p></a>
      </div>
    </Card></Hero></div>

    <div className="zero3dStage"><div className="zero3dCard primary"><span>ðŸŽ¯</span><b>Day {day}</b><small>{phase.name}</small></div><div className="zero3dCard"><span>âš¡</span><b>{state.track || 45} Days</b><small>Fast track</small></div><div className="zero3dCard"><span>ðŸ“˜</span><b>{lesson}</b><small>Today lesson</small></div><div className="zero3dCard"><span>âœ…</span><b>{Object.values(state.done || {}).filter(Boolean).length}</b><small>Completed actions</small></div></div>

    <div id="lp-start" className="anchorPoint"></div><Card title="Fast Track Setup" subtitle="Choose how quickly you want to cover the complete journey."><div className="easyFlow3d">{tracks.map(track => <button key={track.days} className={Number(state.track) === track.days ? 'easyStep3d done' : 'easyStep3d'} onClick={() => save({ track: track.days, day: Math.min(day, track.days) })}><span>{track.days === 30 ? 'ðŸš€' : track.days === 45 ? 'âš¡' : 'ðŸ—ï¸'}</span><b>{track.days}-Day {track.name}</b><p>{track.note}</p><small>{Number(state.track) === track.days ? 'Selected' : 'Select track'}</small></button>)}</div><div className="row"><input type="number" min="1" max={state.track || 60} value={day} onChange={e => save({ day: Number(e.target.value) })}/><button className="btn cyan" onClick={startToday}>Start Today</button><button className="btn ghost" onClick={exportPlan}>Export Plan</button><button className="btn ghost" onClick={() => { writeStore('zeroHeroStart', new Date().toISOString()); save({ day: 1 }); }}>Reset Day 1</button></div></Card>

    <Card title="Today Learning Board" subtitle="Only the most useful learning actions. Complete these six actions every day."><div className="easyFlow3d">{dailySystem.map(item => <button key={item.title} className={state.done?.[item.title] ? 'easyStep3d done' : 'easyStep3d'} onClick={() => toggle(item.title)}><span>{item.icon}</span><b>{item.title}</b><p>{item.text}</p><small>{state.done?.[item.title] ? 'Completed' : 'Mark complete'}</small></button>)}</div></Card>

    <Card title="Today Micro Lessons" subtitle="Small lessons to finish the current phase quickly."><div className="lessonDeck3d">{lessons.map((item, i) => <button key={item} className={lesson === item ? 'lessonCard3d active' : 'lessonCard3d'} onClick={() => save({ activeLesson: item })}><b>{i + 1}</b><span>{item}</span><small>{phase.name}</small></button>)}</div><textarea value={state.mentorPlan} onChange={e => save({ mentorPlan: e.target.value })} placeholder="Click Start Today to generate the mentor plan."/></Card>

    <div id="lp-foundation" className="anchorPoint"></div><Card title="Simple Note Builder" subtitle="Write only five lines. This keeps learning easy and prevents overthinking."><textarea value={state.simpleNote} onChange={e => save({ simpleNote: e.target.value })} placeholder="Topic, meaning, why used, project example, interview line."/></Card>

    <Card title="60-Day Systematic Roadmap" subtitle="A clean roadmap without unnecessary sections."><div className="roadmap3d">{phases.map(p => <div key={p.id} className={p.id === phase.id ? 'roadNode3d active' : 'roadNode3d'}><b>{p.days}</b><h3>{p.name}</h3><p>{p.focus}</p><small>{p.outcome}</small></div>)}</div></Card>

    <Card title="Diagnostic Check" subtitle="Use this once, then repeat weekly to find weak basics."><div className="grid2">{diagnosticQuestions.map(q => <label className="previewCard" key={q}><input type="checkbox" checked={!!state.diagnostic?.[q]} onChange={() => toggleDiagnostic(q)}/><b>{q}</b><small>{state.diagnostic?.[q] ? 'Known' : 'Need practice'}</small></label>)}</div></Card>

    <Card title="Core Concept Library" subtitle="Only the concepts needed for interviews and real project work."><div className="grid2">{conceptLibrary.map(([title, text]) => <div key={title} className="previewCard"><b>{title}</b><p>{text}</p><button className="btn small ghost" onClick={() => toggle(title)}>{state.done?.[title] ? 'Completed' : 'Mark Complete'}</button></div>)}</div></Card>

    <div id="lp-practice" className="anchorPoint"></div><Card title="Scenario Practice" subtitle="Practice requirement thinking instead of memorizing answers."><select value={state.currentScenario} onChange={e => save({ currentScenario: e.target.value })}>{scenarioPrompts.map(p => <option key={p}>{p}</option>)}</select><textarea value={state.scenarioAnswer} onChange={e => save({ scenarioAnswer: e.target.value })} placeholder="Write: requirement, data model, security, automation/code, testing, deployment, impact."/></Card>

    <Card title="Architect Decision Framework" subtitle="Use this for every Salesforce feature and every interview scenario."><div className="architectureBox zero3dArchitecture">{architectFramework.map(step => <div key={step}>{step}</div>)}</div><textarea value={state.architectDecision} onChange={e => save({ architectDecision: e.target.value })} placeholder="Explain your decision: Flow vs Apex, data model, security, limits, integration, testing, and deployment."/></Card>

    <div id="lp-proof" className="anchorPoint"></div><Card title="Project Proof Builder" subtitle="Convert every topic into resume and interview proof."><textarea value={state.projectProof} onChange={e => save({ projectProof: e.target.value })} placeholder="Example: Built a Salesforce feature for [business problem] using [Flow/Apex/LWC] with [security/testing] which improved [impact]."/><p className="continueCard">Rule: If you cannot connect a topic to a project, revise it again.</p></Card>

    <Card title="Interview Answer Builder" subtitle="Build answers in three levels: basic, practical, architect."><div className="grid3"><textarea placeholder="Basic: definition"/><textarea placeholder="Practical: scenario + implementation"/><textarea placeholder="Architect: trade-offs + limits + testing + impact"/></div><textarea value={state.interviewAnswer} onChange={e => save({ interviewAnswer: e.target.value })} placeholder="Final 60-second answer."/></Card>

    <Card title="Weekly Checkpoint" subtitle="Review progress and decide what to repeat next week."><div className="grid2"><textarea value={state.confidence} onChange={e => save({ confidence: e.target.value })} placeholder="Confidence score, weak topics, blockers, next week plan."/><div className="previewCard"><b>Next Best Actions</b><p>1. Finish today's lesson. 2. Save one project proof. 3. Practice one scenario. 4. Speak one answer. 5. Mark Weak or Strong.</p><div className="row"><Link className="btn cyan" to="/practice">Practice Lab</Link><Link className="btn ghost" to="/ai-mentor">Ask AI Mentor</Link><Link className="btn ghost" to="/final-premium">Final Premium</Link></div></div></div></Card>
  </Page></Layout>;
}

