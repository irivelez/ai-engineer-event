// release-pace (gl-1): continues three-labs' camera in the same world. The monoliths lower into markers and a
// light track runs from each into depth along a time axis, 1 Sep → 17 Nov 2026. Releases fire as beads in date
// order, each at its real date from facts.json "releases-sep-nov"; a bead is placed only where the date is
// verified (GPT-6 Sol and Luna has no stated launch day: OpenAI's count still says 5). Then 14 in 11 weeks.
import { gsap } from 'gsap';
import { factSource, splitFigure, place, makeLookRig, projector } from './_worlds/gl1-kit.js';
import { buildLabs, monoX, dateZ, labKey, TRACK } from './_worlds/labs.js';
import { CAM as LABS_CAM } from './three-labs.js';

// Side view: the tracks run along -z, so from +x the time axis reads left (1 Sep) → right (17 Nov).
const SHOTS = [
  { px: 55.4, py: 34.5, pz: -22.8, tx: 0, ty: -1.5, tz: -22.8, shiftX: 72, shiftY: 10 },
  { px: 55.8, py: 32.5, pz: -23.4, tx: 0, ty: -1.5, tz: -23.4, shiftX: 72, shiftY: 10 },
  { px: 55.4, py: 34.5, pz: -22.8, tx: 0, ty: -1.5, tz: -22.8, shiftX: 72, shiftY: -100 },
];
const sphericalToLook = (c) => {
  const D = Math.PI / 180;
  return { px: c.tx + c.r * Math.sin(c.pol * D) * Math.sin(c.az * D), py: c.ty + c.r * Math.cos(c.pol * D), pz: c.tz + c.r * Math.sin(c.pol * D) * Math.cos(c.az * D), tx: c.tx, ty: c.ty, tz: c.tz, shiftX: c.shiftX || 0, shiftY: c.shiftY || 0 };
};

