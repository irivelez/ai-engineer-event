// Audience-window overlays: blackout / whiteout (window level), overview grid (G), help (?),
// the "go to moment n" chip (number + Enter) and the ?fps=1 frame-time HUD.
import { gsap } from 'gsap';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

export const HELP = [
  ['→ ↓ Space PageDown Enter, click', 'next'],
  ['← ↑ PageUp Backspace', 'previous'],
  ['Home / End', 'first / last moment'],
  ['number + Enter', 'go to moment n'],
  ['G', 'overview grid'],
  ['F (or clicker F5)', 'fullscreen'],
  ['B or .', 'blackout'],
  ['W or ,', 'whiteout'],
  ['P', 'open presenter window'],
  ['N', 'notes overlay'],
  ['T', 'start / reset timer'],
  ['H', 'show / hide cue icon'],
  ['M', 'evidence video sound on / off'],
  ['?', 'this help'],
];

export function createOverlays({ stage, director, tokens, params }) {
  const fam = (tokens && tokens.type && tokens.type.families) || {};
  const sans = fam.sans || 'system-ui, sans-serif';
  const mono = fam.mono || 'ui-monospace, monospace';

  // ----- blackout / whiteout -----
  const curtain = el('div', 'curtain');
  stage.windowOverlay.appendChild(curtain);
  let curtainMode = null;
  function setCurtain(mode) {
    curtainMode = curtainMode === mode ? null : mode;
    if (curtainMode) curtain.style.backgroundColor = curtainMode === 'black' ? '#000000' : '#FFFFFF';
    gsap.to(curtain, { autoAlpha: curtainMode ? 1 : 0, duration: 0.35, ease: 'power1.inOut', overwrite: true });
    return curtainMode;
  }

  // ----- jump chip -----
  const chip = el('div', 'jump-chip');
  chip.style.fontFamily = mono;
  stage.overlay.appendChild(chip);
  let digits = '';
  function setDigits(d) {
    digits = d;
    const n = parseInt(digits, 10);
    const m = Number.isFinite(n) ? director.moments.find((x) => x.n === n) || director.moments[n - 1] : null;
    chip.textContent = digits ? `→ ${digits}${m ? `  ${m.id}` : ''}` : '';
    gsap.to(chip, { autoAlpha: digits ? 1 : 0, duration: 0.15, overwrite: true });
  }

  // ----- help -----
  const help = el('div', 'overlay-panel help-panel');
  help.style.fontFamily = sans;
  help.appendChild(el('div', 'panel-title', 'Keys'));
  const list = el('div', 'help-list');
  for (const [k, v] of HELP) {
    const row = el('div', 'help-row');
    const kk = el('span', 'help-key', k);
    kk.style.fontFamily = mono;
    row.append(kk, el('span', 'help-val', v));
    list.appendChild(row);
  }
  help.appendChild(list);
  stage.overlay.appendChild(help);

  // ----- overview grid -----
  const grid = el('div', 'overlay-panel grid-panel');
  grid.style.fontFamily = sans;
  stage.overlay.appendChild(grid);
  let gridSel = 0;
  function buildGrid() {
    grid.replaceChildren();
    const g = (tokens && tokens.grounds) || {};
    const cur = director.current ? director.current.i : 0;
    director.moments.forEach((m, i) => {
      const card = el('button', 'grid-card');
      card.type = 'button';
      card.dataset.i = String(i);
      const gr = g[m.ground] || {};
      card.style.backgroundColor = gr.bg || (m.ground === 'paper' ? '#fff' : '#05070A');
      card.style.color = gr.fg || (m.ground === 'paper' ? '#0B0F14' : '#F2F5FA');
      const num = el('span', 'grid-num', String(m.n || i + 1).padStart(2, '0'));
      num.style.fontFamily = mono;
      card.append(num, el('span', 'grid-id', m.id), el('span', 'grid-meta', `${m.act} · ${m.mode} · ${m.plannedSec}s`));
      if (i === cur) card.classList.add('is-current');
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        close();
        director.goto(i, 0);
      });
      grid.appendChild(card);
    });
    gridSel = cur;
    markSel();
  }
  function markSel() {
    [...grid.children].forEach((c, i) => c.classList.toggle('is-selected', i === gridSel));
  }

  // ----- open/close -----
  let open = null; // 'grid' | 'help'
  function show(name) {
    if (open === name) return close();
    close();
    open = name;
    const p = name === 'grid' ? grid : help;
    if (name === 'grid') buildGrid();
    gsap.to(p, { autoAlpha: 1, duration: 0.2, overwrite: true });
  }
  function close() {
    if (!open) return false;
    const p = open === 'grid' ? grid : help;
    open = null;
    gsap.to(p, { autoAlpha: 0, duration: 0.15, overwrite: true });
    return true;
  }
  function gridKey(key) {
    if (open !== 'grid') return false;
    const cols = 9;
    const n = director.moments.length;
    if (key === 'ArrowRight') gridSel = Math.min(n - 1, gridSel + 1);
    else if (key === 'ArrowLeft') gridSel = Math.max(0, gridSel - 1);
    else if (key === 'ArrowDown') gridSel = Math.min(n - 1, gridSel + cols);
    else if (key === 'ArrowUp') gridSel = Math.max(0, gridSel - cols);
    else if (key === 'Enter' || key === ' ') {
      const i = gridSel;
      close();
      director.goto(i, 0);
      return true;
    } else return false;
    markSel();
    return true;
  }

  // ----- fps HUD -----
  let fpsEl = null;
  if (params.fps) {
    fpsEl = el('div', 'fps-hud');
    stage.windowOverlay.appendChild(fpsEl);
    const samples = [];
    let last = performance.now();
    let acc = 0;
    gsap.ticker.add(() => {
      const now = performance.now();
      samples.push(now - last);
      last = now;
      if (samples.length > 240) samples.shift();
      acc += 1;
      if (acc % 15) return;
      const sorted = [...samples].sort((a, b) => a - b);
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      const st = director.state() || {};
      const gl = window.__itaf && window.__itaf.glInfo ? window.__itaf.glInfo() : null;
      fpsEl.textContent = `${(1000 / mean).toFixed(0)} fps · p95 ${p95.toFixed(1)} ms · ${st.momentId || ''} ${st.step != null ? st.step + 1 : ''}/${st.steps || ''}${gl ? ` · GL ${gl.active ? 'on' : 'idle'} pr ${gl.pixelRatio}` : ''}`;
    });
  }

  gsap.set([curtain, chip, help, grid], { autoAlpha: 0 });
  return {
    setCurtain, show, close, gridKey,
    get open() { return open; },
    get curtain() { return curtainMode; },
    get digits() { return digits; },
    setDigits,
  };
}
