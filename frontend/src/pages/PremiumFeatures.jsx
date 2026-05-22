import React from 'react';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText } from '../utils/storage';

const featureGroups = [
  { group: 'AI Career Coach', icon: '🤖', items: ['AI Career Coach Mode','Daily Auto Mission Generator','One-click Today Plan','Smart Next Best Action','AI Resume Bullet Generator','AI Interview Answer Reviewer','Answer Quality Score','STAR Answer Builder','AI Doubt Solver with History','Scenario Question Generator'] },
  { group: 'Interview & Roles', icon: '🎤', items: ['Mock Interview Timer','Company-wise Interview Prep','Role-wise Prep Admin','Role-wise Prep Developer','Role-wise Prep LWC','Role-wise Prep Apex','Salesforce Topic Mastery Map','Skill Tree View','Learning Roadmap Timeline','AI Assistant System Design 50 Questions'] },
  { group: 'Revision & Mastery', icon: '📅', items: ['90-Day Calendar View','Revision Reminder System','Weak Topic Auto Revision List','Daily Streak Badge','Achievement Badge System','XP / Level System','Progress Heatmap','Weekly Report Generator','Sunday Test Auto Summary'] },
  { group: 'Projects & Architecture', icon: '🏗️', items: ['Project Case Study Builder','Architecture Diagram Section','Real-time Use Case Library','Deployment Checklist','Apex Trigger Checklist','LWC Component Checklist','Flow Debug Checklist','Integration Checklist'] },
  { group: 'Career & Resume', icon: '💼', items: ['Job Application Kanban Board','Follow-up Reminder Tracker','Recruiter Contact Tracker','JD Keyword Heatmap','ATS Resume Score Visualizer','Resume Version Manager','Portfolio Live Preview Editor','Public Portfolio Share Mode','PDF Resume Preview','Word Resume Preview','Download Portfolio as PDF'] },
];

const aiSystemDesignQuestions = Array.from({ length: 50 }, (_, i) => {
  const topics = ['LLM orchestration','RAG pipeline','vector database','prompt routing','tool calling','memory design','rate limiting','conversation history','evaluation','security','latency','cost optimization','fallback strategy','multi-agent design','observability','data privacy','streaming response','file upload pipeline','web search integration','cache design'];
  const topic = topics[i % topics.length];
  return {
    id: `ai-sd-${i + 1}`,
    title: `Q${i + 1}. Design an AI assistant system focusing on ${topic}`,
    level: i < 17 ? 'Easy' : i < 34 ? 'Medium' : 'Hard',
    question: `In a system design interview, explain how you would design a production-ready AI assistant where ${topic} is a key requirement. Cover APIs, data flow, storage, scaling, reliability, privacy, monitoring, and trade-offs.`,
    answer: `Start with requirements, users, traffic, latency target, and safety constraints. Design components: frontend chat UI, API gateway, auth, conversation service, prompt builder, model gateway, tool router, retrieval service, vector DB, metadata DB, cache, queue, logging, evaluation, and monitoring. Discuss ${topic} specifically, then explain scaling, failure handling, security, cost control, and metrics.`
  };
});

const initialChecklists = {
  deployment: ['Run all tests','Validate permission sets','Check dependencies','Backup metadata','Deploy in sandbox','Smoke test','Rollback plan ready'],
  apex: ['Bulk safe','No SOQL in loop','Trigger handler pattern','Recursion guard','CRUD/FLS check','Test factory','Governor limit proof'],
  lwc: ['Reactive state','Wire vs imperative','Error UI','Reusable component','Accessibility','Performance','Apex cacheable where needed'],
  flow: ['Entry criteria','Fault path','No infinite loop','Debug run','Security context','Bulk records','Naming convention'],
  integration: ['Named Credential','Timeout handling','Retry strategy','Mock callout tests','JSON schema','Error logging','API limits'],
};

function scoreAnswer(text) {
  const t = String(text || '').toLowerCase();
  let score = Math.min(40, Math.floor(t.length / 18));
  ['scenario','impact','security','test','governor','trade-off','scalable','error','deployment','result'].forEach(k => { if (t.includes(k)) score += 6; });
  return Math.min(100, Math.max(10, score));
}

function todayMission() {
  const d = new Date().getDate();
  const missions = ['Save 2 interview answers','Revise one weak Salesforce topic','Solve 2 DSA problems','Write one project case study','Apply or follow up to 3 jobs','Complete one 45m focus sprint'];
  return [missions[d % missions.length], missions[(d + 2) % missions.length], missions[(d + 4) % missions.length]];
}

