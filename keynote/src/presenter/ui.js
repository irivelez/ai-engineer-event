// Presenter window (#presenter): a speaker tool for a laptop screen (≥ 1440×900).
// Current moment (act, title, step k/n, big cue icon + idea name), notes (25 px), sources as links, the next
// step / next moment with its static-frame thumbnail, the timer block (elapsed, planned elapsed, delta,
// time in moment vs plan, Bogotá clock) and act progress. Keys here drive the audience window.
import { createSync, readTimer, readLastState } from './sync.js';
import { iconMarkup } from '../engine/hud.js';
import { formatClock } from './format.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

export function momentTitle(m) {
  const c = m.copy || {};
  return c.title || c.line || c.line1 || c.actTitle || c.fallbackTitle || c.cta || m.id;
}

export function mountPresenterUI(env) {
  const { data, icons } = env;
  const beats = data.beats;
  const moments = beats.moments;
  const acts = beats.acts || [];
  const notesMap = data.notes || {};
  const frameSet = new Set(data.frames || []);
  const iconNames = beats.icons || {};
  const totalPlanned = moments.reduce((a, m) => a + (m.plannedSec || 0), 0);
  const startOf = [];
  moments.reduce((a, m, i) => { startOf[i] = a; return a + (m.plannedSec || 0); }, 0);

  document.title = `Presenter · ${beats.title || ''}`;
  document.documentElement.classList.add('pz-html');
  document.body.className = 'pz';
  document.body.replaceChildren();

  // ---------- layout ----------
  const top = el('header', 'pz-top');
  const actBar = el('div', 'pz-acts');
  const clock = el('div', 'pz-clock');
  const link = el('div', 'pz-link');
  top.append(actBar, link, clock);

  const main = el('main', 'pz-main');
  const now = el('section', 'pz-now');
  const side = el('aside', 'pz-side');
  main.append(now, side);

  const nowHead = el('div', 'pz-nowhead');
  const nowNum = el('div', 'pz-num');
  const nowAct = el('div', 'pz-act');
  nowHead.append(nowNum, nowAct);
  const cueRow = el('div', 'pz-cue');
  const cueIcon = el('div', 'pz-cueicon');
  const cueText = el('div', 'pz-cuetext');
  const title = el('h1', 'pz-title');
  cueRow.append(cueIcon, cueText);
  const stepRow = el('div', 'pz-steprow');
  const dots = el('div', 'pz-dots');
  const stepText = el('div', 'pz-steptext');
  stepRow.append(dots, stepText);
  const notes = el('ul', 'pz-notes');
  const sources = el('div', 'pz-sources');
  const transition = el('div', 'pz-transition');
  now.append(nowHead, title, cueRow, stepRow, notes, transition, sources);

  const timer = el('div', 'pz-timer');
  const elapsed = el('div', 'pz-elapsed', '0:00');
  const tLabel = el('div', 'pz-tlabel', 'Elapsed');
  const plan = el('div', 'pz-plan');
  const delta = el('div', 'pz-delta');
  const inMoment = el('div', 'pz-inmoment');
  const inBar = el('div', 'pz-inbar');
  const inFill = el('div', 'pz-infill');
  inBar.appendChild(inFill);
  const timerBtn = el('button', 'pz-btn pz-timerbtn', 'Start timer (T)');
  timer.append(tLabel, elapsed, plan, delta, inMoment, inBar, timerBtn);

  const next = el('div', 'pz-next');
  const nextLabel = el('div', 'pz-nextlabel', 'Next');
  const thumb = el('div', 'pz-thumb');
  const thumbImg = el('img', 'pz-thumbimg');
  thumbImg.alt = '';
  const thumbCard = el('div', 'pz-thumbcard');
  thumb.append(thumbImg, thumbCard);
  const nextTitle = el('div', 'pz-nexttitle');
  const nextMeta = el('div', 'pz-nextmeta');
  next.append(nextLabel, thumb, nextTitle, nextMeta);
  side.append(timer, next);

  const foot = el('footer', 'pz-foot');
  const prevBtn = el('button', 'pz-btn', '◀ Prev');
  const nextBtn = el('button', 'pz-btn pz-primary', 'Next ▶');
  const jump = el('div', 'pz-jump');
  const keysHint = el('div', 'pz-keys', '→ / Space next · ← back · number + Enter jump · T timer · B blackout · W whiteout · H cue icon · Home / End');
  foot.append(prevBtn, nextBtn, jump, keysHint);
  document.body.append(top, main, foot);

  // ---------- act progress ----------
  const actSegs = acts.map((a) => {
    const ms = moments.filter((m) => m.act === a.id);
    const sec = ms.reduce((x, m) => x + (m.plannedSec || 0), 0);
    const seg = el('div', 'pz-actseg');
    seg.style.flexGrow = String(Math.max(1, sec));
    const fill = el('div', 'pz-actfill');
    const lab = el('div', 'pz-actlab', `${a.n ? a.n + ' ' : ''}${a.title}`);
    seg.append(fill, lab);
    actBar.appendChild(seg);
    return { a, seg, fill, ms };
  });

  // ---------- state ----------
  const sync = createSync('presenter', { getPeer: () => window.opener });
  let state = readLastState();
  let timerState = readTimer();
  let lastMsgAt = 0;
  let digits = '';

  const idx = () => {
    if (!state) return 0;
    const i = moments.findIndex((m) => m.id === state.momentId);
    return i >= 0 ? i : 0;
  };

  function renderMoment() {
    const i = idx();
    const m = moments[i];
    if (!m) return;
    const step = state ? state.step || 0 : 0;
    const steps = state ? state.steps || (m.steps || []).length || 1 : (m.steps || []).length || 1;
    const act = acts.find((a) => a.id === m.act);
    nowNum.textContent = `${String(m.n || i + 1).padStart(2, '0')} / ${moments.length}`;
    nowAct.textContent = act ? `${act.n ? act.n + ' · ' : ''}${act.title}` : m.act;
    title.textContent = momentTitle(m);
    const iconHtml = m.icon ? iconMarkup(icons, m.icon, 72) : null;
    cueIcon.innerHTML = iconHtml || '';
    cueIcon.style.display = iconHtml ? '' : 'none';
    cueText.textContent = m.icon ? (iconNames[m.icon] || m.icon) : 'No cue';
    cueRow.classList.toggle('is-empty', !m.icon);
    dots.replaceChildren(...Array.from({ length: steps }, (_, k) => el('span', `pz-dot${k === step ? ' is-on' : k < step ? ' is-done' : ''}`)));
    stepText.textContent = `Step ${step + 1} of ${steps}${m.steps && m.steps[step] ? ` · ${m.steps[step]}` : ''}`;
    const n = notesMap[m.id] || {};
    const lines = Array.isArray(n.notes) && n.notes.length ? n.notes : [m.brief || ''];
    notes.replaceChildren(...lines.map((l) => el('li', null, l)));
    transition.textContent = n.transition ? `→ ${n.transition}` : '';
    transition.style.display = n.transition ? '' : 'none';
    sources.replaceChildren();
    const srcs = Array.isArray(n.sources) ? n.sources : [];
    if (srcs.length) {
      sources.appendChild(el('span', 'pz-srclabel', 'Sources'));
      srcs.forEach((s) => {
        const a = el('a', 'pz-src', s.label || s.url);
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noopener';
        sources.appendChild(a);
      });
    }
    // next: the next step in this moment, else the next moment
    if (step < steps - 1) {
      nextLabel.textContent = 'Next step';
      nextTitle.textContent = (m.steps && m.steps[step + 1]) || `Step ${step + 2}`;
      nextMeta.textContent = `${momentTitle(m)} · step ${step + 2}/${steps}`;
      setThumb(m, step + 1);
    } else if (moments[i + 1]) {
      const nm = moments[i + 1];
      nextLabel.textContent = 'Next moment';
      nextTitle.textContent = momentTitle(nm);
      nextMeta.textContent = `${String(nm.n || i + 2).padStart(2, '0')} · ${nm.ground} · ${nm.mode} · ${nm.plannedSec} s${nm.icon ? ` · ${iconNames[nm.icon] || nm.icon}` : ''}`;
      setThumb(nm, 0);
    } else {
      nextLabel.textContent = 'Next';
      nextTitle.textContent = 'End of keynote';
      nextMeta.textContent = '';
      setThumb(null, 0);
    }
    actSegs.forEach((s) => s.seg.classList.toggle('is-current', s.a.id === m.act));
  }

  function setThumb(m, step) {
    if (!m) {
      thumbImg.style.display = 'none';
      thumbCard.style.display = 'none';
      return;
    }
    thumbCard.textContent = momentTitle(m);
    thumbCard.dataset.ground = m.ground;
    const src = `static/frames/${String(m.n).padStart(2, '0')}-${m.id}-${step}.webp`;
    const showCard = () => { thumbImg.style.display = 'none'; thumbCard.style.display = ''; };
    const showImg = () => { thumbImg.style.display = ''; thumbCard.style.display = 'none'; };
    if (!frameSet.has(src)) {
      thumbImg.removeAttribute('src');
      return showCard();
    }
    if (thumbImg.getAttribute('src') === src && thumbImg.complete && thumbImg.naturalWidth) return showImg();
    showCard();
    thumbImg.onload = showImg;
    thumbImg.onerror = showCard;
    thumbImg.src = src;
  }

  function renderClock() {
    const i = idx();
    const m = moments[i] || {};
    const step = state ? state.step || 0 : 0;
    const steps = state ? state.steps || 1 : 1;
    const nowMs = Date.now();
    const el_ = timerState.running && timerState.startedAt ? nowMs - timerState.startedAt : 0;
    elapsed.textContent = formatClock(el_);
    elapsed.classList.toggle('is-off', !timerState.running);
    timerBtn.textContent = timerState.running ? 'Reset timer (T)' : 'Start timer (T)';
    const plannedMs = ((startOf[i] || 0) + ((m.plannedSec || 0) * step) / steps) * 1000;
    plan.textContent = `Planned here ${formatClock(plannedMs)} of ${formatClock(totalPlanned * 1000)}`;
    if (timerState.running) {
      const d = el_ - plannedMs; // > 0: behind schedule
      const ad = Math.abs(d);
      delta.textContent = ad < 15000 ? 'On time' : `${formatClock(ad)} ${d > 0 ? 'behind' : 'ahead'}`;
      delta.dataset.tone = d <= 60000 ? 'good' : d <= 180000 ? 'warn' : 'bad';
    } else {
      delta.textContent = 'Timer starts on the first advance out of the opener, or T';
      delta.dataset.tone = 'idle';
    }
    const inMs = state && state.enteredAt ? nowMs - state.enteredAt : 0;
    const planMs = (m.plannedSec || 0) * 1000;
    inMoment.textContent = `In this moment ${formatClock(inMs)} / ${formatClock(planMs)}`;
    inFill.style.width = `${Math.min(100, planMs ? (inMs / planMs) * 100 : 0)}%`;
    inBar.dataset.tone = inMs <= planMs ? 'good' : inMs <= planMs * 1.5 ? 'warn' : 'bad';
    clock.textContent = `${new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(nowMs))} Bogotá`;
    // act progress: fill by planned position
    const pos = (startOf[i] || 0) + ((m.plannedSec || 0) * step) / steps;
    actSegs.forEach((s) => {
      const a0 = startOf[moments.indexOf(s.ms[0])] || 0;
      const sec = s.ms.reduce((x, mm) => x + (mm.plannedSec || 0), 0);
      s.fill.style.width = `${Math.max(0, Math.min(1, sec ? (pos - a0) / sec : 0)) * 100}%`;
    });
    const live = nowMs - lastMsgAt < 15000;
    link.textContent = live ? 'Linked to audience' : 'Waiting for the audience window (open it, press P there)';
    link.dataset.live = live ? '1' : '0';
  }

  // ---------- sync ----------
  sync.on((msg) => {
    if (msg.type !== 'state') return;
    lastMsgAt = Date.now();
    state = msg;
    if (msg.timer) timerState = msg.timer;
    renderMoment();
    renderClock();
  });
  window.addEventListener('storage', (e) => { if (e.key === 'itaf-timer') { timerState = readTimer(); renderClock(); } });
  const cmd = (c, extra = {}) => sync.send({ type: 'cmd', cmd: c, ...extra });
  const key = (k) => sync.send({ type: 'cmd', cmd: 'key', key: k });

  prevBtn.addEventListener('click', () => cmd('prev'));
  nextBtn.addEventListener('click', () => cmd('next'));
  timerBtn.addEventListener('click', () => cmd('timer', { action: 'toggle' }));
  actSegs.forEach((s) => s.seg.addEventListener('click', () => s.ms[0] && cmd('goto', { momentId: s.ms[0].id, step: 0 })));

  function setDigits(d) {
    digits = d;
    jump.textContent = digits ? `Go to ${digits} ↵` : '';
  }
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) { setDigits((digits + k).slice(-2)); e.preventDefault(); return; }
    if (digits && k === 'Enter') { cmd('goto', { momentId: String(parseInt(digits, 10)), step: 0 }); setDigits(''); e.preventDefault(); return; }
    if (digits && (k === 'Backspace' || k === 'Escape')) { setDigits(k === 'Escape' ? '' : digits.slice(0, -1)); e.preventDefault(); return; }
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(k)) { cmd('next'); e.preventDefault(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { cmd('prev'); e.preventDefault(); }
    else if (k === 'Home' || k === 'End') { key(k); e.preventDefault(); }
    else if (k === 't' || k === 'T') { cmd('timer', { action: 'toggle' }); e.preventDefault(); }
    else if (['b', 'B', '.', 'w', 'W', ',', 'h', 'H', 'g', 'G', 'n', 'N'].includes(k)) { key(k); e.preventDefault(); }
  });

  renderMoment();
  renderClock();
  setInterval(renderClock, 250);
  cmd('hello');
  return { sync };
}
