// two-speeds (PAPER data): the labs move in weeks, the real economy moves in years.
// Step 0: left column, the labs, "Measured in weeks": two figures whose values are read from facts.json
//         (copy holds only the fact id and the label, so a refreshed fact updates the slide), each with chip + source.
// Step 1: right column, the real economy, "Measured in years": Census BTOS (US) and Cetic.br (Brazil), each with
//         last year's reading beside the number, so the slow climb is visible.
// Step 2: the columns step out. The line on the left ("adoption speed" in the accent); on the right the Latin
//         American press that says the same this month (Bloomberg Línea, El Economista); one PRESS line names both.
// Successor of the old adoption moment: same calm-b kit, same clippings and crops.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { actLine, ensureCSS, sourceOf, capCard, capMeta, accentWord, clearAccent } from './_calm-b/kit.js';

// clippings for step 2 (crops keep masthead + headline, skip ad slots), as curated for the adoption moment
const CLIPS = [
  { id: 'bloomberglinea-latam-ai-impact', segs: [[0, 190], [385, 640]] },
  { id: 'eleconomista-almacenes-ia-32', segs: [[64, 196], [262, 484]] },
];

export default calmScene('two-speeds', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  // Two symmetric columns, 760 px each with a 144 px gap around the centre line: a source row
  // ("chip + Publisher · date") is up to ~870 px, so spanW(5) columns would collide or cross the margin.
  const CW = 760;
  const LX = M;
  const RX = 1920 - M - CW;
  const HEAD_Y = 328;
  const FIG_Y = [476, 734];
  const calm = T.motion.calmIn;

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(8) }), M, 192, T.spanW(8));

  // ----- column header: label + pace -----
  function header(x, label, pace) {
    const box = el('div', '');
    place(box, x, HEAD_Y, CW);
    const a = el('div', 't-label', box, esc(label || ''));
    a.style.color = G.muted;
    const b = el('div', 't-lead', box, esc(pace || ''));
    b.style.color = G.fg;
    return K.block(box, { rise: 16 });
  }

  // ----- one figure: value (from facts.json) + optional last-year reading, label, chip + source -----
  function figure(x, y, spec) {
    if (!spec) return null;
    const s = sourceOf(ctx, spec.fact);
    const f = s && s.fact;
    if (!f || f.value == null || typeof f.value === 'object') return null;
    const box = el('div', '');
    place(box, x, y, CW);
    const mask = el('div', 'ca-mask', box);
    const row = el('div', '', mask);
    Object.assign(row.style, { display: 'flex', alignItems: 'baseline', gap: '28px' });
    const num = el('span', 't-h2 tnum', row, esc(String(f.value)));
    num.style.color = G.fg;
    num.style.whiteSpace = 'nowrap';
    let delta = null;
    if (spec.delta) {
      delta = el('span', 't-label', row, esc(spec.delta));
      Object.assign(delta.style, { color: G.muted, whiteSpace: 'nowrap' });
    }
    const lab = el('div', 'ca-sans40 balance', box, esc(spec.label || ''));
    Object.assign(lab.style, { color: G.fg, marginTop: '6px' });
    // chip + 'Publisher · date'; a long publisher list wraps under itself at a ' · ', never inside a date
    const src = el('div', 'cb-src', box, `${C.chipHTML(s.kind)}<span class="t-source">${s.text.split(' · ').map((p) => esc(p).replace(/ /g, '&nbsp;')).join(' · ')}</span>`);
    Object.assign(src.style, { marginTop: '14px', whiteSpace: 'normal', alignItems: 'flex-start' });
    const txt = src.querySelector('.t-source');
    if (txt) Object.assign(txt.style, { flex: '1 1 0', minWidth: '0' });
    src.classList.add('ground-' + g);
    const late = [lab, src];
    return K.block(box, {
      enter(tl) {
        tl.fromTo(row, { yPercent: 110 }, { yPercent: 0, duration: calm.dur, ease: calm.ease }, 0);
        tl.fromTo(late, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: calm.dur, ease: calm.ease, stagger: 0.14 }, 0.3);
      },
      settle() { gsap.set(row, { yPercent: 0 }); gsap.set(late, { autoAlpha: 1, y: 0 }); },
    });
  }

  const labs = copy.labs || [];
  const econ = copy.economy || [];
  const headL = header(LX, copy.labsLabel, copy.labsPace);
  const headR = header(RX, copy.economyLabel, copy.economyPace);
  const figsL = FIG_Y.map((y, i) => figure(LX, y, labs[i])).filter(Boolean);
  const figsR = FIG_Y.map((y, i) => figure(RX, y, econ[i])).filter(Boolean);

  // ----- step 2: the line + the Latin American press -----
  const line = K.add(C.Headline.create({ text: copy.line || '', role: 'h2', ground: g, width: T.spanW(6) }), M, 344, T.spanW(6));
  const CX = T.colX(7) + 32;
  const CLW = 1920 - M - CX;
  const GAP = 24;
  const clips = [];
  CLIPS.forEach((spec) => {
    const c = capCard(ctx, spec.id, { width: CLW, segs: spec.segs, ground: g, caption: false });
    if (c) clips.push({ c, h: c.height || 180, m: c.meta || {} });
  });
  const totalH = clips.reduce((t, x) => t + x.h, 0) + GAP * Math.max(0, clips.length - 1);
  let cy = Math.round(312 + Math.max(0, (944 - 312 - totalH) / 2));
  const clipBlocks = clips.map((x, i) => {
    place(x.c.el, CX, cy, CLW);
    x.c.el.style.zIndex = String(10 + i);
    cy += x.h + GAP;
    K.owned.push(x.c);
    return K.block(x.c.el, {
      enter(tl) {
        x.c.set({ visible: true }, { animate: false });
        tl.fromTo(x.c.el, { autoAlpha: 0, x: 56 }, { autoAlpha: 1, x: 0, duration: calm.dur, ease: calm.ease }, 0);
      },
      settle() { x.c.set({ visible: true }, { animate: false }); gsap.set(x.c.el, { x: 0 }); },
    });
  });
  const pressSrc = clips.length ? { kind: 'press', text: clips.map((x) => [x.m.outlet, capMeta(x.m).date].filter(Boolean).join(', ')).join(' · ') } : null;

  const foot = K.footer();
  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: headL, on: (s) => s <= 1, at: 0.2 },
    ...figsL.map((b, i) => ({ c: b, on: (s) => s <= 1, at: 0.4 + i * 0.3 })),
    { c: headR, on: (s) => s === 1, at: 0.1 },
    ...figsR.map((b, i) => ({ c: b, on: (s) => s === 1, at: 0.35 + i * 0.3 })),
    { c: line, on: (s) => s >= 2, at: 0.2 },
    ...clipBlocks.map((b, i) => ({ c: b, on: (s) => s >= 2, at: 1.2 + i * 0.25 })),
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    clearAccent(line.el);
    apply(step, anim, tl, info);
    // one word only: the live line-mask splits words into their own nodes, so a two-word match would
    // accent in render mode but not live
    if (step >= 2) accentWord(line.el, 'adoption');
    foot.show(step >= 2 ? pressSrc : null, anim, tl, 0.8);
    return tl;
  }
  return { go };
});
