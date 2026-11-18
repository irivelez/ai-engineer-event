// org (calm-a, PAPER): companies reorganize around the agent. Amp: 21 people, more than $100M ARR.
// Step 0: kicker + the title in large type.
// Step 1: three facts land one by one (figures in ink, words in muted, same size: a DevDay list).
// Step 2: the facts step away; his line in serif with a small stage still of Quinn Slack (crop of the camera inset).
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

  // ----- step 2: his line + a small stage still (camera inset crop) -----
  const [org, speaker] = String(copy.ampWho || '').split(' · ');
  const quote = K.add(C.Quote.create({ text: unquote(copy.quote), speaker: speaker || '', org: org || '', ground: g, width: T.spanW(8), size: 72 }), M + 4, 512);
  const stillSrc = ctx.assets.sf('quinn-slack-title');
  let still = null;
  if (stillSrc) {
    // camera inset in the 1920×1080 broadcast frame: x 18–420, y 607–1000
    const IN = { x: 18, y: 607, w: 402, h: 393 };
    const CW = T.spanW(3);
    const k = CW / IN.w;
    const CH = Math.round(IN.h * k);
    const card = el('div', '');
    place(card, T.colX(9), 512, CW, CH);
    Object.assign(card.style, { overflow: 'hidden', borderRadius: '16px', background: '#0D1218', boxShadow: '0 0 0 2px rgba(11,15,20,0.07), 0 12px 24px -4px rgba(11,15,20,0.10), 0 40px 80px -24px rgba(11,15,20,0.22)' });
    const img = el('img', '', card);
    img.src = stillSrc;
    img.alt = ((ctx.assets.sfMeta('quinn-slack-title') || {}).description) || speaker || '';
    Object.assign(img.style, { position: 'absolute', left: `${-IN.x * k}px`, top: `${-IN.y * k}px`, width: `${1920 * k}px`, height: `${1080 * k}px`, maxWidth: 'none' });
    still = K.block(card, { rise: 32 });
  }

  const foot = K.footer();
  const fs = factSource(ctx, 'amp-org');
  const src = { kind: (fs && fs.kind) || 'labReported', text: copy.ampWho || (fs && fs.text) || '' };

  const parts = [
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    ...rows.map((r, i) => ({ c: r, on: (s) => s === 1, at: (s, info) => (info.direction < 0 ? 0 : 0.15 + i * 0.45) })),
    { c: quote, on: (s) => s >= 2, at: 0.1 },
  ];
  if (still) parts.push({ c: still, on: (s) => s >= 2, at: 0.5 });
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
