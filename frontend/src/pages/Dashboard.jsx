import React from 'react';
import { Link } from 'react-router-dom';
import { companies } from '../data/companies';
import { roadmap90 } from '../data/roadmap';
import { Layout, Page, Card, Hero, Stat, Progress } from '../components/UI';
import { readStore } from '../utils/storage';

function allAnswerCount() {
  const stores = ['answers', 'focusAnswers', 'interviewAnswers', 'interviewAnswersV2', 'weeklyAnswers', 'mentorLog'];
  let count = 0;
  stores.forEach(k => {
    const v = readStore(k, k === 'mentorLog' ? [] : {});
    if (Array.isArray(v)) count += v.length;
    else count += Object.values(v).filter(a => String(a?.text || a || '').trim().length > 20).length;
  });
  return count;
}

function calcDashboardScore({ tasks = [], savedAnswers = 0, weakStrong = {}, jobs = [], weeklyResults = {}, mentorDone = {} }) {
  const base = 25;
  const taskScore = Math.min(18, tasks.length ? (tasks.filter(t => t.done).length / Math.max(tasks.length, 1)) * 18 : 0);
  const answerScore = Math.min(18, savedAnswers * 0.65);
  const strongScore = Math.min(14, Object.values(weakStrong).filter(x => x === 'Strong').length * 0.9);
  const jobScore = Math.min(12, jobs.filter(j => j.applied || j.status === 'Applied').length * 0.6);
  const testScore = Math.min(8, Object.values(weeklyResults).length * 1.8);
  const routeScore = Math.min(5, Object.values(mentorDone).filter(Boolean).length * 0.35);
  return Math.round(Math.min(100, base + taskScore + answerScore + strongScore + jobScore + testScore + routeScore));
}

function getActiveDay() {
  const explicit = Number(readStore('mentorDay', 0)) || Number(readStore('focusDay', 0)) || Number(readStore('timeCurrentDay', 0));
  if (explicit) return Math.max(1, Math.min(90, explicit));
  return 1;
}

export function Dashboard() {
  const activeDay = getActiveDay();
  const allTasks = readStore('timeTasksByDay', {});
  const tasks = allTasks[activeDay] || readStore('timeTasks', []);
  const weakStrong = readStore('weakStrong', {});
  const jobs = readStore('jobs', companies);
  const weeklyResults = readStore('weeklyResults', {});
  const mentorDone = readStore('mentorDone', {});
  const savedAnswers = allAnswerCount();
  const score = calcDashboardScore({ tasks, savedAnswers, weakStrong, jobs, weeklyResults, mentorDone });
  const today = roadmap90[(activeDay - 1) % roadmap90.length];
  const strong = Object.values(weakStrong).filter(x => x === 'Strong').length;
  const weak = Object.values(weakStrong).filter(x => x === 'Weak').length;
  const applied = jobs.filter(j => j.applied || j.status === 'Applied').length;
  const completedTasks = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const routeDoneToday = Object.keys(mentorDone).filter(k => k.startsWith(`${activeDay}-`) && mentorDone[k]).length;
  const quote = 'Dream is not that which you see while sleeping; it is something that does not let you sleep. — Dr. A. P. J. Abdul Kalam';
  const launchers = ['AI Mentor Agent','Mentor Route','Focus Mode','Learning Coach','100 Days English','Practice Lab','Scenario Questions','Use Cases','Weekly Tests','Interview Q&A','Job Tracker','More Tools'];
  const routes = ['/ai-mentor','/mentor-route','/focus','/learning-coach','/english','/practice','/scenarios','/use-cases','/weekly-tests','/interview','/job-tracker','/more-tools'];
  return <Layout><Page>
    <Hero title="Dashboard Command Center" subtitle="Job Ready % ab real saved work se calculate hota hai: tasks complete, answers save, strong marks, weekly tests aur job pipeline.">
      <div className="scoreCircle"><b>{score}%</b><span>Job Ready</span></div>
    </Hero>
    <Card title="Motivation" subtitle="APJ Abdul Kalam reminder"><p className="motivation">{quote}</p><p className="hint">Aaj ka target: ek saved answer, ek strong topic, ek focused work block, aur ek job action. Har action se score increase hoga.</p></Card>
    <div className="statsGrid">
      <Stat icon="🎯" label="Today Day" value={`Day ${activeDay}`} note={`SF: ${today.salesforce} • DSA: ${today.dsa}`}/>
      <Stat icon="✅" label="Completed Work" value={`${completedTasks}/${totalTasks || 0}`} note="24h tracker done"/>
      <Stat icon="📝" label="Saved Answers" value={savedAnswers} note="Mentor + Practice + Interview"/>
      <Stat icon="💪" label="Strong Topics" value={strong} note="Based on markings"/>
      <Stat icon="⚠️" label="Weak Topics" value={weak} note="Plan revision"/>
      <Stat icon="💼" label="Applied" value={applied} note="Job pipeline"/>
      <Stat icon="🧪" label="Weekly Tests" value={Object.keys(weeklyResults).length} note="Saved results"/>
      <Stat icon="🧭" label="Route Done" value={`${routeDoneToday}/6`} note={`Day ${activeDay} tasks`}/>
    </div>
    <div className="grid2">
      <Card title="Current Work Plan" subtitle="Dashboard current day ke saved data se connected hai"><div className="mission"><p><b>Salesforce:</b> {today.salesforce}</p><p><b>DSA:</b> {today.dsa}</p><p><b>System Design:</b> {today.systemDesign}</p><p><b>Project:</b> {today.projectTask}</p><p><b>Interview:</b> {today.interviewTask}</p><Link className="btn cyan" to="/mentor-route">Open Mentor Route</Link></div></Card>
      <Card title="Progress Breakdown" subtitle="Base 25% + real work tracking"><p>24h tasks</p><Progress value={totalTasks ? completedTasks/totalTasks*100 : 0}/><p>Saved answers</p><Progress value={Math.min(100,savedAnswers*4)}/><p>Strong topics</p><Progress value={Math.min(100,strong*5)}/><p>Job pipeline</p><Progress value={Math.min(100,applied*2)}/></Card>
    </div>
    <Card title="Quick Open Tools" subtitle="Dashboard se sab pages connected hain"><div className="toolGrid">{launchers.map((x,i)=><Link key={x} className="toolTile" to={routes[i]}><b>{x}</b><span>Open Tool</span></Link>)}</div></Card>
  </Page></Layout>;
}
