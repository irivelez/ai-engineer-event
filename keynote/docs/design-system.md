# Design system: Inside the AI Frontier

Owner: DD (design director). Source of truth for values: `src/design/tokens.js`; this file explains them. Style frame: `docs/style-frames/A-employee-bar.png`. Reference measurements: `docs/reference-log.md`.

**Thesis.** One idea at a time on PAPER (DevDay calm), light as material on VOID (GTC burst), and every number wears its provenance. The signature is the **provenance stamp**: a mono-caps chip with a shape per kind, always beside the number it qualifies.

## 1. Decisions and reasons (changes to design-direction.md)

| Decision | Why |
|---|---|
| `verifiedPaper` is `#18794C`, not `#1F8F5A` | `#1F8F5A` measured 4.09:1 on white (fails 4.5:1). `#18794C` is 5.41:1. |
| Provenance chip text is 26 px, not 22–24 px | The engine spec and GOAL set a 26 px floor for any stage text. |
| `h2` is 88 px / weight 600 | Geist's cap height is 0.71 em, so 88 px gives a 62.5 px cap: the opener film's title (cap ≈ 62 px). The title moment continues the film's last frame without a jump. |
| `display` 240 px, `mega` 360 px | DevDay hero numbers measure about 13 % of screen height (≈ 196 px font on a 1080 frame) inside a tile grid. We show one number per frame, so we go larger. |
| Lab colours re-tuned: OpenAI paper `#2B323B`, Google `#2DB7CC` (void) / `#0A8C9E` (paper) | The dataviz validator (all pairs) passes CVD ΔE ≥ 14.7 and normal-vision ΔE ≥ 22.9 with these. The first teal (`#4FB8C4`) sat 12.7 ΔE from the accent and read grey. OpenAI is hueless by design (the chroma check fails on purpose), so **lab marks are always direct-labelled**. |
| New `quiet` mark colour (`#848D99` paper, `#5C6674` void) | Bars that are not the point still need ≥ 3:1 against the ground (dataviz mark rule). A lighter grey disappears on Zoom. |
| New `caution` colour (`#F0C674` / `#8A6100`) for the LAB-REPORTED chip | The limit orange is a scene state (limit/refuse). A self-reported number gets its own amber so the two never collide. |
| Cue icons draw at 2.5 stage px at 44 px | A 2-unit stroke on a 48 grid renders at 1.83 px at 44 px, under the 2 px floor. `iconSVG` thickens it to 2.5 px so it survives Zoom's downscale. |
| Footer band y 988–1032 | Source rows and chips sit on the same line as the cue icon (bottom-left, 48 px inset). Meta lives in one place, every moment. |
| Own line splitter instead of gsap SplitText for line masks | SplitText wraps words in inline-blocks, which re-flows `text-wrap: balance` into different, overflowing lines. Render mode and the animated end state then disagree. `splitLines()` in `_core.js` reads the browser's own lines, so both match exactly. SplitText stays registered for char/word effects. |
| Newsreader italic only, optical size pinned at 60 | Quotes are set 64–96 px. Pinning `opsz` cut the file from 143 KB to 57 KB. |

## 2. Type

Families: **Geist** (variable 100–900) for display and text; **Geist Mono** (variable) for labels, sources, values and timecodes; **Newsreader Italic** (weight 300–600, opsz 60) for quotes. Troika GL text uses `Geist-SemiBold.woff` (static 600, troika cannot read woff2).

Every `line` lands the line box on the 8 px baseline. `line` is a unitless multiplier and `track` is in em, so both work unchanged in CSS and in troika.

| Role | Size | Line (px) | Track | Weight | Family | Use |
|---|---|---|---|---|---|---|
| `mega` | 360 | 320 | −0.05em | 560 | Geist | full-frame number takeovers |
| `display` | 240 | 216 | −0.045em | 560 | Geist, tabular | big numbers |
| `h1` | 128 | 128 | −0.032em | 600 | Geist | one-idea statements |
| `h2` | 88 | 96 | −0.022em | 600 | Geist | data-moment titles; cap = film title |
| `lead` | 60 | 72 | −0.016em | 520 | Geist | statement beside a chart, big values in charts |
| `body` | 48 | 64 | −0.01em | 440 | Geist | sentences; never below 40 |
| `label` | 32 | 40 | +0.06em | 520 | Geist Mono, caps | kickers, axis labels, legends |
| `source` | 26 | 32 | +0.01em | 460 | Geist Mono | sources, captions: **the floor** |
| `quote` | 80 | 96 | −0.012em | 400 | Newsreader Italic | quotes |

