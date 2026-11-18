// breach (gl-2): a glass sandbox holding 1,200 red-orange agents (METR's coordinating count); the +x wall
// cracks from one impact point and opens; 700 agents (METR: joined the attack) leak along network traces
// on the floor to three distant clusters, which turn red rack by rack while a date clock runs 9 → 13 Jul
// (the intrusion window in facts.json). Numbers land on a left scrim; the motive closes on calm.
import { gsap } from 'gsap';
import * as THREE from 'three';
import { fatLines, polylineSegments, curveTexture, CURVE_GLSL, POINT_FRAG, pointScale, factsSource, provKind, place, splitFigure, croppedCard, captureInfo } from './_worlds/gl2-kit.js';

const HALF = 1.3; // sandbox half-size
const CENTER = new THREE.Vector3(0, 1.38, 0);
const IMPACT = new THREE.Vector3(0.3, 1.62, HALF); // on the front (+z) wall, facing the camera
const AGENTS = 1200; // METR: ~1,200 agents coordinating
const LEAKERS = 700; // METR: 700 joined the attack

// Clusters: centre, footprint, and the floor route that reaches each one (Manhattan trace).
const CLUSTERS = [
  { c: [4.0, 0, -12.0], route: [[1.3, 2.4], [2.9, 2.4], [2.9, -7.0], [4.0, -7.0], [4.0, -9.9]] },
  { c: [7.5, 0, -16.5], route: [[1.3, 2.62], [3.3, 2.62], [3.3, -5.0], [7.5, -5.0], [7.5, -14.4]] },
  { c: [1.0, 0, -21.0], route: [[1.3, 2.18], [2.5, 2.18], [2.5, -8.6], [1.0, -8.6], [1.0, -18.9]] },
];
const RACK_COLS = 8;
const RACK_ROWS = 4;

// Camera per step (spherical rig around a target).
const SHOTS = [
  { azimuth: 18, polar: 80, radius: 10.5, tx: -2.3, ty: 1.25, tz: 0 },
  { azimuth: 10, polar: 70, radius: 27, tx: -4.4, ty: -0.6, tz: -8 },
  { azimuth: 4, polar: 63, radius: 19, tx: 0.2, ty: -0.2, tz: -15.5 },
  { azimuth: 8, polar: 58, radius: 32, tx: -3.0, ty: -1.5, tz: -9 },
  { azimuth: 6, polar: 54, radius: 38, tx: -1.0, ty: -1.5, tz: -9 },
];

function roundedManhattan(pts, r = 0.45) {
  const path = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const isLast = i === pts.length - 2;
    const start = i === 0 ? a : a.clone().add(b.clone().sub(a).setLength(r));
    const end = isLast ? b : b.clone().sub(b.clone().sub(a).setLength(r));
    path.add(new THREE.LineCurve3(start, end));
    if (!isLast) {
      const c = pts[i + 2];
      const out = b.clone().add(c.clone().sub(b).setLength(r));
      path.add(new THREE.QuadraticBezierCurve3(end, b.clone(), out));
    }
  }
  return path;
}

