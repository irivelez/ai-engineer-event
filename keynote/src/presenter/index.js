// Presenter (A2).
// mountPresenter(env): renders the presenter UI when location.hash === '#presenter'. Returns true if it mounted.
// attachAudience(director, env): sync client in the audience window (state broadcast, presenter commands,
// N notes overlay, T timer, P opens the presenter window).
import { createSync, readTimer, writeTimer } from './sync.js';
import { mountPresenterUI } from './ui.js';
import { formatClock } from './format.js';

export function isPresenterHash() {
  return typeof location !== 'undefined' && location.hash === '#presenter';
}

export function mountPresenter(env = {}) {
  if (!isPresenterHash()) return false;
  mountPresenterUI(env);
  return true;
}

export { formatClock };

export function attachAudience(director, env = {}) {
  const { stage, data, tokens } = env;
  let win = null;
  let keyHandler = null;
  const sync = createSync('audience', { getPeer: () => win });
  // Heartbeat: the presenter shows the link as live while states keep arriving.
  const heartbeat = setInterval(() => broadcast(), 10000);
  let timer = readTimer();

  const broadcast = () => {
    const s = director.state();
    if (s) sync.send({ type: 'state', ...s, timer });
  };
  const setTimer = (t) => {
    timer = writeTimer(t);
    broadcast();
    renderNotes();
  };
  const startTimer = () => setTimer({ startedAt: Date.now(), running: true });
  const resetTimer = () => setTimer({ startedAt: null, running: false });
  const startOrResetTimer = () => (timer.running ? resetTimer() : startTimer());

  director.on('change', () => { broadcast(); renderNotes(); });
  director.on('advance', ({ from, direction }) => {
    if (direction > 0 && from === 'opener' && !timer.running) startTimer();
  });
  sync.on((msg) => {
    if (msg.type !== 'cmd') return;
    switch (msg.cmd) {
      case 'next': director.next(); break;
      case 'prev': director.prev(); break;
      case 'goto': director.goto(msg.momentId != null ? msg.momentId : msg.momentIndex, msg.step || 0); break;
      case 'timer':
        if (msg.action === 'start') startTimer();
        else if (msg.action === 'reset') resetTimer();
        else startOrResetTimer();
        break;
      case 'hello': broadcast(); break;
      case 'key': if (keyHandler && typeof msg.key === 'string') keyHandler(msg.key); break;
      default:
    }
  });

  // ----- N: notes overlay for single-screen rehearsal -----
  let notesEl = null;
  let notesOpen = false;
  let notesTimer = null;
  function renderNotes() {
    if (!notesOpen || !notesEl) return;
    const s = director.state();
    if (!s) return;
    const m = director.current.m;
    const n = (data && data.notes && data.notes[m.id]) || null;
    const lines = n && Array.isArray(n.notes) && n.notes.length ? n.notes : [m.brief || ''];
    const icons = (data && data.beats && data.beats.icons) || {};
    const elapsed = timer.running && timer.startedAt ? formatClock(Date.now() - timer.startedAt) : 'timer off (T)';
    notesEl.replaceChildren();
    const head = document.createElement('div');
    head.className = 'notes-head';
    head.textContent = `${String(s.number).padStart(2, '0')} · ${m.id} · step ${s.step + 1}/${s.steps}${m.icon ? ` · ${icons[m.icon] || m.icon}` : ''}`;
    const clock = document.createElement('div');
    clock.className = 'notes-clock';
    clock.textContent = elapsed;
    const body = document.createElement('ul');
    body.className = 'notes-body';
    lines.forEach((l) => { const li = document.createElement('li'); li.textContent = l; body.appendChild(li); });
    notesEl.append(head, clock, body);
    if (n && n.transition) {
      const tr = document.createElement('div');
      tr.className = 'notes-transition';
      tr.textContent = `→ ${n.transition}`;
      notesEl.appendChild(tr);
    }
  }
  function toggleNotes(force) {
    notesOpen = typeof force === 'boolean' ? force : !notesOpen;
    if (!notesEl) {
      notesEl = document.createElement('div');
      notesEl.className = 'notes-overlay';
      const fam = (tokens && tokens.type && tokens.type.families) || {};
      notesEl.style.fontFamily = fam.sans || 'system-ui, sans-serif';
      stage.overlay.appendChild(notesEl);
    }
    notesEl.style.display = notesOpen ? '' : 'none';
    clearInterval(notesTimer);
    if (notesOpen) {
      renderNotes();
      notesTimer = setInterval(renderNotes, 1000);
    }
    return notesOpen;
  }

  function openPresenter() {
    const url = location.href.split('#')[0] + '#presenter';
    if (win && !win.closed) {
      win.focus();
      return win;
    }
    win = window.open(url, 'itaf-presenter', 'popup,width=1440,height=900');
    if (!win) console.warn('[itaf] the presenter window was blocked; allow pop-ups for this file');
    return win;
  }

  return {
    broadcast,
    toggleNotes,
    closeNotes: () => notesOpen && toggleNotes(false),
    startOrResetTimer,
    openPresenter,
    get timer() { return timer; },
    get presenterWindow() { return win; },
    setKeyHandler(fn) { keyHandler = fn; },
    dispose() { sync.close(); clearInterval(notesTimer); clearInterval(heartbeat); },
  };
}
