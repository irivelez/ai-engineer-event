// rulers-break (calm-a, PAPER data): the instruments that measure AI are breaking.
// Steps 0–2: a ledger of three readings lands one per step (number left, what it means right); the newest is
// the only one in ink, earlier ones step back to muted. Step 0's number sits beside a gauge pinned at its stop.
// Step 3: the ledger makes room for the UK AI Security Institute's line, in serif. With AISI's Figure 1 in the
//         build (src/data/evidence.json), the line moves to the left half and the real chart (every model's bar
//         above zero, 475 runs each) stands beside it with its own chip, caveat and QR.
import { gsap } from 'gsap';
import { calmScene, el, svgEl, esc, unquote, factSource } from './_calm/kit.js';
import { evItem, evPage } from './_ev-page.js';

export default calmScene('rulers-break', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const items = (copy.items || []).slice(0, 3);
  const nb = (x) => String(x || '').replace(/ /g, ' ');

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192);

  const Y0 = 408;
  const PITCH = 188; // labels run to three lines (40 px)
  const LX = T.colX(6);
  const rows = items.map((it, i) => {
    const y = Y0 + i * PITCH;
    const box = el('div', '');
    place(box, 0, 0, 1920, 1080);
    const rule = el('div', '', box);
    Object.assign(rule.style, { position: 'absolute', left: `${M}px`, top: `${y}px`, width: `${1920 - 2 * M}px`, height: '2px', background: G.rule, transformOrigin: '0 50%' });
    const num = C.BigNumber.create({ display: nb(it.value), size: 'h1', ground: g });
    const wrap = el('div', '', box);
    Object.assign(wrap.style, { position: 'absolute', left: `${M}px`, top: `${y + 22}px` });
    wrap.appendChild(num.el);
    K.owned.push(num);
    const lab = el('div', 'ca-sans40 pretty', box, esc(it.label || ''));
    Object.assign(lab.style, { position: 'absolute', left: `${LX}px`, top: `${y + 22}px`, width: `${T.spanW(6)}px`, color: G.fg });
    const b = K.block(box, {
      enter(tl) {
        tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0);
        tl.add(num.set({ visible: true }, { animate: true }), 0.1);
        tl.fromTo(lab, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0.3);
      },
      settle() { gsap.set(rule, { scaleX: 1 }); num.set({ visible: true }, { animate: false }); gsap.set(lab, { autoAlpha: 1, y: 0 }); },
      hide() { num.set({ visible: false }, { animate: false }); },
    });
    b.num = num;
    b.lab = lab;
    return b;
  });

  // a gauge pinned at its stop, beside the first reading (saturation)
  const gauge = el('div', '');
  place(gauge, LX - 32 - 236, Y0 + 18, 236, 142); // between the number and the label column
  const gs = svgEl('svg', { width: 236, height: 142, viewBox: '0 0 200 120' }, gauge);
  svgEl('path', { d: 'M20,104 A80,80 0 0 1 180,104', fill: 'none', stroke: G.rule, 'stroke-width': 10, 'stroke-linecap': 'round' }, gs);
  const arc = svgEl('path', { d: 'M20,104 A80,80 0 0 1 180,104', fill: 'none', stroke: G.limit, 'stroke-width': 10, 'stroke-linecap': 'round' }, gs);
  const needle = svgEl('line', { x1: 100, y1: 104, x2: 100, y2: 36, stroke: G.fg, 'stroke-width': 6, 'stroke-linecap': 'round' }, gs);
  svgEl('circle', { cx: 100, cy: 104, r: 10, fill: G.fg }, gs);
  const STOP = 86; // degrees right of vertical: pinned at the end stop
  const gaugeB = K.block(gauge, {
    enter(tl) {
      const L = arc.getTotalLength() || 252;
      tl.fromTo(arc, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.2, ease: 'power3.inOut' }, 0.1);
      tl.fromTo(needle, { rotation: -86, svgOrigin: '100 104' }, { rotation: STOP, svgOrigin: '100 104', duration: 1.2, ease: 'power3.inOut' }, 0.1);
      tl.to(needle, { rotation: STOP - 3, svgOrigin: '100 104', duration: 0.12, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 1.32);
    },
    settle() { gsap.set(arc, { strokeDasharray: 'none', strokeDashoffset: 0 }); gsap.set(needle, { rotation: STOP, svgOrigin: '100 104' }); },
  });

  // step 3 evidence: AISI's Figure 1 (chart + caption)
  const ev = evItem(ctx, 'rulers-break-aisi-cheat');
  const page = ev ? evPage(ctx, ev, { width: T.spanW(6), ground: g, win: { y0: 0.06, y1: 0.78 } }) : null;
  if (page) K.add(page.c, T.colX(6), 420); // under the two-line title
  const quote = page
    ? K.add(C.Quote.create({ text: unquote(copy.quote), speaker: copy.quoteWho || '', ground: g, width: T.spanW(5), size: 64 }), M + 4, 452)
    : K.add(C.Quote.create({ text: unquote(copy.quote), speaker: copy.quoteWho || '', ground: g, width: T.spanW(10), size: 80 }), M + 4, 452);

  const foot = K.footer();
  const srcs = ['arc1-saturated', 'metr-stopped', 'eval-awareness-36', 'aisi-cheat'].map((id) => factSource(ctx, id));

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    ...rows.map((r, i) => ({ c: r, on: (s) => s >= i && s < 3, at: 0.1 })),
    { c: gaugeB, on: (s) => s < 3, at: 0.3 },
    { c: quote, on: (s) => s >= 3, at: 0.15 },
    ...(page ? [{ c: page.c, on: (s) => s >= 3, at: 0.6 }] : []),
  ]);

  function tone(step, anim, tl) {
    rows.forEach((r, i) => {
      const fig = r.num.el.querySelector('.bn-figure');
      const c = i === step ? G.fg : G.muted;
      const targets = [fig, r.lab].filter(Boolean);
      if (anim) tl.to(targets, { color: c, duration: 0.4, ease: 'power3.out' }, 0);
      else gsap.set(targets, { color: c });
    });
  }

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    if (step < 3) tone(step, anim, tl);
    // with AISI's chart on screen its own meta carries the chip and the source: one chip per frame
    foot.show(page && step >= 3 ? null : srcs[Math.min(step, 3)], anim, tl, 0.6);
    return tl;
  }
  return { go };
});
