#!/usr/bin/env node
// sync-check (A2): verifies two-way audience ⇄ presenter sync on file:// with two Playwright pages, once per
// channel in isolation (the other two disabled in a fresh context) and once with all three:
//   postMessage  presenter opened with P from the audience (window.open / window.opener)
//   broadcast    BroadcastChannel('itaf') only; presenter opened as an independent page
//   storage      localStorage + storage events only; presenter opened as an independent page
//   all          + timer (T in presenter), jump (number + Enter), blackout (B) remote keys
// Usage: node scripts/sync-check.mjs [index.html]
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withBrowser, fileUrl, watchErrors, waitReady, sleep } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = path.resolve(process.argv.slice(2).find((a) => a.endsWith('.html')) || path.join(ROOT, 'index.html'));

const DISABLE = {
  broadcast: 'window.BroadcastChannel = undefined;',
  storage: `(() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'itaf-state' || k === 'itaf-cmd') return; return set.call(this, k, v); }; })();`,
};
const results = [];
const fail = (mode, msg) => results.push({ mode, ok: false, msg });
const pass = (mode, msg) => results.push({ mode, ok: true, msg });

async function until(fn, ms = 3000) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await sleep(100);
  }
}

await withBrowser(async (browser) => {
  for (const mode of ['postMessage', 'broadcast', 'storage', 'all']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    // Disable the channels not under test. postMessage exists only when the audience opened the presenter (P);
    // in the broadcast/storage modes the presenter is an independent page, so it has no opener.
    const off = mode === 'all' ? [] : Object.keys(DISABLE).filter((k) => k !== mode);
    for (const k of off) await ctx.addInitScript(DISABLE[k]);
    const aud = await ctx.newPage();
    const errors = watchErrors(aud);
    await aud.goto(fileUrl(html, '?m=question&s=0'));
    await waitReady(aud);
    let pres;
    if (mode === 'postMessage' || mode === 'all') {
      [pres] = await Promise.all([ctx.waitForEvent('page'), aud.keyboard.press('p')]);
    } else {
      pres = await ctx.newPage();
      await pres.goto(fileUrl(html) + '#presenter');
    }
    const perr = watchErrors(pres);
    await pres.waitForSelector('.pz-title', { timeout: 8000 });
    // presenter learns the current state (hello → state)
    const got = await until(async () => (await pres.textContent('.pz-num')).startsWith('03'));
    got ? pass(mode, 'presenter shows the current moment on open') : fail(mode, `presenter shows ${await pres.textContent('.pz-num')}`);
    // audience → presenter
    await aud.evaluate(() => window.__itaf.next());
    const a2p = await until(async () => (await pres.textContent('.pz-steptext')).startsWith('Step 2'));
    a2p ? pass(mode, 'audience → presenter (step change)') : fail(mode, `audience → presenter: "${await pres.textContent('.pz-steptext')}"`);
    // presenter → audience
    await pres.bringToFront();
    await pres.keyboard.press('ArrowRight');
    const p2a = await until(async () => (await aud.evaluate(() => window.__itaf.state().step)) === 2);
    p2a ? pass(mode, 'presenter → audience (→ key)') : fail(mode, `presenter → audience: step ${await aud.evaluate(() => window.__itaf.state().step)}`);
    if (mode === 'all') {
      await pres.keyboard.press('t');
      const timerOn = await until(async () => (await aud.evaluate(() => window.__itaf.audience.timer.running)) === true);
      timerOn ? pass(mode, 'T in presenter starts the audience timer') : fail(mode, 'timer did not start');
      await sleep(1300);
      const el = await pres.textContent('.pz-elapsed');
      el !== '0:00' ? pass(mode, `presenter elapsed ticks (${el})`) : fail(mode, 'presenter elapsed stuck at 0:00');
      await pres.keyboard.type('12');
      await pres.keyboard.press('Enter');
      const jumped = await until(async () => (await aud.evaluate(() => window.__itaf.state().number)) === 12);
      jumped ? pass(mode, 'number + Enter in presenter jumps the audience') : fail(mode, `jump: at ${await aud.evaluate(() => window.__itaf.state().number)}`);
      await pres.keyboard.press('b');
      const black = await until(async () => (await aud.evaluate(() => getComputedStyle(document.querySelector('.curtain')).visibility)) === 'visible');
      black ? pass(mode, 'B in presenter blacks out the audience') : fail(mode, 'blackout did not reach the audience');
      await pres.keyboard.press('b');
      // reload survival
      await pres.reload();
      await pres.waitForSelector('.pz-title');
      const kept = await until(async () => (await pres.textContent('.pz-num')).startsWith('12') && (await pres.textContent('.pz-elapsed')) !== '0:00');
      kept ? pass(mode, 'presenter reload keeps moment and timer') : fail(mode, 'presenter reload lost state');
      await pres.screenshot({ path: path.join(process.env.ITAF_SHOT_DIR || os.tmpdir(), 'presenter.png') }).catch(() => {});
    }
    for (const e of [...errors, ...perr]) fail(mode, e);
    await ctx.close();
  }
}, { timeoutMs: 5 * 60 * 1000 });

let bad = 0;
for (const r of results) {
  if (!r.ok) bad++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.mode.padEnd(12)} ${r.msg}`);
}
console.log(bad ? `sync-check: ${bad} failure(s)` : 'sync-check: PASS');
process.exitCode = bad ? 1 : 0;
