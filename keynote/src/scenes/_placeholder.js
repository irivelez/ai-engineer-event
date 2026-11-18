// Placeholder (A1): renders any moment that has no scene file yet, so the full 60-minute run exists from
// the first hour. Shows act, title, brief, the step list with the current step highlighted, the visual
// description and the planned time. Not audience-grade by design.
import { gsap } from 'gsap';

const h = (tag, cls, text, style) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (style) Object.assign(e.style, style);
  return e;
};

export default {
  id: '_placeholder',
  gl: false,
  create(ctx) {
    const { root, beat, tokens } = ctx;
    const copy = beat.copy || {};
    const ground = ctx.ground || { fg: '#0B0F14', muted: '#4A5361' };
    const colors = tokens.colors || {};
    const accent = beat.ground === 'paper' ? colors.accentPaper || '#3D55E0' : colors.accent || '#93AAFF';
    const fam = (tokens.type && tokens.type.families) || {};
    const sans = fam.sans || 'system-ui, sans-serif';
    const mono = fam.mono || 'ui-monospace, monospace';
    const title = copy.title || copy.line || copy.line1 || copy.fallbackTitle || beat.id;
    const act = ctx.act;

    const wrap = h('div', 'ph', null, { position: 'absolute', inset: '0', fontFamily: sans, color: ground.fg });
    const top = h('div', null, `${act && act.n ? act.n + ' · ' : ''}${act ? act.title : beat.act}`, {
      position: 'absolute', left: '128px', top: '88px', font: `500 28px/1.2 ${mono}`, color: ground.muted, letterSpacing: '0.04em', textTransform: 'uppercase',
    });
    const meta = h('div', null, `${String(ctx.number).padStart(2, '0')} / ${ctx.total} · ${beat.plannedSec} s · ${beat.mode} · ${beat.owner || ''}`, {
      position: 'absolute', right: '128px', top: '88px', font: `500 28px/1.2 ${mono}`, color: ground.muted,
    });
    const chip = h('div', null, ctx.error ? 'SCENE ERROR · PLACEHOLDER' : 'PLACEHOLDER', {
      position: 'absolute', right: '128px', top: '136px', font: `500 26px/1 ${mono}`, letterSpacing: '0.08em', padding: '10px 14px',
      border: `2px solid ${ctx.error ? '#C8321F' : ground.muted}`, color: ctx.error ? '#C8321F' : ground.muted, borderRadius: '6px',
    });
    const t = h('div', null, title, {
      position: 'absolute', left: '128px', top: '196px', width: '1280px', font: `600 80px/1.06 ${sans}`, letterSpacing: '-0.025em',
    });
    const brief = h('div', null, beat.brief || '', {
      position: 'absolute', left: '128px', top: '400px', width: '1100px', font: `400 34px/1.32 ${sans}`, color: ground.muted,
    });
    const list = h('ol', null, null, { position: 'absolute', left: '128px', top: '600px', width: '1000px', margin: '0', padding: '0', listStyle: 'none' });
    const items = (beat.steps && beat.steps.length ? beat.steps : ['(single state)']).map((s, i) => {
      const li = h('li', null, null, { display: 'flex', gap: '22px', alignItems: 'baseline', padding: '8px 0 8px 22px', borderLeft: '4px solid transparent', font: `400 30px/1.3 ${sans}` });
      li.append(h('span', null, String(i + 1), { font: `500 28px/1 ${mono}`, minWidth: '28px' }), h('span', null, s));
      list.appendChild(li);
      return li;
    });
    const visual = h('div', null, null, { position: 'absolute', left: '1240px', top: '600px', width: '552px', font: `400 26px/1.35 ${sans}`, color: ground.muted });
    visual.append(h('div', null, 'VISUAL', { font: `500 26px/1 ${mono}`, letterSpacing: '0.08em', marginBottom: '12px' }), h('div', null, (beat.visual || '').slice(0, 420)));
    wrap.append(top, meta, chip, t, brief, list, visual);
    if (ctx.error) {
      wrap.appendChild(h('div', null, String(ctx.error && ctx.error.message ? ctx.error.message : ctx.error).slice(0, 200), {
        position: 'absolute', left: '128px', bottom: '64px', font: `500 26px/1.3 ${mono}`, color: '#C8321F',
      }));
    }
    root.appendChild(wrap);

    const paint = (step) => {
      items.forEach((li, i) => {
        li.style.color = i === step ? accent : ground.muted;
        li.style.borderLeftColor = i === step ? accent : 'transparent';
        li.style.fontWeight = i === step ? '600' : '400';
      });
    };
    return {
      steps: Math.max(1, (beat.steps || []).length),
      enter() {
        paint(0);
        if (ctx.renderMode) return null;
        return gsap.timeline().from([t, brief], { y: 24, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.06 });
      },
      goto(step) {
        paint(step);
        return null;
      },
      exit() { return null; },
      update() {},
      world: null,
      dispose() { root.replaceChildren(); },
    };
  },
};
