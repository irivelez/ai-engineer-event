// Art direction (sf-film, 19 Nov): real San Francisco, filmed, not generated.
// References: GTC Berlin 2026's film plates (one motivated move per shot, light as material) with DevDay restraint.
// Palette: blue hour as shot: deep blue sky, sodium-orange bridge lights; graded gently cooler, never stylised.
// Camera: s0 the drone's own approach over the Golden Gate toward the city plus a slow push; s1 a 1.2 s dissolve
// to the Financial District pulling back from Salesforce Tower; s2 the plate settles and holds. The frame that sells
// it: the lit north tower against the dusk gradient, the city and Sutro Tower on the horizon.
//
// Footage (Pexels License, https://www.pexels.com/license/; free use and modification, no attribution required):
//   media/plates/sf-golden-gate-dusk.mp4         "Golden Gate Bridge at Dusk Aerial View", Asad Mehmood,
//                                                 https://www.pexels.com/video/golden-gate-bridge-at-dusk-aerial-view-34024355/
//   media/plates/sf-financial-district-dusk.mp4  "Aerial view of the city skyline at sunset", Advancer Drones,
//                                                 https://www.pexels.com/video/aerial-view-of-the-city-skyline-at-sunset-19834302/
// Cut, graded and encoded as described in docs/footage-manifest.md. The .mp4 files are git-ignored; the two .webp
// posters (their end frames) are committed and inlined, so the static fallback and file:// without the plates work.
import { gsap } from 'gsap';
import { factSource, splitFigure, place } from './_worlds/gl1-kit.js';
import { createPlate } from './_sf-arrival-plate.js';
import ggPoster from '../../media/plates/sf-golden-gate-dusk.webp';
import fdPoster from '../../media/plates/sf-financial-district-dusk.webp';

const PUSH = 1.06; // s0: slow push toward the bridge tower, as the drone flies in
const PUSH_SEC = 20; // the plate runs 18 s; the push outlasts it slightly
const DISSOLVE = 1.2;

