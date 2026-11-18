// EXAMPLE (A1): a calm PAPER moment built from DD's component kit. Copy this file to src/scenes/<id>.js.
// Try it on any paper moment:  node scripts/build.mjs --only year-in-weeks --map year-in-weeks=_example-calm --out /tmp/calm.html
//
// Pattern: build all DOM once in create(); each step is a *state*; goto() moves every element to the state
// of that step (in() if it should show and is hidden, out() if it should hide and is shown). The engine
// finishes the returned timeline instantly when animate is false (back-navigation, ?render=1).
import { gsap } from 'gsap';

export default {
  id: '_example-calm',
  gl: false,
  create(ctx) {
    const { root, copy, components: C, beat } = ctx;
    const ground = beat.ground;

    // ---- copy (every visible string comes from ctx.copy / beats.json) ----
    const title = copy.title || copy.line || copy.line1 || '';
    // Find one figure in the copy for the demo; a real scene names its fields (copy.eci.to, …).
    const fig = copy.eci || copy.aa || Object.values(copy).find((v) => v && typeof v === 'object' && (v.to || v.value)) || null;
    const figure = fig ? String(fig.to || fig.value) : null;
    const figureLabel = fig ? fig.label || '' : '';
    const source = fig && fig.dates ? fig.dates : copy.caveat || '';

    // ---- DOM, built once ----
    const place = (el, left, top, width) => {
      Object.assign(el.style, { position: 'absolute', left: `${left}px`, top: `${top}px` });
      if (width) el.style.width = `${width}px`;
      root.appendChild(el);
      return el;
    };
    const kicker = C.Kicker.create({ text: ctx.act ? `${ctx.act.n ? ctx.act.n + ' · ' : ''}${ctx.act.title}` : '', ground });
    const headline = C.Headline.create({ text: title, role: 'h1', ground, width: 1440 });
    const number = figure ? C.BigNumber.create({ display: figure, label: figureLabel, kind: 'independent', ground, size: 'display' }) : null;
    const src = source ? C.SourceLine.create({ text: source, kind: 'independent', ground }) : null;
    place(kicker.el, 128, 120);
    place(headline.el, 128, 176, 1440);
    if (number) place(number.el, 128, 470);
    if (src) place(src.el, 128, 940, 1440);

    // Which elements are visible at each step.
    const parts = [
      { c: kicker, from: 0 },
      { c: headline, from: 0 },
      number && { c: number, from: 1 },
      src && { c: src, from: Math.min(2, beat.steps.length - 1) },
    ].filter(Boolean);
    const shown = new Set();
    gsap.set(parts.map((p) => p.c.el), { autoAlpha: 0 });

    function stateTo(step) {
      const tl = gsap.timeline();
      let at = 0;
      for (const p of parts) {
        const want = step >= p.from;
        if (want && !shown.has(p.c)) { p.c.in(tl, at); shown.add(p.c); at += 0.12; }
        else if (!want && shown.has(p.c)) { p.c.out(tl, 0); shown.delete(p.c); }
      }
      return tl;
    }

    return {
      steps: beat.steps.length,
      enter() { return stateTo(0); },
      goto(step) { return stateTo(step); },
      exit() {
        const tl = gsap.timeline();
        tl.to(root, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' });
        return tl;
      },
      update() {},
      world: null,
      dispose() {
        gsap.killTweensOf(root);
        parts.forEach((p) => p.c.destroy && p.c.destroy());
        root.replaceChildren();
      },
    };
  },
};
