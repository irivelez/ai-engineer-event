// year-in-weeks (calm-a, PAPER data): almost a year of progress in 11 weeks (Epoch Capabilities Index).
// Step 0: the frontier score climbs 162.5 → 174 over 11 weeks (the chart spans those 11 weeks; 174 rolls in).
// Step 1: the x-axis zooms out to a full year and the dashed trend (about 14 points a year) draws across:
//         the 11-week climb turns steep, and a guide shows how far along the trend 174 would sit.
// Step 2: the caveat, in serif.
import { gsap } from 'gsap';
import { calmScene, el, svgEl, esc, factSource } from './_calm/kit.js';

export default calmScene('year-in-weeks', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const E = copy.eci || {};
  const M = T.space.margin;
  const LW = T.spanW(6);
  const nb = (x) => String(x || '').replace(/ /g, ' ');

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(7) }), M, 192);

  // ----- number: "162.5 → 174" (174 rolls, in the accent) -----
  const NY = 456;
  const numRow = el('div', '');
  place(numRow, M, NY, LW);
  Object.assign(numRow.style, { display: 'flex', alignItems: 'baseline', gap: '28px' });
  const from = el('div', 't-h1 tnum ca-nowrap', numRow, `${esc(E.from || '')}<span style="margin-left:24px">→</span>`);
  from.style.color = G.muted;
  const to = C.BigNumber.create({ display: nb(E.to), size: 'h1', ground: g, tone: 'accent' });
  numRow.appendChild(to.el);
  K.owned.push(to);
  const numB = K.block(numRow, {
    enter(tl) {
      tl.fromTo(from, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0);
      tl.add(to.set({ visible: true }, { animate: true }), 0.35);
    },
    settle() { gsap.set(from, { autoAlpha: 1, y: 0 }); to.set({ visible: true }, { animate: false }); },
    hide() { to.set({ visible: false }, { animate: false }); },
  });
  const lab = el('div', '');
  place(lab, M, NY + 160, LW);
  lab.innerHTML = `<div class="t-body" style="color:${G.fg}">${esc(E.label || '')}</div><div class="t-label" style="margin-top:16px;color:${G.muted}">${esc(E.dates || '')}</div>`;
  const labB = K.block(lab, { rise: 16 });
  const caveat = el('div', 'pretty');
  place(caveat, M, NY + 360, LW);
  Object.assign(caveat.style, { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '44px', lineHeight: '56px', color: G.fg });
  caveat.innerHTML = esc(copy.caveat || '');
  const caveatB = K.block(caveat, { rise: 16 });

  // ----- chart -----
  const f0 = parseFloat(E.from) || 162.5;
  const f1 = parseFloat(E.to) || 174;
  const perYear = parseFloat(String(E.trend || '').replace(/[^\d.]/g, '')) || 14;
  const WEEKS = 11;
  const CX = T.colX(7);
  const CW = T.spanW(5);
  const CY = 248;
  const CH = 600;
  const PADT = 40;
  const PADB = 64;
  const YMIN = 160;
  const YMAX = 178;
  const chart = el('div', '');
  place(chart, CX, CY, CW, CH + 60);
  const svg = svgEl('svg', { width: CW, height: CH, viewBox: `0 0 ${CW} ${CH}` }, chart);
  svg.style.overflow = 'visible';
  const yv = (v) => PADT + (1 - (v - YMIN) / (YMAX - YMIN)) * (CH - PADT - PADB);
  const base = svgEl('line', { x1: 0, x2: CW, y1: CH - PADB, y2: CH - PADB, stroke: G.muted, 'stroke-width': 2 }, svg);
  const trend = svgEl('path', { fill: 'none', stroke: G.muted, 'stroke-width': 4, 'stroke-dasharray': '2 14', 'stroke-linecap': 'round' }, svg);
  const guide = svgEl('path', { fill: 'none', stroke: G.quiet, 'stroke-width': 2, 'stroke-dasharray': '8 10' }, svg);
  const actual = svgEl('path', { fill: 'none', stroke: G.accent, 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
  const d0 = svgEl('circle', { r: 9, fill: G.bg, stroke: G.accent, 'stroke-width': 4 }, svg);
  const d1 = svgEl('circle', { r: 11, fill: G.accent }, svg);
  const tick = svgEl('line', { stroke: G.muted, 'stroke-width': 2 }, svg);
  const [dStart, dEnd] = String(E.dates || '').split('→').map((s) => s.trim());
  const xl0 = el('div', 't-label', chart, esc(dStart || ''));
  const xl1 = el('div', 't-label', chart, esc(dEnd || ''));
  Object.assign(xl0.style, { position: 'absolute', top: `${CH - PADB + 16}px`, left: '0px', color: G.muted, whiteSpace: 'nowrap' });
  Object.assign(xl1.style, { position: 'absolute', top: `${CH - PADB + 16}px`, color: G.muted, whiteSpace: 'nowrap' });
  const trendL = el('div', 't-label', chart, esc(E.trend || ''));
  Object.assign(trendL.style, { position: 'absolute', color: G.muted, whiteSpace: 'nowrap', textTransform: 'none', fontFamily: 'var(--f-sans)', letterSpacing: '0' });
  const v0 = el('div', 't-label tnum', chart, esc(E.from || ''));
  Object.assign(v0.style, { position: 'absolute', color: G.muted });

  // zoom state z: 0 = x spans 11 weeks, 1 = x spans 52 weeks
  const state = { z: 0, trend: 0 };
  function draw() {
    const span = WEEKS + (52 - WEEKS) * state.z;
    const xw = (w) => (w / span) * CW;
    actual.setAttribute('d', `M0,${yv(f0).toFixed(1)} L${xw(WEEKS).toFixed(1)},${yv(f1).toFixed(1)}`);
    d0.setAttribute('cx', 0); d0.setAttribute('cy', yv(f0));
    d1.setAttribute('cx', xw(WEEKS)); d1.setAttribute('cy', yv(f1));
    tick.setAttribute('x1', xw(WEEKS)); tick.setAttribute('x2', xw(WEEKS));
    tick.setAttribute('y1', CH - PADB); tick.setAttribute('y2', CH - PADB + 12);
    // right-aligned to the tick while there is room, else left-aligned after "1 Sep"
    const tx = xw(WEEKS);
    xl1.style.left = `${Math.max(150, tx - 270).toFixed(1)}px`; // continuous: ends at the tick, never over "1 Sep"
    xl1.style.width = '300px';
    // trend from (0, f0) at perYear/52 per week, drawn to `trend` share of the year
    const wEnd = 52 * state.trend;
    trend.setAttribute('d', `M0,${yv(f0).toFixed(1)} L${xw(wEnd).toFixed(1)},${yv(f0 + (perYear * wEnd) / 52).toFixed(1)}`);
    const wMeet = ((f1 - f0) / perYear) * 52; // when the trend would reach 174 (≈ 43 weeks)
    const gEnd = Math.min(wMeet, wEnd);
    guide.setAttribute('d', state.trend > 0 ? `M${xw(WEEKS).toFixed(1)},${yv(f1).toFixed(1)} L${xw(Math.max(WEEKS, gEnd)).toFixed(1)},${yv(f1).toFixed(1)}` : '');
    trendL.style.left = `${Math.min(CW - 420, xw(wEnd) - 420)}px`;
    trendL.style.top = `${yv(f0 + (perYear * wEnd) / 52) - 64}px`;
    trendL.style.width = '420px';
    trendL.style.textAlign = 'right';
    v0.style.left = '24px';
    v0.style.top = `${yv(f0) + 18}px`;
  }
  draw();
  let len = 0;
  const chartB = K.block(chart, {
    enter(tl) {
      state.z = 0; state.trend = 0; draw();
      len = actual.getTotalLength() || 700;
      gsap.set([trend, guide, trendL], { autoAlpha: 0 });
      tl.fromTo(base, { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 0.8, ease: 'expo.out' }, 0);
      tl.fromTo([xl0, xl1, v0], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, 0.2);
      tl.fromTo(d0, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, ease: 'power3.out' }, 0.3);
      tl.fromTo(actual, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.4);
      tl.fromTo(d1, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'power3.out' }, 1.7);
    },
    settle() {
      gsap.set(base, { scaleX: 1 });
      gsap.set([xl0, xl1, v0], { autoAlpha: 1, y: 0 });
      gsap.set([d0, d1], { scale: 1 });
      gsap.set(actual, { strokeDasharray: 'none', strokeDashoffset: 0 });
    },
  });

  function zoom(step, anim, tl) {
    const z = step >= 1 ? 1 : 0;
    const tr = step >= 1 ? 1 : 0;
    if (anim && (state.z !== z || state.trend !== tr)) {
      gsap.set(actual, { strokeDasharray: 'none' });
      if (tr) gsap.set([trend, guide], { autoAlpha: 1 });
      tl.to(state, { z, duration: 1.4, ease: 'power3.inOut', onUpdate: draw }, 0.1);
      tl.to(state, { trend: tr, duration: tr ? 1.8 : 0.6, ease: tr ? 'power2.inOut' : 'power2.in', onUpdate: draw }, tr ? 1.2 : 0);
      tl.to(trendL, { autoAlpha: tr, duration: 0.6, ease: 'power2.out' }, tr ? 2.6 : 0);
    } else if (!anim) {
      state.z = z; state.trend = tr; draw();
      gsap.set([trend, guide, trendL], { autoAlpha: tr });
    }
  }

  const foot = K.footer();
  const sJump = factSource(ctx, 'eci-jump');
  const sTrend = factSource(ctx, 'eci-trend-14');
  const sCave = factSource(ctx, 'eci-one-data-point');

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: numB, on: () => true, at: 0.3 },
    { c: labB, on: () => true, at: 0.5 },
    { c: chartB, on: () => true, at: 0.2 },
    { c: caveatB, on: (s) => s >= 2, at: 0.1 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    zoom(step, anim, tl);
    foot.show(step === 0 ? sJump : step === 1 ? sTrend : sCave, anim, tl, 0.6);
    return tl;
  }
  return { go };
});
