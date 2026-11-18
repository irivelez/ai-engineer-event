// motor (gl-2): Paul David's dynamo lesson as one factory hall. s0 a steam flywheel turns one long line
// shaft; belts drop from its pulleys to sixteen machines, all coupled, in warm industrial light. s1 an
// electric motor bolts onto the end of the same shaft: nothing else changes. s2 the shaft and belts dissolve,
// every machine gets its own small motor and the floor re-flows into one clean line along the flow of
// work, in clean cool light. s3 the lesson on calm.
import { gsap } from 'gsap';
import * as THREE from 'three';
import { factsSource, provKind, place } from './_worlds/gl2-kit.js';

const SHAFT_Y = 4.4;
const MX = [-10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5];
const ROW_Z = 2.2;
const NM = MX.length * 2;
const NEW_DX = 1.55;
const COLS_X = [-14, -10.5, -7, -3.5, 0, 3.5, 7, 10.5, 14];

const SHOTS = [
  { azimuth: -26, polar: 79, radius: 24, tx: 1.5, ty: 2.2, tz: 0 },
  { azimuth: -38, polar: 80, radius: 11.5, tx: 9.2, ty: 3.0, tz: 0 },
  { azimuth: -50, polar: 60, radius: 29, tx: 1.5, ty: -0.6, tz: 0 },
  { azimuth: -44, polar: 52, radius: 33, tx: 0.5, ty: -1.2, tz: 0 },
];

