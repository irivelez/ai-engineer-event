// Shared helpers for calm-a's calm and data moments (owner: calm-a).
// One pattern everywhere: build all DOM once in create(); every step is a STATE; goto(step) moves each
// part to that state (animated or instant). Parts are DD components or `block()`s with the same
// set({ visible }, { animate }) contract, so goto(i, { animate:false }) always lands the exact frame.
import { gsap } from 'gsap';

export const SVGNS = 'http://www.w3.org/2000/svg';

// ---------- DOM ----------
export function el(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
export function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, String(v));
  if (parent) parent.appendChild(e);
  return e;
}
export function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
/** Escape `text`, wrap `hl` (first occurrence) in a span of class `cls`. */
export function mark(text, hl, cls = 'itaf-hl') {
  const t = esc(text);
  if (!hl) return t;
  const e = esc(hl);
  const i = t.indexOf(e);
  return i < 0 ? t : `${t.slice(0, i)}<span class="${cls}">${e}</span>${t.slice(i + e.length)}`;
}
/** Strip one pair of curly/straight quotes around a copy string (Quote adds its own marks). */
export const unquote = (s) => String(s ?? '').trim().replace(/^[“"]\s*/, '').replace(/\s*[”"]$/, '');

// ---------- provenance ----------
const KIND = { independent: 'independent', 'lab-reported': 'labReported', labreported: 'labReported', secondary: 'secondary', official: 'official', estimate: 'estimate', press: 'press' };
export const kindOf = (label) => KIND[String(label || '').trim().toLowerCase()] || 'secondary';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(s) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(s || ''));
  if (!m) return String(s || '');
  const mon = MON[+m[2] - 1];
  return m[3] ? `${+m[3]} ${mon} ${m[1]}` : `${mon} ${m[1]}`;
}
/**
 * A fact by id. Works around engine/context.js indexing facts.json's top-level keys (asOf, legend, facts)
 * instead of facts.facts: ctx.facts(id) is null there, ctx.facts('facts') is the whole map.
 */
export function fact(ctx, id) {
  const direct = ctx.facts(id);
  if (direct && (direct.claim || direct.value != null || direct.source)) return direct;
  const all = ctx.facts('facts');
  return (all && typeof all === 'object' && all[id]) || null;
}
/** { kind, text: 'Publisher · 17 Nov 2026' } from facts.json, or null. */
export function factSource(ctx, id) {
  const f = fact(ctx, id);
  if (!f) return null;
  const s = f.source || {};
  return { kind: kindOf(f.label), text: [s.publisher, fmtDate(s.date || f.asOf)].filter(Boolean).join(' · '), fact: f };
}
/** Parse a beat `tag` like 'Independent · Epoch AI, 17 Nov 2026' → { kind, text }. */
export function tagSource(tag) {
  const parts = String(tag || '').split(' · ');
  const head = parts[0].trim().toLowerCase();
  if (KIND[head] && parts.length > 1) return { kind: KIND[head], text: parts.slice(1).join(' · ') };
  return { kind: 'secondary', text: String(tag || '') };
}

