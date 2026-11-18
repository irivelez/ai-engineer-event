// Scrim: the calm area text needs over 3D. An eased (non-linear) gradient of the ground colour,
// so there is no visible edge and no banding step for Zoom's encoder to exaggerate.
// const s = Scrim.create({ ground: 'void', side: 'left', extent: 0.55 }); ctx.root.prepend(s.el); tl.add(s.in(), 0);
import { gsap, motion, root, play, kill, grounds, withVisible } from './_core.js';

// Eased alpha curve ("scrim gradient"): position → relative opacity.
const CURVE = [[0, 1], [0.19, 0.962], [0.34, 0.857], [0.47, 0.704], [0.565, 0.534], [0.65, 0.38], [0.73, 0.244], [0.802, 0.134], [0.861, 0.064], [0.91, 0.024], [0.95, 0.006], [1, 0]];

function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255].join(','); }

/** CSS background for a scrim. side: left | right | top | bottom | center */
export function scrimBackground({ ground = 'void', side = 'left', extent = 0.55, strength = 0.88 } = {}) {
  const c = rgb(grounds[ground === 'paper' ? 'paper' : 'void'].bg);
  const stops = CURVE.map(([p, a]) => `rgba(${c},${(a * strength).toFixed(3)}) ${(p * extent * 100).toFixed(2)}%`).join(', ');
  if (side === 'center') return `radial-gradient(ellipse ${Math.round(extent * 100)}% ${Math.round(extent * 120)}% at 50% 50%, ${CURVE.map(([p, a]) => `rgba(${c},${(a * strength).toFixed(3)}) ${(p * 100).toFixed(1)}%`).join(', ')})`;
  const dir = { left: '90deg', right: '270deg', top: '180deg', bottom: '0deg' }[side] || '90deg';
  return `linear-gradient(${dir}, ${stops}, rgba(${c},0) 100%)`;
}

/**
 * @param {object} o
 * @param {'paper'|'void'} [o.ground='void']
 * @param {'left'|'right'|'top'|'bottom'|'center'} [o.side='left']
 * @param {number} [o.extent=0.55]    fraction of the stage the gradient covers
 * @param {number} [o.strength=0.88]  opacity at the text edge (≥ 0.8 for body text over busy 3D)
 */
export function create(o = {}) {
  const el = root('itaf-scrim', { ...o, ground: o.ground || 'void' });
  el.setAttribute('aria-hidden', 'true');
  el.style.background = scrimBackground(o);
  const settle = () => { kill(el); gsap.set(el, { autoAlpha: 1 }); };
  const api = {
    el,
    in(tl, at) { return play(tl, at, (sub) => sub.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: motion.calmIn.dur, ease: motion.eases.fade }, 0), settle); },
    out(tl, at) { return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, duration: motion.calmOut.dur, ease: motion.eases.fade }), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { side?, extent?, strength? } */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      Object.assign(o, state);
      const bg = scrimBackground(o);
      if (!animate) { el.style.background = bg; return tl; }
      tl.to(el, { autoAlpha: 0, duration: 0.25 }).add(() => { el.style.background = bg; }).to(el, { autoAlpha: 1, duration: 0.4 });
      return tl;
    },
    destroy() { kill(el); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

/** Shorthand: a ready, visible scrim element. */
export function scrim(o = {}) { const s = create(o); gsap.set(s.el, { autoAlpha: 1 }); return s.el; }

export default { create, scrim, scrimBackground };