CSS: `.t-display`, `.t-h1` … plus `.tnum` (tabular figures), `.balance`, `.pretty`, `.t-muted`, `.t-accent`. JS: `typeStyle('h1')` returns an inline style object.

Rules: one `h1` or one number per frame. Headlines get `text-wrap: balance` (the Headline component sets it). Set a width: titles ≤ 10 columns, sentences ≤ 8 columns (about 60 characters at body size).

## 3. Grid

12 columns inside 128 px margins, 32 px gutters: column = 109.33 px. `colX(n)` is the x of column n (0-based), `spanW(k)` the width of k columns.

```
x:  128 │ col 0 … col 11 │ 1792        colX(6) = 976   colX(7) = 1117   spanW(6) = 816   spanW(9) = 1240   spanW(10) = 1381
y:  120  title top-left on data moments (kicker at 120, title at 192)
    944  content ends (space.bottom = 136)
    988–1032  footer band: cue icon (x 48–92) · chip + source line (x from 128)
```

- Single-line moments: `.center-optical` (centred, lifted 43 px so the line reads centred, not low).
- Keep critical text out of the top-right 400 × 240 (`zoomSafe.avoidTopRight`): Zoom viewers often float the speaker tile there.
- Data moments: title block on the left (columns 0–5), chart on the right (columns 7–11), as in the style frame.

## 4. Colour

All ratios are WCAG 2.x against the named ground, measured.

| Token | PAPER | ratio | VOID | ratio | Use |
|---|---|---|---|---|---|
| ground | `#FFFFFF` | | `#05070A` | | never pure black (Zoom crushes it) |
| fg | `#0B0F14` ink | 19.22 | `#EEF2F6` light | 17.93 | text |
| muted | `#525B66` | 6.89 | `#98A2B0` | 7.81 | secondary text, done steps, sources |
| accent | `#3D55E0` | 5.88 | `#93AAFF` | 9.06 | the one highlight per frame |
| verified | `#18794C` | 5.41 | `#72D1A1` | 10.90 | holds / verified, INDEPENDENT chip |
| limit | `#9A4A1F` | 6.23 | `#F2A57A` | 10.03 | limit / refuse, ESTIMATE chip |
| alert | `#C8321F` | 5.34 | `#FF4D3A` | 6.12 | containment only |
| caution | `#8A6100` | 5.54 | `#F0C674` | 12.52 | LAB-REPORTED chip only |
| quiet (marks) | `#848D99` | 3.36 | `#5C6674` | 3.46 | context bars (non-text, ≥ 3:1) |
| onAccent / onQuiet | `#FFFFFF` / ink | 5.88 / 5.72 | void / light | 9.06 / 5.17 | values inside bars |
| rule | `#D9DEE4` | 1.35 | `#252C36` | 1.43 | 2 px structure lines only, never text |
| card | `#F3F5F8` | | `#0D1218` | | surfaces |

Lab identity (data marks only, never text): Anthropic `#B5583A` / `#D97757`, OpenAI `#2B323B` / `#E6ECF2`, Google `#0A8C9E` / `#2DB7CC` (paper / void). Use `labColor(lab, ground)` or `var(--g-lab-anthropic)`.

In CSS, put `.ground-paper` or `.ground-void` on a scene root and read `--g-bg`, `--g-fg`, `--g-muted`, `--g-accent`, `--g-quiet`, `--g-rule`, `--g-lab-*`. Every component already scopes its own ground from `opts.ground`. Add `.itaf` to the root that should paint the ground.

## 5. Motion

