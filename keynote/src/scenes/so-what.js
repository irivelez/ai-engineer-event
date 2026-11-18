// so-what (calm-b, PAPER): Act V opens. The turn from "what we saw" to "what you decide".
// Step 0: the act title on the route line (Act V lit), optically centred, alone on white.
// Step 1: the act title lifts away; the question takes the frame at h1, "2027" in the accent.
//         The act stays named in the kicker at the top, where every data moment keeps it.
import { gsap } from 'gsap';
import { calmScene } from './_calm/kit.js';
import { actLine, actIndex, accentWord, clearAccent } from './_calm-b/kit.js';

export default calmScene('so-what', (ctx, K) => {
  const { T, C, g, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const { index, total } = actIndex(ctx);

  // ----- step 0: act title (meta 40 + track 92 + one h1 line 128 = 260 tall → optical centre) -----
  const act = K.add(C.ActTitle.create({ numeral: copy.act || (ctx.act && ctx.act.n) || '', title: copy.actTitle || (ctx.act && ctx.act.title) || '', index, total, ground: g, width: T.spanW(10) }), M, 368, T.spanW(10));

  // ----- step 1: the question -----
  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const hl = /\b20\d\d\b/.exec(String(copy.line || ''));
  const q = K.add(C.Headline.create({ text: copy.line || '', role: 'h1', ground: g, width: 1480 }), M, 369, 1480);

  const apply = K.stepper([
    { c: act, on: (s) => s === 0 },
    { c: kicker, on: (s) => s >= 1, at: 0.1 },
    { c: q, on: (s) => s >= 1, at: 0.2 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    clearAccent(q.el);
    const tl = apply(step, anim, gsap.timeline(), info);
    if (step >= 1) accentWord(q.el, hl && hl[0]); // after the line split, so "2027?" keeps its spacing
    return tl;
  }
  return { go };
});
