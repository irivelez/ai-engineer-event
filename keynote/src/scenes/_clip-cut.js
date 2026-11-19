// Act I talk clips, cut to the quote: the moment's evidence video (src/data/evidence.json) seeks inside its
// trimmed .mp4 to the span in src/data/clip-cuts.json (YouTube's own word timings), with timed verbatim
// captions and the source link at the quote's second. Muted by default, M toggles sound (EvidenceVideo).
// The meta block carries the provenance chip, publisher · date, the link and a SourceQR to that exact URL.
import clipCuts from '../data/clip-cuts.json';

/** The evidence item with its cut applied (or the item unchanged when it has no cut). */
export function cutItem(item) {
  const c = item && clipCuts.cuts && clipCuts.cuts[item.id];
  if (!c) return item;
  const s0 = Number(item.start) || 0;
  const r = (v) => Math.round(v * 1000) / 1000;
  return {
    ...item,
    start: c.from,
    end: c.to,
    duration: r(c.to - c.from),
    localStart: r(c.from - s0),
    localEnd: r(c.to - s0),
    url: c.url || item.url,
    captions: c.captions || item.captions,
  };
}

/** EvidenceVideo for this moment's talk clip, or null when the moment has none. */
export function talkClip(ctx, { width, ground, qrSize = 222, title = false } = {}) {
  const C = ctx.components;
  const list = (ctx.assets.evidenceFor && ctx.assets.evidenceFor(ctx.beat.id)) || [];
  const ev = list.find((e) => e.kind === 'video') || null;
  if (!ev || !C.EvidenceVideo) return null;
  // ec 'L' keeps a youtube.com/watch?v=…&t=… link at QR version 3 (37 modules with the quiet zone): 6 px modules at 222 px
  return C.EvidenceVideo.create({ item: cutItem(ev), kind: ev.chip || 'official', width, qr: true, qrSize, ec: 'L', ground, title });
}
