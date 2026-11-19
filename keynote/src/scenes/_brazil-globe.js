// brazil's world (private to src/scenes/brazil.js): a real Earth drawn from Natural Earth, nothing invented.
// Data: src/data/geo/brazil-globe.json = Natural Earth 1:50m admin-0 countries, land boundary lines and coastline
// (public domain, naturalearthdata.com; GeoJSON via github.com/nvkelso/natural-earth-vector, fetched 18 Nov 2026),
// simplified (finest over South America, where the camera ends) and polyline-encoded; generator: .dev/hero/brazil/geo-brazil.mjs.
// Look: dark slate land, coastlines and borders as real lines, a soft key light with a gentle terminator, an
// atmospheric rim, Brazil filled and outlined in the accent (its border draws on), plus a flat SVG inset globe for
// the four Asian countries the same rule names (they sit on the far side of the Earth from Brazil).
import * as THREE from 'three';
import geo from '../data/geo/brazil-globe.json';
import { fatLines } from './_worlds/gl2-kit.js';

export const R = 10;
const D2R = Math.PI / 180;
const Q = geo.q || 100;

/** lat/lon (deg) → point on the sphere; lon 0 faces +z, lon 90 faces +x (same convention as the old grid-earth). */
export function ll(lat, lon, r = R, out = new THREE.Vector3()) {
  const la = lat * D2R;
  const lo = lon * D2R;
  return out.set(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
}

/** One polyline-encoded line or ring → [[lon, lat], …]. */
export function decode(str) {
  const out = [];
  let i = 0;
  let x = 0;
  let y = 0;
  const next = () => {
    let r = 0;
    let s = 0;
    let b;
    do { b = str.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
    return r & 1 ? ~(r >> 1) : r >> 1;
  };
  while (i < str.length) { x += next(); y += next(); out.push([x / Q, y / Q]); }
  return out;
}

let cache = null;
/** Decoded geometry, shared by every instance (the data never changes). */
export function geoData() {
  if (cache) return cache;
  cache = {
    coast: geo.coast.map(decode),
    borders: geo.borders.map(decode),
    land: geo.land.map((c) => ({ a: c.a, rings: c.r.map(decode) })),
    label: geo.label || {},
  };
  return cache;
}

const ASIA = ['IDN', 'MYS', 'SGP', 'THA'];

/** The mask texture, equirectangular in three's sphere UVs (u = (lon + 90°) / 360°): R land, G Brazil, B the four Asian countries.
 *  The canvas is drawn once per page and shared (a re-created scene only re-uploads it). */
let maskCanvas = null;
function maskTexture(D) {
  const cv = maskCanvas || drawMask(D);
  maskCanvas = cv;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
function drawMask(D) {
  const W = 2048;
  const H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  const fill = (rings, style) => {
    g.fillStyle = style;
    for (const off of [0, W]) {
      g.beginPath();
      for (const ring of rings) {
        ring.forEach(([lon, lat], i) => {
          const x = ((lon + 90) / 360) * W + off;
          const y = ((90 - lat) / 180) * H;
          if (i) g.lineTo(x, y); else g.moveTo(x, y);
        });
        g.closePath();
      }
      g.fill('evenodd');
    }
  };
  for (const c of D.land) {
    fill(c.rings, '#ff0000');
    if (c.a === 'BRA') fill(c.rings, '#00ff00');
    if (ASIA.includes(c.a)) fill(c.rings, '#0000ff');
  }
  return cv;
}

function segments(lines, lift, maxDeg = 1.5) {
  const out = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [lo0, la0] = line[i];
      const [lo1, la1] = line[i + 1];
      // long chords would cut under the surface: split them along the great circle (lerp + renormalise)
      const n = Math.max(1, Math.ceil(Math.hypot(lo1 - lo0, la1 - la0) / maxDeg));
      ll(la0, lo0, R * lift, a);
      for (let k = 1; k <= n; k++) {
        ll(la0 + ((la1 - la0) * k) / n, lo0 + ((lo1 - lo0) * k) / n, R * lift, b);
        out.push(a.x, a.y, a.z, b.x, b.y, b.z);
        a.copy(b);
      }
    }
  }
  return out;
}

let lineCache = null;
function lineData(D) {
  if (lineCache) return lineCache;
  const coast = segments(D.coast, 1.0016);
  const borders = segments(D.borders, 1.0016);
  const bra = D.land.find((c) => c.a === 'BRA');
  const braRing = bra ? bra.rings.reduce((a, r) => (r.length > a.length ? r : a), []) : [];
  lineCache = { world: new Float32Array([...coast, ...borders]), nCoast: coast.length, brazil: new Float32Array(segments([braRing], 1.0026, 0.5)) };
  return lineCache;
}

export function buildGlobe({ makeWorld, H }) {
  const D = geoData();
  const world = makeWorld({
    fov: 30, near: 0.5, far: 400, cameraPosition: [0, 0, 62], lookAt: [0, 0, 0],
    post: { bloom: { intensity: 0.6, threshold: 0.9, smoothing: 0.25, radius: 0.6 }, vignette: { offset: 0.3, darkness: 0.55 } },
  });
  const holder = new THREE.Group(); // position: where the globe sits on screen
  const earth = new THREE.Group(); //  rotation: which lat/lon faces the camera
  holder.add(earth);
  world.add(holder);

  const mask = maskTexture(D);
  const U = {
    uMask: { value: mask },
    uOcean: { value: new THREE.Color('#060A11') },
    uLand: { value: new THREE.Color('#222C3B') },
    uHi: { value: H.color('accent', 0.17) },
    uAsiaCol: { value: H.color('accent', 0.17) },
    uRim: { value: H.color('accent', 0.3) },
    uL: { value: new THREE.Vector3(-0.55, 0.5, 0.67).normalize() },
    uBrazil: { value: 0 },
    uAsia: { value: 0 },
    uDim: { value: 1 },
  };
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 112, 80), new THREE.ShaderMaterial({ // limb error < 0.3 px at the close-up
    uniforms: U,
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMask; uniform vec3 uOcean, uLand, uHi, uAsiaCol, uRim, uL; uniform float uBrazil, uAsia, uDim;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main() {
        vec4 m = texture2D(uMask, vUv);
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vW);
        float d = dot(n, uL);
        float lit = 0.34 + 0.66 * smoothstep(-0.3, 0.85, d);         // a soft key light, a gentle terminator
        vec3 col = mix(uOcean, uLand, m.r);
        col = mix(col, uHi, m.g * uBrazil);
        col = mix(col, uAsiaCol, m.b * uAsia);
        col *= lit;
        float fr = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);       // atmosphere seen against the disc
        col += uRim * fr * (0.25 + 0.75 * smoothstep(-0.5, 0.7, d));
        gl_FragColor = vec4(col * uDim, 1.0);
      }`,
  }));
  earth.add(sphere);

  // the atmosphere: a halo outside the limb that fades to nothing (impact parameter, so no hard outer edge)
  const RS = R * 1.09;
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(RS, 64, 40), new THREE.ShaderMaterial({
    uniforms: { uCol: { value: H.color('accent', 0.3) }, uC: { value: new THREE.Vector3() }, uDim: U.uDim },
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCol, uC; uniform float uDim; varying vec3 vW;
      void main() {
        vec3 dir = normalize(vW - cameraPosition);
        float b = length(cross(uC - cameraPosition, dir));               // how close the view ray passes to the centre
        float k = clamp((${RS.toFixed(3)} - b) / ${(RS - R).toFixed(3)}, 0.0, 1.0);
        gl_FragColor = vec4(uCol * pow(k, 3.0) * uDim, 1.0);
      }`,
  }));
  holder.add(atmo);

  // lines: coastlines and land borders in ONE draw (colour per vertex: coasts brighter), Brazil's border (draws on) in
  // another; all just above the surface. Segment arrays are built once per page.
  const L = lineData(D);
  const cCoast = H.color('light', 0.3);
  const cBorder = H.color('light', 0.17);
  const cols = new Float32Array(L.world.length);
  for (let i = 0; i < cols.length; i += 3) {
    const c = i < L.nCoast ? cCoast : cBorder;
    cols[i] = c.r; cols[i + 1] = c.g; cols[i + 2] = c.b;
  }
  const lines = fatLines({ positions: L.world, colors: cols, width: 2.1, color: 0xffffff });
  const brazilLine = fatLines({ positions: L.brazil, width: 3.5, color: H.color('accent', 1.5) });
  const braSegs = L.brazil.length / 6;
  brazilLine.geometry.instanceCount = 0;
  earth.add(lines, brazilLine);
  const lineMats = { lines: lines.material, brazil: brazilLine.material };

  const api = {
    world, holder, earth, U, lineMats, D,
    /** 0..1 of Brazil's border drawn (its segments run in ring order). */
    setBrazilLine(k) { brazilLine.geometry.instanceCount = Math.round(Math.max(0, Math.min(1, k)) * braSegs); },
    /** Point the globe: lat/lon to the front, its centre at (x, y) world units, the camera at distance d. */
    pose(p) {
      earth.rotation.set(p.lat * D2R, -p.lon * D2R, 0);
      holder.position.set(p.x, p.y, 0);
      world.camera.position.set(0, 0, p.d);
      world.camera.lookAt(0, 0, 0);
      atmo.material.uniforms.uC.value.copy(holder.position);
    },
    setDim(k) {
      if (U.uDim.value === k) return;
      U.uDim.value = k;
      lineMats.lines.opacity = k;
      lineMats.brazil.opacity = 0.35 + 0.65 * k;
    },
  };
  return api;
}

