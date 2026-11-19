// EXAMPLE (evidence kit): a talk clip from this moment's evidence (src/data/evidence.json) on step 1, framed,
// muted, with captions from the item's transcript, its chip, source line and QR. Step 0 is empty so → starts it.
// Try it:  node scripts/build.mjs --only verification --map verification=_example-evidence-video --out .dev/evvid.html
import { gsap } from 'gsap';

export default {
  id: '_example-evidence-video',
  gl: false,
  create(ctx) {
    const { root, components: C, beat, tokens } = ctx;
    const ev = ((ctx.assets.evidenceFor && ctx.assets.evidenceFor(beat.id)) || []).find((e) => e.kind === 'video') || null;
    const clip = ev ? C.EvidenceVideo.create({ item: ev, kind: ev.chip, width: tokens.spanW(8), qr: true, qrSize: 222, ground: beat.ground }) : null;
    if (clip) {
      Object.assign(clip.el.style, { position: 'absolute', left: '128px', top: '96px' });
      root.append(clip.el);
    }
    const stateTo = (step, animate) => {
      const tl = gsap.timeline();
      if (clip) tl.add(clip.set({ visible: step >= 1 }, { animate }), 0);
      return tl;
    };
    return {
      steps: beat.steps.length,
      enter() { return stateTo(0, true); },
      goto(step, { animate }) { return stateTo(step, animate); },
      exit() { const tl = gsap.timeline(); if (clip) tl.call(() => clip.pause(), null, 0.8); return tl; },
      dispose() { if (clip) clip.destroy(); root.replaceChildren(); },
    };
  },
};
