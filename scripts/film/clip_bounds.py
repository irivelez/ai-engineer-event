"""Find exact spoken boundaries for each film clip from the word-timed captions.
Prints JSON list: id, start, end (seconds into the stream), matched text."""
import json, os, re, sys
from difflib import SequenceMatcher
W = json.load(open(os.environ.get('AIE_WORDS', 'work/words.json')))
def norm(s):
    s = s.lower().replace('%', '').replace(',', '')
    return re.sub(r"[^a-z0-9' ]", ' ', s).split()
toks = []
for t, w in W:
    for x in norm(w):
        toks.append((t / 1000, x))
CLIPS = [
 ('corey',    620,   'it feels like this year has been about 10 years in technology'),
 ('lauren',   3727,  'i did something crazy last month and i shipped 3000 pull requests to production'),
 ('luke',     14172, 'and droid wrote 99 of them and reviewed all of them'),
 ('zach',     28257, "we now see around 75 of all of ramp's code being being written and shipped by inspect"),
 ('andrew1',  11634, 'our ceo uh tarek said recently code is abundant confidence is not'),
 ('brian',    22380, 'the agent fabricated a send and the judge rubber stamped it'),
 ('kush',     17565, 'agents sometimes take the shortest paths to green ci'),
 ('simon1',   31070, 'we later found out that the um the prompt that got fable banned was was fix the bugs'),
 ('andrew2',  12180, 'i like to say the factory runs dim not dark'),
 ('yegge',    30410, 'the more agents i deploy the more humans i need'),
 ('simon2',   31744, "it doesn't get easier you just get faster"),
 ('michelle', 3582,  'what are you going to build today'),
]
out = []
for cid, t0, phrase in CLIPS:
    q = norm(phrase); L = len(q); target = ' '.join(q)
    idx = [k for k, (tt, _) in enumerate(toks) if t0 - 120 <= tt <= t0 + 120]
    best = (0, None)
    for k in idx:
        r = SequenceMatcher(None, target, ' '.join(x for _, x in toks[k:k + L])).ratio()
        if r > best[0]:
            best = (r, k)
    r, k = best
    start = toks[k][0]; last = toks[k + L - 1][0]; nxt = toks[k + L][0]
    end = min(nxt - 0.04, last + 0.9)
    out.append({'id': cid, 'start': round(start - 0.12, 2), 'end': round(end + 0.05, 2), 'ratio': round(r, 2),
                'heard': ' '.join(x for _, x in toks[k:k + L]), 'next_word': toks[k + L][1]})
json.dump(out, open(sys.argv[1], 'w'), indent=1)
for o in out:
    print(f"{o['id']:9} {o['start']:9.2f}-{o['end']:9.2f} ({o['end']-o['start']:4.1f}s) r={o['ratio']} | {o['heard'][:70]} [next: {o['next_word']}]")
