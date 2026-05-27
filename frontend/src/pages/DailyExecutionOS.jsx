import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { ROADMAP_DAYS } from '../data/roadmap';
import { EXECUTION_BLOCKS, exportWeeklyReport, getAllDayScores, getCurrentStreak, getDayRecord, getDayScore, getWeeklySummary, saveExecutionDay } from '../utils/dailyExecution';

function scoreColor(score) {
  if (score >= 85) return 'linear-gradient(135deg,#22c55e,#35d4ef)';
  if (score >= 55) return 'linear-gradient(135deg,#2563eb,#0e7490)';
  if (score >= 30) return 'linear-gradient(135deg,#facc15,#f97316)';
  if (score > 0) return 'linear-gradient(135deg,#7f1d1d,#ef4444)';
  return '#0b1220';
}

function scoreTone(score) {
  if (score >= 85) return 'Completed';
  if (score >= 55) return 'Good';
  if (score >= 30) return 'Partial';
  if (score > 0) return 'Started';
  return 'Missed';
}

function getSafeDay(day) {
  return Math.max(1, Math.min(ROADMAP_DAYS, Number(day) || 1));
}

function getTodaySprintDay() {
  const startDate = localStorage.getItem('sfdc_mentor_complete_learningStartDate');
  if (!startDate) return 1;
  try {
    const parsed = JSON.parse(startDate);
    const start = new Date(parsed);
    const today = new Date();
    const diff = Math.floor((today.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / 86400000) + 1;
    return getSafeDay(diff);
  } catch {
    return 1;
  }
}

function CalendarCell({ item, selectedDay, setSelectedDay }) {
  const route = item.record.route;
  const selected = selectedDay === item.day;
  return <button onClick={() => setSelectedDay(item.day)} style={{ minHeight: 108, borderRadius: 20, border: selected ? '2px solid #facc15' : '1px solid #253247', background: scoreColor(item.score), color: item.score >= 30 ? '#06111f' : '#eaf2ff', fontWeight: 900, cursor: 'pointer', padding: 10, textAlign: 'left', boxShadow: selected ? '0 0 0 4px rgba(250,204,21,.14)' : '0 12px 24px rgba(0,0,0,.14)' }} title={`Day ${item.day}: ${item.score}% ${item.status}`}>
    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}><b>Day {item.day}</b><small style={{ color: 'inherit' }}>{item.score}%</small></span>
    <small style={{ color: 'inherit', display: 'block', opacity: .86, margin: '6px 0' }}>{scoreTone(item.score)}</small>
    <small style={{ color: 'inherit', display: 'block', opacity: .78 }}>{route.phase.replace('Week ', 'W')}</small>
  </button>;
}

function ProfessionalLearningCalendar({ selectedDay, setSelectedDay }) {
  const [filter, setFilter] = React.useState('All');
  const [query, setQuery] = React.useState('');
  const todayDay = getTodaySprintDay();
  const scores = getAllDayScores();
  const filtered = scores.filter(item => {
    const tone = scoreTone(item.score);
    const routeText = `${item.record.route.phase} ${item.record.route.salesforce} ${item.record.route.dsa} ${item.record.route.systemDesign}`.toLowerCase();
    const matchesFilter = filter === 'All' || tone === filter;
    const matchesQuery = !query.trim() || routeText.includes(query.toLowerCase()) || String(item.day) === query.trim();
    return matchesFilter && matchesQuery;
  });
  const avg = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / Math.max(scores.length, 1));
  return <Card title="Professional Learning Calendar" subtitle="45-day execution calendar with filters, search, day status, score and today navigation.">
    <div className="grid3">
      <div className="stat"><p>Average Score</p><b>{avg}%</b><small>Across 45 days</small></div>
      <div className="stat"><p>Today Sprint Day</p><b>Day {todayDay}</b><small>Based on start date</small></div>
      <div className="stat"><p>Selected Day</p><b>Day {selectedDay}</b><small>{scoreTone(getDayScore(selectedDay).score)}</small></div>
    </div>
    <div className="row" style={{ marginTop: 16 }}>
      <button className="btn cyan" onClick={() => setSelectedDay(todayDay)}>Today</button>
      <button className="btn ghost" onClick={() => setSelectedDay(getSafeDay(selectedDay - 1))}>Previous</button>
      <button className="btn ghost" onClick={() => setSelectedDay(getSafeDay(selectedDay + 1))}>Next</button>
      <input style={{ maxWidth: 220 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search day/topic..." />
      <select style={{ maxWidth: 190 }} value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>Completed</option><option>Good</option><option>Partial</option><option>Started</option><option>Missed</option></select>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(112px,1fr))', gap: 12, marginTop: 16 }}>
      {filtered.map(item => <CalendarCell key={item.day} item={item} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />)}
    </div>
    {!filtered.length && <p className="hint">No days found for this filter/search.</p>}
    <div className="row" style={{ marginTop: 14 }}><span className="pill">Green = Completed</span><span className="pill">Blue = Good</span><span className="pill">Orange = Partial</span><span className="pill">Red/Dark = Missed</span><span className="pill">Gold border = selected</span></div>
  </Card>;
}

