// swarm (private helpers): the agents, the eight floors and the floor plane of the swarm moment.
// Everything the agents do is analytic in the vertex shader: position = f(murmuration clock, build clock, seed),
// so render mode and goto(i, { animate:false }) are exact. Agents are drawn as screen-space capsules with a
// ribbon trail, each with its own circle of confusion (thin-lens depth of field, energy-conserving), so a
// defocused agent becomes a soft blue disc instead of a sharp dot. A mirrored second draw is the floor's
// glossy reflection. The same spine is evaluated in JS so the camera can track the hero agent exactly.

// ---------- shared constants (JS and GLSL must agree) ----------
export const K = 6; // trail samples behind the head
export const SPEED = 0.032; // murmuration loop turns per second (~5.5 m/s along the spine)
export const U_HERO = 0.105; // the hero's place on the loop: there the sheet faces the wide camera during the pull-back
export const TILT = 0.56; // loop plane tilt (rad)
export const NF = 8; // floors = days
// Grounded count: facts.json (fable-1000-subagents) says "over 1,000 subagents". We draw 1,024: just over 1,000,
// never a number the source doesn't hold. Eight floors = the eight days, a metaphor for the build progressing.
export const RING = 72; // agents on each floor's perimeter
export const INNER = 56; // 8 × 7 at work inside
export const PER = RING + INNER; // 128 agents per floor
export const N = NF * PER; // 1,024 agents
export const SLAB = { w: 22, d: 14, r: 2.4, t: 0.3 };
export const FLOOR_Y = (f) => 1.6 + f * 3.0; // slab top
export const HL = 0.34; // capsule half segment (m)
export const RC = 0.16; // capsule radius (m)
export const RT = 0.09; // trail radius at the head (m)
export const RACE0 = 1.0; // s1: the day counter starts racing (s)
export const DAY = 0.8; // s per day
export const SWEEP = 0.55; // a floor's light sweep (s)
export const LOCK = (f) => RACE0 + f * DAY - 0.1; // floor f's sweep starts as its day rolls in
export const B_END = LOCK(NF - 1) + SWEEP + 0.3;

const SB = Math.sin(TILT);
const CB = Math.cos(TILT);
const TAU = Math.PI * 2;
const f1 = (x) => (Number.isInteger(x) ? `${x}.0` : String(x));

/** The murmuration's spine at loop parameter s and time t (JS twin of GLSL spine()). */
export function spine(s, t, out) {
  const th = TAU * s;
  const x = 24 * Math.cos(th) + 5 * Math.cos(2 * th + 0.13 * t);
  const z = 13 * Math.sin(th) + 4 * Math.sin(3 * th - 0.11 * t);
  const y = 26 + z * SB + 5.5 * Math.sin(2 * th + 0.17 * t + 1.0) + 1.2 * Math.sin(4 * th - 0.21 * t);
  return out.set(x, y, z * CB);
}

// ---------- GLSL ----------
// The flow: the curl of a band-limited random vector potential, written as a sum of transverse plane waves
// (each term (k × a) cos(k·p + ωt + φ) is divergence-free), so the flock bends coherently without clumping.
// Analytic, so JS evaluates exactly what the GPU does (the camera tracks the hero agent through it).
const WAVES = (() => {
  const spec = [ // direction, |k| (1/m), polarisation hint, amplitude (m), ω (rad/s), φ
    [[1, 0.3, 0.2], 0.055, [0, 1, -0.5], 4.6, 0.21, 0.4],
    [[-0.4, 0.8, 0.5], 0.07, [1, 0, 0.3], 3.6, -0.17, 2.1],
    [[0.2, -0.3, 1], 0.045, [0.6, 1, 0], 4.2, 0.13, 4.0],
    [[0.7, 0.6, -0.4], 0.09, [0, 0.2, 1], 2.3, 0.27, 5.3],
    [[-0.8, -0.2, -0.6], 0.12, [0.3, 1, -0.2], 1.4, -0.33, 1.2],
  ];
  return spec.map(([d, k, a, amp, w, ph]) => {
    const n = Math.hypot(...d);
    const kv = d.map((x) => (x / n) * k);
    const kh = d.map((x) => x / n);
    const c = [kh[1] * a[2] - kh[2] * a[1], kh[2] * a[0] - kh[0] * a[2], kh[0] * a[1] - kh[1] * a[0]];
    const cn = Math.hypot(...c);
    return { k: kv, c: c.map((x) => (x / cn) * amp), w, ph };
  });
})();
const v3 = (a) => `vec3(${a.map((x) => x.toFixed(6)).join(', ')})`;
const FLOW_GLSL = /* glsl */ `
vec3 flow(vec3 p, float t) {
  vec3 d = vec3(0.0);
${WAVES.map((W) => `  d += ${v3(W.c)} * cos(dot(${v3(W.k)}, p) + ${W.w.toFixed(4)} * t + ${W.ph.toFixed(4)});`).join('\n')}
  return d;
}`;
/** JS twin of GLSL flow(): adds the displacement at (x, y, z, t) to out. */
export function flowAdd(x, y, z, t, out, scale = 1) {
  for (const W of WAVES) {
    const a = Math.cos(W.k[0] * x + W.k[1] * y + W.k[2] * z + W.w * t + W.ph) * scale;
    out.x += W.c[0] * a; out.y += W.c[1] * a; out.z += W.c[2] * a;
  }
  return out;
}
/** The hero agent's position at time t (it flies the spine, carried by the flow like everyone else). */
export function heroPos(t, out, flowScale = 1) {
  spine(U_HERO + SPEED * t, t, out);
  return flowAdd(out.x, out.y, out.z, t, out, flowScale);
}

