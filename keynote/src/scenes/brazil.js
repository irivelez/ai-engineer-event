// brazil (gl-2): the camera pulls back from power's grid to the point-cloud Earth; chip-flow arcs leave the
// US; at the rule, Latin America turns to face the camera and the arcs to Brazil stop at a gate on Brazil's
// border (the arcs to Indonesia, Malaysia, Singapore and Thailand are gated the same way, out of view);
// then two light pillars, heights to scale, show where the compute sits (US 72 : China ~10).
// Evidence: on the compute-share step, once the pillars stand, Epoch's own sentence (src/data/evidence.json:
// "19.8 million, or 72%, went to the United States… China… 2.6 million (10%)") arrives under the line as the calm
// beat, boxed, with its chip, caveat and QR beside it; it replaces the standalone chip.
import { gsap } from 'gsap';
import { evItem, evPage } from './_ev-page.js';
import { buildGridEarth, FACE, POWER_SHOTS, BRAZIL_SHOTS, BRAZIL_FACES } from './_worlds/grid-earth.js';
import { factsSource, provKind, place, croppedCard, captureInfo } from './_worlds/gl2-kit.js';

export default {
  id: 'brazil',
  gl: true,
  create(ctx) {
    const { root, copy, gl, components: C, renderMode, tokens } = ctx;
    const { makeWorld, helpers: H } = gl;
    const g = buildGridEarth({ makeWorld, H, seed: 'grid-earth' });
    const { world, U, linkMats } = g;

    const fRule = ctx.facts('bis-rule-brazil');
    const fShare = ctx.facts('compute-72-us');

    // ---------- DOM ----------
    const { spanW, space } = tokens;
    const scrim = C.Scrim.create({ ground: 'void', side: 'left', extent: 0.6, strength: 0.94 });
    root.append(scrim.el);
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: 'void', width: spanW(6) });
    place(title.el, space.margin, 192);
    const kicker = C.Kicker.create({ text: copy.rule, ground: 'void', tone: 'muted' });
    place(kicker.el, space.margin, 128, spanW(6));
    // non-breaking hyphen: the line-mask splitter treats 'US-headquartered' as one word (live and render then wrap alike)
    const line = C.Headline.create({ text: String(copy.line || '').replace(/-/g, '\u2011'), role: 'lead', ground: 'void', width: spanW(6), highlight: 'Brazil' });
    place(line.el, space.margin, 244);
    // separators stay with the word before them, so a line never starts with '·'
    const others = C.Headline.create({ text: String(copy.others || '').replace(/ · /g, '\u00A0· '), role: 'body', ground: 'void', width: spanW(6), tone: 'muted' });
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
    if (page72) place(page72.el, space.margin, 600);
    const srcRule = C.SourceLine.create({ kind: provKind(fRule && fRule.label), text: factsSource(fRule), ground: 'void' });
    place(srcRule.el, space.margin, space.footer.y);
    const srcShare = C.SourceLine.create({ kind: provKind(fShare && fShare.label), text: factsSource(fShare), ground: 'void' });
    place(srcShare.el, space.margin, space.footer.y);
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
    root.append(scrimC.el);
    const parts = [title, kicker, line, others, effective, share, shareChip, srcRule, srcShare, card, srcCard, page72 && page72.c].filter(Boolean);
    parts.forEach((p) => root.append(p.el));

    // ---------- camera + globe pose ----------
    const rig = H.cameraRig(world.camera, { ...BRAZIL_SHOTS[0], breathe: renderMode ? 0 : 0.25 });
    g.face(BRAZIL_FACES[0]);

    // power's end state: the exact frame the cut comes from
    function powerEnd() {
      g.face(FACE.pjm);
      rig.set(POWER_SHOTS[POWER_SHOTS.length - 1]);
      U.dark.value = 1; U.money.value = 1; U.flowB.value = 1; U.flowDimA.value = 0.22; U.flowAlpha.value = 1; U.hungry.value = 1;
      U.arcAlpha.value = 0; U.gate.value = 0; U.pillar.value = 0;
      linkMats.dark.opacity = 0.06; linkMats.arcs.opacity = 0; linkMats.gates.opacity = 0;
      U.landW.value.set(0, 0, 0, 0); U.landWCN.value = 0;
    }

    let cur = -1;
    function stateTo(step, animate, fromPower = false) {
      const tl = gsap.timeline();
      const D = (d) => (animate ? d : 0);
      const pull = animate && fromPower && step === 0;
      const camDur = pull ? 5.2 : 3.6;
      const k = Math.min(step, BRAZIL_SHOTS.length - 1);
      tl.add(rig.to(BRAZIL_SHOTS[k], { duration: animate ? camDur : 0.001, ease: pull ? 'power2.inOut' : 'power3.inOut' }), 0);
      tl.add(g.face(BRAZIL_FACES[k], { duration: animate ? camDur : 0 }), 0);
      const calm = step === CARD_STEP;
      // grid state carried over from power
      tl.to(U.dark, { value: 1, duration: D(0.5) }, 0);
      tl.to(U.money, { value: 1, duration: D(0.5) }, 0);
      tl.to(U.flowB, { value: 1, duration: D(0.5) }, 0);
      tl.to(U.flowDimA, { value: 0.22, duration: D(0.5) }, 0);
      tl.to(U.flowAlpha, { value: 0.8, duration: D(2) }, 0);
      tl.to(U.hungry, { value: 1, duration: D(0.5) }, 0);
      // chips leave the US
      tl.to(U.arcAlpha, { value: step >= 2 ? 0.16 : 1, duration: D(1.6) }, D(pull ? 2.4 : 0));
      tl.to(linkMats.arcs, { opacity: step >= 2 ? 0.08 : 0.55, duration: D(1.6) }, D(pull ? 2.2 : 0));
      // the rule: gates close on Brazil (and the four Asian countries)
      tl.to(U.gate, { value: step >= 1 ? 1 : 0, duration: D(step === 1 ? 1.0 : 0.5) }, D(step === 1 ? 2.2 : 0));
      tl.to(linkMats.gates, { opacity: step === 1 ? 1 : step >= 2 ? 0.12 : 0, duration: D(0.8) }, D(step === 1 ? 2.0 : 0));
      tl.to(U.landW.value, { x: step >= 2 ? 1 : 0, y: step >= 1 ? 1 : 0, z: step === 1 ? 0.6 : 0, w: step >= 1 ? 1 : 0, duration: D(1.2) }, D(step === 1 ? 1.6 : 0.4));
      tl.to(U.landWCN, { value: step >= 2 ? 1 : 0, duration: D(1.2) }, D(0.4));
      // where the compute is: pillars grow to scale
      tl.to(U.pillar, { value: step >= 2 ? 1 : 0, duration: D(step === 2 ? 2.2 : 0.4), ease: 'power2.out' }, D(step === 2 ? 2.4 : 0));
      tl.to(world.post.bloom, { intensity: calm ? 0.5 : 1.1, duration: D(1.1) }, 0);
      tl.add(scrimC.set({ visible: calm }, { animate }), D(calm ? 0.2 : 0));
      if (card) tl.add(card.set({ visible: calm }, { animate }), D(calm ? 0.9 : 0));
      if (srcCard) tl.add(srcCard.set({ visible: calm }, { animate }), D(calm ? 1.4 : 0));

      tl.add(scrim.set({ visible: !calm }, { animate }), 0);
      tl.add(title.set({ visible: step === 0 }, { animate }), D(step === 0 ? (pull ? 3.0 : 0.6) : 0));
      tl.add(kicker.set({ visible: step === 1 }, { animate }), D(step === 1 ? 0.9 : 0));
      tl.add(line.set({ visible: step === 1 }, { animate }), D(step === 1 ? 1.1 : 0));
      tl.add(others.set({ visible: step === 1 }, { animate }), D(step === 1 ? 2.6 : 0));
      tl.add(effective.set({ visible: step === 1 }, { animate }), D(step === 1 ? 2.9 : 0));
      tl.add(srcRule.set({ visible: step === 1 }, { animate }), D(step === 1 ? 3.2 : 0));
      tl.add(share.set({ visible: step === 2 }, { animate }), D(step === 2 ? 1.2 : 0));
      // with Epoch's sentence on screen its own meta carries chip + source: one chip per frame
      tl.add(shareChip.set({ visible: step === 2 && !page72 }, { animate }), D(step === 2 ? 1.8 : 0));
      tl.add(srcShare.set({ visible: step === 2 && !page72 }, { animate }), D(step === 2 ? 2.0 : 0));
      if (page72) {
        tl.add(page72.c.set({ visible: step === 2 }, { animate }), D(step === 2 ? 3.4 : 0));
        page72.focus({ on: step === 2 ? ['share'] : [] }, animate, tl, 4.2);
      }
      cur = step;
      return tl;
    }

    return {
      steps: ctx.beat.steps.length,
      world,
      enter({ from, direction } = {}) {
        cur = -1;
        const fromPower = from === 'power' && direction !== -1 && !renderMode;
        if (fromPower) powerEnd();
        return stateTo(0, !renderMode, fromPower);
      },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit() {
        const tl = gsap.timeline();
        tl.to(rig.state, { radius: '+=6', duration: 0.8, ease: 'power2.in', onUpdate: rig.apply }, 0);
        return tl;
      },
      update(time) {
        g.update(time);
        rig.update(time);
      },
      dispose() {
        g.kill();
        gsap.killTweensOf([rig.state, world.post.bloom, U.landW.value]);
        parts.forEach((p) => p.destroy());
        scrim.destroy();
        scrimC.destroy();
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
