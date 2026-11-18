// BeforeAfter: a two-state table. Step 0 shows what was true; step 1 wipes in what is true now,
// row by row, with an accent arrow between. The old value stays visible (muted) so the change reads.
// BeforeAfter.create({ rows: [{ label: 'Time to ship a feature', before: '6 weeks', after: '4 days' }], ground: 'paper' })
//   step 0: set({ stage: 'before' })   step 1: set({ stage: 'after' })
import { gsap, motion, root, esc, play, kill, T, withVisible } from './_core.js';

/**
 * @param {object} o
 * @param {{label:string, before:string, after:string}[]} o.rows   ≤ 5 rows
 * @param {{label?:string, before?:string, after?:string}} [o.headers]  default '' · 'Before' · 'After'
 * @param {'before'|'after'} [o.stage='before']
 * @param {number} [o.width]   default 12 columns (1664)
 * @param {'paper'|'void'} [o.ground]
 */
export function create(o = {}) {
  const el = root('itaf-ba', { ...o, width: o.width || T.spanW(12) });
  const hd = { label: '', before: 'Before', after: 'After', ...(o.headers || {}) };
  let stage = o.stage === 'after' ? 'after' : 'before';
  el.innerHTML =
    `<div class="ba-row ba-head t-label"><span>${esc(hd.label)}</span><span>${esc(hd.before)}</span><span></span><span class="ba-after-h">${esc(hd.after)}</span></div>` +
    (o.rows || []).map((r) =>
      `<div class="ba-row"><span class="ba-label t-body">${esc(r.label)}</span><span class="ba-before t-lead tnum">${esc(r.before)}</span>` +
      `<span class="ba-arrow t-lead" aria-hidden="true">→</span><span class="ba-after t-lead tnum">${esc(r.after)}</span></div>`).join('');
  const q = (s) => [...el.querySelectorAll(s)];
  const afterParts = () => [...q('.ba-after'), ...q('.ba-arrow'), ...q('.ba-after-h')];

  const show = (st) => {
    gsap.set(q('.ba-row'), { autoAlpha: 1, y: 0 });
    gsap.set(afterParts(), { autoAlpha: st === 'after' ? 1 : 0, clipPath: 'inset(0 0% 0 0)', x: 0 });
    el.classList.toggle('is-after', st === 'after');
  };
  const settle = () => { kill(el, q('.ba-row'), afterParts()); gsap.set(el, { autoAlpha: 1 }); show(stage); };

  const reveal = (sub, at = 0) => {
    const rows = q('.ba-row');
    rows.forEach((row, i) => {
      const parts = [...row.querySelectorAll('.ba-arrow, .ba-after, .ba-after-h')];
      sub.fromTo(parts, { autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: motion.calmIn.dur * 0.8, ease: motion.eases.calm, stagger: 0.06 }, at + i * 0.12);
    });
    sub.add(() => el.classList.add('is-after'), at);
  };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, q('.ba-row'), afterParts());
        gsap.set(el, { autoAlpha: 1 });
        show('before');
        sub.fromTo(q('.ba-row'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease, stagger: motion.stagger }, 0);
        if (stage === 'after') reveal(sub, 0.5);
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, y: -12, duration: motion.calmOut.dur, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { stage: 'before' | 'after' } */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      if (!state.stage || state.stage === stage) return tl;
      stage = state.stage;
      if (!animate) { settle(); return tl; }
      if (stage === 'after') reveal(tl, 0);
      else { tl.to(afterParts(), { autoAlpha: 0, duration: motion.calmOut.dur * 0.6, ease: motion.calmOut.ease }); tl.add(() => el.classList.remove('is-after')); }
      return tl;
    },
    destroy() { kill(el, q('.ba-row'), afterParts()); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create };
