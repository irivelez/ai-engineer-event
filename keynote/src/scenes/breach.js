// breach: the sandbox breaks. Art direction:
// References: GTC Berlin 2026's physically lit data-hall films; real glass test enclosures; OpenAI DevDay's restraint.
// Palette: cold steel and blue-white fixture light; the agents a single red-orange; red spill marks infected racks.
// Light: environment from the hall's own fixtures (PMREM), a cool key from above, the agents' glow inside the glass.
// Camera: 28° lens at eye height; a slow push on the box, a truck right and crane up as it breaks, a flight over
// the box and down the aisle with the stream, then it holds.
// The frame that sells it: the cracked glass box at the head of the aisle, racks turning red one by one behind it.
// Story: 1,200 agents inside (metr-700-agents: ~1,200 coordinating) press on the glass; one wall cracks from one impact and
// falls in heavy shards; 700 (METR: joined the attack) stream along the floor's network traces to the racks, which
// turn red rack by rack while the date clock runs 9 → 13 Jul (hf-intrusion). The motive step calms and holds.
// Evidence: on the motive step, Hugging Face's own paragraph (src/data/evidence.json) arrives under the line as the
// calm beat, its "attempt to cheat the evaluation" sentence boxed, with its chip, hedge and QR beside it.
// World: src/scenes/_worlds/breach-world.js.
import { gsap } from 'gsap';
import * as THREE from 'three';
import { evItem, evPage } from './_ev-page.js';
import { factsSource, provKind, place, splitFigure, croppedCard, captureInfo } from './_worlds/gl2-kit.js';
import { buildHall } from './_worlds/breach-world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// One move per step: [positions], [targets], lens shift (px), focus (m), focus range (m), bokeh.
const MOVES = [
  { pos: [V(2.2, 1.8, 13.4), V(1.95, 1.74, 12.2), V(1.75, 1.7, 11.2)], tgt: [V(0.45, 1.25, -1.4), V(0.42, 1.25, -1.4), V(0.4, 1.25, -1.4)], shift: 330, focus: 11.2, range: 4, bokeh: 2.4, dur: 9, ease: 'power2.out' },
  { pos: [V(1.75, 1.7, 11.2), V(2.55, 1.85, 13.0), V(2.2, 2.5, 13.6), V(1.6, 3.0, 13.8)], tgt: [V(0.4, 1.25, -1.4), V(0.9, 1.36, 0.55), V(1.15, 0.8, -4.0), V(1.15, 0.45, -10)], shift: 470, focus: 13.6, range: 9, bokeh: 2.0, dur: 7, ease: 'power2.inOut' },
  { pos: [V(1.6, 3.0, 13.8), V(0.7, 3.05, 4.5), V(0.5, 3.0, -1.2), V(0.55, 2.3, -8.5)], tgt: [V(1.15, 0.45, -10), V(1.05, 0.6, -18), V(1.0, 0.7, -24), V(0.7, 0.8, -33)], shift: 330, focus: 12, range: 12, bokeh: 1.8, dur: 8, ease: 'power2.inOut' },
  { pos: [V(0.55, 2.25, -8.5), V(0.45, 2.45, -9.6), V(0.4, 2.55, -10.2)], tgt: [V(0.7, 0.8, -33), V(0.65, 0.85, -33), V(0.62, 0.88, -33)], shift: 380, focus: 14, range: 24, bokeh: 1.4, dur: 4.5, ease: 'sine.inOut' },
  { pos: [V(0.4, 2.55, -10.2), V(0.4, 2.55, -10.2)], tgt: [V(0.62, 0.88, -33), V(0.62, 0.88, -33)], shift: 380, focus: 14, range: 24, bokeh: 1.4, dur: 1, ease: 'none' },
];
const LEAK_AT = [0, 0.32, 1, 1, 1]; // how far the escape has run at the end of each step (0 → 1)
// Depth of field is off. Measured on this M2: the default 0.5 blur buffer cost ~5 ms a frame and missed 60 fps
// on the 1470×956@2x viewport; the 0.3 buffer passed one run and failed the next (51–54 fps on steps 0–1). Without
// it every step held 60 fps with zero missed vsyncs in four runs, which leaves room for Zoom's encoder in the
// live show. Depth comes from the haze, the light falloff down the aisle and the floor's reflections.
const USE_DOF = false;
const DOF_SCALE = 0.3;

