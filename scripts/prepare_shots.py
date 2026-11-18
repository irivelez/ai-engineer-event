"""Copy curated frames into the keynote as clean, consistently encoded JPEGs.
Usage: python3 -I prepare_shots.py SELECTION.json PICKS_DIR KEYNOTE_SHOTS_DIR
SELECTION.json: [{"id": "michelle-opposite", "src": "B/s05_m1_0-45-44.0.jpg", "crop": [x, y, w, h] | null}, ...]
crop is optional, in 0-1 frame coordinates; the crop is scaled to fill 1920x1080 (center-cropped to 16:9)."""
import json, os, sys
from PIL import Image

sel, picks, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
for e in json.load(open(sel)):
    im = Image.open(os.path.join(picks, e['src'])).convert('RGB')
    if im.size != (1920, 1080):
        im = im.resize((1920, 1080), Image.LANCZOS)
    c = e.get('crop')
    if c:
        x, y, w, h = c[0] * 1920, c[1] * 1080, c[2] * 1920, c[3] * 1080
        ar = 16 / 9
        if w / h > ar:   # too wide: trim width around center
            nw = h * ar; x += (w - nw) / 2; w = nw
        else:            # too tall: trim height around center
            nh = w / ar; y += (h - nh) / 2; h = nh
        im = im.crop((round(x), round(y), round(x + w), round(y + h))).resize((1920, 1080), Image.LANCZOS)
    p = os.path.join(out, e['id'] + '.jpg')
    im.save(p, 'JPEG', quality=86, optimize=True, progressive=True)
    print(p, f'{os.path.getsize(p)/1e3:.0f} KB')
