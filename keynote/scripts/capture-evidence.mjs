// Evidence page captures: crop the passage, chart or table that carries a claim, from the source page itself.
// Usage: node scripts/capture-evidence.mjs <jobs.json> [--probe] [--only name1,name2]
//   --probe  dumps each page's visible text to .dev/shots/<name>.txt (to pick exact anchors), no image.
// Method: one headless Chrome for Testing (no profile, no login, no paywall bypass); cookie banners rejected, never
// accepted; a notice with no reject option is hidden locally for the screenshot only. Nothing on the page is edited.
// Job: { name, url, anchor, up?, from?, to?, col?, pad?, width?, dsf?, wait?, hide?[], maxH? }
//   anchor/from/to: text that must appear on the page; up: CSS selector the crop grows to (closest ancestor);
//   col: CSS selector whose left/right edges set the crop width (e.g. 'article').
// Output: media/evidence/<name>.webp (≤1600 px wide, quality 88) + .dev/shots/evidence-log.json (verbatim text).
// Env: ITAF_PROXY=http://127.0.0.1:18080 routes Chrome through a local proxy (used when the system DNS is down).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { withBrowser, sleep } from './lib/browser.mjs';

const [jobsFile, ...rest] = process.argv.slice(2);
const probe = rest.includes('--probe');
const oi = rest.indexOf('--only');
const only = oi >= 0 ? rest[oi + 1].split(',') : null;
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8')).filter((j) => !only || only.includes(j.name));
const OUT = 'media/evidence';
const TMP = '.dev/shots';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
const logFile = path.join(TMP, 'evidence-log.json');
const log = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, 'utf8')) : {};
// ITAF_EXTRA_ARGS: e.g. "--single-process" with ITAF_CHROME=<chrome-headless-shell> where Chrome's Mach rendezvous fails.
const args = [...(process.env.ITAF_PROXY ? [`--proxy-server=${process.env.ITAF_PROXY}`] : []), ...(process.env.ITAF_EXTRA_ARGS || '').split(' ').filter(Boolean)];
const REJECT = '^(reject|reject all|reject all cookies|reject cookies|decline|decline all|deny|deny all|refuse|refuse all|only necessary|necessary only|only essential|essential only|use necessary cookies only|accept only essential cookies|accept necessary cookies only|reject non-essential|reject optional cookies|continue without accepting|manage preferences: reject all)$';

async function rejectCookies(page) {
  for (const sel of ['#onetrust-reject-all-handler', '#CybotCookiebotDialogBodyButtonDecline', 'button[data-testid="uc-deny-all-button"]', '.cky-btn-reject', '#truste-consent-required']) {
    const b = await page.$(sel);
    if (b && (await b.isVisible().catch(() => false))) { await b.click().catch(() => {}); await sleep(700); return `rejected ${sel}`; }
  }
  const t = await page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const els = [...document.querySelectorAll('button, a[role=button], [role=button], input[type=button]')];
    const b = els.find((e) => re.test((e.innerText || e.value || '').replace(/\s+/g, ' ').trim()) && e.offsetParent !== null);
    if (b) { b.click(); return (b.innerText || b.value).trim(); }
    return null;
  }, REJECT).catch(() => null);
  if (t) { await sleep(700); return `rejected "${t}"`; }
  return 'no banner or no reject option';
}

async function locate(page, job) {
  return page.evaluate((job) => {
    const norm = (s) => (s || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―−]/g, '-').replace(/ /g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const all = [...document.body.querySelectorAll('*')].filter((e) => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(e.tagName));
    const find = (needle) => {
      const n = norm(needle);
      let best = null;
      for (const e of all) {
        const t = norm(e.textContent);
        if (t.includes(n) && (!best || t.length < norm(best.textContent).length)) {
          const r = e.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) best = e;
        }
      }
      return best;
    };
    const grow = (e) => (job.up && e.closest(job.up)) || e;
    const a = find(job.anchor);
    if (!a) return { error: `anchor not found: ${job.anchor}` };
    const els = [grow(a)];
    if (job.from) { const f = find(job.from); if (!f) return { error: `from not found: ${job.from}` }; els.push(grow(f)); }
    if (job.to) { const t = find(job.to); if (!t) return { error: `to not found: ${job.to}` }; els.push(grow(t)); }
    els[0].scrollIntoView({ block: 'center' });
    const rs = els.map((e) => e.getBoundingClientRect());
    let left = Math.min(...rs.map((r) => r.left));
    let right = Math.max(...rs.map((r) => r.right));
    if (job.col) { const c = a.closest(job.col) || document.querySelector(job.col); if (c) { const cr = c.getBoundingClientRect(); left = cr.left; right = cr.right; } }
    const top = Math.min(...rs.map((r) => r.top)) + window.scrollY;
    const bottom = Math.max(...rs.map((r) => r.bottom)) + window.scrollY;
    const text = els.map((e) => (e.innerText ?? e.textContent ?? "").trim()).filter((v, i, s) => s.indexOf(v) === i).join('\n\n');
    return { left: left + window.scrollX, right: right + window.scrollX, top, bottom, text, pageH: document.documentElement.scrollHeight };
  }, job);
}

