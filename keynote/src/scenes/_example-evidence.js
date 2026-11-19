// EXAMPLE (evidence kit): a source page as evidence on PAPER, with a highlight box and a standalone SourceQR.
// Try it:  node scripts/build.mjs --only self-build --map self-build=_example-evidence --out .dev/evdoc.html
//
// It uses this moment's own evidence item (kind 'page' or 'chart') from src/data/evidence.json when there is one;
// otherwise it builds the item from the moment's first fact (publisher, title, date, url) and a demo image, so the
// kit can be checked before the evidence data lands. Steps: 0 page + meta, 1 highlight box, 2 QR to the source.
import { gsap } from 'gsap';
import demoImage from '../../media/evidence/self-build-anthropic-90-merged.webp';

export default {
  id: '_example-evidence',
  gl: false,
  create(ctx) {
    const { root, components: C, beat, tokens } = ctx;
    const ground = beat.ground;
    let item = ((ctx.assets.evidenceFor && ctx.assets.evidenceFor(beat.id)) || []).find((e) => e.kind !== 'video' && e.imageSrc) || null;
    if (!item) {
      const f = ctx.facts((beat.facts || [])[0]) || {};
      const s = f.source || {};
      item = { url: s.url, publisher: s.publisher, title: s.title, date: s.date || f.asOf, imageSrc: demoImage, highlight: { x: 0.04, y: 0.34, w: 0.92, h: 0.22 }, chip: 'labReported' };
    }
    const doc = C.EvidenceDoc.create({ item, kind: item.chip, ground, width: tokens.spanW(8), height: 560, highlightOn: false });
    const qr = C.SourceQR.create({ url: item.url, label: C.shortUrl(item.url), size: 300, ground, labelWidth: 420 });
    Object.assign(doc.el.style, { position: 'absolute', left: '128px', top: '120px' });
    Object.assign(qr.el.style, { position: 'absolute', left: `${tokens.colX(9)}px`, top: '200px' });
    root.append(doc.el, qr.el);

    function stateTo(step, animate) {
      const tl = gsap.timeline();
      tl.add(doc.set({ visible: true }, { animate }), 0);
      tl.add(doc.set({ highlight: step >= 1 }, { animate }), animate ? 0.6 : 0);
      tl.add(qr.set({ visible: step >= 2 }, { animate }), 0);
      return tl;
    }
    return {
      steps: beat.steps.length,
      enter() { return stateTo(0, true); },
      goto(step, { animate }) { return stateTo(step, animate); },
      exit() { const tl = gsap.timeline(); doc.out(tl, 0); qr.out(tl, 0); return tl; },
      dispose() { doc.destroy(); qr.destroy(); root.replaceChildren(); },
    };
  },
};
