"""Invitation film for «Inside the AI Frontier», cut from the AI Engineer CODE Summit 2026 livestream.
Real footage and real voices (sonido original) with Spanish subtitles, scored with
'Aphelion' by Scott Buckley (CC-BY 4.0), ending on the webinar invitation.
Usage: python3 -I build_film.py OUT.mp4"""
import json, os, subprocess, sys

T = os.environ.get('AIE_WORK', 'work')   # holds video/, audio/, music/, film/
V, A, MUSIC = f'{T}/video/aie_code_day1_1080p.mp4', f'{T}/audio/stream_audio.webm', f'{T}/music/Aphelion.mp3'
F = f'{T}/film'; os.makedirs(f'{F}/png', exist_ok=True); os.makedirs(f'{F}/seg', exist_ok=True)
OUT = sys.argv[1]
CL = {c['id']: c for c in json.load(open(f'{F}/clips.json'))}
PAD_IN, PAD_OUT, FPS = 0.24, 0.34, 30
SWELL = 108.5          # seconds into Aphelion where the full ensemble enters

def clock(t):
    c = int(9 * 3600 + t); return f'{c // 3600:02d}:{c % 3600 // 60:02d}'

# ---------- the edit: ambition → tension → turn → expectation → invitation ----------
EDL = [
    ('card', 'open', 3.6),
    ('clip', 'corey', 'Este año se ha sentido como diez años de tecnología.', 'Corey Quinn · MC del evento'),
    ('card', 'title', 3.4),
    ('clip', 'lauren', 'El mes pasado hice algo loco: llevé 3.000 pull requests a producción.', 'Lauren Tan · SpaceX Super Intelligence'),
    ('clip', 'luke', 'Y Droid escribió el 99 %, y los revisó todos.', 'Luke Alvoeiro · Factory'),
    ('clip', 'zach', 'Hoy, Inspect escribe y despliega cerca del 75 % de todo el código de Ramp.', 'Zach Bruggeman · Ramp'),
    ('card', 'shift', 2.7),
    ('clip', 'andrew1', 'Nuestro CEO, Tariq, lo dijo hace poco: el código es abundante; la confianza, no.', 'Andrew Finch · Sonar'),
    ('clip', 'brian', 'El agente se inventó un envío, y el juez lo aprobó sin mirar.', 'Brian Kennedy · ZoomInfo'),
    ('clip', 'kush', 'A veces los agentes toman el atajo más corto para que el CI pase en verde.', 'Kush Agrawal · Duolingo'),
    ('clip', 'simon1', 'Después supimos que el prompt que hizo que prohibieran Fable fue: «arregla los bugs».', 'Simon Willison · Independiente'),
    ('card', 'question', 2.8),
    ('clip', 'andrew2', 'Me gusta decir que la fábrica funciona con poca luz, no a oscuras.', 'Andrew Finch · Sonar'),
    ('clip', 'yegge', 'Cuantos más agentes despliego, más humanos necesito.', 'Steve Yegge · Creador de Beads y Gas Town'),
    ('clip', 'simon2', 'No se vuelve más fácil. Tú te vuelves más rápido.', 'Simon Willison · citando a Greg LeMond'),
    ('clip', 'michelle', '¿Qué vas a construir hoy?', 'Michelle Chen · Cloudflare'),
    ('card', 'decide', 3.4),
    ('card', 'invite', 13.0),
]

# ---------- overlays and cards (Pillow, macOS system faces) ----------
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import film_layers as FL
pngs = {}
for k, e in enumerate(EDL):
    out = f"{F}/png/{k:02d}_{e[1]}.png"
    if e[0] == "clip":
        FL.clip_overlay(e[3], clock(CL[e[1]]["start"]), e[2]).save(out)
    else:
        FL.card(e[1]).save(out)
    pngs[k] = out
print("layers", len(pngs))

# ---------- segments ----------
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-1500:]); raise SystemExit(1)

segs, t_film, swell_at = [], 0.0, None
for k, e in enumerate(EDL):
    out = f'{F}/seg/{k:02d}.mp4'
    if e[0] == 'clip':
        c = CL[e[1]]; s0 = c['start'] - PAD_IN; dur = round(c['end'] - c['start'] + PAD_IN + PAD_OUT, 3); n = int(dur * FPS)
        if e[1] == 'yegge': swell_at = t_film
        run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s0:.3f}', '-t', f'{dur:.3f}', '-i', V, '-ss', f'{s0:.3f}', '-t', f'{dur:.3f}', '-i', A,
             '-loop', '1', '-framerate', str(FPS), '-t', f'{dur:.3f}', '-i', pngs[k], '-filter_complex',
             f"[0:v]fps={FPS},zoompan=z='1+0.045*on/{n}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps={FPS}[v0];"
             f"[2:v]format=rgba,fade=in:st=0.12:d=0.35:alpha=1[ov];"
             f"[v0][ov]overlay=0:0,fade=in:st=0:d=0.16,fade=out:st={dur - 0.18:.3f}:d=0.18,format=yuv420p[v];"
             f"[1:a]aresample=48000,pan=stereo|c0=c0|c1=c1,loudnorm=I=-16:TP=-2:LRA=9,afade=in:st=0:d=0.05,afade=out:st={dur - 0.1:.3f}:d=0.1[a]",
             '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-r', str(FPS),
             '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-shortest', out])
    else:
        dur = e[2]; n = int(dur * FPS)
        run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-framerate', str(FPS), '-t', f'{dur:.3f}', '-i', pngs[k],
             '-f', 'lavfi', '-t', f'{dur:.3f}', '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex',
             f"[0:v]zoompan=z='1+0.03*on/{n}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps={FPS},"
             f"fade=in:st=0:d=0.4,fade=out:st={dur - 0.45:.3f}:d=0.45,format=yuv420p[v]",
             '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-r', str(FPS),
             '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-shortest', out])
    real = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout)
    segs.append(out); print(f'{k:02d} {e[0]:4} {e[1]:9} {t_film:6.2f}s +{real:.2f}s'); t_film += real

with open(f'{F}/seg/list.txt', 'w') as fh:
    fh.writelines(f"file '{s}'\n" for s in segs)
ins = []
for sgm in segs: ins += ['-i', sgm]
fc = ''.join(f'[{i}:v][{i}:a]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=1[v][a]'
run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium',
     '-crf', '17', '-r', str(FPS), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', f'{F}/film_voice.mp4'])

# ---------- score: Aphelion placed so the full ensemble enters on the turn (Yegge's line) ----------
D = t_film; M0 = SWELL - swell_at
print(f'total {D:.2f}s · music from {M0:.2f}s of Aphelion (swell at film {swell_at:.2f}s)')
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{F}/film_voice.mp4', '-ss', f'{M0:.3f}', '-t', f'{D:.3f}', '-i', MUSIC, '-filter_complex',
     f"[1:a]aresample=48000,volume=-6dB,afade=in:st=0:d=1.2,afade=out:st={D - 4.5:.3f}:d=4.5[m];"
     f"[0:a]aresample=48000:async=1:first_pts=0,asplit=2[vo][sc];"
     f"[m][sc]sidechaincompress=threshold=0.025:ratio=7:attack=12:release=380[md];"
     f"[vo][md]amix=inputs=2:duration=first:normalize=0,volume=3dB,alimiter=limit=0.89:level=false[a]",
     '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '224k', '-movflags', '+faststart', OUT])
print('wrote', OUT, f'{os.path.getsize(OUT) / 1e6:.1f} MB')
