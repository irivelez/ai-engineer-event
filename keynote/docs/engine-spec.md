# Engine spec: Inside the AI Frontier

The contract every engineer on this keynote builds against. Owners: **A1** engine core, **A2** presenter + QA tooling, **DD** design director, **E1–E10** scene engineers, **FD** fact desk, **director** (creative director).

## Output and hard constraints

- **Deliverable:** `keynote/index.html`, ONE self-contained file: JS inlined as a classic IIFE `<script>`, CSS inlined, fonts and images as data URIs. Irina opens it by double-click (`file://`) in Chrome or Safari. No network at runtime. The only external file is the optional `<video src="media/opener-1080p.mp4">`.
- **Why:** on `file://`, Chrome blocks ES modules, `fetch()`, cross-file `@font-face` and WebGL textures from other files (canvas taint). So: no `type="module"`, no `fetch`, fonts inlined, and every image a WebGL scene uploads must be a data URI (esbuild `dataurl` loader on import).
- **Stage:** fixed 1920×1080 logical stage, uniformly scaled to fit the window (letterbox in the current ground colour). All layout in stage px.
- **60 fps on a laptop** (this MacBook, 1920×1080 fullscreen): one WebGL renderer for the whole keynote; the render loop runs only while a GL moment is visible; `pixelRatio = min(devicePixelRatio, 1.5)`, dropping to 1.0 automatically if p95 frame time > 18 ms for 2 s.
- **Legible over a Zoom 1080p share:** no stage text below 26 px; body ≥ 40 px; no lines thinner than 2 px; no film grain or noise; dither large dark gradients; no full-frame strobing.

## Stack (pinned, read current docs before use)

`three@0.187.0`, `gsap@3.15.1` (all plugins are free and in the npm package: SplitText, CustomEase, Flip, DrawSVG, MorphSVG, ScrambleText), `postprocessing@6.39.6`, `troika-three-text@0.53.1`, `d3-scale` / `d3-shape` / `d3-array`, a QR generator (`qrcode-generator` or a tiny local one), `esbuild@0.28.2`, `playwright` (installed globally, 1.58, browsers in ~/Library/Caches/ms-playwright). Read each package's README in node_modules and its official docs before writing code against it.

## Layout and ownership

```
keynote/
  index.html            BUILT (A1), committed: the double-click target
  static.html           BUILT (A2), committed: static fallback viewer
  package.json          A1
  media/                opener-1080p.mp4 (gitignored) · captures/ (press-editor) · sf/ (sf-stills)
  static/frames/        generated (A2)
  src/
    main.js             A1: boot
    engine/             A1: stage, director (navigation), scene lifecycle, transitions, HUD cue icon, keys, URL params, state broadcast
    gl/                 A1: renderer, composer, helpers (particles, instanced flows, troika text, camera rigs, noise)
    presenter/          A2: presenter window, timer, notes overlay, sync client
    components/         DD: DOM components
    styles/             DD: tokens.css, base.css
    design/             DD: tokens.js, icons.js
    fonts/              DD: woff2 + OFL licences
    scenes/<id>.js      E1–E10: one file per moment id (beats.json); helper files go in scenes/<id>/
    scenes/_placeholder.js, _example-calm.js, _example-gl.js   A1
    data/beats.json     director (copy deck). FD may correct factual copy with Edit (never Write), logging each change in docs/fact-check.md
    data/notes.json, data/facts.json    FD
    data/captures.json  press-editor · data/sf-stills.json  sf-stills
  scripts/
    build.mjs           A1: node scripts/build.mjs [--only id1,id2] [--out path]
    shoot.mjs           A2: settled screenshot of every step
    fps.mjs             A2: frame-time stats per moment/step
    zoomsim.mjs         A2: Zoom-share legibility simulation
    render-static.mjs   A2: static frames + static.html
    animatic.mjs        A1: compressed animatic video + energy curve
  docs/                 specs, logs, reviews
```

