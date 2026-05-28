import React from 'react';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { readStore, writeStore, exportBackup, downloadText } from '../utils/storage';

const categories = ['Reading / Theory','Salesforce Study','Hands-on Project','Interview Practice','Notes / Revision','Resume / LinkedIn','Job Apply','Portfolio Building','Trailhead / Certification','Coding Practice','Project Documentation','Sleep','Eating','Washroom / Freshen Up','Travelling','Calling / Communication','Movie / Entertainment','Television','Social Media','Exercise / Walk','Personal Work','Break','Other'];
const productiveCats = ['Reading / Theory','Salesforce Study','Hands-on Project','Interview Practice','Notes / Revision','Resume / LinkedIn','Job Apply','Portfolio Building','Trailhead / Certification','Coding Practice','Project Documentation'];
const defaultBlocks = [
  ['09:00','11:00','Salesforce Study','Salesforce core topic study',''],
  ['11:15','12:15','Coding Practice','1 hour DSA practice',''],
  ['12:30','13:30','Reading / Theory','1 hour System Design study',''],
  ['15:00','17:00','Hands-on Project','Project build / fix / polish',''],
  ['17:30','18:30','Interview Practice','Save one interview answer',''],
  ['19:00','20:00','Notes / Revision','Revision + job tracker update','']
].map((x,i)=>({id:i+1,start:x[0],end:x[1],category:x[2],task:x[3],notes:x[4],done:false,productive:productiveCats.includes(x[2])}));

