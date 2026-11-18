"""Record a teaser video of the keynote with headless Chrome (Playwright), then encode it to H.264 MP4.
Usage: python3 -I teaser.py KEYNOTE_INDEX_HTML OUT.mp4 PLAN
PLAN = comma list of slide:seconds, e.g. "1:10.5,2:8,3:7,9:7"  (slide numbers are 1-based)."""
import os, shutil, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright

html, out, plan = sys.argv[1], sys.argv[2], sys.argv[3]
steps = [(int(a), float(b)) for a, b in (x.split(':') for x in plan.split(','))]
tmp = tempfile.mkdtemp()
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    ctx = b.new_context(viewport={'width': 1920, 'height': 1080}, record_video_dir=tmp,
                        record_video_size={'width': 1920, 'height': 1080})
    pg = ctx.new_page()
    pg.goto('file://' + os.path.abspath(html) + '#2')
    pg.wait_for_function('window.__deck && document.fonts.status === "loaded"', timeout=20000)
    pg.add_style_tag(content='.hint{display:none!important}')
    pg.wait_for_timeout(600)
    for n, secs in steps:
        pg.evaluate(f'window.__deck.go({n - 1})')
        pg.wait_for_timeout(int(secs * 1000))
    video = pg.video.path()
    ctx.close(); b.close()
# first ~1 s is the page settling on slide 2 before the plan starts: trim it
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1.0', '-i', video, '-c:v', 'libx264', '-preset', 'slow', '-crf', '19',
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', out], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('wrote', out, f'{os.path.getsize(out)/1e6:.1f} MB')
