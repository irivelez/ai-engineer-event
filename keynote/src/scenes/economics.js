// economics (calm-a, PAPER data): smarter isn't always cheaper. Time bars on one scale (hours), cost as words.
// Step 0: the contractor baseline (~16 hours).
// Step 1: Opus 5.5 (under 3 hours, cheaper than the contractor) vs Fable 5.2 (~6.5 hours, cost more): the
//         accent marks the surprise, the smarter model's cost.
import { gsap } from 'gsap';
import { calmScene, el, esc, tagSource, fact } from './_calm/kit.js';

export default calmScene('economics', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const A = copy.a || {};
  const B = copy.b || {};

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192);

  // hours: from facts (contractorHours 16, opus55Hours "<3", fable52Hours "~6.5"), else from the copy text
  const fv = (fact(ctx, 'epoch-economics') || {}).value || {};
  const hrs = (v, txt) => parseFloat(String(v ?? '').replace(/[^\d.]/g, '')) || parseFloat(String(txt || '').replace(/[^\d.]/g, '')) || 0;
  const [baseName, baseTime] = String(copy.base || '').split(':').map((s) => s.trim());
  const rows = [
    { name: baseName, time: baseTime, h: hrs(fv.contractorHours, baseTime), color: G.fg, result: '' },
    { name: A.model, time: A.time, h: hrs(fv.opus55Hours, A.time), color: G.quiet, result: A.result, resTone: G.muted },
    { name: B.model, time: B.time, h: hrs(fv.fable52Hours, B.time), color: G.accent, result: B.result, resTone: G.fg },
  ];
  const maxH = Math.max(...rows.map((r) => r.h), 1);
  const NAME_W = T.spanW(4);
  const BX = T.colX(4);
  const BMAX = T.colX(11) - BX - 230;
  const Y0 = 372;
  const PITCH = 188;
  const els = rows.map((r, i) => {
    const y = Y0 + i * PITCH;
    const box = el('div', '');
    place(box, 0, 0, 1920, 1080);
    const nm = el('div', 't-body', box, esc(r.name || ''));
    Object.assign(nm.style, { position: 'absolute', left: `${M}px`, top: `${y}px`, width: `${NAME_W}px`, color: G.fg, fontWeight: i === 2 ? '600' : '520' });
    const w = (r.h / maxH) * BMAX;
    const bar = el('div', '', box);
    Object.assign(bar.style, { position: 'absolute', left: `${BX}px`, top: `${y + 4}px`, width: `${w}px`, height: '56px', borderRadius: '0 4px 4px 0', background: r.color, transformOrigin: '0 50%' });
    const val = el('div', 't-lead tnum ca-nowrap', box, esc(r.time || ''));
    Object.assign(val.style, { position: 'absolute', left: `${BX + w + 24}px`, top: `${y - 4}px`, color: G.fg });
    const res = r.result ? el('div', 'ca-sans40', box, esc(r.result)) : null;
    if (res) Object.assign(res.style, { position: 'absolute', left: `${BX}px`, top: `${y + 80}px`, width: `${T.spanW(8)}px`, color: r.resTone, fontWeight: i === 2 ? '600' : '460' });
    return K.block(box, {
      enter(tl) {
        tl.fromTo(nm, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 0);
        tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: T.motion.roll.dur, ease: T.motion.roll.ease }, 0.15);
        tl.fromTo(val, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 0.7);
        if (res) tl.fromTo(res, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.9);
      },
      settle() { gsap.set([nm, val], { autoAlpha: 1, x: 0 }); gsap.set(bar, { scaleX: 1 }); if (res) gsap.set(res, { autoAlpha: 1, y: 0 }); },
    });
  });

  const foot = K.footer();
  const src = tagSource(copy.tag);

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: els[0], on: () => true, at: 0.35 },
    { c: els[1], on: (s) => s >= 1, at: 0.1 },
    { c: els[2], on: (s) => s >= 1, at: 0.7 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    foot.show(src, anim, tl, 0.9);
    return tl;
  }
  return { go };
});
