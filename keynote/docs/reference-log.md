# Reference log: what the bar looks like

Techniques read from 34 of the 38 key frames of two keynotes, for the design system (`docs/design-system.md`). Links jump to the moment. No frames are stored in this repo: they are the events' copyrighted material.

- **NVIDIA GTC Berlin 2026** (GTC): https://www.youtube.com/watch?v=v-NGxyPjcrE
- **OpenAI DevDay 2026** (DevDay): https://www.youtube.com/watch?v=Fls_onRviPM

Method: sizes are cap heights measured on 1920×1080 frames. On camera shots they are taken as a share of the LED screen's height (about 710 px of the frame), then converted to our 1080 stage and to font size with Geist's cap height (0.71 em). Motion is inferred from consecutive key frames, not watched frame by frame. Treat it as a reading, not a measurement.

## 1. Type scale

| Where | What | Cap as % of screen height | Our stage | Our token |
|---|---|---|---|---|
| [DevDay 30:57](https://www.youtube.com/watch?v=Fls_onRviPM&t=1857s) | statement "Most performant API everywhere" | 8.7 % | ≈ 132 px font | `h1` 128 |
| [DevDay 30:57](https://www.youtube.com/watch?v=Fls_onRviPM&t=1857s) | stat tiles "30% +" | 8.2 % | ≈ 124 px | `h1`-size BigNumber |
| [DevDay 0:37](https://www.youtube.com/watch?v=Fls_onRviPM&t=37s) | tile numbers "1.2B" | 12.9 % | ≈ 196 px | `display` 240 (one per frame, so larger) |
| [DevDay 22:09](https://www.youtube.com/watch?v=Fls_onRviPM&t=1329s) | "Pro 500" / list items | 8.7 % / 3.1 % | ≈ 132 / 47 px | `h1` / `body` 48 |
| [DevDay 23:29](https://www.youtube.com/watch?v=Fls_onRviPM&t=1409s) | centred quote / date above it | 6.3 % / 2.5 % | ≈ 96 / 38 px | `quote` 80 / `label` 32 |
| [DevDay 26:20](https://www.youtube.com/watch?v=Fls_onRviPM&t=1580s) | statement beside a chart / mono axis labels | 3.8 % / 1.8 % | ≈ 58 / 27 px | `lead` 60 / `source` 26–`label` 32 |
| [GTC 43:32](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2612s) | diagram box labels / disclosure pill (direct feed) | 3.1 % / 1.0 % | 48 / 16 px | `body` 48 / our pill floor is 26 |
| [GTC 0:11](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=11s) | single glowing line (direct feed) | 2.4 % | 37 px | we go to `h2` 88: Zoom shrinks it again |
| [GTC 59:29](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=3569s) | slide headline over a huge visual | 2.4 % | 37 px | `h2` 88 for ours |

Reading: DevDay sets statements at ~130 px, numbers at 125–200 px, body at ~47 px and mono axis labels at ~27 px, which is our scale. GTC keeps headlines small (37–48 px) and lets the visual fill the frame. On Zoom a viewer sees our 1080 frame at 720 or smaller, so we keep GTC's hierarchy but never its small sizes.

## 2. Layout

- **One idea, lots of ground.** DevDay's calm frames hold one statement and at most one supporting block, with ≥ 40 % of the screen empty ([22:09](https://www.youtube.com/watch?v=Fls_onRviPM&t=1329s), [23:29](https://www.youtube.com/watch?v=Fls_onRviPM&t=1409s)).
- **Statement left, evidence right.** [26:20](https://www.youtube.com/watch?v=Fls_onRviPM&t=1580s) and [30:57](https://www.youtube.com/watch?v=Fls_onRviPM&t=1857s): a 3-line statement in the left third, a chart or stat tiles in the right half. Style frame A uses this grid.
- **Cinematic band.** GTC's film moments run in a 2.39:1 letterbox (y 270–810) with black bars ([2:52](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=172s), [57:29](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=3449s), [1:31:00](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=5460s)). It says "this is footage, watch".
- **Captions as boxed labels.** A small outlined box names the source of a visual: "Cadence | Honda Jet Engine" ([56:11](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=3371s)), "Vaisala" ([57:29](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=3449s)). Our provenance chip is the same idea, made legible (26 px).
- **Density as scale.** A wall of hundreds of partner names frames one central object ([1:31:19](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=5479s), [5:30](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=330s)).

## 3. Colour

- **DevDay:** charcoal-to-black screens with white type and one blue accent word ([23:29](https://www.youtube.com/watch?v=Fls_onRviPM&t=1409s), [30:57](https://www.youtube.com/watch?v=Fls_onRviPM&t=1857s)); white rounded cards with dark grey type over a soft star field ([2:08](https://www.youtube.com/watch?v=Fls_onRviPM&t=128s)); white screens with grey light-weight numbers and ink semibold words ([9:19](https://www.youtube.com/watch?v=Fls_onRviPM&t=559s)). In charts, the old series is grey and the new one is the accent ([26:41](https://www.youtube.com/watch?v=Fls_onRviPM&t=1601s)).
- **GTC:** pure black with one brand green for structure, warm gold for money ([5:30](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=330s)), and a red line for a limit ([43:32](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2612s)). Diagrams use 4 px rounded strokes, never hairlines ([42:48](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2568s)).
- **Ours:** PAPER white/ink for the calm, VOID `#05070A` (not `#000`: Zoom crushes pure black), periwinkle as the single accent, semantic colours only for states. Like DevDay, the comparison series is quiet grey and the point is the accent.

## 4. How numbers are revealed

- **Tiles, one colour each** ([0:37](https://www.youtube.com/watch?v=Fls_onRviPM&t=37s), [30:57](https://www.youtube.com/watch?v=Fls_onRviPM&t=1857s)): number large, label two lines below, a small "+" set high. Max three per frame.
- **Axes first, then data** ([26:20](https://www.youtube.com/watch?v=Fls_onRviPM&t=1580s) → [26:41](https://www.youtube.com/watch?v=Fls_onRviPM&t=1601s)): the empty chart (axes, mono labels, legend) holds while the speaker frames it, then the series draw in and a summary card lands on the right.
- **Label the ends, not every point** ([40:42](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2442s), [40:51](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2451s)): a thick bright line over a dark area fill, value labels only at the start ("3.9T") and the peak ("132.6T") in the accent.
- **Money in warm light** ([5:30](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=330s)): "$10B" in gold semibold, label in white below.

## 5. Transitions and the return to calm

- **Hold on the void.** GTC cuts to black with only the disclosure pill before a film ([0:45](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=45s)); DevDay opens on a single small object on black ([0:02](https://www.youtube.com/watch?v=Fls_onRviPM&t=2s)). Silence is a frame.
- **Light as material.** Text glows on a star field ([0:11](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=11s)); particles form a galaxy ([19:29](https://www.youtube.com/watch?v=Fls_onRviPM&t=1169s)) or a logo ([53:11](https://www.youtube.com/watch?v=Fls_onRviPM&t=3191s)); green data flows along streets ([7:42](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=462s)).
- **Camera through the world.** A dolly down a radial tunnel ([1:31:00](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=5460s)) and a slow orbit over Earth ([57:29](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=3449s)). Over Zoom we keep the move and drop the motion blur.
- **Back to calm.** After a burst both shows return to an empty or near-empty screen with the speaker ([DevDay 1:41](https://www.youtube.com/watch?v=Fls_onRviPM&t=101s), [GTC 4:29](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=269s)), then one line of type. Ours: the burst settles, the scrim fades in, then a line-mask headline; or the hard cut to white.

## 6. STEAL LIST: 12 recipes in our stack

1. **Axes first, then data** (DevDay [26:20](https://www.youtube.com/watch?v=Fls_onRviPM&t=1580s)). Step 0 shows the chart frame; step 1 grows the bars. `BarChart.create(…)` and `in()` already order it: baseline, labels, bars, values. For lines: `d3-shape` `line()` into an SVG path, then `gsap.fromTo(path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.2, ease: 'expo.out' })` (DrawSVGPlugin).
2. **One accent phrase** (DevDay [23:29](https://www.youtube.com/watch?v=Fls_onRviPM&t=1409s)). `Headline.create({ text, highlight: 'AI research interns' })`. Never two highlights.
3. **Stat tile trio** (DevDay [30:57](https://www.youtube.com/watch?v=Fls_onRviPM&t=1857s)). Three `BigNumber` with `size: 'h1'` on `--g-card` surfaces (24 px radius), each with its chip; numbers roll in with a 0.12 s stagger.
4. **Date kicker over a quote** (DevDay [23:29](https://www.youtube.com/watch?v=Fls_onRviPM&t=1409s)). `Kicker.create({ text: '28 Oct 2025', tone: 'muted', rule: false })` above `Quote.create({ … })`; the date is provenance too.
5. **Glowing line on the void** (GTC [0:11](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=11s)). troika `Text` with `Geist-SemiBold.woff`, colour slightly above 1.0 (e.g. `new THREE.Color(1.4, 1.4, 1.5)`) so the composer's Bloom (mipmap blur, `luminanceThreshold ≈ 0.9`) catches only the type; star field as `THREE.Points` with soft round sprites, ≥ 2 px.
6. **Particles that become a shape** (DevDay [53:11](https://www.youtube.com/watch?v=Fls_onRviPM&t=3191s)). Rasterise a word or an icon (`iconSVG`) to a 2D canvas, sample lit pixels into a `Float32Array` of targets, then lerp a `uProgress` uniform from scattered to target with `power3.inOut` over 2.5 s in a `ShaderMaterial`.
7. **Flows along paths** (GTC [7:42](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=462s)). `CatmullRomCurve3` per route; an `InstancedMesh` of short capsules whose `aOffset` moves along the curve in the vertex shader; additive blending in the accent, bloom on. For "factory", "power", "money".
8. **The ceiling** (GTC [43:32](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2612s)). `BarChart` `threshold: { value, label, tone: 'alert' }` gives a 4 px line the bars stop under; or squares stepping up a staircase toward a red line for "rulers-break" / "breach".
9. **Typed policy** (GTC [43:21](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2601s)). Geist Mono `body`-size lines typed with `TextPlugin` (`{ text: line, duration: line.length * 0.03, ease: 'none' }`) and a block cursor `span` that blinks with `repeat: -1, yoyo: true, duration: 0.5` (stop it in render mode).
10. **Lit chips in a wall** (GTC [59:29](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=3569s)). A CSS grid of `itaf-chip`-style rounded rects; the ones that matter light to the accent with `stagger: { each: 0.03, from: 'random' }` (fixed seed in render mode), the rest stay quiet. For "open-weights" and "adoption".
11. **Letterbox band for footage** (GTC [2:52](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=172s)). Two void bars animate in (`scaleY` from the edges, 0.8 s `power3.inOut`) to a 1920×810 band; the source sits in a chip inside the band's bottom edge, centred.
12. **Return to calm** (GTC [0:45](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=45s), DevDay [1:41](https://www.youtube.com/watch?v=Fls_onRviPM&t=101s)). End every burst the same way: the camera settles (`power3.inOut`), `Scrim` fades in over 1.1 s, bloom drops to 0.3, then one line-mask `Headline`. Or cut to white (engine `cut`) and hold 0.25 s before the line.

## 7. Where each reference lands in our keynote

| Our moment | Reference | What carries over |
|---|---|---|
| `and-yet`, `so-what` | [GTC 0:11](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=11s), [DevDay 0:02](https://www.youtube.com/watch?v=Fls_onRviPM&t=2s) | One small line on a vast ground; silence as a frame. |
| `sf-arrival` | [GTC 2:52](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=172s), [GTC 5:30](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=330s) | Night aerial of a lit campus; a dense wall of real names (our 80 talk titles). |
| `factory`, `motor` | [GTC 7:42](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=462s) | Light flowing along paths through an industrial world. |
| `swarm`, `callback` | [DevDay 19:29](https://www.youtube.com/watch?v=Fls_onRviPM&t=1169s), [DevDay 53:11](https://www.youtube.com/watch?v=Fls_onRviPM&t=3191s) | Particles that organize into a shape, then settle. |
| `year-in-weeks`, `power` | [GTC 40:42](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2442s), [GTC 40:51](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2451s) | One bright line, labelled only at its ends; the chart scaled into the set. |
| `employee-bar` | [GTC 43:32](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2612s) | The ceiling the bars never cross. |
| `recipe` | [GTC 43:21](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=2601s) | The monospace policy card. |
| `brazil` | [GTC 57:29](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=3449s) | Earth from orbit, slow rotation, a boxed source label. |
| `news-tunnel` | [GTC 58:01](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=3481s) | Cards fanned in a 3D arc, the camera moving through them. |
| `callback` | [GTC 1:31:00](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=5460s) | The ring tunnel in hard perspective, then stillness. |
| `last-job`, `twins`, `close-line` | [DevDay 23:29](https://www.youtube.com/watch?v=Fls_onRviPM&t=1409s) | Date kicker, large quote, one highlighted phrase. |
| `money`, `adoption` | [DevDay 0:37](https://www.youtube.com/watch?v=Fls_onRviPM&t=37s), [DevDay 30:57](https://www.youtube.com/watch?v=Fls_onRviPM&t=1857s) | Statement left, three number tiles right. |
| `end` | [GTC 1:31:19](https://www.youtube.com/watch?v=v-NGxyPjcrE&t=5479s), [DevDay 53:11](https://www.youtube.com/watch?v=Fls_onRviPM&t=3191s) | Close on the mark, made of the show's own material. |
