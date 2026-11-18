// callback (gl-1): an echo of the opener's speed. The camera rides a ring tunnel (after GTC 1:31:00): rings and
// spokes in hard perspective, light streaks along the walls stretch as the ride accelerates, then everything
// decelerates to stillness and the two lines land. All motion is in the vertex shaders, driven by one travel
// distance that update() integrates from a gsap-tweened speed (render mode: speed 0, the still frame).
import { gsap } from 'gsap';
import { factSource, place } from './_worlds/gl1-kit.js';

const RINGS = 48;
const SP = 3.2; //          ring spacing
const L = RINGS * SP; //    tunnel length that wraps
const R = 7.2; //           tunnel radius
const SPOKES = 36;
const STREAKS = 900;
const MAXV = 70; //         units per second at full speed

export default {
  id: 'callback',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode } = ctx;
    const { THREE, makeWorld, helpers: H } = gl;
    const world = makeWorld({ fov: 62, near: 0.1, far: 300, post: { bloom: { intensity: 0.85, threshold: 0.6, smoothing: 0.3, radius: 0.72 }, vignette: { offset: 0.24, darkness: 0.7 } } });
    world.camera.position.set(0, 0, 0);
    world.camera.lookAt(0, 0, -1);
    const U = { uTravel: { value: 0 }, uSpeed: { value: 0 }, uRing: { value: H.color('accent', 0.42) }, uSpoke: { value: H.color('lightSoft', 0.16) }, uStreak: { value: H.color('accent', 2.4) }, uGlow: { value: 1 } };
    const fogFn = /* glsl */ 'float fogAt(float d){ return exp(-max(0.0, d - 6.0) * 0.022); }';

    // rings: one instanced annulus, wrapped along -z by uTravel
    const ringGeo = new THREE.RingGeometry(R - 0.06, R + 0.06, 128, 1);
    const aIdx = new Float32Array(RINGS);
    for (let i = 0; i < RINGS; i++) aIdx[i] = i;
    ringGeo.setAttribute('aIdx', new THREE.InstancedBufferAttribute(aIdx, 1));
    const rings = new THREE.InstancedMesh(ringGeo, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTravel; attribute float aIdx; varying float vD; ${fogFn}
        void main(){
          float z = -mod(aIdx * ${SP.toFixed(2)} - uTravel, ${L.toFixed(2)}) - 1.0;
          vec4 mv = modelViewMatrix * vec4(position.xy, z, 1.0);
          vD = -mv.z; gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform vec3 uRing; uniform float uGlow; varying float vD; ${fogFn} void main(){ float near = smoothstep(3.0, 16.0, vD); gl_FragColor = vec4(uRing * fogAt(vD) * near * uGlow, 1.0); }`,
    }), RINGS);
    rings.frustumCulled = false;
    world.add(rings);

    // spokes: long lines along the wall (static: motion reads from the rings and streaks)
    const spokeGeo = new THREE.BoxGeometry(0.07, 0.07, L);
    spokeGeo.translate(0, 0, -L / 2 - 1);
    const spokes = new THREE.InstancedMesh(spokeGeo, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uSpoke; uniform float uGlow; varying float vD; ${fogFn} void main(){ gl_FragColor = vec4(uSpoke * fogAt(vD) * smoothstep(1.0, 8.0, vD) * uGlow, 1.0); }`,
    }), SPOKES);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < SPOKES; i++) {
      const a = (i / SPOKES) * Math.PI * 2;
      m4.makeRotationZ(a);
      m4.setPosition(Math.cos(a) * (R + 0.02), Math.sin(a) * (R + 0.02), 0);
      spokes.setMatrixAt(i, m4);
    }
    spokes.frustumCulled = false;
    world.add(spokes);

    // streaks along the wall: stretch with speed, rest as soft dots
    const sGeo = new THREE.BoxGeometry(0.06, 0.06, 1);
    const rand = H.seeded('callback-streaks');
    const aS = new Float32Array(STREAKS * 4);
    for (let i = 0; i < STREAKS; i++) {
      aS[i * 4] = rand() * Math.PI * 2;
      aS[i * 4 + 1] = R * (0.72 + rand() * 0.24);
      aS[i * 4 + 2] = rand() * L;
      aS[i * 4 + 3] = 0.7 + rand() * 0.6;
    }
    sGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4));
    const streaks = new THREE.InstancedMesh(sGeo, new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTravel, uSpeed; attribute vec4 aS; varying float vD; varying float vK; ${fogFn}
        void main(){
          float z = -mod(aS.z - uTravel * aS.w, ${L.toFixed(2)}) - 1.0;
          float len = 0.18 + uSpeed * 5.5 * aS.w;
          vec3 p = position; p.z *= len;
          p += vec3(cos(aS.x) * aS.y, sin(aS.x) * aS.y, z);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vD = -mv.z; vK = aS.w; gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform vec3 uStreak; uniform float uSpeed, uGlow; varying float vD; varying float vK; ${fogFn} void main(){ gl_FragColor = vec4(uStreak * (0.35 + 0.65 * uSpeed) * vK * fogAt(vD) * smoothstep(1.0, 5.0, vD) * uGlow, 1.0); }`,
    }), STREAKS);
    streaks.frustumCulled = false;
    world.add(streaks);

    // ---------- DOM ----------
    const g = 'void';
    const scrim = C.Scrim.create({ ground: g, side: 'center', extent: 0.9, strength: 0.97 });
    const line1 = C.Headline.create({ text: copy.line1, role: 'h2', ground: g, width: 1300, align: 'center' });
    const line2 = C.Headline.create({ text: copy.line2, role: 'h2', ground: g, width: 1664, align: 'center', tone: 'accent' });
    const s = factSource(ctx, (beat.facts || [])[0]);
    const source = C.SourceLine.create({ kind: s.kind, text: s.text, ground: g });
    const stack = document.createElement('div');
    Object.assign(stack.style, { position: 'absolute', left: '128px', top: '0px', width: '1664px', height: '994px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '40px' });
    stack.append(line1.el, line2.el);
    root.append(scrim.el, stack, source.el);
    place(source.el, 128, 988);

    const vis = {};
    function show(c, key, want, tl, at, animate) {
      if (!!vis[key] === want) return;
      vis[key] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
    }
    const ride = { v: 0 };
    let travel = 0;

    function stateTo(step, animate, entering) {
      const A = animate && !renderMode;
      const tl = gsap.timeline();
      if (A && entering) {
        // accelerate like the opener, hold, then decelerate to stillness
        tl.fromTo(ride, { v: 0.05 }, { v: 1, duration: 2.4, ease: 'power2.in' }, 0);
        tl.to(ride, { v: 0, duration: 4.2, ease: 'power3.out' }, 3.4);
      } else if (!A) {
        ride.v = 0;
        travel = Math.round(travel / SP) * SP;
        tl.set(ride, { v: 0 }, 0);
      }
      show(scrim, 'scrim', step >= 1, tl, 0, A);
      if (A) tl.to(U.uGlow, { value: step >= 1 ? 0.45 : 1, duration: 1.4, ease: 'sine.inOut' }, 0); else tl.set(U.uGlow, { value: step >= 1 ? 0.45 : 1 }, 0);
      show(line1, 'line1', step >= 1, tl, A ? 0.6 : 0, A);
      show(line2, 'line2', step >= 1, tl, A ? 2.0 : 0, A);
      show(source, 'source', step >= 1, tl, A ? 1.2 : 0, A);
      return tl;
    }

    return {
      steps: beat.steps.length,
      world,
      enter() { return stateTo(0, true, true); },
      goto(step, { animate }) { return stateTo(step, animate, false); },
      exit() { return gsap.timeline(); },
      update(time, dt) {
        if (renderMode) { U.uTravel.value = 0; U.uSpeed.value = 0; return; }
        travel += ride.v * MAXV * (dt || 0);
        if (travel > 1e5) travel -= Math.floor(travel / L) * L;
        U.uTravel.value = travel;
        U.uSpeed.value = ride.v;
      },
      dispose() {
        gsap.killTweensOf([ride, U.uGlow]);
        [scrim, line1, line2, source].forEach((c) => c.destroy());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
