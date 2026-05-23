// Central navigation configuration for the full app.
// Edit this file when you want to rename sidebar items, change icons or update quick actions.

export const NAV_GROUPS = [
  {
    title: 'Start Here',
    items: [{ label: 'Home Guide', to: '/dashboard', icon: '🏠' }],
  },
  {
    title: 'Daily Study',
    items: [
      { label: 'AI Mentor', to: '/ai-mentor', icon: '🤖' },
      { label: 'Daily Route', to: '/mentor-route', icon: '🛣️' },
      { label: 'Focus Practice', to: '/focus', icon: '✨' },
      { label: 'Learning Coach', to: '/learning-coach', icon: '📘' },
    ],
  },
  {
    title: 'Practice',
    items: [
      { label: 'Question Bank', to: '/practice', icon: '❓' },
      { label: 'Scenario Practice', to: '/scenarios', icon: '🧩' },
      { label: 'Use Cases', to: '/use-cases', icon: '🏗️' },
      { label: 'Weekly Tests', to: '/weekly-tests', icon: '🧪' },
      { label: 'English Practice', to: '/english', icon: '🗣️' },
    ],
  },
  {
    title: 'Career Prep',
    items: [
      { label: 'Interview Room', to: '/interview', icon: '🎤' },
      { label: 'My Projects', to: '/projects', icon: '🚀' },
      { label: 'Job Tracker', to: '/job-tracker', icon: '💼' },
      { label: 'JD Matcher', to: '/jd-matcher', icon: '🧾' },
      { label: 'Resume Optimizer', to: '/resume', icon: '📄' },
    ],
  },
  {
    title: 'Data & Tools',
    items: [
      { label: '24h Tracker', to: '/time-tracker', icon: '⏱️' },
      { label: 'Notes', to: '/notes', icon: '📝' },
      { label: 'Documents', to: '/documents', icon: '📁' },
      { label: 'Doubts', to: '/doubts', icon: '❔' },
      { label: 'Portfolio Editor', to: '/portfolio-manager', icon: '🖼️' },
      { label: 'All Tools', to: '/more-tools', icon: '🧰' },
      { label: 'Backup', to: '/backup', icon: '💾' },
    ],
  },
];

export const QUICK_COMMANDS = [
  { label: 'Open Question Bank', to: '/practice', icon: '❓', kind: 'Command' },
  { label: 'Start 45m Salesforce Sprint', to: '/time-tracker', icon: '⚡', kind: 'Command' },
  { label: 'Find Weak Topics', to: '/practice', icon: '⚠️', kind: 'Command' },
  { label: 'Take Weekly Test', to: '/weekly-tests', icon: '🧪', kind: 'Command' },
  { label: 'Add Job Follow-up', to: '/job-tracker', icon: '💼', kind: 'Command' },
  { label: 'Ask AI Mentor', to: '/ai-mentor', icon: '🤖', kind: 'Command' },
];

export const LOCAL_SEARCH_ROUTES = [
  { words: ['automation', 'autotodayplan', 'autoweakrevisionqueue', 'autosundaytest'], to: '/dashboard', icon: '⚙️', group: 'Silent Automation Data' },
  { words: ['note'], to: '/notes', icon: '📝', group: 'Notes' },
  { words: ['doubt'], to: '/doubts', icon: '❔', group: 'Doubts' },
  { words: ['job', 'compan', 'applied'], to: '/job-tracker', icon: '💼', group: 'Job Tracker' },
  { words: ['time', 'hour', 'task', 'block'], to: '/time-tracker', icon: '⏱️', group: '24h Tracker' },
  { words: ['answer', 'focus', 'weak', 'strong'], to: '/focus', icon: '✨', group: 'Answers' },
  { words: ['interview', 'mock'], to: '/interview', icon: '🎤', group: 'Interview' },
  { words: ['weekly', 'test'], to: '/weekly-tests', icon: '🧪', group: 'Weekly Test' },
  { words: ['project'], to: '/projects', icon: '🚀', group: 'Projects' },
  { words: ['resume', 'cv', 'ats'], to: '/resume', icon: '📄', group: 'Resume' },
  { words: ['mentor', 'chat', 'ai'], to: '/ai-mentor', icon: '🤖', group: 'AI Mentor' },
  { words: ['portfolio', 'photo', 'skill'], to: '/portfolio-manager', icon: '🖼️', group: 'Portfolio' },
  { words: ['document', 'file', 'upload'], to: '/documents', icon: '📁', group: 'Documents' },
  { words: ['journal', 'learning'], to: '/journal', icon: '📓', group: 'Journal' },
  { words: ['cert'], to: '/certifications', icon: '🏅', group: 'Certifications' },
  { words: ['dsa', 'system design', 'ai assistant', 'leetcode', 'salesforce admin', 'salesforce developer'], to: '/practice', icon: '❓', group: 'Question Bank' },
];

export const FLOATING_ACTIONS = [
  { label: 'Save Note', to: '/notes', icon: '📝' },
  { label: 'Add Doubt', to: '/doubts', icon: '❔' },
  { label: 'Question Bank', to: '/practice', icon: '❓' },
  { label: 'Ask Mentor', to: '/ai-mentor', icon: '🤖' },
  { label: 'Add Job', to: '/job-tracker', icon: '💼' },
];

export const MOBILE_NAV_ITEMS = [
  { icon: '🏠', to: '/dashboard', label: 'Home' },
  { icon: '❓', to: '/practice', label: 'Practice' },
  { icon: '✨', to: '/focus', label: 'Focus' },
  { icon: '💼', to: '/job-tracker', label: 'Jobs' },
  { icon: '🤖', to: '/ai-mentor', label: 'Mentor' },
];
