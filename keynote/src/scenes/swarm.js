// swarm (gl-1): the peak of the night. 2,048 agents as soft GPU light with short trails swirl out of one point,
// then self-organize into eight layers (one per day, the counter races 1 → 8), then the layers fold into a
// minimal laptop whose screen lights with a boot line. Everything is analytic in the vertex shader (no CPU
// simulation): position = f(time, per-agent orbit, organize progress, laptop progress), so render mode and
// goto(i, { animate:false }) are exact.
import { gsap } from 'gsap';
import { factSource, splitFigure, place, makeRig, SOFT_POINT_FRAG, roundedRectPoints, smooth } from './_worlds/gl1-kit.js';

const LAYERS = 8;
const PER = 384; // agents per layer: 176 on the outline + 208 on the inner grid (16 × 13)
const N = LAYERS * PER; // 3,072 agents ("1,000+")
const T = 14; // trail samples per agent (head + 13)
const DAY = 0.8; // seconds per day while the counter races
const LAYER_Y = (k) => -2.8 + k * 0.8;
const PLATE = { w: 11.4, d: 7.4, r: 0.75 };

// Laptop geometry (world units). Base top at y = YB, hinge near the back edge, lid leaning back.
const YB = -1.6;
const LAP = { w: 11.6, d: 7.6, r: 0.6, thick: 0.34, sw: 11.2, sh: 7.2, sr: 0.45, tilt: (13 * Math.PI) / 180, hingeZ: -3.55 };

// Camera per step (spherical, degrees; shiftX = lens shift in stage px so the object sits right of the text).
const CAM = [
  { az: -14, pol: 63, r: 30, tx: 0, ty: 0.6, tz: 0, shiftX: 420, orbitAmp: 16 },
  { az: -33, pol: 64, r: 31, tx: 0, ty: 0.2, tz: 0, shiftX: 380, orbitAmp: 9 },
  { az: -18, pol: 76, r: 30.5, tx: 0, ty: 1.9, tz: -0.4, shiftX: 470, orbitAmp: 0 },
];

