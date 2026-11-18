"""Verify every quote in the deck against the word-timed captions.
Usage: python3 -I verify_quotes.py DECK.json WORDS.json
Each quote is split on the ellipsis; every fragment of 3+ words must match the captions (fuzzy ratio
>= 0.85) within [t-180 s, t+240 s]. Prints the matched time so slide t can be aligned to speech."""
import json, re, sys
from difflib import SequenceMatcher

deck = json.load(open(sys.argv[1])); W = json.load(open(sys.argv[2]))
def norm(s):
    s = s.replace('*', '').replace('’', "'").replace('‘', "'").replace('“', ' ').replace('”', ' ').replace('—', ' ')
    s = s.lower().replace('%', ' percent ').replace(',000', '000')
    return re.sub(r"[^a-z0-9' ]", ' ', s).split()
toks = []
for t, w in W:
    for x in norm(w):
        toks.append((t / 1000, x))
def hms(t):
    t = int(t); return f"{t//3600}:{t%3600//60:02d}:{t%60:02d}"
bad = 0
for i, s in enumerate(deck['slides']):
    texts = []
    if s.get('quote') and s['type'] in ('shot', 'quote', 'stat', 'finale', 'cold') and s.get('src') != 'slide':
        texts.append(('quote', s['quote']))
    if s.get('sub') and s['type'] == 'finale' and 'Tolstoy' not in s['sub']:
        texts.append(('sub', s['sub']))
    if not texts or s.get('t') is None:
        continue
    t = s['t']
    lo, hi = t - 180, t + 240
    idx = [k for k, (tt, _) in enumerate(toks) if lo <= tt <= hi]
    if not idx:
        print(f'{i+1:02d} NO WORDS NEAR {hms(t)}'); bad += 1; continue
    a, b = idx[0], idx[-1] + 1
    words = [x for _, x in toks[a:b]]
    for kind, text in texts:
        for frag in [f for f in re.split(r'…|\.\.\.', text) if len(norm(f)) >= 3]:
            q = norm(frag); L = len(q); target = ' '.join(q)
            best = (0, None)
            for k in range(0, max(1, len(words) - L + 1)):
                r = SequenceMatcher(None, target, ' '.join(words[k:k + L])).ratio()
                if r > best[0]:
                    best = (r, k)
            r, k = best
            when = toks[a + k][0] if k is not None else None
            flag = 'OK ' if r >= 0.85 else 'BAD'
            if r < 0.85:
                bad += 1
            print(f"{i+1:02d} {flag} r={r:.2f} at {hms(when) if when else '?'} (t={hms(t)}, d={when - t if when else 0:+.0f}s) {s.get('speaker','')[:18]:18} | {frag.strip()[:70]}")
print('\nFRAGMENTS BELOW 0.85:', bad)
