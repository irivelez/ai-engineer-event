"""Aggregate all scouts' picks into (1) a compact table and (2) labelled sheets of candidate frames.
Usage: python3 -I review.py PICKS_DIR OUTDIR [GROUPS e.g. ABC]"""
import json, os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

P, OUT = sys.argv[1], sys.argv[2]
groups = sys.argv[3] if len(sys.argv) > 3 else 'ABCDEFGHIJ'
os.makedirs(OUT, exist_ok=True)
rows, cards = [], []
for g in groups:
    f = os.path.join(P, g, 'picks.json')
    if not os.path.exists(f):
        continue
    try:
        d = json.load(open(f))
    except Exception as e:
        print('BAD JSON', g, e); continue
    for sp in d.get('speakers', []):
        sid = sp.get('segment_id')
        for m in sp.get('moments', []):
            mid = f"{g}.{sid}.m{m.get('rank')}"
            rows.append((mid, sp.get('speaker'), sp.get('org'), m.get('t'), m.get('kind'), m.get('punch_score'),
                         m.get('best_format'), m.get('headline'), m.get('quote_clean'), m.get('on_screen_text'), m.get('screenshot')))
            img = m.get('screenshot')
            if img:
                cards.append((mid, os.path.join(P, g, img), f"{sp.get('speaker')} · {m.get('t')} · p{m.get('punch_score')} · {m.get('best_format')}", m.get('headline') or ''))
        por = sp.get('portrait') or {}
        if por.get('file'):
            cards.append((f"{g}.{sid}.portrait", os.path.join(P, g, por['file']), f"{sp.get('speaker')} · portrait · {por.get('t')}", sp.get('org') or ''))
with open(os.path.join(OUT, 'moments.tsv'), 'w') as fh:
    for r in rows:
        fh.write('\t'.join(str(x).replace('\n', ' ') for x in r) + '\n')
print('moments', len(rows), 'cards', len(cards))
font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 15)
fontb = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 17)
TW, TH, TXT, COLS, ROWS = 760, 428, 64, 2, 3
for s in range(0, len(cards), COLS * ROWS):
    chunk = cards[s:s + COLS * ROWS]
    im = Image.new('RGB', (COLS * TW, ((len(chunk) + COLS - 1) // COLS) * (TH + TXT)), (20, 20, 20))
    d = ImageDraw.Draw(im)
    for i, (mid, path, l1, l2) in enumerate(chunk):
        x, y = (i % COLS) * TW, (i // COLS) * (TH + TXT)
        try:
            im.paste(Image.open(path).convert('RGB').resize((TW - 8, TH - 4)), (x + 4, y + TXT))
        except Exception:
            d.text((x + 10, y + TXT + 10), 'MISSING ' + path[-60:], fill=(255, 80, 80), font=font)
        d.text((x + 6, y + 4), f"{mid}  {l1}"[:84], fill=(255, 210, 80), font=fontb)
        d.text((x + 6, y + 28), textwrap.shorten(l2, 92), fill=(230, 230, 230), font=font)
    im.save(os.path.join(OUT, f'review_{s // (COLS * ROWS):02d}.jpg'), quality=80)
print('sheets', (len(cards) + COLS * ROWS - 1) // (COLS * ROWS))
