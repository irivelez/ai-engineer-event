// Design tokens: Inside the AI Frontier (owner: DD, design director).
// Every value is in stage px on the fixed 1920×1080 stage. Contrast ratios are WCAG 2.x,
// measured against the ground named in the comment. Reasons live in docs/design-system.md.
// tokens.css is generated from this file (see tokensCSS() at the bottom): edit here, not there.

export const stage = { width: 1920, height: 1080 };

export const colors = {
  // PAPER (calm)
  paper: '#FFFFFF',
  ink: '#0B0F14', //        19.22:1 on paper
  inkSoft: '#525B66', //     6.89:1 on paper, 6.31:1 on cardPaper
  // VOID (burst). Never pure black: Zoom's encoder crushes #000 and bands gradients into it.
  void: '#05070A',
  light: '#EEF2F6', //      17.93:1 on void
  lightSoft: '#98A2B0', //   7.81:1 on void, 7.28:1 on cardVoid
  // Accent: Deltanova periwinkle
  accent: '#93AAFF', //      9.06:1 on void
  accentPaper: '#3D55E0', // 5.88:1 on paper
  // Semantic states (always with a word or icon, never colour alone)
  verified: '#72D1A1', //   10.90:1 on void   (holds / verified)
  verifiedPaper: '#18794C', // 5.41:1 on paper (the brief's #1F8F5A measured 4.09:1: darkened)
  limit: '#F2A57A', //      10.03:1 on void   (limit / refuse)
  limitPaper: '#9A4A1F', //  6.23:1 on paper
  alert: '#FF4D3A', //       6.12:1 on void   (containment)
  alertPaper: '#C8321F', //  5.34:1 on paper
  caution: '#F0C674', //    12.52:1 on void   (lab-reported chip only)
  cautionPaper: '#8A6100', // 5.54:1 on paper
  // Lab identity: DATA MARKS ONLY (bars, dots, lines), never text. Labels stay in fg/muted.
  // Validated (dataviz validate_palette.js, all pairs): CVD ΔE ≥ 14.7, normal ΔE ≥ 22.9.
  // OpenAI is deliberately hueless (chroma check fails by design) → lab marks are always direct-labelled.
  lab: { anthropic: '#D97757', openai: '#E6ECF2', google: '#2DB7CC' }, // on void
  labPaper: { anthropic: '#B5583A', openai: '#2B323B', google: '#0A8C9E' }, // on paper (marks ≥ 3.99:1)
  // Quiet data marks: the bars that are not the point (non-text, ≥ 3:1 like every mark)
  quiet: '#5C6674', //       3.46:1 on void
  quietPaper: '#848D99', //  3.36:1 on paper
  // Structure (non-text, 2 px minimum)
  rulePaper: '#D9DEE4',
  ruleVoid: '#252C36',
  cardPaper: '#F3F5F8',
  cardVoid: '#0D1218',
  black: '#000000', // the opener film's last frame only (hand-off to void happens over 0.6 s)
};

// Everything a component needs to render on either world. Components take `ground: 'paper' | 'void'`.
export const grounds = {
  paper: {
    name: 'paper', bg: colors.paper, fg: colors.ink, muted: colors.inkSoft,
    accent: colors.accentPaper, verified: colors.verifiedPaper, limit: colors.limitPaper,
    alert: colors.alertPaper, caution: colors.cautionPaper,
    quiet: colors.quietPaper, rule: colors.rulePaper, card: colors.cardPaper, lab: colors.labPaper,
    scrim: 'rgba(255,255,255,0.86)',
  },
  void: {
    name: 'void', bg: colors.void, fg: colors.light, muted: colors.lightSoft,
    accent: colors.accent, verified: colors.verified, limit: colors.limit,
    alert: colors.alert, caution: colors.caution,
    quiet: colors.quiet, rule: colors.ruleVoid, card: colors.cardVoid, lab: colors.lab,
    scrim: 'rgba(5,7,10,0.78)',
  },
};

const sans = '"Geist", ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const mono = '"Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const serif = '"Newsreader", "Iowan Old Style", Georgia, serif';