const VERT = /* glsl */ `
  uniform float uTime, uScale, uSize, uSpawn, uOrganize, uOrgRate, uLaptop, uLapRate, uTrailDt, uIntensity, uTwinkle;
  uniform vec3 uColA, uColB;
  attribute vec3 aLap;     // laptop target
  attribute vec4 aOrbit;   // r0, phase, omega, wobble
  attribute vec3 aU;       // orbit plane basis
  attribute vec3 aV;
  attribute vec4 aMisc;    // seed, organize start, trail index, laptop delay
  attribute vec2 aBr;      // brightness in the laptop (x) and in the layers (y)
  varying vec3 vColor;
  varying float vAlpha;
  SIMPLEX

  vec3 swirlAt(float t) {
    float a = aOrbit.y + aOrbit.z * t;
    float r = aOrbit.x * (1.0 + 0.07 * sin(t * 0.5 + aMisc.x * 6.2831));
    vec3 n = cross(aU, aV);
    vec3 p = aU * (cos(a) * r) + aV * (sin(a) * r) + n * (aOrbit.w * sin(2.0 * a + aMisc.x * 12.0));
    vec3 q = p * 0.13 + vec3(0.0, 0.0, t * 0.07);
    p += 0.75 * vec3(snoise(q), 0.6 * snoise(q + vec3(17.1, 3.2, 0.0)), snoise(q + vec3(0.0, 31.7, 9.4)));
    return p;
  }

  void main() {
    float k = aMisc.z;
    float tk = uTime - k * uTrailDt;
    float seed = aMisc.x;

    // 1) the swarm, spawned from one point
    vec3 sw = swirlAt(tk);
    float sp = clamp(uSpawn * 1.45 - seed * 0.45, 0.0, 1.0);
    sp = 1.0 - pow(1.0 - sp, 3.0);
    sw *= sp;

    // 2) self-organize into layer aMisc.y (organize runs 0 → 8, one unit per day)
    float orgK = uOrganize - k * uTrailDt * uOrgRate;
    float o = smoothstep(aMisc.y, aMisc.y + 0.55, orgK);
    vec3 st = position;
    vec3 bend = vec3(0.0, 2.2 + seed * 1.5, 0.0);
    vec3 p = mix(sw, st, o) + bend * (4.0 * o * (1.0 - o));

    // 3) fold into the laptop
    float lapK = uLaptop - k * uTrailDt * uLapRate;
    float l = smoothstep(aMisc.w, aMisc.w + 0.45, lapK);
    vec3 bendL = vec3(0.0, 1.4, 1.2 + seed);
    p = mix(p, aLap, l) + bendL * (4.0 * l * (1.0 - l));

    // trail visibility: hidden once the agent holds still
    float oh = smoothstep(aMisc.y, aMisc.y + 0.55, uOrganize);
    float lh = smoothstep(aMisc.w, aMisc.w + 0.45, uLaptop);
    float done = lh > 0.0 ? lh : oh;
    float trailVis = (k < 0.5) ? 1.0 : (1.0 - smoothstep(0.82, 1.0, done));
    float fall = 1.0 - k / ${T}.0;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = max(0.5, -mv.z);
    float size = uSize * (0.75 + 0.5 * fract(seed * 7.13)) * (k < 0.5 ? 1.0 : 0.42 + 0.5 * fall);
    size *= mix(1.0, 1.25, oh * (1.0 - lh));
    size *= mix(1.0, 0.82, l);
    gl_PointSize = clamp(size * uScale / depth, 2.0, 48.0);

    // colour: agents in accent and light; the laptop resolves toward light
    vec3 c = mix(uColA, uColB, step(0.66, fract(seed * 3.71)));
    c = mix(c, uColB, l * 0.55);
    // twinkle while they work inside the layers (soft, per agent, never in sync)
    float tw = 0.5 + 0.5 * sin(uTime * (1.3 + 2.1 * fract(seed * 5.3)) + seed * 40.0);
    float work = mix(1.0, 0.62 + 0.55 * tw * tw, uTwinkle * oh * (1.0 - lh));
    // each agent flashes as it snaps into its layer, then settles to its place in the grid
    float arr = uOrganize - (aMisc.y + 0.55);
    float flash = 1.0 + 1.7 * step(0.0, arr) * exp(-arr * 2.6) * (1.0 - lh);
    float bright = mix(mix(1.0, aBr.y, oh * (1.0 - lh)), aBr.x, l) * work * flash;
    float a = (k < 0.5 ? 1.0 : 0.72 * pow(fall, 1.2)) * trailVis * sp;
    a *= smoothstep(0.6, 3.0, depth);
    vColor = c * uIntensity * bright;
    vAlpha = a;
  }`;

const SCREEN_FRAG = /* glsl */ `
  uniform float uScreen, uBoot;
  uniform vec3 uColA, uColB;
  uniform vec2 uSize;
  varying vec2 vUv;
  float sdBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    // the screen's own light: brighter centre, eased to the bezel
    float g = 1.0 - smoothstep(0.0, 0.62, length((vUv - vec2(0.5, 0.55)) * vec2(1.0, 1.35)));
    vec3 col = uColA * (0.045 + 0.11 * g * g) * uScreen;
    // boot line: a rounded track with a bright fill
    vec2 b = p - vec2(0.0, -0.55);
    float hw = 2.3; float hh = 0.085;
    float track = 1.0 - smoothstep(-0.012, 0.012, sdBox(b, vec2(hw, hh), hh));
    float fillEdge = -hw + 2.0 * hw * uBoot;
    float fill = track * (1.0 - smoothstep(fillEdge - 0.02, fillEdge + 0.02, b.x)) * step(0.001, uBoot);
    col += uColB * track * 0.22 * uScreen;
    col += uColB * fill * 2.4;
    gl_FragColor = vec4(col, 1.0);
  }`;

