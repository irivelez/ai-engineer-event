// spine: regenerates docs/story-spine.md (beat sheet, act starts, energy curve) from src/data/beats.json.
// Usage: node scripts/spine.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const beats = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/beats.json'), 'utf8'));
const { moments, acts, icons } = beats;

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const actLabel = (id) => { const a = acts.find((x) => x.id === id); return a ? a.n || a.title : id; };
const cell = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

let t = 0;
const rows = moments.map((m, i) => { const r = { n: i + 1, start: t, m }; t += m.plannedSec || 0; return r; });
const total = t;

// act starts: the first moment of each act
const starts = acts.map((a) => { const r = rows.find((x) => x.m.act === a.id); return r ? `${a.n || a.title} ${mmss(r.start)}` : null; }).filter(Boolean);

// energy curve: one column per minute, the energy of the moment playing at the start of that minute
const cols = Math.max(60, Math.ceil(total / 60));
const energyAt = (sec) => { const r = [...rows].reverse().find((x) => x.start <= sec); return sec < total && r ? r.m.energy || 0 : 0; };
const E = Array.from({ length: cols }, (_, c) => energyAt(c * 60));
const curve = [];
for (let lvl = 10; lvl >= 1; lvl--) curve.push(`${String(lvl).padStart(2, ' ')} │${E.map((e) => (e >= lvl ? '█' : ' ')).join('')}`);
curve.push(`   └${'─'.repeat(cols)}`);
let axis = '    ';
for (let c = 0; c <= cols; c += 5) axis += String(c).padEnd(5, ' ');
curve.push(`${axis.trimEnd()} min`);

const loud = rows.reduce((a, b) => ((b.m.energy || 0) > (a.m.energy || 0) ? b : a));
const silences = rows.filter((r) => (r.m.energy || 0) <= 2).map((r) => `\`${r.m.id}\``);

const out = `# Story spine: Inside the AI Frontier

The beat sheet and its energy curve. Source of truth: [\`src/data/beats.json\`](../src/data/beats.json), the copy deck with exact on-screen text, steps, visual direction and an owner per moment. Regenerated from it with \`node scripts/spine.mjs\`.

**The promise.** Latin American leaders leave having seen how fast the AI frontier is moving and what it means for their 2027 decisions, and they think twice.

**The shape.** Film (speed) → one question → I. what San Francisco is building → II. what the frontier labs show (the peak) → III. where they hit their limits (hard cut to silence) → IV. what the world is saying (loud) → V. what you do next (calm, decisive) → close.

**Planned length:** ${mmss(total)} for ${rows.length} moments, in a 60-minute slot.

**Act starts:** ${starts.join(' · ')}

## Energy curve

1 = silence, 10 = peak; one column per minute.

\`\`\`
${curve.join('\n')}
\`\`\`

Rhythm rules: never two bursts in a row without a calm beat, except at the Act II peak; every act opens with a change of ground (paper ↔ void); the loudest moment is \`${loud.m.id}\` (about minute ${Math.round(loud.start / 60)})${silences.length ? `; the silences are ${silences.join(', ')}` : ''}.

## Beats

| # | Starts | Act | Moment | Ground | Energy | Cue | What it does |
|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.n} | ${mmss(r.start)} | ${actLabel(r.m.act)} | \`${r.m.id}\` | ${r.m.ground || ''} | ${r.m.energy ?? ''} | ${(icons && icons[r.m.icon]) || '—'} | ${cell(r.m.brief)} |`).join('\n')}
`;

fs.writeFileSync(path.join(ROOT, 'docs/story-spine.md'), out);
console.log(`spine: ${rows.length} moments, ${mmss(total)} → docs/story-spine.md`);
