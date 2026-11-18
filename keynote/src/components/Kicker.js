// Kicker: the small mono line above an idea. It names the section, never decorates.
// Kicker.create({ text: 'Act II · What the frontier labs show', ground: 'paper', tone: 'accent' })
import { gsap, motion, root, esc, play, liftOut, kill, withVisible } from './_core.js';

/**
 * @param {object} o
 * @param {string} o.text
 * @param {'paper'|'void'} [o.ground]
 * @param {'muted'|'accent'|'fg'} [o.tone='muted']
 * @param {boolean} [o.rule=true]   a 40 × 2 px rule before the text, in the same tone
 */
export function create(o = {}) {
  const el = root(`itaf-kicker t-label tone-${o.tone || 'muted'}`, o);
  const rule = o.rule !== false;
  el.innerHTML = `${rule ? '<span class="k-rule" aria-hidden="true"></span>' : ''}<span class="k-text">${esc(o.text)}</span>`;
  const ruleEl = el.querySelector('.k-rule');
  const textEl = el.querySelector('.k-text');

  const settle = () => { kill(el, ruleEl, textEl); gsap.set(el, { autoAlpha: 1, y: 0 }); gsap.set(textEl, { clipPath: 'inset(0 0% 0 0)' }); if (ruleEl) gsap.set(ruleEl, { scaleX: 1 }); };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, ruleEl, textEl);
        gsap.set(el, { autoAlpha: 1, y: 0 });
        if (ruleEl) sub.fromTo(ruleEl, { scaleX: 0 }, { scaleX: 1, duration: motion.micro.dur * 1.5, ease: motion.eases.calm, transformOrigin: '0 50%' }, 0);
        sub.fromTo(textEl, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: motion.calmIn.dur * 0.8, ease: motion.eases.calm }, ruleEl ? 0.12 : 0);
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => liftOut(sub, el), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { text } */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      if (state.text == null) return tl;
      if (!animate) { textEl.textContent = state.text; settle(); return tl; }
      tl.to(textEl, { clipPath: 'inset(0 0 0 100%)', duration: motion.micro.dur, ease: motion.eases.exit });
      tl.add(() => { textEl.textContent = state.text; });
      tl.fromTo(textEl, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: motion.calmIn.dur * 0.7, ease: motion.eases.calm });
      return tl;
    },
    destroy() { kill(el, ruleEl, textEl); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create };
