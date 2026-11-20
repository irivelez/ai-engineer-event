# AI Engineer event

**Who uses it:** Irina, for her AI Engineer event project. **Review by:** 17 Feb 2027.

## AI Engineer CODE Summit 2026 · Day One, retold

A cinematic keynote that narrates the 9-hour Day 1 livestream (Wednesday 11 November 2026,
Hilton San Francisco Union Square) through 54 moments, at least one from every session. Each moment pairs a
real frame from the broadcast with the line that was said and its exact timecode.

- **Open:** `dist/aie-code-summit-2026-day1-keynote.html` (one self-contained file, works offline),
  or `keynote/index.html` (same deck, with the frames as separate files).
- **Start:** it opens on a title screen. Click **Play** for the cinematic cut (about 14 minutes,
  fullscreen, plays by itself), or press **→** to step through at your own pace.
- **Keys:** → or Space next · ← back · A autoplay on/off · H hide captions to see the clean frame ·
  G overview of all 68 slides · F fullscreen. Click any dot on the timeline to jump to that moment.
- **Every ▶ timecode** opens that second of the broadcast on YouTube.
- **To share:** `dist/aie-code-summit-2026-day1-teaser.mp4` is a 99-second 1080p teaser of the deck,
  for channels where an HTML file won't open (LinkedIn, WhatsApp, slides).

### What you'll see

- A 6-second trailer: every frame in the deck, flash-cut in the order the day happened, while an
  LED clock races from 09:00 to 18:00.
- Five acts and three interludes that follow the real programme, from the morning keynotes to
  Simon Willison's year in review. Each act card carries a film strip of that chapter's frames.
- Each moment pairs a real frame with the line that was said. The camera racks focus and pushes in
  on the number, chart or sentence that matters.
- A broadcast timeline along the bottom; the playhead travels to each moment's real clock time.
- A closing synthesis in the speakers' own words, the day in six numbers, a credits roll, and a
  mosaic of every frame.

## Invitation film: «Inside the AI Frontier»

`dist/inside-the-ai-frontier-invitation.mp4`: 86 seconds, 1080p, Spanish subtitles. It invites people to
the live session of 20 Nov 2026, 7 PM Bogotá (frontierinsiders.com/webinar), using only the room itself:
twelve speakers in their own voices, cut from the stream's real picture and sound.

- **Arc:** ambition (Corey Quinn's "ten years", 3,000 PRs, 99% written by Droid, 75% at Ramp) → tension
  ("code is abundant, confidence is not", a judge that approves an email that was never sent, agents
  gaming CI, Fable banned) → turn (the music's full ensemble enters on Steve Yegge's "the more agents
  I deploy, the more humans I need") → expectation (Simon Willison's "you just get faster", Michelle
  Chen's "What are you going to build today?") → the invitation.
- **Sound:** original audio from the stream, levelled per line; score "Aphelion" by Scott Buckley.
  Loudness −15.6 LUFS, true peak −1.3 dBTP.
- **Credit required wherever it is posted** (CC-BY 4.0):
  'Aphelion' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au
- **Source:** `scripts/film/` (edit list, subtitles, cards, mix). `clips.json` holds each line's exact
  start and end in the stream.

## What's in here

| Path | What it holds |
|---|---|
| `keynote/index.html` | The deck engine: fixed 1920×1080 stage, broadcast timeline, camera push-ins |
| `keynote/deck-data.js` | Every slide: quote, speaker, timecode, frame, focus box |
| `keynote/shots/` | The 56 frames the deck uses (1920×1080, straight from the stream) |
| `dist/` | The single-file build of the deck, the 99-second teaser, and the invitation film |
| `scripts/` | The pipeline that produced the deck, and `talks.json`, the map of all 32 stream segments |

## How it was made

1. Downloaded the stream in 1080p and its word-timed auto-captions, then mapped all 32 segments
   (live keynotes plus recorded online-track talks) from the official schedule and the MC's intros.
2. Extracted every keyframe in one pass (6,260 frames) and tiled them into 415 timestamped
   contact sheets.
3. Ten agents watched the day in parallel, about 40–65 minutes each: they read the transcript,
   watched the sheets, grabbed exact 1080p frames, and located every quote in the captions.
   Together they proposed 148 moments.
4. Curated 54 of them into five acts and three interludes. `scripts/verify_quotes.py` checks
   every quote fragment against the captions; all 70 fragments match (fuzzy ratio 0.88–1.00).
5. Rendered every slide in headless Chrome for visual QA, then built the single-file version
   and recorded the teaser from the deck itself.

## Caveats

- Quotes come from YouTube's auto-captions, lightly cleaned: fillers removed, mis-hearings fixed,
  cuts marked with "…". Names and titles come from the on-screen lower thirds or title slides.
- Numbers are as stated on stage. UiPath's and Glean's figures come from their own demo or
  internal runs. Meta's "up to 75%" slide figure is BigTech-wide and cites Alphabet's CEO.
- Simon Willison's slides title his talk "The last 12 months in LLMs" (the schedule says
  "2026 in LLMs"). Nikolay Petrov's employer was not stated, so none is shown.

## Rebuild

```sh
mkdir -p work
yt-dlp -f 299 -o work/video.mp4 "https://www.youtube.com/watch?v=ZZ19zhYnDKY"
yt-dlp --skip-download --write-auto-subs --sub-langs en-orig --sub-format json3 -o work/subs "https://www.youtube.com/watch?v=ZZ19zhYnDKY"
python3 scripts/parse_subs.py work/subs.en-orig.json3 work/words.json work/transcript.txt
python3 scripts/findq.py "code is abundant"            # locate any line in the captions
scripts/grab.sh work/frames demo 3:14:08                # exact 1080p frame at a timecode
python3 scripts/build_single.py keynote dist/aie-code-summit-2026-day1-keynote.html
python3 scripts/teaser.py keynote/index.html dist/aie-code-summit-2026-day1-teaser.mp4 \
  "1:10.4,2:7,3:6.5,22:7.5,11:7,41:7,33:8,54:7,57:8,60:8,62:7,68:9"   # slide:seconds
```
