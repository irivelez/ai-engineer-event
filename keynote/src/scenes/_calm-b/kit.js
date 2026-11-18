// Shared helpers for calm-b's moments (Acts IV–V and the close). Builds on calm-a's kit (src/scenes/_calm/kit.js:
// makeKit, calmScene, footer, stepper, block), which we import and never edit.
import { gsap } from 'gsap';
import { el, esc, fmtDate, factSource, tagSource, kindOf } from '../_calm/kit.js';

export { el, esc, fmtDate, factSource, tagSource, kindOf };

// ---------- CSS (scoped to .cb-*) ----------
const CSS = `
.cb-abs { position:absolute; }
.cb-mono { font-family: var(--f-mono); font-feature-settings: "tnum" 1, "zero" 0; }
.cb-nowrap { white-space: nowrap; }
.cb-mask { overflow: clip; padding: 0.16em 0 0.24em; margin: -0.16em 0 -0.24em; }
.cb-mask > * { display: block; }
.cb-body40 { font-family: var(--f-sans); font-size: 40px; line-height: 52px; letter-spacing: -0.006em; font-weight: 460; }
.cb-body48 { font-family: var(--f-sans); font-size: 48px; line-height: 64px; letter-spacing: -0.01em; font-weight: 440; }
.cb-src { display:flex; align-items:center; gap:20px; color: var(--g-muted); white-space: nowrap; }
.cb-icon { display:block; color: var(--g-fg); }
.cb-crop { position:relative; overflow:hidden; background:#FFFFFF; border-radius:16px;
  box-shadow: 0 0 0 2px rgba(11,15,20,0.07), 0 2px 4px rgba(11,15,20,0.04), 0 12px 24px -4px rgba(11,15,20,0.08), 0 40px 80px -24px rgba(11,15,20,0.20); }
.cb-crop > .cb-seg { position:relative; overflow:hidden; }
.cb-crop img { position:absolute; left:0; display:block; max-width:none; user-select:none; }
`;
export function ensureCSS() {
  if (document.getElementById('calm-b-kit-css')) return;
  const s = document.createElement('style');
  s.id = 'calm-b-kit-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/** 'Act V · What you do next' for the moment's act. */
export function actLine(ctx) {
  const a = ctx.act;
  if (!a) return '';
  return a.n ? `Act ${a.n} · ${a.title}` : a.title || '';
}

/** Index of the moment's act among the numbered acts (I–V), and how many there are. */
export function actIndex(ctx) {
  const numbered = (ctx.acts || []).filter((a) => a.n);
  return { index: Math.max(0, numbered.findIndex((a) => a.id === ctx.beat.act)), total: numbered.length || 5 };
}

/** A fact's source as { kind, text } with a fallback ({ kind, text }) when the fact is missing. */
export function sourceOf(ctx, id, fallback) {
  const s = id ? factSource(ctx, id) : null;
  if (s && s.text) return { kind: s.kind, text: s.text, fact: s.fact };
  return fallback || null;
}

/** Captures that exist in this build, in the preferred order: [{ id, src, meta }]. */
export function captures(ctx, ids) {
  return ids
    .map((id) => ({ id, src: ctx.assets.capture(id), meta: ctx.assets.captureMeta(id) || {} }))
    .filter((c) => c.src);
}

/** '4 Nov 2026' from an ISO timestamp (UTC date part, as published). */
export function isoDay(s) { return fmtDate(String(s || '').slice(0, 10)); }

/** Outlet name of a capture: 'Sam Altman (@sama)' → { name: 'Sam Altman', handle: '@sama' }. */
export function authorParts(author) {
  const m = /^(.*?)\s*\((@[^)]+)\)\s*$/.exec(String(author || ''));
  return m ? { name: m[1], handle: m[2] } : { name: String(author || ''), handle: '' };
}

/**
 * A capture shown as one card made of one or more horizontal crops of the same screenshot, stacked
 * (e.g. a masthead strip + the headline band, skipping the blank slot left where an ad was hidden).
 * segs: [[y0, y1], …] in image px (default: the whole image). w: card width in stage px.
 * Returns { el, height }.
 */
