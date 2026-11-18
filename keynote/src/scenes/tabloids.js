// tabloids (calm-b, PAPER turning loud): meanwhile, in the headlines. Rogue agents, superintelligence, the backlash.
// Step 0: eight real tabloid and press clippings slam in one after another (a fast drop, power4.in: they hit the
//         table and stop dead, no bounce), at angles, piling up and overlapping toward the middle.
// Step 1: the pile freezes into a wall: every clipping straightens and snaps to a three-column wall.
//         Footer: PRESS chip, the outlets and the date range.
// Final beat (director, 17:15): two headlines lift out of the dimmed wall to a legible size, side by side:
//         The Sun ("AI could wipe out humanity in 3 years") and the NY Post ("OpenAI sued by California after
//         80 incidents"). With a 3rd step in beats ("Two headlines up close") it is its own step; with 2 steps
//         the wall holds 1.2 s on step 1, then the two come forward.
// Crops (image px) keep masthead + headline: they skip the blank slots where ads were hidden, the NY Post's
// unrelated "trending" strip and long lead photos. Captures from captures.json only (director's curation).
import { gsap } from 'gsap';
import { calmScene } from './_calm/kit.js';
import { actLine, ensureCSS, capCard, dayOf } from './_calm-b/kit.js';

const CLIPS = [
  { id: 'thesun-ai-wipe-out-humanity', segs: [[0, 208], [689, 1060]] },
  { id: 'nypost-california-sues-openai', segs: [[36, 219], [461, 800]] },
  { id: 'bbc-australia-rogue-ai', segs: [[40, 457]] },
  { id: 'nypost-ai-apocalypse-fever', segs: [[36, 219], [271, 668]] },
  { id: 'cnbc-crowdstrike-rogue-agents', segs: [[0, 146], [533, 868]] },
  { id: 'venturebeat-gpt-62-unusable', segs: [[36, 99], [290, 825]] },
  { id: 'thesun-bosses-ai-job-cuts', segs: [[0, 208], [688, 1000]] },
  { id: 'ap-everything-broken', segs: [[0, 88], [184, 524]] },
];

