"""Render every keynote slide headless (Chromium via Playwright) for visual QA.
Usage: python3 -I render.py DECK_INDEX_HTML OUTDIR [WAIT_MS] [only=1,5,9]
Writes OUTDIR/slide_XX.jpg (1920x1080) and OUTDIR/overview.jpg (3-col 640x360 sheet)."""
import os, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

html, out = sys.argv[1], sys.argv[2]
wait = int(sys.argv[3]) if len(sys.argv) > 3 else 5200
only = None
for a in sys.argv[4:]:
    if a.startswith('only='):
        only = [int(x) for x in a[5:].split(',') if x]
os.makedirs(out, exist_ok=True)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    pg.on('console', lambda m: errors.append(f'console {m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    pg.on('requestfailed', lambda r: errors.append(f'requestfailed: {r.url}'))
    pg.goto('file://' + os.path.abspath(html) + '#1')
    pg.wait_for_function('window.__deck && document.fonts.status === "loaded"', timeout=15000)
    n = pg.evaluate('window.__deck.count')
    shots = []
    for i in range(n):
        if only and (i + 1) not in only:
            continue
        pg.evaluate(f'window.__deck.go({i})')
        pg.wait_for_timeout(wait)
        f = os.path.join(out, f'slide_{i+1:02d}.jpg')
        pg.screenshot(path=f, type='jpeg', quality=85)
        shots.append((i + 1, f))
    b.close()
cols, W, H = 3, 640, 360
rows = (len(shots) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 22)), (30, 30, 30))
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 14)
for k, (i, f) in enumerate(shots):
    x, y = (k % cols) * W, (k // cols) * (H + 22)
    sheet.paste(Image.open(f).convert('RGB').resize((W, H)), (x, y + 22))
    d.text((x + 6, y + 4), f'slide {i}', fill=(255, 210, 80), font=font)
sheet.save(os.path.join(out, 'overview.jpg'), quality=85)
print('rendered', len(shots), 'slides of', n)
print('\n'.join(errors) if errors else 'no console errors')
