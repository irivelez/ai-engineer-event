// news-tunnel (VOID, gl): the Act IV opener. Art direction:
//  References: GTC Berlin 58:01 (cards in depth, the camera moving through them) · a documentary rack focus between subjects.
//  Palette: void; the real pages as they are (white headlines on their own mastheads), outlet · date in light above each.
//  Light: none added; the pages are the light. Optical depth of field, per card, keeps one headline sharp at a time.
//  Camera: one smooth dolly down a gallery of six headlines, alternating sides; focus pulls to each as it comes up,
//          ends square on the last (Latin America's own), which racks soft as the act title lands.
//  The frame that sells it: a headline snapping into focus while the next one waits, soft, further down the dark.
// Fewer, larger, legible: six real captures from captures.json, cropped to their headlines (CARDS below); none invented,
// none redrawn. Excluded by the director: thesun-nvidia-spy-shockwaves (personal-life gossip). No particles.
import { gsap } from 'gsap';
import * as THREE from 'three';
import { CROPS, place, captureInfo } from './_worlds/gl2-kit.js';

// [capture id, crop [x0, y0, x1, y1] in the capture's own pixels (null: CROPS or the top of the page)]
const CARDS = [
  ['ap-everything-broken', [30, 168, 1590, 540]], //            AP News, 15 Nov: "Could everything be broken? …"
  ['venturebeat-gpt-62-unusable', [140, 280, 1560, 840]], //    VentureBeat, 17 Nov: "'Essentially unusable' …"
  ['bbc-australia-rogue-ai', [40, 0, 1530, 530]], //             BBC News, 10 Nov: "Australia considers criminal penalties …"
  ['cnbc-crowdstrike-rogue-agents', [40, 520, 1420, 900]], //    CNBC, 3 Nov: "CrowdStrike launches AI kill switch …"
  ['verge-data-centers-electricity', null], //                  The Verge, 16 Nov (crop in gl2-kit CROPS)
  ['bloomberglinea-latam-ai-impact', [40, 392, 1540, 790]], //   Bloomberg Línea, 10 Nov: Latin America's own
];
const TEX_W = 1280;
const GAP = 9; //        metres between cards along the dolly
const CARD_W = 4.3;
const Z_START = 8.2;