export default {
  id: 'swarm',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode, tokens } = ctx;
    const { THREE, makeWorld, helpers: H } = gl;
    const rand = H.seeded('swarm-agents');

    // ---------- world ----------
    const world = makeWorld({
      fov: 32,
      post: { bloom: { intensity: 1.05, threshold: 0.55, smoothing: 0.3, radius: 0.8 }, vignette: { offset: 0.3, darkness: 0.66 } },
    });
    world.scene.background = H.gradientTexture([['#080B15', 0], ['#05070A', 1]], { radial: true });

    // ---------- targets ----------
    const struct = new Float32Array(N * 3);
    const layerOf = new Uint8Array(N);
    const structBright = new Float32Array(N);
    const OUT = 176;
    const outline = roundedRectPoints(THREE, PLATE.w - 0.3, PLATE.d - 0.3, PLATE.r, OUT);
    for (let L = 0; L < LAYERS; L++) {
      for (let j = 0; j < PER; j++) {
        const i = L * PER + j;
        let x;
        let z;
        if (j < OUT) { x = outline[j].x; z = outline[j].y; structBright[i] = 1.0; } else {
          const g = j - OUT; // 16 × 13 grid: the agents themselves draw each layer
          x = -4.5 + (g % 16) * 0.6;
          z = -2.7 + Math.floor(g / 16) * 0.45;
          structBright[i] = 0.6;
        }
        struct[i * 3] = x; struct[i * 3 + 1] = LAYER_Y(L); struct[i * 3 + 2] = z;
        layerOf[i] = L;
      }
    }

    // laptop targets: lid outline, base top, base bottom edge, trackpad, keyboard rows
    const lap = [];
    const lapBright = [];
    const lapDelay = [];
    const cosT = Math.cos(LAP.tilt);
    const sinT = Math.sin(LAP.tilt);
    const lid = (u, v) => [u, YB + v * cosT, LAP.hingeZ - v * sinT];
    roundedRectPoints(THREE, LAP.sw, LAP.sh, LAP.sr, 960).forEach((pt) => {
      const v = pt.y + LAP.sh / 2 + 0.15;
      lap.push(lid(pt.x, v)); lapBright.push(1.0); lapDelay.push(0.3 + 0.24 * (v / (LAP.sh + 0.3)));
    });
    roundedRectPoints(THREE, LAP.w, LAP.d, LAP.r, 840).forEach((pt) => { lap.push([pt.x, YB, pt.y]); lapBright.push(0.9); lapDelay.push(0.02); });
    roundedRectPoints(THREE, LAP.w, LAP.d, LAP.r, 450).forEach((pt) => { lap.push([pt.x, YB - LAP.thick, pt.y]); lapBright.push(0.42); lapDelay.push(0.0); });
    roundedRectPoints(THREE, 3.8, 2.3, 0.25, 210).forEach((pt) => { lap.push([pt.x, YB + 0.001, pt.y + 2.15]); lapBright.push(0.55); lapDelay.push(0.12); });
    {
      const need = N - lap.length; // keyboard: five dashed rows (key gaps)
      const rows = 6;
      const per = Math.ceil(need / rows);
      let made = 0;
      for (let r = 0; r < rows && made < need; r++) {
        const z = -3.0 + r * 0.48;
        for (let c = 0; c < per * 2 && made < need; c++) {
          const x = -4.7 + c * 0.072;
          if (x > 4.7) break;
          if (((x + 4.7) % 0.72) < 0.16) continue; // gap between keys
          lap.push([x, YB + 0.001, z]); lapBright.push(0.38); lapDelay.push(0.08 + 0.02 * r); made++;
        }
      }
      while (lap.length < N) { lap.push([0, YB, 0]); lapBright.push(0); lapDelay.push(0.1); }
    }
    // match struct → laptop by x so the fold flows sideways without crossings
    const byX = (arr) => [...arr.keys()].sort((a, b) => arr[a][0] - arr[b][0] || arr[a][2] - arr[b][2]);
    const structList = Array.from({ length: N }, (_, i) => [struct[i * 3], struct[i * 3 + 1], struct[i * 3 + 2]]);
    const sOrder = byX(structList);
    const lOrder = byX(lap);
    const lapOf = new Int32Array(N);
    for (let r = 0; r < N; r++) lapOf[sOrder[r]] = lOrder[r];

    // ---------- agent attributes (per trail vertex) ----------
    const V = N * T;
    const aPos = new Float32Array(V * 3);
    const aLap = new Float32Array(V * 3);
    const aOrbit = new Float32Array(V * 4);
    const aU = new Float32Array(V * 3);
    const aV = new Float32Array(V * 3);
    const aMisc = new Float32Array(V * 4);
    const aBr = new Float32Array(V * 2);
    const n = new THREE.Vector3();
    const u = new THREE.Vector3();
    const v = new THREE.Vector3();
    const e = new THREE.Euler();
    for (let i = 0; i < N; i++) {
      // a vortex with three loose arms: mostly rigid rotation (the arms persist), a little shear
      const r0 = 1.4 + 8.2 * Math.pow(rand(), 0.72);
      e.set((rand() - 0.5) * 0.42, 0, (rand() - 0.5) * 0.42);
      n.set(0, 1, 0).applyEuler(e).normalize();
      u.set(0, 0, 1).cross(n).normalize();
      v.copy(n).cross(u).normalize();
      const arm = i % 3;
      const phase = arm * 2.0944 + 1.85 * Math.log(r0) + (rand() - 0.5) * (0.5 + 0.06 * r0);
      const omega = 0.34 * (1.18 - 0.028 * r0) * (0.92 + 0.16 * rand());
      const wobble = (0.15 + 0.55 * rand()) * (0.5 + 0.08 * r0);
      const seed = rand();
      const orgStart = layerOf[i] + 0.42 * rand();
      const li = lapOf[i];
      const delay = lapDelay[li] + 0.06 * rand();
      for (let k = 0; k < T; k++) {
        const vi = i * T + k;
        aPos.set([struct[i * 3], struct[i * 3 + 1], struct[i * 3 + 2]], vi * 3);
        aLap.set(lap[li], vi * 3);
        aOrbit.set([r0, phase, omega, wobble], vi * 4);
        aU.set([u.x, u.y, u.z], vi * 3);
        aV.set([v.x, v.y, v.z], vi * 3);
        aMisc.set([seed, orgStart, k, delay], vi * 4);
        aBr[vi * 2] = lapBright[li];
        aBr[vi * 2 + 1] = structBright[i];
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
    geo.setAttribute('aLap', new THREE.BufferAttribute(aLap, 3));
    geo.setAttribute('aOrbit', new THREE.BufferAttribute(aOrbit, 4));
    geo.setAttribute('aU', new THREE.BufferAttribute(aU, 3));
    geo.setAttribute('aV', new THREE.BufferAttribute(aV, 3));
    geo.setAttribute('aMisc', new THREE.BufferAttribute(aMisc, 4));
    geo.setAttribute('aBr', new THREE.BufferAttribute(aBr, 2));
    const U = {
      uTime: { value: 0 }, uScale: { value: 1000 }, uSize: { value: 0.14 }, uSpawn: { value: 1 }, uOrganize: { value: 0 }, uOrgRate: { value: 0 },
      uLaptop: { value: 0 }, uLapRate: { value: 0 }, uTrailDt: { value: 0.05 }, uIntensity: { value: 3.0 }, uTwinkle: { value: renderMode ? 0 : 1 },
      uColA: { value: H.color('accent') }, uColB: { value: H.color('light') },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: U, vertexShader: VERT.replace('SIMPLEX', H.noise.glsl), fragmentShader: SOFT_POINT_FRAG,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    const agents = new THREE.Points(geo, mat);
    agents.frustumCulled = false;
    const bufSize = new THREE.Vector2();
    agents.onBeforeRender = (renderer, scene, camera) => {
      renderer.getDrawingBufferSize(bufSize);
      U.uScale.value = bufSize.y / (2 * Math.tan((camera.fov * Math.PI) / 360));
    };
    world.add(agents);

    // depth: a faint far field
    const dust = world.add(H.particles({ count: 1400, spread: [80, 44, 50], center: [0, 0, -18], size: 0.07, colors: ['light', 'accent'], intensity: 0.5, drift: 0.5, seed: 'swarm-dust' }));

    // the vortex's core: a soft light that the agents leave as they spawn, quiet once they organize
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256; glowCanvas.height = 256;
    {
      const g2 = glowCanvas.getContext('2d');
      const grd = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
      [[0, 1], [0.18, 0.62], [0.4, 0.22], [0.65, 0.06], [1, 0]].forEach(([p, a2]) => grd.addColorStop(p, `rgba(255,255,255,${a2})`));
      g2.fillStyle = grd; g2.fillRect(0, 0, 256, 256);
    }
    const glowTex = world.track(new THREE.CanvasTexture(glowCanvas));
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: H.color('accent', 2.2), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: H.color('accent', 0.32), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
    core.scale.setScalar(3.2);
    halo.scale.setScalar(19);
    world.add(halo, core);

    // the lid's screen light + boot line
    const screenU = { uScreen: { value: 0 }, uBoot: { value: 0 }, uColA: { value: H.color('accent') }, uColB: { value: H.color('light') }, uSize: { value: new THREE.Vector2(LAP.sw - 0.5, LAP.sh - 0.5) } };
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(LAP.sw - 0.5, LAP.sh - 0.5),
      new THREE.ShaderMaterial({
        uniforms: screenU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: SCREEN_FRAG,
      }),
    );
    {
      const vMid = LAP.sh / 2 + 0.15;
      const c = lid(0, vMid);
      screen.position.set(c[0], c[1], c[2]);
      screen.rotation.x = -LAP.tilt;
    }
    world.add(screen);

    // ---------- DOM ----------
    const g = 'void';
    const src = factSource(ctx, (beat.facts || [])[0], copy.kicker);
    const scrim = C.Scrim.create({ ground: g, side: 'left', extent: 0.66, strength: 0.95 });
    const floor = C.Scrim.create({ ground: g, side: 'bottom', extent: 0.24, strength: 0.9 }); // keeps the footer band calm
    const n1 = C.BigNumber.create({ display: copy.n, label: copy.nLabel, size: 'display', ground: g });
    const dParts = splitFigure(copy.d);
    const n2 = C.BigNumber.create({ display: dParts.figure, unit: dParts.unit || undefined, label: copy.dLabel, size: 'display', ground: g });
    const result = C.Headline.create({ text: copy.result, role: 'h2', ground: g, width: 870 });
    const source = C.SourceLine.create({ kind: src.kind, text: src.text, ground: g });
    root.append(scrim.el, floor.el, n1.el, n2.el, result.el, source.el);
    place(n1.el, 128, 168);
    place(n2.el, 128, 560);
    place(result.el, 128, 336);
    place(source.el, 128, 988);
    const strip = n2.el.querySelector('.bn-strip'); // the day digit's odometer strip (races 1 → 8)
    const finalDay = parseInt(dParts.figure, 10) || 8;
    const cellY = (cell) => -cell * 5;
    const muted = tokens.colors.lightSoft;
    const fg = tokens.colors.light;

    // ---------- camera ----------
    const rig = makeRig(THREE, world.camera, { ...CAM[0], orbitAmp: renderMode ? 0 : CAM[0].orbitAmp, breathe: renderMode ? 0 : 0.5 });

    // ---------- state ----------
    const vis = { n1: false, n2: false, result: false, src: false, scrim: false, floor: false };
    function show(c, key, want, tl, at, animate) {
      if (want === vis[key]) return;
      vis[key] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
    }
    function raceEase(p) { // seven quick rolls, one per day, in sync with the layers
      const t = p * (7 * DAY + 0.3);
      let v = 0;
      for (let k = 1; k <= 7; k++) { const x = Math.min(1, Math.max(0, (t - (k * DAY - 0.1)) / 0.3)); v += 1 - (1 - x) * (1 - x); }
      return v / 7;
    }

    function stateTo(step, animate, entering = false) {
      const A = animate && !renderMode;
      const tl = gsap.timeline();
      const cam = { ...CAM[step], orbitAmp: renderMode ? 0 : CAM[step].orbitAmp };
      tl.add(rig.to(cam, { duration: A ? (step === 2 ? 5 : 4.4) : 0, ease: 'power3.inOut' }), 0);
      const org = step >= 1 ? LAYERS : 0;
      const lapT = step >= 2 ? 1 : 0;
      if (A && step === 1 && U.uOrganize.value < org) tl.to(U.uOrganize, { value: org, duration: LAYERS * DAY, ease: 'none' }, 0.4);
      else tl.set(U.uOrganize, { value: org }, 0);
      if (A && step === 2 && U.uLaptop.value < 1) tl.to(U.uLaptop, { value: 1, duration: 3.8, ease: 'none' }, 0.15);
      else tl.set(U.uLaptop, { value: lapT }, 0);
      const scr = step >= 2 ? 1 : 0;
      if (A && step === 2) {
        tl.to(screenU.uScreen, { value: 1, duration: 1.4, ease: 'power2.out' }, 3.3);
        tl.fromTo(screenU.uBoot, { value: 0 }, { value: 1, duration: 2.0, ease: 'power2.inOut' }, 3.9);
      } else {
        tl.set(screenU.uScreen, { value: scr }, 0);
        tl.set(screenU.uBoot, { value: scr }, 0);
      }
      if (entering) {
        if (A) tl.fromTo(U.uSpawn, { value: 0 }, { value: 1, duration: 3.2, ease: 'power2.out' }, 0);
        else tl.set(U.uSpawn, { value: 1 }, 0);
      }

      // DOM
      show(n1, 'n1', step <= 1, tl, A ? (entering ? 1.1 : 0) : 0, A);
      if (step === 1) {
        if (A) tl.to(n1.el, { '--g-fg': muted, duration: 0.6, ease: 'sine.inOut' }, 0);
        else tl.set(n1.el, { '--g-fg': muted }, 0);
      } else tl.set(n1.el, { '--g-fg': fg }, 0);
      const wantN2 = step === 1;
      if (wantN2 && !vis.n2 && A) {
        vis.n2 = true;
        n2.in(tl, 0.4);
        if (strip) tl.fromTo(strip, { yPercent: cellY(11) }, { yPercent: cellY(finalDay + 10), duration: 7 * DAY + 0.3, ease: raceEase }, 0.4);
      } else show(n2, 'n2', wantN2, tl, 0, A);
      show(result, 'result', step === 2, tl, A ? 2.4 : 0, A);
      show(source, 'src', true, tl, A ? (entering ? 1.7 : 0) : 0, A);
      show(scrim, 'scrim', true, tl, 0, A);
      show(floor, 'floor', true, tl, 0, A);
      return tl;
    }

    let lastOrg = 0;
    let lastLap = 0;
    return {
      steps: beat.steps.length,
      world,
      enter() { return stateTo(0, true, true); },
      goto(step, { animate }) { return stateTo(step, animate); },
      exit() {
        const tl = gsap.timeline();
        tl.to(rig.state, { r: rig.state.r - 2.5, duration: 0.8, ease: 'power2.in', onUpdate: rig.apply }, 0);
        return tl;
      },
      update(time, dt) {
        U.uTime.value = renderMode ? 0 : time;
        // rates let each trail sample read the organize/fold progress a few frames back
        if (dt > 0) {
          U.uOrgRate.value += ((U.uOrganize.value - lastOrg) / dt - U.uOrgRate.value) * 0.3;
          U.uLapRate.value += ((U.uLaptop.value - lastLap) / dt - U.uLapRate.value) * 0.3;
        } else { U.uOrgRate.value = 0; U.uLapRate.value = 0; }
        lastOrg = U.uOrganize.value;
        lastLap = U.uLaptop.value;
        const o = U.uOrganize.value;
        dust.update(renderMode ? 0 : time);
        const sp = U.uSpawn.value;
        const live = (1 - smooth(0, 3, o)) * (1 - U.uLaptop.value);
        core.material.opacity = live * (0.85 + 1.2 * (1 - sp) * smooth(0, 0.08, sp));
        halo.material.opacity = live * (0.7 + 0.3 * sp);
        core.scale.setScalar(3.2 * (0.6 + 0.4 * sp));
        rig.update(renderMode ? 0 : time);
      },
      dispose() {
        gsap.killTweensOf([rig.state, U.uOrganize, U.uLaptop, U.uSpawn, screenU.uScreen, screenU.uBoot, n1.el, strip].filter(Boolean));
        [scrim, floor, n1, n2, result, source].forEach((c) => c.destroy());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
