import React from 'react';
import { Link } from 'react-router-dom';
import { companies } from '../data/companies';
import { roadmap90 } from '../data/roadmap';
import { Layout, Page, Card, Stat, Progress } from '../components/UI';
import { readStore, writeStore } from '../utils/storage';
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
    <div className="momentumGraphHead"><div><b>Learning Momentum</b><span>Live trend from saved answers, tasks, strong topics and jobs</span></div><strong>{score}%</strong></div>
    <svg viewBox="0 0 260 135" role="img" aria-label="Learning momentum graph">
      <defs><linearGradient id="momentumLine" x1="0" x2="1"><stop offset="0%" stopColor="#35d4ef"/><stop offset="55%" stopColor="#22c55e"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs>
      <path d="M18 25 H238 M18 55 H238 M18 85 H238 M18 115 H238" className="graphGrid"/>
      <polyline points={points} className="graphLine"/>
      {values.map((value, index) => <circle key={index} cx={18 + index * 44} cy={120 - value} r="5.5" className="graphDot"/>)}
    </svg>
    <div className="momentumLegend">{labels.map(label => <span key={label}>{label}</span>)}</div>
  </div>;
}

function DashboardHero({ score, activeDay, savedAnswers, strong, applied, completedTasks, totalTasks, routeDoneToday, weeklyResults }) {
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
      <p>Your professional command center for practice, AI guidance, interview preparation, job tracking and daily proof.</p>
      <div className="dashboardHeroActions">
        {DASHBOARD_HERO_ACTIONS.map(action => <Link key={action.label} className={action.className} to={action.to}>{action.label}</Link>)}
      </div>
    </div>
    <div className="dashboardScorePanel">
      <div className="scoreCircle"><b>{score}%</b><span>Job Ready</span></div>
      <MomentumGraph score={score} savedAnswers={savedAnswers} strong={strong} applied={applied} completedTasks={completedTasks} totalTasks={totalTasks} routeDoneToday={routeDoneToday} weeklyResults={weeklyResults} />
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
    <Card title="Today Task" subtitle="Start with the most useful action."><div className="homeFocusCard"><span>GO</span><b>Day {activeDay}: {today.salesforce}</b><p>Complete one practice set, save one answer, and track one proof item today.</p><Link className="btn cyan" to="/practice">Start Question Bank</Link></div></Card>
    <Card title="Job Ready Score" subtitle="Based on saved work."><div className="homeScoreBlock"><b>{score}%</b><Progress value={score}/><p>Score increases when you save answers, complete tasks, mark strong topics and track jobs.</p></div></Card>
    <Card title="Weak Topics" subtitle="Fix these first."><div className="homeMetricLine"><b>{weak}</b><span>Weak marked</span></div><div className="homeMetricLine"><b>{strong}</b><span>Strong marked</span></div><Link className="btn ghost" to="/focus">Open Focus Practice</Link></Card>
    <QuickStartCard />
  </div>;
}

function DashboardStats({ activeDay, today, completedTasks, totalTasks, savedAnswers, applied, strong, weak, weeklyResults, routeDoneToday }) {
  return <div className="statsGrid premiumStatsGrid dashboardCleanStats">
    <Stat icon="DAY" label="Today Day" value={`Day ${activeDay}`} note={`SF: ${today.salesforce}`}/>
    <Stat icon="DONE" label="Completed Work" value={`${completedTasks}/${totalTasks || 0}`} note="24h tracker done"/>
    <Stat icon="ANS" label="Saved Answers" value={savedAnswers} note="Mentor + Practice + Interview"/>
    <Stat icon="JOB" label="Applied" value={applied} note="Job pipeline"/>
    <Stat icon="STR" label="Strong Topics" value={strong} note="Based on markings"/>
    <Stat icon="WEAK" label="Weak Topics" value={weak} note="Plan revision"/>
    <Stat icon="TEST" label="Weekly Tests" value={Object.keys(weeklyResults).length} note="Saved results"/>
    <Stat icon="PLAN" label="Route Done" value={`${routeDoneToday}/6`} note={`Day ${activeDay} tasks`}/>
  </div>;
}

