// three-labs (motion-a): Act II opens; three labs, three equal typographic tiles. DOM only (the GL labs world is gone).
// References: DevDay 2026 30:57 (the stat-tile trio: number large, label under it, max three per frame) and 23:29 (one statement, lots of ground).
// Palette: void; each lab's identity colour only on its tile's 4 px rule; type in fg and muted, so no lab outshines another.
// Light: none. Camera: none. One synchronized reveal per step, identical timing in all three columns (no lab goes first).
// The frame that sells it: s2, "9 Nov · 17 Nov · 10 Nov" in one row: three flagships, eight days apart.
import { gsap } from 'gsap';
import { calmScene, el, esc, factSource } from './_calm/kit.js';

const TOP = 432; // the tiles' rules
const RULE = 16; // their height: a band of lab colour, so the three labs carry the step on their own

export default calmScene('three-labs', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy, beat } = ctx;
  const M = T.space.margin;
  const labs = (copy.labs || []).slice(0, 3);
  const labKey = (s) => { const t = String(s || '').toLowerCase(); return t.includes('anthropic') ? 'anthropic' : t.includes('openai') ? 'openai' : t.includes('google') ? 'google' : ''; };

  // ---------- s0: the act title (as before) ----------
  const acts = ctx.acts || [];
  const numbered = acts.filter((a) => a.n);
  const actIndex = Math.max(0, numbered.findIndex((a) => a.id === beat.act));
  const act = K.add(C.ActTitle.create({ numeral: copy.act, title: copy.actTitle, index: actIndex, total: numbered.length || 5, ground: g, width: T.spanW(10) }), M, 300);

  // ---------- s1–s2: kicker, the statement, three equal tiles ----------
  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const line = K.add(C.Headline.create({ text: copy.line || '', role: 'h2', ground: g, width: T.spanW(12) }), M, 192);
  const W = T.spanW(4);
  const tiles = labs.map((l, k) => {
    const x = T.colX(4 * k);
    const color = (G.lab && G.lab[labKey(l.lab)]) || G.muted;
    const rule = el('div', '');
    place(rule, x, TOP, W, RULE);
    Object.assign(rule.style, { background: color, borderRadius: '4px', transformOrigin: '0 50%' });
    const lab = el('div', 't-label');
    place(lab, x, TOP + RULE + 32, W);
    Object.assign(lab.style, { color: G.fg, whiteSpace: 'nowrap' });
    lab.innerHTML = `<span class="tl-in" style="display:inline-block">${esc(l.lab)}</span>`;
    const model = el('div', 't-lead');
    place(model, x, TOP + RULE + 108, W);
    Object.assign(model.style, { color: G.fg, fontWeight: '600', whiteSpace: 'nowrap', overflowX: 'visible', overflowY: 'clip', padding: '0.14em 0 0.22em', margin: '-0.14em 0 -0.22em' });
    model.innerHTML = `<span class="tl-in" style="display:inline-block">${esc(l.model)}</span>`;
    const date = el('div', 't-h1 tnum');
    place(date, x, TOP + RULE + 204, W);
    Object.assign(date.style, { color: G.fg, whiteSpace: 'nowrap', overflowX: 'visible', overflowY: 'clip', padding: '0.14em 0 0.22em', margin: '-0.14em 0 -0.22em' });
    date.innerHTML = `<span class="tl-in" style="display:inline-block">${esc(l.date)}</span>`;
    return { rule, lab, model, date, inner: { lab: lab.firstChild, model: model.firstChild, date: date.firstChild } };
  });

  // Each row of the three tiles is one block: the three columns reveal on the same frames.
  const row = (els, enter, settle) => {
    const wrap = el('div', '');
    place(wrap, 0, 0, 1920, 1080);
    els.forEach((e) => wrap.appendChild(e));
    return K.block(wrap, { enter, settle });
  };
  const rulesB = row(tiles.flatMap((t) => [t.rule, t.lab]), (tl) => {
    tl.fromTo(tiles.map((t) => t.rule), { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: 'expo.out' }, 0);
    tl.fromTo(tiles.map((t) => t.inner.lab), { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 0.18);
  }, () => { gsap.set(tiles.map((t) => t.rule), { scaleX: 1 }); gsap.set(tiles.map((t) => t.inner.lab), { autoAlpha: 1, x: 0 }); });
  const modelsB = row(tiles.flatMap((t) => [t.model, t.date]), (tl) => {
    tl.fromTo(tiles.map((t) => t.inner.model), { yPercent: 130 }, { yPercent: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0);
    tl.fromTo(tiles.map((t) => t.inner.date), { yPercent: 130 }, { yPercent: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0.22);
  }, () => { gsap.set(tiles.map((t) => [t.inner.model, t.inner.date]).flat(), { yPercent: 0 }); });

  const srcParts = (beat.facts || []).map((id) => factSource(ctx, id)).filter((s) => s && s.fact);
  const src = srcParts.length ? { kind: srcParts[0].kind || 'official', text: srcParts.map((s) => s.text.replace(' · ', ', ')).join(' · ') } : null;
  const foot = K.footer();

  let cur = -1;
  const show = (c, want, tl, at, anim) => tl.add(c.set({ visible: want }, { animate: anim }), anim && want ? at : 0);
  function go(step, animate, info = {}) {
    const tl = gsap.timeline();
    const anim = animate && !R && !((info.direction || 1) < 0);
    const from = cur;
    cur = step;
    const base = from === 0 && step >= 1 ? 0.35 : 0; // after the act title has lifted out
    show(act, step === 0, tl, 0.2, anim);
    show(kicker, step >= 1, tl, base, anim);
    show(line, step >= 1, tl, base + 0.1, anim);
    show(rulesB, step >= 1, tl, base + 0.55, anim);
    show(modelsB, step >= 2, tl, 0.1, anim);
    foot.show(step >= 2 ? src : null, anim, tl, 0.9);
    return tl;
  }
  return { go };
});
