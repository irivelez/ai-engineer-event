# Scene guide: building a moment

For scene engineers (E1–E10). The contract is `docs/engine-spec.md`; this page is the how-to. Two working templates:

- `src/scenes/_example-calm.js`: PAPER, DOM only, built from DD's component kit.
- `src/scenes/_example-gl.js`: VOID, the shared WebGL layer (particles, flows, tubes, 3D text, camera rig, DOM caption over a scrim).

All commands run from `keynote/`.

## 1. The 5-minute loop

```sh
cp src/scenes/_example-gl.js src/scenes/factory.js                     # file name = moment id in beats.json
node scripts/build.mjs --only factory --out /tmp/factory.html          # isolated dev build: ~0.3 s, readable JS
open /tmp/factory.html                                                 # Chrome; → ← walk the steps
```

- Set `id: 'factory'` in your module (it must equal the beats id).
- `--only a,b`: build only those moments, so another engineer's broken scene can't break your build.
- `--map factory=_example-gl`: run any file in `src/scenes/` as that moment, to try a variant.
- The full build (`node scripts/build.mjs`) picks up every `src/scenes/<id>.js` whose name matches a beats id. Moments without a file use `_placeholder.js`.
- Helper files for one scene go in `src/scenes/<id>/` (import them relatively). Files starting with `_` are never moments.
- URL params while you work:
  - `?m=factory&s=2`: open at step 3. Steps are 0-based in URLs; `?m=` also takes the 1-based moment number.
  - `?fps=1`: frame-time HUD.
  - `?render=1`: deterministic final state, which is what the static fallback and screenshots use.
  - `?nogl=1`: simulate WebGL failure.
  - `?novideo=1`: opener fallback.
  - `?evidence=poster` / `?evidence=youtube`: force an evidence clip's fallback (the embed only works on http(s)).
- Keys: → / ← steps, G grid, `?` help, N notes, H cue icon.

## 2. The module

```js
// src/scenes/<id>.js
import { gsap } from 'gsap';

export default {
  id: 'factory',
  gl: true,                 // true → ctx.gl exists and the shared canvas renders your `world`
  // transition: 'iris',    // optional: 'fade' | 'iris' | 'wipe' | 'cut' | 'none' (else: by ground change)
  create(ctx) {
    // build everything ONCE here (DOM, GL objects). Nothing is visible until enter().
    return {
      steps: ctx.beat.steps.length,
      enter({ from, direction }) { return stateTo(0, true); },     // into step 0; return a gsap timeline
      goto(step, { animate, direction }) { return stateTo(step, animate); },
      exit({ to, direction }) { return gsap.timeline(); },         // ≤ 0.8 s; runs under the incoming moment
      update(time, dt) {},                                         // every frame while visible (seconds)
      world,                                                       // gl only: { scene, camera, post }
      dispose() {},                                                // free DOM, GPU, listeners, tweens
      // optional:
      // intercept(dir) { return true; }   // consume a → / ← press (e.g. the opener starts its film)
      // background: '#000000',            // letterbox + wrapper colour if not the ground colour
    };
  },
};
```

### The state pattern

Write each step as a state, and make `goto()` move every element to that state:

```js
const shown = new Set();
function stateTo(step, animate = true) {
  const tl = gsap.timeline();
  for (const p of parts) {                       // parts = [{ c: component, from: stepIndex }]
    const want = step >= p.from;
    if (want && !shown.has(p.c)) { p.c.in(tl, 0); shown.add(p.c); }
    else if (!want && shown.has(p.c)) { p.c.out(tl, 0); shown.delete(p.c); }
  }
  return tl;
}
```

The engine guarantees the following:

- When `animate` is false (back-navigation, `?render=1`, jumps), the engine calls `tl.progress(1)` on what you return, so the final state of the timeline must be the exact state of that step.
- A fast double press finishes the running timeline (`progress(1)`) before calling `goto` again.
- Going back into a moment: the engine calls `enter({ direction: -1 })`, finishes it instantly, then calls `goto(last, { animate: false })`.

### What `ctx` holds

| field | what |
|---|---|
| `ctx.root` | your 1920×1080 DOM layer (absolute-positioned children, stage px) |
| `ctx.beat`, `ctx.copy` | the moment from beats.json; `copy` is `beat.copy` |
| `ctx.facts(id)` | fact from facts.json or `null` |
| `ctx.notes` | this moment's speaker notes (do not show them on stage) |
| `ctx.tokens` | DD's tokens (`colors`, `grounds`, `type`, `space`, `motion`, `provenance`) |
| `ctx.components` | DD's kit: `X.create(opts) → { el, in(tl, at), out(tl, at), set(state, { animate }), destroy() }`. Kit: Headline, Kicker, BigNumber, ProvenanceChip, SourceLine, Quote, CaptureCard, BarChart, BeforeAfter, StepList, ActTitle, Scrim. See `docs/design-system.md`. |
| `ctx.assets` | `sf(id)`, `capture(id)` → data URI · `sfMeta(id)`, `captureMeta(id)` → manifest fields (speaker, url, timecode…) · `sfIds()`, `captureIds()` · `image(uri)` · `evidence(id)`, `evidenceFor(momentId)` → evidence.json item + `posterSrc`/`imageSrc` (data URIs), `file` relative to the built page, `chip` (provenance kind from its first fact) · `evidenceIds()` |
| `ctx.gl` | gl scenes only: `{ THREE, renderer, makeWorld, helpers, composer, effects }` |
| `ctx.renderMode` | true under `?render=1`: no animation, settle instantly |
| `ctx.random()` | seeded PRNG (seed = moment id), so it is deterministic everywhere |
| `ctx.act`, `ctx.number`, `ctx.total`, `ctx.beats`, `ctx.ground`, `ctx.gsap` | context |

