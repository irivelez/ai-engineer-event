// factory (gl-1): the software factory. The camera dives from sf-arrival's aerial into the city's factory floor:
// pull requests (instanced cubes) stream on nine conveyor lanes into one bright trunk, "main". Step 1: five
// towers rise, one cube per 50 merged PRs (Grok Bot team, Jun → Oct). Steps 2–3: a recolour wave sweeps the
// stream to the agent's share (75 %, then 92 %): accent = written by the agent. World: _worlds/city.js.
import { gsap } from 'gsap';
import { factSource, place, makeLookRig, projector } from './_worlds/gl1-kit.js';
import { buildCity, FZ } from './_worlds/city.js';
import { SHOTS as ARRIVAL } from './sf-arrival.js';

const SHOTS = [
  { px: -14, py: 11, pz: -6, tx: 2, ty: 0, tz: -50, shiftX: 360 },
  { px: 15, py: 10, pz: -24, tx: 14.6, ty: 3.6, tz: -61, shiftX: 520 },
  { px: -22, py: 24, pz: -14, tx: 2, ty: 0, tz: -50, shiftX: 380 },
  { px: -25, py: 20, pz: -19, tx: 1, ty: 0, tz: -52, shiftX: 390 },
];
const TOWER_X = (k) => 6.2 + k * 4;
const TOWER_Z = -61;
const PER_CUBE = 100; // merged PRs per cube
const PITCH = 0.58;

