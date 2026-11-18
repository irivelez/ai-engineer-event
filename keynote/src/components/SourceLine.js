// SourceLine: who says so and when, in mono at the 26 px floor. With `kind` it leads with the chip.
// SourceLine.create({ kind: 'independent', text: 'Epoch AI · 17 Nov 2026', ground: 'paper' })
import { gsap, motion, root, esc, play, kill, withVisible } from './_core.js';
import { chipHTML } from './ProvenanceChip.js';

/**
 * @param {object} o
 * @param {string} o.text              "Outlet or author · date" (from ctx.copy or facts.json)
 * @param {string} [o.kind]            provenance kind → chip before the text
 * @param {string} [o.prefix]          e.g. 'Source' (rendered muted, before the text)
 * @param {'paper'|'void'} [o.ground]
 */
export function create(o = {}) {
  const el = root('itaf-source-line', o);
  const build = (s) =>
    `${s.kind ? chipHTML(s.kind, s.label) : ''}<span class="t-source sl-text">${s.prefix ? `<span class="sl-prefix">${esc(s.prefix)}</span> ` : ''}${esc(s.text)}</span>`;
  el.innerHTML = build(o);
  let state = { ...o };
  const parts = () => [...el.children];
  const settle = () => { kill(el, parts()); gsap.set(el, { autoAlpha: 1 }); gsap.set(parts(), { autoAlpha: 1, x: 0, clipPath: 'none' }); };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, parts());
        gsap.set(el, { autoAlpha: 1 });
        const [first, second] = parts();
        if (state.kind) {
          sub.fromTo(first, { clipPath: 'inset(0 100% 0 0 round 6px)' }, { clipPath: 'inset(0 0% 0 0 round 6px)', duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0);
          sub.fromTo(second, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: motion.micro.dur * 1.2, ease: motion.micro.ease }, 0.2);
        } else {
          sub.fromTo(first, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: motion.micro.dur * 1.2, ease: motion.micro.ease }, 0);
        }
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, duration: motion.calmOut.dur * 0.6, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { text?, kind?, prefix? } */
    set(next = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      state = { ...state, ...next };
      const swap = () => { el.innerHTML = build(state); };
      if (!animate) { swap(); settle(); return tl; }
      tl.to(el, { autoAlpha: 0, duration: 0.2 }).add(swap).add(() => { gsap.set(parts(), { clearProps: 'clipPath' }); })
        .to(el, { autoAlpha: 1, duration: motion.micro.dur, ease: motion.micro.ease });
      return tl;
    },
    destroy() { kill(el, parts()); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create };
