import React from 'react';
import { Layout, Page, Hero, Card } from '../components/UI';

const API_CANDIDATES = [
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'https://sfdc-mentor-backend.onrender.com'
];

function withTimeout(ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

async function findBestBackend() {
  for (const base of API_CANDIDATES) {
    const t = withTimeout(5000);
    try {
      const response = await fetch(base + '/api/ollama-status?ts=' + Date.now(), { signal: t.signal });
      const data = await readJson(response);
      t.done();
      if (data && data.model_available === true) return { base, status: data };
    } catch { t.done(); }
  }
  for (const base of API_CANDIDATES) {
    const t = withTimeout(5000);
    try {
      const response = await fetch(base + '/api/health?ts=' + Date.now(), { signal: t.signal });
      const data = await readJson(response);
      t.done();
      if (response.ok || data?.ok) return { base, status: data };
    } catch { t.done(); }
  }
  return { base: API_CANDIDATES[0], status: null };
}

function buildMentorPrompt(question) {
  return `You are Abhishek's personal Salesforce Developer interview mentor.
Answer the exact question professionally.
Do not say you are an AI model.
Do not give generic repeated template.
Use this structure when useful:
1. Direct answer
2. Simple explanation
3. Real Salesforce project use case
4. Interview-ready answer
5. Best practices or common mistakes
6. One next action

Question: ${question}`;
}

function cleanAnswer(data) {
  if (!data) return '';
  const answer = String(data.answer || data.response || data.text || '').trim();
  if (!answer) return '';
  if (answer.toLowerCase().includes('ollama unavailable')) return '';
  return answer;
}

function localProfessionalAnswer(question) {
  const q = question.toLowerCase();
  if (q.includes('salesforce')) return `Salesforce is a cloud-based CRM platform used to manage customer data, sales, service, automation, reports and dashboards.

As a Salesforce Developer, you customize Salesforce using Apex, LWC, Flow, SOQL, security and integrations.

Interview answer:
Salesforce helps businesses manage customer relationships and automate business processes. As a Salesforce Developer, I customize Salesforce according to business requirements and build secure, scalable CRM solutions.`;
  if (q.includes('trigger')) return `An Apex Trigger is code that runs automatically before or after a record is inserted, updated, deleted or undeleted in Salesforce.

Project use case:
When an appointment is created, a trigger can validate doctor availability, update patient status, or create a follow-up task.

Interview answer:
I use Apex Triggers for automatic record-level business logic. I follow trigger handler pattern, bulkify code, avoid SOQL/DML inside loops, handle recursion and maintain test coverage.`;
  if (q.includes('apex')) return `Apex is Salesforce's server-side programming language used to write custom backend logic.

It is used for classes, triggers, batch jobs, queueable jobs, integrations and complex automation.

Interview answer:
I use Apex when business logic is complex, transaction-based, integration-heavy, or not suitable for Flow.`;
  if (q.includes('lwc')) return `LWC means Lightning Web Component. It is Salesforce's modern frontend framework for building fast and reusable UI components.

Interview answer:
LWC communicates with Apex, handles component events and gives users a better Salesforce UI experience.`;
  if (q.includes('flow')) return `Salesforce Flow is a declarative automation tool used to automate business processes without code.

Interview answer:
I use Flow for simple and medium automation, and Apex when logic becomes complex, bulk-heavy or integration-based.`;
  if (q.includes('soql')) return `SOQL means Salesforce Object Query Language. It is used to query Salesforce records.

Interview answer:
I write selective SOQL queries, avoid queries inside loops, use relationship queries when needed and always consider governor limits.`;
  return `Professional answer for: ${question}

Explain it with this structure:
1. Direct definition
2. Real Salesforce project use case
3. Implementation approach
4. Testing or security point
5. Business impact

Interview line:
I explain the concept with a real project example, how I implemented it, how I tested it and what result it created.`;
}

export function AIMentorPro() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [asked, setAsked] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [backendLabel, setBackendLabel] = React.useState('');

  async function ask() {
    const text = question.trim();
    if (!text) return;
    setAsked(text);
    setLoading(true);
    setAnswer('');
    try {
      const backend = await findBestBackend();
      setBackendLabel(backend.base.includes('127.0.0.1') || backend.base.includes('localhost') ? 'Local Ollama backend' : 'Backend');
      const t = withTimeout(180000);
      const response = await fetch(backend.base + '/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: t.signal,
        body: JSON.stringify({
          question: buildMentorPrompt(text),
          mode: 'ollama',
          context: { role: 'Salesforce Developer', user: 'Abhishek', source: 'AI Mentor Pro' }
        })
      });
      const data = await readJson(response);
      t.done();
      const aiAnswer = cleanAnswer(data);
      setAnswer(aiAnswer || localProfessionalAnswer(text));
    } catch {
      setAnswer(localProfessionalAnswer(text));
    }
    setQuestion('');
    setLoading(false);
  }

  return <Layout><Page><Hero title="AI Mentor Agent Pro" subtitle="Ask Salesforce questions and get professional answers." />
    <Card title="Ask Mentor"><textarea className="mentorProTextarea" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask any Salesforce, Apex, LWC, Flow, SOQL, interview or project question..." /><div className="row"><button className="btn cyan" disabled={loading} onClick={ask}>{loading ? 'Thinking...' : 'Ask Mentor'}</button><button className="btn ghost" onClick={() => setQuestion('')}>Clear</button></div></Card>
    {answer ? <Card title="Professional Mentor Answer" subtitle={asked}><pre className="mentorProAnswer">{answer}</pre><div className="mentorActions"><button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(answer)}>Copy</button><button className="btn small ghost" onClick={() => setAnswer('')}>Clear Answer</button>{backendLabel && <span className="pill">{backendLabel}</span>}</div></Card> : null}
  </Page></Layout>;
}
