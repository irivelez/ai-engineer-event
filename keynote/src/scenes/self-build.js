// self-build (calm-a, PAPER data): AI is now building AI, inside one lab. Three stat tiles land one per step
// (DevDay tile trio); the earlier tiles step back to muted so the new number is the only one in ink.
// Step 0: >90 % of merged changes.  Step 1: ~26 % of AI R&D led by Claude, with the climb from <1 % (Feb) on a
// 0–100 % track.  Step 2: ~30,000 agents, and the caveat in the lab's own words.
import { gsap } from 'gsap';
import { calmScene, el, esc, factSource } from './_calm/kit.js';

export default calmScene('self-build', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const S1 = copy.s1 || {};
  const S2 = copy.s2 || {};
  const S3 = copy.s3 || {};
  const nb = (x) => String(x || '').replace(/ /g, ' ');

  const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192);

  const TY = 372;
  const TW = T.spanW(4);
  const tile = (i, value, label, extraHTML = '') => {
    const x = T.colX(i * 4);
    const box = el('div', '');
    place(box, x, TY, TW);
    const num = C.BigNumber.create({ display: nb(value), size: 'h1', ground: g });
    box.appendChild(num.el);
    K.owned.push(num);
    const rule = el('div', '', box);
    Object.assign(rule.style, { height: '2px', width: '100%', background: G.rule, margin: '28px 0 24px', transformOrigin: '0 50%' });
    const lab = el('div', 'ca-sans40 pretty', box, esc(label));
    lab.style.color = G.fg;
    const extra = extraHTML ? el('div', '', box, extraHTML) : null;
    const parts = [rule, lab, extra].filter(Boolean);
    const b = K.block(box, {
      enter(tl) {
        tl.add(num.set({ visible: true }, { animate: true }), 0);
        tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0.2);
        tl.fromTo([lab, extra].filter(Boolean), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease, stagger: 0.12 }, 0.35);
      },
      settle() { num.set({ visible: true }, { animate: false }); gsap.set(rule, { scaleX: 1 }); gsap.set([lab, extra].filter(Boolean), { autoAlpha: 1, y: 0 }); },
      hide() { num.set({ visible: false }, { animate: false }); },
    });
    b.num = num;
    b.lab = lab;
    b.parts = parts;
    return b;
  };

  // tile 2's climb: a 0–100 % track, accent fill grows from <1 % (Feb) to ~26 % (Aug)
  const pct = (s) => Math.max(0.8, parseFloat(String(s).replace(/[^\d.]/g, '')) || 0);
  const p0 = pct(S2.from);
  const p1 = pct(S2.to);
  const climbHTML =
    `<div class="ca-climb" style="position:relative;height:96px;margin-top:28px">` +
    `<div style="position:absolute;left:0;right:0;top:44px;height:12px;border-radius:6px;background:${G.rule}"></div>` +
    `<div class="ca-fill" style="position:absolute;left:0;top:44px;height:12px;border-radius:6px;background:${G.accent};width:${p1}%"></div>` +
    `<div class="t-source" style="position:absolute;left:0;top:0;color:${G.muted};white-space:nowrap">${esc(S2.from || '')} · ${esc(S2.fromDate || '')}</div>` +
    `<div class="ca-tolab t-source" style="position:absolute;top:68px;left:calc(${p1}% - 8px);color:${G.fg};white-space:nowrap">${esc(S2.to || '')} · ${esc(S2.toDate || '')}</div>` +
    `</div>`;
  const t1 = tile(0, S1.value, S1.label, `<div class="ca-sans40" style="margin-top:16px;color:${G.muted}">${esc(S1.note || '')}</div>`);
  const t2 = tile(1, S2.to, S2.label, climbHTML);
  const t3 = tile(2, S3.value, S3.label);
  const fill = t2.el.querySelector('.ca-fill');
  const toLab = t2.el.querySelector('.ca-tolab');

  const caveat = el('div', '');
  place(caveat, M, 872, T.spanW(12));
  Object.assign(caveat.style, { fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: '40px', lineHeight: '48px', color: G.fg });
  caveat.innerHTML = esc(copy.caveat || '');
  const caveatB = K.block(caveat, { rise: 16 });

  const foot = K.footer();
  const src = [factSource(ctx, 'claude-90-merged'), factSource(ctx, 'claude-rd-26'), factSource(ctx, 'anthropic-30000-agents')];

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    { c: t1, on: () => true, at: 0.3 },
    { c: t2, on: (s) => s >= 1, at: 0.1 },
    { c: t3, on: (s) => s >= 2, at: 0.1 },
    { c: caveatB, on: (s) => s >= 2, at: 1.0 },
  ]);

  // the newest tile is the only number in ink; older ones step back to muted (never opacity)
  function tone(step, anim, tl) {
    [t1, t2, t3].forEach((t, i) => {
      const fig = t.num.el.querySelector('.bn-figure');
      const c = i === step ? G.fg : G.muted;
      if (!fig) return;
      if (anim) tl.to([fig, t.lab], { color: c, duration: 0.4, ease: 'power3.out' }, 0);
      else gsap.set([fig, t.lab], { color: c });
    });
  }
  function climb(step, anim, tl, entering2) {
    if (step < 1) return;
    if (anim && entering2) {
      tl.fromTo(fill, { width: `${p0}%` }, { width: `${p1}%`, duration: 1.6, ease: 'power2.inOut' }, 0.9);
      tl.fromTo(toLab, { autoAlpha: 0, left: `calc(${p0}% - 8px)` }, { autoAlpha: 1, left: `calc(${p1}% - 8px)`, duration: 1.6, ease: 'power2.inOut' }, 0.9);
    } else if (!anim) {
      gsap.set(fill, { width: `${p1}%` });
      gsap.set(toLab, { autoAlpha: 1, left: `calc(${p1}% - 8px)` });
    }
  }

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    const entering2 = step === 1 && !t2.shown;
    apply(step, anim, tl, info);
    tone(step, anim, tl);
    climb(step, anim, tl, entering2);
    foot.show(src[Math.min(step, 2)], anim, tl, 0.6);
    return tl;
  }
  return { go };
});
