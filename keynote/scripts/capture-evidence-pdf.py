# Evidence crops from source PDFs (PJM release, PJM market-monitor slide, BIS rule, Opus 5.5 system card) and chart images: download, render one page
# region with PyMuPDF, save media/evidence/<id>.webp (≤1600 px wide, quality 88). Nothing on the page is edited.
# Used by: Irina's keynote "Inside the AI Frontier" (19 Nov 2026). Delete by 2027-01-31.
# Usage (from keynote/): python3 -I scripts/capture-evidence-pdf.py   Needs: curl, PyMuPDF (fitz), Pillow.
import os
import subprocess

import fitz
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TMP = os.path.join(ROOT, '.dev', 'pdf')
OUT = os.path.join(ROOT, 'media', 'evidence')
# id, url, page (1-based), clip in PDF points (x0, y0, x1, y1) or None for the whole page, zoom
JOBS = [
    ('power-pjm-release-shortfall', 'https://www.pjm.com/-/media/DotCom/about-pjm/newsroom/2026-releases/20260714-pjm-capacity-auction-procures-138318-mw-of-generation-resources.pdf', 1, (60, 20, 560, 575), 3),
    ('power-pjm-imm-datacentre-382', 'https://www.pjm.com/-/media/DotCom/committees-groups/committees/mc/2026/20260727-web/item-02---marketing-monitoring-report---presentation.pdf', 4, None, 2.2),
    ('brazil-bis-rule-page1', 'https://public-inspection.federalregister.gov/2026-23529.pdf', 1, (50, 8, 562, 748), 2.6),
    ('rulers-break-anthropic-eval-awareness', 'https://www-cdn.anthropic.com/fc1b44717c85dc068bc6ba5024219938094694bd/Claude%20Opus%205.5%20System%20Card.pdf', 134, (60, 140, 545, 405), 2.8),
]
# Charts published as images: the source's own file, downloaded as is (then ≤1600 px wide)
IMAGES = [
    ('self-build-anthropic-rd-chart', 'https://assets.claude.com/31704b297a9350f392f143ea078561f36cd14908.png?w=1920'),
]
os.makedirs(TMP, exist_ok=True)
for name, url, page, clip, zoom in JOBS:
    pdf = os.path.join(TMP, name + '.pdf')
    if not os.path.exists(pdf):
        subprocess.run(['curl', '-sS', '-L', '--max-time', '90', '-A', 'Mozilla/5.0', '-o', pdf, url], check=True)
    pg = fitz.open(pdf)[page - 1]
    pix = pg.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=fitz.Rect(*clip) if clip else None, alpha=False)
    png = os.path.join(TMP, name + '.png')
    pix.save(png)
    im = Image.open(png).convert('RGB')
    if im.width > 1600:
        im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=88, method=6)
    print(name, im.size)
for name, url in IMAGES:
    png = os.path.join(TMP, name + '.png')
    subprocess.run(['curl', '-sS', '-L', '--max-time', '90', '-A', 'Mozilla/5.0', '-o', png, url], check=True)
    im = Image.open(png).convert('RGB')
    if im.width > 1600:
        im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=88, method=6)
    print(name, im.size)
