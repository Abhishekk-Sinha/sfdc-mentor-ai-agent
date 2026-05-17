import React from 'react';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { questionBank, scenarioQuestions } from '../data/questions';
import { salesforceUseCases } from '../data/useCases';
import { projects } from '../data/profile';
import { readStore, writeStore, downloadText } from '../utils/storage';

function getTestQuestions(category, level, week) {
  const offset = ((Number(week) - 1) * 10) % 120;
  if (category === 'Scenario Questions') return scenarioQuestions.filter(q => level === 'All' || q.level === level).slice(offset, offset + 10).map(q => ({ id:q.id, question:q.question, answer:q.answer, topic:q.topic, level:q.level }));
  if (category === 'Use Cases') return salesforceUseCases.slice(offset, offset + 10).map(u => ({ id:u.id, question:`Use Case: ${u.title}`, answer:`Problem: ${u.problem}\nSolution: ${u.solution}\nSteps: ${u.steps.join(' → ')}`, topic:u.topic, level:u.level }));
  return questionBank.filter(q => q.track === category && (level === 'All' || q.level === level)).slice(offset, offset + 10).map(q => ({ id:q.id, question:q.question, answer:q.answer, topic:q.topic, level:q.level }));
}

export function WeeklyTests() {
  const [week,setWeek]=React.useState(()=>readStore('weekNo',1)); const [category,setCategory]=React.useState('Salesforce Admin'); const [level,setLevel]=React.useState('All'); const [answers,setAnswers]=React.useState(()=>readStore('weeklyAnswers',{})); const [results,setResults]=React.useState(()=>readStore('weeklyResults',{})); const [compact,setCompact]=React.useState(true);
  const qs=getTestQuestions(category,level,week); const key=`W${week}-${category}-${level}`; const answered=qs.filter(q=>(answers[`${key}-${q.id}`]||'').trim().length>20).length; const score=Math.round(answered/Math.max(qs.length,1)*100);
  const saveResult=()=>{const n={...results,[key]:{week,category,level,score,date:new Date().toLocaleDateString(),answered,total:qs.length}};setResults(n);writeStore('weeklyResults',n)};
  const deleteAnswer=(qid)=>{const n={...answers}; delete n[`${key}-${qid}`]; setAnswers(n); writeStore('weeklyAnswers',n)};
  const exportTest=()=>downloadText(`week-${week}-${category}-test.txt`,qs.map((q,i)=>`${i+1}. ${q.question}\nAnswer: ${answers[`${key}-${q.id}`]||''}\nModel: ${q.answer}`).join('\n\n'));
  return <Layout><Page><Hero title="Weekly Sunday Test Calendar" subtitle="Easy to advance section-wise tests. Get, save, edit, delete, export and track result."><div className="scoreMini"><b>{score}%</b><Progress value={score}/></div></Hero><Card title="Test Selector" subtitle="Monday-Saturday topics ka Sunday test"><div className="filterBar"><input type="number" min="1" max="52" value={week} onChange={e=>setWeek(Number(e.target.value))}/><select value={category} onChange={e=>setCategory(e.target.value)}>{['Salesforce Admin','Salesforce Developer','DSA','System Design','Scenario Questions','Use Cases'].map(x=><option key={x}>{x}</option>)}</select><select value={level} onChange={e=>setLevel(e.target.value)}>{['All','Easy','Medium','Hard','Advanced'].map(x=><option key={x}>{x}</option>)}</select><button className="btn cyan" onClick={saveResult}>Save Result</button><button className="btn ghost" onClick={exportTest}>Export</button><button className="btn ghost" onClick={()=>setCompact(!compact)}>{compact?'Expanded':'Compact'} View</button></div><Progress value={score}/></Card><div className="weeklyLayout"><Card title={`${category} Test`} subtitle={`${answered}/${qs.length} answered`}>{qs.map((q,i)=><div className="testQ compactQ" key={q.id}><div className="qHeader"><b>{i+1}. {q.question}</b><span className="pill">{q.topic} • {q.level}</span></div>{!compact && <p className="hint">{q.answer}</p>}<textarea className="answerBox smallAnswer" value={answers[`${key}-${q.id}`]||''} onChange={e=>{const n={...answers,[`${key}-${q.id}`]:e.target.value};setAnswers(n);writeStore('weeklyAnswers',n)}} placeholder="Write answer"/><div className="row"><button className="btn small" onClick={()=>{const n={...answers,[`${key}-${q.id}`]:answers[`${key}-${q.id}`]||'My weekly test answer saved.'};setAnswers(n);writeStore('weeklyAnswers',n)}}>Save</button><button className="btn small danger" onClick={()=>deleteAnswer(q.id)}>Delete</button></div></div>)}</Card><Card title="Result Calendar" subtitle="Saved weekly scores">{Array.from({length:12},(_,i)=>i+1).map(w=><div className="calendarBox" key={w}><b>Week {w}</b>{Object.values(results).filter(r=>Number(r.week)===w).map(r=><span key={r.category+r.level}>{r.category}: {r.score}%</span>)}</div>)}</Card></div></Page></Layout>;
}


