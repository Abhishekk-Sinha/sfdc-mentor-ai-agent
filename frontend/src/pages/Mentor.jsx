import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { roadmap90 } from '../data/roadmap';
import { questionBank } from '../data/questions';
import { readStore, writeStore, downloadText } from '../utils/storage';

export function MentorRoute() {
  const [day,setDay]=React.useState(()=>readStore('mentorDay',1)); const d=roadmap90[day-1]||roadmap90[0]; const [done,setDone]=React.useState(()=>readStore('mentorDone',{}));
  const toggle=k=>{const n={...done,[`${day}-${k}`]:!done[`${day}-${k}`]};setDone(n);writeStore('mentorDone',n);writeStore('mentorDay',day)};
  const tasks=[['Salesforce',d.salesforce],['DSA',d.dsa],['System Design',d.systemDesign],['English',`Day ${d.englishDay}`],['Project',d.projectTask],['Interview',d.interviewTask]];
  const percent=tasks.filter(([k])=>done[`${day}-${k}`]).length/tasks.length*100;
  return <Layout><Page><Hero title="90-Day Zero to Hero Mentor Route" subtitle="Daily Salesforce + DSA + English + System Design + Project + Interview task."><div className="scoreMini"><b>Day {day}</b><Progress value={percent}/></div></Hero><Card title="Choose Day"><div className="row"><input type="range" min="1" max="90" value={day} onChange={e=>setDay(Number(e.target.value))}/><input type="number" min="1" max="90" value={day} onChange={e=>setDay(Number(e.target.value))}/></div></Card><div className="taskGrid">{tasks.map(([k,v])=><button key={k} className={done[`${day}-${k}`]?'taskDone taskCard':'taskCard'} onClick={()=>toggle(k)}><b>{k}</b><span>{v}</span><small>{done[`${day}-${k}`]?'Completed':'Click to complete'}</small></button>)}</div></Page></Layout>;
}

export function FocusMode() {
  const [day,setDay]=React.useState(()=>readStore('focusDay',1)); const [answers,setAnswers]=React.useState(()=>readStore('focusAnswers',{})); const [weakStrong,setWeakStrong]=React.useState(()=>readStore('weakStrong',{}));
  const route=roadmap90[(day-1)%roadmap90.length]; const qs=questionBank.filter(q=>[route.salesforce,route.dsa,route.systemDesign].includes(q.topic)).slice(0,20);
  const save=(id,text)=>{const n={...answers,[id]:{text,savedAt:new Date().toLocaleString(),status:'Saved'}};setAnswers(n);writeStore('focusAnswers',n)};
  const mark=(id,status)=>{const n={...weakStrong,[id]:status};setWeakStrong(n);writeStore('weakStrong',n)};
  const del=(id)=>{const n={...answers}; delete n[id]; setAnswers(n); writeStore('focusAnswers',n); const w={...weakStrong}; delete w[id]; setWeakStrong(w); writeStore('weakStrong',w)};
  return <Layout><Page><Hero title="Focus Mode" subtitle=""><div className="row"><input type="number" min="1" max="90" value={day} onChange={e=>setDay(Number(e.target.value))}/><span className="pill">{route.phase}</span></div></Hero><Card title="Today's Motivation"><p className="motivation">Great dreams of great dreamers are always transcended. Aaj ek answer save karo, ek topic strong mark karo, aur ek doubt clear karo.</p></Card><div className="listGap">{qs.length ? qs.map((q,i)=><Card key={q.id} title={`${i+1}. ${q.title}`} subtitle={`${q.track} • ${q.topic}`} action={<a className="btn small ghost" href={q.link} target="_blank">Open Link</a>}><p>{q.question}</p><textarea className="answerBox" value={answers[q.id]?.text||''} onChange={e=>save(q.id,e.target.value)} placeholder="Write answer here"/><div className="answerMeta"><span className="pill">{answers[q.id]?.status || 'Not saved'}</span><span className="pill">{weakStrong[q.id]||'Not marked'}</span><small>{answers[q.id]?.savedAt}</small></div><div className="row"><button className="btn cyan" onClick={()=>save(q.id,answers[q.id]?.text||'My focus answer saved.')}>Save</button><button className="btn ghost" onClick={()=>mark(q.id,'Weak')}>Weak</button><button className="btn ghost" onClick={()=>mark(q.id,'Strong')}>Strong</button><button className="btn danger" onClick={()=>del(q.id)}>Delete</button></div></Card>) : <Card title="No exact questions found"><p>Open Practice Lab for more topic-wise questions.</p><Link className="btn" to="/practice">Practice Lab</Link></Card>}</div></Page></Layout>;
}

