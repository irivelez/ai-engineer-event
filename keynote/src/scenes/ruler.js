// ruler (calm-a, VOID data): who leads depends on the ruler. Never pick a vendor from a leaderboard.
// One step per ruler (copy.rulers): the ruler's name flips in like a split-flap, with what it measures under it;
// the top three rows re-sort FLIP-style (a model that stays slides to its new rank, its bar re-scales and its value
// flips; models that leave fade, newcomers rise in). Bars are lab-tinted marks, every row direct-labelled; equal
// scores share a rank. Last step: the rows step away and the takeaway lands, with its sub-line.
// Evidence: the Artificial Analysis step shows the real leaderboard instead of drawn rows, zoomed to the rows and
// the index column (highlighted), with the source card (chip, publisher · date, QR) in the free top-right corner.
// Epoch's chart stays drawn: at a legible size its leader point is unlabelled and its values unreadable (the
// capture's own note); Arena has no capture.
import { gsap } from 'gsap';
import { calmScene, el, esc, factSource } from './_calm/kit.js';
import { zoomDoc, metaCorner } from './_eva-zoom.js';

// step → evidence crop: region in image px, highlight in frame fractions (layout only; data from evidence.json)
const CROPS = {
  0: { id: 'ruler-aa-intelligence-index', region: { x: 16, y: 10, w: 732, h: 230 }, highlight: { x: 0.612, y: 0.252, w: 0.384, h: 0.737 } },
};

const LAB = (name) => (/claude|mythos/i.test(name) ? 'anthropic' : /gpt/i.test(name) ? 'openai' : /gemini/i.test(name) ? 'google' : null);

