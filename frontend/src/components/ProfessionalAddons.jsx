import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Progress } from './UI';
import { readStore, writeStore, downloadText } from '../utils/storage';
import { roadmap90 } from '../data/roadmap';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://sfdc-mentor-backend.onrender.com';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getSavedAnswerCount() {
  const stores = ['answers', 'focusAnswers', 'interviewAnswers', 'interviewAnswersV2', 'weeklyAnswers', 'mentorLog'];
  return stores.reduce((count, key) => {
    const value = readStore(key, key === 'mentorLog' ? [] : {});
    if (Array.isArray(value)) return count + value.length;
    if (value && typeof value === 'object') return count + Object.values(value).filter(answer => String(answer?.text || answer || '').trim().length > 20).length;
    return count;
  }, 0);
}

function getActiveDay() {
  return Number(readStore('mentorDay', 0)) || Number(readStore('focusDay', 0)) || Number(readStore('timeCurrentDay', 0)) || 1;
}

function useLiveData() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    const onStorage = () => setTick(t => t + 1);
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(id); window.removeEventListener('storage', onStorage); };
  }, []);
  const weakStrong = readStore('weakStrong', {});
  const jobs = readStore('jobs', []);
  const weeklyResults = readStore('weeklyResults', {});
  const notes = readStore('notes', []);
  const documents = readStore('documents', []);
  const activeDay = getActiveDay();
  return {
    tick,
    activeDay,
    weak: Object.values(weakStrong).filter(v => v === 'Weak').length,
    strong: Object.values(weakStrong).filter(v => v === 'Strong').length,
    savedAnswers: getSavedAnswerCount(),
    jobsApplied: jobs.filter(j => j.applied || j.status === 'Applied').length,
    weeklyTests: Object.keys(weeklyResults).length,
    notesCount: Array.isArray(notes) ? notes.length : Object.keys(notes || {}).length,
    docsCount: Array.isArray(documents) ? documents.length : Object.keys(documents || {}).length,
  };
}

export function ProfessionalOnboarding() {
  const [role, setRole] = React.useState(() => readStore('targetRole', 'Salesforce Developer'));
  const [startDate, setStartDate] = React.useState(() => readStore('learningStartDate', ''));
  const [dailyTime, setDailyTime] = React.useState(() => readStore('dailyStudyTime', '480'));
  const [hidden, setHidden] = React.useState(() => readStore('onboardingComplete', false));
  if (hidden) return null;
  const save = () => {
    writeStore('targetRole', role);
    writeStore('learningStartDate', startDate || todayKey());
    writeStore('dailyStudyTime', dailyTime);
    writeStore('onboardingComplete', true);
    setHidden(true);
  };
  return <Card title="Professional Setup" subtitle="Complete this once so the app guides you like a real Career OS.">
    <div className="onboardingGrid">
      <label><span>Target Role</span><input value={role} onChange={e => setRole(e.target.value)} /></label>
      <label><span>Day 1 Start Date</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
      <label><span>Daily Study Time</span><input type="number" value={dailyTime} onChange={e => setDailyTime(e.target.value)} /><small>minutes</small></label>
      <button className="btn cyan" onClick={save}>Save Setup</button>
    </div>
  </Card>;
}

export function BackendSyncStatus() {
  const [health, setHealth] = React.useState(null);
  const [ollama, setOllama] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const h = await fetch(`${API_BASE}/api/health`).then(r => r.json());
        const o = await fetch(`${API_BASE}/api/ollama-status`).then(r => r.json());
        if (alive) { setHealth(h); setOllama(o); }
      } catch {
        if (alive) { setHealth({ ok: false }); setOllama({ ok: false }); }
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  const lastSaved = readStore('automationLastRun', 'Not synced yet');
  return <Card title="System Status" subtitle="Backend, SQLite, Ollama and save status.">
    <div className="statusPills">
      <span className={health?.ok ? 'ok' : 'warn'}>Backend {health?.ok ? 'Connected' : 'Offline'}</span>
      <span className={health?.sqlite_db ? 'ok' : 'warn'}>SQLite {health?.sqlite_db ? 'Ready' : 'Check'}</span>
      <span className={ollama?.model_available ? 'ok' : 'warn'}>Ollama {ollama?.model_available ? 'Ready' : 'Fallback'}</span>
      <span>Last Auto Save: {lastSaved}</span>
    </div>
  </Card>;
}