export function LearningCoach() {
  const answers=readStore('answers',{}); const weak=readStore('weakStrong',{}); const weakCount=Object.values(weak).filter(x=>x==='Weak').length; const strongCount=Object.values(weak).filter(x=>x==='Strong').length;
  return <Layout><Page><Hero title="Learning Coach" subtitle="Smart daily plan, sprint timer, mistake bank, quiz, recap, and LinkedIn proof generator."/><div className="grid2"><Card title="Smart Plan"><ol><li>Complete one 45-minute Salesforce sprint</li><li>Solve 2 DSA questions</li><li>Revise weak topics: {weakCount}</li><li>Convert one answer into interview proof</li></ol><Link className="btn cyan" to="/focus">Start Focus</Link></Card><Card title="Mistake Bank"><p>Saved answers: {Object.keys(answers).length}</p><p>Weak topics: {weakCount}</p><p>Strong topics: {strongCount}</p><p>Rule: revise weak topic after 1/3/7/15/30 days.</p></Card><Card title="Quiz Generator"><p>Use Practice Lab filters and answer 10 questions from one topic.</p><Link className="btn" to="/practice">Open Practice Lab</Link></Card><Card title="LinkedIn Proof Generator"><textarea placeholder="Today I learned... I practiced... My project proof is..."/><button className="btn">Save Draft</button></Card></div></Page></Layout>;
}

const promptTemplates = [
  'Explain Apex trigger with bulk-safe example',
  'Make this answer interview-ready in STAR format',
  'Generate Salesforce scenario questions from Flow and Security',
  'Review my DSA answer and give hint only',
  'Create daily mentor plan for today',
  'Convert my project into resume bullet points',
  'Explain this in Hinglish',
  'Generate follow-up interview questions'
];

const mentorModes = ['General Mentor','Salesforce Apex/LWC/SOQL','DSA Hint Only','System Design','JD Matcher','Interview Coach','Resume Bullet','Project Explanation'];
const difficultyOptions = ['Beginner','Intermediate','2+ Years','Advanced'];
const backendBase = 'http://127.0.0.1:8000';

function findSavedAnswer(query) {
  const keys = ['answers','focusAnswers','interviewAnswers','interviewAnswersV2','weeklyAnswers','notes','doubts'];
  const q = query.toLowerCase();
  for (const key of keys) {
    const value = readStore(key, Array.isArray(readStore(key, [])) ? [] : {});
    const rows = Array.isArray(value) ? value : Object.values(value || {});
    const hit = rows.find(item => `${item?.title || ''} ${item?.body || ''} ${item?.answer || ''} ${item?.text || ''}`.toLowerCase().includes(q));
    if (hit) return { key, hit };
  }
  return null;
}

