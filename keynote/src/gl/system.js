// The one WebGL renderer for the whole keynote (A1).
// - Created lazily by the first GL scene; returns null if WebGL is unavailable (GL moments then show static frames).
// - Postprocessing chain (pmndrs/postprocessing 6.39): RenderPass → EffectPass(Bloom mipmap, Vignette, AgX tone
//   mapping) → EffectPass(SMAA on the tone-mapped image, then a 1-LSB display-space dither). Renderer tone mapping stays NoToneMapping and frame
//   buffers are HalfFloat, as the postprocessing README requires.
// - The canvas is 1920×1080 stage px inside the scaled stage (pixel-aligned with the DOM); its drawing buffer is
//   stage scale × pixelRatio, pixelRatio = min(devicePixelRatio, 1.5), dropping to 1.0 when p95 frame time
//   > 18 ms for 2 s.
// - Renders only when the director asks (a GL moment is visible and the tab is not hidden).
import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, VignetteEffect, ToneMappingEffect, ToneMappingMode, SMAAEffect, SMAAPreset, Effect, BlendFunction, DepthOfFieldEffect, NoiseEffect } from 'postprocessing';
import { makeWorldFactory } from './world.js';
import * as helpers from './helpers.js';

// 1-LSB ordered dither (interleaved gradient noise) applied in display space: kills banding in large dark
// gradients without visible grain (Zoom-safe). Runs last, after SMAA.
class DitherEffect extends Effect {
  constructor() {
    super('DitherEffect', /* glsl */ `
      float itafIgn(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 s = pow(max(inputColor.rgb, vec3(0.0)), vec3(1.0 / 2.2));
        s += (itafIgn(gl_FragCoord.xy) - 0.5) / 255.0;
        outputColor = vec4(pow(max(s, vec3(0.0)), vec3(2.2)), inputColor.a);
      }`, { blendFunction: BlendFunction.NORMAL });
  }
}

const DEFAULT_POST = { bloom: { intensity: 0.9, threshold: 0.62, smoothing: 0.25, radius: 0.72 }, vignette: { offset: 0.3, darkness: 0.55 } };

