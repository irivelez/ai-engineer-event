// motor: procedural canvas textures (no downloads, deterministic from a seed).
//   ironTex(rand)    grime + scratches: { map (colour multiplier), rough (roughness) } for cast iron and paint
//   leatherTex(rand) belt leather along u (one repeat = BELT_REPEAT m) with a rawhide lacing joint: { map, rough }
//   brickTex(rand)   2 × 2 m of soot-darkened brick: { map, bump }
//   floorTex(rand)   8 × 8 m of oiled concrete with joints and stains: { map, rough }
// Everything is low-frequency on purpose: Zoom's encoder smears fine detail, big shapes survive.
import * as THREE from 'three';

export const BELT_REPEAT = 2.4; // metres of belt per texture repeat (one lacing joint each)

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// fbm-ish value noise: random grids of growing resolution drawn with bilinear smoothing.
function noiseLayer(g, w, h, rand, { from = 4, octaves = 5, alpha = 0.5, lo = 0, hi = 255, tint = null } = {}) {
  const small = canvas(64, 64);
  const s = small.getContext('2d');
  let a = alpha;
  for (let o = 0; o < octaves; o++) {
    const n = Math.min(64, from << o);
    const img = s.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const v = lo + (hi - lo) * rand();
      const c = tint ? tint(v) : [v, v, v];
      img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
    }
    s.putImageData(img, 0, 0);
    g.globalAlpha = a;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(small, 0, 0, n, n, 0, 0, w, h);
    a *= 0.6;
  }
  g.globalAlpha = 1;
}

