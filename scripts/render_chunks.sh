#!/bin/bash
# renders the short in 6 chunks (skips finished ones), then joins them
cd /home/user/emden-short
export TMPDIR=/home/user/remotion-tmp TEMP=/home/user/remotion-tmp TMP=/home/user/remotion-tmp
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
N=1715; S=290; : > out/chunks.txt
for ((a=0; a<N; a+=S)); do
  b=$((a+S-1)); [ $b -ge $N ] && b=$((N-1))
  f=out/chunk_$(printf %04d $a).mp4
  echo "file $(basename $f)" >> out/chunks.txt
  [ -s $f ] && continue
  for try in 1 2 3; do
    npx remotion render src/index.ts EmdenShort $f --frames=$a-$b --codec h264 --crf 17 --browser-executable $B --gl swangle --concurrency 3 --timeout 300000 >> out/render.log 2>&1 && break
    rm -f $f
  done
done
ffmpeg -v error -y -f concat -i out/chunks.txt -c copy out/video.mp4 && echo JOINED
