// EvidenceVideo: a real clip as evidence, in a framed card (variant 'void' | 'paper') or full-bleed ('bleed').
// - Local file first: <video src="media/evidence/<id>.mp4">, a relative path like the opener film (never
//   inlined; the .mp4 files are git-ignored). The poster is a data URI (ctx.assets.evidence(id).posterSrc).
// - Starts when it is shown with animation (in(), or set({ visible: true }) while animating), plays once and
//   holds the frame at item.end (or loops with { loop: true }). Muted by default.
// - M toggles sound for the playing clip: engine/keys.js dispatches 'itaf:evidence-sound'; a speaker mark
//   shows in the frame while sound is on. Leaving the clip mutes again.
// - Captions from item.captions [{ start, end, text }] overlay the frame while it plays, when item.speech.
// - Missing or unplayable file: on http(s) a youtube-nocookie embed with start/end (muted, no pointer events, so
//   clicks and keys stay with the stage); on file:// the poster and the link stay.
// - Render mode, back-navigation and jumps (animate:false): the poster, which is the frame at item.end.
// - Navigation never waits for the clip: in() is a short reveal and playback runs on its own, so → always advances.
// ?evidence=poster forces the poster, ?evidence=youtube the embed (QA).
// EvidenceVideo.create({ item: ctx.assets.evidence('swarm-fable-os'), kind: 'labReported', width: 960, qr: true })
import { gsap, motion, root, esc, play, kill, withVisible, isRender } from './_core.js';
import { metaHTML, protocol, forcedMode } from './_evidence.js';

// ---------- sound, shared by every evidence clip ----------
let soundOn = false;
const active = new Set();
let bound = false;
function bindSound() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('itaf:evidence-sound', () => {
    if (!active.size) return; // only the clip that is playing: an early press never unmutes the next clip
    soundOn = !soundOn;
    active.forEach((p) => p.applySound());
  });
}
/** For the presenter/tests: whether evidence sound is on. */
export const evidenceSound = { get on() { return soundOn; } };

const SPEAKER = '<svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M3.5 9h4l5-4v14l-5-4h-4z" fill="currentColor"/>' +
  '<path d="M15.5 8.6c1.1 1 1.7 2.1 1.7 3.4s-.6 2.4-1.7 3.4M18.2 6c1.9 1.6 2.9 3.6 2.9 6s-1 4.4-2.9 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

/**
 * @param {object} o
 * @param {object} o.item               evidence item (ctx.assets.evidence(id)): file, posterSrc, url, youtubeId, start, end,
 *                                      publisher, title, date, disclaimer, speech, captions
 * @param {'void'|'paper'|'bleed'} [o.variant]   default from o.ground
 * @param {number} [o.width=960]        frame width in stage px (16:9); bleed is 1920 × 1080
 * @param {boolean} [o.loop=false]
 * @param {string} [o.kind]             provenance chip kind for the meta line (e.g. 'labReported')
 * @param {boolean} [o.meta=true]       meta block under the frame (chip, publisher · date, title, disclaimer, link)
 * @param {boolean} [o.qr=false]        SourceQR to item.url inside the meta block; o.qrSize target px (default 222)
 * @param {boolean} [o.title, o.link]   hide parts of the meta block with false
 */
