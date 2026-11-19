// Evidence pages for Acts III–IV: the real source page beside the claim it backs, built on DD's EvidenceDoc
// (chip + publisher · date, the source's own disclaimer when it has one, link, SourceQR to the exact URL). Adds:
// - a crop window: only the passage that carries the claim, scaled up so its text reads over Zoom;
// - accent boxes on that passage (no dimming), shown per step with focus();
// - a scroll between two windows of the same page (the page moves, like scrolling to the passage);
// - the meta block beside the frame (o.side) when there is no room under it.
// Coordinates are fractions of the evidence image (item.pixels = 'W x H' in src/data/evidence.json).
import { gsap } from 'gsap';

/** This moment's evidence item `id` (with its image inlined), or null. */
export function evItem(ctx, id) {
  const all = (ctx.assets.evidenceFor && ctx.assets.evidenceFor(ctx.beat.id)) || [];
  return all.find((e) => e.id === id && e.imageSrc) || null;
}

/**
 * @param {object} ctx
 * @param {object} item            evidence item (evItem)
 * @param {object} o
 * @param {number} o.width         frame width in stage px; the window's width fills it
 * @param {{x0?:number,x1?:number,y0?:number,y1?:number}} [o.win]  visible window (default: the whole image)
 * @param {Object<string,{x:number,y:number,w:number,h:number}>} [o.boxes]  accent boxes, hidden until focus()
 * @param {number} [o.side]        meta block to the right of the frame, this many px wide (else under it)
 * @param {'paper'|'void'} [o.ground]
 * @param {number} [o.qrSize=168]
 * @param {boolean} [o.link=true]   the URL as text under the source; off for very long URLs (the QR carries it)
 */
export function evPage(ctx, item, o = {}) {
  const C = ctx.components;
  const [iw, ih] = String(item.pixels || '').split(/\s*[x×]\s*/).map(Number);
  const ok = iw > 0 && ih > 0;
  const win = { x0: 0, x1: 1, y0: 0, y1: 1, ...(o.win || {}) };
  const W = Math.round(o.width);
  const s = ok ? W / ((win.x1 - win.x0) * iw) : 1;
  const imgW = ok ? iw * s : W;
  const imgH = ok ? ih * s : Math.round(W * 0.56);
  const H = ok ? Math.round((win.y1 - win.y0) * imgH) : imgH;
  const doc = C.EvidenceDoc.create({
    item, kind: item.chip, ground: o.ground, width: W, height: H, highlight: null, dim: false, qr: true, qrSize: o.qrSize || 168, title: false, link: o.link !== false,
  });
  const frame = doc.frame;
  const img = frame.querySelector('.ev-img');
  // the image and its boxes live in one layer in image coordinates, so they scroll together
  const layer = document.createElement('div');
  Object.assign(layer.style, { position: 'absolute', left: '0', top: '0', width: `${imgW}px`, height: `${imgH}px` });
  if (img) {
    img.classList.remove('is-cover');
    Object.assign(img.style, { width: `${imgW}px`, height: `${imgH}px`, maxWidth: 'none' });
    frame.insertBefore(layer, img);
    layer.appendChild(img);
  } else frame.appendChild(layer);
  const boxes = {};
  Object.entries(o.boxes || {}).forEach(([k, b]) => {
    const e = document.createElement('div');
    e.className = 'ev-hl';
    Object.assign(e.style, { left: `${b.x * imgW}px`, top: `${b.y * imgH}px`, width: `${b.w * imgW}px`, height: `${b.h * imgH}px` });
    layer.appendChild(e);
    gsap.set(e, { autoAlpha: 0 });
    boxes[k] = e;
  });
  // the QR keeps its full size in a narrow meta block (a shrunk code loses its whole-pixel modules)
  const qrBox = doc.el.querySelector('.ev-qr');
  if (qrBox) qrBox.style.flex = 'none';
  const meta = doc.el.querySelector('.ev-meta');
  if (o.side && meta) {
    Object.assign(doc.el.style, { display: 'flex', alignItems: 'flex-start', gap: '40px', width: `${W + 40 + o.side}px` });
    Object.assign(meta.style, { marginTop: '0', width: `${o.side}px`, flex: 'none' });
  }
  const pos = (y0) => ({ x: -win.x0 * imgW, y: -y0 * imgH });
  gsap.set(layer, pos(win.y0));
  let curY = win.y0;

  return {
    c: doc,
    el: doc.el,
    height: H,
    /** Scroll the window so its top is at y0 (fraction of the image) and show only the boxes named in `on`. */
    focus({ y0 = win.y0, on = [] } = {}, animate = false, tl = gsap.timeline(), at = 0) {
      const anim = animate && !ctx.renderMode;
      const moves = y0 !== curY;
      gsap.killTweensOf([layer, ...Object.values(boxes)]);
      if (anim && moves) tl.to(layer, { ...pos(y0), duration: 1.2, ease: 'power3.inOut' }, at);
      else gsap.set(layer, pos(y0));
      Object.entries(boxes).forEach(([k, e]) => {
        const want = on.includes(k);
        if (anim) tl.to(e, { autoAlpha: want ? 1 : 0, duration: 0.45, ease: 'power2.out' }, want ? at + (moves ? 1.1 : 0.5) : at);
        else gsap.set(e, { autoAlpha: want ? 1 : 0 });
      });
      curY = y0;
      return tl;
    },
    destroy() {
      gsap.killTweensOf([layer, ...Object.values(boxes)]);
      doc.destroy();
    },
  };
}
