// motor: geometry for the c.1900 machine shop, in metres (a person is 1.75 m).
// Bevelled boxes (RoundedBoxGeometry), turned parts (LatheGeometry), merged per material so the hall stays at
// a few dozen draw calls. Belts are real loops around their two pulleys (tangent lines + wraps), with the data
// the vertex shader needs to scroll, flap and snap them.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BELT_REPEAT } from './_motor-tex.js';

const PI = Math.PI;

// ---------- the plan (shared with the scene) ----------
export const HALL = { x0: -9, x1: 9, z0: -35, z1: 13, eave: 7.2, roofLo: 8.0, roofHi: 9.6, wallT: 0.5 };
export const SHAFT_Y = 5.0;
export const BAY = 4;
export const TRUSS_Z = Array.from({ length: 13 }, (_, k) => 13 - BAY * k); // 13 … -35
export const COLUMN_Z = Array.from({ length: 11 }, (_, k) => 9 - BAY * k); // 9 … -31
export const COLUMN_X = 5.0;
export const WIN_Z = Array.from({ length: 12 }, (_, k) => 11 - BAY * k); // side-window centres 11 … -33
export const END_WIN_X = [-5, 0, 5];
export const FLY = { x: 3.4, y: 2.5, z: -28.6, R: 2.3, w: 0.42 };
export const DRIVE = { z: -28.6, r: 0.8 };
export const ENGINE_Z = -29.35; // the engine runs behind the flywheel: crank, rod, crosshead, cylinder
export const CRANK = { r: 0.5, rod: 2.2 };
export const MOTOR = { z: -32.35, y: SHAFT_Y, startY: 7.3, couple: -31.55 };
export const PANE_W = 3; // roof glazing panels across the width: x = -9 + 3i … +3
// clear (sunlit) roof panes: [truss index, panel index 0..5]; the rest of the glazing is sooted and only glows.
export const CLEAR_PANES = [[3, 3], [4, 1], [5, 4], [6, 2], [7, 3], [8, 1], [9, 2], [10, 4], [11, 2]];

// ---------- primitives ----------
export const rbox = (w, h, d, r = 0.02, seg = 1) => new RoundedBoxGeometry(w, h, d, seg, Math.max(0.001, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)));
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cylZ = (r, len, seg = 24, r2 = r) => new THREE.CylinderGeometry(r, r2, len, seg).rotateX(PI / 2);
export const cylY = (r, len, seg = 24, r2 = r) => new THREE.CylinderGeometry(r, r2, len, seg);
export const cylX = (r, len, seg = 24) => new THREE.CylinderGeometry(r, r, len, seg).rotateZ(PI / 2);
// a body of revolution around Z from (radius, z) pairs
export const turnedZ = (pairs, seg = 32) => new THREE.LatheGeometry(pairs.map(([r, z]) => new THREE.Vector2(Math.max(0.0005, r), z)), seg).rotateX(PI / 2);
export const turnedY = (pairs, seg = 32) => new THREE.LatheGeometry(pairs.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)), seg);

/** Merge geometries (any mix of indexed / non-indexed) keeping position, normal, uv. */
export function merge(list) {
  const geos = list.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
    return n;
  });
  const m = mergeGeometries(geos, false);
  for (const g of new Set([...list, ...geos])) g.dispose();
  return m;
}

