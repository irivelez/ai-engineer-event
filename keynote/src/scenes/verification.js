// verification (calm-a, PAPER data): when agents write the work, checking it is the bottleneck, and the AI
// judges hallucinate too.
// Step 0: title + "8 of 80", and the 80 talks as 80 squares with the 8 lit.
// Step 1: 500 steps fill a 25 × 20 grid; the 65 % the judge got right settle in the accent (13 full rows).
// Step 2: the right ones step back to quiet; the 118 bad steps it accepted flip to the limit colour.
// Step 3: the number makes room for the line, in serif. The grid stays as the evidence.
// Evidence: in step 3 the grid gives way to the talk itself (src/data/evidence.json, cut to the quote by
//         src/data/clip-cuts.json): he says the line, captioned verbatim, with its chip, link and QR.
import { gsap } from 'gsap';
import { calmScene, el, esc, unquote, factSource } from './_calm/kit.js';
import { talkClip } from './_clip-cut.js';

export default calmScene('verification', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const J = copy.judge || {};
  const M = T.space.margin;
  const LW = T.spanW(6);
  const nb = (x) => String(x || '').replace(/ /g, '\u00A0'); // BigNumber sets each char in an inline-block: keep spaces

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(7) }), M, 192);

  const NY = 464;
  const mkNum = (display, label, swatch) => {
    const n = K.add(C.BigNumber.create({ display: nb(display), label, size: 'h1', ground: g }), M, NY, LW);
    const lab = n.el.querySelector('.bn-label');
    if (lab) {
      lab.style.maxWidth = `${LW}px`;
      if (swatch) lab.innerHTML = `<span class="ca-swatch" style="background:${swatch}"></span>${esc(label)}`;
    }
    return n;
  };
  const n0 = mkNum(copy.stat || '', copy.statLabel || '');
  const n1 = mkNum(J.right || '', J.rightLabel || '', G.accent);
  const n2 = mkNum(J.bad || '', J.badLabel || '', G.limit);
  const quote = K.add(C.Quote.create({ text: unquote(copy.quote), speaker: J.who || '', ground: g, width: LW, size: 72 }), M + 4, NY + 8);

  // ----- the grid: 500 steps -----
  const COLS = 25;
  const ROWS = 20;
  const N = COLS * ROWS;
  const GX = T.colX(7);
  const GW = T.spanW(5);
  const PITCH = GW / COLS; // 27 px
  const SQ = Math.round(PITCH - 6);
  const GY = 372;
  const right = Math.round(N * (parseFloat(J.right) || 65) / 100); // 325
  const bad = parseInt(J.bad, 10) || 118;
  const grid = el('div', '');
  place(grid, GX, GY, GW, ROWS * PITCH);
  const cells = [];
  for (let i = 0; i < N; i++) {
    const c = el('div', '', grid);
    const r = Math.floor(i / COLS);
    const k = i % COLS;
    Object.assign(c.style, { position: 'absolute', left: `${(k * PITCH).toFixed(1)}px`, top: `${(r * PITCH).toFixed(1)}px`, width: `${SQ}px`, height: `${SQ}px`, borderRadius: '3px', backgroundColor: G.rule });
    cells.push(c);
  }
  const rightCells = cells.slice(0, right);
  const wrongCells = cells.slice(right);
  const badCells = wrongCells.slice(0, bad);
  const base = el('div', 't-label');
  place(base, GX, GY - 96, GW);
  Object.assign(base.style, { textTransform: 'none', fontFamily: 'var(--f-sans)', letterSpacing: '0', color: G.muted });
  base.innerHTML = esc(J.base || '');
  const gridB = K.block(grid, {
    enter(tl) {
      gsap.set(cells, { backgroundColor: G.rule, scale: 1 });
      tl.fromTo(cells, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', stagger: { each: 0.0018, from: 'start' } }, 0);
    },
    settle() { gsap.set(cells, { autoAlpha: 1, scale: 1 }); },
  });
  const baseB = K.block(base, { rise: 12 });

  // step 0: the 80 talks as 80 squares (10 × 8), the 8 about verification lit in the accent
  const [hitN, ofN] = String(copy.stat || '').split(/\s+of\s+/).map((x) => parseInt(x, 10));
  const N80 = ofN || 80;
  const HIT = hitN || 8;
  const C80 = 10;
  const P80 = GW / C80;
  const S80 = Math.round(P80 - 14);
  const g80 = el('div', '');
  place(g80, GX, GY, GW, Math.ceil(N80 / C80) * P80);
  const cells80 = Array.from({ length: N80 }, (_, i) => {
    const c = el('div', '', g80);
    Object.assign(c.style, { position: 'absolute', left: `${((i % C80) * P80).toFixed(1)}px`, top: `${(Math.floor(i / C80) * P80).toFixed(1)}px`, width: `${S80}px`, height: `${S80}px`, borderRadius: '6px', backgroundColor: i < HIT ? G.accent : G.quiet });
    return c;
  });
  const g80B = K.block(g80, {
    enter(tl) {
      gsap.set(cells80.slice(0, HIT), { backgroundColor: G.quiet });
      tl.fromTo(cells80, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', stagger: { each: 0.008, from: 'start' } }, 0);
      tl.fromTo(cells80.slice(0, HIT), { backgroundColor: G.quiet }, { backgroundColor: G.accent, duration: 0.5, ease: 'power2.inOut', stagger: 0.06, immediateRender: false }, 0.9);
    },
    settle() { gsap.set(cells80, { autoAlpha: 1, scale: 1 }); gsap.set(cells80.slice(0, HIT), { backgroundColor: G.accent }); },
    exit(tl) { tl.to(g80, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0); },
  });

  // colour states per step
  function paint(step, anim, tl) {
    const st = (cs, color, at, stagger = 0) => {
      if (anim) tl.to(cs, { backgroundColor: color, duration: 0.5, ease: 'power2.inOut', stagger }, at);
      else gsap.set(cs, { backgroundColor: color });
    };
    if (step < 1) { st(cells, G.rule, 0); return; }
    if (step === 1) {
      st(rightCells, G.accent, 1.0, 0.003);
      st(wrongCells, G.rule, 0);
      return;
    }
    st(rightCells, G.quiet, 0);
    st(wrongCells.slice(bad), G.rule, 0);
    if (anim && step === 2) {
      tl.to(badCells, { backgroundColor: G.limit, duration: 0.35, ease: 'power2.out', stagger: { each: 0.008, from: 'start' } }, 0.5);
      tl.fromTo(badCells, { scaleY: 0.2 }, { scaleY: 1, duration: 0.35, ease: 'power2.out', stagger: { each: 0.008, from: 'start' } }, 0.5);
    } else st(badCells, G.limit, 0);
  }

  // ----- the talk clip (step 3), right column -----
  const clip = talkClip(ctx, { width: T.spanW(6), ground: g });
  if (clip) K.add(clip, T.colX(6), 200);
  const gridOn = (s) => s >= 1 && !(clip && s >= 3);

  const foot = K.footer();
  const s0 = factSource(ctx, 'sf-verification-8');
  const s1 = factSource(ctx, 'zoominfo-judge');
  const src1 = s1 ? { kind: s1.kind, text: [J.talk, s1.text].filter(Boolean).join(' · ') } : null;

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: n0, on: (s) => s === 0, at: 0.3 },
    { c: n1, on: (s) => s === 1, at: 1.0 },
    { c: n2, on: (s) => s === 2, at: 0.4 },
    { c: quote, on: (s) => s >= 3, at: 0.1 },
    { c: g80B, on: (s) => s === 0, at: 0.4 },
    { c: baseB, on: gridOn, at: 0 },
    { c: gridB, on: gridOn, at: 0.1 },
    ...(clip ? [{ c: clip, on: (s) => s >= 3, at: 0.3 }] : []),
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    paint(step, anim, tl);
    // with the clip on screen, its own meta carries the chip and the source: one chip per frame
    foot.show(step === 0 ? s0 : clip && step >= 3 ? null : src1, anim, tl, 0.6);
    return tl;
  }
  return {
    go,
    exit() { if (clip) clip.pause(); return K.exit(); }, // freeze the frame, sound off, under the transition
  };
});
