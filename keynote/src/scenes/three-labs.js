// three-labs (gl-1): Act II opens on a dark reflective floor; three luminous monoliths rise, one per lab (lab
// identity colours, direct-labelled), the camera arcs slowly; then model names and release dates land under
// them. World: _worlds/labs.js (release-pace continues from this camera into the same world).
import { gsap } from 'gsap';
import { factSource, place, makeRig, projector } from './_worlds/gl1-kit.js';
import { buildLabs, monoX } from './_worlds/labs.js';

export const CAM = [
  { az: 0, pol: 88, r: 34, tx: 0, ty: 3.4, tz: 0, shiftX: 0, shiftY: -62, orbitAmp: 0 },
  { az: -7, pol: 84.5, r: 32, tx: 0, ty: 3.5, tz: 0, shiftX: 0, shiftY: -62, orbitAmp: 5 },
  { az: 6, pol: 84, r: 31.5, tx: 0, ty: 3.4, tz: 0, shiftX: 0, shiftY: -62, orbitAmp: 3 },
];

export default {
  id: 'three-labs',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode, tokens } = ctx;
    const { THREE } = gl;
    const labs = copy.labs || [];
    const L = buildLabs(ctx, { labs });
    const { world } = L;
    const rig = makeRig(THREE, world.camera, { ...CAM[0], breathe: renderMode ? 0 : 0.3 });
    const project = projector(THREE, world.camera);
    const rise = { v: 0, pool: 0 };
    const applyRise = () => { L.monos.forEach((m, k) => m.set(Math.min(1, Math.max(0, rise.v * 1.25 - k * 0.12)))); L.floorU.uPool.value = rise.pool; };
    applyRise();

    // ---------- DOM ----------
    const g = 'void';
    const acts = ctx.acts || [];
    const numbered = acts.filter((a) => a.n);
    const actIndex = Math.max(0, numbered.findIndex((a) => a.id === beat.act));
    const scrimL = C.Scrim.create({ ground: g, side: 'left', extent: 0.7, strength: 0.94 });
    const scrimT = C.Scrim.create({ ground: g, side: 'top', extent: 0.34, strength: 0.9 });
    const scrimB = C.Scrim.create({ ground: g, side: 'bottom', extent: 0.36, strength: 0.92 });
    const act = C.ActTitle.create({ numeral: copy.act, title: copy.actTitle, index: actIndex, total: numbered.length || 5, ground: g, width: 1240 });
    const line = C.Headline.create({ text: copy.line, role: 'h2', ground: g, width: 1500 });
    root.append(scrimL.el, scrimT.el, scrimB.el, act.el, line.el);
    place(act.el, 128, 300);
    place(line.el, 128, 96);

    // labels under the monoliths: lab · model · date
    const labelLayer = document.createElement('div');
    labelLayer.className = 'ground-void';
    Object.assign(labelLayer.style, { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', pointerEvents: 'none' });
    root.append(labelLayer);
    const labels = labs.map((l) => {
      const box = document.createElement('div');
      Object.assign(box.style, { position: 'absolute', left: '0px', top: '0px', width: '520px', textAlign: 'center', transform: 'translate(-50%, 0)' });
      box.innerHTML = '<div class="t-label" style="color: var(--g-muted)"></div><div class="t-body" style="font-weight:600;color: var(--g-fg);margin-top:8px"></div><div class="t-label tnum" style="color: var(--g-fg);margin-top:12px"></div>';
      box.children[0].textContent = l.lab;
      box.children[1].textContent = l.model;
      box.children[2].textContent = l.date;
      labelLayer.append(box);
      return box;
    });
    gsap.set(labelLayer, { autoAlpha: 0 });
    const srcParts = (beat.facts || []).map((id) => factSource(ctx, id)).filter((s) => s && s.fact);
    const srcText = srcParts.map((s) => s.text.replace(' · ', ', ')).join(' · ');
    const source = C.SourceLine.create({ kind: (srcParts[0] && srcParts[0].kind) || 'official', text: srcText, ground: g });
    root.append(source.el);
    place(source.el, 128, 988);
    const pt = { x: 0, y: 0, z: 0 };
    function pin() {
      let base = 0;
      for (let k = 0; k < labels.length; k++) { project(monoX(k), 0, 0.6, pt); base = Math.max(base, pt.y); }
      labels.forEach((box, k) => {
        project(monoX(k), 0, 0.6, pt);
        box.style.transform = `translate(${pt.x.toFixed(1)}px, ${(base + 40).toFixed(1)}px) translate(-50%, 0)`;
      });
    }

    const vis = {};
    function show(c, key, want, tl, at, animate) {
      if (!!vis[key] === want) return;
      vis[key] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
    }

    function stateTo(step, animate) {
      const A = animate && !renderMode;
      const tl = gsap.timeline();
      const cam = { ...CAM[step], orbitAmp: renderMode ? 0 : CAM[step].orbitAmp };
      tl.add(rig.to(cam, { duration: A ? 4.8 : 0, ease: 'power3.inOut' }), 0);
      const wantRise = step >= 1 ? 1 : 0;
      const wantPool = step >= 1 ? 1 : 0.35;
      if (A && wantRise > rise.v) tl.to(rise, { v: 1, pool: 1, duration: 4.2, ease: 'power2.inOut', onUpdate: applyRise }, 0.3);
      else tl.add(() => { rise.v = wantRise; rise.pool = wantPool; applyRise(); }, 0);
      if (!A) { rise.v = wantRise; rise.pool = wantPool; applyRise(); }
      show(scrimL, 'scrimL', step === 0, tl, 0, A);
      show(act, 'act', step === 0, tl, A ? 0.5 : 0, A);
      show(scrimT, 'scrimT', step >= 1, tl, 0, A);
      show(line, 'line', step >= 1, tl, A ? 2.6 : 0, A);
      show(scrimB, 'scrimB', step >= 2, tl, 0, A);
      const labelsOn = step >= 2;
      if (A && labelsOn && labelLayer.style.visibility === 'hidden') {
        tl.fromTo(labels, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'expo.out', stagger: 0.12 }, 0.4);
        tl.set(labelLayer, { autoAlpha: 1 }, 0.4);
      } else {
        tl.set(labelLayer, { autoAlpha: labelsOn ? 1 : 0 }, 0);
        tl.set(labels, { autoAlpha: 1, y: 0 }, 0);
      }
      show(source, 'source', step >= 2, tl, A ? 1.2 : 0, A);
      return tl;
    }

    return {
      steps: beat.steps.length,
      world,
      enter() { return stateTo(0, true); },
      goto(step, { animate }) { return stateTo(step, animate); },
      exit() { return gsap.timeline(); },
      update(time) {
        const t = renderMode ? 0 : time;
        L.update(t);
        rig.update(t);
        if (labelLayer.style.visibility !== 'hidden') pin();
      },
      dispose() {
        gsap.killTweensOf([rig.state, rise, labelLayer, ...labels]);
        [scrimL, scrimT, scrimB, act, line, source].forEach((c) => c.destroy());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
