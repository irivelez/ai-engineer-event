// rules (calm-b, PAPER calm): the binding rules now land on deployment, not training. One step, three rows.
// Each row: a 2 px rule, the jurisdiction and date in mono caps, the rule itself in a sentence. The US row has
// the CNBC clipping beside it (the "super intelligence" rebrand on earnings calls), with its PRESS chip.
// All three rules are primary texts: one OFFICIAL chip in the footer names the three publishers and dates
// (compact, one line).
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { actLine, ensureCSS, sourceOf, capCard, capMeta, srcHTML, fmtDate, accentWord, clearAccent } from './_calm-b/kit.js';

const CLIP = { id: 'cnbc-superintelligence-earnings', segs: [[0, 146], [533, 976]] };

// 'EU AI Act · since 2 Aug: disclose …' → ['EU AI Act · since 2 Aug', 'disclose …'];
// 'United States · chip access …' (no colon) → ['United States', 'chip access …']
function splitRule(s) {
  const t = String(s || '');
  const c = t.indexOf(': ');
  if (c > 0) return [t.slice(0, c), t.slice(c + 2)];
  const d = t.indexOf(' · ');
  return d > 0 ? [t.slice(0, d), t.slice(d + 3)] : ['', t];
}

export default calmScene('rules', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const TW = T.spanW(8);

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const hl = /\bdeployment\b/.exec(String(copy.title || ''));
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192, T.spanW(10));

  const TOP = 440;
  const rows = (copy.items || []).slice(0, 3).map((s) => {
    const [head, body] = splitRule(s);
    const row = el('div', '');
    place(row, M, TOP, TW);
    const rule = el('div', '', row);
    Object.assign(rule.style, { position: 'absolute', left: '0', top: '0', width: `${TW}px`, height: '2px', background: G.rule, transformOrigin: '0 50%' });
    const h = el('div', 't-label', row, esc(head));
    Object.assign(h.style, { position: 'absolute', left: '0', top: '22px', color: G.fg, whiteSpace: 'nowrap' });
    const b = el('div', 'cb-body40 pretty', row, esc(body));
    Object.assign(b.style, { position: 'absolute', left: '0', top: '72px', width: `${TW}px`, color: G.fg });
    const blk = K.block(row, {
      enter(tl) {
        tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0);
        tl.fromTo(h, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'expo.out' }, 0.1);
        tl.fromTo(b, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0.2);
      },
      settle() { gsap.set(rule, { scaleX: 1 }); gsap.set(h, { clipPath: 'none' }); gsap.set(b, { autoAlpha: 1, y: 0 }); },
    });
    return { row, b, blk };
  });
  let rowTops = [];
  function layout() {
    let y = TOP;
    rowTops = [];
    rows.forEach((r) => {
      rowTops.push(y);
      r.row.style.top = `${y}px`;
      y += 72 + Math.max(52, r.b.offsetHeight) + 32;
    });
    placeClip();
  }

  // ----- the CNBC clipping beside the US row -----
  const CX = T.colX(8) + 64;
  const CW = 1920 - M - CX;
  let clip = null;
  const card = capCard(ctx, CLIP.id, { width: CW, segs: CLIP.segs, ground: g, caption: false });
  if (card) {
    const wrap = el('div', '');
    wrap.appendChild(card.el);
    const m = card.meta || {};
    const cap = el('div', 'cb-src', wrap, srcHTML(C, { kind: 'press', text: [m.outlet, capMeta(m).date].filter(Boolean).join(' · ') }));
    cap.classList.add(`ground-${g}`);
    cap.style.marginTop = '16px';
    place(wrap, CX, TOP, CW);
    clip = {
      wrap, h: (card.height || 200) + 60,
      blk: K.block(wrap, {
        enter(tl) { card.set({ visible: true }, { animate: false }); tl.fromTo(wrap, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0); },
        settle() { card.set({ visible: true }, { animate: false }); },
      }),
    };
  }
  function placeClip() {
    if (!clip || !rows.length) return;
    const i = rows.length - 1;
    const top = rowTops[i] ?? TOP;
    const rowH = 72 + Math.max(52, rows[i].b.offsetHeight);
    const y = Math.min(944 - clip.h, Math.round(top + rowH / 2 - clip.h / 2));
    clip.wrap.style.top = `${Math.max(TOP, y)}px`;
  }
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  // ----- footer: one OFFICIAL chip, three primary sources -----
  const foot = K.footer();
  // compact: 'European Commission 31 Jul · Xinhua 15 Jul · Federal Register via govinfo 2 Oct 2026' (one year when
  // all three share it), so the three primary sources fit the footer band on one line
  const srcs = (ctx.beat.facts || []).map((id) => sourceOf(ctx, id)).filter(Boolean);
  const pubs = srcs.map((s) => {
    const f = s.fact || {};
    const pub = (f.source && f.source.publisher) || s.text.split(' · ')[0];
    const day = fmtDate((f.source && f.source.date) || f.asOf || '');
    return { pub, day, year: (day.match(/\d{4}$/) || [''])[0] };
  });
  const oneYear = pubs.length && pubs.every((p) => p.year && p.year === pubs[0].year);
  const src = srcs.length ? {
    kind: srcs[0].kind,
    text: pubs.map((p, i) => `${p.pub} ${oneYear && i < pubs.length - 1 ? p.day.replace(/\s\d{4}$/, '') : p.day}`.trim()).join(' · '),
  } : null;

  const parts = [
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    ...rows.map((r, i) => ({ c: r.blk, on: () => true, at: 0.5 + i * 0.3 })),
  ];
  if (clip) parts.push({ c: clip.blk, on: () => true, at: 1.6 });
  const apply = K.stepper(parts);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    clearAccent(title.el);
    apply(step, anim, tl, info);
    accentWord(title.el, hl && hl[0]); // after the line split, so "deployment," keeps its spacing
    foot.show(src, anim, tl, 1.3);
    return tl;
  }
  return { go };
});
