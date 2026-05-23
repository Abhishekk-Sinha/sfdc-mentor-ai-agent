// Dashboard configuration keeps labels, routes and card text in one place.
// This makes the Home Guide easy to update without touching dashboard logic.

export const DASHBOARD_HERO_ACTIONS = [
  { label: 'Start Practice', to: '/practice', className: 'btn cyan' },
  { label: 'Ask AI Mentor', to: '/ai-mentor', className: 'btn ghost' },
  { label: 'Interview Room', to: '/interview', className: 'btn ghost' },
];

export const QUICK_START_CARDS = [
  { icon: '❓', title: 'Question Bank', to: '/practice', text: 'Practice DSA, Salesforce and System Design.' },
  { icon: '🤖', title: 'AI Mentor', to: '/ai-mentor', text: 'Ask doubts and improve answers.' },
  { icon: '✨', title: 'Focus Practice', to: '/focus', text: 'Save answers and mark weak/strong.' },
  { icon: '💼', title: 'Job Tracker', to: '/job-tracker', text: 'Track applications and follow-ups.' },
];

export const PREMIUM_PATH_STEPS = [
  { number: '01', title: 'Practice', text: 'Solve one question set', to: '/practice' },
  { number: '02', title: 'Mentor', text: 'Clear one doubt', to: '/ai-mentor' },
  { number: '03', title: 'Proof', text: 'Save one strong answer', to: '/focus' },
  { number: '04', title: 'Career', text: 'Update job or interview prep', to: '/job-tracker' },
];

export const TOOL_GROUPS = [
  {
    title: 'Daily Study',
    items: [
      { label: 'AI Mentor', to: '/ai-mentor', icon: '🤖' },
      { label: 'Daily Route', to: '/mentor-route', icon: '🛣️' },
      { label: 'Learning Coach', to: '/learning-coach', icon: '📘' },
      { label: 'English Practice', to: '/english', icon: '🗣️' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { label: 'Question Bank', to: '/practice', icon: '❓' },
      { label: 'Scenario Practice', to: '/scenarios', icon: '🧩' },
      { label: 'Use Cases', to: '/use-cases', icon: '🏗️' },
      { label: 'Weekly Tests', to: '/weekly-tests', icon: '🧪' },
    ],
  },
  {
    title: 'Career Prep',
    items: [
      { label: 'Interview Room', to: '/interview', icon: '🎤' },
      { label: 'My Projects', to: '/projects', icon: '🚀' },
      { label: 'Resume Optimizer', to: '/resume', icon: '📄' },
      { label: 'JD Matcher', to: '/jd-matcher', icon: '🧾' },
    ],
  },
  {
    title: 'Track & Save',
    items: [
      { label: '24h Tracker', to: '/time-tracker', icon: '⏱️' },
      { label: 'Job Tracker', to: '/job-tracker', icon: '💼' },
      { label: 'Notes', to: '/notes', icon: '📝' },
      { label: 'Backup', to: '/backup', icon: '💾' },
    ],
  },
];
