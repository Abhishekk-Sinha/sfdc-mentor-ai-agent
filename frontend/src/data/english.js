const themes = [
  'Morning Routine', 'Daily Planning', 'Office Communication', 'Time Management', 'Family Conversations', 'Travel and Directions', 'Shopping and Payments', 'Health and Fitness', 'Phone Calls', 'Email Basics',
  'Meeting Language', 'Polite Requests', 'Giving Updates', 'Asking Questions', 'Explaining Problems', 'Client Communication', 'Team Collaboration', 'Feedback Handling', 'Interview Basics', 'Self Introduction',
  'Resume Discussion', 'Project Explanation', 'Workplace Confidence', 'Presentation Skills', 'Negotiation Basics', 'Professional Follow-up', 'Daily Stand-up', 'Task Prioritization', 'Conflict Handling', 'Decision Making',
  'Reporting Work', 'Dashboard Explanation', 'Technical Discussion', 'Documentation', 'Support Conversations', 'Requirement Gathering', 'Sprint Planning', 'Bug Explanation', 'Release Updates', 'Manager Communication',
  'Customer Support', 'Data Analysis Talk', 'Salesforce Project Talk', 'Leadership Language', 'Problem Solving', 'Process Improvement', 'Job Interview Answers', 'HR Round Answers', 'Salary Discussion', 'Career Goals',
  'Advanced Meetings', 'Executive Summary', 'Business Communication', 'Stakeholder Updates', 'Risk Communication', 'Strategic Planning', 'Cross-team Collaboration', 'Performance Review', 'Mentoring Juniors', 'Professional Networking',
  'LinkedIn Communication', 'Recruiter Messages', 'Follow-up Emails', 'Client Demo', 'Technical Demo', 'Architecture Discussion', 'System Design Discussion', 'Data Migration Talk', 'Integration Discussion', 'Security Discussion',
  'Production Support', 'Incident Handling', 'Root Cause Analysis', 'UAT Communication', 'Go-live Readiness', 'Advanced Presentation', 'Leadership Presence', 'Negotiation Advanced', 'Decision Justification', 'Business Impact',
  'Executive Presence', 'Advanced Interview', 'STAR Answers', 'Behavioral Questions', 'Project Storytelling', 'Conflict Resolution', 'Influencing Skills', 'Ownership Language', 'Accountability Language', 'Strategic Communication',
  'Mock Interview Day', 'Client Escalation', 'Promotion Discussion', 'Team Leadership', 'Roadmap Planning', 'Final Interview Prep', 'Career Vision', 'Professional Confidence', 'Executive Summary Practice', 'Final Fluency Review'
];

const words = ['strategic approach', 'clear communication', 'professional confidence', 'effective solution', 'structured response', 'practical example', 'reliable execution', 'focused improvement', 'strong ownership', 'business impact', 'polite request', 'accurate explanation', 'consistent progress', 'impressive presentation', 'natural fluency'];
const hindi = ['रणनीतिक दृष्टिकोण', 'स्पष्ट संचार', 'पेशेवर आत्मविश्वास', 'प्रभावी समाधान', 'संरचित उत्तर', 'व्यावहारिक उदाहरण', 'विश्वसनीय क्रियान्वयन', 'केंद्रित सुधार', 'मजबूत जिम्मेदारी', 'व्यावसायिक प्रभाव', 'विनम्र अनुरोध', 'सटीक व्याख्या', 'निरंतर प्रगति', 'प्रभावशाली प्रस्तुति', 'स्वाभाविक fluency'];

export function getEnglishDay(day) {
  const topic = themes[(day - 1) % themes.length];
  const phase = day <= 25 ? 'Foundation' : day <= 50 ? 'Fluency' : day <= 75 ? 'Professional Strength' : 'Advanced Command';
  const sentences = Array.from({ length: 30 }, (_, i) => ({
    no: i + 1,
    english: [
      `I will start my ${topic.toLowerCase()} practice with a clear mind today.`,
      `Please give me a moment to organize my thoughts about ${topic.toLowerCase()}.`,
      `I need to improve my confidence while speaking about ${topic.toLowerCase()}.`,
      `Could you explain this point related to ${topic.toLowerCase()} one more time?`,
      `I am trying to express my ideas about ${topic.toLowerCase()} more clearly.`,
    ][i % 5],
    hindi: [
      `मैं आज ${topic} की प्रैक्टिस साफ मन से शुरू करूँगा।`,
      `कृपया मुझे ${topic} के बारे में अपने विचार व्यवस्थित करने के लिए एक क्षण दें।`,
      `मुझे ${topic} के बारे में बोलते समय अपना आत्मविश्वास सुधारना है।`,
      `क्या आप ${topic} से जुड़ा यह बिंदु एक बार और समझा सकते हैं?`,
      `मैं ${topic} के बारे में अपने विचार और स्पष्ट तरीके से व्यक्त करने की कोशिश कर रहा हूँ।`,
    ][i % 5],
  }));
  const vocab = words.map((word, i) => ({
    no: i + 1,
    word,
    pronunciation: word.toUpperCase(),
    hindi: hindi[i],
    example: `A ${word} can make your ${topic.toLowerCase()} communication more professional and effective.`,
  }));
  return {
    day,
    topic,
    phase,
    goal: `Build practical English confidence for ${topic.toLowerCase()} with Hindi understanding and speaking practice.`,
    sentences,
    vocab,
    tip: 'Speak each sentence in three speeds: slow, normal, and interview speed. Record your voice for one minute.',
  };
}
