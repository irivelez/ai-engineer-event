// ART DIRECTION: "powers of ten, for agents".
// References: Eames' Powers of Ten (one continuous pull-back), starling murmurations, GTC Berlin 2026's lit night
//   architecture, DevDay 2026's restraint (one colour, lots of void).
// Palette: the keynote's accent blue (#93AAFF) for bodies and light, white-hot cores only; near-black void and floor.
// Light: the agents are the light; room IBL + a cool key and a blue rim on dark glass floors; glossy floor reflection.
// Camera: s0 one eased pull-back from a macro on one agent (shallow focus) to the whole murmuration; s1 one slow
//   push-in (12° of orbit) while eight floors lock in, a day each; s2 holds. The frame that sells it: the
//   eighth floor locking in with a white sweep, the last agents streaming down, the tower doubled in the floor.
//
// swarm (gl-1): 1,024 agents ("over 1,000" in facts.json: just over, never more than the source implies); eight floors
// for the eight days are a metaphor for the build progressing. Positions are analytic in the vertex shader (see _swarm-gl.js), the camera is a pure
// function of (murmuration clock, pull, camera state), so render mode and goto(i, { animate:false }) are exact.
// Last step: Anthropic's own clip of the operating system (evidence item for this moment) plays in a frame beside
// the result line, with its chip, its own disclaimer and a QR to the video, while the tower dims behind it.
import { gsap } from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { factSource, splitFigure, place, smooth } from './_worlds/gl1-kit.js';
import {
  K, SPEED, U_HERO, NF, PER, N, SLAB, FLOOR_Y, HL, RC, RACE0, DAY, SWEEP, LOCK, B_END,
  heroPos, HEAD_VERT, HEAD_FRAG, TRAIL_VERT, TRAIL_FRAG, FLOOR_VERT, FLOOR_FRAG, buildSlots, slabGeometry, roughnessCanvas,
} from './_swarm-gl.js';

const T_RENDER = 7.0; // murmuration clock used by render mode (the live pull-back lands near it)
const PULL_AT = 1.5; // s0: macro hold before the pull-back
const PULL_DUR = 4.8;
// Wide camera states (spherical, degrees, metres; shiftX = lens shift in stage px so the subject sits right of the type).
const CAM = [
  { tx: 0, ty: 24, tz: 0, az: -22, pol: 84, dist: 118, fov: 30, shiftX: 400, ap: 5 },
  { tx: 0, ty: 11.5, tz: 0, az: -10, pol: 77, dist: 74, fov: 30, shiftX: 440, ap: 7 },
  { tx: 0, ty: 7, tz: 0, az: -12, pol: 78, dist: 112, fov: 30, shiftX: 410, ap: 6 },
];
// The macro: 4.6 m from the hero, 16° round and 5° above the wide shot's own axis, so the pull-back is one
// straight dolly out (the sheet of agents faces the lens there); long lens, wide aperture.
const MAC = { daz: 16, dpol: -5, dist: 4.6, fov: 26, shiftX: 400, ap: 64 };

