import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Field, Hero, Layout, Page, Stat } from '../components/UI';
import { companies, jobPortals } from '../data/companies';
import { profile, cvSkills } from '../data/profile';
import { keywordMatch } from '../utils/scoring';
import { downloadText, readStore, writeStore } from '../utils/storage';

const profileKeywords = [
  'Salesforce Developer', 'Apex', 'Apex Trigger', 'LWC', 'Flow', 'SOQL', 'REST API',
  'Salesforce Admin', 'Lightning Web Components', 'Integration', 'Security', 'Reports', 'CRM'
];

function applySearch(companyName = '', role = 'Salesforce Developer', location = 'India / Remote') {
  const q = encodeURIComponent(`${companyName} ${role} Apex LWC Flow jobs ${location} careers`);
  return `https://www.google.com/search?q=${q}`;
}

function professionalApplyNote(companyName = 'Company') {
  return `Hi Team,\n\nI am interested in Salesforce Developer opportunities at ${companyName}. I have hands-on experience with Apex, Lightning Web Components, Flows, SOQL, REST API integrations, reports/dashboards, deployments and production support.\n\nI can contribute to CRM implementation, automation, integrations, issue fixing and scalable Salesforce development.\n\nRegards,\n${profile.name}\n${profile.email}\n${profile.phone}`;
}

function fitScore(row) {
  const text = `${row.name} ${row.website || ''}`.toLowerCase();
  const brandScore = ['cloud','tech','systems','solutions','consulting','salesforce','crm','digital','infotech'].reduce((n,k)=>n+(text.includes(k)?8:0),0);
  return Math.min(100, 55 + brandScore);
}

function normalizeJobs(rows = []) {
  return rows.map((row, index) => ({
    id: row.id || index + 1,
    name: row.name || `Company ${index + 1}`,
    website: row.website || '',
    status: row.status || 'Saved',
    saved: Boolean(row.saved),
    applied: Boolean(row.applied),
    notes: row.notes || '',
    ...row,
  }));
}

function copyText(text) {
  return navigator.clipboard?.writeText(text).catch(() => {});
}

