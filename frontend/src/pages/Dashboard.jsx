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
  const today = roadmap90[(activeDay - 1) % roadmap90.length] || roadmap90[0];
  const strong = Object.values(weakStrong).filter(status => status === 'Strong').length;
  const weak = Object.values(weakStrong).filter(status => status === 'Weak').length;
  const applied = jobs.filter(job => job.applied || job.status === 'Applied').length;
  const completedTasks = tasks.filter(task => task.done).length;
  const totalTasks = tasks.length;
  const routeDoneToday = Object.keys(mentorDone).filter(key => key.startsWith(`${activeDay}-`) && mentorDone[key]).length;
  const calendarNotes = readStore('learningCalendarNotes', {});
  const todayProofNote = Boolean(calendarNotes[activeDay] || calendarNotes[Math.min(activeDay, 45)]);
  const proofTotal = completedTasks + routeDoneToday + (todayProofNote ? 1 : 0);
  const proofStatus = proofTotal >= 4 ? 'Completed' : proofTotal >= 2 ? 'Partial' : proofTotal >= 1 ? 'Started' : 'Not Saved';
  const score = calculateJobReadyScore({ tasks, savedAnswers, weakStrong, jobs, weeklyResults, mentorDone });
  return { activeDay, today, score, savedAnswers, strong, weak, applied, completedTasks, totalTasks, routeDoneToday, weeklyResults, calendarNotes, todayProofNote, proofTotal, proofStatus };
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
      <div className="dashboardHeroActions"><Link className="btn cyan" to="/mentor-route">Open Today’s Route</Link><Link className="btn ghost" to="/practice">Practice Questions</Link><Link className="btn ghost" to="/time-tracker">Track 8 Hours</Link></div>
      <div className="heroMiniStats" style={{ marginTop: 18 }}>{heroStats.map(item => <div key={item.label}><b>{item.value}</b><span>{item.label}</span></div>)}</div>
    </div>
    <div className="dashboardScorePanel"><div className="scoreCircle"><b>{score}%</b><span>Job Ready</span></div><div className="scoreMini"><b>Today's Focus</b><p className="hint">{today.phase}</p><Progress value={score}/><small>Based on saved answers, tasks, topics, tests and job pipeline.</small></div><MomentumGraph score={score} savedAnswers={savedAnswers} strong={strong} applied={applied} completedTasks={completedTasks} totalTasks={totalTasks} routeDoneToday={routeDoneToday} weeklyResults={weeklyResults} /></div>
  </section>;
}

function ModeBanner({ guideMode }) {
  return <div className={`guideModeBanner ${guideMode}`}><b>{guideMode === 'pro' ? 'PRO MODE ACTIVE' : 'BEGINNER MODE ACTIVE'}</b><span>{guideMode === 'pro' ? 'Advanced analytics, proof, execution and career pipeline are visible.' : 'Simple step-by-step flow is visible. Extra analytics are hidden to avoid confusion.'}</span></div>;
}

