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

function statusText(score) {
  if (score >= 85) return 'Completed';
  if (score >= 55) return 'Good';
  if (score >= 30) return 'Partial';
  if (score > 0) return 'Started';
  return 'Missed';
}

function DayEditor({ day, onChange }) {
  const [record, setRecord] = React.useState(() => getDayRecord(day));
  React.useEffect(() => setRecord(getDayRecord(day)), [day]);
  const score = getDayScore(day);
  const updateRecord = patch => {
    const next = saveExecutionDay(day, patch);
    setRecord(getDayRecord(day));
    onChange?.(next);
  };
  const toggleBlock = key => {
    updateRecord({ checklist: { ...(record.checklist || {}), [key]: !record.checklist?.[key] } });
  };
  const route = record.route;
  return <Card title={`Day ${day}/${ROADMAP_DAYS} Execution Planner`} subtitle={`${route.phase} • Target 8 hours`}>
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
    <div className="grid2" style={{ marginTop: 16 }}>
      <label className="field"><span>Status</span><select value={record.status || statusText(score.score)} onChange={e => updateRecord({ status: e.target.value })}><option>Not Started</option><option>In Progress</option><option>Completed</option><option>Missed</option><option>Recovered</option></select></label>
      <label className="field"><span>Gap Reason</span><input value={record.gapReason || ''} onChange={e => updateRecord({ gapReason: e.target.value })} placeholder="Why was this day missed or partial?" /></label>
    </div>
    <label className="field"><span>Recovery Plan</span><textarea value={record.recoveryPlan || ''} onChange={e => updateRecord({ recoveryPlan: e.target.value })} placeholder="Example: Tomorrow first 30 minutes DSA recovery + project proof." /></label>
    <label className="field"><span>Daily Notes / Proof</span><textarea value={record.notes || ''} onChange={e => updateRecord({ notes: e.target.value })} placeholder="What did you learn, build, solve, and save today?" /></label>
  </Card>;
}

function ProofMap({ selectedDay, setSelectedDay }) {
  const scores = getAllDayScores();
  const completed = scores.filter(x => x.score >= 85).length;
  const good = scores.filter(x => x.score >= 55 && x.score < 85).length;
  const partial = scores.filter(x => x.score > 0 && x.score < 55).length;
  const missed = scores.filter(x => x.score === 0).length;
  return <Card title="Advanced Learning Proof Map" subtitle="Score-based 45-day heatmap with clickable day details.">
    <div className="statsGrid" style={{ gridTemplateColumns: 'repeat(4,minmax(0,1fr))' }}>
      <div className="stat"><p>Completed</p><b>{completed}</b><small>85-100%</small></div>
      <div className="stat"><p>Good</p><b>{good}</b><small>55-84%</small></div>
      <div className="stat"><p>Partial</p><b>{partial}</b><small>1-54%</small></div>
      <div className="stat"><p>Missed</p><b>{missed}</b><small>0%</small></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(78px,1fr))', gap: 10, marginTop: 16 }}>
      {scores.map(item => <button key={item.day} onClick={() => setSelectedDay(item.day)} style={{ minHeight: 72, borderRadius: 18, border: selectedDay === item.day ? '2px solid #facc15' : '1px solid #253247', background: scoreColor(item.score), color: item.score >= 30 ? '#06111f' : '#eaf2ff', fontWeight: 1000, cursor: 'pointer' }} title={`Day ${item.day}: ${item.score}% ${item.status}`}>
        <span style={{ display: 'block' }}>Day {item.day}</span><small style={{ color: 'inherit' }}>{item.score}%</small>
      </button>)}
    </div>
    <div className="row" style={{ marginTop: 14 }}><span className="pill">Green = Completed</span><span className="pill">Blue = Good</span><span className="pill">Orange = Partial</span><span className="pill">Red/Dark = Missed</span><span className="pill">Gold border = selected</span></div>
  </Card>;
}

