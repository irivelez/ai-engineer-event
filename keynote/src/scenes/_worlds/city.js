// City world (gl-1), shared by sf-arrival and factory: a night city made of light. Instanced towers with
// procedural windows (anti-aliased by distance), a street grid, data traffic as light streaks on the avenues,
// a horizon glow, and at the north end a cleared plaza: the software factory (conveyor lanes converging into
// one trunk, "main"). sf-arrival flies over it; factory dives into it, so both moments share one look.
import { roundedFrameGeometry } from './gl1-kit.js';

export const CELL = 5.2; //            block 4.0 + street 1.2
export const STREET = (k) => k * CELL + CELL / 2; // street centre line
export const PLAZA = { x0: -23.4, x1: 23.4, z0: -70.2, z1: -23.4 }; // the factory floor (no buildings)
export const LANES = 9;
export const FZ = { start: -25, m0: -40, m1: -55, end: -69 }; // lanes: straight, merge, trunk, gate
export const laneX = (i) => (i - (LANES - 1) / 2) * 4.3;

/** Lane path, z from FZ.start to FZ.end → x (same function as the PR shader). */
export function laneAt(i, z) {
  const t = Math.min(1, Math.max(0, (FZ.m0 - z) / (FZ.m0 - FZ.m1)));
  const m = t * t * (3 - 2 * t);
  return laneX(i) * (1 - m);
}

const FOG = '#0A1020';

