// checkable (calm-b, PAPER): AI leaps where results are cheap to check. Start there, build the check first.
// Step 0: a spectrum of 40 ticks across the full width: dense on the left ("cheap to check"), sparse on the
//         right ("needs judgment to check"). The ticks draw in at constant speed, so the dense side fills in a
//         fast flicker and the sparse side slowly; then they keep a quiet pulse: fast checks on the left, slow
//         on the right. Examples and notes under each end.
// Step 1: the cheap end lights in the accent, the judgment end steps back to the quiet grey; the takeaway lands.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { actLine, ensureCSS, sourceOf, tagSource } from './_calm-b/kit.js';

const N = 40;

export default calmScene('checkable', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const W = 1920 - 2 * M;
  const HALF = T.spanW(6);
  const L = copy.left || {};
  const Rt = copy.right || {};

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(12) }), M, 192, T.spanW(12));

  // ----- the spectrum: gaps grow geometrically from 10 px to ~110 px across the width -----
  const g0 = 10;
  let lo = 1.0001, hi = 1.5;
  for (let k = 0; k < 60; k++) { const r = (lo + hi) / 2; const sum = (g0 * (r ** (N - 1) - 1)) / (r - 1); if (sum > W - 4) hi = r; else lo = r; }
  const ratio = (lo + hi) / 2;
  const xs = [0];
  for (let i = 1; i < N; i++) xs.push(xs[i - 1] + g0 * ratio ** (i - 1));
  const BAR_Y = 448;
  const BAR_H = 64;
  const spec = el('div', '');
  place(spec, 0, 0, 1920, 1080);
  const ticks = xs.map((x, i) => {
    const w = el('div', '', spec);
    Object.assign(w.style, { position: 'absolute', left: `${(M + x).toFixed(1)}px`, top: `${BAR_Y}px`, width: '4px', height: `${BAR_H}px`, transformOrigin: '50% 50%' });
    const b = el('div', '', w);
    Object.assign(b.style, { width: '100%', height: '100%', borderRadius: '2px', background: G.fg, transformOrigin: '50% 50%' });
    return { w, b, x, f: 1.5 * (0.12 / 1.5) ** (x / W), ph: ctx.random() };
  });
  const base = el('div', '', spec); // the 2 px axis the ticks stand on
  Object.assign(base.style, { position: 'absolute', left: `${M}px`, top: `${BAR_Y + BAR_H / 2 - 1}px`, width: `${W}px`, height: '2px', background: G.rule, transformOrigin: '0 50%' });
  spec.insertBefore(base, spec.firstChild);

  const lab = (text, right) => {
    const e = el('div', 't-label', spec, esc(text));
    Object.assign(e.style, { position: 'absolute', top: `${BAR_Y - 72}px`, color: G.fg, whiteSpace: 'nowrap' });
    if (right) { e.style.right = `${M}px`; e.style.textAlign = 'right'; } else e.style.left = `${M}px`;
    return e;
  };
  const labL = lab(L.label || '', false);
  const labR = lab(Rt.label || '', true);

  // ----- examples + notes under each end -----
  const side = (s, right) => {
    const box = el('div', '');
    place(box, right ? 1920 - M - HALF : M, BAR_Y + BAR_H + 40, HALF);
    box.style.textAlign = right ? 'right' : 'left';
    const ex = el('div', 'cb-body48', box, esc(s.examples || ''));
    ex.style.color = G.fg;
    ex.style.fontWeight = '560';
    const note = el('div', 'cb-body40', box, esc(s.note || ''));
    Object.assign(note.style, { color: G.muted, marginTop: '12px' });
    return K.block(box, { rise: 16 });
  };
  const sideL = side(L, false);
  const sideR = side(Rt, true);

  const specB = K.block(spec, {
    enter(tl) {
      tl.fromTo(base, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0);
      ticks.forEach((t) => tl.fromTo(t.w, { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'expo.out' }, 0.1 + (t.x / W) * 1.6));
      tl.fromTo([labL, labR], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 1.2 }, 0.2);
    },
    settle() { gsap.set(base, { scaleX: 1 }); gsap.set(ticks.map((t) => t.w), { scaleY: 1 }); gsap.set([labL, labR], { autoAlpha: 1, y: 0 }); },
  });

  // ----- step 1: the takeaway -----
  const take = K.add(C.Headline.create({ text: copy.takeaway || '', role: 'lead', ground: g, width: T.spanW(10) }), M, 800, T.spanW(10));

  const foot = K.footer();
  const tag = tagSource(copy.tag);
  const fs = sourceOf(ctx, (ctx.beat.facts || [])[0]);
  const src = { kind: fs ? fs.kind : 'estimate', text: [copy.tag, fs && fs.text].filter(Boolean).join(' · ') || tag.text };

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: specB, on: () => true, at: 0.3 },
    { c: sideL, on: () => true, at: 0.9 },
    { c: sideR, on: () => true, at: 1.9 },
    { c: take, on: (s) => s >= 1, at: 0.5 },
  ]);

  let lit = null;
  function light(on, anim, tl) {
    if (lit === on && anim) return;
    lit = on;
    const n = ticks.length;
    ticks.forEach((t, i) => {
      const c = on ? (t.x < W * 0.5 ? G.accent : G.quiet) : G.fg;
      if (anim) tl.to(t.b, { backgroundColor: c, duration: 0.6, ease: 'power2.out' }, 0.05 + (i / n) * 0.5);
      else gsap.set(t.b, { backgroundColor: c });
    });
    const cl = on ? G.accent : G.fg;
    const cr = on ? G.muted : G.fg;
    if (anim) { tl.to(labL, { color: cl, duration: 0.5 }, 0.1); tl.to(labR, { color: cr, duration: 0.5 }, 0.1); }
    else { gsap.set(labL, { color: cl }); gsap.set(labR, { color: cr }); }
  }

  let t0 = null;
  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    light(step >= 1, anim, tl);
    foot.show(src, anim, tl, 1.4);
    t0 = null;
    return tl;
  }

  // the pulse: fast checks on the dense side, slow on the sparse side (no motion in render mode)
  function update(time) {
    if (R || !specB.shown) return;
    if (t0 == null) t0 = time;
    const t = time - t0;
    const fade = Math.min(1, Math.max(0, (t - 2.2) / 1.5)); // starts once the ticks have landed
    for (let i = 0; i < ticks.length; i++) {
      const k = ticks[i];
      const p = (t * k.f + k.ph) % 1;
      const bump = Math.max(0, 1 - Math.abs(p - 0.5) * 10);
      k.b.style.transform = `scaleY(${(1 + 0.32 * bump * fade).toFixed(3)})`;
    }
  }
  return { go, update };
});
