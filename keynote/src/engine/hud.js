// HUD cue icon: Irina's private cue (speed, trade-offs, constraints, uncertainty, value) as a small icon,
// 44 px at 48 px from the bottom-left stage corner, on both grounds. H toggles it.
// Icons come from DD's src/design/icons.js when present (string SVG markup, path data, or a function
// returning either); otherwise the fallback set below (48 grid, 2.2 stroke so it stays ≥ 2 px at 44 px).
import { gsap } from 'gsap';

const FALLBACK = {
  speed: '<path d="M12 12 L24 24 L12 36 M24 12 L36 24 L24 36"/>',
  tradeoffs: '<path d="M8 17 H38 M32 11 L38 17 L32 23 M40 31 H10 M16 25 L10 31 L16 37"/>',
  constraints: '<path d="M17 8 H10 V40 H17 M31 8 H38 V40 H31 M18 24 H30"/>',
  uncertainty: '<path d="M5 38 C 15 38, 17 10, 24 10 S 33 38, 43 38" stroke-dasharray="4 4"/>',
  value: '<path d="M14 9 H34 L42 19 L24 40 L6 19 Z M6 19 H42 M24 40 L17 19 L20 9 M24 40 L31 19 L28 9"/>',
};

function lookup(icons, name) {
  if (!icons || !name) return null;
  const pools = [icons.cue, icons.cues, icons.icons, icons.default, icons];
  for (const p of pools) {
    if (p && typeof p === 'object' && p[name] != null) return p[name];
  }
  return null;
}

export function iconMarkup(icons, name, size = 44) {
  if (!name) return null;
  if (icons && typeof icons.iconSVG === 'function') {
    try {
      const s = icons.iconSVG(name, { size });
      if (s) return s;
    } catch { /* fall through */ }
  }
  let v = lookup(icons, name);
  if (v && typeof v === 'object' && typeof v.body === 'string') v = v.body;
  if (typeof v === 'function') {
    try { v = v({ size: 44, stroke: 2.2 }); } catch { v = null; }
  }
  if (v && typeof v === 'object' && v.nodeType === 1) return v.outerHTML;
  if (typeof v === 'string') {
    const s = v.trim();
    if (s.startsWith('<svg')) return s;
    if (s.startsWith('<')) return wrap(s);
    return wrap(`<path d="${s}"/>`);
  }
  return FALLBACK[name] ? wrap(FALLBACK[name]) : null;
}

const wrap = (inner) =>
  `<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export function createHud({ stage, icons, grounds, visible = true }) {
  const el = document.createElement('div');
  el.className = 'hud-cue';
  stage.hud.appendChild(el);
  let current = null;
  let shown = visible;
  let ground = 'void';
  const colorFor = (g) => (grounds && grounds[g] && (grounds[g].muted || grounds[g].fg)) || (g === 'paper' ? '#4A5361' : '#9AA4B2');

  function apply(dur) {
    gsap.to(el, { opacity: shown && current ? 1 : 0, duration: dur, ease: 'power1.inOut', overwrite: 'auto' });
  }
  return {
    el,
    set(name, g, dur = 0.5) {
      ground = g || ground;
      el.style.color = colorFor(ground);
      if (name === current) return apply(dur);
      const markup = iconMarkup(icons, name);
      if (!markup) {
        current = null;
        return apply(dur);
      }
      if (current && dur) {
        gsap.to(el, { opacity: 0, duration: dur / 2, overwrite: 'auto', onComplete: () => { el.innerHTML = markup; current = name; apply(dur / 2); } });
      } else {
        el.innerHTML = markup;
        current = name;
        apply(dur);
      }
    },
    toggle() { shown = !shown; apply(0.3); return shown; },
    get visible() { return shown; },
    get current() { return current; },
  };
}