// ---------------- the inset: a flat orthographic globe in SVG for Indonesia, Malaysia, Singapore, Thailand ----------------
const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs, parent) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
};

let insetSeq = 0;
/** An SVG disc (radius r px) showing the Earth around lon0/lat0, the four countries in the accent, Singapore ringed. */
export function asiaInset({ r = 126, lon0 = 110, lat0 = 3, cap = 27, colors }) {
  const D = geoData();
  const el = svg('svg', { width: r * 2 + 8, height: r * 2 + 8, viewBox: `${-r - 4} ${-r - 4} ${r * 2 + 8} ${r * 2 + 8}` });
  el.style.overflow = 'visible';
  const l0 = lon0 * D2R;
  const p0 = lat0 * D2R;
  const proj = ([lon, lat]) => {
    const l = lon * D2R - l0;
    const p = lat * D2R;
    const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    const K = r / Math.sin(cap * D2R); // a cap of `cap` degrees fills the disc (the clip hides the rest)
    let x = K * Math.cos(p) * Math.sin(l);
    let y = -K * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
    if (cosc < 0) { const k = K / Math.max(1e-6, Math.hypot(x, y)); x *= k; y *= k; } // behind the horizon: pinned to the limb
    return [x, y, cosc];
  };
  const id = `brazil-inset-${++insetSeq}`;
  const clip = svg('clipPath', { id }, svg('defs', {}, el));
  svg('circle', { cx: 0, cy: 0, r }, clip);
  svg('circle', { cx: 0, cy: 0, r, fill: colors.ocean }, el);
  const g = svg('g', { 'clip-path': `url(#${id})` }, el);
  const near = Math.cos((cap + 14) * D2R); // rings wholly outside the visible cap (plus a margin) are never drawn
  const path = (rings) => rings.map((ring) => {
    const pts = ring.map(proj);
    if (pts.every((q) => q[2] < near)) return '';
    return `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')}Z`;
  }).join('');
  const hl = [];
  for (const c of D.land) {
    const d = path(c.rings);
    if (!d) continue;
    const on = ASIA.includes(c.a);
    const pe = svg('path', { d, fill: on ? colors.accent : colors.land, 'fill-rule': 'evenodd', stroke: colors.ocean, 'stroke-width': 1 }, g);
    if (on) hl.push(pe);
  }
  // Singapore is a few pixels across at this scale: a ring marks it
  const sg = D.label.SGP ? proj(D.label.SGP) : null;
  const ring = sg ? svg('circle', { cx: sg[0].toFixed(1), cy: sg[1].toFixed(1), r: 9, fill: 'none', stroke: colors.accent, 'stroke-width': 3 }, el) : null;
  svg('circle', { cx: 0, cy: 0, r, fill: 'none', stroke: colors.rim, 'stroke-width': 2 }, el);
  return { el, hl, ring };
}
