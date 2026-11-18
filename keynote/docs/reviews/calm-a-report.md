# calm-a report (draft, updated at the end)

**Done (first pass, 16:25):** all 19: title, question, sf-topics, slop, lean-harness, org, verification, last-job, year-in-weeks, self-build, price, ruler, open-weights, twins, and-yet, employee-bar, economics, rulers-break, recipe. Shared helpers: `src/scenes/_calm/kit.js`. Smoke (title→last-job): pass, zero console errors. Zoom sim: SSIM ≥ 0.996 on the densest frames.

**Decisions**
- title reuses `fitFilmTitle`: ink box 584–1340 × 508–570 vs the film's 584–1341 (mean pixel diff 0.8/255). Step 2 opens white inside the moment, so question starts on white.
- `ctx.facts(id)` returned null for every id (engine bug, fixed by the lead 16:00); the kit keeps a fallback.
- employee-bar shows Fable at 82 % = copy's 65 % + "17 points lower" (as style frame A); the ceiling label is the title's own phrase.
- No hardcoded copy: route numerals come from the acts; recipe's "+" signs are operators.

**Missing / open:** see final version.