function WeeklyReview({ selectedDay }) {
  const startDay = Math.max(1, Math.min(ROADMAP_DAYS, selectedDay - ((selectedDay - 1) % 7)));
  const summary = getWeeklySummary(startDay);
  return <Card title="Weekly Review Report" subtitle={`Days ${summary.startDay}-${summary.endDay} performance summary.`} action={<button className="btn small cyan" onClick={() => exportWeeklyReport(startDay)}>Export Report</button>}>
    <div className="grid3">
      <div className="stat"><p>Average</p><b>{summary.avg}%</b><small>Weekly score</small></div>
      <div className="stat"><p>Completed</p><b>{summary.completed}</b><small>Strong days</small></div>
      <div className="stat"><p>Missed</p><b>{summary.missed}</b><small>Recovery needed</small></div>
    </div>
    <div className="notificationStack" style={{ marginTop: 12 }}>{summary.rows.map(row => <div key={row.day}><b>D{row.day}</b><span>Score {row.score}% • {row.status}</span></div>)}</div>
  </Card>;
}

function StreakAndRecovery() {
  const scores = getAllDayScores();
  const streak = getCurrentStreak();
  const missed = scores.filter(x => x.score === 0).slice(0, 5);
  const weak = scores.filter(x => x.score > 0 && x.score < 55).slice(0, 5);
  return <Card title="Streak + Recovery System" subtitle="Consistency badges and missed-day recovery queue.">
    <div className="grid3">
      <div className="stat"><p>Current Streak</p><b>{streak}</b><small>Good/completed days</small></div>
      <div className="stat"><p>Recovery Queue</p><b>{missed.length}</b><small>Missed days shown</small></div>
      <div className="stat"><p>Weak Days</p><b>{weak.length}</b><small>Partial days shown</small></div>
    </div>
    <div className="grid2" style={{ marginTop: 14 }}>
      <div className="notificationStack">{missed.length ? missed.map(x => <div key={x.day}><b>D{x.day}</b><span>Missed. Add gap reason and recovery plan.</span></div>) : <div><b>OK</b><span>No missed day in recovery queue.</span></div>}</div>
      <div className="notificationStack">{weak.length ? weak.map(x => <div key={x.day}><b>D{x.day}</b><span>Partial score {x.score}%. Complete pending blocks.</span></div>) : <div><b>OK</b><span>No weak day in current queue.</span></div>}</div>
    </div>
  </Card>;
}

export function DailyExecutionOS() {
  const [selectedDay, setSelectedDay] = React.useState(() => Number(localStorage.getItem('sfdc_mentor_complete_mentorDay')?.replace(/\D/g, '')) || 1);
  const [refresh, setRefresh] = React.useState(0);
  const safeDay = Math.max(1, Math.min(ROADMAP_DAYS, Number(selectedDay) || 1));
  const onChange = () => setRefresh(x => x + 1);
  return <Layout><Page data-refresh={refresh}>
    <Hero title="Daily Execution OS" subtitle="Advanced 45-day calendar, proof map, scoring, streak, recovery plan and weekly report for your 8-hour routine.">
      <div className="scoreMini"><b>Day {safeDay}/{ROADMAP_DAYS}</b><Progress value={getDayScore(safeDay).score}/><small>{getDayScore(safeDay).status}</small></div>
    </Hero>
    <div className="row" style={{ marginBottom: 16 }}><Link className="btn ghost" to="/dashboard">Home Guide</Link><Link className="btn ghost" to="/mentor-route">45-Day Route</Link><Link className="btn ghost" to="/time-tracker">Time Tracker</Link><Link className="btn ghost" to="/backup">Backup</Link></div>
    <ProofMap selectedDay={safeDay} setSelectedDay={setSelectedDay} />
    <DayEditor day={safeDay} onChange={onChange} />
    <div className="grid2"><WeeklyReview selectedDay={safeDay} /><StreakAndRecovery /></div>
  </Page></Layout>;
}