const AGENT_COMMON = /* glsl */ `
  uniform float uTime, uBuild, uBuildRate, uMirror, uScale, uFocus, uAperture, uCocMax, uFog, uIntensity, uCoreI;
  uniform float uDim, uHeroHead, uTrailDt, uRefl, uMinR, uCurl, uSpace, uGather, uNearK;
  uniform vec2 uRes;
  uniform vec3 uAccent;
  attribute vec4 aBand;  // loop u, across v, thickness w, seed
  attribute vec4 aSlot;  // slot xyz on its floor, yaw of the capsule there
  attribute vec4 aOrg;   // departure, arrival (build s), sweep position 0-1, floor lock time (build s)
  attribute vec4 aLook;  // brightness in the swarm, brightness on the floor, core on the floor, hero flag
  const float TAU = 6.28318530718;
  const float SPEED = ${f1(SPEED)};
  const float SB = ${SB.toFixed(6)};
  const float CB = ${CB.toFixed(6)};
  const float HL = ${f1(HL)};
  const float RC = ${f1(RC)};
  const float RT = ${f1(RT)};
  const float SWEEP = ${f1(SWEEP)};
  const float U_HERO = ${U_HERO.toFixed(6)};
  const float R_SPACE = 4.6;
  ${FLOW_GLSL}

  vec3 spine(float s, float t) {
    float th = TAU * s;
    float x = 24.0 * cos(th) + 5.0 * cos(2.0 * th + 0.13 * t);
    float z = 13.0 * sin(th) + 4.0 * sin(3.0 * th - 0.11 * t);
    float y = 26.0 + z * SB + 5.5 * sin(2.0 * th + 0.17 * t + 1.0) + 1.2 * sin(4.0 * th - 0.21 * t);
    return vec3(x, y, z * CB);
  }

  // the murmuration: a twisting, breathing ribbon around the spine, bent by the curl flow
  vec3 swarmPos(float t) {
    float s = aBand.x + SPEED * t;
    float th = TAU * s;
    vec3 L = spine(s, t);
    vec3 T = normalize(spine(s + 0.002, t) - spine(s - 0.002, t));
    vec3 c = cross(T, vec3(0.0, 1.0, 0.0));
    vec3 N = length(c) > 1e-4 ? normalize(c) : vec3(1.0, 0.0, 0.0);
    vec3 B = cross(N, T);
    float al = 1.1 * sin(2.0 * th - 0.23 * t) + 0.5 * sin(5.0 * th + 0.31 * t);
    float W = 4.8 + 2.4 * sin(3.0 * th - 0.37 * t + 0.5);
    float H = 1.3 + 0.6 * sin(4.0 * th + 0.29 * t);
    vec3 side = N * cos(al) + B * sin(al);
    vec3 up2 = B * cos(al) - N * sin(al);
    vec2 vw = vec2(aBand.y * W, aBand.z * H);
    // up close, the hero keeps a little personal space so the lens sees it alone against the flock
    if (uSpace > 0.0 && aLook.w < 0.5) {
      float along = (fract(aBand.x - U_HERO + 0.5) - 0.5) * 150.0;
      float need = sqrt(max(R_SPACE * R_SPACE - along * along, 0.0));
      float lv = length(vw);
      vec2 d2 = lv > 1e-3 ? vw / lv : vec2(1.0, 0.0);
      vw = mix(vw, d2 * max(lv, need), uSpace);
    }
    vec3 p = L + side * vw.x + up2 * vw.y;
    p += flow(p, t) * uCurl;
    p = mix(p, vec3(p.x * 0.55, 30.0 + (p.y - 30.0) * 0.7, p.z * 0.55), uGather);
    float free = 1.0 - aLook.w; // the hero has no individual wobble: JS tracks it exactly
    float sd = aBand.w;
    p += (side * sin(t * (0.6 + 0.5 * sd) + sd * 40.0) + up2 * cos(t * (0.8 + 0.4 * sd) + sd * 23.0)) * (0.3 * free);
    return p;
  }

  float orgAt(float b) { return clamp((b - aOrg.x) / max(aOrg.y - aOrg.x, 0.05), 0.0, 1.0); }

  // swarm → its slot on a floor: a spiral dive around the building's axis
  vec3 agentPos(float t, float b) {
    float o = orgAt(b);
    if (o >= 1.0) return aSlot.xyz;
    vec3 sw = swarmPos(t);
    if (o <= 0.0) return sw;
    float e = o * o * o * (o * (o * 6.0 - 15.0) + 10.0);
    vec3 slot = aSlot.xyz;
    vec3 tang = normalize(vec3(-slot.z, 0.0, slot.x) + vec3(1e-3, 0.0, 0.0));
    vec3 arc = (tang * 7.0 + vec3(0.0, 5.0, 0.0)) * sin(3.14159265 * e);
    return mix(sw, slot, e) + arc;
  }

  // brightness of an agent: in the swarm, landing, and when its floor's sweep locks it in
  float agentLight(float b, out float coreK) {
    float o = orgAt(b);
    float sett = smoothstep(0.85, 1.0, o);
    float front = (b - aOrg.w) / SWEEP;
    float swept = step(aOrg.z, front);
    float flash = swept * exp(-max(front - aOrg.z, 0.0) * 2.5);
    float onFloor = aLook.y * mix(0.55, 1.0, swept) * (1.0 + 1.6 * flash);
    coreK = mix(1.0, aLook.z, sett) * (1.0 + 1.5 * flash * sett);
    return mix(aLook.x, onFloor, sett);
  }

  // during the pull-back, agents between the lens and the focus fade out: no blurred clutter in front
  float nearFade(float depth) { return mix(1.0, smoothstep(0.35 * uFocus, 0.75 * uFocus, depth), uNearK); }
  float cocPx(float depth) { return min(uAperture * abs(depth - uFocus) / depth, uCocMax); }
`;

