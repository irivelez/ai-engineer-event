// SourceQR: a crisp QR code to the exact source URL, generated locally (qrcode-generator → one SVG path,
// crispEdges) on a white card, with a short label under it. Sized for a Zoom viewer to scan from the screen:
// the module is a whole number of stage px, never under 4 (aim for 6+: Zoom may downscale 1080p to 720p).
// SourceQR.create({ url: item.url, label: 'youtube.com/watch?v=…', size: 246, ground: 'void' })
import qrcode from 'qrcode-generator';
import { gsap, motion, root, esc, play, kill, withVisible } from './_core.js';

/**
 * QR as SVG markup. `px` is the target edge in stage px; the real edge is module × (modules + 2 × quiet).
 * Returns { svg, size, module, modules }.
 */
export function qrSVG(text, { px = 240, ec = 'M', quiet = 4, minModule = 4, dark = '#0B0F14', light = '#FFFFFF' } = {}) {
  const qr = qrcode(0, ec);
  qr.addData(String(text || ''));
  qr.make();
  const n = qr.getModuleCount();
  const total = n + 2 * quiet;
  const mod = Math.max(minModule, Math.floor(px / total));
  const size = mod * total;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      let run = 1; // merge horizontal runs into one rect each
      while (c + run < n && qr.isDark(r, c + run)) run++;
      d += `M${(c + quiet) * mod},${(r + quiet) * mod}h${run * mod}v${mod}h${-run * mod}z`;
      c += run - 1;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code: ${esc(text)}"><rect width="${size}" height="${size}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
  return { svg, size, module: mod, modules: n };
}

/** 'https://www.youtube.com/watch?v=x' → 'youtube.com/watch?v=x' (what a viewer could type). */
export function shortUrl(url) {
  return String(url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

/**
 * @param {object} o
 * @param {string} o.url              the exact source URL the code opens
 * @param {string} [o.label]          short line under the card (data, e.g. shortUrl(url) or copy)
 * @param {number} [o.size=240]       target edge in stage px
 * @param {'L'|'M'|'Q'|'H'} [o.ec='M']
 * @param {'paper'|'void'} [o.ground]
 */
export function create(o = {}) {
  const el = root('itaf-qr', o);
  const q = qrSVG(o.url, { px: o.size || 240, ec: o.ec || 'M' });
  el.innerHTML = `<div class="qr-card" style="width:${q.size}px;height:${q.size}px">${q.svg}</div>` +
    (o.label ? `<div class="qr-label t-source" style="max-width:${Math.max(q.size, o.labelWidth || 0)}px">${esc(o.label)}</div>` : '');
  el.dataset.url = o.url || '';
  el.dataset.module = String(q.module);
  const card = el.querySelector('.qr-card');
  const label = el.querySelector('.qr-label');
  const settle = () => { kill(el, card, label); gsap.set(el, { autoAlpha: 1 }); gsap.set(card, { autoAlpha: 1, scale: 1 }); if (label) gsap.set(label, { autoAlpha: 1, y: 0 }); };

  const api = {
    el,
    size: q.size,
    module: q.module,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, card, label);
        gsap.set(el, { autoAlpha: 1 });
        sub.fromTo(card, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: motion.calmIn.dur * 0.9, ease: motion.calmIn.ease }, 0);
        if (label) sub.fromTo(label, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0.3);
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, duration: motion.calmOut.dur * 0.6, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 })); },
    set() { return gsap.timeline(); },
    destroy() { kill(el, card, label); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create, qrSVG, shortUrl };
