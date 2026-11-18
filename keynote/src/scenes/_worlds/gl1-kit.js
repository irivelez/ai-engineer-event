// Shared helpers for gl-1's burst moments (swarm, sf-arrival, factory, three-labs, release-pace, science, callback).
// Owner: gl-1. Everything here is allocation-free per frame once created.
import { gsap } from 'gsap';

// ---------- provenance (facts.json → chip kind + "Publisher · 9 Nov 2026") ----------
const KIND = { independent: 'independent', 'lab-reported': 'labReported', labreported: 'labReported', secondary: 'secondary', official: 'official', estimate: 'estimate', press: 'press' };
export const kindOf = (label) => KIND[String(label || '').trim().toLowerCase()] || 'secondary';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(s) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(s || ''));
  if (!m) return String(s || '');
  const mon = MON[+m[2] - 1];
  return m[3] ? `${+m[3]} ${mon} ${m[1]}` : `${mon} ${m[1]}`;
}
/** { kind, text } for a SourceLine, from facts.json; falls back to a beat tag like 'Lab-reported · Anthropic, 9 Nov 2026'. */
export function factSource(ctx, id, fallbackTag) {
  const f = id ? ctx.facts(id) : null;
  if (f) {
    const s = f.source || {};
    return { kind: kindOf(f.label), text: [s.publisher, fmtDate(s.date || f.asOf)].filter(Boolean).join(' · '), fact: f };
  }
  const parts = String(fallbackTag || '').split(' · ');
  if (parts.length > 1 && KIND[parts[0].trim().toLowerCase()]) return { kind: KIND[parts[0].trim().toLowerCase()], text: parts.slice(1).join(' · ') };
  return { kind: 'secondary', text: String(fallbackTag || '') };
}

/** '8 days' → { figure: '8', unit: 'days' }; '1,000+' → { figure: '1,000+', unit: '' }. */
export function splitFigure(str) {
  const m = /^([~$€]?[\d.,]+[+%×]?)\s*(.*)$/.exec(String(str || '').trim());
  return m ? { figure: m[1], unit: m[2] } : { figure: String(str || ''), unit: '' };
}

/** Absolute-position a DOM element in stage px. */
export function place(el, x, y, extra = {}) {
  Object.assign(el.style, { position: 'absolute', left: `${x}px`, top: `${y}px`, ...extra });
  return el;
}

// ---------- camera rig with lens shift ----------
// Spherical camera around a target (degrees), plus:
//   shiftX/shiftY  lens shift in stage px (the target appears shifted right/down by that much), via setViewOffset
//   orbitAmp/orbitPeriod  a slow pendulum orbit (deg / s) added to the azimuth; 0 = still (render mode)
//   breathe        tiny drift (deg)
export function makeRig(THREE, camera, init = {}) {
  const s = { az: 0, pol: 80, r: 12, tx: 0, ty: 0, tz: 0, fov: camera.fov, shiftX: 0, shiftY: 0, orbitAmp: 0, orbitPeriod: 80, breathe: 0, roll: 0, ...init };
  const tgt = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const D = Math.PI / 180;
  let t = 0;
  let lastSX = NaN;
  let lastSY = NaN;
  let lastFov = camera.fov;
  function apply() {
    const orbit = s.orbitAmp ? Math.sin((t / s.orbitPeriod) * Math.PI * 2) * s.orbitAmp : 0;
    const az = (s.az + orbit + (s.breathe ? Math.sin(t * 0.21) * s.breathe : 0)) * D;
    const pol = (s.pol + (s.breathe ? Math.sin(t * 0.17 + 1.3) * s.breathe * 0.5 : 0)) * D;
    tgt.set(s.tx, s.ty, s.tz);
    camera.position.set(tgt.x + s.r * Math.sin(pol) * Math.sin(az), tgt.y + s.r * Math.cos(pol), tgt.z + s.r * Math.sin(pol) * Math.cos(az));
    camera.up.copy(up);
    camera.lookAt(tgt);
    if (s.roll) camera.rotateZ(s.roll * D);
    if (s.fov !== lastFov) { camera.fov = s.fov; lastFov = s.fov; lastSX = NaN; }
    if (s.shiftX !== lastSX || s.shiftY !== lastSY) {
      if (s.shiftX || s.shiftY) camera.setViewOffset(1920, 1080, -s.shiftX, -s.shiftY, 1920, 1080);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      lastSX = s.shiftX;
      lastSY = s.shiftY;
    }
  }
  apply();
  return {
    state: s,
    apply,
    set(next) { Object.assign(s, next); apply(); return this; },
    /** gsap tween of the rig state; add it to a timeline. duration 0 → instant. */
    to(next, { duration = 3.5, ease = 'power3.inOut' } = {}) {
      if (!duration) { Object.assign(s, next); apply(); return gsap.timeline(); }
      return gsap.to(s, { ...next, duration, ease, onUpdate: apply, overwrite: 'auto' });
    },
    update(time) { t = time; apply(); },
  };
}