// ---------- CSS (scoped to .ca-*) ----------
const CSS = `
.ca-layer { position:absolute; left:0; top:0; width:1920px; height:1080px; }
.ca-abs { position:absolute; }
.ca-fg { color: var(--g-fg); } .ca-muted { color: var(--g-muted); } .ca-accent { color: var(--g-accent); }
.ca-sans32 { font-family: var(--f-sans); font-size: 32px; line-height: 40px; letter-spacing: 0; font-weight: 520; }
.ca-sans40 { font-family: var(--f-sans); font-size: 40px; line-height: 48px; letter-spacing: -0.006em; font-weight: 460; }
.ca-mask { overflow: clip; padding: 0.14em 0 0.22em; margin: -0.14em 0 -0.22em; }
.ca-mask > * { display: block; }
.ca-nowrap { white-space: nowrap; }
.ca-rule { position:absolute; height:2px; background: var(--g-rule); transform-origin: 0 50%; }
.ca-card { position:absolute; background: var(--g-card); border-radius: 24px; }
.ca-swatch { display:inline-block; width:24px; height:24px; border-radius:4px; vertical-align: -2px; margin-right: 16px; }
`;
export function ensureCSS() {
  if (document.getElementById('calm-a-kit-css')) return;
  const s = document.createElement('style');
  s.id = 'calm-a-kit-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ---------- the kit ----------
export function makeKit(ctx) {
  ensureCSS();
  const R = !!ctx.renderMode;
  const g = ctx.beat.ground === 'paper' ? 'paper' : 'void';
  const T = ctx.tokens;
  const C = ctx.components;
  const G = T.grounds[g];
  const root = ctx.root;
  root.classList.add('itaf', `ground-${g}`);
  const layer = el('div', 'ca-layer', root);
  const owned = [];

  /** Absolute-position an element (stage px) inside the layer. */
  function place(e, x, y, w, h) {
    e.classList.add('ca-abs');
    e.style.left = `${x}px`;
    e.style.top = `${y}px`;
    if (w != null) e.style.width = typeof w === 'number' ? `${w}px` : w;
    if (h != null) e.style.height = typeof h === 'number' ? `${h}px` : h;
    if (!e.parentNode) layer.appendChild(e);
    return e;
  }
  /** Add a DD component at (x, y). */
  function add(c, x, y, w) {
    place(c.el, x, y, w);
    owned.push(c);
    return c;
  }

  /**
   * A custom element with the component contract: set({ visible }, { animate }).
   * opts.enter(tl) / opts.exit(tl) build animations; opts.settle() lands the final shown state;
   * opts.hide() the hidden state (default autoAlpha 0).
   */
  function block(e, opts = {}) {
    let shown = false;
    const settle = () => {
      gsap.killTweensOf(e);
      gsap.set(e, { autoAlpha: 1, y: 0, x: 0 });
      if (opts.settle) opts.settle();
    };
    const hide = () => {
      gsap.killTweensOf(e);
      gsap.set(e, { autoAlpha: 0 });
      if (opts.hide) opts.hide();
    };
    const api = {
      el: e,
      get shown() { return shown; },
      set(state = {}, { animate = true } = {}) {
        const tl = gsap.timeline();
        const anim = animate && !R;
        if (state.visible === true) {
          if (!anim) { shown = true; settle(); }
          else if (!shown) {
            shown = true;
            if (opts.enter) { gsap.set(e, { autoAlpha: 1, y: 0, x: 0 }); opts.enter(tl); }
            else tl.fromTo(e, { autoAlpha: 0, y: opts.rise ?? 24 }, { autoAlpha: 1, y: 0, duration: opts.dur ?? T.motion.calmIn.dur, ease: T.motion.calmIn.ease }, 0);
          }
        } else if (state.visible === false) {
          if (!anim) { shown = false; hide(); }
          else if (shown) {
            shown = false;
            if (opts.exit) opts.exit(tl);
            else tl.to(e, { autoAlpha: 0, y: -12, duration: T.motion.calmOut.dur, ease: T.motion.calmOut.ease }, 0);
          }
        }
        return tl;
      },
      destroy() { gsap.killTweensOf(e); e.remove(); },
    };
    gsap.set(e, { autoAlpha: 0 });
    owned.push(api);
    return api;
  }

  /**
   * Masked lines that rise into place (DevDay line-mask) for plain DOM text we lay out ourselves.
   * lines: [{ html, cls }] → one block; each line clips inside its own mask.
   */
  function maskLines(container, lines, { stagger = T.motion.stagger, dur = T.motion.calmIn.dur } = {}) {
    const inners = lines.map((ln) => {
      const m = el('div', 'ca-mask', container);
      return el('div', ln.cls || '', m, ln.html);
    });
    return block(container, {
      enter(tl) { tl.fromTo(inners, { yPercent: 120 }, { yPercent: 0, duration: dur, ease: T.motion.calmIn.ease, stagger }, 0); },
      settle() { gsap.set(inners, { yPercent: 0 }); },
    });
  }

  /** Stepper: parts [{ c, on(step) → bool, at?: number | (step) → number }]. */
  function stepper(parts) {
    return function apply(step, animate, tl = gsap.timeline(), info = {}) {
      const anim = animate && !R;
      let outs = 0;
      for (const p of parts) if (!p.on(step) && p.c.shown) outs++;
      const base = anim && outs ? 0.32 : 0;
      for (const p of parts) {
        const want = !!p.on(step);
        const at = want ? base + (typeof p.at === 'function' ? p.at(step, info) : p.at || 0) : 0;
        tl.add(p.c.set({ visible: want }, { animate: anim }), anim ? at : 0);
      }
      return tl;
    };
  }

  /** Footer source line (chip + 'Outlet · date') in the footer band; swap per step with show(src). */
  function footer() {
    const sl = C.SourceLine.create({ kind: 'secondary', text: ' ', ground: g });
    place(sl.el, T.space.margin, T.space.footer.y);
    sl.el.style.maxWidth = `${1920 - 2 * T.space.margin}px`;
    owned.push(sl);
    let cur = null;
    return {
      c: sl,
      /** src: { kind, text } | null */
      show(src, animate, tl = gsap.timeline(), at = 0) {
        const anim = animate && !R;
        const key = src ? `${src.kind}|${src.text}` : null;
        if (!anim) {
          if (src) { sl.set({ text: src.text, kind: src.kind }, { animate: false }); sl.set({ visible: true }, { animate: false }); }
          else sl.set({ visible: false }, { animate: false });
          cur = key;
          return tl;
        }
        if (key === cur && (sl.shown || !src)) return tl;
        if (!src) { tl.add(sl.set({ visible: false }, { animate: true }), at); cur = null; return tl; }
        if (!sl.shown) {
          sl.set({ text: src.text, kind: src.kind }, { animate: false });
          gsap.set(sl.el, { autoAlpha: 0 });
          tl.add(sl.set({ visible: true }, { animate: true }), at + 0.35); // provenance arrives last
        } else {
          tl.add(sl.set({ text: src.text, kind: src.kind }, { animate: true }), at);
        }
        cur = key;
        return tl;
      },
    };
  }

  /** Act kicker text: 'Act II · What the frontier labs show'. */
  const actKicker = () => (ctx.act && ctx.act.n ? `Act ${ctx.act.n} · ${ctx.act.title}` : (ctx.act && ctx.act.title) || '');

  function reset() {
    gsap.killTweensOf(layer);
    gsap.set(layer, { autoAlpha: 1, y: 0 });
  }
  function exit() {
    const tl = gsap.timeline();
    if (R) return tl;
    tl.to(layer, { autoAlpha: 0, y: -12, duration: 0.45, ease: T.motion.calmOut.ease });
    return tl;
  }
  function dispose() {
    gsap.killTweensOf(layer);
    owned.forEach((c) => { try { c.destroy(); } catch { /* ignore */ } });
    root.replaceChildren();
  }

  return { R, g, G, T, C, root, layer, place, add, block, maskLines, stepper, footer, actKicker, reset, exit, dispose, owned, el, svgEl };
}

/** A scene module wrapper: build(ctx, K) returns { go(step, animate) → tl, update?, dispose? }. */
export function calmScene(id, build, extra = {}) {
  return {
    id,
    gl: false,
    ...extra,
    create(ctx) {
      const K = makeKit(ctx);
      const s = build(ctx, K);
      const steps = Math.max(1, (ctx.beat.steps || []).length);
      let current = 0;
      const inst = {
        steps,
        enter() {
          K.reset();
          current = 0;
          return s.go(0, true, { entering: true });
        },
        goto(step, { animate = true, direction = 1 } = {}) {
          K.reset();
          const prev = current;
          current = step;
          return s.go(step, animate, { prev, direction });
        },
        exit() { return s.exit ? s.exit() : K.exit(); },
        update(t, dt) { if (s.update) s.update(t, dt); },
        world: null,
        dispose() { if (s.dispose) s.dispose(); K.dispose(); },
      };
      if (s.background) inst.background = s.background;
      if (s.transition) inst.transition = s.transition;
      if (s.intercept) inst.intercept = s.intercept;
      return inst;
    },
  };
}
