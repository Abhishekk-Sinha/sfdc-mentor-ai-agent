import React from 'react';
import { Card, Field, Hero, Layout, Page, Progress } from '../components/UI';
import { cvSkills, profile } from '../data/profile';
import { readStore, writeStore, downloadText } from '../utils/storage';

export function ResumeOptimizer() {
  const [resume,setResume]=React.useState(()=>readStore('resume',{summary:profile.summary,skills:Object.values(cvSkills).flat().join(', '),projects:'Real Estate Portal, Doctor Patient Management System, CCMS'})); const ats=['Apex','LWC','SOQL','Flow','REST API','Security','Reports','Dashboards','Data Loader','Test Classes']; const text=(resume.summary+' '+resume.skills+' '+resume.projects).toLowerCase(); const found=ats.filter(k=>text.includes(k.toLowerCase())); const score=Math.round(found.length/ats.length*100); const save=()=>writeStore('resume',resume);
  return <Layout><Page><Hero title="Resume Optimizer" subtitle="Edit resume fields and check ATS readiness."/><Card title="ATS Score"><h1>{score}%</h1><Progress value={score}/><p>Found: {found.join(', ')}</p><p>Missing: {ats.filter(x=>!found.includes(x)).join(', ')}</p></Card><div className="grid2"><Card title="Resume Fields"><Field label="Summary" area value={resume.summary} onChange={v=>setResume({...resume,summary:v})}/><Field label="Skills" area value={resume.skills} onChange={v=>setResume({...resume,skills:v})}/><Field label="Projects" area value={resume.projects} onChange={v=>setResume({...resume,projects:v})}/><button className="btn" onClick={save}>Save</button><button className="btn ghost" onClick={()=>downloadText('resume-draft.txt',JSON.stringify(resume,null,2))}>Export</button></Card><Card title="Resume Bullet Generator"><textarea placeholder="Paste responsibility or project detail"/><button className="btn">Generate Bullet Draft</button><p className="hint">Use action verb + tech + business impact + metric.</p></Card></div></Page></Layout>;
}

export function Certifications() {
  const [items,setItems]=React.useState(()=>readStore('certs',['Administrator','Platform App Builder','Platform Developer I','AI Associate','Agentforce Specialist'].map(x=>({name:x,progress:0,target:'',notes:''})))); const update=(i,patch)=>{const n=items.map((x,j)=>j===i?{...x,...patch}:x);setItems(n);writeStore('certs',n)};
  return <Layout><Page><Hero title="Certification & Trailhead Tracker" subtitle="Admin, App Builder, PD1, AI Associate, Agentforce Specialist."/><div className="listGap">{items.map((c,i)=><Card key={c.name} title={c.name}><Progress value={c.progress}/><div className="filterBar"><input type="number" value={c.progress} onChange={e=>update(i,{progress:Number(e.target.value)})}/><input value={c.target} onChange={e=>update(i,{target:e.target.value})} placeholder="Target date"/></div><textarea value={c.notes} onChange={e=>update(i,{notes:e.target.value})} placeholder="Modules, badges, notes"/></Card>)}</div></Page></Layout>;
}