## 3. Rules (the gauntlet checks these)

1. **Copy:** every visible string comes from `ctx.copy` (or facts.json / the asset manifests). No hardcoded text or numbers. If copy doesn't fit, tell the director.
2. **No timers:** no `setTimeout` / `setInterval` for animation. Use gsap timelines and `update()` only, so pause, seek and render mode work.
3. **Render mode:** in `ctx.renderMode`, settle instantly with fixed seeds. The engine then calls `update(0, 0)` once and renders one GL frame, so any GL state must be correct after that single call. Avoid `Math.random()`: use `ctx.random()` or `helpers.seeded('x')`.
4. **Dispose everything:** `world.dispose()` frees every geometry, material and texture in the scene graph. For anything outside it, register it with `world.track(obj)` or dispose it yourself. Also kill your tweens (`gsap.killTweensOf(...)`) and remove listeners. The engine keeps at most 4 moments alive and disposes the rest.
5. **Legibility (Zoom 1080p):**
   - No stage text below 26 px; body ≥ 40 px.
   - No line thinner than 2 px. That includes 3D lines: keep `tube()` radius ≥ 2 px on screen.
   - No grain or noise textures, no full-frame strobing.
   - Text over 3D always sits on a scrim (`C.Scrim`) or in a calm area.
6. **Frame budget:** p95 ≤ 16.7 ms on every step (`scripts/fps.mjs`, headed, GPU). The post chain (bloom, SMAA, dither) runs on every GL frame, so measure your scene early. The reference `_example-gl` (2,500 particles, 900 streaks, 6 tubes, 3D text) measured on this M2 (headed Chromium, ANGLE Metal, 18 Nov) at 60 fps with 0 missed vsyncs and CPU work p95 ≤ 1.3 ms, both at 1920×1080 (DPR 1) and at Retina fullscreen (1470×956, DPR 2 → pixel ratio 1.5, 2205×1240 buffer).

## 4. GL layer

There is one `WebGLRenderer` for the whole keynote:

- Pipeline: RenderPass → Bloom (mipmap) + Vignette + AgX tone mapping → SMAA → 1-LSB dither.
- Output: sRGB, HalfFloat buffers. Colours > 1.0 bloom.
- Canvas: 1920×1080 stage px inside the scaled stage, so it lines up pixel for pixel with your DOM. Pixel ratio = min(devicePixelRatio, 1.5), dropping to 1.0 automatically if p95 > 18 ms for 2 s.
- Rendering: only your `world`, only while your moment is visible.
- GL→GL transitions freeze the outgoing frame for the crossfade.
- If WebGL fails (or the context is lost twice), GL moments show `static/frames/NN-<id>-S.webp` instead.

### makeWorld

```js
const { THREE, makeWorld, helpers: H } = ctx.gl;
const world = makeWorld({
  background: ctx.tokens.colors.void,        // or null for none, or set world.scene.background = H.gradientTexture(...)
  fog: { density: 0.035 },                   // FogExp2 in the background colour
  fov: 32, cameraPosition: [0, 0, 12], lookAt: [0, 0, 0],
  post: {
    bloom: { intensity: 1.1, threshold: 0.55, smoothing: 0.3, radius: 0.75 },   // or false
    vignette: { offset: 0.28, darkness: 0.6 },                                  // or false
  },
});
world.add(mesh);            // = world.scene.add(mesh)
world.track(renderTarget);  // disposed with world.dispose()
// return { world, ... } from create(). You can change world.post.* at any time (applied every frame).
```

### Colour

```js
H.color('accent')            // THREE.Color from tokens; also 'lab.anthropic', 'verified', '#93AAFF'
H.color('accent', 3)         // ×3: HDR, blooms
```

### GPU particles

Soft round sprites with an optional simplex drift in the vertex shader:

```js
const dust = world.add(H.particles({
  count: 2500, spread: [44, 18, 30], center: [0, 0, -4],   // or positions: Float32Array(count*3)
  size: 0.05, colors: ['accent', 'light'], intensity: 1.2, drift: 0.35, seed: ctx.beat.id,
}));
// update(time) { dust.update(time); }
// dust.uniforms.uOpacity.value, uIntensity, uDrift, uSize are live
```

### Instanced flows along curves

Streaks travel along curves and fade at the ends. Instance matrices are updated on the CPU each frame; check `work p95` in `fps.mjs` if you use thousands.

