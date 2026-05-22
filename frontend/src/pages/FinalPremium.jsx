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

function collectLocalData(){ const data = {}; for(let i=0;i<localStorage.length;i+=1){ const k=localStorage.key(i); if(k) data[k]=localStorage.getItem(k); } return data; }
function countLocal(){ return Object.keys(collectLocalData()).length; }
function pct(n){ return Math.max(0, Math.min(100, Math.round(n))); }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function weekKey(){ const d=new Date(); const start=new Date(d.getFullYear(),0,1); return `${d.getFullYear()}-W${Math.ceil((((d-start)/86400000)+start.getDay()+1)/7)}`; }
function monthKey(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function getScore(){
  const jobs = readStore('jobs',[]); const applied = Array.isArray(jobs) ? jobs.filter(j=>j.applied || j.status==='Applied').length : 0;
  const weak = Object.values(readStore('weakStrong',{})).filter(v=>v==='Weak').length;
  const strong = Object.values(readStore('weakStrong',{})).filter(v=>v==='Strong').length;
  const answers = Object.keys(readStore('premiumAnswers',{})).length + Object.keys(readStore('interviewAnswersV2',{})).length + Object.keys(readStore('focusAnswers',{})).length;
  return pct(20 + strong*4 + answers*2 + applied*3 - weak);
}
function makeRoadmap(){
  const weak = Object.entries(readStore('weakStrong',{})).filter(([,v])=>v==='Weak').map(([k])=>k);
  const topic = weak[0] || 'Apex Trigger / LWC / Flow';
  return `1. Revise weak topic: ${topic}\n2. Save 1 interview answer in STAR format\n3. Complete 45-minute focus sprint\n4. Apply/follow up to 3 Salesforce jobs\n5. Add one project proof or production issue note`;
}
function makeReport(state){ return `FINAL PREMIUM REPORT\n\nJob Ready Score: ${getScore()}%\nGoal: ${state.goal}\nToday Roadmap:\n${state.roadmap}\nStandup:\n${state.standup}\nMonthly Review:\n${state.monthly}\n`; }
function addAuto(list, text, type='auto'){ list.unshift({id:Date.now()+Math.random(), text, type, date:new Date().toLocaleString()}); }
function buildSundayTest(){ return ['Apex bulk trigger scenario','LWC parent-child communication','Flow fault path debugging','SOQL relationship query','Integration retry and timeout','Security sharing question','DSA two-pointer pattern','System design cache question','Project explanation STAR','Resume bullet improvement']; }
function buildAdvancedAutomations(state, history, notifications){
  const score = getScore();
  const wk = weekKey(); const mon = monthKey(); const day = todayKey();
  const weak = Object.entries(readStore('weakStrong',{})).filter(([,v])=>v==='Weak').map(([k])=>k);
  const strong = Object.entries(readStore('weakStrong',{})).filter(([,v])=>v==='Strong').map(([k])=>k);
  const jobs = readStore('jobs',[]); const applied = Array.isArray(jobs) ? jobs.filter(j=>j.applied || j.status==='Applied') : [];
  const output = [];
  if(history.weakQueueDay!==day){ writeStore('autoWeakRevisionQueue', weak.slice(0,8)); addAuto(notifications, weak.length?`Auto weak revision queue ready: ${weak.slice(0,3).join(', ')}`:'Auto weak revision queue: no weak topics marked yet','weak'); history.weakQueueDay=day; output.push('Weak topic revision queue'); }
  if(history.strongQueueWeek!==wk){ writeStore('autoStrongMaintenanceQueue', strong.slice(0,8)); addAuto(notifications, strong.length?`Strong topic maintenance this week: ${strong.slice(0,3).join(', ')}`:'Strong maintenance queue: mark strong topics after practice','strong'); history.strongQueueWeek=wk; output.push('Strong topic maintenance'); }
  if(history.focusSprintDay!==day){ writeStore('autoFocusSprint',{minutes:45, topic:weak[0]||'Apex/LWC', date:day}); addAuto(notifications,'Auto focus sprint suggested: 45 minutes deep work','focus'); history.focusSprintDay=day; output.push('Daily focus sprint'); }
  if(history.interviewQDay!==day){ const q=`Explain ${weak[0]||'Apex trigger and LWC communication'} with one real project scenario.`; writeStore('autoInterviewQuestionOfDay',q); addAuto(notifications,`Interview question of the day: ${q}`,'interview'); history.interviewQDay=day; output.push('Interview question of the day'); }
  if(new Date().getDay()===0 && history.sundayTestWeek!==wk){ writeStore('autoSundayTest',buildSundayTest()); addAuto(notifications,'Sunday auto test generated with 10 mixed questions','test'); history.sundayTestWeek=wk; output.push('Sunday test generator'); }
  if(history.weeklyReminder!==wk){ addAuto(notifications,'Weekly report reminder: export progress report and review weak topics','report'); history.weeklyReminder=wk; output.push('Weekly report reminder'); }
  if(history.jobFollowDay!==day){ addAuto(notifications, applied.length?`Job follow-up reminder: follow up ${Math.min(applied.length,5)} applied jobs`:'Job follow-up reminder: apply to 3 Salesforce roles today','job'); history.jobFollowDay=day; output.push('Job follow-up reminder'); }
  if(history.recruiterDay!==day){ writeStore('autoRecruiterFollowups', applied.slice(0,5).map(j=>j.name||j.company||'Recruiter follow-up')); addAuto(notifications,'Recruiter follow-up tracker updated','recruiter'); history.recruiterDay=day; output.push('Recruiter follow-up tracker'); }
  if(history.staleJobDay!==day){ addAuto(notifications,'Stale application alert: review jobs with no recent update','job'); history.staleJobDay=day; output.push('Stale job alert'); }
  if(history.resumeDay!==day){ addAuto(notifications,'Resume improvement suggestion: add one measurable project impact bullet','resume'); history.resumeDay=day; output.push('Resume improvement suggestion'); }
  if(history.jdGapDay!==day && state.jd){ addAuto(notifications,'JD gap action plan updated from pasted JD keywords','jd'); history.jdGapDay=day; output.push('JD keyword gap action plan'); }
  if(history.portfolioWeek!==wk){ addAuto(notifications,'Portfolio publish checklist alert: photo, resume, projects, contact links','portfolio'); history.portfolioWeek=wk; output.push('Portfolio publish checklist'); }
  if(history.projectProofDay!==day){ addAuto(notifications,'Project proof reminder: write one business problem, solution and impact','project'); history.projectProofDay=day; output.push('Project proof reminder'); }
  if(history.certWeek!==wk){ addAuto(notifications,'Certification and Trailhead reminder: complete one module/badge goal','cert'); history.certWeek=wk; output.push('Certification and Trailhead reminder'); }
  if(history.dsaDay!==day){ addAuto(notifications,'DSA pattern revision: arrays, strings, hash map or two pointers','dsa'); history.dsaDay=day; output.push('DSA pattern revision'); }
  if(history.scenarioDay!==day){ addAuto(notifications,'Salesforce scenario practice: explain requirement, design, security and test','scenario'); history.scenarioDay=day; output.push('Salesforce scenario practice'); }
  if(history.systemDesignDay!==day){ addAuto(notifications,'System design practice: design an AI assistant with RAG and tool calling','system-design'); history.systemDesignDay=day; output.push('System design practice prompt'); }
  if(history.backupWeek!==wk){ addAuto(notifications,'Backup reminder: export all local app data this week','backup'); history.backupWeek=wk; output.push('Backup reminder'); }
  if(countLocal()<5 && history.dataHealthDay!==day){ addAuto(notifications,'Data health warning: little saved data found, save answers/notes regularly','data'); history.dataHealthDay=day; output.push('Data health warning'); }
  if(history.productivityDay!==day){ addAuto(notifications,'Productivity warning: complete at least one focus sprint before entertainment','productivity'); history.productivityDay=day; output.push('Low productivity warning'); }
  if(history.streakDay!==day){ addAuto(notifications,'Learning streak protection: do one 15-minute mini task today','streak'); history.streakDay=day; output.push('Streak protection'); }
  if(history.motivationDay!==day){ addAuto(notifications,'Daily motivation: Small daily proof creates job-ready confidence','motivation'); history.motivationDay=day; output.push('Daily motivation'); }
  if(history.monthlyReview!==mon){ addAuto(notifications,'Monthly skill review created: compare skills, gaps and next month plan','monthly'); history.monthlyReview=mon; output.push('Monthly skill review'); }
  if(score>=80 && history.jobReadyGate!==day){ addAuto(notifications,'Final job-ready gate alert: score is high, start aggressive applications','gate'); history.jobReadyGate=day; output.push('Job-ready gate alert'); }
  writeStore('automationRunLog',{date:new Date().toLocaleString(), output});
  return output;
}
function runAutomation(state){
  const date=todayKey(); const wk=weekKey();
  const history=readStore('automationHistory',{});
  const notifications=[...(state.notifications||[])];
  const patches={};
  if(history.lastDaily!==date){
    patches.roadmap=makeRoadmap();
    patches.standup=`Yesterday: Review saved work\nToday: Complete roadmap for ${date}\nBlockers: Write blockers here`;
    addAuto(notifications,'Auto daily roadmap generated','daily');
    history.lastDaily=date;
    const streak=readStore('streak',0)+1; writeStore('streak',streak);
  }
  if(history.lastWeekly!==wk && new Date().getDay()===0){ addAuto(notifications,'Sunday weekly report is ready to export','weekly'); history.lastWeekly=wk; }
  const runLog = buildAdvancedAutomations(state, history, notifications);
  patches.notifications=notifications.slice(0,80);
  writeStore('automationHistory',history);
  return {...state,...patches,automationOn:true,lastAutomation:new Date().toLocaleString(),lastRunLog:runLog};
}

export function FinalPremium(){
  const [state,setState]=React.useState(()=>readStore('finalPremium',{goal:'Become job-ready Salesforce Developer',roadmap:'1. Revise weak topic\n2. Save one interview answer\n3. Apply to 3 jobs\n4. Build one project proof',standup:'Yesterday: \nToday: \nBlockers: ',monthly:'Skills improved: \nGaps: \nNext month plan: ',jd:'',resume:'',company:'TCS',recruiter:'',offerStage:'Wishlist',voiceNote:'',mockNote:'',settings:'Dark glass theme, compact cards, premium dashboard',profile:'Abhishek Kumar - Salesforce Developer',notifications:[],done:{},automationOn:true,lastRunLog:[]}));
  const save=p=>{const n={...state,...p}; setState(n); writeStore('finalPremium',n);};
  React.useEffect(()=>{ if(state.automationOn!==false){ const n=runAutomation(state); setState(n); writeStore('finalPremium',n); } },[]);
  const toggle=f=>save({done:{...state.done,[f]:!state.done?.[f]}});
  const completed=Object.values(state.done||{}).filter(Boolean).length;
  const finalScore=getScore();
  const localCount=countLocal();
  const words=state.jd.toLowerCase().split(/\W+/).filter(w=>w.length>3); const matched=[...new Set(words)].filter(w=>state.resume.toLowerCase().includes(w)); const gap=[...new Set(words)].filter(w=>!state.resume.toLowerCase().includes(w)).slice(0,20);
  const addNotification=t=>save({notifications:[{id:Date.now(),text:t,date:new Date().toLocaleString()},...(state.notifications||[])]});
  const runNow=()=>{ const n=runAutomation({...state,automationOn:true}); setState(n); writeStore('finalPremium',n); };

  return <Layout><Page>
    <Hero title="Final Premium Command Center" subtitle="Automated premium mentor: weak revision, job follow-up, Sunday test, weekly report, backup reminder and job-ready gate."><div className="scoreMini"><b>{finalScore}%</b><small>Final Job Ready Score</small><Progress value={finalScore}/></div></Hero>
    <Card title="Automation Center Structure" subtitle="Page -> Sub-page -> Sub-sub-page. Use this map to understand what each automation does.">
      <div className="pageSubpageMap automationMap">
        <a href="#auto-control" className="pageSubpageCard"><b>Page 1: Control</b><small>Sub-pages: Run Now, On/Off, Reset, Run Log</small><p>Use when you want to start or check automation.</p></a>
        <a href="#auto-queues" className="pageSubpageCard"><b>Page 2: Queues</b><small>Sub-pages: Weak Revision, Sunday Test, Recruiter Follow-up, Focus Sprint</small><p>Use when you want to know what is due today.</p></a>
        <a href="#auto-analytics" className="pageSubpageCard"><b>Page 3: Analytics</b><small>Sub-pages: Job Ready Score, Habit Score, Data Health, Risk Warning</small><p>Use when reviewing progress.</p></a>
        <a href="#auto-career" className="pageSubpageCard"><b>Page 4: Career Ops</b><small>Sub-pages: Roadmap, JD Gap, Company Prep, Reports</small><p>Use when preparing resume, interview and jobs.</p></a>
        <a href="#auto-data" className="pageSubpageCard"><b>Page 5: Data & Backup</b><small>Sub-pages: Backup, Export, Notifications, Settings</small><p>Use when protecting data and exporting proof.</p></a>
      </div>
    </Card>
    <div className="statsGrid"><div className="stat"><span>ðŸ</span><p>Final Score</p><b>{finalScore}%</b><small>job-ready gate</small></div><div className="stat"><span>ðŸ¤–</span><p>Automation</p><b>{state.automationOn===false?'OFF':'ON'}</b><small>{state.lastAutomation||'ready'}</small></div><div className="stat"><span>ðŸ’¾</span><p>Local Data</p><b>{localCount}</b><small>storage items</small></div><div className="stat"><span>ðŸ””</span><p>Alerts</p><b>{state.notifications.length}</b><small>notification center</small></div></div>

    <div id="auto-control" className="anchorPoint"></div><Card title="Automation Control Center" subtitle="Auto weak queue, job follow-up, Sunday test, weekly report, backup reminder, job-ready gate and 25 mentor alerts."><div className="row"><button className="btn cyan" onClick={runNow}>Run Automation Now</button><button className="btn ghost" onClick={()=>save({automationOn:state.automationOn===false})}>{state.automationOn===false?'Turn Automation ON':'Turn Automation OFF'}</button><button className="btn ghost" onClick={()=>{writeStore('automationHistory',{}); addNotification('Automation history reset');}}>Reset Automation History</button></div><p className="continueCard">Automation runs when this page opens. It updates daily plan once per day, Sunday test on Sunday, weekly report reminder once per week and backup reminders.</p></Card>

    <Card title="Advanced Automation Run Log" subtitle="Shows exactly what the premium mentor automated."><div className="toolGrid">{(state.lastRunLog||[]).length ? state.lastRunLog.map(x=><div className="toolTile taskDone" key={x}><b>{x}</b><span>Automated</span></div>) : <p className="premiumEmpty">No new automation due right now. Click Reset Automation History then Run Automation Now to test all rules.</p>}</div></Card>

    <div id="auto-queues" className="anchorPoint"></div><Card title="Auto Queues Generated" subtitle="Weak revision, strong maintenance, Sunday test, recruiter follow-up and focus sprint."><div className="grid2"><div className="previewCard"><b>Weak Revision Queue</b>{(readStore('autoWeakRevisionQueue',[])||[]).map(x=><p key={x}>{x}</p>)}</div><div className="previewCard"><b>Sunday Test</b>{(readStore('autoSundayTest',[])||[]).map(x=><p key={x}>{x}</p>)}</div><div className="previewCard"><b>Recruiter Follow-ups</b>{(readStore('autoRecruiterFollowups',[])||[]).map(x=><p key={x}>{x}</p>)}</div><div className="previewCard"><b>Focus Sprint</b><p>{readStore('autoFocusSprint',{}).topic||'Apex/LWC'} â€¢ {readStore('autoFocusSprint',{}).minutes||45} minutes</p></div></div></Card>

    <div id="auto-analytics" className="anchorPoint"></div><Card title="AI Learning Analytics Dashboard"><div className="dashboardPreviewGrid"><div className="previewCard"><b>Habit Score</b><Progress value={pct(50+completed)}/></div><div className="previewCard"><b>Answer Score History</b><div className="heatmap">{Array.from({length:30},(_,i)=><span key={i} className={i%3?'on':''}/>)}</div></div><div className="previewCard"><b>Focus Risk Warning</b><p>{completed<10?'Need more daily proof and saved answers.':'Good consistency. Maintain streak.'}</p></div></div></Card>

    <div id="auto-career" className="anchorPoint"></div><Card title="Personalized Daily Roadmap + Auto Interview Revision Plan"><textarea value={state.roadmap} onChange={e=>save({roadmap:e.target.value})}/><div className="row"><button className="btn cyan" onClick={()=>save({roadmap:makeRoadmap()})}>Generate Roadmap</button><button className="btn ghost" onClick={()=>addNotification('Revision reminder added for today')}>Add Reminder</button></div></Card>

    <Card title="Topic Dependency Graph + Architecture Visual Builder"><div className="architectureBox"><div>Admin Basics</div><div>Security</div><div>Flow</div><div>Apex</div><div>LWC</div><div>Integration</div><div>Testing</div><div>Deployment</div></div><textarea placeholder="Architecture notes: UI, API, Apex, Flow, DB, security, reports" onBlur={e=>writeStore('architectureNotes',e.target.value)}/></Card>

    <Card title="Resume vs JD Gap Action Plan"><div className="grid2"><textarea value={state.jd} onChange={e=>save({jd:e.target.value})} placeholder="Paste JD"/><textarea value={state.resume} onChange={e=>save({resume:e.target.value})} placeholder="Paste resume/profile text"/></div><div className="atsKeywords"><span>Matched: {matched.length}</span>{gap.map(w=><span key={w}>Add: {w}</span>)}</div></Card>

    <Card title="Company-wise Interview Bank + Recruiter CRM + Offer Pipeline"><div className="grid3"><select value={state.company} onChange={e=>save({company:e.target.value})}>{companyBank.map(c=><option key={c}>{c}</option>)}</select><input value={state.recruiter} onChange={e=>save({recruiter:e.target.value})} placeholder="Recruiter name/contact"/><select value={state.offerStage} onChange={e=>save({offerStage:e.target.value})}>{['Wishlist','Applied','HR Call','Technical','Offer','Joined'].map(x=><option key={x}>{x}</option>)}</select></div><div className="testQ"><b>{state.company} Interview Prep</b><p>Prepare: Apex trigger, LWC communication, Flow vs Apex, integration, project explanation, production issue.</p></div></Card>

    <Card title="Daily Standup + Weekly PDF Report + Monthly Skill Report"><div className="grid3"><textarea value={state.standup} onChange={e=>save({standup:e.target.value})}/><textarea value={state.monthly} onChange={e=>save({monthly:e.target.value})}/><div><button className="btn cyan" onClick={()=>downloadText('weekly-final-report.html',`<pre>${makeReport(state)}</pre>`,'text/html')}>Weekly PDF Style Report</button><button className="btn ghost" onClick={()=>downloadText('monthly-skill-report.txt',state.monthly)}>Monthly Report</button></div></div></Card>

    <Card title="LinkedIn Post + Project Proof Generator"><textarea placeholder="Today I learned... project proof... impact..." onBlur={e=>writeStore('linkedinDraft',e.target.value)}/><p className="continueCard">Template: Today I practiced Salesforce {state.company} interview prep, revised weak topics, and converted learning into project proof.</p></Card>

    <Card title="Voice Answer Practice + Mock Interview Recording Notes"><div className="grid2"><textarea value={state.voiceNote} onChange={e=>save({voiceNote:e.target.value})} placeholder="Voice practice notes: clarity, confidence, filler words"/><textarea value={state.mockNote} onChange={e=>save({mockNote:e.target.value})} placeholder="Mock interview notes: question, answer, improvement"/></div></Card>

    <Card title="Portfolio Publish Checklist + Print-friendly Portfolio"><div className="checklistGrid">{['Photo added','Resume link working','Projects updated','Skills correct','Contact links tested','Mobile view checked','Print view ready','Public share ready'].map(x=><label key={x}><input type="checkbox" checked={!!state.done?.[x]} onChange={()=>toggle(x)}/>{x}</label>)}</div><div className="row"><Link className="btn cyan" to="/portfolio">Live Preview</Link><button className="btn ghost" onClick={()=>window.print()}>Print Portfolio</button></div></Card>

    <Card title="GitHub + Trailhead + Certification + Data Health"><div className="grid3"><textarea placeholder="GitHub activity tracker" onBlur={e=>writeStore('githubActivity',e.target.value)}/><textarea placeholder="Trailhead badge goals" onBlur={e=>writeStore('trailheadGoals',e.target.value)}/><textarea placeholder="Certification study calendar" onBlur={e=>writeStore('certCalendar',e.target.value)}/></div><p className="continueCard">Data Health: {localCount} local items available. Backup regularly.</p></Card>

    <div id="auto-data" className="anchorPoint"></div><Card title="Backup Restore Center + Export All Answers"><div className="row"><button className="btn cyan" onClick={exportBackup}>One-click Backup</button><button className="btn ghost" onClick={()=>downloadText('all-local-data.json',JSON.stringify(collectLocalData(),null,2),'application/json')}>Export All Data</button><button className="btn ghost" onClick={()=>downloadText('all-answers.doc',JSON.stringify(collectLocalData(),null,2),'application/msword')}>Export Word</button></div></Card>

    <Card title="Notification Center"><div className="grid2"><div>{['Press search bar to find saved local data','Use + button for quick actions','Backup weekly','Mark Weak/Strong after every answer'].map(x=><p className="continueCard" key={x}>{x}</p>)}</div><div><button className="btn cyan" onClick={()=>addNotification('Manual notification added')}>Add Test Alert</button>{state.notifications.map(n=><p key={n.id} className="notificationCard"><b>{n.type || 'alert'}</b> â€” {n.text}<br/><small>{n.date}</small></p>)}</div></div></Card>

    <Card title="Settings + Profile + Theme + Offline Status"><div className="grid2"><textarea value={state.settings} onChange={e=>save({settings:e.target.value})}/><textarea value={state.profile} onChange={e=>save({profile:e.target.value})}/></div><p className="continueCard">Offline mode: App stores data locally and works with localStorage backup.</p></Card>

    <Card title="Interview Cheat Sheet + Apex LWC Flow Quick Reference + Issue Simulator"><div className="grid3">{Object.entries(quickRefs).map(([k,items])=><div className="previewCard" key={k}><b>{k}</b>{items.map(i=><p key={i}>{i}</p>)}</div>)}<div className="previewCard"><b>Production Issue Simulator</b><p>Scenario: Flow failed after deployment. Check debug logs, permissions, entry criteria, field access, rollback and test data.</p></div></div></Card>

    <Card title="Final 40 Premium Features"><div className="toolGrid">{finalFeatures.map((f,i)=><button key={f} className={state.done?.[f]?'toolTile taskDone':'toolTile'} onClick={()=>toggle(f)}><b>{i+1}. {f}</b><span>{state.done?.[f]?'Active':'Mark active'}</span></button>)}</div></Card>
  </Page></Layout>;
}

