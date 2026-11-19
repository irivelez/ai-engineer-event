// brazil (VOID, gl). Art direction:
//  References: GTC Berlin 57:29 (Earth from orbit, one slow move, a boxed source) · DevDay 26:20 (statement left, evidence right).
//  Palette: void; ocean near-black blue, land dark slate, coastlines light at a third, borders fainter; Brazil and the
//           four Asian countries of the same rule in the accent; the compute shares as flat bars (US accent, China quiet).
//  Light: one soft key from upper left with a gentle terminator, an atmospheric rim (inside the limb and a halo outside).
//  Camera: one slow move: from the Americas (whole Earth) in toward Brazil as the rule lands; then it holds.
//  The frame that sells it: Brazil's border drawing itself in light as the camera arrives, the rule beside it.
// Nothing decorative claims a fact: the old chip-flow arcs, gates and pillars are gone. Every shape is Natural Earth
// (src/data/geo/brazil-globe.json, public domain); the bars are facts.json compute-72-us (Epoch AI) at exact length.
// Evidence, chips, QR and the Exame capture are unchanged.
import { gsap } from 'gsap';
import { evItem, evPage } from './_ev-page.js';
import { buildGlobe, asiaInset } from './_brazil-globe.js';
import { factsSource, provKind, place, croppedCard, captureInfo } from './_worlds/gl2-kit.js';

// Globe poses: lat/lon to the front, globe centre offset (world units), camera distance.
const POSE = [
  { lat: 6, lon: -71, x: 8.6, y: -0.2, d: 64 }, //   s0: the Americas, the whole Earth, right of the title
  { lat: -12, lon: -51, x: 4.3, y: -0.35, d: 30 }, // s1+: in on Brazil, clear of the text column
];
const num = (v) => parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));

