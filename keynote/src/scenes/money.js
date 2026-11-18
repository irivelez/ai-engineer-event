// money (calm-b, PAPER data): follow the money. Run-rates, an IPO, capex at a scale no industry has seen.
// Steps 0–2: one figure per step at display size (odometer digits), its label at lead size and its own chip +
//            source under it (lab-reported / official / secondary, with the secondary caveat kept).
// Step 3: the headlines: the real X post of the S-1 filing and AP's story on it slide in as cards.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { actLine, ensureCSS, sourceOf, tagSource, capCard } from './_calm-b/kit.js';

// Captures for the headlines step (director's curation), with crops in image px.
const CARDS = [
  { id: 'x-anthropic-s1-ipo', segs: [[0, 262]], width: 868 * 0.92, tilt: -1.2 },
  { id: 'ap-anthropic-ipo-filing', segs: [[0, 65], [185, 1000]], width: 760, tilt: 1.0 },
];

export default calmScene('money', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const items = (copy.items || []).slice(0, 3);
  const facts = ctx.beat.facts || [];

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(8) }), M, 192, T.spanW(8));

  // provenance per item: kind from facts.json (else the tag's first word); text = publisher · date, plus any
  // caveat the tag carries after its first ' · ' (e.g. "not checked against filings")
  const srcs = items.map((it, i) => {
    const fs = sourceOf(ctx, facts[i]);
    const tag = String(it.tag || '');
    const parts = tag.split(' · ');
    const extra = parts.length > 1 ? parts.slice(1).join(' · ') : '';
    const kind = fs ? fs.kind : tagSource(tag).kind;
    const text = [fs ? fs.text : '', extra].filter(Boolean).join(' · ') || tag;
    return { kind, text };
  });

  // ----- the big figure, one per step -----
  const FIG_Y = 344;
  const figs = items.map((it, i) => K.add(C.BigNumber.create({ display: String(it.value || '').replace(/ /g, ' '), label: it.label || '', kind: srcs[i].kind, source: srcs[i].text, size: 'display', ground: g }), M, FIG_Y, T.spanW(12)));
  figs.forEach((f) => { const lb = f.el.querySelector('.bn-label'); if (lb) lb.style.maxWidth = `${T.spanW(9)}px`; });

  // ----- step 3: the headlines -----
  const cards = [];
  CARDS.forEach((spec) => {
    const c = capCard(ctx, spec.id, { width: spec.width, segs: spec.segs, tilt: spec.tilt, ground: g });
    if (c) cards.push({ c, spec });
  });
  // layout: two cards side by side under the title, slightly overlapping, centred vertically in 300–944
  const AREA_TOP = 316;
  const gap = 48;
  const totalW = cards.reduce((s, x) => s + x.spec.width, 0) + gap * Math.max(0, cards.length - 1);
  let x = Math.max(M, Math.round((1920 - totalW) / 2));
  cards.forEach(({ c, spec }) => {
    const h = (c.height || 500) + 56;
    const y = AREA_TOP + Math.max(0, Math.round((944 - AREA_TOP - h) / 2));
    place(c.el, x, y, spec.width);
    K.owned.push(c);
    x += spec.width + gap;
  });

  const foot = K.footer();

  const parts = [
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    ...figs.map((f, i) => ({ c: f, on: (s) => s === i, at: 0.3 })),
    ...cards.map(({ c }, i) => ({ c, on: (s) => s >= 3, at: 0.35 + i * 0.3 })),
  ];
  const apply = K.stepper(parts);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    // steps 0–2 carry their chip and source under the figure; at step 3 the cards' captions do
    foot.show(null, anim, tl, 0);
    return tl;
  }
  return { go };
});
