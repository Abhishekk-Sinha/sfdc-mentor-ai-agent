import React from 'react';
import { readStore, writeStore } from '../utils/storage';

export function CareerWatch({ compact = false }) {
  const [now, setNow] = React.useState(new Date());
  const [endAt, setEndAt] = React.useState(() => readStore('careerWatchEndAt', null));
  const [customMinutes, setCustomMinutes] = React.useState(() => readStore('careerWatchMinutes', 30));
  const [label, setLabel] = React.useState(() => readStore('careerWatchLabel', 'Focused Study'));

  React.useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const startCustomSprint = () => {
    const minutes = Math.max(1, Math.min(180, Number(customMinutes) || 30));
    const nextEnd = Date.now() + minutes * 60000;
    setEndAt(nextEnd);
    writeStore('careerWatchEndAt', nextEnd);
    writeStore('careerWatchMinutes', minutes);
    writeStore('careerWatchLabel', label || 'Focused Study');
  };

  const reset = () => {
    setEndAt(null);
    writeStore('careerWatchEndAt', null);
  };

  const remaining = endAt ? Math.max(0, endAt - now.getTime()) : 0;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const sprintText = endAt
    ? remaining > 0
      ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} remaining for ${label || 'Focused Study'}`
      : 'Sprint complete. Save your proof and take a short break.'
    : 'Set your own sprint time and start when ready.';

  return <aside className={compact ? 'careerWatchApp compact' : 'careerWatchApp'}>
    <div className="watchTop"><span>Career Watch</span><b>Private Tool</b></div>
    <strong>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
    <p>{now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
    <div className="careerWatchControls">
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Sprint name" />
      <div className="watchInputRow">
        <input type="number" min="1" max="180" value={customMinutes} onChange={e => setCustomMinutes(e.target.value)} />
        <span>min</span>
      </div>
    </div>
    <div className="watchButtons">
      <button type="button" onClick={startCustomSprint}>Start Sprint</button>
      <button type="button" onClick={reset}>Reset</button>
    </div>
    <small>{sprintText}</small>
  </aside>;
}