// end (calm-b, VOID): the mirror of the title frame, then how to reach Irina while the questions run.
// Step 0: "Inside the AI Frontier" exactly where the title moment set it (the film's title box, fitFilmTitle),
//         white on the void, with her name and role rising under it: the keynote closes on its first frame.
// Step 1: the title steps away; "Questions" takes the left at h1 with name and role under it; on the right
//         crisp QR codes (generated locally with qrcode-generator: SVG, one path, crisp edges) on white cards,
//         each with its text beneath in Geist Mono: her LinkedIn and, when copy.sourcesUrl is set, "All sources"
//         (the generated sources page on the deployed site).
import { gsap } from 'gsap';
import qrcode from 'qrcode-generator';
import { fitFilmTitle, FILM_TITLE_BOX } from '../engine/title-fit.js';
import { calmScene, el, esc, svgEl } from './_calm/kit.js';
import { ensureCSS } from './_calm-b/kit.js';

function qrSVG(text, px) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 4;
  const total = n + 2 * quiet;
  const mod = Math.floor(px / total);
  const size = mod * total;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      // merge horizontal runs into one rect each
      let run = 1;
      while (c + run < n && qr.isDark(r, c + run)) run++;
      d += `M${(c + quiet) * mod},${(r + quiet) * mod}h${run * mod}v${mod}h${-run * mod}z`;
      c += run - 1;
    }
  }
  return { size, html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${size}" height="${size}" fill="#FFFFFF"/><path d="${d}" fill="#0B0F14"/></svg>` };
}

