// Builds the `ctx` every scene's create(ctx) receives (contract: docs/engine-spec.md "Scene module contract").
import { gsap } from 'gsap';

function indexFacts(facts) {
  const map = new Map();
  if (!facts) return map;
  const list = Array.isArray(facts) ? facts : Array.isArray(facts.facts) ? facts.facts : null;
  if (list) list.forEach((f) => f && f.id && map.set(f.id, f));
  // facts.json is { asOf, facts: { <id>: {...} } }: index the inner map by id.
  else if (facts.facts && typeof facts.facts === 'object') Object.entries(facts.facts).forEach(([id, f]) => f && typeof f === 'object' && map.set(id, { id, ...f }));
  else if (typeof facts === 'object') Object.entries(facts).forEach(([id, f]) => f && typeof f === 'object' && map.set(id, { id, ...f }));
  return map;
}

// facts.json label → provenance chip kind
const KIND = { independent: 'independent', 'lab-reported': 'labReported', labreported: 'labReported', secondary: 'secondary', official: 'official', estimate: 'estimate', press: 'press' };
export const kindOf = (label) => KIND[String(label || '').trim().toLowerCase()] || 'secondary';

// Deterministic PRNG (mulberry32) seeded from a string.
export function seededRandom(seedStr = 'itaf') {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeContextFactory({ data, tokens, components, icons, assets, fonts, params, moments }) {
  const facts = indexFacts(data.facts);
  const acts = (data.beats && data.beats.acts) || [];
  const all = moments;
  const assetApi = {
    sf: (id) => (assets.sf && assets.sf[id]) || null,
    capture: (id) => (assets.capture && assets.capture[id]) || null,
    image: (uri) => uri,
    sfMeta: (id) => (assets.sfMeta && assets.sfMeta[id]) || null,
    captureMeta: (id) => (assets.captureMeta && assets.captureMeta[id]) || null,
    sfIds: () => Object.keys(assets.sf || {}),
    captureIds: () => Object.keys(assets.capture || {}),
    fonts: fonts || {},
    // Evidence kit (src/data/evidence.json): the item with posterSrc / imageSrc as data URIs, `file` relative to
    // the built page, and `chip` (provenance chip kind) from its first fact's label.
    evidence: (id) => evidenceItem(id),
    evidenceFor: (momentId) => Object.keys(assets.evidenceMeta || {}).filter((id) => assets.evidenceMeta[id].moment === momentId).map(evidenceItem),
    evidenceIds: () => Object.keys(assets.evidenceMeta || {}),
  };
  function evidenceItem(id) {
    const m = assets.evidenceMeta && assets.evidenceMeta[id];
    if (!m) return null;
    const u = (assets.evidence && assets.evidence[id]) || {};
    const f = (m.factIds || []).map((x) => facts.get(x)).find(Boolean);
    return { ...m, id, posterSrc: u.poster || null, imageSrc: u.image || null, chip: kindOf(f && f.label) };
  }
  return function makeCtx(m, i, root, gl, extra = {}) {
    const ground = (tokens.grounds && tokens.grounds[m.ground]) || null;
    return {
      id: m.id,
      root,
      beat: m,
      copy: m.copy || {},
      index: i,
      number: m.n || i + 1,
      total: all.length,
      act: acts.find((a) => a.id === m.act) || null,
      acts,
      beats: all,
      notes: (data.notes && data.notes[m.id]) || null,
      frames: data.frames || [],
      facts: (id) => facts.get(id) || null,
      tokens,
      ground,
      components,
      icons,
      assets: assetApi,
      gl,
      gsap,
      renderMode: !!params.render,
      params,
      random: seededRandom(m.id),
      stage: { width: 1920, height: 1080 },
      ...extra,
    };
  };
}
