import React from 'react';
import { Link } from 'react-router-dom';
import { companies } from '../data/companies';
import { roadmap90 } from '../data/roadmap';
import { Layout, Page, Card, Stat, Progress } from '../components/UI';
import { readStore } from '../utils/storage';
import { DASHBOARD_HERO_ACTIONS, PREMIUM_PATH_STEPS, QUICK_START_CARDS, TOOL_GROUPS } from '../config/dashboardConfig';

// Counts all meaningful saved answers across mentor, practice, focus and interview modules.
function getSavedAnswerCount() {
  const stores = ['answers', 'focusAnswers', 'interviewAnswers', 'interviewAnswersV2', 'weeklyAnswers', 'mentorLog'];
  return stores.reduce((count, key) => {
    const value = readStore(key, key === 'mentorLog' ? [] : {});
    if (Array.isArray(value)) return count + value.length;
    return count + Object.values(value).filter(answer => String(answer?.text || answer || '').trim().length > 20).length;
  }, 0);
}

// Job Ready Score is intentionally based on real saved work, not a fake static number.
function calculateJobReadyScore({ tasks = [], savedAnswers = 0, weakStrong = {}, jobs = [], weeklyResults = {}, mentorDone = {} }) {
  const baseScore = 25;
  const completedTaskScore = Math.min(18, tasks.length ? (tasks.filter(task => task.done).length / Math.max(tasks.length, 1)) * 18 : 0);
  const answerScore = Math.min(18, savedAnswers * 0.65);
  const strongTopicScore = Math.min(14, Object.values(weakStrong).filter(status => status === 'Strong').length * 0.9);
  const jobScore = Math.min(12, jobs.filter(job => job.applied || job.status === 'Applied').length * 0.6);
  const weeklyTestScore = Math.min(8, Object.values(weeklyResults).length * 1.8);
  const routeScore = Math.min(5, Object.values(mentorDone).filter(Boolean).length * 0.35);
  return Math.round(Math.min(100, baseScore + completedTaskScore + answerScore + strongTopicScore + jobScore + weeklyTestScore + routeScore));
}

function getActiveDay() {
  const explicitDay = Number(readStore('mentorDay', 0)) || Number(readStore('focusDay', 0)) || Number(readStore('timeCurrentDay', 0));
  return explicitDay ? Math.max(1, Math.min(90, explicitDay)) : 1;
}

function useDashboardData() {
  const activeDay = getActiveDay();
  const allTasks = readStore('timeTasksByDay', {});
  const tasks = allTasks[activeDay] || readStore('timeTasks', []);
  const weakStrong = readStore('weakStrong', {});
  const jobs = readStore('jobs', companies);
  const weeklyResults = readStore('weeklyResults', {});
  const mentorDone = readStore('mentorDone', {});
  const savedAnswers = getSavedAnswerCount();
  const today = roadmap90[(activeDay - 1) % roadmap90.length];
  const strong = Object.values(weakStrong).filter(status => status === 'Strong').length;
  const weak = Object.values(weakStrong).filter(status => status === 'Weak').length;
  const applied = jobs.filter(job => job.applied || job.status === 'Applied').length;
  const completedTasks = tasks.filter(task => task.done).length;
  const totalTasks = tasks.length;
  const routeDoneToday = Object.keys(mentorDone).filter(key => key.startsWith(`${activeDay}-`) && mentorDone[key]).length;
  const score = calculateJobReadyScore({ tasks, savedAnswers, weakStrong, jobs, weeklyResults, mentorDone });
  return { activeDay, today, score, savedAnswers, strong, weak, applied, completedTasks, totalTasks, routeDoneToday, weeklyResults };
}

function DashboardHero({ score, activeDay, savedAnswers, strong, applied }) {
  const heroStats = [
    { label: 'Day', value: `Day ${activeDay}` },
    { label: 'Saved', value: savedAnswers },
    { label: 'Strong', value: strong },
    { label: 'Jobs', value: applied },
  ];
  return <section className="dashboardHeroPro">
    <div className="dashboardHeroContent">
      <p className="eyebrow">SFDC Mentor Career OS</p>
      <h1>Home Guide</h1>
      <p>Your premium control room for practice, AI guidance, interview preparation, job tracking and daily proof.</p>
      <div className="dashboardHeroActions">
        {DASHBOARD_HERO_ACTIONS.map(action => <Link key={action.label} className={action.className} to={action.to}>{action.label}</Link>)}
      </div>
    </div>
    <div className="dashboardScorePanel">
      <div className="scoreCircle"><b>{score}%</b><span>Job Ready</span></div>
      <div className="heroMiniStats">{heroStats.map(item => <div key={item.label}><b>{item.value}</b><span>{item.label}</span></div>)}</div>
    </div>
  </section>;
}

function PremiumCommandStrip() {
  return <div className="premiumCommandStrip">
    {PREMIUM_PATH_STEPS.map(step => <Link key={step.title} to={step.to}><b>{step.number}</b><span>{step.title}</span><small>{step.text}</small></Link>)}
  </div>;
}