function DayEditor({ day, onChange }) {
  const [record, setRecord] = React.useState(() => getDayRecord(day));
  const [saved, setSaved] = React.useState('');
  React.useEffect(() => { setRecord(getDayRecord(day)); setSaved(''); }, [day]);
  const score = getDayScore(day);
  const route = record.route;
  const updateRecord = patch => {
    saveExecutionDay(day, patch);
    setRecord(getDayRecord(day));
    setSaved(`Saved Day ${day} at ${new Date().toLocaleTimeString()}`);
    onChange?.();
  };
  const toggleBlock = key => updateRecord({ checklist: { ...(record.checklist || {}), [key]: !record.checklist?.[key] } });
  const markAllDone = () => updateRecord({ checklist: Object.fromEntries(EXECUTION_BLOCKS.map(block => [block.key, true])), status: 'Completed' });
  const resetDay = () => updateRecord({ checklist: {}, status: 'Not Started', gapReason: '', recoveryPlan: '', notes: '' });
  const autoRecovery = () => {
    const pending = EXECUTION_BLOCKS.filter(block => !record.checklist?.[block.key]).map(block => block.label).join(', ');
    updateRecord({ status: 'Recovered', recoveryPlan: pending ? `Recovery plan: complete pending blocks first tomorrow — ${pending}. Start with DSA/System Design if pending.` : 'All blocks done. Revise saved notes and prepare mock interview answer.' });
  };
  return <Card title={`Day ${day}/${ROADMAP_DAYS} Professional Planner`} subtitle={`${route.phase} • Target 8 hours • Auto-saved offline`}>
    <div className="grid2">
      <div>
        <div className="scoreMini" style={{ width: '100%', marginBottom: 14 }}><b>{score.score}%</b><Progress value={score.score}/><small>{score.status} • {score.completed}/{score.total} blocks done</small></div>
        <div className="notificationStack">
          <div><b>SF</b><span><strong>Salesforce:</strong> {route.salesforce}</span></div>
          <div><b>DSA</b><span><strong>DSA 1h:</strong> {route.dsa}</span></div>
          <div><b>SD</b><span><strong>System Design 1h:</strong> {route.systemDesign}</span></div>
          <div><b>PR</b><span><strong>Project:</strong> {route.projectTask}</span></div>
          <div><b>IN</b><span><strong>Interview:</strong> {route.interviewTask}</span></div>
        </div>
      </div>
      <div className="taskGrid">
        {EXECUTION_BLOCKS.map(block => <button key={block.key} className={record.checklist?.[block.key] ? 'taskDone taskCard' : 'taskCard'} onClick={() => toggleBlock(block.key)}>
          <b>{block.label}</b><span>{block.time} • {block.points} pts</span><small>{record.checklist?.[block.key] ? 'Completed' : 'Click to complete'}</small>
        </button>)}
      </div>
    </div>
    <div className="row" style={{ marginTop: 16 }}><button className="btn cyan" onClick={markAllDone}>Mark All Done</button><button className="btn ghost" onClick={autoRecovery}>Generate Recovery</button><button className="btn danger" onClick={resetDay}>Reset Day</button>{saved && <span className="pill">{saved}</span>}</div>
    <div className="grid2" style={{ marginTop: 16 }}>
      <label className="field"><span>Status</span><select value={record.status || scoreTone(score.score)} onChange={e => updateRecord({ status: e.target.value })}><option>Not Started</option><option>In Progress</option><option>Completed</option><option>Missed</option><option>Recovered</option></select></label>
      <label className="field"><span>Gap Reason</span><input value={record.gapReason || ''} onChange={e => updateRecord({ gapReason: e.target.value })} placeholder="Why was this day missed or partial?" /></label>
    </div>
    <label className="field"><span>Recovery Plan</span><textarea value={record.recoveryPlan || ''} onChange={e => updateRecord({ recoveryPlan: e.target.value })} placeholder="Example: Tomorrow first 30 minutes DSA recovery + project proof." /></label>
    <label className="field"><span>Daily Notes / Proof</span><textarea value={record.notes || ''} onChange={e => updateRecord({ notes: e.target.value })} placeholder="What did you learn, build, solve, and save today?" /></label>
  </Card>;
}

