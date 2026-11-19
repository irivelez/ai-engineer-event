// power (VOID, DOM only: the GL point-cloud Earth is gone). Art direction:
//  References: DevDay 26:20 (statement left, evidence right) · GTC 43:32 (a limit drawn as a line you read against).
//  Palette: void; the lower 48 in dark slate with 2 px state lines; PJM's real footprint in the accent (fill at a fifth,
//           a 3 px border that draws itself); the shortfall in the limit orange; text light.
//  Light: none; flat cartography, nothing glows that is not data.
//  Camera: one 2D move: the whole country (where PJM is) → in on PJM's footprint as the number lands; it then holds.
//  The frame that sells it: PJM's border drawing itself across thirteen states and DC, the rest of the country quiet.
// What changed and why: the old dots, lattice, "data-centre blocks" and dark region were generated (random points in
// a hand-drawn polygon), so they went. Shapes now: Natural Earth 1:50m states (public domain) and PJM's footprint from
// HIFLD Open "Independent System Operators" (US DHS, data from Oak Ridge National Laboratory, "None (Public Use)";
// built from FERC 714 / EIA 860 / EIA 861 / TIGER, 2019 vintage):
// src/data/geo/power-us.json, generator .dev/hero/power/geo-power.mjs. The footprint is drawn as it is (all or parts of
// states), never as whole states. The Colombia comparison is a bar at exact length (facts.json colombia-capacity).
// Evidence: the market monitor's slide, chip, caveat and QR on the data-centre step, unchanged.
import { gsap } from 'gsap';
import geo from '../data/geo/power-us.json';
import { evItem, evPage } from './_ev-page.js';
import { factsSource, provKind, place, splitFigure } from './_worlds/gl2-kit.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs, parent) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
};
const fmtMW = (v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v);

