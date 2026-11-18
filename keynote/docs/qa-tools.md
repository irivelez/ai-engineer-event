# QA tools

The checks behind the gauntlet (GOAL.md: G1 works, G2 fast, G3 legible) and the static fallback. They run from `keynote/` with Node 22 and `playwright-core` 1.58 (devDependency). The browser is the newest Chrome for Testing in `~/Library/Caches/ms-playwright` (override with `ITAF_CHROME=/path/to/chrome`).

## One browser at a time

This machine has 8 GB of RAM, so every script takes a lock directory before launching Chromium:

```sh
export ITAF_BROWSER_LOCK=<team lock dir>     # the director gives the path; default: $TMPDIR/itaf-browser.lock
```

- **Busy lock:** the script retries every 15 s.
- **Stealing:** a lock older than 15 min is stolen, unless its owner file names a PID that is still alive.
- **Watchdog:** every run has a hard watchdog (10–30 min by script). On expiry it kills the browser, releases the lock and exits 2.
- **Batches:** run several checks under a single acquisition:

```sh
node scripts/with-lock.mjs "node scripts/smoke.mjs" "node scripts/sync-check.mjs" "node scripts/fps.mjs --moments factory"
```

## The tools

| command | gate | what it does |
|---|---|---|
| `node scripts/build.mjs [--only a,b] [--out f.html] [--map id=file]` | | Builds `index.html`: one self-contained file. `--only` makes a dev build; `--map` runs another scene file as a moment. |
| `node scripts/smoke.mjs [f.html] [--quick]` | G1 | Walks every step of every moment forward with real → presses, then back with ←. Also checks `?m=<id>&s=`, `?m=<n>`, `?render=1` (ready flag) and `?only=`. Fails on any console error, page error or failed request. `--quick` drives the engine API instead of keys. Also works on `static.html`. |
| `node scripts/shoot.mjs [f.html] [--moments a,b] [--steps all\|0,2] [--out dir] [--live]` | G5 input | Writes `NN-<id>-S.png` per settled step at 1920×1080 plus `contact.png`. Default is `?render=1`, the exact final state. `--live` uses the real enter/step animations, then waits 0.4 s. |
| `node scripts/fps.mjs [f.html] [--moments a,b] [--steps …] [--seconds 5] [--json out.json] [--viewport 1470x956 --dpr 2]` | G2 | Headed Chromium on the GPU (ANGLE Metal), serial. A warm-up page load comes first; then each step is measured for 5 s after it settles. Pass: **p95 ≤ 16.7 ms on vsync-snapped intervals**. |
| `node scripts/zoomsim.mjs <png…> [--out dir]` | G3 | Zoom-share simulation: 1280×720, H.264 at 1.2 Mbps, decoded at 1.5 s. Writes `-zoom.png` and `-side.png` (original \| decoded) and the SSIM. SSIM < 0.93 is flagged for review. |
| `node scripts/zoomsim.mjs --html f.html [--moments a,b] [--json out.json]` | G3 | DOM audit per step in `?render=1`. **FAIL** on visible text < 26 stage px or contrast < 4.5:1 against its composited background. **over-gl** marks text with only the GL canvas behind it: check its scrim on the side-by-side. |
| `node scripts/sync-check.mjs [index.html]` | presenter | Two Playwright pages on file://. Tests each sync channel alone (postMessage via P, BroadcastChannel, localStorage), then all three. Checks state both ways, T timer, number + Enter jump, B blackout from the presenter, and presenter reload. |
| `node scripts/render-static.mjs [index.html] [--moments a,b] [--viewer-only]` | static | Writes `static/frames/NN-<id>-S.webp` (q 82) for every step from `?render=1`, plus `static/manifest.json` and `static.html`, then **rebuilds index.html** so the presenter thumbnails and the GL fallback know which frames exist. |
| `node scripts/check-opener.mjs [index.html] --out dir [--skip-film]` | opener | Checks the opener: black before the first press, the film playing unmuted after it, the held last frame, and that the `?novideo=1` fallback and `?render=1` land on the film's title box (x 584–1341, y 508–570). |

### fps output

Example (the `_example-gl` reference, 18 Nov, M2):

```
PASS  release-pace  s0  60 fps  p95 16.67 ms (raw 18.6)  work p95 1.3 ms  max 18.8  missed vsyncs 0  GL on pr 1.5 2205×1240
GPU: ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)
```

- **p95:** the frame interval with each rAF delta snapped to whole vsyncs. **raw** is the unsnapped rAF p95: at a perfect 60 fps it still reads ≈18.5 ms, because rAF timestamps jitter ±2 ms. A real missed frame shows as 33.3 ms.
- **work p95:** CPU time per frame inside the engine (scene `update()` plus GL submit). GPU-bound frames show up as missed vsyncs instead.
- **GPU:** if it says SwiftShader/software, the numbers mean nothing: check the flags and the display.
- **pr / buffer:** the GL pixel ratio and drawing buffer. The engine drops 1.5 → 1.0 by itself when snapped p95 > 18 ms for 2 s.

### Typical loop for a scene engineer

```sh
node scripts/build.mjs --only factory --out /tmp/f.html
node scripts/with-lock.mjs "node scripts/smoke.mjs /tmp/f.html" "node scripts/shoot.mjs /tmp/f.html --out /tmp/f-shots" "node scripts/fps.mjs /tmp/f.html"
node scripts/zoomsim.mjs /tmp/f-shots/*.png --out /tmp/f-zoom      # no browser needed
```

### Before the show (director)

```sh
node scripts/build.mjs                                   # full, minified
node scripts/with-lock.mjs "node scripts/smoke.mjs" "node scripts/sync-check.mjs" "node scripts/fps.mjs --json docs/qa/fps.json" \
  "node scripts/zoomsim.mjs --html index.html --json docs/qa/zoom-dom.json" "node scripts/render-static.mjs"
node scripts/smoke.mjs static.html
```

## Presenter (for Irina)

1. Open `index.html` (double-click), press **P**: the presenter window opens. Allow pop-ups for the file once if Chrome asks.
2. Press **F** in the audience window for fullscreen. **F5** on a clicker does the same.
3. Keys pressed in the presenter window drive the audience: → / Space next, ← back, number + Enter jump, T timer, B blackout, W whiteout, H cue icon, Home / End.
4. The timer starts on the first advance out of the opener (or T). It survives reloads of either window.
5. Single-screen rehearsal: press **N** in the audience window to see the notes overlay.