// size: px · line: unitless multiplier (CSS line-height and troika lineHeight both take it) ·
// track: em (CSS letter-spacing and troika letterSpacing both take em) · weight: Geist variable axis.
// Line heights land every line box on the 8 px baseline (size × line is a multiple of 8).
export const type = {
  mega: { size: 360, line: 0.889, track: -0.05, weight: 560, family: 'sans' }, //   320 px line. Full-frame number takeovers.
  display: { size: 240, line: 0.9, track: -0.045, weight: 560, family: 'sans' }, // 216 px line. Big numbers (tabular).
  h1: { size: 128, line: 1.0, track: -0.032, weight: 600, family: 'sans' }, //       128 px line. One-idea statements.
  h2: { size: 88, line: 1.0909, track: -0.022, weight: 600, family: 'sans' }, //      96 px line. Cap height 62.5 px = the opener film's title.
  lead: { size: 60, line: 1.2, track: -0.016, weight: 520, family: 'sans' }, //       72 px line. Statement beside a chart.
  body: { size: 48, line: 1.3333, track: -0.01, weight: 440, family: 'sans' }, //     64 px line. Minimum body is 40.
  label: { size: 32, line: 1.25, track: 0.06, weight: 520, family: 'mono', caps: true }, // 40 px line. Kickers, axis titles, legends.
  source: { size: 26, line: 1.2308, track: 0.01, weight: 460, family: 'mono' }, //    32 px line. The floor: nothing on stage is smaller.
  quote: { size: 80, line: 1.2, track: -0.012, weight: 400, family: 'serif', italic: true }, // 96 px line.
  families: { sans, mono, serif },
};

// 12 columns inside 128 px margins with 32 px gutters: column = (1920 − 2·128 − 11·32) / 12 = 109.33 px.
export const space = {
  margin: 128,
  gutter: 32,
  col: (1920 - 2 * 128 - 11 * 32) / 12,
  baseline: 8,
  top: 120, //     data moments: title top-left at (128, 120)
  bottom: 136, //  content area ends at y = 944
  footer: { y: 988, h: 44 }, // the footer band: source rows and chips, on the cue icon's line
  cue: { size: 44, inset: 48 }, // HUD cue icon: bottom-left, 48 px from both edges (y 988–1032)
  radius: { card: 24, chip: 6, bar: 4 },
  stroke: 2, //    the thinnest line anywhere
};

// gsap timings. `dur` in seconds; ease strings are gsap built-ins (no plugin registration needed).
export const motion = {
  calmIn: { dur: 1.1, ease: 'expo.out' },
  calmOut: { dur: 0.5, ease: 'power2.in' },
  burst: { dur: 4, ease: 'power3.inOut', min: 2.5, max: 6 }, // camera moves
  roll: { dur: 1.2, ease: 'expo.out' }, // odometer digits and bar growth
  iris: { dur: 0.9, ease: 'expo.inOut' },
  wipe: { dur: 0.8, ease: 'power3.inOut' },
  cut: { dur: 0, hold: 0.25, ease: 'none' },
  crossfade: { dur: 0.6, ease: 'sine.inOut' },
  micro: { dur: 0.4, ease: 'power3.out' }, // chips, source lines, cue icon
  stagger: 0.08,
  eases: {
    calm: 'expo.out', exit: 'power2.in', camera: 'power3.inOut', roll: 'expo.out',
    iris: 'expo.inOut', wipe: 'power3.inOut', fade: 'sine.inOut', micro: 'power3.out', none: 'none',
  },
};

// Provenance chip kinds. `color` is the void value, `colorPaper` the paper value; `mark` is the
// small shape before the label, so the kind never rests on colour alone.
export const provenance = {
  independent: { label: 'INDEPENDENT', color: colors.verified, colorPaper: colors.verifiedPaper, mark: 'dot' },
  labReported: { label: 'LAB-REPORTED', color: colors.caution, colorPaper: colors.cautionPaper, mark: 'half' },
  secondary: { label: 'SECONDARY', color: colors.lightSoft, colorPaper: colors.inkSoft, mark: 'ring' },
  official: { label: 'OFFICIAL', color: colors.accent, colorPaper: colors.accentPaper, mark: 'square' },
  estimate: { label: 'ESTIMATE', color: colors.limit, colorPaper: colors.limitPaper, mark: 'diamond' },
  press: { label: 'PRESS', color: colors.lightSoft, colorPaper: colors.inkSoft, mark: 'bar' },
};

// The legibility floor every moment must pass (zoomsim and the gauntlet check these).
export const zoomSafe = {
  minText: 26, minBody: 40, minStroke: 2, minContrast: 4.5, minWeightUnder60: 400,
  avoidTopRight: { x: 1520, y: 0, w: 400, h: 240 }, // Zoom viewers often float the speaker tile here
};

// ---------- helpers ----------

export const ground = (name) => grounds[name === 'paper' ? 'paper' : 'void'];

