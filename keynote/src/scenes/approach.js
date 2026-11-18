// approach (calm-b, PAPER): redesign the work, don't bolt AI onto it.
// Step 0: kicker, title and the empty two-column frame (axes first): BOLTED ON | REDESIGNED, four 2 px rules.
// Step 1: row by row, the bolted-on way rises in grey on the left, then the redesigned way slides in to the
//         right in ink behind an accent arrow. The accent marks one thing: the redesigned column.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { actLine, ensureCSS } from './_calm-b/kit.js';

export default calmScene('approach', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const LX = M;
  const LW = T.spanW(5);
  const RX = T.colX(6);
  const RW = 1920 - M - RX;
  const AX = LX + LW + (RX - LX - LW) / 2 - 24; // arrow centred in the gutter column

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(12) }), M, 192, T.spanW(12));

  // ----- column headers + rules (the frame) -----
  const [hBefore, hAfter] = copy.headers || ['', ''];
  const HEAD_Y = 384;
  const frame = el('div', '');
  place(frame, 0, 0, 1920, 1080);
  const hb = el('div', 't-label', frame, esc(hBefore));
  Object.assign(hb.style, { position: 'absolute', left: `${LX}px`, top: `${HEAD_Y}px`, color: G.muted });
  const ha = el('div', 't-label', frame, esc(hAfter));
  Object.assign(ha.style, { position: 'absolute', left: `${RX}px`, top: `${HEAD_Y}px`, color: G.accent });

  // ----- rows: measured once the font is ready, so the rule positions follow the real line count -----
  const ROW_TOP = HEAD_Y + 64;
  const rows = (copy.rows || []).slice(0, 4).map(([before, after]) => {
    const rule = el('div', '', frame);
    Object.assign(rule.style, { position: 'absolute', left: `${M}px`, width: `${1920 - 2 * M}px`, height: '2px', background: G.rule, transformOrigin: '0 50%' });
    const row = el('div', '');
    place(row, 0, 0, 1920);
    const b = el('div', 'cb-body40', row, esc(before));
    Object.assign(b.style, { position: 'absolute', left: `${LX}px`, top: '0px', width: `${LW}px`, color: G.muted });
    const arrow = el('div', 't-lead', row, '→');
    Object.assign(arrow.style, { position: 'absolute', left: `${AX}px`, top: '-10px', width: '48px', textAlign: 'center', color: G.accent, fontWeight: '520' });
    const a = el('div', 'cb-body40 balance', row, esc(after));
    Object.assign(a.style, { position: 'absolute', left: `${RX}px`, top: '0px', width: `${RW}px`, color: G.fg, fontWeight: '600' });
    return { rule, row, b, arrow, a, before, after };
  });
  function layout() {
    let y = ROW_TOP;
    rows.forEach((r) => {
      r.rule.style.top = `${y}px`;
      r.row.style.top = `${y + 24}px`;
      const h = Math.max(r.b.offsetHeight, r.a.offsetHeight, 52);
      y += 24 + h + 28;
    });
  }
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  const frameB = K.block(frame, {
    enter(tl) {
      tl.fromTo([hb, ha], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.1 }, 0);
      tl.fromTo(rows.map((r) => r.rule), { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'expo.out', stagger: 0.08 }, 0.1);
    },
    settle() { gsap.set([hb, ha], { autoAlpha: 1, y: 0 }); gsap.set(rows.map((r) => r.rule), { scaleX: 1 }); },
  });

  const rowBlocks = rows.map((r) => K.block(r.row, {
    enter(tl) {
      gsap.set([r.b, r.arrow, r.a], { autoAlpha: 0 });
      tl.fromTo(r.b, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0);
      tl.fromTo(r.arrow, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out' }, 0.3);
      tl.fromTo(r.a, { autoAlpha: 1, x: -32, clipPath: 'inset(0 100% 0 0)' }, { x: 0, clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.out' }, 0.42);
    },
    settle() { gsap.set([r.b, r.arrow, r.a], { autoAlpha: 1, x: 0, y: 0, clipPath: 'none' }); },
  }));

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: frameB, on: () => true, at: 0.35 },
    ...rowBlocks.map((rb, i) => ({ c: rb, on: (s) => s >= 1, at: (s, info) => (info.direction < 0 ? 0 : 0.1 + i * 0.55) })),
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    return apply(step, anim, gsap.timeline(), info);
  }
  return { go };
});
