const mncCompanies = [
  'Salesforce','MuleSoft','Tableau','Accenture','Deloitte','PwC','EY','KPMG','Capgemini','Cognizant','Infosys','TCS','Wipro','HCLTech','Tech Mahindra','LTIMindtree','IBM','DXC Technology','NTT DATA','Genpact','Persistent Systems','Coforge','Mphasis','Hexaware','Zensar','Birlasoft','UST','Virtusa','EPAM','Globant','Publicis Sapient','Slalom','CGI','Atos','Sopra Steria','Fujitsu','Hitachi Vantara','EPAM Systems','Tietoevry','Mindtree','LTI','Nagarro','SoftServe','UST Global','YASH Technologies','Sutherland','Concentrix','WNS','EXL','Evalueserve','LTTS','KPIT','Brillio','Amdocs','Ness Digital Engineering','Thoughtworks','Valtech','Grid Dynamics','Perficient','Ciklum','Endava','Luxoft','Reply','Merkle','Dentsu','WPP','Havas','VML','Avanade','Cognizant Softvision','NTT DATA Services','Infosys Consulting','Deloitte Digital','PwC AC','EY GDS','KPMG Global Services','Capgemini Invent','Accenture Song','IBM Consulting','TCS Interactive'
];

const midCompanies = [
  'Cloud Analogy','Codleo Consulting','Cyntexa','Ksolves','360 Degree Cloud','Algoworks','Girikon','Cynoteck','Dazeworks','AnavClouds','FEXLE','SaaSnic','Grazitti','Silverline','Coastal Cloud','ListEngage','Jade Global','CloudMasonry','NeuraFlash','Plative','Zennify','Traction on Demand','Simplus','Appirio','Bluewolf','Magnet360','Acumen Solutions','Penrod','V2Force','Cloudwerx','SevenPoints','DemandBlue','Configero','A5','ATG Cognizant','Atrium','Conga Professional Services','Spaulding Ridge','Marlabs','Suyati Technologies','Damco Solutions','Netsmartz','Cloud Mentor','Cloud Peritus','Cloud Odyssey','CloudQ','CloudRedux','CloudShift','CloudGaia','Cloudsquare','Mirketa','Manras Technologies','Emizentech','Astrea IT','Dextara Digital','Eleviant Tech','Venerate Solutions','CRMIT Solutions','Ranosys','Nagarro Salesforce','Deloitte USI Salesforce','PolSource','Wipro Salesforce Practice','Infosys Salesforce Practice','TCS Salesforce Practice','Cognizant Salesforce Practice','HCL Salesforce Practice','Tech Mahindra Salesforce','Speridian Technologies','ValueLabs','Xoriant','Cybage','Quess IT Staffing','Searce','Bounteous','Launchpad Technologies','Sierra-Cedar','FusionSpan','Vlocity Partners','OSF Digital','Brite Systems','Perficient Salesforce','Jitterbit Services','KloudGin Partners','OpenText Salesforce','Nagarro CRM','Blueflame Labs','Metacube','SunArc Technologies','Dean Infotech','Damco Salesforce','Cloud Certitude','Webkul','Girikon India','Emorphis Technologies','Sparx IT','Classic Informatics','Rishabh Software','Hidden Brains','TatvaSoft','Radixweb','SPEC INDIA','Clarion Technologies','Evon Technologies'
];

const startupCompanies = [
  'Darwinbox','Freshworks','LeadSquared','Keka','Razorpay','Chargebee','Whatfix','Postman','BrowserStack','Zoho','Wingify','MoEngage','WebEngage','CleverTap','Gupshup','Yellow.ai','Haptik','Kore.ai','Uniphore','Observe.AI','Salesken','Outplay','Klenty','Paperflite','Vymo','Capillary Technologies','Locus','FarEye','LogiNext','Shipsy','Zetwerk','Moglix','Infra.Market','OfBusiness','Udaan','Meesho','Urban Company','NoBroker','Livspace','UpGrad','Simplilearn','Vedantu','Byju’s','PhysicsWallah','Scaler','Masai School','Great Learning','Zolve','Fi Money','Jupiter','Groww','Smallcase','INDmoney','Cred','PhonePe','Paytm','Pine Labs','Mswipe','Niyo','Open Financial','Khatabook','Vyapar','Tally Solutions','Exotel','Kaleyra','Route Mobile','Netcore Cloud','Pepipost','Synup','Facilio','Kissflow','Freshservice','SurveySparrow','Agile CRM','LeadSquared CRM','CRMNEXT','Vtiger','Kapture CX','Hiver','Rocketlane','Zuper','SirionLabs','Icertis','SpotDraft','Leegality','SignDesk','MindTickle','HighRadius','Chargebee India','InMobi','Glance','AppsFlyer India','Hevo Data','Fivetran India','Atlan','Sigmoid','Tiger Analytics','Fractal Analytics','LatentView','Mu Sigma','Tredence','Affine','Quantiphi','Happiest Minds','Ideas2IT','HashedIn','SpringML','CloudFiles','Tray.io India','Zapier Partners','Workato Partners','Kovai.co','Testsigma','LambdaTest','Katalon Partners','BrowserStack CRM','SaaS Labs','JustCall','Helpwise','Bigin Partners'
];

const allCompanyNames = [...mncCompanies, ...midCompanies, ...startupCompanies].slice(0, 300);

function categoryFor(name, index) {
  if (mncCompanies.includes(name)) return 'MNC';
  if (midCompanies.includes(name)) return 'Mid Company';
  if (startupCompanies.includes(name)) return 'Startup';
  return ['MNC','Mid Company','Startup'][index % 3];
}

export const companies = allCompanyNames.map((name, i) => ({
  id: i + 1,
  name,
  category: categoryFor(name, i),
  website: `https://www.google.com/search?q=${encodeURIComponent(name + ' Salesforce Developer careers')}`,
  status: 'Saved',
  saved: false,
  applied: false,
  notes: '',
  priority: ['High', 'Medium', 'Low'][i % 3],
  followUp: '',
}));

export const companyCategories = ['All', 'Startup', 'Mid Company', 'MNC'];

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
