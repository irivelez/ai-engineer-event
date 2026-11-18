#!/usr/bin/env node
// shoot (A2): settled screenshot of every step at 1920×1080 + a contact sheet.
// Usage: node scripts/shoot.mjs [index.html] [--moments a,b] [--steps all|0,2] [--out dir] [--live] [--gpu]
//   default: ?render=1 per step (deterministic final state). --live: navigate with → and wait until settled
//   (real enter/goto animations, then 0.4 s). Output: <out>/NN-<id>-S.png and <out>/contact.png
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withBrowser, fileUrl, watchErrors, waitReady, waitSettled, sleep } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const html = path.resolve(argv.find((a) => a.endsWith('.html')) || path.join(ROOT, 'index.html'));
const out = path.resolve(opt('--out', path.join(os.tmpdir(), 'itaf-qa', 'shots')));
const only = (opt('--moments', '') || '').split(',').filter(Boolean);
const stepsArg = opt('--steps', 'all');
const live = argv.includes('--live');
fs.mkdirSync(out, { recursive: true });

const shots = [];
const allErrors = [];
await withBrowser(async (browser) => {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto(fileUrl(html, '?render=1'));
  await waitReady(page);
  const moments = await page.evaluate(() => window.__itaf.director.moments.map((m) => ({ id: m.id, n: m.n, steps: (m.steps || []).length || 1 })));
  const list = only.length ? moments.filter((m) => only.includes(m.id)) : moments;
  for (const m of list) {
    const steps = stepsArg === 'all' ? [...Array(m.steps).keys()] : stepsArg.split(',').map(Number).filter((s) => s < m.steps);
    if (live) {
      await page.goto(fileUrl(html, `?m=${m.id}&s=0&hud=1`));
      await waitReady(page);
    }
    for (const s of steps) {
      if (live) {
        if (s > 0) await page.evaluate((st) => { window.__itaf.goto(window.__itaf.state().momentId, st); }, s);
        await waitSettled(page, 15000).catch(() => {});
        await sleep(400);
      } else {
        await page.goto(fileUrl(html, `?render=1&m=${m.id}&s=${s}`));
        await waitReady(page);
      }
      const file = path.join(out, `${String(m.n).padStart(2, '0')}-${m.id}-${s}.png`);
      await page.screenshot({ path: file, timeout: 20000 });
      shots.push({ id: m.id, n: m.n, step: s, file });
      process.stdout.write(`  ${path.basename(file)}\n`);
    }
  }
  // contact sheet: 4 columns of 480×270 thumbnails with labels
  const cols = 4;
  const rows = Math.ceil(shots.length / cols);
  const sheet = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111;color:#ddd;font:14px/1.2 ui-monospace,Menlo,monospace}
    .g{display:grid;grid-template-columns:repeat(${cols},480px);gap:8px;padding:8px}.c img{width:480px;height:270px;display:block;background:#000}.c div{padding:3px 0}</style>
    <div class="g">${shots.map((s) => `<div class="c"><img src="${fileUrl(s.file)}"><div>${String(s.n).padStart(2, '0')} ${s.id} · ${s.step}</div></div>`).join('')}</div>`;
  const sheetHtml = path.join(out, 'contact.html');
  fs.writeFileSync(sheetHtml, sheet);
  await page.setViewportSize({ width: 8 + cols * 488, height: Math.max(300, 8 + rows * 300) });
  await page.goto(fileUrl(sheetHtml));
  await sleep(500);
  await page.screenshot({ path: path.join(out, 'contact.png'), fullPage: true, timeout: 30000 });
  allErrors.push(...errors);
  await ctx.close();
}, { timeoutMs: 20 * 60 * 1000 });

console.log(`shoot: ${shots.length} shots → ${out} (contact.png)`);
if (allErrors.length) {
  console.log(`console errors (${allErrors.length}):`);
  allErrors.slice(0, 30).forEach((e) => console.log('  ' + e));
  process.exitCode = 1;
}
