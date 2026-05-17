import React from 'react';
import { Card, Hero, Layout, Page } from '../components/UI';
import { questionBank, scenarioQuestions } from '../data/questions';
import { salesforceUseCases } from '../data/useCases';
import { readStore, writeStore } from '../utils/storage';

function QuestionCard({ q, answers, setAnswers, weakStrong, setWeakStrong, showLink = false }) {
  const rec = answers[q.id] || {};
  const save = text => {
    const next = { ...answers, [q.id]: { ...rec, text, savedAt: new Date().toLocaleString(), status: 'Saved' } };
    setAnswers(next);
    writeStore('answers', next);
  };
  const deleteAnswer = () => {
    const next = { ...answers };
    delete next[q.id];
    setAnswers(next);
    writeStore('answers', next);
    const marks = { ...weakStrong };
    delete marks[q.id];
    setWeakStrong(marks);
    writeStore('weakStrong', marks);
  };
  const mark = status => {
    const marks = { ...weakStrong, [q.id]: status };
    setWeakStrong(marks);
    writeStore('weakStrong', marks);
  };
  return <Card title={q.title || q.question} subtitle={`${q.track || 'Scenario'} • ${q.topic} • ${q.level}`}>
    <p className="questionText">{q.question}</p>
    {q.hint && <p className="hint"><b>Hint:</b> {q.hint}</p>}
    <div className="grid2 answerAssist">
      <pre className="codeBox"><b>Starter / Structure</b>{'\n'}{q.starterCode || q.answer}</pre>
      <pre className="codeBox"><b>Model Pattern</b>{'\n'}{q.answer}{q.timeComplexity ? `\n\nTime: ${q.timeComplexity}` : ''}{q.spaceComplexity ? `\nSpace: ${q.spaceComplexity}` : ''}</pre>
    </div>
    <textarea className="answerBox" value={rec.text || ''} onChange={e=>save(e.target.value)} placeholder="Write your answer/code/explanation here. It auto-saves as you type." />
    <div className="answerMeta"><span className="pill">{rec.status || 'Not saved'}</span><span className="pill">{weakStrong[q.id] || 'Not marked'}</span>{rec.savedAt && <small>Saved: {rec.savedAt}</small>}</div>
    <div className="row"><button className="btn cyan" onClick={()=>save(rec.text || 'Saved answer draft')}>Save</button><button className="btn ghost" onClick={()=>mark('Weak')}>Weak</button><button className="btn ghost" onClick={()=>mark('Strong')}>Strong</button><button className="btn danger" onClick={deleteAnswer}>Delete</button>{showLink && q.link && <a className="btn ghost" target="_blank" href={q.link}>Open Link</a>}</div>
  </Card>;
}

export function PracticeLab() {
  const [filters, setFilters] = React.useState({ track:'DSA', topic:'All', level:'All', search:'' });
  const [answers,setAnswers] = React.useState(()=>readStore('answers',{}));
  const [weakStrong,setWeakStrong] = React.useState(()=>readStore('weakStrong',{}));
  const topics = ['All', ...new Set(questionBank.filter(q=>filters.track==='All'||q.track===filters.track).map(q=>q.topic))];
  const rows = questionBank.filter(q=>(filters.track==='All'||q.track===filters.track)&&(filters.topic==='All'||q.topic===filters.topic)&&(filters.level==='All'||q.level===filters.level)&&(`${q.title} ${q.question}`.toLowerCase().includes(filters.search.toLowerCase()))).slice(0,100);
  return <Layout><Page><Hero title="Practice Lab" subtitle="DSA written LeetCode-style questions, Salesforce Admin/Developer, System Design, Time Complexity — with answer/code save, edit and delete."><div className="scoreMini"><b>{rows.length}</b><span>Filtered Questions</span></div></Hero><Card title="Filters"><div className="filterBar"><select value={filters.track} onChange={e=>setFilters({...filters,track:e.target.value,topic:'All'})}>{['All','DSA','Salesforce Admin','Salesforce Developer','System Design','Time Complexity'].map(x=><option key={x}>{x}</option>)}</select><select value={filters.topic} onChange={e=>setFilters({...filters,topic:e.target.value})}>{topics.map(x=><option key={x}>{x}</option>)}</select><select value={filters.level} onChange={e=>setFilters({...filters,level:e.target.value})}>{['All','Easy','Medium','Hard','Advanced'].map(x=><option key={x}>{x}</option>)}</select><input value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})} placeholder="Search" /></div><p className="hint">Open Link sirf first visible DSA reference question par dikhaya gaya hai. Baaki sab in-app likhe hue questions hain.</p></Card><div className="listGap">{rows.map((q,i)=><QuestionCard key={q.id} q={q} answers={answers} setAnswers={setAnswers} weakStrong={weakStrong} setWeakStrong={setWeakStrong} showLink={i===0 && Boolean(q.link)} />)}</div></Page></Layout>;
}

export function ScenarioQuestions() {
  const [topic,setTopic]=React.useState('All'); const [level,setLevel]=React.useState('All'); const [answers,setAnswers]=React.useState(()=>readStore('answers',{})); const [weakStrong,setWeakStrong]=React.useState(()=>readStore('weakStrong',{}));
  const topics=['All',...new Set(scenarioQuestions.map(x=>x.topic))]; const rows=scenarioQuestions.filter(x=>(topic==='All'||x.topic===topic)&&(level==='All'||x.level===level)).slice(0,80);
  return <Layout><Page><Hero title="Topic-wise Salesforce Scenario Questions" subtitle=""/><Card title="Filters"><div className="filterBar"><select value={topic} onChange={e=>setTopic(e.target.value)}>{topics.map(x=><option key={x}>{x}</option>)}</select><select value={level} onChange={e=>setLevel(e.target.value)}>{['All','Easy','Medium','Hard','Advanced'].map(x=><option key={x}>{x}</option>)}</select></div></Card><div className="listGap">{rows.map(q=><QuestionCard key={q.id} q={{...q,title:q.question,track:'Scenario'}} answers={answers} setAnswers={setAnswers} weakStrong={weakStrong} setWeakStrong={setWeakStrong}/>)}</div></Page></Layout>;
}

export function UseCases() {
  const [topic,setTopic]=React.useState('All'); const [industry,setIndustry]=React.useState('All');
  const topics=['All',...new Set(salesforceUseCases.map(x=>x.topic))]; const industries=['All',...new Set(salesforceUseCases.map(x=>x.industry))]; const rows=salesforceUseCases.filter(x=>(topic==='All'||x.topic===topic)&&(industry==='All'||x.industry===industry)).slice(0,100);
  return <Layout><Page><Hero title="Salesforce Use Case Studio" subtitle="Real-time use cases: business problem, solution, steps, interview explanation."/><Card title="Filters"><div className="filterBar"><select value={topic} onChange={e=>setTopic(e.target.value)}>{topics.map(x=><option key={x}>{x}</option>)}</select><select value={industry} onChange={e=>setIndustry(e.target.value)}>{industries.map(x=><option key={x}>{x}</option>)}</select></div></Card><div className="useCaseGrid">{rows.map(u=><Card key={u.id} title={u.title} subtitle={`${u.topic} • ${u.industry} • ${u.level}`}><p><b>Problem:</b> {u.problem}</p><p><b>Solution:</b> {u.solution}</p><ol>{u.steps.map(s=><li key={s}>{s}</li>)}</ol><p className="hint"><b>Interview:</b> {u.interview}</p></Card>)}</div></Page></Layout>;
}