export default calmScene('tabloids', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const rnd = ctx.random; // seeded per moment: the same pile every time

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192, T.spanW(10));

  // ----- cards -----
  const COLS = 3;
  const GAP = 28;
  const CW = Math.floor((1920 - 2 * M - GAP * (COLS - 1)) / COLS);
  const cards = [];
  CLIPS.forEach((spec) => {
    const c = capCard(ctx, spec.id, { width: CW, segs: spec.segs, ground: g, caption: false });
    if (!c) return;
    place(c.el, 0, 0, CW);
    c.el.style.transformOrigin = '50% 50%';
    K.owned.push(c);
    cards.push({ c, h: c.height || 180, id: spec.id, m: c.meta || {} });
  });

  // WALL: masonry, each card to the shortest column (in slam order), columns centred in y 316–944
  const colH = Array(COLS).fill(0);
  const wall = cards.map((x) => {
    let k = 0;
    for (let i = 1; i < COLS; i++) if (colH[i] < colH[k] - 0.5) k = i;
    const pos = { col: k, x: M + k * (CW + GAP), y: colH[k] };
    colH[k] += x.h + GAP;
    return pos;
  });
  const TOP = 316;
  const room = 944 - TOP;
  // each column is centred on its own in 316–944, so a short column floats instead of leaving a hole at the bottom
  wall.forEach((p, i) => {
    const h = colH[p.col] - GAP;
    p.y += TOP + Math.max(0, Math.round((room - h) / 2));
    p.cx = p.x + CW / 2;
    p.cy = p.y + cards[i].h / 2;
  });

  // PILE: pulled toward the middle, bigger, at angles (±2–3.5°), overlapping
  const MIDX = 960;
  const MIDY = TOP + room / 2;
  const pile = wall.map((p, i) => {
    const sgn = i % 2 ? 1 : -1;
    return {
      dx: (MIDX - p.cx) * 0.2 + (rnd() - 0.5) * 90,
      dy: (MIDY - p.cy) * 0.22 + (rnd() - 0.5) * 60,
      rot: sgn * (2 + rnd() * 1.5),
      scale: 1.06 + rnd() * 0.06,
    };
  });
  const WALL_ROT = wall.map(() => (rnd() - 0.5) * 1.2); // a pinned cutting, never perfectly square (≤ 0.6°)

  cards.forEach((x, i) => { x.c.el.style.left = `${wall[i].x}px`; x.c.el.style.top = `${wall[i].y}px`; x.c.el.style.zIndex = String(10 + i); });

  const pileState = (i) => ({ x: pile[i].dx, y: pile[i].dy, rotation: pile[i].rot, scale: pile[i].scale });
  const wallState = (i) => ({ x: 0, y: 0, rotation: WALL_ROT[i], scale: 1 });

  // LIFT (the final beat): two headlines come forward at a legible size over the dimmed wall
  const LIFT_IDS = ['thesun-ai-wipe-out-humanity', 'nypost-california-sues-openai'];
  let lifted = LIFT_IDS.map((id) => cards.findIndex((x) => x.id === id)).filter((i) => i >= 0);
  if (lifted.length < 2) lifted = [0, 1].filter((i) => i < cards.length);
  const LW = 812;
  const LGAP = 40;
  const LCY = 630;
  const liftPos = new Map(lifted.map((ci, j) => {
    const s = LW / CW;
    const tx = M + j * (LW + LGAP);
    return [ci, { x: tx + LW / 2 - wall[ci].cx, y: LCY - wall[ci].cy, rotation: j ? 0.6 : -0.6, scale: s }];
  }));
  const liftState = (i) => liftPos.get(i) || wallState(i);
  const veil = document.createElement('div');
  place(veil, 0, 0, 1920, 1080);
  Object.assign(veil.style, { background: G.bg, zIndex: '40', pointerEvents: 'none' });
  gsap.set(veil, { autoAlpha: 0 });
  [kicker.el, title.el].forEach((e) => { e.style.zIndex = '60'; });

  const nSteps = Math.max(1, (ctx.beat.steps || []).length);
  // 3 steps: pile · wall · lift. 2 steps (until beats gains "Two headlines up close"): pile · wall then lift.
  const stateOf = (step) => (step <= 0 ? 'pile' : nSteps >= 3 ? (step >= 2 ? 'lift' : 'wall') : 'lift');
  const VEIL = 0.9;

  // ----- footer: outlets and date range -----
  const outlets = [...new Set(cards.map((x) => x.m.outlet).filter(Boolean))];
  const days = cards.map((x) => String(x.m.published || '').slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  let range = '';
  if (days.length) {
    const [a, b] = [days[0], days[days.length - 1]];
    const da = dayOf(a), db = dayOf(b);
    range = a.slice(0, 7) === b.slice(0, 7) ? `${+a.slice(8)}–${db}` : `${da} – ${db}`;
    if (a === b) range = db;
  }
  const foot = K.footer();
  foot.c.el.style.zIndex = '60'; // the source line stays above the veil
  const src = outlets.length ? { kind: 'press', text: [outlets.join(' · '), range].filter(Boolean).join(' · ') } : null;

  let shownCards = false;
  let state = null; // 'pile' | 'wall' | 'lift'
  const stateFn = { pile: pileState, wall: wallState, lift: liftState };

  function settleTo(st, tl) {
    cards.forEach((x, i) => {
      gsap.killTweensOf(x.c.el);
      x.c.set({ visible: true }, { animate: false });
      gsap.set(x.c.el, { autoAlpha: 1, ...stateFn[st](i) });
      x.c.el.style.zIndex = String(st === 'lift' && liftPos.has(i) ? 50 : 10 + i);
    });
    gsap.killTweensOf(veil);
    gsap.set(veil, { autoAlpha: st === 'lift' ? VEIL : 0 });
    shownCards = true;
    state = st;
    foot.show(st === 'pile' ? null : src, false, tl);
  }

  function toWall(tl, at) {
    cards.forEach((x, i) => { tl.to(x.c.el, { ...wallState(i), duration: 1.0, ease: 'power3.inOut' }, at + i * 0.035); });
  }
  function toLift(tl, at) {
    tl.to(veil, { autoAlpha: VEIL, duration: 0.7, ease: 'sine.inOut' }, at);
    lifted.forEach((ci, j) => {
      const el = cards[ci].c.el;
      tl.add(() => { el.style.zIndex = '50'; }, at);
      tl.to(el, { ...liftState(ci), duration: 1.0, ease: 'power3.inOut' }, at + 0.1 + j * 0.12);
    });
  }
  function fromLift(tl, at, target) {
    tl.to(veil, { autoAlpha: 0, duration: 0.5, ease: 'sine.inOut' }, at);
    lifted.forEach((ci) => {
      const el = cards[ci].c.el;
      tl.to(el, { ...stateFn[target](ci), duration: 0.8, ease: 'power3.inOut' }, at);
      tl.add(() => { el.style.zIndex = String(10 + ci); }, at + 0.8);
    });
  }

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    tl.add(kicker.set({ visible: true }, { animate: anim }), 0);
    tl.add(title.set({ visible: true }, { animate: anim }), anim ? 0.08 : 0);
    const want = stateOf(step);

    if (!anim) { settleTo(want, tl); return tl; }

    let t = 0;
    if (info.entering || !shownCards) {
      // the slams. CaptureCard.set() kills tweens on its element, so every card is made visible NOW (before its
      // tween exists) and the slam's from-state (autoAlpha 0, rendered immediately) hides it until its turn.
      gsap.set(veil, { autoAlpha: 0 });
      cards.forEach((x, i) => {
        const p = pileState(i);
        const at = 0.55 + i * 0.3;
        gsap.killTweensOf(x.c.el);
        x.c.el.style.zIndex = String(10 + i);
        x.c.set({ visible: true }, { animate: false });
        tl.fromTo(x.c.el,
          { autoAlpha: 0, x: p.x * 1.4 + (i % 2 ? 140 : -140), y: p.y - 70, rotation: p.rotation * 2.4, scale: p.scale * 1.38 },
          { autoAlpha: 1, x: p.x, y: p.y, rotation: p.rotation, scale: p.scale, duration: 0.3, ease: 'power4.in', immediateRender: true }, at);
      });
      shownCards = true;
      state = 'pile';
      t = 0.55 + cards.length * 0.3 + 0.4;
      if (want === 'pile') t = 0;
    }
    if (want !== state) {
      if (state === 'pile') {
        toWall(tl, t + 0.1);
        if (want === 'lift') toLift(tl, t + 0.1 + 1.0 + 1.2); // the wall holds a beat, then two headlines come forward
      } else if (state === 'wall') {
        if (want === 'lift') toLift(tl, 0.1);
        else cards.forEach((x, i) => tl.to(x.c.el, { ...pileState(i), duration: 0.8, ease: 'power3.inOut' }, i * 0.03));
      } else if (state === 'lift') {
        fromLift(tl, 0, want === 'pile' ? 'pile' : 'wall');
        if (want === 'pile') cards.forEach((x, i) => { if (!liftPos.has(i)) tl.to(x.c.el, { ...pileState(i), duration: 0.8, ease: 'power3.inOut' }, i * 0.03); });
      }
      state = want;
    }
    foot.show(want === 'pile' ? null : src, true, tl, 0.9);
    return tl;
  }
  return { go };
});
