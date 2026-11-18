// Labs world (gl-1), shared by three-labs and release-pace: a dark reflective floor, three luminous monoliths
// (one per lab, lab colours from tokens), and three light tracks that run from each monolith's foot into depth
// along a time axis (1 Sep → 17 Nov 2026) where releases fire as beads. Reflections are mirrored copies under a
// semi-transparent floor (cheap, exact, no second render pass).

export const MONO = { w: 2.1, h: 7.4, d: 0.8, gap: 6.4 };
export const TRACK = { z0: 0.2, len: 46 };
export const DAY0 = Date.UTC(2026, 8, 1); // 1 Sep 2026
export const DAYS = 77; //                   → 17 Nov 2026
export const monoX = (k) => (k - 1) * MONO.gap;
export const dateZ = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return null;
  const d = (Date.UTC(+m[1], +m[2] - 1, +m[3]) - DAY0) / 86400000;
  return TRACK.z0 - 1.2 - (d / DAYS) * (TRACK.len - 2.4);
};
export function labKey(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('anthropic')) return 'anthropic';
  if (n.includes('openai')) return 'openai';
  if (n.includes('google') || n.includes('gemini')) return 'google';
  return null;
}

const MONO_VERT = /* glsl */ `
  uniform float uRise, uMirror;
  varying vec3 vL; varying vec3 vN; varying float vY; varying float vD;
  void main(){
    vec3 p = position;
    p.y -= (1.0 - uRise) * ${MONO.h.toFixed(2)};
    vL = position; vN = normal;
    vec4 w = modelMatrix * vec4(p, 1.0);
    w.y *= uMirror;
    vY = w.y;
    vec4 mv = viewMatrix * w; vD = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const MONO_FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uGlow, uMirror, uOpacity;
  varying vec3 vL; varying vec3 vN; varying float vY; varying float vD;
  void main(){
    if (uMirror > 0.0 ? vY < 0.0 : vY > 0.0) discard;   // emerge through the floor; mirror stays below it
    vec3 hs = vec3(${(MONO.w / 2).toFixed(3)}, ${(MONO.h / 2).toFixed(3)}, ${(MONO.d / 2).toFixed(3)});
    vec3 q = vL - vec3(0.0, hs.y, 0.0);
    vec3 n = abs(vN);
    // distance to the nearest edge inside this face, in pixels
    vec2 inPlane = n.x > 0.5 ? q.zy : (n.z > 0.5 ? q.xy : q.xz);
    vec2 hp = n.x > 0.5 ? hs.zy : (n.z > 0.5 ? hs.xy : hs.xz);
    vec2 d = hp - abs(inPlane);
    vec2 fw = fwidth(inPlane) + 1e-4;
    float edgePx = min(d.x / fw.x, d.y / fw.y);
    float edge = 1.0 - smoothstep(1.2, 2.6, edgePx);
    float h = clamp(vL.y / ${MONO.h.toFixed(2)}, 0.0, 1.0);
    float face = n.z > 0.5 ? 1.0 : (n.x > 0.5 ? 0.62 : 0.4);
    vec3 body = uColor * (0.06 + 0.46 * pow(h, 1.6)) * face * uGlow;
    vec3 col = body + uColor * edge * 1.9 * uGlow;
    float a = uOpacity;
    if (uMirror < 0.0) { float fade = exp(vY * 0.42); col *= 0.55 * fade; }
    gl_FragColor = vec4(col * a, 1.0);
  }`;

