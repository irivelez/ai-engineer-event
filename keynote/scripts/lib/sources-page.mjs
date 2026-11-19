// Writes keynote/sources.html: every moment in order, each claim on screen with its provenance label,
// publisher, date and a clickable source link, from src/data/facts.json, evidence.json, captures.json and
// sf-stills.json. Self-contained (fonts inlined), calm PAPER styling, readable on a phone (the end moment's
// "All sources" QR opens it). Called by scripts/build.mjs on every build.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (s) => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(s || ''));
  if (!m) return String(s || '');
  return m[3] ? `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}` : `${MON[+m[2] - 1]} ${m[1]}`;
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KIND = { independent: 'independent', 'lab-reported': 'labReported', labreported: 'labReported', secondary: 'secondary', official: 'official', estimate: 'estimate', press: 'press' };
const kindOf = (label) => KIND[String(label || '').trim().toLowerCase()] || 'secondary';
const readJSON = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);
const listOf = (j) => (!j ? [] : Array.isArray(j) ? j : j.items || j.stills || j.captures || []);
const link = (url, text) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text || url)}</a>` : esc(text || ''));

export async function writeSourcesPage({ ROOT, SRC, beats, outFile }) {
  const tokens = await import(pathToFileURL(path.join(SRC, 'design/tokens.js')).href);
  const P = tokens.provenance;
  const factsJson = readJSON(path.join(SRC, 'data/facts.json')) || {};
  const facts = factsJson.facts && !Array.isArray(factsJson.facts) ? factsJson.facts : Object.fromEntries(listOf(factsJson.facts).map((f) => [f.id, f]));
  // evidence.json plus every evidence-*.json (an id seen first wins), as the build does
  const evFiles = ['evidence.json', ...fs.readdirSync(path.join(SRC, 'data')).filter((f) => /^evidence-.+\.json$/.test(f)).sort()];
  const evSeen = new Map();
  for (const f of evFiles) for (const e of listOf(readJSON(path.join(SRC, 'data', f)))) if (e && e.id && !evSeen.has(e.id)) evSeen.set(e.id, e);
  const evidence = [...evSeen.values()];
  const captures = listOf(readJSON(path.join(SRC, 'data/captures.json')));
  const stills = listOf(readJSON(path.join(SRC, 'data/sf-stills.json')));

  // Which moment shows a capture or a still: its own `moment` field, else the moment whose scene code or copy names it.
  const sceneText = {};
  for (const m of beats.moments) {
    let s = JSON.stringify(m.copy || {});
    const f = path.join(SRC, 'scenes', `${m.id}.js`);
    if (fs.existsSync(f)) s += fs.readFileSync(f, 'utf8');
    const dir = path.join(SRC, 'scenes', m.id);
    if (fs.existsSync(dir)) for (const x of fs.readdirSync(dir)) if (x.endsWith('.js')) s += fs.readFileSync(path.join(dir, x), 'utf8');
    sceneText[m.id] = s;
  }
  const momentsNaming = (id) => beats.moments.filter((m) => sceneText[m.id].includes(`'${id}'`) || sceneText[m.id].includes(`"${id}"`)).map((m) => m.id);
  const placed = new Set();
  const byMoment = (list, get) => {
    const out = {};
    for (const it of list) {
      const ids = it.moment ? [it.moment] : momentsNaming(it.id);
      for (const mid of ids) (out[mid] = out[mid] || []).push(it), placed.add(get(it));
    }
    return out;
  };
  const evBy = byMoment(evidence, (e) => `e:${e.id}`);
  const capBy = byMoment(captures, (c) => `c:${c.id}`);
  const sfBy = byMoment(stills, (s) => `s:${s.id}`);

  const chip = (kind) => {
    const k = P[kind] ? kind : 'secondary';
    return `<span class="chip" style="--c:${P[k].colorPaper}">${esc(P[k].label)}</span>`;
  };
  const factRow = (id) => {
    const f = facts[id];
    if (!f) return '';
    const s = f.source || {};
    return `<li class="row">${chip(kindOf(f.label))}<p class="claim">${esc(f.claim || id)}</p>` +
      `<p class="src">${link(s.url, [s.publisher, s.title].filter(Boolean).join(' · '))}${s.date || f.asOf ? ` · ${esc(fmtDate(s.date || f.asOf))}` : ''}</p>` +
      (f.caveat ? `<p class="note">${esc(f.caveat)}</p>` : '') + '</li>';
  };
  const evRow = (e) => {
    const f = (e.factIds || []).map((x) => facts[x]).find(Boolean);
    const kindWord = { video: 'Video', chart: 'Chart', page: 'Page' }[e.kind] || 'Evidence';
    return `<li class="row">${chip(kindOf(f && f.label))}<p class="claim"><span class="tag">${esc(kindWord)}</span> ${link(e.url, e.title || e.url)}</p>` +
      `<p class="src">${esc([e.publisher, fmtDate(e.date)].filter(Boolean).join(' · '))}${e.page ? ` · ${link(e.page, 'where it is published')}` : ''}</p>` +
      (e.disclaimer ? `<p class="note">${esc(e.disclaimer)}</p>` : '') + '</li>';
  };
  const capRow = (c) => `<li class="row">${chip('press')}<p class="claim"><span class="tag">${esc(c.kind === 'x' ? 'Post' : 'Article')}</span> ${link(c.url, c.title || c.url)}</p>` +
    `<p class="src">${esc([c.outlet || c.author, fmtDate(c.published)].filter(Boolean).join(' · '))}</p></li>`;
  const sfRow = (s) => `<li class="row">${chip('official')}<p class="claim"><span class="tag">Talk</span> ${link(s.video_url, [s.speaker, s.talk].filter(Boolean).join(' · ') || s.video_url)}</p>` +
    `<p class="src">${esc([s.org, s.timecode ? `at ${s.timecode}` : ''].filter(Boolean).join(' · '))}</p>` +
    (s.quote ? `<p class="note">«${esc(s.quote)}»</p>` : '') + '</li>';

  const acts = beats.acts || [];
  let html = '';
  let lastAct = null;
  let count = 0;
  beats.moments.forEach((m, i) => {
    const rows = [
      ...(m.facts || []).map(factRow),
      ...(evBy[m.id] || []).map(evRow),
      ...(sfBy[m.id] || []).map(sfRow),
      ...(capBy[m.id] || []).map(capRow),
    ].filter(Boolean);
    if (!rows.length) return;
    if (m.act !== lastAct) {
      const a = acts.find((x) => x.id === m.act);
      if (a) html += `<h2 class="act">${esc(a.title || a.name || a.id)}</h2>`;
      lastAct = m.act;
    }
    count += rows.length;
    html += `<section id="${esc(m.id)}"><h3><span class="n">${String(i + 1).padStart(2, '0')}</span>${esc(m.name || m.id)}</h3><ul>${rows.join('')}</ul></section>`;
  });
  const rest = captures.filter((c) => !placed.has(`c:${c.id}`)).map(capRow);
  if (rest.length) {
    count += rest.length;
    html += `<section id="press"><h3><span class="n">+</span>Press and posts captured for this keynote</h3><ul>${rest.join('')}</ul></section>`;
  }

  const font = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(SRC, 'fonts', f)).toString('base64')}`;
  const title = `${beats.title || 'Keynote'} · Sources`;
  const by = [beats.presenter, fmtDate(beats.date)].filter(Boolean).map(esc).join(' · ');
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
@font-face { font-family: "Geist"; src: url(${font('Geist-Variable.woff2')}) format("woff2"); font-weight: 100 900; font-display: swap; }
@font-face { font-family: "Geist Mono"; src: url(${font('GeistMono-Variable.woff2')}) format("woff2"); font-weight: 100 900; font-display: swap; }
:root { --ink: #0B0F14; --muted: #525B66; --accent: #3D55E0; --rule: #D9DEE4; --card: #F3F5F8; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: #FFFFFF; color: var(--ink); font: 440 18px/1.55 "Geist", ui-sans-serif, system-ui, sans-serif; }
main { max-width: 860px; margin: 0 auto; padding: 56px 24px 96px; }
h1 { font-size: 40px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 600; margin: 0 0 12px; }
.by { font: 500 15px/1.4 "Geist Mono", ui-monospace, monospace; color: var(--muted); margin: 0 0 8px; }
.count { color: var(--muted); margin: 0 0 40px; }
h2.act { font: 540 14px/1.3 "Geist Mono", ui-monospace, monospace; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent); margin: 56px 0 8px; padding-top: 16px; border-top: 2px solid var(--rule); }
h3 { font-size: 24px; line-height: 1.25; letter-spacing: -0.01em; font-weight: 600; margin: 28px 0 8px; display: flex; gap: 12px; align-items: baseline; }
h3 .n { font: 500 15px/1 "Geist Mono", ui-monospace, monospace; color: var(--muted); }
ul { list-style: none; margin: 0; padding: 0; }
.row { padding: 16px 0; border-bottom: 2px solid var(--card); }
.chip { display: inline-block; font: 600 12px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: 0.06em; color: var(--c); border: 2px solid var(--c); border-radius: 6px; padding: 5px 7px 4px; }
.claim { margin: 8px 0 4px; }
.tag { font: 540 13px/1 "Geist Mono", ui-monospace, monospace; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); margin-right: 4px; }
.src { margin: 0; font: 460 15px/1.5 "Geist Mono", ui-monospace, monospace; color: var(--muted); overflow-wrap: anywhere; }
.note { margin: 6px 0 0; font-size: 15px; color: var(--muted); }
a { color: var(--accent); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
a:hover { text-decoration-color: var(--ink); }
@media (max-width: 560px) { main { padding: 32px 18px 72px; } h1 { font-size: 30px; } h3 { font-size: 20px; } }
</style>
</head>
<body>
<main>
<h1>${esc(title)}</h1>
${by ? `<p class="by">${by}</p>` : ''}
<p class="count">${count} sources${factsJson.asOf ? ` · facts checked as of ${esc(fmtDate(factsJson.asOf))}` : ''}</p>
${html}
</main>
</body>
</html>
`;
  const out = path.join(path.dirname(outFile), 'sources.html');
  fs.writeFileSync(out, page);
  return { file: out, count, bytes: Buffer.byteLength(page) };
}