export const HEAD_VERT = /* glsl */ `
  ${AGENT_COMMON}
  attribute vec2 aCorner;
  varying vec2 vP;
  varying vec3 vShape;
  varying vec3 vCol;
  varying float vCore;
  void main() {
    float o = orgAt(uBuild);
    vec3 P0 = agentPos(uTime, uBuild);
    vec3 P1 = agentPos(uTime - 0.04, uBuild - 0.04 * uBuildRate);
    vec3 slotDir = vec3(cos(aSlot.w), 0.0, sin(aSlot.w));
    vec3 vd = P0 - P1;
    float vl = length(vd);
    vec3 dir = vl > 1e-4 ? vd / vl : slotDir;
    dir = mix(dir, slotDir, smoothstep(0.8, 1.0, o));
    float dl = length(dir);
    dir = dl > 1e-3 ? dir / dl : slotDir;
    float hgt = max(P0.y, 0.0);
    if (uMirror > 0.5) { P0.y = -P0.y; dir.y = -dir.y; }
    vec4 mv0 = modelViewMatrix * vec4(P0, 1.0);
    float depth = -mv0.z;
    if (depth < 0.15) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vCol = vec3(0.0); vCore = 0.0; vP = vec2(0.0); vShape = vec3(1.0); return; }
    vec4 c0 = projectionMatrix * mv0;
    vec4 c1 = projectionMatrix * (modelViewMatrix * vec4(P0 + dir * HL, 1.0));
    vec2 s0 = c0.xy / c0.w * 0.5 * uRes;
    vec2 ax = vec2(1.0, 0.0);
    float hl = 0.0;
    if (c1.w > 0.1) {
      vec2 a = c1.xy / c1.w * 0.5 * uRes - s0;
      hl = length(a);
      if (hl > 1e-3) ax = a / hl;
    }
    vec2 pr = vec2(-ax.y, ax.x);
    float rad = RC * uScale / depth;
    float radR = max(rad, uMinR);
    float coc = cocPx(depth);
    if (uMirror > 0.5) coc += uScale / depth * (0.12 + 0.03 * hgt);
    float energy = ((hl + rad) * rad) / ((hl + radR) * radR);
    float kb = ((hl + radR) * radR) / ((hl + radR + coc) * (radR + coc));
    vec2 E = vec2(hl + radR + coc + 1.5, radR + coc + 1.5);
    vec2 off = ax * (aCorner.x * E.x) + pr * (aCorner.y * E.y);
    vec4 cb = projectionMatrix * (mv0 + vec4(0.0, 0.0, min(0.6, depth * 0.5), 0.0));
    gl_Position = vec4(c0.xy / c0.w + off / (0.5 * uRes), clamp(cb.z / cb.w, -1.0, 1.0), 1.0);
    vP = aCorner * E;
    vShape = vec3(hl, radR, coc);
    float coreK;
    float I = agentLight(uBuild, coreK);
    float fog = exp(-pow(uFog * depth, 2.0));
    float k = energy * fog * nearFade(depth) * mix(1.0, 0.2, uDim) * (uMirror > 0.5 ? uRefl : 1.0) * mix(1.0, uHeroHead, aLook.w);
    vCol = uAccent * (uIntensity * I * kb * k);
    float radS = rad * 1080.0 / uRes.y; // stage px
    float bodyK = clamp(6.0 / radS, 0.08, 1.0); // a near capsule shows its dim glass, not a wall of light
    vCol *= bodyK;
    // the white-hot core belongs to small, far agents and the in-focus ones; big near ones glow blue, not grey
    vCore = uCoreI * I * coreK * k * (0.22 + 0.78 * smoothstep(2.0, 6.0, radS)) * clamp(14.0 / radS, 0.2, 1.0);
  }`;

