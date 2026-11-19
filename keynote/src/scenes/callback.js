// callback (VOID, DOM only: the GL ring tunnel is gone). Art direction:
//  References: GTC Berlin 40:42 (one bright line, labelled only at its ends) · DevDay 26:20 (statement, then evidence) · Act II's staircase.
//  Palette: void #05070A; the frontier line in the accent with a soft halo; the head runs hot (light) while it accelerates;
//           under the statement the history steps back to quiet grey and only the last 11 weeks keep the accent.
//  Light: no 3D. The only light is the head of the line: it streaks as it speeds up and spends itself in one pulse on 17 Nov.
//  Camera: none. Step 1 re-flows the chart instead: it settles into a low band (the end point keeps its x) and the words take the top.
//  The frame that sells it: the head hitting 17 Nov at full speed, one ring pulse, the readout landing on 174.2, then nothing moves.
// Data: src/data/eci-history.json (Epoch AI, CC BY 4.0), imported at build time, the same file as year-in-weeks: every point, date
// and value on screen comes from it. Words: line1/line2 from beats.json; the axis title is year-in-weeks' own (same chart, same words).
import { gsap } from 'gsap';
import eci from '../data/eci-history.json';
import { calmScene, el, svgEl, esc, factSource, fmtDate } from './_calm/kit.js';

