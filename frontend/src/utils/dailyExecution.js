import { ROADMAP_DAYS, roadmap90 } from '../data/roadmap';
import { readStore, writeStore, downloadText } from './storage';

export const EXECUTION_BLOCKS = [
  { key: 'salesforce', label: 'Salesforce Core', time: '1h 30m', points: 15 },
  { key: 'dsa', label: 'DSA 1 Hour', time: '1h', points: 15 },
  { key: 'systemDesign', label: 'System Design 1 Hour', time: '1h', points: 15 },
  { key: 'handsOn', label: 'Hands-on Build', time: '1h', points: 10 },
  { key: 'project', label: 'Project Proof', time: '1h', points: 15 },
  { key: 'questionBank', label: 'Question Bank', time: '1h', points: 10 },
  { key: 'interview', label: 'Interview Practice', time: '1h', points: 15 },
  { key: 'revision', label: 'Revision + Proof Map', time: '30m', points: 5 },
];

export function getExecutionStore() {
  return readStore('dailyExecutionOS', {});
}

export function saveExecutionDay(day, patch) {
  const all = getExecutionStore();
  const current = all[day] || {};
  const next = {
    ...all,
    [day]: {
      ...current,
      ...patch,
      updatedAt: new Date().toLocaleString(),
    },
  };
  writeStore('dailyExecutionOS', next);
  return next[day];
}

export function getRoadmapDay(day) {
  return roadmap90[(Math.max(1, Math.min(ROADMAP_DAYS, Number(day) || 1)) - 1) % roadmap90.length] || roadmap90[0];
}

export function getDayRecord(day) {
  const all = getExecutionStore();
  const route = getRoadmapDay(day);
  return {
    day,
    status: 'Not Started',
    gapReason: '',
    recoveryPlan: '',
    notes: '',
    checklist: {},
    ...all[day],
    route,
  };
}

export function getDayScore(day) {
  const record = getDayRecord(day);
  const score = EXECUTION_BLOCKS.reduce((sum, block) => sum + (record.checklist?.[block.key] ? block.points : 0), 0);
  const completed = EXECUTION_BLOCKS.filter(block => record.checklist?.[block.key]).length;
  const status = score >= 85 ? 'Completed' : score >= 55 ? 'Good' : score >= 30 ? 'Partial' : score > 0 ? 'Started' : 'Missed';
  return { score, completed, total: EXECUTION_BLOCKS.length, status };
}

export function getAllDayScores() {
  return Array.from({ length: ROADMAP_DAYS }, (_, i) => {
    const day = i + 1;
    return { day, ...getDayScore(day), record: getDayRecord(day) };
  });
}

export function getCurrentStreak() {
  const scores = getAllDayScores();
  let streak = 0;
  for (const item of scores) {
    if (item.score >= 55) streak += 1;
    else if (item.score === 0 && item.day > 1) break;
    else streak = 0;
  }
  return streak;
}

export function getWeeklySummary(startDay) {
  const days = Array.from({ length: 7 }, (_, i) => startDay + i).filter(day => day <= ROADMAP_DAYS);
  const rows = days.map(day => ({ day, ...getDayScore(day) }));
  const avg = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;
  return {
    startDay,
    endDay: days[days.length - 1] || startDay,
    rows,
    avg,
    completed: rows.filter(row => row.score >= 85).length,
    partial: rows.filter(row => row.score > 0 && row.score < 85).length,
    missed: rows.filter(row => row.score === 0).length,
  };
}

export function buildWeeklyReport(startDay = 1) {
  const summary = getWeeklySummary(startDay);
  const lines = [
    `45-Day Career OS Weekly Report`,
    `Days: ${summary.startDay}-${summary.endDay}`,
    `Average Score: ${summary.avg}%`,
    `Completed Days: ${summary.completed}`,
    `Partial Days: ${summary.partial}`,
    `Missed Days: ${summary.missed}`,
    '',
    'Day Details:',
    ...summary.rows.map(row => `Day ${row.day}: ${row.score}% | ${row.status}`),
    '',
    'Next Week Plan:',
    '1. Complete DSA 1 hour daily.',
    '2. Complete System Design 1 hour daily.',
    '3. Save one interview answer daily.',
    '4. Add project proof before closing the day.',
  ];
  return lines.join('\n');
}

export function exportWeeklyReport(startDay = 1) {
  downloadText(`career-os-week-${startDay}.txt`, buildWeeklyReport(startDay));
}
