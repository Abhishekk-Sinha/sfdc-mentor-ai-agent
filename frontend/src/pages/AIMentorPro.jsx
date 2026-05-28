import React from 'react';
import { Layout, Page, Hero, Card } from '../components/UI';

function buildAnswer(input) {
  const q = input.toLowerCase();
  if (q.includes('salesforce')) return 'Salesforce is a cloud CRM platform used to manage customer data, sales, service, automation, reports and dashboards. As a Salesforce Developer, you customize it with Apex, LWC, Flow, SOQL, security and integrations. Interview answer: Salesforce helps businesses manage customer relationships and automate business processes, and I customize it according to business requirements.';
  if (q.includes('apex')) return 'Apex is Salesforce programming language for custom business logic. It is used for classes, record automation, async processing, integrations and backend logic. Interview answer: I use Apex when Flow is not enough, especially for complex logic, bulk processing and integrations.';
  if (q.includes('lwc')) return 'LWC means Lightning Web Component. It is Salesforce modern UI framework for building fast and reusable user interfaces. Interview answer: LWC communicates with Apex, handles component events and gives users a better experience.';
  if (q.includes('flow')) return 'Salesforce Flow is a no-code automation tool. It is used for record updates, alerts, tasks and screen guided processes. Interview answer: I use Flow for simple and medium automation, and Apex when logic becomes complex.';
  if (q.includes('soql')) return 'SOQL means Salesforce Object Query Language. It is used to fetch records from Salesforce objects. Interview answer: I write selective queries, avoid queries inside loops, use relationship queries when needed and consider governor limits.';
  return 'Professional answer for: ' + input + '\n\nUse this structure: simple definition, real Salesforce project use case, implementation approach, testing or security point, and business impact.';
}

export function AIMentorPro() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [asked, setAsked] = React.useState('');
  const ask = () => { const text = question.trim(); if (!text) return; setAsked(text); setAnswer(buildAnswer(text)); setQuestion(''); };
  return <Layout><Page><Hero title="AI Mentor Agent Pro" subtitle="Ask anything and get a clean professional answer." />
    <Card title="Ask Mentor"><textarea className="mentorProTextarea" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask Salesforce, Apex, LWC, Flow, SOQL, interview or project question..." /><div className="row"><button className="btn cyan" onClick={ask}>Ask Mentor</button><button className="btn ghost" onClick={() => setQuestion('What is Salesforce?')}>Salesforce</button><button className="btn ghost" onClick={() => setQuestion('What is Apex?')}>Apex</button><button className="btn ghost" onClick={() => setQuestion('What is LWC?')}>LWC</button><button className="btn ghost" onClick={() => setQuestion('What is Flow?')}>Flow</button><button className="btn ghost" onClick={() => setQuestion('')}>Clear</button></div></Card>
    {answer ? <Card title="Professional Mentor Answer" subtitle={asked}><pre className="mentorProAnswer">{answer}</pre><div className="mentorActions"><button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(answer)}>Copy</button><button className="btn small ghost" onClick={() => setAnswer('')}>Clear Answer</button></div></Card> : <Card title="Ready"><div className="promptGrid">{['What is Salesforce?','What is Apex?','What is LWC?','What is Flow?','What is SOQL?'].map(p => <button className="btn ghost" key={p} onClick={() => setQuestion(p)}>{p}</button>)}</div></Card>}
  </Page></Layout>;
}