/** World-scale box mapping: uv from the position on the plane of the dominant normal axis. */
export function worldUV(geo, scale = 1) {
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else if (ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / scale;
    uv[i * 2 + 1] = v / scale;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

// ---------- the building ----------
export function hallGeometry() {
  const { x0, x1, z0, z1, eave, roofLo, roofHi, wallT } = HALL;
  const L = z1 - z0;
  const zc = (z0 + z1) / 2;
  const brick = [];
  const stone = [];
  const iron = [];
  const winL = []; // glazing quads with their own uv 0..1
  const winR = [];
  const winEnd = [];
  const winNear = [];
  const sill = 2.2, head = 6.0, winW = 2.2;
  // side walls: sill course, head course up to the roof, piers between windows
  for (const side of [-1, 1]) {
    const xw = side < 0 ? x0 - wallT / 2 : x1 + wallT / 2;
    brick.push(box(wallT, sill, L).translate(xw, sill / 2, zc));
    brick.push(box(wallT, roofHi - head, L).translate(xw, (head + roofHi) / 2, zc));
    const edges = [z1];
    WIN_Z.forEach((z) => { edges.push(z + winW / 2, z - winW / 2); });
    edges.push(z0);
    for (let i = 0; i < edges.length; i += 2) {
      const a = edges[i], b = edges[i + 1];
      if (a - b > 0.01) brick.push(box(wallT, head - sill, a - b).translate(xw, (sill + head) / 2, (a + b) / 2));
    }
    WIN_Z.forEach((z) => {
      stone.push(rbox(wallT + 0.14, 0.16, winW + 0.3, 0.03).translate(xw - side * 0.04, sill - 0.04, z));
      stone.push(rbox(wallT + 0.1, 0.3, winW + 0.4, 0.03).translate(xw - side * 0.02, head + 0.12, z));
      const g = new THREE.PlaneGeometry(winW, head - sill).rotateY(side < 0 ? PI / 2 : -PI / 2).translate(xw + side * 0.08, (sill + head) / 2, z);
      (side < 0 ? winL : winR).push(g);
    });
  }
  // end walls with three tall windows each (far end: sunlit; near end: sky, the backdrop of the s2 view)
  const endWall = (zw, facing, glassList) => {
    const W = x1 - x0;
    const eSill = 2.4, eHead = 6.0;
    brick.push(box(W + wallT * 2, eSill, wallT).translate(0, eSill / 2, zw));
    brick.push(box(W + wallT * 2, roofHi + 0.2 - eHead, wallT).translate(0, (eHead + roofHi + 0.2) / 2, zw));
    const edges = [x0 - wallT];
    END_WIN_X.forEach((x) => edges.push(x - winW / 2, x + winW / 2));
    edges.push(x1 + wallT);
    for (let i = 0; i < edges.length; i += 2) {
      const a = edges[i], b = edges[i + 1];
      brick.push(box(b - a, eHead - eSill, wallT).translate((a + b) / 2, (eSill + eHead) / 2, zw));
    }
    END_WIN_X.forEach((x) => {
      stone.push(rbox(winW + 0.3, 0.16, wallT + 0.14, 0.03).translate(x, eSill - 0.04, zw + facing * 0.04));
      stone.push(rbox(winW + 0.4, 0.3, wallT + 0.1, 0.03).translate(x, eHead + 0.12, zw + facing * 0.02));
      const g = new THREE.PlaneGeometry(winW, eHead - eSill);
      if (facing < 0) g.rotateY(PI);
      glassList.push(g.translate(x, (eSill + eHead) / 2, zw - facing * 0.08));
    });
  };
  endWall(z0 - wallT / 2, 1, winEnd);
  endWall(z1 + wallT / 2, -1, winNear);
  // cast-iron columns: plinth, slightly tapered shaft, flared capital
  const colProfile = [[0.001, 0], [0.24, 0], [0.24, 0.12], [0.2, 0.16], [0.2, 0.32], [0.15, 0.4], [0.14, 0.5], [0.12, eave - 0.5], [0.15, eave - 0.32], [0.24, eave - 0.12], [0.26, eave - 0.06], [0.26, eave], [0.001, eave]];
  const colGeo = turnedY(colProfile, 14);
  for (const x of [-COLUMN_X, COLUMN_X]) for (const z of COLUMN_Z) iron.push(colGeo.clone().translate(x, 0, z));
  colGeo.dispose();
  // trusses: bottom chord, top chord, verticals and diagonals (members ≥ 8 cm: ≥ 5 px at 30 m)
  for (const z of TRUSS_Z) {
    const W = x1 - x0;
    iron.push(rbox(W, 0.2, 0.16, 0.02).translate(0, eave + 0.1, z));
    iron.push(rbox(W, 0.16, 0.16, 0.02).translate(0, roofLo - 0.08, z));
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (W * i) / n;
      iron.push(box(0.09, roofLo - eave - 0.2, 0.09).translate(x, (eave + roofLo) / 2, z));
      if (i < n) {
        const dx = W / n, dy = roofLo - eave - 0.25;
        const len = Math.hypot(dx, dy);
        const g = box(0.08, len, 0.08).rotateZ((i % 2 ? 1 : -1) * Math.atan2(dx, dy)).translate(x + dx / 2, (eave + roofLo) / 2, z);
        iron.push(g);
      }
    }
  }
  // longitudinal purlin over each column row + the ridge of every tooth
  for (const x of [-COLUMN_X, COLUMN_X]) iron.push(rbox(0.18, 0.24, L, 0.02).translate(x, eave + 0.12, zc));
  // sawtooth roof: per bay, the slope falls from roofHi at the glazing (z_a) to roofLo one bay nearer (+z)
  const roofSlopes = [];
  const roofGlass = [];
  for (let k = 1; k < TRUSS_Z.length; k++) {
    const za = TRUSS_Z[k]; // glazing line; slope runs from za (high) to za + BAY (low)
    const zb = za + BAY;
    const len = Math.hypot(BAY, roofHi - roofLo);
    const g = new THREE.PlaneGeometry(x1 - x0 + 1, len).rotateX(PI / 2 + Math.atan2(roofHi - roofLo, BAY)).translate(0, (roofHi + roofLo) / 2, (za + zb) / 2);
    roofSlopes.push(g);
    for (let i = 0; i < 6 && k < TRUSS_Z.length - 1; i++) {
      roofGlass.push({ k, i, geo: new THREE.PlaneGeometry(PANE_W, roofHi - roofLo).translate(x0 + PANE_W * (i + 0.5), (roofHi + roofLo) / 2, za) });
    }
  }
  // the last bay at the near end: plain slope (no glazing line beyond z1)
  const out = {
    brick: worldUV(merge(brick), 2),
    stone: merge(stone),
    iron: merge(iron),
    winL: merge(winL),
    winR: merge(winR),
    winEnd: merge(winEnd),
    winNear: merge(winNear),
    roof: merge(roofSlopes),
    roofGlass,
  };
  return out;
}

// ---------- line shaft parts ----------
export function spokedPulley(R, width, { spokes = 6, rimT = 0.045, hubR = 0.085, seg = 32 } = {}) {
  const parts = [];
  parts.push(turnedZ([[R - rimT, -width / 2], [R - 0.006, -width / 2], [R, -width / 4], [R, width / 4], [R - 0.006, width / 2], [R - rimT, width / 2], [R - rimT, -width / 2]], seg));
  parts.push(turnedZ([[0.04, -width * 0.6], [hubR, -width * 0.6], [hubR + 0.01, -width * 0.5], [hubR + 0.01, width * 0.5], [hubR, width * 0.6], [0.04, width * 0.6]], 20));
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * PI * 2;
    const len = R - rimT - hubR + 0.03;
    const g = new THREE.CylinderGeometry(R * 0.035, R * 0.055, len, 8).scale(1, 1, 1.8);
    g.translate(0, hubR + len / 2 - 0.015, 0);
    g.rotateZ(a);
    parts.push(g);
  }
  return merge(parts);
}

