// Shared plumbing for the DOM component kit (owner: DD).
// Every component: create(opts) → { el, in(tl?, at?), out(tl?, at?), set(state, { animate }), destroy() }.
// in/out/set return a gsap timeline (the one you passed, or a new one). In render mode they settle
// instantly and deterministically, so goto(step, { animate:false }) and static frames are exact.

import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import * as T from '../design/tokens.js';

gsap.registerPlugin(SplitText);

export { gsap, SplitText, T };
export const { motion, type, space, grounds, colors, provenance } = T;

let renderFlag = null;
/** The engine calls this once with ctx.renderMode; otherwise ?render=1 is read from the URL. */
export function setRenderMode(on) { renderFlag = !!on; }
export function isRender() {
  if (renderFlag !== null) return renderFlag;
  try { return new URLSearchParams(window.location.search).get('render') === '1'; } catch (e) { return false; }
}

export function groundName(g) { return g === 'paper' ? 'paper' : 'void'; }

/** Create an element: h('div', 'a b', { text: '…' } | { html: '…' } | children[]) */
export function h(tag, cls, content) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (content == null) return el;
  if (Array.isArray(content)) content.forEach((c) => c && el.appendChild(c));
  else if (typeof content === 'object' && 'html' in content) el.innerHTML = content.html;
  else if (typeof content === 'object' && 'text' in content) el.textContent = content.text;
  else el.textContent = String(content);
  return el;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** Escape `text` and wrap the first occurrence of `highlight` (string or array) in an accent span. */
export function markup(text, highlight) {
  let out = esc(text);
  const list = highlight == null ? [] : Array.isArray(highlight) ? highlight : [highlight];
  for (const hl of list) {
    const e = esc(hl);
    const i = out.indexOf(e);
    if (e && i >= 0) out = out.slice(0, i) + `<span class="itaf-hl">${e}</span>` + out.slice(i + e.length);
  }
  return out;
}

/** Root element of a component, scoped to a ground so --g-* colours are right on either world. */
export function root(cls, opts = {}) {
  const el = h(opts.tag || 'div', `${cls} ground-${groundName(opts.ground)}${opts.className ? ' ' + opts.className : ''}`);
  if (opts.style) Object.assign(el.style, opts.style);
  if (opts.width) el.style.width = typeof opts.width === 'number' ? `${opts.width}px` : opts.width;
  return el;
}

/**
 * Attach a sub-timeline built by `build(sub)` to `tl` at `at` (default: end of tl).
 * In render mode `settle()` runs instead and nothing animates.
 */
export function play(tl, at, build, settle) {
  const parent = tl || gsap.timeline();
  if (isRender()) {
    settle();
    return parent;
  }
  const sub = gsap.timeline();
  build(sub);
  parent.add(sub, at);
  return parent;
}

/** Shared calm reveal for simple blocks: rise 24 px + fade. */
export function riseIn(sub, targets, { dur = motion.calmIn.dur, ease = motion.calmIn.ease, stagger = motion.stagger, y = 24, at = 0 } = {}) {
  sub.fromTo(targets, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration: dur, ease, stagger }, at);
}

/** Shared calm exit: lift 12 px + fade, power2.in 0.5 s. */
export function liftOut(sub, targets, { at = 0, stagger = 0.04 } = {}) {
  sub.to(targets, { autoAlpha: 0, y: -12, duration: motion.calmOut.dur, ease: motion.calmOut.ease, stagger }, at);
}

/**
 * Split an element into masked lines EXACTLY as the browser laid them out (text-wrap: balance and
 * pretty included). gsap SplitText wraps words in inline-blocks, which re-flows balanced text into
 * different (and overflowing) lines, so render mode and the animated end state would disagree.
 * Here each word becomes a plain inline span (no re-flow), lines are read from the words' tops,
 * then rebuilt as nowrap lines inside overflow-clip masks. Supports one level of inline wrappers
 * (e.g. <span class="itaf-hl">). Returns { lines, masks, revert() } or null for empty text.
 */
export function splitLines(el, linesClass = 'itaf-line') {
  if (!el.textContent.trim() || !el.isConnected) return null;
  // Lines measured in a fallback font would be wrong forever (they are frozen as nowrap), so only
  // split once the real face is decoded; callers fall back to a block rise (riseIn) otherwise.
  const cs = getComputedStyle(el);
  const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  try {
    if (document.fonts && !document.fonts.check(font, el.textContent.trim().slice(0, 12))) { document.fonts.load(font); return null; }
  } catch (e) { /* invalid font string: measure anyway */ }
  const original = el.innerHTML;
  // 1. wrap words in inline spans, remembering the inline wrapper each word sat in
  const words = [];
  const walk = (node, wrapper) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const s = document.createElement('span');
          s.textContent = p;
          words.push({ s, wrapper });
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        walk(n, wrapper || n);
      }
    });
  };
  walk(el, null);
  // 2. group words by line (same top within 4 px)
  const groups = [];
  let lastTop = null;
  words.forEach((w) => {
    const top = w.s.getBoundingClientRect().top;
    if (lastTop === null || Math.abs(top - lastTop) > 4) { groups.push([]); lastTop = top; }
    groups[groups.length - 1].push(w);
  });
  // 3. rebuild as masked, nowrap lines
  el.innerHTML = '';
  const lines = [];
  const masks = [];
  groups.forEach((g) => {
    const mask = document.createElement('div');
    mask.className = `${linesClass}-mask`;
    mask.style.overflow = 'clip';
    const line = document.createElement('div');
    line.className = linesClass;
    line.style.whiteSpace = 'nowrap';
    g.forEach((w, i) => {
      if (i) line.appendChild(document.createTextNode(' '));
      if (w.wrapper) {
        const wrap = w.wrapper.cloneNode(false);
        wrap.textContent = w.s.textContent;
        line.appendChild(wrap);
      } else line.appendChild(document.createTextNode(w.s.textContent));
    });
    mask.appendChild(line);
    el.appendChild(mask);
    lines.push(line);
    masks.push(mask);
  });
  return { lines, masks, revert() { el.innerHTML = original; } };
}

/** Line-mask reveal (DevDay): each line rises out of its own mask. */
export function linesIn(sub, lines, { dur = motion.calmIn.dur, ease = motion.calmIn.ease, stagger = motion.stagger, at = 0 } = {}) {
  sub.fromTo(lines, { yPercent: 130 }, { yPercent: 0, duration: dur, ease, stagger }, at);
}

export function kill(...targets) { targets.flat().forEach((t) => t && gsap.killTweensOf(t)); }