export function NextBestActionCard() {
  const data = useLiveData();
  const actions = [];
  if (data.weak) actions.push(`Revise ${data.weak} weak topic(s) first.`);
  if (data.savedAnswers < 5) actions.push('Save one interview answer today.');
  if (data.jobsApplied < 3) actions.push('Apply or follow up on 3 companies.');
  if (!data.weeklyTests) actions.push('Complete one weekly mixed test.');
  actions.push('Track one focused sprint in Career Watch.');
  return <Card title="AI Next Best Action" subtitle="Simple daily priority based on your saved work.">
    <div className="notificationStack">{actions.slice(0, 5).map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, '0')}</b><span>{item}</span></div>)}</div>
  </Card>;
}

export function NotificationCenter() {
  const data = useLiveData();
  const [dismissed, setDismissed] = React.useState(() => readStore('dismissedNotifications', {}));
  const autoPlan = readStore('autoTodayPlan', []);
  const custom = readStore('silentNotifications', []);
  const baseItems = [
    { id: 'route', type: 'Today', priority: 'High', text: `Open Day ${data.activeDay} route and finish one visible output.`, to: '/mentor-route' },
    data.weak > 0
      ? { id: 'weak', type: 'Revision', priority: 'High', text: `Revise ${data.weak} weak topic(s) before learning new topics.`, to: '/focus' }
      : { id: 'confidence', type: 'Skill', priority: 'Medium', text: 'After practice, mark one topic Weak or Strong.', to: '/practice' },
    data.savedAnswers < 10
      ? { id: 'answer', type: 'Interview', priority: 'High', text: 'Save one 60-second interview answer today.', to: '/interview' }
      : { id: 'answer-polish', type: 'Interview', priority: 'Medium', text: 'Improve one saved answer with project impact and metrics.', to: '/interview' },
    { id: 'proof', type: 'Proof', priority: 'High', text: 'Save proof in Learning Proof Map before closing the app.', to: '/dashboard' },
    data.jobsApplied < 5
      ? { id: 'job', type: 'Career', priority: 'Medium', text: 'Apply or follow up with at least 3 companies.', to: '/job-tracker' }
      : { id: 'job-followup', type: 'Career', priority: 'Low', text: 'Update follow-up notes for active applications.', to: '/job-tracker' },
    ...autoPlan.slice(0, 2).map((x, i) => ({ id: `plan-${i}`, type: 'Plan', priority: 'Medium', text: x, to: '/time-tracker' })),
    ...custom.slice(0, 2).map((x, i) => ({ id: `custom-${i}`, type: x.type || 'Notice', priority: 'Low', text: x.text || x, to: '/dashboard' }))
  ];
  const items = baseItems.filter(item => !dismissed[`${todayKey()}-${item.id}`]).slice(0, 7);
  const clearItem = id => {
    const next = { ...dismissed, [`${todayKey()}-${id}`]: true };
    setDismissed(next);
    writeStore('dismissedNotifications', next);
  };
  const clearToday = () => {
    const next = { ...dismissed };
    baseItems.forEach(item => { next[`${todayKey()}-${item.id}`] = true; });
    setDismissed(next);
    writeStore('dismissedNotifications', next);
  };
  return <Card title="Smart Notifications" subtitle="Only useful reminders: what to do, why it matters, and where to go.">
    <div className="notificationHeaderPro">
      <div><b>{items.length}</b><span>Active reminders today</span></div>
      <button className="btn ghost" onClick={clearToday}>Clear Today</button>
    </div>
    {items.length ? <div className="smartNotificationList">
      {items.map(item => <div key={item.id} className={`smartNotice ${item.priority.toLowerCase()}`}>
        <span>{item.priority}</span>
        <div><b>{item.type}</b><p>{item.text}</p></div>
        <Link to={item.to}>Open</Link>
        <button onClick={() => clearItem(item.id)}>Done</button>
      </div>)}
    </div> : <div className="emptyMiniState"><b>All clear</b><p>No urgent notification left for today. Keep building proof.</p></div>}
  </Card>;
}