export default {
  id: 'news-tunnel',
  gl: true,
  create(ctx) {
    const { root, copy, gl, components: C, renderMode, tokens } = ctx;
    const { makeWorld, helpers: H } = gl;
    const world = makeWorld({
      fov: 34, near: 0.1, far: 200,
      post: { bloom: false, vignette: { offset: 0.32, darkness: 0.62 } }, // white pages must not glow
    });

    // ---------- cards: an outlet · date strip over the headline crop, drawn once into a ≈1280 px canvas ----------
    // Focus is optical, per card: each card blurs by its own circle of confusion (distance to the focus plane), with
    // mip-biased taps and edges that soften as it defocuses. Same rack focus as a DOF pass, none of its cost at Retina
    // (world.post.dof measured p95 33 ms at 1470×956@2) and no haloes round the type.
    const have = new Set(ctx.assets.captureIds());
    const list = CARDS.filter(([id]) => have.has(id) && ctx.assets.capture(id));
    const cardGeo = new THREE.PlaneGeometry(1, 1);
    const STRIP = 68; // label strip, canvas px
    const fontReady = document.fonts && document.fonts.load ? document.fonts.load('600 30px "Geist Mono"').catch(() => null) : Promise.resolve();
    const cards = list.map(([id, crop0], i) => {
      const meta = ctx.assets.captureMeta(id) || {};
      const crop = crop0 || (CROPS[id] ? CROPS[id].crop : null);
      const cropAspect = crop ? (crop[3] - crop[1]) / (crop[2] - crop[0]) : 0.4;
      const cv = document.createElement('canvas');
      cv.width = TEX_W;
      cv.height = Math.round(TEX_W * cropAspect) + STRIP;
      const aspect = cv.height / cv.width;
      const g2 = cv.getContext('2d');
      g2.fillStyle = '#0D1218'; // until the image decodes: a dark card, never a white flash
      g2.fillRect(0, 0, cv.width, cv.height);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      world.track(tex);
      const ci = captureInfo(meta);
      const labelText = [ci.who, ci.date].filter(Boolean).join(' · ').toUpperCase(); // outlet · date, from the capture manifest
      const img = new Image();
      img.src = ctx.assets.capture(id);
      // decode off the main thread: the cards are built while the previous moment is on screen, and must not stall it
      const decoded = img.decode().then(() => true, () => false);
      H.track(Promise.all([decoded, fontReady]).then(([ok]) => {
        if (!ok) return;
        const [x0, y0, x1, y1] = crop || [0, 0, img.naturalWidth, Math.round(img.naturalWidth * cropAspect)];
        g2.imageSmoothingQuality = 'high';
        g2.drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, STRIP, cv.width, cv.height - STRIP);
        g2.fillStyle = '#EEF2F6';
        g2.font = '600 30px "Geist Mono", ui-monospace, Menlo, monospace';
        if ('letterSpacing' in g2) g2.letterSpacing = '2px';
        g2.textBaseline = 'middle';
        g2.fillText(labelText, 30, STRIP / 2 + 1);
        tex.needsUpdate = true;
      }));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: tex }, uAspect: { value: aspect }, uEdge: { value: H.color('light', 0.9) }, uBright: { value: 1.5 }, uBlur: { value: 0 }, uFade: { value: 1 } },
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap; uniform float uAspect, uBright, uBlur, uFade; uniform vec3 uEdge; varying vec2 vUv;
          float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
          void main() {
            vec2 p = (vUv - 0.5) * vec2(1.0, uAspect);
            float d = rbox(p, vec2(0.5, 0.5 * uAspect), 0.018);
            float px = fwidth(d);
            float soft = px * (1.0 + uBlur * 0.9);                       // defocused edges spread like a lens would
            float inside = 1.0 - smoothstep(-soft, soft, d);
            if (inside < 0.004) discard;
            float bias = log2(max(1.0, uBlur * 0.8));
            vec2 o = vec2(abs(dFdx(vUv.x)), abs(dFdy(vUv.y))) * uBlur * 0.55;
            vec3 col = texture(uMap, vUv, bias).rgb * 0.36;
            col += texture(uMap, vUv + vec2(o.x, o.y), bias).rgb * 0.16;
            col += texture(uMap, vUv + vec2(-o.x, o.y), bias).rgb * 0.16;
            col += texture(uMap, vUv + vec2(o.x, -o.y), bias).rgb * 0.16;
            col += texture(uMap, vUv + vec2(-o.x, -o.y), bias).rgb * 0.16;
            col *= uBright;
            float frame = (1.0 - smoothstep(px, px * 2.4, abs(d + px * 1.4))) * (1.0 - clamp(uBlur / 5.0, 0.0, 1.0));
            col = mix(col, uEdge, frame * 0.45);
            gl_FragColor = vec4(col, inside * uFade);
          }`,
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      const last = i === list.length - 1;
      const side = i % 2 === 0 ? 1 : -1;
      const x = last ? 0 : side * 3.0; //  clear of the dolly: the inner edge stays 0.85 m off the camera's path
      const y = last ? 0.62 : (i % 3 === 1 ? 0.18 : -0.12);
      const z = -i * GAP;
      mesh.position.set(x, y, z);
      mesh.rotation.y = last ? 0 : -side * 0.34; // turned toward the approaching camera
      mesh.scale.set(CARD_W, CARD_W * aspect, 1);
      mesh.renderOrder = 10 - i; // far cards first (they never overlap the near ones in depth order)
      world.add(mesh);
      return { id, mesh, mat, z, x, y, aspect, pos: new THREE.Vector3(x, y, z) };
    });

    // ---------- DOM: act title on a scrim ----------
    const { spanW, space } = tokens;
    const numbered = (ctx.acts || []).filter((a) => a.n);
    const actIndex = Math.max(0, numbered.findIndex((a) => a.id === ctx.beat.act));
    const scrim = C.Scrim.create({ ground: 'void', side: 'bottom', extent: 0.62, strength: 0.94 });
    root.append(scrim.el);
    const act = C.ActTitle.create({ numeral: copy.act, title: copy.actTitle, index: actIndex, total: numbered.length || 5, ground: 'void', width: spanW(10) });
    place(act.el, space.margin, 620);
    root.append(act.el);

    // ---------- the dolly and the focus ----------
    const N = cards.length;
    const zEnd = N ? cards[N - 1].z + 6.4 : 0; //        square on the last card
    const CAM = { p: 0, y: 0.15, back: 0, sway: renderMode ? 0 : 1, rack: 0 };
    const cam = world.camera;
    const focus = new THREE.Vector3(0, 0, -1e3);
    const APERTURE = 140; // circle of confusion (stage px) = APERTURE × |1/focus − 1/distance|, metres
    let tNow = 0;
    const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    function applyCam() {
      const z = THREE.MathUtils.lerp(Z_START, zEnd, CAM.p) + CAM.back;
      const sx = CAM.sway ? Math.sin(tNow * 0.21) * 0.06 * CAM.sway : 0;
      cam.position.set(sx, CAM.y, z);
      cam.lookAt(sx * 0.5, CAM.y + 0.05, z - 10);
      if (!N) return;
      // focus: the card ahead of the camera, handed to the next one as the camera passes (a rack, not a jump)
      // card j owns the focus until it is 5.6 m away; between 5.6 and 3.6 m the focus racks to the next one
      let j = 0;
      while (j < N - 1 && z - cards[j].z < 3.6) j++;
      const a = cards[j];
      const b = cards[Math.min(N - 1, j + 1)];
      const k = j < N - 1 ? smooth(5.6, 3.6, z - a.z) : 0;
      focus.lerpVectors(a.pos, b.pos, k);
      // step 1: the rack goes past the last card into the dark, so the title is the only sharp thing
      if (CAM.rack > 0) focus.z -= CAM.rack * 40;
      const f = Math.max(0.5, cam.position.distanceTo(focus));
      cards.forEach((c, n) => {
        const dd = Math.max(0.5, cam.position.distanceTo(c.pos));
        c.mat.uniforms.uBlur.value = Math.min(26, APERTURE * Math.abs(1 / f - 1 / dd));
        // once a headline has handed the focus on, it dissolves as the camera passes it (no blurred slab across the frame)
        c.mat.uniforms.uFade.value = n === N - 1 ? 1 : smooth(3.2, 5.2, z - c.z);
      });
    }
    applyCam();

    function stateTo(step, animate, entering = false) {
      const tl = gsap.timeline();
      const A = animate && !renderMode;
      const D = (d) => (A ? d : 0);
      gsap.killTweensOf(CAM);
      if (!A) {
        Object.assign(CAM, { p: 1, back: step === 1 ? 0.9 : 0, rack: step === 1 ? 1 : 0, y: step === 1 ? 0.25 : 0.15 });
        applyCam();
      } else if (step === 0) {
        if (entering) Object.assign(CAM, { p: 0, back: 0, rack: 0, y: 0.15 });
        // one smooth dolly: about 2.6 s per headline, easing in and out at the ends only
        tl.to(CAM, { p: 1, duration: Math.max(6, N * 2.6), ease: 'sine.inOut', onUpdate: applyCam }, 0);
      } else {
        tl.to(CAM, { p: 1, duration: 0.6, ease: 'power2.out', onUpdate: applyCam }, 0);
        tl.to(CAM, { rack: 1, duration: 1.4, ease: 'sine.inOut', onUpdate: applyCam }, 0.2);
        tl.to(CAM, { back: 0.9, y: 0.25, duration: 2.4, ease: 'power3.inOut', onUpdate: applyCam }, 0);
      }
      tl.add(scrim.set({ visible: step === 1 }, { animate: A }), D(step === 1 ? 0.5 : 0));
      tl.add(act.set({ visible: step === 1 }, { animate: A }), D(step === 1 ? 1.1 : 0));
      if (!A) tl.call(applyCam, null, 0.0011);
      return tl;
    }

    return {
      steps: ctx.beat.steps.length,
      world,
      enter({ direction } = {}) { return stateTo(0, !renderMode && direction !== -1, true); },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit() {
        const tl = gsap.timeline();
        tl.to(CAM, { back: '+=1.2', duration: 0.8, ease: 'power2.in', onUpdate: applyCam }, 0);
        return tl;
      },
      update(time) {
        tNow = time;
        if (CAM.sway) applyCam();
      },
      dispose() {
        gsap.killTweensOf(CAM);
        act.destroy();
        scrim.destroy();
        cards.forEach((c) => c.mat.dispose());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
