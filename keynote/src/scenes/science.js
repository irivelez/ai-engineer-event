// science (gl-1): a deep rain of proof glyphs (∀ ∃ → ⊢ λ … and Lean keywords) falls through the void; with each
// checkable result a third of the field resolves into check marks (verified green) and slows to rest. Each item
// lands as a calm card on a scrim. Glyphs come from a 1024² canvas atlas (system math font + Geist Mono), drawn
// once; the rain is one instanced, billboarded draw call animated in the vertex shader.
import { gsap } from 'gsap';
import { factSource, place, makeRig } from './_worlds/gl1-kit.js';

const SYMBOLS = ['∀', '∃', '→', '⊢', 'λ', '∧', '∨', '¬', '≤', '≠', '∈', '⊆', '≡', '∘', 'ℕ', '⟨', '⟩', 'Π', 'Σ', '⇒', '↔', '∞', '≥', '∑', 'ℤ', '⊥', '⊤', '∅', '∩', '∪', 'α', 'β'];
const KEYWORDS = ['theorem', 'lemma', 'by', 'simp', 'exact', 'intro', 'rfl', 'have', 'show', 'calc', 'omega', 'ring', 'decide', 'apply', 'cases', 'induction', 'fun', 'def', ':=', 'Nat', 'sorry_free', 'linarith', 'norm_num', 'constructor', 'rw', 'ext', 'use', 'obtain', 'refine', 'aesop', 'field_simp'];
const GRID = 8; // 8 × 8 cells of 128 px; the last cell is the check mark
const CHECK = GRID * GRID - 1;
const N = 2600;
const CAM = [
  { az: -10, pol: 86, r: 24, tx: 0, ty: 0, tz: -6, shiftX: 300, orbitAmp: 4 },
  { az: -6, pol: 87, r: 22, tx: 0, ty: 0, tz: -6, shiftX: 360, orbitAmp: 3 },
  { az: -2, pol: 87, r: 21, tx: 0, ty: 0, tz: -6, shiftX: 360, orbitAmp: 3 },
  { az: 2, pol: 87, r: 20, tx: 0, ty: 0, tz: -6, shiftX: 360, orbitAmp: 2 },
];

function drawAtlas(canvas) {
  const c = canvas.getContext('2d');
  const S = canvas.width / GRID;
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = '#ffffff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const cells = [...SYMBOLS, ...KEYWORDS].slice(0, CHECK);
  cells.forEach((txt, i) => {
    const x = (i % GRID) * S + S / 2;
    const y = Math.floor(i / GRID) * S + S / 2;
    if (i < SYMBOLS.length) {
      c.font = `500 ${Math.round(S * 0.62)}px "STIX Two Math", "Apple Symbols", "Cambria Math", "Geist", serif`;
    } else {
      let size = Math.round(S * 0.34);
      c.font = `500 ${size}px "Geist Mono", ui-monospace, Menlo, monospace`;
      const w = c.measureText(txt).width;
      if (w > S * 0.9) { size = Math.floor((size * S * 0.9) / w); c.font = `500 ${size}px "Geist Mono", ui-monospace, Menlo, monospace`; }
    }
    c.fillText(txt, x, y);
  });
  // check mark, drawn as a path (no font has to carry it)
  const cx = (CHECK % GRID) * S;
  const cy = Math.floor(CHECK / GRID) * S;
  c.lineWidth = S * 0.11;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = '#ffffff';
  c.beginPath();
  c.moveTo(cx + S * 0.24, cy + S * 0.53);
  c.lineTo(cx + S * 0.43, cy + S * 0.71);
  c.lineTo(cx + S * 0.77, cy + S * 0.31);
  c.stroke();
}

