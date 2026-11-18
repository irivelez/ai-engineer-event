// Opener (A1): the 66 s film full-bleed with sound.
// - Pure black until the first → (browsers allow sound only after a user gesture). That press starts the film;
//   the next press advances to the title.
// - Holds the film's last frame (white "Inside the AI Frontier" on #000).
// - If media/opener-1080p.mp4 is missing or cannot play (e.g. Chromium without H.264), a 20 s typographic
//   speed sequence built from this keynote's own copy plays instead and lands on the same title frame:
//   ink box x 584–1341, baseline y 570 (measured from the film's last frame).
// - Render mode and back-navigation show the held last frame. ?novideo=1 forces the fallback (QA).
import { gsap } from 'gsap';
import { fitFilmTitle } from '../engine/title-fit.js';

const FILM = 'media/opener-1080p.mp4';
const SVGNS = 'http://www.w3.org/2000/svg';

// Strings for the fallback sequence, taken from other moments' copy (no hardcoded visible text).
function collectWords(beats) {
  const out = [];
  const byId = Object.fromEntries((beats || []).map((m) => [m.id, m.copy || {}]));
  for (const m of beats || []) {
    const labs = m.copy && Array.isArray(m.copy.labs) ? m.copy.labs : [];
    for (const l of labs) {
      if (l && l.model) out.push({ text: l.model, kind: 'sans' });
      if (l && l.date) out.push({ text: l.date, kind: 'mono' });
    }
  }
  const rp = byId['release-pace'] || {};
  if (rp.window) out.push({ text: rp.window, kind: 'mono' });
  const yw = byId['year-in-weeks'] || {};
  if (yw.eci && yw.eci.dates) out.push({ text: yw.eci.dates, kind: 'mono' });
  if (yw.aa && yw.aa.dates) out.push({ text: yw.aa.dates, kind: 'mono' });
  if (rp.total && rp.totalLabel) out.push({ text: `${rp.total} ${rp.totalLabel}`, kind: 'sans' });
  // de-duplicate, keep order
  const seen = new Set();
  return out.filter((w) => !seen.has(w.text) && seen.add(w.text));
}