const interviewTopics2Years = [
  ['Apex Trigger', 'bulkification, trigger handler pattern, recursion prevention, and before/after context'],
  ['Apex Classes', 'service layer, selector pattern, exception handling, and maintainability'],
  ['SOQL', 'selective queries, relationship queries, indexes, and governor limits'],
  ['LWC', 'wire, imperative Apex, lifecycle hooks, events, and reusable components'],
  ['Flow', 'record-triggered flow, screen flow, fault paths, and when to choose Apex'],
  ['Security', 'profiles, permission sets, OWD, sharing rules, FLS, with sharing, and CRUD/FLS'],
  ['Integration', 'REST API, Named Credential, JSON parsing, callout limits, and mock tests'],
  ['Async Apex', 'future, queueable, batch, scheduled apex, and real processing scenarios'],
  ['Testing', 'test data factory, assertions, startTest/stopTest, mocks, and coverage quality'],
  ['Deployment', 'change sets, Gearset/CI, test coverage, rollback plan, and release checklist'],
  ['Data Migration', 'Data Loader, external IDs, upsert, duplicate rules, and data cleanup'],
  ['Reports & Dashboards', 'custom report types, dashboard filters, KPIs, and stakeholder visibility'],
  ['Debugging', 'debug logs, governor limit analysis, production issue isolation, and root cause'],
  ['Project Explanation', 'business problem, your role, architecture, challenges, and measurable impact'],
  ['HR + Behavioral', 'ownership, communication, teamwork, conflict, learning, and job readiness']
];
const interviewLevels2Years = ['Warm-up', 'Scenario', 'Deep Technical', 'Project-Based', 'Manager Round'];
const interviewQuestionTemplates = [
  'Explain {topic} as if interviewer asks you to prove 2+ years of hands-on Salesforce experience. Include {focus}.',
  'A production issue is reported related to {topic}. How will you debug it step by step and communicate the fix?',
  'Give a real business scenario where you used {topic}. What was the requirement, solution, testing, and impact?',
  'What mistakes do developers usually make in {topic}, and how do you avoid them in real projects?',
  'Design a scalable solution using {topic}. Explain architecture, security, governor limits, and deployment plan.',
  'How will you explain {topic} to a non-technical stakeholder and then to a technical interviewer?',
  'What interview follow-up questions can come after {topic}, and how will you answer them confidently?'
];
function buildInterview100(){
  const questions=[];
  let n=1;
  while(questions.length<100){
    for(const [topic, focus] of interviewTopics2Years){
      const template=interviewQuestionTemplates[(n-1)%interviewQuestionTemplates.length];
      const level=interviewLevels2Years[(n-1)%interviewLevels2Years.length];
      const type = topic.includes('HR') ? 'HR' : topic.includes('Project') ? 'Project' : ['Technical','Scenario','Manager'][n%3];
      questions.push({
        id:`sf2y-${n}`,
        no:n,
        topic,
        level,
        type,
        question: template.replaceAll('{topic}', topic).replaceAll('{focus}', focus),
        modelAnswer:`Structure your answer for ${topic}: 1) Start with a one-line definition. 2) Add a real Salesforce business scenario. 3) Explain your implementation approach around ${focus}. 4) Mention security/governor limits/testing where relevant. 5) Close with measurable business impact and what you learned.`,
        strongPoints:[
          'Use STAR: Situation, Task, Action, Result.',
          'Mention your role clearly: what you designed, built, tested, or supported.',
          'Add one production-ready detail: bulkification, security, error handling, test coverage, or deployment checklist.',
          'End with impact: saved time, reduced errors, improved visibility, or better user experience.'
        ],
        followUps:[
          `What edge case did you handle in ${topic}?`,
          `How did you test ${topic}?`,
          `How did you make ${topic} secure and maintainable?`
        ],
      });
      n++;
      if(questions.length>=100) break;
    }
  }
  return questions;
}
const interview100Questions = buildInterview100();

