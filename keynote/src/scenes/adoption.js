// adoption (calm-b, PAPER data): inside companies. Most US businesses now pay for AI, usage is exploding,
// and usage is not results.
// Step 0: 56.8 % (display, odometer) with its label and the one-year delta. Chip + source in the footer band.
// Step 1: +29 % joins it on the right: token volume in four weeks, while prices fell. Same source (Ramp).
// Step 2: the numbers step away. "The backlash against “tokenmaxxing”: usage is not results." with
//         "tokenmaxxing" struck through in the accent; on the right, the press that says so: CNBC on Amazon's
//         memo and the Latin American proof points (Bloomberg Línea, El Economista), each with a PRESS chip.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { actLine, ensureCSS, sourceOf, capCard, capMeta, srcHTML } from './_calm-b/kit.js';

// clippings for step 2 (director's curation): crops keep masthead + headline, skip ad slots and tickers
const CLIPS = [
  { id: 'cnbc-amazon-tokenmaxxing', segs: [[0, 146], [534, 895]] },
  { id: 'bloomberglinea-latam-ai-impact', segs: [[0, 190], [385, 640]] },
  { id: 'eleconomista-almacenes-ia-32', segs: [[64, 196], [262, 470]] },
];

const STRIKE_CSS = `
.cb-strike .itaf-hl { color: var(--g-fg); background: linear-gradient(var(--g-accent), var(--g-accent)) no-repeat 0 56% / 0% 0.09em; }
`;

export default calmScene('adoption', (ctx, K) => {
  ensureCSS();
  if (!document.getElementById('calm-b-strike-css')) { const s = document.createElement('style'); s.id = 'calm-b-strike-css'; s.textContent = STRIKE_CSS; document.head.appendChild(s); }
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const s1 = copy.s1 || {};
  const s2 = copy.s2 || {};
  const facts = ctx.beat.facts || [];

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(8) }), M, 192, T.spanW(8));

  // ----- steps 0–1: two figures -----
  const FIG_Y = 344;
  const n1 = K.add(C.BigNumber.create({ display: s1.value || '', label: s1.label || '', size: 'display', ground: g }), M, FIG_Y, T.spanW(6));
  const n2 = K.add(C.BigNumber.create({ display: s2.value || '', label: s2.label || '', size: 'display', ground: g, tone: 'accent' }), T.colX(6), FIG_Y, T.spanW(6));
  [n1, n2].forEach((n) => { const lb = n.el.querySelector('.bn-label'); if (lb) lb.style.maxWidth = `${T.spanW(5)}px`; });
  const delta = el('div', 'cb-body48 tnum', null, esc(s1.delta || ''));
  delta.style.color = G.muted;
  place(delta, M, 0, T.spanW(5));
  const deltaB = K.block(delta, { rise: 12 });
  function placeDelta() {
    const lb = n1.el.querySelector('.bn-label');
    const top = FIG_Y + (lb ? lb.offsetTop + lb.offsetHeight : 380) + 16;
    delta.style.top = `${top}px`;
  }
  placeDelta();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeDelta);

  // ----- step 2: the backlash -----
  const back = K.add(C.Headline.create({ text: copy.s3 || '', role: 'h2', ground: g, width: T.spanW(6), highlight: 'tokenmaxxing', className: 'cb-strike' }), M, 344, T.spanW(6));
  const strikeEls = () => [...back.el.querySelectorAll('.itaf-hl')];

  const CX = T.colX(6) + 48;
  const CW = 1920 - M - CX;
  const clips = [];
  CLIPS.forEach((spec) => {
    const c = capCard(ctx, spec.id, { width: CW, segs: spec.segs, ground: g, caption: false });
    if (!c) return;
    const wrap = el('div', '');
    wrap.appendChild(c.el);
    const m = c.meta || {};
    const cap = el('div', 'cb-src', wrap, srcHTML(C, { kind: 'press', text: [m.outlet, capMeta(m).date].filter(Boolean).join(' · ') }));
    cap.classList.add(`ground-${g}`);
    cap.style.marginTop = '16px';
    clips.push({ c, wrap, h: (c.height || 160) + 16 + 44 });
  });
  const GAP = 28;
  const totalH = clips.reduce((s, x) => s + x.h, 0) + GAP * Math.max(0, clips.length - 1);
  let y = Math.max(300, Math.round(300 + (944 - 300 - totalH) / 2));
  const clipBlocks = clips.map((x) => {
    place(x.wrap, CX, y, CW);
    y += x.h + GAP;
    return K.block(x.wrap, {
      enter(tl) {
        x.c.set({ visible: true }, { animate: false });
        tl.fromTo(x.wrap, { autoAlpha: 0, x: 48 }, { autoAlpha: 1, x: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0);
      },
      settle() { x.c.set({ visible: true }, { animate: false }); },
    });
  });

  const foot = K.footer();
  const ramp = sourceOf(ctx, facts[0]);
  const rampDate = ramp && ramp.text.split(' · ').slice(-1)[0];
  const rampSrc = { kind: ramp ? ramp.kind : 'independent', text: [copy.tag, rampDate].filter(Boolean).join(' · ') };

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: n1, on: (s) => s <= 1, at: 0.3 },
    { c: deltaB, on: (s) => s <= 1, at: 0.9 },
    { c: n2, on: (s) => s === 1, at: 0.25 },
    { c: back, on: (s) => s >= 2, at: 0.2 },
    ...clipBlocks.map((b, i) => ({ c: b, on: (s) => s >= 2, at: 1.4 + i * 0.25 })),
  ]);

  let struck = null;
  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    const want = step >= 2;
    if (!anim) { gsap.set(strikeEls(), { backgroundSize: want ? '100% 0.09em' : '0% 0.09em' }); }
    else if (want && struck !== true) {
      tl.add(() => { gsap.fromTo(strikeEls(), { backgroundSize: '0% 0.09em' }, { backgroundSize: '100% 0.09em', duration: 0.7, ease: 'power3.inOut' }); }, 1.05);
    }
    struck = want;
    foot.show(step <= 1 ? rampSrc : null, anim, tl, 0.8);
    return tl;
  }
  return { go };
});
