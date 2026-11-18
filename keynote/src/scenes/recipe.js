// recipe (calm-a, PAPER calm): every documented incident shares one recipe; the lesson is operational.
// GTC's typed policy card, made calm: Geist Mono lines typed one by one on a card, joined by plus signs like an
// equation, a block cursor that blinks while the room reads (none in render mode).
// Step 0: the four ingredients.  Step 1: the lesson, with its last clause in the accent.
import { gsap } from 'gsap';
import { calmScene, el, esc, factSource } from './_calm/kit.js';

export default calmScene('recipe', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const parts = (copy.parts || []).slice(0, 6);

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: 1920 - 2 * M }), M, 192);

  // ----- the card -----
  const CW = T.spanW(8);
  const PAD = 48;
  const LH = 64;
  const card = el('div', '');
  place(card, M, 336, CW, PAD * 2 + parts.length * LH);
  Object.assign(card.style, { background: G.card, borderRadius: '24px', boxShadow: `inset 0 0 0 2px ${G.rule}` });
  const lines = parts.map((p, i) => {
    const row = el('div', '', card);
    Object.assign(row.style, { position: 'absolute', left: `${PAD}px`, top: `${PAD + i * LH}px`, height: `${LH}px`, display: 'flex', alignItems: 'center', fontFamily: 'var(--f-mono)', fontSize: '44px', lineHeight: `${LH}px`, fontWeight: '460', letterSpacing: '0', whiteSpace: 'pre', color: G.fg });
    const op = el('span', '', row, i === 0 ? '  ' : '+ ');
    op.style.color = G.accent;
    op.style.fontWeight = '600';
    const txt = el('span', '', row, '');
    const cur = el('span', '', row, '');
    Object.assign(cur.style, { display: 'inline-block', width: '0.6em', height: '1.05em', marginLeft: '4px', background: G.accent, verticalAlign: 'middle', visibility: 'hidden' });
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
  const les = K.add(C.Headline.create({ text: lesText, role: 'h2', ground: g, width: 1920 - 2 * M, highlight: hl }), M, 336 + PAD * 2 + parts.length * LH + 56);
  les.el.style.whiteSpace = 'pre-line';

  const foot = K.footer();
  const s0 = factSource(ctx, 'incident-recipe');

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: cardB, on: () => true, at: 0.25 },
    { c: les, on: (s) => s >= 1, at: 0.1 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    foot.show(s0, anim, tl, 0.6);
    return tl;
  }
  return { go, dispose() { stopBlink(); } };
});
