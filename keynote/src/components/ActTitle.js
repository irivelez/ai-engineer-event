// ActTitle: roman numeral + title over the route line. The line has one segment per act;
// past acts are filled, the current act lights in the accent, future acts wait in the rule colour.
// So the structure says something true: where we are in the five-act route.
// ActTitle.create({ numeral: 'II', title: 'What the frontier labs show', index: 1, total: 5, ground: 'void' })
import { gsap, motion, root, esc, play, splitLines, linesIn, riseIn, liftOut, kill, T } from './_core.js';

/**
 * @param {object} o
 * @param {string} o.numeral         'I'…'V'
 * @param {string} o.title
 * @param {number} o.index           0-based act index on the route
 * @param {number} [o.total=5]
 * @param {'paper'|'void'} [o.ground]
 * @param {number} [o.width]         default 10 columns (1440 px)
 */
export function create(o = {}) {
  const total = o.total || 5;
  const index = Math.max(0, Math.min(total - 1, o.index ?? 0));
  const el = root('itaf-act', { ...o, width: o.width || T.spanW(10) });
  const segs = Array.from({ length: total }, (_, i) =>
    `<span class="act-seg ${i < index ? 'is-past' : i === index ? 'is-now' : 'is-next'}"><span class="act-seg-fill"></span></span>`).join('');
  el.innerHTML =
    `<div class="act-meta t-label"><span class="act-word">Act</span> <span class="act-n">${esc(o.numeral)}</span></div>` +
    `<div class="act-track" aria-hidden="true">${segs}</div>` +
    `<h1 class="act-title t-h1 balance">${esc(o.title)}</h1>`;
  const meta = el.querySelector('.act-meta');
  const segEls = [...el.querySelectorAll('.act-seg')];
  const fills = segEls.map((s) => s.firstElementChild);
  const title = el.querySelector('.act-title');
  let split = null;

  const settle = () => {
    kill(el, meta, segEls, fills, title);
    gsap.set([el, meta, title], { autoAlpha: 1, y: 0 });
    gsap.set(segEls, { scaleX: 1 });
    gsap.set(fills, { scaleX: 1 });
  };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, meta, segEls, fills, title);
        gsap.set(el, { autoAlpha: 1 });
        sub.fromTo(segEls, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: motion.calmIn.dur, ease: motion.eases.calm, stagger: motion.stagger }, 0);
        sub.fromTo(fills, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: motion.roll.dur, ease: motion.roll.ease, stagger: 0.05 }, 0.35);
        sub.fromTo(meta, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.eases.calm }, 0.2);
        gsap.set(title, { autoAlpha: 1, y: 0 });
        if (split) split.revert();
        split = splitLines(title);
        if (split) linesIn(sub, split.lines, { at: 0.3 });
        else riseIn(sub, title, { at: 0.3 });
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => liftOut(sub, [meta, title, el.querySelector('.act-track')]), () => gsap.set(el, { autoAlpha: 0 })); },
    set() { return gsap.timeline(); }, // single state
    destroy() { kill(el, meta, segEls, fills, title); if (split) split.revert(); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return api;
}

export default { create };
