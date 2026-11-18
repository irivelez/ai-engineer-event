# calm-b report · 18 Nov 2026

**Done (13):** money, x-voices, tabloids, adoption, rules, so-what, approach, checkable, roles, think-twice, first-move, close-line, end. All DOM, no GL, so no p95 to report.

**QA (13-moment build):** smoke walks all 40 steps forward and back with no console errors; the only flag is `?m=3`, the agreed `--only` numbering artifact. The zoomsim DOM audit passes 40/40. Live end states match `?render=1`; motion checked frame by frame. Shots: `scratchpad/shots/calm-b/final`.

**Decisions**
- Captures follow the director's curation. Crops are CSS bands of the same files: ad slots, NY Post trending strip and long photos are skipped. Karpathy shows his first and last paragraph with a visible seam.
- The think-twice list is the five cue icons; each decision's icon flies into its slot.
- end sits on void `#05070A`, not `#000`. QR: local qrcode-generator SVG (level M), not phone-tested.
- Caption dates are Bogotá days, as X displays them.
- No component edits. CaptureCard.set() kills tweens on its own element, so scenes make cards visible before tweening. `src/components/CaptureCard.js` is untouched.
- Helpers: `src/scenes/_calm-b/kit.js`.

**Missing:** `x-jensenhuang-thank-you` has no file (53.8M views), so it is not used.