export function LearningHeatmap() {
  const activeDay = getActiveDay();
  const [selectedDay, setSelectedDay] = React.useState(activeDay);
  const [notes, setNotes] = React.useState(() => readStore('learningCalendarNotes', {}));
  const [mentorDone, setMentorDone] = React.useState(() => readStore('mentorDone', {}));
  const [timeTasksByDay, setTimeTasksByDay] = React.useState(() => readStore('timeTasksByDay', {}));
  const selectedTopic = roadmap90[(selectedDay - 1) % roadmap90.length] || {};
  const days = Array.from({ length: 45 }, (_, i) => i + 1);
  const getProof = day => {
    const taskDone = (timeTasksByDay[day] || []).filter(t => t.done).length;
    const routeDone = Object.keys(mentorDone).filter(k => k.startsWith(`${day}-`) && mentorDone[k]).length;
    const note = notes[day] ? 1 : 0;
    const total = taskDone + routeDone + note;
    return { taskDone, routeDone, note, total };
  };
  const getStatus = total => total >= 4 ? 'Completed' : total >= 2 ? 'Partial' : total >= 1 ? 'Started' : 'Missed';
  const studied = days.filter(day => getProof(day).total > 0).length;
  const completed = days.filter(day => getProof(day).total >= 4).length;
  const partial = days.filter(day => getProof(day).total > 0 && getProof(day).total < 4).length;
  const missed = days.filter(day => getProof(day).total === 0).length;
  const selectedProof = getProof(selectedDay);
  const selectedStatus = getStatus(selectedProof.total);
  const saveNote = value => {
    const next = { ...notes, [selectedDay]: value };
    if (!value.trim()) delete next[selectedDay];
    setNotes(next);
    writeStore('learningCalendarNotes', next);
    window.dispatchEvent(new Event('storage'));
  };
  const markCompleted = () => {
    const tasks = [
      'Salesforce Core Study', 'DSA Practice', 'System Design Practice', 'Project Proof', 'Interview Answer', 'Revision + Job Tracker'
    ].map((title, index) => ({ id: `${selectedDay}-${index}`, title, done: true }));
    const nextTasks = { ...timeTasksByDay, [selectedDay]: tasks };
    const nextMentor = { ...mentorDone };
    for (let i = 0; i < 4; i += 1) nextMentor[`${selectedDay}-${i}`] = true;
    const nextNotes = { ...notes, [selectedDay]: notes[selectedDay] || `Day ${selectedDay} proof saved: completed study blocks and route tasks.` };
    setTimeTasksByDay(nextTasks);
    setMentorDone(nextMentor);
    setNotes(nextNotes);
    writeStore('timeTasksByDay', nextTasks);
    writeStore('mentorDone', nextMentor);
    writeStore('learningCalendarNotes', nextNotes);
    window.dispatchEvent(new Event('storage'));
  };
  const clearDay = () => {
    const nextTasks = { ...timeTasksByDay };
    const nextNotes = { ...notes };
    const nextMentor = { ...mentorDone };
    delete nextTasks[selectedDay];
    delete nextNotes[selectedDay];
    Object.keys(nextMentor).forEach(key => { if (key.startsWith(`${selectedDay}-`)) delete nextMentor[key]; });
    setTimeTasksByDay(nextTasks);
    setNotes(nextNotes);
    setMentorDone(nextMentor);
    writeStore('timeTasksByDay', nextTasks);
    writeStore('learningCalendarNotes', nextNotes);
    writeStore('mentorDone', nextMentor);
    window.dispatchEvent(new Event('storage'));
  };
  return <Card title="Learning Proof Map" subtitle="Simple rule: select a day, save proof, and the color updates automatically.">
    <div className="proofSummaryGrid">
      <div><b>{studied}/45</b><span>Studied</span></div>
      <div><b>{completed}</b><span>Completed</span></div>
      <div><b>{partial}</b><span>Partial</span></div>
      <div><b>{missed}</b><span>Missed</span></div>
    </div>
    <div className="proofMapLegend">
      <span className="done">Completed</span><span className="partial">Partial</span><span className="started">Started</span><span className="missed">Missed</span><span className="today">Today</span>
    </div>
    <div className="proofMapGrid">
      {days.map(day => {
        const proof = getProof(day);
        const status = getStatus(proof.total).toLowerCase();
        return <button key={day} className={`proofDayCell ${status} ${day === activeDay ? 'today' : ''} ${day === selectedDay ? 'selected' : ''}`} onClick={() => setSelectedDay(day)}>
          <b>{day}</b><span>{day === activeDay ? 'Today' : getStatus(proof.total)}</span>
        </button>;
      })}
    </div>
    <div className="proofDetailPanel">
      <div className="proofDetailHead"><div><b>Day {selectedDay}: {selectedStatus}</b><span>{selectedTopic.salesforce || 'Salesforce practice'}</span></div><strong>{selectedProof.total} proof</strong></div>
      <div className="proofChecklist">
        <span className={selectedProof.routeDone ? 'ok' : ''}>Route tasks: {selectedProof.routeDone}</span>
        <span className={selectedProof.taskDone ? 'ok' : ''}>8-hour tasks: {selectedProof.taskDone}</span>
        <span className={selectedProof.note ? 'ok' : ''}>Day note: {selectedProof.note ? 'Saved' : 'Not saved'}</span>
      </div>
      <textarea value={notes[selectedDay] || ''} onChange={e => saveNote(e.target.value)} placeholder="Example: Studied Apex trigger basics, solved 1 DSA problem, saved 1 interview answer..." />
      <div className="proofActions"><button className="btn cyan" onClick={markCompleted}>Mark Day Completed</button><button className="btn ghost" onClick={clearDay}>Clear This Day</button><Link className="btn ghost" to="/time-tracker">Open Time Tracker</Link></div>
    </div>
  </Card>;
}

