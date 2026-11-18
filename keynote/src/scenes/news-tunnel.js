// news-tunnel (gl-2): the real captures from captures.json as cards lining a tunnel the camera flies
// through (GTC 58:01's fanned cards, in depth). The camera slows in front of a final fanned arc and the act
// title lands on a scrim. Only captures with a real image are used (none is invented); headline crops come
// from CROPS. Excluded by the director: thesun-nvidia-spy-shockwaves (personal-life gossip).
import { gsap } from 'gsap';
import * as THREE from 'three';
import { CROPS, place } from './_worlds/gl2-kit.js';

const EXCLUDE = new Set(['thesun-nvidia-spy-shockwaves']);
const TEX_W = 512;
const TUNNEL_R = 4.6;
const Z0 = 6;
const Z_END = -112;
const ARC_Z = -122;

export default {
  id: 'news-tunnel',
  gl: true,
  create(ctx) {
    const { root, copy, gl, components: C, renderMode, tokens } = ctx;
    const { makeWorld, helpers: H } = gl;
    const rand = H.seeded('news-tunnel');

    const world = makeWorld({
      fov: 40,
      fog: { density: 0.02 },
      post: { bloom: { intensity: 0.85, threshold: 0.7, smoothing: 0.3, radius: 0.7 }, vignette: { offset: 0.3, darkness: 0.7 } },
    });

    // ---------- card textures (one small canvas per capture) ----------
    const ids = ctx.assets.captureIds().filter((id) => !EXCLUDE.has(id));
    const cards = [];
    for (const id of ids) {
      const uri = ctx.assets.capture(id);
      const meta = ctx.assets.captureMeta(id) || {};
      const crop = CROPS[id] ? CROPS[id].crop : null;
      // the card's shape is fixed up front (render mode may draw before the image decodes)
      const aspect = crop ? (crop[3] - crop[1]) / (crop[2] - crop[0]) : meta.kind === 'x' ? 0.9 : 0.62;
      const cv = document.createElement('canvas');
      cv.width = TEX_W;
      cv.height = Math.round(TEX_W * aspect);
      const g2 = cv.getContext('2d');
      g2.fillStyle = '#0D1218';
      g2.fillRect(0, 0, cv.width, cv.height);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      world.track(tex);
      cards.push({ id, tex, aspect, meshes: [] });
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const [x0, y0, x1, y1] = crop || [0, 0, w, Math.min(h, Math.round(w * aspect))];
        const dh = Math.round(((y1 - y0) / (x1 - x0)) * cv.width);
        g2.imageSmoothingQuality = 'high';
        g2.drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, Math.max(0, (cv.height - dh) / 2), cv.width, Math.min(dh, cv.height));
        tex.needsUpdate = true;
      };
      img.src = uri;
    }

    // ---------- card meshes ----------
    const cardGeo = new THREE.PlaneGeometry(1, 1);
    const cardMats = new Map();
    function cardMaterial(card) {
      if (cardMats.has(card)) return cardMats.get(card);
      const m = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: card.tex }, uAspect: { value: card.aspect }, uBright: { value: 0.74 }, uEdge: { value: H.color('light', 0.95) },
          uFog: { value: new THREE.Color(tokens.colors.void) }, uFogD: { value: 0.02 }, uDim: { value: 1 },
        },
        transparent: true,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          varying vec2 vUv; varying float vDepth;
          void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap; uniform float uAspect, uBright, uFogD, uDim; uniform vec3 uEdge, uFog;
          varying vec2 vUv; varying float vDepth;
          float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
          void main() {
            vec2 p = (vUv - 0.5) * vec2(1.0, uAspect);
            float d = rbox(p, vec2(0.5, 0.5 * uAspect), 0.025);
            float px = fwidth(d);
            float inside = 1.0 - smoothstep(-px, px, d);
            if (inside < 0.01) discard;
            float frame = 1.0 - smoothstep(px * 1.2, px * 2.6, abs(d + px * 1.6));
            vec3 col = texture2D(uMap, vUv).rgb * uBright;
            col = mix(col, uEdge, frame * 0.85);
            float f = 1.0 - exp(-uFogD * uFogD * vDepth * vDepth);
            col = mix(col, uFog, f) * uDim;
            gl_FragColor = vec4(col, inside);
          }`,
      });
      cardMats.set(card, m);
      return m;
    }
    const tunnel = new THREE.Group();
    world.add(tunnel);
    const placed = [];
    const nTunnel = cards.length ? Math.min(66, cards.length * 2) : 0;
    for (let i = 0; i < nTunnel; i++) {
      const card = cards[(i * 7) % cards.length];
      const mesh = new THREE.Mesh(cardGeo, cardMaterial(card));
      const z = Z0 - 8 - (i / Math.max(1, nTunnel - 1)) * (Z0 - Z_END - 12) + (rand() - 0.5) * 2.2;
      // around the tunnel wall, avoiding the floor band so the path reads
      let ang = (i * 2.399 + rand() * 0.6) % (Math.PI * 2);
      if (Math.sin(ang) < -0.75) ang += Math.PI * 0.5;
      const r = TUNNEL_R + (rand() - 0.5) * 1.0;
      mesh.position.set(Math.cos(ang) * r, Math.sin(ang) * r * 0.72 + 0.4, z);
      mesh.lookAt(0, 0.4, z + 3.5);
      mesh.rotateZ((rand() - 0.5) * 0.12);
      const w = 2.3 + rand() * 0.9;
      mesh.scale.set(w, w * card.aspect, 1);
      card.meshes.push(mesh);
      tunnel.add(mesh);
      placed.push(mesh);
    }
    // final fanned arc (GTC 58:01): a convex fan, the centre card nearest and largest
    const NARC = Math.min(11, cards.length);
    const arcCards = [];
    for (let k = 0; k < NARC; k++) {
      const card = cards[(k * 5 + 3) % cards.length];
      const mesh = new THREE.Mesh(cardGeo, cardMaterial(card));
      const t = NARC > 1 ? k / (NARC - 1) - 0.5 : 0;
      const a = t * 1.9;
      const rr = 10;
      mesh.position.set(Math.sin(a) * rr, 2.75, ARC_Z - (1 - Math.cos(a)) * rr);
      mesh.rotation.set(0, -a * 0.85, 0);
      const w = 3.5 - Math.abs(t) * 1.5;
      mesh.scale.set(w, w * card.aspect, 1);
      card.meshes.push(mesh);
      tunnel.add(mesh);
      arcCards.push(mesh);
    }
    const dust = world.add(H.particles({ count: 2600, spread: [16, 12, 140], center: [0, 0.4, -55], size: 0.035, colors: ['light', 'accent'], intensity: 0.6, drift: 0.25, seed: 'news-dust' }));

    // ---------- DOM: act title on a scrim ----------
    const { spanW, space } = tokens;
    const numbered = (ctx.acts || []).filter((a) => a.n);
    const actIndex = Math.max(0, numbered.findIndex((a) => a.id === ctx.beat.act));
    const scrim = C.Scrim.create({ ground: 'void', side: 'bottom', extent: 0.62, strength: 0.94 });
    root.append(scrim.el);
    const act = C.ActTitle.create({ numeral: copy.act, title: copy.actTitle, index: actIndex, total: numbered.length || 5, ground: 'void', width: spanW(10) });
    place(act.el, space.margin, 620);
    root.append(act.el);

    // ---------- camera: a dolly down the tunnel axis ----------
    const cam = world.camera;
    const CAM = { z: Z0, y: 0.5, lookAhead: 12, sway: renderMode ? 0 : 1 };
    let tNow = 0;
    function applyCam() {
      const sx = CAM.sway ? Math.sin(tNow * 0.23) * 0.35 * CAM.sway : 0;
      const sy = CAM.sway ? Math.sin(tNow * 0.17 + 1.1) * 0.18 * CAM.sway : 0;
      cam.position.set(sx, CAM.y + sy, CAM.z);
      cam.lookAt(sx * 0.4, CAM.y + 0.2, CAM.z - CAM.lookAhead);
    }
    applyCam();
    const SHOT_Z = [-40, ARC_Z + 12.5];

    function stateTo(step, animate, entering = false) {
      const tl = gsap.timeline();
      const D = (d) => (animate ? d : 0);
      if (step === 0) {
        if (animate && entering) CAM.z = Z0;
        tl.to(CAM, { z: SHOT_Z[0], duration: animate ? 7.5 : 0.001, ease: entering ? 'power1.inOut' : 'power3.inOut', onUpdate: applyCam }, 0);
      } else {
        tl.to(CAM, { z: SHOT_Z[1], duration: animate ? 6.5 : 0.001, ease: 'power3.out', onUpdate: applyCam }, 0);
      }
      tl.to(CAM, { y: step === 1 ? 1.0 : 0.5, lookAhead: step === 1 ? 16 : 12, duration: D(5), ease: 'power2.inOut', onUpdate: applyCam }, 0);
      tl.to(world.post.bloom, { intensity: step === 1 ? 0.6 : 0.85, duration: D(2) }, 0);
      tl.add(scrim.set({ visible: step === 1 }, { animate }), D(step === 1 ? 3.6 : 0));
      tl.add(act.set({ visible: step === 1 }, { animate }), D(step === 1 ? 4.4 : 0));
      if (!animate) tl.call(applyCam, null, 0.0011);
      return tl;
    }

    return {
      steps: ctx.beat.steps.length,
      world,
      enter({ direction } = {}) { return stateTo(0, !renderMode && direction !== -1, true); },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit() {
        const tl = gsap.timeline();
        tl.to(CAM, { z: '-=3', duration: 0.8, ease: 'power2.in', onUpdate: applyCam }, 0);
        return tl;
      },
      update(time) {
        tNow = time;
        if (CAM.sway) applyCam();
        dust.update(time);
      },
      dispose() {
        gsap.killTweensOf([CAM, world.post.bloom]);
        act.destroy();
        scrim.destroy();
        cardMats.forEach((m) => m.dispose());
        world.dispose();
        root.replaceChildren();
      },
    };
  },
};
