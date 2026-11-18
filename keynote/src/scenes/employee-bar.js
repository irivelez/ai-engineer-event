// employee-bar (calm-a, PAPER data): style frame A. GTC's "permissions ceiling" as a calm chart: the bar Epoch
// sets for its own employees is a line high on the chart; the model bars rise and stop below it.
// Step 0: the finding (title + the study in one sentence).
// Step 1: the scores under the employee bar (the line draws first, then the bars grow).
// Step 2: how they failed: three plain lines replace the study sentence.
import { gsap } from 'gsap';
import { calmScene, el, esc, tagSource, factSource } from './_calm/kit.js';

export default calmScene('employee-bar', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const LW = T.spanW(6);

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: LW }), M, 192);
  const sub = el('div', 't-body balance');
  place(sub, M, 528, T.spanW(5));
  sub.style.color = G.muted;
  sub.innerHTML = esc(copy.sub || '');
  const subB = K.block(sub, { rise: 16 });

  // failures: three plain lines
  const fails = (copy.failures || []).slice(0, 3);
  const fl = el('div', '');
  place(fl, M, 528, LW);
  fl.innerHTML = fails.map((f) => `<div class="ca-sans40 pretty" style="color:${G.fg};margin-bottom:28px">${esc(f)}</div>`).join('');
  const failItems = [...fl.children];
  const failB = K.block(fl, {
    enter(tl) { tl.fromTo(failItems, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease, stagger: 0.35 }, 0); },
    settle() { gsap.set(failItems, { autoAlpha: 1, y: 0 }); },
  });

  // ----- the chart -----
  // "Claude Fable 5.2: best" · "GPT-6.2 Astra: 65% average, 17 points lower"
  const [bName, bNote] = String(copy.best || '').split(':').map((s) => s.trim());
  const [sName, sRest] = String(copy.second || '').split(':').map((s) => s.trim());
  const sVal = parseFloat(sRest) || 65;
  const gap = parseFloat((/(\d+(?:\.\d+)?)\s*points?\s*lower/i.exec(sRest || '') || [])[1]) || 0;
  const bVal = sVal + gap; // the best score = second + the stated gap
  const sNote = String(sRest || '').split(',').slice(1).join(',').trim() || sRest;
  const barLabel = (/the bar .*$/i.exec(copy.title || '') || [''])[0];
  const chart = K.add(C.BarChart.create({
    orientation: 'vertical', ground: g, width: T.spanW(5), height: 600, barWidth: 136, unit: '%',
    data: [{ id: 'best', label: bName || '', value: bVal, note: bNote || '' }, { id: 'second', label: sName || '', value: sVal, note: sNote || '' }],
    highlight: 'best', max: 100,
    threshold: { value: 100, label: barLabel, tone: 'fg' },
  }), T.colX(7), 200);

  const foot = K.footer();
  const tagS = tagSource(copy.tag);
  const fs = factSource(ctx, 'epoch-real-work');
  const src = tagS.text ? tagS : fs;

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: subB, on: (s) => s < 2, at: 0.4 },
    { c: failB, on: (s) => s >= 2, at: 0.1 },
    { c: chart, on: (s) => s >= 1, at: 0.1 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    foot.show(src, anim, tl, 0.9);
    return tl;
  }
  return { go };
});