export function conePulley(radii, stepW) {
  const pairs = [];
  let z = (-radii.length * stepW) / 2;
  pairs.push([0.02, z - 0.03]);
  radii.forEach((r) => {
    pairs.push([r - 0.006, z]);
    pairs.push([r, z + 0.008]);
    pairs.push([r, z + stepW - 0.008]);
    pairs.push([r - 0.006, z + stepW]);
    z += stepW;
  });
  pairs.push([0.02, z + 0.03]);
  return turnedZ(pairs, 24);
}

export function hangerGeo() {
  // drop hanger from the truss bottom chord down to the shaft: two legs and a bearing box
  const parts = [];
  const top = HALL.eave;
  const h = top - SHAFT_Y + 0.1;
  for (const s of [-1, 1]) {
    const g = rbox(0.07, h, 0.09, 0.015).rotateZ(s * 0.18).translate(s * 0.22, SHAFT_Y + h / 2 - 0.05, 0);
    parts.push(g);
  }
  parts.push(rbox(0.58, 0.07, 0.12, 0.015).translate(0, top - 0.04, 0));
  parts.push(rbox(0.26, 0.2, 0.2, 0.03).translate(0, SHAFT_Y, 0));
  parts.push(cylZ(0.12, 0.24, 20).translate(0, SHAFT_Y, 0));
  return merge(parts);
}

