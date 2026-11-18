// static.html viewer (A2): the keynote as pre-rendered frames (static/frames/*.webp) with the same keys,
// fullscreen, N notes overlay, T timer, P presenter window and presenter sync as index.html.
// Data is injected by scripts/render-static.mjs as window.__ITAF_STATIC__ = { beats, notes, frames }.
import { createStage } from '../engine/stage.js';
import { createOverlays } from '../engine/overlays.js';
import { createHud } from '../engine/hud.js';
import { bindKeys } from '../engine/keys.js';
import { attachAudience } from '../presenter/index.js';
import '../engine/engine.css';
import '../presenter/presenter.css';

const D = window.__ITAF_STATIC__;
const moments = D.beats.moments;
const framesOf = new Map();
for (const f of D.frames) {
  if (!framesOf.has(f.id)) framesOf.set(f.id, []);
  framesOf.get(f.id)[f.step] = f.file;
}

const stage = createStage();
const img = document.createElement('img');
img.className = 'static-frame';
img.alt = '';
const wrap = document.createElement('div');
wrap.className = 'moment';
wrap.style.visibility = 'visible';
wrap.appendChild(img);
stage.moments.appendChild(wrap);

const listeners = new Map();
const on = (n, fn) => { if (!listeners.has(n)) listeners.set(n, new Set()); listeners.get(n).add(fn); };
const emit = (n, p) => (listeners.get(n) || []).forEach((fn) => fn(p));
let i = 0;
let step = 0;
let enteredAt = Date.now();
const stepsOf = (k) => Math.max(1, (framesOf.get(moments[k].id) || []).length || (moments[k].steps || []).length || 1);
const director = {
  moments,
  on,
  get current() { return { m: moments[i], i, steps: stepsOf(i) }; },
  state() {
    const m = moments[i];
    return { momentId: m.id, momentIndex: i, number: m.n || i + 1, step, steps: stepsOf(i), total: moments.length, ground: m.ground, icon: m.icon || null, act: m.act, enteredAt, at: Date.now() };
  },
  show(k, s) {
    const changed = k !== i;
    i = Math.max(0, Math.min(moments.length - 1, k));
    step = Math.max(0, Math.min(stepsOf(i) - 1, s));
    if (changed) enteredAt = Date.now();
    const m = moments[i];
    const file = (framesOf.get(m.id) || [])[step];
    if (file) img.src = file;
    else img.removeAttribute('src');
    img.style.visibility = file ? 'visible' : 'hidden';
    const bg = m.ground === 'paper' ? '#FFFFFF' : '#05070A';
    wrap.style.backgroundColor = bg;
    stage.setLetterbox(m.id === 'opener' ? '#000000' : bg, 0);
    hud.set(null, m.ground, 0); // frames already contain the cue icon
    emit('change', director.state());
  },
  next() {
    if (step < stepsOf(i) - 1) return director.show(i, step + 1);
    if (i < moments.length - 1) { emit('advance', { from: moments[i].id, to: moments[i + 1].id, direction: 1 }); director.show(i + 1, 0); }
  },
  prev() {
    if (step > 0) return director.show(i, step - 1);
    if (i > 0) director.show(i - 1, stepsOf(i - 1) - 1);
  },
  goto(target, s = 0) {
    let k = typeof target === 'number' ? target : moments.findIndex((m) => m.id === target);
    if (k < 0 && Number.isFinite(parseInt(target, 10))) k = moments.findIndex((m) => m.n === parseInt(target, 10));
    if (k >= 0) director.show(k, s);
  },
  settled: () => true,
};
const hud = createHud({ stage, icons: {}, grounds: {}, visible: false });
const overlays = createOverlays({ stage, director, tokens: {}, params: {} });
const audience = attachAudience(director, { stage, data: { beats: D.beats, notes: D.notes }, tokens: {} });
bindKeys({ director, overlays, hud, audience, stage, openPresenter: () => audience.openPresenter() });
window.__itaf = { director, audience, next: () => director.next(), prev: () => director.prev(), goto: (m, s) => director.goto(m, s), state: () => director.state(), settled: () => true, ready: true };
const q = new URLSearchParams(location.search);
director.goto(q.get('m') || 0, parseInt(q.get('s') || '0', 10) || 0);
