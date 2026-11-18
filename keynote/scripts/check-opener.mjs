#!/usr/bin/env node
// Opener check (A1): pure black before the first →, film plays with sound after it, holds the last frame;
// ?novideo=1 fallback lands on the film's title box (ink x 584–1341, y 508–570). Writes PNGs to --out.
// Usage: node scripts/check-opener.mjs [index.html] --out <dir>
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withBrowser, fileUrl, watchErrors, waitReady, sleep } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const html = path.resolve(argv.find((a) => a.endsWith('.html')) || path.join(ROOT, 'index.html'));
const oi = argv.indexOf('--out');
const out = path.resolve(oi >= 0 ? argv[oi + 1] : path.join(os.tmpdir(), 'itaf-qa', 'opener'));
fs.mkdirSync(out, { recursive: true });

// White-pixel bounding box of the title (in-page canvas read of a screenshot).
async function inkBox(page, png) {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, maxDark = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const v = d[i] + d[i + 1] + d[i + 2];
      if (v > 384) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
      else if (v > maxDark) maxDark = v;
    }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }, png.toString('base64'));
}

const report = {};
await withBrowser(async (browser) => {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await page.goto(fileUrl(html, '?m=opener'));
  await waitReady(page);
  let png = await page.screenshot({ path: path.join(out, '1-before-press.png') });
  report.beforePress = { box: await inkBox(page, png) };
  await page.keyboard.press('ArrowRight');
  await sleep(2500);
  report.afterPress = await page.evaluate(() => {
    const v = document.querySelector('.moment[data-id="opener"] video');
    const inst = window.__itaf.director.current.inst;
    return { state: inst.state, paused: v.paused, muted: v.muted, t: +v.currentTime.toFixed(2), duration: v.duration, error: v.error && v.error.code, canH264: v.canPlayType('video/mp4; codecs="avc1.640028, mp4a.40.2"') };
  });
  await page.screenshot({ path: path.join(out, '2-after-press.png') });
  if (!argv.includes('--skip-film') && report.afterPress.state === 'playing') {
    await page.evaluate(() => { const v = document.querySelector('.moment[data-id="opener"] video'); v.currentTime = v.duration - 0.5; });
    await sleep(1500);
    png = await page.screenshot({ path: path.join(out, '3-film-end.png') });
    report.filmEnd = { box: await inkBox(page, png), state: await page.evaluate(() => window.__itaf.director.current.inst.state) };
  }
  console.log('film phase done:', JSON.stringify(report.afterPress));
  // Stop the film before leaving: closing a context with live media playback can stall headless Chrome.
  await page.evaluate(() => { const v = document.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } }).catch(() => {});
  await page.goto('about:blank').catch(() => {});
  // fallback in a fresh context (the film's decoder and audio are gone)
  const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page2 = await ctx2.newPage();
  const errors2 = watchErrors(page2);
  await page2.goto(fileUrl(html, '?m=opener&novideo=1'));
  await waitReady(page2);
  await page2.keyboard.press('ArrowRight');
  await page2.evaluate(() => window.__itaf.gsap.globalTimeline.timeScale(4));
  await sleep(1000);
  await page2.screenshot({ path: path.join(out, '4-fallback-mid.png'), timeout: 15000 }).catch((e) => console.log('mid screenshot failed:', e.message));
  await page2.evaluate(() => window.__itaf.gsap.globalTimeline.timeScale(12));
  await sleep(2400);
  png = await page2.screenshot({ path: path.join(out, '5-fallback-end.png') });
  report.fallbackEnd = { box: await inkBox(page2, png), state: await page2.evaluate(() => window.__itaf.director.current.inst.state) };
  await page2.evaluate(() => window.__itaf.gsap.globalTimeline.timeScale(1));
  // render mode
  await page2.goto(fileUrl(html, '?render=1&m=opener'));
  await waitReady(page2);
  png = await page2.screenshot({ path: path.join(out, '6-render-mode.png') });
  report.renderMode = { box: await inkBox(page2, png) };
  report.errors = [...errors, ...errors2];
  console.log('fallback phase done');
}, { timeoutMs: 120000 });
report.target = { x0: 584, y0: 508, x1: 1341, y1: 570 };
console.log(JSON.stringify(report, null, 1));
