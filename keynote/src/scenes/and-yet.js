// and-yet (calm-a, PAPER): hard cut from the dark into pure white (engine `cut`: 0.25 s of white, then us).
// Step 0: the act title on the route (Act III, third of five).
// Step 1: "And yet." alone, centred. Long hold.
// Step 2: four limits in a row, each under its own 2 px rule that draws left to right; "And yet." steps back.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';

export default calmScene('and-yet', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;

  const routeActs = (ctx.acts || []).filter((a) => a && a.n);
  const idx = Math.max(0, routeActs.findIndex((a) => a.id === ctx.beat.act));
  const act = K.add(C.ActTitle.create({ numeral: copy.act || (routeActs[idx] || {}).n || '', title: copy.actTitle || '', index: idx, total: routeActs.length || 5, ground: g, width: T.spanW(10) }), M, 300);

  const line = K.add(C.Headline.create({ text: copy.line || '', role: 'h1', ground: g, width: 1920 - 2 * M, align: 'center' }), M, 412);

  const limits = (copy.limits || []).slice(0, 4);
  const LY = 660;
  // a centred row (it sits under the centred "And yet."): each word carries a rule exactly its own width
  const row = el('div', '');
  place(row, 0, LY, 1920);
  Object.assign(row.style, { display: 'flex', justifyContent: 'center', gap: '88px' });
  const cols = limits.map((w) => {
    const box = el('div', '', row);
    Object.assign(box.style, { display: 'flex', flexDirection: 'column' });
    const rule = el('div', '', box);
    Object.assign(rule.style, { height: '4px', borderRadius: '2px', background: G.fg, transformOrigin: '0 50%' });
    const mask = el('div', 'ca-mask', box);
    mask.style.marginTop = '28px';
    const word = el('div', 't-lead ca-nowrap', mask, esc(w));
    Object.assign(word.style, { fontWeight: '600', color: G.fg });
    return K.block(box, {
      enter(tl) {
        tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0);
        tl.fromTo(word, { yPercent: 120 }, { yPercent: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0.35);
      },
      settle() { gsap.set(rule, { scaleX: 1 }); gsap.set(word, { yPercent: 0 }); },
    });
  });
  gsap.set(row, { autoAlpha: 1 });

  const apply = K.stepper([
    { c: act, on: (s) => s === 0, at: 0.1 },
    { c: line, on: (s) => s >= 1, at: 0.15 },
    ...cols.map((c, i) => ({ c, on: (s) => s >= 2, at: 0.2 + i * 0.32 })),
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    tl.add(line.set({ dim: step >= 2 }, { animate: anim }), anim ? 0.1 : 0);
    return tl;
  }
  return { go };
});