| Token | Duration | Ease | Use |
|---|---|---|---|
| `calmIn` | 1.1 s | expo.out | line-mask reveals, blocks rising in |
| `calmOut` | 0.5 s | power2.in | exits (lift 12 px + fade) |
| `stagger` | 0.08 s | | between lines, bars, rows |
| `roll` | 1.2 s | expo.out | odometer digits, bar growth |
| `micro` | 0.4 s | power3.out | chips, source lines, small state changes |
| `burst` | 4 s (2.5–6) | power3.inOut | camera moves on VOID |
| `iris` | 0.9 s | expo.inOut | void → paper aperture |
| `wipe` | 0.8 s | power3.inOut | paper → void light band |
| `crossfade` | 0.6 s | sine.inOut | same-ground moment change |
| `cut` | 0 s + 0.25 s hold | none | "And yet." silence |

Rules: never bounce, never spin text, no elastic or back eases. One orchestrated reveal per step: lines first, numbers roll, provenance arrives last (+0.35 s). Exits are faster than entrances. Nothing animates in render mode.

## 6. Components

Import from `ctx.components` (the engine passes `src/components/index.js`). Every component has the same shape:

```js
const c = X.create(opts);          // builds c.el (hidden), no side effects
ctx.root.append(c.el);             // you position it (absolute, stage px)
c.in(tl?, at?)  → timeline         // reveal; appends to tl at `at` (default: end) or returns a new one
c.out(tl?, at?) → timeline         // calm exit
c.set(state, { animate }) → timeline   // state change for a step; idempotent; animate:false = exact final state
c.set({ visible: true|false }, { animate })   // every component: in()/out() when animating, else instant
c.destroy()                        // kill tweens, remove
```

Render mode: the engine calls `components.setRenderMode(ctx.renderMode)` once (or the kit reads `?render=1`). Then `in()` and `set()` settle instantly to the final state. Going back a step: `set({ visible: false }, { animate: false })` hides at once, and `set({ visible: true }, { animate: false })` shows the exact final state at once.

```js
// a data moment, step by step
create(ctx) {
  const { Kicker, Headline, BarChart, SourceLine } = ctx.components;
  const { colX, spanW, space } = ctx.tokens;
  const g = ctx.beat.ground;
  const title = Headline.create({ text: ctx.copy.title, role: 'h2', ground: g, width: spanW(6) });
  const chart = BarChart.create({ orientation: 'vertical', ground: g, width: spanW(5), data, highlight: 'fable', unit: '%' });
  const src = SourceLine.create({ kind: 'independent', text: 'Epoch AI · 17 Nov 2026', ground: g });
  place(title, space.margin, 192); place(chart, colX(7), 200); place(src, space.margin, space.footer.y);
  return {
    steps: ctx.beat.steps.length,
    enter() { return gsap.timeline().add(title.in(), 0).add(src.in(), 0.6); },
    goto(step, { animate }) {
      // idempotent: describe the state of `step`, the kit animates or snaps to it
      const tl = gsap.timeline();
      tl.add(title.set({ visible: true }, { animate: false }), 0);
      tl.add(chart.set({ visible: step >= 1 }, { animate }), 0);
      tl.add(src.set({ visible: true }, { animate: false }), 0);
      return tl;
    },
    exit() { const tl = gsap.timeline(); [title, chart, src].forEach((c) => c.out(tl, 0)); return tl; },
    dispose() { [title, chart, src].forEach((c) => c.destroy()); },
  };
}
```