export default {
  id: 'breach',
  gl: true,
  create(ctx) {
    const { root, copy, components: C, renderMode, tokens } = ctx;
    const fIntr = ctx.facts('hf-intrusion');
    const f13 = ctx.facts('hf-13-hours');
    const f700 = ctx.facts('metr-700-agents');
    const fMot = ctx.facts('hf-motive');
    const hall = buildHall(ctx);
    const { world } = hall;
    const cam = world.camera;

    // ---------- camera: a CatmullRom path per step, driven by one progress value ----------
    const curve = (pts) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const pathOf = (m, from) => ({ pos: curve(from ? [from.pos, ...m.pos.slice(1)] : m.pos), tgt: curve(from ? [from.tgt, ...m.tgt.slice(1)] : m.tgt) });
    let active = pathOf(MOVES[0]);
    const rig = { u: 1, shift: MOVES[0].shift, breathe: renderMode ? 0 : 0.012 };
    const vp = new THREE.Vector3();
    const vt = new THREE.Vector3();
    let clock = 0;
    let lastShift = NaN;
    function applyCam() {
      const p = active;
      const u = Math.min(1, Math.max(0, rig.u));
      p.pos.getPointAt(u, vp);
      p.tgt.getPointAt(u, vt);
      if (rig.breathe) { vp.x += Math.sin(clock * 0.31) * rig.breathe; vp.y += Math.sin(clock * 0.23 + 1.1) * rig.breathe; }
      cam.position.copy(vp);
      cam.lookAt(vt);
      if (rig.shift !== lastShift) {
        cam.setViewOffset(1920, 1080, -rig.shift, 0, 1920, 1080);
        cam.updateProjectionMatrix();
        lastShift = rig.shift;
      }
    }
    applyCam();
    const dof = { focus: MOVES[0].focus, range: MOVES[0].range, bokeh: MOVES[0].bokeh, scale: DOF_SCALE };
    world.post.dof = USE_DOF ? dof : null;

    // ---------- the escape, as numbers the timeline drives ----------
    const S = { crack: 0, hole: 0, leak: 0, cubeGlow: 1, trace: 0, crackHeat: 1, flash: 0, press: 0.35 };
    const crackIn = hall.cracksIn.geometry;
    const crackOut = hall.cracksOut.geometry;
    const maxD = Math.max(...hall.dOut, ...hall.dIn, 0.01);
    const countBelow = (arr, d) => { let n = 0; while (n < arr.length && arr[n] < d) n++; return n; };
    function applyEscape() {
      const d = S.crack * maxD;
      crackIn.instanceCount = countBelow(hall.dIn, d);
      crackOut.instanceCount = countBelow(hall.dOut, d);
      hall.cracksIn.visible = S.hole < 0.2 && crackIn.instanceCount > 0;
      hall.cracksOut.visible = crackOut.instanceCount > 0;
      const heat = S.crackHeat;
      hall.cracksIn.material.color.setRGB(0.55 + 1.65 * heat, 0.6 + 1.8 * heat, 0.68 + 2.1 * heat);
      hall.cracksOut.material.color.copy(hall.cracksIn.material.color);
      hall.placeShards(S.hole * 2.2);
      // intact glass shows no seams: a shard's cut edge appears only once the crack has run past it
      for (const sh of hall.shards) { const grp = sh.m.geometry.groups[1]; if (grp) grp.count = d > sh.dist - 0.05 && S.crack > 0 ? sh.edgeCount : 0; }
      hall.agentU.uLeak.value = S.leak;
      hall.agentU.uPress.value = S.press;
      hall.ledU.uInfect.value = S.leak;
      hall.floorU.uInfect.value = S.leak;
      hall.floorU.uCubeGlow.value = S.cubeGlow;
      hall.glassU.uGlow.value = S.cubeGlow;
      hall.flash.material.opacity = S.flash;
      hall.flash.scale.setScalar(0.35 + 0.9 * S.flash);
      hall.glow.intensity = 6 * S.cubeGlow;
      hall.traces.material.color.copy(hall.traceCool).lerp(hall.traceHot, S.trace);
      hall.ledU.uCubeGlow.value = S.cubeGlow;
    }
    applyEscape();

    // ---------- DOM (unchanged copy, evidence and layout) ----------
    const scrimL = C.Scrim.create({ ground: 'void', side: 'left', extent: 0.6, strength: 0.92 });
    const scrimB = C.Scrim.create({ ground: 'void', side: 'bottom', extent: 0.3, strength: 0.85 });
    root.append(scrimL.el, scrimB.el);
    const { spanW, space } = tokens;
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: 'void', width: spanW(6) });
    place(title.el, space.margin, 192);
    const s1 = C.Headline.create({ text: copy.s1, role: 'lead', ground: 'void', width: spanW(7) });
    place(s1.el, space.margin, 268);
    const fig13 = splitFigure(copy.s2.value);
    const fig700 = splitFigure(copy.s3.value);
    const num13 = C.BigNumber.create({ display: fig13.figure, unit: fig13.unit || undefined, label: copy.s2.label, kind: provKind(f13 && f13.label), size: 'h1', ground: 'void', width: spanW(6) });
    place(num13.el, space.margin, 150);
    const num700 = C.BigNumber.create({ display: fig700.figure, unit: fig700.unit || undefined, label: copy.s3.label, kind: provKind(f700 && f700.label), size: 'h1', ground: 'void', width: spanW(6) });
    place(num700.el, space.margin, 560);
    const motive = C.Headline.create({ text: copy.motive, role: 'h2', ground: 'void', width: spanW(7), highlight: 'an attempt to cheat the evaluation.' });
    const evM = evItem(ctx, 'breach-hf-motive');
    const DOC_W = 1100;
    const pageM = evM ? evPage(ctx, evM, {
      width: DOC_W, ground: 'void', side: 1920 - 2 * space.margin - DOC_W - 40, qrSize: 160,
      win: { y0: 0.45, y1: 0.97 },
      boxes: { cheat: { x: 0.005, y: 0.645, w: 0.985, h: 0.285 } }, // "We believe the entire intrusion was… an attempt to cheat the evaluation…"
    }) : null;
    place(motive.el, space.margin, pageM ? 236 : 404);
    if (pageM) place(pageM.el, space.margin, 584);
    const source = C.SourceLine.create({ kind: provKind(fIntr && fIntr.label), text: copy.tag, ground: 'void' });
    place(source.el, space.margin, space.footer.y);
    const motiveSrc = C.SourceLine.create({ kind: provKind(fMot && fMot.label), text: factsSource(fMot), ground: 'void' });
    place(motiveSrc.el, space.margin, space.footer.y);

    // Date clock 9 → 13 Jul, from hf-intrusion's value '2026-07-09/13'.
    const [y0, mo, dd] = String((fIntr && fIntr.value) || '').split('-');
    const [d0, d1] = String(dd || '').split('/').map(Number);
    const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(mo) - 1] || '';
    const days = [];
    if (d0 && d1) for (let d = d0; d <= d1; d++) days.push(`${String(d).padStart(2, '0')} ${MON} ${y0}`);
    const clockEl = document.createElement('div');
    clockEl.className = 'ground-void';
    Object.assign(clockEl.style, {
      position: 'absolute', right: '128px', top: '868px', fontFamily: 'var(--f-mono)', fontSize: '48px', lineHeight: '64px', fontWeight: '460',
      letterSpacing: '0.04em', color: 'var(--g-fg)', fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap',
    });
    clockEl.textContent = days[0] || '';
    root.append(clockEl);
    gsap.set(clockEl, { autoAlpha: 0 });
    let dayShown = 0;

    // Not a one-off (director's pick): OpenAI's own post, 23 Oct, as a calm last state.
    const CARD_ID = 'x-openai-securing-training-environment';
    const cardSrc = ctx.assets.capture(CARD_ID);
    const cardMeta = ctx.assets.captureMeta(CARD_ID);
    const ci = captureInfo(cardMeta);
    const CARD_STEP = ctx.beat.steps.length >= 5 ? 4 : -1;
    const card = cardSrc && CARD_STEP > 0 ? croppedCard(C, { id: CARD_ID, src: cardSrc, alt: (cardMeta && cardMeta.title) || '', width: spanW(9), meta: { counts: ci.views, captured: ci.captured } }) : null;
    if (card) place(card.el, (1920 - spanW(9)) / 2, 300);
    const srcCard = card ? C.SourceLine.create({ kind: 'labReported', text: [ci.who, ci.date].filter(Boolean).join(' · '), ground: 'void' }) : null;
    if (srcCard) place(srcCard.el, space.margin, space.footer.y);
    const scrimC = C.Scrim.create({ ground: 'void', side: 'center', extent: 1.1, strength: 0.9 });
    root.append(scrimC.el);
    const parts = [title, s1, num13, num700, motive, source, motiveSrc, card, srcCard, pageM && pageM.c].filter(Boolean);
    parts.forEach((p) => root.append(p.el));
    gsap.set([scrimL.el, scrimB.el], { autoAlpha: 0 });

    function setDay() {
      const n = days.length;
      if (!n) return;
      const i = Math.min(n - 1, Math.floor(S.leak * (n - 1) + 0.02));
      if (i !== dayShown) { dayShown = i; clockEl.textContent = days[i]; }
    }

    // The camera and the escape run on their own tweens, outside the step timeline: a press mid-move carries on
    // from where things are instead of snapping. Render mode and jumps set the end state directly.
    const tweens = [];
    const kill = () => { while (tweens.length) tweens.pop().kill(); };
    function moveTo(step, animate) {
      const m = MOVES[step];
      const dofOn = USE_DOF && step <= 1;
      if (!animate) { active = pathOf(m); rig.u = 1; rig.shift = m.shift; Object.assign(dof, { focus: m.focus, range: m.range, bokeh: dofOn ? m.bokeh : 0 }); world.post.dof = dofOn ? dof : null; applyCam(); return; }
      // step 0 glides in from its own start; every later move starts from wherever the camera is now
      active = step === 0 ? pathOf(m) : pathOf(m, { pos: cam.position.clone(), tgt: vt.clone() });
      rig.u = 0;
      tweens.push(gsap.to(rig, { u: 1, duration: m.dur, ease: m.ease, onUpdate: applyCam }));
      tweens.push(gsap.to(rig, { shift: m.shift, duration: Math.min(m.dur, 2.8), ease: 'power3.inOut', onUpdate: applyCam }));
      if (dofOn) world.post.dof = dof;
      tweens.push(gsap.to(dof, { focus: m.focus, range: m.range, bokeh: dofOn ? m.bokeh : 0, duration: Math.min(m.dur, 2.4), ease: 'power2.inOut', onComplete: () => { if (!dofOn) world.post.dof = null; } }));
    }
    function escapeTo(step, animate) {
      const leak = LEAK_AT[step];
      const broken = step >= 1;
      // press: the pressure on the glass builds through step 0 and is released by the break
      const end = { crack: broken ? 1 : 0, hole: broken ? 1 : 0, leak, cubeGlow: broken ? 0.45 + 0.55 * (1 - leak) * 0.6 : 1, trace: broken ? 1 : 0, crackHeat: broken ? 0.12 : 1, flash: 0, press: broken ? 0 : 1 };
      if (!animate) { Object.assign(S, end); applyEscape(); setDay(); return; }
      const tl = gsap.timeline({ onUpdate: () => { applyEscape(); setDay(); } });
      if (step === 0) {
        tl.fromTo(S, { press: 0.35 }, { press: 1, duration: 9, ease: 'power1.in' }, 0);
      } else if (step === 1 && S.crack < 1) {
        tl.to(S, { press: 0, duration: 0.6, ease: 'power2.out' }, 0.4);
        // the impact, then the crack runs across the wall; the inner shards fall with weight
        tl.to(S, { flash: 1, duration: 0.05, ease: 'none' }, 0.33);
        tl.to(S, { flash: 0, duration: 0.55, ease: 'power2.out' }, 0.38);
        tl.to(S, { crack: 1, duration: 0.85, ease: 'expo.out' }, 0.35);
        tl.to(S, { hole: 1, duration: 2.2, ease: 'none' }, 1.15);
        tl.to(S, { crackHeat: 0.12, duration: 2.4, ease: 'power2.out' }, 1.2);
        tl.to(S, { trace: 1, duration: 2.6, ease: 'power2.inOut' }, 1.6);
        tl.to(S, { leak, duration: 5.2, ease: 'power1.in' }, 1.5);
        tl.to(S, { cubeGlow: end.cubeGlow, duration: 4, ease: 'power1.inOut' }, 1.8);
      } else {
        tl.to(S, { ...end, duration: step === 2 ? 7.2 : 1.2, ease: step === 2 ? 'power1.inOut' : 'power2.out' }, 0);
      }
      tweens.push(tl);
    }

    let cur = -1;
    function stateTo(step, animate) {
      const A = animate && !renderMode;
      kill();
      moveTo(step, A);
      escapeTo(step, A && step > cur);
      const tl = gsap.timeline();
      const D = (d) => (A ? d : 0);
      const calm = step === CARD_STEP;
      tl.to(world.post.bloom, { intensity: step >= 3 ? 0.6 : 1.0, duration: D(1.1) }, 0);
      tl.add(scrimL.set({ visible: !calm }, { animate: A }), 0);
      tl.add(scrimC.set({ visible: calm }, { animate: A }), D(calm ? 0.2 : 0));
      if (card) tl.add(card.set({ visible: calm }, { animate: A }), D(calm ? 0.9 : 0));
      if (srcCard) tl.add(srcCard.set({ visible: calm }, { animate: A }), D(calm ? 1.4 : 0));
      tl.add(scrimB.set({ visible: step >= 1 }, { animate: A }), 0);
      tl.add(title.set({ visible: step === 0 }, { animate: A }), step === 0 ? D(0.6) : 0);
      tl.add(s1.set({ visible: step === 1 }, { animate: A }), D(step === 1 ? 2.6 : 0));
      tl.add(num13.set({ visible: step === 2 }, { animate: A }), D(step === 2 ? 0.9 : 0));
      tl.add(num700.set({ visible: step === 2 }, { animate: A }), D(step === 2 ? 1.25 : 0));
      tl.add(motive.set({ visible: step === 3 }, { animate: A }), D(step === 3 ? 1.0 : 0));
      tl.add(source.set({ visible: step >= 1 && step <= 2 }, { animate: A }), D(step >= 1 ? 3.0 : 0));
      // with the page on screen its own meta carries the chip and the source: one chip per frame
      tl.add(motiveSrc.set({ visible: step === 3 && !pageM }, { animate: A }), D(step === 3 ? 1.5 : 0));
      if (pageM) {
        tl.add(pageM.c.set({ visible: step === 3 }, { animate: A }), D(step === 3 ? 1.8 : 0));
        pageM.focus({ on: step === 3 ? ['cheat'] : [] }, A, tl, 2.6);
      }
      tl.to(clockEl, { autoAlpha: step >= 1 && step <= 2 ? 1 : 0, duration: D(step >= 1 ? 0.6 : 0.3) }, A && step === 1 ? 2.2 : 0);
      if (!A) tl.call(setDay, null, 0.001);
      cur = step;
      return tl;
    }

    return {
      steps: ctx.beat.steps.length,
      world,
      enter() { cur = -1; return stateTo(0, !renderMode); },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit() { return gsap.timeline(); },
      update(time) {
        clock = renderMode ? 0 : time;
        hall.update(clock);
        if (rig.breathe) applyCam();
      },
      // lookdev hook (dev tooling): jump to a step's end state, optionally part-way through the escape
      _look(st) {
        kill();
        const step = st.step ?? cur;
        moveTo(step, false);
        escapeTo(step, false);
        if (st.crack != null) S.crack = st.crack;
        if (st.hole != null) S.hole = st.hole;
        if (st.leak != null) S.leak = st.leak;
        if (st.u != null) { rig.u = st.u; applyCam(); }
        applyEscape();
        return { step, pos: cam.position.toArray().map((x) => +x.toFixed(2)) };
      },
      dispose() {
        kill();
        gsap.killTweensOf([world.post.bloom, clockEl]);
        parts.forEach((p) => p.destroy());
        scrimL.destroy();
        scrimB.destroy();
        scrimC.destroy();
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
