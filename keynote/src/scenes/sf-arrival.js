// sf-arrival (gl-1): we land in San Francisco. The camera glides low down an avenue of a night city made of
// light, then rises to reveal the grid (the software factory glows at its north end, where `factory` dives
// in). Act title and event land on a scrim; then 80 sessions · 3 days. World: src/scenes/_worlds/city.js.
import { gsap } from 'gsap';
import { factSource, splitFigure, place, makeLookRig } from './_worlds/gl1-kit.js';
import { buildCity, STREET } from './_worlds/city.js';

const X = STREET(0); // the avenue the camera glides down
export const SHOTS = {
  glideFrom: { px: X, py: 16.5, pz: 104, tx: X + 2.5, ty: 9, tz: 30, shiftX: 0 },
  glide: { px: X, py: 12.5, pz: 64, tx: X + 4, ty: 8.5, tz: 6, shiftX: 0 },
  rise: { px: -24, py: 60, pz: 62, tx: 9, ty: 0, tz: -2, shiftX: 360 },
  hold: { px: -26, py: 57, pz: 56, tx: 8, ty: 0, tz: -6, shiftX: 370 },
};

export default {
  id: 'sf-arrival',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode } = ctx;
    const { THREE } = gl;
    const city = buildCity(ctx);
    const { world } = city;
    const rig = makeLookRig(THREE, world.camera, { ...SHOTS.glide, breathe: renderMode ? 0 : 0.25 });

    // ---------- DOM ----------
    const g = 'void';
    const acts = ctx.acts || [];
    const numbered = acts.filter((a) => a.n);
    const actIndex = Math.max(0, numbered.findIndex((a) => a.id === beat.act));
    const scrim = C.Scrim.create({ ground: g, side: 'left', extent: 0.8, strength: 0.96 });
    const act = C.ActTitle.create({ numeral: copy.act, title: copy.actTitle, index: actIndex, total: numbered.length || 5, ground: g, width: 1240 });
    const event = C.Kicker.create({ text: [copy.event, copy.place, copy.dates].filter(Boolean).join(' · '), ground: g, tone: 'fg' });
    const f1 = splitFigure(copy.stat1);
    const f2 = splitFigure(copy.stat2);
    const n1 = C.BigNumber.create({ display: f1.figure, unit: f1.unit || undefined, size: 'h1', ground: g });
    const n2 = C.BigNumber.create({ display: f2.figure, unit: f2.unit || undefined, size: 'h1', ground: g });
    const src = factSource(ctx, (beat.facts || [])[0]);
    const source = C.SourceLine.create({ kind: src.kind, text: src.text, ground: g });
    root.append(scrim.el, act.el, event.el, n1.el, n2.el, source.el);
    place(act.el, 128, 196);
    place(event.el, 128, 648);
    place(n1.el, 128, 724);
    place(n2.el, 640, 724);
    place(source.el, 128, 988);

    const vis = {};
    function show(c, key, want, tl, at, animate) {
      if (!!vis[key] === want) return;
      vis[key] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
    }

    function stateTo(step, animate, entering) {
      const A = animate && !renderMode;
      const tl = gsap.timeline();
      if (step === 0) {
        if (A && entering) { rig.set(SHOTS.glideFrom); tl.add(rig.to(SHOTS.glide, { duration: 9, ease: 'power2.out' }), 0); } else tl.add(rig.to(SHOTS.glide, { duration: 0 }), 0);
      } else if (step === 1) tl.add(rig.to(SHOTS.rise, { duration: A ? 6 : 0, ease: 'power3.inOut' }), 0);
      else tl.add(rig.to(SHOTS.hold, { duration: A ? 5 : 0, ease: 'sine.inOut' }), 0);
      show(scrim, 'scrim', step >= 1, tl, A ? 1.2 : 0, A);
      show(act, 'act', step >= 1, tl, A ? 2.4 : 0, A);
      show(event, 'event', step >= 1, tl, A ? 3.0 : 0, A);
      show(n1, 'n1', step >= 2, tl, A ? 0.2 : 0, A);
      show(n2, 'n2', step >= 2, tl, A ? 0.32 : 0, A);
      show(source, 'source', step >= 2, tl, A ? 0.6 : 0, A);
      return tl;
    }

    return {
      steps: beat.steps.length,
      world,
      enter() { return stateTo(0, true, true); },
      goto(step, { animate }) { return stateTo(step, animate, false); },
      exit() {
        const tl = gsap.timeline();
        tl.to(rig.state, { py: '+=3', duration: 0.8, ease: 'power2.in', onUpdate: rig.apply }, 0);
        return tl;
      },
      update(time) {
        const t = renderMode ? 0 : time;
        city.update(t);
        rig.update(t);
      },
      dispose() {
        gsap.killTweensOf(rig.state);
        [scrim, act, event, n1, n2, source].forEach((c) => c.destroy());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
