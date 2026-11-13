# The Fake Chimney — animated short (SMS Emden, Penang 1914)

Vertical 1080x1920 cartoon short (2D characters in a 3D toon world) rendered with three.js inside Remotion.
English (`EmdenShort`, 57 s) and Spanish (`EmdenShortES`, 66 s) versions share one picture timeline; the Spanish
version time-warps it to its own voice (`public/warp_es.json`).

- `SCRIPT.md` — facts, sources and the English script; `voice/script_es.txt` — Spanish script
- `src/videos/emden/` — the short: `shots.ts` (story, cameras), `props.ts` (ships, harbour, sets), `chars.ts` (cast), `env.ts` (sky, sea), `Emden.tsx` (composition, captions, map)
- `src/videos/bridge/` — reused toon / ink / lens-blur modules from the MIT "claude-animated-shorts" skill template
- `audio/make_audio.py` — synthesized score + SFX mix (`LANG_SHORT=es` for Spanish), needs the skill's audio kit
- `voice/` — Piper TTS voices (models not committed: en_US-ryan-high, es_ES-davefx-medium) + word timings

## Render (on a machine with a GPU this takes minutes)
```
npm install
npx remotion render src/index.ts EmdenShortES out/video_es.mp4 --codec h264 --crf 17
ffmpeg -i out/video_es.mp4 -i audio/mix_es_final.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k out/final_es.mp4
```
