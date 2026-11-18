#!/bin/bash
# Grab exact full-resolution (1920x1080) frames from the livestream.
# Usage: grab.sh OUTDIR PREFIX T1 [T2 ...]     (T = seconds like 932.5, or H:MM:SS(.s) like 0:15:32.5)
# Writes OUTDIR/PREFIX_<H-MM-SS.s>.jpg and prints each path.
VIDEO="${AIE_VIDEO:-work/video.mp4}"
OUT="$1"; PFX="$2"; shift 2
mkdir -p "$OUT"
for T in "$@"; do
  if [[ "$T" == *:* ]]; then
    IFS=: read -r h m s <<< "$T"; S=$(echo "$h*3600 + $m*60 + $s" | bc -l)
  else S="$T"; fi
  H=$(printf "%.1f" "$S" | awk '{t=$1; h=int(t/3600); m=int((t-h*3600)/60); s=t-h*3600-m*60; printf "%d-%02d-%04.1f", h, m, s}')
  P="$OUT/${PFX}_${H}.jpg"
  ffmpeg -v error -y -ss "$S" -i "$VIDEO" -frames:v 1 -q:v 2 "$P" && echo "$P"
done
