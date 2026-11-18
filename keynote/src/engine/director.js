// Director: navigation, scene lifecycle (lazy create + idle preload + eviction), cross-moment transitions,
// the per-frame loop (scene update() + GL render of the visible world) and state events.
//
// Events (director.on(name, fn)):
//   change   { momentId, momentIndex, number, step, steps, total, ground, icon, at }  on every state change
//   advance  { from, to, direction }  when leaving a moment through next()/prev()
//   settled  state                    when no transition or step animation is running
import { gsap } from 'gsap';
import { pickTransition, runTransition } from './transitions.js';

const isTl = (x) => x && typeof x.progress === 'function' && typeof x.duration === 'function';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 120));
const cancelIdle = (h) => { if (h == null) return; if (window.cancelIdleCallback) window.cancelIdleCallback(h); else clearTimeout(h); };

export function createDirector(env) {
  const { stage, moments, scenes, placeholder, staticScene, makeCtx, hud, params, tokens, getGL } = env;
  const N = moments.length;
  const recs = new Map();
  const grounds = (tokens && tokens.grounds) || {};
  let cur = null;
  let step = 0;
  let trans = null;       // { tl, from, to }
  let stepTl = null;
  let z = 1;
  let glOwner = null;     // rec whose wrapper holds the GL canvas
  let autoCall = null;
  let idleHandle = null;
  const events = new Map();

  const on = (name, fn) => {
    if (!events.has(name)) events.set(name, new Set());
    events.get(name).add(fn);
    return () => events.get(name).delete(fn);
  };
  const emit = (name, payload) => {
    for (const fn of events.get(name) || []) {
      try { fn(payload); } catch (e) { console.error(`[itaf] ${name} listener failed:`, e); }
    }
  };
  const groundOf = (m) => grounds[m.ground] || (m.ground === 'paper' ? { bg: '#FFFFFF', fg: '#0B0F14', muted: '#4A5361' } : { bg: '#05070A', fg: '#F2F5FA', muted: '#9AA4B2' });
  const safe = (rec, what, fn) => {
    try { return fn(); } catch (e) { console.error(`[itaf] scene "${rec.id}" failed in ${what}():`, e); return null; }
  };

  // ---------- lifecycle ----------
  function create(i) {
    const m = moments[i];
    if (recs.has(m.id)) return recs.get(m.id);
    let mod = scenes[m.id] || placeholder;
    const g = groundOf(m);
    const wrapper = document.createElement('div');
    wrapper.className = 'moment';
    wrapper.dataset.id = m.id;
    wrapper.dataset.ground = m.ground;
    wrapper.style.backgroundColor = g.bg;
    wrapper.style.color = g.fg;
    wrapper.style.visibility = 'hidden';
    const root = document.createElement('div');
    root.className = 'scene-root';
    wrapper.appendChild(root);
    stage.moments.appendChild(wrapper);
    let gl = null;
    if (mod.gl) {
      gl = getGL(true);
      if (!gl) mod = staticScene;
    }
    let inst = null;
    try {
      inst = mod.create(makeCtx(m, i, root, gl ? gl.api : null));
      if (!inst || typeof inst !== 'object') throw new Error('create() must return an object');
    } catch (err) {
      console.error(`[itaf] scene "${m.id}" failed in create():`, err);
      root.replaceChildren();
      mod = placeholder;
      gl = null;
      inst = placeholder.create(makeCtx(m, i, root, null, { error: err }));
    }
    const steps = Math.max(1, (inst.steps | 0) || (m.steps || []).length || 1);
    const bg = inst.background || g.bg;
    wrapper.style.backgroundColor = bg;
    const rec = { id: m.id, i, m, mod, inst, wrapper, root, steps, bg, gl: !!(gl && mod.gl), freeze: null, updateFailed: false };
    recs.set(m.id, rec);
    if (rec.gl && inst.world && gl.precompile) safe(rec, 'precompile', () => gl.precompile(inst.world));
    return rec;
  }

  function dispose(rec) {
    if (rec === cur || (trans && (rec === trans.from || rec === trans.to))) return;
    if (glOwner === rec) glOwner = null;
    gsap.killTweensOf(rec.wrapper);
    safe(rec, 'dispose', () => rec.inst.dispose && rec.inst.dispose());
    rec.wrapper.remove();
    recs.delete(rec.id);
  }

  function attachGL(rec) {
    const gl = getGL(false);
    if (!gl || !rec.gl) return;
    if (glOwner === rec) return gl.setWorld(rec.inst.world);
    if (glOwner && glOwner.wrapper.isConnected && glOwner.wrapper.style.visibility !== 'hidden' && glOwner.inst.world) {
      // GL → GL: freeze the outgoing world's last frame in its own wrapper, then hand the canvas over.
      const snap = gl.snapshot(glOwner.inst.world);
      if (snap) {
        snap.classList.add('gl-freeze');
        glOwner.wrapper.insertBefore(snap, glOwner.wrapper.firstChild);
        glOwner.freeze = snap;
      }
    }
    rec.wrapper.insertBefore(gl.canvas, rec.wrapper.firstChild);
    glOwner = rec;
    gl.setWorld(rec.inst.world);
  }

  // ---------- frame loop ----------
  function visibleRecs() {
    const out = [];
    if (cur) out.push(cur);
    if (trans && trans.from && trans.from !== cur) out.push(trans.from);
    return out;
  }
  function tick(time, deltaTime) {
    if (params.render) return;
    const dt = Math.min(deltaTime / 1000, 0.1);
    const vis = visibleRecs();
    for (const r of vis) {
      if (!r.inst.update || r.updateFailed || r.freeze) continue;
      try { r.inst.update(time, dt); } catch (e) {
        r.updateFailed = true;
        console.error(`[itaf] scene "${r.id}" failed in update(); updates stopped for this scene:`, e);
      }
    }
    const gl = getGL(false);
    if (gl && glOwner && !glOwner.freeze && vis.includes(glOwner) && glOwner.inst.world && !document.hidden) gl.render(glOwner.inst.world, dt);
  }
  gsap.ticker.add(tick);

  // ---------- state ----------
  function state() {
    if (!cur) return null;
    return {
      momentId: cur.id, momentIndex: cur.i, number: cur.m.n || cur.i + 1, step, steps: cur.steps, total: N,
      ground: cur.m.ground, icon: cur.m.icon || null, act: cur.m.act, at: Date.now(),
    };
  }
  const emitChange = () => emit('change', state());

  function settled() {
    return !trans && !stepTl;
  }
  function onSettle() {
    if (!settled()) return;
    emit('settled', state());
    schedulePreload();
    scheduleAuto();
  }

  function schedulePreload() {
    if (params.render || !cur) return;
    cancelIdle(idleHandle);
    const want = [cur.i + 1, cur.i + 2, cur.i - 1].filter((i) => i >= 0 && i < N);
    const work = () => {
      idleHandle = null;
      if (!settled()) { idleHandle = idle(work); return; }
      const i = want.find((k) => !recs.has(moments[k].id));
      if (i == null) return evict();
      create(i);
      idleHandle = idle(work);
    };
    idleHandle = idle(work);
  }
  function evict() {
    if (!cur) return;
    const keep = new Set([cur.i - 1, cur.i, cur.i + 1, cur.i + 2]);
    for (const r of [...recs.values()]) if (!keep.has(r.i)) dispose(r);
  }

  function scheduleAuto() {
    if (!params.auto || params.render || !cur) return;
    if (autoCall) autoCall.kill();
    if (cur.i === N - 1 && step === cur.steps - 1) return;
    const sec = Math.max(0.4, (cur.m.plannedSec || 60) / cur.steps / params.speed);
    autoCall = gsap.delayedCall(sec, () => next());
  }

  // ---------- navigation ----------
  function finishRunning() {
    if (trans) trans.tl.progress(1);
    if (stepTl) stepTl.progress(1);
  }

  function show(i, s = 0, { direction = 1, jump = false, instant = false } = {}) {
    i = clamp(i | 0, 0, N - 1);
    finishRunning();
    const from = cur;
    const to = create(i);
    s = clamp(s | 0, 0, to.steps - 1);
    if (from === to) return gotoStep(s, { animate: !instant, direction });
    const quick = instant || params.render;
    const tr = pickTransition({ from, to, direction, jump, renderMode: quick, tokens });

    cur = to;
    step = s;
    to.wrapper.style.zIndex = String(++z);
    gsap.set(to.wrapper, { visibility: 'visible', opacity: 1, clipPath: 'none' });
    to.root.style.visibility = '';
    attachGL(to);

    const tl = gsap.timeline({ paused: true });
    const exitTl = from ? safe(from, 'exit', () => from.inst.exit && from.inst.exit({ to: to.id, direction })) : null;
    const enterTl = safe(to, 'enter', () => to.inst.enter && to.inst.enter({ from: from ? from.id : null, direction }));
    const settleNow = quick || direction < 0 || s > 0;
    if (settleNow) {
      if (isTl(enterTl)) enterTl.progress(1);
      const g = safe(to, 'goto', () => to.inst.goto && to.inst.goto(s, { animate: false, direction }));
      if (isTl(g)) g.progress(1);
    }
    tl.add(runTransition(tr, { from, to, stage }), 0);
    if (isTl(exitTl)) tl.add(exitTl, 0);
    if (isTl(enterTl) && enterTl.progress() < 1) tl.add(enterTl, tr.type === 'cut' ? tr.dur : 0);
    stage.setLetterbox(to.bg, quick ? 0 : Math.max(tr.dur, 0.3));
    if (hud) hud.set(to.m.icon, to.m.ground, quick ? 0 : 0.5);

    trans = { tl, from, to };
    tl.eventCallback('onComplete', () => {
      if (!trans || trans.tl !== tl) return;
      trans = null;
      if (from) {
        from.wrapper.style.visibility = 'hidden';
        gsap.set(from.wrapper, { opacity: 1, clipPath: 'none' });
        if (from.freeze) { from.freeze.remove(); from.freeze = null; }
      }
      onSettle();
    });
    emitChange();
    if (quick) tl.progress(1);
    else tl.play();
    return tl;
  }

  function gotoStep(s, { animate = true, direction = 1 } = {}) {
    if (!cur) return null;
    if (stepTl) stepTl.progress(1);
    s = clamp(s | 0, 0, cur.steps - 1);
    const rec = cur;
    const anim = animate && !params.render;
    step = s;
    const t = safe(rec, 'goto', () => rec.inst.goto && rec.inst.goto(s, { animate: anim, direction }));
    emitChange();
    if (isTl(t) && anim && t.progress() < 1) {
      const wrapTl = gsap.timeline({
        onComplete: () => {
          if (stepTl !== wrapTl) return;
          stepTl = null;
          onSettle();
        },
      });
      wrapTl.add(t, 0);
      stepTl = wrapTl;
    } else {
      if (isTl(t)) t.progress(1);
      onSettle();
    }
    return stepTl;
  }

  function intercept(dir) {
    if (!cur || !cur.inst.intercept) return false;
    const r = safe(cur, 'intercept', () => cur.inst.intercept(dir));
    if (r === true) {
      emitChange();
      scheduleAuto();
      return true;
    }
    return false;
  }

  function next() {
    if (!cur) return;
    if (trans) trans.tl.progress(1);
    if (intercept('next')) return;
    if (step < cur.steps - 1) return gotoStep(step + 1, { direction: 1 });
    if (cur.i < N - 1) {
      emit('advance', { from: cur.id, to: moments[cur.i + 1].id, direction: 1 });
      show(cur.i + 1, 0, { direction: 1 });
    }
  }
  function prev() {
    if (!cur) return;
    if (trans) trans.tl.progress(1);
    if (intercept('prev')) return;
    if (step > 0) return gotoStep(step - 1, { direction: -1 });
    if (cur.i > 0) {
      const r = create(cur.i - 1);
      emit('advance', { from: cur.id, to: r.id, direction: -1 });
      show(cur.i - 1, r.steps - 1, { direction: -1 });
    }
  }
  function indexOf(idOrNumber) {
    if (typeof idOrNumber === 'number') return clamp(idOrNumber, 0, N - 1);
    const s = String(idOrNumber);
    const byId = moments.findIndex((m) => m.id === s);
    if (byId >= 0) return byId;
    const n = parseInt(s, 10);
    if (Number.isFinite(n)) {
      const byN = moments.findIndex((m) => m.n === n);
      return byN >= 0 ? byN : clamp(n - 1, 0, N - 1);
    }
    return -1;
  }
  // goto(id | 1-based number string | 0-based index number, step)
  function goto(target, s = 0, opts = {}) {
    const i = indexOf(target);
    if (i < 0) return console.warn(`[itaf] goto: unknown moment ${target}`);
    if (cur && i === cur.i) return gotoStep(s, { animate: !opts.instant, direction: s >= step ? 1 : -1 });
    return show(i, s, { jump: true, direction: cur && i < cur.i ? -1 : 1, instant: !!opts.instant });
  }

  // GL failed for good (context lost twice): rebuild GL moments as static frames.
  function dropGL() {
    const ids = [...recs.values()].filter((r) => r.gl);
    const wasCur = cur && cur.gl ? { i: cur.i, s: step } : null;
    for (const r of ids) {
      if (r === cur) continue;
      dispose(r);
    }
    glOwner = null;
    if (wasCur) {
      const old = cur;
      cur = null;
      safe(old, 'dispose', () => old.inst.dispose && old.inst.dispose());
      old.wrapper.remove();
      recs.delete(old.id);
      show(wasCur.i, wasCur.s, { instant: true });
    }
  }

  return {
    on, next, prev, goto, show, gotoStep, state, settled, dropGL,
    get current() { return cur; },
    get step() { return step; },
    get moments() { return moments; },
    get recs() { return recs; },
    get glOwner() { return glOwner; },
    // test hook: render the current GL world once (render mode)
    renderOnce() {
      const gl = getGL(false);
      if (cur && cur.inst.update && !cur.updateFailed) safe(cur, 'update', () => cur.inst.update(0, 0));
      if (gl && glOwner === cur && cur.inst.world) gl.render(cur.inst.world, 0, true);
    },
  };
}
