// last-job (calm-a, PAPER quote): the line that closes San Francisco. Huge type, nothing else, long hold.
// Step 0: "Judgement is the last job." at display size, optically centred, who said it under it.
// Step 1: the line rises and steps back to muted; his advice arrives in serif below.
// Evidence: with the talk clip (src/data/evidence.json, cut to the advice by src/data/clip-cuts.json), step 1
//         shrinks the line to the top, sets the advice on the left with who said it, and he says it on the right,
//         captioned verbatim, with chip, link and QR.
import { gsap } from 'gsap';
import { calmScene, el, esc, unquote, factSource } from './_calm/kit.js';
import { talkClip } from './_clip-cut.js';

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

  const clip = talkClip(ctx, { width: T.spanW(6), ground: g });
  if (clip) K.add(clip, T.colX(6), 168);
  const advice = clip
    ? K.add(C.Quote.create({ text: unquote(copy.line), ground: g, width: T.spanW(5), size: 64 }), M + 4, 420)
    : K.add(C.Quote.create({ text: unquote(copy.line), ground: g, width: T.spanW(10), size: 80 }), M + 4, TOP1 + 2 * 216 + 152);
  // who said it, under the advice (the group's own label shrinks with the line, so it steps away in step 1)
  let who1 = null;
  if (clip) {
    const w = el('div', 't-label', null, esc(copy.speaker || ''));
    place(w, M, 700, T.spanW(5));
    Object.assign(w.style, { color: G.fg, whiteSpace: 'normal' });
    who1 = K.block(w, { rise: 12 });
  }
  const SHRINK = 0.5; // step 1 with the clip: the line at half size, top left (still ≥ 100 px type)
  const Y1 = clip ? 120 - TOP0 : TOP1 - TOP0;

  const foot = K.footer();
  const fs = factSource(ctx, 'dey-judgement');
  const src = { kind: (fs && fs.kind) || 'official', text: copy.note || (fs && fs.text) || '' };

  const apply = K.stepper([
    { c: line, on: () => true },
    { c: whoB, on: (s) => s === 0 || !clip, at: 0.6 },
    { c: advice, on: (s) => s >= 1, at: 0.7 },
    ...(clip ? [{ c: clip, on: (s) => s >= 1, at: 0.5 }, { c: who1, on: (s) => s >= 1, at: 1.0 }] : []),
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    const y = step >= 1 ? Y1 : 0;
    const scale = step >= 1 && clip ? SHRINK : 1;
    const origin = `${M}px ${TOP0}px`;
    if (anim) tl.to(group, { y, scale, transformOrigin: origin, duration: 1.1, ease: 'power3.inOut' }, 0);
    else { gsap.killTweensOf(group); gsap.set(group, { y, scale, transformOrigin: origin }); }
    tl.add(line.set({ dim: step >= 1 }, { animate: anim }), anim ? 0.3 : 0);
    // with the clip on screen, its own meta carries the chip and the source: one chip per frame
    foot.show(clip && step >= 1 ? null : src, anim, tl, 0.9);
    return tl;
  }
  return {
    go,
    exit() { if (clip) clip.pause(); return K.exit(); }, // freeze the frame, sound off, under the transition
  };
});