```js
const curves = [new THREE.CatmullRomCurve3([new THREE.Vector3(-16, 0, 0), new THREE.Vector3(0, 1, -2), new THREE.Vector3(16, 0, 0)])];
const streaks = world.add(H.flow({ curves, count: 900, size: 0.03, stretch: 6, color: 'accent', intensity: 4, speed: [0.03, 0.07], seed: ctx.beat.id }));
// update(time) { streaks.update(time); }      // deterministic for a given time (render mode: time 0)
```

### Glowing line along a curve

```js
const line = world.add(H.tube(curve, { radius: 0.02, color: 'accent', intensity: 2.2 }));   // ≥ 2 px on screen
```

### 3D text (troika)

```js
const t = world.add(H.text3d({ text: ctx.copy.title, fontSize: 0.62, maxWidth: 11, textAlign: 'center', color: 'light', intensity: 1.15, weight: 600 }));
t.position.set(0, 2.9, 1);
t.fillOpacity = 0;                 // tween it: gsap.to(t, { fillOpacity: 1 })
// dispose(): t.dispose() (world.dispose() also frees it)
```

- Fonts come from `src/fonts/*.woff|ttf|otf`, inlined as data URIs. troika cannot read woff2, so DD added `Geist-SemiBold.woff`. Pick with `font: 'Geist-SemiBold.woff'` or `weight`.
- troika only knows the glyphs in that font. A missing character (arrows, rare symbols) makes troika try a CDN at runtime, which fails offline. Keep symbols in DOM text.
- Layout is async (web worker). Render mode waits for it (`H.whenReady()`).
- For large flat titles, prefer DOM text over the canvas: it is crisper and legible over Zoom.

### Camera rig

The rig is a spherical camera around a target, tweened with gsap:

```js
const rig = H.cameraRig(world.camera, { azimuth: -18, polar: 82, radius: 26, target: [0, 0, 0], breathe: ctx.renderMode ? 0 : 0.6 });
tl.add(rig.to({ azimuth: 8, radius: 15, ty: 0.4 }, { duration: 3.2, ease: 'power3.inOut' }), 0);   // in goto()
rig.set({ azimuth: 8, radius: 15 });          // instant
// update(time) { rig.update(time); }          // applies the subtle 'breathe' drift (0 in render mode)
```

### DOM labels pinned to 3D

```js
const p = H.worldToStage(mesh.position, world.camera);   // { x, y } in stage px
label.style.transform = `translate(${p.x}px, ${p.y}px)`;  // in update(), after the rig moves
const v = H.stageToWorld(960, 540, 10, world.camera);     // the point 10 units in front, under stage px (960,540)
```

### Noise, randomness, backgrounds

```js
H.noise.simplex3(x, y, z)        // JS, [-1, 1], deterministic
H.noise.glsl                     // GLSL snoise(vec3): paste into your ShaderMaterial
H.seeded('my-seed')()            // PRNG
world.scene.background = H.gradientTexture([['#0B1020', 0], ['#05070A', 1]], { radial: true });
```

You can use anything from three's addons, for example `import { Reflector } from 'three/addons/objects/Reflector.js';`. Use the same `THREE` (`ctx.gl.THREE` or `import * as THREE from 'three'`); both resolve to the one bundled copy.

## 5. Check your scene

```sh
node scripts/build.mjs --only factory --out /tmp/f.html
export ITAF_BROWSER_LOCK=<team lock dir>      # ask the director; one browser at a time on this machine
node scripts/smoke.mjs /tmp/f.html            # G1: every step forward/back, ?m=, ?render=1, zero console errors
node scripts/shoot.mjs /tmp/f.html --out /tmp/f-shots            # settled PNG per step (render mode) + contact.png
node scripts/shoot.mjs /tmp/f.html --live --out /tmp/f-live      # after the real animations instead
node scripts/fps.mjs /tmp/f.html                                  # G2: headed GPU run, p95 per step
node scripts/zoomsim.mjs /tmp/f-shots/*.png                       # G3: Zoom-share legibility
```

All QA scripts take the shared browser lock, run serially, and kill the browser and release the lock on any hang.

## 6. file:// pitfalls (why things fail only when double-clicked)

- **No ES modules, no `fetch()`, no XHR to files.** The build inlines everything. Import JSON and images (`import img from './x.webp'` → data URI); never load them at runtime.
- **WebGL textures must be data URIs.** An `<img src="media/x.png">` drawn into WebGL taints the canvas (`SecurityError`). Use `ctx.assets.sf(id)` / `ctx.assets.capture(id)`, or import the file: `new THREE.TextureLoader().load(dataUri)`, then set `tex.colorSpace = THREE.SRGBColorSpace`.
- **Fonts:** only the inlined `@font-face` fonts exist. A family name that DD didn't inline silently falls back to Helvetica.
- **The film** is the one external file (`media/opener-1080p.mp4`, gitignored). Everything else must work without it.
- **No network:** troika's default font and unicode fallback fetch from CDNs. `text3d()` always passes an inlined font; keep exotic glyphs in DOM.
- **Presenter sync** uses `postMessage` to the presenter window plus BroadcastChannel and localStorage. All three work on file:// in Chrome (`scripts/sync-check.mjs`). Safari is untested.
