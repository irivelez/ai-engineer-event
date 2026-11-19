// Evidence helpers for calm scenes in Act II (self-build, twins, open-weights): a real page or chart from
// src/data/evidence.json as an EvidenceDoc in the calm kit. It can show one region of the image (the passage), so
// the page's own text stays legible on a Zoom share; the highlight is given in image fractions. evMeta() is the
// kit's own meta block (chip, publisher · date, title, disclaimer, QR) as a separate element, for layouts where it
// cannot sit under the image. Every string comes from the item (src/data/evidence.json).

/** The evidence item with its image, or null when the item or the kit is missing. */
export function evItem(ctx, id) {
  const it = ctx.assets.evidence ? ctx.assets.evidence(id) : null;
  if (!it || !it.imageSrc || !ctx.components.EvidenceDoc) return null;
  return it;
}

function natural(item) {
  const m = /^(\d+)x(\d+)$/.exec(String(item.pixels || ''));
  return m ? { w: +m[1], h: +m[2] } : { w: 1600, h: 1000 };
}

/**
 * o: width; crop [x0, y0, x1, y1] (image fractions shown; default the whole image); hl [x, y, w, h] (image
 * fractions); qrSize, ec, title, link, meta (false: no meta block, use evMeta), dim.
 * Returns the EvidenceDoc (owned by K) with .frameH in stage px.
 */
export function evDoc(ctx, K, item, o = {}) {
  const W = o.width;
  const nat = natural(item);
  const [x0, y0, x1, y1] = o.crop || [0, 0, 1, 1];
  const s = W / (nat.w * (x1 - x0)); // stage px per image px
  const H = Math.round(nat.h * (y1 - y0) * s);
  let highlight = null;
  if (o.hl) {
    const [x, y, w, h] = o.hl;
    highlight = { x: (x - x0) / (x1 - x0), y: (y - y0) / (y1 - y0), w: w / (x1 - x0), h: h / (y1 - y0) };
  }
  const doc = ctx.components.EvidenceDoc.create({
    item, kind: item.chip, ground: K.g, width: W, height: o.crop ? H : undefined,
    highlight, highlightOn: !!highlight, dim: o.dim, qr: true, qrSize: o.qrSize || 205, ec: o.ec || 'L',
    title: o.title, link: o.link, meta: o.meta,
  });
  if (o.crop) {
    const img = doc.el.querySelector('.ev-img');
    if (img) {
      Object.assign(img.style, {
        position: 'absolute', maxWidth: 'none', objectFit: 'fill',
        width: `${nat.w * s}px`, height: `${nat.h * s}px`, left: `${-x0 * nat.w * s}px`, top: `${-y0 * nat.h * s}px`,
      });
    }
  }
  K.owned.push(doc);
  doc.frameH = o.crop ? H : Math.round(nat.h * s);
  return doc;
}

/** The meta block alone (same markup and classes as the kit's), as a calm-kit block. o: width, qrSize, ec, title, link. */
export function evMeta(ctx, K, item, o = {}) {
  const C = ctx.components;
  const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fig = document.createElement('figure');
  fig.className = `itaf-ev v-${K.g} ground-${K.g}`;
  if (o.width) fig.style.width = `${o.width}px`;
  const q = C.qrSVG(item.url, { px: o.qrSize || 205, ec: o.ec || 'L' });
  const src = [item.publisher, C.fmtDate(item.date)].filter(Boolean).map(esc).join(' · ');
  fig.innerHTML = `<figcaption class="ev-meta" style="margin-top:0">` +
    `<div class="itaf-qr ev-qr"><div class="qr-card" style="width:${q.size}px;height:${q.size}px">${q.svg}</div></div>` +
    `<div class="ev-meta-text"><div class="ev-src">${C.chipHTML(item.chip)}<span class="t-source ev-pub">${src}</span></div>` +
    (o.title !== false && item.title ? `<div class="t-source ev-title">${esc(item.title)}</div>` : '') +
    (item.disclaimer ? `<div class="t-source ev-disclaimer">${esc(item.disclaimer)}</div>` : '') +
    (o.link !== false && item.url ? `<div class="t-source ev-link">${esc(C.shortUrl(item.url))}</div>` : '') +
    '</div></figcaption>';
  return K.block(fig, { rise: 12 });
}