export function buildLabs(ctx, { labs }) {
  const { THREE, makeWorld, helpers: H } = ctx.gl;
  const world = makeWorld({
    fov: 30, far: 400,
    post: { bloom: { intensity: 0.9, threshold: 0.6, smoothing: 0.3, radius: 0.74 }, vignette: { offset: 0.26, darkness: 0.66 } },
  });
  world.scene.background = H.gradientTexture([['#0B1120', 0], ['#05070A', 1]], { radial: true });
  const colors = labs.map((l) => H.color(`lab.${labKey(l.lab) || 'openai'}`));

  // ---------- monoliths + mirrored copies ----------
  const geo = new THREE.BoxGeometry(MONO.w, MONO.h, MONO.d);
  geo.translate(0, MONO.h / 2, 0);
  const monos = colors.map((c, k) => {
    const mk = (mirror) => {
      const u = { uRise: { value: 0 }, uMirror: { value: mirror }, uColor: { value: c }, uGlow: { value: 1 }, uOpacity: { value: 1 } };
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: MONO_VERT, fragmentShader: MONO_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.position.set(monoX(k), 0, 0);
      m.frustumCulled = false;
      m.renderOrder = mirror < 0 ? 0 : 2;
      world.add(m);
      return u;
    };
    const top = mk(1);
    const mir = mk(-1);
    return { top, mir, set(rise, glow = 1, opacity = 1) { top.uRise.value = mir.uRise.value = rise; top.uGlow.value = mir.uGlow.value = glow; top.uOpacity.value = mir.uOpacity.value = opacity; } };
  });

  // ---------- floor: dark glass with lab light pools and a faint 2 px grid ----------
  const floorU = {
    uC0: { value: colors[0] }, uC1: { value: colors[1] }, uC2: { value: colors[2] }, uPool: { value: 0 }, uGrid: { value: H.color('lightSoft', 0.05) },
    uBase: { value: new THREE.Color('#05070A') }, uTrack: { value: 0 },
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShaderMaterial({
    uniforms: floorU, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: /* glsl */ `
      uniform vec3 uC0, uC1, uC2, uGrid, uBase; uniform float uPool; varying vec3 vW; varying float vD;
      float pool(vec2 p, float x){ vec2 d = (p - vec2(x, 0.3)) * vec2(0.42, 0.62); return exp(-dot(d, d)); }
      void main(){
        vec2 p = vW.xz;
        vec3 col = uBase;
        col += (uC0 * pool(p, ${monoX(0).toFixed(2)}) + uC1 * pool(p, ${monoX(1).toFixed(2)}) + uC2 * pool(p, ${monoX(2).toFixed(2)})) * 0.16 * uPool;
        vec2 g = abs(fract(p / 2.0 + 0.5) - 0.5) * 2.0;
        vec2 fw = fwidth(p) + 1e-4;
        float line = max(1.0 - smoothstep(fw.x * 1.0, fw.x * 2.0, g.x * 1.0), 1.0 - smoothstep(fw.y * 1.0, fw.y * 2.0, g.y * 1.0));
        float detail = 1.0 - smoothstep(0.05, 0.2, max(fw.x, fw.y));
        float far = exp(-vD * 0.012);
        col += uGrid * line * detail * far;
        float alpha = mix(0.97, 0.7, exp(-vD * 0.03));
        gl_FragColor = vec4(col, alpha);
      }`,
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = 1;
  world.add(floor);

  // atmosphere
  const dust = world.add(H.particles({ count: 900, spread: [60, 18, 60], center: [0, 7, -14], size: 0.05, colors: ['light', 'accent'], intensity: 0.5, drift: 0.6, driftSpeed: 0.05, seed: 'labs-dust' }));

  // ---------- tracks along the time axis (release-pace) ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const trackU = [];
  const tracks = colors.map((c, k) => {
    const curve = new THREE.LineCurve3(V(monoX(k), 0.06, TRACK.z0), V(monoX(k), 0.06, TRACK.z0 - TRACK.len));
    const u = { uColor: { value: c.clone().multiplyScalar(1.5) }, uDraw: { value: 0 }, uOpacity: { value: 1 } };
    trackU.push(u);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.055, 8, false), new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying float vT; void main(){ vT = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uColor; uniform float uDraw, uOpacity; varying float vT; void main(){ float on = 1.0 - smoothstep(uDraw - 0.01, uDraw, vT); gl_FragColor = vec4(uColor * on * uOpacity * (0.55 + 0.45 * (1.0 - vT)), 1.0); }',
    }));
    m.renderOrder = 3;
    world.add(m);
    return m;
  });
  // week ticks across the three tracks (12 ticks = 11 weeks)
  const tickMat = new THREE.MeshBasicMaterial({ color: H.color('lightSoft', 0.5), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const tickGeo = new THREE.PlaneGeometry(2 * MONO.gap + 2.4, 0.07);
  const ticks = [];
  for (let wk = 0; wk <= 11; wk++) {
    const z = TRACK.z0 - 1.2 - ((wk * 7) / DAYS) * (TRACK.len - 2.4);
    const t = new THREE.Mesh(tickGeo, tickMat);
    t.rotation.x = -Math.PI / 2;
    t.position.set(0, 0.02, Math.max(TRACK.z0 - TRACK.len + 1.2, z));
    t.renderOrder = 3;
    world.add(t);
    ticks.push(t);
  }

  return {
    world, THREE, H, monos, floorU, trackU, tracks, tickMat, colors,
    update(time) { dust.update(time); },
  };
}
