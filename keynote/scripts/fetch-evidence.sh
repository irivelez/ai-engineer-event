#!/bin/sh
# Rebuilds the third-party video evidence in media/evidence/ (git-ignored) from the official uploads, exactly:
# same YouTube video, same section, same trim, same poster frame. Every clip is listed in src/data/evidence.json.
# Used by: Irina's keynote "Inside the AI Frontier" (19 Nov 2026) for its evidence moments. Delete by 2027-01-31.
# Needs: yt-dlp, ffmpeg, python3 with Pillow. Usage: scripts/fetch-evidence.sh [clip-id ...]  (no ids = all)
# YTDLP=<path> overrides the yt-dlp binary (e.g. a wrapper when the system DNS is down).
set -eu
cd "$(dirname "$0")/.."
YTDLP="${YTDLP:-yt-dlp}"
OUT=media/evidence
TMP=.dev/evidence-dl
FMT='bv*[height<=1080][vcodec^=avc1]+ba/b[height<=1080]'
mkdir -p "$OUT" "$TMP"
ONLY=" $* "

# clip <id> <youtubeId> <start s> <end s> <poster at s, relative to the clip>
clip() {
  id=$1 yt=$2 s=$3 e=$4 p=$5
  if [ "$ONLY" != "  " ]; then case "$ONLY" in *" $id "*) ;; *) return 0 ;; esac; fi
  dur=$(awk "BEGIN{print $e - $s}")
  echo "== $id  https://www.youtube.com/watch?v=$yt  $s-$e s"
  rm -f "$TMP/$id".*
  "$YTDLP" --no-warnings -q -f "$FMT" --merge-output-format mp4 --download-sections "*$s-$e" --force-keyframes-at-cuts \
    -o "$TMP/$id.%(ext)s" "https://www.youtube.com/watch?v=$yt"
  ffmpeg -v error -y -i "$TMP/$id.mp4" -t "$dur" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 160k -movflags +faststart "$OUT/$id.mp4"
  ffmpeg -v error -y -ss "$p" -i "$OUT/$id.mp4" -frames:v 1 -vf scale=1600:-2 "$TMP/$id-poster.png"
  python3 -I -c "import sys; from PIL import Image; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], 'WEBP', quality=88, method=6)" \
    "$TMP/$id-poster.png" "$OUT/$id.webp"
}

# Act II · three-labs: the labs' own launch films
clip three-labs-anthropic-fable52-video   6a1QSJlsYpU 0     19    15.5  # Claude: "Introducing Claude Fable 5.2" (music only)
clip three-labs-openai-gpt62-video        C1zYX5jwqq4 109.5 119   2.5   # OpenAI: GPT-6.2 Astra end card + OpenAI mark
# Act II · science
clip science-anthropic-biology-lab-video  DdCEmlAydcw 45.5  56    2     # Anthropic: "Inside Anthropic's molecular biology lab"
# Act I · San Francisco: AI Engineer's own recordings, cut at the quote (second-exact from YouTube's captions)
clip slop-lauren-tan-11000-prs            O_zcc6Xl12g 812     825.6   8.5   # "…shipped a ridiculous 11,000 pull requests to production"
clip verification-brian-kennedy-judge     ZZ19zhYnDKY 22370.3 22384.4 10.5  # "The agent made it up and the judge approved it."
clip lean-harness-philipp-schmid          ZZ19zhYnDKY 9253.9  9259    3     # "Models will keep eating the harness."
clip org-quinn-slack-21-people            y9JtCCZP2MQ 28966.4 28984   9.5   # "we had to stay at 21 people… a forcing function"
clip last-job-ishaan-dey                  y9JtCCZP2MQ 22897.5 22912   12    # "Protect your judgment and build things that people want."