// ---------- belts ----------
/**
 * A belt loop around two pulleys in the plane z = z0 (c1, c2: THREE.Vector2 centres in x, y).
 * Returns path samples { p: Vector2, n: Vector2 (outward), s (0..1 around), arc (m), strand (0..1 bulge) } and length.
 */
export function beltPath(c1, r1, c2, r2, { sag = 0.04, slackSide = 1, nArc1 = 26, nArc2 = 16, nSpan = 26 } = {}) {
  const d = c2.clone().sub(c1);
  const Ld = d.length();
  const u = d.clone().divideScalar(Ld);
  const perp = new THREE.Vector2(-u.y, u.x);
  const sg = (r1 - r2) / Ld;
  const cg = Math.sqrt(Math.max(0, 1 - sg * sg));
  const nA = u.clone().multiplyScalar(sg).add(perp.clone().multiplyScalar(cg));
  const nB = u.clone().multiplyScalar(sg).add(perp.clone().multiplyScalar(-cg));
  const au = Math.atan2(u.y, u.x);
  const th = Math.atan2(cg, sg); // nA at au + th, nB at au - th
  const pts = [];
  const g = new THREE.Vector2(0, -1);
  function strand(a, b, slack) {
    const dir = b.clone().sub(a);
    const len = dir.length();
    dir.divideScalar(len);
    const gp = g.clone().sub(dir.clone().multiplyScalar(g.dot(dir)));
    for (let i = 0; i < nSpan; i++) {
      const t = i / nSpan;
      const bulge = 4 * t * (1 - t);
      const p = a.clone().lerp(b, t).add(gp.clone().multiplyScalar(bulge * (slack ? sag : sag * 0.15)));
      pts.push({ p, strand: bulge });
    }
  }
  function arc(c, r, from, sweep, n) {
    for (let i = 0; i < n; i++) {
      const a = from + (sweep * i) / n;
      pts.push({ p: new THREE.Vector2(c.x + r * Math.cos(a), c.y + r * Math.sin(a)), strand: 0 });
    }
  }
  const A1 = c1.clone().add(nA.clone().multiplyScalar(r1));
  const A2 = c2.clone().add(nA.clone().multiplyScalar(r2));
  const B1 = c1.clone().add(nB.clone().multiplyScalar(r1));
  const B2 = c2.clone().add(nB.clone().multiplyScalar(r2));
  strand(A1, A2, slackSide > 0);
  arc(c2, r2, au + th, -2 * th, nArc2);
  strand(B2, B1, slackSide < 0);
  arc(c1, r1, au - th, -(2 * PI - 2 * th), nArc1);
  // arc length, outward normals
  const cen = c1.clone().add(c2).multiplyScalar(0.5);
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i].p;
    const b = pts[(i + 1) % pts.length].p;
    const pr = pts[(i - 1 + pts.length) % pts.length].p;
    const t = b.clone().sub(pr).normalize();
    const n = new THREE.Vector2(t.y, -t.x);
    if (n.dot(a.clone().sub(cen)) < 0) n.negate();
    pts[i].n = n;
    pts[i].arc = acc;
    acc += a.distanceTo(b);
  }
  pts.forEach((q) => { q.s = q.arc / acc; });
  return { pts, length: acc };
}

/**
 * Ribbon mesh data for many belts at once: a closed rectangular section (width along z, thickness along n).
 * belts: [{ path, z, width, thick, index, fall: (q, out Vector3) => void, delay: (q) => 0..1 }]
 */
