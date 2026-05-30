export function detectMentorIntent(question = '') {
  const q = String(question).toLowerCase();
  if (/latest|news|trend|current|recent|update/.test(q)) return 'Latest News';
  if (/interview|answer|mock|hr/.test(q)) return 'Interview Answer';
  if (/project|use case|real time|implementation|doctor patient/.test(q)) return 'Project Explanation';
  if (/code|syntax|write|class|method|component|trigger/.test(q)) return 'Code / Implementation';
  if (/error|not working|fix|issue|failed|bug/.test(q)) return 'Debug / Fix';
  if (/resume|cv|jd|job description|ats|bullet/.test(q)) return 'Resume / JD Match';
  if (/what is|kya hai|define|meaning|difference/.test(q)) return 'Definition';
  return 'Professional Explanation';
}

export function detectMentorDomain(question = '') {
  const q = String(question).toLowerCase();
  if (/dsa|array|string|linked list|stack|queue|tree|graph|binary search|sliding window|two pointer|recursion|dp|leetcode|complexity|big o|hashmap/.test(q)) return 'DSA';
  if (/system design|scalability|load balancer|cache|redis|database design|rate limiter|url shortener|notification|microservice|api gateway|kafka|architecture/.test(q)) return 'System Design';
  if (/resume|cv|jd|job description|ats|bullet/.test(q)) return 'Resume/JD';
  if (/ai|ml|machine learning|nlp|rag|llm|ollama|agent|model|vector|embedding|prompt|news|technology|trend/.test(q)) return 'AI/ML/NLP';
  if (/salesforce|apex|trigger|lwc|flow|soql|sosl|admin|profile|permission|sharing|governor|batch|queueable|future|integration|visualforce|gearset/.test(q)) return 'Salesforce';
  return 'Career';
}

export function buildMentorFormat(domain, intent) {
  if (domain === 'DSA') return 'Approach, intuition, dry run, optimized solution, time complexity, space complexity, common mistake.';
  if (domain === 'System Design') return 'Requirements, APIs, data model, architecture, scaling, caching, queue, tradeoffs, bottlenecks.';
  if (domain === 'Resume/JD') return 'Match score, matched skills, missing skills, resume bullets, interview talking points.';
  if (intent === 'Debug / Fix') return 'Root cause, exact fix, validation steps, common mistakes.';
  if (intent === 'Interview Answer') return 'Definition, project use case, implementation, best practices, business impact, 60-second answer.';
  return 'Direct answer, simple explanation, real project use case, steps, best practices, next action.';
}

export function predictMentorWeakTopics(question = '') {
  const q = String(question).toLowerCase();
  const topics = [];
  if (/trigger|apex|bulk|governor/.test(q)) topics.push('Apex Trigger Bulkification');
  if (/soql|relationship|query/.test(q)) topics.push('SOQL Relationship Query');
  if (/lwc|component|wire|event/.test(q)) topics.push('LWC Events & Apex Wiring');
  if (/flow|automation/.test(q)) topics.push('Flow vs Apex Decision');
  if (/dsa|complexity|array|leetcode|sliding|binary/.test(q)) topics.push('DSA Time Complexity');
  if (/system design|scal|cache|database|architecture/.test(q)) topics.push('System Design Scalability');
  if (/project|resume|interview|impact/.test(q)) topics.push('Project Impact Explanation');
  return topics.slice(0, 4);
}

export function nextMentorAction(domain, intent, weakTopics = []) {
  if (domain === 'DSA') return 'Solve one similar problem, write dry run, and save time/space complexity.';
  if (domain === 'System Design') return 'Draw architecture, define APIs, choose database, and write scaling tradeoffs.';
  if (domain === 'Resume/JD') return 'Paste one JD and rewrite 3 resume bullets with measurable impact.';
  if (weakTopics.includes('Apex Trigger Bulkification')) return 'Write one Apex trigger handler answer with bulkification and governor limit points.';
  if (intent === 'Interview Answer') return 'Convert this into a 60-second spoken answer and save it.';
  return 'Save this answer, mark weak topic if needed, and add one project example.';
}

export function analyzeMentorQuestion(question = '') {
  const domain = detectMentorDomain(question);
  const intent = detectMentorIntent(question);
  const weakTopics = predictMentorWeakTopics(question);
  return {
    domain,
    intent,
    format: buildMentorFormat(domain, intent),
    weakTopics,
    nextAction: nextMentorAction(domain, intent, weakTopics),
    confidence: domain === 'Career' ? 'Medium' : 'High'
  };
}

export function scoreMentorAnswer(answer = '', domain = 'Career', intent = 'Professional Explanation') {
  const text = String(answer).toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const cap = n => Math.max(1, Math.min(10, n));
  let clarity = cap(4 + Math.round(words / 55));
  let depth = 4 + ['implementation', 'best practice', 'security', 'test', 'complexity', 'architecture', 'governor', 'tradeoff'].filter(x => text.includes(x)).length;
  let project = 4 + ['project', 'use case', 'business', 'impact', 'crm', 'doctor', 'patient'].filter(x => text.includes(x)).length;
  let interview = 4 + ['interview', 'answer', 'example', 'result', 'explain'].filter(x => text.includes(x)).length;
  if (domain === 'DSA' && /complexity|dry run|optimized|brute/.test(text)) depth += 2;
  if (domain === 'System Design' && /scale|cache|database|api|queue|tradeoff/.test(text)) depth += 2;
  if (intent === 'Interview Answer') interview += 2;
  depth = cap(depth); project = cap(project); interview = cap(interview);
  return { clarity, depth, projectConnection: project, interviewReadiness: interview, overall: Math.round((clarity + depth + project + interview) / 4) };
}
