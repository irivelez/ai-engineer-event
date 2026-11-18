// CaptureCard: a real screenshot (an X post, a headline) as evidence. On paper it sits on a soft,
// layered shadow; on void it gets a 2 px light frame. The meta line says where and when it was captured.
// CaptureCard.create({ src: ctx.assets.capture('x-karpathy'), alt: '…', variant: 'paper',
//   meta: { outlet: 'X', author: '@karpathy', date: '12 Nov 2026', counts: '1.2M views', captured: '17 Nov 2026' } })
import { gsap, motion, root, esc, play, kill, withVisible } from './_core.js';

/**
 * @param {object} o
 * @param {string} o.src               data URI (ctx.assets.capture(id))
 * @param {string} o.alt               what the screenshot says, for the static viewer and screen readers
 * @param {'paper'|'void'} [o.variant] defaults to o.ground
 * @param {{outlet?:string, author?:string, date?:string, counts?:string, captured?:string}} [o.meta]
 * @param {number} [o.width=880]       px; height follows the image
 * @param {number} [o.tilt=0]          degrees, ≤ 2 (a pinned cutting, not a toy)
 */
export function create(o = {}) {
  const variant = o.variant || (o.ground === 'paper' ? 'paper' : 'void');
  const el = root(`itaf-capture v-${variant}`, { ...o, ground: o.ground || variant, tag: 'figure', width: o.width || 880 });
  const m = o.meta || {};
  const who = [m.outlet, m.author].filter(Boolean).join(' · ');
  const line = [who, m.date, m.counts].filter(Boolean).map(esc).join(' · ');
  el.innerHTML =
    `<div class="cap-frame"><img class="cap-img" alt="${esc(o.alt || '')}" src="${o.src || ''}" draggable="false"></div>` +
    (line || m.captured ? `<figcaption class="cap-meta t-source">${line}${m.captured ? `<span class="cap-captured">${line ? ' · ' : ''}captured ${esc(m.captured)}</span>` : ''}</figcaption>` : '');
  const frame = el.querySelector('.cap-frame');
  const img = el.querySelector('.cap-img');
  const meta = el.querySelector('.cap-meta');
  const tilt = Math.max(-2, Math.min(2, o.tilt || 0));

  const settle = () => { kill(el, frame, img, meta); gsap.set(el, { autoAlpha: 1, y: 0, rotation: tilt, scale: 1 }); if (meta) gsap.set(meta, { autoAlpha: 1, y: 0 }); };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, frame, img, meta);
        sub.fromTo(el, { autoAlpha: 0, y: 40, scale: 0.985, rotation: tilt * 0.4 }, { autoAlpha: 1, y: 0, scale: 1, rotation: tilt, duration: motion.calmIn.dur, ease: motion.calmIn.ease }, 0);
        if (meta) sub.fromTo(meta, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0.45);
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, y: -16, duration: motion.calmOut.dur, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { zoom: { x, y, scale } }  x/y = point of the image (0–1) to bring to the centre; scale ≥ 1. */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      if (!state.zoom) return tl;
      const { x = 0.5, y = 0.5, scale = 1 } = state.zoom;
      // Bring image point (x, y) to the frame centre, clamped so the frame never shows an empty edge.
      const lim = (Math.max(1, scale) - 1) * 50;
      const clamp = (p) => Math.max(-lim, Math.min(lim, p));
      const v = { scale: Math.max(1, scale), xPercent: clamp((0.5 - x) * 100 * scale), yPercent: clamp((0.5 - y) * 100 * scale), transformOrigin: '50% 50%' };
      if (animate) tl.to(img, { ...v, duration: motion.calmIn.dur * 1.2, ease: motion.eases.camera });
      else gsap.set(img, v);
      return tl;
    },
    destroy() { kill(el, frame, img, meta); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create };