export default {
  id: 'swarm',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode, tokens } = ctx;
    const { THREE, makeWorld, helpers: H, renderer } = gl;
    const rand = H.seeded('swarm-agents');
    // lookdev/QA only: ?render=1&m=swarm&s=<step>&swarmT=<s> renders that step's animation at <s> seconds
    const dbgT = renderMode ? parseFloat(new URLSearchParams(location.search).get('swarmT')) : NaN;

    // ---------- world ----------
    const world = makeWorld({
      fov: 30, far: 900,
      post: { bloom: { intensity: 0.9, threshold: 0.9, smoothing: 0.25, radius: 0.62 }, vignette: { offset: 0.3, darkness: 0.62 } },
    });
    const voidCol = H.color('void');
    const accent = H.color('accent');
    world.scene.background = voidCol.clone();
    world.scene.fog = new THREE.FogExp2(voidCol.clone(), 0.004);
    // image-based light: a neutral room, prefiltered once
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envRT = world.track(pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 }));
    world.scene.environment = envRT.texture;
    room.dispose();
    pmrem.dispose();
    // the floors' own environment: a dark studio with one soft overhead panel and a blue strip behind
    const studio = new THREE.Scene();
    const panel = (w, h, col, pos, look) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(...look); studio.add(m); return m;
    };
    // nothing near the horizon: grazing reflections on the glass stay black; only bevels catch the strips
    panel(9, 9, new THREE.Color(0.32, 0.34, 0.4), [0, 10, 0], [0, 0, 0]);
    panel(24, 1.0, accent.clone().multiplyScalar(0.9), [0, 7, -8], [0, 0, 0]);
    panel(1.0, 6, new THREE.Color(0.22, 0.25, 0.32), [-8, 6, 3], [0, 0, 0]);
    const pmrem2 = new THREE.PMREMGenerator(renderer);
    const studioRT = world.track(pmrem2.fromScene(studio, 0.03, 0.1, 100, { size: 128 }));
    studio.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    pmrem2.dispose();
    const key = new THREE.DirectionalLight(new THREE.Color('#DCE4FF'), 0.3);
    key.position.set(-30, 50, 40);
    const rim = new THREE.DirectionalLight(accent.clone(), 0.45);
    rim.position.set(22, 14, -50);
    world.add(key, rim);

    // ---------- agents ----------
    const L = buildSlots(THREE, H.seeded('swarm-desks'));
    const aBand = new Float32Array(N * 4);
    const aSlot = L.slots;
    const aOrg = new Float32Array(N * 4);
    const aLook = new Float32Array(N * 4);
    const HERO = (NF - 1) * PER + 3; // the hero ends on the top floor's front edge
    for (let i = 0; i < N; i++) {
      const hero = i === HERO;
      const v = (rand() * 2 - 1);
      const w = (rand() + rand() + rand()) / 1.5 - 1; // denser mid-sheet
      aBand.set([hero ? U_HERO : rand(), hero ? 0 : Math.sign(v) * Math.pow(Math.abs(v), 0.8), hero ? 0 : w, rand()], i * 4);
      const f = L.floorOf[i];
      const arr = LOCK(f) + L.sweepPos[i] * SWEEP - 0.05;
      const dep = Math.max(0, arr - (1.25 + 0.6 * rand()));
      aOrg.set([dep, arr, L.sweepPos[i], LOCK(f)], i * 4);
      aLook.set([0.82 + 0.36 * rand(), L.onFloor[i], L.coreOn[i], hero ? 1 : 0], i * 4);
    }
    const inst = {
      aBand: new THREE.InstancedBufferAttribute(aBand, 4),
      aSlot: new THREE.InstancedBufferAttribute(aSlot, 4),
      aOrg: new THREE.InstancedBufferAttribute(aOrg, 4),
      aLook: new THREE.InstancedBufferAttribute(aLook, 4),
    };
    function agentGeo(base) {
      const g = new THREE.InstancedBufferGeometry();
      Object.entries(base).forEach(([k, a]) => (k === 'index' ? g.setIndex(a) : g.setAttribute(k, a)));
      Object.entries(inst).forEach(([k, a]) => g.setAttribute(k, a));
      g.instanceCount = N;
      return g;
    }
    const headGeo = agentGeo({
      position: new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3),
      aCorner: new THREE.BufferAttribute(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), 2),
      index: [0, 1, 2, 2, 1, 3],
    });
    const trailGeo = (() => {
      const tr = [];
      const pos = [];
      const idx = [];
      for (let k = 0; k <= K; k++) for (const s of [-1, 1]) { tr.push(k, s); pos.push(0, 0, 0); }
      for (let k = 0; k < K; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
      return agentGeo({ position: new THREE.BufferAttribute(new Float32Array(pos), 3), aTr: new THREE.BufferAttribute(new Float32Array(tr), 2), index: idx });
    })();
    world.track(headGeo); world.track(trailGeo);
    const U = {
      uTime: { value: T_RENDER }, uBuild: { value: 0 }, uBuildRate: { value: 0 }, uMirror: { value: 0 }, uRes: { value: new THREE.Vector2(1920, 1080) },
      uScale: { value: 2000 }, uFocus: { value: 120 }, uAperture: { value: 5 }, uCocMax: { value: 70 }, uFog: { value: 0.004 },
      uIntensity: { value: 1.45 }, uCoreI: { value: 2.5 }, uDim: { value: 0 }, uHeroHead: { value: 1 }, uTrailDt: { value: 0.07 },
      uRefl: { value: 0.4 }, uMinR: { value: 1.6 }, uCurl: { value: 1.0 }, uSpace: { value: 0 }, uGather: { value: 0 }, uNearK: { value: 0 }, uAccent: { value: accent.clone() },
    };
    const UM = { ...U, uMirror: { value: 1 } };
    const SIMPLEX = H.noise.glsl;
    const agentMat = (vert, frag, uniforms, mirror) => new THREE.ShaderMaterial({
      uniforms, vertexShader: vert, fragmentShader: frag,
      transparent: !mirror, depthWrite: false, depthTest: !mirror, blending: THREE.AdditiveBlending,
    });
    // reflections are drawn in the opaque pass, right after the floor and before the floors' glass
    const reflTrails = new THREE.Mesh(trailGeo, agentMat(TRAIL_VERT, TRAIL_FRAG, UM, true));
    const reflHeads = new THREE.Mesh(headGeo, agentMat(HEAD_VERT, HEAD_FRAG, UM, true));
    const trails = new THREE.Mesh(trailGeo, agentMat(TRAIL_VERT, TRAIL_FRAG, U, false));
    const heads = new THREE.Mesh(headGeo, agentMat(HEAD_VERT, HEAD_FRAG, U, false));
    reflTrails.renderOrder = -9; reflHeads.renderOrder = -8; trails.renderOrder = 10; heads.renderOrder = 11;
    [reflTrails, reflHeads, trails, heads].forEach((m) => { m.frustumCulled = false; world.add(m); });
    const bufSize = new THREE.Vector2();
    heads.onBeforeRender = (r, scene, camera) => {
      r.getDrawingBufferSize(bufSize);
      U.uRes.value.copy(bufSize);
      U.uScale.value = bufSize.y / (2 * Math.tan((camera.fov * Math.PI) / 360));
      U.uMinR.value = 1.6 * (bufSize.y / 1080);
      U.uAperture.value = S.apNow * (bufSize.y / 1080);
      U.uCocMax.value = 70 * (bufSize.y / 1080);
    };
    reflTrails.onBeforeRender = heads.onBeforeRender;

    // ---------- the floor plane ----------
    const floorU = {
      uVoid: { value: voidCol.clone() }, uAccent: { value: accent.clone() }, uCam: { value: new THREE.Vector3() }, uFog: { value: 0.004 },
      uPoolA: { value: 0.06 }, uPoolB: { value: 0 }, uGridA: { value: 0.12 }, uShadow: { value: 0 },
      uSlab: { value: new THREE.Vector3(SLAB.w / 2, SLAB.d / 2, SLAB.r) },
    };
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.ShaderMaterial({
      uniforms: floorU, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG.replace('SIMPLEX', SIMPLEX), depthWrite: true,
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.renderOrder = -10;
    world.add(floor);

    // ---------- the eight floors: dark glass slabs that a light sweep locks in ----------
    const roughTex = world.track(new THREE.CanvasTexture(roughnessCanvas(H.seeded('swarm-rough'), 256)));
    roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(0.09, 0.09);
    const slabGeo = world.track(slabGeometry(THREE));
    const slabs = [];
    for (let f = 0; f < NF; f++) {
      const su = { uFront: { value: -99 }, uBand: { value: 0 }, uLit: { value: 0 }, uDimS: { value: 1 }, uAccentS: { value: accent.clone() } };
      const m = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#05070B'), metalness: 0.0, roughness: 0.45, roughnessMap: roughTex,
        clearcoat: 0.35, clearcoatRoughness: 0.3, envMap: studioRT.texture, envMapIntensity: 0.6,
      });
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, su);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWp;\nuniform float uFront, uBand, uLit, uDimS;\nuniform vec3 uAccentS;')
          .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vWp.x > uFront) discard;')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n'
            + 'float fbd = (uFront - vWp.x) / 0.5;\n'
            + 'totalEmissiveRadiance += vec3(1.0) * (exp(-fbd * fbd) * 1.6 * uBand) + uAccentS * (0.035 * uLit);')
          .replace('#include <opaque_fragment>', 'outgoingLight *= uDimS;\n#include <opaque_fragment>');
      };
      const mesh = new THREE.Mesh(slabGeo, m);
      mesh.position.y = FLOOR_Y(f);
      mesh.visible = false;
      world.add(mesh);
      slabs.push({ mesh, su, lock: LOCK(f) });
    }

    // ---------- the hero agent up close: a glass pill with a white-hot filament ----------
    const hero = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.CapsuleGeometry(RC * 1.04, HL * 2, 8, 28), new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0B1430'), roughness: 0.07, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
      transparent: true, opacity: 0.62, envMapIntensity: 2.2, emissive: accent.clone(), emissiveIntensity: 0.55, depthWrite: false,
    }));
    const filament = new THREE.Mesh(new THREE.CapsuleGeometry(RC * 0.36, HL * 1.7, 6, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5.4, 6.4), transparent: true, depthWrite: false }));
    hero.add(shell, filament);
    shell.renderOrder = 12; filament.renderOrder = 13;
    world.add(hero);

    // ---------- DOM ----------
    const g = 'void';
    const src = factSource(ctx, (beat.facts || [])[0], copy.kicker);
    const scrim = C.Scrim.create({ ground: g, side: 'left', extent: 0.66, strength: 0.95 });
    const floorScrim = C.Scrim.create({ ground: g, side: 'bottom', extent: 0.24, strength: 0.9 }); // keeps the footer band calm
    const n1 = C.BigNumber.create({ display: copy.n, label: copy.nLabel, size: 'display', ground: g });
    const dParts = splitFigure(copy.d);
    const n2 = C.BigNumber.create({ display: dParts.figure, unit: dParts.unit || undefined, label: copy.dLabel, size: 'display', ground: g });
    // the evidence clip (real Anthropic video) plays on the last step
    const ev = ((ctx.assets.evidenceFor && ctx.assets.evidenceFor(beat.id)) || []).find((e) => e.kind === 'video') || null;
    const clip = ev && C.EvidenceVideo ? C.EvidenceVideo.create({ item: ev, kind: ev.chip || src.kind, width: tokens.spanW(6), qr: true, qrSize: 246, ground: g }) : null;
    const result = C.Headline.create({ text: copy.result, role: 'h2', ground: g, width: clip ? tokens.spanW(6) : 870 });
    const source = C.SourceLine.create({ kind: src.kind, text: src.text, ground: g });
    root.append(scrim.el, floorScrim.el, n1.el, n2.el, result.el, source.el);
    if (clip) root.append(clip.el);
    place(n1.el, 128, 168);
    place(n2.el, 128, 560);
    place(result.el, 128, clip ? 168 : 336);
    place(source.el, 128, 988);
    if (clip) place(clip.el, tokens.colX(6), 168);
    const strip = n2.el.querySelector('.bn-strip'); // the day digit's odometer strip (races 1 → 8)
    const finalDay = parseInt(dParts.figure, 10) || 8;
    const cellY = (cell) => -cell * 5;
    const muted = tokens.colors.lightSoft;
    const fg = tokens.colors.light;

    // ---------- state ----------
    // S: pull (macro → wide), build (s1 clock, seconds), dim (s2), plus the wide camera state.
    const S = { pull: 1, build: 0, dim: 0, ...CAM[0], apNow: CAM[0].ap };
    let clock = T_RENDER;
    let curStep = 0;

    // ---------- camera: a pure function of (clock, S) ----------
    const cam = world.camera;
    const D2R = Math.PI / 180;
    const v = { L: new THREE.Vector3(), A: new THREE.Vector3(), B: new THREE.Vector3(), T: new THREE.Vector3(), N: new THREE.Vector3(), Bn: new THREE.Vector3(),
      dirW: new THREE.Vector3(), tgtW: new THREE.Vector3(), dirM: new THREE.Vector3(), tgtM: new THREE.Vector3(), off: new THREE.Vector3(),
      dir: new THREE.Vector3(), tgt: new THREE.Vector3(), foc: new THREE.Vector3(), Y: new THREE.Vector3(0, 1, 0) };
    let lastShift = NaN;
    let lastFov = NaN;
    function heroFrame(t) {
      heroPos(t, v.L);
      heroPos(t + 0.02, v.A);
      heroPos(t - 0.02, v.B);
      v.T.subVectors(v.A, v.B).normalize();
      v.N.crossVectors(v.T, v.Y);
      if (v.N.lengthSq() < 1e-8) v.N.set(1, 0, 0);
      v.N.normalize();
      v.Bn.crossVectors(v.N, v.T);
    }
    function applyCamera(t) {
      const br = renderMode ? 0 : 0.18; // a breath, not an orbit
      const az = (S.az + Math.sin(t * 0.21) * br) * D2R;
      const pol = (S.pol + Math.sin(t * 0.17 + 1.3) * br * 0.5) * D2R;
      v.dirW.set(Math.sin(pol) * Math.sin(az), Math.cos(pol), Math.sin(pol) * Math.cos(az));
      v.tgtW.set(S.tx, S.ty, S.tz);
      const p = S.pull;
      let fov = S.fov;
      let shift = S.shiftX;
      let dist = S.dist;
      let ap = S.ap;
      if (p < 0.9999) {
        heroFrame(t);
        const azm = (S.az + MAC.daz) * D2R;
        const polm = (S.pol + MAC.dpol) * D2R;
        v.dirM.set(Math.sin(polm) * Math.sin(azm), Math.cos(polm), Math.sin(polm) * Math.cos(azm));
        const dm = MAC.dist;
        v.tgtM.copy(v.L);
        dist = Math.exp(Math.log(dm) + (Math.log(S.dist) - Math.log(dm)) * p);
        v.dir.copy(v.dirM).lerp(v.dirW, smooth(0, 0.85, p)).normalize();
        v.tgt.copy(v.tgtM).lerp(v.tgtW, smooth(0.2, 1.0, p));
        fov = MAC.fov + (S.fov - MAC.fov) * p;
        shift = MAC.shiftX + (S.shiftX - MAC.shiftX) * p;
        ap = MAC.ap + (S.ap - MAC.ap) * smooth(0, 0.25, p);
        v.foc.copy(v.L).lerp(v.tgtW, smooth(0.25, 0.95, p));
      } else {
        v.dir.copy(v.dirW);
        v.tgt.copy(v.tgtW);
        v.foc.copy(v.tgtW);
      }
      cam.position.copy(v.tgt).addScaledVector(v.dir, dist);
      cam.up.set(0, 1, 0);
      cam.lookAt(v.tgt);
      if (fov !== lastFov || shift !== lastShift) {
        cam.fov = fov;
        cam.setViewOffset(1920, 1080, -shift, 0, 1920, 1080);
        cam.updateProjectionMatrix();
        lastFov = fov; lastShift = shift;
      }
      U.uFocus.value = cam.position.distanceTo(v.foc);
      S.apNow = ap;
      // the hero pill: only up close
      const heroVis = 1 - smooth(0.1, 0.38, p);
      hero.visible = heroVis > 0.002;
      if (hero.visible) {
        hero.position.copy(v.L);
        hero.quaternion.setFromUnitVectors(v.Y, v.T);
        shell.material.opacity = 0.62 * heroVis;
        filament.material.opacity = heroVis;
      }
      U.uHeroHead.value = 1 - heroVis;
      U.uSpace.value = 1 - smooth(0.25, 0.75, p);
      U.uNearK.value = 1 - smooth(0.82, 1.0, p);
    }

    // ---------- per-frame GL state from S ----------
    function applyGL() {
      const b = S.build;
      U.uBuild.value = b;
      U.uGather.value = smooth(0, 5.5, b);
      U.uDim.value = S.dim;
      let lit = 0;
      for (const sl of slabs) {
        const s = (b - sl.lock) / SWEEP; // 0 → 1 while the sweep crosses the floor
        sl.mesh.visible = s > 0;
        sl.su.uFront.value = -SLAB.w / 2 - 0.6 + (SLAB.w + 1.2) * Math.min(1, Math.max(0, s)) + (s >= 1 ? 50 : 0);
        sl.su.uBand.value = s > 0 ? Math.max(0, 1 - Math.max(0, s - 1) * 2.2) : 0;
        sl.su.uLit.value = Math.min(1, Math.max(0, s));
        sl.su.uDimS.value = 1 - 0.75 * S.dim;
        lit += Math.min(1, Math.max(0, s));
      }
      const litF = lit / NF;
      floorU.uPoolA.value = 0.06 * (1 - 0.6 * litF) * (1 - 0.7 * S.dim);
      floorU.uPoolB.value = 0.16 * litF * (1 - 0.7 * S.dim);
      floorU.uShadow.value = 0.85 * Math.min(1, lit);
      floorU.uGridA.value = 0.12 * (1 - 0.8 * S.dim);
      floorU.uCam.value.copy(cam.position);
      key.intensity = 0.3 * (1 - 0.7 * S.dim);
      rim.intensity = 0.45 * (1 - 0.7 * S.dim);
    }

    function show(c, key2, want, tl, at, animate) {
      if (want === vis[key2]) return false;
      vis[key2] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
      return animate && want;
    }
    // A figure that lands whole: drop the odometer's entry roll, so no intermediate value (no "999+") is ever on
    // screen. The figure keeps the component's own calm rise and fade.
    function landWhole(bn) {
      const cols = [...bn.el.querySelectorAll('.bn-col')];
      gsap.getTweensOf(cols.map((c) => c.firstElementChild)).forEach((t) => t.kill());
      cols.forEach((c) => gsap.set(c.firstElementChild, { yPercent: cellY(+c.dataset.d + 10) }));
    }
    const vis = { n1: false, n2: false, result: false, src: false, scrim: false, floor: false, clip: false };
    function raceEase(p) { // seven quick rolls, one per day, in sync with the floors
      const t = p * (7 * DAY + 0.3);
      let r = 0;
      for (let k = 1; k <= 7; k++) { const x = Math.min(1, Math.max(0, (t - (k * DAY - 0.1)) / 0.3)); r += 1 - (1 - x) * (1 - x); }
      return r / 7;
    }

    function stateTo(step, animate, entering = false, force = false) {
      const A = (animate && !renderMode) || force;
      curStep = step;
      const tl = gsap.timeline();
      const withClip = !!clip && step === 2;
      const c = CAM[step];
      // s0 on entry: hold on one agent, then one continuous pull-back (log-distance, power3) to the whole swarm
      if (entering) {
        if (A) tl.fromTo(S, { pull: 0 }, { pull: 1, duration: PULL_DUR, ease: 'expo.inOut' }, PULL_AT);
        else tl.set(S, { pull: 1 }, 0);
      }
      const camDur = step === 1 ? 8.6 : step === 2 ? 2.2 : 3.2;
      const camEase = step === 1 ? 'power2.inOut' : 'power3.inOut';
      if (A) tl.to(S, { tx: c.tx, ty: c.ty, tz: c.tz, az: c.az, pol: c.pol, dist: c.dist, fov: c.fov, shiftX: c.shiftX, ap: c.ap, duration: camDur, ease: camEase }, 0);
      else tl.set(S, { tx: c.tx, ty: c.ty, tz: c.tz, az: c.az, pol: c.pol, dist: c.dist, fov: c.fov, shiftX: c.shiftX, ap: c.ap }, 0);
      const bT = step >= 1 ? B_END : 0;
      if (A && step === 1 && S.build < B_END) tl.to(S, { build: B_END, duration: B_END - S.build, ease: 'none' }, 0);
      else if (A && step === 0 && S.build > 0) tl.to(S, { build: 0, duration: 2.6, ease: 'power2.inOut' }, 0);
      else tl.set(S, { build: bT }, 0);
      const dimT = withClip ? 1 : 0;
      if (A) tl.to(S, { dim: dimT, duration: 0.9, ease: 'sine.inOut' }, 0);
      else tl.set(S, { dim: dimT }, 0);

      // DOM
      if (show(n1, 'n1', step <= 1, tl, A ? (entering ? PULL_AT + 2.6 : 0) : 0, A)) landWhole(n1);
      if (step === 1) {
        if (A) tl.to(n1.el, { '--g-fg': muted, duration: 0.6, ease: 'sine.inOut' }, 0);
        else tl.set(n1.el, { '--g-fg': muted }, 0);
      } else if (step === 0) tl.set(n1.el, { '--g-fg': fg }, 0); // on s2 it leaves muted (no flash of white on exit)
      const wantN2 = step === 1;
      if (wantN2 && !vis.n2 && A) {
        vis.n2 = true;
        n2.in(tl, RACE0);
        landWhole(n2); // the day digit is driven by the race below only: 1, 2 … 8, each a true day count
        if (strip) tl.fromTo(strip, { yPercent: cellY(11) }, { yPercent: cellY(finalDay + 10), duration: 7 * DAY + 0.3, ease: raceEase }, RACE0);
      } else show(n2, 'n2', wantN2, tl, 0, A);
      show(result, 'result', step === 2, tl, A ? (clip ? 0.5 : 1.2) : 0, A);
      if (clip) show(clip, 'clip', withClip, tl, A ? 0.8 : 0, A); // in() starts the clip; → never waits for it
      // with the clip, its own meta line carries the chip and the source: one chip per frame
      show(source, 'src', !withClip, tl, A ? (entering ? PULL_AT + 3.2 : 0) : 0, A);
      show(scrim, 'scrim', true, tl, 0, A);
      show(floorScrim, 'floor', true, tl, 0, A);
      return tl;
    }

    let lastBuild = 0;
    let dbgDone = false;
    return {
      steps: beat.steps.length,
      world,
      enter() {
        clock = renderMode ? T_RENDER : 0;
        Object.assign(S, CAM[0], { build: 0, dim: 0, pull: renderMode ? 1 : 0 });
        return stateTo(0, true, true);
      },
      goto(step, { animate }) { return stateTo(step, animate); },
      exit() {
        const tl = gsap.timeline();
        tl.to(S, { dist: S.dist * 1.04, duration: 0.8, ease: 'power2.in' }, 0);
        if (clip) tl.call(() => clip.pause(), null, 0.8); // keeps moving through the transition, then freezes (no empty card)
        return tl;
      },
      update(time, dt) {
        if (renderMode && !Number.isNaN(dbgT) && !dbgDone) { // lookdev: the animated state of this step at swarmT s
          dbgDone = true;
          const step = curStep;
          if (step > 0) stateTo(step - 1, false).progress(1);
          const tl = stateTo(step, true, step === 0, true);
          tl.pause();
          tl.seek(dbgT);
          clock = step === 0 ? dbgT : T_RENDER + dbgT;
          U.uBuildRate.value = step === 1 && dbgT < B_END ? 1 : 0;
        }
        if (!renderMode) clock += Math.min(Math.max(dt, 0), 0.1);
        U.uTime.value = clock;
        if (!renderMode && dt > 0) U.uBuildRate.value += ((S.build - lastBuild) / dt - U.uBuildRate.value) * 0.35;
        else if (!renderMode) U.uBuildRate.value = 0;
        lastBuild = S.build;
        applyCamera(clock);
        applyGL();
      },
      dispose() {
        gsap.killTweensOf([S, n1.el, strip].filter(Boolean));
        [scrim, floorScrim, n1, n2, result, source, clip].filter(Boolean).forEach((c) => c.destroy());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
