// year-in-weeks (calm-a, PAPER data): the whole story of Epoch AI's Capabilities Index frontier.
// Data: src/data/eci-history.json (Epoch AI), imported at build time by ../year-in-weeks.js. Nothing invented:
// every point, slope and date on screen comes from that file; every word from beats.json.
// The chart is the set (columns 4–11); one 60 px statement per step beside it (DevDay 26:20).
// Step 0: every step is a new model. Axes first (years, index values), then the frontier staircase draws
//         left → right; each riser is the model that set a new record; a few models are named.
// Step 1: since reasoning models, the climb is about twice as steep: a marker where reasoning began, and
//         Epoch's two slopes (points a year) drawn through the staircase; "6 → 14" beside the chart.
// Step 2: the axes push in on the last 11 weeks (one view, re-rendered per frame): the models that set the
//         record fill the chart in the accent, named with their scores, over the dashed trend for the same
//         weeks; "from → to" beside it, then Epoch's caveat in small serif.
import { gsap } from 'gsap';
import { calmScene, el, svgEl, esc, factSource, fmtDate, kindOf } from '../_calm/kit.js';

const DAY = 864e5;
const YEAR = 365.2425 * DAY;
const parseDay = (s) => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(s || ''));
  return m ? Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 1) : NaN; // 'YYYY-MM' = the 1st
};
const num = (v) => (typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^\d.-]/g, '')));
const fmtV = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));
const fill = (tpl, map) => String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (map[k] != null ? map[k] : ''));
const nameOf = (m) => (typeof m === 'string' ? m : (m && (m.model || m.name)) || '');
const MONO_EM = 0.66; // Geist Mono advance 0.6em + label tracking 0.06em

