import { salesforceAdminTopics, salesforceDeveloperTopics } from './topics';

const industries = ['Sales', 'Healthcare', 'Real Estate', 'Support', 'Finance', 'Education', 'IT Services'];

export const salesforceUseCases = [...salesforceAdminTopics, ...salesforceDeveloperTopics].flatMap((topic, index) => [
  {
    id: `${topic}-basic`,
    topic,
    industry: industries[index % industries.length],
    level: 'Easy',
    title: `${topic} for daily CRM operation`,
    problem: `The business team needs a simple, trackable process where ${topic} improves CRM data quality and productivity.`,
    solution: `Use Salesforce best practices around ${topic}, correct configuration/code, data validation, security, and reporting visibility.`,
    steps: ['Requirement discussion', 'Data model/configuration', 'Automation or code', 'Security setup', 'Testing', 'Report/dashboard', 'User handover'],
    interview: `I used ${topic} to solve a real CRM problem by focusing on requirement clarity, secure implementation, testing, and measurable impact.`,
  },
  {
    id: `${topic}-advanced`,
    topic,
    industry: industries[(index + 3) % industries.length],
    level: 'Advanced',
    title: `${topic} in production Salesforce implementation`,
    problem: `A production org needs scalable and maintainable ${topic} implementation with security, performance, and user adoption.`,
    solution: `Design ${topic} with reusable patterns, governance, documentation, exception handling, and release readiness.`,
    steps: ['Architecture', 'Reusable build', 'Security review', 'Performance check', 'UAT', 'Deployment', 'Post-deployment support'],
    interview: `For ${topic}, I focus on scalable design, security, maintainability, testing, deployment readiness, and business value.`,
  },
]);