export const HEAD_FRAG = /* glsl */ `
  varying vec2 vP;
  varying vec3 vShape;
  varying vec3 vCol;
  varying float vCore;
  void main() {
    float hl = vShape.x; float r = vShape.y; float coc = vShape.z;
    float dx = max(abs(vP.x) - hl, 0.0);
    float dist = length(vec2(dx, vP.y));
    float edge = r + coc;
    float soft = 0.7 + coc * 0.85;
    float cov = 1.0 - smoothstep(edge - soft, edge + 0.5 * soft, dist);
    float cr = r * 0.45 + 0.45;
    float cr2 = cr * cr + 0.64 * coc * coc; // the filament defocuses into a soft disc, energy kept
    float core = exp(-(dist * dist) / cr2) * (cr * cr / cr2) * mix(1.0, 0.3, coc / (coc + r));
    vec3 col = vCol * cov + vec3(vCore * core);
    col = min(col, vec3(24.0));
    if (max(col.r, max(col.g, col.b)) < 0.0005 || any(isnan(col))) discard;
    gl_FragColor = vec4(col, 1.0);
  }`;

export const TRAIL_VERT = /* glsl */ `
  ${AGENT_COMMON}
  attribute vec2 aTr; // sample index (0 = head … K), side (-1 / +1)
  varying float vAcross;
  varying vec2 vShape;
  varying vec3 vCol;
  void main() {
    float k = aTr.x;
    float last = ${f1(K)};
    float kn = k < last - 0.5 ? k + 1.0 : k - 1.0;
    float dt = uTrailDt;
    vec3 Pk = agentPos(uTime - k * dt, uBuild - k * dt * uBuildRate);
    vec3 Pn = agentPos(uTime - kn * dt, uBuild - kn * dt * uBuildRate);
    float segW = length(Pk - Pn);
    float hgt = max(Pk.y, 0.0);
    if (uMirror > 0.5) { Pk.y = -Pk.y; Pn.y = -Pn.y; }
    vec4 mvk = modelViewMatrix * vec4(Pk, 1.0);
    vec4 mvn = modelViewMatrix * vec4(Pn, 1.0);
    float depth = -mvk.z;
    if (depth < 0.15 || -mvn.z < 0.15 || segW < 1e-4) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vCol = vec3(0.0); vAcross = 0.0; vShape = vec2(1.0); return; }
    vec4 ck = projectionMatrix * mvk;
    vec4 cn = projectionMatrix * mvn;
    vec2 sk = ck.xy / ck.w * 0.5 * uRes;
    vec2 sn = cn.xy / cn.w * 0.5 * uRes;
    vec2 d = k < last - 0.5 ? sk - sn : sn - sk;
    float dl = length(d);
    vec2 dirS = dl > 1e-3 ? d / dl : vec2(1.0, 0.0);
    vec2 pr = vec2(-dirS.y, dirS.x);
    float f = k / last;
    float rad = RT * (1.0 - 0.55 * f) * uScale / depth;
    float radR = max(rad, uMinR);
    float coc = cocPx(depth);
    if (uMirror > 0.5) coc += uScale / depth * (0.12 + 0.03 * hgt);
    float hw = radR + coc + 1.25;
    vec2 off = pr * (aTr.y * hw);
    vec4 cb = projectionMatrix * (mvk + vec4(0.0, 0.0, min(0.6, depth * 0.5), 0.0));
    gl_Position = vec4(ck.xy / ck.w + off / (0.5 * uRes), clamp(cb.z / cb.w, -1.0, 1.0), 1.0);
    vAcross = aTr.y * hw;
    vShape = vec2(radR, coc);
    float coreK;
    float I = agentLight(uBuild, coreK);
    float fog = exp(-pow(uFog * depth, 2.0));
    float vis = smoothstep(0.02, 0.2, segW) * pow(max(1.0 - f, 0.0), 1.3);
    float k2 = (rad / radR) * (radR / (radR + coc)) * fog * nearFade(depth) * vis * mix(1.0, 0.2, uDim) * (uMirror > 0.5 ? uRefl : 1.0);
    float radS = rad * 1080.0 / uRes.y;
    vCol = uAccent * (uIntensity * 0.62 * I * k2 * clamp(4.0 / radS, 0.08, 1.0));
  }`;

