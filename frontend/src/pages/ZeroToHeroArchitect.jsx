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

const simulatorFeatures = [
  'Zero Knowledge Diagnostic Test','Personal Mentor Interview Mode','Daily Explain to Me Oral Practice','Topic Unlock System','Beginner Mistake Warning System','Salesforce Vocabulary Builder','Concept-to-Project Mapping','Admin vs Developer Decision Coach','Flow vs Apex Decision Simulator','Real Production Bug Simulator','Client Requirement to Solution Builder','BRD to Salesforce Design Practice','Data Model Designer Practice','Security Model Simulator','Governor Limit Trainer','Apex Debug Log Reader','LWC Error Fixing Lab','SOQL Query Builder Trainer','Integration API Practice Room','Deployment War Room','Release Notes Learning Tracker','Daily Salesforce News Learning','Architect Trade-off Practice','Mock Client Call Practice','Solution Design Review Checklist','Requirement Clarification Question Bank','Project Documentation Generator','Interview Confidence Tracker','English Speaking for Salesforce Interviews','Final Job Simulation Week'
];

const diagnosticQuestions = ['What is CRM?','Difference between object and field?','What is profile vs permission set?','When to use Flow?','What is Apex trigger?','What is SOQL?','What is LWC?','What is integration?','What is deployment?','How do you explain a project?'];
const vocabulary = ['Lead','Account','Contact','Opportunity','Case','Object','Field','Record Type','Profile','Permission Set','OWD','Role Hierarchy','Sharing Rule','Flow','Apex','Trigger','LWC','SOQL','REST API','Named Credential'];
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
  const diagnostic = Object.values(s.diagnostic||{}).filter(Boolean).length * 3;
  return Math.min(100, Math.round(tasks*2 + proof + teach + project + diagnostic));
}
function autoMentor(state){
  const d = todayDay(); const phase = phaseForDay(d); const weak = Object.entries(readStore('weakStrong',{})).filter(([,v])=>v==='Weak').map(([k])=>k)[0] || phase.focus.split(',')[0];
  return `Day ${d} Mentor Guidance\n\nPhase: ${phase.name}\nFocus: ${phase.focus}\n\nToday's deep work:\n1. Learn one concept: ${weak}\n2. Create one simple note in Hinglish\n3. Solve 5 practice questions\n4. Write one 60-second interview answer\n5. Add one project proof line\n\nArchitect thinking:\n- Requirement kya hai?\n- Data model kya hoga?\n- Security impact kya hai?\n- Flow vs Apex decision kya hai?\n- Testing and deployment kaise hoga?`;
}