export function labColor(lab, groundName = 'void') {
  return (groundName === 'paper' ? colors.labPaper : colors.lab)[lab] || ground(groundName).muted;
}

export function provenanceColor(kind, groundName = 'void') {
  const k = provenance[kind] || provenance.secondary;
  return groundName === 'paper' ? k.colorPaper : k.color;
}

// x of column n (0-based) and width of a span of k columns.
export const colX = (n) => space.margin + n * (space.col + space.gutter);
export const spanW = (k) => k * space.col + (k - 1) * space.gutter;

// Inline style object for a type role: Object.assign(el.style, typeStyle('h1')).
export function typeStyle(role) {
  const t = type[role];
  const s = {
    fontFamily: type.families[t.family || 'sans'],
    fontSize: `${t.size}px`,
    lineHeight: String(t.line),
    letterSpacing: `${t.track}em`,
    fontWeight: String(t.weight),
  };
  if (t.italic) s.fontStyle = 'italic';
  if (t.caps) s.textTransform = 'uppercase';
  return s;
}

// CSS text for src/styles/tokens.css. Regenerate after editing this file:
// node -e "import('./src/design/tokens.js').then(m=>process.stdout.write(m.tokensCSS()))" > src/styles/tokens.css
export function tokensCSS() {
  const v = [];
  const add = (k, val) => v.push(`  --${k}: ${val};`);
  for (const [k, val] of Object.entries(colors)) {
    if (typeof val === 'string') add(`c-${kebab(k)}`, val);
  }
  for (const [k, val] of Object.entries(colors.lab)) add(`c-lab-${k}`, val);
  for (const [k, val] of Object.entries(colors.labPaper)) add(`c-lab-paper-${k}`, val);
  add('f-sans', sans); add('f-mono', mono); add('f-serif', serif);
  for (const [k, t] of Object.entries(type)) {
    if (k === 'families') continue;
    add(`t-${k}-size`, `${t.size}px`); add(`t-${k}-line`, t.line);
    add(`t-${k}-track`, `${t.track}em`); add(`t-${k}-weight`, t.weight);
  }
  add('s-margin', `${space.margin}px`); add('s-gutter', `${space.gutter}px`);
  add('s-col', `${space.col.toFixed(3)}px`); add('s-baseline', `${space.baseline}px`);
  add('s-top', `${space.top}px`); add('s-bottom', `${space.bottom}px`); add('s-footer-y', `${space.footer.y}px`);
  add('s-cue-size', `${space.cue.size}px`); add('s-cue-inset', `${space.cue.inset}px`);
  add('r-card', `${space.radius.card}px`); add('r-chip', `${space.radius.chip}px`); add('r-bar', `${space.radius.bar}px`);
  add('m-calm-in', `${motion.calmIn.dur}s`); add('m-calm-out', `${motion.calmOut.dur}s`);
  add('m-micro', `${motion.micro.dur}s`); add('m-crossfade', `${motion.crossfade.dur}s`);
  add('ease-calm', 'cubic-bezier(0.16, 1, 0.3, 1)'); add('ease-exit', 'cubic-bezier(0.55, 0, 1, 0.45)');
  const g = (name) => {
    const G = grounds[name];
    return [
      `  --g-bg: ${G.bg};`, `  --g-fg: ${G.fg};`, `  --g-muted: ${G.muted};`, `  --g-accent: ${G.accent};`,
      `  --g-verified: ${G.verified};`, `  --g-limit: ${G.limit};`, `  --g-alert: ${G.alert};`,
      `  --g-caution: ${G.caution};`, `  --g-quiet: ${G.quiet};`, `  --g-rule: ${G.rule};`, `  --g-card: ${G.card};`, `  --g-scrim: ${G.scrim};`,
      `  --g-lab-anthropic: ${G.lab.anthropic};`, `  --g-lab-openai: ${G.lab.openai};`, `  --g-lab-google: ${G.lab.google};`,
    ].join('\n');
  };
  return [
    '/* GENERATED from src/design/tokens.js (tokensCSS). Do not edit by hand. */',
    ':root {', ...v, '}',
    '/* Ground scopes: put .ground-paper or .ground-void on a scene root; components read --g-*. */',
    `:root, .ground-void {\n${g('void')}\n}`,
    `.ground-paper {\n${g('paper')}\n}`,
    '',
  ].join('\n');
}

function kebab(s) { return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()); }

export default { stage, colors, grounds, type, space, motion, provenance, zoomSafe };