export default {
  id: 'release-pace',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode, tokens } = ctx;
    const { THREE } = gl;
    const labsBeat = (ctx.beats || []).find((m) => m.id === 'three-labs');
    const labs = (labsBeat && labsBeat.copy && labsBeat.copy.labs) || [{ lab: 'Anthropic' }, { lab: 'OpenAI' }, { lab: 'Google DeepMind' }];
    const order = labs.map((l) => labKey(l.lab));
    const L = buildLabs(ctx, { labs });
    const { world, H } = L;
    const rig = makeLookRig(THREE, world.camera, { ...SHOTS[0], breathe: renderMode ? 0 : 0.18 });
    const project = projector(THREE, world.camera);
    const state = { mono: 0.14, draw: 1, ticks: 1 };
    const apply = () => {
      L.monos.forEach((m) => m.set(state.mono, 0.8));
      L.floorU.uPool.value = 0.6 * state.mono + 0.25;
      L.trackU.forEach((u) => { u.uDraw.value = state.draw; });
      L.tickMat.opacity = state.ticks * 0.55;
    };
    apply();

    // ---------- beads: one per release with a verified date ----------
    const rel = (ctx.facts('releases-sep-nov') || {}).releases || [];
    const placed = rel
      .map((r) => ({ ...r, k: order.indexOf(labKey(r.lab)), z: dateZ(r.date), ok: /^verified/i.test(String(r.dateStatus || '')) }))
      .filter((r) => r.ok && r.k >= 0 && r.z != null)
      .sort((a, b) => a.date.localeCompare(b.date));
    const beadGeo = new THREE.SphereGeometry(0.42, 20, 14);
    const ringGeo = new THREE.RingGeometry(0.56, 0.72, 48);
    const beads = placed.map((r) => {
      const col = L.colors[r.k];
      const bead = new THREE.Mesh(beadGeo, new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      bead.position.set(monoX(r.k), 0.34, r.z);
      bead.renderOrder = 4;
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(monoX(r.k), 0.03, r.z);
      ring.renderOrder = 4;
      world.add(bead, ring);
      bead.scale.setScalar(0.001);
      return { bead, ring, r };
    });

    // ---------- DOM ----------
    const g = 'void';
    const scrim = C.Scrim.create({ ground: g, side: 'left', extent: 0.66, strength: 0.94 });
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: g, width: 1660 });
    const windowK = C.Kicker.create({ text: copy.window, ground: g, tone: 'muted' });
    const tf = splitFigure(copy.total);
    const total = C.BigNumber.create({ display: tf.figure, label: copy.totalLabel, size: 'display', ground: g, tone: 'accent' });
    root.append(scrim.el, title.el, windowK.el, total.el);
    place(title.el, 128, 112);
    place(windowK.el, 128, 228);
    place(total.el, 128, 620);
    const counts = copy.counts || [];
    const labelLayer = document.createElement('div');
    labelLayer.className = 'ground-void';
    Object.assign(labelLayer.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', pointerEvents: 'none' });
    root.append(labelLayer);
    const trackLabels = order.map((key, k) => {
      const c = counts.find((x) => labKey(x.lab) === key) || { lab: labs[k].lab, n: '' };
      const box = document.createElement('div');
      Object.assign(box.style, { position: 'absolute', left: '0px', top: '0px', whiteSpace: 'nowrap', transform: 'translate(-100%, -50%)', textAlign: 'right' });
      box.innerHTML = '<span class="t-label" style="color: var(--g-fg)"></span><span class="t-label tnum" style="color: var(--g-accent); margin-left: 16px"></span>';
      box.children[0].textContent = c.lab;
      box.children[1].textContent = String(c.n);
      labelLayer.append(box);
      return { box, n: box.children[1], k };
    });
    const [w0, w1] = String(copy.window || '').split('→').map((s) => s.trim());
    const axis = [[w0, 0], [w1, 1]].map(([text, end]) => {
      const d = document.createElement('div');
      d.className = 't-label tnum';
      d.textContent = text || '';
      Object.assign(d.style, { position: 'absolute', left: '0px', top: '0px', whiteSpace: 'nowrap', color: tokens.colors.lightSoft, transform: 'translate(-50%, 0)' });
      labelLayer.append(d);
      return { d, z: end ? TRACK.z0 - TRACK.len + 1.2 : TRACK.z0 - 1.2 };
    });
    gsap.set(labelLayer, { autoAlpha: 0 });
    const src = factSource(ctx, 'releases-sep-nov');
    const source = C.SourceLine.create({ kind: src.kind, text: src.text, ground: g });
    root.append(source.el);
    place(source.el, 128, 988);
    const pt = { x: 0, y: 0, z: 0 };
    function pin() {
      trackLabels.forEach(({ box, k }) => {
        project(monoX(k), 0, TRACK.z0 + 0.6, pt);
        box.style.transform = `translate(${(pt.x - 28).toFixed(1)}px, ${pt.y.toFixed(1)}px) translate(-100%, -50%)`;
      });
      axis.forEach(({ d, z }) => {
        project(monoX(2) + 2.2, 0, z, pt);
        d.style.transform = `translate(${pt.x.toFixed(1)}px, ${(pt.y + 18).toFixed(1)}px) translate(-50%, 0)`;
      });
    }

    const vis = {};
    function show(c, key, want, tl, at, animate) {
      if (!!vis[key] === want) return;
      vis[key] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
    }
    let fired = false;
    function setBeads(on) {
      beads.forEach(({ bead, ring }) => { bead.scale.setScalar(on ? 1 : 0.001); ring.material.opacity = 0; ring.scale.setScalar(1); });
      fired = on;
    }

    function stateTo(step, animate, entering) {
      const A = animate && !renderMode;
      const tl = gsap.timeline();
      if (A && entering) {
        rig.set(sphericalToLook(LABS_CAM[2]));
        state.mono = 1; state.draw = 0; state.ticks = 0; apply();
        tl.add(rig.to(SHOTS[0], { duration: 5.2, ease: 'power3.inOut' }), 0);
        tl.to(state, { mono: 0.14, duration: 2.6, ease: 'power2.inOut', onUpdate: apply }, 0.2);
        tl.to(state, { draw: 1, duration: 3.2, ease: 'power2.inOut', onUpdate: apply }, 1.4);
        tl.to(state, { ticks: 1, duration: 1.2, ease: 'sine.inOut', onUpdate: apply }, 3.2);
      } else {
        tl.add(rig.to(SHOTS[step], { duration: A ? (step === 1 ? 7.2 : 4.6) : 0, ease: step === 1 ? 'sine.inOut' : 'power3.inOut' }), 0);
        tl.add(() => { state.mono = 0.14; state.draw = 1; state.ticks = 1; apply(); }, 0);
        if (!A) { state.mono = 0.14; state.draw = 1; state.ticks = 1; apply(); }
      }
      // beads fire in date order in step 1
      if (A && step === 1 && !fired) {
        setBeads(false);
        fired = true;
        beads.forEach(({ bead, ring }, i) => {
          const at = 0.6 + i * 0.46;
          tl.fromTo(bead.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'expo.out' }, at);
          tl.fromTo(ring.scale, { x: 1, y: 1, z: 1 }, { x: 5, y: 5, z: 5, duration: 1.1, ease: 'power2.out' }, at);
          tl.fromTo(ring.material, { opacity: 0.9 }, { opacity: 0, duration: 1.1, ease: 'power2.in' }, at);
        });
      } else if (!(A && step === 1)) tl.add(() => setBeads(step >= 1), 0);
      if (!A) setBeads(step >= 1);

      show(scrim, 'scrim', true, tl, 0, A);
      show(title, 'title', true, tl, A && entering ? 2.0 : 0, A);
      show(windowK, 'window', step <= 1, tl, A && entering ? 2.6 : 0, A);
      show(total, 'total', step === 2, tl, A ? 0.6 : 0, A);
      show(source, 'source', step === 2, tl, A ? 1.0 : 0, A);
      const countsOn = step === 2;
      if (A) {
        tl.to(labelLayer, { autoAlpha: 1, duration: 0.8 }, entering ? 3.6 : 0);
        tl.to(trackLabels.map((t) => t.n), { autoAlpha: countsOn ? 1 : 0, duration: 0.6 }, countsOn ? 1.2 : 0);
      } else {
        tl.set(labelLayer, { autoAlpha: 1 }, 0);
        tl.set(trackLabels.map((t) => t.n), { autoAlpha: countsOn ? 1 : 0 }, 0);
      }
      return tl;
    }

    return {
      steps: beat.steps.length,
      world,
      enter() { return stateTo(0, true, true); },
      goto(step, { animate }) { return stateTo(step, animate, false); },
      exit() { return gsap.timeline(); },
      update(time) {
        const t = renderMode ? 0 : time;
        L.update(t);
        rig.update(t);
        if (labelLayer.style.visibility !== 'hidden') pin();
      },
      dispose() {
        gsap.killTweensOf([rig.state, state, labelLayer, ...trackLabels.map((t) => t.n), ...beads.flatMap((b) => [b.bead.scale, b.ring.scale, b.ring.material])]);
        [scrim, title, windowK, total, source].forEach((c) => c.destroy());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