function minutesBetween(start,end){ const [sh,sm]=String(start||'00:00').split(':').map(Number); const [eh,em]=String(end||'00:00').split(':').map(Number); let m=(eh*60+em)-(sh*60+sm); return m>0?m:0; }
function fmt(min){ const h=Math.floor(min/60); const m=min%60; return `${h}h ${m}m`; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function addDays(dateStr, days){ const base = dateStr ? new Date(dateStr) : new Date(); base.setDate(base.getDate()+days); return base.toISOString().slice(0,10); }
function defaultDateForDay(day){ const start = readStore('learningStartDate','') || todayISO(); return addDays(start, Math.max(0, Number(day || 1)-1)); }
function cloneTemplate(day){ return defaultBlocks.map((block,index)=>({...block,id:Number(`${day}${index + 1}${Date.now()}`),done:false,notes:''})); }
function safePercent(value,total){ return total ? Math.round(value / total * 100) : 0; }

export function TimeTracker() {
  const [day,setDayState]=React.useState(()=>Number(readStore('timeCurrentDay',1)) || 1);
  const [all,setAll]=React.useState(()=>readStore('timeTasksByDay',{}));
  const [dates,setDates]=React.useState(()=>readStore('timeDatesByDay',{}));
  const tasks=all[day] || cloneTemplate(day);
  const selectedDate = dates[day] || defaultDateForDay(day);
  const [form,setForm]=React.useState({start:'09:00',end:'10:00',category:'Salesforce Study',task:'',notes:''});

  const persist=(nextAll=all,nextDates=dates,nextDay=day)=>{ setAll(nextAll); setDates(nextDates); setDayState(nextDay); writeStore('timeTasksByDay',nextAll); writeStore('timeDatesByDay',nextDates); writeStore('timeCurrentDay',nextDay); writeStore('timeTasks',nextAll[nextDay] || cloneTemplate(nextDay)); window.dispatchEvent(new Event('storage')); };
  const setDay=(nextDay)=>{ const safe=Math.max(1,Math.min(90,Number(nextDay)||1)); const nextAll={...all}; const nextDates={...dates}; if(!nextAll[safe]) nextAll[safe]=cloneTemplate(safe); if(!nextDates[safe]) nextDates[safe]=defaultDateForDay(safe); persist(nextAll,nextDates,safe); };
  const saveDay=(items)=>{ const n={...all,[day]:items}; const d={...dates,[day]:selectedDate}; persist(n,d,day); };
  const update=(id,patch)=>saveDay(tasks.map(t=>t.id===id?{...t,...patch}:t));
  const add=()=>{ if(!form.task.trim()) return; saveDay([...tasks,{...form,id:Date.now(),done:false,productive:productiveCats.includes(form.category)}]); setForm({...form,task:'',notes:''}); };
  const duplicate=(t)=>saveDay([...tasks,{...t,id:Date.now(),task:t.task+' copy',done:false}]);
  const quick=(category,min,task)=>{ const now=new Date(); const start=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; const endDate=new Date(now.getTime()+min*60000); const end=`${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`; saveDay([...tasks,{id:Date.now(),start,end,category,task,notes:'Quick sprint',done:true,productive:productiveCats.includes(category)}]); };
  const saveDate=(value)=>{ const nextDates={...dates,[day]:value}; persist(all,nextDates,day); };
  const loadTemplate=()=>saveDay(cloneTemplate(day));
  const markAllDone=()=>saveDay(tasks.map(t=>({...t,done:true})));
  const completeDayAndOpenNext=()=>{ const completed=tasks.map(t=>({...t,done:true})); const nextDay=Math.min(90,day+1); const nextAll={...all,[day]:completed}; if(!nextAll[nextDay]) nextAll[nextDay]=cloneTemplate(nextDay); const nextDates={...dates,[day]:selectedDate}; if(!nextDates[nextDay]) nextDates[nextDay]=addDays(selectedDate,1); persist(nextAll,nextDates,nextDay); };

  const total=tasks.reduce((a,t)=>a+minutesBetween(t.start,t.end),0);
  const doneMin=tasks.filter(t=>t.done).reduce((a,t)=>a+minutesBetween(t.start,t.end),0);
  const productive=tasks.filter(t=>productiveCats.includes(t.category)).reduce((a,t)=>a+minutesBetween(t.start,t.end),0);
  const jobMin=tasks.filter(t=>t.category==='Job Apply').reduce((a,t)=>a+minutesBetween(t.start,t.end),0);
  const focusScore=safePercent(productive,total);
  const donePercent=safePercent(doneMin,total);
  const isComplete = tasks.length > 0 && tasks.every(t=>t.done);
  const pending = tasks.filter(t=>!t.done).length;
  const stats=categories.map(c=>({cat:c,min:tasks.filter(t=>t.category===c).reduce((a,t)=>a+minutesBetween(t.start,t.end),0)})).filter(x=>x.min>0);
  const nextTask = tasks.find(t=>!t.done) || tasks[0];
  const exportReport=()=>downloadText(`day-${day}-${selectedDate}-time-report.txt`, `Day ${day} 24h Tracker\nDate: ${selectedDate}\nTracked: ${fmt(total)}\nProductive: ${fmt(productive)}\nDone: ${fmt(doneMin)}\nFocus Score: ${focusScore}%\n\n`+tasks.map(t=>`${t.start}-${t.end} | ${t.category} | ${t.task} | ${t.done?'Done':'Pending'} | ${t.notes}`).join('\n'));

  return <Layout><Page>
    <section className="timeHeroPro">
      <div><p className="eyebrow">24 Hours Command Planner</p><h1>Day {day} Time Tracker</h1><p>Plan the day, track study blocks, save proof, and open the next day automatically after completion.</p><div className="timeHeroActions"><button className="btn cyan" onClick={completeDayAndOpenNext}>{isComplete?'Open Next Day':'Complete Day & Open Next Day'}</button><button className="btn ghost" onClick={markAllDone}>Mark All Done</button><button className="btn ghost" onClick={exportReport}>Export Report</button></div></div>
      <div className="timeScorePanel"><b>{focusScore}%</b><span>Focus Score</span><Progress value={focusScore}/><small>{isComplete ? 'Day complete. Move to next day.' : `${pending} block(s) pending today.`}</small></div>
    </section>

    <Card title="Day Setup" subtitle="Select day and date. Your blocks are saved separately for each day.">
      <div className="timeSetupGrid"><label><span>Learning Day</span><input type="number" min="1" max="90" value={day} onChange={e=>setDay(e.target.value)}/></label><label><span>Date</span><input type="date" value={selectedDate} onChange={e=>saveDate(e.target.value)}/></label><button className="btn ghost" onClick={()=>setDay(Math.max(1,day-1))}>Previous Day</button><button className="btn ghost" onClick={()=>setDay(Math.min(90,day+1))}>Next Day</button><button className="btn cyan" onClick={loadTemplate}>Reset Day Template</button></div>
    </Card>

    <div className="timeCommandGrid"><Card title="Next Action" subtitle="Do this first."><div className="timeNextAction"><b>{nextTask ? nextTask.category : 'Start planning'}</b><p>{nextTask ? `${nextTask.start} - ${nextTask.end}: ${nextTask.task}` : 'Load the template or add a new block.'}</p><button className="btn cyan" onClick={()=>nextTask&&update(nextTask.id,{done:true})}>Mark Next Done</button></div></Card><Card title="Daily Routine" subtitle="Required 8-hour structure."><div className="timeRoutineList"><span>2h Salesforce</span><span>1h DSA</span><span>1h System Design</span><span>2h Project</span><span>1h Interview</span><span>1h Revision</span></div></Card></div>

    <div className="timeStatsPro"><div><span>Tracked</span><b>{fmt(total)}</b><small>All planned blocks</small></div><div><span>Completed</span><b>{fmt(doneMin)}</b><small>{donePercent}% done</small></div><div><span>Productive</span><b>{fmt(productive)}</b><small>Study + career</small></div><div><span>Career</span><b>{fmt(jobMin)}</b><small>Job actions</small></div></div>

    <Card title="Quick Add Focus Blocks" subtitle="One click se common study blocks add ho jayenge."><div className="quickTimeGrid"><button onClick={()=>quick('Salesforce Study',45,'45-min Salesforce sprint')}>+45m Salesforce</button><button onClick={()=>quick('Coding Practice',60,'1h DSA practice')}>+1h DSA</button><button onClick={()=>quick('Reading / Theory',60,'1h System Design')}>+1h System Design</button><button onClick={()=>quick('Hands-on Project',90,'90-min project build')}>+90m Project</button><button onClick={()=>quick('Interview Practice',45,'45-min interview answer')}>+45m Interview</button><button onClick={()=>quick('Job Apply',30,'30-min job apply')}>+30m Job Apply</button></div></Card>

    <Card title="Add Custom Time Block" subtitle="Simple form: time, category, task and proof note."><div className="timeForm professionalTimeForm"><label><span>Start</span><input type="time" value={form.start} onChange={e=>setForm({...form,start:e.target.value})}/></label><label><span>End</span><input type="time" value={form.end} onChange={e=>setForm({...form,end:e.target.value})}/></label><label><span>Category</span><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label><span>Task</span><input value={form.task} onChange={e=>setForm({...form,task:e.target.value})} placeholder="Example: Apex trigger practice"/></label><label className="wide"><span>Proof Note</span><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="What did you complete?"/></label><button className="btn cyan" onClick={add}>Save Block</button></div></Card>

    <div className="grid2"><Card title="Category Graph" subtitle="Time distribution by category."><div className="barGraph">{stats.length?stats.map(s=><div className="barRow" key={s.cat}><b>{s.cat}</b><div><i style={{width:`${Math.max(4,total?s.min/total*100:0)}%`}}/></div><span>{fmt(s.min)}</span></div>):<p className="hint">No tracked time yet.</p>}</div></Card><Card title="24 Hour Heatmap" subtitle="Highlighted hours show active planned blocks."><div className="heatmap professionalHeatmap">{Array.from({length:24},(_,h)=>{ const active=tasks.some(t=>{const st=Number(String(t.start).split(':')[0]); const en=Number(String(t.end).split(':')[0]); return h>=st && h<=en;}); return <span key={h} className={active?'on':''} title={`${h}:00`}>{h}</span>})}</div><div className="tip"><b>Learning Guidance</b><p>{productive<180?'Learning time is low today. Complete one Salesforce, DSA or System Design sprint first.':'Good productive base today. Add one interview answer and one job follow-up.'}</p><p>Balance: Learning {fmt(productive)} • Career {fmt(jobMin)} • Other {fmt(Math.max(0,total-productive-jobMin))}</p></div></Card></div>

    <Card title="Today Blocks" subtitle="Edit, mark done, duplicate or delete each block."><div className="professionalTimeCards">{tasks.map((t,index)=><div className={t.done?'timeCardPro done':'timeCardPro'} key={t.id}><div className="timeCardTop"><b>{String(index+1).padStart(2,'0')}</b><div><strong>{t.start} - {t.end}</strong><span>{fmt(minutesBetween(t.start,t.end))} • {t.done?'Done':'Pending'}</span></div></div><div className="timeCardInputs"><select value={t.category} onChange={e=>update(t.id,{category:e.target.value,productive:productiveCats.includes(e.target.value)})}>{categories.map(c=><option key={c}>{c}</option>)}</select><input value={t.task} onChange={e=>update(t.id,{task:e.target.value})}/><textarea value={t.notes||''} onChange={e=>update(t.id,{notes:e.target.value})} placeholder="Proof / result / notes"/></div><div className="row"><button className="btn small" onClick={()=>update(t.id,{done:!t.done})}>{t.done?'Undo':'Done'}</button><button className="btn small ghost" onClick={()=>duplicate(t)}>Duplicate</button><button className="btn small danger" onClick={()=>saveDay(tasks.filter(x=>x.id!==t.id))}>Delete</button></div></div>)}</div></Card>
  </Page></Layout>;
}

function SimpleCrud({ storeKey, title, placeholder, fields = ['title','body','status'] }) {
  const [items,setItems]=React.useState(()=>readStore(storeKey,[])); const [form,setForm]=React.useState({title:'',body:'',status:'Open',priority:'Medium',answer:'',nextAction:''});
  const save=()=>{if(!form.title.trim())return; const n=[...items,{...form,id:Date.now(),createdAt:new Date().toLocaleString()}];setItems(n);writeStore(storeKey,n);setForm({title:'',body:'',status:'Open',priority:'Medium',answer:'',nextAction:''})};
  const update=(id,patch)=>{const n=items.map(x=>x.id===id?{...x,...patch}:x);setItems(n);writeStore(storeKey,n)};
  const remove=(id)=>{const n=items.filter(x=>x.id!==id);setItems(n);writeStore(storeKey,n)};
  return <Layout><Page><Hero title={title} subtitle={placeholder}/><Card title="Add New"><div className="grid2"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Title"/><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Open</option><option>In Progress</option><option>Done</option></select></div><textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder={placeholder}/>{fields.includes('priority')&&<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>High</option><option>Medium</option><option>Low</option></select>}{fields.includes('answer')&&<textarea value={form.answer} onChange={e=>setForm({...form,answer:e.target.value})} placeholder="Answer / explanation"/>}<button className="btn cyan" onClick={save}>Save</button></Card><div className="listGap">{items.map(i=><Card key={i.id} title={i.title} subtitle={i.createdAt} action={<button className="btn danger small" onClick={()=>remove(i.id)}>Delete</button>}><div className="grid2"><input value={i.title} onChange={e=>update(i.id,{title:e.target.value})}/><select value={i.status} onChange={e=>update(i.id,{status:e.target.value})}><option>Open</option><option>In Progress</option><option>Done</option></select></div><textarea value={i.body} onChange={e=>update(i.id,{body:e.target.value})}/>{fields.includes('priority')&&<select value={i.priority||'Medium'} onChange={e=>update(i.id,{priority:e.target.value})}><option>High</option><option>Medium</option><option>Low</option></select>}{fields.includes('answer')&&<textarea value={i.answer||''} onChange={e=>update(i.id,{answer:e.target.value})} placeholder="Answer"/>}<button className="btn ghost" onClick={()=>update(i.id,{updatedAt:new Date().toLocaleString()})}>Save Edit</button></Card>)}</div></Page></Layout>;
}

export const Notes = () => <SimpleCrud storeKey="notes" title="Notes Library" placeholder="Save/edit/delete notes and proof."/>;
export const Doubts = () => <SimpleCrud storeKey="doubts" title="Doubt Tracker" placeholder="Store doubts with status, priority, answer, and next action." fields={['title','body','status','priority','answer']}/>;
export const Journal = () => <SimpleCrud storeKey="journal" title="Learning Journal" placeholder="Daily reflection: learned, practiced, mistake, tomorrow."/>;

export function Documents() {
  const [docs,setDocs]=React.useState(()=>readStore('documents',[])); async function add(e){const f=e.target.files[0]; if(!f)return; const data=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f)}); const n=[...docs,{id:Date.now(),name:f.name,size:f.size,type:f.type,data,desc:''}];setDocs(n);writeStore('documents',n)}
  return <Layout><Page><Hero title="Document Library" subtitle=""/><Card title="Upload"><input type="file" onChange={add}/></Card><div className="grid3">{docs.map(d=><Card key={d.id} title={d.name} subtitle={`${Math.round(d.size/1024)} KB`}><textarea value={d.desc} onChange={e=>{const n=docs.map(x=>x.id===d.id?{...x,desc:e.target.value}:x);setDocs(n);writeStore('documents',n)}} placeholder="Details"/><div className="row"><a className="btn" target="_blank" href={d.data}>Open</a><button className="btn danger" onClick={()=>{const n=docs.filter(x=>x.id!==d.id);setDocs(n);writeStore('documents',n)}}>Delete</button></div></Card>)}</div></Page></Layout>;
}

