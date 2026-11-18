// BigNumber: odometer digit roll on tabular figures, unit beside, label below, provenance under it.
// Every digit column travels the same 4 cells upward and lands (left digits first): calm, legible
// at Zoom's 15–30 fps, and never a spinning blur.
// BigNumber.create({ value: 2840, unit: 'tokens / s', label: 'Fastest public endpoint', kind: 'independent',
//                    source: 'Artificial Analysis · 17 Nov 2026', ground: 'void' })
import { gsap, motion, root, esc, play, kill } from './_core.js';
import { chipHTML } from './ProvenanceChip.js';

const TRAVEL = 4; // cells each column rolls on entry

function formatValue(o) {
  if (o.display != null) return String(o.display);
  const d = o.decimals ?? 0;
  const n = new Intl.NumberFormat(o.locale || 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(o.value ?? 0);
  return `${o.prefix ?? ''}${n}${o.suffix ?? ''}`;
}

function figureHTML(str) {
  let html = '';
  for (const ch of str) {
    if (ch >= '0' && ch <= '9') {
      const cells = Array.from({ length: 20 }, (_, i) => `<span>${i % 10}</span>`).join('');
      html += `<span class="bn-col" data-d="${ch}" aria-hidden="true"><span class="bn-strip">${cells}</span></span>`;
    } else {
      html += `<span class="bn-static" aria-hidden="true">${esc(ch)}</span>`;
    }
  }
  return html;
}

/**
 * @param {object} o
 * @param {number} [o.value]          numeric value (formatted en-US with `decimals`)
 * @param {string} [o.display]        exact string instead, e.g. '1.2B', '34×', '$0.40' (digits roll, the rest is static)
 * @param {number} [o.decimals=0]
 * @param {string} [o.prefix] @param {string} [o.suffix]
 * @param {string} [o.unit]           smaller words beside the figure, e.g. 'hours'
 * @param {string} [o.label]          one line under the figure
 * @param {string} [o.kind]           provenance kind (chip)
 * @param {string} [o.source]         'Outlet · date'
 * @param {'display'|'mega'|'h1'} [o.size='display']
 * @param {'fg'|'accent'} [o.tone='fg']
 * @param {'left'|'center'} [o.align='left']
 * @param {'paper'|'void'} [o.ground]
 */
export function create(o = {}) {
  const size = o.size || 'display';
  const el = root(`itaf-bignum size-${size} tone-${o.tone || 'fg'}${o.align === 'center' ? ' is-center' : ''}`, o);
  let str = formatValue(o);
  el.innerHTML =
    `<div class="bn-head"><div class="bn-figure t-${size} tnum" role="img" aria-label="${esc(str)}">${figureHTML(str)}</div>` +
    (o.unit ? `<div class="bn-unit t-lead">${esc(o.unit)}</div>` : '') + '</div>' +
    (o.label ? `<p class="bn-label t-lead balance">${esc(o.label)}</p>` : '') +
    (o.kind || o.source ? `<div class="bn-meta">${o.kind ? chipHTML(o.kind) : ''}${o.source ? `<span class="t-source">${esc(o.source)}</span>` : ''}</div>` : '');
  const fig = el.querySelector('.bn-figure');
  const q = (s) => el.querySelector(s);
  const cols = () => [...fig.querySelectorAll('.bn-col')];
  const statics = () => [...fig.querySelectorAll('.bn-static')];
  // strip has 20 cells (0–9 twice); each cell is 5 % of the strip
  const cellY = (cell) => -cell * 5;
  const parts = () => [q('.bn-unit'), q('.bn-label'), q('.bn-meta')].filter(Boolean);

  const settle = () => {
    kill(el, fig, cols().map((c) => c.firstElementChild), statics(), parts());
    gsap.set([el, fig, ...statics(), ...parts()], { autoAlpha: 1, y: 0 });
    cols().forEach((c) => gsap.set(c.firstElementChild, { yPercent: cellY(+c.dataset.d + 10) }));
  };

  const rollIn = (sub, at = 0) => {
    cols().forEach((c, i) => {
      const d = +c.dataset.d;
      sub.fromTo(c.firstElementChild, { yPercent: cellY(d + 10 - TRAVEL) }, { yPercent: cellY(d + 10), duration: motion.roll.dur, ease: motion.roll.ease }, at + i * 0.05);
    });
  };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        settle();
        sub.fromTo(fig, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: motion.eases.calm }, 0);
        rollIn(sub, 0);
        const p = parts();
        if (p.length) sub.fromTo(p, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: motion.calmIn.dur, ease: motion.calmIn.ease, stagger: 0.12 }, 0.35);
      }, settle);
    },
    out(tl, at) {
      return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, y: -12, duration: motion.calmOut.dur, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 }));
    },
    /** state: { value? | display?, label?, source?, kind? } — digits roll upward from the old value. */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      const next = formatValue({ ...o, ...state, display: state.display ?? (state.value != null ? undefined : o.display) });
      if (state.label != null && q('.bn-label')) q('.bn-label').textContent = state.label;
      if (state.source != null && q('.bn-meta .t-source')) q('.bn-meta .t-source').textContent = state.source;
      if (next === str) return tl;
      const oldCols = cols();
      const sameShape = next.replace(/\d/g, '0') === str.replace(/\d/g, '0');
      str = next;
      fig.setAttribute('aria-label', next);
      if (!sameShape || !animate) {
        fig.innerHTML = figureHTML(next);
        if (!animate) { settle(); return tl; }
        rollIn(tl, 0);
        return tl;
      }
      const digits = [...next].filter((c) => c >= '0' && c <= '9');
      oldCols.forEach((c, i) => {
        const from = +c.dataset.d;
        const to = +digits[i];
        c.dataset.d = to;
        if (from === to) return;
        const target = to > from ? to : to + 10;
        tl.fromTo(c.firstElementChild, { yPercent: cellY(from) }, { yPercent: cellY(target), duration: motion.roll.dur, ease: motion.roll.ease }, i * 0.04);
        tl.set(c.firstElementChild, { yPercent: cellY(to + 10) });
      });
      return tl;
    },
    destroy() { settle(); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return api;
}

export default { create };
