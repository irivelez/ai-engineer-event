// Fixed 1920×1080 logical stage, uniformly scaled to fit the window; letterbox in the ground colour.
// Layers (bottom → top): .stage-moments (one .moment wrapper per live scene; the GL canvas lives inside
// the wrapper of the GL moment on screen) → .stage-hud (cue icon) → .stage-overlay (grid, help, notes).
// Window-level layer (outside the stage transform): blackout/whiteout and the fps HUD.
import { gsap } from 'gsap';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

const div = (cls) => {
  const d = document.createElement('div');
  d.className = cls;
  return d;
};

export function createStage() {
  const el = div('stage');
  el.id = 'stage';
  const moments = div('stage-moments');
  const hud = div('stage-hud');
  const overlay = div('stage-overlay');
  el.append(moments, hud, overlay);
  const windowOverlay = div('window-overlay');
  document.body.append(el, windowOverlay);

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  const listeners = new Set();
  function layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    scale = Math.min(vw / STAGE_W, vh / STAGE_H);
    offsetX = Math.round((vw - STAGE_W * scale) / 2);
    offsetY = Math.round((vh - STAGE_H * scale) / 2);
    el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    listeners.forEach((fn) => fn(scale));
  }
  window.addEventListener('resize', layout);
  layout();

  let letterbox = '#000000';
  return {
    el, moments, hud, overlay, windowOverlay,
    W: STAGE_W, H: STAGE_H,
    get scale() { return scale; },
    get rect() { return { x: offsetX, y: offsetY, w: STAGE_W * scale, h: STAGE_H * scale, scale }; },
    onResize(fn) { listeners.add(fn); fn(scale); return () => listeners.delete(fn); },
    // Window coordinates → stage px (for clicks).
    toStage(x, y) { return { x: (x - offsetX) / scale, y: (y - offsetY) / scale }; },
    setLetterbox(color, dur = 0) {
      if (!color || color === letterbox) return null;
      letterbox = color;
      gsap.killTweensOf([document.documentElement, document.body], 'backgroundColor');
      if (!dur) {
        gsap.set([document.documentElement, document.body], { backgroundColor: color });
        return null;
      }
      return gsap.to([document.documentElement, document.body], { backgroundColor: color, duration: dur, ease: 'power1.inOut' });
    },
    get letterbox() { return letterbox; },
  };
}