export default {
  id: 'power',
  gl: false,
  create(ctx) {
    const { root, copy, components: C, renderMode, tokens } = ctx;
    const G = tokens.grounds.void;
    const { spanW, space } = tokens;
    root.classList.add('itaf', 'ground-void');

    const fShort = ctx.facts('pjm-shortfall');
    const fCol = ctx.facts('colombia-capacity');
    const fDC = ctx.facts('pjm-datacentre-382');
    const showCompare = !!(copy.compare && fCol && fCol.verified !== 'failed' && !fCol.dropped);

    // ---------- the map: one SVG over the whole stage, the country in a group we move ----------
    const [, , VW, VH] = geo.viewBox;
    const B = geo.pjmBox; // PJM's bounding box in map px
    const mapSvg = svgEl('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080' });
    Object.assign(mapSvg.style, { position: 'absolute', left: '0px', top: '0px', overflow: 'visible', pointerEvents: 'none' });
    const mapG = svgEl('g', {}, mapSvg);
    const statesG = svgEl('g', { fill: '#111823', stroke: '#2C3644', 'stroke-linejoin': 'round' }, mapG);
    for (const s of geo.states) svgEl('path', { d: s.d }, statesG);
    const pjmFill = svgEl('path', { d: geo.pjm, fill: G.accent, 'fill-rule': 'evenodd', 'fill-opacity': 0 }, mapG);
    const pjmLine = svgEl('path', { d: geo.pjm, fill: 'none', stroke: G.accent, 'stroke-linejoin': 'round', pathLength: 1000, 'stroke-dasharray': '1000 1000', 'stroke-dashoffset': 1000 }, mapG);
    const pjmName = (String(copy.label || '').match(/PJM/) || [])[0] || '';
    const tag = pjmName ? document.createElement('div') : null;
    if (tag) {
      tag.className = 't-label';
      tag.textContent = pjmName;
      Object.assign(tag.style, { position: 'absolute', left: '0px', top: '0px', color: G.fg, whiteSpace: 'nowrap', opacity: '0' });
    }
    // poses: the whole country beside the title (s0), PJM filling the right half (s1–s2), lifted and quieter (s3)
    const fit = (x0, y0, x1, y1) => {
      const s = Math.min((x1 - x0) / (B[2] - B[0]), (y1 - y0) / (B[3] - B[1]));
      return { s, tx: x0 + ((x1 - x0) - s * (B[2] - B[0])) / 2 - s * B[0], ty: y0 + ((y1 - y0) - s * (B[3] - B[1])) / 2 - s * B[1] };
    };
    const POSE = [
      { s: 1.12, tx: 1792 - VW * 1.12, ty: 236, dim: 1 },
      { ...fit(1120, 300, 1764, 744), dim: 1 }, //  s1: PJM fills the right half
      { ...fit(1180, 150, 1764, 520), dim: 1 }, //  s2: lifted, Colombia's bar under it
      { ...fit(1196, 168, 1764, 512), dim: 0.55 }, // s3: lifted and quieter beside the evidence
    ];
    const M = { ...POSE[0], line: 0, fill: 0, tag: 0, mask: 0 };
    const applyMap = () => {
      mapG.setAttribute('transform', `translate(${M.tx.toFixed(2)} ${M.ty.toFixed(2)}) scale(${M.s.toFixed(4)})`);
      statesG.setAttribute('stroke-width', (2 / M.s).toFixed(3)); //  2 px on screen at every zoom
      pjmLine.setAttribute('stroke-width', (3 / M.s).toFixed(3)); // 3 px
      pjmLine.setAttribute('stroke-dashoffset', ((1 - M.line) * 1000).toFixed(1));
      pjmFill.setAttribute('fill-opacity', (0.2 * M.fill).toFixed(3));
      mapSvg.style.opacity = M.dim.toFixed(3);
      // zoomed in, the far states fade with distance from PJM (a soft vignette on the map, not on the page)
      const pcx = M.tx + M.s * (B[0] + B[2]) * 0.5;
      const pcy = M.ty + M.s * (B[1] + B[3]) * 0.5;
      const kk = 9 - 7.6 * M.mask;
      const mk = `radial-gradient(ellipse ${(M.s * (B[2] - B[0]) * kk).toFixed(0)}px ${(M.s * (B[3] - B[1]) * kk * 1.25).toFixed(0)}px at ${pcx.toFixed(0)}px ${pcy.toFixed(0)}px, #000 0%, #000 50%, transparent 100%)`;
      mapSvg.style.maskImage = mk;
      mapSvg.style.webkitMaskImage = mk;
      if (tag) {
        // the name sits in the footprint's middle (Ohio / West Virginia), never on a border
        const cx = M.tx + M.s * (B[0] + B[2]) * 0.5;
        const cy = M.ty + M.s * (B[1] * 0.64 + B[3] * 0.36); // central Ohio / Pennsylvania
        Object.assign(tag.style, { transform: `translate(${(cx - 32).toFixed(1)}px, ${(cy - 20).toFixed(1)}px)`, opacity: (M.tag * M.dim).toFixed(3) });
      }
    };
    applyMap();

    // ---------- DOM (unchanged copy, chips, evidence) ----------
    const scrim = C.Scrim.create({ ground: 'void', side: 'left', extent: 0.62, strength: 0.93 });
    const title = C.Headline.create({ text: copy.title, role: 'h2', ground: 'void', width: spanW(5) });
    place(title.el, space.margin, 192);
    const f1 = splitFigure(copy.value);
    const num = C.BigNumber.create({ display: f1.figure, unit: f1.unit || undefined, label: copy.label, kind: provKind(fShort && fShort.label), size: 'display', ground: 'void', width: spanW(7) });
    place(num.el, space.margin, 150);
    const compare = showCompare ? C.Headline.create({ text: copy.compare, role: 'body', ground: 'void', width: spanW(6) }) : null;
    if (compare) place(compare.el, space.margin, 700);
    const compareChip = showCompare ? C.ProvenanceChip.create({ kind: provKind(fCol.label), ground: 'void' }) : null;
    if (compareChip) place(compareChip.el, space.margin, 844);
    // the comparison at exact length: Colombia's installed capacity (XM via Portafolio, Jul 2026) and PJM's shortfall in it
    const colMW = showCompare && fCol.value && Number(fCol.value.jul2026MW);
    const shortMW = fShort && Number(fShort.value);
    let cmp = null;
    const colName = showCompare ? (String(copy.compare).match(/Colombia/) || [])[0] || '' : '';
    if (showCompare && colMW > 0 && shortMW > 0 && colName) {
      // on the right, under the lifted map: Colombia's whole grid as a bar, PJM's shortfall as the share of it
      const W = 584;
      const k = Math.min(1, shortMW / colMW);
      const box = document.createElement('div');
      Object.assign(box.style, { position: 'absolute', left: '1180px', top: '600px', width: `${W}px`, height: '140px', opacity: '0', visibility: 'hidden' });
      const name = document.createElement('div');
      name.className = 't-label';
      name.textContent = colName;
      Object.assign(name.style, { position: 'absolute', left: '0px', top: '0px', color: G.muted, whiteSpace: 'nowrap' });
      const track = document.createElement('div');
      Object.assign(track.style, { position: 'absolute', left: '0px', top: '56px', width: `${W}px`, height: '32px', borderRadius: '4px', background: G.quiet, transformOrigin: '0 50%' });
      const seg = document.createElement('div');
      Object.assign(seg.style, { position: 'absolute', left: '0px', top: '56px', width: `${(W * k).toFixed(1)}px`, height: '32px', borderRadius: '4px 0 0 4px', background: G.limit, transformOrigin: '0 50%' });
      const labA = document.createElement('div');
      labA.className = 't-label tnum';
      labA.textContent = `${fmtMW(shortMW)} ${f1.unit || 'MW'}`;
      Object.assign(labA.style, { position: 'absolute', left: '0px', top: '100px', color: G.limit, whiteSpace: 'nowrap' });
      const labB = document.createElement('div');
      labB.className = 't-label tnum';
      labB.textContent = `${fmtMW(colMW)} ${f1.unit || 'MW'}`;
      Object.assign(labB.style, { position: 'absolute', right: '0px', top: '100px', color: G.muted, whiteSpace: 'nowrap' });
      box.append(name, track, seg, labA, labB);
      cmp = { box, track, seg, labs: [name, labA, labB] };
    }
    const f2 = splitFigure(copy.share);
    const share = C.BigNumber.create({ display: f2.figure, unit: f2.unit || undefined, label: copy.shareLabel, kind: provKind(fDC && fDC.label), size: 'display', ground: 'void', width: spanW(7) });
    place(share.el, space.margin, 150);

    const evDC = evItem(ctx, 'power-pjm-imm-datacentre-382');
    const DOC_W = 760;
    const pageDC = evDC ? evPage(ctx, evDC, {
      width: DOC_W, ground: 'void', side: 600, qrSize: 160, link: false, // a 140-character PDF path: the QR carries it
      win: { y0: 0, y1: 0.86 },
      boxes: { share: { x: 0.065, y: 0.127, w: 0.88, h: 0.155 } }, // "of the $16.4B … $6.3B … 38.2 percent"
    }) : null;
    if (pageDC) place(pageDC.el, space.margin, 548);

    const foot = document.createElement('div');
    Object.assign(foot.style, { position: 'absolute', left: `${space.margin}px`, top: `${space.footer.y}px`, display: 'flex', gap: '48px', alignItems: 'center' });
    const srcShort = C.SourceLine.create({ kind: provKind(fShort && fShort.label), text: factsSource(fShort), ground: 'void' });
    const srcCol = showCompare ? C.SourceLine.create({ kind: provKind(fCol.label), text: factsSource(fCol), ground: 'void' }) : null;
    foot.append(srcShort.el);
    if (srcCol) foot.append(srcCol.el);
    const srcDC = C.SourceLine.create({ kind: provKind(fDC && fDC.label), text: factsSource(fDC), ground: 'void' });
    place(srcDC.el, space.margin, space.footer.y);
    const parts = [title, num, compare, compareChip, share, srcShort, srcCol, srcDC, pageDC && pageDC.c].filter(Boolean);
    root.append(mapSvg);
    if (tag) root.append(tag);
    root.append(scrim.el);
    [title, num, compare, compareChip, share, pageDC && pageDC.c].filter(Boolean).forEach((p) => root.append(p.el));
    if (cmp) root.append(cmp.box);
    root.append(foot, srcDC.el);
    for (const p of [srcShort, srcCol, srcDC]) if (p) p.el.style.position = p === srcDC ? 'absolute' : 'relative';

    // ---------- states ----------
    let cur = -1;
    function stateTo(step, animate, entering = false) {
      const tl = gsap.timeline();
      const A = animate && !renderMode;
      const D = (d) => (A ? d : 0);
      const p = POSE[Math.min(step, POSE.length - 1)];
      const target = { s: p.s, tx: p.tx, ty: p.ty, dim: p.dim, line: 1, fill: 1, tag: step <= 2 ? 1 : 0, mask: step >= 1 ? 1 : 0 };
      gsap.killTweensOf(M);
      if (!A) {
        Object.assign(M, target);
        applyMap();
      } else {
        if (entering) {
          // the country first, quiet; then PJM's border draws itself, then its area fills
          Object.assign(M, { ...POSE[0], line: 0, fill: 0, tag: 0, mask: 0 });
          applyMap();
          tl.to(M, { line: 1, duration: 2.2, ease: 'power2.inOut', onUpdate: applyMap }, 0.9);
          tl.to(M, { fill: 1, duration: 1.0, ease: 'sine.inOut', onUpdate: applyMap }, 2.5);
          tl.to(M, { tag: 1, duration: 0.5, ease: 'power3.out', onUpdate: applyMap }, 3.0);
        } else {
          const moving = Math.abs(M.s - target.s) > 1e-3 || Math.abs(M.ty - target.ty) > 0.5;
          tl.to(M, { s: target.s, tx: target.tx, ty: target.ty, mask: target.mask, duration: moving ? 2.8 : 0.01, ease: 'power3.inOut', onUpdate: applyMap }, 0);
          tl.to(M, { dim: target.dim, tag: target.tag, line: 1, fill: 1, duration: 0.9, ease: 'sine.inOut', onUpdate: applyMap }, 0);
        }
      }
      tl.add(scrim.set({ visible: step >= 1 }, { animate: A }), 0);
      tl.add(title.set({ visible: step === 0 }, { animate: A }), D(step === 0 ? 0.5 : 0));
      tl.add(num.set({ visible: step === 1 || step === 2 }, { animate: A }), D(step === 1 ? 1.4 : 0));
      if (compare) tl.add(compare.set({ visible: step === 2 }, { animate: A }), D(step === 2 ? 0.4 : 0));
      if (compareChip) tl.add(compareChip.set({ visible: step === 2 }, { animate: A }), D(step === 2 ? 0.75 : 0));
      if (cmp) {
        const on = step === 2;
        if (A && on && cur !== 2) {
          tl.set(cmp.box, { autoAlpha: 1 }, 1.0);
          tl.fromTo(cmp.track, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power3.out' }, 1.0);
          tl.fromTo(cmp.seg, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'expo.out' }, 1.5);
          tl.fromTo(cmp.labs, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.15 }, 2.0);
        } else if (A && !on && cur === 2) {
          tl.to(cmp.box, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0);
        } else if (!A) {
          gsap.set(cmp.box, { autoAlpha: on ? 1 : 0 });
          gsap.set([cmp.track, cmp.seg], { scaleX: 1 });
          gsap.set(cmp.labs, { autoAlpha: 1, y: 0 });
        }
      }
      tl.add(share.set({ visible: step === 3 }, { animate: A }), D(step === 3 ? 1.2 : 0));
      tl.add(srcShort.set({ visible: step === 1 || step === 2 }, { animate: A }), D(step === 1 ? 1.9 : 0));
      if (srcCol) tl.add(srcCol.set({ visible: step === 2 }, { animate: A }), D(step === 2 ? 0.9 : 0));
      // with the slide on screen its own meta carries the source: one source line per frame
      tl.add(srcDC.set({ visible: step === 3 && !pageDC }, { animate: A }), D(step === 3 ? 2.2 : 0));
      if (pageDC) {
        tl.add(pageDC.c.set({ visible: step === 3 }, { animate: A }), D(step === 3 ? 2.0 : 0));
        pageDC.focus({ on: step === 3 ? ['share'] : [] }, A, tl, 2.8);
      }
      cur = step;
      return tl;
    }

    return {
      steps: ctx.beat.steps.length,
      world: null,
      enter({ direction } = {}) { cur = -1; return stateTo(0, !renderMode && direction !== -1, true); },
      goto(step, { animate }) { return stateTo(step, animate && !renderMode); },
      exit() {
        const tl = gsap.timeline();
        tl.to(mapSvg, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0);
        return tl;
      },
      update() {},
      dispose() {
        gsap.killTweensOf([M, mapSvg, cmp && cmp.box, cmp && cmp.track, cmp && cmp.seg, ...(cmp ? cmp.labs : [])].filter(Boolean));
        parts.forEach((p) => p.destroy());
        scrim.destroy();
        root.replaceChildren();
      },
    };
  },
};
