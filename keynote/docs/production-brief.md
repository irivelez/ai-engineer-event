# Production brief for scene engineers

Read this, then `docs/scene-guide.md` (how to write a scene), `docs/design-system.md` (tokens, components, DO/DON'T), `docs/GOAL.md` (the gauntlet) and your moments in `src/data/beats.json`.

## The bar

- **Calm moments (PAPER) = OpenAI DevDay 2026.** White, black type, one idea on screen, generous white space, everything on the 12-column grid, baselines aligned. Motion is quiet and motivated: line-mask reveals, odometer numbers, nothing decorative. If you can remove an element and the idea survives, remove it.
- **Burst moments (VOID) = NVIDIA GTC Berlin 2026.** Full-screen 3D with depth, light as material, slow confident camera, bloom with restraint, particles as soft light (never square dots), motion that carries the idea (the swarm organizes, the sandbox cracks, the grid goes dark). Numbers land big and calm on a scrim, never over busy 3D.
- **The rhythm** is the point: a calm moment should feel like silence after a burst, and a burst should feel like a door opening.
- Reference frames (look at them before you start, never copy them into the repo): `/private/tmp/claude-501/-Users-irina-AI-driven-OS-projects-ai-engineer-event/839b685b-f9b9-4b77-a2a2-6ce2aa40e805/scratchpad/refs/key/` (gtc-*.jpg, devday-*.jpg, map.txt). Style frame A: `docs/style-frames/A-employee-bar.png`.

## Rules that are not negotiable

1. Every visible string and number comes from `ctx.copy` (beats.json). Never hardcode copy. If copy does not fit, shorten the layout, not the text, and tell the director.
2. Every number on screen carries a ProvenanceChip and a SourceLine built from `ctx.facts(id)` (label + publisher + date). If a fact is missing from facts.json, show the chip from the beat's `tag` copy and tell the director.
3. Zoom-safe: no stage text below 26 px; body ≥ 40 px; strokes ≥ 2 px; no grain; no full-frame strobing; text over 3D sits on a scrim or a calm area.
4. 60 fps: p95 ≤ 16.7 ms on every step. Budget per GL moment: ≤ 150 draw calls, instancing for repeated meshes, GPU particles (≤ 200k points), no allocations inside `update()`, textures ≤ 2048 px, dispose everything.
5. `goto(i, { animate: false })` lands the exact final state of step i (static fallback and going back depend on it). Render mode settles instantly with fixed seeds and awaits `document.fonts.ready`.
6. Real media only through `ctx.assets` (stills in `data/sf-stills.json`, captures in `data/captures.json`). Never invent a screenshot, a quote or a number. If an asset is missing, design the moment so it still works without it, and say so in your report.

## Workflow per moment

1. Read the moment in beats.json: brief, steps, copy, visual, facts.
2. Build it in `src/scenes/<id>.js` (shared 3D worlds in `src/scenes/_worlds/<name>.js`, owned by the engineer who builds that world).
3. Isolated build: `node scripts/build.mjs --only <id>[,<id>] --out .dev/<id>.html`.
4. Screenshot every step: `node scripts/shoot.mjs .dev/<id>.html --moments <id> --steps all --out <scratch>/shots/<id>`. Look at every PNG next to the reference frames. Be your own harshest critic: would this look out of place at GTC or DevDay?
5. Frame time (GL moments): `node scripts/fps.mjs .dev/<id>.html --moments <id>` (it takes the shared browser lock; runs are serial).
6. Zoom check: `node scripts/zoomsim.mjs <png…>`.
7. Iterate until it passes G1–G3 of the gauntlet and your own G5 judgment, then move to the next moment. Do not polish one moment for an hour while others are unbuilt: first pass on all your moments, then a polish pass.

## Machine discipline (8 GB RAM, crashed twice today)

- One Playwright/Chromium browser at a time across the whole team: `mkdir $S/browser.lock` before launching (retry every 15 s; a lock older than 15 min is stale: remove it), `rmdir` right after closing the browser. Never leave a browser or server running.
- Never commit or push; the director commits. Never edit files you don't own: engine (`src/engine`, `src/gl`, `scripts`, `src/presenter`), design (`src/design`, `src/styles`, `src/components`, `src/fonts`), facts (`src/data/facts.json`, `notes.json`), media (`media/`, `data/captures.json`, `data/sf-stills.json`), director (`data/beats.json`, docs). Need a change there? SendMessage the owner or "team-lead".

## Report

At each finished moment, append one line to `docs/reviews/progress.md`: `HH:MM · <id> · done · <shots dir> · p95 <ms>`. Final report to "team-lead" (≤ 200 words): moments done, p95 per GL moment, anything missing or cut, and why.
