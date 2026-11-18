// ProvenanceChip: every number on stage wears one. Mono caps in a 2 px stamp, a small shape that
// encodes the kind (so it never rests on colour alone), the kind's colour from the ground.
// ProvenanceChip.create({ kind: 'labReported', ground: 'paper' })
import { gsap, motion, root, esc, play, kill, provenance } from './_core.js';

const MARKS = {
  dot: '<circle cx="8" cy="8" r="5.5" fill="currentColor"/>',
  half: '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 3 A5 5 0 0 0 8 13 Z" fill="currentColor"/>',
  ring: '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/>',
  square: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill="currentColor"/>',
  diamond: '<path d="M8 1.6 L14.4 8 L8 14.4 L1.6 8 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  bar: '<rect x="3" y="2.5" width="3.6" height="11" rx="1" fill="currentColor"/><rect x="9.4" y="2.5" width="3.6" height="11" rx="1" fill="currentColor"/>',
};

export const kinds = Object.keys(provenance);

/** Chip markup (no animation), for scenes that compose their own rows. */
export function chipHTML(kind, label) {
  const k = provenance[kind] || provenance.secondary;
  const key = provenance[kind] ? kind : 'secondary';
  return `<span class="itaf-chip chip-${key}"><svg class="chip-mark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${MARKS[k.mark]}</svg>` +
    `<span class="chip-text">${esc(label || k.label)}</span></span>`;
}

/**
 * @param {object} o
 * @param {'independent'|'labReported'|'secondary'|'official'|'estimate'|'press'} o.kind
 * @param {string} [o.label]   override the label text (keep it one of the six words)
 * @param {'paper'|'void'} [o.ground]
 */
export function create(o = {}) {
  const el = root('itaf-chip-wrap', { ...o, tag: 'span' });
  el.innerHTML = chipHTML(o.kind, o.label);
  const chip = el.firstElementChild;
  const text = chip.querySelector('.chip-text');
  const settle = () => { kill(el, chip, text); gsap.set(el, { autoAlpha: 1 }); gsap.set(chip, { clipPath: 'inset(0 0% 0 0 round 6px)' }); gsap.set(text, { autoAlpha: 1, x: 0 }); };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, chip, text);
        gsap.set(el, { autoAlpha: 1 });
        sub.fromTo(chip, { clipPath: 'inset(0 100% 0 0 round 6px)' }, { clipPath: 'inset(0 0% 0 0 round 6px)', duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0);
        sub.fromTo(text, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: motion.micro.dur, ease: motion.micro.ease }, 0.15);
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, duration: motion.calmOut.dur * 0.6, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { kind } */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      if (!state.kind) return tl;
      const swap = () => { el.innerHTML = chipHTML(state.kind, state.label); };
      if (!animate) { swap(); gsap.set(el, { autoAlpha: 1 }); return tl; }
      tl.to(el, { autoAlpha: 0, duration: 0.2 }).add(swap).to(el, { autoAlpha: 1, duration: motion.micro.dur, ease: motion.micro.ease });
      return tl;
    },
    destroy() { kill(el, chip, text); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return api;
}

export default { create, chipHTML, kinds };
