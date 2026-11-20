"""Subtitle overlays and title cards for the invitation film, drawn with Pillow in macOS system faces
(New York for the voice of the film, SF Pro for subtitles, SF Mono for labels, a dot-matrix LED pass)."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
BONE, ASH, LED, RED = (236, 232, 222), (167, 164, 156), (234, 219, 140), (255, 77, 61)
FONTS = '/System/Library/Fonts/'

def font(kind, size):
    if kind in ('serif', 'serif_i'):
        f = ImageFont.truetype(FONTS + ('NewYork.ttf' if kind == 'serif' else 'NewYorkItalic.ttf'), size)
        f.set_variation_by_axes([min(256, max(12, size)), 400, 0]); return f
    if kind.startswith('sans'):           # sans:<weight>[:<width>]
        parts = kind.split(':'); wght = int(parts[1]) if len(parts) > 1 else 600; wdth = int(parts[2]) if len(parts) > 2 else 100
        f = ImageFont.truetype(FONTS + 'SFNS.ttf', size); f.set_variation_by_axes([wdth, min(96, max(17, size)), 400, wght]); return f
    if kind.startswith('mono'):           # mono:<weight>
        wght = int(kind.split(':')[1]) if ':' in kind else 500
        f = ImageFont.truetype(FONTS + 'SFNSMono.ttf', size); f.set_variation_by_axes([294, wght]); return f
    raise ValueError(kind)

def spaced_width(text, f, sp):
    return sum(f.getlength(ch) for ch in text) + sp * max(0, len(text) - 1)

def draw_spaced(d, x, y, text, f, fill, sp):
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill); x += f.getlength(ch) + sp
    return x

def wrap(text, f, maxw):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if f.getlength(t) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def balance(text, f, maxw):
    """Two lines of similar length instead of a long line and a stub."""
    lines = wrap(text, f, maxw)
    if len(lines) != 2: return lines
    words = text.split(); best = lines; bestd = 1e9
    for k in range(1, len(words)):
        a, b = ' '.join(words[:k]), ' '.join(words[k:])
        if f.getlength(a) <= maxw and f.getlength(b) <= maxw:
            dd = abs(f.getlength(a) - f.getlength(b))
            if dd < bestd: best, bestd = [a, b], dd
    return best

def led(text, size, color=LED):
    """Dot-matrix LED rendering: sample a heavy glyph mask on a grid, draw a dot per lit cell, add glow."""
    f = font('mono:900', size); sp = size * 0.06
    tw = int(spaced_width(text, f, sp)) + 40; th = int(size * 1.35) + 20
    mask = Image.new('L', (tw, th), 0); draw_spaced(ImageDraw.Draw(mask), 20, 10, text, f, 255, sp)
    m = np.asarray(mask, dtype=np.float32); g = max(5, round(size / 10)); r = g * 0.42
    dots = Image.new('RGBA', (tw, th), (0, 0, 0, 0)); dd = ImageDraw.Draw(dots)
    for y in range(g // 2, th, g):
        for x in range(g // 2, tw, g):
            cell = m[max(0, y - g // 2):y + g // 2 + 1, max(0, x - g // 2):x + g // 2 + 1]
            if cell.size and cell.mean() > 100:
                dd.ellipse([x - r, y - r, x + r, y + r], fill=color + (255,))
    glow = dots.filter(ImageFilter.GaussianBlur(g * 1.6)); a = np.asarray(glow).copy(); a[..., 3] = (a[..., 3] * 0.55).astype(np.uint8)
    out = Image.alpha_composite(Image.fromarray(a), dots)
    return out.crop(out.getbbox())

def shadowed_text(base, xy, text, f, fill, blur=9, alpha=170):
    sh = Image.new('RGBA', base.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text((xy[0], xy[1] + 2), text, font=f, fill=(0, 0, 0, alpha))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(base).text(xy, text, font=f, fill=fill)

def gradient_alpha(stops):
    """Vertical alpha ramp from (y, alpha) stops, as an RGBA black layer."""
    ys = np.arange(H); a = np.interp(ys, [s[0] for s in stops], [s[1] for s in stops])
    arr = np.zeros((H, W, 4), np.uint8); arr[..., 3] = (a[:, None] * 255).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')

def clip_overlay(label, when, sub):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    im.alpha_composite(gradient_alpha([(0, .62), (150, 0), (H - 480, 0), (H - 340, .55), (H - 230, .93), (H, .975)]))
    d = ImageDraw.Draw(im)
    # top: the proof that this is the room itself
    d.ellipse([84, 60, 96, 72], fill=RED + (255,))
    draw_spaced(d, 112, 56, 'SONIDO ORIGINAL · AI ENGINEER CODE SUMMIT · SAN FRANCISCO', font('mono:500', 17), BONE, 3.4)
    # subtitle (bottom), balanced into at most two lines
    fs = font('sans:620', 58); lines = balance(sub, fs, 1600); lh = 66
    y0 = H - 92 - lh * len(lines)
    for k, ln in enumerate(lines):
        shadowed_text(im, (120, y0 + k * lh), ln, fs, (255, 255, 255, 255))
    # speaker label above the subtitle
    fl = font('mono:500', 21); x = draw_spaced(d, 120, y0 - 50, label.upper(), fl, LED, 4.4)
    draw_spaced(d, x + 4, y0 - 50, f' · {when} PST', fl, ASH, 4.4)
    return im

def fit(kind, text, size, maxw):
    f = font(kind, size)
    while f.getlength(text) > maxw and size > 30:
        size -= 2; f = font(kind, size)
    return f, size

def styled_center(im, y, segs, size, maxw=1640):
    """One centred line built from (text, kind, colour) segments, shrunk until it fits."""
    while True:
        fs = [font(k, size) for _, k, _ in segs]; tw = sum(f.getlength(t) for f, (t, _, _) in zip(fs, segs))
        if tw <= maxw or size <= 30: break
        size -= 2
    d = ImageDraw.Draw(im); x = (W - tw) / 2
    for f, (t, _, c) in zip(fs, segs):
        d.text((x, y), t, font=f, fill=c); x += f.getlength(t)
    return size

def card(kind):
    arr = np.zeros((H, W, 3), np.float32)
    yy, xx = np.mgrid[0:H, 0:W]; r = np.sqrt(((xx - W / 2) / (W * .55)) ** 2 + ((yy - H / 2) / (H * .6)) ** 2)
    arr += (np.clip(1 - r, 0, 1) ** 2)[..., None] * np.array([14, 13, 8], np.float32)
    im = Image.fromarray(arr.astype(np.uint8), 'RGB').convert('RGBA'); d = ImageDraw.Draw(im)
    if kind == 'open':
        l = led('SAN FRANCISCO', 120); im.alpha_composite(l, ((W - l.width) // 2, 420))
        t = '11.11.2026 · AI ENGINEER CODE SUMMIT · DÍA UNO'; f = font('mono:500', 22)
        draw_spaced(d, (W - spaced_width(t, f, 4.8)) / 2, 420 + l.height + 46, t, f, ASH, 4.8)
    elif kind == 'title':
        styled_center(im, 388, [('Nueve horas. Treinta y cuatro voces.', 'serif', BONE)], 100)
        styled_center(im, 540, [('Esto es lo que se dijo adentro.', 'serif_i', LED)], 70)
    elif kind == 'shift':
        styled_center(im, 470, [('Escribir código dejó de ser ', 'serif', BONE), ('lo difícil', 'serif_i', LED), ('.', 'serif', BONE)], 96)
    elif kind == 'question':
        styled_center(im, 470, [('Entonces, ¿quién sostiene ', 'serif', BONE), ('la fábrica', 'serif_i', LED), ('?', 'serif', BONE)], 96)
    elif kind == 'decide':
        styled_center(im, 460, [('Tu 2027 se está decidiendo ', 'serif', BONE), ('ahora', 'serif_i', LED), ('.', 'serif', BONE)], 108)
    elif kind == 'invite':
        t = 'SERIE EN VIVO · GRATIS · POR ZOOM'; f = font('mono:500', 22)
        draw_spaced(d, (W - spaced_width(t, f, 4.8)) / 2, 150, t, f, LED, 4.8)
        styled_center(im, 214, [('Inside the ', 'serif', BONE), ('AI Frontier', 'serif_i', LED)], 146)
        fs = font('sans:560', 46)
        for k, ln in enumerate(['Administrar Software Factories:', '¿hype o la nueva forma de construir?']):
            d.text(((W - fs.getlength(ln)) / 2, 432 + k * 60), ln, font=fs, fill=BONE)
        l = led('VIE 20 NOV · 7 PM', 64); fb = font('sans:600', 44); gap = 30
        tw = l.width + gap + fb.getlength('Bogotá'); x0 = (W - tw) / 2
        im.alpha_composite(l, (int(x0), 606)); d.text((x0 + l.width + gap, 606 + l.height - 52), 'Bogotá', font=fb, fill=BONE)
        fh = font('serif_i', 42); d.text(((W - fh.getlength('con Irina Vélez')) / 2, 712), 'con Irina Vélez', font=fh, fill=ASH)
        # call to action: a filled pill inside an outlined pill
        fbtn = font('sans:700', 36); fu = font('mono:500', 28)
        b_txt, u_txt = 'Quiero entrar  →', 'frontierinsiders.com/webinar'
        bw = fbtn.getlength(b_txt) + 60; uw = spaced_width(u_txt, fu, 1.2)
        ow = bw + 34 + uw + 50; oh = 96; ox = (W - ow) / 2; oy = 820
        glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(glow).rounded_rectangle([ox, oy, ox + ow, oy + oh], 48, outline=LED + (140,), width=10)
        im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(14)))
        d = ImageDraw.Draw(im); d.rounded_rectangle([ox, oy, ox + ow, oy + oh], 48, outline=LED + (210,), width=2)
        d.rounded_rectangle([ox + 12, oy + 12, ox + 12 + bw, oy + oh - 12], 36, fill=LED + (255,))
        d.text((ox + 12 + 30, oy + 22), b_txt, font=fbtn, fill=(0, 0, 0, 255))
        draw_spaced(d, ox + 12 + bw + 34, oy + 30, u_txt, fu, BONE, 1.2)
        cr = 'IMÁGENES Y SONIDO: TRANSMISIÓN DE AI ENGINEER CODE SUMMIT 2026 · MÚSICA: «APHELION», SCOTT BUCKLEY (CC-BY 4.0)'
        fc = font('mono:500', 14); draw_spaced(d, (W - spaced_width(cr, fc, 2.2)) / 2, 1030, cr, fc, (120, 118, 112), 2.2)
    return im.convert('RGB')
