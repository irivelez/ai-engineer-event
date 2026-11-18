// Shared Playwright helper for the QA scripts (A2).
// - ONE browser at a time across the team (8 GB machine): takes a lock directory first (mkdir is atomic).
//   Lock: $ITAF_BROWSER_LOCK, else <tmpdir>/itaf-browser.lock. Busy → retry every 15 s; older than 15 min → stolen.
// - Browser: $ITAF_CHROME, else the newest Chrome for Testing in the Playwright cache, else Google Chrome.
// - GPU: pass { gpu: true } for ANGLE Metal flags (fps measurements run headed).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function findChrome() {
  if (process.env.ITAF_CHROME) return process.env.ITAF_CHROME;
  const base = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const rel = [
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-linux/chrome',
  ];
  if (fs.existsSync(base)) {
    const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1]);
    for (const d of dirs) for (const r of rel) {
      const p = path.join(base, d, r);
      if (fs.existsSync(p)) return p;
    }
  }
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return fs.existsSync(chrome) ? chrome : undefined;
}

export const lockPath = () => process.env.ITAF_BROWSER_LOCK || path.join(os.tmpdir(), 'itaf-browser.lock');

export async function acquireLock(dir = lockPath()) {
  for (;;) {
    try {
      fs.mkdirSync(dir);
      fs.writeFileSync(path.join(dir, 'owner'), `${process.pid} ${process.argv.slice(1).join(' ')}\n`);
      return () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } };
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      let age = 0;
      try { age = Date.now() - fs.statSync(dir).mtimeMs; } catch { continue; }
      if (age > 15 * 60 * 1000) {
        console.warn(`browser lock ${dir} is ${(age / 60000).toFixed(0)} min old: taking it`);
        fs.rmSync(dir, { recursive: true, force: true });
        continue;
      }
      console.log(`browser lock busy (${dir}); retrying in 15 s`);
      await sleep(15000);
    }
  }
}

export const GPU_ARGS = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'];

// timeoutMs: hard watchdog; on expiry the browser is killed, the lock released and the process exits 2.
export async function withBrowser(fn, { headless = true, gpu = false, args = [], timeoutMs = 10 * 60 * 1000 } = {}) {
  const release = await acquireLock();
  const onSig = () => { release(); process.exit(130); };
  let browserRef = null;
  const watchdog = setTimeout(() => {
    console.error(`browser: watchdog fired after ${Math.round(timeoutMs / 1000)} s; killing the browser and releasing the lock`);
    try { if (browserRef && browserRef.process) browserRef.process().kill('SIGKILL'); } catch { /* ignore */ }
    release();
    process.exit(2);
  }, timeoutMs);
  watchdog.unref();
  process.once('SIGINT', onSig);
  process.once('SIGTERM', onSig);
  let browser = null;
  try {
    browser = await chromium.launch({
      executablePath: findChrome(),
      headless,
      args: [...(gpu ? GPU_ARGS : []), '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', ...args],
    });
    browserRef = browser;
    return await fn(browser);
  } finally {
    clearTimeout(watchdog);
    if (browser) await browser.close().catch(() => {});
    release();
    process.removeListener('SIGINT', onSig);
    process.removeListener('SIGTERM', onSig);
  }
}

export const fileUrl = (p, query = '') => pathToFileURL(path.resolve(p)).href + query;

// Collect console errors, page errors and failed requests of a page.
export function watchErrors(page, { ignore = [] } = {}) {
  const errors = [];
  const skip = (t) => ignore.some((r) => r.test(t));
  page.on('console', (m) => { if (m.type() === 'error' && !skip(m.text())) errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => { if (!skip(String(e))) errors.push(`pageerror: ${e.message}`); });
  page.on('requestfailed', (r) => { if (r.failure() && /ERR_ABORTED/.test(r.failure().errorText)) return; const t = `${r.url().slice(0, 120)} ${r.failure() ? r.failure().errorText : ''}`; if (!skip(t)) errors.push(`requestfailed: ${t}`); });
  return errors;
}

export async function waitReady(page, timeout = 15000) {
  await page.waitForFunction(() => window.__itaf && window.__itaf.ready === true, null, { timeout });
}
export async function waitSettled(page, timeout = 8000) {
  await page.waitForFunction(() => window.__itaf && window.__itaf.settled && window.__itaf.settled(), null, { timeout, polling: 50 });
}
