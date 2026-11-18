// makeWorld(opts): a scene + 16:9 camera + post settings + one-call dispose of everything added.
//   opts: { background (colour or null), fog: { color, density }, fov, near, far, cameraPosition: [x,y,z],
//           lookAt: [x,y,z], post: { bloom: { intensity, threshold, smoothing, radius } | false,
//                                     vignette: { offset, darkness } | false } }
export function makeWorldFactory({ THREE, tokens }) {
  const voidColor = (tokens && tokens.colors && tokens.colors.void) || '#05070A';
  return function makeWorld(opts = {}) {
    const scene = new THREE.Scene();
    const bg = opts.background === undefined ? voidColor : opts.background;
    if (bg !== null) scene.background = new THREE.Color(bg);
    if (opts.fog) scene.fog = new THREE.FogExp2(new THREE.Color(opts.fog.color || bg || voidColor), opts.fog.density ?? 0.04);
    const camera = new THREE.PerspectiveCamera(opts.fov ?? 35, 16 / 9, opts.near ?? 0.1, opts.far ?? 400);
    camera.position.set(...(opts.cameraPosition || [0, 0, 12]));
    camera.lookAt(...(opts.lookAt || [0, 0, 0]));
    const extra = new Set();
    const world = {
      scene,
      camera,
      post: opts.post || {},
      add(...objs) { scene.add(...objs); return objs[0]; },
      // Register anything with dispose() that is not in the scene graph (render targets, textures, troika text…).
      track(obj) { extra.add(obj); return obj; },
      dispose() {
        const seen = new Set();
        const free = (x) => {
          if (!x || seen.has(x) || typeof x.dispose !== 'function') return;
          seen.add(x);
          x.dispose();
        };
        scene.traverse((o) => {
          free(o.geometry);
          const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
          for (const m of mats) {
            for (const v of Object.values(m)) if (v && v.isTexture) free(v);
            if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u && u.value && u.value.isTexture) free(u.value);
            free(m);
          }
          if (o !== scene && typeof o.dispose === 'function' && !o.isScene) free(o);
        });
        extra.forEach(free);
        extra.clear();
        if (scene.background && scene.background.isTexture) free(scene.background);
        scene.clear();
      },
    };
    return world;
  };
}
