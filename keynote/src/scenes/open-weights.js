// open-weights (calm-a, PAPER data): the best open models are Chinese and a few months behind.
// Step 0: who leads open weights: Kimi K3.1 Pro, 46 vs 65 on the Artificial Analysis index (two bars).
// Step 1: how far behind: the frontier as a line, open weights as the same line shifted 4–7 months right
//         (a band, because the lag is a range), the gap bracketed.
// Step 2: why it matters: one sentence.
import { gsap } from 'gsap';
import { calmScene, el, svgEl, esc, factSource } from './_calm/kit.js';

export default calmScene('open-weights', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const LW = T.spanW(6);
  const nb = (x) => String(x || '').replace(/ /g, ' ');

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192);

  // ----- left column, one block per step -----
  const NY = 456;
  const who = el('div', 't-label');
  place(who, M, NY, LW);
  who.style.color = G.fg;
  who.innerHTML = esc(copy.lead || '');
  const whoB = K.block(who, { rise: 12 });
  const mkNum = (display, label, y) => {
    const n = K.add(C.BigNumber.create({ display: nb(display), label, size: 'h1', ground: g }), M, y, LW);
    const lab = n.el.querySelector('.bn-label');
    if (lab) Object.assign(lab.style, { maxWidth: `${LW}px`, fontSize: '48px', lineHeight: '64px', fontWeight: '440', letterSpacing: '-0.01em' });
    return n;
  };
  const n0 = mkNum(copy.score, copy.scoreLabel, NY + 64);
  const n1 = mkNum(copy.lag, copy.lagLabel, NY);
  const why = el('div', 't-body pretty');
  place(why, M, NY + 360, LW);
  why.style.color = G.fg;
  why.innerHTML = esc(copy.why || '');
  const whyB = K.block(why, { rise: 16 });

  // ----- right: step 0 bars -----
  const RX = T.colX(7);
  const RW = T.spanW(5);
  const [axisName, pair] = String(copy.scoreLabel || '').split(':');
  const [openName, topName] = String(pair || '').split(' vs ').map((s) => s.trim());
  const [vOpen, vTop] = String(copy.score || '').split('vs').map((s) => parseFloat(s) || 0);
  const bars = el('div', '');
  place(bars, RX, 456, RW, 400);
  const cap = el('div', 't-label', bars, esc((axisName || '').trim()));
  Object.assign(cap.style, { position: 'absolute', left: '0', top: '0', color: G.muted });
  const BMAX = RW - 120;
  const rowsData = [
    { name: topName, v: vTop, color: G.quiet, text: G.muted },
    { name: openName, v: vOpen, color: G.accent, text: G.fg },
  ];
  const max = Math.max(vTop, vOpen, 1);
  const rowEls = rowsData.map((d, i) => {
    const y = 72 + i * 150;
    const nm = el('div', 't-body', bars, esc(d.name || ''));
    Object.assign(nm.style, { position: 'absolute', left: '0', top: `${y}px`, color: d.text });
    const b = el('div', '', bars);
    Object.assign(b.style, { position: 'absolute', left: '0', top: `${y + 72}px`, height: '48px', width: `${(d.v / max) * BMAX}px`, borderRadius: '0 4px 4px 0', background: d.color, transformOrigin: '0 50%' });
    const v = el('div', 't-lead tnum', bars, esc(String(d.v)));
    Object.assign(v.style, { position: 'absolute', left: `${(d.v / max) * BMAX + 20}px`, top: `${y + 60}px`, color: d.text });
    return { nm, b, v };
  });
  const barsB = K.block(bars, {
    enter(tl) {
      tl.fromTo(cap, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0);
      rowEls.forEach((r, i) => {
        tl.fromTo(r.nm, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 0.1 + i * 0.15);
        tl.fromTo(r.b, { scaleX: 0 }, { scaleX: 1, duration: T.motion.roll.dur, ease: T.motion.roll.ease }, 0.25 + i * 0.15);
        tl.fromTo(r.v, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.8 + i * 0.15);
      });
    },
    settle() { gsap.set(cap, { autoAlpha: 1, y: 0 }); rowEls.forEach((r) => { gsap.set([r.nm, r.v], { autoAlpha: 1, x: 0 }); gsap.set(r.b, { scaleX: 1 }); }); },
  });

  // ----- right: step 1 lag chart -----
  const lagNums = String(copy.lag || '').match(/\d+(?:\.\d+)?/g) || ['4', '7'];
  const lo = parseFloat(lagNums[0]) || 4;
  const hi = parseFloat(lagNums[1] || lagNums[0]) || 7;
  const CH = 500;
  const lag = el('div', '');
  place(lag, RX, 372, RW, CH + 80);
  const svg = svgEl('svg', { width: RW, height: CH, viewBox: `0 0 ${RW} ${CH}` }, lag);
  svg.style.overflow = 'visible';
  const MONTHS = 24;
  const xm = (m) => (m / MONTHS) * RW;
  const yAt = (m) => CH - 40 - (m / MONTHS) * (CH - 80); // a straight rising frontier
  const line = (shift, m0, m1) => `M${xm(m0 + shift).toFixed(1)},${yAt(m0).toFixed(1)} L${xm(m1 + shift).toFixed(1)},${yAt(m1).toFixed(1)}`;
  svgEl('line', { x1: 0, x2: RW, y1: CH - 20, y2: CH - 20, stroke: G.muted, 'stroke-width': 2 }, svg);
  // the band between the frontier shifted `lo` and `hi` months right (both clipped at the chart's right edge)
  const band = svgEl('path', { d: `M${xm(lo).toFixed(1)},${yAt(0).toFixed(1)} L${xm(MONTHS).toFixed(1)},${yAt(MONTHS - lo).toFixed(1)} L${xm(MONTHS).toFixed(1)},${yAt(MONTHS - hi).toFixed(1)} L${xm(hi).toFixed(1)},${yAt(0).toFixed(1)} Z`, fill: G.accent, 'fill-opacity': 0.14 }, svg);
  const bandHi = svgEl('path', { d: line(hi, 0, MONTHS - hi), fill: 'none', stroke: G.accent, 'stroke-width': 3, 'stroke-dasharray': '10 10' }, svg);
  const bandLo = svgEl('path', { d: line(lo, 0, MONTHS - lo), fill: 'none', stroke: G.accent, 'stroke-width': 3, 'stroke-dasharray': '10 10' }, svg);
  const front = svgEl('path', { d: line(0, 0, MONTHS), fill: 'none', stroke: G.fg, 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
  // the bracket at a mid level: from the frontier to the band's far edge
  const mB = 12;
  const yB = yAt(mB);
  const br = svgEl('g', {}, svg);
  svgEl('line', { x1: xm(mB), x2: xm(mB + hi), y1: yB, y2: yB, stroke: G.accent, 'stroke-width': 4, 'stroke-linecap': 'round' }, br);
  svgEl('line', { x1: xm(mB + lo), x2: xm(mB + lo), y1: yB - 14, y2: yB + 14, stroke: G.accent, 'stroke-width': 4, 'stroke-linecap': 'round' }, br);
  svgEl('line', { x1: xm(mB + hi), x2: xm(mB + hi), y1: yB - 14, y2: yB + 14, stroke: G.accent, 'stroke-width': 4, 'stroke-linecap': 'round' }, br);
  svgEl('circle', { cx: xm(mB), cy: yB, r: 8, fill: G.fg }, br);
  // labels in the empty areas: above-left of the frontier, below-right of the band
  const lFront = el('div', 't-label ca-nowrap', lag, esc(topName || ''));
  Object.assign(lFront.style, { position: 'absolute', left: `${xm(3)}px`, top: `${yAt(13) - 20}px`, color: G.fg });
  const lOpen = el('div', 't-label ca-nowrap', lag, esc(openName || ''));
  Object.assign(lOpen.style, { position: 'absolute', left: `${xm(12)}px`, top: `${yAt(5) + 12}px`, color: G.accent });
  const lagB = K.block(lag, {
    enter(tl) {
      const L = front.getTotalLength() || 900;
      tl.fromTo(front, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0);
      tl.fromTo([band, bandHi, bandLo], { autoAlpha: 0, x: -xm(hi) }, { autoAlpha: 1, x: 0, duration: 1.3, ease: 'power3.inOut' }, 0.6);
      tl.fromTo(br, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1.8);
      tl.fromTo([lFront, lOpen], { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.1 }, 1.9);
    },
    settle() {
      gsap.set(front, { strokeDasharray: 'none', strokeDashoffset: 0 });
      gsap.set([band, bandHi, bandLo], { autoAlpha: 1, x: 0 });
      gsap.set(br, { autoAlpha: 1 });
      gsap.set([lFront, lOpen], { autoAlpha: 1, y: 0 });
    },
  });

  const foot = K.footer();
  const s0 = factSource(ctx, 'kimi-46');
  const s1 = factSource(ctx, 'open-lag-aisi');

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: whoB, on: (s) => s === 0, at: 0.3 },
    { c: n0, on: (s) => s === 0, at: 0.4 },
    { c: n1, on: (s) => s >= 1, at: 0.1 },
    { c: whyB, on: (s) => s >= 2, at: 0.1 },
    { c: barsB, on: (s) => s === 0, at: 0.3 },
    { c: lagB, on: (s) => s >= 1, at: 0.1 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    foot.show(step === 0 ? s0 : s1, anim, tl, 0.6);
    return tl;
  }
  return { go };
});
