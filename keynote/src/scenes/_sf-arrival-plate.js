// A full-bleed footage plate for sf-arrival: a local <video> (muted, playsinline, never inlined) over its graded
// end-frame poster (a data URI). Same fallback rules as components/EvidenceVideo.js:
// - Local file first: media/plates/<name>.mp4, resolved against the keynote folder (index.html or a .dev/ build).
//   The .mp4 files are git-ignored; docs/footage-manifest.md lists their sources and licences.
// - The poster is the frame the plate holds at its end. It shows in render mode, after animate:false (back,
//   jumps), when ?plates=poster, and when the file is missing or cannot play. Never before a clip starts.
// - start() returns at once (navigation never waits); the video appears with its first decoded frame.
// - QA: ?plates=poster forces the posters; ?plates=missing points the videos at absent files (the error path).
// const p = createPlate({ src: 'media/plates/x.mp4', poster: dataUri, renderMode }); root.append(p.el); p.start();
import { gsap } from 'gsap';

/** media/… relative to the keynote folder, so dev builds in .dev/ find the same files as index.html. */
export function mediaUrl(rel) {
  try {
    const href = String(window.location.href).split(/[?#]/)[0];
    const i = href.indexOf('/.dev/');
    return (i >= 0 ? href.slice(0, i + 1) : href.slice(0, href.lastIndexOf('/') + 1)) + rel;
  } catch (e) {
    return rel;
  }
}

function forced() {
  try { return new URLSearchParams(window.location.search).get('plates'); } catch (e) { return null; }
}

const FULL = { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', objectFit: 'cover', display: 'block' };

/**
 * @param {object} o
 * @param {string} o.src          media/plates/<name>.mp4 (relative to the keynote folder)
 * @param {string} o.poster       data URI of the end frame
 * @param {boolean} [o.renderMode]
 */
export function createPlate(o = {}) {
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', overflow: 'hidden' });
  const inner = document.createElement('div'); // what a push scales
  Object.assign(inner.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', willChange: 'transform' });
  el.append(inner);
  const img = document.createElement('img');
  img.alt = '';
  img.draggable = false;
  img.decoding = 'async';
  if (o.poster) img.src = o.poster;
  Object.assign(img.style, FULL);
  inner.append(img);

  const force = forced();
  let mode = o.renderMode || force === 'poster' || !o.src ? 'poster' : 'video';
  let state = 'idle'; // idle | playing | held
  let video = null;
  let watchdog = null;

  const showPoster = (on, dur = 0) => gsap.to(img, { autoAlpha: on ? 1 : 0, duration: dur, overwrite: true });
  const showVideo = (on, dur = 0) => { if (video) gsap.to(video, { autoAlpha: on ? 1 : 0, duration: dur, overwrite: true }); };

  function onError() {
    if (!video) return;
    const was = state;
    if (watchdog) { watchdog.kill(); watchdog = null; }
    video.removeEventListener('error', onError);
    video.removeEventListener('ended', onEnded);
    try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) { /* ignore */ }
    gsap.killTweensOf(video);
    video.remove();
    video = null;
    mode = 'poster';
    if (was !== 'idle') { state = 'held'; showPoster(true, 0.4); }
  }
  function onEnded() {
    if (state !== 'playing') return;
    state = 'held'; // the element keeps its last frame, which is the poster frame
    if (watchdog) { watchdog.kill(); watchdog = null; }
  }
  function reveal() {
    if (!video || state !== 'playing') return;
    showVideo(true, 0.2);
    showPoster(false);
  }

  if (mode === 'video') {
    video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.preload = 'auto';
    video.controls = false;
    video.disablePictureInPicture = true;
    Object.assign(video.style, FULL);
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded);
    video.src = mediaUrl(force === 'missing' ? o.src.replace(/\.mp4$/, '-missing.mp4') : o.src);
    inner.append(video);
    gsap.set(video, { autoAlpha: 0 });
    gsap.set(img, { autoAlpha: 0 });
  } else {
    gsap.set(img, { autoAlpha: 1 });
  }

  return {
    el,
    inner,
    get mode() { return mode; },
    get state() { return state; },
    get video() { return video; },
    /** Play from the first frame. The poster stays hidden: the void shows until the first frame is ready. */
    start() {
      if (mode !== 'video' || !video) { state = 'held'; showPoster(true); return; }
      if (watchdog) { watchdog.kill(); watchdog = null; }
      state = 'playing';
      showPoster(false);
      const v = video;
      const fresh = v.currentTime < 0.01; // a replay seeks back first: wait for its first frame
      if (!fresh) { showVideo(false); try { v.currentTime = 0; } catch (e) { /* ignore */ } }
      const p = v.play();
      if (p && p.catch) p.catch((err) => { if (video === v && state === 'playing' && (!err || err.name !== 'AbortError')) onError(); });
      if (fresh && v.readyState >= 2) reveal();
      else v.addEventListener('playing', reveal, { once: true });
      // A missing codec or a stalled decoder: fall back to the poster after 4 s.
      watchdog = gsap.delayedCall(4, () => {
        watchdog = null;
        if (video === v && state === 'playing' && v.currentTime < 0.05) onError();
      });
    },
    /** The exact held state: the end frame, nothing playing (render mode, back, jumps). */
    settle() {
      if (watchdog) { watchdog.kill(); watchdog = null; }
      if (video) { try { video.pause(); } catch (e) { /* ignore */ } }
      showVideo(false);
      showPoster(true);
      state = 'held';
    },
    /** Freeze where it is (the layer is covered or the moment is leaving). */
    pause() {
      if (watchdog) { watchdog.kill(); watchdog = null; }
      if (video && state === 'playing') { try { video.pause(); } catch (e) { /* ignore */ } state = 'held'; }
    },
    destroy() {
      if (watchdog) { watchdog.kill(); watchdog = null; }
      gsap.killTweensOf([img, inner]);
      if (video) {
        gsap.killTweensOf(video);
        video.removeEventListener('error', onError);
        video.removeEventListener('ended', onEnded);
        try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) { /* ignore */ }
      }
      el.remove();
    },
  };
}
