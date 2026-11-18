// Boot (A1). One IIFE bundle: the audience stage by default, the presenter UI at #presenter.
import { gsap } from 'gsap';
import { tokens, icons, components } from 'itaf:design';
import data from 'itaf:data';
import * as assets from 'itaf:assets';
import fonts from 'itaf:fonts';
import buildInfo from 'itaf:build';
import { scenes, placeholder } from 'itaf:scenes';
import './engine/engine.css';
import './presenter/presenter.css';
import { readParams } from './engine/params.js';
import { createStage } from './engine/stage.js';
import { createDirector } from './engine/director.js';
import { createHud } from './engine/hud.js';
import { createOverlays } from './engine/overlays.js';
import { bindKeys } from './engine/keys.js';
import { makeContextFactory } from './engine/context.js';
import staticScene from './engine/static-scene.js';
import { createGLSystem } from './gl/system.js';
import { mountPresenter, attachAudience, isPresenterHash } from './presenter/index.js';

function boot() {
  const params = readParams();
  const allMoments = data.beats.moments;
  const env = { gsap, tokens, icons, components, data, assets, fonts, buildInfo, params };
  window.__itaf = { buildInfo, params, ready: false };
  if (isPresenterHash()) {
    mountPresenter(env);
    return;
  }
  const moments = params.only.length ? allMoments.filter((m) => params.only.includes(m.id)) : allMoments;
  if (!moments.length) throw new Error('no moments to show (check ?only=)');

  const stage = createStage();
  const hud = createHud({ stage, icons, grounds: tokens.grounds, visible: params.hud });

  // WebGL is created lazily, on the first GL scene, and dropped for static frames if it fails.
  let gl = null;
  let glFailed = params.nogl;
  let director = null;
  const getGL = (create = true) => {
    if (gl || glFailed || !create) return gl;
    gl = createGLSystem({
      stage, tokens, params, fonts,
      onFatal: () => {
        glFailed = true;
        gl = null;
        console.warn('[itaf] WebGL lost twice: GL moments now use their static frames');
        if (director) director.dropGL();
      },
    });
    if (!gl) glFailed = true;
    return gl;
  };

  const makeCtx = makeContextFactory({ data, tokens, components, icons, assets, fonts, params, moments });
  director = createDirector({ stage, moments, scenes, placeholder, staticScene, makeCtx, hud, params, tokens, getGL });
  const overlays = createOverlays({ stage, director, tokens, params });
  const audience = params.render ? null : attachAudience(director, { stage, data, tokens });
  if (!params.render) {
    bindKeys({ director, overlays, hud, audience, stage, openPresenter: () => audience.openPresenter() });
  }

  Object.assign(window.__itaf, {
    director,
    audience,
    next: () => director.next(),
    prev: () => director.prev(),
    goto: (m, s = 0, opts) => director.goto(m, s, opts),
    state: () => director.state(),
    settled: () => director.settled(),
    glInfo: () => (gl ? gl.info() : null),
    gsap, // QA tools only (e.g. globalTimeline.timeScale)
  });

  // Start point: ?m=<id|n>&s=<step>.
  let start = 0;
  if (params.m != null) {
    const byId = moments.findIndex((m) => m.id === params.m);
    const n = parseInt(params.m, 10);
    start = byId >= 0 ? byId : Number.isFinite(n) ? Math.max(0, moments.findIndex((m) => m.n === n)) : 0;
  }
  director.show(start, params.s, { instant: true });

  const markReady = () => {
    window.__itaf.ready = true;
    document.documentElement.dataset.ready = '1';
  };
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => {
    if (params.render) {
      director.renderOnce();
      requestAnimationFrame(() => requestAnimationFrame(markReady));
    } else {
      requestAnimationFrame(markReady);
    }
  });
}

try {
  boot();
} catch (err) {
  console.error('[itaf] boot failed:', err);
  document.body.style.cssText = 'background:#05070A;color:#F2F5FA;font:24px/1.4 system-ui;padding:48px';
  document.body.textContent = `Keynote failed to start: ${err && err.message}`;
}
