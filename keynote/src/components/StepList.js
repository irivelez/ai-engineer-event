// StepList: a real sequence (order matters), so it is numbered. The current step is in fg with an
// accent bar that travels to it; done steps stay readable in muted; later steps wait in muted.
// StepList.create({ items: ['Pick one task', 'Write the check first', 'Let the agent run'], active: 0, ground: 'paper' })
import { gsap, motion, root, esc, play, kill, withVisible, T } from './_core.js';

/**
 * @param {object} o
 * @param {string[]} o.items           ≤ 6 short items
 * @param {number} [o.active=-1]       index of the current step (-1: none)
 * @param {boolean} [o.numbered=true]
 * @param {'body'|'lead'|'h2'} [o.role='lead']
 * @param {number} [o.width]           default 9 columns (1240)
 * @param {'paper'|'void'} [o.ground]
 */
export function create(o = {}) {
  const el = root(`itaf-steps role-${o.role || 'lead'}`, { ...o, tag: 'ol', width: o.width || T.spanW(9) });
  const numbered = o.numbered !== false;
  el.innerHTML = (o.items || []).map((t, i) =>
    `<li class="st-item">${numbered ? `<span class="st-n t-label tnum">${String(i + 1).padStart(2, '0')}</span>` : ''}<span class="st-text t-${o.role || 'lead'}">${esc(t)}</span></li>`).join('') +
    '<span class="st-bar" aria-hidden="true"></span>';
  const items = [...el.querySelectorAll('.st-item')];
  const bar = el.querySelector('.st-bar');
  let active = o.active ?? -1;

  const mark = (i) => items.forEach((it, k) => { it.classList.toggle('is-active', k === i); it.classList.toggle('is-done', i >= 0 && k < i); });
  const barTo = (i) => {
    const it = items[i];
    return it ? { y: it.offsetTop, height: it.offsetHeight, autoAlpha: 1 } : { autoAlpha: 0 };
  };
  const settle = () => { kill(el, items, bar); gsap.set(el, { autoAlpha: 1 }); gsap.set(items, { autoAlpha: 1, y: 0 }); mark(active); gsap.set(bar, barTo(active)); };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, items, bar);
        gsap.set(el, { autoAlpha: 1 });
        mark(active);
        gsap.set(bar, { autoAlpha: 0 });
        sub.fromTo(items, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease, stagger: motion.stagger * 1.5 }, 0);
        if (active >= 0) sub.fromTo(bar, { ...barTo(active), scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 0', duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0.4);
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, y: -12, duration: motion.calmOut.dur, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { active } */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      if (state.active == null || state.active === active) return tl;
      const was = active;
      active = state.active;
      if (!animate) { settle(); return tl; }
      mark(active);
      if (was < 0) tl.fromTo(bar, { ...barTo(active), scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 0', duration: motion.micro.dur * 1.5, ease: motion.micro.ease });
      else tl.to(bar, { ...barTo(active), duration: motion.calmIn.dur * 0.7, ease: motion.eases.calm });
      return tl;
    },
    destroy() { kill(el, items, bar); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create };
