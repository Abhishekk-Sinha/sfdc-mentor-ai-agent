import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, downloadText, exportBackup } from '../utils/storage';

const finalFeatures = [
  'AI Learning Analytics Dashboard','Personalized Daily Roadmap','Auto Interview Revision Plan','Topic Dependency Graph','Salesforce Project Architecture Visual Builder','Resume vs JD Gap Action Plan','Company-wise Interview Question Bank','Recruiter CRM Tracker','Offer Pipeline Tracker','Daily Standup Self Report','Weekly PDF Progress Report','Monthly Skill Report','LinkedIn Post Generator','Voice Answer Practice Notes','Mock Interview Recording Notes','Answer Score History Graph','Learning Habit Score','Focus Risk Warning','Job-ready Checklist Final Gate','Portfolio Publish Checklist','GitHub Activity Tracker','Trailhead Badge Goal Tracker','Certification Study Calendar','Project Proof Generator','One-click Backup and Restore Center','App Onboarding Tour','Keyboard Shortcuts','Notification Center','Settings Page','Profile Account Page','Theme Customization','Mobile-first Dashboard Polish','Offline Mode Status','Data Health Dashboard','Export All Answers to Word or PDF','Print-friendly Portfolio','Interview Cheat Sheet Generator','Apex LWC Flow Quick Reference Library','Production Issue Simulator','Final Job Ready Score Page'
];

const companyBank = ['TCS','Deloitte','Accenture','Cognizant','Infosys','Wipro','Capgemini','IBM','Salesforce','PwC'];
const quickRefs = {
  Apex: ['Bulkify logic','No SOQL in loops','Use handler class','Use test data factory','Assert business result'],
  LWC: ['Use wire for reactive data','Imperative for button actions','Handle loading and error','Use custom events','Keep component reusable'],
  Flow: ['Set entry criteria','Add fault path','Avoid infinite loop','Debug before activate','Document every decision']
};

function collectLocalData(){
  const data = {};
  for(let i=0;i<localStorage.length;i+=1){ const k=localStorage.key(i); if(k) data[k]=localStorage.getItem(k); }
  return data;
}
function countLocal(){ return Object.keys(collectLocalData()).length; }
function pct(n){ return Math.max(0, Math.min(100, Math.round(n))); }
function getScore(){
  const jobs = readStore('jobs',[]); const applied = Array.isArray(jobs) ? jobs.filter(j=>j.applied || j.status==='Applied').length : 0;
  const weak = Object.values(readStore('weakStrong',{})).filter(v=>v==='Weak').length;
  const strong = Object.values(readStore('weakStrong',{})).filter(v=>v==='Strong').length;
  const answers = Object.keys(readStore('premiumAnswers',{})).length + Object.keys(readStore('interviewAnswersV2',{})).length;
  return pct(20 + strong*4 + answers*2 + applied*3 - weak);
}
function makeReport(state){
  return `FINAL PREMIUM REPORT\n\nJob Ready Score: ${getScore()}%\nGoal: ${state.goal}\nToday Roadmap:\n${state.roadmap}\nStandup:\n${state.standup}\nMonthly Review:\n${state.monthly}\n`; 
}

