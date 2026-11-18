// BarChart: bars for magnitude, one highlighted idea. d3-scale for geometry, gsap for growth.
// Marks follow the dataviz spec: bars anchored to a 2 px baseline, 4 px rounded data end, a gap
// between bars, values in Geist Mono at the bar end, labels in text colours (never the series colour).
// Optional threshold: a reference line (a ceiling, a bar to clear) the bars are read against.
// No hover layer: this is a stage, not a dashboard; every value is labelled instead.
//
// BarChart.create({ data: [{ id: 'fable', label: 'Claude Fable 5.2', value: 82, lab: 'anthropic' }, …],
//   orientation: 'vertical', colorMode: 'accent', highlight: 'fable', unit: '%',
//   threshold: { value: 100, label: "Epoch's bar for its own staff", tone: 'alert' }, ground: 'paper' })
import { scaleLinear, scaleBand } from 'd3-scale';
import { gsap, motion, root, esc, play, kill, T, withVisible } from './_core.js';

const LABS = ['anthropic', 'openai', 'google'];

/**
 * @param {object} o
 * @param {{id?:string,label:string,value:number,display?:string,lab?:string,note?:string}[]} o.data
 * @param {'horizontal'|'vertical'} [o.orientation='horizontal']
 * @param {'accent'|'lab'|'mono'} [o.colorMode='accent']  accent: highlight in accent, the rest quiet
 * @param {string|number|(string|number)[]} [o.highlight]  id(s) or index(es)
 * @param {number} [o.max]            domain max (default: largest of values and threshold)
 * @param {{value:number,label?:string,tone?:'alert'|'limit'|'fg'|'accent'|'verified'}} [o.threshold]
 * @param {string} [o.unit]           appended to value labels ('%', '×', ' h')
 * @param {(v:number)=>string} [o.format]
 * @param {number} [o.width]          default 10 columns (1381)
 * @param {number} [o.height]         vertical only: plot height (default 560)
 * @param {number} [o.labelWidth=440] horizontal only
 * @param {number} [o.rowHeight=96] @param {number} [o.barHeight=48]   horizontal only
 * @param {number} [o.barWidth=176]   vertical only
 * @param {'body'|'lead'|'label'} [o.labelRole]   default: body (horizontal), label (vertical)
 * @param {'label'|'lead'|'h2'} [o.valueRole]     default: label (horizontal), lead (vertical)
 * @param {'paper'|'void'} [o.ground]
 */
