// grid-earth (gl-2): ONE world for `power` and `brazil`, so the camera carries across the cut.
// A point-cloud Earth (Natural Earth land mask) with the PJM footprint as a lattice of warm grid lights,
// data-centre blocks that pulse while the grid feeds them, a contiguous region that goes dark, chip-flow
// arcs leaving the US, gates that hold the arcs to Brazil (and the four Asian countries in the same rule),
// and two light pillars for where the compute sits (US 72 : China 10, heights to scale).
// Each scene builds its own instance (buildGridEarth) and drives it through `api` (uniforms + poses).
import * as THREE from 'three';
import { gsap } from 'gsap';
import { landAt } from './land-mask.js';
import { fatLines, curveTexture, CURVE_GLSL, POINT_FRAG, pointScale } from './gl2-kit.js';

export const R = 10;
const D2R = Math.PI / 180;

export function ll(lat, lon, r = R, out = new THREE.Vector3()) {
  const la = lat * D2R;
  const lo = lon * D2R;
  return out.set(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
}

// PJM footprint, approximate (lon, lat): northern Illinois to New Jersey, down to Virginia.
const PJM = [
  [-89.7, 42.4], [-87.6, 42.4], [-87.6, 41.6], [-84.8, 41.7], [-83.4, 41.7], [-81.2, 41.9], [-79.8, 42.4], [-75.3, 42.0],
  [-74.7, 41.3], [-73.95, 40.85], [-74.0, 40.0], [-74.9, 38.9], [-75.1, 38.4], [-75.6, 37.6], [-75.9, 36.5], [-77.3, 35.9],
  [-80.0, 36.5], [-83.7, 36.6], [-84.6, 37.6], [-84.8, 39.1], [-86.0, 40.4], [-87.5, 41.0], [-89.7, 41.1],
];
function inPoly(lon, lat, poly = PJM) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// Load centres inside PJM (lat, lon, weight).
const CITIES = [
  [41.88, -87.63, 1.0], [39.95, -75.17, 0.9], [38.9, -77.03, 0.85], [39.29, -76.61, 0.7], [40.44, -80.0, 0.6], [41.5, -81.69, 0.6],
  [39.96, -83.0, 0.55], [39.1, -84.51, 0.5], [37.54, -77.44, 0.45], [40.73, -74.17, 0.8], [36.85, -76.29, 0.4], [40.27, -76.88, 0.35],
  [41.08, -81.52, 0.3], [39.76, -84.19, 0.3], [38.35, -81.63, 0.25], [40.6, -75.47, 0.3], [41.41, -75.66, 0.25],
];
// Data-centre clusters (lat, lon, blocks): Northern Virginia, Columbus, Chicago, New Jersey, Richmond, Pittsburgh.
const DCS = [[39.02, -77.5, 10], [40.05, -82.9, 4], [41.85, -88.0, 4], [40.35, -74.65, 3], [37.45, -77.55, 3], [40.5, -80.2, 2]];

// Chip-flow arcs from the US: origins (Arizona, California, Texas) and destinations; gate: 'br' or 'asia'.
const ORIGINS = [[33.4, -112.1], [37.4, -121.9], [32.9, -97.0]];
const DESTS = [
  { at: [-23.55, -46.63], gate: 'br' }, { at: [-22.9, -43.2], gate: 'br' }, { at: [-3.73, -38.5], gate: 'br' },
  { at: [-6.2, 106.8], gate: 'asia' }, { at: [3.14, 101.69], gate: 'asia' }, { at: [1.35, 103.82], gate: 'asia' }, { at: [13.75, 100.5], gate: 'asia' },
  { at: [19.43, -99.13] }, { at: [4.71, -74.07] }, { at: [-33.45, -70.67] }, { at: [50.11, 8.68] }, { at: [51.5, -0.12] },
  { at: [53.35, -6.26] }, { at: [24.45, 54.38] }, { at: [24.71, 46.68] }, { at: [19.08, 72.88] }, { at: [35.68, 139.69] },
  { at: [37.57, 126.98] }, { at: [-33.87, 151.21] }, { at: [43.65, -79.38] }, { at: [59.33, 18.07] }, { at: [48.86, 2.35] },
];

// Globe orientations (group rotation x = lat, y = −lon brings that point to face +z).
export const FACE = {
  pjm: { lat: 39.6, lon: -80.6 },
  pullback: { lat: 24, lon: -78 },
  latam: { lat: -12, lon: -62 },
  north: { lat: 58, lon: 2 },
};

// Camera per step for power: target on the surface (PJM faces +z, east = +x, north = +y), looking north.
// brazil starts from POWER_SHOTS[3] and pulls back to BRAZIL_SHOTS[0]: the camera carries across the cut.
export const POWER_SHOTS = [
  { azimuth: 0, polar: 138, radius: 4.6, tx: -0.55, ty: 0.25, tz: 10 },
  { azimuth: -6, polar: 138, radius: 3.0, tx: -0.3, ty: 0.15, tz: 10 },
  { azimuth: -4, polar: 136, radius: 3.3, tx: -0.32, ty: 0.15, tz: 10 },
  { azimuth: 12, polar: 148, radius: 1.9, tx: 0.1, ty: 0.0, tz: 10 },
];
export const BRAZIL_SHOTS = [
  { azimuth: 0, polar: 90, radius: 40, tx: -6.5, ty: -1, tz: 0 },
  { azimuth: 0, polar: 90, radius: 38, tx: -8.2, ty: 0, tz: 0 },
  { azimuth: 0, polar: 90, radius: 56, tx: -5.4, ty: -0.4, tz: 0 },
  { azimuth: 0, polar: 90, radius: 66, tx: 0, ty: -0.4, tz: 0 },
];
// s2 looks down on the North Pole: the US upper right, China lower left, both pillars in near-profile.
export const BRAZIL_FACES = [{ lat: 26, lon: -80 }, { lat: -10, lon: -62 }, { lat: 90, lon: -232 }, { lat: 90, lon: -232 }];

export function buildGridEarth({ makeWorld, H, seed = 'grid-earth', post }) {
  const rand = H.seeded(seed);
  const world = makeWorld({ fog: null, fov: 30, near: 0.05, far: 300, post: post || { bloom: { intensity: 1.1, threshold: 0.58, smoothing: 0.3, radius: 0.8 }, vignette: { offset: 0.3, darkness: 0.6 } } });
  const earth = new THREE.Group();
  world.add(earth);
  const tmp = new THREE.Vector3();

  // ---------- body, rim, atmosphere ----------
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.ShaderMaterial({
    uniforms: { uBase: { value: new THREE.Color('#05080C') }, uRim: { value: H.color('accent', 0.2) }, uRimAmt: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase, uRim; uniform float uRimAmt; varying vec3 vN; varying vec3 vV;
      void main() { float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.5); gl_FragColor = vec4(uBase + uRim * f * uRimAmt, 1.0); }`,
  }));
  body.renderOrder = -2;
  earth.add(body);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 96, 64), new THREE.ShaderMaterial({
    uniforms: { uCol: { value: H.color('accent', 1.0) }, uAmt: { value: 1 } },
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCol; uniform float uAmt; varying vec3 vN; varying vec3 vV;
      void main() { float d = dot(normalize(vN), normalize(vV)); float f = pow(clamp(1.0 + d * 1.0, 0.0, 1.0), 9.0); gl_FragColor = vec4(uCol, f * 0.38 * uAmt); }`,
  }));
  earth.add(atmo);

  // ---------- land dots (Fibonacci sphere ∩ mask) ----------
  const N = 140000;
  const lp = [];
  const lc = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N;
    const lat = Math.asin(y) / D2R;
    const lon = ((((i * ga) / D2R) % 360) + 540) % 360 - 180;
    const code = landAt(lat, lon);
    if (!code) continue;
    if (code === 2 && inPoly(lon, lat)) continue; // PJM is drawn by its own lights
    ll(lat, lon, R * 1.0015, tmp);
    lp.push(tmp.x, tmp.y, tmp.z);
    lc.push(code);
  }
  const landGeo = new THREE.BufferGeometry();
  landGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  landGeo.setAttribute('aCode', new THREE.Float32BufferAttribute(lc, 1));
  const landU = {
    uScale: { value: 1000 }, uPx: { value: 1 }, uSize: { value: 0.05 }, uMaxPx: { value: 4.5 },
    uBase: { value: H.color('lightSoft', 0.74) }, uUS: { value: H.color('light', 0.9) }, uBR: { value: H.color('limit', 2.1) },
    uLatam: { value: H.color('light', 1.0) }, uCN: { value: H.color('light', 0.9) }, uAsia: { value: H.color('limit', 1.6) },
    uW: { value: new THREE.Vector4(0, 0, 0, 0) }, // US, Brazil, rest of LatAm, Asia4 highlight weights
    uWCN: { value: 0 }, uAlpha: { value: 1 }, uCenter: { value: new THREE.Vector3() },
  };
  const land = new THREE.Points(landGeo, new THREE.ShaderMaterial({
    uniforms: landU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aCode;
      uniform float uScale, uPx, uSize, uMaxPx, uAlpha, uWCN; uniform vec3 uBase, uUS, uBR, uLatam, uCN, uAsia, uCenter; uniform vec4 uW;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 n = normalize(w.xyz - uCenter);
        vec3 v = normalize(cameraPosition - w.xyz);
        float facing = dot(n, v);
        vec3 c = uBase;
        if (aCode > 1.5 && aCode < 2.5) c = mix(c, uUS, uW.x);
        else if (aCode > 2.5 && aCode < 3.5) c = mix(c, uBR, uW.y);
        else if (aCode > 3.5 && aCode < 4.5) c = mix(c, uCN, uWCN);
        else if (aCode > 4.5 && aCode < 5.5) c = mix(c, uLatam, uW.z);
        else if (aCode > 5.5) c = mix(c, uAsia, uW.w);
        vec4 mv = viewMatrix * w;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uSize * uScale / max(0.001, -mv.z), 2.0 * uPx, uMaxPx * uPx);
        vColor = c;
        vAlpha = uAlpha * smoothstep(0.0, 0.22, facing);
      }`,
    fragmentShader: POINT_FRAG,
  }));
  land.frustumCulled = false;
  pointScale(land, landU);
  earth.add(land);

  // ---------- PJM lattice: lights, links, dark region ----------
  const bb = { lon0: -90, lon1: -73.8, lat0: 35.8, lat1: 42.5 };
  const lights = [];
  const NL = 6200;
  let guard = 0;
  while (lights.length < NL && guard++ < 200000) {
    let lat;
    let lon;
    if (rand() < 0.5) {
      lat = bb.lat0 + rand() * (bb.lat1 - bb.lat0);
      lon = bb.lon0 + rand() * (bb.lon1 - bb.lon0);
    } else {
      let tw = 0;
      CITIES.forEach((c) => { tw += c[2]; });
      let pick = rand() * tw;
      let city = CITIES[0];
      for (const c of CITIES) { pick -= c[2]; if (pick <= 0) { city = c; break; } }
      const g1 = Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
      const g2 = Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
      const s = 0.18 + 0.32 * city[2];
      lat = city[0] + g1 * s * 0.75;
      lon = city[1] + g2 * s;
    }
    if (!inPoly(lon, lat) || !landAt(lat, lon)) continue;
    lights.push([lat, lon]);
  }
  // Dark region: the share of lights equal to the shortfall's share of the reliability requirement.
  const DARK_C = [39.85, -79.0];
  const darkShare = 6831 / (138318 + 6831); // pjm-shortfall: 6,831 MW short of 145,149 MW required
  const dist = lights.map(([la, lo]) => Math.hypot(la - DARK_C[0], (lo - DARK_C[1]) * Math.cos(39.8 * D2R)));
  const order = dist.map((d, i) => i).sort((a, b) => dist[a] - dist[b]);
  const nDark = Math.round(lights.length * darkShare);
  const darkRank = new Float32Array(lights.length).fill(2);
  order.slice(0, nDark).forEach((idx, k) => { darkRank[idx] = (k / nDark) * 0.85 + rand() * 0.15; });
  const darkRadius = dist[order[nDark - 1]];

  const pl = new Float32Array(lights.length * 3);
  const pw = new Float32Array(lights.length);
  const ps = new Float32Array(lights.length);
  lights.forEach(([la, lo], i) => {
    ll(la, lo, R * 1.0025, tmp);
    pl[i * 3] = tmp.x; pl[i * 3 + 1] = tmp.y; pl[i * 3 + 2] = tmp.z;
    pw[i] = rand();
    ps[i] = 0.6 + rand() * 0.8;
  });
  const lightGeo = new THREE.BufferGeometry();
  lightGeo.setAttribute('position', new THREE.BufferAttribute(pl, 3));
  lightGeo.setAttribute('aWarm', new THREE.BufferAttribute(pw, 1));
  lightGeo.setAttribute('aSize', new THREE.BufferAttribute(ps, 1));
  lightGeo.setAttribute('aDark', new THREE.BufferAttribute(darkRank, 1));
  const lightU = {
    uScale: { value: 1000 }, uPx: { value: 1 }, uSize: { value: 0.016 }, uMaxPx: { value: 9 }, uDark: { value: 0 }, uAlpha: { value: 1 },
    uA: { value: H.color('limit', 1.7) }, uB: { value: H.color('caution', 1.5) }, uCenter: { value: new THREE.Vector3() },
  };
  const pjmLights = new THREE.Points(lightGeo, new THREE.ShaderMaterial({
    uniforms: lightU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aWarm, aSize, aDark;
      uniform float uScale, uPx, uSize, uMaxPx, uDark, uAlpha; uniform vec3 uA, uB, uCenter;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        float facing = dot(normalize(w.xyz - uCenter), normalize(cameraPosition - w.xyz));
        vec4 mv = viewMatrix * w;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uSize * aSize * uScale / max(0.001, -mv.z), 2.0 * uPx, uMaxPx * uPx);
        float off = smoothstep(aDark, aDark + 0.06, uDark);
        vColor = mix(uA, uB, aWarm);
        vAlpha = uAlpha * (1.0 - off * 0.97) * smoothstep(0.0, 0.2, facing);
      }`,
    fragmentShader: POINT_FRAG,
  }));
  pjmLights.frustumCulled = false;
  pointScale(pjmLights, lightU);
  earth.add(pjmLights);

  // Lattice: jittered grid nodes inside PJM, links to right and upper neighbours.
  const DX = 0.5;
  const DY = 0.4;
  const nodes = new Map();
  const nodeList = [];
  for (let j = 0; j * DY + bb.lat0 <= bb.lat1; j++) {
    for (let i = 0; i * DX + bb.lon0 <= bb.lon1; i++) {
      const lat = bb.lat0 + j * DY + (rand() - 0.5) * 0.16;
      const lon = bb.lon0 + i * DX + (rand() - 0.5) * 0.2;
      if (!inPoly(lon, lat) || !landAt(lat, lon)) continue;
      const n = { i, j, lat, lon, p: ll(lat, lon, R * 1.002) };
      nodes.set(`${i},${j}`, n);
      nodeList.push(n);
    }
  }
  const inDark = (n) => Math.hypot(n.lat - DARK_C[0], (n.lon - DARK_C[1]) * Math.cos(39.8 * D2R)) < darkRadius;
  const linkLit = [];
  const linkDark = [];
  nodeList.forEach((n) => {
    for (const [di, dj] of [[1, 0], [0, 1]]) {
      const m = nodes.get(`${n.i + di},${n.j + dj}`);
      if (!m) continue;
      const arr = inDark(n) || inDark(m) ? linkDark : linkLit;
      arr.push(n.p.x, n.p.y, n.p.z, m.p.x, m.p.y, m.p.z);
    }
  });
  const links = fatLines({ positions: linkLit, width: 2, color: H.color('limit', 0.42) });
  const linksDark = fatLines({ positions: linkDark, width: 2, color: H.color('limit', 0.42) });
  earth.add(links, linksDark);

  // Data-centre blocks: instanced boxes standing on the surface, pulsing while fed.
  const dcList = [];
  DCS.forEach(([la, lo, n]) => {
    for (let k = 0; k < n; k++) {
      const col = k % 5;
      const row = Math.floor(k / 5);
      dcList.push({ lat: la + (row - 0.5) * 0.32 + (rand() - 0.5) * 0.05, lon: lo + (col - 2) * 0.36 + (rand() - 0.5) * 0.06, h: 0.03 + rand() * 0.03, ph: rand() * 6.28 });
    }
  });
  const dcGeo = new THREE.BoxGeometry(0.05, 1, 0.03).translate(0, 0.5, 0);
  const dcPhase = new Float32Array(dcList.length);
  const dcU = { uTime: { value: 0 }, uHungry: { value: 0 }, uMoney: { value: 0 }, uBody: { value: new THREE.Color('#141B25') }, uWarm: { value: H.color('limit', 2.2) }, uGold: { value: H.color('caution', 3.0) } };
  const dcs = new THREE.InstancedMesh(dcGeo, new THREE.ShaderMaterial({
    uniforms: dcU,
    vertexShader: /* glsl */ `
      attribute float aPhase;
      uniform float uTime, uHungry;
      varying vec3 vN; varying float vY; varying float vPulse;
      void main() {
        mat4 m = modelMatrix * instanceMatrix;
        vN = normalize(mat3(m) * normal);
        vY = position.y;
        vPulse = uHungry * (0.55 + 0.45 * sin(uTime * 2.4 + aPhase));
        gl_Position = projectionMatrix * viewMatrix * m * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBody, uWarm, uGold; uniform float uMoney;
      varying vec3 vN; varying float vY; varying float vPulse;
      void main() {
        vec3 hot = mix(uWarm, uGold, uMoney);
        float side = 1.0 - abs(vN.y);
        vec3 col = uBody * (0.5 + 0.5 * max(vN.z, 0.0));
        col += hot * (0.12 + 0.5 * vPulse) * vY * vY * 0.3 * side;
        col += hot * smoothstep(0.9, 1.0, vY) * (0.6 + 1.2 * vPulse);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }), dcList.length);
  {
    const m4 = new THREE.Matrix4();
    const up = new THREE.Vector3();
    const east = new THREE.Vector3();
    const north = new THREE.Vector3();
    const basis = new THREE.Matrix4();
    const scl = new THREE.Matrix4();
    dcList.forEach((d, i) => {
      const p = ll(d.lat, d.lon, R * 1.0005);
      up.copy(p).normalize();
      east.set(Math.cos(d.lon * D2R), 0, -Math.sin(d.lon * D2R));
      north.crossVectors(up, east).normalize();
      basis.makeBasis(east, up, north);
      scl.makeScale(1, d.h, 1);
      m4.copy(basis).multiply(scl).setPosition(p);
      dcs.setMatrixAt(i, m4);
      dcPhase[i] = d.ph;
    });
  }
  dcGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(dcPhase, 1));
  dcs.frustumCulled = false;
  earth.add(dcs);

  // Power flows along the lattice: 38.2 % of the routes end at data-centre clusters.
  const sinksDC = DCS.map(([la, lo]) => nearestNode(la, lo));
  const sinksCity = CITIES.slice(0, 12).map(([la, lo]) => nearestNode(la, lo));
  function nearestNode(la, lo) {
    let best = null;
    let bd = 1e9;
    for (const n of nodeList) {
      const d = Math.hypot(n.lat - la, n.lon - lo);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  function route(a, b) {
    const pts = [a];
    let { i, j } = a;
    const step = (di, dj) => { const n = nodes.get(`${i + di},${j + dj}`); if (!n) return false; i += di; j += dj; pts.push(n); return true; };
    let guardR = 0;
    while ((i !== b.i || j !== b.j) && guardR++ < 200) {
      const preferX = rand() < 0.5;
      const sx = Math.sign(b.i - i);
      const sy = Math.sign(b.j - j);
      if (preferX && sx && step(sx, 0)) continue;
      if (sy && step(0, sy)) continue;
      if (sx && step(sx, 0)) continue;
      return null;
    }
    return pts.length > 3 ? pts : null;
  }
  const flowCurves = [];
  const flowIsDC = [];
  const NFLOW = 55;
  const nDC = Math.round(NFLOW * 0.382); // pjm-datacentre-382: 38.2 % of capacity charges from data-centre load
  let tries = 0;
  while (flowCurves.length < NFLOW && tries++ < 3000) {
    const toDC = flowCurves.length < nDC;
    const sink = toDC ? sinksDC[flowCurves.length % sinksDC.length] : sinksCity[flowCurves.length % sinksCity.length];
    const src = nodeList[Math.floor(rand() * nodeList.length)];
    if (!sink || src === sink) continue;
    const pts = route(src, sink);
    if (!pts) continue;
    const path = new THREE.CurvePath();
    for (let k = 0; k < pts.length - 1; k++) path.add(new THREE.LineCurve3(ll(pts[k].lat, pts[k].lon, R * 1.004), ll(pts[k + 1].lat, pts[k + 1].lon, R * 1.004)));
    flowCurves.push(path);
    flowIsDC.push(toDC ? 1 : 0);
  }
  const flowTex = curveTexture(flowCurves, 160);
  world.track(flowTex);
  const flowPts = flowPoints({
    H, tex: flowTex, rows: flowCurves.length, rowClass: flowIsDC, perRow: 26, trail: 4, trailStep: 0.012, speed: [0.05, 0.09], size: 0.013,
    colA: H.color('light', 1.5), colB: H.color('caution', 2.6), seed: `${seed}-flow`, maxPx: 7,
    dark: { u: lightU.uDark, c: ll(DARK_C[0], DARK_C[1], R * 1.004), r: R * darkRadius * D2R },
  });
  earth.add(flowPts.points);

  // ---------- chip-flow arcs ----------
  const arcCurves = [];
  const arcGate = [];
  const gateRings = [];
  DESTS.forEach((d, di) => {
    const o = ORIGINS[di % ORIGINS.length];
    const a = ll(o[0], o[1], 1);
    const b = ll(d.at[0], d.at[1], 1);
    const ang = a.angleTo(b);
    const lift = 0.03 + ang * 0.085;
    const pts = [];
    for (let k = 0; k <= 48; k++) {
      const t = k / 48;
      const p = slerp(a, b, t, ang).multiplyScalar(R * (1.003 + lift * Math.sin(Math.PI * t)));
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    arcCurves.push(curve);
    let gateU = 2;
    if (d.gate) {
      const want = d.gate === 'br' ? 3 : 6;
      gateU = 0.92;
      for (let k = 4; k <= 196; k++) {
        const q = slerp(a, b, k / 200, ang);
        const la = Math.asin(Math.max(-1, Math.min(1, q.y))) / D2R;
        const lo = Math.atan2(q.x, q.z) / D2R;
        if (landAt(la, lo) === want) { gateU = Math.max(0.3, k / 200 - 0.025); break; }
      }
    }
    arcGate.push(gateU);
    if (d.gate) gateRings.push({ curve, u: gateU, gate: d.gate });
  });
  const arcTex = curveTexture(arcCurves, 160);
  world.track(arcTex);
  const arcPts = flowPoints({
    H, tex: arcTex, rows: arcCurves.length, rowGate: arcGate, perRow: 40, trail: 5, trailStep: 0.007, speed: [0.05, 0.09], size: 0.1,
    colA: H.color('accent', 2.4), colB: H.color('accent', 2.4), colHeld: H.color('alert', 2.6), seed: `${seed}-arcs`, maxPx: 11, hold: 0.6,
  });
  earth.add(arcPts.points);
  const arcLineSegs = [];
  arcCurves.forEach((c) => {
    const pts = c.getSpacedPoints(64);
    for (let k = 0; k < pts.length - 1; k++) arcLineSegs.push(pts[k].x, pts[k].y, pts[k].z, pts[k + 1].x, pts[k + 1].y, pts[k + 1].z);
  });
  const arcLines = fatLines({ positions: arcLineSegs, width: 2, color: H.color('accent', 0.42), opacity: 0 });
  earth.add(arcLines);
  const ringSegs = [];
  const tng = new THREE.Vector3();
  const ax1 = new THREE.Vector3();
  const ax2 = new THREE.Vector3();
  gateRings.forEach(({ curve, u }) => {
    const c = curve.getPointAt(u);
    curve.getTangentAt(u, tng).normalize();
    ax1.copy(c).normalize().cross(tng).normalize();
    ax2.crossVectors(tng, ax1).normalize();
    const rr = 0.42;
    for (let k = 0; k < 40; k++) {
      const a0 = (k / 40) * Math.PI * 2;
      const a1 = ((k + 1) / 40) * Math.PI * 2;
      const p0 = c.clone().addScaledVector(ax1, Math.cos(a0) * rr).addScaledVector(ax2, Math.sin(a0) * rr);
      const p1 = c.clone().addScaledVector(ax1, Math.cos(a1) * rr).addScaledVector(ax2, Math.sin(a1) * rr);
      ringSegs.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
    }
  });
  const gates = fatLines({ positions: ringSegs, width: 4, color: H.color('alert', 1.7), opacity: 0 });
  earth.add(gates);

  // ---------- compute pillars (US 72 : China ~10), heights to scale ----------
  const pillarU = { uCol: { value: H.color('accent', 3.2) }, uAmt: { value: 0 } };
  const pillarMat = new THREE.ShaderMaterial({
    uniforms: pillarU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `varying float vY; varying vec3 vN; varying vec3 vV;
      void main() { vY = uv.y; vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `uniform vec3 uCol; uniform float uAmt; varying float vY; varying vec3 vN; varying vec3 vV;
      void main() { float core = pow(abs(dot(normalize(vN), normalize(vV))), 2.0); float grow = step(vY, uAmt);
        float a = (1.0 - 0.6 * vY) * core * grow; gl_FragColor = vec4(uCol, a); }`,
  });
  const pillars = [];
  [[38.5, -97.5, 72], [34.5, 104.0, 10]].forEach(([la, lo, share]) => {
    const h = share * 0.085;
    const geo = new THREE.CylinderGeometry(0.24, 0.24, h, 32, 1, true).translate(0, h / 2, 0);
    const m = new THREE.Mesh(geo, pillarMat);
    const p = ll(la, lo, R);
    m.position.copy(p);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
    m.visible = true;
    earth.add(m);
    pillars.push(m);
  });

  // ---------- star dust ----------
  const stars = world.add(H.particles({ count: 1600, spread: [260, 160, 120], center: [0, 0, -90], size: 0.22, colors: ['lightSoft', 'light'], intensity: 0.5, drift: 0, seed: `${seed}-stars` }));

  // ---------- api ----------
  const U = {
    dark: lightU.uDark, hungry: dcU.uHungry, money: dcU.uMoney, flowB: flowPts.uniforms.uMixB, flowDimA: flowPts.uniforms.uDimA,
    flowAlpha: flowPts.uniforms.uAlpha, arcAlpha: arcPts.uniforms.uAlpha, gate: arcPts.uniforms.uGate, landW: landU.uW, landWCN: landU.uWCN,
    landAlpha: landU.uAlpha, lightsAlpha: lightU.uAlpha, pillar: pillarU.uAmt, rim: atmo.material.uniforms.uAmt,
  };
  const linkMats = { lit: links.material, dark: linksDark.material, arcs: arcLines.material, gates: gates.material };
  const rot = { lat: FACE.pjm.lat, lon: FACE.pjm.lon };
  function applyRot() { earth.rotation.set(rot.lat * D2R, -rot.lon * D2R, 0); earth.updateMatrixWorld(); }
  applyRot();
  function face(f, { duration = 0, ease = 'power3.inOut' } = {}) {
    if (!duration) { rot.lat = f.lat; rot.lon = f.lon; applyRot(); return gsap.timeline(); }
    return gsap.to(rot, { lat: f.lat, lon: f.lon, duration, ease, onUpdate: applyRot });
  }

  return {
    world, earth, U, linkMats, rot, face, applyRot, pillars,
    update(time) {
      dcU.uTime.value = time;
      flowPts.uniforms.uTime.value = time;
      arcPts.uniforms.uTime.value = time;
    },
    kill() { gsap.killTweensOf(rot); Object.values(U).forEach((u) => gsap.killTweensOf(u)); Object.values(linkMats).forEach((m) => gsap.killTweensOf(m)); },
    stars,
  };
}

function slerp(a, b, t, ang) {
  const s = Math.sin(ang);
  if (s < 1e-6) return a.clone();
  const wa = Math.sin((1 - t) * ang) / s;
  const wb = Math.sin(t * ang) / s;
  return new THREE.Vector3(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb);
}

// GPU particles along baked curves. Class 1 rows can tint toward colB (uMixB); class 0 dims with uDimA.
// Gated rows (rowGate < 1) stop at their gate when uGate = 1 and pile up there in colHeld.
function flowPoints({ H, tex, rows, rowClass = null, rowGate = null, perRow = 30, trail = 4, trailStep = 0.01, speed = [0.05, 0.1], size = 0.02, colA, colB, colHeld = null, seed, maxPx = 8, hold = 0, dark = null }) {
  const rand = H.seeded(seed);
  const n = rows * perRow * trail;
  const aRow = new Float32Array(n);
  const aOff = new Float32Array(n);
  const aSpd = new Float32Array(n);
  const aTr = new Float32Array(n);
  const aCls = new Float32Array(n);
  const aGate = new Float32Array(n);
  const aSeed = new Float32Array(n);
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let p = 0; p < perRow; p++) {
      const off = rand();
      const spd = speed[0] + rand() * (speed[1] - speed[0]);
      const sd = rand();
      for (let t = 0; t < trail; t++) {
        aRow[k] = r; aOff[k] = off; aSpd[k] = spd; aTr[k] = t; aSeed[k] = sd;
        aCls[k] = rowClass ? rowClass[r] : 0;
        aGate[k] = rowGate ? rowGate[r] : 2;
        k++;
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aRow', new THREE.BufferAttribute(aRow, 1));
  geo.setAttribute('aOff', new THREE.BufferAttribute(aOff, 1));
  geo.setAttribute('aSpd', new THREE.BufferAttribute(aSpd, 1));
  geo.setAttribute('aTr', new THREE.BufferAttribute(aTr, 1));
  geo.setAttribute('aCls', new THREE.BufferAttribute(aCls, 1));
  geo.setAttribute('aGate', new THREE.BufferAttribute(aGate, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  const uniforms = {
    uTime: { value: 0 }, uScale: { value: 1000 }, uPx: { value: 1 }, uSize: { value: size }, uMaxPx: { value: maxPx },
    uCurves: { value: tex }, uCurveSize: { value: new THREE.Vector2(tex.image.width, tex.image.height) },
    uColA: { value: colA }, uColB: { value: colB }, uColHeld: { value: colHeld || colA }, uMixB: { value: 0 }, uDimA: { value: 1 },
    uAlpha: { value: 0 }, uGate: { value: 0 }, uHold: { value: hold }, uTrailStep: { value: trailStep }, uTrailN: { value: trail },
    uDark: dark ? dark.u : { value: 0 }, uDarkC: { value: dark ? dark.c : new THREE.Vector3(0, 0, 1e6) }, uDarkR: { value: dark ? dark.r : 0 },
  };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aRow, aOff, aSpd, aTr, aCls, aGate, aSeed;
      uniform float uTime, uScale, uPx, uSize, uMaxPx, uMixB, uDimA, uAlpha, uGate, uHold, uTrailStep, uTrailN, uDark, uDarkR;
      uniform vec3 uColA, uColB, uColHeld, uDarkC;
      varying vec3 vColor; varying float vAlpha;
      ${CURVE_GLSL}
      void main() {
        float cyc = fract(aOff + uTime * aSpd);
        float span = 1.0 + uHold;
        float u = cyc * span - aTr * uTrailStep;
        float gateU = mix(2.0, aGate, uGate);
        float held = step(gateU, u);
        float uu = held > 0.5 ? gateU - aSeed * 0.035 : u;
        vec3 p = curveAt(aRow, uu);
        float a = smoothstep(0.0, 0.03, u) * (1.0 - smoothstep(0.97, 1.0, u));
        a = held > 0.5 ? (aTr < 0.5 ? 1.0 - smoothstep(gateU + uHold * 0.6, gateU + uHold, u) : 0.0) : a;
        a *= (1.0 - aTr / uTrailN);
        a *= mix(uDimA, 1.0, aCls);
        if (uDarkR > 0.0) a *= 1.0 - uDark * 0.95 * (1.0 - smoothstep(uDarkR * 0.8, uDarkR * 1.05, distance(p, uDarkC)));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float sz = uSize * (1.0 - 0.45 * aTr / uTrailN) * (1.0 + held * 1.3);
        gl_PointSize = clamp(sz * uScale / max(0.001, -mv.z), 2.0 * uPx, uMaxPx * uPx);
        vec3 c = mix(uColA, uColB, aCls * uMixB);
        vColor = mix(c, uColHeld, held);
        vAlpha = a * uAlpha;
      }`,
    fragmentShader: POINT_FRAG,
  }));
  points.frustumCulled = false;
  pointScale(points, uniforms);
  return { points, uniforms };
}
