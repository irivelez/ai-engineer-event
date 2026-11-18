// m:ss or h:mm:ss from milliseconds (negative values get a minus sign).
export function formatClock(ms) {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${neg ? '−' : ''}${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${ss}`;
}
