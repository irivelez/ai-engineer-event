"""Contact sheets from keyframes. Parses ffmpeg showinfo log to time each kf/k%06d.jpg, then builds
4x3 labelled sheets (1568x714) per talk segment, dropping keyframes closer than MINGAP s to the last kept.
Usage: python3 -I build_sheets.py WORKDIR [MINGAP]"""
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFont
W = sys.argv[1]
MINGAP = float(sys.argv[2]) if len(sys.argv) > 2 else 4.0
SUB = sys.argv[3] if len(sys.argv) > 3 else 'sheets'
TW, TH, LAB, COLS, ROWS = 392, 220, 18, 4, 3
times = []
for line in open(os.path.join(W, 'kf_log.txt'), errors='ignore'):
    m = re.search(r'\bn:\s*(\d+).*?pts_time:([\d.]+)', line)
    if m and 'Parsed_showinfo' in line:
        times.append(float(m.group(2)))
print('keyframes timed:', len(times))
frames = [(t, os.path.join(W, 'kf', f'k{i+2:06d}.jpg')) for i, t in enumerate(times) if os.path.exists(os.path.join(W, 'kf', f'k{i+2:06d}.jpg'))]

def sec(s):
    h, m, x = [int(v) for v in s.split(':')]
    return h * 3600 + m * 60 + x

def hms(t):
    t = int(round(t)); return f"{t//3600}:{(t%3600)//60:02d}:{t%60:02d}"

font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 13)
talks = json.load(open(os.path.join(W, 'talks.json')))
index, total = {}, 0
for tk in talks:
    a, b = sec(tk['start']), sec(tk['end'])
    sel, last = [], -1e9
    for t, p in frames:
        if a <= t <= b and t - last >= MINGAP:
            sel.append((t, p)); last = t
    sdir = os.path.join(W, SUB, tk['id']); os.makedirs(sdir, exist_ok=True)
    for f in os.listdir(sdir):
        os.remove(os.path.join(sdir, f))
    per, names = COLS * ROWS, []
    for k in range(0, len(sel), per):
        chunk = sel[k:k + per]
        im = Image.new('RGB', (COLS * TW, ROWS * (TH + LAB)), (16, 16, 16))
        d = ImageDraw.Draw(im)
        for i, (t, p) in enumerate(chunk):
            x, y = (i % COLS) * TW, (i // COLS) * (TH + LAB)
            try:
                im.paste(Image.open(p).convert('RGB').resize((TW, TH)), (x, y + LAB))
            except Exception:
                pass
            d.text((x + 4, y + 2), hms(t), fill=(255, 210, 80), font=font)
        name = f"sheet_{k//per:02d}_{hms(chunk[0][0]).replace(':','-')}_to_{hms(chunk[-1][0]).replace(':','-')}.jpg"
        im.save(os.path.join(sdir, name), quality=82)
        names.append(name)
    index[tk['id']] = {'speaker': tk['speaker'], 'frames': len(sel), 'sheets': names}
    total += len(names)
json.dump(index, open(os.path.join(W, SUB, 'index.json'), 'w'), indent=1)
print('sheets total', total)
for k, v in index.items():
    print(k, v['speaker'][:30], 'frames', v['frames'], 'sheets', len(v['sheets']))
