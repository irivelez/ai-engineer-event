// Keyboard + clicker + stage click. Clickers send PageUp/PageDown/B/period/F5/Esc.
export function bindKeys({ director, overlays, hud, audience, stage, openPresenter }) {
  let focusAt = 0;
  window.addEventListener('focus', () => { focusAt = performance.now(); });

  function toggleFullscreen() {
    const d = document;
    const fs = d.fullscreenElement || d.webkitFullscreenElement;
    if (fs) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else {
      const r = d.documentElement;
      const req = r.requestFullscreen || r.webkitRequestFullscreen;
      if (req) Promise.resolve(req.call(r)).catch(() => {});
    }
  }

  // handle(key, event?) is also called for keys pressed in the presenter window (remote: no event).
  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    handle(e.key, e);
  }
  function handle(k, ev) {
    const e = ev || { repeat: false, preventDefault() {} };
    // overlays first
    if (overlays.open === 'grid' && overlays.gridKey(k)) return e.preventDefault();
    if (k === 'Escape') {
      overlays.setDigits('');
      if (!overlays.close()) audience.closeNotes();
      return;
    }
    // number + Enter
    if (/^[0-9]$/.test(k)) {
      overlays.setDigits((overlays.digits + k).slice(-2));
      return e.preventDefault();
    }
    if (overlays.digits) {
      if (k === 'Enter') {
        const n = parseInt(overlays.digits, 10);
        overlays.setDigits('');
        if (Number.isFinite(n)) director.goto(String(n), 0);
        return e.preventDefault();
      }
      if (k === 'Backspace') {
        overlays.setDigits(overlays.digits.slice(0, -1));
        return e.preventDefault();
      }
    }
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'Spacebar': case 'PageDown': case 'Enter':
        if (e.repeat && k !== 'ArrowRight' && k !== 'ArrowDown') return e.preventDefault();
        overlays.close();
        director.next();
        return e.preventDefault();
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        overlays.close();
        director.prev();
        return e.preventDefault();
      case 'Home':
        director.goto(0, 0);
        return e.preventDefault();
      case 'End':
        director.goto(director.moments.length - 1, 0);
        return e.preventDefault();
      case 'g': case 'G':
        overlays.show('grid');
        return e.preventDefault();
      case '?': case '/':
        overlays.show('help');
        return e.preventDefault();
      case 'f': case 'F': case 'F5':
        toggleFullscreen();
        return e.preventDefault();
      case 'b': case 'B': case '.':
        overlays.setCurtain('black');
        return e.preventDefault();
      case 'w': case 'W': case ',':
        overlays.setCurtain('white');
        return e.preventDefault();
      case 'p': case 'P':
        openPresenter();
        return e.preventDefault();
      case 'n': case 'N':
        audience.toggleNotes();
        return e.preventDefault();
      case 't': case 'T':
        audience.startOrResetTimer();
        return e.preventDefault();
      case 'h': case 'H':
        hud.toggle();
        return e.preventDefault();
      default:
    }
  }
  window.addEventListener('keydown', onKey);
  if (audience && audience.setKeyHandler) audience.setKeyHandler((k) => { if (k !== 'f' && k !== 'F' && k !== 'F5' && k !== 'p' && k !== 'P') handle(k); });

  function onClick(e) {
    if (e.button !== 0) return;
    if (performance.now() - focusAt < 350) return; // a click that only focused the window
    if (e.target.closest('button, a, input, .overlay-panel, .notes-overlay')) return;
    if (overlays.open) return overlays.close();
    director.next();
  }
  stage.el.addEventListener('click', onClick);
  return { handle, dispose() { window.removeEventListener('keydown', onKey); stage.el.removeEventListener('click', onClick); } };
}
