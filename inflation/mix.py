# Level lock (cartoon-audio-short skill, stage 4.7): music at exactly 50 % of the voice's gated RMS (-6 dB),
# SFX at 50 % with peaks capped at 0.7x the voice peak. No ducking, no compression: the voice is untouched and
# the only gain on the whole mix comes later in finish (one linear gain + a peak limiter).
# usage: python inflation/mix.py voice.wav music.wav sfx.wav [out.wav]
import sys, os
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "skills", "cartoon-3d-short", "templates", "audio"))
from dsp import SR, read_wav, write_wav, st

def gated_rms(x, block=0.4, rel_db=-10.0, abs_db=-60.0):
    m = x.mean(0) if x.ndim > 1 else x
    n = int(block * SR); k = len(m) // n
    if k == 0: return float(np.sqrt(np.mean(m ** 2)))
    e = (m[: k * n].reshape(k, n) ** 2).mean(1)
    e = e[e > 10 ** (abs_db / 10)]
    if not len(e): return 1e-9
    e = e[e > e.mean() * 10 ** (rel_db / 10)]
    return float(np.sqrt(e.mean()))
db = lambda x: 20 * np.log10(max(x, 1e-12))

def load(p, n=None):
    x, sr = read_wav(p); assert sr == SR, (p, sr)
    x = st(x[0] if x.shape[0] == 1 else x)
    if n is not None:
        y = np.zeros((2, n)); m = min(n, x.shape[1]); y[:, :m] = x[:, :m]; x = y
    return x

voice_p, music_p, sfx_p = sys.argv[1:4]
out = sys.argv[4] if len(sys.argv) > 4 else os.path.join(HERE, "audio", "mix.wav")
m = load(music_p); N = m.shape[1]
v = load(voice_p, N); s = load(sfx_p, N)
rv = gated_rms(v); pv = np.abs(v).max()
m *= 0.5 * rv / gated_rms(m)                       # music = 50 % of the voice (-6.0 dB)
gs = 0.5 * rv / gated_rms(s)                       # SFX = 50 % ...
gs = min(gs, 0.7 * pv / np.abs(s).max())           # ... with peaks capped at 0.7x the voice peak
s *= gs
mix = v + m + s
write_wav(out, mix.astype(np.float64))
print(f"voice  gated RMS {db(rv):6.1f} dBFS, peak {db(pv):6.1f} dBFS")
print(f"music  gated RMS {db(gated_rms(m)):6.1f} dBFS  -> {db(gated_rms(m)) - db(rv):+.1f} dB vs voice")
print(f"sfx    gated RMS {db(gated_rms(s)):6.1f} dBFS  -> {db(gated_rms(s)) - db(rv):+.1f} dB vs voice, peak {np.abs(s).max() / pv:.2f}x voice peak")
print(f"mix -> {out} ({N / SR:.3f} s)")
