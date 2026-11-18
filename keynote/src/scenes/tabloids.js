// tabloids (calm-b, PAPER turning loud): meanwhile, in the headlines. Rogue agents, superintelligence, the backlash.
// Step 0: eight real tabloid and press clippings slam in one after another (a fast drop, power4.in: they hit the
//         table and stop dead, no bounce), at angles, piling up and overlapping toward the middle.
// Step 1: the pile freezes into a wall: every clipping straightens and snaps to a three-column wall where each
//         headline can be read. Footer: PRESS chip, the outlets and the date range.
// Crops (image px) keep masthead + headline: they skip the blank slots where ads were hidden, the NY Post's
// unrelated "trending" strip and long lead photos. Captures from captures.json only (director's curation).
import { gsap } from 'gsap';
import { calmScene } from './_calm/kit.js';
import { actLine, ensureCSS, capCard, dayOf } from './_calm-b/kit.js';

const CLIPS = [
  { id: 'thesun-ai-wipe-out-humanity', segs: [[0, 208], [689, 1060]] },
  { id: 'nypost-california-sues-openai', segs: [[36, 219], [461, 776]] },
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
  const tallest = Math.max(...colH.map((h) => h - GAP), 0);
  const y0 = TOP + Math.max(0, Math.round((room - tallest) / 2));
  wall.forEach((p, i) => { p.y += y0; p.cx = p.x + CW / 2; p.cy = p.y + cards[i].h / 2; });

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
  const src = outlets.length ? { kind: 'press', text: [outlets.join(' · '), range].filter(Boolean).join(' · ') } : null;

  let shownCards = false;
  let state = null; // 'pile' | 'wall'

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    tl.add(kicker.set({ visible: true }, { animate: anim }), 0);
    tl.add(title.set({ visible: true }, { animate: anim }), anim ? 0.08 : 0);
    const want = step >= 1 ? 'wall' : 'pile';

    if (!anim) {
      cards.forEach((x, i) => {
        x.c.set({ visible: true }, { animate: false });
        gsap.killTweensOf(x.c.el);
        gsap.set(x.c.el, { autoAlpha: 1, ...(want === 'wall' ? wallState(i) : pileState(i)) });
      });
      shownCards = true;
      state = want;
      foot.show(want === 'wall' ? src : null, false, tl);
      return tl;
    }

    if (info.entering || !shownCards) {
      cards.forEach((x) => { gsap.killTweensOf(x.c.el); x.c.set({ visible: false }, { animate: false }); });
      // the slams
      cards.forEach((x, i) => {
        const p = pileState(i);
        const at = 0.55 + i * 0.3;
        tl.add(() => { x.c.set({ visible: true }, { animate: false }); }, at); // same tick as the tween's first render: no settled frame flashes
        tl.fromTo(x.c.el,
          { autoAlpha: 0, x: p.x * 1.4 + (i % 2 ? 140 : -140), y: p.y - 70, rotation: p.rotation * 2.4, scale: p.scale * 1.38 },
          { autoAlpha: 1, x: p.x, y: p.y, rotation: p.rotation, scale: p.scale, duration: 0.3, ease: 'power4.in', immediateRender: false }, at);
      });
      shownCards = true;
      state = 'pile';
    }
    if (want !== state) {
      if (want === 'wall' && state === 'pile') {
        cards.forEach((x, i) => tl.to(x.c.el, { ...wallState(i), duration: 1.0, ease: 'power3.inOut' }, 0.1 + i * 0.035));
      } else if (want === 'pile' && state === 'wall') {
        cards.forEach((x, i) => tl.to(x.c.el, { ...pileState(i), duration: 0.8, ease: 'power3.inOut' }, i * 0.03));
      }
      state = want;
    }
    foot.show(want === 'wall' ? src : null, true, tl, 0.9);
    return tl;
  }
  return { go };
});
