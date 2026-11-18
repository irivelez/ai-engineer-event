#!/usr/bin/env node
// zoomsim (A2): Zoom-share legibility simulation (GOAL G3).
//  A) Image path, for each PNG: downscale to 1280×720, encode H.264 at 1.2 Mbps (ffmpeg, 2 s still at 30 fps,
//     like a screen-share stream), decode a frame at 1.5 s, upscale to 1920×1080, write <name>-zoom.png
//     (decoded) and <name>-side.png (original | decoded, half size), and report SSIM(original@720, decoded).
//  B) DOM path (--html): for every moment/step in ?render=1, list visible text below 26 stage px, text
//     with contrast below 4.5:1 against its effective background, and text over the GL canvas (needs a
//     scrim or a calm area; checked by eye on the side-by-side).
// Usage: node scripts/zoomsim.mjs <png…> [--out dir]
//        node scripts/zoomsim.mjs --html index.html [--moments a,b] [--json report.json]
// SSIM < 0.93 is flagged for review (heuristic, not a hard gate; small text that turns to mush is the failure).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withBrowser, fileUrl, waitReady } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const pngs = argv.filter((a) => a.endsWith('.png') && !a.endsWith('-zoom.png') && !a.endsWith('-side.png'));
const out = opt('--out', null);
const html = opt('--html', null);
const only = (opt('--moments', '') || '').split(',').filter(Boolean);
const jsonOut = opt('--json', null);
let failures = 0;

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });

// ---------- A) image path ----------
for (const png of pngs) {
  const dir = out ? path.resolve(out) : path.dirname(path.resolve(png));
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, path.basename(png, '.png'));
  const mp4 = `${base}-zoom.mp4`;
  try {
    ff(['-loop', '1', '-framerate', '30', '-t', '2', '-i', png, '-vf', 'scale=1280:720:flags=bicubic,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast',
      '-b:v', '1200k', '-maxrate', '1200k', '-bufsize', '600k', '-g', '60', mp4]);
    ff(['-ss', '1.5', '-i', mp4, '-frames:v', '1', '-vf', 'scale=1920:1080:flags=bicubic', `${base}-zoom.png`]);
    ff(['-i', png, '-i', `${base}-zoom.png`, '-filter_complex', '[0][1]hstack=inputs=2,scale=1920:540', `${base}-side.png`]);
    const r = spawnSync('ffmpeg', ['-hide_banner', '-i', png, '-i', mp4, '-lavfi', '[0]scale=1280:720:flags=bicubic,format=yuv420p[a];[1]trim=start=1.4:end=1.6,setpts=PTS-STARTPTS[b];[a][b]ssim', '-f', 'null', '-'], { encoding: 'utf8' });
    const ssim = `${r.stderr || ''}${r.stdout || ''}`;
    const m = /All:([0-9.]+)/.exec(ssim || '');
    const v = m ? parseFloat(m[1]) : null;
    fs.rmSync(mp4, { force: true });
    const flag = v != null && v < 0.93;
    if (flag) failures++;
    console.log(`${flag ? 'REVIEW' : 'ok    '}  ${path.basename(png)}  SSIM ${v != null ? v.toFixed(3) : '?'}  → ${path.basename(base)}-side.png`);
  } catch (e) {
    failures++;
    console.log(`ERROR   ${path.basename(png)}: ${(e.stderr || e.message || '').toString().slice(0, 200)}`);
  }
}

// ---------- B) DOM path ----------
if (html) {
  const report = [];
  await withBrowser(async (browser) => {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(fileUrl(path.resolve(html), '?render=1'));
    await waitReady(page);
    const moments = await page.evaluate(() => window.__itaf.director.moments.map((m) => ({ id: m.id, n: m.n })));
    for (const m of moments.filter((x) => !only.length || only.includes(x.id))) {
      await page.goto(fileUrl(path.resolve(html), `?render=1&m=${m.id}&s=0`));
      await waitReady(page);
      const steps = await page.evaluate(() => window.__itaf.state().steps);
      for (let s = 0; s < steps; s++) {
        if (s > 0) { await page.goto(fileUrl(path.resolve(html), `?render=1&m=${m.id}&s=${s}`)); await waitReady(page); }
        const issues = await page.evaluate(() => {
          const parse = (c) => { const v = (c.match(/[\d.]+/g) || []).map(Number); return { r: v[0] || 0, g: v[1] || 0, b: v[2] || 0, a: v.length > 3 ? v[3] : 1 }; };
          const lum = ({ r, g, b }) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
          const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
          const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
          const wrapper = document.querySelector(`.moment[data-id="${window.__itaf.state().momentId}"]`);
          const hasGL = !!wrapper.querySelector('canvas');
          const out = [];
          const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT);
          const seen = new Set();
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const t = n.textContent.trim();
            const el = n.parentElement;
            if (!t || !el || seen.has(el)) continue;
            seen.add(el);
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (cs.visibility === 'hidden' || r.width < 1 || r.height < 1) continue;
            let op = 1;
            for (let e = el; e && e !== document.body; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
            if (op < 0.05) continue;
            const size = parseFloat(cs.fontSize);
            // Composite translucent backgrounds from the element outward down to the first opaque one. Between the
            // scene root and its wrapper sits the GL canvas: with no opaque layer above it, the text is over 3D.
            const layers = [];
            let opaque = null;
            for (let e = el; e && e !== wrapper; e = e.parentElement) {
              const c = parse(getComputedStyle(e).backgroundColor);
              if (c.a >= 0.99) { opaque = c; break; }
              if (c.a > 0) layers.push(c);
            }
            const overGL = !opaque && hasGL;
            let under = opaque || parse(getComputedStyle(wrapper).backgroundColor);
            for (let k = layers.length - 1; k >= 0; k--) under = blend(layers[k], under);
            const bg = opaque || layers.length ? under : null;
            const fg = parse(cs.color);
            const fgc = fg.a < 1 ? blend(fg, under) : fg;
            const cr = ratio(fgc, under);
            const text = t.slice(0, 60);
            if (size < 26) out.push({ kind: 'small', size: +size.toFixed(1), text });
            if (cr < 4.5 && !(overGL && !bg)) out.push({ kind: 'contrast', ratio: +cr.toFixed(2), text });
            if (overGL && !bg) out.push({ kind: 'over-gl', text });
          }
          return out;
        });
        report.push({ id: m.id, n: m.n, step: s, issues });
        const hard = issues.filter((i) => i.kind !== 'over-gl');
        if (hard.length) failures++;
        console.log(`${hard.length ? 'FAIL' : 'ok  '}  ${String(m.n).padStart(2, '0')} ${m.id} s${s}${issues.map((i) => `\n      ${i.kind}${i.size ? ` ${i.size}px` : ''}${i.ratio ? ` ${i.ratio}:1` : ''}  "${i.text}"`).join('')}`);
      }
    }
    await ctx.close();
  }, { timeoutMs: 30 * 60 * 1000 });
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 1));
}
if (!pngs.length && !html) console.log('usage: node scripts/zoomsim.mjs <png…> [--out dir] | --html index.html [--moments a,b] [--json out.json]');
process.exitCode = failures ? 1 : 0;
