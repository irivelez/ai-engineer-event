// year-in-weeks (calm-a, PAPER data): almost a year of progress in 11 weeks (Epoch Capabilities Index).
// Step 0: the two points we know, 162.5 on 1 Sep and 174 in mid-Nov, joined by a straight line (174 rolls in).
// Step 1: the trend over the same 11 weeks (about 14 points a year, so ≈ 165.5 by mid-Nov) draws dashed; the
//         gap at the right edge, bracketed in the accent, is the story.
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
  lab.innerHTML = `<div class="t-body" style="color:${G.fg}">${esc(E.label || '')}</div>`; // dates live on the chart's axis
  const labB = K.block(lab, { rise: 16 });
  const caveat = el('div', 'pretty');
  place(caveat, M, NY + 360, LW);
  Object.assign(caveat.style, { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '44px', lineHeight: '56px', color: G.fg });
  caveat.innerHTML = esc(copy.caveat || '');
  const caveatB = K.block(caveat, { rise: 16 });

  // ----- chart: only what we know. Two points (162.5 on 1 Sep, 174 in mid-Nov) joined by a straight line;
  // step 1 adds the trend over the same 11 weeks (about 14 points a year → ≈ 165.5) and brackets the gap. -----
  const f0 = parseFloat(E.from) || 162.5;
  const f1 = parseFloat(E.to) || 174;
  const perYear = parseFloat(String(E.trend || '').replace(/[^\d.]/g, '')) || 14;
  const WEEKS = 11;
  const fT = f0 + (perYear * WEEKS) / 52; // where the trend would be by mid-Nov
  const CX = T.colX(6) + 40;
  const CW = T.colX(11) + T.space.col - CX - 230; // room on the right for the end labels
  const CY = 236;
  const CH = 640;
  const PADT = 40;
  const PADB = 72;
  const YMIN = 160;
  const YMAX = 176;
  const chart = el('div', '');
  place(chart, CX, CY, CW + 230, CH + 60);
  const svg = svgEl('svg', { width: CW + 230, height: CH, viewBox: `0 0 ${CW + 230} ${CH}` }, chart);
  svg.style.overflow = 'visible';
  const yv = (v) => PADT + (1 - (v - YMIN) / (YMAX - YMIN)) * (CH - PADT - PADB);
  const xw = (w) => (w / WEEKS) * CW;
  const base = svgEl('line', { x1: 0, x2: CW, y1: CH - PADB, y2: CH - PADB, stroke: G.muted, 'stroke-width': 2 }, svg);
  const tick0 = svgEl('line', { x1: 0, x2: 0, y1: CH - PADB, y2: CH - PADB + 14, stroke: G.muted, 'stroke-width': 2 }, svg);
  const tick1 = svgEl('line', { x1: CW, x2: CW, y1: CH - PADB, y2: CH - PADB + 14, stroke: G.muted, 'stroke-width': 2 }, svg);
  const trend = svgEl('path', { d: `M0,${yv(f0).toFixed(1)} L${CW},${yv(fT).toFixed(1)}`, fill: 'none', stroke: G.muted, 'stroke-width': 5, 'stroke-dasharray': '2 14', 'stroke-linecap': 'round' }, svg);
  const actual = svgEl('path', { d: `M0,${yv(f0).toFixed(1)} L${CW},${yv(f1).toFixed(1)}`, fill: 'none', stroke: G.accent, 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
  const d0 = svgEl('circle', { cx: 0, cy: yv(f0), r: 10, fill: G.bg, stroke: G.accent, 'stroke-width': 4 }, svg);
  const d1 = svgEl('circle', { cx: CW, cy: yv(f1), r: 12, fill: G.accent }, svg);
  const dT = svgEl('circle', { cx: CW, cy: yv(fT), r: 9, fill: G.bg, stroke: G.muted, 'stroke-width': 4 }, svg);
  // the gap at the right edge: a bracket from the trend's end up to 174
  const gx = CW + 40;
  const gap = svgEl('g', {}, svg);
  svgEl('line', { x1: gx, x2: gx, y1: yv(fT), y2: yv(f1), stroke: G.accent, 'stroke-width': 4, 'stroke-linecap': 'round' }, gap);
  svgEl('line', { x1: gx - 12, x2: gx, y1: yv(fT), y2: yv(fT), stroke: G.accent, 'stroke-width': 4, 'stroke-linecap': 'round' }, gap);
  svgEl('line', { x1: gx - 12, x2: gx, y1: yv(f1), y2: yv(f1), stroke: G.accent, 'stroke-width': 4, 'stroke-linecap': 'round' }, gap);
  const [dStart, dEnd] = String(E.dates || '').split('→').map((t) => t.trim());
  const xl0 = el('div', 't-label', chart, esc(dStart || ''));
  Object.assign(xl0.style, { position: 'absolute', top: `${CH - PADB + 24}px`, left: '0px', color: G.muted, whiteSpace: 'nowrap' });
  const xl1 = el('div', 't-label', chart, esc(dEnd || ''));
  Object.assign(xl1.style, { position: 'absolute', top: `${CH - PADB + 24}px`, left: `${CW - 400}px`, width: '400px', textAlign: 'right', color: G.muted, whiteSpace: 'nowrap' });
  const v0 = el('div', 't-lead tnum', chart, esc(E.from || ''));
  Object.assign(v0.style, { position: 'absolute', left: '24px', top: `${yv(f0) + 16}px`, color: G.muted });
  const v1 = el('div', 't-lead tnum', chart, esc(E.to || ''));
  Object.assign(v1.style, { position: 'absolute', left: `${CW - 160}px`, width: '130px', textAlign: 'right', top: `${yv(f1) - 36}px`, color: G.accent, fontWeight: '600' });
  const trendL = el('div', 'ca-sans32 pretty', chart, esc(E.trend || ''));
  Object.assign(trendL.style, { position: 'absolute', left: `${gx + 20}px`, width: '210px', top: `${yv(fT) - 30}px`, color: G.muted });
  let lenA = 0;
  const chartB = K.block(chart, {
    enter(tl) {
      lenA = lenA || actual.getTotalLength() || 900;
      gsap.set([trend, dT, gap, trendL], { autoAlpha: 0 });
      tl.fromTo([base, tick0, tick1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 0);
      tl.fromTo([xl0, xl1], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, 0.15);
      tl.fromTo([d0, v0], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, 0.3);
      tl.fromTo(actual, { strokeDasharray: lenA, strokeDashoffset: lenA }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0.45);
      tl.fromTo([d1, v1], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power3.out' }, 1.75);
    },
    settle() {
      gsap.set([base, tick0, tick1, xl0, xl1, d0, v0, d1, v1], { autoAlpha: 1, y: 0 });
      gsap.set(actual, { strokeDasharray: 'none', strokeDashoffset: 0 });
    },
  });
  // step 1: the trend over the same weeks, and the gap bracket
  function showTrend(on, anim, tl) {
    const full = `M0,${yv(f0).toFixed(1)} L${CW},${yv(fT).toFixed(1)}`;
    if (anim && on) {
      const p = { t: 0 };
      const draw = () => trend.setAttribute('d', `M0,${yv(f0).toFixed(1)} L${(CW * p.t).toFixed(1)},${yv(f0 + (fT - f0) * p.t).toFixed(1)}`);
      tl.set([trend, dT, gap, trendL], { autoAlpha: 0 }, 0);
      tl.add(() => { p.t = 0; draw(); }, 0.1);
      tl.set(trend, { autoAlpha: 1 }, 0.1);
      tl.to(p, { t: 1, duration: 1.4, ease: 'power2.inOut', onUpdate: draw }, 0.1);
      tl.fromTo(dT, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 1.4);
      tl.fromTo(gap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 1.6);
      tl.fromTo(trendL, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' }, 1.7);
    } else if (anim && !on) {
      tl.to([trend, dT, gap, trendL], { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0);
    } else {
      trend.setAttribute('d', full);
      gsap.set([trend, dT, gap, trendL], { autoAlpha: on ? 1 : 0, x: 0 });
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

  let trendOn = false;
  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    if (anim ? (step >= 1) !== trendOn : true) { showTrend(step >= 1, anim, tl); trendOn = step >= 1; }
    foot.show(step === 0 ? sJump : step === 1 ? sTrend : sCave, anim, tl, 0.6);
    return tl;
  }
  return { go };
});