function buildLocalMentorAnswer(question, mode, difficulty, interviewMode) {
  const q = question.trim();
  if (mode === 'DSA Hint Only') return `Hint-only mode for: ${q}\n\n1. Identify the pattern first.\n2. Write brute force in your mind.\n3. Optimize using the right data structure.\n4. Mention time and space complexity.\n\nDo not read full solution before trying for 20 minutes.`;
  if (mode === 'Interview Coach') return `Interview-ready answer for: ${q}\n\nSTAR format:\nS: Give the project/business context.\nT: Explain your responsibility.\nA: Mention exact Salesforce/DSA/System Design action.\nR: End with measurable impact.\n\nFor ${difficulty}, add trade-offs, edge cases, testing, and one follow-up question.`;
  if (mode === 'Resume Bullet') return `Resume bullet options for: ${q}\n\n• Built/optimized ${q} using Salesforce best practices, improving maintainability and delivery confidence.\n• Implemented secure, scalable solution with testing, documentation, and production-ready deployment steps.\n• Collaborated with stakeholders to convert requirements into measurable CRM outcomes.`;
  if (mode === 'Project Explanation') return `Project explanation for: ${q}\n\n1. Business problem\n2. Users and roles\n3. Objects/data model\n4. Automation/code/integration\n5. Security model\n6. Reports/dashboard\n7. Challenges and solution\n8. Interview impact line`;
  return `Mentor response for: ${q}\n\nMode: ${mode}\nLevel: ${difficulty}\nInterview Mode: ${interviewMode}\n\nUse this structure:\n1. Simple definition\n2. Real scenario/use case\n3. Step-by-step implementation\n4. Testing/security/performance points\n5. Interview answer in 60 seconds\n6. Next revision action`;
}

function makeSearchLinks(q) {
  const e = encodeURIComponent(q);
  return [
    { title:'Google', url:`https://www.google.com/search?q=${e}` },
    { title:'Salesforce Docs', url:`https://developer.salesforce.com/docs?q=${e}` },
    { title:'Trailhead', url:`https://trailhead.salesforce.com/search?keywords=${e}` },
    { title:'Salesforce StackExchange', url:`https://salesforce.stackexchange.com/search?q=${e}` },
    { title:'LeetCode', url:`https://leetcode.com/problemset/?search=${e}` },
    { title:'HackerRank', url:`https://www.hackerrank.com/search?term=${e}` }
  ];
}

function copyText(text) {
  navigator.clipboard?.writeText(text);
}

