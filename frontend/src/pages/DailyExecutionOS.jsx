import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Hero, Layout, Page, Progress } from '../components/UI';
import { ROADMAP_DAYS } from '../data/roadmap';
import { EXECUTION_BLOCKS, exportWeeklyReport, getAllDayScores, getCurrentStreak, getDayRecord, getDayScore, getWeeklySummary, saveExecutionDay } from '../utils/dailyExecution';

function clampDay(day) {
  return Math.max(1, Math.min(ROADMAP_DAYS, Number(day) || 1));
}

function statusFromScore(score) {
  if (score >= 85) return 'Completed';
  if (score >= 55) return 'Good';
  if (score >= 30) return 'Partial';
  if (score > 0) return 'Started';
  return 'Missed';
}

function colorForScore(score) {
  if (score >= 85) return '#16a34a';
  if (score >= 55) return '#2563eb';
  if (score >= 30) return '#f59e0b';
  if (score > 0) return '#ef4444';
  return '#111827';
}

function getTodayDay() {
  try {
    const raw = localStorage.getItem('sfdc_mentor_complete_learningStartDate');
    if (!raw) return 1;
    const start = new Date(JSON.parse(raw));
    const today = new Date();
    const diff = Math.floor((today.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / 86400000) + 1;
    return clampDay(diff);
  } catch {
    return 1;
  }
}

function HelpFlow() {
  return <Card title="How this page works" subtitle="Simple actual flow. Follow left to right.">
    <div className="grid3">
      <div className="stat"><p>Step 1</p><b>Select Day</b><small>Click Day 1 to Day 45 in Learning Calendar.</small></div>
      <div className="stat"><p>Step 2</p><b>Tick Tasks</b><small>Complete 8-hour checklist for that selected day.</small></div>
      <div className="stat"><p>Step 3</p><b>Proof Map Updates</b><small>Score and color update automatically.</small></div>
    </div>
  </Card>;
}

function LearningCalendar({ selectedDay, setSelectedDay, refresh }) {
  const todayDay = getTodayDay();
  const rows = getAllDayScores();
  const selectedScore = getDayScore(selectedDay);
  return <Card title="Learning Calendar" subtitle="Click any day. The selected day opens below with its exact routine.">
    <div className="row" style={{ marginBottom: 14 }}>
      <button className="btn cyan" onClick={() => setSelectedDay(todayDay)}>Go to Today</button>
      <button className="btn ghost" onClick={() => setSelectedDay(clampDay(selectedDay - 1))}>Previous Day</button>
      <button className="btn ghost" onClick={() => setSelectedDay(clampDay(selectedDay + 1))}>Next Day</button>
      <span className="pill">Selected: Day {selectedDay}</span>
      <span className="pill">Score: {selectedScore.score}%</span>
      <span className="pill">Status: {statusFromScore(selectedScore.score)}</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(92px,1fr))', gap: 10 }} data-refresh={refresh}>
      {rows.map(row => {
        const isSelected = row.day === selectedDay;
        const isToday = row.day === todayDay;
        return <button key={row.day} onClick={() => setSelectedDay(row.day)} style={{ minHeight: 86, borderRadius: 16, border: isSelected ? '3px solid #facc15' : isToday ? '2px solid #38bdf8' : '1px solid #334155', background: colorForScore(row.score), color: '#fff', cursor: 'pointer', padding: 10, textAlign: 'center', fontWeight: 900 }}>
          <span style={{ display: 'block' }}>Day {row.day}</span>
          <b>{row.score}%</b>
          <small style={{ display: 'block', color: '#fff', opacity: .9 }}>{statusFromScore(row.score)}</small>
          {isToday && <small style={{ display: 'block', color: '#fff' }}>Today</small>}
        </button>;
      })}
    </div>
  </Card>;
}

