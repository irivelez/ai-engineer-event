// twins (calm-a, VOID calm and tense): the labs say their own models are too capable to ship as-is, so each
// ships twins.
// Step 0: OpenAI's own words about GPT-6 Astra, in serif.
// Step 1: three pairs split like a mirror from a centre line: the public twin bright on the left, the
//         restricted twin on the right behind glass (a framed dark pane, muted type).
import { gsap } from 'gsap';
import { calmScene, el, esc, unquote, factSource } from './_calm/kit.js';

export default calmScene('twins', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192);

  const qw = String(copy.quoteWho || '');
  const cut = qw.indexOf(', ');
  const quote = K.add(C.Quote.create({
    text: unquote(copy.quote), speaker: cut > 0 ? qw.slice(0, cut) : qw, org: cut > 0 ? qw.slice(cut + 2) : '',
    ground: g, width: T.spanW(10), size: 60,
  }), M + 4, 360);

  // ----- the mirror -----
  const MID = 960;
  const ROW0 = 372;
  const PITCH = 188;
  const pairs = (copy.pairs || []).slice(0, 3);
  const mirror = el('div', '');
  place(mirror, 0, 0, 1920, 1080);
  const axis = el('div', '', mirror);
  Object.assign(axis.style, { position: 'absolute', left: `${MID - 1}px`, top: `${ROW0 - 24}px`, width: '2px', height: `${pairs.length * PITCH + 8}px`, background: G.muted, transformOrigin: '50% 0' });
  const split = (s) => {
    const i = String(s).indexOf(' · ');
    return i > 0 ? [s.slice(0, i), s.slice(i + 3)] : ['', String(s)];
  };
  const rowEls = pairs.map(([pub, priv], i) => {
    const y = ROW0 + i * PITCH;
    const [pn, pq] = split(pub);
    const [rn, rq] = split(priv);
    const left = el('div', '', mirror);
    Object.assign(left.style, { position: 'absolute', left: `${M}px`, width: `${MID - 56 - M}px`, top: `${y}px`, textAlign: 'right' });
    left.innerHTML = `<div class="t-lead ca-nowrap" style="color:${G.fg};font-weight:600">${esc(pn)}</div><div class="ca-sans40" style="margin-top:8px;color:${G.muted}">${esc(pq)}</div>`;
    const pane = el('div', '', mirror);
    Object.assign(pane.style, { position: 'absolute', left: `${MID + 32}px`, width: `${1920 - M - MID - 32}px`, top: `${y - 20}px`, height: `${PITCH - 20}px`, borderRadius: '16px', background: G.card, boxShadow: `inset 0 0 0 2px ${G.rule}`, overflow: 'hidden' });
    const inner = el('div', '', pane);
    Object.assign(inner.style, { position: 'absolute', left: '32px', right: '32px', top: '20px' });
    inner.innerHTML = rn
      ? `<div class="t-lead ca-nowrap" style="color:${G.muted};font-weight:600">${esc(rn)}</div><div class="ca-sans40" style="margin-top:8px;color:${G.muted}">${esc(rq)}</div>`
      : `<div class="t-body" style="color:${G.muted};font-weight:520">${esc(rq)}</div>`;
    return { left, pane };
  });
  const mirrorB = K.block(mirror, {
    enter(tl) {
      tl.fromTo(axis, { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: 'expo.out' }, 0);
      rowEls.forEach((r, i) => {
        const t = 0.35 + i * 0.3;
        tl.fromTo(r.left, { autoAlpha: 0, x: 48, clipPath: 'inset(0 0 0 100%)' }, { autoAlpha: 1, x: 0, clipPath: 'inset(0 0 0 0%)', duration: 1.0, ease: 'expo.out' }, t);
        tl.fromTo(r.pane, { autoAlpha: 0, x: -48, clipPath: 'inset(0 100% 0 0 round 16px)' }, { autoAlpha: 1, x: 0, clipPath: 'inset(0 0% 0 0 round 16px)', duration: 1.0, ease: 'expo.out' }, t + 0.08);
      });
    },
    settle() {
      gsap.set(axis, { scaleY: 1 });
      rowEls.forEach((r) => { gsap.set(r.left, { autoAlpha: 1, x: 0, clipPath: 'none' }); gsap.set(r.pane, { autoAlpha: 1, x: 0, clipPath: 'none' }); });
    },
  });

  const foot = K.footer();
  const s0 = factSource(ctx, 'openai-critical-quote');
  const s1 = factSource(ctx, 'twin-releases');

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: quote, on: (s) => s === 0, at: 0.3 },
    { c: mirrorB, on: (s) => s >= 1, at: 0.1 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    foot.show(step === 0 ? s0 : s1, anim, tl, 0.6);
    return tl;
  }
  return { go };
});
