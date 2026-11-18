// price (calm-a, PAPER data): the same capability keeps getting cheaper.
// Step 0: −47 % every quarter. Nine bars, one per quarter, each one 47 % shorter than the last: every bar is
//         born at the previous bar's height and shrinks into place (the price ticking down).
// Step 1: a bracket over four quarters: ≈ 13× cheaper per year; Ramp's −14.8 % in four weeks with its own chip.
import { gsap } from 'gsap';
import { calmScene, el, esc, tagSource, factSource } from './_calm/kit.js';

export default calmScene('price', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const LW = T.spanW(6);
  const nb = (x) => String(x || '').replace(/ /g, ' ');

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(7) }), M, 192);
  const big = K.add(C.BigNumber.create({ display: nb(copy.value), size: 'display', ground: g, tone: 'accent' }), M, 430, LW);
  const label = el('div', 't-lead balance');
  place(label, M, 676, LW);
  label.style.color = G.fg;
  label.innerHTML = esc(copy.label || '');
  const labelB = K.block(label, { rise: 16 });

  // ----- bars: 9 quarters, ×0.53 each -----
  const drop = Math.abs(parseFloat(String(copy.value || '').replace(/[^\d.]/g, ''))) / 100 || 0.47;
  const keepShare = 1 - drop;
  const Q = 9;
  const CX = T.colX(7);
  const CW = T.spanW(5);
  const BASE = 800;
  const HMAX = 400;
  const pitch = CW / Q;
  const BW = Math.round(pitch * 0.62);
  const hs = Array.from({ length: Q }, (_, i) => Math.max(3, HMAX * keepShare ** i));
  const chart = el('div', '');
  place(chart, 0, 0, 1920, 1080);
  const axis = el('div', '', chart);
  Object.assign(axis.style, { position: 'absolute', left: `${CX}px`, top: `${BASE}px`, width: `${CW}px`, height: '2px', background: G.muted, transformOrigin: '0 50%' });
  const bars = hs.map((h, i) => {
    const b = el('div', '', chart);
    Object.assign(b.style, { position: 'absolute', left: `${(CX + i * pitch + (pitch - BW) / 2).toFixed(1)}px`, top: `${BASE - h}px`, width: `${BW}px`, height: `${h.toFixed(1)}px`, background: i === 0 ? G.fg : G.quiet, borderRadius: '4px 4px 0 0', transformOrigin: '50% 100%' });
    return b;
  });
  const axisCap = el('div', 't-label', chart, esc(String(copy.label || '').split(',').slice(1).join(',').trim()));
  Object.assign(axisCap.style, { position: 'absolute', left: `${CX}px`, top: `${BASE + 20}px`, width: `${CW}px`, color: G.muted });
  const chartB = K.block(chart, {
    enter(tl) {
      tl.fromTo(axis, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.out' }, 0);
      tl.fromTo(axisCap, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.2);
      tl.fromTo(bars[0], { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'expo.out' }, 0.2);
      bars.slice(1).forEach((b, k) => {
        const i = k + 1;
        const t = 0.7 + k * 0.32;
        tl.fromTo(b, { autoAlpha: 0, scaleY: hs[i - 1] / hs[i] }, { autoAlpha: 1, duration: 0.01 }, t);
        tl.to(b, { scaleY: 1, duration: 0.6, ease: 'power3.inOut' }, t + 0.02);
      });
    },
    settle() { gsap.set(axis, { scaleX: 1 }); gsap.set(axisCap, { autoAlpha: 1, y: 0 }); gsap.set(bars, { autoAlpha: 1, scaleY: 1 }); },
  });

  // ----- step 1: the per-year bracket (Q0 → Q4) and Ramp -----
  const bx0 = CX + (pitch - BW) / 2;
  const bx1 = CX + 4 * pitch + (pitch + BW) / 2;
  const BY = BASE - HMAX - 44;
  const br = el('div', '');
  place(br, 0, 0, 1920, 1080);
  const brLine = el('div', '', br);
  Object.assign(brLine.style, { position: 'absolute', left: `${bx0}px`, top: `${BY}px`, width: `${bx1 - bx0}px`, height: '4px', borderRadius: '2px', background: G.accent, transformOrigin: '0 50%' });
  const tick = (x) => { const t = el('div', '', br); Object.assign(t.style, { position: 'absolute', left: `${x - 2}px`, top: `${BY}px`, width: '4px', height: '20px', borderRadius: '2px', background: G.accent }); return t; };
  const ticks = [tick(bx0 + 2), tick(bx1 - 2)];
  const brText = el('div', 't-lead ca-nowrap', br, esc(copy.equiv || ''));
  Object.assign(brText.style, { position: 'absolute', left: `${bx0}px`, top: `${BY - 84}px`, color: G.accent });
  const bracketB = K.block(br, {
    enter(tl) {
      tl.fromTo(brLine, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0);
      tl.fromTo(ticks, { scaleY: 0, transformOrigin: '50% 0' }, { scaleY: 1, duration: 0.4, ease: 'power3.out' }, 0.1);
      tl.fromTo(brText, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.3);
    },
    settle() { gsap.set(brLine, { scaleX: 1 }); gsap.set(ticks, { scaleY: 1 }); gsap.set(brText, { autoAlpha: 1, y: 0 }); },
  });
  const ramp = el('div', '');
  place(ramp, M, 884, 1920 - 2 * M);
  Object.assign(ramp.style, { display: 'flex', alignItems: 'center', gap: '20px' });
  const rs = factSource(ctx, 'ramp-price-148');
  ramp.innerHTML = `${C.chipHTML((rs && rs.kind) || 'independent')}<span class="ca-sans40" style="color:${G.fg}">${esc(copy.ramp || '')}</span>${rs ? `<span class="t-source" style="color:${G.muted}">${esc(rs.text)}</span>` : ''}`;
  ramp.classList.add('ground-' + g);
  const rampB = K.block(ramp, { rise: 12 });

  const foot = K.footer();
  const est = tagSource(copy.tag);

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: big, on: () => true, at: 0.3 },
    { c: labelB, on: () => true, at: 0.55 },
    { c: chartB, on: () => true, at: 0.4 },
    { c: bracketB, on: (s) => s >= 1, at: 0.1 },
    { c: rampB, on: (s) => s >= 1, at: 0.9 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    foot.show(est, anim, tl, 0.8);
    return tl;
  }
  return { go };
});
