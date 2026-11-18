// title (calm-a): continues the opener film's last frame without a jump.
// Step 0: white "Inside the AI Frontier" on pure #000, ink box x 584–1341, y 508–570 (fitFilmTitle, the same
//         fit the opener's fallback uses, so film → title is pixel-continuous).
// Step 1: the byline rises in under it (name; role · date), line-masked.
// Step 2: an aperture of white opens from the centre: the calm (PAPER) world begins. question follows on white.
import { gsap } from 'gsap';
import { fitFilmTitle, FILM_TITLE_BOX } from '../engine/title-fit.js';
import { makeKit, svgEl, el, esc } from './_calm/kit.js';

export default {
  id: 'title',
  gl: false,
  create(ctx) {
    const K = makeKit(ctx);
    const { T, layer, R } = K;
    const { copy } = ctx;
    const sans = T.type.families.sans;
    ctx.root.style.background = '#000000';

    // ----- the film's title, as the opener fallback draws it -----
    const svg = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080 });
    Object.assign(svg.style, { position: 'absolute', left: '0', top: '0' });
    const text = svgEl('text', { fill: '#FFFFFF', 'font-weight': 600 }, svg);
    text.style.fontFamily = sans;
    text.style.fontKerning = 'normal';
    text.textContent = copy.title || '';
    layer.appendChild(svg);
    const fit = () => fitFilmTitle(text, { family: sans, weight: 600 });
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    // ----- byline: two masked lines, centred on the title's axis -----
    const cx = (FILM_TITLE_BOX.left + FILM_TITLE_BOX.right) / 2;
    const by = el('div', '', null);
    Object.assign(by.style, { position: 'absolute', left: `${cx - 700}px`, width: '1400px', top: '640px', textAlign: 'center' });
    const lineA = `<span style="font-family:${esc(sans)};font-size:48px;line-height:64px;font-weight:560;letter-spacing:-0.01em;color:${T.colors.light}">${esc(copy.name || '')}</span>`;
    const lineB = `<span class="t-label" style="color:${T.colors.lightSoft}">${esc([copy.role, copy.date].filter(Boolean).join('  ·  '))}</span>`;
    layer.appendChild(by);
    const byline = K.maskLines(by, [{ html: lineA }, { html: lineB }], { stagger: 0.14, dur: 1.2 });
    // the second line sits 12 px below the first
    by.children[1].style.marginTop = '12px';

    // ----- the aperture of white -----
    const white = el('div', '', layer);
    Object.assign(white.style, { position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', background: T.colors.paper });
    const R_FULL = Math.ceil(Math.hypot(960, 540)) + 8;
    const aperture = K.block(white, {
      enter(tl) {
        tl.fromTo(white, { clipPath: 'circle(0px at 50% 50%)' }, { clipPath: `circle(${R_FULL}px at 50% 50%)`, duration: T.motion.iris.dur * 1.35, ease: T.motion.iris.ease }, 0);
        tl.set(white, { clipPath: 'none' });
      },
      settle() { gsap.set(white, { clipPath: 'none' }); },
      exit(tl) { tl.to(white, { autoAlpha: 0, duration: 0.45, ease: 'sine.inOut' }, 0); },
    });

    const apply = K.stepper([
      { c: byline, on: (s) => s >= 1, at: 0.1 },
      { c: aperture, on: (s) => s >= 2 },
    ]);

    return {
      steps: ctx.beat.steps.length,
      background: '#000000',
      enter() { K.reset(); fit(); return apply(0, true); },
      goto(step, { animate = true } = {}) { K.reset(); fit(); return apply(step, animate && !R); },
      exit() { return gsap.timeline(); }, // the next moment opens over our white (or our black on a jump)
      update() {},
      world: null,
      dispose() { K.dispose(); },
    };
  },
};
