// The five cue icons (owner: DD). Irina's private cues; the audience sees only the shape.
// Drawn on a 48-unit grid, live area 5–43, 2-unit strokes, round caps and joins, no fills
// except the small weights in "tradeoffs". Each has a different silhouette so they never
// read as one another at 44 px: horizontal (speed), tilted (tradeoffs), vertical (constraints),
// dome (uncertainty), faceted (value).
//
// Zoom: at the 44 px HUD size iconSVG thickens the stroke to 2.5 stage px (2.73 units), so the
// lines survive Zoom's downscale to 720p; at 96 px and above the stroke is the drawn 2 units.

const SW = 2; // design stroke in grid units

export const icons = {
  // Two forward chevrons: momentum.
  speed: {
    label: 'Speed',
    body: '<path d="M10 12 L22 24 L10 36"/><path d="M24 12 L36 24 L24 36"/>',
  },
  // A seesaw tipped by a heavy round weight against a light square one: one thing costs another.
  tradeoffs: {
    label: 'Trade-offs',
    body:
      '<path d="M6 29 L42 19"/>' +
      '<path d="M24 24 L17.5 38 H30.5 Z"/>' +
      '<circle cx="10.4" cy="22.6" r="4.2" fill="currentColor" stroke="none"/>' +
      '<rect x="31.6" y="13.2" width="6.6" height="6.6" rx="0.8" transform="rotate(-15.5 34.9 16.5)" fill="currentColor" stroke="none"/>',
  },
  // An arrow rising into a lid: a ceiling you hit.
  constraints: {
    label: 'Constraints',
    body: '<path d="M9 16 V9 H39 V16"/><path d="M24 41 V19"/><path d="M16 27 L24 19 L32 27"/>',
  },
  // A distribution and its interval: we know the shape, not the point.
  uncertainty: {
    label: 'Uncertainty',
    body:
      '<path d="M5 33 C13 33 17 8 24 8 C31 8 35 33 43 33"/>' +
      '<path d="M13 41 H35"/><path d="M13 37.5 V44"/><path d="M35 37.5 V44"/>',
  },
  // A cut stone: crown, girdle, pavilion.
  value: {
    label: 'Value',
    body:
      '<path d="M14 9 H34 L43 19 L24 41 L5 19 Z"/><path d="M5 19 H43"/>' +
      '<path d="M18 19 L24 9 L30 19"/><path d="M18 19 L24 41 L30 19"/>',
  },
};

export const iconNames = Object.keys(icons);

// Stroke in grid units so the rendered line is `strokePx` stage px.
function strokeUnits(size, strokePx) {
  const px = strokePx ?? (size <= 64 ? 2.5 : (SW * size) / 48);
  return +(px * 48 / size).toFixed(3);
}

/**
 * SVG markup for a cue icon.
 * iconSVG('speed', { size: 44, color: '#0B0F14' })  →  '<svg …>…</svg>'
 * @param {string} name   speed | tradeoffs | constraints | uncertainty | value
 * @param {{size?: number, color?: string, strokePx?: number, title?: string, className?: string}} [opts]
 */
export function iconSVG(name, opts = {}) {
  const icon = icons[name];
  if (!icon) return '';
  const size = opts.size ?? 44;
  const color = opts.color ?? 'currentColor';
  const sw = strokeUnits(size, opts.strokePx);
  const a11y = opts.title ? `role="img" aria-label="${opts.title}"` : 'aria-hidden="true"';
  const cls = opts.className ? ` class="${opts.className}"` : '';
  return (
    `<svg${cls} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" ${a11y} ` +
    `fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ` +
    `style="color:${color};display:block;overflow:visible">${icon.body}</svg>`
  );
}

/** Same as iconSVG but returns an element. */
export function iconEl(name, opts = {}) {
  const t = document.createElement('template');
  t.innerHTML = iconSVG(name, opts);
  return t.content.firstElementChild;
}

export default { icons, iconNames, iconSVG, iconEl };
