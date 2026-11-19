# AI Engineer event

**Who uses it:** Irina, for her AI Engineer event project. **Review by:** 17 Feb 2027.

## Inside the AI Frontier: the keynote

**Who uses it:** Irina Vélez presents it live on Thursday 19 November 2026, 19:00 Bogotá (GMT-5), at «Inside the AI Frontier», a free online session for Latin American business leaders. About 60 minutes (56 planned), 44 moments: an opening film, then what San Francisco is building, what the frontier labs show, where they hit their limits, what the world is saying, and what leaders do next.

### Open it

1. Put the opening film in place (it is not in git): `cp ~/Movies/inside-the-ai-frontier/opener-1080p.mp4 keynote/media/`. Without it, a 20-second typographic opener plays instead and ends on the same title frame.
2. Double-click `keynote/index.html`. It is one self-contained file that runs offline from `file://`. Tested in Chrome.
3. Press **F** for fullscreen and **P** to open the presenter window, then **→** to start the film (browsers only allow sound after a key press).

### Keys

| Key | What it does |
|---|---|
| → ↓ Space PageDown Enter | Next step |
| ← ↑ PageUp Backspace | Previous step |
| F | Fullscreen |
| P | Presenter window: notes, cue icon, sources, timer, next moment |
| N | Notes overlay in the same window (rehearsal on one screen) |
| T | Start or reset the timer (it also starts on the first → after the film) |
| B or . / W or , | Blackout / whiteout |
| G | Overview of all moments |
| A number, then Enter | Jump to that moment |
| H | Hide or show the cue icon |
| M | Sound on or off for the evidence video that is playing (they start muted) |
| Home / End | First / last moment |
| ? | Help |

Presentation clickers that send PageUp/PageDown work too. The presenter window and the stage stay in sync both ways; either one can drive.

### Sources and evidence

- `keynote/sources.html` lists every claim on screen, moment by moment, with its provenance label, publisher, date and link. `node scripts/build.mjs` regenerates it. The end moment's «All sources» QR opens the deployed copy (https://inside-the-ai-frontier.vercel.app/sources.html), so redeploy after a build that changes facts or evidence.
- Evidence clips (`keynote/media/evidence/*.mp4`, listed in `keynote/src/data/evidence.json`) are not in git. Without the file, a clip shows its poster and link when opened from `file://`, and the YouTube embed on the website. Clips start muted; **M** turns sound on.
- The San Francisco footage (`keynote/media/plates/*.mp4`, moment 4) is licensed stock and not in git either. Keep both files next to `index.html` on show day and in the website deploy; without them the moment shows its graded still frames. Sources, licence and edits: [`keynote/docs/footage-manifest.md`](keynote/docs/footage-manifest.md).

### On Zoom

- Share the keynote **window** (not the whole screen) and keep the presenter window on the laptop screen.
- In the share selection window, tick **Share sound** so the film's audio reaches the audience ([Zoom: sharing computer audio](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0063608)), and turn on **Optimize for video clip** for smoother motion; Zoom caps the share at 1080p or 720p in that mode ([Zoom: sharing video with sound](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0064733)).
- If 3D fails on the day, open `keynote/static.html`: every step is pre-rendered, with the same keys, notes and presenter window.

### Before the show (19 Nov, morning)

From [`keynote/docs/fact-check.md`](keynote/docs/fact-check.md):