export function InterviewQA() {
  const [filters,setFilters]=React.useState(()=>readStore('interviewFilters',{topic:'All',level:'All',type:'All',search:''}));
  const [answers,setAnswers]=React.useState(()=>readStore('interviewAnswersV2',{}));
  const [openId,setOpenId]=React.useState(()=>readStore('interviewOpenId','sf2y-1'));
  const [mode,setMode]=React.useState(()=>readStore('interviewMode','Practice'));
  const topics=['All',...interviewTopics2Years.map(x=>x[0])];
  const levels=['All',...interviewLevels2Years];
  const types=['All','Technical','Scenario','Manager','Project','HR'];
  const list=interview100Questions.filter(q=>(filters.topic==='All'||q.topic===filters.topic)&&(filters.level==='All'||q.level===filters.level)&&(filters.type==='All'||q.type===filters.type)&&(`${q.question} ${q.topic} ${q.type}`.toLowerCase().includes(filters.search.toLowerCase())));
  const current=interview100Questions.find(q=>q.id===openId)||list[0]||interview100Questions[0];
  const saved=Object.values(answers).filter(a=>String(a?.text||'').trim()).length;
  const strong=Object.values(answers).filter(a=>a?.status==='Strong').length;
  const weak=Object.values(answers).filter(a=>a?.status==='Weak').length;
  const readiness=Math.min(100,Math.round(20+(saved*0.45)+(strong*1.1)-(weak*0.3)));
  const save=(id,patch)=>{const n={...answers,[id]:{...(answers[id]||{}),...patch,savedAt:new Date().toLocaleString()}};setAnswers(n);writeStore('interviewAnswersV2',n)};
  const del=(id)=>{const n={...answers};delete n[id];setAnswers(n);writeStore('interviewAnswersV2',n)};
  const updateFilters=(patch)=>{const n={...filters,...patch};setFilters(n);writeStore('interviewFilters',n)};
  const selectQuestion=(id)=>{setOpenId(id);writeStore('interviewOpenId',id)};
  const rec=answers[current.id]||{};
  const exportAll=()=>downloadText('salesforce-2-years-interview-answers.txt',interview100Questions.map(q=>`Q${q.no}. ${q.question}\nTopic: ${q.topic}\nLevel: ${q.level}\nMy Answer:\n${answers[q.id]?.text||''}\nModel Pattern:\n${q.modelAnswer}`).join('\n\n---\n\n'));
  return <Layout><Page><Hero title="Salesforce Developer Interview Room" subtitle="100 realistic questions for 2+ years experience. Practice, edit, save, delete, mark weak/strong, and crack interview with structured answers."><div className="scoreMini"><b>{readiness}%</b><small>Interview Ready</small><Progress value={readiness}/></div></Hero>
    <div className="interviewStats">
      <div><b>100</b><span>2+ Years Questions</span></div><div><b>{saved}</b><span>Saved Answers</span></div><div><b>{strong}</b><span>Strong</span></div><div><b>{weak}</b><span>Weak</span></div>
    </div>
    <Card title="Interview Control Panel" subtitle="Filter questions like a real interview preparation room.">
      <div className="filterBar interviewFilter"><input placeholder="Search interview question..." value={filters.search} onChange={e=>updateFilters({search:e.target.value})}/><select value={filters.topic} onChange={e=>updateFilters({topic:e.target.value})}>{topics.map(x=><option key={x}>{x}</option>)}</select><select value={filters.level} onChange={e=>updateFilters({level:e.target.value})}>{levels.map(x=><option key={x}>{x}</option>)}</select><select value={filters.type} onChange={e=>updateFilters({type:e.target.value})}>{types.map(x=><option key={x}>{x}</option>)}</select><select value={mode} onChange={e=>{setMode(e.target.value);writeStore('interviewMode',e.target.value)}}>{['Practice','Mock Interview','Revision','Weak Questions Only'].map(x=><option key={x}>{x}</option>)}</select><button className="btn ghost" onClick={exportAll}>Export All</button></div>
    </Card>
    <div className="interviewRoomGrid">
      <Card title="Question Bank" subtitle={`${list.length} matching questions`} className="questionIndexCard">
        <div className="interviewQuestionList">{list.filter(q=>mode!=='Weak Questions Only'||answers[q.id]?.status==='Weak').map(q=><button key={q.id} onClick={()=>selectQuestion(q.id)} className={current.id===q.id?'iqItem active':'iqItem'}><b>Q{q.no}</b><span>{q.topic}</span><small>{q.level} • {answers[q.id]?.status||'Not marked'}</small></button>)}</div>
      </Card>
      <Card title={`Q${current.no}. ${current.topic}`} subtitle={`${current.level} • ${current.type}`} className="interviewMainCard">
        <h2 className="interviewQuestionText">{current.question}</h2>
        <div className="interviewGuidance"><div><b>Answer Framework</b><p>{current.modelAnswer}</p></div><div><b>Follow-up Questions</b><ul>{current.followUps.map(x=><li key={x}>{x}</li>)}</ul></div></div>
        <div className="strongPoints"><b>What interviewer wants to hear</b>{current.strongPoints.map(x=><span key={x}>{x}</span>)}</div>
        <textarea className="answerBox interviewAnswerBox" value={rec.text||''} onChange={e=>save(current.id,{text:e.target.value,status:rec.status||'Saved'})} placeholder="Write your interview answer here. Use STAR + project proof + technical depth + measurable impact."/>
        <div className="answerMeta"><span className="pill">{rec.status||'Not marked'}</span>{rec.savedAt&&<span className="pill">Saved: {rec.savedAt}</span>}<span className="pill">Words: {(rec.text||'').trim().split(/\s+/).filter(Boolean).length}</span></div>
        <div className="row"><button className="btn cyan" onClick={()=>save(current.id,{text:rec.text||'My structured interview answer saved.',status:'Saved'})}>Save Answer</button><button className="btn ghost" onClick={()=>save(current.id,{status:'Strong'})}>Strong</button><button className="btn ghost" onClick={()=>save(current.id,{status:'Weak'})}>Weak</button><button className="btn ghost" onClick={()=>save(current.id,{text:`Situation: \nTask: \nAction: \nResult: \nTechnical depth: \nBusiness impact: `,status:'Draft'})}>STAR Template</button><button className="btn ghost" onClick={()=>downloadText(`interview-q${current.no}.txt`,rec.text||'')}>Export</button><button className="btn danger" onClick={()=>del(current.id)}>Delete</button></div>
      </Card>
    </div>
    <Card title="Interview Crack Strategy" subtitle="Use this before every mock interview."><div className="crackGrid"><div><b>60-second rule</b><p>Start with direct answer, then project proof, then impact. Do not over-explain.</p></div><div><b>2+ years proof</b><p>Mention testing, deployment, security, bulkification, debugging and production support.</p></div><div><b>Close strongly</b><p>End with business impact: reduced effort, improved visibility, safer deployment, or faster user process.</p></div></div></Card>
  </Page></Layout>;
}

