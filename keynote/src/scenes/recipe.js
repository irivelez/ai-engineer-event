// recipe (calm-a, PAPER calm): every documented incident shares one recipe; the lesson is operational.
// GTC's typed policy card, made calm: Geist Mono lines typed one by one on a card, joined by plus signs like an
// equation, a block cursor that blinks while the room reads (none in render mode).
// Step 0: the four ingredients.  Step 1: the lesson, with its last clause in the accent.
// Evidence: once the card has typed, Epoch's incident report (src/data/evidence.json) arrives under it: the
// paragraph where the "NEVER stop, NEVER give up" wording appears, boxed, with its chip, caveat and QR beside it.
// The lesson takes that place on step 1.
import { gsap } from 'gsap';
import { calmScene, el, esc, factSource } from './_calm/kit.js';
import { evItem, evPage } from './_ev-page.js';

export default calmScene('recipe', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const parts = (copy.parts || []).slice(0, 6);

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: 1920 - 2 * M }), M, 192);

  // ----- the card: GTC's typed policy card, dark on paper (void card colours, light mono type) -----
  const D = T.grounds.void;
  const CW = T.spanW(9);
  const PAD = 48;
  const LH = 72;
  const ev = evItem(ctx, 'recipe-epoch-never-give-up');
  const CARD_Y = ev ? 300 : 320; // with the evidence strip under the card, the card sits 20 px higher
  const card = el('div', '');
  place(card, M, CARD_Y, CW, PAD * 2 + parts.length * LH);
  Object.assign(card.style, { background: D.card, borderRadius: '24px', boxShadow: `0 0 0 2px ${D.rule}, 0 24px 64px -24px rgba(11,15,20,0.45)` });
  const lines = parts.map((p, i) => {
    const row = el('div', '', card);
    Object.assign(row.style, { position: 'absolute', left: `${PAD}px`, top: `${PAD + i * LH}px`, height: `${LH}px`, display: 'flex', alignItems: 'center', fontFamily: 'var(--f-mono)', fontSize: '48px', lineHeight: `${LH}px`, fontWeight: '460', letterSpacing: '-0.01em', whiteSpace: 'pre', color: D.fg });
    const op = el('span', '', row, i === 0 ? '  ' : '+ ');
    op.style.color = D.accent;
    op.style.fontWeight = '600';
    const txt = el('span', '', row, '');
    const cur = el('span', '', row, '');
    Object.assign(cur.style, { display: 'inline-block', width: '0.6em', height: '1.05em', marginLeft: '6px', background: D.accent, verticalAlign: 'middle', visibility: 'hidden' });
    return { row, op, txt, cur, text: String(p) };
  });
  let blink = null;
  const stopBlink = () => { if (blink) { blink.kill(); blink = null; } };
  const cardB = K.block(card, {
    enter(tl) {
      stopBlink();
      lines.forEach((l) => { l.txt.textContent = ''; gsap.set(l.op, { autoAlpha: 0 }); l.cur.style.visibility = 'hidden'; });
      tl.fromTo(card, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0);
      let t = 0.6;
      lines.forEach((l, i) => {
        const prox = { n: 0 };
        const dur = Math.max(0.35, l.text.length * 0.03);
        tl.set(l.op, { autoAlpha: 1 }, t);
        tl.call(() => { lines.forEach((m) => { m.cur.style.visibility = 'hidden'; }); l.cur.style.visibility = 'visible'; }, null, t);
        tl.to(prox, { n: l.text.length, duration: dur, ease: 'none', onUpdate: () => { l.txt.textContent = l.text.slice(0, Math.round(prox.n)); } }, t);
        t += dur + (i < lines.length - 1 ? 0.35 : 0);
      });
      tl.call(() => {
        stopBlink();
        const last = lines[lines.length - 1];
        if (last) blink = gsap.to(last.cur, { autoAlpha: 0, duration: 0.5, ease: 'steps(1)', repeat: -1, yoyo: true });
      }, null, t + 0.05);
    },
    settle() {
      stopBlink();
      gsap.set(card, { autoAlpha: 1, y: 0 });
      lines.forEach((l, i) => {
        l.txt.textContent = l.text;
        gsap.set(l.op, { autoAlpha: 1 });
        gsap.set(l.cur, { autoAlpha: 1 });
        l.cur.style.visibility = !R && i === lines.length - 1 ? 'visible' : 'hidden';
      });
    },
    hide() { stopBlink(); },
  });

  // ----- the lesson -----
  const lesson = String(copy.lesson || '');
  const sentences = lesson.split(/(?<=\.)\s+/);
  const hl = sentences.length > 1 ? sentences[sentences.length - 1] : undefined;
  // the last sentence on its own line ("Sandbox them. Monitor them. / Let them give up.")
  const lesText = hl ? `${lesson.slice(0, lesson.lastIndexOf(hl)).trim()}\n${hl}` : lesson;
  const les = K.add(C.Headline.create({ text: lesText, role: 'h2', ground: g, width: 1920 - 2 * M, highlight: hl }), M, CARD_Y + PAD * 2 + parts.length * LH + 40);
  les.el.style.whiteSpace = 'pre-line';

  // ----- the evidence strip (step 0): lines 4–7 of the paragraph, the NEVER sentence boxed -----
  const DOC_W = 944;
  const page = ev ? evPage(ctx, ev, {
    width: DOC_W, ground: g, side: 1920 - 2 * M - DOC_W - 40, qrSize: 160,
    win: { y0: 0.4, y1: 0.83 },
    boxes: { never: { x: 0.012, y: 0.495, w: 0.976, h: 0.315 } }, // "…language like “NEVER stop, NEVER give up, and NEVER conclude…”"
  }) : null;
  if (page) K.add(page.c, M, CARD_Y + PAD * 2 + parts.length * LH + 28);
  // after the card has typed its last line (≈ 4.3 s at the typing speed above)
  const typed = 0.25 + 0.6 + lines.reduce((t, l, i) => t + Math.max(0.35, l.text.length * 0.03) + (i < lines.length - 1 ? 0.35 : 0), 0);

  const foot = K.footer();
  const s0 = factSource(ctx, 'incident-recipe');

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: cardB, on: () => true, at: 0.25 },
    { c: les, on: (s) => s >= 1, at: 0.1 },
    ...(page ? [{ c: page.c, on: (s) => s === 0, at: (s, info) => (info && info.entering ? typed + 0.2 : 0.2) }] : []),
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    if (page) page.focus({ on: step === 0 ? ['never'] : [] }, anim, tl, info.entering ? typed + 1.0 : 0.8);
    // the strip's own meta carries the chip and the source on step 0: one chip per frame
    foot.show(page && step === 0 ? null : s0, anim, tl, 0.6);
    return tl;
  }
  return { go, dispose() { stopBlink(); } };
});
