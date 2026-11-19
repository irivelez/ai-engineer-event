// release-pace (motion-a): 14 frontier releases in 11 weeks as a flat, exact timeline. DOM only (the GL labs world is gone).
// References: DevDay 2026 26:20 (axes first, then data; mono axis labels); GTC 40:42 (label the marks, not the grid).
// Palette: void; three lab colours on the dots only (labels stay in text colours), a light playhead, the count in periwinkle.
// Light: none; flat ground, 2 px structure, 24 px marks. Camera: none. One motion per step: the playhead sweeps the weeks
// and each release lands as it passes (dot, ring, name), the count ticks to 14. The frame that sells it: s2, the ledger 5 · 5 · 4 = 14.
import { gsap } from 'gsap';
import { calmScene, el, esc, fact, factSource } from './_calm/kit.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const cubicOut = (t) => 1 - Math.pow(1 - t, 3);
const DAY = 86400000;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ORDER = ['anthropic', 'openai', 'google']; // as in three-labs

const isoDay = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
/** '1 Sep → 17 Nov 2026' → [ms, ms] (the year from whichever side has one), or null. */
function parseWindow(text) {
  const parts = String(text || '').split('→').map((x) => x.trim());
  if (parts.length !== 2) return null;
  const yr = (parts.map((p) => /(\d{4})/.exec(p)).find(Boolean) || [])[1];
  const one = (p) => {
    const m = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(p);
    const mi = m ? MON.findIndex((x) => x.toLowerCase() === m[2].toLowerCase()) : -1;
    return m && yr && mi >= 0 ? Date.UTC(+yr, mi, +m[1]) : NaN;
  };
  const a = one(parts[0]);
  const b = one(parts[1]);
  return Number.isFinite(a) && Number.isFinite(b) && b > a ? [a, b] : null;
}
const labKey = (s) => { const t = String(s || '').toLowerCase(); return t.includes('anthropic') ? 'anthropic' : t.includes('openai') ? 'openai' : t.includes('google') ? 'google' : t; };
/** facts.json release name → on-screen name: no parenthetical, "GPT-6 Sol and GPT-6 Luna" → "GPT-6 Sol and Luna". */
function shortName(name) {
  let s = String(name || '').replace(/\s*\([^)]*\)/g, '').trim();
  const m = /^(.+) (\S+) and \1 (\S+)$/.exec(s);
  if (m) s = `${m[1]} ${m[2]} and ${m[3]}`;
  return s;
}

// geometry (stage px)
const X0 = 448; //         1 Sep
const X1 = 1792; //        17 Nov
const LANE_Y = [376, 508, 640];
const AXIS_Y = 740;
const COUNT_R = 400; //    right edge of the ledger column (lab counts, total)
const ROW_Y = 816; //      the total row
const DOT = 24;
const CHAR_W = 15.9; //    t-source (26 px Geist Mono) advance, for label anchoring
const SWEEP = 7.2; //      s the playhead takes for the window
const TAIL = 10; //        days after the window end, so the last landing (ring: 9 days) completes; the playhead stops at 17 Nov

