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

  const heroStats = [
    ['Day', `Day ${activeDay}`],
    ['Saved', savedAnswers],
    ['Strong', strong],
    ['Jobs', applied],
  ];
  const quickStart = [
    ['❓', 'Question Bank', '/practice', 'Practice DSA, Salesforce and System Design.'],
    ['🤖', 'AI Mentor', '/ai-mentor', 'Ask doubts and improve answers.'],
    ['✨', 'Focus Practice', '/focus', 'Save answers and mark weak/strong.'],
    ['💼', 'Job Tracker', '/job-tracker', 'Track applications and follow-ups.'],
  ];
  const premiumPath = [
    ['01', 'Practice', 'Solve one question set', '/practice'],
    ['02', 'Mentor', 'Clear one doubt', '/ai-mentor'],
    ['03', 'Proof', 'Save one strong answer', '/focus'],
    ['04', 'Career', 'Update job or interview prep', '/job-tracker'],
  ];
  const toolGroups = [
    { title: 'Daily Study', items: [['AI Mentor','/ai-mentor','🤖'], ['Daily Route','/mentor-route','🛣️'], ['Learning Coach','/learning-coach','📘'], ['English Practice','/english','🗣️']] },
    { title: 'Practice', items: [['Question Bank','/practice','❓'], ['Scenario Practice','/scenarios','🧩'], ['Use Cases','/use-cases','🏗️'], ['Weekly Tests','/weekly-tests','🧪']] },
    { title: 'Career Prep', items: [['Interview Room','/interview','🎤'], ['My Projects','/projects','🚀'], ['Resume Optimizer','/resume','📄'], ['JD Matcher','/jd-matcher','🧾']] },
    { title: 'Track & Save', items: [['24h Tracker','/time-tracker','⏱️'], ['Job Tracker','/job-tracker','💼'], ['Notes','/notes','📝'], ['Backup','/backup','💾']] },
  ];

  return <Layout><Page>
    <section className="dashboardHeroPro">
      <div className="dashboardHeroContent">
        <p className="eyebrow">SFDC Mentor Career OS</p>
        <h1>Home Guide</h1>
        <p>Your premium control room for practice, AI guidance, interview preparation, job tracking and daily proof.</p>
        <div className="dashboardHeroActions"><Link className="btn cyan" to="/practice">Start Practice</Link><Link className="btn ghost" to="/ai-mentor">Ask AI Mentor</Link><Link className="btn ghost" to="/interview">Interview Room</Link></div>
      </div>
      <div className="dashboardScorePanel"><div className="scoreCircle"><b>{score}%</b><span>Job Ready</span></div><div className="heroMiniStats">{heroStats.map(([label, value]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div></div>
    </section>

    <div className="premiumCommandStrip">{premiumPath.map(([num, title, text, path]) => <Link key={title} to={path}><b>{num}</b><span>{title}</span><small>{text}</small></Link>)}</div>

    <div className="premiumHomeGrid">
      <Card title="Today Task" subtitle="Start with the most useful action."><div className="homeFocusCard"><span>🎯</span><b>Day {activeDay}: {today.salesforce}</b><p>Complete one practice set, save one answer, and track one proof item today.</p><Link className="btn cyan" to="/practice">Start Question Bank</Link></div></Card>
      <Card title="Job Ready Score" subtitle="Based on saved work."><div className="homeScoreBlock"><b>{score}%</b><Progress value={score}/><p>Score increases when you save answers, complete tasks, mark strong topics and track jobs.</p></div></Card>
      <Card title="Weak Topics" subtitle="Fix these first."><div className="homeMetricLine"><b>{weak}</b><span>Weak marked</span></div><div className="homeMetricLine"><b>{strong}</b><span>Strong marked</span></div><Link className="btn ghost" to="/focus">Open Focus Practice</Link></Card>
      <Card title="Quick Start" subtitle="Open the right page fast."><div className="quickStartStack">{quickStart.map(([icon,title,to,text]) => <Link key={title} to={to}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div></Link>)}</div></Card>
    </div>

    <div className="statsGrid premiumStatsGrid">
      <Stat icon="📅" label="Today Day" value={`Day ${activeDay}`} note={`SF: ${today.salesforce}`}/>
      <Stat icon="✅" label="Completed Work" value={`${completedTasks}/${totalTasks || 0}`} note="24h tracker done"/>
      <Stat icon="📝" label="Saved Answers" value={savedAnswers} note="Mentor + Practice + Interview"/>
      <Stat icon="💼" label="Applied" value={applied} note="Job pipeline"/>
      <Stat icon="💪" label="Strong Topics" value={strong} note="Based on markings"/>
      <Stat icon="⚠️" label="Weak Topics" value={weak} note="Plan revision"/>
      <Stat icon="🧪" label="Weekly Tests" value={Object.keys(weeklyResults).length} note="Saved results"/>
      <Stat icon="🧭" label="Route Done" value={`${routeDoneToday}/6`} note={`Day ${activeDay} tasks`}/>
    </div>

    <div className="dashboardDeepGrid">
      <Card title="Today Focus" subtitle="Do only these things first"><div className="mission"><p><b>Salesforce:</b> {today.salesforce}</p><p><b>DSA:</b> {today.dsa}</p><p><b>System Design:</b> {today.systemDesign}</p><p><b>Project:</b> {today.projectTask}</p><p><b>Interview:</b> {today.interviewTask}</p><Link className="btn cyan" to="/practice">Open Question Bank</Link></div></Card>
      <Card title="Progress Breakdown" subtitle="Your score increases from real saved work"><p>24h tasks</p><Progress value={totalTasks ? completedTasks/totalTasks*100 : 0}/><p>Saved answers</p><Progress value={Math.min(100,savedAnswers*4)}/><p>Strong topics</p><Progress value={Math.min(100,strong*5)}/><p>Job pipeline</p><Progress value={Math.min(100,applied*2)}/></Card>
      <Card title="Career Momentum" subtitle="Keep one visible daily proof."><div className="careerMomentum"><div><b>{applied}</b><span>Applications</span></div><div><b>{savedAnswers}</b><span>Saved Answers</span></div><div><b>{Object.keys(weeklyResults).length}</b><span>Weekly Tests</span></div></div><p className="hint">Best next action: save one interview answer and update one job note.</p></Card>
    </div>

    <Card title="Tools Grouped by Purpose" subtitle="Clean final flow. Choose the group based on what you want to do now."><div className="grid2">{toolGroups.map(group => <div className="previewCard" key={group.title}><h3>{group.title}</h3><div className="toolGrid compactToolGrid">{group.items.map(([label, path, icon]) => <Link key={label} className="toolTile" to={path}><b>{icon} {label}</b><span>Open</span></Link>)}</div></div>)}</div></Card>
  </Page></Layout>;
}