function DashboardDeepGrid({ today, totalTasks, completedTasks, savedAnswers, strong, applied, weeklyResults }) {
  return <div className="dashboardDeepGrid">
    <Card title="Today Focus" subtitle="Do only these things first"><div className="mission"><p><b>Salesforce:</b> {today.salesforce}</p><p><b>DSA:</b> {today.dsa}</p><p><b>System Design:</b> {today.systemDesign}</p><p><b>Project:</b> {today.projectTask}</p><p><b>Interview:</b> {today.interviewTask}</p><Link className="btn cyan" to="/practice">Open Question Bank</Link></div></Card>
    <Card title="Progress Breakdown" subtitle="Your score increases from real saved work"><p>24h tasks</p><Progress value={totalTasks ? completedTasks / totalTasks * 100 : 0}/><p>Saved answers</p><Progress value={Math.min(100, savedAnswers * 4)}/><p>Strong topics</p><Progress value={Math.min(100, strong * 5)}/><p>Job pipeline</p><Progress value={Math.min(100, applied * 2)}/></Card>
    <Card title="Career Momentum" subtitle="Keep one visible daily proof."><div className="careerMomentum"><div><b>{applied}</b><span>Applications</span></div><div><b>{savedAnswers}</b><span>Saved Answers</span></div><div><b>{Object.keys(weeklyResults).length}</b><span>Weekly Tests</span></div></div><p className="hint">Best next action: save one interview answer and update one job note.</p></Card>
  </div>;
}

function LearningCalendar({ activeDay }) {
  const [startDate, setStartDate] = React.useState(() => readStore('learningStartDate', ''));
  const notes = readStore('learningCalendarNotes', {});
  const [selectedDay, setSelectedDay] = React.useState(activeDay);
  const [note, setNote] = React.useState(notes[activeDay] || '');
  const days = Array.from({ length: 14 }, (_, i) => Math.max(1, activeDay - 3 + i)).filter(day => day <= 90);

  const saveStartDate = () => {
    writeStore('learningStartDate', startDate);
    window.dispatchEvent(new Event('storage'));
  };

  const saveDayNote = () => {
    const next = readStore('learningCalendarNotes', {});
    next[selectedDay] = note;
    writeStore('learningCalendarNotes', next);
    window.dispatchEvent(new Event('storage'));
  };

  return <Card title="Learning Calendar" subtitle="Save your Day 1 date and write notes for missed or gap days.">
    <div className="learningCalendarPro">
      <div className="calendarStartRow">
        <label><span>Day 1 Start Date</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
        <button className="btn cyan" onClick={saveStartDate}>Save Start</button>
      </div>
      <div className="calendarDayGrid">
        {days.map(day => <button key={day} className={day === selectedDay ? 'active' : ''} onClick={() => { setSelectedDay(day); setNote(readStore('learningCalendarNotes', {})[day] || ''); }}>
          <b>Day {day}</b><small>{day === activeDay ? 'Today' : readStore('learningCalendarNotes', {})[day] ? 'Note saved' : 'Plan'}</small>
        </button>)}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write gap reason, revision note, or recovery plan..." />
      <button className="btn ghost" onClick={saveDayNote}>Save Day Note</button>
    </div>
  </Card>;
}

function DailyNotifications({ activeDay, today, weak }) {
  const notifications = [
    `Day ${activeDay}: Learn ${today.salesforce}`,
    `Practice: ${today.dsa}`,
    `System Design: ${today.systemDesign}`,
    weak > 0 ? `Revision: Fix ${weak} weak topic(s)` : 'Revision: Mark one topic Weak or Strong',
    'Proof: Save one answer and track one focused sprint'
  ];
  return <Card title="Today Notifications" subtitle="Day-wise guidance so you know what to study today.">
    <div className="notificationStack">{notifications.map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></div>)}</div>
  </Card>;
}

function ToolsByPurpose() {
  return <Card title="Tools Grouped by Purpose" subtitle="Clean final flow. Choose the group based on what you want to do now.">
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
    <PremiumCommandStrip />
    <div className="grid2"><LearningCalendar {...data} /><DailyNotifications {...data} /></div>
    <PremiumHomeGrid {...data} />
    <DashboardStats {...data} />
    <DashboardDeepGrid {...data} />
    <ToolsByPurpose />
  </Page></Layout>;
}
