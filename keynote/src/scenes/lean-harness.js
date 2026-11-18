// lean-harness (calm-a, PAPER quote moment): better models need less scaffolding.
// Step 0: a block of 20 "harness" code lines deletes itself down to 2 short lines (90 % gone), then the talk
//         title lands on the left with who said it and a one-line gloss of "harness".
// Step 1: the gloss steps away; his line arrives in serif, and the point in the accent.
import { gsap } from 'gsap';
import { calmScene, el, esc, unquote, factSource } from './_calm/kit.js';

// Code-line skeleton: [indent (0–3), width share (0–1)]. 20 lines; the two marked KEEP survive.
const LINES = [[0, 0.62], [1, 0.84], [1, 0.48], [2, 0.7], [2, 0.36], [1, 0.9], [0, 0.4], [0, 0.74], [1, 0.58], [2, 0.82], [2, 0.5], [3, 0.44], [1, 0.66], [0, 0.3], [0, 0.78], [1, 0.52], [2, 0.6], [1, 0.86], [1, 0.42], [0, 0.56]];
const KEEP = [0, 7];

export default calmScene('lean-harness', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;

  // ----- left column -----
  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.quote || '', role: 'h2', ground: g, width: T.spanW(6) }), M, 192);
  const who = el('div', 't-label');
  place(who, M, 520, T.spanW(6));
  who.innerHTML = esc(copy.speaker || '');
  who.style.color = G.fg;
  const whoB = K.block(who, { rise: 12 });
  const gloss = el('div', 't-body pretty');
  place(gloss, M, 616, T.spanW(5));
  gloss.innerHTML = esc(copy.gloss || '');
  gloss.style.color = G.muted;
  const glossB = K.block(gloss, { rise: 16 });

  const line = K.add(C.Quote.create({ text: unquote(copy.line), ground: g, width: T.spanW(6), size: 64 }), M + 4, 608);
  const point = el('div', 't-lead');
  place(point, M, 840, T.spanW(6));
  point.innerHTML = esc(copy.point || '');
  point.style.color = G.accent;
  const pointB = K.block(point, { rise: 16 });

  // ----- the harness block (right) -----
  const BX = T.colX(7) + 40;
  const BW = T.spanW(5) - 40;
  const BY = 236;
  const LH = 28; // line pitch
  const BH = 14; // bar height
  const block = el('div', '');
  place(block, BX, BY, BW, LINES.length * LH);
  const bars = LINES.map(([ind, w], i) => {
    const b = el('div', '', block);
    const x = ind * 40;
    Object.assign(b.style, { position: 'absolute', left: `${x}px`, top: `${i * LH}px`, width: `${Math.round((BW - x) * w)}px`, height: `${BH}px`, borderRadius: '7px', backgroundColor: G.quiet, border: `2px solid ${G.quiet}`, boxSizing: 'border-box' });
    return b;
  });
  const keep = KEEP.map((i) => bars[i]);
  const gone = bars.filter((_, i) => !KEEP.includes(i));
  // Deleted lines stay as ghosts (2 px outlines in the rule colour), so the still frame says "90 % gone".
  const blockB = K.block(block, {
    enter(tl) {
      gsap.set(bars, { autoAlpha: 1, x: 0, backgroundColor: G.quiet, borderColor: G.quiet });
      tl.fromTo(bars, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out', stagger: 0.025 }, 0);
      // delete: bottom-first, like a selection being removed
      tl.to([...gone].reverse(), { backgroundColor: 'rgba(255,255,255,0)', borderColor: G.rule, duration: 0.35, ease: 'power2.in', stagger: 0.05 }, 1.1);
      tl.to(keep, { backgroundColor: G.fg, borderColor: G.fg, duration: 0.6, ease: 'power2.inOut' }, 2.1);
    },
    settle() {
      gsap.set(gone, { autoAlpha: 1, x: 0, backgroundColor: 'rgba(255,255,255,0)', borderColor: G.rule });
      gsap.set(keep, { autoAlpha: 1, x: 0, backgroundColor: G.fg, borderColor: G.fg });
    },
  });

  const foot = K.footer();
  const src = factSource(ctx, 'schmid-harness');

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: blockB, on: () => true, at: 0.1 },
    { c: title, on: () => true, at: (s, i) => (i.entering ? 2.3 : 0) },
    { c: whoB, on: () => true, at: (s, i) => (i.entering ? 2.7 : 0.1) },
    { c: glossB, on: (s) => s === 0, at: (s, i) => (i.entering ? 2.9 : 0.2) },
    { c: line, on: (s) => s >= 1, at: 0.15 },
    { c: pointB, on: (s) => s >= 1, at: 1.6 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    foot.show(src, anim, tl, info.entering ? 2.9 : 0);
    return tl;
  }
  return { go };
});