export function ZeroToHeroArchitect(){
  const [state,setState]=React.useState(()=>readStore('zeroHeroArchitect',{day:todayDay(),dailyProof:'',teachBack:'',projectProof:'',questionAnswer:'',mentorNote:'',done:{},diagnostic:{},architectDecision:'',systemDesign:'',clientRequirement:'',brd:'',dataModel:'',securityModel:'',soql:'SELECT Id, Name FROM Account LIMIT 10',apiRoom:'',debugLog:'',lwcError:'',confidence:'',englishPractice:'',releaseNotes:''}));
  const save=p=>{const n={...state,...p}; setState(n); writeStore('zeroHeroArchitect',n);};
  const day = state.day || todayDay(); const phase = phaseForDay(day); const pct = score(state);
  const toggle=x=>save({done:{...state.done,[x]:!state.done?.[x]}});
  const toggleDiag=x=>save({diagnostic:{...state.diagnostic,[x]:!state.diagnostic?.[x]}});
  const generate=()=>save({mentorNote:autoMentor(state)});
  const exportPlan=()=>downloadText('zero-to-hero-architect-plan.txt',`Day ${day}\nPhase: ${phase.name}\nScore: ${pct}%\n\nMentor Note:\n${state.mentorNote}\n\nDaily Proof:\n${state.dailyProof}\n\nTeach Back:\n${state.teachBack}\n\nProject Proof:\n${state.projectProof}`);

  return <Layout><Page>
    <Hero title="Zero to Hero Salesforce Architect Mentor" subtitle="20+ years Solution Architect style guidance: basics, depth, project thinking, client simulation, production bugs and final job simulation.">
      <div className="scoreMini"><b>{pct}%</b><small>Today Readiness</small><Progress value={pct}/></div>
    </Hero>

    <div className="statsGrid"><div className="stat"><span>🎯</span><p>Today Day</p><b>Day {day}</b><small>{phase.name}</small></div><div className="stat"><span>🏗️</span><p>Architect Phase</p><b>{phase.id}/6</b><small>{phase.days}</small></div><div className="stat"><span>✅</span><p>Tasks Done</p><b>{Object.values(state.done||{}).filter(Boolean).length}</b><small>daily proof</small></div><div className="stat"><span>🧠</span><p>Diagnostic</p><b>{Object.values(state.diagnostic||{}).filter(Boolean).length}/10</b><small>basic check</small></div></div>

    <Card title="Mentor Automation" subtitle="Generate today's guidance from your current phase and weak topics."><div className="row"><input type="number" min="1" max="120" value={day} onChange={e=>save({day:Number(e.target.value)})}/><button className="btn cyan" onClick={generate}>Generate Mentor Guidance</button><button className="btn ghost" onClick={exportPlan}>Export Plan</button><button className="btn ghost" onClick={()=>writeStore('zeroHeroStart',new Date().toISOString())}>Reset Day 1</button></div><textarea value={state.mentorNote} onChange={e=>save({mentorNote:e.target.value})} placeholder="Click Generate Mentor Guidance"/></Card>

    <Card title="Zero Knowledge Diagnostic Test"><div className="grid2">{diagnosticQuestions.map(q=><label className="previewCard" key={q}><input type="checkbox" checked={!!state.diagnostic?.[q]} onChange={()=>toggleDiag(q)}/><b>{q}</b><small>{state.diagnostic?.[q]?'I know this':'Need to learn'}</small></label>)}</div></Card>

    <Card title="120-Day Beginner to Architect Roadmap"><div className="timeline premiumTimeline">{phases.map(p=><div className={p.id===phase.id?'timelineCard taskDone':'timelineCard'} key={p.id}><b>{p.days}</b><h3>{p.name}</h3><p>{p.focus}</p><small>{p.outcome}</small></div>)}</div></Card>

    <Card title="Absolute Basics Foundation"><div className="grid2">{basics.map(([t,d])=><div className="previewCard" key={t}><b>{t}</b><p>{d}</p><button className="btn small ghost" onClick={()=>toggle(t)}>{state.done?.[t]?'Done':'Mark Done'}</button></div>)}</div></Card>

    <Card title="Salesforce Vocabulary Builder"><div className="atsKeywords">{vocabulary.map(v=><span key={v}>{v}</span>)}</div><textarea placeholder="Write meaning in your words: Lead = ... Account = ... Opportunity = ..." onBlur={e=>writeStore('salesforceVocabularyNotes',e.target.value)}/></Card>

    <Card title="Client Requirement to Solution Builder + BRD Practice"><div className="grid2"><textarea value={state.clientRequirement} onChange={e=>save({clientRequirement:e.target.value})} placeholder="Client says: We need to track patient appointments / leads / follow-ups..."/><textarea value={state.brd} onChange={e=>save({brd:e.target.value})} placeholder="BRD: problem, users, data, automation, reports, security, acceptance criteria"/></div></Card>

    <Card title="Architect Decision Framework" subtitle="Use this for every Salesforce feature."><div className="architectureBox"><div>Business Requirement</div><div>Data Model</div><div>Security</div><div>Automation</div><div>Code</div><div>Integration</div><div>Testing</div><div>Deployment</div></div><textarea value={state.architectDecision} onChange={e=>save({architectDecision:e.target.value})} placeholder="Write decision: Flow vs Apex, sync vs async, object model, security, limits, testing."/></Card>

    <Card title="Admin vs Developer + Flow vs Apex Decision Simulator"><div className="grid2"><div className="previewCard"><b>Use Admin/Flow when</b><p>Simple automation, low complexity, admin maintainable, no complex transaction logic.</p></div><div className="previewCard"><b>Use Apex when</b><p>Complex logic, bulk processing, integration orchestration, custom error handling, reusable services.</p></div></div><textarea placeholder="Requirement: decide Admin, Flow, Apex or LWC and explain trade-off." onBlur={e=>writeStore('flowApexDecision',e.target.value)}/></Card>

    <Card title="Data Model Designer + Security Model Simulator"><div className="grid2"><textarea value={state.dataModel} onChange={e=>save({dataModel:e.target.value})} placeholder="Objects, fields, relationships, record types, master-detail/lookup decision"/><textarea value={state.securityModel} onChange={e=>save({securityModel:e.target.value})} placeholder="OWD, role hierarchy, profiles, permission sets, sharing, FLS"/></div></Card>

    <Card title="Governor Limit Trainer + Apex Debug Log Reader"><div className="grid2"><div className="previewCard"><b>Governor checklist</b><p>No SOQL/DML in loop, bulk-safe collections, selective queries, async for callouts/heavy processing.</p></div><textarea value={state.debugLog} onChange={e=>save({debugLog:e.target.value})} placeholder="Paste debug log / error and write root cause + fix"/></div></Card>

    <Card title="LWC Error Fixing Lab + SOQL Query Builder Trainer"><div className="grid2"><textarea value={state.lwcError} onChange={e=>save({lwcError:e.target.value})} placeholder="LWC error: wire undefined, event not firing, Apex error, UI not reactive..."/><textarea value={state.soql} onChange={e=>save({soql:e.target.value})} placeholder="Write SOQL query"/></div><p className="continueCard">SOQL practice: filter, relationship query, aggregate, limit, order by, selective where clause.</p></Card>

    <Card title="Integration API Practice Room + Deployment War Room"><div className="grid2"><textarea value={state.apiRoom} onChange={e=>save({apiRoom:e.target.value})} placeholder="API design: endpoint, auth, request, response, error, retry, limits"/><div className="previewCard"><b>Deployment War Room</b><p>Pre-check: tests, dependencies, permissions, backup. Deploy: monitor. Post-check: smoke test, logs, rollback plan.</p></div></div></Card>

    <Card title="Release Notes + Daily Salesforce News Learning"><textarea value={state.releaseNotes} onChange={e=>save({releaseNotes:e.target.value})} placeholder="Write release note learning / Salesforce news summary and how it impacts projects"/></Card>

    <Card title="Daily Deep Learning Questions"><div className="grid2">{dailyQuestions.map(q=><label className="previewCard" key={q}><input type="checkbox" checked={!!state.done?.[q]} onChange={()=>toggle(q)}/><b>{q}</b></label>)}</div></Card>

    <div className="grid2"><Card title="Daily Explain to Me Oral Practice + English Speaking"><textarea value={state.englishPractice} onChange={e=>save({englishPractice:e.target.value})} placeholder="Speak/write: Today I learned..., In my project I used..., The impact was..."/></Card><Card title="Teach-back Mode"><textarea value={state.teachBack} onChange={e=>save({teachBack:e.target.value})} placeholder="Explain today's topic like teaching a beginner. Simple English + Hinglish."/></Card></div>

    <Card title="Daily Learning Proof"><textarea value={state.dailyProof} onChange={e=>save({dailyProof:e.target.value})} placeholder="Today I learned..., practiced..., mistake..., tomorrow..."/></Card>

    <Card title="Concept-to-Project Mapping + Project Documentation Generator"><textarea value={state.projectProof} onChange={e=>save({projectProof:e.target.value})} placeholder="Map concept to project proof: business problem, design, objects, security, automation/code, testing, impact."/><p className="continueCard">Documentation sections: overview, users, data model, automation, code, security, integrations, reports, testing, deployment, limitations.</p></Card>

    <Card title="System Design / Solution Design Practice"><select value={state.systemDesign} onChange={e=>save({systemDesign:e.target.value})}>{['Select prompt',...systemDesignPrompts].map(x=><option key={x}>{x}</option>)}</select><textarea placeholder="Write design: requirements, objects, relationships, automations, Apex/LWC, integration, security, reports, deployment, trade-offs." onChange={e=>save({questionAnswer:e.target.value})}/></Card>

    <Card title="Mock Client Call + Requirement Clarification Question Bank"><div className="grid2"><textarea placeholder="Client call notes: what client asked, confusion, hidden requirement, constraints"/><div className="previewCard"><b>Clarifying questions</b><p>Who are users? What data? Who can see/edit? Volume? SLA? Integration? Reports? Approval? Exceptions? Audit?</p></div></div></Card>

    <Card title="Solution Design Review Checklist"><div className="checklistGrid">{['Requirement clear','Data model reviewed','Security reviewed','Automation decision justified','Limits considered','Testing planned','Deployment planned','Monitoring planned'].map(x=><label key={x}><input type="checkbox" checked={!!state.done?.[x]} onChange={()=>toggle(x)}/>{x}</label>)}</div></Card>

    <Card title="Real Production Bug Simulator"><div className="grid3">{['Flow failed after deployment','Too many SOQL queries','LWC data not refreshing','API timeout','User cannot see records','Validation rule blocking data load'].map(x=><div className="testQ" key={x}><b>{x}</b><textarea placeholder="Root cause, fix, test, prevention"/></div>)}</div></Card>

    <Card title="20+ Years Architect Principles"><div className="toolGrid">{architectPrinciples.map((p,i)=><button key={p} className={state.done?.[p]?'toolTile taskDone':'toolTile'} onClick={()=>toggle(p)}><b>{i+1}. {p}</b><span>{state.done?.[p]?'Internalized':'Mark understood'}</span></button>)}</div></Card>

    <Card title="Interview Depth Builder + Confidence Tracker"><div className="grid3"><textarea placeholder="Basic answer: definition"/><textarea placeholder="Intermediate answer: scenario + steps"/><textarea placeholder="Advanced answer: trade-offs + limits + testing + impact"/></div><input value={state.confidence} onChange={e=>save({confidence:e.target.value})} placeholder="Confidence score / fear / improvement plan"/></Card>

    <Card title="Final Job Simulation Week"><div className="taskGrid">{['Day 1: Diagnostic + basics','Day 2: Admin scenario','Day 3: Apex/LWC coding explanation','Day 4: Integration + security design','Day 5: Project deep dive','Day 6: Mock interview','Day 7: Resume + apply + review'].map(x=><button key={x} className={state.done?.[x]?'taskDone taskCard':'taskCard'} onClick={()=>toggle(x)}><b>{x}</b><span>{state.done?.[x]?'Completed':'Do now'}</span></button>)}</div></Card>

    <Card title="All 30 Mentor Simulator Features"><div className="toolGrid">{simulatorFeatures.map((p,i)=><button key={p} className={state.done?.[p]?'toolTile taskDone':'toolTile'} onClick={()=>toggle(p)}><b>{i+1}. {p}</b><span>{state.done?.[p]?'Active':'Mark active'}</span></button>)}</div></Card>

    <Card title="Next Best Actions"><div className="taskGrid">{['Complete today concept','Write teach-back note','Save project proof','Practice 5 questions','Record mock answer','Update resume bullet'].map(x=><button key={x} className={state.done?.[x]?'taskDone taskCard':'taskCard'} onClick={()=>toggle(x)}><b>{x}</b><span>{state.done?.[x]?'Completed':'Do now'}</span></button>)}</div><div className="row"><Link className="btn cyan" to="/practice">Practice Lab</Link><Link className="btn ghost" to="/ai-mentor">Ask AI Mentor</Link><Link className="btn ghost" to="/final-premium">Final Premium</Link></div></Card>
  </Page></Layout>;
}
