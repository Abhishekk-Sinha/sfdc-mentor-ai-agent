import React from 'react';
import { Link } from 'react-router-dom';
import { companies } from '../data/companies';
import { roadmap90 } from '../data/roadmap';
import { Layout, Page, Card, Stat, Progress } from '../components/UI';
import { DashboardProfessionalSuite } from '../components/ProfessionalAddons';
import { readStore, writeStore } from '../utils/storage';
import { QUICK_START_CARDS, TOOL_GROUPS } from '../config/dashboardConfig';

function getSavedAnswerCount() {
  const stores = ['answers', 'focusAnswers', 'interviewAnswers', 'interviewAnswersV2', 'weeklyAnswers', 'mentorLog'];
  return stores.reduce((count, key) => {
    const value = readStore(key, key === 'mentorLog' ? [] : {});
    if (Array.isArray(value)) return count + value.length;
    if (value && typeof value === 'object') return count + Object.values(value).filter(answer => String(answer?.text || answer || '').trim().length > 20).length;
    return count;
  }, 0);
}

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
  if (explicitDay) return Math.max(1, Math.min(90, explicitDay));
  const startDate = readStore('learningStartDate', '');
  if (startDate) {
    const today = new Date();
    const start = new Date(startDate);
    const diff = Math.floor((today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / 86400000) + 1;
    return Math.max(1, Math.min(90, diff));
  }
  return 1;
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

function MomentumGraph({ score, savedAnswers, strong, applied, completedTasks = 0, totalTasks = 0, routeDoneToday = 0, weeklyResults = {} }) {
  const practiceScore = Math.min(100, 25 + savedAnswers * 4);
  const strengthScore = Math.min(100, 35 + strong * 8);
  const workScore = Math.min(100, 40 + (totalTasks ? completedTasks / Math.max(totalTasks, 1) * 35 : 0) + routeDoneToday * 5);
  const careerScore = Math.min(100, 45 + applied * 6 + Object.keys(weeklyResults || {}).length * 3);
  const values = [25, practiceScore, strengthScore, workScore, careerScore, score];
  const labels = ['Start', 'Practice', 'Strong', 'Work', 'Career', 'Ready'];
  const points = values.map((value, index) => `${18 + index * 44},${120 - value}`).join(' ');
  return <div className="momentumGraphCard">
    <div className="momentumGraphHead"><div><b>Career Momentum</b><span>Live trend from real saved work</span></div><strong>{score}%</strong></div>
    <svg viewBox="0 0 260 135" role="img" aria-label="Career momentum graph">
      <defs><linearGradient id="momentumLine" x1="0" x2="1"><stop offset="0%" stopColor="#35d4ef"/><stop offset="55%" stopColor="#22c55e"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs>
      <path d="M18 25 H238 M18 55 H238 M18 85 H238 M18 115 H238" className="graphGrid"/>
      <polyline points={points} className="graphLine"/>
      {values.map((value, index) => <circle key={index} cx={18 + index * 44} cy={120 - value} r="5.5" className="graphDot"/>)}
    </svg>
    <div className="momentumLegend">{labels.map(label => <span key={label}>{label}</span>)}</div>
  </div>;
}

function DashboardHero(data) {
  const { score, activeDay, savedAnswers, strong, applied, completedTasks, totalTasks, routeDoneToday, weeklyResults, today } = data;
  const heroStats = [
    { label: 'Current Sprint', value: `Day ${activeDay}` },
    { label: 'Saved Answers', value: savedAnswers },
    { label: 'Strong Topics', value: strong },
    { label: 'Jobs Applied', value: applied },
  ];
  return <section className="hero premiumHero dashboardHeroPro" style={{ alignItems: 'stretch' }}>
    <div className="dashboardHeroContent">
      <p className="eyebrow">Professional Home Guide</p>
      <h1>Welcome back, Abhishek</h1>
      <p>Today’s mission: learn one Salesforce skill, practice one answer, save proof, and move closer to job-ready. Start from the guide below and follow the app in a simple order.</p>
      <div className="dashboardHeroActions">
        <Link className="btn cyan" to="/mentor-route">Open Today’s Route</Link>
        <Link className="btn ghost" to="/practice">Practice Questions</Link>
        <Link className="btn ghost" to="/time-tracker">Track 8 Hours</Link>
      </div>
      <div className="heroMiniStats" style={{ marginTop: 18 }}>{heroStats.map(item => <div key={item.label}><b>{item.value}</b><span>{item.label}</span></div>)}</div>
    </div>
    <div className="dashboardScorePanel">
      <div className="scoreCircle"><b>{score}%</b><span>Job Ready</span></div>
      <div className="scoreMini"><b>Today's Focus</b><p className="hint">{today.phase}</p><Progress value={score}/><small>Based on saved answers, tasks, topics, tests and job pipeline.</small></div>
      <MomentumGraph score={score} savedAnswers={savedAnswers} strong={strong} applied={applied} completedTasks={completedTasks} totalTasks={totalTasks} routeDoneToday={routeDoneToday} weeklyResults={weeklyResults} />
    </div>
  </section>;
}

function HomeGuideFlow() {
  const steps = [
    { n: '01', title: 'Learn', text: 'Open Today’s Route and understand one topic clearly.', to: '/mentor-route' },
    { n: '02', title: 'Practice', text: 'Solve Salesforce, DSA and System Design questions.', to: '/practice' },
    { n: '03', title: 'Save Proof', text: 'Write one interview answer or project note before closing.', to: '/interview' },
    { n: '04', title: 'Ask Mentor', text: 'Ask the AI Mentor when you get stuck or need explanation.', to: '/ai-mentor' },
    { n: '05', title: 'Track Progress', text: 'Update time, weak topics, job tracker and daily completion.', to: '/time-tracker' },
  ];
  return <Card title="Start Here: Simple Daily Path" subtitle="Use this order every day. No confusion, no random clicking.">
    <div className="homeGuideFlow">{steps.map(step => <Link key={step.n} to={step.to} className="guideStepCard"><b>{step.n}</b><span>{step.title}</span><small>{step.text}</small></Link>)}</div>
  </Card>;
}

function BeginnerCompass({ activeDay, today, weak, savedAnswers }) {
  const items = [
    { title: 'I do not know what to study', text: `Start Day ${activeDay}: ${today.salesforce}`, to: '/mentor-route', action: 'Open Route' },
    { title: 'I need questions', text: 'Open Question Bank and save at least one answer.', to: '/practice', action: 'Practice' },
    { title: 'I forgot a topic', text: weak > 0 ? `Revise ${weak} weak topic(s) first.` : 'Mark topics Weak/Strong after practice.', to: '/focus', action: 'Focus' },
    { title: 'I need interview confidence', text: savedAnswers < 10 ? 'Write one 60-second answer today.' : 'Improve one saved answer with project impact.', to: '/interview', action: 'Interview' },
  ];
  return <Card title="Beginner Compass" subtitle="Choose what you need right now. The app will take you to the correct place.">
    <div className="beginnerCompassGrid">{items.map(item => <Link key={item.title} to={item.to} className="compassTile"><h3>{item.title}</h3><p>{item.text}</p><span>{item.action}</span></Link>)}</div>
  </Card>;
}

function DailyStudyBlocks() {
  const blocks = [
    ['2h', 'Salesforce Core', 'Apex, LWC, Flow, SOQL or Security'],
    ['1h', 'DSA', 'One pattern, one problem, one note'],
    ['1h', 'System Design', 'Concept + real-world explanation'],
    ['2h', 'Project Proof', 'Build, fix, document or polish project'],
    ['1h', 'Interview Practice', 'Write, speak and save one answer'],
    ['1h', 'Revision + Job', 'Weak topics, resume, job tracker'],
  ];
  return <Card title="8-Hour Study Structure" subtitle="A simple daily split for basic to advanced learning.">
    <div className="studyBlockGrid">{blocks.map(([time, title, text]) => <div key={title}><b>{time}</b><span>{title}</span><small>{text}</small></div>)}</div>
  </Card>;
}

function DailyPlan({ activeDay, today, weak }) {
  const plan = [
    { title: 'Salesforce Core', text: today.salesforce, to: '/practice', action: 'Practice' },
    { title: 'DSA Pattern', text: today.dsa, to: '/practice', action: 'Solve' },
    { title: 'System Design', text: today.systemDesign, to: '/ai-mentor', action: 'Explain' },
    { title: 'Project Proof', text: today.projectTask, to: '/projects', action: 'Build' },
    { title: 'Interview Output', text: today.interviewTask, to: '/interview', action: 'Answer' },
  ];
  return <Card title={`Day ${activeDay} Professional Plan`} subtitle="Clear priority for today. Do these before opening extra tools.">
    <div className="taskGrid">
      {plan.map((item, index) => <Link className="taskCard" key={item.title} to={item.to}>
        <span>{String(index + 1).padStart(2, '0')}</span><b>{item.title}</b><small>{item.text}</small><em>{item.action}</em>
      </Link>)}
    </div>
    <p className="hint">{weak > 0 ? `Priority: revise ${weak} weak topic(s) before learning new topics.` : 'Priority: mark one topic Weak or Strong after practice.'}</p>
  </Card>;
}

function HomeExecutiveGrid({ score, activeDay, completedTasks, totalTasks, savedAnswers, applied, strong, weak, weeklyResults, routeDoneToday }) {
  const taskProgress = totalTasks ? completedTasks / totalTasks * 100 : 0;
  return <div className="statsGrid premiumStatsGrid dashboardCleanStats">
    <Stat icon="DAY" label="Current Day" value={`Day ${activeDay}`} note="90-day career sprint"/>
    <Stat icon="SCORE" label="Job Ready" value={`${score}%`} note="Real saved-work score"/>
    <Stat icon="TASK" label="Tasks Done" value={`${completedTasks}/${totalTasks || 0}`} note={`${Math.round(taskProgress)}% daily execution`}/>
    <Stat icon="ANS" label="Saved Answers" value={savedAnswers} note="Practice + mentor + interview"/>
    <Stat icon="STR" label="Strong Topics" value={strong} note="Interview confidence"/>
    <Stat icon="WEAK" label="Weak Topics" value={weak} note="Revision backlog"/>
    <Stat icon="TEST" label="Weekly Tests" value={Object.keys(weeklyResults).length} note="Proof of assessment"/>
    <Stat icon="JOB" label="Applied Jobs" value={applied} note={`Route done ${routeDoneToday}/6`}/>
  </div>;
}

function ScoreBreakdown({ score, completedTasks, totalTasks, savedAnswers, strong, applied, weeklyResults }) {
  return <Card title="Job Ready Score Breakdown" subtitle="Transparent score from real work, not a fake number.">
    <div className="mission">
      <p><b>Overall readiness</b><Progress value={score}/></p>
      <p><b>Daily execution</b><Progress value={totalTasks ? completedTasks / totalTasks * 100 : 0}/></p>
      <p><b>Answer practice</b><Progress value={Math.min(100, savedAnswers * 4)}/></p>
      <p><b>Strong topic confidence</b><Progress value={Math.min(100, strong * 5)}/></p>
      <p><b>Career pipeline</b><Progress value={Math.min(100, applied * 2 + Object.keys(weeklyResults).length * 5)}/></p>
    </div>
  </Card>;
}

function QuickStartCard() {
  return <Card title="Quick Launch" subtitle="Open the right module in one click.">
    <div className="quickStartStack">
      {QUICK_START_CARDS.map(card => <Link key={card.title} to={card.to}><span>{card.icon}</span><div><b>{card.title}</b><small>{card.text}</small></div></Link>)}
    </div>
  </Card>;
}

function LearningCalendar({ activeDay }) {
  const [startDate, setStartDate] = React.useState(() => readStore('learningStartDate', ''));
  const notes = readStore('learningCalendarNotes', {});
  const [selectedDay, setSelectedDay] = React.useState(activeDay);
  const [note, setNote] = React.useState(notes[activeDay] || '');
  const days = Array.from({ length: 14 }, (_, i) => Math.max(1, activeDay - 3 + i)).filter(day => day <= 90);
  const saveStartDate = () => { writeStore('learningStartDate', startDate); window.dispatchEvent(new Event('storage')); };
  const saveDayNote = () => { const next = readStore('learningCalendarNotes', {}); next[selectedDay] = note; writeStore('learningCalendarNotes', next); window.dispatchEvent(new Event('storage')); };
  return <Card title="Learning Calendar" subtitle="Save your start date and recovery notes for gap days.">
    <div className="learningCalendarPro">
      <div className="calendarStartRow"><label><span>Day 1 Start Date</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><button className="btn cyan" onClick={saveStartDate}>Save Start</button></div>
      <div className="calendarDayGrid">{days.map(day => <button key={day} className={day === selectedDay ? 'active' : ''} onClick={() => { setSelectedDay(day); setNote(readStore('learningCalendarNotes', {})[day] || ''); }}><b>Day {day}</b><small>{day === activeDay ? 'Today' : readStore('learningCalendarNotes', {})[day] ? 'Note saved' : 'Plan'}</small></button>)}</div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write gap reason, revision note, or recovery plan..." />
      <button className="btn ghost" onClick={saveDayNote}>Save Day Note</button>
    </div>
  </Card>;
}

function NextActions({ activeDay, today, weak, savedAnswers, applied }) {
  const actions = [
    weak > 0 ? `Revise ${weak} weak topic(s) first.` : `Learn and mark confidence for ${today.salesforce}.`,
    savedAnswers < 10 ? 'Save one 60-second interview answer.' : 'Improve one saved answer with metrics and project impact.',
    'Complete one focused 45-minute sprint and track it.',
    applied < 5 ? 'Apply or follow up with at least 3 companies.' : 'Update follow-up notes for active applications.',
    `Day ${activeDay} proof: save one visible output before closing the app.`
  ];
  return <Card title="Next Best Actions" subtitle="Simple priority list for today.">
    <div className="notificationStack">{actions.map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></div>)}</div>
  </Card>;
}

