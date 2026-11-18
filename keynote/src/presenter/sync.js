// Two-way sync between the audience window and the presenter window, over three channels at once:
// (1) postMessage to the window.open()ed presenter / window.opener, (2) BroadcastChannel('itaf'),
// (3) localStorage + storage events. Every message carries an id; receivers drop duplicates and their own.
//   audience → presenter: { type:'state', momentId, momentIndex, step, steps, timer:{ startedAt, running }, at }
//   presenter → audience: { type:'cmd', cmd:'next'|'prev'|'goto'|'timer'|'hello', momentId?, step?, action? }
export const LS = { state: 'itaf-state', cmd: 'itaf-cmd', timer: 'itaf-timer' };
const CHANNEL = 'itaf';

export function createSync(role, { getPeer } = {}) {
  const seen = new Set();
  const order = [];
  const handlers = new Set();
  let bc = null;
  try {
    bc = new BroadcastChannel(CHANNEL);
    bc.onmessage = (e) => receive(e.data, 'broadcast');
  } catch { bc = null; }
  const onMessage = (e) => receive(e.data, 'postMessage');
  const onStorage = (e) => {
    if (e.key !== LS.state && e.key !== LS.cmd) return;
    try { receive(JSON.parse(e.newValue), 'storage'); } catch { /* ignore */ }
  };
  window.addEventListener('message', onMessage);
  window.addEventListener('storage', onStorage);

  function receive(msg, via) {
    if (!msg || typeof msg !== 'object' || msg.ns !== 'itaf' || msg.src === role || !msg.id) return;
    if (seen.has(msg.id)) return;
    seen.add(msg.id);
    order.push(msg.id);
    if (order.length > 300) seen.delete(order.shift());
    for (const fn of handlers) {
      try { fn(msg, via); } catch (e) { console.error('[itaf] sync handler failed:', e); }
    }
  }
  function send(msg) {
    const m = { ...msg, ns: 'itaf', src: role, id: `${role}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, at: msg.at || Date.now() };
    const peer = getPeer ? getPeer() : null;
    if (peer && !peer.closed) {
      try { peer.postMessage(m, '*'); } catch { /* cross-window failure is fine: other channels deliver */ }
    }
    if (bc) {
      try { bc.postMessage(m); } catch { /* ignore */ }
    }
    try { localStorage.setItem(m.type === 'state' ? LS.state : LS.cmd, JSON.stringify(m)); } catch { /* storage blocked */ }
    return m;
  }
  return {
    send,
    on(fn) { handlers.add(fn); return () => handlers.delete(fn); },
    close() {
      if (bc) bc.close();
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    },
  };
}

// Timer state lives in localStorage so it survives reloads of either window.
export function readTimer() {
  try {
    const t = JSON.parse(localStorage.getItem(LS.timer) || 'null');
    if (t && typeof t === 'object') return { startedAt: t.startedAt || null, running: !!t.running };
  } catch { /* ignore */ }
  return { startedAt: null, running: false };
}
export function writeTimer(t) {
  try { localStorage.setItem(LS.timer, JSON.stringify(t)); } catch { /* ignore */ }
  return t;
}
export function readLastState() {
  try { return JSON.parse(localStorage.getItem(LS.state) || 'null'); } catch { return null; }
}
