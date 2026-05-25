import React from 'react';

export function CareerWatch({ compact = false }) {
  const [now, setNow] = React.useState(new Date());
  const [endAt, setEndAt] = React.useState(null);

  React.useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const remaining = endAt ? Math.max(0, endAt - now.getTime()) : 0;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const sprintText = endAt
    ? remaining > 0
      ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} remaining`
      : 'Sprint complete. Take a 5-minute break.'
    : 'Ready for a focused learning sprint';

  return <aside className={compact ? 'careerWatchApp compact' : 'careerWatchApp'}>
    <div className="watchTop"><span>Career Watch</span><b>Private Tool</b></div>
    <strong>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
    <p>{now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
    <div className="watchButtons">
      <button type="button" onClick={() => setEndAt(Date.now() + 25 * 60000)}>25m Focus</button>
      <button type="button" onClick={() => setEndAt(Date.now() + 45 * 60000)}>45m Sprint</button>
      <button type="button" onClick={() => setEndAt(null)}>Reset</button>
    </div>
    <small>{sprintText}</small>
  </aside>;
}
