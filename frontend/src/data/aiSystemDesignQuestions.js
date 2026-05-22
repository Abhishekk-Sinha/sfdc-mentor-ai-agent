const levels = ['Easy', 'Medium', 'Hard', 'Advanced'];
const topics = [
  'LLM orchestration', 'RAG pipeline', 'vector database', 'prompt routing', 'tool calling',
  'memory design', 'rate limiting', 'conversation history', 'evaluation', 'security',
  'latency optimization', 'cost optimization', 'fallback strategy', 'multi-agent design', 'observability',
  'data privacy', 'streaming response', 'file upload pipeline', 'web search integration', 'cache design',
  'guardrails', 'model gateway', 'API design', 'queue processing', 'monitoring and alerts'
];

export const aiAssistantSystemDesignQuestions = Array.from({ length: 50 }, (_, i) => {
  const topic = topics[i % topics.length];
  const level = levels[Math.min(levels.length - 1, Math.floor(i / 13))];
  return {
    id: `ai-assistant-sd-${i + 1}`,
    track: 'AI Assistant System Design',
    topic,
    level,
    title: `AI Assistant System Design Q${i + 1}: ${topic}`,
    question: `Design a production-ready AI assistant where ${topic} is a key requirement. Explain functional requirements, non-functional requirements, architecture, APIs, data flow, storage, scaling, security, monitoring, failure handling, cost control and trade-offs.`,
    hint: 'Start with users and requirements. Then explain frontend, backend API, auth, conversation service, prompt builder, model gateway, tool router, RAG/vector DB, metadata DB, cache, queue, logs, evaluation and monitoring.',
    answer: `Strong answer structure: 1) Clarify requirements and scale. 2) Design frontend chat UI and API gateway. 3) Add auth, conversation service and prompt builder. 4) Use model gateway for provider abstraction. 5) Add tool router and RAG service with vector DB. 6) Store metadata in SQL/NoSQL. 7) Add cache, queue, streaming, observability, guardrails and feedback loop. 8) Discuss ${topic}, trade-offs, security, privacy, latency and cost.`,
    starterCode: `Functional Requirements:\nNon-Functional Requirements:\nHigh-Level Architecture:\nAPIs:\nData Model:\nRAG / Tools:\nSecurity / Privacy:\nScaling:\nMonitoring:\nTrade-offs:`,
    timeComplexity: 'System-level design; discuss latency, throughput and cost instead of Big-O.',
    spaceComplexity: 'Storage planning: conversations, embeddings, documents, logs and cache.',
    link: '',
  };
});
