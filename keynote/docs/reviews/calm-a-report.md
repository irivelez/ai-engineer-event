# calm-a report (17:15)

**Done:** all 19 built and polished: title, question, sf-topics, slop, lean-harness, org, verification, last-job, year-in-weeks, self-build, price, ruler, open-weights, twins, and-yet, employee-bar, economics, rulers-break, recipe. Shared helpers: `src/scenes/_calm/kit.js`. There are no GL moments, so no fps runs. Smoke (all 19) passes: 53 steps forward, 52 back, zero console errors. Live end states match render within 0.2 % of pixels; the rest is ambient motion. Zoom sim SSIM ≥ 0.996, and no text is under 26 px. Final shots: scratchpad `shots/final`.

**Decisions**
- title reuses `fitFilmTitle`: ink box 584–1340 × 508–570, vs the film's 584–1341 (mean pixel diff 0.8/255). Step 2 opens white, so question starts on white.
- year-in-weeks plots only the two known points, plus the trend over the same 11 weeks; the gap is bracketed.
- employee-bar: Fable's 82 % = copy's 65 % + "17 points lower" (as style frame A). Staff line and note come from `barLabel`/`barNote`.
- Director critique items 1–6 done (recipe dark card, org evidence still, display-size heroes).
- Found and reported, lead fixed: `ctx.facts` index, HUD z-order, line-mask margin collapse, `shoot.mjs --live`.

**Open:** two employee-bar contrast flags are checker false positives; I checked both by eye.
