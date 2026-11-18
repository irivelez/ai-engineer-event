# Screenshot a style frame at 1920x1080, DPR 1, after fonts load.
# usage (from keynote/): python3 docs/style-frames/src/shoot.py <frame.html> <out.png> [query]
# Uses the Playwright Chromium headless shell in ~/Library/Caches/ms-playwright (any installed build).
import glob, os, sys
from playwright.sync_api import sync_playwright

html, out = os.path.abspath(sys.argv[1]), sys.argv[2]
query = sys.argv[3] if len(sys.argv) > 3 else ''
shells = sorted(glob.glob(os.path.expanduser('~/Library/Caches/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell')))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=shells[-1] if shells else None)
    try:
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
        pg.on('pageerror', lambda e: print('[pageerror]', e))
        pg.on('console', lambda m: m.type in ('error', 'warning') and print('[console]', m.type, m.text))
        pg.goto('file://' + html + query)
        pg.wait_for_function('window.__ready === true', timeout=10000)
        pg.evaluate('document.fonts.ready.then(() => true)')
        pg.wait_for_timeout(int(os.environ.get('WAIT', '300')))
        pg.screenshot(path=out, clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080})
        print('wrote', out)
    finally:
        b.close()