export function createGLSystem({ stage, tokens, params, fonts, onFatal }) {
  if (params && params.nogl) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'gl-canvas';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, depth: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (e) {
    console.warn('[itaf] WebGL unavailable, GL moments use static frames:', e && e.message);
    return null;
  }
  const glctx = renderer.getContext();
  let gpu = 'unknown';
  try {
    const ext = glctx.getExtension('WEBGL_debug_renderer_info');
    gpu = ext ? glctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : glctx.getParameter(glctx.RENDERER);
  } catch { /* ignore */ }
  const software = /swiftshader|llvmpipe|software/i.test(gpu);
  if (software) console.warn(`[itaf] WebGL is running in software (${gpu}); expect low frame rates`);

  const voidColor = (tokens && tokens.colors && tokens.colors.void) || '#05070A';
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(new THREE.Color(voidColor), 1);

  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  const placeholderCam = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
  const renderPass = new RenderPass(new THREE.Scene(), placeholderCam);
  const bloom = new BloomEffect({ mipmapBlur: true, intensity: DEFAULT_POST.bloom.intensity, luminanceThreshold: DEFAULT_POST.bloom.threshold, luminanceSmoothing: DEFAULT_POST.bloom.smoothing, radius: DEFAULT_POST.bloom.radius, levels: 7 });
  const vignette = new VignetteEffect({ offset: DEFAULT_POST.vignette.offset, darkness: DEFAULT_POST.vignette.darkness });
  const tone = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
  const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH });
  const mainPass = new EffectPass(placeholderCam, bloom, vignette, tone);
  // Opt-in per world (off by default, so worlds that don't ask render exactly as before):
  // depth of field on the linear HDR image before bloom, and film grain in display space after SMAA.
  const dof = new DepthOfFieldEffect(placeholderCam, { focusDistance: 10, focusRange: 6, bokehScale: 2, resolutionScale: 0.5 });
  const dofPass = new EffectPass(placeholderCam, dof);
  dofPass.enabled = false;
  const grain = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT, premultiply: false });
  grain.blendMode.opacity.value = 0;
  const dither = new DitherEffect();
  const aaPass = new EffectPass(placeholderCam, smaa, grain, dither);
  composer.addPass(renderPass);
  composer.addPass(dofPass);
  composer.addPass(mainPass);
  composer.addPass(aaPass);

  // ---------- sizing ----------
  const maxPR = Math.min(window.devicePixelRatio || 1, 1.5);
  let pixelRatio = maxPR;
  let scale = stage.scale;
  function resize() {
    scale = stage.scale;
    const w = Math.max(2, Math.round(stage.W * scale));
    const h = Math.max(2, Math.round(stage.H * scale));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h, false);
    composer.setSize(w, h, false);
    canvas.style.width = stage.W + 'px';
    canvas.style.height = stage.H + 'px';
  }
  stage.onResize(resize);

  // Adaptive pixel ratio: p95 frame time > 18 ms over a 2 s window → 1.0. Intervals are snapped to whole
  // vsyncs first: raw rAF deltas jitter ±2 ms around 16.7 ms even at a perfect 60 fps, so a raw p95 would
  // always read ~18.5 ms and drop the ratio for nothing. Snapped, p95 > 18 ms means > 5% of frames missed.
  const frames = [];
  let windowStart = performance.now();
  let lastFrame = 0;
  function adapt(now) {
    if (lastFrame) frames.push(now - lastFrame);
    lastFrame = now;
    if (now - windowStart < 2000) return;
    if (frames.length > 30 && pixelRatio > 1) {
      const sorted = frames.slice().sort((a, b) => a - b);
      const vsync = sorted[Math.floor(sorted.length / 2)] > 12 ? 1000 / 60 : 1000 / 120;
      const snapped = sorted.map((d) => Math.max(1, Math.round(d / vsync)) * vsync);
      const p95 = snapped[Math.floor(snapped.length * 0.95)];
      if (p95 > 18) {
        pixelRatio = 1;
        resize();
        console.info(`[itaf] GL p95 ${p95.toFixed(1)} ms > 18 ms: pixel ratio → 1.0`);
      }
    }
    frames.length = 0;
    windowStart = now;
  }

  // ---------- worlds ----------
  let current = null;
  function applyPost(world) {
    const p = (world && world.post) || {};
    const b = { ...DEFAULT_POST.bloom, ...(p.bloom || {}) };
    const v = { ...DEFAULT_POST.vignette, ...(p.vignette || {}) };
    bloom.intensity = p.bloom === false ? 0 : b.intensity;
    bloom.luminanceMaterial.threshold = b.threshold;
    bloom.luminanceMaterial.smoothing = b.smoothing;
    bloom.mipmapBlurPass.radius = b.radius;
    vignette.offset = v.offset;
    vignette.darkness = p.vignette === false ? 0 : v.darkness;
    // world.post.dof = { focus, range, bokeh, target }: focus and range in world units; target (a THREE.Vector3)
    // autofocuses on a point and wins over focus. Animate these fields from the scene: they apply every frame.
    const d = p.dof;
    dofPass.enabled = !!d;
    if (d) {
      if (d.focus != null) dof.cocMaterial.focusDistance = d.focus;
      if (d.range != null) dof.cocMaterial.focusRange = d.range;
      dof.bokehScale = d.bokeh != null ? d.bokeh : 2;
      dof.target = d.target || null;
    }
    // world.post.grain = 0…0.15 (soft-light film grain); 0 in render mode so static frames stay clean.
    grain.blendMode.opacity.value = params && params.render ? 0 : Math.max(0, Math.min(0.15, Number(p.grain) || 0));
  }
  function setWorld(world) {
    if (!world || !world.scene || !world.camera) return;
    current = world;
    composer.setMainScene(world.scene);
    composer.setMainCamera(world.camera);
    applyPost(world);
  }
  let rendering = false;
  let lastRenderAt = 0;
  function render(world, dt, force) {
    if (!world || !world.scene || !world.camera) return;
    if (lost) return;
    if (world !== current) setWorld(world);
    else applyPost(world);
    const now = performance.now();
    if (!force) adapt(now);
    composer.render(dt);
    rendering = true;
    lastRenderAt = now;
  }
  function snapshot(world) {
    try {
      if (world) render(world, 0, true);
      const c = document.createElement('canvas');
      c.width = canvas.width;
      c.height = canvas.height;
      c.getContext('2d').drawImage(canvas, 0, 0);
      return c;
    } catch (e) {
      return null;
    }
  }
  function precompile(world) {
    if (!world || !world.scene || !world.camera) return;
    try { renderer.compile(world.scene, world.camera); } catch { /* compile is an optimisation only */ }
  }

  // ---------- context loss ----------
  let lost = false;
  let losses = 0;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    losses += 1;
    console.warn(`[itaf] WebGL context lost (${losses})`);
    if (losses >= 2 && onFatal) onFatal();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    resize();
    if (current) setWorld(current);
  });

  const makeWorld = makeWorldFactory({ THREE, tokens, renderer });
  const api = { THREE, renderer, makeWorld, helpers: helpers.bind({ THREE, renderer, tokens, fonts }), composer, effects: { bloom, vignette, tone, smaa, dof, grain } };

  return {
    api,
    canvas,
    setWorld,
    render,
    snapshot,
    precompile,
    resize,
    info: () => ({ gpu, software, pixelRatio, maxPixelRatio: maxPR, active: performance.now() - lastRenderAt < 250, rendering, buffer: [canvas.width, canvas.height], lost, losses }),
    dispose() {
      composer.dispose();
      renderer.dispose();
    },
  };
}
