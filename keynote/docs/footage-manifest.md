# Footage manifest

Real aerial footage of San Francisco used in moment 4, `sf-arrival` (scene: `src/scenes/sf-arrival.js`). Both clips are on Pexels under the [Pexels License](https://www.pexels.com/license/): free to use and modify, attribution not required (we credit anyway). The licence forbids selling unaltered copies, redistributing the clips on other stock or wallpaper platforms, implying endorsement by people or brands in the image, and using them as a trademark. Neither clip shows identifiable people or a dominant brand logo. Licence page read on 18 Nov 2026.

The graded plates (`media/plates/*.mp4`) are served with the keynote and never committed (`.gitignore`). Their posters (`media/plates/*.webp`, each plate's last frame) are committed and inlined in `index.html`. The static fallback, render mode (`?render=1`), back-navigation and a missing plate all show the poster.

## The plates

| | Golden Gate at dusk (step 1) | Financial District at dusk (steps 2–3) |
|---|---|---|
| Title on Pexels | «Golden Gate Bridge at Dusk Aerial View» | «Aerial view of the city skyline at sunset» |
| Creator | [Asad Mehmood](https://www.pexels.com/@asad-mehmood-2148874628/) | [Advancer Drones](https://www.pexels.com/@advancerdrones/) |
| Page | https://www.pexels.com/video/golden-gate-bridge-at-dusk-aerial-view-34024355/ | https://www.pexels.com/video/aerial-view-of-the-city-skyline-at-sunset-19834302/ |
| Licence | [Pexels License](https://www.pexels.com/license/) | [Pexels License](https://www.pexels.com/license/) |
| Date on Pexels | 24 Sep 2025 | 12 Jan 2024 |
| Source file | 3840×2160, 29.97 fps, 25.4 s, H.264, 189.0 MB | 3840×2160, 59.94 fps, 36.4 s, H.264, 82.1 MB |
| What it shows | The drone flies in over the north (Marin) end of the bridge at blue hour, toward the lit north tower and the city. Behind it: the south tower and San Francisco's hills, with Sutro Tower on the skyline. | The drone pulls back from Salesforce Tower at dusk: 181 Fremont beside it, the Transamerica Pyramid, the Bay beyond. |
| Part used | 6.4–24.4 s | 3.0–12.4 s |
| Edit | Real speed. Full frame. 18 s, so the shot is still moving if step 1 runs long. | 3.0–10.0 s at real speed, then a slow-down to 0.15× over 10.0–12.4 s, which runs 5.4 s on screen. The camera move settles instead of stopping, because step 3 holds this frame. The 60 fps source keeps the slow part smooth. Cropped to the left 3456×1944 window (x 0, y 96), so both towers sit to the right of the title block. |
| Grade | Downscaled to 1920×1080. Temporal denoise (the dusk sky was noisy). Slightly cooler shadows and mids, a small lift in the blacks. | Downscaled to 1920×1080. Light denoise. Cooler throughout, brightest highlights rolled off slightly, exposure as shot: the same dusk, nudged toward blue hour. |
| Plate | `media/plates/sf-golden-gate-dusk.mp4`: 1920×1080, 29.97 fps, 18.0 s, H.264 High, CRF 20, faststart, no audio, 10.7 MB | `media/plates/sf-financial-district-dusk.mp4`: 1920×1080, 29.97 fps, 12.3 s, H.264 High, CRF 20, faststart, no audio, 5.2 MB |
| Poster | `media/plates/sf-golden-gate-dusk.webp` (last frame, 46 KB) | `media/plates/sf-financial-district-dusk.webp` (last frame, 70 KB) |

The grade only changes colour and exposure. Nothing was added to or removed from the image, and the scene puts no labels on it.

## Credit line (README)

> San Francisco aerial footage (moment 4): «Golden Gate Bridge at Dusk Aerial View» by Asad Mehmood and «Aerial view of the city skyline at sunset» by Advancer Drones, both on Pexels under the Pexels License; cut and graded for this keynote. Sources and edits: `keynote/docs/footage-manifest.md`.

## Rebuild the plates

Download the two source files from their Pages (the Pexels "Free download" button, original 4K). Then, from `keynote/`, with `GG` and `FD` set to the two source files:

```sh
X264="-c:v libx264 -preset slow -crf 20 -profile:v high -level 4.0 -pix_fmt yuv420p -g 60 -bf 2 -x264-params aq-mode=3:aq-strength=0.9:deblock=-1,-1 -movflags +faststart -an -color_primaries bt709 -color_trc bt709 -colorspace bt709"

ffmpeg -ss 6.4 -t 18 -i "$GG" -vf "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int,hqdn3d=3:2.5:6:4.5,format=gbrp16le,colorbalance=rs=-0.02:bs=0.035:rm=-0.015:bm=0.025,curves=all='0/0.012 0.25/0.24 0.6/0.62 1/1',format=yuv420p" ${=X264} media/plates/sf-golden-gate-dusk.mp4

ffmpeg -ss 3 -i "$FD" -vf "trim=duration=9.4,setpts='(if(lt(T,7),T,7+(2.4/0.85)*log(1/(1-0.85*min(T-7,2.4)/2.4))))/TB',crop=3456:1944:0:96,scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int,fps=30000/1001,hqdn3d=2:1.5:4:3,format=gbrp16le,colorbalance=rs=-0.025:bs=0.04:rm=-0.025:gm=-0.005:bm=0.03:rh=-0.04:gh=-0.01:bh=0.015,curves=all='0/0.008 0.25/0.235 0.5/0.5 0.8/0.795 1/0.94',format=yuv420p" ${=X264} media/plates/sf-financial-district-dusk.mp4
```

(`${=X264}` is zsh word-splitting; in bash write `$X264`.) Posters: export each plate's last frame as a PNG, then save it as WebP quality 80 (Pillow; this ffmpeg build has no WebP encoder).
