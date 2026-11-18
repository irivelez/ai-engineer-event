// Style frame A: moment "employee-bar" (PAPER), step 2 "The scores under the employee bar".
// Built only from the real tokens, fonts and components, so the frame is what the scene can be.
// Build + shoot (from keynote/):
//   node docs/style-frames/src/build.mjs A-employee-bar
//   python3 docs/style-frames/src/shoot.py docs/style-frames/src/A-employee-bar.html docs/style-frames/A-employee-bar.png
//
// Data: copy from src/data/beats.json (employee-bar), numbers from src/data/facts.json:
//   epoch-astra-65: GPT-6.2 Astra 65 % average, 17 points below Claude Fable 5.2 → Fable 5.2 = 82 %.
// The bar's height is NOT data: facts.json has no numeric threshold for Epoch's employee bar, so
// the frame puts the line at the top of the scale. The scene must take its position from facts.json.
import '../../../src/styles/tokens.css';
import '../../../src/styles/base.css';
import '../../../src/styles/components.css';
import { Kicker, Headline, BarChart, SourceLine, setRenderMode } from '../../../src/components/index.js';
import { iconSVG } from '../../../src/design/icons.js';
import { colX, spanW, space } from '../../../src/design/tokens.js';
import beats from '../../../src/data/beats.json';

const m = beats.moments.find((x) => x.id === 'employee-bar');
const act = beats.acts.find((a) => a.id === m.act);
setRenderMode(new URLSearchParams(location.search).get('render') !== '0');

const stage = document.createElement('div');
stage.className = 'itaf ground-paper';
stage.style.cssText = 'position:relative;width:1920px;height:1080px;overflow:hidden';
document.body.appendChild(stage);
const at = (c, x, y) => { Object.assign(c.el.style, { position: 'absolute', left: `${x}px`, top: `${y}px` }); stage.appendChild(c.el); return c; };

// Left: the one idea
const kicker = at(Kicker.create({ text: `Act ${act.n} · ${act.title}`, ground: 'paper', tone: 'muted' }), space.margin, space.top);
const title = at(Headline.create({ text: m.copy.title, role: 'h2', ground: 'paper', width: spanW(6) }), space.margin, space.top + 72);
const sub = at(Headline.create({ text: m.copy.sub, role: 'body', tone: 'muted', ground: 'paper', width: spanW(6) }), space.margin, 0);
const src = at(SourceLine.create({ kind: 'independent', text: 'Epoch AI · 17 Nov 2026', ground: 'paper' }), space.margin, space.footer.y);

// Right: the scores under the bar
const chart = at(BarChart.create({
  orientation: 'vertical',
  ground: 'paper',
  width: spanW(5),
  height: 600,
  barWidth: 136,
  max: 100,
  data: [
    { id: 'fable', label: 'Claude Fable 5.2', value: 82, note: 'best' },
    { id: 'astra', label: 'GPT-6.2 Astra', value: 65, note: '17 points lower' },
  ],
  highlight: 'fable',
  unit: '%',
  threshold: { value: 100, label: "Epoch's bar for its own staff", tone: 'fg' },
}), colX(7), 200); // threshold line centre lands on the title's first baseline (y 271)

// Cue icon (HUD, drawn here only to judge the whole frame)
const cue = document.createElement('div');
cue.style.cssText = `position:absolute;left:${space.cue.inset}px;bottom:${space.cue.inset}px;color:var(--g-fg)`;
cue.innerHTML = iconSVG(m.icon, { size: space.cue.size });
stage.appendChild(cue);

// lay the sub line under the title once the title has its real height
requestAnimationFrame(() => {
  sub.el.style.top = `${title.el.offsetTop + title.el.offsetHeight + 40}px`;
  [kicker, title, sub, chart, src].forEach((c) => c.in());
  window.__ready = true;
});