export function beltsGeometry(belts) {
  const P = [], N = [], UV = [], IDX = [], FALL = [], DEL = [], FLAP = [], FD = [];
  const index = [];
  let base = 0;
  const f = new THREE.Vector3();
  for (const b of belts) {
    const { pts, length } = b.path;
    const n = pts.length;
    const hw = b.width / 2, ht = b.thick / 2;
    // 4 faces × (n + 1) rings × 2 verts (duplicate the seam so u is continuous)
    const faces = [
      { off: (q, s) => [q.n.x * ht, q.n.y * ht, s * hw], nrm: (q) => [q.n.x, q.n.y, 0], v: (s) => (s + 1) / 2 },
      { off: (q, s) => [-q.n.x * ht, -q.n.y * ht, -s * hw], nrm: (q) => [-q.n.x, -q.n.y, 0], v: (s) => (1 - s) / 2 },
      { off: (q, s) => [s * q.n.x * ht, s * q.n.y * ht, hw], nrm: () => [0, 0, 1], v: () => 0.98 },
      { off: (q, s) => [-s * q.n.x * ht, -s * q.n.y * ht, -hw], nrm: () => [0, 0, -1], v: () => 0.02 },
    ];
    for (const face of faces) {
      for (let i = 0; i <= n; i++) {
        const q = pts[i % n];
        const arc = i === n ? length : q.arc;
        b.fall(q, f);
        for (const s of [-1, 1]) {
          const o = face.off(q, s);
          P.push(q.p.x + o[0], q.p.y + o[1], b.z + o[2]);
          const nn = face.nrm(q);
          N.push(nn[0], nn[1], nn[2]);
          UV.push(arc / BELT_REPEAT, face.v(s));
          IDX.push(b.index);
          FALL.push(f.x + o[0] * 0.6, f.y + Math.abs(o[1]) * 0.3, f.z + o[2]);
          DEL.push(b.delay(q));
          FLAP.push(q.strand);
          FD.push(q.n.x, q.n.y, 0);
        }
      }
      for (let i = 0; i < n; i++) {
        const a = base + i * 2;
        index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
      base += (n + 1) * 2;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute('aBelt', new THREE.Float32BufferAttribute(IDX, 1));
  geo.setAttribute('aFall', new THREE.Float32BufferAttribute(FALL, 3));
  geo.setAttribute('aDelay', new THREE.Float32BufferAttribute(DEL, 1));
  geo.setAttribute('aFlap', new THREE.Float32BufferAttribute(FLAP, 1));
  geo.setAttribute('aFlapDir', new THREE.Float32BufferAttribute(FD, 3));
  geo.setIndex(index);
  geo.computeBoundingSphere();
  return geo;
}

// ---------- machines (local frame: origin on the floor, bed along z, front (operator side) toward +x) ----------
export const LATHE_PULLEY = { y: 1.3, z: -0.98, r: 0.19, radii: [0.19, 0.16, 0.13, 0.1], step: 0.085 };
export const DRILL_PULLEY = { y: 2.06, z: -0.42, r: 0.16, radii: [0.16, 0.13, 0.1], step: 0.075 };

export function latheGeometry() {
  const paint = [], bright = [];
  for (const z of [-0.98, 0.98]) paint.push(rbox(0.46, 0.8, 0.3, 0.04).translate(0, 0.4, z));
  paint.push(rbox(0.5, 0.06, 0.4, 0.02).translate(0, 0.03, -0.98), rbox(0.5, 0.06, 0.4, 0.02).translate(0, 0.03, 0.98));
  paint.push(rbox(0.4, 0.17, 2.7, 0.025).translate(0, 0.885, 0));
  bright.push(rbox(0.07, 0.035, 2.66, 0.008).translate(-0.12, 0.985, 0), rbox(0.07, 0.035, 2.66, 0.008).translate(0.12, 0.985, 0));
  // headstock: two bearing uprights with the cone pulley between them, back-gear housing behind
  paint.push(rbox(0.42, 0.42, 0.12, 0.03).translate(0, 1.18, -1.28), rbox(0.42, 0.42, 0.12, 0.03).translate(0, 1.18, -0.66));
  paint.push(rbox(0.44, 0.1, 0.78, 0.02).translate(0, 1.02, -0.97));
  paint.push(rbox(0.14, 0.22, 0.6, 0.03).translate(-0.2, 1.12, -0.97));
  bright.push(cylZ(0.035, 0.86, 16).translate(0, LATHE_PULLEY.y, -0.97));
  bright.push(turnedZ([[0.03, 0], [0.16, 0], [0.165, 0.02], [0.165, 0.07], [0.12, 0.09], [0.03, 0.09]], 32).translate(0, LATHE_PULLEY.y, -0.6));
  // work between centres
  bright.push(cylZ(0.048, 1.25, 20).translate(0, LATHE_PULLEY.y, 0.12));
  // tailstock with handwheel
  paint.push(rbox(0.3, 0.3, 0.38, 0.04).translate(0, 1.15, 1.02));
  bright.push(cylZ(0.04, 0.32, 16).translate(0, LATHE_PULLEY.y, 0.78));
  bright.push(new THREE.TorusGeometry(0.085, 0.014, 8, 24).translate(0, LATHE_PULLEY.y, 1.24));
  // carriage, apron with handwheel, tool post
  paint.push(rbox(0.56, 0.1, 0.4, 0.02).translate(0, 1.06, 0.1));
  paint.push(rbox(0.1, 0.36, 0.42, 0.02).translate(0.25, 0.86, 0.1));
  bright.push(new THREE.TorusGeometry(0.075, 0.013, 8, 24).rotateY(PI / 2).translate(0.32, 0.86, 0.02));
  bright.push(rbox(0.08, 0.12, 0.08, 0.01).translate(-0.04, 1.17, 0.1));
  // lead screw and feed rod along the front
  bright.push(cylZ(0.016, 2.5, 10).translate(0.23, 0.78, 0));
  paint.push(rbox(0.18, 0.2, 0.2, 0.03).translate(0.12, 0.82, -1.18));
  return { paint: merge(paint), bright: merge(bright) };
}

export function drillGeometry() {
  const paint = [], bright = [];
  paint.push(rbox(0.7, 0.14, 0.95, 0.03).translate(0, 0.07, 0));
  paint.push(cylY(0.095, 1.95, 20, 0.11).translate(0, 1.05, -0.3));
  paint.push(rbox(0.36, 0.42, 0.62, 0.05).translate(0, 1.86, -0.12));
  paint.push(rbox(0.3, 0.16, 0.46, 0.04).translate(0, 2.06, -0.42));
  bright.push(cylY(0.032, 0.52, 14).translate(0, 1.45, 0.08));
  bright.push(cylY(0.05, 0.14, 14).translate(0, 1.66, 0.08));
  // table on its arm
  paint.push(rbox(0.12, 0.16, 0.42, 0.03).translate(0, 0.82, -0.12));
  bright.push(cylY(0.26, 0.05, 32).translate(0, 0.9, 0.1));
  // feed handwheel and back-gear
  bright.push(new THREE.TorusGeometry(0.12, 0.014, 8, 28).rotateY(PI / 2).translate(0.22, 1.8, -0.05));
  bright.push(cylZ(0.02, 0.3, 10).translate(0, DRILL_PULLEY.y, -0.25));
  // vertical drive shaft at the back with bevel housing
  bright.push(cylY(0.025, 1.0, 10).translate(0, 1.55, -0.58));
  paint.push(rbox(0.16, 0.16, 0.16, 0.03).translate(0, 1.02, -0.58));
  return { paint: merge(paint), bright: merge(bright) };
}

// ---------- steam engine ----------
export function flywheelGeometry() {
  const { R, w } = FLY;
  const parts = [];
  parts.push(turnedZ([[R - 0.24, -w / 2], [R - 0.01, -w / 2], [R, -w / 2 + 0.02], [R, w / 2 - 0.02], [R - 0.01, w / 2], [R - 0.24, w / 2], [R - 0.3, w * 0.3], [R - 0.3, -w * 0.3], [R - 0.24, -w / 2]], 56));
  parts.push(turnedZ([[0.09, -0.36], [0.32, -0.36], [0.34, -0.3], [0.34, 0.3], [0.32, 0.36], [0.09, 0.36]], 32));
  for (let i = 0; i < 8; i++) {
    const len = R - 0.3 - 0.3;
    const g = new THREE.CylinderGeometry(0.06, 0.1, len, 12).scale(1, 1, 1.9);
    g.translate(0, 0.3 + len / 2, 0).rotateZ((i / 8) * PI * 2);
    parts.push(g);
  }
  return merge(parts);
}

export function engineStatic() {
  // stone piers carrying the crankshaft, iron bed, crosshead guides, cylinder (the engine sits behind the flywheel)
  const stone = [], iron = [], bright = [];
  const zE = ENGINE_Z;
  for (const z of [FLY.z + 0.75, FLY.z - 1.5]) stone.push(rbox(1.1, FLY.y - 0.15, 0.62, 0.05).translate(FLY.x, (FLY.y - 0.15) / 2, z));
  bright.push(cylZ(0.12, 3.3, 20).translate(FLY.x, FLY.y, FLY.z - 0.2));
  stone.push(rbox(4.6, 1.6, 1.3, 0.06).translate(FLY.x + 3.2, 0.8, zE));
  iron.push(rbox(3.1, 0.2, 0.8, 0.03).translate(FLY.x + 3.2, 1.7, zE));
  iron.push(rbox(1.8, 0.12, 0.56, 0.02).translate(FLY.x + 2.2, FLY.y + 0.32, zE), rbox(1.8, 0.12, 0.56, 0.02).translate(FLY.x + 2.2, FLY.y - 0.32, zE));
  for (const dx of [-0.9, 0.9]) iron.push(rbox(0.14, 0.75, 0.6, 0.02).translate(FLY.x + 2.2 + dx, FLY.y, zE));
  iron.push(turnedZ([[0.0, -0.9], [0.52, -0.9], [0.56, -0.84], [0.56, 0.84], [0.52, 0.9], [0.0, 0.9]], 36).rotateY(PI / 2).translate(FLY.x + 4.45, FLY.y, zE));
  iron.push(rbox(0.5, 0.9, 1.0, 0.06).translate(FLY.x + 4.45, 1.8, zE));
  // steam pipe from the cylinder up into the roof
  const pipe = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(FLY.x + 4.45, FLY.y + 0.5, zE), new THREE.Vector3(FLY.x + 4.45, FLY.y + 1.6, zE),
    new THREE.Vector3(FLY.x + 4.6, FLY.y + 2.2, zE - 0.6), new THREE.Vector3(FLY.x + 4.8, HALL.eave + 1, zE - 1.4),
  ]), 24, 0.09, 10, false);
  iron.push(pipe);
  return { stone: merge(stone), iron: merge(iron), bright: merge(bright), zE };
}

