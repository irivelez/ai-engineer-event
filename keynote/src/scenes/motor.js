// motor (hero): Paul David's dynamo lesson, filmed like a documentary in a c.1900 machine shop.
// References: LoC "Westinghouse Works, 1904" (line shaft, forest of leather belts); Ford Highland Park, 1913 (flow line, a motor per machine).
// Palette: tungsten/sepia brick, oiled iron, leather and deep shadow (s0-s1) → whitewash and clean daylight (s2-s3).
// Light: low sun through a few clear sawtooth panes and the end windows, beams in haze with dust only inside them, IBL for metal, one shadow sun.
// Camera: 30° lens. s0 eye-level dolly + rack focus belt → flywheel; s1 down the hall to the shaft's end; s2 crane up and turn back over the new floor; s3 held soft wide.
// The frame that sells it: s0, the forest of belts backlit in the beams, the flywheel turning at the far end.
import { gsap } from 'gsap';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { factsSource, provKind, place } from './_worlds/gl2-kit.js';
import { ironTex, leatherTex, brickTex, floorTex, BELT_REPEAT } from './_motor-tex.js';
import * as G from './_motor-geo.js';

const PI = Math.PI;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const easeOut3 = (x) => { const t = clamp01(x); return 1 - (1 - t) ** 3; };

// sun travel directions (from the sun into the hall): low morning sun from the far end, then high clean noon
const D_MORNING = V(0.22, -0.6, 0.77).normalize();
const D_NOON = V(0.3, -0.55, -0.78).normalize(); // s2-s3: afternoon sun from the near end, into the held wide
const SHAFT_OMEGA = PI * 0.9; // rad/s: ~27 rpm, slow enough that spokes read on Zoom
const R_SHAFT_PULLEY = 0.42;

// camera: end pose of each step (pos, look) and the waypoints of the move into it
const S0_START = { pos: V(-1.15, 1.6, 9.8), look: V(-0.7, 2.6, -28.6) };
const POSE = [
  { pos: V(-1.45, 1.62, 3.95), look: V(-0.9, 2.7, -28.6) },
  { pos: V(-3.9, 3.2, -21.0), look: V(1.77, 3.7, -30.4) },
  { pos: V(-3.0, 6.6, -33.3), look: V(1.3, 0.4, -6.0) },
  { pos: V(-3.0, 6.6, -33.3), look: V(1.3, 0.4, -6.0) },
];
const VIA = [[], [V(-2.3, 2.0, 1.0), V(-3.8, 2.6, -9)], [V(-4.3, 5.3, -27.8)], []];
// look-target waypoints: in s2 the lens turns to the hall early, so the cascade happens in frame
const LOOK_VIA = [[], [], [V(3.2, 2.0, -15.5)], []];

