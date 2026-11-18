// think-twice (calm-b, PAPER): the heart of the close. Five decisions to think twice about in 2027.
// Step 0: "Think twice before you…" alone, h1, centred in the frame.
// Steps 1–5: the title glides to the top (h2); one decision per step at h1, centred, under its own cue icon
//            drawn in the accent, with the evidence line under it (chip + source in the footer band).
//            The five cue icons sit in a row at the bottom: the list. On each advance the current decision
//            shrinks down into its slot (its icon stays there in ink), the next slot lights in the accent.
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';
import { ensureCSS, sourceOf } from './_calm-b/kit.js';

export default calmScene('think-twice', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const W = 1920 - 2 * M;
  const iconSVG = (ctx.icons && ctx.icons.iconSVG) || (() => '');
  const items = (copy.items || []).slice(0, 5);
  const factIds = ctx.beat.facts || [];

  // ----- the title: h1 centred at step 0, h2 at the top after -----
  const TITLE_Y0 = Math.round((1080 - 128) / 2 - 43);
  const TITLE_Y1 = 112;
  const SMALL = T.type.h2.size / T.type.h1.size;
  const title = C.Headline.create({ text: copy.title || '', role: 'h1', ground: g, width: W, align: 'center' });
  place(title.el, M, TITLE_Y0, W);
  title.el.style.transformOrigin = '50% 0';
  K.owned.push(title);

  // ----- the list: five icon slots in a row at the bottom -----
  const SLOT = 104; // pitch
  const SLOT_Y = 868;
  const slots = items.map((it, i) => {
    const x = 960 + (i - (items.length - 1) / 2) * SLOT;
    const s = el('div', 'cb-icon', null, iconSVG(it.icon, { size: 44 }));
    place(s, x - 22, SLOT_Y, 44, 44);
    s.style.color = G.quiet;
    const u = el('div', '', null);
    place(u, x - 22, SLOT_Y + 60, 44, 4);
    Object.assign(u.style, { borderRadius: '2px', background: G.accent, transformOrigin: '50% 50%' });
    return { s, u, x };
  });
  const strip = el('div', '');
  place(strip, 0, 0, 1920, 1080);
  slots.forEach((sl) => strip.append(sl.s, sl.u));
  const stripB = K.block(strip, {
    enter(tl) { tl.fromTo(slots.map((s) => s.s), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06 }, 0); },
    settle() { gsap.set(slots.map((s) => s.s), { autoAlpha: 1, y: 0 }); },
  });

  // ----- one centred group per decision: icon, sentence (h1), evidence -----
  const AREA_TOP = 236;
  const AREA_BOT = 836;
  const ICON = 96;
  const groups = items.map((it, i) => {
    const grp = el('div', '');
    place(grp, 0, 0, 1920, 1080);
    const ic = el('div', 'cb-icon', grp, iconSVG(it.icon, { size: ICON }));
    Object.assign(ic.style, { position: 'absolute', left: `${960 - ICON / 2}px`, top: '0px', color: G.accent });
    const hl = C.Headline.create({ text: it.text || '', role: 'h1', ground: g, width: W, align: 'center' });
    Object.assign(hl.el.style, { position: 'absolute', left: `${M}px`, top: '0px', width: `${W}px` });
    grp.appendChild(hl.el);
    K.owned.push(hl);
    const why = el('div', 'cb-body48 balance', grp, esc(it.why || ''));
    Object.assign(why.style, { position: 'absolute', left: `${M + 160}px`, width: `${W - 320}px`, top: '0px', color: G.muted, textAlign: 'center' });
    gsap.set(grp, { autoAlpha: 0 });
    return { grp, ic, hl, why, src: sourceOf(ctx, factIds[i]), top: 0 };
  });
  function layout() {
    groups.forEach((gr) => {
      const hH = gr.hl.el.offsetHeight || 256;
      const wH = gr.why.offsetHeight || 64;
      const total = ICON + 36 + hH + 28 + wH;
      const top = Math.round(AREA_TOP + Math.max(0, (AREA_BOT - AREA_TOP - total) / 2));
      gr.top = top;
      gr.ic.style.top = `${top}px`;
      gr.hl.el.style.top = `${top + ICON + 36}px`;
      gr.why.style.top = `${top + ICON + 36 + hH + 28}px`;
      gr.grp.style.transformOrigin = `960px ${top}px`;
    });
  }
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  // ----- icon draw-in (paths draw, filled marks grow) -----
  function drawIcon(tl, ic, at) {
    const svg = ic.querySelector('svg');
    if (!svg) return;
    svg.querySelectorAll('path').forEach((p) => {
      let len = 120;
      try { len = Math.ceil(p.getTotalLength()) + 2; } catch (e) { /* not rendered yet */ }
      tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, at);
      tl.set(p, { clearProps: 'strokeDasharray,strokeDashoffset' }, at + 0.95);
    });
    const fills = svg.querySelectorAll('circle, rect');
    if (fills.length) tl.fromTo(fills, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'power3.out' }, at + 0.55);
  }

  const slotColor = (i, k) => (i < k ? G.fg : i === k ? G.accent : G.quiet);
  const foot = K.footer();
  let cur = -1;

  function settleGroups(k) {
    groups.forEach((gr, i) => {
      gsap.killTweensOf([gr.grp, gr.ic, gr.why]);
      if (i === k) {
        gsap.set(gr.grp, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
        gsap.set([gr.ic, gr.why], { autoAlpha: 1, y: 0, scale: 1 });
        gr.hl.set({ visible: true }, { animate: false });
      } else {
        gsap.set(gr.grp, { autoAlpha: 0, x: 0, y: 0, scale: 1 });
        gr.hl.set({ visible: false }, { animate: false });
      }
    });
  }

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    const k = step - 1; // decision index (−1: title only)
    if (!title.shown) tl.add(title.set({ visible: true }, { animate: anim }), 0);
    const tv = step >= 1 ? { y: TITLE_Y1 - TITLE_Y0, scale: SMALL } : { y: 0, scale: 1 };
    if (anim) tl.to(title.el, { ...tv, duration: 1.0, ease: 'power3.inOut' }, 0);
    else { gsap.killTweensOf(title.el, 'y,scale'); gsap.set(title.el, tv); }
    tl.add(stripB.set({ visible: step >= 1 }, { animate: anim }), anim ? 0.3 : 0);

    if (!anim) {
      settleGroups(k);
      slots.forEach((sl, i) => {
        gsap.killTweensOf([sl.s, sl.u]);
        gsap.set(sl.s, { color: slotColor(i, k) });
        gsap.set(sl.u, { scaleX: i === k ? 1 : 0, autoAlpha: i === k ? 1 : 0 });
      });
      foot.show(k >= 0 ? groups[k].src : null, false, tl);
      cur = k;
      return tl;
    }

    const prev = cur;
    cur = k;
    // slots: colours and the accent underline travel with the step
    slots.forEach((sl, i) => {
      tl.to(sl.s, { color: slotColor(i, k), duration: 0.5, ease: 'power2.out' }, i === prev ? 0.55 : 0.3);
      const on = i === k;
      tl.to(sl.u, { scaleX: on ? 1 : 0, autoAlpha: on ? 1 : 0, duration: on ? 0.6 : 0.3, ease: on ? 'expo.out' : 'power2.in' }, on ? 0.7 : 0);
    });
    // the outgoing decision
    if (prev >= 0 && prev !== k) {
      const o = groups[prev];
      gsap.killTweensOf([o.grp]);
      if (k === prev + 1) {
        // shrink down into its slot
        const sl = slots[prev];
        const s = 44 / ICON;
        tl.to(o.grp, { x: sl.x - 960, y: SLOT_Y - o.top, scale: s, duration: 0.8, ease: 'power3.inOut' }, 0);
        tl.to(o.grp, { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, 0.45);
      } else {
        tl.to(o.grp, { autoAlpha: 0, y: -12, duration: 0.45, ease: 'power2.in' }, 0);
      }
      tl.add(() => { o.hl.set({ visible: false }, { animate: false }); gsap.set(o.grp, { x: 0, y: 0, scale: 1 }); }, 0.85);
    }
    // the incoming decision
    if (k >= 0 && k !== prev) {
      const n = groups[k];
      gsap.killTweensOf([n.grp, n.ic, n.why]);
      const at = prev >= 0 ? 0.6 : 0.5;
      tl.set(n.grp, { autoAlpha: 1, x: 0, y: 0, scale: 1 }, at);
      tl.fromTo(n.ic, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, at);
      drawIcon(tl, n.ic, at);
      tl.add(n.hl.set({ visible: true }, { animate: true }), at + 0.15);
      tl.fromTo(n.why, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, at + 0.75);
    }
    foot.show(k >= 0 ? groups[k].src : null, true, tl, 0.9);
    return tl;
  }

  return { go };
});