// ---------- the electric motor, c.1900 (axis along z; shaft toward +z) ----------
export function motorGeometry() {
  const paint = [], bright = [], brass = [], dark = [];
  // yoke with four pole bosses, end bells, base with feet
  paint.push(turnedZ([[0.2, -0.4], [0.42, -0.4], [0.46, -0.34], [0.46, 0.34], [0.42, 0.4], [0.2, 0.4]], 48));
  for (let i = 0; i < 4; i++) {
    const a = PI / 4 + (i * PI) / 2;
    paint.push(rbox(0.22, 0.12, 0.62, 0.04).translate(0, 0.46, 0).rotateZ(a));
  }
  paint.push(turnedZ([[0.06, 0.4], [0.38, 0.4], [0.3, 0.52], [0.12, 0.56], [0.06, 0.56]], 40));
  paint.push(turnedZ([[0.06, -0.56], [0.12, -0.56], [0.3, -0.52], [0.38, -0.4], [0.06, -0.4]], 40));
  paint.push(rbox(0.9, 0.12, 0.9, 0.03).translate(0, -0.56, 0));
  paint.push(rbox(0.5, 0.26, 0.7, 0.04).translate(0, -0.42, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) dark.push(cylY(0.03, 0.06, 6).translate(sx * 0.37, -0.48, sz * 0.36));
  // shaft and coupling half (the line shaft's half is part of the shaft group)
  bright.push(cylZ(0.06, 0.5, 18).translate(0, 0, 0.72));
  bright.push(turnedZ([[0.06, 0], [0.2, 0], [0.21, 0.015], [0.21, 0.08], [0.06, 0.08]], 32).translate(0, 0, MOTOR.couple - MOTOR.z - 0.085));
  // brass: nameplates on both flanks, a band at each end of the yoke, oil cups on the bells
  for (const sx of [-1, 1]) brass.push(rbox(0.03, 0.17, 0.32, 0.008).translate(sx * 0.475, 0.04, 0));
  for (const z of [-0.37, 0.37]) brass.push(turnedZ([[0.455, -0.018], [0.468, -0.018], [0.468, 0.018], [0.455, 0.018]], 48).translate(0, 0, z));
  for (const z of [-0.5, 0.5]) brass.push(cylY(0.03, 0.08, 12).translate(0, 0.4, z));
  dark.push(rbox(0.16, 0.18, 0.2, 0.02).translate(0.42, 0.28, -0.22));
  // lifting eye
  bright.push(new THREE.TorusGeometry(0.06, 0.016, 8, 20).translate(0, 0.53, 0));
  // supply cable: out of the terminal box, up into the roof
  dark.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.48, 0.3, -0.22), new THREE.Vector3(0.62, 0.45, -0.3), new THREE.Vector3(0.75, 0.9, -0.5),
    new THREE.Vector3(0.85, 1.6, -0.55), new THREE.Vector3(0.9, 3.2, -0.6),
  ]), 30, 0.028, 8, false));
  return { paint: merge(paint), bright: merge(bright), brass: merge(brass), dark: merge(dark) };
}