export function JourneyTimeline() {
  const activeDay = getActiveDay();
  const milestones = [
    ['Day 1', 'Foundation', 1], ['Day 30', 'Core Developer', 30], ['Day 60', 'Interview Ready', 60], ['Day 90', 'Job Ready', 90]
  ];
  return <Card title="Smart Progress Timeline" subtitle="Your zero-to-job-ready journey in one view.">
    <div className="journeyTimeline">{milestones.map(([day, label, number]) => <div key={day} className={activeDay >= number ? 'done' : ''}><b>{day}</b><span>{label}</span></div>)}</div>
  </Card>;
}

export function AchievementPanel() {
  const data = useLiveData();
  const achievements = [
    ['First Answer', data.savedAnswers >= 1],
    ['10 Answers Saved', data.savedAnswers >= 10],
    ['Apex Strong', data.strong >= 1],
    ['5 Jobs Applied', data.jobsApplied >= 5],
    ['Weekly Test Done', data.weeklyTests >= 1],
    ['Documents Ready', data.docsCount >= 1],
  ];
  return <Card title="Achievement Badges" subtitle="Professional motivation without clutter.">
    <div className="achievementGrid">{achievements.map(([label, done]) => <span key={label} className={done ? 'done' : ''}>{done ? 'READY' : 'LOCK'} {label}</span>)}</div>
  </Card>;
}

export function WeeklyReportCard() {
  const data = useLiveData();
  const report = `Weekly Career OS Report\n\nSaved answers: ${data.savedAnswers}\nStrong topics: ${data.strong}\nWeak topics: ${data.weak}\nJobs applied: ${data.jobsApplied}\nWeekly tests: ${data.weeklyTests}\nNotes: ${data.notesCount}\nDocuments: ${data.docsCount}\n\nNext week plan:\n1. Fix weak topics\n2. Save interview answers\n3. Apply/follow up jobs\n4. Complete Sunday test`;
  return <Card title="Weekly Report" subtitle="Export your weekly proof and next plan.">
    <div className="reportPreview"><pre>{report}</pre></div>
    <button className="btn cyan" onClick={() => downloadText('weekly-career-os-report.txt', report)}>Export Report</button>
  </Card>;
}

export function PortfolioPreviewMode() {
  return <Card title="Portfolio Preview Mode" subtitle="Edit private content and review the public job portfolio quickly.">
    <div className="previewSplit"><Link className="btn cyan" to="/portfolio-manager">Open Portfolio Editor</Link><Link className="btn ghost" to="/portfolio">Preview Portfolio</Link></div>
  </Card>;
}

export function DashboardProfessionalSuite() {
  return <>
    <ProfessionalOnboarding />
    <div className="grid2"><BackendSyncStatus /><NextBestActionCard /></div>
    <div className="grid2"><NotificationCenter /><LearningHeatmap /></div>
    <div className="grid2"><JourneyTimeline /><AchievementPanel /></div>
    <div className="grid2"><WeeklyReportCard /><PortfolioPreviewMode /></div>
  </>;
}

export function EmptyStatePro({ title = 'No data yet', text = 'Save your first item to start building proof.', to = '/dashboard', action = 'Go Home' }) {
  return <div className="emptyStatePro"><b>EMPTY</b><h3>{title}</h3><p>{text}</p><Link className="btn cyan" to={to}>{action}</Link></div>;
}
