// Headline: one idea, revealed line by line out of its own mask (DevDay line-mask).
// const hl = Headline.create({ text: 'Code is not the bottleneck.', role: 'h1', ground: 'paper', highlight: 'not' });
// root.append(hl.el); tl.add(hl.in());
import { gsap, motion, root, markup, play, splitLines, linesIn, riseIn, liftOut, kill, withVisible } from './_core.js';

/**
 * @param {object} o
 * @param {string} o.text
 * @param {'mega'|'display'|'h1'|'h2'|'lead'|'body'} [o.role='h1']
 * @param {'paper'|'void'} [o.ground]
 * @param {string|string[]} [o.highlight]  substring(s) set in the accent colour
 * @param {'left'|'center'} [o.align='left']
 * @param {number|string} [o.width]        max line length in px (default: none; prefer ≤ 10 columns)
 * @param {'h1'|'h2'|'p'|'div'} [o.tag]
 * @param {'fg'|'muted'|'accent'} [o.tone='fg']
 */
export function create(o = {}) {
  const role = o.role || 'h1';
  const el = root(`itaf-headline t-${role} tone-${o.tone || 'fg'} balance`, { ...o, tag: o.tag || (role === 'h1' || role === 'mega' || role === 'display' ? 'h1' : role === 'h2' ? 'h2' : 'p') });
  if (o.align === 'center') el.style.textAlign = 'center';
  let text = o.text || '';
  let highlight = o.highlight;
  el.innerHTML = markup(text, highlight);
  let split = null;

  const settle = () => { kill(el); if (split) { split.revert(); split = null; } gsap.set(el, { autoAlpha: 1, y: 0 }); };
  const resplit = () => { if (split) split.revert(); split = splitLines(el); return split; };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el);
        gsap.set(el, { autoAlpha: 1, y: 0 });
        const s = resplit();
        if (s) linesIn(sub, s.lines);
        else riseIn(sub, el);
      }, settle);
    },
    out(tl, at) {
      return play(tl, at, (sub) => liftOut(sub, el), () => gsap.set(el, { autoAlpha: 0 }));
    },
    /** state: { text?, highlight?, dim? }  dim=true fades to the muted colour (a line that steps back). */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      const changed = (state.text != null && state.text !== text) || (state.highlight !== undefined && state.highlight !== highlight);
      if (changed) {
        text = state.text ?? text;
        highlight = state.highlight !== undefined ? state.highlight : highlight;
        const swap = () => { if (split) { split.revert(); split = null; } el.innerHTML = markup(text, highlight); };
        if (!animate) { swap(); gsap.set(el, { autoAlpha: 1, y: 0 }); }
        else {
          tl.to(el, { autoAlpha: 0, y: -12, duration: motion.calmOut.dur * 0.7, ease: motion.calmOut.ease });
          tl.add(() => { swap(); gsap.set(el, { y: 0 }); });
          tl.add(() => { const s = resplit(); gsap.set(el, { autoAlpha: 1 }); if (s) gsap.fromTo(s.lines, { yPercent: 130 }, { yPercent: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease, stagger: motion.stagger }); else gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease }); });
        }
      }
      if (state.dim != null) {
        // Never dim with opacity (ink at 38 % fails 4.5:1); step back to the muted text colour.
        const cs = getComputedStyle(el);
        const v = { color: (state.dim ? cs.getPropertyValue('--g-muted') : cs.getPropertyValue('--g-fg')).trim() };
        if (animate) tl.to(el, { ...v, duration: motion.micro.dur, ease: motion.micro.ease }, 0);
        else gsap.set(el, v);
      }
      return tl;
    },
    destroy() { kill(el); if (split) split.revert(); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create };
