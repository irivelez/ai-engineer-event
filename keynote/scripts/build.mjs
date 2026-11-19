#!/usr/bin/env node
// Builds keynote/index.html: ONE self-contained file that opens by double-click (file://).
// JS is a classic IIFE <script>, CSS is inlined, fonts and images are data URIs, JSON is
// imported at build time. The only external file is media/opener-1080p.mp4 (optional).
//
//   node scripts/build.mjs                              full build → keynote/index.html
//   node scripts/build.mjs --only factory,slop          only these moments (dev build)
//   node scripts/build.mjs --only factory --out /tmp/f.html
//   node scripts/build.mjs --only factory --map factory=_example-gl   run another file as that moment
//   flags: --no-minify (default for --only builds), --minify, --quiet
//
// Scene discovery: src/scenes/<id>.js for every moment id in src/data/beats.json.
// Moments without a file use src/scenes/_placeholder.js.
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSourcesPage } from './lib/sources-page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const t0 = Date.now();

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => {
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(name + '='));
  return eq ? eq.slice(name.length + 1) : null;
};
const optAll = (name) => {
  const out = [];
  argv.forEach((a, i) => {
    if (a === name && argv[i + 1]) out.push(argv[i + 1]);
    else if (a.startsWith(name + '=')) out.push(a.slice(name.length + 1));
  });
  return out;
};
const only = (opt('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const outFile = path.resolve(process.cwd(), opt('--out') || path.join(ROOT, 'index.html'));
const quiet = flag('--quiet');
const minify = flag('--minify') ? true : flag('--no-minify') ? false : only.length === 0;
const maps = Object.fromEntries(
  optAll('--map').flatMap((s) => s.split(',')).map((s) => s.split('=').map((x) => x.trim())).filter((p) => p.length === 2)
);
const log = (...a) => { if (!quiet) console.log(...a); };
const warn = (...a) => console.warn('build: warning:', ...a);

// ---------- data ----------
const readJSON = (p, fallback) => {
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { throw new Error(`${path.relative(ROOT, p)} is not valid JSON: ${e.message}`); }
};
const beatsRaw = readJSON(path.join(SRC, 'data/beats.json'));
if (!beatsRaw || !Array.isArray(beatsRaw.moments)) throw new Error('src/data/beats.json: missing moments[]');
// n = the moment's 1-based number in the full show (stable across --only builds; used by number+Enter, frames).
const beats = { ...beatsRaw, moments: beatsRaw.moments.map((m, i) => ({ ...m, n: i + 1 })) };
const allIds = beats.moments.map((m) => m.id);
const unknown = only.filter((id) => !allIds.includes(id));
if (unknown.length) throw new Error(`--only: unknown moment id(s): ${unknown.join(', ')}`);
const momentIds = only.length ? allIds.filter((id) => only.includes(id)) : allIds;

// ---------- design stub (DD owns src/design/tokens.js; never overwrite) ----------
const tokensPath = path.join(SRC, 'design/tokens.js');
if (!fs.existsSync(tokensPath)) {
  const stub = fs.readFileSync(path.join(SRC, 'engine/tokens-stub.js'), 'utf8');
  try {
    fs.writeFileSync(tokensPath, stub.replace('// ENGINE STUB SOURCE', '// STUB written by build.mjs because src/design/tokens.js was missing. DD replaces the values; keep the export names.'), { flag: 'wx' });
    warn('src/design/tokens.js was missing: wrote a stub with the spec export names (DD replaces it).');
  } catch { /* someone wrote it meanwhile */ }
}

// ---------- scenes ----------
const sceneFile = (id) => {
  const mapped = maps[id];
  const name = mapped ? (mapped.endsWith('.js') ? mapped : mapped + '.js') : `${id}.js`;
  const p = path.join(SRC, 'scenes', name);
  return fs.existsSync(p) ? p : null;
};
const sceneEntries = momentIds.map((id) => [id, sceneFile(id)]).filter(([, p]) => p);
for (const [id, file] of Object.entries(maps)) if (!sceneFile(id)) throw new Error(`--map ${id}=${file}: src/scenes/${file} not found`);
const placeholderPath = path.join(SRC, 'scenes/_placeholder.js');

// ---------- asset manifests (media teammate) ----------
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' };
const manifestPath = (name) => [path.join(SRC, 'data', name), path.join(ROOT, 'data', name)].find((p) => fs.existsSync(p)) || null;
function manifestEntries(json) {
  if (!json) return [];
  let list = Array.isArray(json) ? json : json.items || json.stills || json.captures || json.entries || json.images || null;
  if (!list && typeof json === 'object') list = Object.entries(json).map(([id, v]) => (typeof v === 'string' ? { id, file: v } : { id, ...v }));
  return (list || []).filter((e) => e && e.id);
}
function resolveMedia(file, manifestDir, kind) {
  if (!file || /^(https?:|data:)/.test(file)) return null;
  const cands = [file, path.join(ROOT, file), path.join(manifestDir, file), path.join(ROOT, 'media', file), path.join(ROOT, 'media', kind, file), path.join(ROOT, 'media', kind, path.basename(file))];
  return cands.find((p) => path.isAbsolute(p) && fs.existsSync(p) && fs.statSync(p).isFile()) || null;
}
function loadAssets(name, kind) {
  const mp = manifestPath(name);
  if (!mp) return { uris: {}, meta: {} };
  const entries = manifestEntries(readJSON(mp, null));
  const uris = {}, meta = {};
  let bytes = 0;
  for (const e of entries) {
    const file = e.file || e.path || e.src || e.image || e.png || e.webp || e.jpg;
    const abs = resolveMedia(file, path.dirname(mp), kind);
    const { file: _f, path: _p, src: _s, image: _i, ...rest } = e;
    meta[e.id] = rest;
    if (!abs) { warn(`${path.relative(ROOT, mp)}: "${e.id}": file not found (${file})`); continue; }
    const mime = MIME[path.extname(abs).toLowerCase()];
    if (!mime) { warn(`${e.id}: unsupported image type ${abs}`); continue; }
    const buf = fs.readFileSync(abs);
    bytes += buf.length;
    uris[e.id] = `data:${mime};base64,${buf.toString('base64')}`;
  }
  log(`  assets ${name}: ${Object.keys(uris).length}/${entries.length} inlined (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
  return { uris, meta };
}

// ---------- evidence (src/data/evidence.json; the evidence kit in src/components) ----------
// Videos stay external: their src is rewritten relative to the output file (index.html → media/evidence/x.mp4,
// .dev/x.html → ../media/evidence/x.mp4) and is never inlined. Posters and doc images are inlined as data URIs
// (safe for DOM and WebGL on file://). A missing file is a warning, never an error: the player falls back.
// evidence.json plus every src/data/evidence-*.json (owned by other teammates); an id seen first wins.
function evidenceEntries() {
  const dir = path.join(SRC, 'data');
  const files = [manifestPath('evidence.json'), ...(exists(dir) ? fs.readdirSync(dir).filter((f) => /^evidence-.+\.json$/.test(f)).sort().map((f) => path.join(dir, f)) : [])].filter(Boolean);
  const seen = new Map();
  for (const f of files) for (const e of manifestEntries(readJSON(f, null))) if (!seen.has(e.id)) seen.set(e.id, e);
  return { mp: files[0] || null, entries: [...seen.values()] };
}
function loadEvidence() {
  const { mp, entries } = evidenceEntries();
  if (!mp) return { uris: {}, meta: {} };
  const uris = {}, meta = {};
  let bytes = 0, videos = 0, missing = 0;
  const outDir = path.dirname(outFile);
  const inline = (file, id, what) => {
    const abs = resolveMedia(file, path.dirname(mp), 'evidence');
    if (!abs) { warn(`evidence "${id}": ${what} not found (${file})`); missing++; return null; }
    const mime = MIME[path.extname(abs).toLowerCase()];
    if (!mime) { warn(`evidence "${id}": ${what} is not an image (${file})`); return null; }
    const buf = fs.readFileSync(abs);
    bytes += buf.length;
    return `data:${mime};base64,${buf.toString('base64')}`;
  };
  for (const e of entries) {
    const m = { ...e };
    const u = {};
    if (e.kind === 'video') {
      videos++;
      if (e.file && !/^(https?:|data:)/.test(e.file)) {
        const abs = resolveMedia(e.file, path.dirname(mp), 'evidence');
        if (!abs) { warn(`evidence "${e.id}": video ${e.file} not found (live: YouTube on https, poster + link on file://)`); missing++; }
        m.file = path.relative(outDir, abs || path.join(ROOT, e.file)).split(path.sep).join('/');
      }
      if (e.poster) u.poster = inline(e.poster, e.id, 'poster');
    } else if (e.file) u.image = inline(e.file, e.id, 'image');
    meta[e.id] = m;
    uris[e.id] = u;
  }
  log(`  evidence: ${entries.length} items (${videos} videos, external), ${(bytes / 1024 / 1024).toFixed(1)} MB inlined${missing ? `, ${missing} files missing` : ''}`);
  return { uris, meta };
}

// ---------- virtual modules ----------
const J = JSON.stringify;
const exists = (p) => fs.existsSync(p);
function designModule() {
  const lines = [];
  lines.push(`import * as tokens from ${J(tokensPath)};`);
  const iconsPath = path.join(SRC, 'design/icons.js');
  lines.push(exists(iconsPath) ? `import * as icons from ${J(iconsPath)};` : 'const icons = {};');
  const compIndex = path.join(SRC, 'components/index.js');
  const compDir = path.join(SRC, 'components');
  if (exists(compIndex)) lines.push(`import * as components from ${J(compIndex)};`);
  else {
    const files = exists(compDir) ? fs.readdirSync(compDir).filter((f) => f.endsWith('.js')).sort() : [];
    files.forEach((f, i) => lines.push(`import * as c${i} from ${J(path.join(compDir, f))};`));
    lines.push(`const components = Object.assign({}, ${files.map((_, i) => `c${i}`).join(', ') || '{}'});`);
  }
  const styleDir = path.join(SRC, 'styles');
  const styles = exists(styleDir) ? fs.readdirSync(styleDir).filter((f) => f.endsWith('.css')) : [];
  const order = (f) => (f === 'tokens.css' ? 0 : f === 'fonts.css' ? 1 : f === 'base.css' ? 2 : 3);
  styles.sort((a, b) => order(a) - order(b) || a.localeCompare(b)).forEach((f) => lines.push(`import ${J(path.join(styleDir, f))};`));
  lines.push('export { tokens, icons, components };');
  return lines.join('\n');
}
function scenesModule() {
  const lines = [`import placeholder from ${J(placeholderPath)};`];
  sceneEntries.forEach(([, p], i) => lines.push(`import s${i} from ${J(p)};`));
  lines.push(`export const scenes = { ${sceneEntries.map(([id], i) => `${J(id)}: s${i}`).join(', ')} };`);
  lines.push('export { placeholder };');
  return lines.join('\n');
}
function dataModule() {
  const data = {
    beats: { ...beats, moments: beats.moments.filter((m) => momentIds.includes(m.id)) },
    facts: readJSON(path.join(SRC, 'data/facts.json'), null),
    notes: readJSON(path.join(SRC, 'data/notes.json'), null),
    // static frames that exist (scripts/render-static.mjs): the presenter thumbnails and the GL fallback
    // only request these, so a missing frame never becomes a console error.
    frames: ((readJSON(path.join(ROOT, 'static/manifest.json'), null) || {}).frames || []).map((f) => f.file),
  };
  return `export default ${J(data)};`;
}
function assetsModule() {
  const sf = loadAssets('sf-stills.json', 'sf');
  const cap = loadAssets('captures.json', 'captures');
  const ev = loadEvidence();
  return `export const sf = ${J(sf.uris)};\nexport const capture = ${J(cap.uris)};\nexport const sfMeta = ${J(sf.meta)};\nexport const captureMeta = ${J(cap.meta)};\nexport const evidence = ${J(ev.uris)};\nexport const evidenceMeta = ${J(ev.meta)};`;
}
function fontsModule() {
  // .woff/.ttf/.otf files for troika (GL text cannot read woff2). Keyed by file name.
  const dir = path.join(SRC, 'fonts');
  const files = exists(dir) ? fs.readdirSync(dir).filter((f) => /\.(woff|ttf|otf)$/i.test(f)) : [];
  const mime = { '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };
  const map = Object.fromEntries(files.map((f) => [f, `data:${mime[path.extname(f).toLowerCase()]};base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}`]));
  return `export default ${J(map)};`;
}
function buildInfoModule() {
  return `export default ${J({ builtAt: new Date().toISOString(), only, maps, scenes: sceneEntries.map(([id]) => id), minify })};`;
}
const VIRTUAL = { 'itaf:design': designModule, 'itaf:scenes': scenesModule, 'itaf:data': dataModule, 'itaf:assets': assetsModule, 'itaf:fonts': fontsModule, 'itaf:build': buildInfoModule };
const virtualPlugin = {
  name: 'itaf-virtual',
  setup(build) {
    build.onResolve({ filter: /^itaf:/ }, (args) => (VIRTUAL[args.path] ? { path: args.path, namespace: 'itaf' } : { errors: [{ text: `unknown virtual module ${args.path}` }] }));
    build.onLoad({ filter: /.*/, namespace: 'itaf' }, (args) => ({ contents: VIRTUAL[args.path](), resolveDir: SRC, loader: 'js' }));
  },
};

// ---------- bundle ----------
const result = await esbuild.build({
  entryPoints: [path.join(SRC, 'main.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome110', 'safari16'],
  write: false,
  outdir: path.join(ROOT, '.build-tmp'),
  minify,
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'silent',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: {
    '.json': 'json', '.woff2': 'dataurl', '.woff': 'dataurl', '.ttf': 'dataurl', '.otf': 'dataurl',
    '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.webp': 'dataurl', '.gif': 'dataurl', '.avif': 'dataurl',
    '.svg': 'dataurl', '.glsl': 'text', '.vert': 'text', '.frag': 'text', '.txt': 'text',
  },
  plugins: [virtualPlugin],
}).catch((e) => {
  // esbuild already formats errors with file:line; print them plainly.
  for (const m of e.errors || []) console.error(`build: error: ${m.text}${m.location ? `\n  ${m.location.file}:${m.location.line}:${m.location.column}\n  ${m.location.lineText}` : ''}`);
  if (!e.errors) console.error(e);
  process.exit(1);
});
for (const w of result.warnings) warn(`${w.text}${w.location ? ` (${w.location.file}:${w.location.line})` : ''}`);

let js = '', css = '';
for (const f of result.outputFiles) {
  if (f.path.endsWith('.js')) js += f.text;
  else if (f.path.endsWith('.css')) css += f.text;
}
// Make the inline <script>/<style> unbreakable by their contents.
js = js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
css = css.replace(/<\/style/gi, '<\\/style');

const title = beats.title || 'Keynote';
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%277%27 fill=%27%2305070A%27/%3E%3Cpath d=%27M9 9l7 7-7 7M17 9l7 7-7 7%27 stroke=%27%2393AAFF%27 stroke-width=%273%27 fill=%27none%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}${only.length ? ` · dev: ${only.join(',')}` : ''}</title>
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}</style>
<style>${css}</style>
</head>
<body>
<noscript>This keynote needs JavaScript.</noscript>
<script>${js}</script>
</body>
</html>
`;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
const sources = await writeSourcesPage({ ROOT, SRC, beats, outFile });
log(`  sources: ${path.relative(process.cwd(), sources.file) || sources.file} · ${sources.count} sources · ${(sources.bytes / 1024).toFixed(0)} KB`);
const mb = (Buffer.byteLength(html) / 1024 / 1024).toFixed(2);
log(`build: ${path.relative(process.cwd(), outFile) || outFile} · ${mb} MB · ${momentIds.length} moments · scenes: ${sceneEntries.map(([id]) => id).join(', ') || 'none'} · ${minify ? 'minified' : 'readable'} · ${Date.now() - t0} ms`);