function getLocalStorageRows() { return Array.from({ length: localStorage.length }, (_, index) => { const key = localStorage.key(index); const value = localStorage.getItem(key) || ''; return { key, size: Math.round(value.length / 1024 * 10) / 10, preview: value.slice(0, 180) }; }).filter(row => row.key && !['theme'].includes(row.key)).sort((a,b) => a.key.localeCompare(b.key)); }

export function Backup() {
  const [rows, setRows] = React.useState(getLocalStorageRows);
  const [selectedKey, setSelectedKey] = React.useState('');
  const selectedValue = selectedKey ? localStorage.getItem(selectedKey) || '' : '';
  const refresh = () => setRows(getLocalStorageRows());
  const exportOne = () => selectedKey && downloadText(`${selectedKey}.json`, selectedValue || '{}', 'application/json');
  return <Layout><Page><Hero title="Backup Center & Saved Data Viewer" subtitle="See exactly where app data is saved, preview it, and export it."/>
    <Card title="Where Your Data Is Stored" subtitle="Frontend saves immediately in browser localStorage. Backend SQLite is separate and works when backend sync/API is used."><div className="notificationStack"><div><b>01</b><span><strong>Browser Local Storage:</strong> most app data such as jobs, notes, answers, JD, resume, tracker data.</span></div><div><b>02</b><span><strong>Backend SQLite:</strong> E:\\sfdc-mentor-final-realtime-dashboard-dsa-fixed\\backend\\mentor_storage.sqlite3</span></div><div><b>03</b><span><strong>Export:</strong> use backup JSON before clearing browser data.</span></div></div><div className="row"><button className="btn cyan" onClick={exportBackup}>Export All Backup JSON</button><button className="btn ghost" onClick={refresh}>Refresh Saved Data</button><a className="btn ghost" href="http://127.0.0.1:8000/api/health" target="_blank" rel="noreferrer">Check Backend</a></div></Card>
    <Card title="Saved Data Browser" subtitle="Select any key to preview/export."><div className="grid2"><select value={selectedKey} onChange={e=>setSelectedKey(e.target.value)}><option value="">Select saved key</option>{rows.map(row=><option key={row.key} value={row.key}>{row.key} ({row.size} KB)</option>)}</select><button className="btn ghost" onClick={exportOne} disabled={!selectedKey}>Export Selected</button></div><textarea value={selectedValue} readOnly style={{minHeight:220}} placeholder="Select a key to preview saved JSON/text."/></Card>
    <div className="grid2">{rows.slice(0,20).map(row=><Card key={row.key} title={row.key} subtitle={`${row.size} KB`}><p className="hint">{row.preview || 'Empty'}</p></Card>)}</div>
  </Page></Layout>;
}