// ---------- camera: position + look-at target (for glides and dives), with lens shift and breathe ----------
export function makeLookRig(THREE, camera, init = {}) {
  const s = { px: 0, py: 0, pz: 10, tx: 0, ty: 0, tz: 0, fov: camera.fov, shiftX: 0, shiftY: 0, breathe: 0, ...init };
  const D = Math.PI / 180;
  let t = 0;
  let lastSX = NaN;
  let lastSY = NaN;
  let lastFov = camera.fov;
  function apply() {
    const b = s.breathe;
    camera.position.set(s.px + (b ? Math.sin(t * 0.21) * b : 0), s.py + (b ? Math.sin(t * 0.17 + 1.3) * b * 0.5 : 0), s.pz);
    camera.lookAt(s.tx, s.ty, s.tz);
    if (s.fov !== lastFov) { camera.fov = s.fov; lastFov = s.fov; lastSX = NaN; }
    if (s.shiftX !== lastSX || s.shiftY !== lastSY) {
      if (s.shiftX || s.shiftY) camera.setViewOffset(1920, 1080, -s.shiftX, -s.shiftY, 1920, 1080);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      lastSX = s.shiftX;
      lastSY = s.shiftY;
    }
  }
  apply();
  return {
    state: s,
    apply,
    set(next) { Object.assign(s, next); apply(); return this; },
    to(next, { duration = 3.5, ease = 'power3.inOut' } = {}) {
      if (!duration) { Object.assign(s, next); apply(); return gsap.timeline(); }
      return gsap.to(s, { ...next, duration, ease, onUpdate: apply, overwrite: 'auto' });
    },
    update(time) { t = time; apply(); },
    D,
  };
}

/** Project a world point to stage px without allocating (out = { x, y, z }). */
export function projector(THREE, camera) {
  const v = new THREE.Vector3();
  return (x, y, z, out) => {
    v.set(x, y, z).project(camera);
    out.x = (v.x + 1) * 960;
    out.y = (1 - v.y) * 540;
    out.z = v.z;
    return out;
  };
}

// ---------- GLSL ----------
// Soft round sprite: gaussian-ish falloff, never a square dot.
export const SOFT_POINT_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    a *= vAlpha;
    if (a < 0.002) discard;
    gl_FragColor = vec4(vColor * a, a);
  }`;

/** Rounded-rectangle outline points (x, y in the shape plane), evenly spaced. */
export function roundedRectPoints(THREE, w, h, r, n) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s.getSpacedPoints(n).slice(0, n);
}

/** Rounded-rect frame (a flat ring) as a ShapeGeometry, thickness t, in the XY plane. */
export function roundedFrameGeometry(THREE, w, h, r, t) {
  const rr = (W, H, R) => {
    const s = new THREE.Shape();
    const x = -W / 2;
    const y = -H / 2;
    s.moveTo(x + R, y);
    s.lineTo(x + W - R, y);
    s.absarc(x + W - R, y + R, R, -Math.PI / 2, 0, false);
    s.lineTo(x + W, y + H - R);
    s.absarc(x + W - R, y + H - R, R, 0, Math.PI / 2, false);
    s.lineTo(x + R, y + H);
    s.absarc(x + R, y + H - R, R, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + R);
    s.absarc(x + R, y + R, R, Math.PI, Math.PI * 1.5, false);
    return s;
  };
  const outer = rr(w, h, r);
  const inner = rr(w - 2 * t, h - 2 * t, Math.max(0.001, r - t));
  outer.holes.push(inner);
  return new THREE.ShapeGeometry(outer, 12);
}

export function roundedRectGeometry(THREE, w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return new THREE.ShapeGeometry(s, 12);
}

/** smoothstep in JS */
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