export default {
  id: 'sf-arrival',
  gl: false,
  create(ctx) {
    const { root, copy, beat, components: C, renderMode } = ctx;
    const g = 'void';

    // ---------- plates ----------
    const gg = createPlate({ src: 'media/plates/sf-golden-gate-dusk.mp4', poster: ggPoster, renderMode });
    const fd = createPlate({ src: 'media/plates/sf-financial-district-dusk.mp4', poster: fdPoster, renderMode });
    gg.inner.style.transformOrigin = '46% 36%'; // the north tower's top, where the drone is heading
    gsap.set(fd.el, { autoAlpha: 0 });

    // ---------- type ----------
    const acts = ctx.acts || [];
    const numbered = acts.filter((a) => a.n);
    const actIndex = Math.max(0, numbered.findIndex((a) => a.id === beat.act));
    // Keep the place name on one line: the title stacks in three lines left of the towers.
    const title = copy.place ? String(copy.actTitle).split(copy.place).join(copy.place.replace(/ /g, String.fromCharCode(160))) : copy.actTitle;
    const scrim = C.Scrim.create({ ground: g, side: 'left', extent: 0.75, strength: 0.9 });
    const act = C.ActTitle.create({ numeral: copy.act, title, index: actIndex, total: numbered.length || 5, ground: g, width: 860 });
    const event = C.Kicker.create({ text: copy.event, ground: g, tone: 'fg' });
    const where = C.Kicker.create({ text: [copy.place, copy.dates].filter(Boolean).join(' · '), ground: g, tone: 'muted', rule: false });
    const f1 = splitFigure(copy.stat1);
    const f2 = splitFigure(copy.stat2);
    const n1 = C.BigNumber.create({ display: f1.figure, unit: f1.unit || undefined, size: 'h1', ground: g });
    const n2 = C.BigNumber.create({ display: f2.figure, unit: f2.unit || undefined, size: 'h1', ground: g });
    const src = factSource(ctx, (beat.facts || [])[0]);
    const source = C.SourceLine.create({ kind: src.kind, text: src.text, ground: g });
    root.append(gg.el, fd.el, scrim.el, act.el, event.el, where.el, n1.el, n2.el, source.el);
    place(act.el, 128, 112);
    place(event.el, 128, 676);
    place(where.el, 188, 724); // under the event name, after its 40 px rule and 20 px gap
    place(n1.el, 128, 796);
    place(n2.el, 640, 796);
    place(source.el, 128, 988);
    const texts = { act, event, where, n1, n2, source };

    let vis = {};
    function show(c, key, want, tl, at, animate) {
      if (!!vis[key] === want) return;
      vis[key] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
    }

    // The push and the plates run beside the step timelines, never inside them: the director finishes a running
    // timeline with progress(1) on the next press, which would snap a 20 s push to its end.
    let push = null;
    function startPush() {
      if (push) push.kill();
      push = gsap.fromTo(gg.inner, { scale: 1 }, { scale: PUSH, duration: PUSH_SEC, ease: 'sine.out' });
    }
    function endPush() {
      if (push) { push.kill(); push = null; }
      gsap.set(gg.inner, { scale: PUSH });
    }

    let city = false; // the Financial District plate is up
    function stateTo(step, animate, entering) {
      const A = animate && !renderMode;
      const tl = gsap.timeline();
      if (step === 0) {
        city = false;
        gsap.killTweensOf(fd.el);
        gsap.set(fd.el, { autoAlpha: 0 });
        fd.pause();
        if (A && entering) { gg.start(); startPush(); } else { gg.settle(); endPush(); }
      } else if (!city) {
        city = true;
        if (A) {
          fd.start();
          tl.fromTo(fd.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: DISSOLVE, ease: 'sine.inOut' }, 0);
          tl.add(() => { gg.pause(); if (push) { push.kill(); push = null; } }, DISSOLVE + 0.05);
        } else {
          gsap.killTweensOf(fd.el);
          gsap.set(fd.el, { autoAlpha: 1 });
          fd.settle();
          gg.pause();
          endPush();
        }
      } else if (!A) fd.settle();
      show(scrim, 'scrim', step >= 1, tl, A ? 0.15 : 0, A);
      show(act, 'act', step >= 1, tl, A ? 0.75 : 0, A);
      show(event, 'event', step >= 1, tl, A ? 1.6 : 0, A);
      show(where, 'where', step >= 1, tl, A ? 1.78 : 0, A);
      show(n1, 'n1', step >= 2, tl, A ? 0.2 : 0, A);
      show(n2, 'n2', step >= 2, tl, A ? 0.32 : 0, A);
      show(source, 'source', step >= 2, tl, A ? 0.6 : 0, A);
      return tl;
    }

    return {
      steps: beat.steps.length,
      enter({ direction = 1 } = {}) {
        // Re-entry starts clean (exit lifted the type out); going back lands on the last step, settled.
        const tl = gsap.timeline();
        for (const c of [scrim, ...Object.values(texts)]) tl.add(c.set({ visible: false }, { animate: false }), 0);
        vis = {};
        tl.add(stateTo(0, direction >= 0, true), 0);
        return tl;
      },
      goto(step, { animate }) { return stateTo(step, animate, false); },
      exit() {
        const tl = gsap.timeline();
        for (const [k, c] of Object.entries(texts)) if (vis[k]) c.out(tl, 0);
        tl.add(() => { gg.pause(); fd.pause(); }, 0.75);
        return tl;
      },
      dispose() {
        if (push) push.kill();
        gsap.killTweensOf([gg.inner, fd.el]);
        [scrim, ...Object.values(texts)].forEach((c) => c.destroy());
        gg.destroy();
        fd.destroy();
        root.replaceChildren();
      },
    };
  },
};