export function create(o = {}) {
  const vertical = o.orientation === 'vertical';
  const labelRole = o.labelRole || (vertical ? 'label' : 'body');
  const valueRole = o.valueRole || (vertical ? 'lead' : 'label');
  const width = o.width || T.spanW(10);
  const el = root(`itaf-barchart ${vertical ? 'is-vertical' : 'is-horizontal'} mode-${o.colorMode || 'accent'}`, { ...o, width });
  const fmt = o.format || ((v) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(v));
  let data = (o.data || []).map((d, i) => ({ ...d, id: d.id ?? String(i) }));
  let hl = new Set([].concat(o.highlight ?? []).map(String));
  let threshold = o.threshold || null;

  // geometry
  const labelW = o.labelWidth ?? 440;
  const rowH = o.rowHeight ?? 96;
  const barH = Math.min(o.barHeight ?? 48, rowH - 8);
  const valueRoom = 220;
  const plotH = o.height ?? 560;
  const barW = o.barWidth ?? 176;
  const len = scaleLinear().range([0, vertical ? plotH - 72 : width - labelW - valueRoom]); // 72: room for the value label above the tallest bar
  const band = scaleBand().range([0, width]).paddingInner(0.28).paddingOuter(0.14);
  const domainMax = () => o.max ?? Math.max(...data.map((d) => d.value), threshold ? threshold.value : 0, 0);

  const isHL = (d, i) => hl.has(d.id) || hl.has(String(i));
  const fill = (d, i) => {
    if (o.colorMode === 'lab' && LABS.includes(d.lab)) return `var(--g-lab-${d.lab})`;
    if (o.colorMode === 'mono') return 'var(--g-fg)';
    return isHL(d, i) ? 'var(--g-accent)' : 'var(--g-quiet)';
  };
  const valueText = (d) => esc(d.display ?? `${fmt(d.value)}${o.unit ?? ''}`);
  const thHTML = () => {
    if (!threshold) return '';
    const p = len(threshold.value).toFixed(1);
    const tone = threshold.tone || 'alert';
    return vertical
      ? `<div class="bc-th tone-${tone}" style="bottom:${p}px"><span class="bc-th-label t-label">${esc(threshold.label || '')}</span></div>`
      : `<div class="bc-th tone-${tone}" style="left:${(labelW + 2 + +p).toFixed(1)}px"><span class="bc-th-label t-label">${esc(threshold.label || '')}</span></div>`;
  };

  function render() {
    len.domain([0, domainMax() || 1]);
    el.style.setProperty('--bc-label-w', `${labelW}px`);
    el.style.setProperty('--bc-row-h', `${rowH}px`);
    el.style.setProperty('--bc-bar-h', `${barH}px`);
    el.style.setProperty('--bc-plot-h', `${plotH}px`);
    if (vertical) {
      band.domain(data.map((d) => d.id));
      const w = Math.min(barW, band.bandwidth());
      el.innerHTML =
        `<div class="bc-plot">${thHTML()}` +
        data.map((d, i) => {
          const cx = band(d.id) + band.bandwidth() / 2;
          const hgt = len(d.value);
          // Value inside the bar top when it fits (keeps clear of a threshold line above), else above it.
          const lineH = T.type[valueRole] ? T.type[valueRole].size * T.type[valueRole].line : 72;
          const inside = hgt >= lineH + 48; // contrast inside: see components.css (on-accent / on-quiet / ground colour on lab marks)
          const vb = inside ? hgt - 20 - lineH : hgt + 16;
          return `<div class="bc-col${isHL(d, i) ? ' is-hl' : ''}" data-id="${esc(d.id)}" style="left:${(cx - w / 2).toFixed(1)}px;width:${w.toFixed(1)}px">` +
            `<div class="bc-bar" style="height:${hgt.toFixed(1)}px;background:${fill(d, i)}"></div>` +
            `<div class="bc-value t-${valueRole} tnum${inside ? ' is-inside' : ''}" style="bottom:${vb.toFixed(1)}px">${valueText(d)}</div></div>`;
        }).join('') +
        `<div class="bc-base" aria-hidden="true"></div></div>` +
        `<div class="bc-xlabels">` +
        data.map((d, i) => {
          const cx = band(d.id) + band.bandwidth() / 2;
          return `<div class="bc-label t-${labelRole}${isHL(d, i) ? ' is-hl' : ''}" style="left:${(cx - band.step() / 2).toFixed(1)}px;width:${band.step().toFixed(1)}px">${esc(d.label)}${d.note ? `<span class="bc-note t-source">${esc(d.note)}</span>` : ''}</div>`;
        }).join('') + '</div>';
    } else {
      el.innerHTML =
        `<div class="bc-axis" aria-hidden="true"></div>${thHTML()}` +
        data.map((d, i) =>
          `<div class="bc-row${isHL(d, i) ? ' is-hl' : ''}" data-id="${esc(d.id)}">` +
          `<div class="bc-label t-${labelRole}">${esc(d.label)}${d.note ? `<span class="bc-note t-source">${esc(d.note)}</span>` : ''}</div>` +
          `<div class="bc-track"><div class="bc-bar" style="width:${len(d.value).toFixed(1)}px;background:${fill(d, i)}"></div>` +
          `<div class="bc-value t-${valueRole} tnum" style="left:${(len(d.value) + 20).toFixed(1)}px">${valueText(d)}</div></div></div>`).join('');
    }
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', data.map((d) => `${d.label}: ${d.display ?? fmt(d.value) + (o.unit ?? '')}`).join('; ') + (threshold ? `; ${threshold.label || 'threshold'}` : ''));
  }
  render();
  const all = (s) => [...el.querySelectorAll(s)];
  const marks = () => all('.bc-row, .bc-col');
  const bars = () => all('.bc-bar');
  const values = () => all('.bc-value');
  const labels = () => all('.bc-label');
  const axis = () => all('.bc-axis, .bc-base');
  const th = () => all('.bc-th');
  const grow = vertical ? 'scaleY' : 'scaleX';
  const origin = vertical ? '50% 100%' : '0 50%';

  const settle = () => {
    kill(el, marks(), bars(), values(), labels(), axis(), th());
    gsap.set(el, { autoAlpha: 1, y: 0 });
    gsap.set([...marks(), ...labels(), ...values(), ...th()], { autoAlpha: 1, x: 0, y: 0 });
    gsap.set(bars(), { scaleX: 1, scaleY: 1 });
    gsap.set(axis(), { scaleX: 1, scaleY: 1 });
    if (th().length) gsap.set(all('.bc-th-label'), { autoAlpha: 1, x: 0 });
  };

  const api = {
    el,
    in(tl, at) {
      return play(tl, at, (sub) => {
        settle();
        sub.fromTo(axis(), vertical ? { scaleX: 0 } : { scaleY: 0 }, { ...(vertical ? { scaleX: 1, transformOrigin: '0 50%' } : { scaleY: 1, transformOrigin: '50% 0' }), duration: motion.calmIn.dur * 0.7, ease: motion.eases.calm }, 0);
        sub.fromTo(labels(), { autoAlpha: 0, y: vertical ? 16 : 0, x: vertical ? 0 : -16 }, { autoAlpha: 1, x: 0, y: 0, duration: motion.calmIn.dur * 0.8, ease: motion.calmIn.ease, stagger: motion.stagger }, 0.1);
        if (th().length) {
          sub.fromTo(th(), vertical ? { scaleX: 0 } : { scaleY: 0 }, { ...(vertical ? { scaleX: 1, transformOrigin: '0 50%' } : { scaleY: 1, transformOrigin: '50% 0' }), duration: motion.calmIn.dur, ease: motion.eases.calm }, 0.15);
          sub.fromTo(all('.bc-th-label'), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: motion.micro.dur * 1.5, ease: motion.micro.ease }, 0.55);
        }
        sub.fromTo(bars(), { [grow]: 0 }, { [grow]: 1, transformOrigin: origin, duration: motion.roll.dur, ease: motion.roll.ease, stagger: motion.stagger * 1.5 }, 0.3);
        sub.fromTo(values(), { autoAlpha: 0, y: vertical ? 12 : 0, x: vertical ? 0 : -12 }, { autoAlpha: 1, x: 0, y: 0, duration: motion.micro.dur, ease: motion.micro.ease, stagger: motion.stagger * 1.5 }, 0.3 + motion.roll.dur * 0.5);
      }, settle);
    },
    out(tl, at) {
      return play(tl, at, (sub) => sub.to(el, { autoAlpha: 0, y: -12, duration: motion.calmOut.dur, ease: motion.calmOut.ease }), () => gsap.set(el, { autoAlpha: 0 }));
    },
    /** state: { highlight?, data? (same ids → bars re-grow from their old size), max?, threshold? } */
    set(state = {}, { animate = true } = {}) {
      const tl = gsap.timeline();
      const sizeOf = (b) => parseFloat(vertical ? b.style.height : b.style.width) || 0;
      const before = new Map(marks().map((r) => [r.dataset.id, sizeOf(r.querySelector('.bc-bar'))]));
      const hadTh = !!threshold;
      if (state.highlight !== undefined) hl = new Set([].concat(state.highlight ?? []).map(String));
      if (state.data) data = state.data.map((d, i) => ({ ...d, id: d.id ?? String(i) }));
      if (state.max !== undefined) o.max = state.max;
      if (state.threshold !== undefined) threshold = state.threshold;
      render();
      settle();
      if (!animate) return tl;
      marks().forEach((r, i) => {
        const bar = r.querySelector('.bc-bar');
        const now = sizeOf(bar);
        const old = before.get(r.dataset.id);
        if (old == null) tl.fromTo(bar, { [grow]: 0 }, { [grow]: 1, transformOrigin: origin, duration: motion.roll.dur, ease: motion.roll.ease }, i * 0.04);
        else if (now > 0 && Math.abs(old - now) > 0.5) tl.fromTo(bar, { [grow]: old / now }, { [grow]: 1, transformOrigin: origin, duration: motion.roll.dur, ease: motion.roll.ease }, i * 0.04);
      });
      if (threshold && !hadTh) tl.fromTo(th(), vertical ? { scaleX: 0 } : { scaleY: 0 }, { ...(vertical ? { scaleX: 1, transformOrigin: '0 50%' } : { scaleY: 1, transformOrigin: '50% 0' }), duration: motion.calmIn.dur, ease: motion.eases.calm }, 0);
      return tl;
    },
    destroy() { settle(); el.remove(); },
  };
  gsap.set(el, { autoAlpha: 0 });
  return withVisible(api, settle);
}

export default { create };