export default {
  id: 'motor',
  gl: true,
  create(ctx) {
    const { root, copy, gl, components: C, renderMode, tokens } = ctx;
    const { makeWorld, helpers: H, renderer } = gl;
    const fDavid = ctx.facts('david-dynamo');
    const rand = H.seeded('motor-hall');

    const world = makeWorld({
      fov: 30, near: 0.1, far: 140, background: '#120d09',
      post: {
        bloom: { intensity: 0.5, threshold: 1.25, smoothing: 0.4, radius: 0.72 },
        vignette: { offset: 0.3, darkness: 0.7 },
        dof: { focus: 5, range: 2, bokeh: 2.5 },
        grain: 0,
      },
    });
    const { scene, camera } = world;
    const dofCfg = world.post.dof;
    scene.fog = new THREE.FogExp2(new THREE.Color('#1c130c'), 0.02);
    // One shadow-casting sun (the renderer's shadow switch is on in src/gl/system.js). Its map is redrawn every
    // other frame (shadows here move slowly), and the renderer's default is restored after this world renders.
    let shadowFrame = 0;
    let sunMoving = true;
    scene.onBeforeRender = (r) => {
      shadowFrame += 1;
      r.shadowMap.autoUpdate = false;
      r.shadowMap.needsUpdate = renderMode || sunMoving || shadowFrame % 2 === 1;
      sunMoving = false;
    };
    scene.onAfterRender = (r) => { r.shadowMap.autoUpdate = true; };

    // ---------- image-based light ----------
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envRT = pmrem.fromScene(room, 0.04);
    pmrem.dispose();
    room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.22;
    world.track(envRT);

    // ---------- lights ----------
    const sun = new THREE.DirectionalLight(0xffffff, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.025;
    scene.add(sun, sun.target);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
    scene.add(hemi);
    const hallCorners = [];
    for (const x of [G.HALL.x0 - 0.7, G.HALL.x1 + 0.7]) for (const y of [-0.3, G.HALL.roofHi + 0.5]) for (const z of [G.HALL.z0 - 0.7, G.HALL.z1 + 0.7]) hallCorners.push(V(x, y, z));
    const hallCenter = V(0, 4.5, (G.HALL.z0 + G.HALL.z1) / 2);
    const tv = new THREE.Vector3();
    function fitShadow(D) {
      sun.target.position.copy(hallCenter);
      sun.position.copy(hallCenter).addScaledVector(D, -70);
      sun.updateMatrixWorld();
      sun.target.updateMatrixWorld();
      const sc = sun.shadow.camera;
      sc.position.copy(sun.position);
      sc.lookAt(hallCenter);
      sc.updateMatrixWorld();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const c of hallCorners) {
        tv.copy(c).applyMatrix4(sc.matrixWorldInverse);
        x0 = Math.min(x0, tv.x); x1 = Math.max(x1, tv.x); y0 = Math.min(y0, tv.y); y1 = Math.max(y1, tv.y); z0 = Math.min(z0, tv.z); z1 = Math.max(z1, tv.z);
      }
      Object.assign(sc, { left: x0, right: x1, bottom: y0, top: y1, near: Math.max(0.5, -z1 - 1), far: -z0 + 1 });
      sc.updateProjectionMatrix();
    }

    // ---------- materials ----------
    const T = { iron: ironTex(rand), leather: leatherTex(rand), brick: brickTex(rand), floor: floorTex(rand) };
    const wash = { value: 0 };
    const paint = new THREE.MeshStandardMaterial({ color: '#4a5a4f', roughness: 0.95, metalness: 0.25, map: T.iron.map, roughnessMap: T.iron.rough });
    const steel = new THREE.MeshStandardMaterial({ color: '#aaa49b', roughness: 0.92, metalness: 0.9, roughnessMap: T.iron.rough });
    const castIron = new THREE.MeshStandardMaterial({ color: '#3a342e', roughness: 1, metalness: 0.45, map: T.iron.map, roughnessMap: T.iron.rough });
    const stone = new THREE.MeshStandardMaterial({ color: '#a8988a', roughness: 0.9, map: T.iron.map });
    // in the redesigned hall the ironwork is painted too (a light grey-green), so the daylight frame is not a cage of black bars
    castIron.onBeforeCompile = (sh) => {
      sh.uniforms.uWash = wash;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uWash;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.54, 0.51) * (0.75 + 0.5 * dot(diffuseColor.rgb, vec3(0.33))), uWash * 0.85);');
    };
    const brick = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, map: T.brick.map, bumpMap: T.brick.bump, bumpScale: 2.0 });
    brick.onBeforeCompile = (sh) => {
      sh.uniforms.uWash = wash;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uWash;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.87, 0.8) * (0.8 + 0.4 * lum), uWash);');
    };
    const floorMat = new THREE.MeshStandardMaterial({ color: '#b3a594', roughness: 1, map: T.floor.map, roughnessMap: T.floor.rough, envMapIntensity: 0.55 });
    floorMat.onBeforeCompile = (sh) => {
      sh.uniforms.uWash = wash;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uWash;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.35 + 0.04, uWash);');
    };
    const roofMat = new THREE.MeshStandardMaterial({ color: '#3d3129', roughness: 0.95, side: THREE.DoubleSide, map: T.iron.map });
    roofMat.onBeforeCompile = brick.onBeforeCompile;
    const rubber = new THREE.MeshStandardMaterial({ color: '#191512', roughness: 0.75 });
    const brass = new THREE.MeshStandardMaterial({ color: '#b48d52', roughness: 0.35, metalness: 1, roughnessMap: T.iron.rough });
    const motorPaint = new THREE.MeshPhysicalMaterial({ color: '#3f7350', roughness: 0.5, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.28, map: T.iron.map, roughnessMap: T.iron.rough });
    const smallPaint = new THREE.MeshStandardMaterial({ color: '#2f4c39', roughness: 0.45, metalness: 0.2, map: T.iron.map });
    // the old drive (shaft, pulleys, hangers, the big motor) fades in s2: its own transparent materials
    const fading = { value: 1 };
    const old = (m) => { const c = m.clone(); c.transparent = true; c.onBeforeCompile = m.onBeforeCompile; return c; };
    const oldIron = old(castIron);
    const oldSteel = old(steel);
    const oldMotor = old(motorPaint);
    const oldBrass = old(brass);
    const oldRubber = old(rubber);
    const oldShaft = old(new THREE.MeshStandardMaterial({ color: '#77706a', roughness: 0.75, metalness: 0.85, roughnessMap: T.iron.rough }));
    const OLD_MATS = [oldIron, oldSteel, oldMotor, oldBrass, oldRubber, oldShaft];

    function paneTexture(cols, rows, dirt) {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const g = c.getContext('2d');
      g.fillStyle = '#000';
      g.fillRect(0, 0, 256, 256);
      const bw = 7;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const v = 1 - dirt * rand();
        g.fillStyle = `rgb(${255 * v | 0},${250 * v | 0},${240 * v | 0})`;
        g.fillRect((i * 256) / cols + bw / 2, (j * 256) / rows + bw / 2, 256 / cols - bw, 256 / rows - bw);
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    }
    const glass = (tex) => new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1, 1, 1) });
    const winTex = paneTexture(3, 6, 0.35);
    const roofTex = paneTexture(6, 3, 0.5);
    const glassL = glass(winTex), glassR = glass(winTex), glassEnd = glass(winTex), glassNear = glass(winTex), glassClear = glass(roofTex), glassDirty = glass(roofTex);

    // ---------- the hall ----------
    const hall = G.hallGeometry();
    const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = cast;
      m.receiveShadow = receive;
      return world.add(m);
    };
    mesh(hall.brick, brick);
    mesh(hall.stone, stone);
    mesh(hall.iron, castIron);
    mesh(hall.roof, roofMat);
    mesh(hall.winL, glassL, { cast: false, receive: false });
    mesh(hall.winR, glassR, { cast: false, receive: false });
    mesh(hall.winEnd, glassEnd, { cast: false, receive: false });
    mesh(hall.winNear, glassNear, { cast: false, receive: false });
    {
      const clear = [], dirty = [];
      const isClear = (k, i) => G.CLEAR_PANES.some(([a, b]) => a === k && b === i);
      hall.roofGlass.forEach((p) => (isClear(p.k, p.i) ? clear : dirty).push(p.geo));
      mesh(G.merge(clear), glassClear, { cast: false, receive: false });
      mesh(G.merge(dirty), glassDirty, { cast: true, receive: false });
    }
    const floorGeo = G.worldUV(new THREE.PlaneGeometry(G.HALL.x1 - G.HALL.x0 + 1, G.HALL.z1 - G.HALL.z0 + 1).rotateX(-PI / 2).translate(0, 0, (G.HALL.z0 + G.HALL.z1) / 2), 8);
    mesh(floorGeo, floorMat, { cast: false });

    // soft contact shadows (ambient occlusion under machines; they travel with them)
    const blobTex = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      gr.addColorStop(0, 'rgba(0,0,0,0.8)');
      gr.addColorStop(0.55, 'rgba(0,0,0,0.42)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c);
      return t;
    })();
    const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, color: 0x000000, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    blobMat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor = vec4(0.0, 0.0, 0.0, texture2D(map, vMapUv).a * opacity);'); };
    const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2).translate(0, 0.006, 0);

    // ---------- machines: two rows tied to the shaft (old) → one line along a conveyor (new) ----------
    const LATHE = G.latheGeometry();
    const DRILL = G.drillGeometry();
    const machines = [];
    const LEFT = ['lathe', 'lathe', 'drill', 'lathe', 'drill', 'lathe', 'lathe', 'drill'];
    const RIGHT = ['drill', 'lathe', 'drill', 'drill', 'lathe', 'drill', 'lathe', 'drill'];
    for (let k = 0; k < 8; k++) {
      machines.push({ type: LEFT[k], side: -1, old: { x: -2.5, z: 3 - G.BAY * k, th: 0 } });
      machines.push({ type: RIGHT[k], side: 1, old: { x: 2.5, z: 1 - G.BAY * k, th: PI } });
    }
    machines.forEach((m, j) => {
      m.j = j;
      m.nu = { x: 1.35, z: 4.9 - 2.15 * j, th: m.side < 0 ? -PI / 2 : 1.5 * PI };
      m.cur = { ...m.old };
      m.pul = m.type === 'lathe' ? G.LATHE_PULLEY : G.DRILL_PULLEY;
      m.angle = 0;
    });
    const lathes = machines.filter((m) => m.type === 'lathe');
    const drills = machines.filter((m) => m.type === 'drill');
    const inst = (geo, mat, n, { cast = true } = {}) => {
      const im = new THREE.InstancedMesh(geo, mat, n);
      im.castShadow = cast;
      im.receiveShadow = true;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.frustumCulled = false;
      return world.add(im);
    };
    const imLatheP = inst(LATHE.paint, paint, lathes.length);
    const imLatheB = inst(LATHE.bright, steel, lathes.length);
    const imDrillP = inst(DRILL.paint, paint, drills.length);
    const imDrillB = inst(DRILL.bright, steel, drills.length);
    const coneL = G.conePulley(G.LATHE_PULLEY.radii, G.LATHE_PULLEY.step);
    const coneD = G.conePulley(G.DRILL_PULLEY.radii, G.DRILL_PULLEY.step);
    const imConeL = inst(coneL, castIron, lathes.length);
    const imConeD = inst(coneD, castIron, drills.length);
    const SM = G.smallMotorGeometry();
    const imSmallP = inst(SM.paint, smallPaint, 16, { cast: false });
    const imSmallD = inst(SM.dark, rubber, 16, { cast: false });
    const imBlob = inst(blobGeo, blobMat, 16, { cast: false });
    imBlob.receiveShadow = false;
    imBlob.renderOrder = 1;
    // machine transform helpers
    const mq = new THREE.Quaternion();
    const mm = new THREE.Matrix4();
    const tm = new THREE.Matrix4();
    const rm = new THREE.Matrix4();
    const sm = new THREE.Matrix4();
    const YA = V(0, 1, 0);
    const ZA = V(0, 0, 1);
    function machineMatrix(m, out) {
      mq.setFromAxisAngle(YA, m.cur.th);
      return out.compose(tv.set(m.cur.x, 0, m.cur.z), mq, V1);
    }
    const V1 = V(1, 1, 1);
    const localToWorld = (m, lx, ly, lz, out) => {
      const c = Math.cos(m.old.th), s = Math.sin(m.old.th);
      return out.set(m.old.x + lx * c + lz * s, ly, m.old.z - lx * s + lz * c);
    };

    // ---------- the line shaft ----------
    const shaftGroup = new THREE.Group();
    shaftGroup.position.set(0, G.SHAFT_Y, 0);
    world.add(shaftGroup);
    const SHAFT_Z0 = 6.6, SHAFT_Z1 = -31.47;
    const shaftMesh = new THREE.Mesh(G.cylZ(0.055, SHAFT_Z0 - SHAFT_Z1, 16).translate(0, 0, (SHAFT_Z0 + SHAFT_Z1) / 2), oldShaft);
    shaftMesh.castShadow = true;
    shaftGroup.add(shaftMesh);
    const pulleyGeo = G.spokedPulley(R_SHAFT_PULLEY, 0.17, { spokes: 6 });
    const imShaftPulleys = new THREE.InstancedMesh(pulleyGeo, oldIron, 16);
    imShaftPulleys.castShadow = true;
    imShaftPulleys.receiveShadow = true;
    imShaftPulleys.frustumCulled = false;
    shaftGroup.add(imShaftPulleys);
    const drivePulley = new THREE.Mesh(G.spokedPulley(G.DRIVE.r, 0.38, { spokes: 6, rimT: 0.06, hubR: 0.12 }), oldIron);
    drivePulley.position.z = G.DRIVE.z;
    drivePulley.castShadow = true;
    shaftGroup.add(drivePulley);
    const coupling = new THREE.Mesh(G.turnedZ([[0.05, 0], [0.2, 0], [0.21, 0.015], [0.21, 0.08], [0.05, 0.08]], 32).translate(0, 0, MOTOR_COUPLE() - 0.0), oldShaft);
    shaftGroup.add(coupling);
    function MOTOR_COUPLE() { return G.MOTOR.couple + 0.005; }
    // drop hangers (static)
    const hangerGeo = G.hangerGeo();
    const hangerZ = G.TRUSS_Z.filter((z) => z < SHAFT_Z0 && z > SHAFT_Z1);
    const imHangers = new THREE.InstancedMesh(hangerGeo, oldIron, hangerZ.length);
    hangerZ.forEach((z, i) => imHangers.setMatrixAt(i, mm.makeTranslation(0, 0, z)));
    imHangers.castShadow = true;
    world.add(imHangers);

    // ---------- belts: 16 to the machines + the engine belt ----------
    const NB = 17;
    const beltU = {
      uSnap: { value: new Float32Array(NB) }, uAlpha: { value: new Float32Array(NB).fill(1) }, uScroll: { value: new Float32Array(NB) },
      uTime: { value: 0 }, uFlapAmp: { value: 0.022 },
    };
    const belts = [];
    const beltSpeed = []; // m/s
    machines.forEach((m, i) => {
      const p = localToWorld(m, 0, m.pul.y, m.pul.z, new THREE.Vector3());
      m.beltZ = p.z;
      const c1 = new THREE.Vector2(0, G.SHAFT_Y);
      const c2 = new THREE.Vector2(p.x, p.y);
      const path = G.beltPath(c1, R_SHAFT_PULLEY, c2, m.pul.r, { sag: 0.05, slackSide: m.side });
      const ys = path.pts.map((q) => q.p.y);
      const y0 = Math.min(...ys), y1 = Math.max(...ys);
      const base = V(p.x - Math.sign(p.x) * 0.75, 0, p.z);
      const coils = 2.5 + rand();
      belts.push({
        path, z: p.z, width: m.type === 'lathe' ? 0.16 : 0.13, thick: 0.03, index: i,
        fall: (q, out) => {
          const a = q.s * coils * 2 * PI;
          const r = 0.42 + 0.12 * Math.sin(q.s * 9);
          return out.set(base.x + r * Math.cos(a), 0.03 + 0.07 * q.s, base.z + r * 0.7 * Math.sin(a));
        },
        delay: (q) => 1 - (q.p.y - y0) / (y1 - y0),
      });
      beltSpeed[i] = SHAFT_OMEGA * R_SHAFT_PULLEY;
    });
    {
      const c1 = new THREE.Vector2(0, G.SHAFT_Y);
      const c2 = new THREE.Vector2(G.FLY.x, G.FLY.y);
      const path = G.beltPath(c1, G.DRIVE.r, c2, G.FLY.R, { sag: 0.1, slackSide: -1, nArc1: 30, nArc2: 48, nSpan: 30 });
      const ys = path.pts.map((q) => q.p.y);
      const y0 = Math.min(...ys), y1 = Math.max(...ys);
      belts.push({
        path, z: G.DRIVE.z, width: 0.34, thick: 0.035, index: 16,
        fall: (q, out) => {
          // the slack belt slumps off the drive pulley and lies in loops at the flywheel's foot
          const a = q.s * 2 * PI * 1.5;
          return out.set(G.FLY.x - 1.9 + 1.0 * Math.cos(a), 0.03 + 0.06 * q.s, G.FLY.z + 1.1 + 0.6 * Math.sin(a));
        },
        delay: (q) => 1 - (q.p.y - y0) / (y1 - y0),
      });
      beltSpeed[16] = SHAFT_OMEGA * G.DRIVE.r;
    }
    const beltGeo = G.beltsGeometry(belts);
    const leather = new THREE.MeshStandardMaterial({ map: T.leather.map, roughnessMap: T.leather.rough, roughness: 0.9, metalness: 0, transparent: true });
    const BELT_PARS = /* glsl */ `
      attribute float aBelt; attribute vec3 aFall; attribute float aDelay; attribute float aFlap; attribute vec3 aFlapDir;
      uniform float uSnap[${NB}]; uniform float uAlpha[${NB}]; uniform float uScroll[${NB}]; uniform float uTime; uniform float uFlapAmp;
      varying float vBeltA;`;
    const BELT_MORPH = /* glsl */ `
      int bi = int(aBelt + 0.5);
      float kf = clamp((uSnap[bi] - aDelay * 0.4) / 0.6, 0.0, 1.0);
      kf = kf * kf;
      vec3 transformed = mix(position, aFall, kf);
      transformed += aFlapDir * (aFlap * uFlapAmp * (1.0 - kf) * sin(uTime * 6.0 - uv.x * 5.0 + aBelt * 1.7));
      vBeltA = uAlpha[bi];`;
    leather.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, beltU);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n' + BELT_PARS)
        .replace('#include <begin_vertex>', BELT_MORPH)
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv.x -= uScroll[int(aBelt + 0.5)];\n#endif\n#ifdef USE_ROUGHNESSMAP\n vRoughnessMapUv.x -= uScroll[int(aBelt + 0.5)];\n#endif');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vBeltA;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.a *= vBeltA;');
    };
    const beltDepth = new THREE.MeshDepthMaterial();
    beltDepth.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, beltU);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n' + BELT_PARS)
        .replace('#include <begin_vertex>', BELT_MORPH);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vBeltA;')
        .replace('void main() {', 'void main() {\n if (vBeltA < 0.5) discard;');
    };
    const beltMesh = new THREE.Mesh(beltGeo, leather);
    beltMesh.castShadow = true;
    beltMesh.receiveShadow = true;
    beltMesh.customDepthMaterial = beltDepth;
    beltMesh.frustumCulled = false;
    world.add(beltMesh);
    world.track(beltDepth);

    // ---------- steam engine and flywheel ----------
    const flywheel = mesh(G.flywheelGeometry(), castIron);
    flywheel.position.set(G.FLY.x, G.FLY.y, G.FLY.z);
    const ENG = G.engineStatic();
    mesh(ENG.stone, stone);
    mesh(ENG.iron, castIron);
    mesh(ENG.bright, steel);
    const crank = mesh(G.merge([G.rbox(0.74, 0.26, 0.12, 0.05).translate(0.24, 0, 0), G.cylZ(0.07, 0.3, 16).translate(G.CRANK.r, 0, -0.1)]), steel);
    crank.position.set(G.FLY.x, G.FLY.y, G.ENGINE_Z + 0.12);
    const rod = mesh(G.rbox(1, 0.13, 0.1, 0.04), steel);
    const crosshead = mesh(G.rbox(0.32, 0.46, 0.46, 0.04), steel);
    const pistonRod = mesh(G.cylX(0.04, 1.5, 12), steel);
    // pit under the flywheel
    mesh(new THREE.PlaneGeometry(0.9, 5.2).rotateX(-PI / 2).translate(G.FLY.x, 0.004, G.FLY.z), new THREE.MeshBasicMaterial({ color: 0x050403 }), { cast: false, receive: false });
    function engineKinematics(phi) {
      const { x, y } = G.FLY;
      const r = G.CRANK.r, L = G.CRANK.rod;
      const px = x + r * Math.cos(phi), py = y + r * Math.sin(phi);
      const hx = px + Math.sqrt(L * L - (py - y) ** 2);
      crank.rotation.z = phi;
      rod.position.set((px + hx) / 2, (py + y) / 2, G.ENGINE_Z + 0.05);
      rod.rotation.z = Math.atan2(py - y, px - hx) + PI;
      rod.scale.set(L, 1, 1);
      crosshead.position.set(hx, y, G.ENGINE_Z);
      pistonRod.position.set(hx + 0.8, y, G.ENGINE_Z);
    }

    // ---------- the electric motor, its deck, the chain hoist ----------
    const MG = G.motorGeometry();
    const motor = new THREE.Group();
    for (const [geo, mat] of [[MG.paint, oldMotor], [MG.bright, oldShaft], [MG.brass, oldBrass], [MG.dark, oldRubber]]) {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      motor.add(m);
    }
    world.add(motor);
    const deck = mesh(G.motorDeck(), oldIron);
    deck.position.set(0, G.MOTOR.y, G.MOTOR.z);
    const hoist = mesh(G.hoistGeometry(), oldIron);
    hoist.position.set(0, 8.05, G.MOTOR.z);
    const LINK = 0.072;
    const NLINK = 36;
    const imChain = new THREE.InstancedMesh(new THREE.TorusGeometry(0.028, 0.009, 4, 8).scale(1, 1.45, 1), oldSteel, NLINK);
    imChain.castShadow = false;
    imChain.frustumCulled = false;
    world.add(imChain);
    const chainTop = V(0, 7.88, G.MOTOR.z);
    const chainDir = new THREE.Vector3();
    const chainQ = new THREE.Quaternion();
    const chainQ2 = new THREE.Quaternion();

    // ---------- the new floor: conveyor and work ----------
    const CONV_Z0 = -29.6, CONV_LEN = 36.2;
    const CV = G.conveyorGeometry(CONV_LEN);
    CV.iron.translate(0, 0, CONV_LEN / 2);
    CV.belt.translate(0, 0, CONV_LEN / 2);
    const conveyor = new THREE.Group();
    conveyor.position.set(-0.75, 0, CONV_Z0);
    for (const [geo, mat] of [[CV.iron, paint], [CV.belt, rubber]]) {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      conveyor.add(m);
    }
    world.add(conveyor);
    const NPART = 34;
    const imParts = inst(G.merge([G.rbox(0.26, 0.16, 0.3, 0.03), G.cylY(0.07, 0.1, 10).translate(0, 0.12, 0)]), steel, NPART, { cast: false });

    // ---------- light beams through the clear panes and the end windows (analytic volumes) ----------
    const beamU = { uCol: { value: new THREE.Color() }, uDens: { value: 1 }, uSunDir: { value: D_MORNING.clone() }, uFogD: { value: 0.02 } };
    const beamDefs = [];
    G.CLEAR_PANES.forEach(([k, i]) => beamDefs.push({ o: V(G.HALL.x0 + G.PANE_W * i, G.HALL.roofLo, G.TRUSS_Z[k]), e1: V(G.PANE_W, 0, 0), e2: V(0, G.HALL.roofHi - G.HALL.roofLo, 0), len: 18, w: 1 }));
    G.END_WIN_X.forEach((x) => beamDefs.push({ o: V(x - 1.1, 2.4, G.HALL.z0 + 0.02), e1: V(2.2, 0, 0), e2: V(0, 3.6, 0), len: 11, w: 1.3 }));
    G.END_WIN_X.forEach((x) => beamDefs.push({ o: V(x - 1.1, 2.4, G.HALL.z1 - 0.02), e1: V(2.2, 0, 0), e2: V(0, 3.6, 0), len: 13, w: 2.0, near: true }));
    const beamGeo = new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5);
    const BEAM_VS = /* glsl */ `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
    const BEAM_FS = /* glsl */ `
      uniform mat4 uInv; uniform vec3 uCol; uniform float uDens, uW, uFogD, uGate; uniform vec3 uSunDir;
      varying vec3 vW;
      void main() {
        vec3 ro = cameraPosition;
        vec3 rd = vW - ro;
        vec3 o = (uInv * vec4(ro, 1.0)).xyz;
        vec3 d = (uInv * vec4(rd, 0.0)).xyz + vec3(1e-6);
        vec3 ta = (vec3(0.0) - o) / d, tb = (vec3(1.0) - o) / d;
        vec3 t0 = min(ta, tb), t1 = max(ta, tb);
        float a = max(max(max(t0.x, t0.y), t0.z), 0.0);
        float b = min(min(t1.x, t1.y), t1.z);
        if (rd.y < 0.0) b = min(b, (0.0 - ro.y) / rd.y);
        if (b <= a || uGate < 0.001) discard;
        float acc = 0.0;
        for (int i = 0; i < 4; i++) {
          vec3 p = o + d * mix(a, b, (float(i) + 0.5) / 4.0);
          float e = smoothstep(0.0, 0.14, p.x) * smoothstep(1.0, 0.86, p.x) * smoothstep(0.0, 0.14, p.y) * smoothstep(1.0, 0.86, p.y);
          acc += e * mix(1.0, 0.3, clamp(p.z * 1.2, 0.0, 1.0));
        }
        acc /= 4.0;
        float len = length(rd);
        float dist = (b - a) * len;
        float mid = mix(a, b, 0.5) * len;
        float g = 0.55;
        float ct = dot(rd / len, -uSunDir);
        float phase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * ct, 1.5);
        float fogT = exp(-uFogD * uFogD * mid * mid);
        vec3 c = uCol * (acc * dist * phase * uDens * uW * uGate * 0.06 * fogT);
        gl_FragColor = vec4(c, 1.0);
      }`;
    const beams = beamDefs.map((b) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...beamU, uInv: { value: new THREE.Matrix4() }, uW: { value: b.w }, uGate: { value: 1 } },
        vertexShader: BEAM_VS, fragmentShader: BEAM_FS,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide, fog: false,
      });
      const m = new THREE.Mesh(beamGeo, mat);
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      m.renderOrder = 2;
      b.mesh = m;
      b.M = new THREE.Matrix4();
      world.add(m);
      return b;
    });
    const e3 = new THREE.Vector3();
    function placeBeams(D) {
      for (const b of beams) {
        e3.copy(D).multiplyScalar(b.len);
        b.M.makeBasis(b.e1, b.e2, e3).setPosition(b.o);
        b.mesh.matrix.copy(b.M);
        b.mesh.material.uniforms.uInv.value.copy(b.M).invert();
        // light only enters where the sun is: far end + roof panes in the morning, near-end windows in the afternoon
        const g = THREE.MathUtils.clamp((b.near ? -D.z : D.z) * 4, 0, 1);
        b.mesh.material.uniforms.uGate.value = g;
        b.mesh.visible = g > 0.001;
      }
    }
    const camUnit = new THREE.Vector3();
    function beamSides() {
      for (const b of beams) {
        camUnit.copy(camera.position).applyMatrix4(b.mesh.material.uniforms.uInv.value);
        const inside = camUnit.x > -0.02 && camUnit.x < 1.02 && camUnit.y > -0.02 && camUnit.y < 1.02 && camUnit.z > -0.02 && camUnit.z < 1.02;
        const side = inside ? THREE.BackSide : THREE.FrontSide;
        if (b.mesh.material.side !== side) b.mesh.material.side = side;
      }
    }
    // dust: only inside the beams
    const motePos = [];
    {
      const p = new THREE.Vector3();
      beamDefs.filter((b) => !b.near).forEach((b) => {
        let n = 0;
        for (let tries = 0; tries < 400 && n < 46; tries++) {
          p.copy(b.o).addScaledVector(b.e1, 0.1 + rand() * 0.8).addScaledVector(b.e2, 0.1 + rand() * 0.8).addScaledVector(D_MORNING, b.len * rand() * 0.9);
          if (p.y < 0.4 || p.y > 7.0 || p.x < -8.6 || p.x > 8.6) continue;
          motePos.push(p.x, p.y, p.z);
          n++;
        }
      });
    }
    const motes = world.add(H.particles({ positions: new Float32Array(motePos), count: motePos.length / 3, size: 0.016, sizeJitter: 0.9, colors: ['#FFE6C4'], intensity: 0.9, drift: 0.1, driftSpeed: 0.035, seed: 'motor-motes' }));

    // ---------- state ----------
    const P = {
      W: 1, // 1 = 1900 sepia morning, 0 = clean daylight
      dim: 0, // s3: the held wide steps back behind the lesson
      drop: 0, mate: 0, engineBelt: 0, fly: 1, // s1
      cascade: 0, oldA: 1, flow: 0, motors: 0, conv: 0, parts: 0, // s2
    };
    const CAM = { u: 1, fp: V(0, 0, 0), range: 2, bokeh: 2.5 };
    let path = null;
    const curPos = new THREE.Vector3();
    const curLook = new THREE.Vector3();
    function setPath(fromPos, fromLook, step) {
      const to = POSE[step];
      const pts = [fromPos.clone(), ...VIA[step].map((v) => v.clone()), to.pos.clone()];
      const lpts = [fromLook.clone(), ...LOOK_VIA[step].map((v) => v.clone()), to.look.clone()];
      path = {
        pos: pts.length > 2 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : new THREE.LineCurve3(pts[0], pts[1]),
        look: lpts.length > 2 ? new THREE.CatmullRomCurve3(lpts, false, 'centripetal') : new THREE.LineCurve3(lpts[0], lpts[1]),
      };
    }
    const FOCUS = {
      near: V(-2.05, 1.95, 2.02), // the nearest belt: the first lathe's, on the left
      fly: V(G.FLY.x, G.FLY.y, G.FLY.z),
      motor: V(0, G.MOTOR.y, G.MOTOR.z),
      line: V(1.0, 0.9, -16),
    };

    // timings of the cascades inside s2 (seconds of P.cascade × CASCADE_T etc.)
    const CASCADE_T = 2.9;
    const FLOW_T = 3.2;
    const MOTORS_T = 1.6;

    // ---------- DOM: film captions over a bottom scrim (unchanged copy and layout) ----------
    const { spanW, space } = tokens;
    const scrim = C.Scrim.create({ ground: 'void', side: 'bottom', extent: 0.46, strength: 0.94 });
    root.append(scrim.el);
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: 'void', width: spanW(10) });
    place(title.el, space.margin, 808);
    const s1 = C.Headline.create({ text: copy.s1, role: 'lead', ground: 'void', width: spanW(10) });
    place(s1.el, space.margin, 788);
    const s2 = C.Headline.create({ text: copy.s2, role: 'lead', ground: 'void', width: spanW(10) });
    place(s2.el, space.margin, 788);
    const s3 = C.Headline.create({ text: copy.s3, role: 'h2', ground: 'void', width: spanW(10), highlight: 'redesigning the work' });
    place(s3.el, space.margin, 700);
    const src = C.SourceLine.create({ kind: provKind(fDavid && fDavid.label), text: copy.source || factsSource(fDavid), ground: 'void' });
    place(src.el, space.margin, space.footer.y);
    const parts = [title, s1, s2, s3, src];
    parts.forEach((p) => root.append(p.el));

    let cur = -1;
    function stateTo(step, animate) {
      const tl = gsap.timeline();
      const fwd = animate && step === cur + 1;
      const D = (d) => (animate ? d : 0);
      // camera
      if (fwd) { // forward: the designed move; back or jump: a clean cut to the step's end pose
        if (step === 0 && cur < 0) { curPos.copy(S0_START.pos); curLook.copy(S0_START.look); }
        else { curPos.copy(camera.position); curLook.copy(lookNow); }
        setPath(curPos, curLook, step);
        CAM.u = 0;
        const dur = [7.5, 4.8, 5.6, 2.4][step];
        const ease = ['power2.out', 'power3.inOut', 'power2.inOut', 'power2.inOut'][step];
        tl.to(CAM, { u: 1, duration: dur, ease }, 0);
      } else {
        path = { pos: new THREE.LineCurve3(POSE[step].pos.clone(), POSE[step].pos.clone()), look: new THREE.LineCurve3(POSE[step].look.clone(), POSE[step].look.clone()) };
        CAM.u = 1;
      }
      // focus tells the story only while it moves: s0 racks from the nearest belt to the flywheel, s1 pulls to the motor;
      // then the aperture stops down (bokeh → 0) and the DoF pass switches off for the long holds (it is the costliest
      // pass on the M2). s2 and s3 hold in deep focus; s3 steps back with a dim instead of a blur.
      const fp = [FOCUS.fly, FOCUS.motor, FOCUS.line, FOCUS.line][step];
      if (fwd && step === 0) {
        CAM.fp.copy(FOCUS.near);
        CAM.range = 1.6;
        CAM.bokeh = 3.0;
        tl.to(CAM.fp, { x: fp.x, y: fp.y, z: fp.z, duration: 2.6, ease: 'power2.inOut' }, 2.8);
        tl.to(CAM, { range: 9, duration: 2.6, ease: 'power2.inOut' }, 2.8);
        tl.to(CAM, { bokeh: 0, duration: 1.6, ease: 'power1.inOut' }, 6.0);
      } else if (fwd && step === 1) {
        tl.to(CAM, { bokeh: 2.2, range: 5, duration: 1.4, ease: 'power2.inOut' }, 0.3);
        tl.to(CAM.fp, { x: fp.x, y: fp.y, z: fp.z, duration: 2.6, ease: 'power2.inOut' }, 0.4);
        tl.to(CAM, { bokeh: 0, duration: 1.6, ease: 'power1.inOut' }, 6.4);
      } else {
        tl.to(CAM, { bokeh: 0, range: 18, duration: D(1.0), ease: 'power2.inOut' }, 0);
        tl.to(CAM.fp, { x: fp.x, y: fp.y, z: fp.z, duration: D(1.0), ease: 'power2.inOut' }, 0);
      }
      // s1: the motor lowers on the hoist, slides onto the shaft's coupling; the engine belt is thrown; the flywheel coasts down
      const s1on = step >= 1;
      tl.to(P, { drop: s1on ? 1 : 0, duration: fwd && step === 1 ? 2.4 : 0, ease: 'power2.inOut' }, fwd && step === 1 ? 2.2 : 0);
      tl.to(P, { mate: s1on ? 1 : 0, duration: fwd && step === 1 ? 0.6 : 0, ease: 'power2.out' }, fwd && step === 1 ? 4.75 : 0);
      tl.to(P, { engineBelt: s1on ? 1 : 0, duration: fwd && step === 1 ? 1.0 : 0, ease: 'none' }, fwd && step === 1 ? 5.5 : 0);
      tl.to(P, { fly: s1on ? 0 : 1, duration: fwd && step === 1 ? 2.8 : 0, ease: 'power2.out' }, fwd && step === 1 ? 5.6 : 0);
      // s2: belts snap down the hall, the old drive fades, machines glide into one line, each gets a motor, daylight
      const s2on = step >= 2;
      const at = (t) => (fwd && step === 2 ? t : 0);
      const du = (t) => (fwd && step === 2 ? t : 0);
      tl.to(P, { cascade: s2on ? 1 : 0, duration: du(CASCADE_T), ease: 'none' }, at(2.5));
      tl.to(P, { oldA: s2on ? 0 : 1, duration: du(1.0), ease: 'power1.inOut' }, at(3.7));
      tl.to(P, { flow: s2on ? 1 : 0, duration: du(FLOW_T), ease: 'none' }, at(3.5));
      tl.to(P, { motors: s2on ? 1 : 0, duration: du(MOTORS_T), ease: 'none' }, at(5.6));
      tl.to(P, { conv: s2on ? 1 : 0, duration: du(1.5), ease: 'power3.inOut' }, at(5.0));
      tl.to(P, { parts: s2on ? 1 : 0, duration: du(0.8), ease: 'power2.out' }, at(6.4));
      tl.to(P, { W: s2on ? 0 : 1, duration: du(3.4), ease: 'sine.inOut' }, at(3.0));
      tl.to(world.post.bloom, { intensity: step === 3 ? 0.35 : 0.5, duration: D(1.2) }, 0);
      tl.to(world.post.vignette, { darkness: step === 3 ? 0.82 : 0.7, duration: D(1.6), ease: 'power2.inOut' }, D(0.2));
      tl.to(P, { dim: step === 3 ? 1 : 0, duration: D(1.6), ease: 'power2.inOut' }, D(0.2));

      tl.add(scrim.set({ visible: true }, { animate }), 0);
      tl.add(title.set({ visible: step === 0 }, { animate }), D(step === 0 ? 1.2 : 0));
      tl.add(s1.set({ visible: step === 1 }, { animate }), D(step === 1 ? 0.5 : 0));
      tl.add(s2.set({ visible: step === 2 }, { animate }), D(step === 2 ? 0.5 : 0));
      tl.add(s3.set({ visible: step === 3 }, { animate }), D(step === 3 ? 1.1 : 0));
      tl.add(src.set({ visible: step >= 1 }, { animate }), D(step === 1 ? 1.2 : 0));
      cur = step;
      return tl;
    }

    // ---------- per frame ----------
    const lookNow = new THREE.Vector3();
    const fwdV = new THREE.Vector3();
    const sunDir = new THREE.Vector3();
    const cA = new THREE.Color(), cB = new THREE.Color();
    const lerpC = (a, b, t, out) => out.set(a).lerp(cB.set(b), t);
    let shaftAngle = 0, flyAngle = 0;
    let lastW = -1, lastDim = -1;
    const scroll = beltU.uScroll.value;
    const COLD = { sun: '#fff0dc', sky: '#d2dbe6', gnd: '#7d6e5e', fog: '#8c8b86' };
    const WARM = { sun: '#ffae63', sky: '#7d5d43', gnd: '#1a120c', fog: '#1d140d' };
    function applyLight(W) {
      const k = 1 - W; // 0 → 1 toward daylight
      sunDir.copy(D_MORNING).lerp(D_NOON, smooth(k)).normalize();
      lerpC(WARM.sun, COLD.sun, k, sun.color);
      const dimK = 1 - 0.5 * P.dim;
      sun.intensity = THREE.MathUtils.lerp(5.6, 6.6, k) * dimK;
      lerpC(WARM.sky, COLD.sky, k, hemi.color);
      lerpC(WARM.gnd, COLD.gnd, k, hemi.groundColor);
      // noon in the middle of the sweep: the sky is brightest while no direct sun enters, so lift the sky light
      hemi.intensity = (THREE.MathUtils.lerp(0.62, 1.25, k) + 0.45 * Math.sin(PI * k)) * dimK;
      lerpC(WARM.fog, COLD.fog, k, scene.fog.color);
      scene.fog.density = THREE.MathUtils.lerp(0.021, 0.009, k);
      scene.background = scene.background && scene.background.isColor ? scene.background.copy(scene.fog.color) : scene.fog.color.clone();
      scene.environmentIntensity = THREE.MathUtils.lerp(0.22, 0.45, k) * dimK;
      wash.value = smooth(k);
      // glazing: sun-struck panes and windows glow (they are the light sources), sooted panes only a little
      glassClear.color.copy(lerpC('#ffd9a8', '#ffffff', k, cA)).multiplyScalar(THREE.MathUtils.lerp(6, 3.2, k));
      glassDirty.color.copy(lerpC('#b88c62', '#eef4ff', k, cA)).multiplyScalar(THREE.MathUtils.lerp(0.9, 2.6, k));
      glassEnd.color.copy(lerpC('#ffcf96', '#eef4ff', k, cA)).multiplyScalar(THREE.MathUtils.lerp(7, 2.6, k));
      glassNear.color.copy(lerpC('#8f8476', '#fff4e6', k, cA)).multiplyScalar(THREE.MathUtils.lerp(1.2, 7, smooth(k)));
      glassL.color.copy(lerpC('#c9a27a', '#f4f7ff', k, cA)).multiplyScalar(THREE.MathUtils.lerp(1.6, 3.6, k));
      glassR.color.copy(lerpC('#9c8a7a', '#f1f6ff', k, cA)).multiplyScalar(THREE.MathUtils.lerp(1.1, 3.4, k));
      beamU.uCol.value.copy(sun.color);
      beamU.uSunDir.value.copy(sunDir);
      beamU.uDens.value = THREE.MathUtils.lerp(1, 0.85, k) * dimK;
      beamU.uFogD.value = scene.fog.density;
      motes.uniforms.uIntensity.value = THREE.MathUtils.lerp(0.95, 0.2, k);
      placeBeams(sunDir);
      fitShadow(sunDir);
      sunMoving = true;
    }

    function placeMachines(dt) {
      const fl = P.flow * FLOW_T;
      for (const m of machines) {
        const t = smooth((fl - m.j * 0.07) / 2.1);
        const thOld = m.old.th, thNew = m.nu.th;
        m.cur.x = THREE.MathUtils.lerp(m.old.x, m.nu.x, t);
        m.cur.z = THREE.MathUtils.lerp(m.old.z, m.nu.z, t);
        m.cur.th = THREE.MathUtils.lerp(thOld, thNew, t);
        // the machine's pulley runs while its belt does, stops when the belt snaps, runs again on its own motor
        const snap = clamp01((P.cascade * CASCADE_T - (15 - m.j) * 0.075) / 0.7);
        const mot = clamp01((P.motors * MOTORS_T - m.j * 0.05) / 0.5);
        const w = Math.max(1 - snap, mot);
        m.angle += w * SHAFT_OMEGA * (R_SHAFT_PULLEY / m.pul.r) * dt;
        m.mot = mot;
      }
      let li = 0, di = 0;
      for (const m of machines) {
        machineMatrix(m, mm);
        const isL = m.type === 'lathe';
        (isL ? imLatheP : imDrillP).setMatrixAt(isL ? li : di, mm);
        (isL ? imLatheB : imDrillB).setMatrixAt(isL ? li : di, mm);
        // cone pulley: centre so that its first (largest) step sits in the belt plane
        const n = m.pul.radii.length;
        tm.makeTranslation(0, m.pul.y, m.pul.z + (n * m.pul.step) / 2 - m.pul.step / 2);
        rm.makeRotationZ(m.angle);
        sm.multiplyMatrices(mm, tm).multiply(rm);
        (isL ? imConeL : imConeD).setMatrixAt(isL ? li : di, sm);
        // small motor: drops 0.6 m into place
        const k = easeOut3(m.mot);
        const ml = isL ? [-0.44, 1.02, -0.97] : [0, 2.3, -0.46];
        tm.makeTranslation(ml[0], ml[1] + (1 - k) * 0.6, ml[2]);
        const s = m.mot > 0.001 ? 1 : 0.0001;
        sm.multiplyMatrices(mm, tm).multiply(rm.makeScale(s, s, s));
        imSmallP.setMatrixAt(m.j, sm);
        imSmallD.setMatrixAt(m.j, sm);
        // contact shadow
        tm.makeScale(isL ? 1.0 : 1.15, 1, isL ? 3.2 : 1.35);
        sm.multiplyMatrices(mm, tm);
        imBlob.setMatrixAt(m.j, sm);
        if (isL) li++; else di++;
      }
      for (const im of [imLatheP, imLatheB, imDrillP, imDrillB, imConeL, imConeD, imSmallP, imSmallD, imBlob]) im.instanceMatrix.needsUpdate = true;
      imSmallP.visible = imSmallD.visible = P.motors > 0.0005;
    }

    function placeShaftParts() {
      machines.forEach((m, i) => imShaftPulleys.setMatrixAt(i, mm.makeTranslation(0, 0, m.beltZ)));
      imShaftPulleys.instanceMatrix.needsUpdate = true;
    }
    placeShaftParts();

    function placeMotor() {
      const y = THREE.MathUtils.lerp(G.MOTOR.startY, G.MOTOR.y, P.drop);
      const z = G.MOTOR.z - 0.32 * (1 - P.mate);
      motor.position.set(0, y, z);
      // chain from the hoist block to the lifting eye
      const eye = tv.set(0, y + 0.55, z);
      chainDir.subVectors(chainTop, eye);
      const len = chainDir.length();
      chainDir.normalize();
      chainQ.setFromUnitVectors(YA, chainDir);
      const n = Math.min(NLINK, Math.floor(len / LINK));
      for (let i = 0; i < NLINK; i++) {
        if (i < n) {
          chainQ2.setFromAxisAngle(chainDir, i % 2 ? PI / 2 : 0).multiply(chainQ);
          mm.compose(fwdV.copy(eye).addScaledVector(chainDir, (i + 0.5) * LINK), chainQ2, V1);
        } else mm.makeScale(0, 0, 0);
        imChain.setMatrixAt(i, mm);
      }
      imChain.instanceMatrix.needsUpdate = true;
    }

    function placeParts(time) {
      const reach = CONV_LEN * P.conv;
      for (let i = 0; i < NPART; i++) {
        const u = (i / NPART + time * 0.018) % 1;
        const along = u * CONV_LEN;
        const s = P.parts > 0.001 && along < reach - 0.3 ? P.parts : 0.0001;
        mq.setFromAxisAngle(YA, (i * 1.7) % PI);
        mm.compose(tv.set(-0.75, 0.9, CONV_Z0 + along), mq, sc3.set(s, s, s));
        imParts.setMatrixAt(i, mm);
      }
      imParts.instanceMatrix.needsUpdate = true;
      imParts.visible = P.parts > 0.0005;
    }
    const sc3 = new THREE.Vector3();

    function applyOld() {
      // belts: snap in a cascade from the motor end toward the camera, lie for a beat, then fade
      const c = P.cascade * CASCADE_T;
      for (let i = 0; i < 16; i++) {
        const t0 = (15 - i) * 0.075;
        beltU.uSnap.value[i] = clamp01((c - t0) / 0.7);
        beltU.uAlpha.value[i] = 1 - clamp01((c - t0 - 1.2) / 0.5);
      }
      beltU.uSnap.value[16] = P.engineBelt;
      beltU.uAlpha.value[16] = 1 - clamp01((c - 0.6) / 0.6);
      for (const m of OLD_MATS) {
        m.opacity = P.oldA;
        m.visible = P.oldA > 0.003;
        m.depthWrite = P.oldA > 0.6;
      }
      for (const o of [shaftGroup, imHangers, motor, deck, hoist]) o.castShadow = P.oldA > 0.5;
      conveyor.scale.z = Math.max(0.0005, P.conv);
      conveyor.visible = P.conv > 0.002;
    }

    function applyCamera(time) {
      const u = CAM.u;
      path.pos.getPoint(u, camera.position);
      path.look.getPoint(u, lookNow);
      camera.lookAt(lookNow);
      camera.updateMatrixWorld();
      camera.getWorldDirection(fwdV);
      const d = tv.copy(CAM.fp).sub(camera.position).dot(fwdV);
      world.post.dof = CAM.range >= 16 || CAM.bokeh < 0.02 ? null : dofCfg;
      dofCfg.focus = Math.max(0.3, d);
      dofCfg.range = CAM.range;
      dofCfg.bokeh = CAM.bokeh;
    }

    // initial state (render mode settles via goto → update(0, 0))
    applyLight(1);
    setPath(S0_START.pos, S0_START.look, 0);

    return {
      steps: ctx.beat.steps.length,
      world,
      enter() { cur = -1; return stateTo(0, !renderMode); },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit() {
        const tl = gsap.timeline();
        const from = camera.position.clone();
        const back = from.clone().addScaledVector(fwdV, -1.6);
        path = { pos: new THREE.LineCurve3(from, back), look: new THREE.LineCurve3(lookNow.clone(), lookNow.clone()) };
        CAM.u = 0;
        tl.to(CAM, { u: 1, duration: 0.8, ease: 'power2.in' }, 0);
        return tl;
      },
      update(time, dtIn) {
        const dt = Math.min(0.05, Math.max(0, dtIn || 0));
        beltU.uTime.value = time;
        shaftAngle += SHAFT_OMEGA * dt * (P.oldA > 0 ? 1 : 0);
        shaftGroup.rotation.z = -shaftAngle;
        const flyOmega = (SHAFT_OMEGA * G.DRIVE.r) / G.FLY.R;
        flyAngle += flyOmega * P.fly * dt;
        flywheel.rotation.z = -flyAngle;
        engineKinematics(-flyAngle);
        for (let i = 0; i < 16; i++) scroll[i] += (beltSpeed[i] * dt * (1 - beltU.uSnap.value[i])) / BELT_REPEAT;
        scroll[16] += (beltSpeed[16] * dt * P.fly * (1 - P.engineBelt)) / BELT_REPEAT;
        if (Math.abs(P.W - lastW) > 1e-4 || Math.abs(P.dim - lastDim) > 1e-4) { applyLight(P.W); lastW = P.W; lastDim = P.dim; }
        applyOld();
        placeMachines(dt);
        placeMotor();
        placeParts(time);
        motes.update(time);
        applyCamera(time);
        beamSides();
      },
      dispose() {
        gsap.killTweensOf([CAM, CAM.fp, P, world.post.bloom, world.post.vignette]);
        parts.forEach((p) => p.destroy());
        scrim.destroy();
        Object.values(T).forEach((t) => Object.values(t).forEach((x) => x.dispose && x.dispose()));
        [winTex, roofTex, blobTex].forEach((t) => t.dispose());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
