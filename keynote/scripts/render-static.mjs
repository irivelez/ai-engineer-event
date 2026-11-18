#!/usr/bin/env node
// render-static (A2): the static fallback.
//  1. Opens the built index.html in Chromium (1920×1080, DPR 1) and, for every moment and step, loads
//     ?render=1&m=<id>&s=<step> and saves static/frames/NN-<id>-S.webp (quality 82).
//  2. Writes static/manifest.json and bundles static.html: a self-contained viewer with the same keys,
//     fullscreen, N notes, T timer, P presenter and presenter sync (frames load as <img>, file:// safe).
// The engine also uses these frames automatically when WebGL fails.
// Usage: node scripts/render-static.mjs [index.html] [--moments a,b] [--viewer-only]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { withBrowser, fileUrl, watchErrors, waitReady } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const html = path.resolve(argv.find((a) => a.endsWith('.html')) || path.join(ROOT, 'index.html'));
const only = (opt('--moments', '') || '').split(',').filter(Boolean);
const framesDir = path.join(ROOT, 'static/frames');
const manifestPath = path.join(ROOT, 'static/manifest.json');
fs.mkdirSync(framesDir, { recursive: true });

const beats = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/beats.json'), 'utf8'));
beats.moments = beats.moments.map((m, i) => ({ ...m, n: i + 1 }));
const notesPath = path.join(ROOT, 'src/data/notes.json');
const notes = fs.existsSync(notesPath) ? JSON.parse(fs.readFileSync(notesPath, 'utf8')) : {};

let frames = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')).frames || [] : [];
const errors = [];
if (!argv.includes('--viewer-only')) {
  await withBrowser(async (browser) => {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const conv = await ctx.newPage();
    errors.push(...watchErrors(page));
    const list = only.length ? beats.moments.filter((m) => only.includes(m.id)) : beats.moments;
    const fresh = [];
    for (const m of list) {
      await page.goto(fileUrl(html, `?render=1&m=${m.id}&s=0`));
      await waitReady(page);
      const steps = await page.evaluate(() => window.__itaf.state().steps);
      for (let s = 0; s < steps; s++) {
        if (s > 0) {
          await page.goto(fileUrl(html, `?render=1&m=${m.id}&s=${s}`));
          await waitReady(page);
        }
        const png = await page.screenshot({ timeout: 20000 });
        const webp = await conv.evaluate(async (b64) => {
          const im = new Image();
          im.src = 'data:image/png;base64,' + b64;
          await im.decode();
          const c = document.createElement('canvas');
          c.width = im.width; c.height = im.height;
          c.getContext('2d').drawImage(im, 0, 0);
          return c.toDataURL('image/webp', 0.82).split(',')[1];
        }, png.toString('base64'));
        const file = `static/frames/${String(m.n).padStart(2, '0')}-${m.id}-${s}.webp`;
        fs.writeFileSync(path.join(ROOT, file), Buffer.from(webp, 'base64'));
        fresh.push({ n: m.n, id: m.id, step: s, steps, file, ground: m.ground });
        process.stdout.write(`  ${file}\n`);
      }
    }
    const keep = frames.filter((f) => !fresh.some((x) => x.id === f.id));
    frames = [...keep, ...fresh].sort((a, b) => a.n - b.n || a.step - b.step);
    await ctx.close();
  }, { timeoutMs: 30 * 60 * 1000 });
  fs.writeFileSync(manifestPath, JSON.stringify({ generatedAt: new Date().toISOString(), size: [1920, 1080], frames }, null, 1));
}

// ---------- static.html ----------
const out = await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/static/viewer.js')], bundle: true, format: 'iife', platform: 'browser', write: false,
  outdir: path.join(ROOT, '.build-tmp'), minify: true, legalComments: 'none', charset: 'utf8', logLevel: 'silent',
  loader: { '.woff2': 'dataurl', '.woff': 'dataurl' },
});
let js = '';
let css = '';
for (const f of out.outputFiles) { if (f.path.endsWith('.js')) js += f.text; else if (f.path.endsWith('.css')) css += f.text; }
const data = JSON.stringify({ beats: { title: beats.title, acts: beats.acts, icons: beats.icons, moments: beats.moments.map(({ id, n, act, ground, plannedSec, icon, steps, brief, mode, copy }) => ({ id, n, act, ground, plannedSec, icon, steps, brief, mode, copy })) }, notes, frames }).replace(/</g, '\\u003c');
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${beats.title} · static</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}${css.replace(/<\/style/gi, '<\\/style')}</style></head>
<body><script>window.__ITAF_STATIC__=${data};</script><script>${js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--')}</script></body></html>
`;
fs.writeFileSync(path.join(ROOT, 'static.html'), page);
// Rebuild index.html so it knows which frames exist (presenter thumbnails, GL fallback).
if (!argv.includes('--no-rebuild') && !argv.includes('--viewer-only')) {
  const { spawnSync } = await import('node:child_process');
  spawnSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs'), '--quiet'], { stdio: 'inherit' });
}
console.log(`render-static: ${frames.length} frames · static/manifest.json · static.html (${(Buffer.byteLength(page) / 1024).toFixed(0)} KB)${errors.length ? ` · ${errors.length} console errors` : ''}`);
errors.slice(0, 20).forEach((e) => console.log('  ' + e));
