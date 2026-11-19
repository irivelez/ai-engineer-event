// economics (calm-a, PAPER data): smarter isn't always cheaper, in plain words (Epoch AI, 17 Nov 2026, one task).
// A three-column comparison, who | quality | cost, one row per step group (no hour bars: hours read as cost, and
// Epoch published no dollar figures):
// Step 0: title + sub + the contractor row (the reference).
// Step 1: the two Claude rows; a model's cost reads in the positive accent when `good`, in the warning accent when
//         not. Evidence: Epoch's own paragraph (src/data/evidence.json) lands under the table, the two model
//         sentences boxed, with its chip, source and QR beside it.
// Step 2: the takeaway takes the evidence's place.
// The footer keeps the copy's tag (chip + "one task; Epoch published no dollar figures") on every step.
import { gsap } from 'gsap';
import { calmScene, el, esc, tagSource } from './_calm/kit.js';
import { evItem, evPage } from './_ev-page.js';

export default calmScene('economics', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const TW = 1920 - 2 * M;

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: TW }), M, 192);
  const sub = el('div', 'ca-sans40 balance');
  place(sub, M, 300, TW);
  sub.style.color = G.muted;
  sub.innerHTML = esc(copy.sub || '');
  const subB = K.block(sub, { rise: 12 });

  // ----- the table: who | quality | cost -----
  const COLS = [{ x: 0, w: 440 }, { x: 472, w: 520 }, { x: 1024, w: TW - 1024 }];
  const base = copy.base || {};
  const A = copy.a || {};
  const B = copy.b || {};
  const tone = (r) => (r.good === true ? G.verified : r.good === false ? G.limit : G.fg);
  const rows = [
    { who: base.who, quality: base.quality, cost: base.cost },
    { who: A.model, quality: A.quality, cost: A.cost, good: A.good },
    { who: B.model, quality: B.quality, cost: B.cost, good: B.good },
  ];
  const Y0 = 396;
  const PITCH = 96;
  const els = rows.map((r, i) => {
    const y = Y0 + i * PITCH;
    const row = el('div', '');
    place(row, M, y, TW, PITCH);
    const rule = el('div', '', row);
    Object.assign(rule.style, { position: 'absolute', left: '0', top: '0', width: `${TW}px`, height: '2px', background: G.rule, transformOrigin: '0 50%' });
    const cells = [r.who, r.quality, r.cost].map((t, k) => {
      const c = el('div', 'ca-sans40 ca-nowrap', row, esc(t || ''));
      Object.assign(c.style, {
        position: 'absolute', left: `${COLS[k].x}px`, top: '22px', width: `${COLS[k].w}px`, overflow: 'visible',
        color: k === 2 ? tone(r) : k === 1 ? G.muted : G.fg, fontWeight: k === 0 || (k === 2 && r.good !== undefined) ? '600' : '460',
      });
      return c;
    });
    return K.block(row, {
      enter(tl) {
        tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0);
        tl.fromTo(cells, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'expo.out', stagger: 0.25 }, 0.1);
      },
      settle() { gsap.set(rule, { scaleX: 1 }); gsap.set(cells, { autoAlpha: 1, x: 0 }); },
    });
  });

  // ----- the evidence (step 1): Epoch's own paragraph, under the table -----
  const DOC_Y = Y0 + 3 * PITCH + 24;
  const DOC_W = 1000;
  const ev = evItem(ctx, 'economics-epoch-contractor');
  const page = ev ? evPage(ctx, ev, {
    width: DOC_W, ground: g, side: TW - DOC_W - 40, qrSize: 168,
    win: { x0: 0.02, x1: 0.98, y0: 0.645, y1: 0.96 },
    boxes: { models: { x: 0.025, y: 0.732, w: 0.955, h: 0.212 } }, // "Opus 5.5 completed the same work in just under 3 hours… Fable 5.2 … at a higher cost…"
  }) : null;
  if (page) K.add(page.c, M, DOC_Y);

  // ----- the takeaway (step 2) -----
  const take = K.add(C.Headline.create({ text: copy.takeaway || '', role: 'h2', ground: g, width: TW }), M, DOC_Y + 24);

  const foot = K.footer();
  const src = tagSource(copy.tag);

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: subB, on: () => true, at: 0.3 },
    { c: els[0], on: () => true, at: 0.5 },
    { c: els[1], on: (s) => s >= 1, at: 0.1 },
    { c: els[2], on: (s) => s >= 1, at: 0.7 },
    ...(page ? [{ c: page.c, on: (s) => s === 1, at: 1.7 }] : []),
    { c: take, on: (s) => s >= 2, at: 0.2 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    if (page) page.focus({ on: step === 1 ? ['models'] : [] }, anim, tl, 2.5);
    foot.show(src, anim, tl, 0.9);
    return tl;
  }
  return { go };
});
