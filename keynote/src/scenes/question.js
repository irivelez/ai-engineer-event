// question (calm-a): one question frames the night, then the five stops of the route.
// Step 0: the kicker alone, where it will stay.  Step 1: the question (h1, one accent word).
// Step 2: the question glides up and steps back to muted; the route draws left → right on one 2 px line,
//         five stops I–V, stop I lit in the accent ("we start here").
import { gsap } from 'gsap';
import { calmScene, el, esc } from './_calm/kit.js';

export default calmScene('question', (ctx, K) => {
  const { T, C, g, layer, place } = K;
  const { copy } = ctx;
  const M = T.space.margin;
  const W = 1920 - 2 * M;

  // ----- kicker + question (optically centred for steps 0–1) -----
  const Q_TOP = 404; // question top for steps 0–1
  const LIFT = 196; // how far the block rises at step 2
  const block = el('div', '', null);
  place(block, 0, 0, 1920, 1080);
  block.style.pointerEvents = 'none';
  const kicker = C.Kicker.create({ text: copy.kicker || '', ground: g });
  const q = C.Headline.create({ text: copy.question || '', role: 'h1', ground: g, width: 1480, highlight: hlWord(copy.question) });
  place(kicker.el, M, Q_TOP - 88);
  place(q.el, M, Q_TOP, 1480);
  block.append(kicker.el, q.el);
  K.owned.push(kicker, q);

  // ----- the route: numerals come from the acts (I–V) in beats.json -----
  const NUMERALS = (ctx.acts || []).filter((a) => a && a.n).map((a) => a.n);
  const stops = (copy.route || []).slice(0, 5);
  const n = stops.length || 1;
  const LINE_Y = 760;
  const pitch = W / n;
  const route = el('div', '', null);
  place(route, 0, 0, 1920, 1080);
  const line = el('div', 'ca-rule', route);
  Object.assign(line.style, { left: `${M}px`, top: `${LINE_Y - 1}px`, width: `${W}px`, background: 'var(--g-fg)' });
  const stopEls = stops.map((s, i) => {
    const x = M + i * pitch;
    const wrap = el('div', '', route);
    Object.assign(wrap.style, { position: 'absolute', left: `${x}px`, top: '0px', width: `${pitch - 32}px` });
    const num = el('div', 't-label', wrap, esc(NUMERALS[i] || ''));
    Object.assign(num.style, { position: 'absolute', left: '0px', top: `${LINE_Y - 72}px`, color: i === 0 ? 'var(--g-accent)' : 'var(--g-muted)' });
    const dot = el('div', '', wrap);
    Object.assign(dot.style, { position: 'absolute', left: '0px', top: `${LINE_Y - 9}px`, width: '18px', height: '18px', borderRadius: '50%', background: i === 0 ? 'var(--g-accent)' : 'var(--g-bg)', border: `4px solid ${i === 0 ? 'var(--g-accent)' : 'var(--g-fg)'}`, boxSizing: 'border-box' });
    const name = el('div', 'ca-sans32', wrap, esc(s));
    Object.assign(name.style, { position: 'absolute', left: '0px', top: `${LINE_Y + 40}px`, width: `${pitch - 20}px`, color: 'var(--g-fg)', fontWeight: '520' });
    return { wrap, num, dot, name };
  });
  const routeBlock = K.block(route, {
    enter(tl) {
      tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'power3.inOut', transformOrigin: '0 50%' }, 0.15);
      stopEls.forEach((s, i) => {
        const t = 0.15 + 1.6 * (0.08 + (i / n) * 0.9);
        tl.fromTo(s.dot, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'power3.out' }, t);
        tl.fromTo([s.num, s.name], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, t + 0.05);
      });
    },
    settle() {
      gsap.set(line, { scaleX: 1 });
      stopEls.forEach((s) => { gsap.set(s.dot, { scale: 1 }); gsap.set([s.num, s.name], { autoAlpha: 1, y: 0 }); });
    },
  });

  const apply = K.stepper([
    { c: kicker, on: () => true },
    { c: q, on: (s) => s >= 1 },
    { c: routeBlock, on: (s) => s >= 2, at: 0.35 },
  ]);

  function go(step, animate) {
    const tl = gsap.timeline();
    const anim = animate && !K.R;
    apply(step, anim, tl);
    // step 2: the question block rises and steps back (muted), making room for the route
    const lifted = step >= 2;
    const y = lifted ? -LIFT : 0;
    if (anim) tl.to(block, { y, duration: 1.0, ease: 'power3.inOut' }, 0);
    else { gsap.killTweensOf(block); gsap.set(block, { y }); }
    tl.add(q.set({ dim: lifted }, { animate: anim }), anim ? 0.2 : 0);
    // the accent word steps back too: at step 2 the only accent is stop I
    const hl = [...q.el.querySelectorAll('.itaf-hl')];
    const col = lifted ? K.G.muted : K.G.accent;
    if (hl.length) { if (anim) tl.to(hl, { color: col, duration: 0.4, ease: 'power3.out' }, 0.2); else gsap.set(hl, { color: col }); }
    return tl;
  }
  return { go };
});

// The accent word: "differently" if present (the change the night is about), else none.
function hlWord(s) {
  const m = /\bdifferently\b/i.exec(String(s || ''));
  return m ? m[0] : undefined;
}
