// The data hall of breach (private to that moment). Metres; x right, y up, z toward the camera.
// A 2.4 m glass sandbox stands at the head of a 4 m main aisle, turned 45° so one corner faces the camera.
// 42U racks (0.6 × 1.2 × 2.2 m) line the aisle in four bays of twelve, with two more rows on each side behind;
// galvanised cable trays and cold-white LED fixtures overhead, a raised floor of 600 mm tiles with network traces.
// Light: an environment built from the hall's own fixtures (PMREM), a cool key from above, the agents' red-orange
// glow from inside the box; the floor reflects the fixtures and takes each infected rack's red spill.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { curveTexture, CURVE_GLSL, fatLines } from './gl2-kit.js';

export const CUBE = { c: new THREE.Vector3(0, 1.3, 0), h: 1.2, yaw: -Math.PI / 4 }; // local +x faces (+1, 0, +1)/√2
const RACK = { w: 0.6, d: 1.2, h: 2.2 };
const BAYS = 4; // per row, twelve racks each, 1.8 m cross aisles between bays
const PER_BAY = 12;
const BAY_Z0 = -2.4;
const BAY_LEN = PER_BAY * RACK.w; // 7.2
const BAY_GAP = 1.8;
const ROWS = [
  { x: -2.6, face: 1 }, { x: 2.6, face: -1 }, // the main aisle's two rows, fronts toward x = 0
  { x: -5.0, face: -1 }, { x: 5.0, face: 1 },
  { x: -7.4, face: 1 }, { x: 7.4, face: -1 },
];
export const rackZ = (bay, k) => BAY_Z0 - bay * (BAY_LEN + BAY_GAP) - (k + 0.5) * RACK.w;
const CROSS_Z = (bay) => BAY_Z0 - (bay + 1) * BAY_LEN - bay * BAY_GAP - BAY_GAP / 2; // centre of the cross aisle after a bay
const FIXTURE_X = [-0.9, 0.9, -6.2, 6.2];
const CEIL = 3.6;
const FIX_Y = 3.35;
export const AGENTS = 1200; // inside the sandbox
export const LEAKERS = 700; // METR: ~700 agents joined the attack

// The impact face: the cube's right-front face (normal (+1, 0, +1)/√2 after the 45° turn).
const FACE_N = new THREE.Vector3(1, 0, 1).normalize();
const FACE_T = new THREE.Vector3(1, 0, -1).normalize(); // along the face, toward the aisle
const FACE_C = CUBE.c.clone().addScaledVector(FACE_N, CUBE.h);
export const IMPACT = { u: 0.18, v: 0.12 };
export const impactPoint = () => FACE_C.clone().addScaledVector(FACE_T, IMPACT.u).add(new THREE.Vector3(0, IMPACT.v, 0));

