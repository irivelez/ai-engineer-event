// EvidenceDoc: a real source page (screenshot) or chart as evidence: the image in a frame, an optional
// highlight box over the passage that matters, and the meta block under it (chip, publisher · date, title,
// the source's own disclaimer, link, optional SourceQR). Images are data URIs (ctx.assets.evidence(id).imageSrc).
// EvidenceDoc.create({ item: ctx.assets.evidence('x'), kind: 'independent', width: 900, highlight: { x, y, w, h } })
//   highlight: fractions (0–1) of the image; defaults to item.highlight. set({ highlight: true|false }) shows/hides it.
import { gsap, motion, root, esc, play, kill, withVisible } from './_core.js';
import { metaHTML } from './_evidence.js';

/**
 * @param {object} o
 * @param {object} o.item              evidence item: imageSrc (or posterSrc), url, publisher, title, date, disclaimer, highlight
 * @param {'void'|'paper'} [o.variant] default from o.ground
 * @param {number} [o.width=900]       frame width in stage px; height follows the image unless o.height (then cover, top-aligned)
 * @param {{x:number,y:number,w:number,h:number}|null} [o.highlight]
 * @param {boolean} [o.dim=true]       dim the rest of the image around the highlight
 * @param {string} [o.kind]            provenance chip kind; o.qr / o.qrSize / o.title / o.link as in EvidenceVideo
 */
export function create(o = {}) {
  const item = o.item || {};
  const variant = o.variant || (o.ground === 'paper' ? 'paper' : 'void');
  const ground = o.ground || variant;
  const W = o.width || 900;
  const src = o.src || item.imageSrc || item.posterSrc || '';
  const hl = o.highlight === undefined ? item.highlight || null : o.highlight;
  const pct = (v) => `${(Math.max(0, Math.min(1, Number(v) || 0)) * 100).toFixed(3)}%`;
  const el = root(`itaf-ev itaf-evdoc v-${variant}${o.dim === false ? ' no-dim' : ''}`, { ...o, ground, tag: 'figure', width: W });
  const meta = o.meta === false ? { html: '', qr: null } : metaHTML(item, { kind: o.kind, qr: o.qr, qrSize: o.qrSize, ec: o.ec, title: o.title, link: o.link });
  el.innerHTML = `<div class="ev-frame ev-docframe" style="width:${W}px${o.height ? `;height:${o.height}px` : ''}">` +
    (src ? `<img class="ev-img${o.height ? ' is-cover' : ''}" alt="${esc(item.title || '')}" src="${src}" draggable="false">` : '') +
    (hl ? `<div class="ev-hl" style="left:${pct(hl.x)};top:${pct(hl.y)};width:${pct(hl.w)};height:${pct(hl.h)}"></div>` : '') +
    `</div>${meta.html}`;
  const frame = el.querySelector('.ev-frame');
  const hlEl = el.querySelector('.ev-hl');
  const metaEl = el.querySelector('.ev-meta');
  let hlOn = !!hlEl && o.highlightOn !== false;

  const settle = () => {
    kill(el, frame, metaEl, hlEl);
    gsap.set(el, { autoAlpha: 1, y: 0 });
    if (metaEl) gsap.set(metaEl, { autoAlpha: 1, y: 0 });
    if (hlEl) gsap.set(hlEl, { autoAlpha: hlOn ? 1 : 0, scale: 1 });
  };

  const api = {
    el,
    frame,
    qr: meta.qr,
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, frame, metaEl, hlEl);
        sub.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease }, 0);
        if (metaEl) sub.fromTo(metaEl, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0.45);
        if (hlEl) {
          if (hlOn) sub.fromTo(hlEl, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0.8);
          else gsap.set(hlEl, { autoAlpha: 0 });
        }
      }, settle);
    },
    out(tl, at) { return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, y: -16, duration: motion.calmOut.dur, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 })); },
    /** state: { highlight: boolean } */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      if (state.highlight === undefined || !hlEl) return tl;
      hlOn = !!state.highlight;
      if (animate) tl.to(hlEl, { autoAlpha: hlOn ? 1 : 0, scale: 1, duration: motion.micro.dur * 1.5, ease: motion.micro.ease });
      else gsap.set(hlEl, { autoAlpha: hlOn ? 1 : 0, scale: 1 });
      return tl;
    },
    destroy() { kill(el, frame, metaEl, hlEl); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  if (hlEl) gsap.set(hlEl, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create };
