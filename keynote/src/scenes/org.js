// org (calm-a, PAPER): companies reorganize around the agent. Amp: 21 people, more than $100M ARR.
// Step 0: kicker + the title in large type.
// Step 1: three facts land one by one (figures in ink, words in muted, same size: a DevDay list).
// Step 2: the title and facts step away; his line in serif beside the evidence: his own slide (Amp flat at 21
//         people while "the other guys" grow), shown large and uncropped.
import { gsap } from 'gsap';
import { calmScene, el, esc, unquote, factSource } from './_calm/kit.js';

// "More than $100M ARR" → ['More than ', '$100M', ' ARR'] (the figure is the run that holds a digit, "a to b" kept whole).
function splitFigure(s) {
  const m = /^(.*?)((?:[$~<>≈]?\S*\d\S*)(?:\s+to\s+\S*\d\S*)?)(.*)$/.exec(String(s || ''));
  return m ? [m[1], m[2], m[3]] : ['', String(s || ''), ''];
}

export default calmScene('org', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;

  const kicker = K.add(C.Kicker.create({ text: copy.kicker || '', ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h1', ground: g, width: T.spanW(9) }), M, 184);

  // ----- the three facts -----
  const facts = (copy.amp || []).slice(0, 3);
  const TOP = 520;
  const ROW = 120;
  const rows = facts.map((f, i) => {
    const [pre, fig, post] = splitFigure(f);
    const row = el('div', '');
    place(row, M, TOP + i * ROW, T.spanW(10), ROW);
    const rule = el('div', '', row);
    Object.assign(rule.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '2px', background: G.rule, transformOrigin: '0 50%' });
    const mask = el('div', 'ca-mask', row);
    Object.assign(mask.style, { position: 'absolute', left: '0', top: '14px', right: '0' });
    const txt = el('div', 't-h2 tnum ca-nowrap', mask,
      `<span style="color:${G.muted}">${esc(pre)}</span><span style="color:${G.fg}">${esc(fig)}</span><span style="color:${G.muted}">${esc(post)}</span>`);
    return K.block(row, {
      enter(tl) {
        tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0);
        tl.fromTo(txt, { yPercent: 120 }, { yPercent: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0.08);
      },
      settle() { gsap.set(rule, { scaleX: 1 }); gsap.set(txt, { yPercent: 0 }); },
    });
  });

  // ----- step 2: his line + the evidence, his own slide, large and uncropped -----
  const [org, speaker] = String(copy.ampWho || '').split(' · ');
  const Q_Y = 268;
  const quote = K.add(C.Quote.create({ text: unquote(copy.quote), speaker: speaker || '', org: org || '', ground: g, width: T.spanW(5), size: 64 }), M + 4, Q_Y);
  const stillSrc = ctx.assets.sf('quinn-slack-21-cofounders');
  let still = null;
  if (stillSrc) {
    const meta = ctx.assets.sfMeta('quinn-slack-21-cofounders') || {};
    still = K.add(C.CaptureCard.create({ src: stillSrc, alt: meta.description || copy.title || '', variant: 'paper', ground: g, width: T.spanW(7) }), T.colX(5), Q_Y);
  }

  const foot = K.footer();
  const fs = factSource(ctx, 'amp-org');
  const src = { kind: (fs && fs.kind) || 'labReported', text: copy.ampWho || (fs && fs.text) || '' };

  const parts = [
    { c: kicker, on: () => true },
    { c: title, on: (s) => s < 2, at: 0.08 },
    ...rows.map((r, i) => ({ c: r, on: (s) => s === 1, at: (s, info) => (info.direction < 0 ? 0 : 0.15 + i * 0.45) })),
    { c: quote, on: (s) => s >= 2, at: 0.1 },
  ];
  if (still) parts.push({ c: still, on: (s) => s >= 2, at: 0.35 });
  const apply = K.stepper(parts);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    foot.show(step >= 1 ? src : null, anim, tl, 1.1);
    return tl;
  }
  return { go };
});
