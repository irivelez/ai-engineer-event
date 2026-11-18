// Quote: Newsreader italic, the opening mark hangs in the margin so the text edge stays on the grid.
// Attribution in Geist Mono: speaker in fg, org in muted, after a 48 px rule.
// Quote.create({ text: 'We are not slowing down.', speaker: 'Dario Amodei', org: 'Anthropic', ground: 'paper' })
import { gsap, motion, root, esc, play, splitLines, linesIn, riseIn, liftOut, kill } from './_core.js';

/**
 * @param {object} o
 * @param {string} o.text            without quotation marks
 * @param {string} [o.speaker] @param {string} [o.org] @param {string} [o.when]  e.g. '12 Nov 2026'
 * @param {number} [o.size]          font-size override in px (56–112; default type.quote 80)
 * @param {'paper'|'void'} [o.ground]
 * @param {number} [o.width]         default 9 columns
 */
export function create(o = {}) {
  const el = root('itaf-quote', { ...o, tag: 'figure', width: o.width || 1312 });
  const meta = [o.org, o.when].filter(Boolean).map(esc).join(' · ');
  el.innerHTML =
    `<div class="q-body t-quote"${o.size ? ` style="font-size:${Math.max(56, Math.min(112, o.size))}px"` : ''}>` +
    `<span class="q-open" aria-hidden="true">“</span><blockquote class="q-text pretty">${esc(o.text)}”</blockquote></div>` +
    (o.speaker || meta ? `<figcaption class="q-cite t-label"><span class="q-rule" aria-hidden="true"></span><span class="q-who">${esc(o.speaker || '')}</span>${meta ? `<span class="q-org"> · ${meta}</span>` : ''}</figcaption>` : '');
  const open = el.querySelector('.q-open');
  const text = el.querySelector('.q-text');
  const cite = el.querySelector('.q-cite');
  let split = null;

  const settle = () => { kill(el, open, text, cite); gsap.set([el, open, text, cite].filter(Boolean), { autoAlpha: 1, y: 0 }); };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        settle();
        if (split) split.revert();
        split = splitLines(text, 'itaf-line');
        sub.fromTo(open, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease }, 0);
        if (split) linesIn(sub, split.lines, { dur: motion.calmIn.dur * 1.25, stagger: 0.12, at: 0.05 });
        else riseIn(sub, text, { dur: motion.calmIn.dur * 1.25, at: 0.05 });
        if (cite) sub.fromTo(cite, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease }, 0.55 + (split ? split.lines.length * 0.12 : 0));
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => liftOut(sub, [el]), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { highlight?: string } underlines a phrase in the accent colour (draws left to right). */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      if (state.highlight == null) return tl;
      if (split) { split.revert(); split = null; }
      const plain = text.textContent;
      const i = plain.indexOf(state.highlight);
      if (i < 0) return tl;
      text.innerHTML = `${esc(plain.slice(0, i))}<mark class="q-mark">${esc(state.highlight)}</mark>${esc(plain.slice(i + state.highlight.length))}`;
      const mark = text.querySelector('.q-mark');
      if (!animate) { gsap.set(mark, { backgroundSize: '100% 0.08em' }); return tl; }
      tl.fromTo(mark, { backgroundSize: '0% 0.08em' }, { backgroundSize: '100% 0.08em', duration: motion.calmIn.dur, ease: motion.calmIn.ease });
      return tl;
    },
    destroy() { kill(el, open, text, cite); if (split) split.revert(); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return api;
}

export default { create };
