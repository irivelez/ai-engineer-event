// GL helpers bound to the shared renderer (ctx.gl.helpers). Usage examples: docs/scene-guide.md.
//   color(name|hex, intensity)       THREE.Color from tokens ('accent', 'lab.anthropic', '#93AAFF'); intensity > 1 blooms
//   particles(opts)                   GPU points: soft round sprites, optional noise drift, additive
//   flow(opts)                        instanced streaks moving along curves (CPU-updated instance matrices)
//   tube(curve, opts)                 glowing line along a curve (keep ≥ 2 px on screen)
//   text3d(opts)                      troika SDF text with the keynote's inlined fonts (never the CDN)
//   cameraRig(camera, opts)           spherical rig around a target, tweened with gsap
//   worldToStage(v, camera)           3D point → stage px {x, y} (pin DOM labels to 3D objects)
//   stageToWorld(x, y, dist, camera)  stage px → 3D point `dist` units in front of the camera
//   gradientTexture(stops, opts)      CanvasTexture for scene.background (output is dithered globally)
//   seeded(str)                       deterministic PRNG; noise.glsl / noise.simplex3
//   whenReady()                       resolves when all text3d() instances have laid out (render mode)
import * as THREE from 'three';
import { gsap } from 'gsap';
import { Text, configureTextBuilder } from 'troika-three-text';
import { SIMPLEX_GLSL, simplex3 } from './noise.js';
import { seededRandom } from '../engine/context.js';

const pending = new Set();
let textConfigured = false;
let warnedFont = false;

