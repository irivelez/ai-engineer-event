# Design direction (creative director)

**Two worlds, one system.** The keynote lives between OpenAI DevDay 2026 (calm) and NVIDIA GTC Berlin 2026 (spectacle): calm, minimal moments that suddenly open into full-screen 3D and motion, then return to calm. The rhythm keeps changing.

## The two worlds

- **PAPER (calm, DevDay):** white `#FFFFFF`, ink `#0B0F14`. One idea at a time. Big type, generous margins, almost no decoration. Motion is slow and quiet: line-mask reveals, expo.out 0.9–1.4 s, small staggers.
- **VOID (burst, GTC):** near-black `#05070A` (never pure black: Zoom crushes it), light as material: bloom, particles, instancing, camera moves, huge numbers.
- **Between them:** designed transitions: an aperture/iris of light, a light wipe, and the hard cut to white for silence ("And yet.").

## Colour

- Accent: Deltanova's periwinkle `#93AAFF` (luminous on VOID). On PAPER a deeper variant that passes 4.5:1 on white (about `#3D55E0`; verify).
- Semantic: verified/holds green `#72D1A1` (void) / `#1F8F5A` (paper); limit/refuse orange `#F2A57A` / `#9A4A1F`; alert red for containment `#FF4D3A` / `#C8321F`.
- Lab identity, for data only and desaturated: Anthropic clay `#D97757`; OpenAI neutral (`#E6ECF2` on void, ink on paper); Google a blue-teal clearly distinct from the accent. Decide and document.

## Type

- **Geist** (display and text, variable), **Geist Mono** (numbers, labels, sources, timecodes), **Newsreader** italic (quotes and caveats; it is Deltanova's serif). All OFL: download woff2, subset to Latin + punctuation, keep total ≤ 150 KB, inline in the build.
- Starting scale on the 1920×1080 stage (adjust to the reference log's measurements): display 200–280 (numbers), H1 112–144, H2 72–88, body 44–52, label 32–36, source 26–28 (minimum). Tracking: display −0.035em, H1 −0.025em, body −0.01em. Numbers use tabular figures.
- Grid: 12 columns, 128 px outer margin, 32 px gutter, 8 px baseline. Data moments: title top-left at (128, 120). Single-line moments: optically centred.

## Signature components

- **Provenance chip.** Every number on screen carries a small chip: INDEPENDENT · LAB-REPORTED · SECONDARY · OFFICIAL · ESTIMATE · PRESS (Geist Mono 22–24 px caps, letterspaced, 2 px outline, subtle colour per kind) plus a source line ("Epoch AI · 17 Nov 2026"). It is how the keynote makes the audience think twice.
- **Big number.** Odometer digit roll (each digit column rolls, tabular), unit and label below, chip beside.
- **Headline.** SplitText line-mask reveal.
- **Quote.** Newsreader italic, large, with speaker and org in Geist Mono.
- **Capture card.** A real screenshot (X post or headline) with a soft shadow on paper or a thin light frame on void, and a meta line (outlet/author · date · counts · captured time).
- **Bar chart.** d3-scale + GSAP, values in Geist Mono, highlight in accent.
- **Before → after table**, **step list**, **act title** (roman numeral + title).

## The five cue icons

Irina's private cues: speed, trade-offs, constraints, uncertainty, value. The audience sees only a small icon, no label. 2 px stroke on a 48 px grid, geometric, consistent caps and joins; shown at 44 px bottom-left (48 px from the edges) on both worlds, fading in when a moment carries one. They must read at 44 px over Zoom. Starting ideas: speed = forward chevrons; trade-offs = a balance or two opposing arrows; constraints = a bracket or gate; uncertainty = a dashed orbit or a distribution curve; value = a faceted diamond.

## Motion tokens

- Calm in: expo.out 1.1 s, stagger 0.08. Calm out: power2.in 0.5 s.
- Burst camera: power3.inOut 2.5–6 s. Number roll: 1.2 s expo.out.
- Hard cut: 0 s with a 0.25 s hold of the pure ground. Iris: 0.9 s expo.inOut.
- Never bounce. Never spin text. Motion is motivated: it reveals the one idea.

## Zoom-safe rules

No grain, no 1 px lines, no text weight below 400 under 60 px, high contrast, dithered gradients, no full-frame strobing (Zoom drops to about 15–30 fps and fast flashing turns to mush). Text over 3D always gets a scrim or a calm area.
