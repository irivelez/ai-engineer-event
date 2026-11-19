const SCALE_MAX = 1000;
const PEAK_MW = 12056.8;
const GAP_MW = 6831;

function segment(value, max, style) {
  return `<span class="pf-segment pf-segment--${style}" style="width:${value / max * 100}%"></span>`;
}

function header(title, unit) {
  return `<div class="pf-header"><span>${title}</span><span class="pf-unit">${unit}</span></div>`;
}

function key(style, label) {
  return `<span class="pf-key"><i class="pf-swatch pf-segment--${style}"></i>${label}</span>`;
}

function scaleRow(label, status, value, segments, notes = '') {
  return `<div class="pf-scale-row">
    <div class="pf-scale-label"><div><span class="pf-period">${status}</span><strong>${label}</strong></div><b class="pf-total">${value}</b></div>
    <div class="pf-track">${segments}</div>
    ${notes ? `<div class="pf-keys">${notes}</div>` : ''}
  </div>`;
}

function scale() {
  const forecast = segment(1000, SCALE_MAX, 'copper');
  const countries = segment(667.8, SCALE_MAX, 'ink') + segment(306.5, SCALE_MAX, 'slate');
  const rows = [
    scaleRow('Data centers', '2025 · Estimate', '≈500', segment(500, SCALE_MAX, 'slate')),
    scaleRow('Data centers', '2030 · IEA stated policies', '1,000', forecast),
    scaleRow('Brazil + Mexico', '2025 · Final electricity use', '974.3', countries,
      key('ink', 'Brazil 667.8') + key('slate', 'Mexico 306.5'))
  ];
  return {
    summary: 'Annual electricity demand, on a common scale from zero to 1,000 TWh per year. Worldwide data centers used just under 500 TWh in 2025, rounded to 500 on the chart. The IEA projects 1,000 TWh in its Stated Policies Scenario for 2030. AI-optimized facilities drive about three-quarters of the increase. In 2025, Brazil used 667.8 TWh and Mexico used 306.5 TWh, a combined 974.3 TWh.',
    body: `${header('Annual electricity demand', 'TWh/year')}
      <div class="pf-scale-rows">${rows.join('')}</div>
      <div class="pf-axis"><span>0</span><span>250</span><span>500</span><span>750</span><span>1,000</span></div>`
  };
}

function capacity() {
  const gap = segment(GAP_MW, PEAK_MW, 'copper');
  const peak = segment(PEAK_MW, PEAK_MW, 'ink');
  return {
    summary: 'PJM’s 2028/29 capacity procurement gap of 6,831 megawatts is approximately 57 percent of the 12,056.8 megawatt peak demand recorded in Colombia’s interconnected system in 2025.',
    body: `${header('Capacity comparison', 'MW')}
      <div class="pf-ratio"><b>57<span>%</span></b><span class="pf-ratio-caption">of Colombia’s<br>2025 peak demand</span></div>
      <div class="pf-cap-rows">
        <div class="pf-cap-row">
          <div class="pf-cap-label"><strong>PJM procurement gap</strong><b>6,831</b></div>
          <div class="pf-cap-track">${gap}</div>
          <div class="pf-cap-note">2028/29 delivery year</div>
        </div>
        <div class="pf-cap-row">
          <div class="pf-cap-label"><strong>Colombia peak demand</strong><b>12,056.8</b></div>
          <div class="pf-cap-track">${peak}</div>
          <div class="pf-cap-note">2025 · Interconnected system</div>
        </div>
      </div>`
  };
}

function contract() {
  return {
    summary: 'Constellation and Microsoft signed a 20-year power agreement in September 2024. Grid rights transferred with regulator approval in June 2026. The 835 MW restart is a conditional target for 2027.',
    body: `${header('Constellation × Microsoft', 'Milestones')}
      <div class="pf-calendar">
        <div class="pf-event"><div class="pf-date"><span>September</span><b>2024</b></div><i class="pf-marker"></i><div class="pf-event-copy"><strong>20-year power agreement</strong><span>Signed</span></div></div>
        <div class="pf-event"><div class="pf-date"><span>June</span><b>2026</b></div><i class="pf-marker"></i><div class="pf-event-copy"><strong>Grid rights transferred</strong><span>Regulator approved</span></div></div>
        <div class="pf-event pf-event--target"><div class="pf-date"><span>Target year</span><b>2027</b></div><i class="pf-marker"></i><div class="pf-event-copy"><strong>835 MW restart</strong><span>Conditional target</span></div></div>
      </div>`
  };
}

const figures = new Map([['scale', scale], ['capacity', capacity], ['contract', contract]]);

export function mountFigure(container, id) {
  const render = figures.get(id);
  container.replaceChildren();
  if (!render) return;

  const { summary, body } = render();
  const figure = document.createElement('figure');
  figure.className = `pf-figure pf-figure--${id}`;
  figure.innerHTML = `<figcaption class="pf-sr">${summary}</figcaption><div class="pf-body" aria-hidden="true">${body}</div>`;
  container.append(figure);
}