export function create(o = {}) {
  bindSound();
  const item = o.item || {};
  const variant = o.variant || (o.ground === 'paper' ? 'paper' : 'void');
  const bleed = variant === 'bleed';
  const W = bleed ? 1920 : o.width || 960;
  const H = bleed ? 1080 : Math.round((W * 9) / 16);
  const start = Math.max(0, Number(item.start) || 0);
  const end = Number.isFinite(Number(item.end)) && Number(item.end) > start ? Number(item.end) : null;
  const loop = !!o.loop;
  const posterSrc = o.poster || item.posterSrc || '';
  const file = o.src || item.file || '';
  const captions = item.speech && Array.isArray(item.captions) ? item.captions : [];
  const ground = o.ground || (variant === 'paper' ? 'paper' : 'void');

  const el = root(`itaf-ev itaf-evvideo v-${variant}`, { ...o, ground, tag: 'figure', width: W });
  const meta = o.meta === false ? { html: '', qr: null } : metaHTML(item, { kind: o.kind, qr: o.qr, qrSize: o.qrSize, ec: o.ec, title: o.title, link: o.link });
  el.innerHTML = `<div class="ev-frame" style="width:${W}px;height:${H}px">` +
    (posterSrc ? `<img class="ev-poster" alt="${esc(item.title || '')}" src="${posterSrc}" draggable="false">` : '') +
    `<div class="ev-captions t-body"></div><div class="ev-sound">${SPEAKER}</div></div>${meta.html}`;
  const frame = el.querySelector('.ev-frame');
  const soundEl = el.querySelector('.ev-sound');
  const capEl = el.querySelector('.ev-captions');
  const metaEl = el.querySelector('.ev-meta');
  const posterEl = el.querySelector('.ev-poster');
  gsap.set([soundEl, capEl], { autoAlpha: 0 });
  // The poster is the frame at item.end: it shows when settled or when nothing can play, never before a clip starts.
  const showPoster = (on, dur = 0) => { if (posterEl) gsap.to(posterEl, { autoAlpha: on ? 1 : 0, duration: dur, overwrite: true }); };

  // ---------- source: local file → YouTube (web) → poster ----------
  const proto = protocol();
  const web = proto === 'http:' || proto === 'https:';
  const forced = forcedMode();
  const fallbackMode = () => (web && item.youtubeId && forced !== 'poster' ? 'youtube' : 'poster');
  let mode = 'local';
  if (isRender() || forced === 'poster') mode = 'poster';
  else if (forced === 'youtube' || !file) mode = fallbackMode();

  let video = null;
  let state = 'idle'; // idle | playing | held
  let watchdog = null;
  let ticking = false;
  let iframe = null;
  let ytDone = null;

  function onError() {
    if (!video) return;
    const wasPlaying = state === 'playing';
    stopTick();
    if (watchdog) { watchdog.kill(); watchdog = null; }
    video.removeEventListener('error', onError);
    video.removeEventListener('ended', onEnded);
    try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) { /* ignore */ }
    video.remove();
    video = null;
    mode = fallbackMode();
    state = 'idle';
    if (wasPlaying) startPlayback();
    else if (mode === 'poster') showPoster(true, 0.3);
  }
  function onEnded() {
    if (state !== 'playing' || !video) return;
    if (loop) { try { video.currentTime = start; } catch (e) { /* ignore */ } video.play().catch(() => {}); } else hold();
  }
  if (mode === 'local') {
    video = document.createElement('video');
    video.className = 'ev-video';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.preload = 'auto';
    video.controls = false;
    video.disablePictureInPicture = true;
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded);
    // Chrome pauses a clip that is unmuted without user activation in this window: go back to muted and play on.
    video.addEventListener('pause', () => {
      if (state !== 'playing' || !video || video.ended || video.muted) return;
      soundOn = false;
      video.muted = true;
      video.play().catch(() => {});
      applySound();
    });
    video.src = file;
    frame.insertBefore(video, capEl);
    gsap.set(video, { autoAlpha: 0 });
  }

  function setCaption(t) {
    if (!captions.length) return;
    const c = t == null ? null : captions.find((x) => t >= Number(x.start) && t < Number(x.end));
    const text = c ? String(c.text || '') : '';
    if (capEl.textContent !== text) capEl.textContent = text;
    gsap.set(capEl, { autoAlpha: text ? 1 : 0 });
  }
  function tick() {
    if (!video || state !== 'playing') return;
    const t = video.currentTime;
    if (end != null && t >= end - 0.02) {
      if (loop) { try { video.currentTime = start; } catch (e) { /* ignore */ } } else { hold(); return; }
    }
    setCaption(t);
  }
  function startTick() { if (!ticking) { gsap.ticker.add(tick); ticking = true; } }
  function stopTick() { if (ticking) { gsap.ticker.remove(tick); ticking = false; } }

  function applySound() {
    const playing = state === 'playing';
    if (video) video.muted = !soundOn;
    if (iframe && iframe.contentWindow) {
      try { iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: soundOn ? 'unMute' : 'mute', args: [] }), '*'); } catch (e) { /* ignore */ }
    }
    gsap.to(soundEl, { autoAlpha: soundOn && playing ? 1 : 0, duration: 0.2, overwrite: true });
  }

  function release() {
    active.delete(api);
    if (!active.size) soundOn = false;
    applySound();
  }

  function hold() {
    state = 'held';
    stopTick();
    if (watchdog) { watchdog.kill(); watchdog = null; }
    if (video) {
      try { video.pause(); if (end != null) video.currentTime = end; } catch (e) { /* ignore */ }
    }
    setCaption(null);
    release();
  }

  function startYouTube() {
    const q = new URLSearchParams({ autoplay: '1', mute: '1', controls: '0', rel: '0', playsinline: '1', modestbranding: '1', iv_load_policy: '3', disablekb: '1', fs: '0', enablejsapi: '1', start: String(Math.floor(start)) });
    if (end != null) q.set('end', String(Math.ceil(end)));
    if (loop) { q.set('loop', '1'); q.set('playlist', item.youtubeId); }
    iframe = document.createElement('iframe');
    iframe.className = 'ev-yt';
    iframe.title = item.title || '';
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.tabIndex = -1;
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.youtubeId)}?${q}`;
    gsap.set(iframe, { autoAlpha: 0 });
    const f = iframe;
    iframe.addEventListener('load', () => {
      if (iframe !== f) return;
      gsap.to(f, { autoAlpha: 1, duration: 0.4, delay: 0.5 });
      applySound();
      // YouTube shows its end screen after `end`: fade back to the poster (the same frame) when the clip is over.
      if (!loop && end != null) ytDone = gsap.delayedCall(end - start + 1.5, () => { ytDone = null; if (iframe === f) gsap.to(f, { autoAlpha: 0, duration: 0.5 }); showPoster(true, 0.5); hold(); });
    }, { once: true });
    frame.insertBefore(iframe, capEl);
  }

  function startPlayback() {
    if (state === 'playing') return;
    if (mode === 'poster') { state = 'held'; showPoster(true, 0.3); return; }
    state = 'playing';
    active.add(api);
    if (mode === 'youtube') { startYouTube(); applySound(); return; }
    try { video.currentTime = start; } catch (e) { /* ignore */ }
    video.muted = !soundOn;
    video.addEventListener('playing', () => { if (video && state === 'playing') gsap.to(video, { autoAlpha: 1, duration: 0.25, overwrite: true }); }, { once: true });
    const v = video;
    const p = v.play();
    if (p && p.catch) {
      p.catch((err) => {
        if (state !== 'playing' || video !== v) return; // stopped meanwhile (pause() rejects play() with AbortError)
        if (err && err.name === 'NotAllowedError' && !v.muted) { v.muted = true; v.play().catch(() => onError()); } else if (!err || err.name !== 'AbortError') onError();
      });
    }
    startTick();
    // A stalled decoder or a missing codec: fall back after 4 s.
    watchdog = gsap.delayedCall(4, () => {
      watchdog = null;
      if (state === 'playing' && video === v && v.currentTime <= start + 0.01) onError();
    });
    applySound();
  }

  function stopPlayback() {
    if (watchdog) { watchdog.kill(); watchdog = null; }
    if (ytDone) { ytDone.kill(); ytDone = null; }
    stopTick();
    if (video) { try { video.pause(); } catch (e) { /* ignore */ } gsap.killTweensOf(video); gsap.set(video, { autoAlpha: 0 }); }
    if (iframe) { gsap.killTweensOf(iframe); iframe.remove(); iframe = null; }
    setCaption(null);
    state = 'idle';
    release();
  }

  const settle = () => {
    kill(el, metaEl);
    stopPlayback();
    showPoster(true);
    gsap.set(el, { autoAlpha: 1, y: 0 });
    if (metaEl) gsap.set(metaEl, { autoAlpha: 1, y: 0 });
  };

  const api = {
    el,
    frame,
    get video() { return video; },
    get state() { return state; },
    get mode() { return mode; },
    qr: meta.qr,
    applySound,
    play() { startPlayback(); },
    stop() { stopPlayback(); },
    /** Freeze the current frame (e.g. when the moment exits): no empty card under a transition. */
    pause() {
      if (state !== 'playing') return;
      state = 'held';
      if (watchdog) { watchdog.kill(); watchdog = null; }
      if (ytDone) { ytDone.kill(); ytDone = null; }
      stopTick();
      if (video) { try { video.pause(); } catch (e) { /* ignore */ } }
      if (iframe && iframe.contentWindow) { try { iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*'); } catch (e) { /* ignore */ } }
      setCaption(null);
      release();
    },
    in(tl, at) {
      return play(tl, at, (sub) => {
        kill(el, metaEl);
        stopPlayback();
        showPoster(mode === 'poster');
        sub.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease }, 0);
        if (metaEl) sub.fromTo(metaEl, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0.45);
        sub.call(startPlayback, null, 0.3);
      }, settle);
    },
    out(tl, at) {
      return play(tl, at, (sub) => {
        sub.call(stopPlayback, null, 0);
        sub.to(el, { autoAlpha: 0, y: -16, duration: motion.calmOut.dur, ease: motion.calmOut.ease }, 0);
      }, () => { stopPlayback(); gsap.set(el, { autoAlpha: 0 }); });
    },
    set() { return gsap.timeline(); },
    destroy() {
      stopPlayback();
      kill(el, metaEl, soundEl, capEl);
      if (video) {
        video.removeEventListener('error', onError);
        video.removeEventListener('ended', onEnded);
        try { video.removeAttribute('src'); video.load(); } catch (e) { /* ignore */ }
      }
      el.remove();
    },
  };
  gsap.set(el, { autoAlpha: 0 });
  const out = withVisible(api, settle);
  // set({ visible: false }, { animate: false }) only hides: stop the clip too.
  const baseSet = out.set;
  out.set = (s = {}, opt = {}) => {
    if (s.visible === false) stopPlayback();
    return baseSet(s, opt);
  };
  return out;
}

export default { create };
