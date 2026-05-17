import { dsaTopics, salesforceAdminTopics, salesforceDeveloperTopics, systemDesignTopics } from './topics';

export const roadmap90 = Array.from({ length: 90 }, (_, i) => {
  const day = i + 1;
  const phase = day <= 15 ? 'Admin Foundation' : day <= 30 ? 'Flow + Security' : day <= 45 ? 'Apex + SOQL' : day <= 60 ? 'LWC + Integration' : day <= 75 ? 'Projects + Interview' : 'Job Ready Sprint';
  return {
    day,
    phase,
    salesforce: day <= 30 ? salesforceAdminTopics[i % salesforceAdminTopics.length] : salesforceDeveloperTopics[i % salesforceDeveloperTopics.length],
    dsa: dsaTopics[i % dsaTopics.length],
    systemDesign: systemDesignTopics[i % systemDesignTopics.length],
    englishDay: day <= 90 ? day : 90,
    projectTask: day % 7 === 0 ? 'Sunday mini project from covered topics' : 'Build notes and one practical demo step',
    interviewTask: 'Answer 3 questions in STAR format and save one strong answer',
  };
});
