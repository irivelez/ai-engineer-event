#!/usr/bin/env node
// fps (A2): frame-time stats per moment/step in HEADED Chromium with the GPU (ANGLE Metal), serially.
// Usage: node scripts/fps.mjs [index.html] [--moments a,b] [--steps all|0,2] [--seconds 5] [--json out.json]
//        [--viewport 1470x956 --dpr 2]   (MacBook Air Retina fullscreen: pixel ratio 1.5, ≈ 2205×1241 buffer)
// Per step: open ?m=<id>&s=<step>, wait until settled + 1 s, sample requestAnimationFrame deltas for N s.
// Reports mean fps; p95 frame time with intervals snapped to whole vsyncs (raw rAF p95 shown too: it carries
// ±2 ms timestamp jitter); missed vsyncs; p95 CPU work per frame (engine tick); GPU renderer; GL buffer.
// Pass criterion (GOAL G2): p95 ≤ 16.7 ms on every step of every GL moment.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withBrowser, fileUrl, watchErrors, waitReady, waitSettled, sleep } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const html = path.resolve(argv.find((a) => a.endsWith('.html')) || path.join(ROOT, 'index.html'));
const only = (opt('--moments', '') || '').split(',').filter(Boolean);
const stepsArg = opt('--steps', 'all');
const seconds = Number(opt('--seconds', '5'));
const jsonOut = opt('--json', null);
const headless = argv.includes('--headless');
const dpr = Number(opt('--dpr', '1'));
const [vw, vh] = (opt('--viewport', '1920x1080') || '1920x1080').split('x').map(Number);

const rows = [];
let gpu = null;
await withBrowser(async (browser) => {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto(fileUrl(html, '?render=1'));
  await waitReady(page);
  gpu = await page.evaluate(() => {
    const c = document.createElement('canvas').getContext('webgl2');
    if (!c) return 'no webgl2';
    const e = c.getExtension('WEBGL_debug_renderer_info');
    return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : c.getParameter(c.RENDERER);
  });
  const moments = await page.evaluate(() => window.__itaf.director.moments.map((m) => ({ id: m.id, n: m.n, steps: (m.steps || []).length || 1 })));
  const list = only.length ? moments.filter((m) => only.includes(m.id)) : moments;
  // Warm-up: the first page of a fresh browser pays shader/font/window start-up costs; don't measure it.
  if (list[0]) {
    await page.goto(fileUrl(html, `?m=${list[0].id}&s=0`));
    await waitReady(page);
    await sleep(2500);
  }
  for (const m of list) {
    const steps = stepsArg === 'all' ? [...Array(m.steps).keys()] : stepsArg.split(',').map(Number).filter((s) => s < m.steps);
    for (const s of steps) {
      await page.goto(fileUrl(html, `?m=${m.id}&s=${s}`));
      await waitReady(page);
      await waitSettled(page, 15000).catch(() => {});
      await sleep(1000);
      await page.evaluate(() => window.__itaf.frameStats(true));
      const r = await page.evaluate(async (sec) => new Promise((resolve) => {
        const d = [];
        let last = performance.now();
        const t0 = last;
        function f(now) {
          d.push(now - last);
          last = now;
          if (now - t0 < sec * 1000) requestAnimationFrame(f);
          else resolve({ d, gl: window.__itaf.glInfo ? window.__itaf.glInfo() : null, work: window.__itaf.frameStats() });
        }
        requestAnimationFrame(f);
      }), seconds);
      const d = r.d.slice(1);
      const sorted = [...d].sort((a, b) => a - b);
      const mean = d.reduce((a, b) => a + b, 0) / d.length;
      // rAF timestamps jitter around the vsync period; snap each interval to whole vsyncs to count misses.
      const vs = sorted[Math.floor(sorted.length / 2)] > 12 ? 1000 / 60 : 1000 / 120;
      const snapped = d.map((x) => Math.max(1, Math.round(x / vs)) * vs).sort((a, b) => a - b);
      const row = {
        id: m.id, step: s, frames: d.length, fps: +(1000 / mean).toFixed(1), meanMs: +mean.toFixed(2),
        p95Ms: +snapped[Math.floor(snapped.length * 0.95)].toFixed(2), rawP95Ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
        maxMs: +sorted[sorted.length - 1].toFixed(1), dropped: d.reduce((a, x) => a + Math.max(0, Math.round(x / vs) - 1), 0),
        workP95Ms: r.work ? +r.work.p95Ms.toFixed(2) : null,
        gl: r.gl ? { active: r.gl.active, pixelRatio: r.gl.pixelRatio, buffer: r.gl.buffer } : null,
      };
      row.pass = row.p95Ms <= 16.7 + 0.05;
      rows.push(row);
      console.log(`${row.pass ? 'PASS' : 'FAIL'}  ${m.id.padEnd(16)} s${s}  ${String(row.fps).padStart(5)} fps  p95 ${String(row.p95Ms).padStart(5)} ms (raw ${row.rawP95Ms})  work p95 ${row.workP95Ms} ms  max ${String(row.maxMs).padStart(5)}  missed vsyncs ${row.dropped}${row.gl ? `  GL ${row.gl.active ? 'on' : 'off'} pr ${row.gl.pixelRatio} ${row.gl.buffer.join('×')}` : ''}`);
    }
  }
  if (errors.length) { console.log('console errors:'); errors.forEach((e) => console.log('  ' + e)); }
  await ctx.close();
}, { gpu: true, headless, timeoutMs: 30 * 60 * 1000 });

console.log(`GPU: ${gpu}${/swiftshader|software|llvmpipe/i.test(gpu || '') ? '  ← SOFTWARE: numbers are not representative' : ''}`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ gpu, viewport: [vw, vh], dpr, at: new Date().toISOString(), html, rows }, null, 2));
if (rows.some((r) => !r.pass)) process.exitCode = 1;