export function JobTracker() {
  const [rows,setRows]=React.useState(()=>normalizeJobs(readStore('jobs',companies)));
  const [filter,setFilter]=React.useState({q:'',status:'All'});
  const [selected,setSelected]=React.useState([]);
  const [applyRole,setApplyRole]=React.useState(()=>readStore('applyRole','Salesforce Developer'));
  const [applyLocation,setApplyLocation]=React.useState(()=>readStore('applyLocation','India / Remote'));

  const list=rows.filter(r=>(filter.status==='All'||r.status===filter.status)&&r.name.toLowerCase().includes(filter.q.toLowerCase())).slice(0,200);
  const update=(id,patch)=>{const n=rows.map(r=>r.id===id?{...r,...patch}:r);setRows(n);writeStore('jobs',n)};
  const recommended=rows.filter(r=>!r.applied).map(r=>({...r,fit:fitScore(r)})).sort((a,b)=>b.fit-a.fit).slice(0,12);
  const appliedCount = rows.filter(r => r.applied || r.status === 'Applied').length;
  const savedCount = rows.filter(r => r.saved || r.status === 'Saved').length;
  const activeCount = rows.filter(r => ['Applied','HR Call','Technical','Offer'].includes(r.status)).length;

  const queueTop=()=>{
    const ids=recommended.slice(0,8).map(r=>r.id);
    const n=rows.map(r=>ids.includes(r.id)?{...r,saved:true,status:r.status||'Saved',notes:r.notes || `Profile match: ${applyRole} - ${applyLocation}. Next action: click company name, open Salesforce Developer career search, verify JD, customize resume, apply manually, and add follow-up date.`}:r);
    setRows(n); writeStore('jobs',n); setSelected(ids);
  };
  const saveApplySettings=()=>{writeStore('applyRole',applyRole);writeStore('applyLocation',applyLocation)};
  const copyNote=(name)=>copyText(professionalApplyNote(name));

  return <Layout><Page><Hero title="Job Tracker" subtitle="Professional Salesforce job pipeline with focused apply queue, company career links, notes and follow-up tracking."/>
    <div className="statsGrid premiumStatsGrid">
      <Stat label="Total Companies" value={rows.length} icon="CO" note="Tracked list"/>
      <Stat label="Saved" value={savedCount} icon="SV" note="Shortlisted"/>
      <Stat label="Applied" value={appliedCount} icon="AP" note="Submitted manually"/>
      <Stat label="Active Pipeline" value={activeCount} icon="IN" note="Interview process"/>
    </div>

    <Card title="Profile-Based Apply Assistant" subtitle="Creates a focused queue from your Salesforce profile. Company name opens Salesforce Developer career search directly.">
      <div className="autoApplyPanel">
        <div className="grid2"><Field label="Target Role" value={applyRole} onChange={setApplyRole}/><Field label="Location" value={applyLocation} onChange={setApplyLocation}/></div>
        <div className="professionalBadgeRow">{profileKeywords.map(k=><span key={k}>{k}</span>)}</div>
        <div className="row"><button className="btn cyan" onClick={()=>{saveApplySettings();queueTop();}}>Generate Apply Queue</button><button className="btn ghost" onClick={saveApplySettings}>Save Target</button><a className="btn ghost" href={`https://www.google.com/search?q=${encodeURIComponent(`${applyRole} ${applyLocation} Salesforce Apex LWC jobs`)}`} target="_blank" rel="noreferrer">Open Job Search</a></div>
        <p className="hint">Best Matching Companies panel removed. Use the company table below; clicking only the company name opens that company&apos;s Salesforce Developer career search.</p>
      </div>
    </Card>

    <Card title="Filters & Bulk Actions"><div className="filterBar"><input value={filter.q} onChange={e=>setFilter({...filter,q:e.target.value})} placeholder="Search company"/><select value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}>{['All','Saved','Applied','HR Call','Technical','Offer','Rejected'].map(x=><option key={x}>{x}</option>)}</select><button className="btn" onClick={()=>{const n=rows.map(r=>selected.includes(r.id)?{...r,status:'Applied',applied:true}:r);setRows(n);writeStore('jobs',n)}}>Bulk Applied</button><button className="btn ghost" onClick={()=>downloadText('job-tracker.json',JSON.stringify(rows,null,2),'application/json')}>Export</button></div></Card>

    <div className="tableWrap professionalJobTable"><table><thead><tr><th><input type="checkbox" onChange={e=>setSelected(e.target.checked?list.map(x=>x.id):[])}/></th><th>No.</th><th>Company</th><th>Status</th><th>Checklist</th><th className="notesTh">Notes / Follow-up Details</th></tr></thead><tbody>{list.map(r=><tr key={r.id}><td><input type="checkbox" checked={selected.includes(r.id)} onChange={e=>setSelected(e.target.checked?[...selected,r.id]:selected.filter(x=>x!==r.id))}/></td><td><span className="numBox">{r.id}</span></td><td><div className="companyCell"><a className="companyCareerLink" href={applySearch(r.name, applyRole, applyLocation)} target="_blank" rel="noreferrer"><b>{r.name}</b></a><div className="row"><button className="btn small ghost" onClick={()=>copyNote(r.name)}>Copy Apply Note</button>{r.website && <a className="btn small ghost" href={r.website} target="_blank" rel="noreferrer">Company Site</a>}</div></div></td><td><select value={r.status} onChange={e=>update(r.id,{status:e.target.value,applied:e.target.value==='Applied'})}>{['Saved','Applied','HR Call','Technical','Offer','Rejected'].map(x=><option key={x}>{x}</option>)}</select></td><td><label className="checkPill"><input type="checkbox" checked={r.saved} onChange={e=>update(r.id,{saved:e.target.checked})}/> Saved</label><label className="checkPill"><input type="checkbox" checked={r.applied} onChange={e=>update(r.id,{applied:e.target.checked,status:e.target.checked?'Applied':r.status})}/> Applied</label></td><td className="jobNotesCell"><textarea className="jobNoteArea" value={r.notes} onChange={e=>update(r.id,{notes:e.target.value})} placeholder="Applied link, recruiter name, follow-up date, JD keywords, interview notes..."/><div className="row"><button className="btn small cyan" onClick={()=>update(r.id,{notes:r.notes, noteSavedAt:new Date().toLocaleString()})}>Save Note</button><small>{r.noteSavedAt}</small></div></td></tr>)}</tbody></table></div><p className="hint">Data saves in browser localStorage. Open Backup Center to see/export all saved data. Backend SQLite sync is separate and works when backend sync is connected.</p></Page></Layout>;
}

