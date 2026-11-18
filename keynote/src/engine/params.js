// URL params (docs/engine-spec.md "Director"). Steps in ?s= are 0-based; ?m= takes an id or a 1-based number.
export function readParams(search = location.search) {
  const q = new URLSearchParams(search);
  const num = (k, d) => {
    const v = parseFloat(q.get(k));
    return Number.isFinite(v) ? v : d;
  };
  const list = (k) => (q.get(k) || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    m: q.get('m'),                       // start moment: id or 1-based number
    s: Math.max(0, parseInt(q.get('s') || '0', 10) || 0), // start step (0-based)
    render: q.get('render') === '1',     // deterministic static mode (screenshots)
    auto: q.get('auto') === '1',         // auto-advance by plannedSec (animatic)
    speed: Math.max(0.01, num('speed', 1)),
    fps: q.get('fps') === '1',           // frame-time HUD
    only: list('only'),                  // runtime moment filter (dev)
    novideo: q.get('novideo') === '1',   // QA: force the opener's typographic fallback
    nogl: q.get('nogl') === '1',         // QA: pretend WebGL failed (static-frame fallback)
    hud: q.get('hud') !== '0',           // cue icon visible at start
  };
}