function ToolsByPurpose() {
  return <Card title="Tools by Purpose" subtitle="Clean professional navigation grouped by your goal.">
    <div className="grid2">{TOOL_GROUPS.map(group => <div className="previewCard" key={group.title}><h3>{group.title}</h3><div className="toolGrid compactToolGrid">{group.items.map(item => <Link key={item.label} className="toolTile" to={item.to}><b>{item.icon} {item.label}</b><span>Open</span></Link>)}</div></div>)}</div>
  </Card>;
}

export function Dashboard() {
  const [refreshTick, setRefreshTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setRefreshTick(t => t + 1), 5000);
    const onStorage = () => setRefreshTick(t => t + 1);
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(id); window.removeEventListener('storage', onStorage); };
  }, []);
  const data = useDashboardData();
  return <Layout><Page data-refresh={refreshTick}>
    <DashboardHero {...data} />
    <HomeGuideFlow />
    <HomeExecutiveGrid {...data} />
    <div className="grid2"><BeginnerCompass {...data} /><DailyStudyBlocks /></div>
    <DailyPlan {...data} />
    <div className="grid2"><NextActions {...data} /><ScoreBreakdown {...data} /></div>
    <div className="grid2"><LearningCalendar {...data} /><QuickStartCard /></div>
    <DashboardProfessionalSuite />
    <ToolsByPurpose />
  </Page></Layout>;
}
