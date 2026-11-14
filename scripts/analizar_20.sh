#!/usr/bin/env bash
# Analiza los 20 últimos shorts del canal de referencia (lista en research/_fuentes/lista20.txt):
# pipeline completo (scripts/analizar_short.py) si falta datos.json, y siempre las métricas avanzadas.
# Los ya analizados antes (=carpeta) solo reciben las métricas avanzadas en su carpeta.
export PATH="$PATH:$(dirname "$(ls "$(cygpath "$LOCALAPPDATA")"/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe | head -1)")"
PY=../.venv-analisis/Scripts/python.exe
mapfile -t LINES < <(tr -d '\r' < research/_fuentes/lista20.txt | sed '/^$/d')
for line in "${LINES[@]}"; do
  IFS='|' read -r n id name <<< "$line"
  if [[ $name == =* ]]; then d="research/${name#=}"; else d="research/ultimos20/${n}_${name}"; fi
  if [[ $name != =* && ! -f "$d/datos.json" ]]; then echo "== $n $name: pipeline"; $PY scripts/analizar_short.py "research/_fuentes/$id.mp4" "$d" < /dev/null | tail -1; fi
  if [[ ! -f "$d/avanzadas.json" ]]; then $PY scripts/metricas_avanzadas.py "research/_fuentes/$id.mp4" "$d" < /dev/null > /dev/null && echo "== $n avanzadas ok"; fi
done
for v in inflation/the_money_stove_en rats/rat_tail_bounty_en sewers/built_too_big_en; do $PY scripts/metricas_avanzadas.py out/$v.mp4 research/_propios/$(basename $v) < /dev/null > /dev/null; done
echo ALL DONE