export default {
  id: 'motor',
  gl: true,
  create(ctx) {
    const { root, copy, gl, components: C, renderMode, tokens } = ctx;
    const { makeWorld, helpers: H } = gl;
    const rand = H.seeded('motor');
    const fDavid = ctx.facts('david-dynamo');

    const world = makeWorld({
      fov: 34,
      fog: null,
      post: { bloom: { intensity: 1.0, threshold: 0.62, smoothing: 0.3, radius: 0.8 }, vignette: { offset: 0.3, darkness: 0.62 } },
    });

    // ---------- shared light state ----------
    const L = {
      uWarm: { value: 1 }, uDissolve: { value: 0 }, uTime: { value: 0 },
      uKeyW: { value: new THREE.Color('#FFB066').multiplyScalar(1.25) }, uKeyC: { value: new THREE.Color('#DCE6FF').multiplyScalar(1.2) },
      uAmbW: { value: new THREE.Color('#3A2A1C') }, uAmbC: { value: new THREE.Color('#2A3240') },
      uKeyDir: { value: new THREE.Vector3(0.35, 0.8, 0.45).normalize() },
      uFog: { value: new THREE.Color(tokens.colors.void) }, uFogD: { value: 0.022 },
    };
    const NOISE = gl.helpers.noise.glsl;
    function lit({ a, b = a, emis = null, emisI = 0, dissolve = false, stripes = false }) {
      const u = {
        ...L, uColA: { value: new THREE.Color(a) }, uColB: { value: new THREE.Color(b) },
        uEmisCol: { value: emis ? (emis.isColor ? emis : new THREE.Color(emis)) : new THREE.Color(0) }, uEmis: { value: emisI },
        uDis: { value: dissolve ? 1 : 0 }, uStripe: { value: stripes ? 1 : 0 }, uEdge: { value: H.color('accent', 2.2) },
      };
      return new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vW; varying float vDepth; varying vec2 vUv;
          void main() {
            #ifdef USE_INSTANCING
              mat4 m = modelMatrix * instanceMatrix;
            #else
              mat4 m = modelMatrix;
            #endif
            vec4 w = m * vec4(position, 1.0);
            vW = w.xyz; vN = normalize(mat3(m) * normal); vUv = uv;
            vec4 mv = viewMatrix * w; vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColA, uColB, uKeyW, uKeyC, uAmbW, uAmbC, uFog, uKeyDir, uEmisCol, uEdge;
          uniform float uWarm, uFogD, uDissolve, uEmis, uDis, uStripe, uTime;
          varying vec3 vN; varying vec3 vW; varying float vDepth; varying vec2 vUv;
          ${NOISE}
          void main() {
            float edge = 0.0;
            if (uDis > 0.5 && uDissolve > 0.0) {
              float n = 0.5 + 0.5 * snoise(vW * 1.6);
              float th = uDissolve * 1.15 - 0.05;
              if (n < th) discard;
              edge = 1.0 - smoothstep(th, th + 0.07, n);
            }
            vec3 N = normalize(vN);
            vec3 key = mix(uKeyC, uKeyW, uWarm);
            vec3 amb = mix(uAmbC, uAmbW, uWarm);
            vec3 albedo = mix(uColB, uColA, uWarm);
            if (uStripe > 0.5) albedo *= 0.82 + 0.18 * step(0.5, fract(vUv.y * 9.0 - uTime * 1.6));
            float lam = max(dot(N, uKeyDir), 0.0);
            float hemi = 0.55 + 0.45 * N.y;
            float back = max(dot(N, vec3(0.0, 0.25, -1.0)), 0.0);
            vec3 col = albedo * (amb * hemi * 2.1 + key * lam + key * back * 0.45);
            col += uEmisCol * uEmis + uEdge * edge;
            float f = 1.0 - exp(-uFogD * uFogD * vDepth * vDepth);
            gl_FragColor = vec4(mix(col, uFog, f), 1.0);
          }`,
      });
    }

    const iron = lit({ a: '#2B2622', b: '#3A4048', dissolve: true });
    const ironStatic = lit({ a: '#2A2622', b: '#30363E' });
    const leather = lit({ a: '#5A3A22', b: '#5A3A22', dissolve: true, stripes: true });
    const machineMat = lit({ a: '#33433C', b: '#C9D1DA' });
    const headMat = lit({ a: '#26332E', b: '#9EA8B4' });
    const brass = lit({ a: '#6E5530', b: '#8A6A3A', dissolve: true });
    const brassStatic = lit({ a: '#7A6038', b: '#9AA3AE' });
    const floorMat = lit({ a: '#17120E', b: '#141920' });
    const wallMat = lit({ a: '#120E0B', b: '#10141A' });
    const motorMat = lit({ a: '#2E3A4A', b: '#2E3A4A', emis: H.color('accent', 1), emisI: 0, dissolve: true });
    const smallMotorMat = lit({ a: '#2E3A4A', b: '#3C4A5E' });

    // ---------- hall ----------
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 70).rotateX(-Math.PI / 2), floorMat);
    world.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 9).translate(0, 4.5, -5.4), wallMat);
    world.add(wall);
    const endR = new THREE.Mesh(new THREE.PlaneGeometry(11, 9).rotateY(-Math.PI / 2).translate(15.3, 4.5, -0.1), wallMat);
    const endL = new THREE.Mesh(new THREE.PlaneGeometry(11, 9).rotateY(Math.PI / 2).translate(-15.3, 4.5, -0.1), wallMat);
    world.add(endR, endL);
    const winU = { uWarm: L.uWarm, uW: { value: new THREE.Color('#FFB46A').multiplyScalar(2.4) }, uC: { value: new THREE.Color('#E8F0FF').multiplyScalar(2.6) } };
    const winMat = new THREE.ShaderMaterial({
      uniforms: winU,
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform vec3 uW, uC; uniform float uWarm; varying vec2 vUv;
        void main() { vec2 g = abs(fract(vUv * vec2(3.0, 5.0)) - 0.5); float bar = step(0.44, max(g.x, g.y)); vec3 c = mix(uC, uW, uWarm) * (0.55 + 0.45 * vUv.y); gl_FragColor = vec4(mix(c, c * 0.25, bar), 1.0); }`,
    });
    const windows = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.0, 3.2), winMat, COLS_X.length - 1);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < COLS_X.length - 1; i++) {
      m4.makeTranslation((COLS_X[i] + COLS_X[i + 1]) / 2, 3.6, -5.38);
      windows.setMatrixAt(i, m4);
    }
    world.add(windows);
    // columns + trusses + shaft hangers
    const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.16, 6.2, 12).translate(0, 3.1, 0), ironStatic, COLS_X.length * 2);
    COLS_X.forEach((x, i) => {
      cols.setMatrixAt(i * 2, m4.makeTranslation(x, 0, -3.9));
      cols.setMatrixAt(i * 2 + 1, m4.makeTranslation(x, 0, 3.9));
    });
    world.add(cols);
    const truss = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.34, 8.2), ironStatic, COLS_X.length);
    COLS_X.forEach((x, i) => truss.setMatrixAt(i, m4.makeTranslation(x, 6.2, 0)));
    world.add(truss);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(30, 0.22, 0.22).translate(0, 6.25, 0), ironStatic);
    world.add(ridge);
    const hangers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 1.8, 0.08).translate(0, SHAFT_Y + 0.9, 0), iron, COLS_X.length - 2);
    for (let i = 1; i < COLS_X.length - 1; i++) hangers.setMatrixAt(i - 1, m4.makeTranslation(COLS_X[i], 0, 0));
    world.add(hangers);
    // light shafts from the clerestory (soft, additive)
    const shaftU = { uWarm: L.uWarm, uW: { value: new THREE.Color('#FFB46A').multiplyScalar(0.22) }, uC: { value: new THREE.Color('#DDE8FF').multiplyScalar(0.2) } };
    const beams = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.2, 9), new THREE.ShaderMaterial({
      uniforms: shaftU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform vec3 uW, uC; uniform float uWarm; varying vec2 vUv;
        void main() { float a = smoothstep(0.0, 0.5, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y)) * smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x); gl_FragColor = vec4(mix(uC, uW, uWarm), a); }`,
    }), 4);
    [-9, -2, 5, 11.5].forEach((x, i) => {
      q.setFromEuler(new THREE.Euler(0.55, 0.1, 0));
      m4.compose(v.set(x, 3.4, -1.2), q, s);
      beams.setMatrixAt(i, m4);
    });
    world.add(beams);

    // ---------- the line shaft: shaft, pulleys, spokes (one group that turns) ----------
    const shaftGroup = new THREE.Group();
    shaftGroup.position.set(0, SHAFT_Y, 0);
    world.add(shaftGroup);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 26.4, 12).rotateZ(Math.PI / 2), iron);
    shaftGroup.add(shaft);
    const pulleyGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.2, 28).rotateZ(Math.PI / 2);
    const pulleys = new THREE.InstancedMesh(pulleyGeo, brass, MX.length + 1);
    MX.forEach((x, i) => pulleys.setMatrixAt(i, m4.makeTranslation(x, 0, 0)));
    pulleys.setMatrixAt(MX.length, m4.compose(v.set(12.6, 0, 0), q.identity(), s.set(1.6, 1.6, 1.6)));
    s.set(1, 1, 1);
    shaftGroup.add(pulleys);
    const spokes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.62, 0.07), iron, MX.length * 2);
    MX.forEach((x, i) => {
      spokes.setMatrixAt(i * 2, m4.makeTranslation(x + 0.11, 0, 0));
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      spokes.setMatrixAt(i * 2 + 1, m4.compose(v.set(x + 0.11, 0, 0), q, s));
    });
    shaftGroup.add(spokes);

    // belts: two strips per machine, from the pulley to the machine wheel (static, stripes move)
    const beltGeo = new THREE.BoxGeometry(0.16, 1, 0.025);
    const belts = new THREE.InstancedMesh(beltGeo, leather, NM * 2);
    const wheelY = 1.58;
    {
      let k = 0;
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const dir = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      MX.forEach((x) => {
        [-1, 1].forEach((side) => {
          const zW = side * ROW_Z;
          for (const off of [-1, 1]) {
            // offset the two strips across the belt loop (pulley r 0.36, wheel r 0.24)
            a.set(x, SHAFT_Y + off * 0.34 * 0.6, off * 0.34 * side * 0.8);
            b.set(x, wheelY + off * 0.22 * 0.6, zW + off * 0.22 * side * 0.8);
            dir.subVectors(a, b);
            const len = dir.length();
            q.setFromUnitVectors(up, dir.normalize());
            m4.compose(v.addVectors(a, b).multiplyScalar(0.5), q, s.set(1, len, 1));
            belts.setMatrixAt(k++, m4);
          }
        });
      });
      s.set(1, 1, 1);
    }
    world.add(belts);

    // ---------- steam engine (s0) and the bolted-on motor (s1) ----------
    const engine = new THREE.Group();
    world.add(engine);
    const fly = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.16, 12, 48).rotateY(Math.PI / 2), iron);
    const flySpokes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 2.9, 0.12), iron, 3);
    for (let i = 0; i < 3; i++) { q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), (i * Math.PI) / 3); flySpokes.setMatrixAt(i, m4.compose(v.set(0, 0, 0), q, s)); }
    const flyWheel = new THREE.Group();
    flyWheel.add(fly, flySpokes);
    flyWheel.position.set(13.7, 1.75, 0);
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 2.4).translate(0, 0.75, 0), ironStatic);
    block.position.set(13.7, 0, -2.4);
    const engBelt = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1, 0.03), leather);
    {
      const a = new THREE.Vector3(12.6, SHAFT_Y, 0);
      const b = new THREE.Vector3(13.7, 1.75, 0);
      const len = a.distanceTo(b);
      engBelt.position.copy(a).add(b).multiplyScalar(0.5);
      engBelt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize());
      engBelt.scale.set(1, len, 1);
    }
    engine.add(flyWheel, block, engBelt);

    const motor = new THREE.Group();
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 40).rotateZ(Math.PI / 2), motorMat);
    const fins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.68, 0.68, 0.05, 40).rotateZ(Math.PI / 2), motorMat, 7);
    for (let i = 0; i < 7; i++) fins.setMatrixAt(i, m4.makeTranslation(-0.5 + i * 0.16, 0, 0));
    const ringU = { uCol: { value: H.color('accent', 3.0) }, uOn: { value: 0 } };
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.035, 8, 64).rotateY(Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: ringU, vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uCol; uniform float uOn; void main(){ gl_FragColor = vec4(uCol * uOn, 1.0); }',
    }));
    coil.position.x = -0.66;
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.3).translate(0, 0.9 + 0.2, 0), iron);
    motor.add(housing, fins, coil, bracket);
    motor.position.set(13.9, SHAFT_Y, 0);
    world.add(motor);

    // ---------- machines (instanced; positions animate between the two floor plans) ----------
    // a lathe: bed on two legs, headstock with the drive pulley on top, tailstock
    const bedGeo = new THREE.BoxGeometry(1.32, 0.16, 0.44);
    const legGeo = new THREE.BoxGeometry(0.14, 0.76, 0.46).translate(0, 0.38, 0);
    const headGeo = new THREE.BoxGeometry(0.42, 0.44, 0.52).translate(0, 0.22, 0);
    const tailGeo = new THREE.BoxGeometry(0.24, 0.3, 0.32).translate(0, 0.15, 0);
    const workGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.56, 12).rotateZ(Math.PI / 2);
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 24).rotateZ(Math.PI / 2);
    const smGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.36, 20).rotateZ(Math.PI / 2);
    const bases = new THREE.InstancedMesh(bedGeo, machineMat, NM);
    const legs = new THREE.InstancedMesh(legGeo, headMat, NM * 2);
    const heads = new THREE.InstancedMesh(headGeo, machineMat, NM);
    const tails = new THREE.InstancedMesh(tailGeo, machineMat, NM);
    const works = new THREE.InstancedMesh(workGeo, brassStatic, NM);
    const wheels = new THREE.InstancedMesh(wheelGeo, brass, NM);
    const smalls = new THREE.InstancedMesh(smGeo, smallMotorMat, NM);
    const smRingU = { uCol: { value: H.color('accent', 2.6) }, uOn: { value: 0 } };
    const smRings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.175, 0.025, 6, 32).rotateY(Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: smRingU, vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uCol; uniform float uOn; void main(){ gl_FragColor = vec4(uCol * uOn, 1.0); }',
    }), NM);
    const shadowMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec2 vUv; void main(){ vec2 d = (vUv - 0.5) * 2.0; float a = 1.0 - smoothstep(0.35, 1.0, length(d)); gl_FragColor = vec4(0.0, 0.0, 0.0, a * 0.6); }',
    });
    const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.0, 1.5).rotateX(-Math.PI / 2).translate(0, 0.012, 0), shadowMat, NM);
    const MOVING = [bases, legs, heads, tails, works, wheels, smalls, smRings, shadows];
    MOVING.forEach((im) => { im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; world.add(im); });
    const oldPos = [];
    const newPos = [];
    const delay = new Float32Array(NM);
    // new plan: one line along x at z = 0, in process order (front row, then back row, left to right)
    const order = [];
    MX.forEach((x, i) => { order.push({ i: i * 2, x, z: ROW_Z }); order.push({ i: i * 2 + 1, x, z: -ROW_Z }); });
    order.forEach((o) => { oldPos[o.i] = new THREE.Vector3(o.x, 0, o.z); });
    order.slice().sort((a, b) => a.x - b.x || b.z - a.z).forEach((o, k) => { newPos[o.i] = new THREE.Vector3((k - (NM - 1) / 2) * NEW_DX, 0, 0); });
    for (let i = 0; i < NM; i++) delay[i] = (oldPos[i].x + 12) / 24 * 0.45 + rand() * 0.08;

    // conveyor + work items (GPU-moved) in the new plan
    const conveyor = new THREE.Mesh(new THREE.BoxGeometry(NM * NEW_DX + 1.2, 0.1, 0.5).translate(0, 0.62, 0.78), lit({ a: '#22282F', b: '#2A3038' }));
    conveyor.scale.set(0.0001, 1, 1);
    world.add(conveyor);
    const NI = 44;
    const itemU = { ...L, uOn: { value: 0 }, uLen: { value: NM * NEW_DX }, uCol: { value: H.color('accent', 1.3) } };
    const itemGeo = new THREE.BoxGeometry(0.22, 0.16, 0.22);
    const aOff = new Float32Array(NI);
    for (let i = 0; i < NI; i++) aOff[i] = i / NI;
    itemGeo.setAttribute('aOff', new THREE.InstancedBufferAttribute(aOff, 1));
    const items = new THREE.InstancedMesh(itemGeo, new THREE.ShaderMaterial({
      uniforms: itemU,
      vertexShader: /* glsl */ `attribute float aOff; uniform float uTime, uOn, uLen; varying vec3 vN;
        void main() { float x = (fract(aOff + uTime * 0.035) - 0.5) * uLen; vN = normal;
          vec3 p = position * uOn + vec3(x, 0.75, 0.78); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */ `uniform vec3 uCol; varying vec3 vN; void main() { gl_FragColor = vec4(uCol * (0.55 + 0.45 * max(normalize(vN).y, 0.0)), 1.0); }`,
    }), NI);
    items.frustumCulled = false;
    world.add(items);

    // dust in the light
    const dust = world.add(H.particles({ count: 900, spread: [28, 5, 8], center: [0, 3.0, -1], size: 0.026, colors: ['caution', 'limit'], intensity: 0.28, drift: 0.5, seed: 'motor-dust' }));

    // ---------- per-frame instance placement (allocation-free) ----------
    const P = { flow: 0, motors: 0 };
    const pos = new THREE.Vector3();
    const qW = new THREE.Quaternion();
    const XA = new THREE.Vector3(1, 0, 0);
    const sc = new THREE.Vector3(1, 1, 1);
    const one = new THREE.Vector3(1, 1, 1);
    let shaftAngle = 0;
    function place3(time) {
      for (let i = 0; i < NM; i++) {
        let t = (P.flow - delay[i]) / 0.55;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        t = t * t * (3 - 2 * t);
        pos.lerpVectors(oldPos[i], newPos[i], t);
        pos.y = Math.sin(Math.PI * t) * 0.35;
        q.identity();
        v.set(pos.x + 0.45, pos.y + 0.82, pos.z);
        bases.setMatrixAt(i, m4.compose(v, q, one));
        v.set(pos.x + 0.45, pos.y, pos.z);
        shadows.setMatrixAt(i, m4.compose(v, q, one));
        v.set(pos.x - 0.1, pos.y, pos.z);
        legs.setMatrixAt(i * 2, m4.compose(v, q, one));
        v.set(pos.x + 1.0, pos.y, pos.z);
        legs.setMatrixAt(i * 2 + 1, m4.compose(v, q, one));
        v.set(pos.x, pos.y + 0.9, pos.z);
        heads.setMatrixAt(i, m4.compose(v, q, one));
        v.set(pos.x + 0.98, pos.y + 0.9, pos.z);
        tails.setMatrixAt(i, m4.compose(v, q, one));
        v.set(pos.x + 0.5, pos.y + 1.12, pos.z);
        works.setMatrixAt(i, m4.compose(v, q, one));
        const wAng = shaftAngle * 1.5 * (1 - P.flow) + time * 3.0 * P.flow;
        qW.setFromAxisAngle(XA, wAng);
        v.set(pos.x, pos.y + wheelY, pos.z);
        wheels.setMatrixAt(i, m4.compose(v, qW, one));
        let k = (P.motors - delay[i] * 0.9) / 0.35;
        k = k < 0 ? 0 : k > 1 ? 1 : k;
        sc.setScalar(k < 1e-4 ? 1e-4 : k * k * (3 - 2 * k));
        v.set(pos.x - 0.42, pos.y + 1.06, pos.z);
        smalls.setMatrixAt(i, m4.compose(v, q, sc));
        v.x += -0.19;
        smRings.setMatrixAt(i, m4.compose(v, q, sc));
      }
      for (let j = 0; j < MOVING.length; j++) MOVING[j].instanceMatrix.needsUpdate = true;
    }

    // ---------- DOM: film captions over a bottom scrim ----------
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

    // ---------- camera + states ----------
    const rig = H.cameraRig(world.camera, { ...SHOTS[0], breathe: renderMode ? 0 : 0.4 });
    const ST = { engine: 1, motorIn: 0 };
    function applyEngine() {
      engine.position.y = -2.4 * (1 - ST.engine);
      engine.visible = ST.engine > 0.01;
      motor.position.y = SHAFT_Y + 3.2 * (1 - ST.motorIn);
      motor.visible = ST.motorIn > 0.001 && L.uDissolve.value < 0.98;
    }
    let cur = -1;
    function stateTo(step, animate) {
      const tl = gsap.timeline();
      const D = (d) => (animate ? d : 0);
      const fwd = animate && step > cur;
      tl.add(rig.to(SHOTS[step], { duration: animate ? (step === 2 ? 4.6 : 3.6) : 0.001, ease: 'power3.inOut' }), 0);
      // s1: the steam engine sinks away, the motor drops in and bolts on
      tl.to(ST, { engine: step >= 1 ? 0 : 1, duration: fwd && step === 1 ? 1.4 : D(0.6), ease: 'power2.in', onUpdate: applyEngine }, fwd && step === 1 ? 0.6 : 0);
      tl.to(ST, { motorIn: step >= 1 ? 1 : 0, duration: fwd && step === 1 ? 1.6 : D(0.6), ease: 'power3.out', onUpdate: applyEngine }, fwd && step === 1 ? 1.6 : 0);
      tl.to(ringU.uOn, { value: step === 1 ? 1 : 0, duration: D(0.6) }, fwd && step === 1 ? 3.0 : 0);
      tl.to(motorMat.uniforms.uEmis, { value: step === 1 ? 0.15 : 0, duration: D(0.6) }, fwd && step === 1 ? 3.0 : 0);
      // s2: shaft + belts dissolve, machines re-flow into a line, each gets its own motor, light turns clean
      const re = step >= 2;
      tl.to(L.uDissolve, { value: re ? 1 : 0, duration: fwd && step === 2 ? 1.8 : D(0.6), ease: 'power1.in', onUpdate: applyEngine }, 0);
      tl.to(P, { flow: re ? 1 : 0, duration: fwd && step === 2 ? 3.2 : D(0.6), ease: 'none' }, fwd && step === 2 ? 1.2 : 0);
      tl.to(P, { motors: re ? 1 : 0, duration: fwd && step === 2 ? 1.8 : D(0.5), ease: 'none' }, fwd && step === 2 ? 3.2 : 0);
      tl.to(smRingU.uOn, { value: re ? 1 : 0, duration: D(0.8) }, fwd && step === 2 ? 3.6 : 0);
      tl.to(conveyor.scale, { x: re ? 1 : 0.0001, duration: fwd && step === 2 ? 1.6 : D(0.5), ease: 'power3.inOut' }, fwd && step === 2 ? 3.4 : 0);
      tl.to(itemU.uOn, { value: re ? 1 : 0, duration: D(0.8) }, fwd && step === 2 ? 4.4 : 0);
      tl.to(L.uWarm, { value: re ? 0 : 1, duration: fwd && step === 2 ? 3.6 : D(0.6), ease: 'sine.inOut' }, fwd && step === 2 ? 0.6 : 0);
      tl.to(dust.uniforms.uOpacity, { value: re ? 0.45 : 1, duration: D(2) }, 0);
      tl.to(world.post.bloom, { intensity: step === 3 ? 0.6 : 1.0, duration: D(1.1) }, 0);

      tl.add(scrim.set({ visible: true }, { animate }), 0);
      tl.add(title.set({ visible: step === 0 }, { animate }), D(step === 0 ? 0.8 : 0));
      tl.add(s1.set({ visible: step === 1 }, { animate }), D(step === 1 ? 0.5 : 0));
      tl.add(s2.set({ visible: step === 2 }, { animate }), D(step === 2 ? 0.5 : 0));
      tl.add(s3.set({ visible: step === 3 }, { animate }), D(step === 3 ? 1.1 : 0));
      tl.add(src.set({ visible: step >= 1 }, { animate }), D(step === 1 ? 1.2 : 0));
      if (!animate) tl.call(applyEngine, null, 0.0011);
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
        tl.to(rig.state, { radius: '+=3', duration: 0.8, ease: 'power2.in', onUpdate: rig.apply }, 0);
        return tl;
      },
      update(time) {
        L.uTime.value = time;
        shaftAngle = time * 2.2;
        shaftGroup.rotation.x = shaftAngle;
        flyWheel.rotation.x = shaftAngle * (0.36 * 1.6) / 1.45;
        place3(time);
        dust.update(time);
        rig.update(time);
      },
      dispose() {
        gsap.killTweensOf([rig.state, ST, P, L.uDissolve, L.uWarm, ringU.uOn, smRingU.uOn, itemU.uOn, conveyor.scale, motorMat.uniforms.uEmis, dust.uniforms.uOpacity, world.post.bloom]);
        parts.forEach((p) => p.destroy());
        scrim.destroy();
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