export function cropCard(src, { iw, ih, segs, w, alt = '' }) {
  ensureCSS();
  const k = w / iw;
  const list = segs && segs.length ? segs : [[0, ih]];
  const card = el('div', 'cb-crop');
  let H = 0;
  list.forEach(([y0, y1], i) => {
    const h = Math.round((y1 - y0) * k);
    const seg = el('div', 'cb-seg', card);
    seg.style.height = `${h}px`;
    if (i > 0) seg.style.borderTop = '2px solid rgba(11,15,20,0.06)';
    const img = el('img', '', seg);
    img.src = src;
    img.alt = i === 0 ? alt : '';
    img.draggable = false;
    Object.assign(img.style, { width: `${w}px`, height: `${Math.round(ih * k)}px`, top: `${-Math.round(y0 * k)}px` });
    H += h + (i > 0 ? 2 : 0);
  });
  card.style.width = `${w}px`;
  card.style.height = `${H}px`;
  return { el: card, height: H };
}

/** Chip + 'Outlet · date' markup (static), for rows that carry their own provenance. */
export function srcHTML(C, s) {
  if (!s) return '';
  return `${C.chipHTML(s.kind)}<span class="t-source">${esc(s.text)}</span>`;
}

/** Odometer-free tween of a number into an element's text (en-US grouping), deterministic at the end. */
export function countTo(tl, node, from, to, { dur = 1.2, ease = 'expo.out', at = 0, fmt = (v) => Math.round(v).toLocaleString('en-US') } = {}) {
  const o = { v: from };
  tl.to(o, { v: to, duration: dur, ease, onUpdate: () => { node.textContent = fmt(o.v); }, onComplete: () => { node.textContent = fmt(to); } }, at);
  return tl;
}

export { gsap };

// ---------- captures ----------
// Pixel sizes of the capture files (media/captures/*), read 18 Nov 16:30. Crops below are in these pixels;
// if a file changes size the crop falls back to the whole image (see capCard).
export const DIMS = {
  'ap-anthropic-ipo-filing': [1600, 1668], 'ap-everything-broken': [1600, 1850], 'ap-nvidia-rejects-huang': [1600, 1852],
  'bbc-australia-rogue-ai': [1555, 622], 'bloomberglinea-latam-ai-impact': [1600, 2044], 'cnbc-amazon-tokenmaxxing': [1548, 954],
  'cnbc-crowdstrike-rogue-agents': [1548, 954], 'cnbc-superintelligence-earnings': [1548, 1038], 'eleconomista-almacenes-ia-32': [1600, 688],
  'nypost-ai-apocalypse-fever': [1600, 719], 'nypost-california-sues-openai': [1600, 829], 'thesun-ai-wipe-out-humanity': [1600, 1080],
  'thesun-bosses-ai-job-cuts': [1600, 1015], 'venturebeat-gpt-62-unusable': [1600, 881], 'verge-data-centers-electricity': [1600, 1221],
  'verge-claude-fable-52': [1600, 1221], 'techcrunch-chip-rule': [1600, 856],
  'x-anthropic-s1-ipo': [868, 1182], 'x-karpathy-hackertube': [868, 1618], 'x-openai-securing-training-environment': [868, 1510],
  'x-sama-control-of-the-future': [868, 514], 'x-satyanadella-agentic-insider': [868, 636], 'x-sundarpichai-gemini-4-carbon': [868, 1521],
};

