// Cross-moment transitions. Each returns a gsap timeline that reveals `to.wrapper` over `from.wrapper`.
// Wrappers are opaque (ground colour), so a crossfade never dips through black.
//   fade  0.6 s crossfade (default, same ground)
//   iris  aperture of the new ground opening from the centre (default void → paper)
//   wipe  a band of light sweeps left → right, the new ground behind it (default paper → void)
//   cut   hard cut: 0.25 s of pure new ground, then the scene (e.g. "And yet.")
//   none  instant swap, no hold (seamless continuity, e.g. film last frame → title)
import { gsap } from 'gsap';

export const TRANSITIONS = ['fade', 'iris', 'wipe', 'cut', 'none'];

// Known continuity points from beats.json (a scene module may override with `transition`).
const OVERRIDES = { title: 'none', 'and-yet': 'cut' };

export function pickTransition({ from, to, direction, jump, renderMode, tokens }) {
  if (renderMode || !from) return { type: 'none', dur: 0 };
  const motion = (tokens && tokens.motion) || {};
  const dur = (k, d) => (motion[k] && typeof motion[k].dur === 'number' ? motion[k].dur : d);
  if (jump || direction < 0) return { type: 'fade', dur: 0.45 };
  let type = to.mod.transition || to.inst.transition || to.m.transition || null;
  // The seamless title cut only makes sense coming straight from the film.
  if (!type && OVERRIDES[to.m.id] && !(to.m.id === 'title' && from.m.id !== 'opener')) type = OVERRIDES[to.m.id];
  if (!type) {
    if (from.m.ground === to.m.ground) type = 'fade';
    else type = to.m.ground === 'paper' ? 'iris' : 'wipe';
  }
  const d = { fade: 0.6, iris: dur('iris', 0.9), wipe: 0.9, cut: 0.25, none: 0 }[type];
  return { type: TRANSITIONS.includes(type) ? type : 'fade', dur: d ?? 0.6 };
}

export function runTransition({ type, dur }, { from, to, stage }) {
  const tl = gsap.timeline();
  const w = to.wrapper;
  gsap.set(w, { visibility: 'visible', opacity: 1, clipPath: 'none' });
  switch (type) {
    case 'fade':
      tl.fromTo(w, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'power1.inOut' }, 0);
      break;
    case 'iris': {
      const r = Math.ceil(Math.hypot(stage.W, stage.H) / 2) + 4;
      tl.fromTo(w, { clipPath: `circle(0px at 50% 50%)` }, { clipPath: `circle(${r}px at 50% 50%)`, duration: dur, ease: 'expo.inOut' }, 0);
      tl.set(w, { clipPath: 'none' });
      break;
    }
    case 'wipe': {
      const band = document.createElement('div');
      band.className = 'transition-lightband';
      stage.moments.appendChild(band);
      tl.fromTo(w, { clipPath: 'inset(0px 100% 0px 0px)' }, { clipPath: 'inset(0px 0% 0px 0px)', duration: dur, ease: 'power2.inOut' }, 0);
      tl.fromTo(band, { x: -160, opacity: 1 }, { x: stage.W, duration: dur, ease: 'power2.inOut' }, 0);
      tl.set(w, { clipPath: 'none' });
      tl.add(() => band.remove());
      break;
    }
    case 'cut':
      gsap.set(to.root, { visibility: 'hidden' });
      tl.set(to.root, { visibility: 'visible' }, dur);
      break;
    default:
      break;
  }
  return tl;
}
