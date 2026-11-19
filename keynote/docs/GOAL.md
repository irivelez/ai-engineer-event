# Goal

By **Wed 18 Nov 2026, 18:00 Bogotá**, `keynote/index.html` opens by double-click and runs the full 60-minute «Inside the AI Frontier» keynote (45 moments, from the opener film to Questions) at the GTC Berlin / DevDay bar, with presenter mode (arrow keys, English notes with each moment's cue icon and sources, timer), fullscreen and a static fallback, and every on-screen number traced to a public source. Final freeze: Thu 19 Nov, 15:00.

## Definition of done

1. Opens from Finder by double-click (`file://`) in Chrome and Safari: no network, no console errors.
2. All 45 moments are real scenes (no placeholder left); every step reachable forward and back.
3. Presenter window (P): English notes, cue icon, source links, timer (elapsed, planned, delta, Bogotá clock), next-moment preview, synced both ways.
4. 60 fps: every GL moment has p95 frame time ≤ 16.7 ms at 1920×1080 on this MacBook (headed Chromium, GPU).
5. Legible over a Zoom 1080p share: zoomsim passes on every step; no stage text below 26 px; contrast ≥ 4.5:1.
6. Every number on screen maps to `src/data/facts.json` with a public URL and a label (independent, lab-reported, secondary, official, estimate, press), signed off in `docs/fact-check.md`.
7. `static.html` has every step pre-rendered; the engine falls back automatically if WebGL fails.
8. Every moment passed the gauntlet, judged by a critic who did not build it.
9. Public-repo hygiene: only public facts and captures, each with its link; no private paths; the film is not committed.
10. README: who uses it, how to open, keys, how to rebuild, review-by date.

## The gauntlet

Each moment loops until it passes (max 3 rounds; then the director decides):

- **G1 Works:** builds, no errors; enter, goto, exit and back are clean; render mode is deterministic.
- **G2 Fast:** `fps.mjs` p95 ≤ 16.7 ms on every step.
- **G3 Legible:** zoomsim passes; sizes and contrast within tokens.
- **G4 True:** every number and quote matches facts.json or the captions.
- **G5 World-class:** a critic scores it 1–10 against the reference key frames on composition, type, motion, light and colour, and clarity of the one idea. Pass = every score ≥ 8 and nothing from the "looks cheap" list: default fonts, misaligned baselines, crowded text, unmotivated motion, clip-art icons, generic gradients, tiny labels, jank, text over busy 3D without a scrim.

## Overnight goal, 18 → 19 Nov: the motion redesign

Irina, 18 Nov 22:45: the animated moments look "basic… like AI slop"; she wants them world-class, every visual grounded, ready to review on the morning of the talk.

**By 19 Nov, 09:00 Bogotá:**

1. All 11 animated moments are redesigned to one bar. Hero 3D rebuilds: `motor`, `swarm`, `sf-arrival`, `breach` (real materials, image-based light, depth of field, one motivated camera move per step). Editorial motion built from real data: `factory`, `release-pace`, `three-labs`, `callback`. Real geography: `brazil` and `power` (Natural Earth shapes, honest footprints). `news-tunnel`: real headlines in one focus-pulling dolly.
2. Grounded: every count, date and duration a visual implies matches `src/data/facts.json`; no invented numbers, screens, labels or logos; real places and history drawn faithfully.
3. Each passes G1–G4 above, at 60 fps both at 1920×1080 and on a MacBook Air Retina viewport (1470×956 @2x), with a full smoke at zero console errors and the static fallback re-rendered.
4. G5 is judged side by side: a redesign ships only if it clearly beats the committed version; otherwise the committed version stays.
5. Irina gets side-by-side before/after videos and a one-page summary. Nothing is pushed or deployed without her yes.
