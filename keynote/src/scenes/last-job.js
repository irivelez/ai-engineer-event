// last-job (calm-a, PAPER quote): the line that closes San Francisco. Huge type, nothing else, long hold.
// Step 0: "Judgement is the last job." at display size, optically centred, who said it under it.
// Step 1: the line rises and steps back to muted; his advice arrives in serif below.
import { gsap } from 'gsap';
import { calmScene, el, esc, unquote, factSource } from './_calm/kit.js';

export default calmScene('last-job', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const W = 1920 - 2 * M;

  const TOP0 = 258; // optically centred two display lines (2 × 216) + attribution
  const TOP1 = 132;
  const group = el('div', '');
  place(group, 0, 0, 1920, 1080);
  group.style.pointerEvents = 'none';
  const line = C.Headline.create({ text: copy.quote || '', role: 'display', ground: g, width: W });
  place(line.el, M, TOP0, W);
  line.el.style.fontWeight = '600';
  group.appendChild(line.el);
  K.owned.push(line);
  const who = el('div', 't-label', group, esc(copy.speaker || ''));
  place(who, M, TOP0 + 2 * 216 + 40, W);
  who.style.color = G.fg;
  const whoB = K.block(who, { rise: 12 });

  const advice = K.add(C.Quote.create({ text: unquote(copy.line), ground: g, width: T.spanW(10), size: 80 }), M + 4, TOP1 + 2 * 216 + 152);

  const foot = K.footer();
  const fs = factSource(ctx, 'dey-judgement');
  const src = { kind: (fs && fs.kind) || 'official', text: copy.note || (fs && fs.text) || '' };

  const apply = K.stepper([
    { c: line, on: () => true },
    { c: whoB, on: () => true, at: 0.6 },
    { c: advice, on: (s) => s >= 1, at: 0.7 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    const y = step >= 1 ? TOP1 - TOP0 : 0;
    if (anim) tl.to(group, { y, duration: 1.1, ease: 'power3.inOut' }, 0);
    else { gsap.killTweensOf(group); gsap.set(group, { y }); }
    tl.add(line.set({ dim: step >= 1 }, { animate: anim }), anim ? 0.3 : 0);
    foot.show(src, anim, tl, 0.9);
    return tl;
  }
  return { go };
});