function WeeklyReview({ selectedDay }) {
  const startDay = Math.max(1, Math.min(ROADMAP_DAYS, selectedDay - ((selectedDay - 1) % 7)));
  const summary = getWeeklySummary(startDay);
  return <Card title="Weekly Review Report" subtitle={`Days ${summary.startDay}-${summary.endDay} performance summary.`} action={<button className="btn small cyan" onClick={() => exportWeeklyReport(startDay)}>Export Report</button>}>
    <div className="grid3"><div className="stat"><p>Average</p><b>{summary.avg}%</b><small>Weekly score</small></div><div className="stat"><p>Completed</p><b>{summary.completed}</b><small>Strong days</small></div><div className="stat"><p>Missed</p><b>{summary.missed}</b><small>Recovery needed</small></div></div>
    <div className="notificationStack" style={{ marginTop: 12 }}>{summary.rows.map(row => <div key={row.day}><b>D{row.day}</b><span>Score {row.score}% • {row.status}</span></div>)}</div>
  </Card>;
}

function StreakAndRecovery() {
  const scores = getAllDayScores();
  const streak = getCurrentStreak();
  const missed = scores.filter(x => x.score === 0).slice(0, 5);
  const weak = scores.filter(x => x.score > 0 && x.score < 55).slice(0, 5);
  return <Card title="Streak + Recovery System" subtitle="Consistency badges and missed-day recovery queue.">
    <div className="grid3"><div className="stat"><p>Current Streak</p><b>{streak}</b><small>Good/completed days</small></div><div className="stat"><p>Recovery Queue</p><b>{missed.length}</b><small>Missed days shown</small></div><div className="stat"><p>Weak Days</p><b>{weak.length}</b><small>Partial days shown</small></div></div>
    <div className="grid2" style={{ marginTop: 14 }}><div className="notificationStack">{missed.length ? missed.map(x => <div key={x.day}><b>D{x.day}</b><span>Missed. Add gap reason and recovery plan.</span></div>) : <div><b>OK</b><span>No missed day in recovery queue.</span></div>}</div><div className="notificationStack">{weak.length ? weak.map(x => <div key={x.day}><b>D{x.day}</b><span>Partial score {x.score}%. Complete pending blocks.</span></div>) : <div><b>OK</b><span>No weak day in current queue.</span></div>}</div></div>
  </Card>;
}

export function DailyExecutionOS() {
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [refresh, setRefresh] = React.useState(0);
  const safeDay = getSafeDay(selectedDay);
  return <Layout><Page data-refresh={refresh}>
    <Hero title="Professional Learning Calendar" subtitle="Advanced 45-day calendar, day planner, proof scoring, filters, streak, recovery plan and weekly report for your 8-hour routine.">
      <div className="scoreMini"><b>Day {safeDay}/{ROADMAP_DAYS}</b><Progress value={getDayScore(safeDay).score}/><small>{getDayScore(safeDay).status}</small></div>
    </Hero>
    <div className="row" style={{ marginBottom: 16 }}><Link className="btn ghost" to="/dashboard">Home Guide</Link><Link className="btn ghost" to="/mentor-route">45-Day Route</Link><Link className="btn ghost" to="/time-tracker">Time Tracker</Link><Link className="btn ghost" to="/backup">Backup</Link></div>
    <ProfessionalLearningCalendar selectedDay={safeDay} setSelectedDay={setSelectedDay} />
    <DayEditor day={safeDay} onChange={() => setRefresh(x => x + 1)} />
    <div className="grid2"><WeeklyReview selectedDay={safeDay} /><StreakAndRecovery /></div>
  </Page></Layout>;
}