export default {
  id: 'brazil',
  gl: true,
  create(ctx) {
    const { root, copy, gl, components: C, renderMode, tokens } = ctx;
    const { makeWorld, helpers: H } = gl;
    const G = tokens.grounds.void;
    const globe = buildGlobe({ makeWorld, H });
    const { world, U } = globe;

    const fRule = ctx.facts('bis-rule-brazil');
    const fShare = ctx.facts('compute-72-us');

    // ---------- DOM ----------
    const { spanW, space } = tokens;
    const scrim = C.Scrim.create({ ground: 'void', side: 'left', extent: 0.64, strength: 0.97 });
    root.append(scrim.el);
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: 'void', width: spanW(6) });
    place(title.el, space.margin, 192);
    const kicker = C.Kicker.create({ text: copy.rule, ground: 'void', tone: 'muted' });
    place(kicker.el, space.margin, 128, spanW(6));
    // non-breaking hyphen: the line-mask splitter treats 'US-headquartered' as one word (live and render then wrap alike)
    const line = C.Headline.create({ text: String(copy.line || '').replace(/-/g, '‑'), role: 'lead', ground: 'void', width: spanW(6), highlight: 'Brazil' });
    place(line.el, space.margin, 244);
    // separators stay with the word before them, so a line never starts with '·'
    const others = C.Headline.create({ text: String(copy.others || '').replace(/ · /g, ' · '), role: 'body', ground: 'void', width: spanW(6), tone: 'muted' });
    place(others.el, space.margin, 572);
    const effective = C.Headline.create({ text: copy.effective, role: 'body', ground: 'void', width: spanW(6) });
    place(effective.el, space.margin, 732);
    const share = C.Headline.create({ text: copy.share, role: 'lead', ground: 'void', width: spanW(6), highlight: '72%' });
    place(share.el, space.margin, 330);
    const shareChip = C.ProvenanceChip.create({ kind: provKind(fShare && fShare.label), ground: 'void' });
    place(shareChip.el, space.margin, 640);
    const ev72 = evItem(ctx, 'brazil-epoch-chips-72');
    const DOC_W = 900;
    const page72 = ev72 ? evPage(ctx, ev72, {
      width: DOC_W, ground: 'void', side: 620, qrSize: 160,
      win: { y0: 0.1, y1: 0.77 },
      boxes: { share: { x: 0.01, y: 0.245, w: 0.975, h: 0.375 } }, // "…19.8 million, or 72%, went to the United States. China… 2.6 million (10%)"
    }) : null;
    if (page72) place(page72.el, space.margin, 656); // lower than before: the bars card above gets its own air
    const srcRule = C.SourceLine.create({ kind: provKind(fRule && fRule.label), text: factsSource(fRule), ground: 'void' });
    place(srcRule.el, space.margin, space.footer.y);
    const srcShare = C.SourceLine.create({ kind: provKind(fShare && fShare.label), text: factsSource(fShare), ground: 'void' });
    place(srcShare.el, space.margin, space.footer.y);
    // Where the compute is: Epoch's two shares as bars at exact length (labels and values from facts.json)
    const shareVals = fShare && fShare.value && typeof fShare.value === 'object' ? Object.entries(fShare.value) : [];
    const bars = shareVals.length ? C.BarChart.create({
      data: shareVals.map(([k, v], i) => ({ id: `s${i}`, label: k, value: num(v), display: String(v) })),
      orientation: 'horizontal', colorMode: 'accent', highlight: 's0', max: 100, ground: 'void',
      width: 720, labelWidth: 170, rowHeight: 104, barHeight: 56, labelRole: 'lead', valueRole: 'lead',
    }) : null;
    // the bars sit on a card (DevDay's stat surfaces) so the globe behind never competes with them
    const barCard = bars ? document.createElement('div') : null;
    if (barCard) {
      Object.assign(barCard.style, { position: 'absolute', left: '1008px', top: '248px', width: '784px', height: '256px', borderRadius: '24px', background: G.card, opacity: '0', visibility: 'hidden' });
      place(bars.el, 1040, 272);
    }
    // Latin American press, as its own calm last state (director's pick: Exame, 17 Nov).
    const CARD_ID = 'exame-brasil-regra-chips';
    const cardSrc = ctx.assets.capture(CARD_ID);
    const cardMeta = ctx.assets.captureMeta(CARD_ID);
    const ci = captureInfo(cardMeta);
    const CARD_STEP = ctx.beat.steps.length >= 4 ? 3 : -1;
    const card = cardSrc && CARD_STEP > 0 ? croppedCard(C, { id: CARD_ID, src: cardSrc, alt: (cardMeta && cardMeta.title) || '', width: spanW(10), meta: { captured: ci.captured } }) : null;
    if (card) place(card.el, (1920 - spanW(10)) / 2, 330);
    const srcCard = card ? C.SourceLine.create({ kind: 'press', text: [ci.who, ci.date].filter(Boolean).join(' · '), ground: 'void' }) : null;
    if (srcCard) place(srcCard.el, space.margin, space.footer.y);
    const scrimC = C.Scrim.create({ ground: 'void', side: 'center', extent: 1.1, strength: 0.9 });
    // the four Asian countries of the same rule, on the far side of the Earth: a small flat globe, bottom right
    const IN_R = 124;
    const inset = asiaInset({ r: IN_R, colors: { ocean: '#0A0F17', land: '#2A3445', accent: G.accent, rim: G.rule } });
    const insetBox = document.createElement('div');
    Object.assign(insetBox.style, { position: 'absolute', left: `${1652 - IN_R - 22}px`, top: `${808 - IN_R - 22}px`, width: `${(IN_R + 22) * 2}px`, height: `${(IN_R + 22) * 2}px`, borderRadius: '50%', background: 'rgba(5,7,10,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: '0', visibility: 'hidden' });
    insetBox.appendChild(inset.el);
    root.append(scrimC.el);
    const parts = [title, kicker, line, others, effective, share, shareChip, srcRule, srcShare, bars, card, srcCard, page72 && page72.c].filter(Boolean);
    parts.forEach((p) => root.append(p.el));
    root.append(insetBox);
    if (barCard) root.insertBefore(barCard, bars.el);

    // ---------- globe state (tweened, rendered by pose()) ----------
    const S = { lat: POSE[0].lat, lon: POSE[0].lon, x: POSE[0].x, y: POSE[0].y, d: POSE[0].d, line: 0, brazil: 0, dim: 1, sway: renderMode ? 0 : 1 };
    let tNow = 0;
    const apply = () => {
      const sw = S.sway ? Math.sin(tNow * 0.11) * 0.8 * S.sway : 0; // a breath of rotation, never a spin
      globe.pose({ lat: S.lat, lon: S.lon + sw, x: S.x, y: S.y, d: S.d });
      globe.setBrazilLine(S.line);
      U.uBrazil.value = S.brazil;
      globe.setDim(S.dim);
    };
    apply();

    function stateTo(step, animate, entering = false) {
      const tl = gsap.timeline();
      const A = animate && !renderMode;
      const D = (d) => (A ? d : 0);
      const p = POSE[Math.min(step, 1)];
      const target = { lat: p.lat, lon: p.lon, x: p.x, y: p.y, d: p.d, line: step >= 1 ? 1 : 0, brazil: step >= 1 ? 1 : 0, dim: step >= 2 ? 0.3 : 1 };
      gsap.killTweensOf(S);
      if (!A) {
        Object.assign(S, target);
        apply();
      } else {
        if (entering) Object.assign(S, { ...POSE[0], d: POSE[0].d + 6, line: 0, brazil: 0, dim: 1 }); // a gentle settle in on arrival
        const moving = Math.abs(S.d - target.d) > 0.01;
        tl.to(S, { lat: target.lat, lon: target.lon, x: target.x, y: target.y, d: target.d, duration: entering ? 5 : moving ? 4.6 : 0.01, ease: entering ? 'power2.out' : 'power2.inOut', onUpdate: apply }, 0);
        // the rule: Brazil's border draws itself as the camera arrives, then the fill
        if (step >= 1 && S.line < 1) tl.to(S, { line: 1, duration: 1.8, ease: 'power1.inOut', onUpdate: apply }, D(2.4));
        else tl.to(S, { line: target.line, duration: 0.5, onUpdate: apply }, 0);
        tl.to(S, { brazil: target.brazil, duration: step >= 1 ? 1.2 : 0.5, ease: 'sine.inOut', onUpdate: apply }, D(step === 1 ? 3.4 : 0));
        tl.to(S, { dim: target.dim, duration: 1.2, ease: 'sine.inOut', onUpdate: apply }, 0);
      }
      const calm = step === CARD_STEP;
      tl.to(world.post.bloom, { intensity: calm ? 0.4 : 0.6, duration: D(1.1) }, 0);
      tl.add(scrimC.set({ visible: calm }, { animate: A }), D(calm ? 0.2 : 0));
      if (card) tl.add(card.set({ visible: calm }, { animate: A }), D(calm ? 0.9 : 0));
      if (srcCard) tl.add(srcCard.set({ visible: calm }, { animate: A }), D(calm ? 1.4 : 0));

      tl.add(scrim.set({ visible: !calm }, { animate: A }), 0);
      tl.add(title.set({ visible: step === 0 }, { animate: A }), D(step === 0 ? 1.0 : 0));
      tl.add(kicker.set({ visible: step === 1 }, { animate: A }), D(step === 1 ? 0.9 : 0));
      tl.add(line.set({ visible: step === 1 }, { animate: A }), D(step === 1 ? 1.1 : 0));
      tl.add(others.set({ visible: step === 1 }, { animate: A }), D(step === 1 ? 4.2 : 0));
      // the inset arrives with the line that names its four countries
      const insetOn = step === 1;
      if (A) {
        if (insetOn) tl.fromTo(insetBox, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, 4.45);
        else tl.to(insetBox, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0);
      } else gsap.set(insetBox, { autoAlpha: insetOn ? 1 : 0, scale: 1 });
      tl.add(effective.set({ visible: step === 1 }, { animate: A }), D(step === 1 ? 4.9 : 0));
      tl.add(srcRule.set({ visible: step === 1 }, { animate: A }), D(step === 1 ? 5.2 : 0));
      tl.add(share.set({ visible: step === 2 }, { animate: A }), D(step === 2 ? 0.6 : 0));
      if (barCard) {
        if (A) tl.to(barCard, { autoAlpha: step === 2 ? 0.94 : 0, duration: step === 2 ? 0.7 : 0.4, ease: step === 2 ? 'power2.out' : 'power2.in' }, step === 2 ? 1.0 : 0);
        else gsap.set(barCard, { autoAlpha: step === 2 ? 0.94 : 0 });
      }
      if (bars) tl.add(bars.set({ visible: step === 2 }, { animate: A }), D(step === 2 ? 1.3 : 0));
      // with Epoch's sentence on screen its own meta carries chip + source: one chip per frame
      tl.add(shareChip.set({ visible: step === 2 && !page72 }, { animate: A }), D(step === 2 ? 1.8 : 0));
      tl.add(srcShare.set({ visible: step === 2 && !page72 }, { animate: A }), D(step === 2 ? 2.0 : 0));
      if (page72) {
        tl.add(page72.c.set({ visible: step === 2 }, { animate: A }), D(step === 2 ? 2.8 : 0));
        page72.focus({ on: step === 2 ? ['share'] : [] }, A, tl, 3.6);
      }
      return tl;
    }

    return {
      steps: ctx.beat.steps.length,
      world,
      enter({ direction } = {}) { return stateTo(0, !renderMode && direction !== -1, true); },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit() {
        const tl = gsap.timeline();
        tl.to(S, { d: '+=4', duration: 0.8, ease: 'power2.in', onUpdate: apply }, 0);
        return tl;
      },
      update(time) {
        tNow = time;
        if (S.sway) apply();
      },
      dispose() {
        gsap.killTweensOf([S, world.post.bloom, insetBox, barCard].filter(Boolean));
        parts.forEach((p) => p.destroy());
        scrim.destroy();
        scrimC.destroy();
        insetBox.remove();
        if (barCard) barCard.remove();
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