export const TRAIL_FRAG = /* glsl */ `
  varying float vAcross;
  varying vec2 vShape;
  varying vec3 vCol;
  void main() {
    float edge = vShape.x + vShape.y;
    float soft = 0.7 + vShape.y * 0.85;
    float cov = 1.0 - smoothstep(edge - soft, edge + 0.5 * soft, abs(vAcross));
    vec3 col = min(vCol * cov, vec3(24.0));
    if (max(col.r, max(col.g, col.b)) < 0.0005 || any(isnan(col))) discard;
    gl_FragColor = vec4(col, 1.0);
  }`;

// The floor: near-black polished concrete, a light pool under the swarm and under the lit building (with a
// contact shadow below the footprint), a faint 5 m grid that only shows where its cells are large on screen.
export const FLOOR_VERT = /* glsl */ `
  varying vec3 vW;
  void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

export const FLOOR_FRAG = /* glsl */ `
  uniform vec3 uVoid, uAccent, uCam;
  uniform float uFog, uPoolA, uPoolB, uGridA, uShadow;
  uniform vec3 uSlab; // half w, half d, corner r
  varying vec3 vW;
  SIMPLEX
  float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main() {
    vec2 xz = vW.xz;
    float dist = length(vW - uCam);
    float n1 = snoise(vec3(xz * 0.07, 0.0));
    float n2 = snoise(vec3(xz * 0.55, 3.1));
    float tex = 0.78 + 0.16 * n1 + 0.06 * n2;
    float r2 = dot(xz, xz);
    float pool = uPoolA * exp(-r2 / (44.0 * 44.0)) + uPoolB * exp(-r2 / (19.0 * 19.0));
    float sd = sdRound(xz, uSlab.xy, uSlab.z);
    float shadow = 1.0 - uShadow * (1.0 - smoothstep(-1.5, 4.0, sd));
    vec3 col = uVoid + uAccent * pool * tex * shadow;
    vec2 g = xz / 10.0;
    vec2 fw = max(fwidth(g), vec2(1e-5));
    vec2 gd = abs(fract(g - 0.5) - 0.5) / fw;
    float line = 1.0 - clamp(min(gd.x, gd.y) - 1.0, 0.0, 1.0);
    float cellPx = 1.0 / max(fw.x, fw.y);
    float gridFade = smoothstep(14.0, 44.0, cellPx);
    col += uAccent * line * gridFade * uGridA * (0.5 + 0.5 * tex) * (0.35 + 6.0 * pool);
    float f = exp(-pow(uFog * dist, 2.0));
    gl_FragColor = vec4(mix(uVoid, col, f), 1.0);
  }`;

// ---------- layout ----------
/** Slot targets for every agent: floor f, then RING perimeter agents and INNER (8 × 7) inner agents. */
export function buildSlots(THREE, rand) {
  const slots = new Float32Array(N * 4); // x y z yaw
  const sweepPos = new Float32Array(N);
  const onFloor = new Float32Array(N); // brightness on the floor
  const coreOn = new Float32Array(N);
  const floorOf = new Uint8Array(N);
  const inset = 0.75;
  const ring = (() => {
    const s = new THREE.Shape();
    const w = SLAB.w - 2 * inset;
    const h = SLAB.d - 2 * inset;
    const r = SLAB.r - inset;
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
    return s.getSpacedPoints(RING);
  })();
  for (let f = 0; f < NF; f++) {
    const y = FLOOR_Y(f) + RC + 0.03;
    for (let j = 0; j < PER; j++) {
      const i = f * PER + j;
      let x;
      let z;
      let yaw;
      if (j < RING) {
        const a = ring[j];
        const b = ring[(j + 1) % RING];
        x = a.x; z = a.y;
        yaw = Math.atan2(b.y - a.y, b.x - a.x);
        onFloor[i] = 1.0; coreOn[i] = 0.55;
      } else {
        const g = j - RING; // 8 × 7 loose grid of single agents at work, jittered so it never reads as a pattern
        const cx = g % 8;
        const rz = Math.floor(g / 8);
        x = -7.7 + cx * 2.2 + (rand() - 0.5) * 1.0;
        z = -4.2 + rz * 1.4 + (rand() - 0.5) * 0.5;
        yaw = (rand() < 0.3 ? Math.PI / 2 : 0) + (rand() - 0.5) * 0.4;
        onFloor[i] = 0.15; coreOn[i] = 0.1; // quiet: the lit rims carry the shape
      }
      slots.set([x, y, z, yaw], i * 4);
      sweepPos[i] = (x + SLAB.w / 2) / SLAB.w;
      floorOf[i] = f;
    }
  }
  return { slots, sweepPos, onFloor, coreOn, floorOf };
}

/** Rounded-rect slab with a bevelled edge (extruded), top face at y = 0, centred on the origin. */
export function slabGeometry(THREE) {
  const { w, d, r, t } = SLAB;
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + d - r);
  s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + d);
  s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  const bevel = 0.07;
  const geo = new THREE.ExtrudeGeometry(s, { depth: t - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 });
  geo.rotateX(-Math.PI / 2); // shape plane → floor plane, extrusion → up
  geo.translate(0, -(t - bevel), 0); // top face at y = 0
  geo.computeVertexNormals();
  return geo;
}

/** Procedural roughness: smudges, fine grain and a few scratches (grey canvas, no downloads). */
export function roughnessCanvas(rand, size = 512) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = 'rgb(118,118,118)';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) { // soft smudges
    const x = rand() * size; const y = rand() * size; const r = 12 + rand() * 70;
    const v = Math.round(90 + rand() * 70);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(${v},${v},${v},0.35)`);
    grd.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) { // fine scratches, brighter (rougher)
    const x = rand() * size; const y = rand() * size; const a = rand() * Math.PI; const l = 20 + rand() * 120;
    g.strokeStyle = `rgba(200,200,200,${0.12 + rand() * 0.2})`;
    g.lineWidth = 0.6 + rand() * 1.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) { // grain
    const n = (rand() - 0.5) * 26;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, img.data[i] + n));
  }
  g.putImageData(img, 0, 0);
  return c;
}
