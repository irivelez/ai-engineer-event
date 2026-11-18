"""Scan a short window at higher resolution to pick the cleanest frame (slide fully shown, no transition).
Usage: python3 -I strip.py OUT.jpg START END STEP
START/END = seconds or H:MM:SS(.s). Produces a 3-column labelled sheet of 520x293 tiles (max 12 tiles)."""
import os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont
VIDEO = os.environ.get('AIE_VIDEO', 'work/video.mp4')

def sec(v):
    if ':' in v:
        h, m, s = v.split(':'); return int(h) * 3600 + int(m) * 60 + float(s)
    return float(v)

def hms(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t - h * 3600 - m * 60
    return f"{h}:{m:02d}:{s:04.1f}"

out, a, b, step = sys.argv[1], sec(sys.argv[2]), sec(sys.argv[3]), float(sys.argv[4])
ts = []
t = a
while t <= b + 1e-6 and len(ts) < 12:
    ts.append(round(t, 2)); t += step
TW, TH, LAB, COLS = 520, 293, 20, 3
rows = (len(ts) + COLS - 1) // COLS
im = Image.new('RGB', (COLS * TW, rows * (TH + LAB)), (16, 16, 16))
d = ImageDraw.Draw(im)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 15)
except Exception:
    font = ImageFont.load_default()
tmp = tempfile.mkdtemp()
for i, t in enumerate(ts):
    p = os.path.join(tmp, f'{i}.jpg')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', VIDEO, '-frames:v', '1',
                    '-vf', f'scale={TW}:{TH}', '-q:v', '3', p])
    x, y = (i % COLS) * TW, (i // COLS) * (TH + LAB)
    if os.path.exists(p):
        im.paste(Image.open(p).convert('RGB'), (x, y + LAB))
    d.text((x + 4, y + 2), hms(t), fill=(255, 210, 80), font=font)
im.save(out, quality=85)
print(out, 'tiles:', ' '.join(hms(t) for t in ts))
