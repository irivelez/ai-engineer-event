"""Build a single self-contained keynote HTML (fonts, deck data and every frame inlined).
Usage: python3 -I build_single.py KEYNOTE_DIR OUT.html [MAX_WIDTH=1600] [JPEG_QUALITY=80]"""
import base64, io, os, re, sys
from PIL import Image

K, OUT = sys.argv[1], sys.argv[2]
MAXW = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
Q = int(sys.argv[4]) if len(sys.argv) > 4 else 80
html = open(os.path.join(K, 'index.html'), encoding='utf-8').read()
data = open(os.path.join(K, 'deck-data.js'), encoding='utf-8').read()

def font_uri(m):
    p = os.path.join(K, m.group(1))
    return "url(data:font/woff2;base64," + base64.b64encode(open(p, 'rb').read()).decode() + ")"
html = re.sub(r"url\((fonts/[^)]+\.woff2)\)", font_uri, html)

imgs = {}
for p in sorted(set(re.findall(r"['\"](shots/[^'\"]+\.(?:jpg|jpeg|png))['\"]", data))):
    im = Image.open(os.path.join(K, p)).convert('RGB')
    if im.width > MAXW:
        im = im.resize((MAXW, round(im.height * MAXW / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=Q, optimize=True, progressive=True)
    imgs[p] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
reg = 'window.__IMG={' + ','.join(f'"{k}":"{v}"' for k, v in imgs.items()) + '};'
tag = '<script src="deck-data.js"></script>'
assert tag in html, 'deck-data.js script tag not found'
html = html.replace(tag, f'<script>{reg}</script>\n<script>\n{data}\n</script>')
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(html)
print(f'wrote {OUT}: {os.path.getsize(OUT)/1e6:.1f} MB, {len(imgs)} frames inlined')