| Component | opts (main) | set(state) | Notes |
|---|---|---|---|
| `Headline` | `text, role ('h1'…'body'), ground, width, highlight, tone, align` | `{ text?, highlight?, dim? }` | line-mask reveal; `dim` steps back to the muted colour (never opacity) |
| `Kicker` | `text, ground, tone ('muted'·'accent'·'fg'), rule` | `{ text }` | 40 px rule draws, text clips in from the left |
| `ActTitle` | `numeral, title, index, total, ground, width` | none | route line: one segment per act, past filled, current in accent |
| `BigNumber` | `value` or `display`, `decimals, prefix, suffix, unit, label, kind, source, size ('display'·'mega'·'h1'), tone, align` | `{ value? \| display?, label?, source? }` | odometer: each digit travels 4 cells up; on set, digits roll from the old value |
| `ProvenanceChip` | `kind, label?, ground` | `{ kind }` | kinds: independent, labReported, secondary, official, estimate, press; `chipHTML(kind)` for static markup |
| `SourceLine` | `text, kind?, prefix?, ground` | `{ text?, kind? }` | chip + "Outlet · date", 26 px mono, sits in the footer band |
| `Quote` | `text, speaker, org, when, size, ground, width` | `{ highlight }` (accent underline draws) | hanging opening mark in accent; attribution in mono after a 48 px rule |
| `CaptureCard` | `src, alt, variant ('paper'·'void'), meta {outlet, author, date, counts, captured}, width, tilt (≤2°)` | `{ zoom: {x, y, scale} }` | paper: layered soft shadow; void: 2 px light frame and a faint accent glow |
| `BarChart` | `data[{id,label,value,display,lab,note}], orientation, colorMode ('accent'·'lab'·'mono'), highlight, max, unit, threshold {value,label,tone}, width, height, barWidth` | `{ highlight?, data?, max?, threshold? }` | baseline 2 px, 4 px rounded data end, values in mono; vertical values sit inside the bar top when they fit |
| `BeforeAfter` | `rows[{label, before, after}], headers, stage, ground, width` | `{ stage: 'before' \| 'after' }` | after column wipes in row by row; old values step back to muted |
| `StepList` | `items[], active, numbered, role, ground, width` | `{ active }` | only for real sequences; accent bar travels to the active step |
| `Scrim` | `ground, side ('left'·'right'·'top'·'bottom'·'center'), extent, strength` | `{ side?, extent?, strength? }` | eased gradient (no edge, no banding step); `scrim(opts)` returns a ready element |
| `EvidenceVideo` | `item` (`ctx.assets.evidence(id)`), `variant ('void'·'paper'·'bleed')`, `width` (16:9), `loop`, `kind` (chip, e.g. `item.chip`), `qr`, `qrSize`, `meta` | none (`visible` only) | real clip: local `media/evidence/*.mp4` plays when shown (muted, once, holds `item.end`; M = sound); missing file → YouTube embed on https, poster + link on file://; render/back/jump → poster. Meta: chip, publisher · date, title, the source's own disclaimer verbatim, link, QR |
| `EvidenceDoc` | `item`, `width`, `height` (cover, top), `highlight {x,y,w,h}` (0–1, default `item.highlight`), `dim`, `kind`, `qr` | `{ highlight }` | real page screenshot or chart (`item.imageSrc`), accent 4 px box over the passage, same meta block |
| `SourceQR` | `url, label, size, ec, ground` | none | local QR (one SVG path, crisp) on a white card; module = whole stage px ≥ 4 (aim ≥ 6); `qrSVG()`, `shortUrl()` exported |

Not built: a hover layer for charts (it is a stage; every value is labelled instead) and a line chart (scenes needing one compose it with d3-shape plus these tokens: 2 px line, 8 px markers, direct end labels).

## 7. Transitions catalogue

Between moments (engine, `src/engine/transitions.js`):

| Type | When | Spec |
|---|---|---|
| `fade` | same ground (default) | 0.6 s crossfade between opaque wrappers, never through black |
| `iris` | VOID → PAPER | aperture of white opens from the centre, 0.9 s expo.inOut |
| `wipe` | PAPER → VOID | a soft band of light crosses left → right, the void behind it, 0.8–0.9 s |
| `cut` | silence ("And yet.") | 0 s, 0.25 s of pure new ground, then the line |
| `none` | film → title | the title frame equals the film's last frame |

Inside a moment (the kit):

| Recipe | Where | How |
|---|---|---|
| Line-mask reveal | Headline, ActTitle, Quote | lines rise from `yPercent 130` inside their own clip, calmIn, 0.08 s stagger |
| Odometer roll | BigNumber | digit strips travel 4 cells, roll 1.2 s expo.out, 0.05 s left-to-right stagger |
| Bar growth | BarChart | baseline draws, labels arrive, bars grow from the baseline (scaleX/scaleY), values fade in at 50 % |
| Stamp | ProvenanceChip, SourceLine | clip-path opens left → right 0.6 s, text slides 8 px |
| Step back | Headline `dim`, BeforeAfter | colour to muted over 0.4 s: what was true stays readable |
| Return to calm | any burst → calm | scrim fades in over 1.1 s, camera settles (power3.inOut), then the line-mask headline |

## 8. Zoom-safe rules

