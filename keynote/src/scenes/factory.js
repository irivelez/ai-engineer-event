// factory (motion-a): the software factory as editorial motion, DOM only (the GL city world is gone: GPU time back to the heroes).
// References: DevDay 2026 26:20 (axes first, then data) and 30:57 (statement left, evidence right); Ramp's own 10 × 10 slide (7:51:01).
// Palette: void ground; quiet grey for context marks, periwinkle for the point (October; the agents' share). Nothing glows.
// Light: one real photograph, the Code Summit main stage (11 Nov), darkened under a scrim, pushing in slowly on the open.
// Camera: none. The motion is the data: bars land month by month as the counter steps 809 → 10,926; a 100-cell grid fills to the share.
// The frame that sells it: s1, "10,926" landing with the October bar, 13.5 × June's.
import { gsap } from 'gsap';
import { calmScene, el, esc, fact, factSource } from './_calm/kit.js';
import { scrimBackground } from '../components/Scrim.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const cubicOut = (t) => 1 - Math.pow(1 - t, 3);
const rgbOf = (hex) => { const n = parseInt(String(hex).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

// Bars: one "unit" per month on the bar clock; each bar grows over GROW units (expo.out), the counter steps at SWAP.
const UNIT = 0.5; //   s per month
const GROW = 1.5; //   units a bar takes to grow
const SWAP = 0.45; //  units into a bar's growth when the counter steps to its value (bar ≈ 88 % grown)
const ROLL = 0.55; //  units the counter's roll takes
const STILL_ID = 'main-stage-wide';

export default calmScene('factory', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy, beat } = ctx;
  const M = T.space.margin;
  const LW = T.spanW(6); // left text column (columns 0–5)
  const S = [copy.s1 || {}, copy.s2 || {}, copy.s3 || {}];
  const FACTS = beat.facts || [];
  const fmt = new Intl.NumberFormat('en-US');

  // ---------- data (facts.json; the copy only as a fallback) ----------
  const gb = fact(ctx, FACTS[0]);
  const series = (gb && gb.value && typeof gb.value === 'object' ? Object.entries(gb.value) : S[0].series || [])
    .map(([m, v]) => [String(m), +v]).filter(([, v]) => Number.isFinite(v));
  const vmax = Math.max(1, ...series.map(([, v]) => v));
  const pct = (id, alt) => {
    const f = fact(ctx, id);
    const n = parseFloat(String((f && f.value) ?? alt ?? ''));
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
  };
  const SHARE = [0, 0, pct(FACTS[1], S[1].value), pct(FACTS[2], S[2].value)];
  const UEND = Math.max(0, series.length - 1) + GROW; // bar clock when the last bar lands

  // ---------- s0: the open (real stage still, darkened, slow push) ----------
  const stillSrc = ctx.assets.sf ? ctx.assets.sf(STILL_ID) : null;
  const stillMeta = (ctx.assets.sfMeta && ctx.assets.sfMeta(STILL_ID)) || {};
  const stillWrap = el('div', '');
  place(stillWrap, 0, 0, 1920, 1080);
  stillWrap.style.overflow = 'hidden';
  let img = null;
  if (stillSrc) {
    img = el('img', '', stillWrap);
    img.src = stillSrc;
    img.alt = stillMeta.description || '';
    Object.assign(img.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', objectFit: 'cover', transformOrigin: '66% 60%', willChange: 'transform' });
  }
  const dim = el('div', '', stillWrap);
  Object.assign(dim.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', background: G.bg, opacity: '0.58' });
  const sc = el('div', '', stillWrap);
  Object.assign(sc.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', background: scrimBackground({ ground: g, side: 'left', extent: 0.86, strength: 0.94 }) });
  const scB = el('div', '', stillWrap);
  Object.assign(scB.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', background: scrimBackground({ ground: g, side: 'bottom', extent: 0.4, strength: 0.9 }) });
  const still = K.block(stillWrap, {
    enter(tl) { tl.fromTo(stillWrap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: 'sine.inOut' }, 0); },
    exit(tl) { tl.to(stillWrap, { autoAlpha: 0, duration: 0.7, ease: 'sine.inOut' }, 0); },
  });
  let pushT = 0;
  const setPush = () => { if (img) img.style.transform = `scale(${(1 + 0.05 * Math.sin(Math.min(1, pushT / 26) * Math.PI / 2)).toFixed(4)})`; };
  setPush();

  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h1', ground: g, width: T.spanW(12) }), M, 344);
  const sub = K.add(C.Headline.create({ text: copy.sub || '', role: 'lead', ground: g, width: T.spanW(7), tone: 'muted' }), M, 504);
  const [term, ...defn] = String(copy.gloss || '').split(':');
  const glossEl = el('div', 't-body');
  place(glossEl, M, 848, T.spanW(10));
  const gloss = K.maskLines(glossEl, [{
    html: defn.length ? `<span style="color:${G.fg};font-weight:600">${esc(term.trim())}:</span><span style="color:${G.muted}"> ${esc(defn.join(':').trim())}</span>` : esc(copy.gloss || ''),
  }]);
  // the photo's own caption (sf-stills.json), its own line in the footer band: it leaves with the photo
  const caption = stillSrc ? C.SourceLine.create({ text: [stillMeta.org, stillMeta.talk].filter(Boolean).join(' · '), ground: g }) : null;
  if (caption) { place(caption.el, M, T.space.footer.y); K.owned.push(caption); }

  // ---------- s1–s3: the left column (who, number, label, detail) ----------
  const COL_Y = 216;
  const blocks = S.map((s, i) => {
    const col = el('div', '');
    place(col, M, COL_Y, 1180);
    Object.assign(col.style, { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' });
    const who = C.Kicker.create({ text: s.who || '', ground: g, tone: 'muted' });
    let num;
    if (i === 0) {
      // the counter: a clip mask, the current value rolls up into it, the previous one rolls out of it
      // padded like a line mask (24 px above, 40 px below for the comma), pulled back so the layout box stays 216 px
      const mask = el('div', 't-display tnum');
      Object.assign(mask.style, { position: 'relative', overflow: 'clip', height: '280px', margin: '-24px 0 -40px', width: `${LW}px`, color: G.fg, whiteSpace: 'nowrap' });
      const now = el('div', '', mask);
      const was = el('div', '', mask);
      [now, was].forEach((e) => Object.assign(e.style, { position: 'absolute', left: '0px', top: '24px', willChange: 'transform' }));
      num = { el: mask, now, was, block: K.block(mask, { enter() {}, exit(tl) { tl.to(mask, { autoAlpha: 0, y: -12, duration: T.motion.calmOut.dur, ease: T.motion.calmOut.ease }, 0); } }) };
    } else {
      num = C.BigNumber.create({ display: s.value, size: 'display', ground: g, tone: 'accent' });
    }
    const label = C.Headline.create({ text: s.label || '', role: 'lead', ground: g, width: LW });
    const detail = C.Headline.create({ text: s.detail || '', role: 'body', ground: g, width: LW, tone: 'muted' });
    col.append(who.el, num.el, label.el, detail.el);
    who.el.style.marginBottom = '32px';
    label.el.style.marginTop = '24px';
    detail.el.style.marginTop = '24px';
    K.owned.push(who, label, detail);
    if (i > 0) K.owned.push(num);
    return { who, num, label, detail, src: factSource(ctx, FACTS[i]) };
  });
  const counter = blocks[0].num;

  // ---------- s1: the monthly bars (right, columns 7–11), baseline at y 760 ----------
  const BASE_Y = 760;
  const BAR_MAX = 400;
  const CX0 = T.colX(7);
  const CW = 1792 - CX0;
  const band = CW / Math.max(1, series.length);
  const BW = Math.round(band * 0.64);
  const chart = el('div', '');
  place(chart, 0, 0, 1920, 1080);
  const base = el('div', '', chart);
  Object.assign(base.style, { position: 'absolute', left: `${CX0}px`, top: `${BASE_Y}px`, width: `${CW}px`, height: '2px', background: G.muted, transformOrigin: '0 50%' });
  const last = series.length - 1;
  const bars = series.map(([m, v], k) => {
    const h = Math.max(4, Math.round((v / vmax) * BAR_MAX));
    const cx = CX0 + band * (k + 0.5);
    const bar = el('div', '', chart);
    Object.assign(bar.style, { position: 'absolute', left: `${Math.round(cx - BW / 2)}px`, top: `${BASE_Y - h}px`, width: `${BW}px`, height: `${h}px`, background: k === last ? G.accent : G.quiet, borderRadius: '4px 4px 0 0', transformOrigin: '50% 100%', willChange: 'transform' });
    const val = el('div', 't-label tnum', chart, esc(fmt.format(v)));
    Object.assign(val.style, { position: 'absolute', left: `${Math.round(cx - band / 2)}px`, width: `${Math.round(band)}px`, top: `${BASE_Y - h - 52}px`, textAlign: 'center', whiteSpace: 'nowrap', color: k === last ? G.fg : G.muted, fontWeight: k === last ? '600' : '' });
    const mon = el('div', 't-label', chart, esc(m));
    Object.assign(mon.style, { position: 'absolute', left: `${Math.round(cx - band / 2)}px`, width: `${Math.round(band)}px`, top: `${BASE_Y + 20}px`, textAlign: 'center', color: k === last ? G.fg : G.muted });
    return { bar, val, mon };
  });
  const frame = K.block(chart, {
    enter(tl) {
      tl.fromTo(base, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'expo.out' }, 0);
      tl.fromTo(bars.map((b) => b.mon), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, 0.15);
    },
    settle() { gsap.set(base, { scaleX: 1 }); gsap.set(bars.map((b) => b.mon), { autoAlpha: 1, y: 0 }); },
    exit(tl) { tl.to(chart, { autoAlpha: 0, y: -12, duration: T.motion.calmOut.dur, ease: T.motion.calmOut.ease }, 0); },
  });

  // ---------- s2–s3: the 100-cell grid (right-aligned, same baseline): one cell = 1 % ----------
  const PITCH = 60;
  const CELL = 50;
  const GSIZE = PITCH * 9 + CELL; // 590: sized to balance the display number
  const GX = 1792 - GSIZE;
  const GY = (T.zoomSafe && T.zoomSafe.avoidTopRight && T.zoomSafe.avoidTopRight.h) || 240; // top row clear of the Zoom speaker tile
  const grid = el('div', '');
  place(grid, 0, 0, 1920, 1080);
  const QUIET = rgbOf(G.quiet);
  const ACC = rgbOf(G.accent);
  const cells = Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / 10); // row from the bottom: the grid fills upward, like the bars grow
    const c = i % 10;
    const e = el('div', '', grid);
    Object.assign(e.style, { position: 'absolute', left: `${GX + c * PITCH}px`, top: `${GY + (9 - r) * PITCH}px`, width: `${CELL}px`, height: `${CELL}px`, boxSizing: 'border-box', borderRadius: '4px', border: `3px solid ${G.quiet}` });
    return e;
  });
  const cellRows = Array.from({ length: 10 }, (_, r) => cells.slice(r * 10, r * 10 + 10));
  const gridB = K.block(grid, {
    enter(tl) { tl.fromTo(cellRows, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.035 }, 0); },
    settle() { gsap.set(cellRows.flat(), { autoAlpha: 1, y: 0 }); },
    exit(tl) { tl.to(grid, { autoAlpha: 0, y: -12, duration: T.motion.calmOut.dur, ease: T.motion.calmOut.ease }, 0); },
  });

  // ---------- state as pure functions (render mode and the animated end state agree by construction) ----------
  // fill: the wave front (a cell lights over FADE cells of front travel); share: cells that end lit (exactly `share`);
  // base: cells already lit before this wave (stay full).
  const FADE = 2.5;
  const st = { bars: 0, fill: 0, share: 0, base: 0 };
  let shownTxt = [null, null];
  function renderBars() {
    const p = st.bars;
    bars.forEach((b, k) => {
      const gk = expoOut(clamp01((p - k) / GROW));
      b.bar.style.transform = `scaleY(${gk.toFixed(4)})`;
      const a = clamp01((p - k - 0.65) / 0.45);
      b.val.style.opacity = a.toFixed(3);
      b.val.style.transform = `translateY(${((1 - a) * 10).toFixed(1)}px)`;
    });
    let j = -1;
    for (let k = 0; k < series.length; k++) if (p >= k + SWAP) j = k;
    const nowT = j >= 0 ? fmt.format(series[j][1]) : '';
    const wasT = j >= 1 ? fmt.format(series[j - 1][1]) : '';
    if (shownTxt[0] !== nowT) { counter.now.textContent = nowT; shownTxt[0] = nowT; }
    if (shownTxt[1] !== wasT) { counter.was.textContent = wasT; shownTxt[1] = wasT; }
    const r = j >= 0 ? cubicOut(clamp01((p - (j + SWAP)) / ROLL)) : 0;
    counter.now.style.transform = `translateY(${((1 - r) * 130).toFixed(2)}%)`;
    counter.was.style.transform = `translateY(${(-r * 130).toFixed(2)}%)`;
  }
  function renderGrid() {
    const f = st.fill;
    for (let i = 0; i < 100; i++) {
      const a = i < st.base ? 1 : i < st.share ? clamp01((f - i) / FADE) : 0;
      const e = cells[i];
      if (e._a === a) continue;
      e._a = a;
      const mix = QUIET.map((q, n) => Math.round(q + (ACC[n] - q) * a));
      e.style.borderColor = `rgb(${mix.join(',')})`;
      e.style.backgroundColor = `rgba(${ACC.join(',')},${a.toFixed(3)})`;
    }
  }
  renderBars();
  renderGrid();

  const foot = K.footer();
  let cur = -1;
  // ins at their cue, outs at once (exits are faster than entrances)
  const show = (c, want, tl, at, anim) => tl.add(c.set({ visible: want }, { animate: anim }), anim && want ? at : 0);

  function go(step, animate, info = {}) {
    const tl = gsap.timeline();
    const anim = animate && !R && !((info.direction || 1) < 0); // back = cut to the settled state
    gsap.killTweensOf(st);
    const from = cur;
    cur = step;

    // s0: the open
    if (step === 0 && (anim || from !== 0)) { pushT = 0; setPush(); }
    show(still, step === 0, tl, 0, anim);
    show(title, step === 0, tl, 0.3, anim);
    show(sub, step === 0, tl, 0.55, anim);
    show(gloss, step === 0, tl, 0.9, anim);

    // left column, one block per company
    const at = (x) => (from >= 0 && from !== step ? 0.3 : 0) + x;
    blocks.forEach((b, i) => {
      const on = step === i + 1;
      show(b.who, on, tl, at(0.05), anim);
      if (i === 0) show(b.num.block, on, tl, 0, anim);
      else show(b.num, on, tl, at(i === 1 ? 0.75 : 0.3), anim);
    });

    // s1: axes first, then the bars land month by month with the counter
    show(frame, step === 1, tl, at(0.1), anim);
    const barsAt = at(0.55);
    if (step === 1 && anim && from !== 1) {
      st.bars = 0;
      renderBars();
      tl.to(st, { bars: UEND, duration: UEND * UNIT, ease: 'none', onUpdate: renderBars }, barsAt);
    } else { st.bars = UEND; renderBars(); }
    const s1Done = barsAt + (series.length - 1 + SWAP + ROLL) * UNIT;

    // s2–s3: the grid fills to the share, in step with the odometer roll of the number
    show(gridB, step >= 2, tl, at(0), anim);
    const want = SHARE[step] || 0;
    if (anim && step >= 2 && want > st.share) {
      const first = from < 2;
      st.base = first ? 0 : st.share;
      st.fill = st.base;
      st.share = want;
      renderGrid();
      tl.to(st, { fill: want + FADE, duration: first ? 1.3 : 0.9, ease: 'expo.out', onUpdate: renderGrid }, at(first ? 0.75 : 0.3)); // lands with the odometer
    } else { st.share = want; st.base = want; st.fill = want + FADE; renderGrid(); }

    // label and detail land after the number; provenance last (+0.35 s)
    const textAt = step === 1 ? s1Done : at(step === 2 ? 1.9 : 1.5);
    blocks.forEach((b, i) => {
      const on = step === i + 1;
      show(b.label, on, tl, textAt, anim);
      show(b.detail, on, tl, textAt + 0.15, anim);
    });
    if (caption) show(caption, step === 0, tl, 1.2, anim);
    foot.show(step >= 1 ? (blocks[step - 1] && blocks[step - 1].src) || null : null, anim, tl, textAt);
    return tl;
  }

  return {
    go,
    update(t, dt) {
      if (R || !still.shown || !img) return;
      pushT += dt || 0;
      setPush();
    },
    dispose() { gsap.killTweensOf(st); },
  };
});
