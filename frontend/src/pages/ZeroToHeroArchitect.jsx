import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';

const phases = [
  { id: 1, name: 'Foundation', days: '1-15', focus: 'CRM basics, Salesforce navigation, objects, fields, relationships, page layouts, validation rules, reports.', outcome: 'You can explain CRM + create basic Salesforce app confidently.' },
  { id: 2, name: 'Admin Core', days: '16-30', focus: 'Security model, profiles, permission sets, sharing rules, flows, approval process, data import/export.', outcome: 'You can build secure admin automations and explain why.' },
  { id: 3, name: 'Developer Core', days: '31-50', focus: 'Apex basics, SOQL, triggers, test classes, governor limits, bulkification, exception handling.', outcome: 'You can write clean Apex and pass developer interview basics.' },
  { id: 4, name: 'LWC + Integration', days: '51-70', focus: 'LWC lifecycle, events, wire, imperative Apex, REST API, Named Credentials, async Apex.', outcome: 'You can build UI + API features with secure architecture.' },
  { id: 5, name: 'Project + Interview', days: '71-90', focus: 'Real project case studies, scenario questions, system design, deployment, resume, mock interviews.', outcome: 'You can explain end-to-end project like a job-ready developer.' },
  { id: 6, name: 'Architect Upgrade', days: '91-120', focus: 'Solution design, trade-offs, data model, integration patterns, limits, security, scalability, governance.', outcome: 'You can think like a Salesforce Solution Architect.' }
];

const architectPrinciples = [
  'Always start with business process before tool or code.',
  'Prefer configuration first, code only when configuration cannot solve cleanly.',
  'Design security from day one: object, field, record, sharing, integration access.',
  'Think limits: governor limits, data volume, API limits, async processing, ownership skew.',
  'Every solution needs error handling, auditability, rollback and monitoring.',
  'Make reusable patterns: trigger framework, service layer, selectors, reusable LWC, common flows.',
  'Explain trade-offs: Flow vs Apex, sync vs async, lookup vs master-detail, platform event vs callout.',
  'Convert every project into measurable business impact.'
];

const basics = [
  ['CRM', 'Customer data, sales/service process, lifecycle, leads, accounts, contacts, opportunities.'],
  ['Data Model', 'Objects, fields, relationships, record types, schema builder, normalized data.'],
  ['Security', 'Profiles, permission sets, OWD, role hierarchy, sharing rules, FLS.'],
  ['Automation', 'Flow, approval process, validation rule, formula, assignment rules.'],
  ['Apex', 'Class, trigger, SOQL, DML, test class, governor limits, bulk design.'],
  ['LWC', 'Components, props, events, lifecycle, wire, Apex calls, UI API.'],
  ['Integration', 'REST API, auth, named credentials, JSON, callouts, async handling.'],
  ['Deployment', 'Change sets/Gearset, metadata, tests, sandbox, release checklist.']
];

const dailyQuestions = [
  'What did I learn today in simple English?',
  'Can I explain this in Hinglish to a beginner?',
  'Where is this used in a real Salesforce project?',
  'What can go wrong in production?',
  'How will I test it?',
  'How will I explain it in interview in 60 seconds?',
  'What is my weak point from today?',
  'What proof did I create today?'
];

const systemDesignPrompts = [
  'Design a Doctor Patient Management System in Salesforce.',
  'Design a lead assignment and follow-up automation system.',
  'Design an external payment/status integration with Salesforce.',
  'Design a scalable case management process for service agents.',
  'Design an AI assistant that searches saved learning data and web fallback.',
  'Design a secure portal for customers using Experience Cloud.'
];

