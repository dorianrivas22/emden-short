# Sound for "The Fake Chimney": an original sneaky pizzicato/glock score + synthesized SFX, ducked under the voice.
# Uses the skill's own DSP kit (dsp.py, instruments.py, sfx_gen.py). Output: mix.wav (48 kHz stereo, exact length).
import sys, os
sys.path.insert(0, os.path.expanduser("~/.claude/skills/cartoon-3d-short/templates/audio"))
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, st, place, fades, make_ir, convolve_st, integrated, read_wav, write_wav, dbg, norm_to, true_peak
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
LANG = os.environ.get("LANG_SHORT", "en")
import json
if LANG == "es":
    P = json.load(open(os.path.join(HERE, "../public/warp_es.json")))   # [t_es, t_en] pairs
    def M(t):  # English picture time -> Spanish output time
        if t <= P[0][1]: return t - P[0][1] + P[0][0]
        for (a0, b0), (a1, b1) in zip(P, P[1:]):
            if t < b1: return a0 + (t - b0) * (a1 - a0) / (b1 - b0)
        return P[-1][0] + (t - P[-1][1])
    VOICE_END, VOICE = 65.28, "../voice/voice_es.wav"
else:
    M = lambda t: t
    VOICE_END, VOICE = 56.16, "../voice/voice.wav"
TOTAL = round((VOICE_END + 1.0) * FPS)
DUR = TOTAL / FPS
N = ns(DUR)
r = rng(7)

def buf(): return np.zeros((2, N))
def put(b, x, t, g=1.0, p=0.0, warp=None):
    if warp is None: warp = b is fx
    if warp: t = M(t)
    if np.ndim(x) == 1: x = pan(x, p)
    place(b, x, t, g)

# ---------------- music ----------------
BPM = 104; beat = 60 / BPM
mus = buf(); fx = None
# A minor sneaky theme: pizzicato bass walking, glock melody, brushes; bright major tag at the end.
bass_prog = [45, 52, 45, 52, 41, 48, 40, 47]           # A E A E F C E B (one note per beat, 2 bars per row)
mel = [(0, 69, .5), (.5, 72, .5), (1, 76, .5), (1.5, 75, .5), (2, 76, 1), (3.5, 72, .5),
       (4, 74, .5), (4.5, 72, .5), (5, 71, .5), (5.5, 69, .5), (6, 68, 1), (7.5, 64, .5)]
sections = [  # (t0, t1, energy)
    (0.0, 11.6, 1.0), (11.6, 14.4, 1.2), (14.4, 20.9, 0.9), (20.9, 34.0, 0.75), (34.6, 45.2, 0.8), (45.2, 52.1, 1.0)]
for t0, t1, e in sections:
    t0, t1 = M(t0), M(t1)
    t = t0; k = 0
    while t < t1 - 0.05:
        n = bass_prog[k % len(bass_prog)]
        put(mus, I.pluck(I.m2f(n), vel=0.75 * e, r=r, dur=0.5), t, 0.9, -0.15)
        if k % 2 == 1: put(mus, I.brush(vel=0.35 * e, r=r), t, 0.6, 0.2)
        if e >= 0.9 and k % 8 == 0:
            for (bt, m, d) in mel:
                if t + bt * beat < t1: put(mus, I.glock(I.m2f(m), vel=0.45 * e, r=r, dur=1.2), t + bt * beat, 0.55, 0.25)
        t += beat; k += 1
# tension before the attack: low pad + timpani
put(mus, I.pad([I.m2f(45), I.m2f(52), I.m2f(57)], M(34.0) - M(30.9) + 0.2, vel=0.5, r=r, att=1.2, rel=0.5), M(30.9), 0.8)
put(mus, I.timpani(I.m2f(45), vel=0.9, r=r), M(34.0), 1.2)
put(mus, I.cymbal(vel=0.8, r=r), M(34.0), 0.9)
# victory tag in A major
for i, m in enumerate([69, 73, 76, 81]): put(mus, I.glock(I.m2f(m), vel=0.6, r=r, dur=1.6), M(52.15) + i * beat / 2, 0.7, 0.2)
t = M(52.15); T0 = t
while t < DUR - 0.6:
    for n in [45, 52]:
        put(mus, I.pluck(I.m2f(n + 4 if int((t - T0) / beat) % 4 >= 2 else n), vel=0.7, r=r, dur=0.5), t, 0.9, -0.15); t += beat
put(mus, I.glock(I.m2f(81), vel=0.7, r=r, dur=2.0), VOICE_END - 0.3, 0.8)
put(mus, I.triangle(vel=0.5, r=r), VOICE_END - 0.3, 0.6)

# ---------------- SFX ----------------
fx = buf()
# hook: hammer hits synced to the picture (hit phase 0.3 of a 2.4 Hz cycle; second sailor offset by half a cycle)
for k in range(12):
    for off in (0.3, 0.8):
        t = (k + off) / 2.4
        if 0.9 < t < 4.2: put(fx, G.hammer_hit(r, big=0.6), t, 0.5, -0.3 if off == 0.3 else 0.3)
# canvas flap while it wraps
put(fx, G.flag_flutter(1.2, r), 2.9, 0.35)
# fake funnel lowered and bolted
put(fx, G.whoosh(0.7, r, peak=0.5, f_lo=200, f_hi=1500), 4.35, 0.6)
put(fx, G.clink(r, f0=2400), 5.06, 0.9); put(fx, G.clink(r, f0=1900), 5.2, 0.7)
put(fx, G.push_thump(r), 5.06, 0.8)
# "?" pop
put(fx, I.glock(I.m2f(84), vel=0.5, r=r, dur=0.6), 6.9, 0.5)
# arts and crafts hammer (2.6 Hz, hit at phase 0)
for k in range(8):
    t = 9.7 + (k - (9.7 * 2.6) % 1) / 2.6 + 1 / 2.6
    if 9.75 < t < 11.55: put(fx, G.hammer_hit(r, big=0.45), t, 0.45)
