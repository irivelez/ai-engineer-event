"""Find a square face crop in each portrait frame (largest frontal face) for the circular quote-card portraits.
Usage: uv run --with opencv-python-headless python -I faces.py PORTRAITS.json PICKS_DIR OUT.json SHEET.jpg
PORTRAITS.json: [{"id": "steve-yegge", "src": "J/s30_portrait_8-06-30.0.jpg", "region": [x, y, w, h] | null}]
region (optional, 0-1) restricts the search, e.g. to the speaker-camera inset of the composite layout.
Output faceBox = [x, y, w] where x, w are fractions of frame width and y of frame height (square in pixels)."""
import json, os, sys
import cv2

sel = json.load(open(sys.argv[1])); P = sys.argv[2]
casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
res, tiles = {}, []
for e in sel:
    img = cv2.imread(os.path.join(P, e['src']))
    H, W = img.shape[:2]
    rx, ry, rw, rh = [int(v) for v in ((e.get('region') or [0, 0, 1, 1])[0] * W, (e.get('region') or [0, 0, 1, 1])[1] * H,
                                        (e.get('region') or [0, 0, 1, 1])[2] * W, (e.get('region') or [0, 0, 1, 1])[3] * H)]
    g = cv2.cvtColor(img[ry:ry + rh, rx:rx + rw], cv2.COLOR_BGR2GRAY)
    faces = casc.detectMultiScale(g, scaleFactor=1.08, minNeighbors=6, minSize=(36, 36))
    if len(faces) == 0:
        res[e['id']] = None; print('no face', e['id']); continue
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    side = 2.3 * w; cx = rx + x + w / 2; cy = ry + y + h / 2 + 0.18 * h
    X = min(max(0, cx - side / 2), W - side); Y = min(max(0, cy - side / 2), H - side)
    res[e['id']] = [round(X / W, 4), round(Y / H, 4), round(side / W, 4)]
    tiles.append((e['id'], cv2.resize(img[int(Y):int(Y + side), int(X):int(X + side)], (200, 200))))
json.dump(res, open(sys.argv[3], 'w'), indent=1)
if tiles:
    import numpy as np
    cols = 6; rows = (len(tiles) + cols - 1) // cols
    sheet = np.zeros((rows * 230, cols * 200, 3), np.uint8)
    for k, (i, t) in enumerate(tiles):
        r, c = divmod(k, cols); sheet[r * 230 + 30:r * 230 + 230, c * 200:c * 200 + 200] = t
        cv2.putText(sheet, i[:22], (c * 200 + 4, r * 230 + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 210, 255), 1)
    cv2.imwrite(sys.argv[4], sheet)
print('faces', sum(1 for v in res.values() if v), 'of', len(res))