export function MoreTools() {
  const jobs=readStore('jobs',companies); const notes=readStore('notes',[]); const docs=readStore('documents',[]); const applied=jobs.filter(j=>j.applied||j.status==='Applied').length;
  const tools=[['Learning Coach','Smart daily plan, sprint timer, mistake bank, quiz, recap, and LinkedIn proof generator.','/learning-coach'],['24 Hours Time Tracker','Track every hour/minute: study, project, interview, job apply, break, and daily productivity dashboard.','/time-tracker'],['Notes Library','View/edit/delete/open uploaded notes and files.','/notes'],['Document Library','Central place for topic PDFs, Word files, images, and code files.','/documents'],['Job Tracker','Profile-based apply queue, 800 companies, website/search links, checklist, sorting and notes.','/job-tracker'],['Weekly Question Papers','Topic-wise 30-question paper for every week.','/weekly-tests'],['Skill Gap Analysis','Track Admin, Flow, Apex, Trigger, LWC, Integration skill strength.','/practice'],['Weak Topic Tracker','Mark weak topics, plan revision, and track improvement.','/focus'],['Revision Calendar','Spaced revision schedule: 1/3/7/15/30 day revision.','/weekly-tests'],['Doubt Tracker','Store doubts with status, priority, answer, and next action.','/doubts'],['Learning Journal','Daily reflection: learned, practiced, mistake, tomorrow.','/journal'],['Certification Tracker','Admin, App Builder, PD1, AI Associate, Agentforce Specialist.','/certifications'],['Trailhead Tracker','Your Trailhead profile link, badges, modules, status.','/certifications'],['JD Matcher','Paste JD and compare Salesforce keywords with backend/Ollama guidance.','/jd-matcher'],['Resume Optimizer','Edit resume fields and check ATS readiness.','/resume'],['Backup Center','Export local app data as JSON.','/backup'],['Storage Health','Show localStorage/file usage summary.','/backup']];
  const resources=[['My Trailhead Profile',profile.trailhead],['Salesforce Trailhead','https://trailhead.salesforce.com'],['Apex Developer Guide','https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/'],['LWC Developer Guide','https://developer.salesforce.com/docs/platform/lwc/overview'],['SOQL/SOSL Guide','https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/'],['Flow Builder','https://help.salesforce.com/s/articleView?id=sf.flow.htm&type=5'],['Salesforce Careers','https://careers.salesforce.com']];
  return <Layout><Page><Hero title="More Tools" subtitle="All job-ready tools are connected with useful data, links, and working local actions."/><div className="statsGrid"><Stat label="Notes" value={notes.length} icon="NT"/><Stat label="Files" value={docs.length} icon="FL"/><Stat label="Companies" value="800" icon="CO"/><Stat label="Applied" value={applied} icon="AP"/></div><div className="toolList">{tools.map(([t,d,l])=><Card key={t} title={t} subtitle={d} action={<Link className="btn" to={l}>Open Tool</Link>}/>)}</div><Card title="Quick Resources"><div className="resourceGrid">{resources.map(([t,l])=><a className="btn ghost" key={t} href={l} target="_blank" rel="noreferrer">{t}</a>)}</div></Card></Page></Layout>;
}

