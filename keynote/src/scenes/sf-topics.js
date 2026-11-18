// sf-topics (calm-a): what 80 talks were about. Axes first, then data (DevDay): bars draw in quiet;
// step 1 lights the four "shipping code" bars in the accent and lands the takeaway beside the chart.
import { gsap } from 'gsap';
import { calmScene, el, esc, factSource } from './_calm/kit.js';

export default calmScene('sf-topics', (ctx, K) => {
  const { T, C, G, g, place } = K;
  const { copy } = ctx;
  const M = T.space.margin;

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(8) }), M, 176);

  // ----- bars -----
  const items = (copy.items || []).map(([label, value], i) => ({ id: String(i), label, value: +value }));
  const hlSet = new Set(copy.highlight || []);
  const max = Math.max(...items.map((d) => d.value), 1);
  const X0 = M;
  const LABEL_W = 640;
  const BAR_X = X0 + LABEL_W;
  const BAR_MAX = 560;
  const ROW_H = 48;
  const BAR_H = 28;
  const TOP = 336;
  const chart = el('div', '');
  place(chart, 0, 0, 1920, 1080);
  const axis = el('div', '', chart);
  Object.assign(axis.style, { position: 'absolute', left: `${BAR_X}px`, top: `${TOP}px`, width: '2px', height: `${items.length * ROW_H}px`, background: G.muted });
  const rows = items.map((d, i) => {
    const y = TOP + i * ROW_H;
    const label = el('div', 'ca-sans32 ca-nowrap', chart, esc(d.label));
    Object.assign(label.style, { position: 'absolute', left: `${X0}px`, top: `${y + (ROW_H - 40) / 2}px`, width: `${LABEL_W - 32}px`, color: G.fg });
    const w = (d.value / max) * BAR_MAX;
    const bar = el('div', '', chart);
    Object.assign(bar.style, { position: 'absolute', left: `${BAR_X + 2}px`, top: `${y + (ROW_H - BAR_H) / 2}px`, width: `${w}px`, height: `${BAR_H}px`, background: G.quiet, borderRadius: '0 4px 4px 0', transformOrigin: '0 50%' });
    const val = el('div', 't-label tnum', chart, esc(String(d.value)));
    Object.assign(val.style, { position: 'absolute', left: `${BAR_X + 2 + w + 16}px`, top: `${y + (ROW_H - 40) / 2}px`, color: G.muted });
    return { d, label, bar, val, hl: hlSet.has(d.label) };
  });
  const bars = K.block(chart, {
    enter(tl) {
      tl.fromTo(axis, { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 0', duration: 0.8, ease: 'expo.out' }, 0);
      tl.fromTo(rows.map((r) => r.label), { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05 }, 0.1);
      tl.fromTo(rows.map((r) => r.bar), { scaleX: 0 }, { scaleX: 1, duration: T.motion.roll.dur, ease: T.motion.roll.ease, stagger: 0.06 }, 0.3);
      tl.fromTo(rows.map((r) => r.val), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power3.out', stagger: 0.06 }, 0.9);
    },
    settle() {
      gsap.set(axis, { scaleY: 1 });
      gsap.set(rows.map((r) => r.label), { autoAlpha: 1, x: 0 });
      gsap.set(rows.map((r) => r.bar), { scaleX: 1 });
      gsap.set(rows.map((r) => r.val), { autoAlpha: 1, x: 0 });
    },
  });

  // ----- takeaway: "34 of 80" + the rest of the sentence, beside the short bars -----
  const [head, ...rest] = String(copy.takeaway || '').split(':');
  const tx = T.colX(8);
  const take = el('div', '');
  place(take, tx, 420, T.spanW(4));
  take.innerHTML =
    `<div class="t-h1 tnum" style="color:${G.accent};white-space:nowrap">${esc(head.trim())}</div>` +
    `<div class="t-lead balance" style="margin-top:24px;color:${G.fg}">${esc(rest.join(':').trim())}</div>`;
  const takeaway = K.block(take, { rise: 24 });

  const foot = K.footer();
  const est = factSource(ctx, 'sf-shipping-34') || factSource(ctx, 'sf-topics');
  const src0 = { kind: (est && est.kind) || 'estimate', text: copy.note || (est && est.text) || '' };

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: bars, on: () => true, at: 0.3 },
    { c: takeaway, on: (s) => s >= 1, at: 0.45 },
  ]);

  function go(step, animate) {
    const tl = gsap.timeline();
    const anim = animate && !K.R;
    apply(step, anim, tl);
    const lit = step >= 1;
    rows.forEach((r, i) => {
      const barC = lit ? (r.hl ? G.accent : G.quiet) : G.quiet;
      const labC = lit ? (r.hl ? G.fg : G.muted) : G.fg;
      const valC = lit && r.hl ? G.fg : G.muted;
      const fw = lit && r.hl ? 600 : 520;
      if (anim) {
        tl.to(r.bar, { backgroundColor: barC, duration: 0.6, ease: 'power2.inOut' }, 0.1 + i * 0.02);
        tl.to([r.label], { color: labC, fontWeight: fw, duration: 0.5, ease: 'power2.inOut' }, 0.1 + i * 0.02);
        tl.to(r.val, { color: valC, duration: 0.5 }, 0.1 + i * 0.02);
      } else {
        gsap.set(r.bar, { backgroundColor: barC });
        gsap.set(r.label, { color: labC, fontWeight: fw });
        gsap.set(r.val, { color: valC });
      }
    });
    foot.show(src0, anim, tl, 0.6);
    return tl;
  }
  return { go };
});