export default {
  id: 'factory',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode, tokens } = ctx;
    const { THREE, helpers: H } = gl;
    const city = buildCity(ctx);
    const { world, prU } = city;
    const rig = makeLookRig(THREE, world.camera, { ...SHOTS[0], breathe: renderMode ? 0 : 0.2 });
    const project = projector(THREE, world.camera);

    // ---------- towers: the monthly series as stacks of PR cubes ----------
    const series = (copy.s1 && copy.s1.series) || [];
    const counts = series.map(([, v]) => Math.max(1, Math.round(v / PER_CUBE)));
    const total = counts.reduce((a, b) => a + b, 0);
    const tGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const aTarget = new Float32Array(total * 3);
    const aAppear = new Float32Array(total);
    const aTone = new Float32Array(total);
    let idx = 0;
    counts.forEach((cnt, k) => {
      for (let j = 0; j < cnt; j++) {
        const layer = Math.floor(j / 9);
        const cell = j % 9;
        aTarget[idx * 3] = TOWER_X(k) + ((cell % 3) - 1) * PITCH;
        aTarget[idx * 3 + 1] = 0.27 + layer * PITCH;
        aTarget[idx * 3 + 2] = TOWER_Z + (Math.floor(cell / 3) - 1) * PITCH;
        aAppear[idx] = k + (j / cnt) * 0.92;
        aTone[idx] = k === counts.length - 1 ? 1 : 0;
        idx++;
      }
    });
    tGeo.setAttribute('aTarget', new THREE.InstancedBufferAttribute(aTarget, 3));
    tGeo.setAttribute('aAppear', new THREE.InstancedBufferAttribute(aAppear, 1));
    tGeo.setAttribute('aTone', new THREE.InstancedBufferAttribute(aTone, 1));
    const tU = { uRise: { value: 0 }, uOpacity: { value: 1 }, uOld: { value: H.color('lightSoft', 0.55) }, uNew: { value: H.color('accent', 1.5) } };
    const towers = new THREE.InstancedMesh(tGeo, new THREE.ShaderMaterial({
      uniforms: tU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uRise; uniform vec3 uOld, uNew;
        attribute vec3 aTarget; attribute float aAppear; attribute float aTone;
        varying vec3 vColor; varying float vA;
        void main(){
          float e = smoothstep(aAppear, aAppear + 0.16, uRise);
          vec3 p = position * (0.4 + 0.6 * e) + aTarget + vec3(0.0, 2.6 * (1.0 - e) * (1.0 - e), 0.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          vColor = mix(uOld, uNew, aTone);
          vA = e;
        }`,
      fragmentShader: 'uniform float uOpacity; varying vec3 vColor; varying float vA; void main(){ gl_FragColor = vec4(vColor * vA * uOpacity, 1.0); }',
    }), total);
    towers.frustumCulled = false;
    world.add(towers);

    // ---------- DOM ----------
    const g = 'void';
    const scrim = C.Scrim.create({ ground: g, side: 'left', extent: 0.76, strength: 0.96 });
    const floorScrim = C.Scrim.create({ ground: g, side: 'bottom', extent: 0.22, strength: 0.9 });
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: g, width: 1000 });
    const sub = C.Headline.create({ text: copy.sub, role: 'lead', ground: g, width: 760, tone: 'muted' });
    const gloss = C.Headline.create({ text: copy.gloss, role: 'body', ground: g, width: 1100, tone: 'muted' });
    root.append(scrim.el, floorScrim.el, title.el, sub.el, gloss.el);
    place(title.el, 128, 136);
    place(sub.el, 128, 264);
    place(gloss.el, 128, 872);
    const blocks = ['s1', 's2', 's3'].map((key, i) => {
      const s = copy[key] || {};
      const who = C.Kicker.create({ text: s.who || '', ground: g, tone: 'muted' });
      const num = C.BigNumber.create({ display: s.value, label: s.label, size: 'display', ground: g, tone: i === 0 ? 'fg' : 'accent' });
      const detail = C.Headline.create({ text: s.detail || '', role: 'lead', ground: g, width: 900, tone: 'muted' });
      const col = document.createElement('div');
      Object.assign(col.style, { position: 'absolute', left: '128px', top: '300px', width: '1000px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' });
      col.append(who.el, num.el, detail.el);
      root.append(col);
      return { who, num, detail, src: factSource(ctx, (beat.facts || [])[i]) };
    });
    const source = C.SourceLine.create({ kind: blocks[0].src.kind, text: blocks[0].src.text, ground: g });
    root.append(source.el);
    place(source.el, 128, 988);

    // month labels under the towers, values at the ends (Jun, Oct)
    const labelLayer = document.createElement('div');
    labelLayer.className = 'ground-void';
    Object.assign(labelLayer.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', pointerEvents: 'none' });
    root.append(labelLayer);
    const fmt = new Intl.NumberFormat('en-US');
    const labels = series.map(([m, v], k) => {
      const month = document.createElement('div');
      month.className = 't-label';
      month.textContent = m;
      Object.assign(month.style, { position: 'absolute', left: '0px', top: '0px', color: tokens.colors.lightSoft, whiteSpace: 'nowrap', transform: 'translate(-50%, 0)' });
      labelLayer.append(month);
      let val = null;
      if (k === 0 || k === series.length - 1) {
        val = document.createElement('div');
        val.className = 't-label tnum';
        val.textContent = fmt.format(v);
        Object.assign(val.style, { position: 'absolute', left: '0px', top: '0px', color: k === series.length - 1 ? tokens.colors.accent : tokens.colors.light, whiteSpace: 'nowrap', transform: 'translate(-50%, -100%)' });
        labelLayer.append(val);
      }
      const layers = Math.ceil(counts[k] / 9);
      return { month, val, x: TOWER_X(k), top: 0.27 + layers * PITCH + 0.35 };
    });
    gsap.set(labelLayer, { autoAlpha: 0 });
    const pt = { x: 0, y: 0, z: 0 };
    function pinLabels() {
      for (const l of labels) {
        project(l.x, -0.1, TOWER_Z + 1.0, pt);
        l.month.style.transform = `translate(${pt.x.toFixed(1)}px, ${(pt.y + 14).toFixed(1)}px) translate(-50%, 0)`;
        if (l.val) {
          project(l.x, l.top, TOWER_Z, pt);
          l.val.style.transform = `translate(${pt.x.toFixed(1)}px, ${(pt.y - 10).toFixed(1)}px) translate(-50%, -100%)`;
        }
      }
    }

    // ---------- state ----------
    const vis = {};
    function show(c, key, want, tl, at, animate) {
      if (!!vis[key] === want) return;
      vis[key] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
    }
    const SHARE = [-1, -1, 0.75, 0.92];
    let srcStep = -1;

    function stateTo(step, animate, entering) {
      const A = animate && !renderMode;
      const tl = gsap.timeline();
      if (A && entering) { rig.set({ ...ARRIVAL.hold }); tl.add(rig.to(SHOTS[0], { duration: 5.2, ease: 'power3.inOut' }), 0); } else tl.add(rig.to(SHOTS[step], { duration: A ? (step === 1 ? 4.2 : 4.6) : 0, ease: 'power3.inOut' }), 0);

      // towers rise in step 1, stay (dim) after
      if (A && step === 1 && tU.uRise.value < counts.length) tl.fromTo(tU.uRise, { value: 0 }, { value: counts.length, duration: 4.6, ease: 'none' }, 0.9);
      else tl.set(tU.uRise, { value: step >= 1 ? counts.length : 0 }, 0);
      const tOp = step === 1 ? 1 : step > 1 ? 0.35 : 1;
      if (A) tl.to(tU.uOpacity, { value: tOp, duration: 1.2 }, 0); else tl.set(tU.uOpacity, { value: tOp }, 0);
      const labelsOn = step === 1;
      if (A) tl.to(labelLayer, { autoAlpha: labelsOn ? 1 : 0, duration: labelsOn ? 0.8 : 0.4 }, labelsOn ? 4.6 : 0); else tl.set(labelLayer, { autoAlpha: labelsOn ? 1 : 0 }, 0);

      // the stream: neutral, then the agent's share sweeps down the lanes
      const want = SHARE[step];
      if (A && want >= 0 && prU.uNew.value !== want) {
        tl.set(prU.uOld, { value: prU.uNew.value }, 0.6);
        tl.set(prU.uNew, { value: want }, 0.6);
        tl.fromTo(prU.uFront, { value: FZ.start + 2 }, { value: FZ.end - 3, duration: 3.6, ease: 'power1.inOut' }, 0.6);
      } else {
        tl.set(prU.uOld, { value: want }, 0);
        tl.set(prU.uNew, { value: want }, 0);
        tl.set(prU.uFront, { value: FZ.end - 3 }, 0);
      }

      // DOM
      show(scrim, 'scrim', true, tl, 0, A);
      show(floorScrim, 'floorScrim', true, tl, 0, A);
      show(title, 'title', true, tl, A ? (entering ? 2.2 : 0) : 0, A);
      show(sub, 'sub', step === 0, tl, A ? (entering ? 2.6 : 0) : 0, A);
      show(gloss, 'gloss', step === 0, tl, A ? (entering ? 3.2 : 0) : 0, A);
      blocks.forEach((b, i) => {
        const on = step === i + 1;
        show(b.who, `who${i}`, on, tl, A ? 0.5 : 0, A);
        show(b.num, `num${i}`, on, tl, A ? 0.6 : 0, A);
        show(b.detail, `det${i}`, on, tl, A ? 1.1 : 0, A);
      });
      if (step >= 1) {
        const b = blocks[step - 1];
        if (srcStep !== step) {
          if (vis.source) tl.add(source.set({ kind: b.src.kind, text: b.src.text }, { animate: A }), A ? 0.6 : 0);
          else source.set({ kind: b.src.kind, text: b.src.text }, { animate: false });
          srcStep = step;
        }
      }
      show(source, 'source', step >= 1, tl, A ? 1.0 : 0, A);
      return tl;
    }

    return {
      steps: beat.steps.length,
      world,
      enter() { return stateTo(0, true, true); },
      goto(step, { animate }) { return stateTo(step, animate, false); },
      exit() {
        const tl = gsap.timeline();
        tl.to(rig.state, { pz: '-=4', duration: 0.8, ease: 'power2.in', onUpdate: rig.apply }, 0);
        return tl;
      },
      update(time) {
        const t = renderMode ? 0 : time;
        city.update(t);
        rig.update(t);
        if (labelLayer.style.visibility !== 'hidden') pinLabels();
      },
      dispose() {
        gsap.killTweensOf([rig.state, tU.uRise, tU.uOpacity, prU.uFront, prU.uOld, prU.uNew, labelLayer]);
        [scrim, floorScrim, title, sub, gloss, source].forEach((c) => c.destroy());
        blocks.forEach((b) => { b.who.destroy(); b.num.destroy(); b.detail.destroy(); });
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