// ---------- textures (procedural, no downloads) ----------
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function doorTexture(rand) {
  // A perforated rack door: hex-pitch holes over dark powder-coat, a frame, a handle, a label plate.
  return canvasTex(256, 940, (g, w, h) => {
    g.fillStyle = '#3b4149'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#121519';
    const pitch = 7.2;
    for (let y = 26; y < h - 26; y += pitch * 0.866) {
      const row = Math.round(y / (pitch * 0.866));
      for (let x = 18 + (row % 2) * pitch * 0.5; x < w - 30; x += pitch) { g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill(); }
    }
    g.strokeStyle = '#1a1e23'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
    g.fillStyle = '#8c949e'; g.fillRect(w - 22, h * 0.42, 8, 90);
    g.fillStyle = '#3a4048'; g.fillRect(26, 34, 64, 18);
    // a little grime toward the bottom
    const grd = g.createLinearGradient(0, h * 0.7, 0, h);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + rand() * 0.03})`; g.fillRect(rand() * w, rand() * h, 1 + rand() * 30, 1); }
  });
}
function brushedTexture(rand) {
  // Horizontal brushing as a roughness map (grey = roughness).
  const t = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = 'rgb(110,110,110)'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = 80 + Math.floor(rand() * 70);
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.fillRect(rand() * w, rand() * h, 30 + rand() * 220, 1);
    }
  }, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- environment: the hall's own light (dark room, cold strips) ----------
function hallEnvironment(renderer) {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(24, 5, 70), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.014, 0.018), side: THREE.BackSide }));
  room.position.set(0, 2, -15);
  scene.add(room);
  const strip = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.5, 6.2, 7.6) });
  for (const x of FIXTURE_X) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 60), strip);
    s.position.set(x, 4.4, -15);
    scene.add(s);
  }
  const warm = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.5, 0.2) }));
  warm.position.set(0, 1.3, 0);
  scene.add(warm);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt;
}

// ---------- the crack pattern on the impact face ----------
function clipPoly(poly, h) {
  // Sutherland–Hodgman against the square [-h, h]².
  const edges = [[1, 0, h], [-1, 0, h], [0, 1, h], [0, -1, h]];
  let out = poly;
  for (const [ax, ay, c] of edges) {
    const inp = out;
    out = [];
    for (let i = 0; i < inp.length; i++) {
      const p = inp[i]; const q = inp[(i + 1) % inp.length];
      const dp = c - (ax * p[0] + ay * p[1]); const dq = c - (ax * q[0] + ay * q[1]);
      if (dp >= 0) out.push(p);
      if ((dp >= 0) !== (dq >= 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    if (!out.length) break;
  }
  return out;
}
function crackPattern(rand) {
  // Radial cracks from the impact plus concentric rings, as annealed glass breaks; cells clipped to the face.
  const K = 13;
  const RINGS = [0.1, 0.24, 0.42, 0.66, 0.98, 1.45, 2.4, 3.6];
  const ang = [];
  for (let k = 0; k < K; k++) ang.push(((k + (rand() - 0.5) * 0.6) / K) * Math.PI * 2);
  const rr = ang.map(() => RINGS.map((r, m) => r * (m === 0 ? 1 : 0.84 + rand() * 0.32)));
  const P = (k, m) => { const kk = k % K; const r = rr[kk][m]; return [IMPACT.u + Math.cos(ang[kk]) * r, IMPACT.v + Math.sin(ang[kk]) * r]; };
  const cells = [];
  for (let k = 0; k < K; k++) {
    for (let m = 0; m < RINGS.length - 1; m++) {
      const poly = m === 0 ? [[IMPACT.u, IMPACT.v], P(k, 1), P(k + 1, 1)] : [P(k, m), P(k + 1, m), P(k + 1, m + 1), P(k, m + 1)];
      const c = clipPoly(poly, CUBE.h - 0.02);
      if (c.length < 3) continue;
      let area = 0;
      for (let i = 0; i < c.length; i++) { const p = c[i]; const q = c[(i + 1) % c.length]; area += p[0] * q[1] - q[0] * p[1]; }
      if (Math.abs(area) < 1e-4) continue;
      cells.push({ poly: c, ring: m, k });
    }
  }
  return cells;
}

// ---------- materials ----------
const FLOOR_VERT = /* glsl */ `varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`;
const FLOOR_FRAG = /* glsl */ `
uniform vec3 uTile, uLight, uRed, uFog; uniform float uFogD, uCubeGlow, uInfect, uTime;
uniform sampler2D uOrder; uniform vec2 uCube;
varying vec3 vW; varying float vD;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float rackOrder(int row, float z){
  // which rack of a row faces this z, and when it turns red (from the order texture)
  float zz = ${BAY_Z0.toFixed(2)} - z;
  float bay = floor(zz / ${(BAY_LEN + BAY_GAP).toFixed(2)});
  float inBay = zz - bay * ${(BAY_LEN + BAY_GAP).toFixed(2)};
  if (bay < 0.0 || bay > ${(BAYS - 1).toFixed(1)} || inBay > ${BAY_LEN.toFixed(2)}) return 9.0;
  float k = floor(inBay / ${RACK.w.toFixed(2)});
  return texelFetch(uOrder, ivec2(int(bay * ${PER_BAY.toFixed(1)} + k), row), 0).r;
}
float spill(int row, float frontX, float dir, vec3 w){
  float o = rackOrder(row, w.z);
  float on = smoothstep(o, o + 0.025, uInfect);
  float dx = (w.x - frontX) * dir; // metres in front of the door
  float zz = ${BAY_Z0.toFixed(2)} - w.z;
  float local = fract(zz / ${RACK.w.toFixed(2)}) - 0.5;
  return on * smoothstep(-0.05, 0.1, dx) * exp(-dx * 1.3) * (1.0 - 0.6 * local * local * 4.0);
}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  vec2 p = vW.xz;
  // 600 mm tiles: seams, per-tile tone, perforated tiles along the rack fronts
  vec2 tc = p / 0.6; vec2 ti = floor(tc); vec2 tf = fract(tc);
  vec2 fw = fwidth(tc) + 1e-4;
  vec2 sd = min(tf, 1.0 - tf);
  float seam = 1.0 - smoothstep(0.0, 0.012 + fw.x * 1.2, min(sd.x, sd.y));
  float detail = 1.0 - smoothstep(0.08, 0.3, max(fw.x, fw.y));
  float tone = 0.88 + 0.24 * hash12(ti);
  float perfRow = step(1.4, abs(p.x)) * (1.0 - step(2.0, abs(p.x)));
  vec2 hp = fract(p / 0.05) - 0.5;
  float holes = perfRow * (1.0 - smoothstep(0.18, 0.28, length(hp))) * detail;
  vec3 alb = uTile * tone * (1.0 - seam * 0.45 * detail) * (1.0 - holes * 0.5);
  // light from the fixture lines overhead
  float irr = 0.0;
  ${FIXTURE_X.slice(0, 2).map((x) => `{ float dx = p.x - (${x.toFixed(2)}); irr += 1.0 / (1.0 + dx * dx / 1.6); }`).join('\n  ')}
  irr += 0.35 / (1.0 + pow(abs(p.x) - 6.2, 2.0) / 1.6);
  // contact shadow along the rack rows and around the plinth
  float ax = abs(p.x);
  float ao = smoothstep(2.0, 1.55, ax) * 0.55 + 0.45;
  ao *= mix(1.0, smoothstep(0.0, 0.5, ax - 3.2) * 0.6 + 0.4, step(3.2, ax) * step(ax, 4.4));
  vec2 cq = mat2(0.7071, -0.7071, 0.7071, 0.7071) * (p - uCube);
  float box = max(abs(cq.x), abs(cq.y)) - 1.32;
  ao *= mix(0.25, 1.0, smoothstep(0.0, 0.7, box));
  vec3 col = alb * uLight * irr * 0.22 * ao;
  // glossy floor: the fixture lines reflected, broken where the strips have gaps
  float Fr = 0.04 + 0.96 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
  vec3 cam = cameraPosition;
  float rough = 0.06 + 0.012 * vD;
  ${FIXTURE_X.slice(0, 2).map((x) => `{ float xr = cam.x + (${x.toFixed(2)} - cam.x) * cam.y / (cam.y + ${FIX_Y.toFixed(2)});
    float zr = cam.z + (vW.z - cam.z) * (cam.y + ${FIX_Y.toFixed(2)}) / max(cam.y, 0.1);
    float seg = smoothstep(0.0, 0.08, abs(fract((zr + 0.3) / 3.0) - 0.5) - 0.1);
    float dxr = (p.x - xr) / rough;
    col += uLight * exp(-dxr * dxr) * Fr * 0.55 * seg * (1.0 - holes * 0.6); }`).join('\n  ')}
  // the sandbox's red glow on the floor, and every infected rack's spill
  float dc = max(box, 0.0);
  col += uRed * uCubeGlow * (0.3 * exp(-dc * 2.2) + 0.035 * exp(-dc * 0.6));
  float red = spill(0, -2.0, 1.0, vW) + spill(1, 2.0, -1.0, vW) + spill(3, 5.6, 1.0, vW) + spill(5, 6.8, -1.0, vW) + spill(2, -5.6, -1.0, vW) + spill(4, -6.8, 1.0, vW);
  col += uRed * red * 0.42;
  // the glossy floor mirrors the infected doors of the two main-aisle rows: follow the reflected ray to the door
  // plane it meets and, if it lands on a red rack's door, add its glow (blurred with distance like the strips)
  vec3 Rf = reflect(-V, vec3(0.0, 1.0, 0.0));
  if (abs(Rf.x) > 0.02) {
    float fx = Rf.x > 0.0 ? 2.0 : -2.0;
    float t = (fx - p.x) / Rf.x;
    vec3 hit = vW + Rf * t;
    if (t > 0.0 && hit.y > 0.12 && hit.y < 2.1) {
      float o = rackOrder(Rf.x > 0.0 ? 1 : 0, hit.z);
      float on = smoothstep(o, o + 0.025, uInfect);
      col += uRed * on * Fr * 0.5 * smoothstep(2.1, 1.6, hit.y) * exp(-t * 0.12) * (1.0 - holes * 0.6);
    }
  }
  float f = 1.0 - exp(-pow(uFogD * vD, 2.0));
  gl_FragColor = vec4(mix(col, uFog, f), 1.0);
}`;

// The rack door: perforated powder-coat (canvas texture) lit by the fixture lines above, the box's red glow on
// the nearest doors, and the servers' LEDs behind the perforations; an infected rack's LEDs and door turn red.
const DOOR_VERT = /* glsl */ `
attribute float aOrder; attribute float aSeed;
uniform float uInfect;
varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying float vHot; varying float vFresh; varying float vSeed; varying float vD;
void main(){
  vUv = uv; vSeed = aSeed;
  vHot = smoothstep(aOrder, aOrder + 0.025, uInfect);
  vFresh = vHot * (1.0 - smoothstep(aOrder + 0.025, aOrder + 0.12, uInfect));
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vec4 mv = viewMatrix * w; vD = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const DOOR_FRAG = /* glsl */ `
uniform sampler2D uDoor;
uniform vec3 uBlue, uGreen, uRed, uFog, uLight, uCubeRed, uCube; uniform float uTime, uFogD, uCubeGlow;
varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying float vHot; varying float vFresh; varying float vSeed; varying float vD;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec3 alb = pow(texture2D(uDoor, vUv).rgb, vec3(2.2));
  vec3 N = normalize(vN);
  float irr = 0.0;
  ${FIXTURE_X.slice(0, 2).map((x) => `{ vec2 L = vec2(${x.toFixed(2)} - vW.x, ${FIX_Y.toFixed(2)} - vW.y); irr += max(dot(N.xy, normalize(L)), 0.0) * 2.2 / (1.0 + dot(L, L) * 0.18); }`).join('\n  ')}
  vec3 col = alb * (uLight * irr * 0.32 + vec3(0.018, 0.02, 0.025));
  float dc = length(vW - uCube);
  col += uCubeRed * uCubeGlow * alb * 1.6 / (1.0 + dc * dc * 0.35);
  // 42 rack units: most hold a server with a status LED and an activity LED behind the perforated door
  float u = vUv.y * 42.0; float row = floor(u); float fy = fract(u);
  float present = step(0.22, hash12(vec2(row, vSeed))) * step(0.04, vUv.y) * step(vUv.y, 0.96);
  vec2 fw = fwidth(vec2(vUv.x * 30.0, u));
  float detail = 1.0 - smoothstep(0.35, 1.0, max(fw.x, fw.y));
  vec2 q1 = vec2((vUv.x - 0.8) * 30.0, fy - 0.5);
  vec2 q2 = vec2((vUv.x - 0.7) * 30.0, fy - 0.5);
  float l1 = 1.0 - smoothstep(0.18, 0.18 + fw.x * 1.5 + 0.05, length(q1));
  float l2 = 1.0 - smoothstep(0.16, 0.16 + fw.x * 1.5 + 0.05, length(q2));
  float act = step(0.5, fract(hash12(vec2(row, vSeed + 3.0)) + uTime * (0.2 + 0.5 * hash12(vec2(vSeed, row)))));
  float leds = mix(0.03, present * (l1 + l2 * act), detail);
  vec3 idle = mix(mix(uBlue, uGreen, step(0.7, hash12(vec2(row * 1.7, vSeed)))), uBlue, 1.0 - detail);
  vec3 e = mix(idle, uRed, vHot) * leds * (1.0 + vFresh * 1.5);
  // an infected rack glows red through its whole door
  float inner = smoothstep(0.02, 0.1, vUv.x) * smoothstep(0.98, 0.9, vUv.x) * smoothstep(0.02, 0.06, vUv.y) * smoothstep(0.98, 0.94, vUv.y);
  e += uRed * vHot * inner * (0.085 + 0.2 * vFresh);
  float f = 1.0 - exp(-pow(uFogD * vD, 2.0));
  gl_FragColor = vec4(mix(col, uFog, f) + e * (1.0 - f), 1.0);
}`;

const AGENT_VERT = /* glsl */ `
${CURVE_GLSL}
attribute vec3 aHome; attribute vec4 aInfo; // home on/near a wall (cube-local), seed, delay, route (-1 = stays), end
uniform float uTime, uLeak, uPress, uHalf; uniform mat4 uCubeMat; uniform vec2 uImpact;
varying vec3 vCol; varying float vHot;
uniform vec3 uCol, uHot;
vec3 hash33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
void main(){
  float seed = aInfo.x; float delay = aInfo.y; float route = aInfo.z; float endU = aInfo.w;
  // crawling on the inside of the glass: a slow wander along the wall, pressed against it
  vec3 h = aHome;
  // pressure: the crowd on the impact wall, near the point that will give, grows hotter and more agitated
  float near = step(uHalf - 0.06, aHome.x) * exp(-dot(aHome.yz - uImpact, aHome.yz - uImpact) / 0.35);
  float press = uPress * near;
  vec3 wob = vec3(sin(uTime * (0.5 + seed * 0.7 + press * 2.0) + seed * 17.0), sin(uTime * (0.43 + seed * 0.5 + press * 2.0) + seed * 9.0), cos(uTime * (0.37 + seed * 0.6) + seed * 5.0)) * (0.07 + 0.05 * press);
  vec3 inside = clamp(h + wob * (1.0 - abs(sign(h)) * step(uHalf - 0.06, abs(h))), vec3(-uHalf + 0.035), vec3(uHalf - 0.035));
  // pressing toward the impact before the break
  vec3 pIn = (uCubeMat * vec4(inside, 1.0)).xyz;
  vec3 p = pIn;
  float hot = 0.0;
  float scale = 1.0;
  if (route >= 0.0) {
    float t = clamp((uLeak - delay) / max(endU, 0.05), 0.0, 1.0);
    vec3 onRoute = curveAt(route, t * endU);
    vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), curveAt(route, min(t * endU + 0.01, 1.0)) - onRoute + vec3(1e-4)));
    onRoute += side * (fract(seed * 13.7) - 0.5) * 0.34 + vec3(0.0, 0.03 + 0.02 * sin(uTime * 3.0 + seed * 40.0), 0.0);
    p = mix(pIn, onRoute, smoothstep(0.0, 0.04, t));
    hot = step(0.0001, t) * (1.0 - step(0.999, t));
    scale = 1.0 - smoothstep(0.92, 1.0, t);
  }
  vHot = hot;
  vCol = mix(uCol, uHot, max(hot, press * 0.6)) * (0.75 + 0.5 * fract(seed * 7.13)) * (1.0 + 0.7 * press);
  vec3 lp = position * scale * (0.8 + 0.4 * fract(seed * 3.1));
  gl_Position = projectionMatrix * viewMatrix * vec4(p + lp, 1.0);
}`;
const AGENT_FRAG = /* glsl */ `varying vec3 vCol; varying float vHot; void main(){ gl_FragColor = vec4(vCol, 1.0); }`;

export function buildHall(ctx) {
  const { makeWorld, helpers: H, renderer } = ctx.gl;
  const rand = H.seeded('breach-hall');
  const fogCol = new THREE.Color(0.012, 0.016, 0.024);
  const world = makeWorld({
    background: '#05070A', fov: 28, near: 0.1, far: 120,
    post: { bloom: { intensity: 1.0, threshold: 0.95, smoothing: 0.25, radius: 0.72 }, vignette: { offset: 0.28, darkness: 0.6 }, dof: { focus: 7, range: 4, bokeh: 2.2 } },
  });
  world.scene.background = fogCol.clone();
  world.scene.fog = new THREE.FogExp2(fogCol, 0.032);
  const envRT = hallEnvironment(renderer);
  world.track(envRT);
  world.scene.environment = envRT.texture;

  // ---------- lights ----------
  const key = new THREE.DirectionalLight(new THREE.Color(0.78, 0.86, 1.0), 2.4);
  key.position.set(1.5, 8, 6);
  key.target.position.set(0, 0, -8);
  world.add(key, key.target);
  const glow = new THREE.PointLight(new THREE.Color(1.0, 0.32, 0.14), 6, 9, 2);
  glow.position.copy(CUBE.c);
  world.add(glow);

  // ---------- floor and ceiling ----------
  const order = new Float32Array(ROWS.length * BAYS * PER_BAY * 4).fill(9);
  const orderTex = new THREE.DataTexture(order, BAYS * PER_BAY, ROWS.length, THREE.RGBAFormat, THREE.FloatType);
  orderTex.minFilter = orderTex.magFilter = THREE.NearestFilter;
  world.track(orderTex);
  const floorU = {
    uTile: { value: new THREE.Color(0.2, 0.215, 0.235) }, uLight: { value: new THREE.Color(0.85, 0.93, 1.1) }, uRed: { value: new THREE.Color(1.0, 0.22, 0.09) },
    uFog: { value: fogCol }, uFogD: { value: 0.032 }, uCubeGlow: { value: 1 }, uInfect: { value: 0 }, uTime: { value: 0 },
    uOrder: { value: orderTex }, uCube: { value: new THREE.Vector2(CUBE.c.x, CUBE.c.z) },
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 70).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: floorU, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG }));
  floor.position.set(0, 0, -20);
  world.add(floor);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(40, 70).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: new THREE.Color(0.05, 0.055, 0.06), roughness: 0.9, metalness: 0 }));
  ceiling.position.set(0, CEIL, -20);
  world.add(ceiling);

  // ---------- racks ----------
  const brushed = brushedTexture(rand);
  brushed.repeat.set(2, 6);
  const door = doorTexture(rand);
  world.track(brushed); world.track(door);
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.1, 0.11, 0.125), metalness: 0.8, roughness: 0.45, roughnessMap: brushed, envMapIntensity: 1.6 });
  const rackGeo = new THREE.BoxGeometry(RACK.d, RACK.h, RACK.w);
  rackGeo.translate(0, RACK.h / 2, 0);
  const nR = ROWS.length * BAYS * PER_BAY;
  const aOrder = new Float32Array(nR);
  const aSeed = new Float32Array(nR);
  const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const v = new THREE.Vector3(); const one = new THREE.Vector3(1, 1, 1);
  const Y = new THREE.Vector3(0, 1, 0);
  const rackList = [];
  let i = 0;
  ROWS.forEach((row, ri) => {
    for (let b = 0; b < BAYS; b++) for (let k = 0; k < PER_BAY; k++) {
      const z = rackZ(b, k);
      // the box's −x face is the door; face +1 (front toward +x) turns it 180°
      q.setFromAxisAngle(Y, row.face > 0 ? Math.PI : 0);
      v.set(row.x, 0, z);
      m4.compose(v, q, one);
      const fx = row.x + row.face * (RACK.d / 2 + 0.006);
      aSeed[i] = rand() * 100;
      rackList.push({ ri, b, k, x: row.x, z, front: fx, m: m4.clone() });
      i++;
    }
  });
  const ledU = {
    uInfect: { value: 0 }, uTime: { value: 0 }, uFog: { value: fogCol }, uFogD: { value: 0.032 }, uDoor: { value: door },
    uLight: { value: new THREE.Color(0.85, 0.93, 1.1) }, uCubeRed: { value: new THREE.Color(1.0, 0.28, 0.1) }, uCube: { value: CUBE.c }, uCubeGlow: { value: 1 },
    uBlue: { value: new THREE.Color(0.25, 0.5, 1.4) }, uGreen: { value: new THREE.Color(0.25, 1.2, 0.5) }, uRed: { value: new THREE.Color(2.6, 0.38, 0.14) },
  };
  const doorMat = new THREE.ShaderMaterial({ uniforms: ledU, vertexShader: DOOR_VERT, fragmentShader: DOOR_FRAG });
  rackGeo.setAttribute('aOrder', new THREE.InstancedBufferAttribute(aOrder, 1));
  rackGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  const racks = new THREE.InstancedMesh(rackGeo, [bodyMat, doorMat, bodyMat, bodyMat, bodyMat, bodyMat], nR);
  rackList.forEach((r, j) => { racks.setMatrixAt(j, r.m); });
  racks.frustumCulled = false;
  world.add(racks);

  // ---------- trays and fixtures overhead ----------
  const trayMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.32, 0.34, 0.36), metalness: 0.85, roughness: 0.42, roughnessMap: brushed });
  const trayLen = BAYS * (BAY_LEN + BAY_GAP) + 2;
  const trayZ = BAY_Z0 - trayLen / 2 + 1;
  const trays = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.07, trayLen), trayMat, ROWS.length + BAYS);
  ROWS.forEach((row, j) => { m4.makeTranslation(row.x, 2.72, trayZ); trays.setMatrixAt(j, m4); });
  for (let b = 0; b < BAYS; b++) { m4.compose(v.set(0, 2.95, CROSS_Z(b)), q.setFromAxisAngle(Y, Math.PI / 2), new THREE.Vector3(1, 1, 16 / trayLen)); trays.setMatrixAt(ROWS.length + b, m4); }
  world.add(trays);
  const fixMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.9, 3.6) });
  const nSeg = Math.floor(trayLen / 3);
  const fixtures = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.035, 2.4), fixMat, FIXTURE_X.length * nSeg);
  let fi = 0;
  for (const x of FIXTURE_X) for (let s = 0; s < nSeg; s++) { m4.makeTranslation(x, FIX_Y, 1.0 - s * 3.0 - 1.2); fixtures.setMatrixAt(fi++, m4); }
  world.add(fixtures);

  // ---------- the sandbox: plinth, aluminium frame, glass ----------
  const cube = new THREE.Group();
  cube.position.copy(CUBE.c);
  cube.rotation.y = CUBE.yaw;
  world.add(cube);
  const h = CUBE.h;
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(2 * h + 0.16, 0.1, 2 * h + 0.16, 2, 0.02), new THREE.MeshStandardMaterial({ color: new THREE.Color(0.02, 0.022, 0.026), metalness: 0.2, roughness: 0.6 }));
  plinth.position.y = -h - 0.05 + 0.0;
  cube.add(plinth);
  const alu = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.62, 0.65, 0.7), metalness: 1.0, roughness: 0.3, roughnessMap: brushed });
  const bar = new RoundedBoxGeometry(0.04, 2 * h + 0.04, 0.04, 2, 0.008);
  const frame = new THREE.Group();
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const m = new THREE.Mesh(bar, alu); m.position.set(x * h, 0, z * h); frame.add(m); }
  for (const y of [-1, 1]) {
    for (const z of [-1, 1]) { const m = new THREE.Mesh(bar, alu); m.rotation.z = Math.PI / 2; m.position.set(0, y * h, z * h); frame.add(m); } // along x
    for (const x of [-1, 1]) { const m = new THREE.Mesh(bar, alu); m.rotation.x = Math.PI / 2; m.position.set(x * h, y * h, 0); frame.add(m); } // along z
  }
  cube.add(frame);
  // Glass without a transmission pass (that pass re-renders the whole hall every frame): a dielectric that
  // reflects the hall's own fixture strips by Fresnel, lets ~94 % of the light through, and darkens slightly at
  // its thickness. The agents behind it are ordinary opaque geometry, seen straight through.
  const glass = new THREE.ShaderMaterial({
    uniforms: { uGlow: { value: 1 }, uRed: { value: new THREE.Color(1.0, 0.3, 0.12) }, uCube: { value: CUBE.c } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */ `
      uniform float uGlow; uniform vec3 uRed; uniform vec3 uCube;
      varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        if (dot(N, V) < 0.0) N = -N;
        float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
        vec3 R = reflect(-V, N);
        vec3 env = vec3(0.012, 0.014, 0.02) + vec3(0.02, 0.022, 0.026) * max(R.y, 0.0);
        if (R.y > 0.02) {
          float t = (${FIX_Y.toFixed(2)} - vW.y) / R.y;
          vec2 hit = vW.xz + R.xz * t;
          float seg = smoothstep(0.0, 0.06, abs(fract((hit.y + 0.3) / 3.0) - 0.5) - 0.1);
          float g = 0.0;
          ${FIXTURE_X.map((x) => `g += exp(-pow((hit.x - (${x.toFixed(2)})) / 0.09, 2.0));`).join(' ')}
          env += vec3(3.2, 3.6, 4.4) * g * seg * exp(-t * 0.04);
        }
        // the crowd inside lights the glass from behind, warm
        float inside = exp(-length(vW - uCube) * 0.9);
        env += uRed * uGlow * 0.05 * inside;
        float a = clamp(F + 0.06, 0.0, 1.0);
        gl_FragColor = vec4((env * F + vec3(0.004, 0.008, 0.007) * 0.06) / a, a);
      }`,
  });
  const pane = new RoundedBoxGeometry(2 * h - 0.02, 2 * h - 0.02, 0.022, 1, 0.006);
  // walls: −x, −z, +z (local) and the top; the +x wall (local) is the impact face after the 45° turn
  for (const [px, pz, ry] of [[-h, 0, Math.PI / 2], [0, -h, 0], [0, h, 0]]) { const m = new THREE.Mesh(pane, glass); m.position.set(px, 0, pz); m.rotation.y = ry; cube.add(m); }
  const lid = new THREE.Mesh(pane, glass); lid.position.y = h; lid.rotation.x = Math.PI / 2; cube.add(lid);

  // the impact face, already cut into its shards (they hold together until the crack reaches them)
  const edgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.42, 0.6, 0.56), transparent: true, opacity: 0.7 });
  const cells = crackPattern(rand);
  const shards = [];
  const shardGroup = new THREE.Group();
  world.add(shardGroup);
  const faceQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(FACE_T, new THREE.Vector3(0, 1, 0), FACE_N));
  for (const c of cells) {
    let cx = 0; let cy = 0;
    c.poly.forEach(([x, y]) => { cx += x; cy += y; });
    cx /= c.poly.length; cy /= c.poly.length;
    const shape = new THREE.Shape(c.poly.map(([x, y]) => new THREE.Vector2(x - cx, y - cy)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
    g.translate(0, 0, -0.01);
    // group 0: the two faces (glass); group 1: the cut edges, which glow pale green as thick glass does
    const m = new THREE.Mesh(g, [glass, edgeMat]);
    const home = FACE_C.clone().addScaledVector(FACE_T, cx).add(new THREE.Vector3(0, cy, 0));
    m.position.copy(home);
    m.quaternion.copy(faceQ);
    shardGroup.add(m);
    const falls = c.ring <= 3;
    const dist = Math.hypot(cx - IMPACT.u, cy - IMPACT.v);
    shards.push({
      m, home, falls, dist, ring: c.ring, edgeCount: g.groups[1] ? g.groups[1].count : 0,
      td: 0.08 * c.ring + rand() * 0.12,
      v0: FACE_N.clone().multiplyScalar(0.5 + rand() * 0.9).add(FACE_T.clone().multiplyScalar((cx - IMPACT.u) * (0.6 + rand() * 0.6))).add(new THREE.Vector3(0, 0.3 + rand() * 0.6 + (cy - IMPACT.v) * 0.5, 0)),
      axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      spin: 3 + rand() * 6,
      yawEnd: rand() * Math.PI * 2,
      half: Math.max(...c.poly.map(([x, y]) => Math.hypot(x - cx, y - cy))),
    });
  }
  // crack lines: every cell edge, revealed outward from the impact (instanceCount), the fallen ones hidden after
  const segIn = []; const segOut = [];
  const seen = new Set();
  const toW = (x, y) => FACE_C.clone().addScaledVector(FACE_N, 0.014).addScaledVector(FACE_T, x).add(new THREE.Vector3(0, y, 0));
  const edgeList = [];
  for (const c of cells) {
    for (let j = 0; j < c.poly.length; j++) {
      const a = c.poly[j]; const b2 = c.poly[(j + 1) % c.poly.length];
      const onBorder = (p) => Math.abs(Math.abs(p[0]) - (h - 0.02)) < 1e-3 || Math.abs(Math.abs(p[1]) - (h - 0.02)) < 1e-3;
      if (onBorder(a) && onBorder(b2)) continue;
      const key = [a, b2].map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const d = Math.min(Math.hypot(a[0] - IMPACT.u, a[1] - IMPACT.v), Math.hypot(b2[0] - IMPACT.u, b2[1] - IMPACT.v));
      edgeList.push({ a, b: b2, d, inner: c.ring <= 2 });
    }
  }
  edgeList.sort((x, y) => x.d - y.d);
  for (const e of edgeList) { const A = toW(...e.a); const B = toW(...e.b); (e.inner ? segIn : segOut).push(A.x, A.y, A.z, B.x, B.y, B.z); }
  // the impact: a glint at the point that gives, blooming for half a second
  const flashTex = canvasTex(128, 128, (g2, w, h2) => {
    const grd = g2.createRadialGradient(w / 2, h2 / 2, 0, w / 2, h2 / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.18, 'rgba(255,236,220,0.55)'); grd.addColorStop(1, 'rgba(255,200,170,0)');
    g2.fillStyle = grd; g2.fillRect(0, 0, w, h2);
  });
  world.track(flashTex);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, color: new THREE.Color(4, 3.6, 3.2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  flash.position.copy(impactPoint()).addScaledVector(FACE_N, 0.03);
  flash.scale.setScalar(0.5);
  world.add(flash);
  const crackCol = new THREE.Color(2.2, 2.4, 2.8);
  const cracksIn = world.add(fatLines({ positions: segIn, width: 3, color: crackCol.clone() }));
  const cracksOut = world.add(fatLines({ positions: segOut, width: 3, color: crackCol.clone() }));
  const dIn = edgeList.filter((e) => e.inner).map((e) => e.d);
  const dOut = edgeList.filter((e) => !e.inner).map((e) => e.d);

  // ---------- routes: out of the hole, down to the floor, along the traces to the racks ----------
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const exitP = impactPoint();
  const out1 = exitP.clone().addScaledVector(FACE_N, 0.5).add(V3(0, -0.35, 0));
  const land = V3(2.0, 0.04, 0.4);
  const lane = (x, z) => V3(x, 0.04, z);
  // One trunk along the right-hand aisle, branching only at the cross aisles, as cable routes run
  const T = 1.7;
  const ROUTE_PTS = [
    [lane(T, -2.6), lane(T, -9.2)],
    [lane(T, -2.6), lane(T, -18.0)],
    [lane(T, -2.6), lane(T, -27.0)],
    [lane(T, -2.6), lane(T, -36.0)],
    [lane(T, -2.6), lane(T, CROSS_Z(0)), lane(-1.7, CROSS_Z(0)), lane(-1.7, -3.0)],
    [lane(T, -2.6), lane(T, CROSS_Z(0)), lane(-1.7, CROSS_Z(0)), lane(-1.7, -27.0)],
    [lane(T, -2.6), lane(T, CROSS_Z(0)), lane(6.2, CROSS_Z(0)), lane(6.2, -27.0)],
    [lane(T, -2.6), lane(T, CROSS_Z(1)), lane(-6.2, CROSS_Z(1)), lane(-6.2, -36.0)],
  ];
  const curves = ROUTE_PTS.map((pts) => {
    const path = new THREE.CurvePath();
    path.add(new THREE.CatmullRomCurve3([exitP, out1, V3(1.85, 0.4, 0.85), land]));
    let prev = land;
    for (const p of pts) { path.add(new THREE.LineCurve3(prev, p)); prev = p; }
    return path;
  });
  const curveTex = curveTexture(curves, 256);
  world.track(curveTex);
  // floor traces (the agents' network): the ground part of every route
  // draw every stretch of floor once, however many routes share it (split at every route's corner)
  const traceSegs = [];
  const cuts = new Map();
  ROUTE_PTS.forEach((pts) => { let prev = land; for (const p of pts) { const key = `${prev.x}|${prev.z}|${p.x}|${p.z}`; if (!cuts.has(key)) cuts.set(key, [prev, p]); prev = p; } });
  const along = [...cuts.values()];
  const stops = [land, ...ROUTE_PTS.flat()];
  const pieces = new Set();
  for (const [A, B2] of along) {
    // split this segment at every route corner lying on it, so overlapping stretches dedupe exactly
    const d = B2.clone().sub(A); const L2 = d.lengthSq();
    const ts = [0, 1];
    for (const P of stops) { const t = P.clone().sub(A).dot(d) / L2; const off = A.clone().addScaledVector(d, t).distanceTo(P); if (t > 1e-3 && t < 1 - 1e-3 && off < 1e-3) ts.push(t); }
    ts.sort((x, y) => x - y);
    for (let k = 0; k < ts.length - 1; k++) {
      const P0 = A.clone().addScaledVector(d, ts[k]); const P1 = A.clone().addScaledVector(d, ts[k + 1]);
      const key = [P0, P1].map((q2) => `${q2.x.toFixed(2)},${q2.z.toFixed(2)}`).sort().join('|');
      if (pieces.has(key)) continue;
      pieces.add(key);
      traceSegs.push(P0.x, 0.012, P0.z, P1.x, 0.012, P1.z);
    }
  }
  const traceCool = new THREE.Color(0.045, 0.07, 0.1); // dim, cold, until the agents run on them
  const traceHot = new THREE.Color(1.6, 0.32, 0.12);
  const traces = world.add(fatLines({ positions: traceSegs, width: 3, color: traceCool.clone() }));

  // rack infection order: the earliest arrival along any route that passes the rack, then spreading in its bay
  // an agent with no delay is at route fraction f when uLeak = f (see AGENT_VERT), so a rack at fraction f of a
  // route turns red at uInfect = f: the stream and the red arrive together
  const reach = (ci, f) => f;
  const pts = curves.map((c) => c.getSpacedPoints(400));
  rackList.forEach((r, j) => {
    let best = 9;
    pts.forEach((arr, ci) => {
      for (let s = 0; s < arr.length; s++) {
        const p = arr[s];
        if (p.y > 0.2) continue;
        if (Math.abs(p.z - r.z) < 0.3 && Math.abs(p.x - r.front) < 0.75) best = Math.min(best, reach(ci, s / 400));
      }
    });
    r.order = best;
  });
  for (let pass = 0; pass < 3; pass++) {
    rackList.forEach((r) => {
      if (r.order < 9) return;
      let near = 9;
      rackList.forEach((o) => { if (o.order < 9 && o.ri === r.ri && o.b === r.b) near = Math.min(near, o.order + 0.03 * Math.abs(o.k - r.k)); });
      if (near < 9) r.order = near + 0.04;
    });
  }
  rackList.forEach((r) => { if (r.order >= 9) r.order = 0.86 + 0.1 * Math.abs(Math.sin(r.z * 3.1 + r.ri)); });
  rackList.forEach((r, j) => {
    r.order = Math.min(r.order, 0.97);
    aOrder[j] = r.order;
    const o = (r.ri * BAYS * PER_BAY + r.b * PER_BAY + r.k) * 4;
    order[o] = r.order;
  });
  rackGeo.attributes.aOrder.needsUpdate = true;
  orderTex.needsUpdate = true;

  // ---------- agents ----------
  const ag = new THREE.IcosahedronGeometry(0.019, 0);
  const iGeo = new THREE.InstancedBufferGeometry();
  iGeo.index = ag.index;
  iGeo.setAttribute('position', ag.attributes.position);
  iGeo.setAttribute('normal', ag.attributes.normal);
  const aHome = new Float32Array(AGENTS * 3);
  const aInfo = new Float32Array(AGENTS * 4);
  const hi = h - 0.04;
  const homes = [];
  for (let a = 0; a < AGENTS; a++) {
    // on the inside of a wall: most on the impact wall (local +x), crowded around the point that will give
    const r = rand();
    const wall = r < 0.56 ? 0 : r < 0.7 ? 2 : r < 0.8 ? 4 : r < 0.87 ? 1 : r < 0.93 ? 3 : 5;
    const s1 = (rand() * 2 - 1) * hi; const s2 = (rand() * 2 - 1) * hi;
    let hp;
    if (wall === 0) {
      const g = rand() < 0.6 ? 0.38 : 1;
      const gy = IMPACT.v + (s1 - IMPACT.v) * g * Math.sqrt(rand()); const gz = -IMPACT.u + (s2 + IMPACT.u) * g * Math.sqrt(rand());
      hp = [hi, Math.max(-hi, Math.min(hi, gy)), Math.max(-hi, Math.min(hi, gz))];
    } else if (wall === 1) hp = [-hi, s1, s2];
    else if (wall === 2) hp = [s1, s2, hi];
    else if (wall === 3) hp = [s1, s2, -hi];
    else if (wall === 4) hp = [s1, -hi, s2];
    else hp = [s1 * 0.8, s2 * 0.8, (rand() * 2 - 1) * hi * 0.8];
    // distance from the impact on the impact wall (face u = −local z, v = local y); other walls rank behind
    const dHole = wall === 0 ? Math.hypot(hp[1] - IMPACT.v, -hp[2] - IMPACT.u) : 2 + rand() * 3;
    homes.push({ hp, wall, dHole, seed: rand(), r2: rand(), r3: rand() });
  }
  // the 700 who leave: everyone near the hole first (nobody is left floating where the glass was), then others
  const byHole = homes.map((x, i) => i).sort((i, j) => homes[i].dHole - homes[j].dHole);
  const leakRank = new Map(byHole.slice(0, LEAKERS).map((i, k) => [i, k]));
  for (let a = 0; a < AGENTS; a++) {
    const { hp, wall, seed, r2, r3 } = homes[a];
    aHome.set(hp, a * 3);
    const k = leakRank.get(a);
    const leaks = k !== undefined;
    const route = leaks ? k % curves.length : -1;
    const delay = leaks ? (k / LEAKERS) * 0.26 + (wall === 0 ? 0 : 0.02) * r2 : 0;
    const endU = leaks ? 0.55 + 0.45 * r3 : 0;
    aInfo.set([seed, delay, route, endU], a * 4);
  }
  iGeo.setAttribute('aHome', new THREE.InstancedBufferAttribute(aHome, 3));
  iGeo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(aInfo, 4));
  iGeo.instanceCount = AGENTS;
  const cubeMat = new THREE.Matrix4().compose(CUBE.c, new THREE.Quaternion().setFromAxisAngle(Y, CUBE.yaw), one);
  const agentU = {
    uTime: { value: 0 }, uLeak: { value: 0 }, uPress: { value: 0 }, uHalf: { value: h }, uCubeMat: { value: cubeMat }, uImpact: { value: new THREE.Vector2(IMPACT.v, -IMPACT.u) },
    uCurves: { value: curveTex }, uCurveSize: { value: new THREE.Vector2(256, curves.length) },
    uCol: { value: new THREE.Color(4.2, 0.75, 0.28) }, uHot: { value: new THREE.Color(5.0, 1.5, 0.55) },
  };
  const agents = new THREE.Mesh(iGeo, new THREE.ShaderMaterial({ uniforms: agentU, vertexShader: AGENT_VERT, fragmentShader: AGENT_FRAG }));
  agents.frustumCulled = false;
  world.add(agents);
  world.track(ag);

  // ---------- shard motion: fall with weight, bounce once, settle flat ----------
  const G = 9.81;
  const qa = new THREE.Quaternion(); const qFlat = new THREE.Quaternion(); const tmp = new THREE.Vector3();
  function placeShards(t) {
    for (const s of shards) {
      if (!s.falls || t <= s.td) { s.m.position.copy(s.home); s.m.quaternion.copy(faceQ); s.m.visible = true; continue; }
      const tau = t - s.td;
      const yFloor = 0.012;
      // time to reach the floor from the home height
      const y0 = s.home.y - yFloor - 0.02;
      const vy = s.v0.y;
      const tHit = (vy + Math.sqrt(vy * vy + 2 * G * y0)) / G;
      qFlat.setFromAxisAngle(tmp.set(1, 0, 0), -Math.PI / 2).premultiply(qa.setFromAxisAngle(Y, s.yawEnd));
      if (tau < tHit) {
        s.m.position.copy(s.home).addScaledVector(s.v0, tau);
        s.m.position.y = s.home.y + vy * tau - 0.5 * G * tau * tau;
        qa.setFromAxisAngle(s.axis, s.spin * tau);
        s.m.quaternion.copy(faceQ).premultiply(qa);
      } else {
        const after = tau - tHit;
        const hx = s.home.x + s.v0.x * tHit; const hz = s.home.z + s.v0.z * tHit;
        const vImp = vy - G * tHit;
        const vb = -vImp * 0.22;
        const tb = (2 * vb) / G;
        const slide = Math.min(after, 0.45);
        const ease = 1 - Math.pow(1 - slide / 0.45, 2);
        s.m.position.set(hx + s.v0.x * 0.35 * ease * 0.45, yFloor + 0.011 + (after < tb ? vb * after - 0.5 * G * after * after : 0), hz + s.v0.z * 0.35 * ease * 0.45);
        qa.setFromAxisAngle(s.axis, s.spin * tHit + s.spin * 0.3 * Math.min(after, tb));
        const qq = new THREE.Quaternion().copy(faceQ).premultiply(qa);
        s.m.quaternion.copy(qq.slerp(qFlat, Math.min(1, after / 0.35)));
      }
    }
  }
  placeShards(0);

  return {
    world, floorU, ledU, agentU, glassU: glass.uniforms, glow, traces, flash, traceCool, traceHot, cracksIn, cracksOut, dIn, dOut, shards, placeShards, crackCol,
    update(time) { agentU.uTime.value = time; ledU.uTime.value = time; floorU.uTime.value = time; },
  };
}
