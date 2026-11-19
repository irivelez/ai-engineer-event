// slop (calm-a, VOID quote moment): the most-watched talk of the summit.
// Step 0: talk title in serif, the view count rolls (odometer), her real stage still on the right with a
//         slow push-in toward the October bar, her line as the caption.
// Step 1: the still gives way to a calm line chart: reverts fall 0.98% → 0.47% (June → October) while the
//         left column says it plainly: volume up 13×, reverts halved.
// Evidence: step 0 plays her own words from the talk (src/data/evidence.json, cut to the quote by
//         src/data/clip-cuts.json) in place of the still; the clip's captions carry the quote verbatim and its
//         last frame holds her "11k PRs in oct" slide. Without the clip, the still and the typeset quote return.
import { gsap } from 'gsap';
import { calmScene, el, svgEl, esc, unquote, factSource, fact } from './_calm/kit.js';
import { talkClip } from './_clip-cut.js';

export default calmScene('slop', (ctx, K) => {
  const { T, C, G, g, place, R } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const LEFT_W = T.spanW(5);
  const RX = T.colX(5);
  const RW = T.spanW(7);
  const RH = Math.round((RW * 9) / 16);
  const RY = 208;

  // ----- left column -----
  const kicker = K.add(C.Kicker.create({ text: copy.speaker || '', ground: g }), M, 120);
  const talk = el('div', 't-quote balance');
  place(talk, M, 196, LEFT_W);
  talk.innerHTML = esc(copy.talk || '');
  talk.style.color = G.fg;
  const talkB = K.block(talk, { rise: 24 });

  const views = K.add(C.BigNumber.create({ display: copy.views || '', size: 'h1', ground: g, label: copy.viewsLabel || '' }), M, 520, LEFT_W);
  views.el.querySelector('.bn-label') && Object.assign(views.el.querySelector('.bn-label').style, { color: G.muted, maxWidth: `${LEFT_W}px` });

  // the point, in two lines: "Volume up 13×." / "Reverts halved."
  const pointParts = String(copy.point || '').split(/(?<=\.)\s+/);
  const point = el('div', 't-h2');
  place(point, M, 520, LEFT_W);
  const pointB = K.maskLines(point, pointParts.map((p, i) => ({ html: esc(p), cls: i === pointParts.length - 1 ? 'ca-accent' : 'ca-fg' })), { stagger: 0.12 });

  // ----- the still (real broadcast frame, never cropped) with a slow push-in of the whole framed card -----
  const clip = talkClip(ctx, { width: RW, ground: g });
  if (clip) K.add(clip, RX, 168);
  const stillSrc = clip ? null : ctx.assets.sf('lauren-tan-11k-prs');
  const meta = ctx.assets.sfMeta('lauren-tan-11k-prs') || {};
  let still = null;
  const stillWrap = el('div', '');
  place(stillWrap, RX, RY, RW, RH);
  stillWrap.style.transformOrigin = '62% 40%'; // toward her October bar
  if (stillSrc) {
    still = C.CaptureCard.create({ src: stillSrc, alt: meta.description || copy.talk || '', variant: 'void', ground: g, width: RW });
    stillWrap.appendChild(still.el);
    K.owned.push(still);
  }
  let pushTween = null;
  const startPush = () => {
    if (R) return;
    if (pushTween) pushTween.kill();
    gsap.set(stillWrap, { scale: 1 });
    pushTween = gsap.to(stillWrap, { scale: 1.035, duration: 16, ease: 'sine.inOut' });
  };
  const settlePush = () => { if (pushTween) { pushTween.kill(); pushTween = null; } gsap.set(stillWrap, { scale: 1 }); };

  // her line, as the still's caption
  const cap = el('div', '');
  place(cap, RX, RY + RH + 36, RW);
  cap.innerHTML = `<div style="font-family:var(--f-serif);font-style:italic;font-size:44px;line-height:56px;font-weight:400;color:${G.fg}" class="pretty">${esc(copy.quote || '')}</div>`;
  const capB = K.block(cap, { rise: 16 });

  // ----- the revert chart (step 1) -----
  const rv = (fact(ctx, 'grokbot-reverts') || {}).value || {};
  const pts = Object.values(rv).map((v) => parseFloat(String(v))).filter((v) => Number.isFinite(v));
  const series = pts.length >= 2 ? pts : [parseFloat(copy.revert && copy.revert.from) || 1, parseFloat(copy.revert && copy.revert.to) || 0.5];
  const CW = RW;
  const CH = 540;
  const chart = el('div', '');
  place(chart, RX, RY, CW, CH + 140);
  const svg = svgEl('svg', { width: CW, height: CH, viewBox: `0 0 ${CW} ${CH}` }, chart);
  svg.style.overflow = 'visible';
  const PADL = 24;
  const PADR = 200;
  const PADT = 70;
  const PADB = 40;
  const ymax = 1.0;
  const xs = (i) => PADL + (i / (series.length - 1)) * (CW - PADL - PADR);
  const ys = (v) => PADT + (1 - v / ymax) * (CH - PADT - PADB);
  svgEl('line', { x1: 0, x2: CW - PADR + 40, y1: CH - PADB, y2: CH - PADB, stroke: G.muted, 'stroke-width': 2 }, svg);
  const d = series.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
  const path = svgEl('path', { d, fill: 'none', stroke: G.accent, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  const dots = series.map((v, i) => svgEl('circle', { cx: xs(i), cy: ys(v), r: i === 0 || i === series.length - 1 ? 10 : 6, fill: i === series.length - 1 ? G.accent : G.bg, stroke: G.accent, 'stroke-width': 4 }, svg));
  const fromL = el('div', 't-lead tnum', chart, esc((copy.revert && copy.revert.from) || ''));
  Object.assign(fromL.style, { position: 'absolute', left: `${xs(0) - 4}px`, top: `${ys(series[0]) - 92}px`, color: G.muted });
  const toL = el('div', 't-h2 tnum', chart, esc((copy.revert && copy.revert.to) || ''));
  Object.assign(toL.style, { position: 'absolute', left: `${xs(series.length - 1) + 32}px`, top: `${ys(series[series.length - 1]) - 52}px`, color: G.accent });
  const capR = el('div', 't-body', chart, esc((copy.revert && copy.revert.label) || ''));
  Object.assign(capR.style, { position: 'absolute', left: '0px', top: `${CH + 76}px`, width: `${CW}px`, color: G.fg });
  // x-axis ends from the same copy: "…, June → October"
  const span = String((copy.revert && copy.revert.label) || '').split(',').pop().split('→').map((x) => x.trim()).filter(Boolean);
  const ends = span.length === 2 ? span.map((t, i) => {
    const e = el('div', 't-label', chart, esc(t));
    Object.assign(e.style, { position: 'absolute', top: `${CH - PADB + 16}px`, color: G.muted, whiteSpace: 'nowrap' });
    if (i === 0) e.style.left = `${xs(0) - 10}px`;
    else { e.style.left = `${xs(series.length - 1) - 300}px`; e.style.width = '310px'; e.style.textAlign = 'right'; }
    return e;
  }) : [];
  let len = 0;
  const chartB = K.block(chart, {
    enter(tl) {
      len = len || path.getTotalLength() || 1200;
      tl.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0.2);
      dots.forEach((c, i) => tl.fromTo(c, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, ease: 'power3.out' }, 0.2 + (i / (dots.length - 1)) * 1.5));
      tl.fromTo(fromL, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0.25);
      tl.fromTo(toL, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'expo.out' }, 1.6);
      tl.fromTo([capR, ...ends], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 0.4);
    },
    settle() {
      gsap.set(path, { strokeDasharray: 'none', strokeDashoffset: 0 });
      gsap.set(dots, { scale: 1 });
      gsap.set([fromL, toL, capR, ...ends], { autoAlpha: 1, x: 0, y: 0 });
    },
  });

  const foot = K.footer();
  const srcViews = factSource(ctx, 'laurentan-views');
  const srcTeam = factSource(ctx, 'grokbot-reverts') || factSource(ctx, 'grokbot-prs');
  const src0 = { kind: (srcViews && srcViews.kind) || 'official', text: copy.asOf || (srcViews && srcViews.text) || '' };

  const parts = [
    { c: kicker, on: () => true },
    { c: talkB, on: () => true, at: 0.08 },
    { c: views, on: (s) => s === 0, at: 0.4 },
    { c: pointB, on: (s) => s >= 1, at: 0.1 },
    { c: chartB, on: (s) => s >= 1, at: 0.2 },
    { c: capB, on: (s) => s === 0 && !clip, at: 0.9 },
  ];
  if (still) parts.push({ c: still, on: (s) => s === 0, at: 0.2 });
  if (clip) parts.push({ c: clip, on: (s) => s === 0, at: 0.2 });
  const apply = K.stepper(parts);

  function go(step, animate, info = {}) {
    const anim = animate && !R;
    const tl = gsap.timeline();
    apply(step, anim, tl);
    if (step === 0) {
      if (anim && (info.entering || info.prev !== 0)) startPush();
      else if (!anim) settlePush();
    }
    foot.show(step === 0 ? src0 : srcTeam, anim, tl, 0.3);
    return tl;
  }
  return {
    go,
    exit() { if (clip) clip.pause(); return K.exit(); }, // freeze the frame, sound off, under the transition
    dispose() { if (pushTween) pushTween.kill(); },
  };
});