await withBrowser(async (browser) => {
  // One context and one page for the whole batch: in --single-process mode, closing a context ends the browser.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, locale: 'en-US', timezoneId: 'America/Bogota' });
  const page = await ctx.newPage();
  for (let job of jobs) {
    const t0 = Date.now();
    try {
      await page.setViewportSize({ width: job.width || 1280, height: 900 });
      const res = await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
      await sleep(job.wait || 1500);
      const cookie = await rejectCookies(page);
      if (job.hide) await page.addStyleTag({ content: `${job.hide.join(',')}{display:none!important}` });
      if (probe) {
        const text = await page.evaluate(() => document.body.innerText);
        fs.writeFileSync(path.join(TMP, `${job.name}.txt`), `${res && res.status()} ${page.url()}\n${await page.title()}\n\n${text}`);
        console.log(`probe ${job.name}: ${res && res.status()} ${text.length} chars (${cookie}) ${Date.now() - t0} ms`);
        continue;
      }
      if (job.top) { // masthead crop: the top of the page as a reader first sees it (title, byline, date)
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(500);
        job = { ...job };
      }
      let r = job.top ? { left: 0, right: job.width || 1280, top: job.topY || 0, bottom: (job.topY || 0) + job.top, text: await page.evaluate(() => document.body.innerText.slice(0, 600)) } : await locate(page, job);
      if (r.error) { console.log(`FAIL ${job.name}: ${r.error}`); log[job.name] = { url: job.url, error: r.error }; continue; }
      if (!job.top && !job.keepSticky) { // sticky or fixed bars (site nav, banners) would sit on top of a mid-page crop: hide them locally
        await page.evaluate(() => { for (const e of document.querySelectorAll('body *')) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') e.style.setProperty('visibility', 'hidden', 'important'); } });
      }
      await sleep(900); // lazy images after scrollIntoView
      if (!job.top) r = await locate(page, job);
      const pad = job.top ? 0 : (job.pad ?? 24);
      const x = Math.max(0, Math.floor(r.left - pad));
      const y = Math.max(0, Math.floor(r.top - pad));
      const w = Math.ceil(r.right - r.left + 2 * pad);
      const h = Math.min(Math.ceil(r.bottom - r.top + 2 * pad), job.maxH || 2400);
      const png = path.join(TMP, `${job.name}.png`);
      await page.screenshot({ path: png, fullPage: true, clip: { x, y, width: w, height: h } });
      const webp = path.join(OUT, `${job.name}.webp`);
      execFileSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("RGB")\nif im.width>1600: im=im.resize((1600, round(im.height*1600/im.width)), Image.LANCZOS)\nim.save(sys.argv[2], "WEBP", quality=88, method=6)\nprint(im.width, im.height)', png, webp]);
      const dims = execFileSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]); print(im.width, im.height)', webp]).toString().trim();
      log[job.name] = { url: job.url, finalUrl: page.url(), status: res && res.status(), file: webp, dims, cookie, text: r.text, capturedAt: new Date().toISOString() };
      console.log(`ok ${job.name}: ${dims} (${cookie}) ${Date.now() - t0} ms`);
    } catch (e) {
      console.log(`FAIL ${job.name}: ${e.message.split('\n')[0]}`);
      log[job.name] = { url: job.url, error: e.message.split('\n')[0] };
    } finally {
      fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
    }
  }
}, { args, timeoutMs: 15 * 60 * 1000 });
