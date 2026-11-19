// power (gl-2): the PJM footprint as a lattice of warm grid lights on a point-cloud Earth. Data-centre
// blocks pulse while the grid feeds them; a contiguous region holding the shortfall's share of the lights
// (6,831 of 145,149 MW required = 4.7 %) goes dark; for the bill, the 38.2 % of power routes that end at
// data centres turn gold. The world continues into `brazil` (same world module, same camera pose).
// Evidence: on the data-centre step, once the routes have turned gold, the market monitor's own slide
// (src/data/evidence.json) arrives under the figure as the calm beat: the 38.2 % bullet boxed, its policy position
// visible, chip + caveat + QR beside it.
import { gsap } from 'gsap';
import { evItem, evPage } from './_ev-page.js';
import { buildGridEarth, FACE, POWER_SHOTS } from './_worlds/grid-earth.js';
import { factsSource, provKind, place, splitFigure } from './_worlds/gl2-kit.js';

export default {
  id: 'power',
  gl: true,
  create(ctx) {
    const { root, copy, gl, components: C, renderMode, tokens } = ctx;
    const { makeWorld, helpers: H } = gl;
    const g = buildGridEarth({ makeWorld, H, seed: 'grid-earth' });
    const { world, U, linkMats } = g;
    g.face(FACE.pjm);

    const fShort = ctx.facts('pjm-shortfall');
    const fCol = ctx.facts('colombia-capacity');
    const fDC = ctx.facts('pjm-datacentre-382');
    const showCompare = !!(copy.compare && fCol && fCol.verified !== 'failed' && !fCol.dropped);

    // ---------- DOM ----------
    const { spanW, space } = tokens;
    const scrim = C.Scrim.create({ ground: 'void', side: 'left', extent: 0.62, strength: 0.93 });
    root.append(scrim.el);
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: 'void', width: spanW(6) });
    place(title.el, space.margin, 192);
    const f1 = splitFigure(copy.value);
    const num = C.BigNumber.create({ display: f1.figure, unit: f1.unit || undefined, label: copy.label, kind: provKind(fShort && fShort.label), size: 'display', ground: 'void', width: spanW(7) });
    place(num.el, space.margin, 150);
    const compare = showCompare ? C.Headline.create({ text: copy.compare, role: 'body', ground: 'void', width: spanW(6) }) : null;
    if (compare) place(compare.el, space.margin, 700);
    const compareChip = showCompare ? C.ProvenanceChip.create({ kind: provKind(fCol.label), ground: 'void' }) : null;
    if (compareChip) place(compareChip.el, space.margin, 844);
    const f2 = splitFigure(copy.share);
    const share = C.BigNumber.create({ display: f2.figure, unit: f2.unit || undefined, label: copy.shareLabel, kind: provKind(fDC && fDC.label), size: 'display', ground: 'void', width: spanW(7) });
    place(share.el, space.margin, 150);

    const evDC = evItem(ctx, 'power-pjm-imm-datacentre-382');
    const DOC_W = 760;
    const pageDC = evDC ? evPage(ctx, evDC, {
      width: DOC_W, ground: 'void', side: 600, qrSize: 160, link: false, // a 140-character PDF path: the QR carries it
      win: { y0: 0, y1: 0.86 },
      boxes: { share: { x: 0.065, y: 0.127, w: 0.88, h: 0.155 } }, // "of the $16.4B … $6.3B … 38.2 percent"
    }) : null;
    if (pageDC) place(pageDC.el, space.margin, 548);

    const foot = document.createElement('div');
    Object.assign(foot.style, { position: 'absolute', left: `${space.margin}px`, top: `${space.footer.y}px`, display: 'flex', gap: '48px', alignItems: 'center' });
    const srcShort = C.SourceLine.create({ kind: provKind(fShort && fShort.label), text: factsSource(fShort), ground: 'void' });
    const srcCol = showCompare ? C.SourceLine.create({ kind: provKind(fCol.label), text: factsSource(fCol), ground: 'void' }) : null;
    foot.append(srcShort.el);
    if (srcCol) foot.append(srcCol.el);
    const srcDC = C.SourceLine.create({ kind: provKind(fDC && fDC.label), text: factsSource(fDC), ground: 'void' });
    place(srcDC.el, space.margin, space.footer.y);
    const parts = [title, num, compare, compareChip, share, srcShort, srcCol, srcDC, pageDC && pageDC.c].filter(Boolean);
    [title, num, compare, compareChip, share, pageDC && pageDC.c].filter(Boolean).forEach((p) => root.append(p.el));
    root.append(foot, srcDC.el);
    for (const p of [srcShort, srcCol, srcDC]) if (p) p.el.style.position = p === srcDC ? 'absolute' : 'relative';

    // ---------- camera ----------
    const rig = H.cameraRig(world.camera, { ...POWER_SHOTS[0], breathe: renderMode ? 0 : 0.35 });

    // ---------- states ----------
    let cur = -1;
    function stateTo(step, animate) {
      const tl = gsap.timeline();
      const D = (d) => (animate ? d : 0);
      const shot = POWER_SHOTS[Math.min(step, POWER_SHOTS.length - 1)];
      tl.add(rig.to(shot, { duration: animate ? 3.6 : 0.001, ease: 'power3.inOut' }), 0);
      const fwd = animate && step > cur;
      tl.to(U.hungry, { value: 1, duration: D(1.2) }, 0);
      tl.to(U.flowAlpha, { value: 1, duration: D(1.2) }, 0);
      tl.to(U.arcAlpha, { value: 0, duration: D(0.6) }, 0);
      tl.to(U.dark, { value: step >= 1 ? 1 : 0, duration: fwd && step === 1 ? 3.2 : D(0.8), ease: 'power1.inOut' }, fwd && step === 1 ? 0.9 : 0);
      tl.to(linkMats.dark, { opacity: step >= 1 ? 0.06 : 1, duration: fwd && step === 1 ? 2.6 : D(0.8) }, fwd && step === 1 ? 1.4 : 0);
      tl.to(U.money, { value: step >= 3 ? 1 : 0, duration: D(1.6) }, D(step >= 3 ? 1.2 : 0));
      tl.to(U.flowB, { value: step >= 3 ? 1 : 0, duration: D(1.6) }, D(step >= 3 ? 1.2 : 0));
      tl.to(U.flowDimA, { value: step >= 3 ? 0.22 : 1, duration: D(1.6) }, D(step >= 3 ? 1.2 : 0));
      tl.to(world.post.bloom, { intensity: 1.1, duration: D(1) }, 0);

      tl.add(scrim.set({ visible: true }, { animate }), 0);
      tl.add(title.set({ visible: step === 0 }, { animate }), D(step === 0 ? 0.6 : 0));
      tl.add(num.set({ visible: step === 1 || step === 2 }, { animate }), D(step === 1 ? 2.2 : 0));
      if (compare) tl.add(compare.set({ visible: step === 2 }, { animate }), D(step === 2 ? 0.4 : 0));
      if (compareChip) tl.add(compareChip.set({ visible: step === 2 }, { animate }), D(step === 2 ? 0.75 : 0));
      tl.add(share.set({ visible: step === 3 }, { animate }), D(step === 3 ? 1.8 : 0));
      tl.add(srcShort.set({ visible: step === 1 || step === 2 }, { animate }), D(step === 1 ? 2.6 : 0));
      if (srcCol) tl.add(srcCol.set({ visible: step === 2 }, { animate }), D(step === 2 ? 0.9 : 0));
      // with the slide on screen its own meta carries the source: one source line per frame
      tl.add(srcDC.set({ visible: step === 3 && !pageDC }, { animate }), D(step === 3 ? 2.2 : 0));
      if (pageDC) {
        tl.add(pageDC.c.set({ visible: step === 3 }, { animate }), D(step === 3 ? 3.0 : 0));
        pageDC.focus({ on: step === 3 ? ['share'] : [] }, animate, tl, 3.8);
      }
      cur = step;
      return tl;
    }

    return {
      steps: ctx.beat.steps.length,
      world,
      enter() { cur = -1; return stateTo(0, !renderMode); },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit({ to }) {
        const tl = gsap.timeline();
        if (to === 'brazil') return tl; // brazil starts from this exact pose and pulls back
        tl.to(rig.state, { radius: '+=1.2', duration: 0.8, ease: 'power2.in', onUpdate: rig.apply }, 0);
        return tl;
      },
      update(time) {
        g.update(time);
        rig.update(time);
      },
      dispose() {
        g.kill();
        gsap.killTweensOf([rig.state, world.post.bloom]);
        parts.forEach((p) => p.destroy());
        scrim.destroy();
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
