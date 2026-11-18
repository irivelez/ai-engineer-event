// gl2-kit (gl-2): small GPU building blocks shared by breach, power, brazil, motor and news-tunnel.
//   fatLines({ positions, colors, width })   screen-space thick lines (≥ 2 stage px), one draw call
//   curveTexture(curves, samples)             curves baked into a float texture for vertex-shader lookups
//   CURVE_GLSL                                curveAt(row, u) for that texture (texelFetch + lerp, exact)
//   POINT_GLSL                                soft round sprite fragment shader (additive light, never squares)
//   pointScale(points)                        keeps gl_PointSize in stage px across pixel ratios
//   factsSource(fact)                         'Publisher · 27 Jul 2026' from a facts.json entry
//   provKind(label)                           facts.json label → ProvenanceChip kind
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const vp = new THREE.Vector4();

/**
 * Thick lines in stage px (scaled with the drawing buffer, so 2.5 means 2.5 px on the 1080 stage).
 * positions: [x0,y0,z0, x1,y1,z1, …] pairs; colors: same layout (HDR > 1 blooms).
 */
export function fatLines({ positions, colors = null, width = 2.5, color = 0xffffff, opacity = 1, additive = true, depthTest = true }) {
  const geo = new LineSegmentsGeometry();
  geo.setPositions(positions);
  if (colors) geo.setColors(colors);
  const mat = new LineMaterial({
    color, linewidth: width, vertexColors: !!colors, worldUnits: false, transparent: true, opacity, depthWrite: false, depthTest,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const lines = new LineSegments2(geo, mat);
  lines.frustumCulled = false;
  lines.baseWidth = width;
  lines.onBeforeRender = function onBeforeRender(renderer) {
    renderer.getCurrentViewport(vp);
    mat.linewidth = lines.baseWidth * (vp.w / 1080);
    LineSegments2.prototype.onBeforeRender.call(lines, renderer);
  };
  return lines;
}

/** Polyline points → segment pairs for fatLines. */
export function polylineSegments(points, out = []) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    out.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  return out;
}

/** Bake curves into a float RGBA texture: x = sample index, y = curve row. */
export function curveTexture(curves, samples = 128) {
  const W = samples;
  const H = curves.length;
  const data = new Float32Array(W * H * 4);
  curves.forEach((c, j) => {
    const pts = c.getSpacedPoints(W - 1);
    pts.forEach((p, i) => {
      const o = (j * W + i) * 4;
      data[o] = p.x; data[o + 1] = p.y; data[o + 2] = p.z; data[o + 3] = 1;
    });
  });
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export const CURVE_GLSL = /* glsl */ `
uniform sampler2D uCurves;
uniform vec2 uCurveSize;
vec3 curveAt(float row, float u) {
  float f = clamp(u, 0.0, 1.0) * (uCurveSize.x - 1.0);
  int i0 = int(floor(f));
  int i1 = min(i0 + 1, int(uCurveSize.x) - 1);
  int r = int(row + 0.5);
  vec3 a = texelFetch(uCurves, ivec2(i0, r), 0).xyz;
  vec3 b = texelFetch(uCurves, ivec2(i1, r), 0).xyz;
  return mix(a, b, fract(f));
}`;

export const POINT_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  if (a * vAlpha < 0.003) discard;
  gl_FragColor = vec4(vColor, a * vAlpha);
}`;

/** Points: uScale = buffer height / (2·tan(fov/2)), so size is in world units and ≥ 2 px. */
export function pointScale(points, uniforms) {
  const v2 = new THREE.Vector2();
  points.onBeforeRender = (renderer, scene, camera) => {
    renderer.getDrawingBufferSize(v2);
    renderer.getCurrentViewport(vp);
    const h = vp.w || v2.y;
    const fov = camera.isPerspectiveCamera ? (camera.fov * Math.PI) / 180 : Math.PI / 4;
    uniforms.uScale.value = h / (2 * Math.tan(fov / 2));
    if (uniforms.uPx) uniforms.uPx.value = h / 1080;
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** '2026-07-27' → '27 Jul 2026' (also '2026-07' → 'Jul 2026', '1990-05' → 'May 1990'). */
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-');
  const mon = MONTHS[Number(m) - 1] || '';
  return [d ? String(Number(d)) : '', mon, y].filter(Boolean).join(' ');
}

/** facts.json entry → 'Publisher · 27 Jul 2026'. */
export function factsSource(f) {
  if (!f || !f.source) return '';
  return [f.source.publisher, fmtDate(f.source.date)].filter(Boolean).join(' · ');
}

/** facts.json label → ProvenanceChip kind. */
export function provKind(label) {
  return { 'lab-reported': 'labReported', independent: 'independent', secondary: 'secondary', official: 'official', estimate: 'estimate', press: 'press' }[label] || 'secondary';
}

/** Place a component element at stage px. */
export function place(el, x, y, w) {
  Object.assign(el.style, { position: 'absolute', left: `${x}px`, top: `${y}px` });
  if (w) el.style.width = `${w}px`;
  return el;
}

/** '< 13 hours' → { figure: '< 13', unit: 'hours' } (spaces inside the figure become no-break spaces). */
export function splitFigure(str) {
  const m = /^([<>~≈]?\s*[$€]?[\d.,]+\s*[%×+]?)\s*(.*)$/.exec(String(str || '').trim());
  if (!m) return { figure: String(str || ''), unit: '' };
  return { figure: m[1].trim().replace(/ /g, '\u00A0'), unit: m[2] };
}

// Crops for captures whose page header is not the point (natural size [w, h], crop [x0, y0, x1, y1] in px).
export const CROPS = {
  'exame-brasil-regra-chips': { size: [1600, 1785], crop: [80, 1110, 1560, 1450] },
  'x-openai-securing-training-environment': { size: [868, 1510], crop: [0, 296, 868, 486] },
  'nypost-california-sues-openai': { size: [1600, 829], crop: [170, 450, 1580, 700] },
  'verge-data-centers-electricity': { size: [1600, 1221], crop: [20, 470, 1580, 870] },
  'verge-claude-fable-52': { size: [1600, 1221], crop: [20, 470, 1580, 870] },
};

/** captures.json entry → { outlet, date, captured, views } strings (all from the manifest). */
export function captureInfo(m) {
  if (!m) return {};
  const views = m.counts && m.counts.displayed && m.counts.displayed.views;
  return {
    who: m.outlet || m.author || '',
    date: fmtDate(String(m.published || '').slice(0, 10)),
    captured: fmtDate(String(m.captured_at || '').slice(0, 10)),
    views: views ? `${views} views` : '',
  };
}

/** A CaptureCard showing only the crop of a capture (the card height follows the crop). */
export function croppedCard(C, { id, src, alt, width, meta }) {
  const card = C.CaptureCard.create({ src, alt, variant: 'void', meta, width });
  const c = CROPS[id];
  if (c) {
    const [w] = c.size;
    const [x0, y0, x1, y1] = c.crop;
    const k = width / (x1 - x0);
    const frame = card.el.querySelector('.cap-frame');
    const img = card.el.querySelector('.cap-img');
    frame.style.height = `${Math.round((y1 - y0) * k)}px`;
    Object.assign(img.style, { width: `${Math.round(w * k)}px`, maxWidth: 'none', marginLeft: `${-Math.round(x0 * k)}px`, marginTop: `${-Math.round(y0 * k)}px` });
  }
  return card;
}