export default {
  id: 'science',
  gl: true,
  create(ctx) {
    const { root, copy, beat, gl, components: C, renderMode } = ctx;
    const { THREE, makeWorld, helpers: H } = gl;
    const world = makeWorld({ fov: 34, post: { bloom: { intensity: 0.8, threshold: 0.62, smoothing: 0.3, radius: 0.7 }, vignette: { offset: 0.28, darkness: 0.64 } } });
    world.scene.background = H.gradientTexture([['#0A101C', 0], ['#05070A', 1]], { radial: true });
    const rig = makeRig(THREE, world.camera, { ...CAM[0], orbitAmp: renderMode ? 0 : CAM[0].orbitAmp, breathe: renderMode ? 0 : 0.3 });

    // ---------- atlas ----------
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    drawAtlas(canvas);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 4;
    world.track(tex);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { drawAtlas(canvas); tex.needsUpdate = true; });

    // ---------- the rain ----------
    const rand = H.seeded('science-rain');
    const geo = new THREE.PlaneGeometry(1, 1);
    const aGlyph = new Float32Array(N);
    const aPos = new Float32Array(N * 3);
    const aMisc = new Float32Array(N * 4);
    const nGlyphs = Math.min(CHECK, SYMBOLS.length + KEYWORDS.length);
    for (let i = 0; i < N; i++) {
      const sym = rand() < 0.62;
      aGlyph[i] = sym ? Math.floor(rand() * SYMBOLS.length) : SYMBOLS.length + Math.floor(rand() * (nGlyphs - SYMBOLS.length));
      aPos[i * 3] = (rand() - 0.5) * 54;
      aPos[i * 3 + 1] = rand() * 40;
      aPos[i * 3 + 2] = -36 + rand() * 40;
      aMisc[i * 4] = 0.6 + rand() * 1.4; //  fall speed
      aMisc[i * 4 + 1] = rand(); //          resolve order
      aMisc[i * 4 + 2] = (sym ? 0.8 : 1.05) * (0.7 + rand() * 0.6); // size
      aMisc[i * 4 + 3] = rand(); //          tint
    }
    geo.setAttribute('aGlyph', new THREE.InstancedBufferAttribute(aGlyph, 1));
    geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(aPos, 3));
    geo.setAttribute('aMisc', new THREE.InstancedBufferAttribute(aMisc, 4));
    const U = {
      uTime: { value: 0 }, uAtlas: { value: tex }, uResolve: { value: 0 }, uFade: { value: 1 },
      uA: { value: H.color('lightSoft', 1.25) }, uB: { value: H.color('accent', 1.35) }, uOk: { value: H.color('verified', 1.6) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime, uResolve;
        attribute float aGlyph; attribute vec3 aBase; attribute vec4 aMisc;
        varying vec2 vUv; varying float vCheck; varying float vTint; varying float vFog;
        void main(){
          float ok = smoothstep(aMisc.y - 0.02, aMisc.y + 0.02, uResolve);
          // falling, and slowing to rest once resolved
          float fall = uTime * aMisc.x * (1.0 - 0.85 * ok);
          float y = mod(aBase.y - fall, 40.0) - 20.0;
          vec3 c = vec3(aBase.x, y, aBase.z);
          vec4 mv = modelViewMatrix * vec4(c, 1.0);
          float size = aMisc.z * mix(1.0, 1.15, ok);
          mv.xy += position.xy * size;
          gl_Position = projectionMatrix * mv;
          float g = ok > 0.5 ? ${CHECK.toFixed(1)} : aGlyph;
          vec2 cell = vec2(mod(g, ${GRID.toFixed(1)}), floor(g / ${GRID.toFixed(1)}));
          vUv = (cell + vec2(uv.x, 1.0 - uv.y)) / ${GRID.toFixed(1)};
          vUv.y = 1.0 - vUv.y;
          vCheck = ok;
          vTint = aMisc.w;
          float d = -mv.z;
          vFog = exp(-max(0.0, d - 16.0) * 0.04) * smoothstep(1.0, 4.0, d);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uAtlas; uniform vec3 uA, uB, uOk; uniform float uFade;
        varying vec2 vUv; varying float vCheck; varying float vTint; varying float vFog;
        void main(){
          float a = texture2D(uAtlas, vUv).a;
          if (a < 0.02) discard;
          vec3 base = mix(uA, uB, step(0.72, vTint)) * (0.35 + 0.4 * vTint);
          vec3 col = mix(base, uOk, vCheck);
          gl_FragColor = vec4(col * a * vFog * uFade, 1.0);
        }`,
    });
    const rain = new THREE.InstancedMesh(geo, mat, N);
    rain.frustumCulled = false;
    world.add(rain);

    // ---------- DOM: title, gloss, one calm card per item ----------
    const g = 'void';
    const scrim = C.Scrim.create({ ground: g, side: 'left', extent: 0.8, strength: 0.95 });
    const floor = C.Scrim.create({ ground: g, side: 'bottom', extent: 0.2, strength: 0.9 });
    const top = C.Scrim.create({ ground: g, side: 'top', extent: 0.3, strength: 0.92 });
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: g, width: 1100 });
    const gloss = C.Headline.create({ text: copy.gloss, role: 'body', ground: g, width: 1000, tone: 'muted' });
    root.append(scrim.el, floor.el, top.el, title.el, gloss.el);
    place(title.el, 128, 112);
    place(gloss.el, 128, 232);
    const items = (copy.items || []).map((it, i) => {
      const card = document.createElement('div');
      card.className = 'ground-void';
      Object.assign(card.style, {
        position: 'absolute', left: '128px', top: '300px', width: '1040px', boxSizing: 'border-box', padding: '48px 56px 44px',
        background: 'var(--g-card)', borderRadius: '24px', boxShadow: 'inset 0 0 0 2px var(--g-rule)',
      });
      card.innerHTML = '<div class="t-lead balance" style="color:var(--g-fg)"></div>'
        + '<div style="display:flex;gap:40px;align-items:baseline;margin-top:32px;flex-wrap:wrap"><span class="t-body" style="color:var(--g-fg)"></span><span class="t-body tnum" style="color:var(--g-accent);font-weight:600"></span></div>'
        + '<div class="t-body" style="color:var(--g-muted);font-size:40px;line-height:48px;margin-top:20px"></div>'
        + '<div class="sci-src" style="margin-top:36px"></div>';
      card.children[0].textContent = it.what;
      card.children[1].children[0].textContent = it.who;
      card.children[1].children[1].textContent = it.time;
      card.children[2].textContent = it.note;
      const s = factSource(ctx, (beat.facts || [])[i], it.tag);
      const src = C.SourceLine.create({ kind: s.kind, text: s.text, ground: g });
      card.querySelector('.sci-src').append(src.el);
      root.append(card);
      gsap.set(card, { autoAlpha: 0 });
      return { card, src };
    });

    const vis = {};
    function show(c, key, want, tl, at, animate) {
      if (!!vis[key] === want) return;
      vis[key] = want;
      if (animate) { if (want) c.in(tl, at); else c.out(tl, at); } else tl.add(c.set({ visible: want }, { animate: false }), 0);
    }
    const cardOn = items.map(() => false);
    function stateTo(step, animate) {
      const A = animate && !renderMode;
      const tl = gsap.timeline();
      const cam = { ...CAM[step], orbitAmp: renderMode ? 0 : CAM[step].orbitAmp };
      tl.add(rig.to(cam, { duration: A ? 4.2 : 0, ease: 'power3.inOut' }), 0);
      const want = items.length ? Math.min(1, step / items.length) : 0;
      if (A) tl.to(U.uResolve, { value: want, duration: 2.6, ease: 'power2.inOut' }, 0.2);
      else { U.uResolve.value = want; tl.set(U.uResolve, { value: want }, 0); }
      show(scrim, 'scrim', true, tl, 0, A);
      show(floor, 'floor', true, tl, 0, A);
      show(top, 'top', true, tl, 0, A);
      show(title, 'title', true, tl, A ? 0.8 : 0, A);
      show(gloss, 'gloss', step === 0, tl, A ? 1.4 : 0, A);
      items.forEach((it, i) => {
        const on = step === i + 1;
        if (on === cardOn[i]) return;
        cardOn[i] = on;
        if (A) {
          if (on) {
            tl.fromTo(it.card, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out' }, 0.9);
            it.src.in(tl, 1.5);
          } else tl.to(it.card, { autoAlpha: 0, y: -12, duration: 0.5, ease: 'power2.in' }, 0);
        } else {
          tl.set(it.card, { autoAlpha: on ? 1 : 0, y: 0 }, 0);
          tl.add(it.src.set({ visible: on }, { animate: false }), 0);
        }
      });
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
        U.uTime.value = t;
        rig.update(t);
      },
      dispose() {
        gsap.killTweensOf([rig.state, U.uResolve, ...items.map((i) => i.card)]);
        [scrim, floor, top, title, gloss].forEach((c) => c.destroy());
        items.forEach((i) => i.src.destroy());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
