// Bundle a style frame into one standalone HTML (fonts inlined), next to its source.
// usage (from keynote/): node docs/style-frames/src/build.mjs A-employee-bar
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2] || 'A-employee-bar';
const res = await build({
  entryPoints: [path.join(dir, `${name}.js`)],
  bundle: true, format: 'iife', write: false, outdir: dir, minify: true,
  loader: { '.woff2': 'dataurl', '.woff': 'dataurl', '.json': 'json' },
  logLevel: 'warning',
});
const js = res.outputFiles.find((f) => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = (res.outputFiles.find((f) => f.path.endsWith('.css')) || { text: '' }).text;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Style frame ${name}</title>` +
  `<meta name="viewport" content="width=1920"><style>${css}html,body{margin:0;background:#888}</style></head>` +
  `<body><script>${js}</script></body></html>`;
fs.writeFileSync(path.join(dir, `${name}.html`), html);
console.log(`${name}.html ${(html.length / 1024).toFixed(0)} KB`);
