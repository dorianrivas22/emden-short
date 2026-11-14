# Finish (cartoon-audio-short skill, stage 4.8): one linear gain to about -14 LUFS + a -1 dBFS peak limiter on the
# locked mix, H.264 CRF 17 + AAC, then QA: frozen spans >= 0.4 s, black frames, loudness, and a QA contact sheet.
# usage: python inflation/finish.py <video.mp4> <mix.wav> <out.mp4> "Title"
import sys, os, subprocess, re
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "skills", "cartoon-3d-short", "templates", "audio"))
from dsp import SR, read_wav, write_wav, integrated, st
from scipy import ndimage

video, mixp, out, title = sys.argv[1:5]
x, sr = read_wav(mixp); x = st(x[0] if x.shape[0] == 1 else x)
g = 10 ** ((-14.0 - integrated(x)) / 20); x = x * g                     # one linear gain
ceil = 10 ** (-1.0 / 20)
a = np.abs(x).max(0); need = np.minimum(1.0, ceil / np.maximum(a, 1e-9))  # peak limiter: 3 ms look-ahead, 80 ms release
la = int(0.003 * SR); gmin = ndimage.minimum_filter1d(need, 2 * la + 1)
rel = 1 - np.exp(-1 / (0.08 * SR)); env = np.empty_like(gmin); e = 1.0
for i in range(len(gmin)):
    e = gmin[i] if gmin[i] < e else e + (gmin[i] - e) * rel; env[i] = e
x = x * env[None, :]
wav = os.path.splitext(out)[0] + "_audio.wav"; write_wav(wav, x.astype(np.float64))
print(f"gain {20 * np.log10(g):+.1f} dB, limiter max reduction {20 * np.log10(env.min()):.1f} dB, integrated {integrated(x):.1f} LUFS")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-crf", "17", "-preset", "slow",
                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-shortest", "-metadata", f"title={title}", "-movflags", "+faststart", out], check=True)
# ---------------- QA ----------------
qa = subprocess.run(["ffmpeg", "-v", "info", "-i", out, "-vf", "freezedetect=n=0.001:d=0.4,blackdetect=d=0.05:pix_th=0.06", "-af", "ebur128=peak=true",
                     "-f", "null", "-"], capture_output=True, text=True).stderr
frz = re.findall(r"freeze_duration: ([\d.]+)", qa); blk = re.findall(r"black_duration:([\d.]+)", qa)
summ = qa[qa.rfind("Summary:"):] if "Summary:" in qa else ""
I = re.search(r"I:\s+(-?[\d.]+) LUFS", summ); P = re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ)
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
print(f"QA: duration {dur:.2f} s | frozen spans >= 0.4 s: {frz or 'none'} | black: {blk or 'none'} | loudness {I.group(1) if I else '?'} LUFS, true peak {P.group(1) if P else '?'} dBFS")
sheet = os.path.join(os.path.dirname(out), "qa_sheet.jpg")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-vf", "fps=1/2,scale=216:384,tile=7x4:color=black", "-frames:v", "1", sheet], check=True)
print("sheet", sheet)
