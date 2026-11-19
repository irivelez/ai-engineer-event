// money (calm-b, PAPER data): follow the money. Run-rates, an IPO, capex at a scale no industry has seen.
// Steps 0–2: one figure per step at display size (odometer digits); its label at lead size with its own chip +
//            source (lab-reported / official / secondary, the secondary caveat kept) sits beside the figure when
//            there is room (so the frame is used edge to edge), under it when the figure is wide.
// Step 3: the headlines: the real X post of the S-1 filing and AP's story on it slide in as cards.
// Evidence: step 0's run-rate has the State of AI report's own sentence under it (src/data/evidence.json), boxed,
// with its chip, caveat and QR beside it; that strip then carries the figure's provenance (one chip per frame).
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { evItem, evPage } from './_ev-page.js';
import { actLine, ensureCSS, sourceOf, tagSource, capCard, capMeta } from './_calm-b/kit.js';

// Captures for the headlines step (director's curation), with crops in image px.
const CARDS = [
  { id: 'x-anthropic-s1-ipo', segs: [[0, 262]], width: 760, tilt: -0.8, x: { counts: false, captured: false } },
  { id: 'ap-anthropic-ipo-filing', segs: [[0, 65], [185, 1000]], width: 856, tilt: 0.6 },
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

  // ----- the big figure, one per step; its label + provenance beside it when there is room, else under it -----
  const FIG_Y = 456;
  const FIG_H = T.type.display.size * T.type.display.line; // 216
  // step 0's evidence: the report's sentence ($105B by late summer, up from about $30B), lines 1–2 boxed
  const ev = evItem(ctx, 'money-stateofai-105');
  const DOC_W = 1100;
  const page = ev ? evPage(ctx, ev, {
    width: DOC_W, ground: g, side: 1920 - 2 * M - DOC_W - 40, qrSize: 184, // a short URL: bigger modules
    win: { y0: 0.08, y1: 0.92 },
    boxes: { runRate: { x: 0.01, y: 0.12, w: 0.975, h: 0.385 } },
  }) : null;
  if (page) K.add(page.c, M, FIG_Y + FIG_H + 32);
  const figs = items.map((it, i) => {
    const fig = K.add(C.BigNumber.create({ display: String(it.value || '').replace(/ /g, ' '), size: 'display', ground: g }), M, FIG_Y);
    const side = el('div', '');
    // non-breaking hyphens inside words and codes ("run-rate", "S-1"): a label never breaks at them
    const lab = el('div', 'cb-body48 balance', side, esc(String(it.label || '').replace(/(\w)-(\w)/g, '$1\u2011$2')));
    lab.style.color = G.fg;
    const meta = el('div', 'cb-src', side, `${C.chipHTML(srcs[i].kind)}<span class="t-source">${esc(srcs[i].text)}</span>`);
    meta.classList.add(`ground-${g}`);
    meta.style.marginTop = '24px';
    if (i === 0 && page) meta.style.display = 'none'; // the evidence strip under the figure carries chip + source
    place(side, M, FIG_Y + FIG_H + 24, T.spanW(12));
    const sideB = K.block(side, { rise: 20 });
    return { fig, side, sideB, lab };
  });
  function layout() {
    figs.forEach((f) => {
      const figEl = f.fig.el.querySelector('.bn-figure');
      const w = figEl ? figEl.offsetWidth : 800; // layout px (the stage scale does not apply)
      const x = M + Math.ceil(w) + 72;
      const room = 1920 - M - x;
      if (room >= 640) {
        // beside: the label block is vertically centred on the figure
        f.side.style.left = `${x}px`;
        f.side.style.width = `${room}px`;
        f.side.style.whiteSpace = 'normal';
        const h = f.side.offsetHeight || 200;
        f.side.style.top = `${Math.round(FIG_Y + FIG_H / 2 - h / 2 + 8)}px`;
      } else {
        f.side.style.left = `${M}px`;
        f.side.style.width = `${T.spanW(12)}px`;
        f.side.style.top = `${FIG_Y + FIG_H + 24}px`;
      }
    });
  }
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  // ----- step 3: the headlines -----
  const cards = [];
  CARDS.forEach((spec) => {
    const m = ctx.assets.captureMeta(spec.id);
    const c = capCard(ctx, spec.id, { width: spec.width, segs: spec.segs, tilt: spec.tilt, ground: g, meta: spec.x ? capMeta(m, spec.x) : undefined });
    if (c) cards.push({ c, spec });
  });
  // layout: two cards side by side under the title, slightly overlapping, centred vertically in 300–944
  const AREA_TOP = 312;
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
    ...figs.flatMap((f, i) => [{ c: f.fig, on: (s) => s === i, at: 0.3 }, { c: f.sideB, on: (s) => s === i, at: 0.75 }]),
    ...cards.map(({ c }, i) => ({ c, on: (s) => s >= 3, at: 0.35 + i * 0.3 })),
    ...(page ? [{ c: page.c, on: (s) => s === 0, at: 1.2 }] : []),
  ];
  const apply = K.stepper(parts);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    if (page) page.focus({ on: step === 0 ? ['runRate'] : [] }, anim, tl, 2.0);
    // steps 0–2 carry their chip and source under the figure; at step 3 the cards' captions do
    foot.show(null, anim, tl, 0);
    return tl;
  }
  return { go };
});