export default {
  id: 'breach',
  gl: true,
  create(ctx) {
    const { root, copy, gl, components: C, renderMode, tokens } = ctx;
    const { makeWorld, helpers: H } = gl;
    const rand = H.seeded('breach');
    const fIntr = ctx.facts('hf-intrusion');
    const f13 = ctx.facts('hf-13-hours');
    const f700 = ctx.facts('metr-700-agents');
    const fMot = ctx.facts('hf-motive');

    const world = makeWorld({
      fog: { density: 0.028 },
      fov: 32,
      post: { bloom: { intensity: 1.15, threshold: 0.6, smoothing: 0.3, radius: 0.78 }, vignette: { offset: 0.3, darkness: 0.62 } },
    });
    const bgCol = new THREE.Color(tokens.colors.void);

    // ---------- floor with light pools ----------
    const floorU = {
      uBase: { value: new THREE.Color('#080B10') },
      uFog: { value: bgCol },
      uFogDensity: { value: 0.028 },
      uAgentPool: { value: 1 },
      uInfect: { value: 0 },
      uRed: { value: H.color('alert', 1) },
      uCool: { value: H.color('lightSoft', 1) },
      uCube: { value: new THREE.Vector2(CENTER.x, CENTER.z) },
      uClusters: { value: CLUSTERS.map((k) => new THREE.Vector2(k.c[0], k.c[2])) },
    };
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90).rotateX(-Math.PI / 2),
      new THREE.ShaderMaterial({
        uniforms: floorU,
        vertexShader: /* glsl */ `
          varying vec3 vW; varying float vDist;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uBase, uFog, uRed, uCool; uniform float uFogDensity, uAgentPool, uInfect;
          uniform vec2 uCube; uniform vec2 uClusters[3];
          varying vec3 vW; varying float vDist;
          void main() {
            vec3 col = uBase;
            float dc = length(vW.xz - uCube);
            col += uRed * 0.20 * uAgentPool * exp(-dc * dc / 5.0);
            for (int i = 0; i < 3; i++) {
              float d = length(vW.xz - uClusters[i]);
              float pool = exp(-d * d / 6.0);
              float hot = clamp(uInfect * 3.0 - float(i), 0.0, 1.0);
              col += mix(uCool * 0.035, uRed * 0.16, hot) * pool;
            }
            float f = 1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist);
            gl_FragColor = vec4(mix(col, uFog, f), 1.0);
          }`,
      }),
    );
    world.add(floor);

    // ---------- glass sandbox: five walls (fresnel) + the cracking +x wall ----------
    const glassMat = new THREE.ShaderMaterial({
      uniforms: { uTint: { value: H.color('light', 1) }, uOpacity: { value: 1 } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTint; uniform float uOpacity; varying vec3 vN; varying vec3 vV;
        void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0); gl_FragColor = vec4(uTint, (0.035 + 0.22 * f) * uOpacity); }`,
    });
    const hidden = new THREE.MeshBasicMaterial({ visible: false });
    const box = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2, HALF * 2, HALF * 2), [glassMat, glassMat, glassMat, glassMat, hidden, glassMat]);
    box.position.copy(CENTER);
    world.add(box);

    // Spider-web shards on the front wall: polar cells around the impact, clamped to the square.
    const K = 15; // rays
    const M = 8; // rings
    const ang = [];
    for (let k = 0; k < K; k++) ang.push(((k + (rand() - 0.5) * 0.55) / K) * Math.PI * 2);
    const ringR = [];
    for (let k = 0; k < K; k++) {
      const row = [0];
      for (let m = 1; m <= M; m++) row.push(Math.pow(m / M, 1.35) * 3.0 * (0.86 + rand() * 0.28));
      ringR.push(row);
    }
    const ix = IMPACT.x - CENTER.x;
    const iy = IMPACT.y - CENTER.y;
    const P = (k, m) => {
      const kk = k % K;
      const r = ringR[kk][m];
      let x = ix + Math.cos(ang[kk]) * r;
      let y = iy + Math.sin(ang[kk]) * r;
      x = Math.max(-HALF, Math.min(HALF, x));
      y = Math.max(-HALF, Math.min(HALF, y));
      return [x, y, HALF + 0.004];
    };
    const sPos = [];
    const sBary = [];
    const sMask = [];
    const sCen = [];
    const sDist = [];
    const sRand = [];
    const HOLE_RINGS = 3;
    for (let k = 0; k < K; k++) {
      for (let m = 0; m < M; m++) {
        const p00 = P(k, m);
        const p10 = P(k + 1, m);
        const p11 = P(k + 1, m + 1);
        const p01 = P(k, m + 1);
        const cen = [0, 1, 2].map((a) => (p00[a] + p10[a] + p11[a] + p01[a]) / 4);
        const dist = m / M;
        const detach = m < HOLE_RINGS ? (m + rand() * 0.9) / HOLE_RINGS : 2.0; // > 1: stays
        const rr = [rand(), rand(), rand()];
        const tris = [[p00, p10, p11, [1, 0, 1]], [p00, p11, p01, [1, 1, 0]]];
        for (const [a, b, c, mask] of tris) {
          [a, b, c].forEach((v, vi) => {
            sPos.push(v[0] + CENTER.x, v[1] + CENTER.y, v[2] + CENTER.z);
            sBary.push(vi === 0 ? 1 : 0, vi === 1 ? 1 : 0, vi === 2 ? 1 : 0);
            sMask.push(...mask);
            sCen.push(cen[0] + CENTER.x, cen[1] + CENTER.y, cen[2] + CENTER.z);
            sDist.push(dist, detach);
            sRand.push(...rr);
          });
        }
      }
    }
    const shardGeo = new THREE.BufferGeometry();
    shardGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
    shardGeo.setAttribute('aBary', new THREE.Float32BufferAttribute(sBary, 3));
    shardGeo.setAttribute('aMask', new THREE.Float32BufferAttribute(sMask, 3));
    shardGeo.setAttribute('aCen', new THREE.Float32BufferAttribute(sCen, 3));
    shardGeo.setAttribute('aDist', new THREE.Float32BufferAttribute(sDist, 2));
    shardGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(sRand, 3));
    const shardU = {
      uCrack: { value: 0 }, uHole: { value: 0 }, uTint: { value: H.color('light', 1) }, uCrackCol: { value: H.color('light', 2.4) },
      uPx: { value: 1 },
    };
    const shards = new THREE.Mesh(shardGeo, new THREE.ShaderMaterial({
      uniforms: shardU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aBary, aMask, aCen, aRand; attribute vec2 aDist;
        uniform float uHole;
        varying vec3 vBary, vMask; varying float vDist, vGone, vFresh;
        vec3 rot(vec3 v, vec3 ax, float a) { ax = normalize(ax); return v * cos(a) + cross(ax, v) * sin(a) + ax * dot(ax, v) * (1.0 - cos(a)); }
        void main() {
          vBary = aBary; vMask = aMask; vDist = aDist.x;
          float k = clamp((uHole - aDist.y * 0.7) / 0.3, 0.0, 1.0);
          k = 1.0 - pow(1.0 - k, 2.0);
          vec3 p = position;
          if (k > 0.0) {
            vec3 local = rot(p - aCen, aRand - 0.5, k * (2.0 + aRand.x * 3.0));
            vec3 drift = vec3((aRand.x - 0.5) * 1.6, (aRand.z - 0.5) * 1.2 - k * 1.1, 0.9 + aRand.y * 1.8) * k;
            p = aCen + local * (1.0 - 0.5 * k) + drift;
          }
          vGone = k;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uCrack; uniform vec3 uTint, uCrackCol; uniform float uPx;
        varying vec3 vBary, vMask; varying float vDist, vGone;
        void main() {
          vec3 w = fwidth(vBary) * 2.6 * uPx;
          vec3 e = 1.0 - smoothstep(vec3(0.0), w, vBary);
          float line = max(max(e.x * vMask.x, e.y * vMask.y), e.z * vMask.z);
          float front = smoothstep(uCrack * 1.15, uCrack * 1.15 - 0.12, vDist);
          float crack = line * front;
          float glass = 0.05 + 0.08 * front;
          float a = (glass + crack * 0.95) * (1.0 - vGone);
          vec3 col = mix(uTint, uCrackCol, crack);
          gl_FragColor = vec4(col, a);
        }`,
    }));
    world.add(shards);
    const vpB = new THREE.Vector4();
    shards.onBeforeRender = (renderer) => { renderer.getCurrentViewport(vpB); shardU.uPx.value = vpB.w / 1080; };

    // Cube edges (the +x wall's border stays: it is the frame the cracks run to).
    const e = [];
    const h = HALF;
    const corners = [[-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h], [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]];
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => {
      e.push(corners[a][0] + CENTER.x, corners[a][1] + CENTER.y, corners[a][2] + CENTER.z, corners[b][0] + CENTER.x, corners[b][1] + CENTER.y, corners[b][2] + CENTER.z);
    });
    const edgeCol = H.color('light', 1.25);
    const edges = world.add(fatLines({ positions: e, width: 2.5, color: edgeCol, opacity: 1 }));

    // ---------- network routes ----------
    const routes = CLUSTERS.map((k) => {
      const floorPts = k.route.map(([x, z]) => new THREE.Vector3(x, 0.04, z));
      const f0 = floorPts[0];
      const air = new THREE.CatmullRomCurve3([CENTER.clone(), IMPACT.clone(), new THREE.Vector3(0.55, 1.05, 2.0), new THREE.Vector3(f0.x - 0.35, 0.06, f0.z), f0.clone()]);
      const ground = roundedManhattan(floorPts, 0.5);
      const path = new THREE.CurvePath();
      path.add(air);
      ground.curves.forEach((c) => path.add(c));
      const last = floorPts[floorPts.length - 1];
      path.add(new THREE.LineCurve3(last, new THREE.Vector3(last.x, 0.55, last.z - 0.5)));
      return { path, ground: ground.getSpacedPoints(120) };
    });
    const traceSegs = [];
    routes.forEach((r) => polylineSegments(r.ground, traceSegs));
    const traceCool = H.color('lightSoft', 0.55);
    const traceHot = H.color('alert', 0.7);
    const traces = world.add(fatLines({ positions: traceSegs, width: 3, color: traceCool.clone(), opacity: 1 }));
    const curveTex = curveTexture(routes.map((r) => r.path), 192);
    world.track(curveTex);

    // ---------- racks: three clusters, rack by rack infection ----------
    const rackGeo = new THREE.BoxGeometry(0.3, 0.86, 0.48).translate(0, 0.43, 0);
    const nRacks = CLUSTERS.length * RACK_COLS * RACK_ROWS;
    const rackU = {
      uInfect: { value: 0 }, uBody: { value: new THREE.Color('#0F141B') }, uCool: { value: H.color('lightSoft', 0.95) }, uHot: { value: H.color('alert', 1.5) },
      uLight: { value: new THREE.Vector3(-0.4, 0.85, 0.5).normalize() },
    };
    const racks = new THREE.InstancedMesh(rackGeo, new THREE.ShaderMaterial({
      uniforms: rackU,
      vertexShader: /* glsl */ `
        attribute float aOrder;
        uniform float uInfect;
        varying vec3 vN; varying vec2 vUv; varying float vFront, vHot, vFlash;
        void main() {
          mat4 m = modelMatrix * instanceMatrix;
          vN = normalize(mat3(m) * normal);
          vUv = uv; vFront = step(0.5, normal.z);
          vHot = smoothstep(aOrder, aOrder + 0.015, uInfect);
          vFlash = vHot * (1.0 - smoothstep(aOrder + 0.015, aOrder + 0.09, uInfect));
          gl_Position = projectionMatrix * viewMatrix * m * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uBody, uCool, uHot, uLight;
        varying vec3 vN; varying vec2 vUv; varying float vFront, vHot, vFlash;
        void main() {
          float lam = 0.35 + 0.65 * max(dot(normalize(vN), uLight), 0.0);
          vec3 col = uBody * lam;
          vec3 led = mix(uCool, uHot, vHot) * (1.0 + vFlash * 1.6);
          if (vFront > 0.5) {
            float row = abs(fract(vUv.y * 6.0) - 0.5);
            float bar = smoothstep(0.17, 0.11, row) * step(0.18, vUv.x) * step(vUv.x, 0.6) * step(0.05, vUv.y) * step(vUv.y, 0.95);
            float dotLed = smoothstep(0.17, 0.11, row) * smoothstep(0.12, 0.07, abs(vUv.x - 0.78));
            col = mix(col, led * 0.55, bar);
            col = mix(col, led, dotLed * step(0.05, vUv.y) * step(vUv.y, 0.95));
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    }), nRacks);
    const aOrder = new Float32Array(nRacks);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    let ri = 0;
    const rackPos = [];
    CLUSTERS.forEach((k, ci) => {
      const entry = new THREE.Vector3(k.route[k.route.length - 1][0], 0, k.route[k.route.length - 1][1]);
      const yaw = 0.12; // racks face roughly toward the camera
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      const local = [];
      for (let r = 0; r < RACK_ROWS; r++) {
        for (let c = 0; c < RACK_COLS; c++) {
          const p = new THREE.Vector3(k.c[0] + (c - (RACK_COLS - 1) / 2) * 0.42, 0, k.c[2] + (r - (RACK_ROWS - 1) / 2) * 0.95);
          local.push(p);
        }
      }
      const dmax = Math.max(...local.map((p) => p.distanceTo(entry)));
      local.forEach((p) => {
        m4.compose(p, q, one);
        racks.setMatrixAt(ri, m4);
        aOrder[ri] = (ci + (p.distanceTo(entry) / dmax) * 0.85 + rand() * 0.08) / CLUSTERS.length;
        rackPos.push(p);
        ri++;
      });
    });
    rackGeo.setAttribute('aOrder', new THREE.InstancedBufferAttribute(aOrder, 1));
    racks.instanceMatrix.needsUpdate = true;
    racks.frustumCulled = false;
    world.add(racks);

    // ---------- agents: 1,200 inside; 700 leak ----------
    const aHome = new Float32Array(AGENTS * 3);
    const aSeed = new Float32Array(AGENTS);
    const aLeak = new Float32Array(AGENTS);
    const aRoute = new Float32Array(AGENTS);
    const aTarget = new Float32Array(AGENTS * 3);
    const leakIdx = new Set();
    while (leakIdx.size < LEAKERS) leakIdx.add(Math.floor(rand() * AGENTS));
    let li = 0;
    for (let i = 0; i < AGENTS; i++) {
      aHome[i * 3] = rand() * 2 - 1; aHome[i * 3 + 1] = rand() * 2 - 1; aHome[i * 3 + 2] = rand() * 2 - 1;
      aSeed[i] = rand() * 50;
      if (leakIdx.has(i)) {
        const r = li % 3;
        li++;
        aRoute[i] = r;
        aLeak[i] = r * 0.14 + rand() * 0.36; // ≤ 0.64: every leaker has arrived when uLeak reaches 1
        const k = CLUSTERS[r];
        aTarget[i * 3] = k.c[0] + (rand() - 0.5) * 3.6;
        aTarget[i * 3 + 1] = 0.15 + rand() * 1.1;
        aTarget[i * 3 + 2] = k.c[2] + (rand() - 0.5) * 3.8;
      } else {
        aLeak[i] = -1;
      }
    }
    const agentGeo = new THREE.BufferGeometry();
    agentGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(AGENTS * 3), 3));
    agentGeo.setAttribute('aHome', new THREE.BufferAttribute(aHome, 3));
    agentGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
    agentGeo.setAttribute('aLeak', new THREE.BufferAttribute(aLeak, 1));
    agentGeo.setAttribute('aRoute', new THREE.BufferAttribute(aRoute, 1));
    agentGeo.setAttribute('aTarget', new THREE.BufferAttribute(aTarget, 3));
    const agentU = {
      uTime: { value: 0 }, uScale: { value: 1000 }, uPx: { value: 1 }, uSize: { value: 0.07 }, uLeak: { value: 0 },
      uCenter: { value: CENTER }, uHalf: { value: HALF }, uCol: { value: H.color('alert', 1.9) }, uHot: { value: H.color('limit', 2.6) },
      uCurves: { value: curveTex }, uCurveSize: { value: new THREE.Vector2(192, routes.length) }, uOpacity: { value: 1 },
    };
    const agents = new THREE.Points(agentGeo, new THREE.ShaderMaterial({
      uniforms: agentU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime, uScale, uPx, uSize, uLeak, uHalf, uOpacity; uniform vec3 uCenter, uCol, uHot;
        attribute vec3 aHome, aTarget; attribute float aSeed, aLeak, aRoute;
        varying vec3 vColor; varying float vAlpha;
        ${gl.helpers.noise.glsl}
        ${CURVE_GLSL}
        void main() {
          float t = uTime * 0.22;
          vec3 q = aHome * 1.3 + vec3(aSeed);
          vec3 n = vec3(snoise(q + vec3(t, 0.0, 0.0)), snoise(q + vec3(0.0, t, 7.0)), snoise(q + vec3(13.0, 0.0, t)));
          vec3 inside = uCenter + clamp(aHome * 0.7 + n * 0.55, vec3(-0.93), vec3(0.93)) * uHalf;
          vec3 p = inside;
          float hot = 0.0;
          if (aLeak >= 0.0) {
            float local = clamp((uLeak - aLeak) / 0.36, 0.0, 1.0);
            vec3 onRoute = curveAt(aRoute, local);
            p = mix(inside, onRoute, smoothstep(0.0, 0.06, local));
            vec3 settle = aTarget + 0.18 * n;
            p = mix(p, settle, smoothstep(0.9, 1.0, local));
            hot = step(0.001, local) * (1.0 - smoothstep(0.9, 1.0, local));
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float s = 0.75 + 0.5 * fract(aSeed * 7.13);
          gl_PointSize = max(2.0 * uPx, uSize * s * uScale / max(0.001, -mv.z) * (1.0 + hot * 0.3));
          vColor = mix(uCol, uHot, hot);
          vAlpha = uOpacity;
        }`,
      fragmentShader: POINT_FRAG,
    }));
    agents.frustumCulled = false;
    pointScale(agents, agentU);
    world.add(agents);

    const dust = world.add(H.particles({ count: 1400, spread: [46, 12, 34], center: [5, 4, -6], size: 0.035, colors: ['lightSoft', 'light'], intensity: 0.42, drift: 0.4, seed: 'breach-dust' }));

    // ---------- DOM ----------
    const scrimL = C.Scrim.create({ ground: 'void', side: 'left', extent: 0.6, strength: 0.92 });
    const scrimB = C.Scrim.create({ ground: 'void', side: 'bottom', extent: 0.3, strength: 0.85 });
    root.append(scrimL.el, scrimB.el);
    const { colX, spanW, space } = tokens;
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: 'void', width: spanW(6) });
    place(title.el, space.margin, 192);
    const s1 = C.Headline.create({ text: copy.s1, role: 'lead', ground: 'void', width: spanW(7) });
    place(s1.el, space.margin, 268);
    const fig13 = splitFigure(copy.s2.value);
    const fig700 = splitFigure(copy.s3.value);
    const num13 = C.BigNumber.create({ display: fig13.figure, unit: fig13.unit || undefined, label: copy.s2.label, kind: provKind(f13 && f13.label), size: 'h1', ground: 'void', width: spanW(6) });
    place(num13.el, space.margin, 150);
    const num700 = C.BigNumber.create({ display: fig700.figure, unit: fig700.unit || undefined, label: copy.s3.label, kind: provKind(f700 && f700.label), size: 'h1', ground: 'void', width: spanW(6) });
    place(num700.el, space.margin, 560);
    const motive = C.Headline.create({ text: copy.motive, role: 'h2', ground: 'void', width: spanW(7), highlight: 'an attempt to cheat the evaluation.' });
    place(motive.el, space.margin, 404);
    const source = C.SourceLine.create({ kind: provKind(fIntr && fIntr.label), text: copy.tag, ground: 'void' });
    place(source.el, space.margin, space.footer.y);
    const motiveSrc = C.SourceLine.create({ kind: provKind(fMot && fMot.label), text: factsSource(fMot), ground: 'void' });
    place(motiveSrc.el, space.margin, space.footer.y);

    // Date clock 9 → 13 Jul, from hf-intrusion's value '2026-07-09/13'.
    const [y0, mo, dd] = String((fIntr && fIntr.value) || '').split('-');
    const [d0, d1] = String(dd || '').split('/').map(Number);
    const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(mo) - 1] || '';
    const days = [];
    if (d0 && d1) for (let d = d0; d <= d1; d++) days.push(`${String(d).padStart(2, '0')} ${MON} ${y0}`);
    const clock = document.createElement('div');
    clock.className = 'ground-void';
    Object.assign(clock.style, {
      position: 'absolute', right: '128px', top: '868px', fontFamily: 'var(--f-mono)', fontSize: '48px', lineHeight: '64px', fontWeight: '460',
      letterSpacing: '0.04em', color: 'var(--g-fg)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap',
    });
    clock.textContent = days[0] || '';
    root.append(clock);
    gsap.set(clock, { autoAlpha: 0 });
    let dayShown = 0;

    // Not a one-off (director's pick): OpenAI's own post, 23 Oct, as a calm last state.
    const CARD_ID = 'x-openai-securing-training-environment';
    const cardSrc = ctx.assets.capture(CARD_ID);
    const cardMeta = ctx.assets.captureMeta(CARD_ID);
    const ci = captureInfo(cardMeta);
    const CARD_STEP = ctx.beat.steps.length >= 5 ? 4 : -1;
    const card = cardSrc && CARD_STEP > 0 ? croppedCard(C, { id: CARD_ID, src: cardSrc, alt: (cardMeta && cardMeta.title) || '', width: spanW(9), meta: { counts: ci.views, captured: ci.captured } }) : null;
    if (card) place(card.el, (1920 - spanW(9)) / 2, 300);
    const srcCard = card ? C.SourceLine.create({ kind: 'labReported', text: [ci.who, ci.date].filter(Boolean).join(' · '), ground: 'void' }) : null;
    if (srcCard) place(srcCard.el, space.margin, space.footer.y);
    const scrimC = C.Scrim.create({ ground: 'void', side: 'center', extent: 1.1, strength: 0.9 });
    root.append(scrimC.el);
    const parts = [title, s1, num13, num700, motive, source, motiveSrc, card, srcCard].filter(Boolean);
    parts.forEach((p) => root.append(p.el));
    gsap.set([scrimL.el, scrimB.el], { autoAlpha: 0 });

    // ---------- camera ----------
    const rig = H.cameraRig(world.camera, { ...SHOTS[0], breathe: renderMode ? 0 : 0.5 });

    const U = { crack: shardU.uCrack, hole: shardU.uHole, leak: agentU.uLeak, infect: rackU.uInfect };
    function setDay() {
      const n = days.length;
      if (!n) return;
      const i = Math.min(n - 1, Math.floor(U.infect.value * (n - 1) + 0.02));
      if (i !== dayShown) { dayShown = i; clock.textContent = days[i]; }
    }

    let cur = -1;
    function stateTo(step, animate) {
      const tl = gsap.timeline();
      const D = (d) => (animate ? d : 0);
      const shot = SHOTS[Math.min(step, SHOTS.length - 1)];
      tl.add(rig.to(shot, { duration: animate ? (step === 1 ? 4.2 : 3.4) : 0.001, ease: 'power3.inOut' }), 0);
      const broken = step >= 1;
      const forward = animate && step === 1 && cur < 1;
      tl.to(U.crack, { value: broken ? 1 : 0, duration: forward ? 1.3 : D(0.4), ease: 'expo.out' }, forward ? 0.25 : 0);
      tl.to(U.hole, { value: broken ? 1 : 0, duration: forward ? 1.7 : D(0.4), ease: 'power2.out' }, forward ? 1.05 : 0);
      tl.to(U.leak, { value: broken ? 1 : 0, duration: forward ? 6.4 : D(0.5), ease: 'none' }, forward ? 1.3 : 0);
      tl.to(U.infect, { value: broken ? 1 : 0, duration: forward ? 5.0 : D(0.5), ease: 'none', onUpdate: setDay }, forward ? 3.6 : 0);
      tl.to(floorU.uAgentPool, { value: broken ? 0.42 : 1, duration: forward ? 5 : D(0.5) }, forward ? 1.5 : 0);
      const tc = broken ? traceHot : traceCool;
      tl.to(traces.material.color, { r: tc.r, g: tc.g, b: tc.b, duration: forward ? 4.5 : D(0.5) }, forward ? 1.6 : 0);
      const calm = step === CARD_STEP;
      tl.to(world.post.bloom, { intensity: step >= 3 ? 0.55 : 1.15, duration: D(1.1) }, 0);

      tl.add(scrimL.set({ visible: !calm }, { animate }), 0);
      tl.add(scrimC.set({ visible: calm }, { animate }), D(calm ? 0.2 : 0));
      if (card) tl.add(card.set({ visible: calm }, { animate }), D(calm ? 0.9 : 0));
      if (srcCard) tl.add(srcCard.set({ visible: calm }, { animate }), D(calm ? 1.4 : 0));
      tl.add(scrimB.set({ visible: step >= 1 }, { animate }), 0);
      tl.add(title.set({ visible: step === 0 }, { animate }), step === 0 ? D(0.3) : 0);
      tl.add(s1.set({ visible: step === 1 }, { animate }), D(step === 1 ? 0.7 : 0));
      tl.add(num13.set({ visible: step === 2 }, { animate }), D(step === 2 ? 0.9 : 0));
      tl.add(num700.set({ visible: step === 2 }, { animate }), D(step === 2 ? 1.25 : 0));
      tl.add(motive.set({ visible: step === 3 }, { animate }), D(step === 3 ? 1.0 : 0));
      tl.add(source.set({ visible: step >= 1 && step <= 2 }, { animate }), D(step >= 1 ? 1.4 : 0));
      tl.add(motiveSrc.set({ visible: step === 3 }, { animate }), D(step === 3 ? 1.5 : 0));
      tl.to(clock, { autoAlpha: step >= 1 && step <= 2 ? 1 : 0, duration: D(step >= 1 ? 0.6 : 0.3) }, forward ? 3.3 : 0);
      if (!animate) tl.call(setDay, null, 0.001);
      cur = step;
      return tl;
    }

    return {
      steps: ctx.beat.steps.length,
      world,
      enter() { cur = -1; return stateTo(0, !renderMode); },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit() {
        const tl = gsap.timeline();
        tl.to(rig.state, { radius: '+=4', duration: 0.8, ease: 'power2.in', onUpdate: rig.apply }, 0);
        return tl;
      },
      update(time) {
        agentU.uTime.value = time;
        dust.update(time);
        rig.update(time);
      },
      dispose() {
        gsap.killTweensOf([rig.state, U.crack, U.hole, U.leak, U.infect, floorU.uAgentPool, world.post.bloom, clock, traces.material.color]);
        parts.forEach((p) => p.destroy());
        scrimL.destroy();
        scrimB.destroy();
        scrimC.destroy();
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