export default calmScene('ruler', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const rulers = (copy.rulers || []).slice(0, 4);
  const TAKE = rulers.length; // the takeaway step

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  // break after the question ("Who leads? / It depends on the ruler."), not inside the answer
  const title = K.add(C.Headline.create({ text: String(copy.title || '').replace(/\?\s+/, '?\n'), role: 'h2', ground: g, width: T.spanW(10) }), M, 192);
  title.el.style.whiteSpace = 'pre-line';

  // ----- split-flap ruler name -----
  const flap = el('div', 't-label');
  place(flap, M, 432, 1920 - 2 * M);
  Object.assign(flap.style, { color: G.accent, perspective: '600px', whiteSpace: 'pre' });
  let flapText = '';
  const flapSet = (text, anim, tl, at = 0) => {
    if (text === flapText && flap.childNodes.length) return;
    const build = () => {
      flap.innerHTML = [...text].map((ch) => `<span style="display:inline-block;transform-origin:50% 50% -8px">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
      flapText = text;
    };
    if (!anim || !flap.childNodes.length) { build(); return; }
    const old = [...flap.children];
    tl.to(old, { rotationX: 90, autoAlpha: 0, duration: 0.16, ease: 'power2.in', stagger: 0.008 }, at);
    tl.add(() => {
      build();
      gsap.fromTo([...flap.children], { rotationX: -90, autoAlpha: 0 }, { rotationX: 0, autoAlpha: 1, duration: 0.28, ease: 'power2.out', stagger: 0.012 });
    }, at + 0.16 + old.length * 0.008);
  };
  const flapB = K.block(flap, { rise: 12 });
  // what the ruler measures, under its name (copy.rulers[k].what)
  const what = el('div', 't-body');
  place(what, M, 480, 1920 - 2 * M);
  what.style.color = G.muted;
  const whatB = K.block(what, { rise: 12 });
  const whatSet = (k, anim, tl) => {
    const text = String((rulers[k] || {}).what || '');
    if (what.textContent === text) return;
    if (!anim || !what.textContent) { what.textContent = text; return; }
    tl.to(what, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0);
    tl.add(() => { what.textContent = text; }, 0.2);
    tl.to(what, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 0.25);
  };

  // ----- rows (one per model, keyed by name) -----
  const models = [];
  rulers.forEach((r) => (r.rows || []).forEach(([name]) => { if (!models.includes(name)) models.push(name); }));
  const ROW0 = 572;
  const PITCH = 124;
  const NAME_X = M + 88;
  const BAR_X = T.colX(5);
  const BAR_MAX = T.colX(11) - BAR_X - 40;
  const BAR_H = 44;
  const rows = new Map();
  const area = el('div', '');
  place(area, 0, 0, 1920, 1080);
  models.forEach((name) => {
    const r = el('div', '', area);
    Object.assign(r.style, { position: 'absolute', left: '0px', top: `${ROW0}px`, width: '1920px', height: `${PITCH}px` });
    const rank = el('div', 't-label tnum', r, '');
    Object.assign(rank.style, { position: 'absolute', left: `${M}px`, top: '24px', color: G.muted });
    const nm = el('div', 't-body ca-nowrap', r, esc(name));
    Object.assign(nm.style, { position: 'absolute', left: `${NAME_X}px`, top: '14px', color: G.fg, fontWeight: '520' });
    const bar = el('div', '', r);
    const lab = LAB(name);
    Object.assign(bar.style, { position: 'absolute', left: `${BAR_X}px`, top: '24px', height: `${BAR_H}px`, width: '0px', borderRadius: '0 4px 4px 0', background: lab ? T.labColor(lab, g) : G.quiet });
    const valWrap = el('div', '', r);
    Object.assign(valWrap.style, { position: 'absolute', top: '10px', height: '72px', overflow: 'clip' });
    const val = el('div', 't-lead tnum ca-nowrap', valWrap, '');
    val.style.color = G.fg;
    gsap.set(r, { autoAlpha: 0 });
    rows.set(name, { r, rank, nm, bar, valWrap, val, on: false, w: 0, y: ROW0, v: '' });
  });
  // base line the bars grow from
  const axis = el('div', '', area);
  Object.assign(axis.style, { position: 'absolute', left: `${BAR_X - 2}px`, top: `${ROW0 + 8}px`, width: '2px', height: `${PITCH * 3 - 16}px`, background: G.muted, transformOrigin: '50% 0' });
  const areaB = K.block(area, {
    enter(tl) { tl.fromTo(axis, { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: 'expo.out' }, 0); },
    settle() { gsap.set(axis, { scaleY: 1 }); },
  });

  // ----- evidence crops (steps 0 and 3) -----
  const Y0 = 568;
  const crops = {};
  Object.entries(CROPS).forEach(([k, c]) => {
    const item = ctx.assets.evidence && ctx.assets.evidence(c.id);
    if (!item || !item.imageSrc || !C.EvidenceDoc) return;
    const { doc } = zoomDoc(ctx, item, { region: c.region, width: 1920 - 2 * M, maxHeight: 392, ground: g, qrSize: 200, highlight: c.highlight });
    K.add(doc, M, Y0);
    metaCorner(doc, { fx: M, fy: Y0, x: T.colX(7) - 16, y: 112, w: 1920 - M - T.colX(7) + 16 });
    crops[k] = doc;
  });
  const hasCrop = (k) => !!crops[k];

  const num = (s) => parseFloat(String(s).replace(/[^\d.]/g, '')) || 0;
  function layout(k) {
    const r = rulers[k];
    if (!r) return [];
    const list = (r.rows || []).map(([name, v]) => ({ name, v: String(v), n: num(v) }));
    const max = Math.max(...list.map((x) => x.n), 1);
    let rank = 0;
    return list.map((x, i) => {
      if (i === 0 || x.n !== list[i - 1].n) rank = i + 1;
      return { ...x, rank, y: ROW0 + i * PITCH, w: (x.n / max) * BAR_MAX };
    });
  }

  function placeRows(k, anim, tl) {
    const L = k >= 0 && k < rulers.length ? layout(k) : [];
    const want = new Map(L.map((x) => [x.name, x]));
    rows.forEach((row, name) => {
      const x = want.get(name);
      if (!x) {
        if (row.on) {
          row.on = false;
          if (anim) tl.to(row.r, { autoAlpha: 0, x: 24, duration: 0.45, ease: 'power2.in' }, 0);
          else gsap.set(row.r, { autoAlpha: 0, x: 0 });
        } else if (!anim) gsap.set(row.r, { autoAlpha: 0, x: 0 });
        return;
      }
      const vx = BAR_X + x.w + 24;
      if (!anim) {
        gsap.killTweensOf([row.r, row.bar, row.valWrap, row.val]);
        gsap.set(row.r, { autoAlpha: 1, x: 0, top: x.y });
        gsap.set(row.bar, { width: x.w });
        gsap.set(row.valWrap, { left: vx });
        row.val.textContent = x.v;
        gsap.set(row.val, { yPercent: 0 });
        row.rank.textContent = String(x.rank);
      } else if (!row.on) {
        // newcomer: rises in at its rank, bar grows from the axis
        row.val.textContent = x.v;
        row.rank.textContent = String(x.rank);
        gsap.set(row.r, { top: x.y, x: 0 });
        gsap.set(row.valWrap, { left: vx });
        tl.fromTo(row.r, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0.35);
        tl.fromTo(row.bar, { width: 0 }, { width: x.w, duration: T.motion.roll.dur, ease: T.motion.roll.ease }, 0.45);
        tl.fromTo(row.valWrap, { left: BAR_X + 24 }, { left: vx, duration: T.motion.roll.dur, ease: T.motion.roll.ease }, 0.45);
      } else {
        // stays: FLIP to the new rank, re-scale, flip the value
        tl.to(row.r, { top: x.y, duration: 1.0, ease: 'power3.inOut' }, 0.15);
        tl.to(row.bar, { width: x.w, duration: 1.0, ease: 'power3.inOut' }, 0.15);
        tl.to(row.valWrap, { left: vx, duration: 1.0, ease: 'power3.inOut' }, 0.15);
        if (row.val.textContent !== x.v) {
          tl.to(row.val, { yPercent: -110, duration: 0.25, ease: 'power2.in' }, 0.3);
          tl.add(() => { row.val.textContent = x.v; }, 0.55);
          tl.fromTo(row.val, { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: 'power3.out', immediateRender: false }, 0.55);
        }
        if (row.rank.textContent !== String(x.rank)) tl.add(() => { row.rank.textContent = String(x.rank); }, 0.6);
      }
      row.on = true;
    });
  }

  // ----- step 4: the takeaway -----
  const take = K.add(C.Headline.create({ text: copy.takeaway || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 448);
  const takeSub = el('div', 't-body pretty');
  place(takeSub, M, 776, T.spanW(10));
  takeSub.style.color = G.muted;
  takeSub.textContent = copy.takeawaySub || '';
  const takeSubB = K.block(takeSub, { rise: 16 });

  const foot = K.footer();
  const srcIds = ['aa-leaderboard', 'eci-tie-174', 'arena-text-carbon', 'arc-agi-3-standard'];
  const srcs = srcIds.map((id) => factSource(ctx, id));
  const tagSrc = { kind: 'independent', text: copy.tag || '' };

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: flapB, on: (s) => s < TAKE, at: 0.2 },
    { c: whatB, on: (s) => s < TAKE && !!(rulers[s] || {}).what, at: 0.3 },
    { c: areaB, on: (s) => s < TAKE && !hasCrop(s), at: 0.2 },
    { c: take, on: (s) => s >= TAKE, at: 0.2 },
    { c: takeSubB, on: (s) => s >= TAKE && !!copy.takeawaySub, at: 0.7 },
    ...Object.entries(crops).map(([k, doc]) => ({ c: doc, on: (s) => s === Number(k), at: 0.3 })),
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    if (step < TAKE) { flapSet(String((rulers[step] || {}).name || ''), anim, tl, 0); whatSet(step, anim, tl); }
    placeRows(step < TAKE && !hasCrop(step) ? step : -1, anim, tl);
    const s = step < TAKE ? srcs[step] : tagSrc;
    // with a crop on screen its own card carries the chip and the source: one chip per frame
    foot.show(hasCrop(step) ? null : s || tagSrc, anim, tl, 0.6);
    return tl;
  }
  return { go };
});
