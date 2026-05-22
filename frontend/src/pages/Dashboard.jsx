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
  const workflow = [
    { title: '1. Learning Plan', path: '/zero-to-hero', icon: 'JOB', text: 'Start here. This is your simple day-wise study plan: learn, write, practice, explain, project proof.' },
    { title: '2. Daily Practice', path: '/practice', icon: 'JOB', text: 'Practice Salesforce, DSA, scenario questions and mark topics Weak or Strong.' },
    { title: '3. AI Mentor', path: '/ai-mentor', icon: 'JOB', text: 'Ask doubts. It uses your saved app data and gives beginner + interview + architect guidance.' },
    { title: '4. Automation Center', path: '/final-premium', icon: 'JOB', text: 'Use this for reminders, weak-topic queues, Sunday tests, backup, and job-ready score automation.' },
    { title: '5. Career Prep', path: '/interview', icon: 'JOB', text: 'Build interview answers, projects, resume proof, job tracker and weekly reports.' },
  ];
  const toolGroups = [
    { title: 'Learn', items: [['Learning Plan','/zero-to-hero'], ['Daily Route','/mentor-route'], ['Learning Coach','/learning-coach'], ['English Practice','/english']] },
    { title: 'Practice', items: [['Question Bank','/practice'], ['Scenario Practice','/scenarios'], ['Use Cases','/use-cases'], ['Weekly Tests','/weekly-tests']] },
    { title: 'Prepare Job', items: [['Interview Room','/interview'], ['My Projects','/projects'], ['Resume Optimizer','/resume'], ['JD Matcher','/jd-matcher']] },
    { title: 'Track & Automate', items: [['24h Tracker','/time-tracker'], ['Job Tracker','/job-tracker'], ['Automation Center','/final-premium'], ['Backup','/backup']] },
  ];
  return <Layout><Page>
    <Hero title="Home Guide" subtitle="This app is organized into one simple workflow: Learning Plan -> Daily Practice -> AI Mentor -> Automation Center -> Career Prep.">
      <div className="scoreCircle"><b>{score}%</b><span>Job Ready</span></div>
    </Hero>
        <Card title="Start Here: Today's Simple Path" subtitle="Open only these steps first. This keeps the app easy and avoids confusion.">
      <div className="dailyPathGrid">
        <Link className="dailyPathCard" to="/zero-to-hero"><span>01</span><small>Step 1 - 30 min</small><b>Learn one concept</b><p>Open Learning Plan and understand today's Salesforce topic.</p></Link>
        <Link className="dailyPathCard" to="/practice"><span>02</span><small>Step 2 - 30 min</small><b>Practice one set</b><p>Solve questions and save your answer inside the app.</p></Link>
        <Link className="dailyPathCard" to="/focus"><span>03</span><small>Step 3 - 20 min</small><b>Write one answer</b><p>Save the answer, then mark it Weak or Strong.</p></Link>
        <Link className="dailyPathCard" to="/ai-mentor"><span>04</span><small>Step 4 - 15 min</small><b>Ask one doubt</b><p>Use AI Mentor and save useful guidance to notes.</p></Link>
        <Link className="dailyPathCard" to="/time-tracker"><span>05</span><small>Step 5 - 5 min</small><b>Track proof</b><p>Mark completed work so your progress becomes real.</p></Link>
      </div>
    </Card>
<Card title="Beginner Tools Only" subtitle="For daily use, focus on these pages. All advanced features are still available from the sidebar.">
      <div className="toolGrid compactToolGrid">
        <Link className="toolTile" to="/zero-to-hero"><b>Learning Plan</b><span>Start here</span></Link>
        <Link className="toolTile" to="/practice"><b>Question Bank</b><span>Practice</span></Link>
        <Link className="toolTile" to="/focus"><b>Focus Practice</b><span>Save answers</span></Link>
        <Link className="toolTile" to="/ai-mentor"><b>AI Mentor</b><span>Ask doubts</span></Link>
        <Link className="toolTile" to="/time-tracker"><b>24h Tracker</b><span>Track proof</span></Link>
        <Link className="toolTile" to="/interview"><b>Interview Room</b><span>Prepare</span></Link>
      </div>
    </Card>

    <Card title="Simple Daily Rule" subtitle="Follow this rule every day to become consistent.">
      <div className="simpleRuleGrid">
        <div><b>1 Concept</b><span>Understand one Salesforce concept deeply.</span></div>
        <div><b>1 Practice</b><span>Solve one question set and save your answer.</span></div>
        <div><b>1 Proof</b><span>Track time, mark progress, and create interview proof.</span></div>
      </div>
    </Card>

    <Card title="Understand the App in 30 Seconds" subtitle="Use these pages in this order. You do not need to open everything every day.">
      <div className="easyFlow3d">{workflow.map(item => <Link key={item.title} className="easyStep3d" to={item.path}><span>{item.icon}</span><b>{item.title}</b><p>{item.text}</p><small>Open</small></Link>)}</div>
    </Card>

    <div className="statsGrid">
      <Stat icon="DAY" label="Today Day" value={`Day ${activeDay}`} note={`SF: ${today.salesforce}`}/>
      <Stat icon="DONE" label="Completed Work" value={`${completedTasks}/${totalTasks || 0}`} note="24h tracker done"/>
      <Stat icon="ANS" label="Saved Answers" value={savedAnswers} note="Mentor + Practice + Interview"/>
      <Stat icon="STR" label="Strong Topics" value={strong} note="Based on markings"/>
      <Stat icon="WEAK" label="Weak Topics" value={weak} note="Plan revision"/>
      <Stat icon="JOB" label="Applied" value={applied} note="Job pipeline"/>
      <Stat icon="TEST" label="Weekly Tests" value={Object.keys(weeklyResults).length} note="Saved results"/>
      <Stat icon="PLAN" label="Route Done" value={`${routeDoneToday}/6`} note={`Day ${activeDay} tasks`}/>
    </div>

    <div className="grid2">
      <Card title="Today Focus" subtitle="Do only these things first"><div className="mission"><p><b>Salesforce:</b> {today.salesforce}</p><p><b>DSA:</b> {today.dsa}</p><p><b>System Design:</b> {today.systemDesign}</p><p><b>Project:</b> {today.projectTask}</p><p><b>Interview:</b> {today.interviewTask}</p><Link className="btn cyan" to="/zero-to-hero">Open Learning Plan</Link></div></Card>
      <Card title="Progress Breakdown" subtitle="Your score increases from real saved work"><p>24h tasks</p><Progress value={totalTasks ? completedTasks/totalTasks*100 : 0}/><p>Saved answers</p><Progress value={Math.min(100,savedAnswers*4)}/><p>Strong topics</p><Progress value={Math.min(100,strong*5)}/><p>Job pipeline</p><Progress value={Math.min(100,applied*2)}/></Card>
    </div>

    <Card title="Tools Grouped by Purpose" subtitle="No confusion: choose the group based on what you want to do now.">
      <div className="grid2">{toolGroups.map(group => <div className="previewCard" key={group.title}><h3>{group.title}</h3><div className="toolGrid compactToolGrid">{group.items.map(([label, path]) => <Link key={label} className="toolTile" to={path}><b>{label}</b><span>Open</span></Link>)}</div></div>)}</div>
    </Card>
  </Page></Layout>;
}