1. **Lauren Tan's YouTube views** (moment 7, "All Code Is Slop"): read the current count on [YouTube](https://youtu.be/O_zcc6Xl12g), update `views` in `keynote/src/data/beats.json`, rebuild.
2. **The US chip rule** (moment 28, Brazil): check whether Federal Register document 2026-23529 was published (scheduled for 19 Nov). If not, change "now need" to "will need" in the brazil moment.
3. **Leaderboards** (moment 18, "Who leads?"): re-check [Artificial Analysis](https://artificialanalysis.ai/leaderboards/models) (Gemini 4 Neon appeared at 61 on 18 Nov with no Google announcement found yet), [Arena](https://arena.ai/leaderboard/text) (GPT-6.2 may have entered) and Epoch's [ECI scores](https://epoch.ai/eci), which also feed moment 15's chart. ARC Prize's 98.5% is on moment 24.
4. **US Census AI adoption** (moment 33, "Two speeds"): the Census Bureau publishes a new survey round on 19 Nov. If it changes the 24.6% (`census-btos-ai-246` in `keynote/src/data/facts.json`), update the fact and its date. The 5 Nov round read 24.2%, but its question changed wording, so the slide uses October.

Rebuild after any change: `cd keynote && node scripts/build.mjs`.

### Where every number comes from

- Every number on screen: [`keynote/src/data/facts.json`](keynote/src/data/facts.json), each with its public link, date and label (independent, lab-reported, secondary, official, estimate, press). The label is the chip next to the number on screen.
- The check, the corrections and the decisions: [`keynote/docs/fact-check.md`](keynote/docs/fact-check.md).
- X and press captures, with URL, author, date, counts and capture time: [`keynote/docs/captures-manifest.md`](keynote/docs/captures-manifest.md).
- AI Engineer Code Summit stills, with the verbatim quote and the YouTube timestamp: [`keynote/src/data/sf-stills.json`](keynote/src/data/sf-stills.json).
- Speaker notes, sources and transitions for every moment: [`keynote/src/data/notes.json`](keynote/src/data/notes.json).

### Rebuild and check

```sh
cd keynote
npm install
node scripts/build.mjs                       # → keynote/index.html (one file)
node scripts/smoke.mjs index.html            # every step forward and back, zero console errors
node scripts/render-static.mjs               # → static frames + static.html
```

QA tools (frame time, Zoom legibility, screenshots, presenter sync): [`keynote/docs/qa-tools.md`](keynote/docs/qa-tools.md). How to write a scene: [`keynote/docs/scene-guide.md`](keynote/docs/scene-guide.md).

### How it was made

- [Story spine](keynote/docs/story-spine.md): the 60-minute beat sheet and its energy curve. The copy deck is [`beats.json`](keynote/src/data/beats.json).
- [Reference log](keynote/docs/reference-log.md): what we took from NVIDIA GTC Berlin 2026 and OpenAI DevDay 2026, with timestamps.
- [Design system](keynote/docs/design-system.md) and [style frames](keynote/docs/style-frames/).
- [Engine spec](keynote/docs/engine-spec.md), [production brief](keynote/docs/production-brief.md), [goal and review gauntlet](keynote/docs/GOAL.md), [review notes](keynote/docs/reviews/).

Built with three.js, GSAP, postprocessing, troika-three-text and d3. Fonts: Geist and Geist Mono (Vercel) and Newsreader, all under the SIL Open Font License. Captures and stills belong to their publishers and speakers and are shown for commentary, each with its link. The opening film is Irina's and is not stored in this repository.

San Francisco aerial footage (moment 4): «Golden Gate Bridge at Dusk Aerial View» by Asad Mehmood and «Aerial view of the city skyline at sunset» by Advancer Drones, both on Pexels under the [Pexels License](https://www.pexels.com/license/); cut and graded for this keynote ([`keynote/docs/footage-manifest.md`](keynote/docs/footage-manifest.md)). Maps (Brazil, power): [Natural Earth](https://www.naturalearthdata.com), public domain. PJM's footprint: HIFLD Open «Independent System Operators», US Department of Homeland Security, data from Oak Ridge National Laboratory, public use ([layer](https://services1.arcgis.com/Hp6G80Pky0om7QvQ/ArcGIS/rest/services/Independent_System_Operator/FeatureServer), [metadata](https://www.datacommons.psu.edu/metadata/Independent%20Systems%20Operators-metadata.html)).