Never edit a file another role owns; ask the director instead. Never commit or push (the director commits).

## Design tokens interface (DD writes, everyone imports)

`src/design/tokens.js` exports, with stable names:

```js
export const colors = { paper, ink, inkSoft, void, light, lightSoft, accent, accentPaper, verified, verifiedPaper, limit, limitPaper, alert, alertPaper, lab: { anthropic, openai, google } };
export const grounds = { paper: { bg, fg, muted }, void: { bg, fg, muted } };
export const type = { display, h1, h2, body, label, source, families: { sans, mono, serif } }; // each size: { size, line, track, weight }
export const space = { margin, gutter, col, baseline };
export const motion = { calmIn, calmOut, burst, roll, iris, stagger, eases: {...} }; // { dur, ease }
export const provenance = { independent, labReported, secondary, official, estimate, press }; // { label, color }
```

If A1 starts before DD has written it, A1 creates a minimal stub with exactly these names and DD replaces the values.

## Scene module contract

```js
// src/scenes/<moment-id>.js
export default {
  id: 'factory',            // equals a beats.json moment id
  gl: true,                 // needs the shared WebGL layer
  create(ctx) {
    // ctx.root        HTMLElement: this scene's 1920×1080 DOM layer (hidden until enter)
    // ctx.beat        the moment from beats.json; ctx.copy === ctx.beat.copy
    // ctx.facts(id)   fact from facts.json (or null)
    // ctx.tokens      design tokens; ctx.components  DOM components (DD)
    // ctx.assets      { sf(id), capture(id), image(importedDataUri) } → data URIs from the manifests
    // ctx.gl          gl scenes only: { THREE, renderer, makeWorld(opts), helpers }
    // ctx.renderMode  true in ?render=1: no animation, settle instantly, deterministic seeds
    return {
      steps: ctx.beat.steps.length,                              // states, ≥ 1
      enter({ from, direction }) { return gsap.timeline(); },    // into step 0
      goto(step, { animate, direction }) { return gsap.timeline(); }, // idempotent state for `step`
      exit({ to, direction }) { return gsap.timeline(); },       // ≤ 0.8 s
      update(time, dt) {},                                       // per frame while visible
      world: null,                                               // gl: { scene, camera, post: { bloom, vignette } }
      dispose() {}                                               // free everything (GPU too)
    };
  }
};
```

Rules:
1. `goto(i, { animate: false })` reaches the exact final visual state of step i, deterministically. Going back and the static renderer depend on it.
2. No `setTimeout`/`setInterval` for animation: only gsap timelines and `update()`, so pause, seek and render mode work.
3. Every on-screen string comes from `ctx.copy`. Never hardcode visible text or numbers. If copy does not fit, tell the director.
4. In `ctx.renderMode`, settle instantly with fixed random seeds.
5. Dispose geometries, materials, textures and listeners in `dispose()`.

## Director (navigation)

- Next: → ↓ Space PageDown Enter (and stage click). Previous: ← ↑ PageUp Backspace. Home / End. Number + Enter jumps to moment n. G: overview grid. F: fullscreen. B or `.`: blackout. W or `,`: whiteout. P: open presenter window. N: notes overlay. T: start/reset timer. H: toggle cue icon. `?`: help. Presentation clickers send PageUp/PageDown/B/period/F5/Esc: support all.
- Default cross-moment transition: 0.6 s crossfade. A change of ground (paper ↔ void) uses the designed transitions from tokens (iris, light wipe, hard cut). A scene's `enter` may override.
- Preload: `create()` the next two moments while idle so entering is instant.
- URL params: `?m=<id|n>&s=<step>` start point · `?render=1` deterministic static mode · `?auto=1` auto-advance by plannedSec spread over steps (animatic) · `?speed=N` time scale for auto · `?fps=1` frame-time HUD · `?only=id,…` dev builds.
- State broadcast on every change: `{ type:'state', momentId, momentIndex, step, steps, timer:{ startedAt, running }, at }` through (1) `postMessage` to the presenter window opened with `window.open` (and back through `window.opener`), (2) `BroadcastChannel('itaf')`, (3) `localStorage['itaf-state']` + `storage` events. Presenter commands: `{ type:'cmd', cmd:'next'|'prev'|'goto'|'timer', momentId?, step? }`.