const DAY = 864e5;
const parseDay = (s) => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(s || ''));
  return m ? Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 1) : NaN;
};
const num = (v) => (typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^\d.-]/g, '')));
const v1f = (v) => v.toFixed(1); // one decimal everywhere, so the riding readout never changes width (121.6 … 174.2)
const r1 = (n) => n.toFixed(1);
const r3 = (n) => n.toFixed(3);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (k) => Math.min(1, Math.max(0, k));
const hex = (h) => [1, 3, 5].map((i) => parseInt(String(h).slice(i, i + 2), 16));
const mixHex = (a, b, k) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((c, i) => Math.round(lerp(c, B[i], clamp01(k)))).join(',')})`;
};

// The record staircase (a model is listed when its score beat every model before it), the 11-week window.
function prep(D) {
  const raw = (D && Array.isArray(D.frontier) ? D.frontier : [])
    .map((p) => ({ ...p, t: parseDay(p.date), v: num(p.eci) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t || a.v - b.v);
  const steps = [];
  for (const p of raw) if (!steps.length || p.v > steps[steps.length - 1].v + 1e-9) steps.push(p);
  if (steps.length < 2) return null;
  const f = (t) => { let v = steps[0].v; for (const s of steps) { if (s.t <= t) v = s.v; else break; } return v; };
  const L = (D && D.latest) || {};
  const w0 = parseDay(L.from && L.from.date);
  const last = steps[steps.length - 1];
  const win = Number.isFinite(w0) && w0 > steps[0].t && w0 < last.t
    ? { t0: w0, v0: Number.isFinite(num(L.from.eci)) ? num(L.from.eci) : f(w0 - 1) }
    : null;
  return { steps, f, first: steps[0], last, win };
}

const P = prep(eci);

export default calmScene('callback', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const uid = `cb${Math.floor(ctx.random() * 1e9)}`;

  // ---------------- the statement (step 1) and the source (both steps) ----------------
  const line1 = K.add(C.Headline.create({ text: copy.line1, role: 'h2', ground: g, width: 1300 }), M, 168);
  const line2 = K.add(C.Headline.create({ text: copy.line2, role: 'h2', ground: g, width: T.spanW(12), tone: 'accent' }), M, 400);
  const src = factSource(ctx, (ctx.beat.facts || [])[0] || 'eci-jump');
  const foot = K.footer();
  const apply = K.stepper([
    { c: line1, on: (s) => s >= 1, at: 0.4 },
    { c: line2, on: (s) => s >= 1, at: 1.55 },
  ]);
  if (!P) {
    // No data: the words alone, never an invented line.
    return { go(step, animate) { const tl = gsap.timeline(); apply(step, animate && !R, tl); foot.show(src, animate, tl, 0.4); return tl; } };
  }

  // ---------------- layout: the whole frame (step 0) → a low band under the statement (step 1) ----------------
  const yr = (t) => new Date(t).getUTCFullYear();
  const T0 = Date.UTC(yr(P.first.t), 0, 1);
  const T1 = Date.UTC(yr(P.last.t) + 1, 0, 1); // the axis runs to 1 Jan of the next year: the line stops on 17 Nov, short of it
  const vals = P.steps.map((s) => s.v);
  const V0 = Math.floor((Math.min(...vals) - 6) / 5) * 5;
  const V1 = Math.ceil(Math.max(...vals) + 1.8);
  const PL = M;
  const PR = 1920 - M;
  const FULL = { pt: 330, pb: 840 };
  const SET = { pt: 626, pb: 862 };
  const S = { axes: 0, title: 0, draw: 0, head: 0, trail: 0, pulse: 0, readout: 0, endDate: 0, startLab: 0, halo: 0.55, flow: 0, hist: 0, band: 0 };
  const lay = () => ({ pt: lerp(FULL.pt, SET.pt, S.flow), pb: lerp(FULL.pb, SET.pb, S.flow) });
  const X = (t) => PL + ((t - T0) / (T1 - T0)) * (PR - PL);
  const Yof = (L) => (v) => L.pb - ((v - V0) / (V1 - V0)) * (L.pb - L.pt);
  const stairD = (pts, Y, v0, t0) => {
    let d = t0 != null ? `M${r1(X(t0))},${r1(Y(v0))}` : '';
    pts.forEach((s, i) => { d += !d && i === 0 ? `M${r1(X(s.t))},${r1(Y(s.v))}` : ` H${r1(X(s.t))} V${r1(Y(s.v))}`; });
    return d;
  };
  const hist = P.win ? P.steps.filter((s) => s.t < P.win.t0) : P.steps;
  const winSteps = P.win ? P.steps.filter((s) => s.t >= P.win.t0 && s.v > P.win.v0 + 1e-9) : [];

  // ---------------- SVG layers: axes + band (flat), then the line in two glowing layers (history, last weeks + head) ----------------
  const wrap = el('div', '');
  place(wrap, 0, 0, 1920, 1080);
  wrap.style.pointerEvents = 'none';
  const layer = () => {
    const s = svgEl('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080' }, wrap);
    Object.assign(s.style, { position: 'absolute', left: '0px', top: '0px', overflow: 'visible' });
    return s;
  };
  const back = layer();
  const lineH = layer(); //  history: glows in step 0, steps back to quiet grey (no glow) in step 1
  const lineW = layer(); //  the last 11 weeks, the hot trail, the head and its pulse: the light of the frame
  const defs = svgEl('defs', {}, back);
  const clipRect = svgEl('rect', { x: 0, y: 0, width: 0, height: 1080 }, svgEl('clipPath', { id: `${uid}-clip` }, defs));
  const grad = svgEl('linearGradient', { id: `${uid}-trail`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
  svgEl('stop', { offset: 0, 'stop-color': G.fg, 'stop-opacity': 0 }, grad);
  svgEl('stop', { offset: 0.7, 'stop-color': G.fg, 'stop-opacity': 0.55 }, grad);
  svgEl('stop', { offset: 1, 'stop-color': G.fg, 'stop-opacity': 1 }, grad);
  const glow = svgEl('radialGradient', { id: `${uid}-glow` }, defs);
  svgEl('stop', { offset: 0, 'stop-color': G.accent, 'stop-opacity': 0.75 }, glow);
  svgEl('stop', { offset: 0.35, 'stop-color': G.accent, 'stop-opacity': 0.28 }, glow);
  svgEl('stop', { offset: 1, 'stop-color': G.accent, 'stop-opacity': 0 }, glow);
  const [aR, aG, aB] = hex(G.accent);
  const glowCss = (k) => (k > 0.004 ? `drop-shadow(0 0 7px rgba(${aR},${aG},${aB},${(0.75 * k).toFixed(3)})) drop-shadow(0 0 22px rgba(${aR},${aG},${aB},${(0.32 * k).toFixed(3)}))` : 'none');

  // axes: a baseline that draws left → right, a tick per 1 Jan, years centred under them
  const base = svgEl('line', { x1: PL, x2: PR, stroke: G.muted, 'stroke-width': 2, 'stroke-dasharray': `${PR - PL} ${PR - PL}` }, back);
  const years = [];
  for (let y = yr(T0); Date.UTC(y, 0, 1) <= T1; y++) {
    const t = Date.UTC(y, 0, 1);
    const tick = svgEl('line', { x1: r1(X(t)), x2: r1(X(t)), stroke: G.muted, 'stroke-width': 2 }, back);
    const lab = el('div', 't-label tnum', wrap, esc(String(y)));
    Object.assign(lab.style, { position: 'absolute', width: '120px', marginLeft: '-60px', textAlign: 'center', left: `${r1(X(t))}px`, color: G.muted });
    years.push({ t, tick, lab, frac: (X(t) - PL) / (PR - PL) });
  }
  const band = P.win ? svgEl('rect', { x: r1(X(P.win.t0)), width: r1(Math.max(4, X(P.last.t) - X(P.win.t0))), fill: G.accent, 'fill-opacity': 0 }, back) : null;
  const startDot = svgEl('circle', { r: 7, fill: G.muted }, back);
  // step 1: a bracket over the highlighted weeks, named with the statement's own words ("11 weeks", from copy.line1)
  const weeksText = (String(copy.line1 || '').match(/\d+\s+weeks?/i) || [])[0] || '';
  const bracket = P.win && weeksText ? svgEl('path', { fill: 'none', stroke: G.accent, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, back) : null;
  const gAttrs = { 'clip-path': `url(#${uid}-clip)`, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  const pathH = svgEl('path', { stroke: G.accent, 'stroke-width': 6 }, svgEl('g', gAttrs, lineH));
  const gW = svgEl('g', gAttrs, lineW);
  const pathW = svgEl('path', { stroke: G.accent, 'stroke-width': 6 }, gW);
  const hot = svgEl('path', { stroke: `url(#${uid}-trail)`, 'stroke-width': 6 }, gW);
  const ring = svgEl('circle', { r: 10, fill: 'none', stroke: G.accent, 'stroke-width': 4, opacity: 0 }, lineW);
  const headGlow = svgEl('circle', { r: 34, fill: `url(#${uid}-glow)` }, lineW);
  const headDot = svgEl('circle', { r: 9, fill: G.fg }, lineW);

  // ---------------- labels: the axis title, both ends (date over value), the readout that rides the head ----------------
  const yiw = (ctx.beats || []).find((b) => b && b.id === 'year-in-weeks'); // present in the full build (dev --only builds skip the title)
  const axisText = (yiw && yiw.copy && yiw.copy.axis) || '';
  const title = axisText ? el('div', 't-label', wrap, esc(axisText)) : null;
  if (title) Object.assign(title.style, { position: 'absolute', left: `${PL}px`, top: `${FULL.pt - 72}px`, color: G.muted, whiteSpace: 'nowrap' });
  const endLab = (align) => {
    const box = el('div', '', wrap);
    Object.assign(box.style, { position: 'absolute', width: '320px', textAlign: align, whiteSpace: 'nowrap' });
    const date = el('div', 't-source tnum', box);
    Object.assign(date.style, { color: G.muted, textTransform: 'uppercase' });
    const val = el('div', 't-label tnum', box);
    return { box, date, val };
  };
  const startL = endLab('left');
  startL.date.textContent = fmtDate(P.first.date);
  startL.val.textContent = v1f(P.first.v);
  startL.val.style.color = G.fg;
  const endL = endLab('right');
  endL.date.textContent = fmtDate(P.last.date);
  endL.val.style.color = G.accent;
  endL.val.style.fontWeight = '600';
  const VALW = 5 * 32 * 0.66; // five mono characters at the label size (0.6 em advance + 0.06 em tracking)
  const weeksLab = bracket ? el('div', 't-label', wrap, esc(weeksText)) : null;
  if (weeksLab) Object.assign(weeksLab.style, { position: 'absolute', width: '320px', textAlign: 'right', whiteSpace: 'nowrap', color: G.accent, fontWeight: '600', opacity: '0' });

  // ---------------- render: everything from S, so live, render mode and jumps land the same frame ----------------
  let lastGH = '';
  let lastGW = '';
  function render() {
    const L = lay();
    const Y = Yof(L);
    const tHead = lerp(P.first.t, P.last.t, S.draw);
    const hx = X(tHead);
    const hy = Y(P.f(tHead));
    // axes
    base.setAttribute('y1', r1(L.pb));
    base.setAttribute('y2', r1(L.pb));
    base.setAttribute('stroke-dashoffset', r1((1 - S.axes) * (PR - PL)));
    for (const yv of years) {
      yv.tick.setAttribute('y1', r1(L.pb));
      yv.tick.setAttribute('y2', r1(L.pb + 14));
      const a = clamp01((S.axes * 1.3 - yv.frac) / 0.3);
      yv.tick.style.opacity = String(a);
      yv.lab.style.top = `${r1(L.pb + 22)}px`;
      yv.lab.style.opacity = String(a);
      // the head lights each year as it passes, then lets it go (time ticking by, faster and faster)
      const since = hx - X(yv.t);
      const lit = S.draw > 0 && S.draw < 1 && since >= 0 ? Math.max(0, 1 - since / 260) : 0;
      yv.lab.style.color = mixHex(G.muted, G.fg, lit);
    }
    if (title) title.style.opacity = String(S.title);
    // the line: history + last weeks (one line in step 0; split by colour in step 1)
    const dH = stairD(hist, Y) + (P.win ? ` H${r1(X(P.win.t0))}` : '');
    const dW = P.win ? stairD(winSteps, Y, P.win.v0, P.win.t0) : '';
    pathH.setAttribute('d', dH);
    pathW.setAttribute('d', dW);
    hot.setAttribute('d', `${dH} ${dW}`);
    pathH.setAttribute('stroke', mixHex(G.accent, G.quiet, S.hist));
    const gh = glowCss(S.halo * (1 - S.hist));
    const gw = glowCss(S.halo);
    if (gh !== lastGH) { lineH.style.filter = gh; lastGH = gh; }
    if (gw !== lastGW) { lineW.style.filter = gw; lastGW = gw; }
    clipRect.setAttribute('width', r1(S.draw >= 1 ? 1920 : hx));
    const tr = Math.max(2, 360 * S.trail);
    grad.setAttribute('x1', r1(hx - tr));
    grad.setAttribute('x2', r1(hx));
    hot.setAttribute('opacity', S.trail > 0.001 ? r3(S.trail) : '0');
    // band behind the last weeks (step 1)
    if (band) {
      band.setAttribute('y', r1(L.pt));
      band.setAttribute('height', r1(L.pb - L.pt));
      band.setAttribute('fill-opacity', r3(0.09 * S.band));
    }
    if (bracket) {
      const bx0 = X(P.win.t0);
      const bx1 = X(P.last.t);
      const by = L.pt - 8;
      bracket.setAttribute('d', `M${r1(bx0)},${r1(by + 10)} V${r1(by)} H${r1(bx1)} V${r1(by + 10)}`);
      bracket.setAttribute('opacity', r3(S.band));
      Object.assign(weeksLab.style, { left: `${r1(bx1 - 320)}px`, top: `${r1(by - 52)}px`, opacity: r3(S.band) });
    }
    // markers
    const sx = X(P.first.t);
    const sy = Y(P.first.v);
    startDot.setAttribute('cx', r1(sx));
    startDot.setAttribute('cy', r1(sy));
    startDot.style.opacity = S.head > 0.001 || S.startLab > 0.001 ? '1' : '0';
    headDot.setAttribute('cx', r1(hx));
    headDot.setAttribute('cy', r1(hy));
    headGlow.setAttribute('cx', r1(hx));
    headGlow.setAttribute('cy', r1(hy));
    headDot.style.opacity = r3(clamp01(S.head * 1.6));
    headGlow.style.opacity = r3(S.head);
    const pr = S.pulse;
    ring.setAttribute('cx', r1(hx));
    ring.setAttribute('cy', r1(hy));
    ring.setAttribute('r', r1(10 + 64 * pr));
    ring.setAttribute('stroke-width', r1(4 - 1.5 * pr));
    ring.setAttribute('opacity', pr > 0.0001 && pr < 0.9999 ? r3(0.95 * (1 - pr)) : '0');
    // labels: the start's sits over the first point; the end's rides above-left of the head and lands on 17 Nov
    Object.assign(startL.box.style, { left: `${r1(sx - 8)}px`, top: `${r1(sy - 18 - 72)}px`, opacity: String(S.startLab) });
    const anchor = lerp(VALW - 8, -14, S.draw); // left-aligned at the start, right-aligned at the end
    // step 1: the value steps to the right of the point (the bracket and "11 weeks" take the space above), the date goes
    const right = lerp(hx + anchor, hx + 22 + VALW, S.flow);
    const top = lerp(hy - 18 - 72, hy - 52, S.flow);
    Object.assign(endL.box.style, { left: `${r1(right - 320)}px`, top: `${r1(top)}px`, opacity: String(S.readout) });
    endL.val.textContent = v1f(P.f(tHead));
    endL.date.style.opacity = r3(S.endDate * (1 - S.flow));
  }

  const settled = (step) => ({
    axes: 1, title: step >= 1 ? 0 : 1, draw: 1, head: 0.7, trail: 0, pulse: 1, readout: 1, endDate: 1, startLab: 1, halo: 0.55,
    flow: step >= 1 ? 1 : 0, hist: step >= 1 ? 1 : 0, band: step >= 1 ? 1 : 0,
  });
  render();

  const DRAW_AT = 0.95; // after the paper → void wipe has crossed
  const DRAW_DUR = 2.3;
  const LAND = DRAW_AT + DRAW_DUR;
  // already moving at the start (never a dead hold), eight times faster at the end: the opener's speed coming back
  const rush = (t) => 0.3 * t + 0.7 * t * t * t;
  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    gsap.killTweensOf(S);
    const to = (vars, dur, ease, at) => tl.to(S, { ...vars, duration: dur, ease, onUpdate: render }, at);
    if (!anim) {
      Object.assign(S, settled(step));
      render();
    } else if (info.entering) {
      // axes first, then the head runs from GPT-4 to 17 Nov, lands, one pulse, stillness
      Object.assign(S, { axes: 0, title: 0, draw: 0, head: 0, trail: 0, pulse: 0, readout: 0, endDate: 0, startLab: 0, halo: 0.9, flow: 0, hist: 0, band: 0 });
      render();
      to({ axes: 1 }, 0.9, 'power2.out', 0.3);
      to({ title: 1 }, 0.6, 'power2.out', 0.55);
      to({ head: 1, readout: 1 }, 0.25, 'power2.out', DRAW_AT - 0.12);
      to({ draw: 1 }, DRAW_DUR, rush, DRAW_AT);
      to({ trail: 1 }, DRAW_DUR, 'power2.in', DRAW_AT);
      to({ trail: 0 }, 0.2, 'power2.out', LAND);
      to({ pulse: 1 }, 1.4, 'expo.out', LAND);
      to({ halo: 0.55, head: 0.7 }, 1.8, 'sine.out', LAND + 0.1);
      to({ endDate: 1, startLab: 1 }, 0.5, 'power3.out', LAND + 0.3);
    } else {
      const s = settled(step);
      if (step >= 1) {
        // stillness: the chart settles under the words; history steps back, the last 11 weeks keep the accent
        to({ title: 0 }, 0.3, 'power2.in', 0);
        to({ flow: 1 }, 1.4, 'power3.inOut', 0);
        to({ hist: 1 }, 0.9, 'sine.inOut', 0.25);
        to({ band: 1 }, 0.9, 'sine.inOut', 1.1);
      } else {
        to({ band: 0, hist: 0 }, 0.5, 'sine.inOut', 0);
        to({ flow: 0 }, 1.2, 'power3.inOut', 0.1);
        to({ title: 1 }, 0.5, 'power2.out', 0.9);
      }
      to({ axes: s.axes, draw: s.draw, head: s.head, trail: 0, pulse: 1, readout: 1, endDate: 1, startLab: 1, halo: s.halo }, 0.01, 'none', 0);
    }
    apply(step, anim, tl, info);
    foot.show(src, anim, tl, info.entering ? LAND + 0.2 : 0);
    return tl;
  }
  return { go, dispose() { gsap.killTweensOf(S); } };
});
