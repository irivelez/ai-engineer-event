// Fallback for GL moments when WebGL is unavailable or lost twice: shows the pre-rendered static frame
// static/frames/NN-<id>-S.webp for each step (scripts/render-static.mjs), or the beat's brief if missing.
export default {
  id: '_static',
  gl: false,
  create(ctx) {
    const { root, beat } = ctx;
    const steps = Math.max(1, (beat.steps || []).length);
    const nn = String(beat.n || ctx.index + 1).padStart(2, '0');
    const img = document.createElement('img');
    img.className = 'static-frame';
    img.alt = '';
    const note = document.createElement('div');
    note.className = 'static-missing';
    note.textContent = beat.brief || beat.id;
    note.style.display = 'none';
    img.addEventListener('error', () => { img.style.display = 'none'; note.style.display = ''; });
    img.addEventListener('load', () => { img.style.display = ''; note.style.display = 'none'; });
    root.append(img, note);
    const known = new Set(ctx.frames || []);
    const show = (s) => {
      const f = `static/frames/${nn}-${beat.id}-${s}.webp`;
      if (known.has(f)) img.src = f;
      else { img.removeAttribute('src'); img.style.display = 'none'; note.style.display = ''; }
    };
    return {
      steps,
      enter() { show(0); return null; },
      goto(s) { show(s); return null; },
      exit() { return null; },
      dispose() { root.replaceChildren(); },
    };
  },
};
