// thermometers (calm-a, PAPER data): how we know the frontier is moving. No single number: four families of
// trusted instruments, each answering one plain question, read together.
// Data: src/data/thermometers.json (trend-research), imported at build time by ../thermometers.js. Every
// instrument, reading, date and chip comes from that file; every other word from beats.json.
// Layout: the four questions as a rail (columns 0–3); the family being read fills the panel (columns 4–11),
// one instrument per row: provenance chip and name, the latest reading in plain words, who and when.
// Step 0: the four questions and the promise (no single number).   Steps 1–4: one family per step; the rail's
// accent bar moves to it.   Step 5: all four lit, and the panel says: read them together.
import { gsap } from 'gsap';
import { calmScene, el, esc, kindOf, fmtDate } from '../_calm/kit.js';

const pick = (o, keys) => {
  if (!o || typeof o !== 'object') return null;
  for (const k of keys) if (o[k] != null && o[k] !== '') return o[k];
  return null;
};

/** Pure data prep, tolerant of the field names a research file may use. */
export function prepThermo(D) {
  const fams = (D && (D.families || D.groups)) || [];
  const fams4 = fams.map((f) => {
    const list = pick(f, ['instruments', 'items']) || [];
    return {
      question: String(pick(f, ['question', 'title', 'name']) || ''),
      instruments: list.map((it) => {
        const lt = it && typeof it.latest === 'object' ? it.latest : {};
        const also = it && typeof it.alsoLabReported === 'object' ? it.alsoLabReported : null;
        return {
          name: String(pick(it, ['name', 'instrument', 'title']) || ''),
          by: String(pick(it, ['runBy', 'by', 'who', 'publisher']) || ''),
          kind: kindOf(pick(it, ['label', 'kind']) || ''),
          reading: String(pick(lt, ['reading', 'value', 'text']) ?? pick(it, ['reading']) ?? ''),
          date: String(pick(lt, ['date', 'asOf']) || pick(it, ['date']) || ''),
          also: also && pick(also, ['reading']) ? { reading: String(also.reading), by: String(pick(also, ['runBy', 'by']) || ''), kind: kindOf(pick(also, ['label', 'kind']) || ''), date: String(pick(also, ['date']) || '') } : null,
        };
      }).filter((x) => x.name),
    };
  }).filter((f) => f.question).slice(0, 4);
  return { families: fams4, takeaway: String((D && D.takeaway) || '') };
}

const CSS = `
.th-q { position:absolute; left:0; width:533px; padding-left:28px; box-sizing:border-box; font-family: var(--f-sans); font-size:36px; line-height:44px; font-weight:600; letter-spacing:-0.012em; }
.th-bar { position:absolute; left:0; width:4px; border-radius:2px; background: var(--g-accent); }
.th-ins { position:absolute; left:0; width:1099px; }
.th-l1 { display:flex; align-items:center; gap:16px; height:44px; }
.th-name { font-family: var(--f-sans); font-size:32px; line-height:40px; font-weight:600; letter-spacing:-0.01em; white-space:nowrap; }
.th-read { margin-top:8px; font-family: var(--f-sans); font-size:34px; line-height:42px; font-weight:480; letter-spacing:-0.01em; font-variant-numeric: tabular-nums; text-wrap: pretty; }
.th-who { margin-top:4px; font-family: var(--f-mono); font-size:26px; line-height:32px; font-weight:460; letter-spacing:0.01em; }
.th-also { display:flex; align-items:flex-start; gap:16px; margin-top:10px; }
.th-also .itaf-chip { margin-top:-4px; }
.th-also-t { font-family: var(--f-sans); font-size:28px; line-height:36px; font-weight:460; }
`;

