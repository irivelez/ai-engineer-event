"""Locate a phrase in the word-timed auto-captions and print its exact timestamp + context.
Usage: python3 -I findq.py "phrase to find" [START END]   (optional H:MM:SS window)
Fuzzy: tolerates caption errors. Prints up to 3 best matches with ratio >= 0.6."""
import json, os, re, sys
from difflib import SequenceMatcher
W = json.load(open(os.environ.get('AIE_WORDS', 'work/words.json')))

def norm(s):
    return re.sub(r"[^a-z0-9%$.' ]", ' ', s.lower()).split()

def sec(v):
    h, m, s = v.split(':'); return int(h) * 3600 + int(m) * 60 + float(s)

def hms(ms):
    t = ms / 1000; h = int(t // 3600); m = int((t % 3600) // 60); s = t - h * 3600 - m * 60
    return f"{h}:{m:02d}:{s:04.1f}"

q = norm(sys.argv[1])
lo = sec(sys.argv[2]) * 1000 if len(sys.argv) > 3 else -1
hi = sec(sys.argv[3]) * 1000 if len(sys.argv) > 3 else 1e12
toks = []
for t, w in W:
    if lo <= t <= hi:
        for x in norm(w):
            toks.append((t, x))
words = [x for _, x in toks]
L = len(q); target = ' '.join(q)
rare = sorted(q, key=len, reverse=True)[:3]
cands = set()
for i, w in enumerate(words):
    if w in rare:
        for k in range(max(0, i - L), i + 1):
            cands.add(k)
scored = []
for i in sorted(cands):
    win = ' '.join(words[i:i + L])
    r = SequenceMatcher(None, target, win).ratio()
    if r >= 0.6:
        scored.append((r, i))
scored.sort(reverse=True)
seen = []
for r, i in scored:
    if any(abs(i - j) < L for j in seen):
        continue
    seen.append(i)
    ctx = ' '.join(words[max(0, i - 12):i + L + 12])
    print(f"{hms(toks[i][0])}  ratio={r:.2f}  ...{ctx}...")
    if len(seen) >= 3:
        break
if not seen:
    print('no match >= 0.6')