function exportPdfLike(name, content) { downloadText(name.replace('.pdf','.html'), `<html><body><pre>${content.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre></body></html>`, 'text/html'); }

export function PremiumFeatures() {
  const [coach,setCoach]=React.useState(()=>readStore('premiumCoach',{role:'Salesforce Developer',goal:'Crack Salesforce Developer interview',jd:'',answer:'',company:'',recruiter:''}));
  const [answers,setAnswers]=React.useState(()=>readStore('premiumAnswers',{}));
  const [checklists,setChecklists]=React.useState(()=>readStore('premiumChecklists',initialChecklists));
  const [kanban,setKanban]=React.useState(()=>readStore('premiumKanban',{wishlist:['TCS','Deloitte','Accenture'],applied:[],interview:[],offer:[]}));
  const [versions,setVersions]=React.useState(()=>readStore('resumeVersions',[{id:1,name:'Salesforce Developer Resume v1',date:new Date().toLocaleDateString(),notes:'Base resume'}]));
  const [timer,setTimer]=React.useState(120);
  const [running,setRunning]=React.useState(false);
  React.useEffect(()=>{ if(!running) return; const id=setInterval(()=>setTimer(t=>Math.max(0,t-1)),1000); return()=>clearInterval(id); },[running]);
  React.useEffect(()=>writeStore('premiumCoach',coach),[coach]);
  React.useEffect(()=>writeStore('premiumAnswers',answers),[answers]);
  React.useEffect(()=>writeStore('premiumChecklists',checklists),[checklists]);
  React.useEffect(()=>writeStore('premiumKanban',kanban),[kanban]);
  React.useEffect(()=>writeStore('resumeVersions',versions),[versions]);

  const mission = todayMission();
  const answerScore = scoreAnswer(coach.answer);
  const completedChecks = Object.values(checklists).flat().filter(x => x.done).length;
  const totalChecks = Object.values(checklists).flat().length;
  const xp = Object.keys(answers).length * 20 + completedChecks * 5 + kanban.applied.length * 25;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const weakTopics = Object.entries(readStore('weakStrong',{})).filter(([,v])=>v==='Weak').map(([k])=>k).slice(0,10);
  const jdWords = coach.jd.toLowerCase().split(/\W+/).filter(w=>w.length>3);
  const resumeText = JSON.stringify(readStore('portfolioSkills',[])).toLowerCase();
  const matched = [...new Set(jdWords)].filter(w=>resumeText.includes(w)).slice(0,30);
  const ats = jdWords.length ? Math.round(matched.length / Math.max([...new Set(jdWords)].length,1) * 100) : 0;

  const saveAnswer=(id,text)=>setAnswers({...answers,[id]:{text,score:scoreAnswer(text),date:new Date().toLocaleString()}});
  const moveJob=(from,to,item)=>{ setKanban({...kanban,[from]:kanban[from].filter(x=>x!==item),[to]:[...kanban[to],item]}); };
  const addJob=()=>{ if(coach.company.trim()) { setKanban({...kanban,wishlist:[coach.company.trim(),...kanban.wishlist]}); setCoach({...coach,company:''}); }};
  const toggleChecklist=(key,i)=>{ const next={...checklists,[key]:checklists[key].map((x,j)=>j===i?{text:x.text||x,done:!(x.done)}:x)}; setChecklists(next); };
  const addVersion=()=>setVersions([{id:Date.now(),name:`Resume Version ${versions.length+1}`,date:new Date().toLocaleDateString(),notes:coach.jd.slice(0,120)},...versions]);

  return <Layout><Page>
    <Hero title="Premium Career Command Center" subtitle="AI coach, interview reviewer, job kanban, resume tools, revision, checklists, project case studies and AI assistant system design questions.">
      <div className="scoreMini"><b>Level {level}</b><small>{xp} XP</small><Progress value={Math.min(100,xp%100)} /></div>
    </Hero>

    <div className="statsGrid"><div className="stat"><span>🔥</span><p>Daily Streak</p><b>{readStore('streak',1)}</b><small>Keep learning daily</small></div><div className="stat"><span>🧠</span><p>Answer Quality</p><b>{answerScore}%</b><small>AI reviewer score</small></div><div className="stat"><span>✅</span><p>Checklist Done</p><b>{completedChecks}/{totalChecks}</b><small>Deployment ready habits</small></div><div className="stat"><span>📄</span><p>ATS Match</p><b>{ats}%</b><small>JD keyword heatmap</small></div></div>

    <Card title="AI Career Coach Mode" subtitle="Daily mission, today plan, smart next action and career direction.">
      <div className="grid2"><div><h3>One-click Today Plan</h3>{mission.map((m,i)=><p key={m} className="continueCard"><b>{i+1}. </b>{m}</p>)}<button className="btn cyan" onClick={()=>downloadText('today-plan.txt',mission.join('\n'))}>Export Today Plan</button></div><div><h3>Smart Next Best Action</h3><p className="continueCard">{weakTopics.length ? `Revise weak topic: ${weakTopics[0]}` : answerScore < 70 ? 'Improve one interview answer with STAR + impact.' : 'Apply to 3 Salesforce jobs and add follow-up reminder.'}</p><input value={coach.goal} onChange={e=>setCoach({...coach,goal:e.target.value})}/></div></div>
    </Card>

    <Card title="AI Resume Bullet Generator + Interview Answer Reviewer" subtitle="Paste answer/JD and get score, STAR structure, resume bullets and keyword heatmap.">
      <div className="grid2"><div><textarea value={coach.answer} onChange={e=>setCoach({...coach,answer:e.target.value})} placeholder="Paste your answer here for review"/><Progress value={answerScore}/><div className="row"><button className="btn cyan" onClick={()=>saveAnswer('review-'+Date.now(),coach.answer)}>Save Review</button><button className="btn ghost" onClick={()=>setCoach({...coach,answer:`Situation: \nTask: \nAction: \nResult: \nTechnical depth: \nBusiness impact: `})}>STAR Builder</button></div><p className="continueCard">Resume bullet: Built Salesforce solution using Apex/LWC/Flow with security, testing and deployment readiness, improving business process visibility and maintainability.</p></div><div><textarea value={coach.jd} onChange={e=>setCoach({...coach,jd:e.target.value})} placeholder="Paste JD for keyword heatmap / ATS score"/><div className="atsKeywords">{matched.length?matched.map(w=><span key={w}>{w}</span>):<span>Paste JD to see matched keywords</span>}</div><button className="btn ghost" onClick={addVersion}>Save Resume Version</button></div></div>
    </Card>

    <Card title="Mock Interview Timer + Company-wise Prep + Role-wise Prep" subtitle="Admin / Developer / LWC / Apex interview practice with timer.">
      <div className="grid2"><div className="videoMock"><div className="playCircle">{Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</div><div className="row"><button className="btn cyan" onClick={()=>setRunning(!running)}>{running?'Pause':'Start'}</button><button className="btn ghost" onClick={()=>setTimer(120)}>Reset 2m</button></div></div><div><input value={coach.company} onChange={e=>setCoach({...coach,company:e.target.value})} placeholder="Company name"/><button className="btn cyan" onClick={addJob}>Add Company Prep</button><div className="atsKeywords">{['Admin','Developer','LWC','Apex','Flow','Integration'].map(x=><span key={x}>{x}</span>)}</div></div></div>
    </Card>

    <Card title="Salesforce Topic Mastery Map + Skill Tree + Roadmap Timeline" subtitle="Visual mastery map with XP, badges, 90-day calendar and progress heatmap.">
      <div className="skillTree">{['Admin','Security','Flow','Apex','Trigger','LWC','SOQL','Integration','Testing','Deployment'].map((x,i)=><div className="badgeCard" key={x}><b>{x}</b><small>{Math.min(100,30+i*7)}% mastery</small><Progress value={Math.min(100,30+i*7)}/></div>)}</div><div className="calendarGrid">{Array.from({length:90},(_,i)=><span key={i} className={(i+1)%7===0?'on':''}>Day {i+1}</span>)}</div>
    </Card>

    <Card title="Revision Reminder + Weak Topic Auto Revision" subtitle="1/3/7/15/30 day revision loop.">
      {weakTopics.length?weakTopics.map((w,i)=><p key={w} className="notificationCard"><b>{w}</b> • Revise on Day {1+i}, {3+i}, {7+i}, {15+i}, {30+i}</p>):<p className="premiumEmpty">No weak topics yet. Mark questions Weak from Focus/Interview to create auto revision list.</p>}
    </Card>

    <Card title="AI Doubt Solver with History + Real-time Use Case Library" subtitle="Save doubt history and generate scenario/use cases.">
      <div className="grid2"><textarea placeholder="Write doubt. AI local helper will structure it into concept, example, fix, revision." onBlur={e=>{if(e.target.value.trim()){const d=readStore('premiumDoubts',[]);writeStore('premiumDoubts',[{id:Date.now(),text:e.target.value,date:new Date().toLocaleString()},...d]);}}}/><div>{['Lead assignment automation','Approval process for discount','Secure patient appointment flow','Real estate listing search','External API sync failure handling'].map(x=><p className="continueCard" key={x}>{x}</p>)}</div></div>
    </Card>

    <Card title="Project Case Study Builder + Architecture Diagram" subtitle="Create interview-ready project proof.">
      <div className="architectureBox"><div>UI / LWC</div><div>Apex Service</div><div>Flow Automation</div><div>Security Layer</div><div>External API</div><div>Reports</div></div><textarea placeholder="Project case study: business problem, users, objects, automation/code, integration, security, test, deployment, impact." onBlur={e=>writeStore('projectCaseStudy',e.target.value)}/>
    </Card>

    <Card title="Deployment / Apex / LWC / Flow / Integration Checklists" subtitle="Production readiness checklists.">
      <div className="checklistGrid">{Object.entries(checklists).map(([key,list])=><div className="checklistCard" key={key}><h3>{key.toUpperCase()}</h3>{list.map((item,i)=><label key={i}><input type="checkbox" checked={!!item.done} onChange={()=>toggleChecklist(key,i)}/>{item.text||item}</label>)}</div>)}</div>
    </Card>

    <Card title="Job Application Kanban + Follow-up + Recruiter Tracker" subtitle="Move jobs through pipeline.">
      <div className="kanbanBoard">{Object.entries(kanban).map(([col,items])=><div className="kanbanColumn" key={col}><h3>{col.toUpperCase()}</h3>{items.map(item=><div className="continueCard" key={item}><b>{item}</b><div className="row">{Object.keys(kanban).filter(c=>c!==col).map(c=><button className="btn small ghost" key={c} onClick={()=>moveJob(col,c,item)}>{c}</button>)}</div></div>)}</div>)}</div>
    </Card>

    <Card title="Resume Version Manager + Preview + Portfolio Share" subtitle="PDF/Word style preview, version manager, portfolio export.">
      <div className="grid2"><div>{versions.map(v=><p className="resumeVersion" key={v.id}><b>{v.name}</b><span>{v.date}</span><small>{v.notes}</small></p>)}</div><div className="row"><button className="btn cyan" onClick={addVersion}>Add Resume Version</button><button className="btn ghost" onClick={()=>exportPdfLike('resume-preview.pdf',JSON.stringify(versions,null,2))}>PDF Preview</button><button className="btn ghost" onClick={()=>downloadText('resume-preview.doc',JSON.stringify(versions,null,2),'application/msword')}>Word Preview</button><button className="btn ghost" onClick={()=>exportPdfLike('portfolio.pdf','Open /portfolio for public portfolio share mode')}>Download Portfolio PDF</button></div></div>
    </Card>

    <Card title="Weekly Report Generator + Sunday Test Auto Summary" subtitle="One-click weekly report.">
      <button className="btn cyan" onClick={()=>downloadText('weekly-report.txt',`XP: ${xp}\nLevel: ${level}\nAnswer Score: ${answerScore}\nATS: ${ats}\nChecklist: ${completedChecks}/${totalChecks}\nMission:\n${mission.join('\n')}`)}>Generate Weekly Report</button>
    </Card>

    <Card title="AI Assistant System Design Interview Questions - 50" subtitle="System design round prep for AI assistant / LLM apps.">
      <div className="systemDesign50">{aiSystemDesignQuestions.map(q=><details key={q.id} className="sdQuestion"><summary><b>{q.title}</b><span className="pill">{q.level}</span></summary><p>{q.question}</p><textarea value={answers[q.id]?.text||''} onChange={e=>saveAnswer(q.id,e.target.value)} placeholder="Write your system design answer"/><p className="continueCard"><b>Model Structure:</b> {q.answer}</p><div className="row"><button className="btn small cyan" onClick={()=>saveAnswer(q.id,answers[q.id]?.text||q.answer)}>Save</button><button className="btn small ghost" onClick={()=>downloadText(`${q.id}.txt`,answers[q.id]?.text||q.answer)}>Export</button></div></details>)}</div>
    </Card>
  </Page></Layout>;
}