const TZ_RE = /(Z|[+-]\d{2}:?\d{2})$/;
/** '16 Nov 2026' for a capture timestamp, in Bogotá time when the stamp has a zone (X shows the viewer's local day). */
export function dayOf(s) {
  const str = String(s || '').trim();
  if (!str) return '';
  if (TZ_RE.test(str)) {
    const d = new Date(str.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
    if (!isNaN(d)) {
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', year: 'numeric' }).formatToParts(d);
      const get = (t) => (p.find((x) => x.type === t) || {}).value || '';
      return `${get('day')} ${get('month')} ${get('year')}`;
    }
  }
  return fmtDate(str.slice(0, 10));
}

/** Caption fields for CaptureCard.meta from captures.json. */
export function capMeta(m, { counts = true, captured } = {}) {
  if (!m) return {};
  if (m.kind === 'x') {
    const a = authorParts(m.author);
    const v = m.counts && m.counts.displayed && m.counts.displayed.views;
    return { outlet: 'X', author: a.handle || a.name, date: dayOf(m.published), counts: counts && v ? `${v} views` : undefined, captured: captured !== false ? dayOf(m.captured_at) : undefined };
  }
  return { outlet: m.outlet || '', date: dayOf(m.published), captured: captured ? dayOf(m.captured_at) : undefined };
}

/**
 * A CaptureCard for capture `id`, optionally cropped to one or more bands of the screenshot (image px).
 * opts: { width, segs: [[y0, y1], …], tilt, ground, meta, caption: false }
 * Several bands stack with a 2 px seam (used to skip the blank slot left where a page's ad was hidden,
 * or a site's unrelated "trending" strip). Returns the CaptureCard api (+ .height) or null if missing.
 */
export function capCard(ctx, id, opts = {}) {
  const src = ctx.assets.capture(id);
  if (!src) return null;
  const m = ctx.assets.captureMeta(id) || {};
  const C = ctx.components;
  const width = opts.width || 880;
  const ground = opts.ground || 'paper';
  const card = C.CaptureCard.create({ src, alt: m.title || '', variant: ground, ground, width, tilt: opts.tilt || 0, meta: opts.caption === false ? {} : (opts.meta || capMeta(m)) });
  const dims = DIMS[id];
  let height = null;
  if (dims && opts.segs && opts.segs.length) {
    const [iw, ih] = dims;
    const k = width / iw;
    const frame = card.el.querySelector('.cap-frame');
    const img = card.el.querySelector('.cap-img');
    const segs = opts.segs.map(([a, b]) => [Math.max(0, a), Math.min(ih, b)]).filter(([a, b]) => b > a);
    if (segs.length === 1) {
      const [a, b] = segs[0];
      frame.style.height = `${Math.round((b - a) * k)}px`;
      img.style.marginTop = `${-Math.round(a * k)}px`;
      height = Math.round((b - a) * k);
    } else {
      frame.innerHTML = '';
      height = 0;
      segs.forEach(([a, b], i) => {
        const h = Math.round((b - a) * k);
        const seg = document.createElement('div');
        seg.style.cssText = `position:relative;overflow:hidden;height:${h}px;${i ? 'border-top:2px solid rgba(11,15,20,0.10);' : ''}`;
        const im = document.createElement('img');
        im.className = i === 0 ? 'cap-img' : 'cap-img-seg';
        im.src = src;
        im.alt = i === 0 ? (m.title || '') : '';
        im.draggable = false;
        im.style.cssText = `display:block;width:${width}px;max-width:none;height:auto;margin-top:${-Math.round(a * k)}px;`;
        seg.appendChild(im);
        frame.appendChild(seg);
        height += h + (i ? 2 : 0);
      });
    }
  } else if (dims) {
    height = Math.round(dims[1] * (width / dims[0]));
  }
  card.height = height;
  card.meta = m;
  return card;
}

/**
 * Wrap the first occurrence of `word` inside `el` in <span class="cls">, without touching spacing.
 * Why: components/_core.js splitLines() rebuilds each line by joining word tokens with ' ', so a highlight
 * span next to punctuation gains spaces in live mode ("2027 ?", "“ tokenmaxxing ”:"). Scenes pass no
 * `highlight` to Headline and call this after every Headline state change instead (render and live alike).
 */
export function accentWord(el, word, cls = 'itaf-hl') {
  if (!el || !word || el.querySelector(`.${cls}`)) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const i = n.data.indexOf(word);
    if (i < 0) continue;
    const r = document.createRange();
    r.setStart(n, i);
    r.setEnd(n, i + word.length);
    const s = document.createElement('span');
    s.className = cls;
    r.surroundContents(s);
    return s;
  }
  return null;
}

/** Undo accentWord (call before a Headline state change, so a re-split never sees the span as a wrapper). */
export function clearAccent(el, cls = 'itaf-hl') {
  if (!el) return;
  const spans = el.querySelectorAll(`.${cls}`);
  if (!spans.length) return;
  spans.forEach((s) => s.replaceWith(document.createTextNode(s.textContent)));
  el.normalize();
}
