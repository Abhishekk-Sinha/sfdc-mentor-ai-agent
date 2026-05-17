export function progressScore({ tasks = [], answers = {}, weakStrong = {}, jobs = [] }) {
  const taskScore = tasks.length ? (tasks.filter(t => t.done).length / tasks.length) * 25 : 0;
  const answerScore = Math.min(25, Object.values(answers).filter(a => (a?.text || '').length > 60).length * 0.8);
  const strongScore = Math.min(25, Object.values(weakStrong).filter(x => x === 'Strong').length * 1.2);
  const jobScore = Math.min(25, jobs.filter(j => j.applied || j.status === 'Applied').length * 0.5);
  return Math.round(taskScore + answerScore + strongScore + jobScore);
}

export function keywordMatch(jd, resume) {
  const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9+#. ]/g, ' ');
  const jdWords = [...new Set(normalize(jd).split(/\s+/).filter(w => w.length > 2))];
  const resumeText = normalize(resume);
  const matched = jdWords.filter(w => resumeText.includes(w));
  const missing = jdWords.filter(w => !resumeText.includes(w)).slice(0, 40);
  const score = jdWords.length ? Math.round((matched.length / jdWords.length) * 100) : 0;
  return { score, matched, missing, total: jdWords.length };
}
