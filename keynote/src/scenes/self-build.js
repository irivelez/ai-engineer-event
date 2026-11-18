// self-build (calm-a, PAPER data): AI is now building AI, inside one lab. One hero number per step, display
// size (DevDay's one-number frame), its sentence at lead size under it; each step's number replaces the last.
// Step 0: >90 % of merged changes, with people guiding the work.
// Step 1: ~26 % of AI R&D led by Claude; a full-width 0–100 % track shows the climb from <1 % (Feb) to ~26 % (Aug).
// Step 2: ~30,000 agents at any time, and the caveat in the lab's own words.
import { gsap } from 'gsap';
import { calmScene, el, esc, factSource } from './_calm/kit.js';

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

  const NY = 336;
  const LY = NY + 240;
  const hero = (value, label, extraHTML = '') => {
    const box = el('div', '');
    place(box, M, NY, W);
    const num = C.BigNumber.create({ display: nb(value), size: 'display', ground: g });
    box.appendChild(num.el);
    K.owned.push(num);
    const lab = el('div', 't-lead balance', box, esc(label));
    Object.assign(lab.style, { marginTop: '24px', maxWidth: `${T.spanW(10)}px`, color: G.fg });
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
  const h1 = hero(S1.value, S1.label, `<div class="t-body" style="margin-top:16px;color:${G.muted}">${esc(S1.note || '')}</div>`);
  const h2 = hero(S2.to, S2.label, climbHTML);
  const h3 = hero(S3.value, S3.label);
  const fill = h2.el.querySelector('.ca-fill');
  const toLab = h2.el.querySelector('.ca-tolab');

  const caveat = el('div', '');
  place(caveat, M, 872, W);
  Object.assign(caveat.style, { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '40px', lineHeight: '48px', color: G.fg });
  caveat.innerHTML = esc(copy.caveat || '');
  const caveatB = K.block(caveat, { rise: 16 });

  const foot = K.footer();
  const src = [factSource(ctx, 'claude-90-merged'), factSource(ctx, 'claude-rd-26'), factSource(ctx, 'anthropic-30000-agents')];

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: h1, on: (s) => s === 0, at: 0.3 },
    { c: h2, on: (s) => s === 1, at: 0.05 },
    { c: h3, on: (s) => s === 2, at: 0.05 },
    { c: caveatB, on: (s) => s >= 2, at: 0.9 },
  ]);

  function climb(step, anim, tl, entering) {
    if (step !== 1) return;
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
    foot.show(src[Math.min(step, 2)], anim, tl, 0.6);
    return tl;
  }
  return { go };
});