/** Pure data prep: the record staircase, the trend fits, the last-weeks window. */
export function prep(D) {
  const raw = (D && Array.isArray(D.frontier) ? D.frontier : [])
    .map((p) => ({ ...p, t: parseDay(p.date), v: num(p.eci) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t || a.v - b.v);
  const steps = [];
  for (const p of raw) {
    const last = steps[steps.length - 1];
    if (!last || p.v > last.v + 1e-9) steps.push({ ...p, ties: [] });
    else if (Math.abs(p.v - last.v) < 1e-9) last.ties.push(p);
  }
  if (!steps.length) return null;
  const L = (D && D.latest) || {};
  const from = L.from || {};
  const to = L.to || {};
  const f = (t) => { let v = steps[0].v; for (const s of steps) { if (s.t <= t) v = s.v; else break; } return v; };
  const tFirst = steps[0].t;
  const tLast = steps[steps.length - 1].t;
  const tTo = Number.isFinite(parseDay(to.date)) ? parseDay(to.date) : tLast;
  const tEnd = Math.max(tLast, tTo);
  const tFrom = Number.isFinite(parseDay(from.date)) ? parseDay(from.date) : null;
  const tr = (D && D.trend) || {};
  const rSlope = num(tr.reasoning && tr.reasoning.ptsPerYear);
  const nSlope = num(tr.nonReasoning && tr.nonReasoning.ptsPerYear);
  const tSince = parseDay(tr.reasoning && tr.reasoning.since);
  // A line with Epoch's slope through the staircase over [t0, t1] (least squares, slope fixed).
  const fit = (slope, t0, t1) => {
    const n = 96;
    let acc = 0;
    for (let k = 0; k <= n; k++) { const t = t0 + ((t1 - t0) * k) / n; acc += f(t) - (slope * (t - t0)) / YEAR; }
    const b = acc / (n + 1);
    return (t) => b + (slope * (t - t0)) / YEAR;
  };
  const okSince = Number.isFinite(tSince) && tSince > tFirst && tSince < tEnd;
  const nTrend = okSince && Number.isFinite(nSlope) ? { t0: tFirst, t1: tSince, at: fit(nSlope, tFirst, tSince), slope: nSlope } : null;
  const rFitEnd = tFrom && tFrom > tSince ? tFrom : tEnd;
  const rTrend = okSince && Number.isFinite(rSlope) ? { t0: tSince, t1: tEnd, at: fit(rSlope, tSince, rFitEnd), slope: rSlope } : null;
  const vFrom = Number.isFinite(num(from.eci)) ? num(from.eci) : tFrom ? f(tFrom) : null;
  const vTo = Number.isFinite(num(to.eci)) ? num(to.eci) : steps[steps.length - 1].v;
  const toModels = (Array.isArray(to.models) ? to.models : to.model ? [to.model] : []).map(nameOf).filter(Boolean);
  const reasonFirst = okSince ? steps.find((s) => s.t >= tSince - DAY) : null;
  return {
    steps, f, tFirst, tEnd, tSince: okSince ? tSince : null, nTrend, rTrend, reasonFirst,
    win: tFrom ? { t0: tFrom, t1: tEnd, from: vFrom, to: vTo, fromModel: nameOf(from), toModels, fromDate: from.date, toDate: to.date } : null,
  };
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const lerp = (a, b, k) => a + (b - a) * k;
let clipSeq = 0;

export function makeScene(D) {
  const P = prep(D);
  return calmScene('year-in-weeks', (ctx, K) => {
    const { T, C, G, g, place, R } = K;
    const { copy } = ctx;
    const M = T.space.margin;
    const LW = T.spanW(4); // statements beside the chart (DevDay 26:20); the chart is the set
    const H = copy.headlines || [];
    const nb = (s) => String(s || '').replace(/ /g, ' ');

    const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
    // a headline may carry {months} / {weeks}: the last weeks' climb in months of Epoch's trend, from the data
    const nums = {};
    if (P && P.win && P.rTrend && Number.isFinite(P.win.from) && Number.isFinite(P.win.to)) {
      nums.months = String(Math.round(((P.win.to - P.win.from) / P.rTrend.slope) * 12));
      nums.weeks = String(Math.round((P.win.t1 - P.win.t0) / (7 * DAY)));
    }
    const headText = (i) => {
      const tpl = H[i] || copy.title || '';
      const keys = [...tpl.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      return keys.every((k) => nums[k] != null) ? fill(tpl, nums) : copy.title || '';
    };
    const heads = [0, 1, 2].map((i) => K.add(C.Headline.create({ text: headText(i), role: 'lead', ground: g, width: LW }), M, 192));

    // ---------------- chart frame: columns 4–11 (index values in column 4, plot from x 773) ----------------
    const YL = T.colX(4);
    const PL = YL + 80;
    const PR = T.colX(11) + T.space.col;
    const PT = 268;
    const PB = 832;
    const stage = () => {
      const d = el('div', '');
      place(d, 0, 0, 1920, 1080);
      d.style.pointerEvents = 'none';
      const s = svgEl('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080' }, d);
      Object.assign(s.style, { position: 'absolute', left: '0px', top: '0px', overflow: 'visible' });
      return { d, s };
    };
    const clipped = (s) => {
      const id = `yiw-clip-${++clipSeq}`;
      const defs = svgEl('defs', {}, s);
      const cp = svgEl('clipPath', { id }, defs);
      svgEl('rect', { x: PL - 6, y: PT - 16, width: PR - PL + 12, height: PB - PT + 18 }, cp);
      return svgEl('g', { 'clip-path': `url(#${id})` }, s);
    };
    if (!P) {
      // No data: say nothing rather than invent (the build imports the real file).
      const foot0 = K.footer();
      const apply0 = K.stepper([{ c: kicker, on: () => true }, ...heads.map((h, i) => ({ c: h, on: (s) => s === i, at: 0.08 }))]);
      return { go(step, animate) { const tl = gsap.timeline(); apply0(step, animate && !R, tl); foot0.show(null, animate, tl); return tl; } };
    }

    // ---------------- views: the whole history (steps 0–1) and the last weeks (step 2) ----------------
    const vals = P.steps.map((s) => s.v);
    const vLo = Math.min(...vals);
    const vHi = Math.max(...vals, P.win ? P.win.to : -Infinity);
    const nice = (span) => [5, 10, 20, 25, 50, 100].find((c) => span / c <= 4) || 100;
    const spanF = Math.max(10, vHi - vLo);
    const stepF = nice(spanF);
    const FULL = {
      t0: Date.UTC(new Date(P.tFirst).getUTCFullYear(), 0, 1), t1: P.tEnd + 24 * DAY,
      v0: Math.floor((vLo - spanF * 0.06) / 10) * 10, v1: Math.ceil((vHi + spanF * 0.04) / stepF) * stepF,
    };
    let ZOOM = null;
    let stepZ = stepF;
    if (P.win && Number.isFinite(P.win.from)) {
      const lo = Math.min(P.win.from, P.rTrend ? P.rTrend.at(P.win.t0) : P.win.from);
      const sp = Math.max(4, vHi - lo);
      stepZ = nice(sp * 1.3);
      ZOOM = { t0: P.win.t0 - 16 * DAY, t1: P.tEnd + 14 * DAY, v0: Math.floor((lo - sp * 0.3) / stepZ) * stepZ, v1: Math.ceil((vHi + sp * 0.35) / stepZ) * stepZ }; // headroom: the top two names stack above their steps
    }
    const view = { ...FULL, k: 0 };
    function setView(k) {
      const z = ZOOM || FULL;
      const kk = ZOOM ? k : 0;
      const w = Math.exp(lerp(Math.log(FULL.t1 - FULL.t0), Math.log(z.t1 - z.t0), kk)); // a steady push in
      view.t1 = lerp(FULL.t1, z.t1, kk);
      view.t0 = view.t1 - w;
      view.v0 = lerp(FULL.v0, z.v0, kk);
      view.v1 = lerp(FULL.v1, z.v1, kk);
      view.k = kk;
    }
    const X = (t, V = view) => PL + ((t - V.t0) / (V.t1 - V.t0)) * (PR - PL);
    const Y = (v, V = view) => PB - ((v - V.v0) / (V.v1 - V.v0)) * (PB - PT);
    const r1 = (n) => n.toFixed(1);
    const lastS = P.steps[P.steps.length - 1];
    const stairD = (V = view) => {
      let d = '';
      P.steps.forEach((s, i) => { d += i ? ` H${r1(X(s.t, V))} V${r1(Y(s.v, V))}` : `M${r1(X(s.t, V))},${r1(Y(s.v, V))}`; });
      return `${d} H${r1(X(P.tEnd, V))}`;
    };

    // ---------------- axes: index gridlines (both views' steps), baseline, years, months ----------------
    const ax = stage();
    const gStep = Math.min(stepF, stepZ);
    const grids = [];
    const mod = (a, b) => Math.abs(a / b - Math.round(a / b)) < 1e-6;
    for (let v = Math.ceil(Math.min(FULL.v0, ZOOM ? ZOOM.v0 : FULL.v0) / gStep) * gStep; v <= FULL.v1 + 1e-9; v += gStep) {
      const line = svgEl('line', { x1: PL, x2: PR, y1: 0, y2: 0, stroke: G.rule, 'stroke-width': 2 }, ax.s);
      const lab = el('div', 't-label tnum', ax.d, esc(String(v)));
      Object.assign(lab.style, { position: 'absolute', left: `${YL}px`, width: `${PL - YL - 16}px`, textAlign: 'right', color: G.muted });
      grids.push({ v, line, lab, mF: mod(v, stepF), mZ: mod(v, stepZ) });
    }
    svgEl('line', { x1: PL, x2: PR, y1: PB, y2: PB, stroke: G.muted, 'stroke-width': 2 }, ax.s);
    const ticks = [];
    const y0 = new Date(FULL.t0).getUTCFullYear();
    const every = X(Date.UTC(y0 + 1, 0, 1), FULL) - X(Date.UTC(y0, 0, 1), FULL) < 112 ? 2 : 1;
    for (let yv = y0; Date.UTC(yv, 0, 1) <= FULL.t1; yv++) {
      const tick = svgEl('line', { x1: 0, x2: 0, y1: PB, y2: PB + 14, stroke: G.muted, 'stroke-width': 2 }, ax.s);
      const lab = (yv - y0) % every ? null : el('div', 't-label tnum', ax.d, esc(String(yv)));
      if (lab) Object.assign(lab.style, { position: 'absolute', top: `${PB + 22}px`, color: G.muted });
      ticks.push({ t: Date.UTC(yv, 0, 1), tick, lab, zoom: false });
    }
    if (ZOOM) {
      const z0 = new Date(ZOOM.t0);
      for (let m = Date.UTC(z0.getUTCFullYear(), z0.getUTCMonth() + 1, 1); m <= ZOOM.t1; m = Date.UTC(new Date(m).getUTCFullYear(), new Date(m).getUTCMonth() + 1, 1)) {
        const tick = svgEl('line', { x1: 0, x2: 0, y1: PB, y2: PB + 14, stroke: G.muted, 'stroke-width': 2 }, ax.s);
        const lab = el('div', 't-label', ax.d, esc(MON[new Date(m).getUTCMonth()]));
        Object.assign(lab.style, { position: 'absolute', top: `${PB + 22}px`, color: G.muted });
        ticks.push({ t: m, tick, lab, zoom: true });
      }
    }
    const axTitle = el('div', 't-label', ax.d, esc(copy.axis || ''));
    Object.assign(axTitle.style, { position: 'absolute', left: `${YL}px`, top: '196px', color: G.fg, whiteSpace: 'nowrap' });
    const axB = K.block(ax.d, { rise: 0, dur: 0.7 });

    // ---------------- the last weeks' band (step 2), behind the data ----------------
    const bandS = stage();
    const bandG = clipped(bandS.s);
    const bandRect = P.win ? svgEl('rect', { y: PT - 16, height: PB - PT + 16, fill: G.accent, 'fill-opacity': 0.08 }, bandG) : null;
    const bandB = K.block(bandS.d, { rise: 0 });

    // ---------------- Epoch's slopes (step 1), under the staircase ----------------
    const tg = stage();
    const tgG = clipped(tg.s);
    const trendProg = { n: 1, r: 1 };
    const segD = (tr, k = 1) => {
      const t1 = tr.t0 + (tr.t1 - tr.t0) * Math.max(0.001, k);
      return `M${r1(X(tr.t0))},${r1(Y(tr.at(tr.t0)))} L${r1(X(t1))},${r1(Y(tr.at(t1)))}`;
    };
    const tN = P.nTrend ? svgEl('path', { fill: 'none', 'stroke-linecap': 'round', stroke: G.muted, 'stroke-width': 5, 'stroke-dasharray': '12 10' }, tgG) : null;
    const tR = P.rTrend ? svgEl('path', { fill: 'none', 'stroke-linecap': 'round', stroke: G.accent, 'stroke-width': 6 }, tgG) : null;
    const renderTrends = () => {
      if (tN) tN.setAttribute('d', segD(P.nTrend, trendProg.n));
      if (tR) tR.setAttribute('d', segD(P.rTrend, trendProg.r));
    };
    const tB = K.block(tg.d, {
      enter(tl) {
        trendProg.n = 0;
        trendProg.r = 0;
        renderTrends();
        tl.to(trendProg, { n: 1, duration: 1.0, ease: 'power2.inOut', onUpdate: renderTrends }, 0.45);
        tl.to(trendProg, { r: 1, duration: 1.2, ease: 'power2.inOut', onUpdate: renderTrends }, 1.1);
      },
      settle() { trendProg.n = 1; trendProg.r = 1; renderTrends(); },
    });
    // where reasoning began: a dashed marker through the plot, named under the years
    const mk = stage();
    if (P.tSince) {
      const xs = X(P.tSince, FULL);
      svgEl('line', { x1: r1(xs), x2: r1(xs), y1: PT - 8, y2: PB + 62, stroke: G.muted, 'stroke-width': 2, 'stroke-dasharray': '6 8' }, mk.s);
      const mt = String(copy.reasoning || '');
      const mw = Math.ceil(mt.length * 32 * 0.56) + 8;
      const ml = el('div', 'ca-sans32', mk.d, esc(mt));
      Object.assign(ml.style, { position: 'absolute', left: `${Math.min(Math.max(xs - mw / 2, PL), PR - mw).toFixed(1)}px`, top: `${PB + 66}px`, width: `${mw}px`, textAlign: 'center', whiteSpace: 'nowrap', color: G.muted });
    }
    const markB = K.block(mk.d, { rise: 0, dur: 0.6 });

    // ---------------- the staircase: every riser is a model that set a new record ----------------
    const st = stage();
    const stG = clipped(st.s);
    const stair = svgEl('path', { d: stairD(FULL), fill: 'none', stroke: G.fg, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, stG);
    const dots = P.steps.map(() => svgEl('circle', { r: 6, fill: G.fg }, stG));
    const cum = [];
    let len = 0;
    P.steps.forEach((s, i) => {
      if (i) len += Math.abs(X(s.t, FULL) - X(P.steps[i - 1].t, FULL)) + Math.abs(Y(P.steps[i - 1].v, FULL) - Y(s.v, FULL));
      cum.push(len);
    });
    len += Math.abs(X(P.tEnd, FULL) - X(lastS.t, FULL));
    const stB = K.block(st.d, {
      enter(tl) {
        // the line draws left → right; each model's dot lands as the line reaches it
        const D2 = len + 8;
        const p = { v: 0 };
        const draw = () => {
          const at = D2 * p.v;
          stair.style.strokeDashoffset = String(D2 - at);
          for (let i = 0; i < dots.length; i++) dots[i].style.opacity = at + 0.5 >= cum[i] ? '1' : '0';
        };
        stair.style.strokeDasharray = `${D2} ${D2}`;
        draw();
        tl.to(p, { v: 1, duration: 2.2, ease: 'power1.inOut', onUpdate: draw }, 0.05);
        tl.add(() => { stair.style.strokeDasharray = 'none'; stair.style.strokeDashoffset = '0'; }, 2.3);
      },
      settle() {
        stair.style.strokeDasharray = 'none';
        stair.style.strokeDashoffset = '0';
        dots.forEach((c) => { c.style.opacity = '1'; });
      },
    });

    // ---------------- the last weeks in the accent (step 2), over the staircase ----------------
    const wg = stage();
    const wgG = clipped(wg.s);
    // the window starts at Epoch's 'from' score; records on its first day (and after) are its steps
    const wFrom = P.win ? (Number.isFinite(P.win.from) ? P.win.from : P.f(P.win.t0 - 1)) : null;
    const winSteps = P.win ? P.steps.filter((s) => s.t >= P.win.t0 && s.v > wFrom + 1e-9) : [];
    const winTies = P.win ? P.steps.flatMap((s) => s.ties.filter((tt) => tt.t >= P.win.t0)) : [];
    const wPath = P.win ? svgEl('path', { fill: 'none', stroke: G.accent, 'stroke-width': 7, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, wgG) : null;
    const wDots = winSteps.map(() => svgEl('circle', { r: 9, fill: G.accent }, wgG));
    const tDots = winTies.map(() => svgEl('circle', { r: 8, fill: G.bg, stroke: G.accent, 'stroke-width': 4 }, wgG));
    const wB = K.block(wg.d, { rise: 0, dur: 0.6 });

    function render() {
      for (const gl of grids) {
        const yy = Y(gl.v);
        const inR = gl.v >= view.v0 - 1e-6 && gl.v <= view.v1 + 1e-6;
        const op = inR ? (gl.mF ? 1 - view.k : 0) + (gl.mZ ? view.k : 0) : 0;
        gl.line.setAttribute('y1', r1(yy));
        gl.line.setAttribute('y2', r1(yy));
        gl.line.style.opacity = String(Math.abs(yy - PB) < 1 ? 0 : op);
        gl.lab.style.top = `${r1(yy - 20)}px`;
        gl.lab.style.opacity = String(op);
      }
      for (const tk of ticks) {
        const xx = X(tk.t);
        const inX = xx >= PL - 1 && xx <= PR + 1;
        const op = inX ? (tk.zoom ? view.k * view.k : 1 - view.k) : 0;
        tk.tick.setAttribute('x1', r1(xx));
        tk.tick.setAttribute('x2', r1(xx));
        tk.tick.style.opacity = String(op);
        if (tk.lab) { tk.lab.style.left = `${r1(xx - 1)}px`; tk.lab.style.opacity = String(xx + 72 > PR + 4 ? 0 : op); }
      }
      stair.setAttribute('d', stairD());
      P.steps.forEach((s, i) => { dots[i].setAttribute('cx', r1(X(s.t))); dots[i].setAttribute('cy', r1(Y(s.v))); });
      renderTrends();
      if (P.win) {
        bandRect.setAttribute('x', r1(X(P.win.t0)));
        bandRect.setAttribute('width', r1(Math.max(4, X(P.win.t1) - X(P.win.t0))));
        let d = `M${r1(X(P.win.t0))},${r1(Y(wFrom))}`;
        for (const s of winSteps) d += ` H${r1(X(s.t))} V${r1(Y(s.v))}`;
        wPath.setAttribute('d', `${d} H${r1(X(P.tEnd))}`);
        winSteps.forEach((s, i) => { wDots[i].setAttribute('cx', r1(X(s.t))); wDots[i].setAttribute('cy', r1(Y(s.v))); });
        winTies.forEach((s, i) => { tDots[i].setAttribute('cx', r1(X(s.t))); tDots[i].setAttribute('cy', r1(Y(s.v))); });
      }
    }

    // ---------------- labels: boxes that never touch the staircase or each other, and dodge the slopes ----------------
    function placer(V) {
      const pts = [];
      const corners = [];
      P.steps.forEach((s, i) => { if (i) corners.push([X(s.t, V), Y(P.steps[i - 1].v, V)]); corners.push([X(s.t, V), Y(s.v, V)]); });
      corners.push([X(P.tEnd, V), Y(lastS.v, V)]);
      for (let i = 1; i < corners.length; i++) {
        let [a0, b0] = corners[i - 1];
        let [a1, b1] = corners[i];
        if (Math.max(a0, a1) < PL - 50 || Math.min(a0, a1) > PR + 50) continue;
        a0 = Math.max(a0, PL - 50); a1 = Math.max(a1, PL - 50); b0 = Math.min(b0, PB + 50); b1 = Math.min(b1, PB + 50);
        const n = Math.min(400, Math.max(1, Math.ceil(Math.hypot(a1 - a0, b1 - b0) / 6)));
        for (let k = 0; k <= n; k++) pts.push([a0 + ((a1 - a0) * k) / n, b0 + ((b1 - b0) * k) / n]);
      }
      const soft = [];
      for (const tr of [P.nTrend, P.rTrend]) {
        if (!tr) continue;
        for (let k = 0; k <= 160; k++) { const t = tr.t0 + ((tr.t1 - tr.t0) * k) / 160; soft.push([X(t, V), Y(tr.at(t), V)]); }
      }
      const taken = [];
      const hit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
      const inBox = (b, pad) => ([px, py]) => px > b[0] - pad && px < b[0] + b[2] + pad && py > b[1] - pad && py < b[1] + b[3] + pad;
      return {
        take(b) { taken.push(b); },
        best(cands) {
          let best = null;
          let bestScore = Infinity;
          cands.forEach((b, i) => {
            if (b[0] < PL - 4 || b[0] + b[2] > PR + 4 || b[1] < PT - 24 || b[1] + b[3] > PB + 2) return;
            const score = pts.filter(inBox(b, 8)).length * 1000 + taken.filter((o) => hit(b, o)).length * 1000 + soft.filter(inBox(b, 4)).length * 10 + i;
            if (score < bestScore) { bestScore = score; best = b; }
          });
          const out = best || cands[0];
          taken.push(out);
          return out;
        },
      };
    }
    const LH = 40;
    const monoW = (s) => Math.ceil(String(s).length * 32 * MONO_EM) + 16;
    const around = (sx, sy, w) => [
      [sx - 14 - w, sy - 52], [sx + 6, sy + 10], [sx - 14 - w, sy - 100], [sx + 6, sy + 58],
      [sx - w / 2, sy - 56], [sx + 6, sy - 52], [sx - 14 - w, sy + 10], [sx - w / 2, sy + 14], [sx + 6, sy + 106],
    ].map(([l, t]) => [l, t, w, LH]);
    const label = (parent, text, b, color = G.fg) => {
      const e = el('div', 't-label', parent, esc(text));
      Object.assign(e.style, { position: 'absolute', whiteSpace: 'nowrap', color, background: G.bg, padding: '0 8px', left: `${r1(b[0])}px`, top: `${r1(b[1])}px` });
      return e;
    };
    // steps 0–1: the first record, the first of the reasoning era, the latest
    const nm = stage();
    const placeF = placer(FULL);
    const named = [];
    [P.steps[0], P.reasonFirst, lastS].forEach((s) => { if (s && !named.includes(s)) named.push(s); });
    named.forEach((s) => { const w = monoW(s.model || ''); label(nm.d, String(s.model || ''), placeF.best(around(X(s.t, FULL), Y(s.v, FULL), w))); });
    const namesB = K.block(nm.d, { rise: 0, dur: 0.6 });
    // step 2: every model of the last weeks with its score, and the trend over the same weeks
    const wl = stage();
    if (ZOOM) {
      const placeZ = placer(ZOOM);
      const pin = (name, t, v) => {
        const text = `${name} · ${fmtV(v)}`;
        label(wl.d, text, placeZ.best(around(X(t, ZOOM), Y(v, ZOOM), monoW(text))));
      };
      winSteps.forEach((s) => pin(String(s.model || ''), s.t, s.v));
      winTies.forEach((s) => pin(String(s.model || ''), s.t, s.v));
      if (P.rTrend) {
        const tt = fill(copy.trendLabel, { n: fmtV(P.rTrend.slope) });
        const w = Math.ceil(tt.length * 32 * 0.56) + 16;
        const ex = X(P.tEnd, ZOOM);
        const ey = Y(P.rTrend.at(P.tEnd), ZOOM);
        const b = placeZ.best([[ex - w - 8, ey - 50], [ex - w - 8, ey - 58], [ex - w - 8, ey + 16], [ex - w - 8, ey + 60], [ex - w - 120, ey - 70]].map(([l, t]) => [l, t, w, LH]));
        const e = el('div', 'ca-sans32', wl.d, esc(tt));
        Object.assign(e.style, { position: 'absolute', whiteSpace: 'nowrap', color: G.muted, background: G.bg, padding: '0 8px', left: `${r1(b[0])}px`, top: `${r1(b[1])}px` });
      }
      const wt = String(copy.window || '');
      const ww = monoW(wt);
      const bx0 = X(P.win.t0, ZOOM);
      const bx1 = X(P.win.t1, ZOOM);
      label(wl.d, wt, placeZ.best([[bx0 + 12, PB - 50], [bx0 + 12, PT - 8], [bx1 - ww - 12, PB - 50], [bx0 + 12, PB - 96]].map(([l, t]) => [l, t, ww, LH])), G.accent);
    }
    const winLabB = K.block(wl.d, { rise: 8, dur: 0.7 });

    // the zoom: steps 0–1 show the whole history, step 2 pushes in on the last weeks
    const zoomP = { k: 0 };
    function zoomTo(target, anim, tl, at) {
      gsap.killTweensOf(zoomP);
      if (!anim || !ZOOM) { zoomP.k = ZOOM ? target : 0; setView(zoomP.k); render(); return; }
      if (Math.abs(zoomP.k - target) < 1e-6) return;
      tl.to(zoomP, { k: target, duration: 1.6, ease: 'power3.inOut', onUpdate: () => { setView(zoomP.k); render(); } }, at);
    }
    setView(0);
    render();

    // ---------------- left column, under each statement ----------------
    // Statement heights as the browser sets them (Geist 520 at 60 px in 4 columns): 2, 4 and 3 lines.
    const slotY = (lines) => 192 + lines * 72 + 40;
    const explain = el('div', 'ca-sans40 pretty');
    place(explain, M, slotY(2), LW);
    explain.style.color = G.muted;
    explain.innerHTML = esc(copy.explain || '');
    const explainB = K.block(explain, { rise: 16 });

    // a "from → to" number row: from in muted, to rolls in the accent
    function pairRow(top, fromTxt, toTxt, sub, size = 'h1') {
      const box = el('div', '');
      place(box, M, top, LW);
      const row = el('div', '', box);
      Object.assign(row.style, { display: 'flex', alignItems: 'baseline', gap: '14px' });
      const a = el('div', `t-${size} ca-nowrap`, row, `${esc(fromTxt)}<span style="margin-left:10px">→</span>`);
      a.style.color = G.muted;
      const b = C.BigNumber.create({ display: nb(toTxt), size, ground: g, tone: 'accent' });
      b.el.style.setProperty('--bn-lh', `calc(var(--t-${size}-line) * 1em)`);
      row.appendChild(b.el);
      K.owned.push(b);
      const subs = (sub || []).filter((s) => s && s.html).map((s) => {
        const e = el('div', s.cls, box, s.html);
        e.style.color = s.color || G.fg;
        e.style.marginTop = `${s.gap || 0}px`;
        return e;
      });
      return K.block(box, {
        enter(tl) {
          tl.fromTo(a, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0);
          tl.add(b.set({ visible: true }, { animate: true }), 0.3);
          if (subs.length) tl.fromTo(subs, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: T.motion.calmIn.ease, stagger: 0.1 }, 0.5);
        },
        settle() { gsap.set([a, ...subs], { autoAlpha: 1, y: 0 }); b.set({ visible: true }, { animate: false }); },
        hide() { b.set({ visible: false }, { animate: false }); },
      });
    }
    const slopeB = P.nTrend && P.rTrend
      ? pairRow(slotY(4), fmtV(P.nTrend.slope), fmtV(P.rTrend.slope), [{ cls: 'ca-sans40 pretty', html: esc(copy.slopeLabel || ''), color: G.muted, gap: 4 }])
      : null;
    const W = P.win;
    const jumpB = W && Number.isFinite(W.from) && Number.isFinite(W.to)
      ? pairRow(slotY(3), fmtV(W.from), fmtV(W.to), [
        { cls: 't-label tnum', html: esc([fmtDate(W.fromDate), fmtDate(W.toDate)].filter(Boolean).join(' → ')), color: G.muted, gap: 12 },
      ], 'h2')
      : null;
    const caveat = el('div', 'pretty');
    place(caveat, M, slotY(3) + 200, LW);
    Object.assign(caveat.style, { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '40px', lineHeight: '52px', color: G.fg });
    caveat.innerHTML = esc(copy.caveat || '');
    const caveatB = K.block(caveat, { rise: 16 });

    // reasoning slope: the accent in step 1; in step 2 it steps back to a dashed quiet line (the trend)
    function slopeTone(step, anim, tl) {
      if (!tR) return;
      const a = step >= 2 ? { stroke: G.quiet, 'stroke-dasharray': '12 10', 'stroke-width': 5 } : { stroke: G.accent, 'stroke-dasharray': 'none', 'stroke-width': 6 };
      if (anim) tl.set(tR, { attr: a }, 0.3);
      else gsap.set(tR, { attr: a });
    }

    const foot = K.footer();
    // step 2's "N months" is our arithmetic on Epoch's numbers: an ESTIMATE chip beside Epoch's INDEPENDENT one
    let estB = null;
    if (W && P.rTrend && copy.estimate && Number.isFinite(W.from) && Number.isFinite(W.to)) {
      const e = el('div', '');
      Object.assign(e.style, { display: 'flex', alignItems: 'center', gap: '20px', height: '44px', whiteSpace: 'nowrap' });
      e.classList.add('ground-' + g);
      e.innerHTML = `${C.chipHTML('estimate')}<span style="font-family:var(--f-sans);font-size:26px;line-height:32px;font-weight:460;color:${G.muted}">${esc(fill(copy.estimate, { gain: fmtV(W.to - W.from), slope: fmtV(P.rTrend.slope) }))}</span>`;
      estB = e;
    }
    const src = D && D.source;
    const dataSrc = src && (src.publisher || src.date)
      ? { kind: kindOf(src.label || D.label || 'independent'), text: [src.publisher, fmtDate(src.date || src.fetchedAt)].filter(Boolean).join(' · ') }
      : factSource(ctx, 'eci-tie-174');
    const sTrend = factSource(ctx, 'eci-trend-14') || dataSrc;
    const sJump = factSource(ctx, 'eci-jump') || dataSrc;
    let estFootB = null;
    if (estB && sJump) {
      // after the footer's own chip + 'Outlet · date' (26 px mono), with the footer's 40 px rhythm
      const CHIPN = { independent: 11, labReported: 12, secondary: 9, official: 8, estimate: 8, press: 5 };
      const chipW = 56 + (CHIPN[sJump.kind] || 11) * 26 * 0.68;
      place(estB, Math.round(M + chipW + 20 + String(sJump.text).length * 26 * 0.61 + 40), T.space.footer.y);
      estFootB = K.block(estB, { rise: 0, dur: 0.5 });
    }

    const apply = K.stepper([
      { c: kicker, on: () => true },
      { c: heads[0], on: (s) => s === 0, at: 0.08 },
      { c: heads[1], on: (s) => s === 1, at: 0.08 },
      { c: heads[2], on: (s) => s === 2, at: 0.08 },
      { c: axB, on: () => true, at: 0.2 },
      { c: bandB, on: (s) => s >= 2, at: 0.3 },
      { c: tB, on: (s) => s >= 1, at: 0.3 },
      { c: markB, on: (s) => s === 1, at: 0.3 },
      { c: stB, on: () => true, at: (s, info) => (info.entering ? 0.9 : 0) },
      { c: namesB, on: (s) => s <= 1, at: (s, info) => (info.entering ? 2.9 : 0.4) },
      { c: wB, on: (s) => s >= 2, at: 0.2 },
      { c: winLabB, on: (s) => s >= 2, at: 1.9 },
      { c: explainB, on: (s) => s === 0, at: 0.5 },
      slopeB && { c: slopeB, on: (s) => s === 1, at: 0.4 },
      jumpB && { c: jumpB, on: (s) => s === 2, at: 0.4 },
      { c: caveatB, on: (s) => s === 2, at: 2.6 },
      estFootB && { c: estFootB, on: (s) => s === 2, at: 1.4 },
    ].filter(Boolean));

    function go(step, animate, info = {}) {
      const anim = animate && !R;
      const tl = gsap.timeline();
      apply(step, anim, tl, info);
      slopeTone(step, anim, tl);
      zoomTo(step >= 2 ? 1 : 0, anim, tl, 0.45);
      foot.show(step === 0 ? dataSrc : step === 1 ? sTrend : sJump, anim, tl, 0.6);
      return tl;
    }
    return { go, dispose() { gsap.killTweensOf(zoomP); gsap.killTweensOf(trendProg); } };
  });
}