## GL layer

- One `THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })`, sRGB output, AgX tone mapping (exposure ~1.05), `postprocessing` EffectComposer: RenderPass + one EffectPass (Bloom with mipmap blur, Vignette, SMAA; optional tiny ChromaticAberration). Per-world settings via `world.post`.
- The canvas sits under the DOM stage and is letterboxed to the same 16:9 rectangle so GL and DOM align pixel for pixel.
- Helpers in `src/gl/`, each with a usage example in `docs/scene-guide.md`: `makeWorld()`, GPU particles (ShaderMaterial, soft round sprites), instanced flows along curves, `text3d()` via troika, camera rigs (dolly/orbit driven by gsap), simplex noise, colour helpers from tokens.
- `gsap.ticker` drives `update()`. Render only the visible world(s); stop when none or when `document.hidden`.

## Placeholder and animatic (A1)

- `scenes/_placeholder.js` renders any moment without a scene file: ground colour, act, title, brief, the step list with the current step highlighted, the visual description in small type, planned time. The full 60-minute run exists from the first hour.
- `node scripts/animatic.mjs` records `?auto=1&speed=12` with Playwright `recordVideo` into `docs/animatic/` and draws `docs/animatic/energy-curve.svg` from beats.json (x = planned time, y = energy, colour = ground). Videos over 25 MB stay out of git.

## Presenter (A2)

- `index.html#presenter` (same file) renders the presenter UI instead of the stage.
- Layout for a laptop screen (≥1440×900): current moment (act, title, step k/n, large cue icon + idea name), speaker notes (24–26 px, readable at arm's length), sources as links; NEXT moment title + thumbnail (from static/frames when present); timer block: elapsed (large), planned elapsed at this moment, delta ahead/behind (green/amber/red), time in this moment vs its plannedSec, Bogotá wall clock (America/Bogota), act progress bar.
- Keys in the presenter window drive the audience window. N in the audience window shows a notes overlay for single-screen rehearsal.
- Timer starts on the first advance out of the opener (or T) and survives reloads (localStorage).
- Notes from `data/notes.json` (`{ [momentId]: { notes: [], sources: [{label,url}], transition } }`), falling back to `beat.brief`.

## Static fallback (A2)

- `scripts/render-static.mjs`: open the built index.html in Playwright Chromium (1920×1080, DPR 1); for every moment and step load `?render=1&m=…&s=…`, screenshot to `static/frames/NN-<id>-S.webp` (quality 82), write `static/manifest.json`.
- `static.html`: self-contained viewer with arrows, fullscreen, notes overlay and the same presenter sync; images as `<img>` (file:// safe).
- Auto-fallback: if WebGL creation fails or the context is lost twice, GL moments show their static frame instead.

## QA tooling (A2)

- `node scripts/shoot.mjs <html> --moments a,b [--steps all] --out <dir>`: PNG per settled step at 1920×1080 + a contact sheet.
- `node scripts/fps.mjs <html> --moments a,b`: per moment/step mean fps, p95 frame time, dropped frames over 5 s, in headed Chromium with GPU (`--use-angle=metal`), JSON + table. Runs serially (GPU contention makes parallel runs meaningless).
- `node scripts/zoomsim.mjs <png…>`: downscale to 1280×720, encode H.264 at 1.2 Mbps with ffmpeg, decode, write side-by-side; plus a DOM check listing text below 26 stage px or contrast below 4.5:1.