function SelectedDayRoutine({ day, onSaved }) {
  const [record, setRecord] = React.useState(() => getDayRecord(day));
  const [saved, setSaved] = React.useState('');
  React.useEffect(() => { setRecord(getDayRecord(day)); setSaved(''); }, [day]);
  const score = getDayScore(day);
  const route = record.route;
  const save = patch => {
    saveExecutionDay(day, patch);
    setRecord(getDayRecord(day));
    setSaved(`Saved Day ${day}`);
    onSaved?.();
  };
  const toggle = key => save({ checklist: { ...(record.checklist || {}), [key]: !record.checklist?.[key] } });
  const pending = EXECUTION_BLOCKS.filter(block => !record.checklist?.[block.key]);
  const markAllDone = () => save({ checklist: Object.fromEntries(EXECUTION_BLOCKS.map(block => [block.key, true])), status: 'Completed' });
  const resetDay = () => save({ checklist: {}, status: 'Not Started', gapReason: '', recoveryPlan: '', notes: '' });
  const generateRecovery = () => save({ status: 'Recovered', recoveryPlan: pending.length ? `Tomorrow recovery: first complete ${pending.map(p => p.label).join(', ')}. Start with DSA/System Design if pending.` : 'All tasks completed. Use tomorrow for revision and mock interview.' });

  return <Card title={`Day ${day} Routine`} subtitle="Tick what you actually completed. Score changes automatically.">
    <div className="grid2">
      <div>
        <div className="scoreMini" style={{ width: '100%', marginBottom: 14 }}>
          <b>{score.score}%</b><Progress value={score.score}/><small>{statusFromScore(score.score)} • {score.completed}/{score.total} completed</small>
        </div>
        <div className="notificationStack">
          <div><b>SF</b><span><strong>Salesforce:</strong> {route.salesforce}</span></div>
          <div><b>DSA</b><span><strong>DSA 1 Hour:</strong> {route.dsa}</span></div>
          <div><b>SD</b><span><strong>System Design 1 Hour:</strong> {route.systemDesign}</span></div>
          <div><b>PR</b><span><strong>Project:</strong> {route.projectTask}</span></div>
          <div><b>IN</b><span><strong>Interview:</strong> {route.interviewTask}</span></div>
        </div>
      </div>
      <div className="taskGrid">
        {EXECUTION_BLOCKS.map(block => <button key={block.key} className={record.checklist?.[block.key] ? 'taskDone taskCard' : 'taskCard'} onClick={() => toggle(block.key)}>
          <b>{record.checklist?.[block.key] ? '✓ ' : ''}{block.label}</b>
          <span>{block.time} • {block.points} points</span>
          <small>{record.checklist?.[block.key] ? 'Completed' : 'Pending - click to complete'}</small>
        </button>)}
      </div>
    </div>
    <div className="row" style={{ marginTop: 16 }}>
      <button className="btn cyan" onClick={markAllDone}>Mark All Done</button>
      <button className="btn ghost" onClick={generateRecovery}>Generate Recovery Plan</button>
      <button className="btn danger" onClick={resetDay}>Reset This Day</button>
      {saved && <span className="pill">{saved}</span>}
    </div>
    <div className="grid2" style={{ marginTop: 16 }}>
      <label className="field"><span>Day Status</span><select value={record.status || statusFromScore(score.score)} onChange={e => save({ status: e.target.value })}><option>Not Started</option><option>In Progress</option><option>Completed</option><option>Missed</option><option>Recovered</option></select></label>
      <label className="field"><span>Gap Reason</span><input value={record.gapReason || ''} onChange={e => save({ gapReason: e.target.value })} placeholder="Why missed or partial?" /></label>
    </div>
    <label className="field"><span>Recovery Plan</span><textarea value={record.recoveryPlan || ''} onChange={e => save({ recoveryPlan: e.target.value })} placeholder="Write recovery plan here..." /></label>
    <label className="field"><span>Daily Notes / Proof</span><textarea value={record.notes || ''} onChange={e => save({ notes: e.target.value })} placeholder="Write what you learned, solved, built and saved today..." /></label>
  </Card>;
}

