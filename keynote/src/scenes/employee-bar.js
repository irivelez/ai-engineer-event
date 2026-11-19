// employee-bar (calm-a, PAPER): AI knows a lot; it still lacks judgment (Epoch AI, 17 Nov 2026), in plain words.
// Step 0: the finding (title + the study in one paragraph).
// Step 1: an example: the "new" chess game, in place of the study paragraph.
// Step 2: three signs of missing judgment (a label + three plain lines).
// Evidence: Epoch's own key findings (src/data/evidence.json) stand on the right half throughout, boxed per step:
// step 0 boxes "No model met the standard we expect of Epoch employees on any task"; step 2 scrolls the page to the
// two findings behind the three signs (reuse existing ideas, rely on first attempts; prefer their own outputs).
// The page's meta carries the chip, source and QR, so the footer stays empty while it is on screen.
import { gsap } from 'gsap';
import { calmScene, el, esc, tagSource, factSource } from './_calm/kit.js';
import { evItem, evPage } from './_ev-page.js';

export default calmScene('employee-bar', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const LW = T.spanW(6) - 16; // the left half, beside the page at colX(6)
  const BODY_Y = 440; // under a two-line title; layout() moves the body under the title's real height

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(6) }), M, 192);

  const sub = el('div', 't-body balance');
  place(sub, M, BODY_Y, LW);
  sub.style.color = G.muted;
  sub.innerHTML = esc(copy.sub || '');
  const subB = K.block(sub, { rise: 16 });

  const ex = el('div', 't-body pretty');
  place(ex, M, BODY_Y, LW);
  ex.style.color = G.fg;
  ex.innerHTML = esc(copy.example || '');
  const exB = K.block(ex, { rise: 16 });

  // the heading (failuresTitle), then three plain lines
  const fails = (copy.failures || []).slice(0, 3);
  const fl = el('div', '');
  place(fl, M, BODY_Y, LW);
  fl.innerHTML = (copy.failuresTitle ? `<div class="t-body pretty" style="color:${G.fg};font-weight:600;margin-bottom:28px">${esc(copy.failuresTitle)}</div>` : '') +
    fails.map((f) => `<div class="ca-sans40 pretty" style="color:${G.fg};margin-bottom:28px">${esc(f)}</div>`).join('');
  const failItems = [...fl.children];
  const failB = K.block(fl, {
    enter(tl) { tl.fromTo(failItems, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease, stagger: 0.35 }, 0); },
    settle() { gsap.set(failItems, { autoAlpha: 1, y: 0 }); },
  });

  function layout() {
    const h = title.el.offsetHeight || 192;
    const y = Math.max(BODY_Y, Math.round(192 + h + 48));
    [sub, ex, fl].forEach((e) => { e.style.top = `${y}px`; });
  }
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  // ----- the evidence: Epoch's key findings, cropped to the bullets (fractions of the image) -----
  const ev = evItem(ctx, 'employee-bar-epoch-key-findings');
  const WIN1 = 0.03; // "Key findings" + the first two bullets
  const WIN2 = 0.44; // bullets 3–5
  const page = ev ? evPage(ctx, ev, {
    width: T.spanW(6), ground: g, win: { x0: 0.025, x1: 0.975, y0: WIN1, y1: WIN1 + 0.53 },
    boxes: {
      noModel: { x: 0.035, y: 0.108, w: 0.93, h: 0.148 }, // No model met the standard we expect of Epoch employees on any task…
      reuse: { x: 0.035, y: 0.462, w: 0.93, h: 0.148 }, // They reuse existing ideas, rely on first attempts…
      prefer: { x: 0.035, y: 0.817, w: 0.93, h: 0.15 }, // Models prefer their own outputs over higher-quality human outputs
    },
  }) : null;
  if (page) K.add(page.c, T.colX(6), 200);

  const foot = K.footer();
  const tagS = tagSource(copy.tag);
  const src = tagS.text ? tagS : factSource(ctx, 'epoch-real-work');

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: subB, on: (s) => s === 0, at: 0.4 },
    { c: exB, on: (s) => s === 1, at: 0.1 },
    { c: failB, on: (s) => s >= 2, at: 0.1 },
    ...(page ? [{ c: page.c, on: () => true, at: (s, info) => (info && info.entering ? 1.1 : 0.1) }] : []),
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    if (page) page.focus(step >= 2 ? { y0: WIN2, on: ['reuse', 'prefer'] } : { y0: WIN1, on: step === 0 ? ['noModel'] : [] }, anim, tl, info.entering ? 2.0 : 0.3);
    // the page's own meta carries the chip and the source: one chip per frame
    foot.show(page ? null : src, anim, tl, 0.9);
    return tl;
  }
  return { go };
});
