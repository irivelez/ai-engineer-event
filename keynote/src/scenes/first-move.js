// first-move (calm-b, PAPER): the first move for Monday. One workflow, redesigned, one number.
// One sentence per step at h1, centred, its step number in the accent above it ("01", "02", "03"); the title
// sits small at the top. At the bottom a unit scale (weeks · days · hours · minutes: units only, no numbers):
// an accent marker travels from weeks (step 0) to hours (step 1) to minutes (step 2), the unit we measure.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { ensureCSS } from './_calm-b/kit.js';

export default calmScene('first-move', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const W = 1920 - 2 * M;

  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: W, align: 'center' }), M, 112, W);

  // ----- one sentence per step -----
  const AREA_TOP = 236;
  const AREA_BOT = 700;
  const sents = (copy.steps || []).slice(0, 3).map((s, i) => {
    const n = el('div', 't-label tnum', null, String(i + 1).padStart(2, '0'));
    Object.assign(n.style, { color: G.accent, textAlign: 'center' });
    place(n, M, 0, W);
    const nB = K.block(n, { rise: 12 });
    const hl = K.add(C.Headline.create({ text: s, role: 'h1', ground: g, width: W, align: 'center' }), M, 0, W);
    return { n, nB, hl };
  });
  function layout() {
    sents.forEach((s) => {
      const h = s.hl.el.offsetHeight || 256;
      const total = 40 + 32 + h;
      const top = Math.round(AREA_TOP + Math.max(0, (AREA_BOT - AREA_TOP - total) / 2));
      s.n.style.top = `${top}px`;
      s.hl.el.style.top = `${top + 72}px`;
    });
  }
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  // ----- the unit scale -----
  const units = (copy.scale || []).slice(0, 6);
  const nu = Math.max(2, units.length);
  const LINE_Y = 800;
  const SX = M + 96;
  const SW = W - 192;
  const ux = (i) => SX + (SW * i) / (nu - 1);
  const scale = el('div', '');
  place(scale, 0, 0, 1920, 1080);
  const axis = el('div', '', scale);
  Object.assign(axis.style, { position: 'absolute', left: `${SX}px`, top: `${LINE_Y - 1}px`, width: `${SW}px`, height: '2px', background: G.muted, transformOrigin: '0 50%' });
  const ticks = units.map((_, i) => {
    const t = el('div', '', scale);
    Object.assign(t.style, { position: 'absolute', left: `${ux(i) - 2}px`, top: `${LINE_Y - 12}px`, width: '4px', height: '24px', borderRadius: '2px', background: G.muted });
    return t;
  });
  const labels = units.map((u, i) => {
    const l = el('div', 't-lead cb-nowrap', scale, esc(u));
    Object.assign(l.style, { position: 'absolute', top: `${LINE_Y + 36}px`, left: `${ux(i)}px`, transform: 'translateX(-50%)', color: G.muted, fontWeight: '520' });
    return l;
  });
  const marker = el('div', '', scale);
  Object.assign(marker.style, { position: 'absolute', left: `${SX - 14}px`, top: `${LINE_Y - 14}px`, width: '28px', height: '28px', borderRadius: '50%', background: G.accent, boxShadow: `0 0 0 8px ${G.bg}` });
  const scaleB = K.block(scale, {
    enter(tl) {
      tl.fromTo(axis, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.inOut' }, 0);
      ticks.forEach((t, i) => tl.fromTo(t, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: 'power3.out' }, 0.1 + (i / (nu - 1)) * 1.0));
      tl.fromTo(labels, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.25 }, 0.2);
      tl.fromTo(marker, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'power3.out' }, 0.9);
    },
    settle() { gsap.set(axis, { scaleX: 1 }); gsap.set(ticks, { scaleY: 1 }); gsap.set(labels, { autoAlpha: 1, y: 0 }); gsap.set(marker, { scale: 1 }); },
  });

  // marker stop per step: weeks → hours → minutes (last unit)
  const STOP = [0, Math.max(0, units.length - 2), units.length - 1];

  const apply = K.stepper([
    { c: title, on: () => true },
    ...sents.flatMap((s, i) => [
      { c: s.nB, on: (st) => st === i, at: 0.15 },
      { c: s.hl, on: (st) => st === i, at: 0.22 },
    ]),
    { c: scaleB, on: () => true, at: 0.5 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    const stop = STOP[Math.min(step, STOP.length - 1)];
    const mx = ux(stop) - SX;
    if (anim) tl.to(marker, { x: mx, duration: info.entering ? 0 : 1.4, ease: 'power3.inOut' }, info.entering ? 0 : 0.5);
    else { gsap.killTweensOf(marker, 'x'); gsap.set(marker, { x: mx }); }
    labels.forEach((l, i) => {
      const v = { color: i === stop ? G.accent : G.muted };
      if (anim) tl.to(l, { ...v, duration: 0.4 }, info.entering ? 1.1 : 1.3);
      else gsap.set(l, v);
    });
    return tl;
  }
  return { go };
});