export default calmScene('release-pace', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;

  // ---------- data: every mark from facts.json releases-sep-nov ----------
  const rel = fact(ctx, 'releases-sep-nov') || {};
  const relabel = copy.releaseLabels || {}; // approved on-screen wording for a release, by its short name
  const all = (rel.releases || []).map((r) => { const n = shortName(r.name); return { lab: labKey(r.lab), name: relabel[n] || n, t: isoDay(r.date) }; })
    .filter((r) => Number.isFinite(r.t) && ORDER.includes(r.lab));
  const win = parseWindow(copy.window) || [Math.min(...all.map((r) => r.t)), Math.max(...all.map((r) => r.t))];
  const SPAN = Math.round((win[1] - win[0]) / DAY); // 77 days = 11 weeks
  const PX = (X1 - X0) / SPAN;
  const xOf = (d) => X0 + d * PX;
  const list = all.map((r) => ({ ...r, d: (r.t - win[0]) / DAY })).filter((r) => r.d >= 0 && r.d <= SPAN).sort((a, b) => a.d - b.d);
  const counts = copy.counts || [];
  const lanes = ORDER.map((key, k) => {
    const c = counts.find((x) => labKey(x.lab) === key) || { lab: key, n: '' };
    return { key, lab: c.lab, n: String(c.n ?? ''), y: LANE_Y[k], color: (G.lab && G.lab[key]) || G.fg };
  });

  // ---------- title ----------
  const kicker = K.add(C.Kicker.create({ text: copy.window || '', ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(12) }), M, 176);

  // ---------- the frame: lanes, lab names, the week axis (axes first) ----------
  const frameEl = el('div', '');
  place(frameEl, 0, 0, 1920, 1080);
  const laneEls = lanes.map((ln) => {
    const line = el('div', '', frameEl);
    Object.assign(line.style, { position: 'absolute', left: `${X0}px`, top: `${ln.y - 1}px`, width: `${X1 - X0}px`, height: '2px', background: G.rule, transformOrigin: '0 50%' });
    const name = el('div', 't-label', frameEl, esc(ln.lab));
    Object.assign(name.style, { position: 'absolute', left: `${M}px`, top: `${ln.y - 20}px`, color: G.fg, whiteSpace: 'nowrap' });
    return { line, name };
  });
  const axis = el('div', '', frameEl);
  Object.assign(axis.style, { position: 'absolute', left: `${X0}px`, top: `${AXIS_Y}px`, width: `${X1 - X0}px`, height: '2px', background: G.muted, transformOrigin: '0 50%' });
  // a ruler: week ticks above the line (the 11 weeks), date ticks and labels below it
  const ticks = [];
  for (let d = 0; d <= SPAN; d += 7) {
    const tk = el('div', '', frameEl);
    Object.assign(tk.style, { position: 'absolute', left: `${Math.round(xOf(d) - 1)}px`, top: `${AXIS_Y - 10}px`, width: '2px', height: '10px', background: G.muted });
    ticks.push(tk);
  }
  // date labels: the window's ends and each month start inside it
  const marksAt = [0];
  for (let m = new Date(win[0]); ; ) {
    m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1));
    const d = Math.round((m.getTime() - win[0]) / DAY);
    if (d >= SPAN - 6) break;
    marksAt.push(d);
  }
  marksAt.push(SPAN);
  const axisLabels = marksAt.map((d, i) => {
    const dt = new Date(win[0] + d * DAY);
    const lab = el('div', 't-source', frameEl, esc(`${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`));
    const end = i === marksAt.length - 1;
    Object.assign(lab.style, { position: 'absolute', top: `${AXIS_Y + 20}px`, whiteSpace: 'nowrap', color: G.muted });
    if (i === 0) lab.style.left = `${X0}px`;
    else if (end) { lab.style.left = `${X1 - 300}px`; lab.style.width = '300px'; lab.style.textAlign = 'right'; }
    else { lab.style.left = `${Math.round(xOf(d) - 150)}px`; lab.style.width = '300px'; lab.style.textAlign = 'center'; }
    const tk = el('div', '', frameEl);
    Object.assign(tk.style, { position: 'absolute', left: `${Math.round(xOf(d) - 1)}px`, top: `${AXIS_Y + 2}px`, width: '2px', height: '12px', background: G.muted });
    ticks.push(tk);
    return lab;
  });
  const frame = K.block(frameEl, {
    enter(tl) {
      tl.fromTo(laneEls.map((l) => l.line), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 0);
      tl.fromTo(laneEls.map((l) => l.name), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, 0.1);
      tl.fromTo(axis, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0.2);
      tl.fromTo([...ticks, ...axisLabels], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out', stagger: 0.02 }, 0.45);
    },
    settle() {
      gsap.set([...laneEls.map((l) => l.line), axis], { scaleX: 1 });
      gsap.set([...laneEls.map((l) => l.name), ...ticks, ...axisLabels], { autoAlpha: 1, x: 0 });
    },
  });

  // ---------- the releases: dot + landing ring + name, alternating above/below within a lane ----------
  const marksEl = el('div', '');
  place(marksEl, 0, 0, 1920, 1080);
  const perLane = {};
  const marks = list.map((r) => {
    const ln = lanes[ORDER.indexOf(r.lab)];
    const idx = (perLane[r.lab] = (perLane[r.lab] ?? -1) + 1);
    const above = idx % 2 === 0;
    const x = xOf(r.d);
    const ring = el('div', '', marksEl);
    Object.assign(ring.style, { position: 'absolute', left: `${x - DOT / 2}px`, top: `${ln.y - DOT / 2}px`, width: `${DOT}px`, height: `${DOT}px`, boxSizing: 'border-box', borderRadius: '50%', border: `3px solid ${ln.color}`, opacity: '0' });
    const dot = el('div', '', marksEl);
    Object.assign(dot.style, { position: 'absolute', left: `${x - DOT / 2}px`, top: `${ln.y - DOT / 2}px`, width: `${DOT}px`, height: `${DOT}px`, boxSizing: 'border-box', borderRadius: '50%', background: ln.color });
    const label = el('div', 't-source', marksEl, esc(r.name));
    const w = r.name.length * CHAR_W;
    const right = x - DOT / 2 + w > X1 + 4;
    Object.assign(label.style, { position: 'absolute', top: `${above ? ln.y - 52 : ln.y + 20}px`, whiteSpace: 'nowrap', color: G.muted });
    if (right) { const r0 = Math.min(x + DOT / 2, X1); label.style.left = `${Math.round(r0 - 600)}px`; label.style.width = '600px'; label.style.textAlign = 'right'; }
    else label.style.left = `${Math.round(x - DOT / 2)}px`;
    return { ...r, dot, ring, label, above };
  });
  const playhead = el('div', '', marksEl);
  Object.assign(playhead.style, { position: 'absolute', left: `${X0 - 2}px`, top: `${LANE_Y[0] - 60}px`, width: '4px', height: `${AXIS_Y + 14 - (LANE_Y[0] - 60)}px`, borderRadius: '2px', background: G.fg, willChange: 'transform' });
  const ph = K.block(playhead, {
    enter(tl) { tl.fromTo(playhead, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0); },
    exit(tl) { tl.to(playhead, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0); },
  });
  const marksB = K.block(marksEl, { enter() {} });

  // ---------- the ledger: lab counts on the lanes, the running total under them ----------
  const laneCounts = lanes.map((ln) => {
    const e = el('div', 't-lead tnum');
    place(e, COUNT_R - 160, ln.y - 36, 160);
    Object.assign(e.style, { textAlign: 'right', color: G.fg });
    e.textContent = ln.n;
    return e;
  });
  const lcBlock = (() => {
    const wrap = el('div', '');
    place(wrap, 0, 0, 1920, 1080);
    laneCounts.forEach((e) => wrap.appendChild(e));
    return K.block(wrap, {
      enter(tl) { tl.fromTo(laneCounts, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0); },
      settle() { gsap.set(laneCounts, { autoAlpha: 1, y: 0 }); },
    });
  })();
  const row = el('div', '');
  place(row, M, ROW_Y, 1792 - M);
  Object.assign(row.style, { display: 'flex', alignItems: 'baseline', gap: `${X0 - COUNT_R}px` });
  // the total: the block owns its visibility, the inner span its per-landing tick
  const totalEl = el('div', 't-h1 tnum', row);
  Object.assign(totalEl.style, { width: `${COUNT_R - M}px`, flex: 'none', textAlign: 'right', color: G.accent });
  const totalNum = el('span', '', totalEl);
  Object.assign(totalNum.style, { display: 'inline-block', willChange: 'transform' });
  const total = K.block(totalEl, { enter(tl) { tl.fromTo(totalEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, 0); } });
  const totalLabel = C.Headline.create({ text: copy.totalLabel || '', role: 'lead', ground: g, width: X1 - X0 });
  row.appendChild(totalLabel.el);
  K.owned.push(totalLabel);

  const foot = K.footer();
  const src = factSource(ctx, 'releases-sep-nov');

  // ---------- state as a pure function of the playhead day ----------
  const st = { day: -1 };
  let shownN = null;
  function render() {
    const day = st.day;
    playhead.style.transform = `translateX(${(clamp01(day / SPAN) * (X1 - X0)).toFixed(1)}px)`;
    let n = 0;
    let dLast = -Infinity;
    for (const m of marks) {
      const dt = day - m.d;
      if (dt >= 0) { n++; if (m.d > dLast) dLast = m.d; }
      const a = dt >= 0 ? expoOut(clamp01(dt / 2.5)) : 0;
      m.dot.style.transform = `scale(${a.toFixed(3)})`;
      const q = clamp01(dt / 9);
      m.ring.style.opacity = (dt >= 0 && q < 1 ? 0.8 * (1 - q) : 0).toFixed(3);
      m.ring.style.transform = `scale(${(1 + 1.6 * cubicOut(q)).toFixed(3)})`;
      const b = clamp01((dt - 0.6) / 3);
      m.label.style.opacity = b.toFixed(3);
      m.label.style.transform = `translateY(${((1 - b) * (m.above ? 8 : -8)).toFixed(1)}px)`;
    }
    const txt = String(n);
    if (shownN !== txt) { totalNum.textContent = txt; shownN = txt; }
    const r = n > 0 ? cubicOut(clamp01((day - dLast) / 2)) : 1;
    totalNum.style.transform = `translateY(${((1 - r) * 16).toFixed(1)}px)`;
    totalNum.style.opacity = (0.45 + 0.55 * r).toFixed(3);
  }
  const DEND = SPAN + TAIL;
  const D0 = -1; // before the window: nothing has landed (a release on 1 Sep sits at day 0)
  st.day = D0;
  render();

  let cur = -1;
  const show = (c, want, tl, at, anim) => tl.add(c.set({ visible: want }, { animate: anim }), anim && want ? at : 0);

  function go(step, animate, info = {}) {
    const tl = gsap.timeline();
    const anim = animate && !R && !((info.direction || 1) < 0);
    gsap.killTweensOf(st);
    const from = cur;
    cur = step;
    show(kicker, true, tl, 0, anim);
    show(title, true, tl, 0.1, anim);
    show(frame, true, tl, 0.5, anim);
    show(marksB, true, tl, 0, anim);
    show(ph, step === 1, tl, 0, anim);
    show(total, step >= 1, tl, 0.2, anim);
    if (step === 1 && anim && from !== 1) {
      st.day = D0;
      render();
      tl.to(st, { day: DEND, duration: SWEEP * ((DEND - D0) / SPAN), ease: 'none', onUpdate: render }, 0.6);
    } else { st.day = step >= 1 ? DEND : D0; render(); }
    show(lcBlock, step >= 2, tl, 0.3, anim);
    show(totalLabel, step >= 2, tl, 0.45, anim);
    foot.show(step >= 2 ? src : null, anim, tl, 0.45);
    return tl;
  }
  return { go, dispose() { gsap.killTweensOf(st); } };
});
