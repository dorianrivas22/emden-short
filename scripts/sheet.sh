#!/usr/bin/env bash
# Render stills of a composition and tile them into contact sheets (6x2 per sheet, frame number on each tile).
# usage: bash scripts/sheet.sh <compId> <outDir> <frame,frame,...>
set -e
COMP=$1; OUT=$2; FR=$3
export PATH="/c/Program Files/nodejs:$PATH:$(dirname "$(ls "$(cygpath "$LOCALAPPDATA")"/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe | head -1)")"
mkdir -p "$OUT"; rm -f "$OUT"/x_*.jpg "$OUT"/s_*.jpg "$OUT"/sheet_*.jpg
node scripts/stills_win.mjs "$COMP" "$OUT/x_" "$FR" 0.5 | grep -E "error|Error" || true
i=0; for f in $(echo "$FR" | tr ',' ' '); do
  ffmpeg -v error -y -i "$OUT/x_$f.jpg" -vf "scale=270:480,drawtext=fontfile='C\:/Windows/Fonts/consola.ttf':text='$f':x=6:y=4:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6" "$OUT/s_$(printf %03d $i).jpg"; i=$((i+1)); done
n=0; while [ $((n*12)) -lt $i ]; do ffmpeg -v error -y -start_number $((n*12)) -i "$OUT/s_%03d.jpg" -vf "tile=6x2:color=black" -frames:v 1 "$OUT/sheet_$n.jpg"; n=$((n+1)); done
ls "$OUT"/sheet_*.jpg