function QuickStartCard() {
  return <Card title="Quick Start" subtitle="Open the right page fast.">
    <div className="quickStartStack">
      {QUICK_START_CARDS.map(card => <Link key={card.title} to={card.to}><span>{card.icon}</span><div><b>{card.title}</b><small>{card.text}</small></div></Link>)}
    </div>
  </Card>;
}

function PremiumHomeGrid({ activeDay, today, score, weak, strong }) {
  return <div className="premiumHomeGrid">
    <Card title="Today Task" subtitle="Start with the most useful action."><div className="homeFocusCard"><span>🎯</span><b>Day {activeDay}: {today.salesforce}</b><p>Complete one practice set, save one answer, and track one proof item today.</p><Link className="btn cyan" to="/practice">Start Question Bank</Link></div></Card>
    <Card title="Job Ready Score" subtitle="Based on saved work."><div className="homeScoreBlock"><b>{score}%</b><Progress value={score}/><p>Score increases when you save answers, complete tasks, mark strong topics and track jobs.</p></div></Card>
    <Card title="Weak Topics" subtitle="Fix these first."><div className="homeMetricLine"><b>{weak}</b><span>Weak marked</span></div><div className="homeMetricLine"><b>{strong}</b><span>Strong marked</span></div><Link className="btn ghost" to="/focus">Open Focus Practice</Link></Card>
    <QuickStartCard />
  </div>;
}

function DashboardStats({ activeDay, today, completedTasks, totalTasks, savedAnswers, applied, strong, weak, weeklyResults, routeDoneToday }) {
  return <div className="statsGrid premiumStatsGrid">
    <Stat icon="📅" label="Today Day" value={`Day ${activeDay}`} note={`SF: ${today.salesforce}`}/>
    <Stat icon="✅" label="Completed Work" value={`${completedTasks}/${totalTasks || 0}`} note="24h tracker done"/>
    <Stat icon="📝" label="Saved Answers" value={savedAnswers} note="Mentor + Practice + Interview"/>
    <Stat icon="💼" label="Applied" value={applied} note="Job pipeline"/>
    <Stat icon="💪" label="Strong Topics" value={strong} note="Based on markings"/>
    <Stat icon="⚠️" label="Weak Topics" value={weak} note="Plan revision"/>
    <Stat icon="🧪" label="Weekly Tests" value={Object.keys(weeklyResults).length} note="Saved results"/>
    <Stat icon="🧭" label="Route Done" value={`${routeDoneToday}/6`} note={`Day ${activeDay} tasks`}/>
  </div>;
}

function DashboardDeepGrid({ today, totalTasks, completedTasks, savedAnswers, strong, applied, weeklyResults }) {
  return <div className="dashboardDeepGrid">
    <Card title="Today Focus" subtitle="Do only these things first"><div className="mission"><p><b>Salesforce:</b> {today.salesforce}</p><p><b>DSA:</b> {today.dsa}</p><p><b>System Design:</b> {today.systemDesign}</p><p><b>Project:</b> {today.projectTask}</p><p><b>Interview:</b> {today.interviewTask}</p><Link className="btn cyan" to="/practice">Open Question Bank</Link></div></Card>
    <Card title="Progress Breakdown" subtitle="Your score increases from real saved work"><p>24h tasks</p><Progress value={totalTasks ? completedTasks / totalTasks * 100 : 0}/><p>Saved answers</p><Progress value={Math.min(100, savedAnswers * 4)}/><p>Strong topics</p><Progress value={Math.min(100, strong * 5)}/><p>Job pipeline</p><Progress value={Math.min(100, applied * 2)}/></Card>
    <Card title="Career Momentum" subtitle="Keep one visible daily proof."><div className="careerMomentum"><div><b>{applied}</b><span>Applications</span></div><div><b>{savedAnswers}</b><span>Saved Answers</span></div><div><b>{Object.keys(weeklyResults).length}</b><span>Weekly Tests</span></div></div><p className="hint">Best next action: save one interview answer and update one job note.</p></Card>
  </div>;
}

function ToolsByPurpose() {
  return <Card title="Tools Grouped by Purpose" subtitle="Clean final flow. Choose the group based on what you want to do now.">
    <div className="grid2">{TOOL_GROUPS.map(group => <div className="previewCard" key={group.title}><h3>{group.title}</h3><div className="toolGrid compactToolGrid">{group.items.map(item => <Link key={item.label} className="toolTile" to={item.to}><b>{item.icon} {item.label}</b><span>Open</span></Link>)}</div></div>)}</div>
  </Card>;
}

export function Dashboard() {
  const data = useDashboardData();
  return <Layout><Page>
    <DashboardHero {...data} />
    <PremiumCommandStrip />
    <PremiumHomeGrid {...data} />
    <DashboardStats {...data} />
    <DashboardDeepGrid {...data} />
    <ToolsByPurpose />
  </Page></Layout>;
}
