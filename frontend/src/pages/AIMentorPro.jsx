import React from 'react';
import { Layout, Page, Hero, Card } from '../components/UI';

const API_BASE = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000' : 'https://sfdc-mentor-backend.onrender.com';

export function AIMentorPro() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [asked, setAsked] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  async function ask() {
    const text = question.trim();
    if (!text) return;
    setAsked(text);
    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch(API_BASE + '/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, mode: 'ollama', context: { role: 'Salesforce Developer' } })
      });
      const data = await res.json();
      setAnswer(data && data.ok && data.answer ? data.answer.trim() : 'AI is not ready.');
    } catch {
      setAnswer('AI is not ready.');
    }
    setQuestion('');
    setLoading(false);
  }
  return <Layout><Page><Hero title="AI Mentor Agent Pro" subtitle="Ask Salesforce questions and get dynamic answers." />
    <Card title="Ask Mentor"><textarea className="mentorProTextarea" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask any Salesforce question..." /><div className="row"><button className="btn cyan" disabled={loading} onClick={ask}>{loading ? 'Thinking...' : 'Ask Mentor'}</button><button className="btn ghost" onClick={() => setQuestion('What is Salesforce?')}>Salesforce</button><button className="btn ghost" onClick={() => setQuestion('What is Apex?')}>Apex</button><button className="btn ghost" onClick={() => setQuestion('Explain Apex Trigger')}>Trigger</button><button className="btn ghost" onClick={() => setQuestion('')}>Clear</button></div></Card>
    {answer ? <Card title="Professional Mentor Answer" subtitle={asked}><pre className="mentorProAnswer">{answer}</pre><div className="mentorActions"><button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(answer)}>Copy</button><button className="btn small ghost" onClick={() => setAnswer('')}>Clear Answer</button></div></Card> : <Card title="Ready"><div className="promptGrid">{['What is Salesforce?','What is Apex?','Explain Apex Trigger','What is LWC?','What is Flow?','What is SOQL?'].map(p => <button className="btn ghost" key={p} onClick={() => setQuestion(p)}>{p}</button>)}</div></Card>}
  </Page></Layout>;
}