export function AIMentor() {
  const [question,setQuestion]=React.useState('');
  const [messages,setMessages]=React.useState([]);
  const [mode,setMode]=React.useState('General Mentor');
  const [difficulty,setDifficulty]=React.useState('2+ Years');
  const [interviewMode,setInterviewMode]=React.useState('Technical Round');
  const [useSavedData,setUseSavedData]=React.useState(true);
  const [backendMode,setBackendMode]=React.useState('local');
  const [loading,setLoading]=React.useState(false);
  const [toast,setToast]=React.useState('');
  const [status,setStatus]=React.useState({backend:'checking',ollama:'checking',web:'ready'});

  React.useEffect(()=>{ checkStatus(); },[]);
  React.useEffect(()=>{ if(toast){ const t=setTimeout(()=>setToast(''),2200); return ()=>clearTimeout(t); } },[toast]);

  async function checkStatus(){
    try{ const r=await fetch(`${backendBase}/api/health`); setStatus(s=>({...s,backend:r.ok?'online':'offline'})); }catch{ setStatus(s=>({...s,backend:'offline'})); }
    try{ const r=await fetch(`${backendBase}/api/ollama-status`); const data=await r.json(); setStatus(s=>({...s,ollama:data.ok?'online':'offline'})); }catch{ setStatus(s=>({...s,ollama:'offline'})); }
  }

  function newChat(){
    setMessages([]);
    setQuestion('');
    setToast('Chat cleared');
  }

  function saveToNotes(item){
    const notes=readStore('notes',[]);
    writeStore('notes',[...notes,{id:Date.now(),title:item.prompt || 'AI Mentor Answer',body:item.text,status:'Mentor',createdAt:new Date().toLocaleString()}]);
    setToast('Saved to Notes');
  }

  function addToRevision(item){
    const revision=readStore('revisionCalendar',[]);
    writeStore('revisionCalendar',[...revision,{id:Date.now(),topic:item.prompt || 'AI Mentor',note:item.text,next:'1/3/7/15/30 days',createdAt:new Date().toLocaleString()}]);
    setToast('Added to Revision Calendar');
  }

  function markTopic(item,statusValue){
    const weakStrong=readStore('weakStrong',{});
    writeStore('weakStrong',{...weakStrong,[`mentor-${Date.now()}`]:statusValue});
    setToast(`Marked ${statusValue}`);
  }

  function pinMessage(index){
    const next=messages.map((m,i)=>i===index?{...m,pinned:!m.pinned}:m);
    setMessages(next);
  }

  function deleteMessage(index){
    setMessages(messages.filter((_,i)=>i!==index));
    setToast('Message deleted');
  }

  function transform(text,type){
    const output = type==='star' ? `STAR Answer\n\nS: ${text}\n\nT: My responsibility was to solve the business/technical problem.\n\nA: I used the correct approach, tested it, handled edge cases and documented it.\n\nR: This improved reliability, clarity and interview readiness.`:
      type==='hinglish' ? `Hinglish Explanation:\n\n${text}\n\nSimple meaning: concept ko real project/use case se connect karo, phir interview mein short and clear answer do.`:
      type==='simple' ? `Simple English:\n\n${text}\n\nIn short: explain what it is, where it is used, how you implemented it, and what result it created.`:
      type==='scenario' ? `Scenario Questions:\n\n1. A business team needs this feature. How will you design it?\n2. How will you secure data access?\n3. How will you test edge cases?\n4. What can go wrong in production?\n5. How will you explain impact to client?`:
      `Follow-up Questions:\n\n1. Why did you choose this approach?\n2. What are the edge cases?\n3. How will it scale?\n4. How will you test it?\n5. What will you improve?`;
    setMessages([...messages,{role:'assistant',text:output,time:new Date().toLocaleString(),prompt:type,links:[]}]);
  }

  async function ask(){
    const q=question.trim();
    if(!q) return;
    setLoading(true);
    const userMessage={role:'user',text:q,time:new Date().toLocaleString()};
    let answer=''; let source='local'; let links=makeSearchLinks(q);
    const savedHit = useSavedData ? findSavedAnswer(q) : null;
    if(savedHit){ answer = `Found from your saved ${savedHit.key}:\n\n${savedHit.hit.text || savedHit.hit.body || savedHit.hit.answer || savedHit.hit.title}`; source='saved-data'; }
    else if(backendMode==='backend' || backendMode==='ollama'){
      try{
        const r=await fetch(`${backendBase}/api/mentor`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q,mode:backendMode==='ollama'?'ollama':'local',context:{mode,difficulty,interviewMode}})});
        const data=await r.json(); answer=data.answer || ''; links=data.links || links; source=data.source || backendMode;
      }catch{ answer='Backend server offline. Local mentor answer and search links are ready.'; source='offline-fallback'; }
    }
    if(!answer){ answer = buildLocalMentorAnswer(q,mode,difficulty,interviewMode); }
    const assistantMessage={role:'assistant',text:answer,time:new Date().toLocaleString(),source,links,prompt:q,pinned:false};
    setMessages([...messages,userMessage,assistantMessage]);
    setQuestion(''); setLoading(false); setToast('Answer generated');
  }

  return <Layout><Page><Hero title="AI Mentor Agent Pro" subtitle="Private mentor chat. History is not saved automatically."><div className="mentorStatus"><span className={status.backend==='online'?'online':'offline'}>Backend {status.backend}</span><span className={status.ollama==='online'?'online':'offline'}>Ollama {status.ollama}</span><span className="online">Web links ready</span><button className="btn small ghost" onClick={checkStatus}>Refresh</button></div></Hero>
    {toast && <div className="toast">✅ {toast}</div>}
    <div className="mentorCleanLayout">
      <section className="mentorMain mentorMainFull">
        <Card title="Mentor Controls" subtitle="Choose mode, difficulty, and data source"><div className="mentorControls"><select value={mode} onChange={e=>setMode(e.target.value)}>{mentorModes.map(x=><option key={x}>{x}</option>)}</select><select value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{difficultyOptions.map(x=><option key={x}>{x}</option>)}</select><select value={interviewMode} onChange={e=>setInterviewMode(e.target.value)}>{['Technical Round','HR Round','Managerial Round','Project Round','Mock Interview'].map(x=><option key={x}>{x}</option>)}</select><select value={backendMode} onChange={e=>setBackendMode(e.target.value)}><option value="local">Local Only</option><option value="backend">FastAPI Backend</option><option value="ollama">Ollama Local AI</option></select><label className="toggleLine"><input type="checkbox" checked={useSavedData} onChange={e=>setUseSavedData(e.target.checked)}/> Ask from my saved data first</label></div></Card>
        <Card title="Prompt Templates" subtitle="One-click premium prompts"><div className="promptGrid">{promptTemplates.map(p=><button key={p} className="btn ghost" onClick={()=>setQuestion(p)}>{p}</button>)}</div></Card>
        <div className="mentorMessages">{messages.length?messages.map((m,i)=><div key={i} className={m.role==='user'?'msg userMsg':'msg aiMsg'}><div className="msgHead"><b>{m.role==='user'?'You':'AI Mentor'}</b><small>{m.source || ''} {m.time}</small>{m.pinned&&<span className="pill">Pinned</span>}</div><pre>{m.text}</pre>{m.links?.length>0&&<div className="linkCards">{m.links.map(l=><a key={l.url || l} href={l.url || l} target="_blank">{l.title || 'Open Link'}</a>)}</div>}{m.role==='assistant'&&<div className="mentorActions"><button onClick={()=>copyText(m.text)} className="btn small ghost">Copy</button><button onClick={()=>downloadText('mentor-answer.txt',m.text)} className="btn small ghost">Export</button><button onClick={()=>saveToNotes(m)} className="btn small cyan">Save Notes</button><button onClick={()=>addToRevision(m)} className="btn small ghost">Add Revision</button><button onClick={()=>markTopic(m,'Weak')} className="btn small ghost">Weak</button><button onClick={()=>markTopic(m,'Strong')} className="btn small ghost">Strong</button><button onClick={()=>pinMessage(i)} className="btn small ghost">Pin</button><button onClick={()=>transform(m.text,'star')} className="btn small ghost">STAR</button><button onClick={()=>transform(m.text,'hinglish')} className="btn small ghost">Hinglish</button><button onClick={()=>transform(m.text,'simple')} className="btn small ghost">Simple English</button><button onClick={()=>transform(m.text,'scenario')} className="btn small ghost">Scenario Qs</button><button onClick={()=>transform(m.text,'followup')} className="btn small ghost">Follow-ups</button><button onClick={()=>deleteMessage(i)} className="btn small danger">Delete</button></div>}</div>):<div className="mentorEmpty"><h2>Ask anything to your AI Mentor</h2><p>Salesforce, Apex, LWC, SOQL, Flow, DSA, System Design, JD, project explanation, resume bullet, or interview answer.</p></div>}</div>
        <Card title="Ask Mentor" className="mentorComposer"><textarea value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&e.ctrlKey)ask();}} placeholder="Ask Salesforce, DSA, JD, project, interview, error... Ctrl+Enter to ask"/><div className="row"><button className="btn cyan" disabled={loading} onClick={ask}>{loading?'Thinking...':'Ask Mentor'}</button><button className="btn ghost" onClick={()=>window.open(`https://www.google.com/search?q=${encodeURIComponent(question)}`,'_blank')}>Search Web</button><button className="btn ghost" onClick={()=>setQuestion('')}>Clear</button><button className="btn ghost" onClick={newChat}>Clear Chat</button></div></Card>
      </section>
    </div>
  </Page></Layout>;
}