function workersAllowed() {
  try {
    const url = URL.createObjectURL(new Blob(['self.onmessage=function(){}'], { type: 'application/javascript' }));
    const w = new Worker(url);
    w.terminate();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export function bind({ tokens, fonts }) {
  const tc = (tokens && tokens.colors) || {};

  function color(c = 'light', intensity = 1) {
    let hex = c;
    if (typeof c === 'string' && !c.startsWith('#') && !c.startsWith('rgb')) {
      const path = c.split('.');
      hex = path.reduce((o, k) => (o && o[k] != null ? o[k] : null), tc) || '#FFFFFF';
    }
    const col = c && c.isColor ? c.clone() : new THREE.Color(hex);
    return intensity === 1 ? col : col.multiplyScalar(intensity);
  }

  // ---------- particles ----------
  function particles({
    count = 2000, positions = null, spread = [20, 12, 20], center = [0, 0, 0], size = 0.06, sizeJitter = 0.6,
    color: col = 'accent', colors = null, intensity = 1.6, opacity = 1, drift = 0.25, driftSpeed = 0.08, seed = 'particles',
  } = {}) {
    const rand = seededRandom(String(seed));
    const pos = new Float32Array(count * 3);
    const aSize = new Float32Array(count);
    const aSeed = new Float32Array(count);
    const aColor = new Float32Array(count * 3);
    const palette = (colors || [col]).map((c) => color(c, 1));
    for (let i = 0; i < count; i++) {
      if (positions) {
        pos[i * 3] = positions[i * 3]; pos[i * 3 + 1] = positions[i * 3 + 1]; pos[i * 3 + 2] = positions[i * 3 + 2];
      } else {
        pos[i * 3] = center[0] + (rand() - 0.5) * spread[0];
        pos[i * 3 + 1] = center[1] + (rand() - 0.5) * spread[1];
        pos[i * 3 + 2] = center[2] + (rand() - 0.5) * spread[2];
      }
      aSize[i] = 1 - sizeJitter / 2 + rand() * sizeJitter;
      aSeed[i] = rand() * 100;
      const pc = palette[Math.floor(rand() * palette.length) % palette.length];
      aColor[i * 3] = pc.r; aColor[i * 3 + 1] = pc.g; aColor[i * 3 + 2] = pc.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));
    const uniforms = {
      uTime: { value: 0 }, uSize: { value: size }, uScale: { value: 1000 }, uDrift: { value: drift }, uDriftSpeed: { value: driftSpeed },
      uIntensity: { value: intensity }, uOpacity: { value: opacity },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime, uSize, uScale, uDrift, uDriftSpeed;
        attribute float aSize; attribute float aSeed; attribute vec3 aColor;
        varying vec3 vColor;
        ${SIMPLEX_GLSL}
        void main() {
          vec3 p = position;
          if (uDrift > 0.0) {
            float t = uTime * uDriftSpeed;
            vec3 q = p * 0.15;
            p += uDrift * vec3(snoise(q + vec3(t, 0.0, aSeed)), snoise(q + vec3(0.0, t, aSeed + 7.0)), snoise(q + vec3(aSeed + 13.0, 0.0, t)));
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(2.0, uSize * aSize * uScale / max(0.001, -mv.z));
          vColor = aColor;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uIntensity, uOpacity;
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          a *= a;
          if (a < 0.003) discard;
          gl_FragColor = vec4(vColor * uIntensity, a * uOpacity);
        }`,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    const v2 = new THREE.Vector2();
    points.onBeforeRender = (renderer, scene, camera) => {
      renderer.getDrawingBufferSize(v2);
      const fov = camera.isPerspectiveCamera ? (camera.fov * Math.PI) / 180 : Math.PI / 4;
      uniforms.uScale.value = v2.y / (2 * Math.tan(fov / 2));
    };
    points.uniforms = uniforms;
    points.update = (time) => { uniforms.uTime.value = time; };
    return points;
  }

  // ---------- instanced flow along curves ----------
  function flow({
    curves, count = 600, size = 0.035, stretch = 5, color: col = 'accent', intensity = 3, speed = [0.03, 0.08],
    samples = 256, seed = 'flow', geometry = null, fadeEnds = true,
  } = {}) {
    if (!curves || !curves.length) throw new Error('flow(): curves required');
    const rand = seededRandom(String(seed));
    const S = Math.max(8, samples);
    const tables = curves.map((c) => {
      const pts = c.getSpacedPoints(S - 1);
      const a = new Float32Array(S * 3);
      pts.forEach((p, i) => { a[i * 3] = p.x; a[i * 3 + 1] = p.y; a[i * 3 + 2] = p.z; });
      return a;
    });
    const geo = geometry || new THREE.SphereGeometry(1, 10, 8);
    const base = color(col, intensity);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const curveOf = new Uint16Array(count);
    const offset = new Float32Array(count);
    const spd = new Float32Array(count);
    const tmpC = new THREE.Color();
    for (let i = 0; i < count; i++) {
      curveOf[i] = i % curves.length;
      offset[i] = rand();
      spd[i] = speed[0] + rand() * (speed[1] - speed[0]);
      mesh.setColorAt(i, base);
    }
    mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(size, size, size * stretch);
    const p = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const Z = new THREE.Vector3(0, 0, 1);
    mesh.update = (time) => {
      for (let i = 0; i < count; i++) {
        const tb = tables[curveOf[i]];
        const u = (((offset[i] + time * spd[i]) % 1) + 1) % 1;
        const f = u * (S - 1);
        const i0 = Math.min(S - 2, Math.floor(f));
        const k = f - i0;
        const a = i0 * 3;
        const b = a + 3;
        p.set(tb[a] + (tb[b] - tb[a]) * k, tb[a + 1] + (tb[b + 1] - tb[a + 1]) * k, tb[a + 2] + (tb[b + 2] - tb[a + 2]) * k);
        dir.set(tb[b] - tb[a], tb[b + 1] - tb[a + 1], tb[b + 2] - tb[a + 2]);
        if (dir.lengthSq() > 1e-12) q.setFromUnitVectors(Z, dir.normalize());
        m4.compose(p, q, s);
        mesh.setMatrixAt(i, m4);
        if (fadeEnds) mesh.setColorAt(i, tmpC.copy(base).multiplyScalar(Math.sin(Math.PI * u)));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (fadeEnds) mesh.instanceColor.needsUpdate = true;
    };
    mesh.update(0);
    return mesh;
  }

  // ---------- tube ----------
  function tube(curve, { radius = 0.012, segments = 240, radial = 8, color: col = 'accent', intensity = 2, opacity = 1 } = {}) {
    const geo = new THREE.TubeGeometry(curve, segments, radius, radial, false);
    const mat = new THREE.MeshBasicMaterial({ color: color(col, intensity), transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    return new THREE.Mesh(geo, mat);
  }

  // ---------- text ----------
  function fontList() {
    return Object.keys(fonts || {});
  }
  function pickFont(name, weight) {
    const all = fontList();
    if (name && String(name).startsWith('data:')) return name;
    if (name && fonts[name]) return fonts[name];
    const want = name ? [name] : weight >= 550 ? ['Geist-SemiBold', 'Geist-Bold', 'Geist-Medium', 'Geist'] : ['Geist-Regular', 'Geist-Medium', 'Geist'];
    for (const w of want) {
      const hit = all.find((f) => f.toLowerCase().startsWith(String(w).toLowerCase()));
      if (hit) return fonts[hit];
    }
    return all.length ? fonts[all[0]] : null;
  }
  function ensureTextConfig() {
    if (textConfigured) return;
    textConfigured = true;
    configureTextBuilder({ defaultFontURL: pickFont(null, 600), useWorker: workersAllowed(), sdfGlyphSize: 64 });
  }
  function text3d({
    text = '', font = null, weight = 600, fontSize = 0.5, color: col = 'light', intensity = 1, anchorX = 'center', anchorY = 'middle',
    maxWidth = Infinity, letterSpacing = -0.02, lineHeight = 1.05, textAlign = 'left', outlineWidth = 0, outlineColor = '#000000', outlineOpacity = 1, ...rest
  } = {}) {
    ensureTextConfig();
    const url = pickFont(font, weight);
    const t = new Text();
    if (!url) {
      if (!warnedFont) console.warn('[itaf] text3d(): no .woff/.ttf/.otf in src/fonts; GL text is skipped (troika cannot read woff2)');
      warnedFont = true;
      t.visible = false;
      t.ready = Promise.resolve(t);
      return t;
    }
    Object.assign(t, { text, font: url, fontSize, anchorX, anchorY, maxWidth, letterSpacing, lineHeight, textAlign, outlineWidth, outlineColor, outlineOpacity, ...rest });
    t.color = color(col, intensity);
    const ready = new Promise((resolve) => t.sync(() => resolve(t)));
    pending.add(ready);
    ready.then(() => pending.delete(ready));
    t.ready = ready;
    return t;
  }

  // ---------- camera rig ----------
  function cameraRig(camera, { target = [0, 0, 0], azimuth = 0, polar = 80, radius = 12, fov = camera.fov, breathe = 0 } = {}) {
    const state = { azimuth, polar, radius, tx: target[0], ty: target[1], tz: target[2], fov, breathe };
    const tgt = new THREE.Vector3();
    let t = 0;
    const deg = Math.PI / 180;
    function apply() {
      const az = (state.azimuth + (state.breathe ? Math.sin(t * 0.21) * state.breathe : 0)) * deg;
      const pol = (state.polar + (state.breathe ? Math.sin(t * 0.17 + 1.3) * state.breathe * 0.5 : 0)) * deg;
      const r = state.radius;
      tgt.set(state.tx, state.ty, state.tz);
      camera.position.set(tgt.x + r * Math.sin(pol) * Math.sin(az), tgt.y + r * Math.cos(pol), tgt.z + r * Math.sin(pol) * Math.cos(az));
      camera.lookAt(tgt);
      if (Math.abs(camera.fov - state.fov) > 1e-4) {
        camera.fov = state.fov;
        camera.updateProjectionMatrix();
      }
    }
    apply();
    return {
      state,
      apply,
      set(s) { Object.assign(state, s); apply(); return this; },
      // Returns a gsap tween: add it to the scene's timeline. In render mode call set() instead.
      to(s, { duration = 3.5, ease = 'power3.inOut' } = {}) { return gsap.to(state, { ...s, duration, ease, onUpdate: apply }); },
      update(time) { t = time; if (state.breathe) apply(); },
    };
  }

  // ---------- projection ----------
  const v3 = new THREE.Vector3();
  function worldToStage(v, camera) {
    v3.copy(v).project(camera);
    return { x: (v3.x + 1) * 960, y: (1 - v3.y) * 540, visible: v3.z < 1 };
  }
  function stageToWorld(x, y, dist, camera) {
    const ndc = new THREE.Vector3(x / 960 - 1, 1 - y / 540, 0.5).unproject(camera);
    const dirv = ndc.sub(camera.position).normalize();
    return camera.position.clone().add(dirv.multiplyScalar(dist));
  }

  // ---------- gradient background ----------
  function gradientTexture(stops = [['#0B1020', 0], ['#05070A', 1]], { radial = true, size = 1024 } = {}) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = Math.round((size * 9) / 16);
    const g = c.getContext('2d');
    const grad = radial ? g.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width * 0.62) : g.createLinearGradient(0, 0, 0, c.height);
    for (const [col, at] of stops) grad.addColorStop(at, col);
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  return {
    color, particles, flow, tube, text3d, cameraRig, worldToStage, stageToWorld, gradientTexture,
    seeded: (s) => seededRandom(String(s)),
    noise: { glsl: SIMPLEX_GLSL, simplex3 },
    fonts: fontList,
    whenReady: () => Promise.all([...pending]),
  };
}
