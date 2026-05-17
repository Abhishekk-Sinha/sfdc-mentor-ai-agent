const baseCompanies = [
  'Salesforce', 'MuleSoft', 'Tableau', 'Accenture', 'Deloitte', 'PwC', 'Capgemini', 'Cognizant', 'Infosys', 'TCS', 'Wipro', 'HCLTech', 'Tech Mahindra', 'LTIMindtree', 'Persistent Systems', 'Coforge', 'Mphasis', 'Hexaware', 'Zensar', 'Birlasoft',
  'Cloud Analogy', 'Codleo Consulting', 'Cyntexa', 'Ksolves', '360 Degree Cloud', 'Algoworks', 'Girikon', 'Cynoteck', 'Dazeworks', 'AnavClouds', 'FEXLE', 'SaaSnic', 'Grazitti', 'Slalom', 'Silverline', 'Coastal Cloud', 'ListEngage', 'Jade Global', 'CloudMasonry', 'NeuraFlash'
];

export const companies = Array.from({ length: 800 }, (_, i) => ({
  id: i + 1,
  name: baseCompanies[i % baseCompanies.length] + (i >= baseCompanies.length ? ` Target ${Math.floor(i / baseCompanies.length) + 1}` : ''),
  website: `https://www.google.com/search?q=${encodeURIComponent(baseCompanies[i % baseCompanies.length] + ' Salesforce Developer jobs')}`,
  status: 'Saved',
  saved: false,
  applied: false,
  notes: 'Applied link / recruiter / follow-up note',
  priority: ['High', 'Medium', 'Low'][i % 3],
  followUp: '',
}));

export const jobPortals = [
  ['LinkedIn', 'https://www.linkedin.com/jobs/search/?keywords=Salesforce%20Developer%20Apex%20LWC%20Flow%20REST%20API&location=India'],
  ['Naukri', 'https://www.naukri.com/salesforce-developer-apex-lwc-flow-jobs'],
  ['Foundit', 'https://www.foundit.in/srp/results?query=salesforce%20developer%20apex%20lwc'],
  ['Instahyre', 'https://www.instahyre.com/search-jobs/?q=salesforce%20developer'],
  ['Glassdoor', 'https://www.glassdoor.co.in/Job/india-salesforce-developer-jobs-SRCH_IL.0,5_IN115_KO6,26.htm'],
  ['Cutshort', 'https://cutshort.io/jobs/salesforce-developer-jobs'],
  ['Indeed', 'https://in.indeed.com/jobs?q=Salesforce+Developer+Apex+LWC&l=India'],
  ['TimesJobs', 'https://www.timesjobs.com/candidate/job-search.html?txtKeywords=salesforce+developer+apex+lwc'],
  ['Upwork', 'https://www.upwork.com/nx/search/jobs/?q=salesforce%20developer%20apex%20lwc'],
  ['Apna', 'https://apna.co/jobs/salesforce_developer-jobs'],
  ['WorkIndia', 'https://www.workindia.in/salesforce-developer-jobs/'],
  ['HireMee', 'https://hiremee.co.in/'],
];