function getImportantKeywords(text) {
  const words = String(text).toLowerCase().match(/[a-z][a-z+#.0-9-]{2,}/g) || [];
  const set = new Set(words);
  const important = ['salesforce','apex','trigger','lwc','flow','soql','sosl','rest','api','integration','security','sharing','profile','permission','deployment','test','class','data','loader','reports','dashboards','agile','jira','git','admin','developer','validation','batch','queueable','async','sales','cloud'];
  return important.filter(k => set.has(k));
}

function localJDAnalysis(jd, resume) {
  const base = keywordMatch(jd, resume);
  const jdImportant = getImportantKeywords(jd);
  const resumeImportant = getImportantKeywords(resume);
  const matched = jdImportant.filter(k => resumeImportant.includes(k));
  const missing = jdImportant.filter(k => !resumeImportant.includes(k));
  const technicalFit = Math.round((matched.length / Math.max(1, jdImportant.length)) * 100);
  const score = Math.max(base.score, technicalFit);
  const hrFit = score >= 75 ? 'High' : score >= 55 ? 'Medium' : 'Low';
  return {
    score, technicalFit, hrFit,
    matched: [...new Set([...(base.matched || []), ...matched])],
    missing: [...new Set([...(base.missing || []), ...missing])].slice(0, 30),
    nextActions: [
      missing.length ? `Add proof for missing keywords: ${missing.slice(0,6).join(', ')}` : 'Core Salesforce keywords are aligned.',
      'Add one measurable project impact line before applying.',
      'Prepare one 60-second answer for the top 3 JD skills.',
      'Apply manually after verifying role, location, salary and experience fit.'
    ]
  };
}

export function JDMatcher() {
  const defaultResume = `${profile.summary}\n${Object.values(cvSkills).flat().join(', ')}`;
  const [jd,setJd]=React.useState(()=>readStore('jdText','Paste Salesforce job description here...'));
  const [resume,setResume]=React.useState(()=>readStore('resumeText',defaultResume));
  const [analysis,setAnalysis]=React.useState(()=>readStore('jdProfessionalAnalysis',null));
  const [loading,setLoading]=React.useState(false);
  const current = analysis || localJDAnalysis(jd, resume);

  const analyze=async()=>{
    setLoading(true);
    const local = localJDAnalysis(jd, resume);
    let final = {...local, source:'local-professional'};
    try {
      const response = await fetch('http://127.0.0.1:8000/api/mentor', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({mode:'ollama', question:`Analyze this Salesforce JD against my profile. Give HR fit, technical fit, missing keywords, resume improvements, application strategy and interview preparation.\n\nMY PROFILE:\n${resume}\n\nJOB DESCRIPTION:\n${jd}`, context:{mode:'JD Matcher', difficulty:'Professional', interviewMode:'HR + Technical'}})
      });
      const data = await response.json();
      final = {...local, source:data.source || 'backend-ollama', mentorAnswer:data.answer};
    } catch (error) {
      final = {...local, source:'local-fallback', mentorAnswer:'Backend/Ollama is not available. Local professional analysis is shown.'};
    }
    setAnalysis(final); writeStore('jdProfessionalAnalysis', final); writeStore('jdText', jd); writeStore('resumeText', resume); setLoading(false);
  };

  const draft = `Hi Team,\n\nI am interested in this Salesforce Developer role. My experience includes Apex, LWC, Flow, SOQL, REST API integrations, Salesforce security, reports/dashboards, deployment support and production issue handling.\n\nI can contribute to scalable CRM development, automation, integrations and business-focused Salesforce delivery.\n\nRegards,\n${profile.name}\n${profile.email}\n${profile.phone}`;

  return <Layout><Page><Hero title="JD Matcher" subtitle="Professional JD analysis connected to your resume profile, local scoring and Ollama backend when available."/>
    <div className="grid2"><Card title="Your Resume/Profile Keywords"><textarea value={resume} onChange={e=>setResume(e.target.value)}/></Card><Card title="Job Description"><textarea value={jd} onChange={e=>setJd(e.target.value)}/></Card></div>
    <Card title="Match Result" subtitle="HR fit, technical fit, missing keywords and next action.">
      <div className="jdResultPro"><div className="jdScoreCircle"><b>{current.score}%</b><span>Match</span></div><div><h3>Professional Result</h3><p><b>HR Fit:</b> {current.hrFit}</p><p><b>Technical Fit:</b> {current.technicalFit}%</p><p><b>Matched:</b> {current.matched.slice(0,20).join(', ') || 'Add JD and resume content.'}</p><p><b>Missing:</b> {current.missing.slice(0,20).join(', ') || 'No major missing core keyword detected.'}</p></div></div>
      <div className="notificationStack">{current.nextActions.map((a,i)=><div key={a}><b>{String(i+1).padStart(2,'0')}</b><span>{a}</span></div>)}</div>
      <div className="row"><button className="btn cyan" onClick={analyze}>{loading?'Analyzing...':'Analyze with Backend/Ollama'}</button><button className="btn ghost" onClick={()=>{writeStore('jdText',jd);writeStore('resumeText',resume)}}>Save JD</button>{jobPortals.map(([n,l])=><a className="btn ghost" target="_blank" rel="noreferrer" href={l} key={n}>{n}</a>)}</div>
      {current.mentorAnswer && <div className="mentorAnswerBox"><h3>Ollama / Backend Recommendation</h3><pre>{current.mentorAnswer}</pre></div>}
    </Card>
    <div className="grid2"><Card title="Application Draft" subtitle="Review before sending."><textarea value={draft} readOnly/><button className="btn cyan" onClick={()=>copyText(draft)}>Copy Draft</button></Card><Card title="Real-Time Search Links" subtitle="Manual review links for job validation."><div className="resourceGrid"><a className="btn ghost" target="_blank" rel="noreferrer" href={`https://www.google.com/search?q=${encodeURIComponent('Salesforce Developer Apex LWC Flow jobs India')}`}>Google Jobs Search</a><a className="btn ghost" target="_blank" rel="noreferrer" href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent('Salesforce Developer Apex LWC')}`}>LinkedIn Search</a><a className="btn ghost" target="_blank" rel="noreferrer" href="https://www.naukri.com/salesforce-developer-jobs">Naukri Search</a></div></Card></div>
  </Page></Layout>;
}
