// roles (calm-b, PAPER): the three roles a company needs in 2027. Judgment stays human.
// Steps 0–2: one column per step (owner, verifier, operator), each on a 2 px rule; the accent bar travels to
//            the role being introduced, the earlier ones stay in ink.
// Step 3: the callback. The columns step back to muted; "Judgement is the last job." returns in serif.
import { gsap } from 'gsap';
import { calmScene, el, esc, unquote } from './_calm/kit.js';
import { actLine, ensureCSS, sourceOf } from './_calm-b/kit.js';

export default calmScene('roles', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const CW = T.spanW(4);

  const kicker = K.add(C.Kicker.create({ text: actLine(ctx), ground: g }), M, 120);
  const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(10) }), M, 192, T.spanW(10));

  const TOP = 440; // the three columns sit optically centred under the title (they rise at the callback)
  const cols = (copy.roles || []).slice(0, 3).map((r, i) => {
    const x = T.colX(i * 4);
    const box = el('div', '');
    place(box, x, TOP, CW, 420);
    const num = el('div', 't-label tnum', box, String(i + 1).padStart(2, '0'));
    Object.assign(num.style, { position: 'absolute', left: '0', top: '0', color: G.muted });
    const rule = el('div', '', box);
    Object.assign(rule.style, { position: 'absolute', left: '0', top: '64px', width: `${CW}px`, height: '2px', background: G.rule, transformOrigin: '0 50%' });
    const bar = el('div', '', box);
    Object.assign(bar.style, { position: 'absolute', left: '0', top: '63px', width: `${CW}px`, height: '4px', borderRadius: '2px', background: G.accent, transformOrigin: '0 50%' });
    const nameM = el('div', 'cb-mask', box);
    Object.assign(nameM.style, { position: 'absolute', left: '0', top: '104px', width: `${CW}px` });
    const name = el('div', 't-lead', nameM, esc(r.name || ''));
    Object.assign(name.style, { color: G.fg, fontWeight: '600' });
    const job = el('div', 'cb-body40 pretty', box, esc(r.job || ''));
    Object.assign(job.style, { position: 'absolute', left: '0', top: '200px', width: `${CW - 16}px`, color: G.muted });
    const blk = K.block(box, {
      enter(tl) {
        tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0);
        tl.fromTo(num, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 0.05);
        tl.fromTo(name, { yPercent: 120 }, { yPercent: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0.12);
        tl.fromTo(job, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0.35);
      },
      settle() { gsap.set(rule, { scaleX: 1 }); gsap.set(num, { autoAlpha: 1, y: 0 }); gsap.set(name, { yPercent: 0 }); gsap.set(job, { autoAlpha: 1, y: 0 }); },
    });
    return { blk, box, num, bar, name, job };
  });

  const quote = K.add(C.Quote.create({ text: unquote(copy.callback), ground: g, width: T.spanW(11), size: 96 }), M + 4, 806);

  const foot = K.footer();
  const qs = sourceOf(ctx, 'dey-judgement');

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: title, on: () => true, at: 0.08 },
    ...cols.map((c, i) => ({ c: c.blk, on: (s) => s >= i, at: 0.25 })),
    { c: quote, on: (s) => s >= 3, at: 0.45 },
  ]);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl, info);
    const back = step >= 3;
    // the callback needs air: the columns rise a little as they step back
    const lift = { y: back ? -96 : 0 };
    if (anim) tl.to(cols.map((c) => c.box), { ...lift, duration: 0.9, ease: 'power3.inOut' }, 0);
    else { gsap.killTweensOf(cols.map((c) => c.box), 'y'); gsap.set(cols.map((c) => c.box), lift); }
    cols.forEach((c, i) => {
      const active = i === step && !back;
      const bar = { scaleX: active ? 1 : 0, autoAlpha: active ? 1 : 0 };
      const num = { color: active ? G.accent : G.muted };
      const name = { color: back ? G.muted : G.fg };
      if (anim) {
        tl.to(c.bar, { ...bar, duration: active ? 0.9 : 0.4, ease: active ? 'expo.out' : 'power2.in' }, active ? 0.55 : 0);
        tl.to(c.num, { ...num, duration: 0.4 }, active ? 0.4 : 0);
        tl.to(c.name, { ...name, duration: 0.5, ease: 'power2.out' }, 0.1);
      } else {
        gsap.set(c.bar, bar); gsap.set(c.num, num); gsap.set(c.name, name);
      }
    });
    foot.show(back && qs ? qs : null, anim, tl, 1.2);
    return tl;
  }
  return { go };
});
