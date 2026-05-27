import { dsaTopics, salesforceAdminTopics, salesforceDeveloperTopics, systemDesignTopics } from './topics';

export const ROADMAP_DAYS = 45;

const phases = day => {
  if (day <= 7) return 'Week 1: Salesforce Basic Foundation';
  if (day <= 15) return 'Week 2: Admin, Security and Flow';
  if (day <= 25) return 'Week 3: Apex, SOQL and Triggers';
  if (day <= 34) return 'Week 4: LWC and Integration';
  if (day <= 40) return 'Week 5: Full Project Build';
  return 'Final Sprint: Interview and Job Ready';
};

const projectTask = day => {
  if (day <= 7) return 'Build Doctor Patient data model: objects, fields, relationships and basic reports';
  if (day <= 15) return 'Add security model and Flow automation for appointment process';
  if (day <= 25) return 'Add Apex, SOQL, trigger handler and test class proof';
  if (day <= 34) return 'Build LWC screens and connect them with Apex data';
  if (day <= 40) return 'Polish complete Doctor Patient project for resume and interview explanation';
  return 'Finalize resume bullets, portfolio proof, mock interview and job tracker actions';
};

const interviewTask = day => {
  if (day <= 15) return 'Save one beginner-friendly Salesforce answer in 60-second format';
  if (day <= 25) return 'Save one Apex/SOQL/trigger scenario answer with project example';
  if (day <= 34) return 'Save one LWC/integration answer with implementation steps';
  if (day <= 40) return 'Save one Doctor Patient project answer in STAR format';
  return 'Do mock interview practice and improve one saved answer with metrics';
};

export const dailyEightHourRoutine = [
  { time: '1h 30m', block: 'Salesforce Core', detail: 'Concept learning + notes + Trailhead/docs' },
  { time: '1h 00m', block: 'DSA', detail: 'One pattern, one problem, time/space complexity' },
  { time: '1h 00m', block: 'System Design', detail: 'One concept, diagram thinking, trade-offs' },
  { time: '1h 00m', block: 'Hands-on Build', detail: 'Flow/Apex/LWC implementation in project' },
  { time: '1h 00m', block: 'Project Proof', detail: 'Doctor Patient feature, screenshot/note/output' },
  { time: '1h 00m', block: 'Question Bank', detail: '5 Salesforce questions + 1 saved answer' },
  { time: '1h 00m', block: 'Interview Practice', detail: 'One 60-second answer + STAR/project explanation' },
  { time: '0h 30m', block: 'Revision + Proof Map', detail: 'Weak/Strong mark, note, heatmap, backup' },
];

export const roadmap90 = Array.from({ length: ROADMAP_DAYS }, (_, i) => {
  const day = i + 1;
  const adminTopic = salesforceAdminTopics[i % salesforceAdminTopics.length];
  const devTopic = salesforceDeveloperTopics[i % salesforceDeveloperTopics.length];
  return {
    day,
    phase: phases(day),
    salesforce: day <= 15 ? adminTopic : devTopic,
    dsa: dsaTopics[i % dsaTopics.length],
    systemDesign: systemDesignTopics[i % systemDesignTopics.length],
    dsaDuration: '1 hour mandatory',
    systemDesignDuration: '1 hour mandatory',
    dailyHours: '8 hours',
    englishDay: day,
    projectTask: projectTask(day),
    interviewTask: interviewTask(day),
  };
});
