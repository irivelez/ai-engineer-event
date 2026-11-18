// ENGINE STUB SOURCE
// Design tokens with the export names fixed in docs/engine-spec.md. Values follow docs/design-direction.md.
export const colors = {
  paper: '#FFFFFF', ink: '#0B0F14', inkSoft: '#4A5361',
  void: '#05070A', light: '#F2F5FA', lightSoft: '#9AA4B2',
  accent: '#93AAFF', accentPaper: '#3D55E0',
  verified: '#72D1A1', verifiedPaper: '#1F8F5A',
  limit: '#F2A57A', limitPaper: '#9A4A1F',
  alert: '#FF4D3A', alertPaper: '#C8321F',
  lab: { anthropic: '#D97757', openai: '#E6ECF2', google: '#4FB8B0' },
};
export const grounds = {
  paper: { bg: colors.paper, fg: colors.ink, muted: colors.inkSoft },
  void: { bg: colors.void, fg: colors.light, muted: colors.lightSoft },
};
const t = (size, line, track, weight) => ({ size, line, track, weight });
export const type = {
  display: t(240, 0.92, '-0.035em', 600),
  h1: t(128, 1.0, '-0.025em', 600),
  h2: t(80, 1.08, '-0.02em', 500),
  body: t(48, 1.3, '-0.01em', 400),
  label: t(34, 1.25, '0.02em', 500),
  source: t(26, 1.3, '0.02em', 400),
  families: {
    sans: "'Geist', 'Helvetica Neue', Arial, sans-serif",
    mono: "'Geist Mono', 'SF Mono', Menlo, monospace",
    serif: "'Newsreader', Georgia, serif",
  },
};
export const space = { margin: 128, gutter: 32, col: 112, baseline: 8 };
export const motion = {
  calmIn: { dur: 1.1, ease: 'expo.out' },
  calmOut: { dur: 0.5, ease: 'power2.in' },
  burst: { dur: 3.5, ease: 'power3.inOut' },
  roll: { dur: 1.2, ease: 'expo.out' },
  iris: { dur: 0.9, ease: 'expo.inOut' },
  stagger: 0.08,
  eases: { calm: 'expo.out', out: 'power2.in', camera: 'power3.inOut', iris: 'expo.inOut' },
};
export const provenance = {
  independent: { label: 'INDEPENDENT', color: '#72D1A1' },
  labReported: { label: 'LAB-REPORTED', color: '#93AAFF' },
  secondary: { label: 'SECONDARY', color: '#9AA4B2' },
  official: { label: 'OFFICIAL', color: '#E6ECF2' },
  estimate: { label: 'ESTIMATE', color: '#F2A57A' },
  press: { label: 'PRESS', color: '#C9B6F2' },
};
