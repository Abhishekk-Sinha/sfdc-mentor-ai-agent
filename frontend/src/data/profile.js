export const profile = {
  name: 'Abhishek Kumar',
  role: 'Salesforce Developer',
  location: 'New Delhi, India',
  email: 'abhishek.ds140@gmail.com',
  phone: '+91 7004510125',
  github: 'https://github.com/Abhishekk-Sinha',
  linkedin: 'https://www.linkedin.com/in/abhishek-data23/',
  trailhead: 'https://www.salesforce.com/trailblazer/rsizfhoeaz72cmshqa',
  headline: 'Salesforce Developer | Apex | LWC | Flow | REST API Integration | Salesforce Security',
  summary:
    'Salesforce Developer with 2+ years of experience in Salesforce Administration and Development, skilled in Apex, Apex Triggers, Lightning Web Components, SOQL, SOSL, Flows, Reports, Dashboards, Security & Sharing, REST APIs, Data Loader, and deployment tools.',
};

export const cvSkills = {
  'Salesforce Development': ['Apex Classes', 'Apex Triggers', 'Lightning Web Components', 'SOQL', 'SOSL', 'Visualforce'],
  'Asynchronous Apex': ['Batch Apex', 'Scheduled Apex', 'Queueable Apex', 'Future Methods'],
  'Salesforce Administration': ['Flows', 'Process Automation', 'Validation Rules', 'Custom Objects', 'Fields', 'Page Layouts', 'Record Types'],
  'Security & Sharing': ['Profiles', 'Permission Sets', 'Roles', 'Sharing Rules', 'OWD', 'Object-Level Security', 'Field-Level Security'],
  'Integration & Tools': ['REST APIs', 'SOAP APIs', 'Named Credentials', 'Remote Site Settings', 'JSON', 'XML', 'Salesforce CLI', 'VS Code', 'Developer Console', 'Workbench', 'Change Sets'],
  'Data & Reporting': ['Data Loader', 'Data Import Wizard', 'Duplicate Rules', 'Matching Rules', 'Reports', 'Dashboards', 'Report Types'],
};

export const projects = [
  {
    title: 'Salesforce Real Estate Portal',
    company: 'Dano Cloud Technology',
    tech: 'Salesforce LWC, Apex, SOQL, REST API, Google Drive Integration, Salesforce Security',
    overview: 'A scalable Salesforce Real Estate Portal for property sale and rental management with listing, search, image storage, secure access, and role-based user experience.',
    working: [
      'Admin creates property records with sale/rent details and media references.',
      'LWC renders responsive listing, search filters, wishlist, and map-based UI.',
      'Apex controllers run dynamic SOQL with secure user-context handling.',
      'Google Drive stores property images to reduce Salesforce storage usage.',
      'REST/API logic uploads and displays property images securely.',
      'Role-based UX controls what buyers, agents, and admins can access.',
    ],
    interview: 'I developed a Real Estate Portal using LWC, Apex, SOQL, REST API, and Google Drive integration. My focus was secure data access, dynamic filtering, reusable LWC design, image integration, and demo-ready UX.',
    impact: 'Improved property discovery, reduced org storage usage, and created a strong portfolio-grade Salesforce project.',
  },
  {
    title: 'Doctor Patient Management System',
    company: 'Dano Cloud Technology',
    tech: 'Salesforce LWC, Apex, SOQL, REST API, Flows, Reports & Dashboards',
    overview: 'A healthcare CRM system for patient records, appointments, doctor interactions, role-based access, secure integrations, and operational reporting.',
    working: [
      'Admin, doctor, and patient roles access different interfaces.',
      'LWC captures appointments, patient history, and doctor interactions.',
      'Apex controllers and SOQL fetch data securely and efficiently.',
      'Flows automate appointment, notification, and status processes.',
      'REST API services exchange data with external healthcare systems.',
      'Reports and dashboards track patient monitoring and appointment status.',
    ],
    interview: 'I built a Doctor Patient Management System with Salesforce LWC, Apex, Flows, REST API, Reports, and Dashboards. The system managed patient records, appointment scheduling, secure access, and operational reporting.',
    impact: 'Improved appointment visibility, secure healthcare data handling, and reporting efficiency.',
  },
  {
    title: 'Central Control & Monitoring System (CCMS)',
    company: 'PTC India Ltd. | EESL / SDMC',
    tech: 'AWS Lambda, CloudWatch, EventBridge, S3, DynamoDB, SQL, Python',
    overview: 'A smart infrastructure monitoring solution for real-time telemetry, fault detection, reporting, and asset health tracking across large-scale LED infrastructure.',
    working: [
      'IoT-enabled LED assets send telemetry and status data.',
      'AWS CloudWatch and EventBridge monitor and orchestrate events.',
      'S3 and DynamoDB store telemetry and asset information.',
      'AWS Lambda runs automated fault detection and reporting logic.',
      'SQL and Python process unstructured telemetry for failure detection.',
      'Reports support asset health visibility and operational decisions.',
    ],
    interview: 'I worked on CCMS smart infrastructure data operations using AWS, SQL, and Python. The system processed real-time telemetry, monitored assets, detected faults, and supported operational reporting.',
    impact: 'Supported large-scale smart infrastructure visibility, energy optimization, and fault reduction.',
  },
];

export const experience = [
  {
    role: 'Salesforce Developer',
    company: 'Dano Cloud Technology',
    period: 'Oct 2024 – Current',
    points: [
      'Designed scalable Apex triggers, custom metadata, and reusable Lightning Components.',
      'Built LWC modules and integrated external systems using REST API.',
      'Automated business processes via Flows and Process Builder, reducing manual effort by 60%.',
      'Maintained unit test coverage above 90% and supported UAT/production deployments.',
    ],
  },
  {
    role: 'Technical Consultant',
    company: 'Sense Quo Systems',
    period: 'Oct 2022 – Jun 2024',
    points: [
      'Managed and cleaned IoT datasets for environmental compliance.',
      'Built Python and Excel reporting automation for structured reporting.',
      'Reduced manual reporting errors by 15% and improved operational visibility.',
    ],
  },
  {
    role: 'Project Engineer',
    company: 'PTC India Ltd.',
    period: 'Jan 2021 – Oct 2022',
    points: [
      'Managed AWS-backed IoT data operations for smart infrastructure.',
      'Used AWS Lambda, CloudWatch, EventBridge, SQL, and Python for monitoring and reporting.',
      'Supported data-backed energy savings and cost optimization.',
    ],
  },
];
