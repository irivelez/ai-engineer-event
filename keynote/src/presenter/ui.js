// Presenter window UI (#presenter). Interim version: state + keys; the full speaker tool replaces it.
import { createSync, readTimer, readLastState } from './sync.js';

export function mountPresenterUI(env) {
  const sync = createSync('presenter', { getPeer: () => window.opener });
  document.title = 'Presenter · ' + ((env.data && env.data.beats && env.data.beats.title) || '');
  document.body.style.background = '#0B0F14';
  document.body.style.color = '#F2F5FA';
  const pre = document.createElement('pre');
  pre.style.cssText = 'font: 20px/1.4 ui-monospace, Menlo, monospace; padding: 24px;';
  document.body.appendChild(pre);
  let state = readLastState();
  const render = () => { pre.textContent = JSON.stringify({ state, timer: readTimer() }, null, 2); };
  sync.on((msg) => { if (msg.type === 'state') { state = msg; render(); } });
  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(k)) { sync.send({ type: 'cmd', cmd: 'next' }); e.preventDefault(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { sync.send({ type: 'cmd', cmd: 'prev' }); e.preventDefault(); }
    else if (k === 't' || k === 'T') sync.send({ type: 'cmd', cmd: 'timer', action: 'toggle' });
  });
  sync.send({ type: 'cmd', cmd: 'hello' });
  render();
}