export function makeThermo(D) {
  const P = prepThermo(D);
  const F = P.families;
  return calmScene('thermometers', (ctx, K) => {
    const { T, C, G, g, place, R } = K;
    const { copy } = ctx;
    const M = T.space.margin;
    if (!document.getElementById('th-css')) {
      const s = document.createElement('style');
      s.id = 'th-css';
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    const kicker = K.add(C.Kicker.create({ text: K.actKicker(), ground: g }), M, 120);
    const title = K.add(C.Headline.create({ text: copy.title || '', role: 'h2', ground: g, width: T.spanW(12) }), M, 192);

    // ---------------- the rail: the four questions (columns 0–3) ----------------
    const RY = 360;
    const rail = el('div', '');
    place(rail, M, RY, 533, 480);
    // lines per question at 36 px in 505 px (Geist 600 ≈ 0.5 em a character): even air between questions
    const qLines = F.map((f) => Math.min(2, Math.ceil((f.question.length * 18) / 505)));
    const qTop = [];
    qLines.forEach((n, i) => qTop.push(i ? qTop[i - 1] + qLines[i - 1] * 44 + 48 : 0));
    const qs = F.map((f, i) => {
      const q = el('div', 'th-q', rail, esc(f.question));
      q.style.top = `${qTop[i]}px`;
      return q;
    });
    const bar = el('div', 'th-bar', rail);
    const railB = K.block(rail, {
      enter(tl) { tl.fromTo(qs, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: T.motion.calmIn.dur, ease: T.motion.calmIn.ease, stagger: 0.1 }, 0); },
      settle() { gsap.set(qs, { autoAlpha: 1, y: 0 }); },
    });

    // ---------------- the panel (columns 4–11) ----------------
    const PX = T.colX(4);
    const PW = 1099;
    const promise = el('div', 't-lead pretty');
    place(promise, PX, RY - 4, PW);
    promise.style.color = G.muted;
    promise.innerHTML = esc(copy.sub || '')
      + (copy.coverage ? `<div class="ca-sans40 pretty" style="color:${G.fg};margin-top:36px">${esc(copy.coverage)}</div>` : '');
    const promiseB = K.block(promise, { rise: 16 });

    const panels = F.map((f) => {
      const box = el('div', '');
      place(box, PX, RY, PW);
      const rows = f.instruments.map((it) => {
        const row = el('div', 'th-ins', box);
        row.style.position = 'relative';
        row.style.marginBottom = '26px';
        const l1 = el('div', 'th-l1', row);
        l1.insertAdjacentHTML('beforeend', C.chipHTML(it.kind));
        el('div', 'th-name', l1, esc(it.name)).style.color = G.fg;
        el('div', 'th-read', row, esc(it.reading)).style.color = G.fg;
        el('div', 'th-who', row, esc([it.by, fmtDate(it.date)].filter(Boolean).join(' · '))).style.color = G.muted;
        if (it.also) {
          const a = el('div', 'th-also', row);
          a.insertAdjacentHTML('beforeend', C.chipHTML(it.also.kind));
          el('div', 'th-also-t', a, esc([it.also.reading, [it.also.by, fmtDate(it.also.date)].filter(Boolean).join(', ')].filter(Boolean).join(' · '))).style.color = G.muted;
        }
        return row;
      });
      return K.block(box, {
        enter(tl) { tl.fromTo(rows, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: T.motion.calmIn.ease, stagger: 0.14 }, 0); },
        settle() { gsap.set(rows, { autoAlpha: 1, y: 0 }); },
      });
    });

    const close = el('div', '');
    place(close, PX, RY - 8, PW);
    close.innerHTML = `<div class="t-h2" style="color:${G.fg}">${esc(copy.together || '')}</div>`
      + (P.takeaway ? `<div class="ca-sans40 pretty" style="color:${G.muted};margin-top:28px">${esc(P.takeaway)}</div>` : '');
    const closeB = K.block(close, { rise: 16 });

    // rail state: the family being read in fg with the accent bar; the others wait in muted; 0 and 5: all fg
    function railTo(step, anim, tl) {
      const active = step >= 1 && step <= F.length ? step - 1 : -1;
      qs.forEach((q, i) => {
        const c = active < 0 || i === active ? G.fg : G.muted;
        if (anim) tl.to(q, { color: c, duration: T.motion.micro.dur, ease: T.motion.micro.ease }, 0.2);
        else gsap.set(q, { color: c });
      });
      const target = active >= 0 ? { y: qTop[active] + 4, height: qLines[active] * 44 - 8, autoAlpha: 1 } : { autoAlpha: 0 };
      if (anim) tl.to(bar, { ...target, duration: 0.6, ease: 'power3.inOut' }, 0.1);
      else gsap.set(bar, target);
    }

    const foot = K.footer();
    const parts = [
      { c: kicker, on: () => true },
      { c: title, on: () => true, at: 0.08 },
      { c: railB, on: () => true, at: 0.3 },
      { c: promiseB, on: (s) => s === 0, at: 0.8 },
      ...panels.map((b, i) => ({ c: b, on: (s) => s === i + 1, at: 0.25 })),
      { c: closeB, on: (s) => s >= F.length + 1, at: 0.3 },
    ];
    const apply = K.stepper(parts);
    gsap.set(bar, { autoAlpha: 0, height: 80 });
    function go(step, animate, info = {}) {
      const anim = animate && !R;
      const tl = gsap.timeline();
      apply(step, anim, tl, info);
      railTo(step, anim, tl);
      foot.show(null, anim, tl);
      return tl;
    }
    return { go };
  });
}
