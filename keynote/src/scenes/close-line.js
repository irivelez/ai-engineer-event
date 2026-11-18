// close-line (calm-b, PAPER): Irina's belief, to close. Generous white, one line per step.
// Step 0: "Uncertainty is a material to work with," in serif italic, optically centred.
// Step 1: "not a reason to wait." joins it on the next line.
// Step 2: the two serif lines glide up and step back to muted; "The best options are built." lands in Geist
//         at h1, "built" in the accent: from belief to conviction.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { ensureCSS, accentWord, clearAccent } from './_calm-b/kit.js';

export default calmScene('close-line', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const W = T.spanW(12);

  // serif lines: Newsreader italic, 104 px on a 120 px line (light-weight serif is allowed ≥ 64 px)
  const SIZE = 104;
  const LH = 120;
  const Y0 = Math.round((1080 - 2 * LH) / 2 - 43); // the pair, optically centred
  const Y2 = 252; // where the pair rests once line 3 arrives (the three lines optically centred)
  const pair = el('div', '');
  place(pair, 0, 0, 1920, 1080);
  pair.style.pointerEvents = 'none';
  const mk = (text, i) => {
    const m = el('div', 'cb-mask', pair);
    Object.assign(m.style, { position: 'absolute', left: `${M}px`, top: `${Y0 + i * LH}px`, width: `${W}px` });
    const t = el('div', 'cb-nowrap', m, esc(text));
    Object.assign(t.style, { fontFamily: T.type.families.serif, fontStyle: 'italic', fontSize: `${SIZE}px`, lineHeight: `${LH}px`, fontWeight: '400', letterSpacing: '-0.012em', color: G.fg });
    return { m, t };
  };
  const l1 = mk(copy.line1 || '', 0);
  const l2 = mk(copy.line2 || '', 1);
  const b1 = K.block(l1.m, {
    enter(tl) { tl.fromTo(l1.t, { yPercent: 125 }, { yPercent: 0, duration: T.motion.calmIn.dur * 1.25, ease: T.motion.calmIn.ease }, 0); },
    settle() { gsap.set(l1.t, { yPercent: 0 }); },
  });
  const b2 = K.block(l2.m, {
    enter(tl) { tl.fromTo(l2.t, { yPercent: 125 }, { yPercent: 0, duration: T.motion.calmIn.dur * 1.25, ease: T.motion.calmIn.ease }, 0); },
    settle() { gsap.set(l2.t, { yPercent: 0 }); },
  });

  // line 3: Geist h1, the last word in the accent
  const words = String(copy.line3 || '').trim().split(/\s+/);
  const last = (words[words.length - 1] || '').replace(/[.!?…]+$/, '');
  const l3 = K.add(C.Headline.create({ text: copy.line3 || '', role: 'h1', ground: g, width: W }), M, Y2 + 2 * LH + 120, W);

  const apply = K.stepper([
    { c: b1, on: () => true },
    { c: b2, on: (s) => s >= 1, at: 0.1 },
    { c: l3, on: (s) => s >= 2, at: 0.75 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    clearAccent(l3.el);
    apply(step, anim, tl, info);
    if (step >= 2) accentWord(l3.el, last); // after the line split, so "built." keeps its spacing
    const up = step >= 2;
    const y = up ? Y2 - Y0 : 0;
    const col = { color: up ? G.muted : G.fg };
    if (anim) {
      tl.to(pair, { y, duration: 1.1, ease: 'power3.inOut' }, 0);
      tl.to([l1.t, l2.t], { ...col, duration: 0.6, ease: 'power2.out' }, 0.3);
    } else {
      gsap.killTweensOf(pair); gsap.set(pair, { y });
      gsap.killTweensOf([l1.t, l2.t], 'color'); gsap.set([l1.t, l2.t], col);
    }
    return tl;
  }
  return { go };
});
