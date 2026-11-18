// EXAMPLE (A1): a VOID burst moment on the shared WebGL layer. Copy this file to src/scenes/<id>.js.
// Try it on any void moment:  node scripts/build.mjs --only release-pace --map release-pace=_example-gl --out /tmp/gl.html
//
// Shows: makeWorld + post settings, GPU particles, instanced flow along curves, glowing tubes, troika
// text3d, a gsap-driven camera rig per step, a DOM caption over a scrim, render-mode settling, dispose.
import { gsap } from 'gsap';

// Camera state per step (spherical around the target). Step i uses SHOTS[min(i, last)].
const SHOTS = [
  { azimuth: -18, polar: 82, radius: 26, ty: 0 },
  { azimuth: 8, polar: 76, radius: 15, ty: 0.4 },
  { azimuth: 14, polar: 74, radius: 13, ty: 0.9 },
];

export default {
  id: '_example-gl',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode } = ctx;
    const { THREE, makeWorld, helpers: H } = gl;

    // ---- world ----
    const world = makeWorld({
      fog: { density: 0.035 },
      fov: 32,
      post: { bloom: { intensity: 1.1, threshold: 0.55, smoothing: 0.3, radius: 0.75 }, vignette: { offset: 0.28, darkness: 0.6 } },
    });

    // Six light paths sweeping through the frame.
    const curves = [];
    for (let i = 0; i < 6; i++) {
      const y = (i - 2.5) * 0.9;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const x = -16 + k * (32 / 6);
        pts.push(new THREE.Vector3(x, y + Math.sin(k * 0.9 + i) * 0.8, Math.cos(k * 0.7 + i * 1.3) * 3 - 2));
      }
      curves.push(new THREE.CatmullRomCurve3(pts));
    }
    const tubes = curves.map((c, i) => world.add(H.tube(c, { radius: 0.02, color: i === 2 ? 'accent' : 'lightSoft', intensity: i === 2 ? 2.2 : 0.35 })));
    const streaks = world.add(H.flow({ curves, count: 900, size: 0.03, stretch: 6, color: 'accent', intensity: 4, speed: [0.03, 0.07], seed: beat.id }));
    const dust = world.add(H.particles({ count: 2500, spread: [44, 18, 30], center: [0, 0, -4], size: 0.05, colors: ['accent', 'light'], intensity: 1.2, drift: 0.35, seed: beat.id }));

    // GL title (troika): needs a .woff/.ttf in src/fonts; skipped with a warning otherwise.
    const title = copy.title || copy.line || copy.line1 || '';
    const label = world.add(H.text3d({ text: title, fontSize: 0.62, maxWidth: 11, textAlign: 'center', color: 'light', intensity: 1.15 }));
    label.position.set(0, 2.9, 1);
    label.fillOpacity = 0;

    // ---- DOM caption over a scrim (text over 3D always gets a scrim) ----
    const scrim = C.Scrim.create({ ground: 'void', side: 'bottom', extent: 0.4, strength: 0.88 });
    root.appendChild(scrim.el);
    const caption = C.Headline.create({ text: (beat.steps && beat.steps[0]) || '', role: 'lead', ground: 'void', width: 1200 });
    Object.assign(caption.el.style, { position: 'absolute', left: '128px', top: '880px' });
    root.appendChild(caption.el);
    gsap.set([scrim.el, caption.el], { autoAlpha: 0 });

    // ---- camera rig ----
    const rig = H.cameraRig(world.camera, { ...SHOTS[0], breathe: renderMode ? 0 : 0.6 });

    function stateTo(step, animate) {
      const shot = SHOTS[Math.min(step, SHOTS.length - 1)];
      const tl = gsap.timeline();
      const dur = animate ? 3.2 : 0;
      tl.add(rig.to(shot, { duration: dur || 0.001, ease: 'power3.inOut' }), 0);
      tl.to(tubes[2].material.color, { r: step >= 1 ? 2.6 : 1.4, g: step >= 1 ? 3 : 1.6, b: step >= 1 ? 5 : 2.8, duration: dur || 0.001 }, 0);
      tl.to(label, { fillOpacity: step >= 2 ? 1 : 0, duration: animate ? 1.2 : 0.001, ease: 'power2.out' }, animate ? 1.4 : 0);
      if (step >= 1) { scrim.in(tl, 0); caption.in(tl, animate ? 0.4 : 0); }
      else { scrim.out(tl, 0); caption.out(tl, 0); }
      return tl;
    }

    return {
      steps: beat.steps.length,
      world,
      enter() { return stateTo(0, true); },
      goto(step, { animate }) { return stateTo(step, animate); },
      exit() {
        const tl = gsap.timeline();
        tl.to(rig.state, { radius: '+=6', duration: 0.8, ease: 'power2.in', onUpdate: rig.apply }, 0);
        return tl;
      },
      update(time) {
        streaks.update(time);
        dust.update(time);
        rig.update(time);
      },
      dispose() {
        gsap.killTweensOf([rig.state, label, tubes[2].material.color]);
        label.dispose();
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