function todayDay(){ const start = readStore('zeroHeroStart', new Date().toISOString()); const diff = Math.floor((Date.now() - new Date(start).getTime())/86400000)+1; return Math.max(1, Math.min(120, diff)); }
function phaseForDay(day){ return phases.find(p => { const [a,b]=p.days.split('-').map(Number); return day>=a && day<=b; }) || phases[0]; }
function score(s){
  const tasks = Object.values(s.done||{}).filter(Boolean).length;
  const proof = (s.dailyProof||'').length > 40 ? 10 : 0;
  const teach = (s.teachBack||'').length > 40 ? 10 : 0;
  const project = (s.projectProof||'').length > 60 ? 10 : 0;
  return Math.min(100, Math.round(tasks*4 + proof + teach + project));
}
function autoMentor(state){
  const d = todayDay(); const phase = phaseForDay(d); const weak = Object.entries(readStore('weakStrong',{})).filter(([,v])=>v==='Weak').map(([k])=>k)[0] || phase.focus.split(',')[0];
  return `Day ${d} Mentor Guidance\n\nPhase: ${phase.name}\nFocus: ${phase.focus}\n\nToday's deep work:\n1. Learn one concept: ${weak}\n2. Create one simple note in Hinglish\n3. Solve 5 practice questions\n4. Write one 60-second interview answer\n5. Add one project proof line\n\nArchitect thinking:\n- Requirement kya hai?\n- Data model kya hoga?\n- Security impact kya hai?\n- Flow vs Apex decision kya hai?\n- Testing and deployment kaise hoga?`;
}