export default {
  id: 'opener',
  gl: false,
  create(ctx) {
    const { root, copy, tokens, params } = ctx;
    const fam = (tokens.type && tokens.type.families) || {};
    const sans = fam.sans || "'Helvetica Neue', Arial, sans-serif";
    const mono = fam.mono || 'ui-monospace, Menlo, monospace';
    const titleText = copy.fallbackTitle || '';
    Object.assign(root.style, { background: '#000000', overflow: 'hidden' });

    // ----- film -----
    const video = document.createElement('video');
    Object.assign(video.style, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', objectFit: 'cover', background: '#000', opacity: '0' });
    video.preload = 'auto';
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.controls = false;
    let videoError = !!params.novideo || !!ctx.renderMode;
    if (!videoError) {
      video.addEventListener('error', () => {
        videoError = true;
        if (state === 'playing') startFallback();
      });
      video.src = FILM;
    }
    root.appendChild(video);

    // ----- fallback layers -----
    const word = document.createElement('div');
    Object.assign(word.style, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', whiteSpace: 'nowrap', opacity: '0' });
    root.appendChild(word);

    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1920 1080');
    svg.setAttribute('width', '1920');
    svg.setAttribute('height', '1080');
    Object.assign(svg.style, { position: 'absolute', left: '0', top: '0', opacity: '0' });
    const text = document.createElementNS(SVGNS, 'text');
    text.setAttribute('fill', '#FFFFFF');
    text.setAttribute('font-weight', '600');
    text.style.fontFamily = sans;
    text.style.fontKerning = 'normal';
    text.textContent = titleText;
    svg.appendChild(text);
    root.appendChild(svg);

    // Fit the title's ink box to the film's measured box (height → size, width → tracking).
    const fitTitle = () => fitFilmTitle(text, { family: sans, weight: 600 });
    fitTitle();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);

    // ----- state -----
    let state = 'idle'; // idle | playing | fallback | held
    let seq = null;
    let watchdog = null;

    function showTitleFrame() {
      gsap.set(video, { opacity: 0 });
      gsap.set(word, { opacity: 0 });
      fitTitle();
      gsap.set(svg, { opacity: 1 });
    }
    function holdLastFrame() {
      state = 'held';
      if (!videoError && video.readyState >= 1 && Number.isFinite(video.duration)) {
        video.pause();
        video.currentTime = Math.max(0, video.duration - 0.04);
        gsap.set(video, { opacity: 1 });
        gsap.set([svg, word], { opacity: 0 });
      } else showTitleFrame();
    }
    function idle() {
      state = 'idle';
      gsap.set([video, word, svg], { opacity: 0 });
    }

    function buildSequence() {
      const words = collectWords(ctx.beats);
      const tl = gsap.timeline({ paused: true });
      if (!words.length) {
        tl.to(svg, { opacity: 1, duration: 1.2, ease: 'power1.inOut' }, 0.8);
        return tl;
      }
      // Speed ramp: each word holds 7% less than the last (1.0 s → 0.16 s floor at ≈ 12 s; never faster: Zoom-safe).
      let t = 0.6;
      let d = 1.0;
      let i = 0;
      while (t < 16.6) {
        const w = words[i % words.length];
        const size = w.kind === 'mono' ? 84 : 112;
        const drift = i % 2 ? 18 : -18;
        tl.call(() => {
          word.textContent = w.text;
          word.style.font = `${w.kind === 'mono' ? 500 : 600} ${size}px/1 ${w.kind === 'mono' ? mono : sans}`;
          word.style.letterSpacing = w.kind === 'mono' ? '0.02em' : '-0.03em';
        }, null, t);
        tl.fromTo(word, { opacity: 1, x: -drift }, { x: drift, duration: d, ease: 'none', immediateRender: false }, t);
        t += d;
        d = Math.max(0.16, d * 0.93);
        i += 1;
      }
      tl.set(word, { opacity: 0 }, t);
      tl.to(svg, { opacity: 1, duration: 0.9, ease: 'power1.inOut' }, t + 0.5); // lands ≈ 18 s, holds
      tl.set({}, {}, 20);
      return tl;
    }

    function startFallback() {
      if (watchdog) { watchdog.kill(); watchdog = null; }
      try { video.pause(); } catch { /* ignore */ }
      gsap.set(video, { opacity: 0 });
      state = 'fallback';
      if (seq) seq.kill();
      seq = buildSequence();
      seq.eventCallback('onComplete', () => { state = 'held'; });
      seq.play(0);
    }

    function startFilm() {
      if (videoError || !video.src) return startFallback();
      state = 'playing';
      video.muted = !!params.auto; // the animatic records without a gesture: muted autoplay is allowed
      video.volume = 1;
      try { video.currentTime = 0; } catch { /* ignore */ }
      const reveal = () => gsap.set(video, { opacity: 1 });
      video.addEventListener('playing', reveal, { once: true });
      const p = video.play();
      if (p && p.catch) {
        p.catch((err) => {
          if (err && err.name === 'NotAllowedError' && !video.muted) {
            video.muted = true;
            video.play().catch(() => startFallback());
          } else startFallback();
        });
      }
      // If the film has not started within 3 s (stalled decoder, missing codec), switch to the fallback.
      watchdog = gsap.delayedCall(3, () => {
        watchdog = null;
        if (state === 'playing' && (video.paused || video.currentTime === 0)) startFallback();
      });
      video.addEventListener('ended', () => { if (state === 'playing') state = 'held'; }, { once: true });
    }

    return {
      steps: 1,
      background: '#000000',
      enter({ direction } = {}) {
        if (ctx.renderMode) showTitleFrame();
        else if (direction < 0) holdLastFrame();
        else idle();
        return null;
      },
      goto(step, { animate } = {}) {
        if (ctx.renderMode) showTitleFrame();
        else if (state === 'held' && !animate) holdLastFrame();
        return null;
      },
      intercept(dir) {
        if (dir === 'next' && state === 'idle') {
          startFilm();
          return true;
        }
        return false;
      },
      exit() {
        if (watchdog) { watchdog.kill(); watchdog = null; }
        if (seq) seq.pause();
        const tl = gsap.timeline();
        if (!video.paused) {
          tl.to(video, { volume: 0, duration: 0.6, ease: 'power1.in' }, 0);
          tl.call(() => video.pause(), null, 0.6);
        }
        if (state === 'playing' || state === 'fallback') state = 'held';
        return tl;
      },
      update() {},
      world: null,
      get state() { return state; },
      dispose() {
        if (watchdog) watchdog.kill();
        if (seq) seq.kill();
        gsap.killTweensOf([video, word, svg]);
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch { /* ignore */ }
        root.replaceChildren();
      },
    };
  },
};