# map: scribble / pin pop
put(fx, G.whoosh(0.4, r, peak=0.3, f_lo=1500, f_hi=5000), 11.75, 0.25)
put(fx, I.glock(I.m2f(88), vel=0.6, r=r, dur=0.8), 13.28, 0.6)
# harbour at night: crickets + water
put(fx, G.crickets(3.2, r), 14.4, 0.25)
# police: tiptoe steps
for k in range(9): put(fx, G.stroll_step(r, scuff=0.2), 17.6 + k * 0.32, 0.4)
put(fx, G.whoa(r), 20.3, 0.35)
# the number pops (chimney counting) and the 4th funnel dropping on
for i, t in enumerate([24.98, 25.18, 25.38, 25.6]): put(fx, I.glock(I.m2f(76 + 2 * i), vel=0.6, r=r, dur=0.5), t, 0.55)
for i, t in enumerate([38.85, 39.1, 39.35, 39.62]): put(fx, I.glock(I.m2f(76 + 2 * i), vel=0.6, r=r, dur=0.5), t, 0.55)
for i, t in enumerate([40.3, 40.6, 40.95]): put(fx, I.glock(I.m2f(72 + 2 * i), vel=0.6, r=r, dur=0.5), t, 0.55)
put(fx, G.whoosh(0.3, r, peak=0.25), 40.95, 0.5); put(fx, G.clink(r, f0=2000), 41.25, 0.8)
# flag hoist + flutter
put(fx, G.flag_flutter(1.4, r), 33.0, 0.5)
# the attack: cannon booms
for i, t in enumerate([34.0, 34.06, 34.14, 34.22]):
    boom = lp(r.standard_normal(ns(1.6)), 180, 2) * np.exp(-np.arange(ns(1.6)) / SR / 0.35) * 6
    crack = hp(r.standard_normal(ns(0.2)), 1200, 2) * np.exp(-np.arange(ns(0.2)) / SR / 0.02) * 1.5
    put(fx, fades(boom), t, 0.9, -0.3 + 0.2 * i); put(fx, fades(crack), t, 0.6, -0.3 + 0.2 * i)
# a lookout "hm?"
put(fx, G.oof(r, kind="oof"), 36.25, 0.25)
# crowd murmur for the square
put(fx, G.babble(3.6, r, base=150, scale=1.0), 41.5, 0.22)
# sinking: splash + bubbles
put(fx, G.splash_big(r), 46.6, 0.7)
put(fx, G.bubbles(1.8, r, rate=18), 46.9, 0.45)
# sea ambience across sea shots
sea = G.water_bed(DUR, r, close=0.5)
for (a, b) in [(4.25, 5.9), (8.1, 9.7), (14.4, 17.4), (20.9, 41.4), (45.2, 52.15)]:
    a, b = M(a), M(b)
    seg = st(sea)[:, ns(a):ns(b)].copy(); n = seg.shape[1]; env = np.ones(n); f = min(n // 4, ns(0.3)); env[:f] = np.linspace(0, 1, f); env[-f:] = np.linspace(1, 0, f)
    put(fx, seg * env, a, 0.35, warp=False)
# market: birds + laughter-ish babble
put(fx, G.bird_chirps(4.5, r), 52.3, 0.3)
put(fx, G.babble(2.0, r, base=220, scale=1.2, rate=6.0), 54.1, 0.25)
# whooshes on cuts
for t in [4.25, 8.1, 11.6, 14.4, 17.4, 26.4, 37.1, 41.4, 45.2, 52.15]: put(fx, G.whoosh(0.45, r, peak=0.6), t - 0.3, 0.22)

# ---------------- mix ----------------
voice = st(read_wav(os.path.join(HERE, VOICE))[0])
v = np.zeros((2, N)); m = min(N, voice.shape[1]); v[:, :m] = voice[:, :m]
ir = make_ir(1.1, 3)
mus = mus + 0.18 * convolve_st(mus, ir)[:, :N]
fx = fx + 0.08 * convolve_st(fx, ir)[:, :N]
# ducking: music down ~9 dB while the voice talks
env = np.abs(v).mean(0); k = ns(0.12); env = np.convolve(env, np.ones(k) / k, "same"); env = env / (env.max() + 1e-9)
duck = 1 - 0.62 * np.clip(env * 6, 0, 1)
duck = np.convolve(duck, np.ones(ns(0.08)) / ns(0.08), "same")
mus *= duck[None, :]
vl = integrated(v); ml = integrated(mus); fl = integrated(fx)
mus *= dbg((vl - 15) - ml)   # music bed ~15 LU under the voice (before ducking gain)
fx *= dbg((vl - 9) - fl)     # effects ~9 LU under the voice
mix = v + mus + fx
mix *= dbg(-14.5 - integrated(mix))
pk = true_peak(mix)
if pk > dbg(-1.0): mix *= dbg(-1.0) / pk
write_wav(os.path.join(HERE, "mix.wav" if LANG == "en" else "mix_es.wav"), mix.astype(np.float64))
print("mix", round(integrated(mix), 1), "LUFS, len", mix.shape[1] / SR)
