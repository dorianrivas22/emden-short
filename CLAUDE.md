# Project notes for Claude

The owner makes vertical animated story shorts (YouTube Shorts style) and talks in Spanish. Reply in Spanish.

## What this repo is
- **The Fake Chimney** (SMS Emden, Penang 1914): a finished short in English (`EmdenShort`, 57 s) and Spanish (`EmdenShortES`, 66 s). See `README.md` for files and render commands.
- `research/`: frame-by-frame study of the top shorts of the reference channel (style study only, never copy their stories, characters or shots; never name the channel in a video). One `ANALISIS.md` per video plus key frames, 0.1 s contact sheets, per-frame image metrics (CSV) and word-timed transcripts.
  - `01_ancient_jar` (33 M views, first 21 s), `03_job_japan` (17 M, first 25 s), `04_storm_oil` (16 M, complete, original English audio), `08_grave_bell` (12 M, complete, original English audio).
  - Not analysed yet: #2 "Why Perfect Railroads Don't Work", #5-#7, #9, #10, and the endings of #1 and #3. The owner screen-records them (25 s pieces, sometimes at 1.1x speed: undo with setpts=1.1*PTS + atempo).

## The channel formula (from research/)
- **Script**: one-line absurd/macabre hook mid-action (no date, no name) -> skeptics laugh or doubt -> escalation with *But / Then / Instead* -> the explanation arrives at ~2/3 with **"You see,"** -> an everyday analogy that calls back an early line -> a poetic-justice ending that stops dead on the last word. Second person ("Imagine your boss...") or third; double twists work (grave bell). The narrator may voice the viewer's question ("Wait. Practiced?").
- **Voice**: ~3.7-3.8 words/s, only ~2 pauses > 0.25 s per minute, heavily compressed (LRA ~2-3 LU), a continuous music/ambience bed ~4 dB under the voice.
- **Picture**: 2D bean-head white-faced characters with plum ink outlines in a detailed 3D toon world with black ink lines; a new visual idea every ~1.5-2 s; almost no hard cuts (push-ins, whip pans, fly-throughs, through-the-window moves, 5-8 frame dissolves, shape match cuts); a literal visual gag on every noun.
- **Light/colour**: colour temperature follows the emotion (warm safe / cold danger / warm explanation / cold + one complementary accent at the climax); lifted blacks (p2 ~0.08-0.14), soft contrast (std ~0.2), saturation ~0.3-0.6; the story's key object carries the only warm accent in cold scenes; time passing told with light changing inside one shot.
- **Captions**: 1-2 words at a time, bold white sans with a thin black outline and soft shadow, centred at ~68 % of the height.

## How the Emden short is built
- `src/videos/emden/shots.ts`: every shot = time span (s, English timeline), mood, camera keys (`path`), and a `pose` that places ships/sets/characters. Characters' faces are at ~1.5 m; ships are 60 m long, so frame them lengthwise for vertical video.
- The Spanish version time-warps the English picture timeline to its own voice through `public/warp_es.json` (matched sentence and key-word starts); `audio/make_audio.py` warps the SFX the same way (`LANG_SHORT=es`).
- Character drawing, ink outline, lens blur: reused from the `cartoon-3d-short` skill template (`src/videos/bridge/`). The skill lives at https://github.com/mromidev/claude-animated-shorts (clone it into `~/.claude/skills/cartoon-3d-short/`; `audio/make_audio.py` imports its audio kit from there).
- Voices: Piper TTS, `en_US-ryan-high` (length-scale 0.86) and `es_ES-davefx-medium` (0.8). Spelling tricks for the TTS: "Penán", "Emmden", "mil novecientos catorce".
- Final mix: `audio/mix*_final.wav` = limiter + loudnorm to -14.5 LUFS, -1 dBTP.
- In the cloud (no GPU) a 1080x1920 frame took ~3.5 s; on a machine with a GPU render with Remotion's default GL.