export function ZeroToHeroArchitect(){
  const [state,setState]=React.useState(()=>readStore('zeroHeroArchitect',{day:todayDay(),dailyProof:'',teachBack:'',projectProof:'',questionAnswer:'',mentorNote:'',done:{},architectDecision:'',systemDesign:''}));
  const save=p=>{const n={...state,...p}; setState(n); writeStore('zeroHeroArchitect',n);};
  const day = state.day || todayDay(); const phase = phaseForDay(day); const pct = score(state);
  const toggle=x=>save({done:{...state.done,[x]:!state.done?.[x]}});
  const generate=()=>save({mentorNote:autoMentor(state)});
  const exportPlan=()=>downloadText('zero-to-hero-architect-plan.txt',`Day ${day}\nPhase: ${phase.name}\nScore: ${pct}%\n\nMentor Note:\n${state.mentorNote}\n\nDaily Proof:\n${state.dailyProof}\n\nTeach Back:\n${state.teachBack}\n\nProject Proof:\n${state.projectProof}`);

  return <Layout><Page>
    <Hero title="Zero to Hero Salesforce Architect Mentor" subtitle="20+ years Solution Architect style guidance: basics, depth, project thinking, interview explanation and production-ready mindset.">
      <div className="scoreMini"><b>{pct}%</b><small>Today Readiness</small><Progress value={pct}/></div>
    </Hero>

    <div className="statsGrid"><div className="stat"><span>🎯</span><p>Today Day</p><b>Day {day}</b><small>{phase.name}</small></div><div className="stat"><span>🏗️</span><p>Architect Phase</p><b>{phase.id}/6</b><small>{phase.days}</small></div><div className="stat"><span>✅</span><p>Tasks Done</p><b>{Object.values(state.done||{}).filter(Boolean).length}</b><small>daily proof</small></div><div className="stat"><span>🧠</span><p>Mode</p><b>Deep</b><small>zero to hero</small></div></div>

    <Card title="Mentor Automation" subtitle="Generate today's guidance from your current phase and weak topics."><div className="row"><input type="number" min="1" max="120" value={day} onChange={e=>save({day:Number(e.target.value)})}/><button className="btn cyan" onClick={generate}>Generate Mentor Guidance</button><button className="btn ghost" onClick={exportPlan}>Export Plan</button><button className="btn ghost" onClick={()=>writeStore('zeroHeroStart',new Date().toISOString())}>Reset Day 1</button></div><textarea value={state.mentorNote} onChange={e=>save({mentorNote:e.target.value})} placeholder="Click Generate Mentor Guidance"/></Card>

    <Card title="120-Day Beginner to Architect Roadmap"><div className="timeline premiumTimeline">{phases.map(p=><div className={p.id===phase.id?'timelineCard taskDone':'timelineCard'} key={p.id}><b>{p.days}</b><h3>{p.name}</h3><p>{p.focus}</p><small>{p.outcome}</small></div>)}</div></Card>

    <Card title="Absolute Basics Foundation"><div className="grid2">{basics.map(([t,d])=><div className="previewCard" key={t}><b>{t}</b><p>{d}</p><button className="btn small ghost" onClick={()=>toggle(t)}>{state.done?.[t]?'Done':'Mark Done'}</button></div>)}</div></Card>

    <Card title="Architect Decision Framework" subtitle="Use this for every Salesforce feature."><div className="architectureBox"><div>Business Requirement</div><div>Data Model</div><div>Security</div><div>Automation</div><div>Code</div><div>Integration</div><div>Testing</div><div>Deployment</div></div><textarea value={state.architectDecision} onChange={e=>save({architectDecision:e.target.value})} placeholder="Write decision: Flow vs Apex, sync vs async, object model, security, limits, testing."/></Card>

    <Card title="Daily Deep Learning Questions"><div className="grid2">{dailyQuestions.map(q=><label className="previewCard" key={q}><input type="checkbox" checked={!!state.done?.[q]} onChange={()=>toggle(q)}/><b>{q}</b></label>)}</div></Card>

    <div className="grid2"><Card title="Teach-back Mode"><textarea value={state.teachBack} onChange={e=>save({teachBack:e.target.value})} placeholder="Explain today's topic like teaching a 10th class student. Simple English + Hinglish."/></Card><Card title="Daily Learning Proof"><textarea value={state.dailyProof} onChange={e=>save({dailyProof:e.target.value})} placeholder="Today I learned..., practiced..., mistake..., tomorrow..."/></Card></div>

    <Card title="Project Proof Builder"><textarea value={state.projectProof} onChange={e=>save({projectProof:e.target.value})} placeholder="Convert today's concept into project proof: business problem, Salesforce solution, data/security, testing, impact."/><p className="continueCard">Rule: Har topic ko project proof mein convert karo. Interview mein wahi kaam aayega.</p></Card>

    <Card title="System Design / Solution Design Practice"><select value={state.systemDesign} onChange={e=>save({systemDesign:e.target.value})}>{['Select prompt',...systemDesignPrompts].map(x=><option key={x}>{x}</option>)}</select><textarea placeholder="Write design: requirements, objects, relationships, automations, Apex/LWC, integration, security, reports, deployment, trade-offs." onChange={e=>save({questionAnswer:e.target.value})}/></Card>

    <Card title="20+ Years Architect Principles"><div className="toolGrid">{architectPrinciples.map((p,i)=><button key={p} className={state.done?.[p]?'toolTile taskDone':'toolTile'} onClick={()=>toggle(p)}><b>{i+1}. {p}</b><span>{state.done?.[p]?'Internalized':'Mark understood'}</span></button>)}</div></Card>

    <Card title="Interview Depth Builder"><div className="grid3"><textarea placeholder="Basic answer: definition"/><textarea placeholder="Intermediate answer: scenario + steps"/><textarea placeholder="Advanced answer: trade-offs + limits + testing + impact"/></div></Card>

    <Card title="Next Best Actions"><div className="taskGrid">{['Complete today concept','Write teach-back note','Save project proof','Practice 5 questions','Record mock answer','Update resume bullet'].map(x=><button key={x} className={state.done?.[x]?'taskDone taskCard':'taskCard'} onClick={()=>toggle(x)}><b>{x}</b><span>{state.done?.[x]?'Completed':'Do now'}</span></button>)}</div><div className="row"><Link className="btn cyan" to="/practice">Practice Lab</Link><Link className="btn ghost" to="/ai-mentor">Ask AI Mentor</Link><Link className="btn ghost" to="/final-premium">Final Premium</Link></div></Card>
  </Page></Layout>;
}