export default calmScene('end', (ctx, K) => {
  ensureCSS();
  const { T, C, G, g, place, R, layer } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const sans = T.type.families.sans;
  const mono = T.type.families.mono;

  // ----- step 0: the title frame, mirrored -----
  const t0 = el('div', '');
  place(t0, 0, 0, 1920, 1080);
  const svg = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080 }, t0);
  Object.assign(svg.style, { position: 'absolute', left: '0', top: '0' });
  const text = svgEl('text', { fill: G.fg, 'font-weight': 600 }, svg);
  text.style.fontFamily = sans;
  text.style.fontKerning = 'normal';
  text.textContent = copy.title || '';
  const fit = () => fitFilmTitle(text, { family: sans, weight: 600 });
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  const cx = (FILM_TITLE_BOX.left + FILM_TITLE_BOX.right) / 2;
  const by = el('div', '', t0);
  Object.assign(by.style, { position: 'absolute', left: `${cx - 700}px`, width: '1400px', top: '640px', textAlign: 'center' });
  const nameA = el('div', 'cb-mask', by);
  const nA = el('div', '', nameA, esc(copy.name || ''));
  Object.assign(nA.style, { fontFamily: sans, fontSize: '48px', lineHeight: '64px', fontWeight: '560', letterSpacing: '-0.01em', color: G.fg });
  const roleA = el('div', 'cb-mask', by);
  roleA.style.marginTop = '12px';
  const rA = el('div', 't-label', roleA, esc(copy.role || ''));
  rA.style.color = G.muted;
  const titleB = K.block(t0, {
    enter(tl) {
      tl.fromTo(svg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: 'sine.inOut' }, 0);
      tl.fromTo([nA, rA], { yPercent: 125 }, { yPercent: 0, duration: 1.2, ease: T.motion.calmIn.ease, stagger: 0.14 }, 0.5);
    },
    settle() { gsap.set(svg, { autoAlpha: 1 }); gsap.set([nA, rA], { yPercent: 0 }); },
  });

  // ----- step 1: Questions + QR -----
  const qWrap = el('div', '');
  place(qWrap, 0, 0, 1920, 1080);
  const kick = C.Kicker.create({ text: copy.title || '', ground: g });
  Object.assign(kick.el.style, { position: 'absolute', left: `${M}px`, top: '120px' });
  qWrap.appendChild(kick.el);
  K.owned.push(kick);
  const qm = el('div', 'cb-mask', qWrap);
  Object.assign(qm.style, { position: 'absolute', left: `${M}px`, top: '360px' });
  const qT = el('div', 't-h1', qm, esc(copy.cta || ''));
  qT.style.color = G.fg;
  const who = el('div', '', qWrap);
  Object.assign(who.style, { position: 'absolute', left: `${M}px`, top: '540px' });
  const nB = el('div', '', who, esc(copy.name || ''));
  Object.assign(nB.style, { fontFamily: sans, fontSize: '48px', lineHeight: '64px', fontWeight: '560', letterSpacing: '-0.01em', color: G.fg });
  const rB = el('div', 't-label', who, esc(copy.role || ''));
  Object.assign(rB.style, { color: G.muted, marginTop: '12px' });

  // One card (LinkedIn) centred in columns 8–11, or two side by side across columns 6–11 (LinkedIn, All sources).
  // Each card and its text share a centre, so the text stays inside the margin.
  const codes = [{ url: copy.url || copy.link || '', label: copy.link || '' }];
  if (copy.sourcesUrl) codes.push({ url: copy.sourcesUrl, label: copy.sourcesLabel || '' });
  const twoUp = codes.length > 1;
  const QPX = twoUp ? 320 : 408;
  const QY = twoUp ? 316 : 292;
  const span = 1920 - M - T.colX(6);
  const centres = twoUp ? [T.colX(6) + span / 4, T.colX(6) + (3 * span) / 4] : [(T.colX(8) + 1920 - M) / 2];
  const cards = [];
  const links = [];
  const qrs = codes.map((c) => qrSVG(c.url, QPX));
  const slot = Math.max(...qrs.map((q) => q.size)); // codes differ by a few modules: share one slot so the texts align
  codes.forEach((c, i) => {
    const qr = qrs[i];
    const card = el('div', '', qWrap, qr.html);
    Object.assign(card.style, { position: 'absolute', left: `${Math.round(centres[i] - qr.size / 2)}px`, top: `${QY + Math.round((slot - qr.size) / 2)}px`, width: `${qr.size}px`, height: `${qr.size}px`, borderRadius: '24px', overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 0 0 2px rgba(238,242,246,0.22), 0 32px 96px -24px rgba(147,170,255,0.20)' });
    card.dataset.url = c.url;
    const link = el('div', 'cb-nowrap', qWrap, esc(c.label));
    Object.assign(link.style, { position: 'absolute', left: `${centres[i]}px`, top: `${QY + slot + 32}px`, transform: 'translateX(-50%)', fontFamily: mono, fontSize: twoUp ? '28px' : '32px', lineHeight: '40px', fontWeight: '500', letterSpacing: '0.01em', color: G.fg });
    cards.push(card);
    links.push(link);
  });

  const qB = K.block(qWrap, {
    enter(tl) {
      tl.add(kick.set({ visible: true }, { animate: true }), 0);
      tl.fromTo(qT, { yPercent: 125 }, { yPercent: 0, duration: 1.2, ease: T.motion.calmIn.ease }, 0.1);
      tl.fromTo(who, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: T.motion.calmIn.ease }, 0.45);
      tl.fromTo(cards, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 1.0, ease: T.motion.calmIn.ease, stagger: 0.12 }, 0.35);
      tl.fromTo(links, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: T.motion.calmIn.ease, stagger: 0.12 }, 0.8);
    },
    settle() {
      kick.set({ visible: true }, { animate: false });
      gsap.set(qT, { yPercent: 0 }); gsap.set([who, ...cards, ...links], { autoAlpha: 1, y: 0, scale: 1 });
    },
  });

  const apply = K.stepper([
    { c: titleB, on: (s) => s === 0 },
    { c: qB, on: (s) => s >= 1, at: 0.15 },
  ]);

  function go(step, animate, info = {}) {
    fit();
    const anim = animate && !R;
    return apply(step, anim, gsap.timeline(), info);
  }
  return { go };
});