function TodayCommandCenter({ data, guideMode, setGuideMode }) {
  const { activeDay, today, completedTasks, totalTasks, proofStatus, proofTotal, score, weak, savedAnswers, applied } = data;
  const target = totalTasks ? `${completedTasks}/${totalTasks} tasks` : 'Start tasks';
  const proFacts = [
    ['Main Goal', today.salesforce], ['Study Target', '8 Hours'], ['Today Progress', target], ['Proof Status', `${proofStatus} • ${proofTotal} proof`], ['Readiness', `${score}%`], ['Weak Topics', weak], ['Saved Answers', savedAnswers], ['Pipeline', `${applied} jobs`]
  ];
  const beginnerFacts = [
    ['Step 1', 'Open Today Route'], ['Step 2', 'Practice questions'], ['Step 3', 'Save one answer'], ['Step 4', 'Mark proof'], ['Today Topic', today.salesforce]
  ];
  const facts = guideMode === 'pro' ? proFacts : beginnerFacts;
  return <Card title="Today Command Center" subtitle={guideMode === 'pro' ? 'Advanced control room for execution, proof and career readiness.' : 'Simple control room. Follow the steps from left to right.'}>
    <div className="homeCommandCenter">
      <div className="commandPrimary">
        <p className="eyebrow">Day {activeDay} Mission</p><h2>{guideMode === 'pro' ? (today.phase || 'Salesforce Career Sprint') : 'Aaj kya karna hai?'}</h2>
        <p>{guideMode === 'pro' ? 'Execute today like a professional: output, proof, confidence and pipeline.' : 'Bas ye 4 steps follow karo: route kholo, practice karo, answer save karo, proof mark karo.'}</p>
        <div className="modeSwitch"><button className={guideMode === 'beginner' ? 'active' : ''} onClick={() => { setGuideMode('beginner'); writeStore('homeGuideMode', 'beginner'); }}>Beginner Mode</button><button className={guideMode === 'pro' ? 'active' : ''} onClick={() => { setGuideMode('pro'); writeStore('homeGuideMode', 'pro'); }}>Pro Mode</button></div>
      </div>
      <div className={`commandFacts ${guideMode === 'pro' ? 'proFacts' : 'beginnerFacts'}`}>{facts.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>
    </div>
  </Card>;
}

function HomeGuideFlow() {
  const steps = [
    { n: '01', title: 'Learn', text: 'Open Today’s Route and understand one topic clearly.', to: '/mentor-route' },
    { n: '02', title: 'Practice', text: 'Solve Salesforce, DSA and System Design questions.', to: '/practice' },
    { n: '03', title: 'Save Proof', text: 'Write one interview answer or project note before closing.', to: '/interview' },
    { n: '04', title: 'Ask Mentor', text: 'Ask the AI Mentor when you get stuck or need explanation.', to: '/ai-mentor' },
    { n: '05', title: 'Track Progress', text: 'Update time, weak topics, job tracker and daily completion.', to: '/time-tracker' },
  ];
  return <Card title="Start Here: Simple Daily Path" subtitle="Use this order every day. No confusion, no random clicking."><div className="homeGuideFlow">{steps.map(step => <Link key={step.n} to={step.to} className="guideStepCard"><b>{step.n}</b><span>{step.title}</span><small>{step.text}</small></Link>)}</div></Card>;
}

function BeginnerCompass({ activeDay, today, weak, savedAnswers, guideMode }) {
  const beginnerItems = [
    { title: 'I do not know what to study', text: `Start Day ${activeDay}: ${today.salesforce}`, to: '/mentor-route', action: 'Open Route' },
    { title: 'I need questions', text: 'Open Question Bank and save at least one answer.', to: '/practice', action: 'Practice' },
    { title: 'I forgot a topic', text: weak > 0 ? `Revise ${weak} weak topic(s) first.` : 'Mark topics Weak/Strong after practice.', to: '/focus', action: 'Focus' },
    { title: 'I need interview confidence', text: savedAnswers < 10 ? 'Write one 60-second answer today.' : 'Improve one saved answer with project impact.', to: '/interview', action: 'Interview' },
  ];
  const proItems = [
    { title: 'Skill Execution', text: `${today.salesforce}. Finish one project-style example.`, to: '/projects', action: 'Build' },
    { title: 'Interview Output', text: 'Save one STAR/project-impact answer with metrics.', to: '/interview', action: 'Polish' },
    { title: 'Weak Topic Control', text: weak > 0 ? `${weak} weak topic(s) need revision.` : 'Convert today’s topic into Strong.', to: '/focus', action: 'Improve' },
    { title: 'Career Pipeline', text: 'Update job tracker and follow-up actions.', to: '/job-tracker', action: 'Track' },
  ];
  const items = guideMode === 'pro' ? proItems : beginnerItems;
  return <Card title={guideMode === 'pro' ? 'Pro Execution Compass' : 'Beginner Compass'} subtitle={guideMode === 'pro' ? 'Professional focus: output, confidence, proof, pipeline.' : 'Choose what you need right now. The app will take you to the correct place.'}><div className="beginnerCompassGrid">{items.map(item => <Link key={item.title} to={item.to} className="compassTile"><h3>{item.title}</h3><p>{item.text}</p><span>{item.action}</span></Link>)}</div></Card>;
}

function DailyStudyBlocks() {
  const blocks = [['2h', 'Salesforce Core', 'Apex, LWC, Flow, SOQL or Security'], ['1h', 'DSA', 'One pattern, one problem, one note'], ['1h', 'System Design', 'Concept + real-world explanation'], ['2h', 'Project Proof', 'Build, fix, document or polish project'], ['1h', 'Interview Practice', 'Write, speak and save one answer'], ['1h', 'Revision + Job', 'Weak topics, resume, job tracker']];
  return <Card title="8-Hour Study Structure" subtitle="A simple daily split for basic to advanced learning."><div className="studyBlockGrid">{blocks.map(([time, title, text]) => <div key={title}><b>{time}</b><span>{title}</span><small>{text}</small></div>)}</div></Card>;
}

function EightHourTimeline() {
  const blocks = [['09:00 - 11:00', 'Salesforce Deep Work', 'Core topic + notes + one small example', '/mentor-route'], ['11:15 - 12:15', 'DSA Practice', 'One pattern, one problem, one learning note', '/practice'], ['12:30 - 01:30', 'System Design', 'One concept + real project explanation', '/ai-mentor'], ['03:00 - 05:00', 'Project Proof', 'Build/fix/polish one visible project item', '/projects'], ['05:30 - 06:30', 'Interview Output', 'Write and save one 60-second answer', '/interview'], ['07:00 - 08:00', 'Revision + Job', 'Weak topic revision + job tracker update', '/job-tracker']];
  return <Card title="Daily 8-Hour Timeline" subtitle="Follow this schedule when you can give 8 focused hours."><div className="hourTimeline">{blocks.map(([time, title, text, to], index) => <Link key={title} to={to}><b>{String(index + 1).padStart(2, '0')}</b><span>{time}</span><strong>{title}</strong><small>{text}</small></Link>)}</div></Card>;
}

function DailyPlan({ activeDay, today, weak }) {
  const plan = [{ title: 'Salesforce Core', text: today.salesforce, to: '/practice', action: 'Practice' }, { title: 'DSA Pattern', text: today.dsa, to: '/practice', action: 'Solve' }, { title: 'System Design', text: today.systemDesign, to: '/ai-mentor', action: 'Explain' }, { title: 'Project Proof', text: today.projectTask, to: '/projects', action: 'Build' }, { title: 'Interview Output', text: today.interviewTask, to: '/interview', action: 'Answer' }];
  return <Card title={`Day ${activeDay} Professional Plan`} subtitle="Clear priority for today. Do these before opening extra tools."><div className="taskGrid">{plan.map((item, index) => <Link className="taskCard" key={item.title} to={item.to}><span>{String(index + 1).padStart(2, '0')}</span><b>{item.title}</b><small>{item.text}</small><em>{item.action}</em></Link>)}</div><p className="hint">{weak > 0 ? `Priority: revise ${weak} weak topic(s) before learning new topics.` : 'Priority: mark one topic Weak or Strong after practice.'}</p></Card>;
}

function HomeExecutiveGrid({ score, activeDay, completedTasks, totalTasks, savedAnswers, applied, strong, weak, weeklyResults, routeDoneToday }) {
  const taskProgress = totalTasks ? completedTasks / totalTasks * 100 : 0;
  return <div className="statsGrid premiumStatsGrid dashboardCleanStats"><Stat icon="DAY" label="Current Day" value={`Day ${activeDay}`} note="90-day career sprint"/><Stat icon="SCORE" label="Job Ready" value={`${score}%`} note="Real saved-work score"/><Stat icon="TASK" label="Tasks Done" value={`${completedTasks}/${totalTasks || 0}`} note={`${Math.round(taskProgress)}% daily execution`}/><Stat icon="ANS" label="Saved Answers" value={savedAnswers} note="Practice + mentor + interview"/><Stat icon="STR" label="Strong Topics" value={strong} note="Interview confidence"/><Stat icon="WEAK" label="Weak Topics" value={weak} note="Revision backlog"/><Stat icon="TEST" label="Weekly Tests" value={Object.keys(weeklyResults).length} note="Proof of assessment"/><Stat icon="JOB" label="Applied Jobs" value={applied} note={`Route done ${routeDoneToday}/6`}/></div>;
}

function SimpleProgressCards({ data }) {
  const { score, completedTasks, totalTasks, savedAnswers, weak, activeDay, proofStatus, applied } = data;
  const taskProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const cards = [['Today Progress', `${taskProgress}%`, `${completedTasks}/${totalTasks || 0} tasks complete`], ['45-Day Sprint', `Day ${Math.min(activeDay, 45)}`, 'Filtered calendar + proof map'], ['Job Ready Score', `${score}%`, 'From saved work and practice'], ['Saved Answers', savedAnswers, 'Interview proof created'], ['Weak Topics', weak, weak ? 'Revise first today' : 'No urgent weak topic'], ['Proof Status', proofStatus, 'Save note before closing'], ['Job Pipeline', applied, 'Applications/follow-ups tracked']];
  return <Card title="Simple Progress Dashboard" subtitle="Every number has a clear meaning, so you know exactly what to improve."><div className="simpleProgressCards">{cards.map(([title, value, text]) => <div key={title}><b>{value}</b><span>{title}</span><small>{text}</small></div>)}</div></Card>;
}

function WhatShouldIDoNow({ data }) {
  const { weak, savedAnswers, applied, activeDay, today, proofStatus } = data;
  let action = `Open Day ${activeDay} route and study: ${today.salesforce}.`;
  if (weak > 0) action = `Revise ${weak} weak topic(s) first. Do not start random new topics.`;
  else if (savedAnswers < 10) action = 'Write and save one 60-second interview answer today.';
  else if (proofStatus !== 'Completed') action = 'Save today proof in Learning Proof Map or Learning Calendar.';
  else if (applied < 5) action = 'Apply or follow up with 3 companies and update Job Tracker.';
  return <Card title="What Should I Do Now?" subtitle="One button style answer for your next action."><div className="whatNowBox"><b>Next Best Move</b><p>{action}</p><div><Link className="btn cyan" to="/mentor-route">Start Now</Link><Link className="btn ghost" to="/time-tracker">Start Timer</Link></div></div></Card>;
}

function ProofCalendarStatus({ data }) {
  const { activeDay, todayProofNote, proofStatus, proofTotal, calendarNotes } = data;
  const savedNotes = Object.keys(calendarNotes || {}).length;
  return <Card title="Proof + Calendar Status" subtitle="Home Guide is connected with your Learning Calendar and Proof Map."><div className="proofStatusGrid"><div><span>Today Proof</span><b>{proofStatus}</b><small>{proofTotal} proof point(s) saved</small></div><div><span>Calendar Note</span><b>{todayProofNote ? 'Saved' : 'Pending'}</b><small>Day {Math.min(activeDay, 45)} daily note</small></div><div><span>45-Day Notes</span><b>{savedNotes}/45</b><small>Learning calendar progress</small></div></div><div className="proofStatusActions"><Link className="btn cyan" to="/dashboard">Save Today Proof</Link><Link className="btn ghost" to="/time-tracker">Open Time Tracker</Link></div></Card>;
}

function PriorityNotifications({ data }) {
  const { weak, proofStatus, savedAnswers, applied } = data;
  const urgent = proofStatus !== 'Completed' ? 'Today proof is not completed yet.' : 'No urgent proof issue.';
  const today = weak > 0 ? `Revise ${weak} weak topic(s).` : savedAnswers < 10 ? 'Save one interview answer.' : 'Complete one project proof.';
  const optional = applied < 5 ? 'Apply/follow up with 3 companies.' : 'Polish portfolio or resume.';
  return <Card title="Priority Notifications" subtitle="Grouped reminders: urgent, today, optional."><div className="priorityNoticeGrid"><div className="urgent"><b>Urgent</b><p>{urgent}</p></div><div className="today"><b>Today</b><p>{today}</p></div><div className="optional"><b>Optional</b><p>{optional}</p></div></div></Card>;
}

function WeeklyMission() {
  const missions = ['5 Salesforce topics', '5 DSA problems', '5 System Design notes', '10 interview answers', '20 job applications/follow-ups'];
  return <Card title="This Week Mission" subtitle="Weekly output target to move from learning to job-ready."><div className="weeklyMissionList">{missions.map((mission, index) => <div key={mission}><b>{String(index + 1).padStart(2, '0')}</b><span>{mission}</span></div>)}</div></Card>;
}

function CareerOSFlow() {
  const steps = [['Learn', '/mentor-route'], ['Practice', '/practice'], ['Build', '/projects'], ['Track', '/time-tracker'], ['Apply', '/job-tracker'], ['Review', '/dashboard']];
  return <Card title="Career OS Control Flow" subtitle="Use the app like a professional system, not a random collection of pages."><div className="careerOSFlow">{steps.map(([label, to], index) => <Link key={label} to={to}><b>{String(index + 1).padStart(2, '0')}</b><span>{label}</span></Link>)}</div></Card>;
}

function ScoreBreakdown({ score, completedTasks, totalTasks, savedAnswers, strong, applied, weeklyResults }) {
  return <Card title="Job Ready Score Breakdown" subtitle="Transparent score from real work, not a fake number."><div className="mission"><p><b>Overall readiness</b><Progress value={score}/></p><p><b>Daily execution</b><Progress value={totalTasks ? completedTasks / totalTasks * 100 : 0}/></p><p><b>Answer practice</b><Progress value={Math.min(100, savedAnswers * 4)}/></p><p><b>Strong topic confidence</b><Progress value={Math.min(100, strong * 5)}/></p><p><b>Career pipeline</b><Progress value={Math.min(100, applied * 2 + Object.keys(weeklyResults).length * 5)}/></p></div></Card>;
}

function QuickStartCard() {
  return <Card title="Quick Launch" subtitle="Open the right module in one click."><div className="quickStartStack">{QUICK_START_CARDS.map(card => <Link key={card.title} to={card.to}><span>{card.icon}</span><div><b>{card.title}</b><small>{card.text}</small></div></Link>)}</div></Card>;
}

function LearningCalendar({ activeDay }) {
  const [startDate, setStartDate] = React.useState(() => readStore('learningStartDate', ''));
  const [notes, setNotes] = React.useState(() => readStore('learningCalendarNotes', {}));
  const [selectedDay, setSelectedDay] = React.useState(Math.min(activeDay, 45));
  const [note, setNote] = React.useState(() => readStore('learningCalendarNotes', {})[Math.min(activeDay, 45)] || '');
  const [rangeFilter, setRangeFilter] = React.useState(activeDay <= 15 ? '1-15' : activeDay <= 30 ? '16-30' : '31-45');
  const [noteFilter, setNoteFilter] = React.useState('All');
  const allDays = Array.from({ length: 45 }, (_, i) => i + 1);
  const getRangeDays = () => rangeFilter === '1-15' ? allDays.filter(day => day <= 15) : rangeFilter === '16-30' ? allDays.filter(day => day >= 16 && day <= 30) : rangeFilter === '31-45' ? allDays.filter(day => day >= 31 && day <= 45) : allDays;
  const filteredDays = getRangeDays().filter(day => noteFilter === 'All' || (noteFilter === 'Notes Saved' ? Boolean(notes[day]) : !notes[day]));
  const selectedTopic = roadmap90[(selectedDay - 1) % roadmap90.length] || {};
  const savedCount = allDays.filter(day => notes[day]).length;
  const saveStartDate = () => { writeStore('learningStartDate', startDate); window.dispatchEvent(new Event('storage')); };
  const selectDay = dayValue => { const day = Math.max(1, Math.min(45, Number(dayValue) || 1)); setSelectedDay(day); setNote(readStore('learningCalendarNotes', {})[day] || ''); if (day <= 15) setRangeFilter('1-15'); else if (day <= 30) setRangeFilter('16-30'); else setRangeFilter('31-45'); };
  const saveDayNote = () => { const next = { ...notes, [selectedDay]: note }; if (!note.trim()) delete next[selectedDay]; setNotes(next); writeStore('learningCalendarNotes', next); window.dispatchEvent(new Event('storage')); };
  const clearDayNote = () => { const next = { ...notes }; delete next[selectedDay]; setNotes(next); setNote(''); writeStore('learningCalendarNotes', next); window.dispatchEvent(new Event('storage')); };
  return <Card title="Learning Calendar" subtitle="Filter Day 1 to Day 45, select a day, and save your daily recovery/proof note."><div className="learningCalendarPro"><div className="calendarStartRow"><label><span>Day 1 Start Date</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><button className="btn cyan" onClick={saveStartDate}>Save Start</button></div><div className="calendarFilterPanel"><label><span>Select Day</span><select value={selectedDay} onChange={e => selectDay(e.target.value)}>{allDays.map(day => <option key={day} value={day}>Day {day}</option>)}</select></label><label><span>Range</span><select value={rangeFilter} onChange={e => setRangeFilter(e.target.value)}><option>All</option><option>1-15</option><option>16-30</option><option>31-45</option></select></label><label><span>Filter</span><select value={noteFilter} onChange={e => setNoteFilter(e.target.value)}><option>All</option><option>Notes Saved</option><option>No Notes</option></select></label><button className="btn ghost" onClick={() => selectDay(Math.min(activeDay, 45))}>Today</button></div><div className="calendarMiniSummary"><div><b>{savedCount}/45</b><span>notes saved</span></div><div><b>Day {selectedDay}</b><span>{notes[selectedDay] ? 'note saved' : 'no note yet'}</span></div></div><div className="calendarDayGrid">{filteredDays.length ? filteredDays.map(day => <button key={day} className={`${day === selectedDay ? 'active' : ''} ${notes[day] ? 'hasNote' : ''}`} onClick={() => selectDay(day)}><b>Day {day}</b><small>{day === activeDay ? 'Today' : notes[day] ? 'Note saved' : 'Plan'}</small></button>) : <div className="emptyMiniState"><b>No days found</b><p>Change range or filter.</p></div>}</div><div className="calendarSelectedPanel"><b>Day {selectedDay} Plan</b><span>{selectedTopic.salesforce || 'Salesforce practice'}</span><small>{selectedTopic.dsa || 'DSA practice'} • {selectedTopic.systemDesign || 'System Design'}</small></div><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write what happened today: studied topic, missed reason, recovery plan, interview answer saved..." /><div className="proofActions"><button className="btn cyan" onClick={saveDayNote}>Save Day Note</button><button className="btn ghost" onClick={clearDayNote}>Clear Note</button></div></div></Card>;
}

function NextActions({ activeDay, today, weak, savedAnswers, applied }) {
  const actions = [weak > 0 ? `Revise ${weak} weak topic(s) first.` : `Learn and mark confidence for ${today.salesforce}.`, savedAnswers < 10 ? 'Save one 60-second interview answer.' : 'Improve one saved answer with metrics and project impact.', 'Complete one focused 45-minute sprint and track it.', applied < 5 ? 'Apply or follow up with at least 3 companies.' : 'Update follow-up notes for active applications.', `Day ${activeDay} proof: save one visible output before closing the app.`];
  return <Card title="Next Best Actions" subtitle="Simple priority list for today."><div className="notificationStack">{actions.map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></div>)}</div></Card>;
}