export function FinalPremium(){
  const [state,setState]=React.useState(()=>readStore('finalPremium',{goal:'Become job-ready Salesforce Developer',roadmap:'1. Revise weak topic\n2. Save one interview answer\n3. Apply to 3 jobs\n4. Build one project proof',standup:'Yesterday: \nToday: \nBlockers: ',monthly:'Skills improved: \nGaps: \nNext month plan: ',jd:'',resume:'',company:'TCS',recruiter:'',offerStage:'Wishlist',voiceNote:'',mockNote:'',settings:'Dark glass theme, compact cards, premium dashboard',profile:'Abhishek Kumar - Salesforce Developer',notifications:[],done:{}}));
  const save=p=>{const n={...state,...p}; setState(n); writeStore('finalPremium',n);};
  const toggle=f=>save({done:{...state.done,[f]:!state.done?.[f]}});
  const completed=Object.values(state.done||{}).filter(Boolean).length;
  const finalScore=getScore();
  const localCount=countLocal();
  const words=state.jd.toLowerCase().split(/\W+/).filter(w=>w.length>3); const matched=[...new Set(words)].filter(w=>state.resume.toLowerCase().includes(w)); const gap=[...new Set(words)].filter(w=>!state.resume.toLowerCase().includes(w)).slice(0,20);
  const addNotification=t=>save({notifications:[{id:Date.now(),text:t,date:new Date().toLocaleString()},...(state.notifications||[])]});

  return <Layout><Page>
    <Hero title="Final Premium Command Center" subtitle="Final layer: analytics, roadmap, reports, recruiter CRM, portfolio publish, backup, profile, settings, alerts, export and final job-ready gate."><div className="scoreMini"><b>{finalScore}%</b><small>Final Job Ready Score</small><Progress value={finalScore}/></div></Hero>
    <div className="statsGrid"><div className="stat"><span>🏁</span><p>Final Score</p><b>{finalScore}%</b><small>job-ready gate</small></div><div className="stat"><span>✅</span><p>Final Features</p><b>{completed}/40</b><small>premium active</small></div><div className="stat"><span>💾</span><p>Local Data</p><b>{localCount}</b><small>storage items</small></div><div className="stat"><span>🔔</span><p>Alerts</p><b>{state.notifications.length}</b><small>notification center</small></div></div>

    <Card title="AI Learning Analytics Dashboard"><div className="dashboardPreviewGrid"><div className="previewCard"><b>Habit Score</b><Progress value={pct(50+completed)}/></div><div className="previewCard"><b>Answer Score History</b><div className="heatmap">{Array.from({length:30},(_,i)=><span key={i} className={i%3?'on':''}/>)}</div></div><div className="previewCard"><b>Focus Risk Warning</b><p>{completed<10?'Need more daily proof and saved answers.':'Good consistency. Maintain streak.'}</p></div></div></Card>

    <Card title="Personalized Daily Roadmap + Auto Interview Revision Plan"><textarea value={state.roadmap} onChange={e=>save({roadmap:e.target.value})}/><div className="row"><button className="btn cyan" onClick={()=>save({roadmap:'1. Complete one weak topic revision\n2. Record one mock interview answer\n3. Update resume with one project bullet\n4. Apply to 3 Salesforce jobs\n5. Generate weekly proof report'})}>Generate Roadmap</button><button className="btn ghost" onClick={()=>addNotification('Revision reminder added for today')}>Add Reminder</button></div></Card>

    <Card title="Topic Dependency Graph + Architecture Visual Builder"><div className="architectureBox"><div>Admin Basics</div><div>Security</div><div>Flow</div><div>Apex</div><div>LWC</div><div>Integration</div><div>Testing</div><div>Deployment</div></div><textarea placeholder="Architecture notes: UI, API, Apex, Flow, DB, security, reports" onBlur={e=>writeStore('architectureNotes',e.target.value)}/></Card>

    <Card title="Resume vs JD Gap Action Plan"><div className="grid2"><textarea value={state.jd} onChange={e=>save({jd:e.target.value})} placeholder="Paste JD"/><textarea value={state.resume} onChange={e=>save({resume:e.target.value})} placeholder="Paste resume/profile text"/></div><div className="atsKeywords"><span>Matched: {matched.length}</span>{gap.map(w=><span key={w}>Add: {w}</span>)}</div></Card>

    <Card title="Company-wise Interview Bank + Recruiter CRM + Offer Pipeline"><div className="grid3"><select value={state.company} onChange={e=>save({company:e.target.value})}>{companyBank.map(c=><option key={c}>{c}</option>)}</select><input value={state.recruiter} onChange={e=>save({recruiter:e.target.value})} placeholder="Recruiter name/contact"/><select value={state.offerStage} onChange={e=>save({offerStage:e.target.value})}>{['Wishlist','Applied','HR Call','Technical','Offer','Joined'].map(x=><option key={x}>{x}</option>)}</select></div><div className="testQ"><b>{state.company} Interview Prep</b><p>Prepare: Apex trigger, LWC communication, Flow vs Apex, integration, project explanation, production issue.</p></div></Card>

    <Card title="Daily Standup + Weekly PDF Report + Monthly Skill Report"><div className="grid3"><textarea value={state.standup} onChange={e=>save({standup:e.target.value})}/><textarea value={state.monthly} onChange={e=>save({monthly:e.target.value})}/><div><button className="btn cyan" onClick={()=>downloadText('weekly-final-report.html',`<pre>${makeReport(state)}</pre>`,'text/html')}>Weekly PDF Style Report</button><button className="btn ghost" onClick={()=>downloadText('monthly-skill-report.txt',state.monthly)}>Monthly Report</button></div></div></Card>

    <Card title="LinkedIn Post + Project Proof Generator"><textarea placeholder="Today I learned... project proof... impact..." onBlur={e=>writeStore('linkedinDraft',e.target.value)}/><p className="continueCard">Template: Today I practiced Salesforce {state.company} interview prep, revised weak topics, and converted learning into project proof.</p></Card>

    <Card title="Voice Answer Practice + Mock Interview Recording Notes"><div className="grid2"><textarea value={state.voiceNote} onChange={e=>save({voiceNote:e.target.value})} placeholder="Voice practice notes: clarity, confidence, filler words"/><textarea value={state.mockNote} onChange={e=>save({mockNote:e.target.value})} placeholder="Mock interview notes: question, answer, improvement"/></div></Card>

    <Card title="Portfolio Publish Checklist + Print-friendly Portfolio"><div className="checklistGrid">{['Photo added','Resume link working','Projects updated','Skills correct','Contact links tested','Mobile view checked','Print view ready','Public share ready'].map(x=><label key={x}><input type="checkbox" checked={!!state.done?.[x]} onChange={()=>toggle(x)}/>{x}</label>)}</div><div className="row"><Link className="btn cyan" to="/portfolio">Live Preview</Link><button className="btn ghost" onClick={()=>window.print()}>Print Portfolio</button></div></Card>

    <Card title="GitHub + Trailhead + Certification + Data Health"><div className="grid3"><textarea placeholder="GitHub activity tracker" onBlur={e=>writeStore('githubActivity',e.target.value)}/><textarea placeholder="Trailhead badge goals" onBlur={e=>writeStore('trailheadGoals',e.target.value)}/><textarea placeholder="Certification study calendar" onBlur={e=>writeStore('certCalendar',e.target.value)}/></div><p className="continueCard">Data Health: {localCount} local items available. Backup regularly.</p></Card>

    <Card title="Backup Restore Center + Export All Answers"><div className="row"><button className="btn cyan" onClick={exportBackup}>One-click Backup</button><button className="btn ghost" onClick={()=>downloadText('all-local-data.json',JSON.stringify(collectLocalData(),null,2),'application/json')}>Export All Data</button><button className="btn ghost" onClick={()=>downloadText('all-answers.doc',JSON.stringify(collectLocalData(),null,2),'application/msword')}>Export Word</button></div></Card>

    <Card title="Onboarding Tour + Keyboard Shortcuts + Notification Center"><div className="grid2"><div>{['Press search bar to find saved local data','Use + button for quick actions','Backup weekly','Mark Weak/Strong after every answer'].map(x=><p className="continueCard" key={x}>{x}</p>)}</div><div><button className="btn cyan" onClick={()=>addNotification('Onboarding completed')}>Complete Tour</button>{state.notifications.map(n=><p key={n.id} className="notificationCard">{n.text}<br/><small>{n.date}</small></p>)}</div></div></Card>

    <Card title="Settings + Profile + Theme + Offline Status"><div className="grid2"><textarea value={state.settings} onChange={e=>save({settings:e.target.value})}/><textarea value={state.profile} onChange={e=>save({profile:e.target.value})}/></div><p className="continueCard">Offline mode: App stores data locally and works with localStorage backup.</p></Card>

    <Card title="Interview Cheat Sheet + Apex LWC Flow Quick Reference + Issue Simulator"><div className="grid3">{Object.entries(quickRefs).map(([k,items])=><div className="previewCard" key={k}><b>{k}</b>{items.map(i=><p key={i}>{i}</p>)}</div>)}<div className="previewCard"><b>Production Issue Simulator</b><p>Scenario: Flow failed after deployment. Check debug logs, permissions, entry criteria, field access, rollback and test data.</p></div></div></Card>

    <Card title="Final 40 Premium Features"><div className="toolGrid">{finalFeatures.map((f,i)=><button key={f} className={state.done?.[f]?'toolTile taskDone':'toolTile'} onClick={()=>toggle(f)}><b>{i+1}. {f}</b><span>{state.done?.[f]?'Active':'Mark active'}</span></button>)}</div></Card>
  </Page></Layout>;
}