function tex(c, { srgb = true, repeat = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

export function ironTex(rand) {
  const W = 512;
  const cm = canvas(W, W);
  const g = cm.getContext('2d');
  g.fillStyle = '#d8d8d8';
  g.fillRect(0, 0, W, W);
  noiseLayer(g, W, W, rand, { from: 3, octaves: 5, alpha: 0.55, lo: 120, hi: 255 });
  // oily grime blotches
  for (let i = 0; i < 40; i++) {
    const x = rand() * W, y = rand() * W, r = 20 + rand() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(40,32,24,${0.18 + rand() * 0.22})`);
    gr.addColorStop(1, 'rgba(40,32,24,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const cr = canvas(W, W);
  const r = cr.getContext('2d');
  r.fillStyle = 'rgb(150,150,150)';
  r.fillRect(0, 0, W, W);
  noiseLayer(r, W, W, rand, { from: 4, octaves: 5, alpha: 0.5, lo: 90, hi: 230 });
  // polished scratches: lower roughness streaks
  r.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const x = rand() * W, y = rand() * W, l = 20 + rand() * 120, a = rand() * Math.PI;
    r.strokeStyle = `rgba(40,40,40,${0.25 + rand() * 0.35})`;
    r.lineWidth = 1 + rand() * 2.5;
    r.beginPath();
    r.moveTo(x, y);
    r.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    r.stroke();
  }
  return { map: tex(cm), rough: tex(cr, { srgb: false }) };
}

export function leatherTex(rand) {
  const W = 1024, H = 64; // u along the belt, v across it
  const cm = canvas(W, H);
  const g = cm.getContext('2d');
  g.fillStyle = '#7a4a2a';
  g.fillRect(0, 0, W, H);
  noiseLayer(g, W, H, rand, { from: 4, octaves: 4, alpha: 0.35, lo: 70, hi: 200, tint: (v) => [v, v * 0.72, v * 0.5] });
  // lengthwise grain and polish streaks
  for (let i = 0; i < 26; i++) {
    const y = rand() * H;
    g.fillStyle = `rgba(${rand() < 0.5 ? '30,18,10' : '160,110,70'},${0.06 + rand() * 0.1})`;
    g.fillRect(0, y, W, 1 + rand() * 3);
  }
  // darker worn edges
  const eg = g.createLinearGradient(0, 0, 0, H);
  eg.addColorStop(0, 'rgba(25,14,8,0.55)');
  eg.addColorStop(0.16, 'rgba(25,14,8,0)');
  eg.addColorStop(0.84, 'rgba(25,14,8,0)');
  eg.addColorStop(1, 'rgba(25,14,8,0.55)');
  g.fillStyle = eg;
  g.fillRect(0, 0, W, H);
  // the lacing joint: a lighter rawhide band with a zigzag of laces (big enough to read when the belt runs)
  const jx = 40, jw = 70;
  g.fillStyle = 'rgba(30,18,10,0.6)';
  g.fillRect(jx - 6, 0, 6, H);
  g.fillRect(jx + jw, 0, 6, H);
  g.fillStyle = '#c9a77a';
  g.fillRect(jx, 0, jw, H);
  g.strokeStyle = '#e8d2ad';
  g.lineWidth = 7;
  g.beginPath();
  for (let k = 0; k <= 6; k++) {
    const x = jx + (k / 6) * jw;
    g.lineTo(x, k % 2 ? H - 6 : 6);
  }
  g.stroke();
  const cr = canvas(W, H);
  const r = cr.getContext('2d');
  r.fillStyle = 'rgb(140,140,140)';
  r.fillRect(0, 0, W, H);
  noiseLayer(r, W, H, rand, { from: 4, octaves: 3, alpha: 0.4, lo: 90, hi: 200 });
  r.fillStyle = 'rgb(200,200,200)';
  r.fillRect(jx, 0, jw, H);
  const map = tex(cm);
  const rough = tex(cr, { srgb: false });
  return { map, rough };
}

export function brickTex(rand) {
  const W = 1024; // 2 m × 2 m
  const ppm = W / 2;
  const course = 0.075 * ppm, brick = 0.225 * ppm, mortar = 0.011 * ppm;
  const cm = canvas(W, W);
  const g = cm.getContext('2d');
  const cb = canvas(W, W);
  const b = cb.getContext('2d');
  g.fillStyle = '#6b5a4c'; // mortar, sooted
  g.fillRect(0, 0, W, W);
  b.fillStyle = '#000';
  b.fillRect(0, 0, W, W);
  const rows = Math.ceil(W / course);
  for (let row = 0; row < rows; row++) {
    const y = row * course;
    const off = (row % 2) * brick * 0.5;
    for (let x = -off; x < W; x += brick) {
      const t = rand();
      const base = [132 + t * 40, 62 + t * 22, 44 + t * 14];
      const k = 0.78 + rand() * 0.3;
      g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
      g.fillRect(x + mortar / 2, y + mortar / 2, brick - mortar, course - mortar);
      b.fillStyle = `rgb(${200 + rand() * 55 | 0},${200 + rand() * 55 | 0},${200 + rand() * 55 | 0})`;
      b.fillRect(x + mortar / 2, y + mortar / 2, brick - mortar, course - mortar);
    }
  }
  noiseLayer(g, W, W, rand, { from: 3, octaves: 4, alpha: 0.28, lo: 40, hi: 210 });
  return { map: tex(cm), bump: tex(cb, { srgb: false }) };
}

export function floorTex(rand) {
  const W = 1024; // 8 m × 8 m
  const cm = canvas(W, W);
  const g = cm.getContext('2d');
  g.fillStyle = '#8a8178';
  g.fillRect(0, 0, W, W);
  noiseLayer(g, W, W, rand, { from: 2, octaves: 6, alpha: 0.5, lo: 70, hi: 210, tint: (v) => [v, v * 0.95, v * 0.88] });
  // oil stains, big and soft
  for (let i = 0; i < 26; i++) {
    const x = rand() * W, y = rand() * W, r = 30 + rand() * 140;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(28,22,16,${0.25 + rand() * 0.35})`);
    gr.addColorStop(1, 'rgba(28,22,16,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // expansion joints every 2 m (4 px ≈ 3 cm)
  g.fillStyle = 'rgba(30,26,22,0.32)';
  for (let k = 0; k < 4; k++) {
    g.fillRect(k * W / 4, 0, 4, W);
    g.fillRect(0, k * W / 4, W, 4);
  }
  const cr = canvas(W, W);
  const r = cr.getContext('2d');
  r.fillStyle = 'rgb(205,205,205)';
  r.fillRect(0, 0, W, W);
  noiseLayer(r, W, W, rand, { from: 2, octaves: 5, alpha: 0.45, lo: 120, hi: 250 });
  // oil is glossy: stains lower the roughness
  for (let i = 0; i < 18; i++) {
    const x = rand() * W, y = rand() * W, rr = 40 + rand() * 120;
    const gr = r.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, 'rgba(110,110,110,0.45)');
    gr.addColorStop(1, 'rgba(110,110,110,0)');
    r.fillStyle = gr;
    r.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  return { map: tex(cm), rough: tex(cr, { srgb: false }) };
}
