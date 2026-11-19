// Evidence crop, zoomed to the region that carries the claim (used by ruler.js).
// The source image is never edited: the frame shows one rectangle of it, scaled so its text stays legible over
// Zoom, and the EvidenceDoc meta block (chip, publisher · date, the source's disclaimer, SourceQR) sits where the
// scene puts it. Region and highlight are layout (image pixels / frame fractions), not facts.
//
// zoomDoc(ctx, item, { region: { x, y, w, h } (image px), width, maxHeight, ground, qrSize, highlight, disclaimer })
//   → { doc (EvidenceDoc component), W, H }
export function zoomDoc(ctx, item, o = {}) {
  const C = ctx.components;
  const [iw, ih] = String(item.pixels || '').split('x').map(Number);
  const r = o.region || { x: 0, y: 0, w: iw, h: ih };
  const aspect = r.w / r.h;
  let W = o.width;
  let H = Math.round(W / aspect);
  if (o.maxHeight && H > o.maxHeight) { H = o.maxHeight; W = Math.round(H * aspect); }
  const s = W / r.w;
  const it = { ...item };
  if (o.disclaimer !== undefined) it.disclaimer = o.disclaimer;
  const doc = C.EvidenceDoc.create({
    item: it, width: W, height: H, kind: item.chip || o.kind || 'independent', ground: o.ground,
    qr: true, qrSize: o.qrSize || 200, title: o.title === true, link: false, highlight: o.highlight || null, dim: false,
  });
  const img = doc.el.querySelector('.ev-img');
  if (img) {
    img.classList.remove('is-cover');
    Object.assign(img.style, { position: 'absolute', left: `${(-r.x * s).toFixed(1)}px`, top: `${(-r.y * s).toFixed(1)}px`, width: `${(iw * s).toFixed(1)}px`, maxWidth: 'none', height: 'auto' });
  }
  return { doc, W, H };
}

/**
 * Move the meta block out of the flow to (x, y) in stage px, given the figure's own stage position (fx, fy):
 * QR on the right, text right-aligned to its left (a source card in a free corner of the frame).
 */
export function metaCorner(doc, { fx, fy, x, y, w }) {
  const meta = doc.el.querySelector('.ev-meta');
  if (!meta) return;
  Object.assign(meta.style, { position: 'absolute', left: `${x - fx}px`, top: `${y - fy}px`, width: `${w}px`, marginTop: '0', flexDirection: 'row-reverse', justifyContent: 'flex-start' });
  const text = meta.querySelector('.ev-meta-text');
  if (text) Object.assign(text.style, { alignItems: 'flex-end', textAlign: 'right', flex: '1 1 auto' });
  const src = meta.querySelector('.ev-src');
  if (src) src.style.justifyContent = 'flex-end';
}