export function ProjectsPage() {
  const [items,setItems]=React.useState(()=>readStore('projects',projects)); const blank={title:'New Project',company:'',tech:'',overview:'',working:['Step 1'],interview:'',impact:''}; const update=(i,patch)=>{const n=items.map((x,j)=>j===i?{...x,...patch}:x);setItems(n);writeStore('projects',n)}; const remove=i=>{const n=items.filter((_,j)=>j!==i);setItems(n);writeStore('projects',n)};
  return <Layout><Page><Hero title="My Projects" subtitle="Add, edit, delete, save. CV projects with working, interview explanation and impact."/><Card title="Project Actions"><button className="btn cyan" onClick={()=>{const n=[...items,{...blank,id:Date.now()}];setItems(n);writeStore('projects',n)}}>Add Project</button><button className="btn ghost" onClick={()=>downloadText('projects.json',JSON.stringify(items,null,2),'application/json')}>Export Projects</button></Card><div className="listGap">{items.map((p,i)=><Card key={p.id||p.title} title={p.title} subtitle={p.company} action={<button className="btn danger small" onClick={()=>remove(i)}>Delete</button>}><div className="grid2"><input value={p.title} onChange={e=>update(i,{title:e.target.value})}/><input value={p.company||''} onChange={e=>update(i,{company:e.target.value})} placeholder="Company"/></div><input value={p.tech} onChange={e=>update(i,{tech:e.target.value})} placeholder="Tech stack"/><textarea value={p.overview} onChange={e=>update(i,{overview:e.target.value})} placeholder="Description / overview"/><h3>How it works</h3><textarea value={(p.working||[]).join('\n')} onChange={e=>update(i,{working:e.target.value.split('\n').filter(Boolean)})}/><textarea value={p.interview} onChange={e=>update(i,{interview:e.target.value})} placeholder="Interview explanation"/><textarea value={p.impact} onChange={e=>update(i,{impact:e.target.value})} placeholder="Impact"/><button className="btn cyan" onClick={()=>update(i,{updatedAt:new Date().toLocaleString()})}>Save Project</button></Card>)}</div></Page></Layout>;
}