1. No stage text under 26 px; sentences ≥ 40 px (body is 48).
2. No text weight under 400 below 60 px; light weights (300) only in `quote` at ≥ 64 px.
3. Text contrast ≥ 4.5:1 against what is actually behind it; data marks ≥ 3:1.
4. No line under 2 px. Structure lines are 2 px, reference lines (thresholds, routes) 4 px.
5. No grain, noise or film texture. Large dark gradients are eased (`scrimBackground`), never 2-stop linear.
6. No full-frame flashing or strobing; nothing full-frame changes faster than 0.25 s apart.
7. Text over 3D always sits on a `Scrim` or in a calm area of the frame.
8. Keep critical text out of the top-right 400 × 240.
9. Tabular figures for every number that changes (`.tnum`, Geist Mono values).

## 9. Fonts

`src/fonts/`: `Geist-Variable.woff2` 34 KB, `GeistMono-Variable.woff2` 35 KB, `NewsreaderItalic-Variable.woff2` 57 KB, `Geist-SemiBold.woff` 14 KB (troika). Total 137 KiB. Licences: `OFL-Geist.txt`, `OFL-Newsreader.txt`. Sources: npm `geist@1.9.2` and `@fontsource-variable/newsreader@5.3.0`.

Subset (fontTools 4.68), so you can add glyphs:

```
U=U+0020-007E,U+00A0-00FF,U+0131,U+0141-0142,U+0152-0153,U+0160-0161,U+0178,U+017D-017E,U+02C6,U+02DA,U+02DC,U+0394,U+03BB,U+03BC,U+2009-200B,U+2010-2027,U+202F,U+2030,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+221E,U+2248,U+2260,U+2264-2265,U+25CF,U+2200,U+2203,U+22A2
pyftsubset Geist-Variable.woff2 --unicodes="$U" --layout-features='*' --flavor=woff2 --no-hinting --name-IDs='*'
fonttools varLib.instancer newsreader-latin-opsz-italic.woff2 opsz=60 wght=300:600   # then subset as above
```

Geist has no ∀ ∃ ⊢ Δ ✓: they fall back to the system font. Avoid them in large type or draw them as SVG.

## 10. Cue icons

`iconSVG(name, { size = 44, color, strokePx })`, names `speed · tradeoffs · constraints · uncertainty · value`. 48-unit grid, live area 5–43, round caps and joins. Silhouettes are distinct on purpose: two chevrons (horizontal), a tipped seesaw with a heavy round weight and a light square one (tilted), an arrow under a lid (vertical), a bell curve over its interval (dome), a cut stone (faceted). HUD: 44 px, bottom-left, 48 px from the edges, `fg` colour of the ground.

## 11. Hand-in checklist (run it before you call a moment done)

DO
- [ ] Every visible string comes from `ctx.copy`; every number from `facts.json`, with a chip and a source line in the footer band.
- [ ] One idea per step: one `h1` or one number or one chart.
- [ ] Type only from the scale (`.t-*` or `typeStyle`); nothing under 26 px; sentences ≥ 40 px.
- [ ] Colours only from tokens or `--g-*`; the accent marks one thing per frame.
- [ ] Left edges on the grid (`colX`), titles at (128, 192) under a kicker at (128, 120) on data moments.
- [ ] `goto(i, { animate: false })` equals the animated end state (screenshot both).
- [ ] Text over 3D has a `Scrim`; it passes 4.5:1 against the brightest pixel behind it.
- [ ] Charts: baseline 2 px, values labelled, lab colours only on marks, a legend or direct labels.
- [ ] Watch it at 1280×720 (zoomsim) before hand-in.

DON'T
- [ ] No default fonts, no system UI blue, no emoji, no clip-art icons.
- [ ] No 1 px lines, no hairline borders, no grain, no 2-stop dark gradients.
- [ ] No opacity to "dim" text (use muted); no text in lab or status colours.
- [ ] No bounce, elastic, spin or shake; no motion that does not reveal the idea.
- [ ] No two highlights in one frame; no dual-axis charts; no unlabelled numbers.
- [ ] No text in the top-right 400 × 240; nothing touching the 128 px margins except full-bleed media.
- [ ] No `setTimeout` for animation; no new fonts or colours without DD.
