#!/usr/bin/env node
// G1 smoke test (A2): opens a built keynote via file:// in Chromium and checks
//   1. zero console errors / page errors / failed requests
//   2. every step of every moment, forward with real key presses (→) and back (←)
//   3. ?m=<id>&s=<step>, ?m=<number>, ?render=1 (ready flag, deterministic start)
// Usage: node scripts/smoke.mjs [index.html|static.html] [--quick] [--static]
//   --quick  drive navigation through window.__itaf instead of key presses (faster, no animations)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withBrowser, fileUrl, watchErrors, waitReady, sleep } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const html = path.resolve(argv.find((a) => a.endsWith('.html')) || path.join(ROOT, 'index.html'));
const quick = argv.includes('--quick');
const isStatic = argv.includes('--static') || path.basename(html).startsWith('static');
if (!fs.existsSync(html)) { console.error(`smoke: ${html} not found (run node scripts/build.mjs)`); process.exit(1); }

const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); return ok; };

await withBrowser(async (browser) => {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = watchErrors(page);

  // ---------- 1. full walk forward and back ----------
  await page.goto(fileUrl(html));
  await waitReady(page);
  const moments = await page.evaluate(() => window.__itaf.director.moments.map((m) => m.id));
  const stepsOf = async () => page.evaluate(() => { const s = window.__itaf.state(); return [s.momentId, s.step, s.steps]; });
  const press = async (key) => {
    if (quick) await page.evaluate((k) => (k === 'ArrowRight' ? window.__itaf.next() : window.__itaf.prev()), key);
    else await page.keyboard.press(key);
    await sleep(quick ? 0 : 140);
  };
  const seen = new Map();
  let [id, step, steps] = await stepsOf();
  const visit = () => { if (!seen.has(id)) seen.set(id, new Set()); seen.get(id).add(step); };
  visit();
  let guard = 0;
  const t0 = Date.now();
  while (!(id === moments[moments.length - 1] && step === steps - 1) && guard++ < 600) {
    await press('ArrowRight');
    [id, step, steps] = await stepsOf();
    visit();
  }
  const fwdMs = Date.now() - t0;
  let missing = 0;
  for (const m of moments) {
    const st = await page.evaluate((mid) => { const recs = window.__itaf.director.recs; const r = recs ? recs.get(mid) : null; return r ? r.steps : null; }, m);
    const got = seen.get(m);
    if (!got) { missing++; fails.push(`forward: moment ${m} never shown`); continue; }
    if (st != null) for (let s = 0; s < st; s++) if (!got.has(s)) { missing++; fails.push(`forward: ${m} step ${s} never shown`); }
  }
  check(id === moments[moments.length - 1], `forward walk ended on ${id}, not ${moments[moments.length - 1]}`);
  const back = [];
  guard = 0;
  while (!(id === moments[0] && step === 0) && guard++ < 600) {
    await press('ArrowLeft');
    [id, step, steps] = await stepsOf();
    back.push(id);
  }
  check(id === moments[0] && step === 0, `backward walk ended on ${id}/${step}`);
  const backSet = new Set(back);
  for (const m of moments.slice(0, -1)) check(backSet.has(m), `backward: moment ${m} never shown`);
  console.log(`walk: ${moments.length} moments, ${[...seen.values()].reduce((a, s) => a + s.size, 0)} steps forward in ${(fwdMs / 1000).toFixed(1)} s, ${back.length} presses back${missing ? `, ${missing} missing` : ''}`);

  // ---------- 2. URL params ----------
  const probe = async (q) => {
    await page.goto(fileUrl(html, q));
    await waitReady(page);
    return page.evaluate(() => window.__itaf.state());
  };
  const mid = moments[Math.min(5, moments.length - 1)];
  let s = await probe(`?m=${mid}&s=1`);
  check(s.momentId === mid && s.step === Math.min(1, s.steps - 1), `?m=${mid}&s=1 → ${s.momentId}/${s.step}`);
  s = await probe(`?m=3`);
  const third = await page.evaluate(() => (window.__itaf.director.moments.find((m) => m.n === 3) || {}).id);
  check(s.momentId === third, `?m=3 → ${s.momentId}, expected ${third}`);
  if (!isStatic) {
  s = await probe(`?render=1&m=${moments[moments.length - 1]}&s=0`);
  check(s.momentId === moments[moments.length - 1], `?render=1 → ${s.momentId}`);
  const ready = await page.evaluate(() => document.documentElement.dataset.ready);
  check(ready === '1', `?render=1: data-ready=${ready}`);
  s = await probe(`?only=${moments.slice(0, 2).join(',')}`);
  const onlyN = await page.evaluate(() => window.__itaf.director.moments.length);
  check(onlyN === Math.min(2, moments.length), `?only= kept ${onlyN} moments`);
  }

  for (const e of errors) fails.push(e);
  await ctx.close();
});

if (fails.length) {
  console.log(`smoke: FAIL (${fails.length})`);
  for (const f of fails.slice(0, 60)) console.log('  ' + f);
  process.exit(1);
}
console.log('smoke: PASS · zero console errors');
