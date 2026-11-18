# gl-2 report (17:30, 18 Nov)

**Done:** breach (5 steps, ending on OpenAI's 23 Oct post), power (4), brazil (4, ending on Exame, 17 Nov), news-tunnel (2), motor (4). Shots: scratchpad `shots/gl2/final` and `final-live`.

**Checks:** fps.mjs on the M2: all 19 steps p95 16.67 ms at 1920×1080 and at Retina 2205×1240, 0 missed vsyncs. Smoke walk: 0 console errors. Zoomsim DOM: nothing under 26 px, no contrast failure.

**Shared code:** `_worlds/gl2-kit.js`, `grid-earth.js` (power and brazil share one world; brazil starts at power's last camera pose), `land-mask.js` (Natural Earth, public domain).

**Decisions:**
- The dark region is 4.7 % of PJM's lights (6,831 of 145,149 MW).
- 38.2 % of power routes end at data centres.
- 1,200 agents (METR), of which 700 leak.
- The clock runs 9 → 13 Jul (`hf-intrusion`).
- Gates sit at Brazil's border.
- Pillars are to scale (72 : 10).
- The Colombia line stays (verified).
- The Sun spy capture is excluded; four captures are cropped to their headlines.

**Fixed:** a NaN that blacked out brazil step 3 after live navigation.

**Limits:** the PJM outline is approximate. At Retina, load hitches drop the engine's pixel ratio to 1.0 on 6 steps; that logic is engine code (A1).
