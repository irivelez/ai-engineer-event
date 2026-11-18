// x-voices (calm-b, PAPER collage): on X this month, the posts that moved the conversation, with their real reach.
// One real post per step, large and sharp on the right (shown at ≤ 1:1 so it stays crisp). On the left its
// view count, echoed big in Geist Mono from captures.json (the exact integer), rolling from the previous
// post's count; under it the capture date (counts move), the author and the post date. Footer: an OFFICIAL
// chip (the platform's own counter) and the post's URL. Long posts are cropped to their key paragraphs.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { actLine, ensureCSS, capCard, dayOf, authorParts } from './_calm-b/kit.js';

// Director's curation and order (18 Nov). segs in image px; karpathy: first and last paragraph.
const POSTS = [
  { id: 'x-sama-control-of-the-future', segs: null },
  { id: 'x-openai-securing-training-environment', segs: [[0, 685]] },
  { id: 'x-sundarpichai-gemini-4-carbon', segs: [[0, 499]] },
  { id: 'x-karpathy-hackertube', segs: [[0, 253], [880, 995]] },
  { id: 'x-satyanadella-agentic-insider', segs: null },
];

const CSS = `
.cb-xv-num .bn-figure { font-family: var(--f-mono); font-size: 112px; font-weight: 500; letter-spacing: -0.03em; }
`;

export default calmScene('x-voices', (ctx, K) => {
  ensureCSS();
  if (!document.getElementById('calm-b-xv-css')) { const s = document.createElement('style'); s.id = 'calm-b-xv-css'; s.textContent = CSS; document.head.appendChild(s); }
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const nSteps = Math.max(1, (ctx.beat.steps || []).length);

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(6) }), M, 192, T.spanW(6));

  // ----- the posts that exist in this build, in order -----
  const CARD_W = 868;
  const CARD_X = 1920 - M - CARD_W;
  const posts = [];
  POSTS.forEach((p) => {
    const card = capCard(ctx, p.id, { width: CARD_W, segs: p.segs, ground: g, caption: false });
    if (!card) return;
    const m = card.meta || {};
    const a = authorParts(m.author);
    const h = card.height || 600;
    const y = Math.round(176 + Math.max(0, (944 - 176 - h) / 2));
    place(card.el, CARD_X, y, CARD_W);
    K.owned.push(card);
    posts.push({ card, m, a, views: (m.counts && m.counts.views) || 0 });
  });
  const post = (step) => posts[Math.min(step, posts.length - 1)] || null;

  // ----- left panel: the count, the capture date, the author -----
  const NUM_Y = 392;
  const first = post(0);
  const num = K.add(C.BigNumber.create({ value: first ? first.views : 0, size: 'h1', ground: g, className: 'cb-xv-num' }), M, NUM_Y, 760);
  const lab = el('div', 't-label', null, '');
  lab.style.color = G.muted;
  place(lab, M, NUM_Y + 136, 760);
  const name = el('div', 't-lead', null, '');
  Object.assign(name.style, { color: G.fg, fontWeight: '600' });
  place(name, M, NUM_Y + 236, 760);
  const handle = el('div', 't-label', null, '');
  handle.style.color = G.muted;
  place(handle, M, NUM_Y + 316, 760);
  const meta = el('div', '');
  place(meta, 0, 0, 1920, 1080);
  meta.append(lab, name, handle);
  const fill = (p) => {
    if (!p) return;
    lab.textContent = [copy.countsLabel, p.m.captured_at ? `captured ${dayOf(p.m.captured_at)}` : ''].filter(Boolean).join(' · ');
    name.textContent = p.a.name;
    handle.textContent = [p.a.handle, dayOf(p.m.published)].filter(Boolean).join(' · ');
  };
  fill(first);
  const metaB = K.block(meta, { rise: 16 });

  const foot = K.footer();
  let cur = -1;

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    const k = Math.min(step, posts.length - 1);
    const p = post(step);
    tl.add(kicker.set({ visible: true }, { animate: anim }), 0);
    tl.add(title.set({ visible: true }, { animate: anim }), anim ? 0.08 : 0);
    if (!p) return tl;
    const prev = cur;
    cur = k;

    if (!anim) {
      posts.forEach((q, i) => { gsap.killTweensOf(q.card.el); q.card.set({ visible: i === k }, { animate: false }); gsap.set(q.card.el, { x: 0 }); });
      gsap.killTweensOf([lab, name, handle]);
      gsap.set([lab, name, handle], { autoAlpha: 1, y: 0 });
      tl.add(num.set({ visible: true }, { animate: false }), 0);
      tl.add(num.set({ value: p.views }, { animate: false }), 0);
      fill(p);
      tl.add(metaB.set({ visible: true }, { animate: false }), 0);
      foot.show({ kind: 'official', text: String(p.m.url || '').replace(/^https?:\/\//, '') }, false, tl);
      return tl;
    }

    // cards: the old one slides out to the left, the new one lands from the right
    posts.forEach((q, i) => {
      if (i === k && (prev !== k || !q.card.shown)) {
        tl.add(() => { q.card.set({ visible: true }, { animate: false }); }, 0.3);
        tl.fromTo(q.card.el, { autoAlpha: 0, x: 120, rotation: 0 }, { autoAlpha: 1, x: 0, duration: 1.1, ease: 'expo.out', immediateRender: false }, 0.3);
      } else if (i !== k && q.card.shown) {
        tl.to(q.card.el, { autoAlpha: 0, x: -80, duration: 0.45, ease: 'power2.in' }, 0);
        tl.add(() => { q.card.set({ visible: false }, { animate: false }); gsap.set(q.card.el, { x: 0 }); }, 0.46);
      }
    });
    // the number rolls from the previous count
    if (!num.shown) { num.set({ value: p.views }, { animate: false }); gsap.set(num.el, { autoAlpha: 0 }); tl.add(num.set({ visible: true }, { animate: true }), 0.4); }
    else tl.add(num.set({ value: p.views }, { animate: true }), 0.45);
    // the meta swaps under it
    if (!metaB.shown) { fill(p); tl.add(metaB.set({ visible: true }, { animate: true }), 0.7); }
    else {
      tl.to([lab, name, handle], { autoAlpha: 0, y: -8, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, 0.1);
      tl.add(() => fill(p), 0.45);
      tl.fromTo([lab, name, handle], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06, immediateRender: false }, 0.6);
    }
    foot.show({ kind: 'official', text: String(p.m.url || '').replace(/^https?:\/\//, '') }, true, tl, 0.9);
    return tl;
  }
  return { go };
});
