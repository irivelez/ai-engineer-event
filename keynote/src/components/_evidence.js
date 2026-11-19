// Shared parts of the evidence kit (EvidenceVideo, EvidenceDoc): the meta block under a piece of evidence
// (provenance chip + "Publisher · date", title, the source's own disclaimer, link) with an optional SourceQR.
// Every string comes from the evidence item (src/data/evidence.json), never from here.
import { esc } from './_core.js';
import { chipHTML } from './ProvenanceChip.js';
import { qrSVG, shortUrl } from './SourceQR.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** '2026-11-09' → '9 Nov 2026'; anything else passes through. */
export function fmtDate(s) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(s || ''));
  if (!m) return String(s || '');
  return m[3] ? `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}` : `${MON[+m[2] - 1]} ${m[1]}`;
}

/**
 * Meta block markup. opts: kind (provenance kind), qr (bool), qrSize, ec, title (bool), link (bool), disclaimer (bool).
 * Returns { html, qr } where qr = { size, module } when a QR was drawn.
 */
export function metaHTML(item, o = {}) {
  const it = item || {};
  const src = [it.publisher, fmtDate(it.date)].filter(Boolean).map(esc).join(' · ');
  const showTitle = o.title !== false && it.title;
  const showDisc = o.disclaimer !== false && it.disclaimer;
  const showLink = o.link !== false && it.url;
  let qr = null;
  let qrHTML = '';
  if (o.qr && it.url) {
    qr = qrSVG(it.url, { px: o.qrSize || 222, ec: o.ec || 'M' });
    qrHTML = `<div class="itaf-qr ev-qr"><div class="qr-card" style="width:${qr.size}px;height:${qr.size}px">${qr.svg}</div></div>`;
  }
  const html = `<figcaption class="ev-meta">${qrHTML}<div class="ev-meta-text">` +
    `<div class="ev-src">${o.kind ? chipHTML(o.kind) : ''}<span class="t-source ev-pub">${src}</span></div>` +
    (showTitle ? `<div class="t-source ev-title">${esc(it.title)}</div>` : '') +
    (showDisc ? `<div class="t-source ev-disclaimer">${esc(it.disclaimer)}</div>` : '') +
    (showLink ? `<div class="t-source ev-link">${esc(shortUrl(it.url))}</div>` : '') +
    '</div></figcaption>';
  return { html, qr };
}

/** The page protocol: 'file:' when double-clicked, 'https:' on the deployed site. */
export function protocol() {
  try { return window.location.protocol; } catch (e) { return 'file:'; }
}
/** ?evidence=poster | youtube forces a fallback (QA). */
export function forcedMode() {
  try { return new URLSearchParams(window.location.search).get('evidence'); } catch (e) { return null; }
}
