"""Parse YouTube json3 auto-captions into (1) word list with absolute times and (2) readable transcript chunks."""
import json, sys, re
src, out_words, out_txt = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.load(open(src))
words = []
for ev in d.get('events', []):
    t0 = ev.get('tStartMs', 0)
    for s in ev.get('segs', []) or []:
        w = s.get('utf8', '')
        if not w or w == '\n':
            continue
        t = t0 + s.get('tOffsetMs', 0)
        words.append((t, w.strip()))
words = [(t, w) for t, w in words if w]
words.sort(key=lambda x: x[0])
json.dump(words, open(out_words, 'w'))
def ts(ms):
    s = ms // 1000
    return f"{s//3600:01d}:{(s%3600)//60:02d}:{s%60:02d}"
# chunk into ~12s lines
lines, cur, cur_t = [], [], None
for t, w in words:
    if cur_t is None:
        cur_t = t
    cur.append(w)
    if t - cur_t > 12000:
        lines.append(f"[{ts(cur_t)}] " + ' '.join(cur))
        cur, cur_t = [], None
if cur:
    lines.append(f"[{ts(cur_t)}] " + ' '.join(cur))
open(out_txt, 'w').write('\n'.join(lines))
print('words', len(words), 'lines', len(lines), 'first', ts(words[0][0]), 'last', ts(words[-1][0]))
