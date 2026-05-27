import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Progress } from './UI';
import { readStore, writeStore, downloadText } from '../utils/storage';
import { roadmap90 } from '../data/roadmap';

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
  const activeDay = Number(readStore('mentorDay', 0)) || Number(readStore('focusDay', 0)) || 1;
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
  const [dailyTime, setDailyTime] = React.useState(() => readStore('dailyStudyTime', '90'));
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
        const h = await fetch('http://127.0.0.1:8000/api/health').then(r => r.json());
        const o = await fetch('http://127.0.0.1:8000/api/ollama-status').then(r => r.json());
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
  const notifications = readStore('silentNotifications', []);
  const autoPlan = readStore('autoTodayPlan', []);
  const interviewQuestion = readStore('autoInterviewQuestionOfDay', 'Save one interview answer today.');
  const items = [
    ...autoPlan.map(x => ({ text: x, type: 'Plan' })),
    { text: interviewQuestion, type: 'Interview' },
    ...notifications.slice(0, 4).map(x => ({ text: x.text || x, type: x.type || 'Notice' }))
  ].slice(0, 7);
  return <Card title="Notification Center" subtitle="Daily study, revision, interview and backup reminders.">
    <div className="notificationStack">{items.map((item, index) => <div key={`${item.type}-${index}`}><b>{String(index + 1).padStart(2, '0')}</b><span><strong>{item.type}:</strong> {item.text}</span></div>)}</div>
  </Card>;
}

export function LearningHeatmap() {
  const activeDay = Number(readStore('mentorDay', 0)) || Number(readStore('focusDay', 0)) || 1;
  const notes = readStore('learningCalendarNotes', {});
  const mentorDone = readStore('mentorDone', {});
  const timeTasksByDay = readStore('timeTasksByDay', {});
  const days = Array.from({ length: 42 }, (_, i) => i + 1);
  const getProofCount = day => {
    const taskDone = (timeTasksByDay[day] || []).filter(t => t.done).length;
    const routeDone = Object.keys(mentorDone).filter(k => k.startsWith(`${day}-`) && mentorDone[k]).length;
    const note = notes[day] ? 1 : 0;
    return taskDone + routeDone + note;
  };
  const getStatus = count => count >= 4 ? 'Completed' : count >= 2 ? 'Partial' : count >= 1 ? 'Started' : 'No proof';
  const getCellStyle = (day, count) => {
    const isToday = day === activeDay;
    const background = count >= 4
      ? 'linear-gradient(135deg,#22c55e,#35d4ef)'
      : count >= 2
        ? 'linear-gradient(135deg,#0e7490,#2563eb)'
        : count >= 1
          ? 'linear-gradient(135deg,#334155,#0f766e)'
          : '#0b1220';
    return {
      minHeight: 58,
      borderRadius: 16,
      border: isToday ? '2px solid #facc15' : '1px solid #253247',
      background,
      color: count >= 3 ? '#00111a' : '#eaf2ff',
      display: 'grid',
      placeItems: 'center',
      padding: 8,
      boxShadow: isToday ? '0 0 0 4px rgba(250,204,21,.15)' : '0 12px 28px rgba(0,0,0,.18)',
      fontWeight: 900,
      textAlign: 'center',
    };
  };
  const studied = days.filter(day => getProofCount(day) > 0).length;
  const completed = days.filter(day => getProofCount(day) >= 4).length;
  const partial = days.filter(day => getProofCount(day) > 0 && getProofCount(day) < 4).length;
  return <Card title="Learning Proof Map" subtitle="Professional 42-day view of studied, partial and missed learning days.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
      <div className="stat"><p>Studied Days</p><b>{studied}/42</b><small>Any proof saved</small></div>
      <div className="stat"><p>Completed Days</p><b>{completed}</b><small>Strong proof days</small></div>
      <div className="stat"><p>Partial Days</p><b>{partial}</b><small>Need completion</small></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(64px,1fr))', gap: 10 }}>
      {days.map(day => {
        const count = getProofCount(day);
        const topic = roadmap90[(day - 1) % roadmap90.length]?.salesforce || 'Salesforce practice';
        return <div key={day} style={getCellStyle(day, count)} title={`Day ${day}: ${getStatus(count)} | Proof items: ${count} | ${topic}`}>
          <span style={{ display: 'block', fontSize: 15 }}>Day {day}</span>
          <small style={{ color: 'inherit', opacity: .9 }}>{day === activeDay ? 'Today' : getStatus(count)}</small>
        </div>;
      })}
    </div>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
      <span className="pill">No proof = missed</span>
      <span className="pill">Started = 1 proof</span>
      <span className="pill">Partial = 2-3 proofs</span>
      <span className="pill">Completed = 4+ proofs</span>
      <span className="pill">Yellow border = today</span>
    </div>
    <p className="hint">This map becomes brighter when you complete route tasks, save day notes, or finish time-tracker tasks. It is proof-based, so it stays honest and professional.</p>
  </Card>;
}

export function JourneyTimeline() {
  const activeDay = Number(readStore('mentorDay', 0)) || 1;
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
