// The film's last frame: white "Inside the AI Frontier" on #000, ink box x 584–1341, y 508–570 (baseline 570).
// fitFilmTitle(svgText, { family, weight }) sizes an SVG <text> so its ink box lands on that box:
// font size from the ink height, letter-spacing from the ink width. Used by the opener's fallback and
// available to the title scene (import { fitFilmTitle, FILM_TITLE_BOX } from '../engine/title-fit.js').
export const FILM_TITLE_BOX = { left: 584, right: 1341, top: 508, baseline: 570 };

export function measureInk(text, font) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = font;
  const m = c.measureText(text);
  return {
    left: m.actualBoundingBoxLeft || 0,
    width: (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width),
    ascent: m.actualBoundingBoxAscent || 0,
  };
}

export function fitFilmTitle(textEl, { family, weight = 600, box = FILM_TITLE_BOX } = {}) {
  const text = textEl.textContent || '';
  const n = Math.max(1, [...text].length);
  const ref = measureInk(text, `${weight} 100px ${family}`);
  if (!ref.ascent || !ref.width) return null;
  const size = (100 * (box.baseline - box.top)) / ref.ascent;
  const k = size / 100;
  const inkW = ref.width * k;
  const ls = n > 1 ? (box.right - box.left - inkW) / (n - 1) : 0;
  textEl.setAttribute('font-size', size.toFixed(2));
  textEl.setAttribute('font-weight', String(weight));
  textEl.setAttribute('letter-spacing', ls.toFixed(3));
  textEl.setAttribute('x', (box.left + ref.left * k).toFixed(2));
  textEl.setAttribute('y', String(box.baseline));
  return { size, letterSpacing: ls };
}