function ToolsByPurpose() {
  return <Card title="Tools by Purpose" subtitle="Clean professional navigation grouped by your goal."><div className="grid2">{TOOL_GROUPS.map(group => <div className="previewCard" key={group.title}><h3>{group.title}</h3><div className="toolGrid compactToolGrid">{group.items.map(item => <Link key={item.label} className="toolTile" to={item.to}><b>{item.icon} {item.label}</b><span>Open</span></Link>)}</div></div>)}</div></Card>;
}

function BeginnerHome({ data, guideMode }) {
  return <>
    <ModeBanner guideMode={guideMode} />
    <HomeGuideFlow />
    <WhatShouldIDoNow data={data} />
    <div className="grid2"><BeginnerCompass {...data} guideMode={guideMode} /><DailyStudyBlocks /></div>
    <DailyPlan {...data} />
    <div className="grid2"><LearningCalendar {...data} /><QuickStartCard /></div>
  </>;
}

function ProHome({ data, guideMode }) {
  return <>
    <ModeBanner guideMode={guideMode} />
    <CareerOSFlow />
    <SimpleProgressCards data={data} />
    <div className="grid2"><WhatShouldIDoNow data={data} /><PriorityNotifications data={data} /></div>
    <div className="grid2"><ProofCalendarStatus data={data} /><WeeklyMission /></div>
    <EightHourTimeline />
    <HomeExecutiveGrid {...data} />
    <div className="grid2"><BeginnerCompass {...data} guideMode={guideMode} /><ScoreBreakdown {...data} /></div>
    <div className="grid2"><NextActions {...data} /><LearningCalendar {...data} /></div>
    <DashboardProfessionalSuite />
    <ToolsByPurpose />
  </>;
}

export function Dashboard() {
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [guideMode, setGuideModeState] = React.useState(() => readStore('homeGuideMode', 'beginner'));
  const setGuideMode = mode => { setGuideModeState(mode); writeStore('homeGuideMode', mode); window.dispatchEvent(new Event('storage')); };
  React.useEffect(() => { const id = setInterval(() => setRefreshTick(t => t + 1), 5000); const onStorage = () => setRefreshTick(t => t + 1); window.addEventListener('storage', onStorage); return () => { clearInterval(id); window.removeEventListener('storage', onStorage); }; }, []);
  const data = useDashboardData();
  return <Layout><Page data-refresh={refreshTick} className={`homeGuideMode-${guideMode}`}>
    <DashboardHero {...data} />
    <TodayCommandCenter data={data} guideMode={guideMode} setGuideMode={setGuideMode} />
    {guideMode === 'pro' ? <ProHome data={data} guideMode={guideMode} /> : <BeginnerHome data={data} guideMode={guideMode} />}
  </Page></Layout>;
}