function LearningProofMap({ selectedDay, refresh }) {
  const rows = getAllDayScores();
  const completed = rows.filter(x => x.score >= 85).length;
  const good = rows.filter(x => x.score >= 55 && x.score < 85).length;
  const partial = rows.filter(x => x.score > 0 && x.score < 55).length;
  const missed = rows.filter(x => x.score === 0).length;
  return <Card title="Learning Proof Map" subtitle="This is the result map. It updates from the checklist above.">
    <div className="grid3">
      <div className="stat"><p>Completed</p><b>{completed}</b><small>85-100%</small></div>
      <div className="stat"><p>Good</p><b>{good}</b><small>55-84%</small></div>
      <div className="stat"><p>Partial / Started</p><b>{partial}</b><small>1-54%</small></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(48px,1fr))', gap: 8, marginTop: 16 }} data-refresh={refresh}>
      {rows.map(row => <div key={row.day} title={`Day ${row.day}: ${row.score}% ${statusFromScore(row.score)}`} style={{ height: 44, borderRadius: 12, background: colorForScore(row.score), border: row.day === selectedDay ? '3px solid #facc15' : '1px solid #1e293b', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900 }}>{row.day}</div>)}
    </div>
    <div className="row" style={{ marginTop: 14 }}><span className="pill">Green = Completed</span><span className="pill">Blue = Good</span><span className="pill">Orange = Partial</span><span className="pill">Red = Started</span><span className="pill">Black = Missed</span><span className="pill">Yellow border = selected day</span></div>
  </Card>;
}

function WeeklyReview({ selectedDay }) {
  const startDay = Math.max(1, Math.min(ROADMAP_DAYS, selectedDay - ((selectedDay - 1) % 7)));
  const summary = getWeeklySummary(startDay);
  return <Card title="Weekly Review" subtitle={`Days ${summary.startDay}-${summary.endDay}`} action={<button className="btn small cyan" onClick={() => exportWeeklyReport(startDay)}>Export</button>}>
    <div className="grid3"><div className="stat"><p>Average</p><b>{summary.avg}%</b><small>Weekly score</small></div><div className="stat"><p>Completed</p><b>{summary.completed}</b><small>Strong days</small></div><div className="stat"><p>Missed</p><b>{summary.missed}</b><small>Need recovery</small></div></div>
    <div className="notificationStack" style={{ marginTop: 12 }}>{summary.rows.map(row => <div key={row.day}><b>D{row.day}</b><span>{row.score}% • {statusFromScore(row.score)}</span></div>)}</div>
  </Card>;
}

function StreakCard() {
  return <Card title="Streak + Simple Meaning" subtitle="Easy reading for daily progress.">
    <div className="grid3"><div className="stat"><p>Current Streak</p><b>{getCurrentStreak()}</b><small>Good/completed days</small></div><div className="stat"><p>Daily Target</p><b>8h</b><small>Includes DSA + System Design</small></div><div className="stat"><p>Proof Rule</p><b>Tick</b><small>Checklist creates map score</small></div></div>
    <p className="hint">Calendar is for selecting the day. Routine is for ticking real work. Proof Map is only the visual result.</p>
  </Card>;
}

export function DailyExecutionOS() {
  const [selectedDay, setSelectedDay] = React.useState(1);
  const [refresh, setRefresh] = React.useState(0);
  const safeDay = clampDay(selectedDay);
  const selectedScore = getDayScore(safeDay);
  const refreshPage = () => setRefresh(x => x + 1);
  return <Layout><Page data-refresh={refresh}>
    <Hero title="Learning Calendar + Proof Map" subtitle="Simple actual working system: select day, tick routine, see proof map update.">
      <div className="scoreMini"><b>Day {safeDay}</b><Progress value={selectedScore.score}/><small>{selectedScore.score}% • {statusFromScore(selectedScore.score)}</small></div>
    </Hero>
    <div className="row" style={{ marginBottom: 16 }}><Link className="btn ghost" to="/dashboard">Home Guide</Link><Link className="btn ghost" to="/mentor-route">45-Day Route</Link><Link className="btn ghost" to="/time-tracker">Time Tracker</Link><Link className="btn ghost" to="/backup">Backup</Link></div>
    <HelpFlow />
    <LearningCalendar selectedDay={safeDay} setSelectedDay={setSelectedDay} refresh={refresh} />
    <SelectedDayRoutine day={safeDay} onSaved={refreshPage} />
    <LearningProofMap selectedDay={safeDay} refresh={refresh} />
    <div className="grid2"><WeeklyReview selectedDay={safeDay} /><StreakCard /></div>
  </Page></Layout>;
}
