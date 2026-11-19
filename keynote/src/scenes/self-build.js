// self-build (calm-a, PAPER data): AI is now building AI, inside one lab. One hero number per step, display
// size (DevDay's one-number frame), its sentence at lead size under it; each step's number replaces the last.
// Step 0: >90 % of merged changes, with people guiding the work.
// Step 1: ~26 % of AI R&D led by Claude; a full-width 0–100 % track shows the climb from <1 % (Feb) to ~26 % (Aug).
// Step 2: ~2× faster progress, mostly from AI (METR's outside estimate, Oct 2026), and the caveat.
// Evidence (src/data/evidence.json): step 0 shows Anthropic's own sentence beside the number; step 1 shows
// Anthropic's own chart in place of the drawn track. While an artifact is on screen, its meta block carries the
// chip, the source and a QR to the page, so the footer source line steps aside (one chip per frame).
import { gsap } from 'gsap';
import { calmScene, el, esc, factSource } from './_calm/kit.js';
import { evItem, evDoc } from './_evb-kit.js';

export default calmScene('self-build', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const W = 1920 - 2 * M;
  const S1 = copy.s1 || {};
  const S2 = copy.s2 || {};
  const S3 = copy.s3 || {};
  const nb = (x) => String(x || '').replace(/ /g, ' ');

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192);

  // the real artifacts, right column (columns 6–11); the number and its sentence keep columns 0–5
  const RX = T.colX(6);
  const RW = T.spanW(6);
  const ev0 = evItem(ctx, 'self-build-anthropic-90-merged');
  const ev1 = evItem(ctx, 'self-build-anthropic-rd-chart');
  // the first sentence ("Over 90% … (with human guidance).") boxed; the chart shows its own title and notes
  const d0 = ev0 ? evDoc(ctx, K, ev0, { width: RW, crop: [0, 0.03, 1, 1], hl: [0.03, 0.065, 0.94, 0.2], title: false, link: false }) : null;
  const d1 = ev1 ? evDoc(ctx, K, ev1, { width: RW, title: false, link: false }) : null;
  if (d0) place(d0.el, RX, 300);
  if (d1) place(d1.el, RX, 136);

  const NY = 336;
  const LY = NY + 240;
  const hero = (value, label, extraHTML = '', labelW = T.spanW(10)) => {
    const box = el('div', '');
    place(box, M, NY, W);
    const num = C.BigNumber.create({ display: nb(value), size: 'display', ground: g });
    box.appendChild(num.el);
    K.owned.push(num);
    const lab = el('div', 't-lead balance', box, esc(label));
    Object.assign(lab.style, { marginTop: '24px', maxWidth: `${labelW}px`, color: G.fg });
    const extra = extraHTML ? el('div', '', box, extraHTML) : null;
    const b = K.block(box, {
      enter(tl) {
        tl.add(num.set({ visible: true }, { animate: true }), 0);
        tl.fromTo([lab, extra].filter(Boolean), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease, stagger: 0.14 }, 0.3);
      },
      settle() { num.set({ visible: true }, { animate: false }); gsap.set([lab, extra].filter(Boolean), { autoAlpha: 1, y: 0 }); },
      hide() { num.set({ visible: false }, { animate: false }); },
    });
    b.extra = extra;
    return b;
  };

  // step 1's climb: a 0–100 % track across the frame, the accent fill grows from <1 % (Feb) to ~26 % (Aug)
  const pct = (s) => Math.max(0.8, parseFloat(String(s).replace(/[^\d.]/g, '')) || 0);
  const p0 = pct(S2.from);
  const p1 = pct(S2.to);
  const climbHTML =
    `<div style="position:relative;height:132px;margin-top:40px;width:${W}px">` +
    `<div class="t-label" style="position:absolute;left:0;top:0;color:${G.muted};white-space:nowrap">${esc(S2.from || '')} · ${esc(S2.fromDate || '')}</div>` +
    `<div style="position:absolute;left:0;right:0;top:52px;height:16px;border-radius:8px;background:${G.rule}"></div>` +
    `<div class="ca-fill" style="position:absolute;left:0;top:52px;height:16px;border-radius:8px;background:${G.accent};width:${p1}%"></div>` +
    `<div class="ca-tolab t-label" style="position:absolute;top:88px;left:calc(${p1}% - 8px);color:${G.fg};white-space:nowrap">${esc(S2.to || '')} · ${esc(S2.toDate || '')}</div>` +
    `</div>`;
  // with Anthropic's chart on screen the drawn track goes; its two ends stay as one line under the sentence
  const endsHTML = `<div class="t-label" style="margin-top:28px;color:${G.muted}">${esc(S2.from || '')} · ${esc(S2.fromDate || '')} → ${esc(S2.to || '')} · ${esc(S2.toDate || '')}</div>`;
  const h1 = hero(S1.value, S1.label, `<div class="t-body" style="margin-top:16px;color:${G.muted}">${esc(S1.note || '')}</div>`, d0 ? T.spanW(6) : undefined);
  const h2 = d1 ? hero(S2.to, S2.label, endsHTML, T.spanW(6)) : hero(S2.to, S2.label, climbHTML);
  // full-width label: two lines instead of three, so the note ends above the caveat at y 872 (they overlapped)
  const h3 = hero(S3.value, S3.label, S3.note ? `<div class="t-body" style="margin-top:16px;color:${G.muted}">${esc(S3.note)}</div>` : "", W);
  const fill = h2.el.querySelector('.ca-fill');
  const toLab = h2.el.querySelector('.ca-tolab');

  const caveat = el('div', '');
  place(caveat, M, 872, W);
  Object.assign(caveat.style, { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '40px', lineHeight: '48px', color: G.fg });
  caveat.innerHTML = esc(copy.caveat || '');
  const caveatB = K.block(caveat, { rise: 16 });

  const foot = K.footer();
  const src = [factSource(ctx, 'claude-90-merged'), factSource(ctx, 'claude-rd-26'), factSource(ctx, 'metr-anthropic-2x')];

  const parts = [
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: h1, on: (s) => s === 0, at: 0.3 },
    { c: h2, on: (s) => s === 1, at: 0.05 },
    { c: h3, on: (s) => s === 2, at: 0.05 },
    { c: caveatB, on: (s) => s >= 2, at: 0.9 },
  ];
  if (d0) parts.push({ c: d0, on: (s) => s === 0, at: 0.7 });
  if (d1) parts.push({ c: d1, on: (s) => s === 1, at: 0.45 });
  const apply = K.stepper(parts);
  const docOn = (s) => (s === 0 && d0) || (s === 1 && d1);

  function climb(step, anim, tl, entering) {
    if (step !== 1 || !fill || !toLab) return;
    if (anim && entering) {
      tl.fromTo(fill, { width: `${p0}%` }, { width: `${p1}%`, duration: 1.8, ease: 'power2.inOut' }, 1.0);
      tl.fromTo(toLab, { autoAlpha: 0, left: `calc(${p0}% - 8px)` }, { autoAlpha: 1, left: `calc(${p1}% - 8px)`, duration: 1.8, ease: 'power2.inOut' }, 1.0);
    } else if (!anim) {
      gsap.set(fill, { width: `${p1}%` });
      gsap.set(toLab, { autoAlpha: 1, left: `calc(${p1}% - 8px)` });
    }
  }

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    const entering2 = step === 1 && !h2.shown;
    apply(step, anim, tl, info);
    climb(step, anim, tl, entering2);
    foot.show(docOn(step) ? null : src[Math.min(step, 2)], anim, tl, 0.6);
    return tl;
  }
  return { go };
});