export function buildCity(ctx, { post } = {}) {
  const { THREE, makeWorld, helpers: H } = ctx.gl;
  const rand = H.seeded('city');
  const world = makeWorld({
    fov: 38, far: 600,
    post: post || { bloom: { intensity: 0.7, threshold: 0.68, smoothing: 0.3, radius: 0.72 }, vignette: { offset: 0.28, darkness: 0.62 } },
  });
  const fogColor = new THREE.Color(FOG);
  const fogDensity = 0.0125;

  // ---------- sky dome: night horizon glow ----------
  const skyU = { uZenith: { value: new THREE.Color('#05070A') }, uHorizon: { value: new THREE.Color('#14203A') }, uFog: { value: fogColor } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith, uHorizon, uFog; varying vec3 vW;
      void main(){
        vec3 d = normalize(vW - cameraPosition);
        float h = 1.0 - smoothstep(0.0, 0.42, max(d.y, 0.0));
        vec3 c = mix(uZenith, uHorizon, h * h * h);
        c = mix(c, uFog, smoothstep(0.02, -0.08, d.y));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  sky.renderOrder = -10;
  world.add(sky);

  // ---------- ground: dark asphalt, streets, faint lane marks ----------
  const groundU = {
    uGround: { value: new THREE.Color('#06080D') }, uStreet: { value: new THREE.Color('#0B111B') }, uLane: { value: H.color('accent', 0.32) },
    uPlaza: { value: new THREE.Color('#080C14') }, uFog: { value: fogColor }, uFogD: { value: fogDensity },
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.ShaderMaterial({
    uniforms: groundU,
    vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: /* glsl */ `
      uniform vec3 uGround, uStreet, uLane, uPlaza, uFog; uniform float uFogD; varying vec3 vW; varying float vD;
      void main(){
        vec2 p = vW.xz;
        vec2 q = abs(fract((p - ${(CELL / 2).toFixed(3)}) / ${CELL.toFixed(3)} + 0.5) - 0.5) * ${CELL.toFixed(3)};
        vec2 fw = fwidth(p) + 1e-4;
        float sx = 1.0 - smoothstep(0.6 - fw.x, 0.6 + fw.x, q.x);
        float sz = 1.0 - smoothstep(0.6 - fw.y, 0.6 + fw.y, q.y);
        float street = max(sx, sz);
        bool plaza = p.x > ${PLAZA.x0.toFixed(2)} && p.x < ${PLAZA.x1.toFixed(2)} && p.y > ${PLAZA.z0.toFixed(2)} && p.y < ${PLAZA.z1.toFixed(2)};
        vec3 col = plaza ? uPlaza : mix(uGround, uStreet, street);
        // dashed centre marks, faded out where they would alias
        float dash = step(0.5, fract((sx > sz ? p.y : p.x) * 0.35));
        float line = (1.0 - smoothstep(0.035, 0.035 + fw.x * 1.5, min(q.x, q.y))) * dash;
        float detail = 1.0 - smoothstep(0.03, 0.09, max(fw.x, fw.y));
        if (!plaza) col += uLane * line * detail;
        float f = 1.0 - exp(-pow(uFogD * vD, 2.0));
        gl_FragColor = vec4(mix(col, uFog, f), 1.0);
      }`,
  }));
  ground.rotation.x = -Math.PI / 2;
  world.add(ground);

  // ---------- buildings: one instanced mesh ----------
  const lots = [];
  const NB = 18;
  const downtown = [14, 30]; // the tallest cluster, right of the boulevard the camera glides down
  for (let kx = -NB; kx <= NB; kx++) {
    for (let kz = -NB; kz <= NB; kz++) {
      const cx = kx * CELL;
      const cz = kz * CELL;
      if (cx + 2 > PLAZA.x0 && cx - 2 < PLAZA.x1 && cz + 2 > PLAZA.z0 && cz - 2 < PLAZA.z1) continue;
      if (rand() < 0.05) continue; // a park
      const d = Math.hypot(cx - downtown[0], cz - downtown[1]);
      const d2 = Math.hypot(cx, cz + 47); // a second cluster framing the factory
      const base = 1.0 + 18 * Math.exp(-((d / 26) ** 2)) + 7 * Math.exp(-((d2 / 26) ** 2)) + 2.2 * H.noise.simplex3(kx * 0.21, kz * 0.21, 3.1);
      const split = rand();
      const parts = split < 0.3 ? [[0, 0, 4, 4]] : split < 0.62 ? [[-1, 0, 2, 4], [1, 0, 2, 4]] : [[-1, -1, 2, 2], [1, -1, 2, 2], [-1, 1, 2, 2], [1, 1, 2, 2]];
      for (const [ox, oz, w, dd] of parts) {
        let h = Math.max(0.6, base * (0.45 + 0.9 * rand()));
        if (Math.abs(cx + ox - STREET(0)) < 6.5 && cz + oz > 24) h = Math.min(h, 6.5); // the glide path stays low-rise
        lots.push([cx + ox, cz + oz, w - 0.35 - rand() * 0.3, dd - 0.35 - rand() * 0.3, h, rand()]);
      }
    }
  }
  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const bU = {
    uBody: { value: new THREE.Color('#0D1422') }, uWinA: { value: H.color('accent', 0.95) }, uWinB: { value: H.color('lightSoft', 0.9) },
    uGlow: { value: H.color('accent', 0.16) }, uFog: { value: fogColor }, uFogD: { value: fogDensity }, uLit: { value: 0.26 }, uCrown: { value: H.color('accent', 1.5) },
  };
  const bMat = new THREE.ShaderMaterial({
    uniforms: bU,
    vertexShader: /* glsl */ `
      attribute float aSeed; varying vec3 vW; varying vec3 vN; varying float vSeed; varying float vH; varying float vD;
      void main(){
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(instanceMatrix) * normal); vSeed = aSeed; vH = instanceMatrix[1][1];
        vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBody, uWinA, uWinB, uGlow, uFog, uCrown; uniform float uFogD, uLit;
      varying vec3 vW; varying vec3 vN; varying float vSeed; varying float vH; varying float vD;
      float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main(){
        vec3 n = vN;
        vec3 col = uBody * (0.5 + 0.34 * abs(n.x) + 0.2 * abs(n.z) + 0.08 * max(n.y, 0.0));
        if (abs(n.y) < 0.5) {
          bool fx = abs(n.x) > 0.5;
          // glass towers: lit runs of windows on each floor (strips), never big squares
          vec2 g = vec2(fx ? vW.z : vW.x, vW.y) / vec2(0.3, 0.36);
          vec2 cell = floor(g); vec2 f = fract(g);
          float run = hash(vec3(floor(cell.x / 4.0), cell.y, vSeed * 91.0 + (fx ? 3.0 : 7.0)));
          float r = hash(vec3(cell, vSeed * 37.0 + 1.0));
          float lit = step(1.0 - uLit, run) * step(0.12, r);
          float m = smoothstep(0.04, 0.12, f.x) * (1.0 - smoothstep(0.88, 0.96, f.x)) * smoothstep(0.28, 0.36, f.y) * (1.0 - smoothstep(0.66, 0.74, f.y));
          vec2 fw = fwidth(g);
          float detail = 1.0 - smoothstep(0.16, 0.38, max(fw.x, fw.y));
          float top = 1.0 - smoothstep(vH - 0.4, vH - 0.15, vW.y);
          float win = mix(0.42 * uLit, m * lit, detail) * top;
          vec3 wc = mix(uWinA, uWinB, step(0.55, fract(run * 13.7)));
          col += wc * win * (0.4 + 0.6 * fract(run * 7.3));
          // crown light on some tall towers: a thin band under the roof line
          float crown = (1.0 - smoothstep(0.06, 0.16, vH - vW.y)) * step(8.5, vH) * step(0.5, fract(vSeed * 5.1));
          col += uCrown * crown;
        }
        col += uGlow * (1.0 - smoothstep(0.0, 1.6, vW.y));
        float f = 1.0 - exp(-pow(uFogD * vD, 2.0));
        gl_FragColor = vec4(mix(col, uFog, f), 1.0);
      }`,
  });
  const towers = new THREE.InstancedMesh(box, bMat, lots.length);
  const aSeed = new Float32Array(lots.length);
  const m4 = new THREE.Matrix4();
  lots.forEach(([x, z, w, d, h, s], i) => {
    m4.makeScale(w, h, d);
    m4.setPosition(x, 0, z);
    towers.setMatrixAt(i, m4);
    aSeed[i] = s;
  });
  box.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  towers.frustumCulled = false;
  world.add(towers);

  // ---------- traffic: light streaks along the avenues ----------
  const avenues = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  for (const k of [-9, -5, -2, 0, 3, 6, 10]) {
    const x = STREET(k) - 0.28;
    avenues.push(new THREE.CatmullRomCurve3([V(x, 0.12, 96), V(x, 0.12, 0), V(x, 0.12, -96)]));
    avenues.push(new THREE.CatmullRomCurve3([V(x + 0.56, 0.12, -96), V(x + 0.56, 0.12, 0), V(x + 0.56, 0.12, 96)]));
  }
  for (const k of [-15, -3, 1, 4, 8, 12]) {
    const z = STREET(k) - 0.28;
    avenues.push(new THREE.CatmullRomCurve3([V(-96, 0.12, z), V(0, 0.12, z), V(96, 0.12, z)]));
    avenues.push(new THREE.CatmullRomCurve3([V(96, 0.12, z + 0.56), V(0, 0.12, z + 0.56), V(-96, 0.12, z + 0.56)]));
  }
  const streakGeo = new THREE.SphereGeometry(1, 8, 6);
  const data = world.add(H.flow({ curves: avenues, count: 1300, size: 0.045, stretch: 11, color: 'accent', intensity: 2.2, speed: [0.012, 0.03], seed: 'city-data', geometry: streakGeo, fadeEnds: false }));
  const cars = world.add(H.flow({ curves: avenues.slice().reverse(), count: 520, size: 0.04, stretch: 7, color: 'light', intensity: 1.0, speed: [0.008, 0.016], seed: 'city-cars', geometry: streakGeo.clone(), fadeEnds: false }));

  // ---------- the factory floor: lanes and trunk ----------
  const laneCurves = [];
  for (let i = 0; i < LANES; i++) {
    const pts = [];
    for (let s = 0; s <= 40; s++) {
      const z = FZ.start + (FZ.end - FZ.start) * (s / 40);
      pts.push(V(laneAt(i, z), 0.02, z));
    }
    laneCurves.push(new THREE.CatmullRomCurve3(pts));
  }
  const rails = laneCurves.map((c) => world.add(H.tube(c, { radius: 0.05, color: 'lightSoft', intensity: 0.45, segments: 160, radial: 6 })));
  const trunkCurve = new THREE.CatmullRomCurve3([V(0, 0.02, FZ.m1 + 2), V(0, 0.02, FZ.end)]);
  const trunk = world.add(H.tube(trunkCurve, { radius: 0.13, color: 'accent', intensity: 1.25, segments: 40, radial: 10 }));
  // the gate at the end of the trunk: "main"
  const gate = new THREE.Mesh(roundedFrameGeometry(THREE, 3.6, 4.6, 0.5, 0.14), new THREE.MeshBasicMaterial({ color: H.color('accent', 1.5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  gate.position.set(0, 2.3, FZ.end - 0.6);
  world.add(gate);

  // PR cubes: GPU instanced, analytic motion along the lanes (no CPU work per frame)
  const PR = 960;
  const prGeo = new THREE.BoxGeometry(0.36, 0.36, 0.36);
  prGeo.translate(0, 0.2, 0);
  const aLane = new Float32Array(PR);
  const aOff = new Float32Array(PR);
  const aSpd = new Float32Array(PR);
  const aHash = new Float32Array(PR);
  const prRand = H.seeded('city-prs');
  for (let i = 0; i < PR; i++) { aLane[i] = i % LANES; aOff[i] = prRand(); aSpd[i] = 0.018 + prRand() * 0.006; aHash[i] = prRand(); }
  prGeo.setAttribute('aLane', new THREE.InstancedBufferAttribute(aLane, 1));
  prGeo.setAttribute('aOff', new THREE.InstancedBufferAttribute(aOff, 1));
  prGeo.setAttribute('aSpd', new THREE.InstancedBufferAttribute(aSpd, 1));
  prGeo.setAttribute('aHash', new THREE.InstancedBufferAttribute(aHash, 1));
  const prU = {
    uTime: { value: 0 }, uOld: { value: -1 }, uNew: { value: -1 }, uFront: { value: FZ.start + 2 },
    uNeutral: { value: H.color('lightSoft', 0.55) }, uAgent: { value: H.color('accent', 1.3) }, uHuman: { value: H.color('quiet', 0.6) },
    uFog: { value: fogColor }, uFogD: { value: fogDensity }, uOpacity: { value: 1 },
  };
  const prMat = new THREE.ShaderMaterial({
    uniforms: prU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime, uOld, uNew, uFront;
      uniform vec3 uNeutral, uAgent, uHuman;
      attribute float aLane, aOff, aSpd, aHash;
      varying vec3 vColor; varying float vA; varying float vD;
      float laneX(float i){ return (i - ${((LANES - 1) / 2).toFixed(1)}) * 4.3; }
      float xAt(float i, float z){ float t = clamp((${FZ.m0.toFixed(1)} - z) / ${(FZ.m0 - FZ.m1).toFixed(1)}, 0.0, 1.0); float m = t * t * (3.0 - 2.0 * t); return laneX(i) * (1.0 - m); }
      vec3 shade(float share){ return share < 0.0 ? uNeutral : (aHash < share ? uAgent : uHuman); }
      void main(){
        float s = fract(aOff + uTime * aSpd);
        float z = mix(${FZ.start.toFixed(1)}, ${FZ.end.toFixed(1)}, s);
        float x = xAt(aLane, z);
        float dx = xAt(aLane, z - 0.5) - x;
        float yaw = atan(dx, -0.5);
        float trunk = smoothstep(${(FZ.m1 + 3).toFixed(1)}, ${FZ.m1.toFixed(1)}, z);
        x += (fract(aHash * 31.7) - 0.5) * 1.3 * trunk;
        vec3 p = position;
        float c = cos(yaw), sn = sin(yaw);
        p.xz = mat2(c, -sn, sn, c) * p.xz;
        vec4 w = modelMatrix * vec4(p + vec3(x, 0.02, z), 1.0);
        vec4 mv = viewMatrix * w; vD = -mv.z;
        gl_Position = projectionMatrix * mv;
        vColor = z > uFront ? shade(uNew) : shade(uOld);
        vA = smoothstep(0.0, 0.05, s) * (1.0 - smoothstep(0.93, 1.0, s));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uFog; uniform float uFogD, uOpacity; varying vec3 vColor; varying float vA; varying float vD;
      void main(){ float f = 1.0 - exp(-pow(uFogD * vD, 2.0)); gl_FragColor = vec4(vColor * vA * uOpacity * (1.0 - f), 1.0); }`,
  });
  const prs = new THREE.InstancedMesh(prGeo, prMat, PR);
  prs.frustumCulled = false;
  world.add(prs);

  return {
    world,
    THREE,
    towers,
    rails,
    trunk,
    gate,
    prs,
    prU,
    bU,
    update(time) {
      data.update(time);
      cars.update(time);
      prU.uTime.value = time;
    },
  };
}