/** The deck the motor sits on: hung from the last truss and the end wall. Local origin at the motor axis. */
export function motorDeck() {
  const iron = [];
  const y = -0.62;
  iron.push(rbox(1.5, 0.1, 3.0, 0.02).translate(0, y - 0.05, -1.05));
  for (const sx of [-0.7, 0.7]) for (const z of [0.3, -1.4]) {
    iron.push(box(0.05, HALL.eave - (MOTOR.y + y), 0.05).translate(sx, y + (HALL.eave - (MOTOR.y + y)) / 2, z));
  }
  return merge(iron);
}

/** The chain hoist block on the last truss (link chain is instanced separately). */
export function hoistGeometry() {
  const iron = [];
  iron.push(rbox(0.36, 0.3, 0.24, 0.04).translate(0, 0, 0));
  iron.push(turnedZ([[0.0, -0.05], [0.17, -0.05], [0.17, 0.05], [0.0, 0.05]], 24).translate(0, 0, 0.16));
  iron.push(box(0.06, 0.5, 0.06).translate(0, 0.38, 0));
  return merge(iron);
}

// ---------- the new floor: small motor per machine, conveyor ----------
export function smallMotorGeometry() {
  const paint = [], dark = [];
  paint.push(turnedZ([[0.05, -0.17], [0.15, -0.17], [0.16, -0.15], [0.16, 0.15], [0.15, 0.17], [0.05, 0.17]], 20));
  for (let i = 0; i < 6; i++) paint.push(box(0.04, 0.03, 0.3).translate(0, 0.165, 0).rotateZ((i / 6) * PI * 2));
  paint.push(rbox(0.3, 0.07, 0.34, 0.02).translate(0, -0.17, 0));
  dark.push(cylZ(0.03, 0.12, 12).translate(0, 0, 0.22));
  dark.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.14, 0.05, -0.1), new THREE.Vector3(0.3, -0.1, -0.15), new THREE.Vector3(0.4, -0.6, -0.2), new THREE.Vector3(0.42, -1.3, -0.2),
  ]), 16, 0.022, 6, false));
  return { paint: merge(paint), dark: merge(dark) };
}

export function conveyorGeometry(len) {
  const iron = [], belt = [];
  belt.push(rbox(0.62, 0.06, len, 0.02).translate(0, 0.78, 0));
  iron.push(rbox(0.08, 0.16, len, 0.02).translate(-0.34, 0.74, 0), rbox(0.08, 0.16, len, 0.02).translate(0.34, 0.74, 0));
  const n = Math.floor(len / 2);
  for (let i = 0; i <= n; i++) {
    const z = -len / 2 + (len * i) / n;
    for (const sx of [-0.32, 0.32]) iron.push(box(0.07, 0.7, 0.07).translate(sx, 0.35, z));
  }
  return { iron: merge(iron), belt: merge(belt) };
}
