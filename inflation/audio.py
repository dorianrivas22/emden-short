# Stems for "The Money Stove" (cartoon-audio-short skill, stage 4.7): writes ONLY stems, music.wav and sfx.wav.
# Music: a short oom-pah march loop (kick/snare, plucked + tuba bass, brass pad) that stops dead at the twist line
# (sentence 22), then a low drone. SFX on story events, every cue placed on the narration's word timings.
# usage: python inflation/audio.py  -> inflation/audio/music.wav, inflation/audio/sfx.wav (48 kHz stereo, exact length)
import sys, os, json, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "skills", "cartoon-3d-short", "templates", "audio"))
import numpy as np
from dsp import SR, ns, rng, lp, hp, bp, pan, st, place, fades, make_ir, convolve_st, write_wav
import instruments as I
import sfx_gen as G

FPS = 30
W = json.load(open(os.path.join(ROOT, "public", "inflation_words_en.json"), encoding="utf-8"))
SENT = [0.0] + [W[i + 1]["s"] for i, w in enumerate(W[:-1]) if re.search(r"[.?]$", w["w"])]
DUR = 1703 / FPS; N = ns(DUR)   # exactly the video length (= the voice length)
def S(n, f=0.0):
    a = SENT[n]; b = SENT[n + 1] if n + 1 < len(SENT) else DUR
    return a + f * (b - a)
def word(n, k):
    i = next(j for j, w in enumerate(W) if w["s"] >= SENT[n] - 1e-3); return W[min(len(W) - 1, i + k)]["s"]
r = rng(23)
def buf(): return np.zeros((2, N))
def put(b, x, t, g=1.0, p=0.0):
    if np.ndim(x) == 1: x = pan(x, p)
    if t < DUR: place(b, x, max(0.0, t), g)
def noise_burst(d, lo, hi, tau, g=0.5):
    n = ns(d); return fades(bp(r.standard_normal(n), lo, hi) * np.exp(-np.arange(n) / SR / tau) * g)

# ---------------- music: oom-pah march ----------------
BPM = 116; beat = 60 / BPM
mus = buf()
TWIST = S(22)
# A minor march: bass on 1 and 3, chord stab on 2 and 4
BASS = [45, 40, 45, 40, 41, 36, 40, 44]          # A E A E F C E G#
CHORD = [[57, 60, 64], [57, 60, 64], [56, 59, 64], [57, 60, 64], [53, 57, 60], [53, 57, 60], [52, 56, 59], [52, 56, 59]]
MEL = [69, 72, 76, 74, 72, 71, 72, 69, 68, 71, 74, 72, 71, 69, 68, 64]
def march(t0, t1, e=1.0, melody=True, tempo=1.0):
    b = beat / tempo; t, k = t0, 0
    while t < min(t1, TWIST) - 0.03:
        bar = (k // 4) % len(BASS)
        if k % 2 == 0:
            put(mus, I.brass(I.m2f(BASS[bar] - 12 * 0), b * 0.9, vel=0.75 * e, r=r, kind="tuba"), t, 0.8, -0.1)
            put(mus, I.timpani(I.m2f(33), vel=0.45 * e, r=r, dur=0.4), t, 0.5)   # kick
        else:
            for m in CHORD[bar]: put(mus, I.pluck(I.m2f(m), vel=0.45 * e, r=r, dur=0.25), t, 0.45, 0.2)
            put(mus, I.snare(vel=0.35 * e, r=r), t, 0.45, 0.1)
        if melody and k % 2 == 0: put(mus, I.glock(I.m2f(MEL[(k // 2) % len(MEL)] + 12), vel=0.3 * e, r=r, dur=0.6), t, 0.35, 0.3)
        t += b; k += 1
def pad(t0, t1, notes, v=0.4):
    t1 = min(t1, TWIST)
    if t1 > t0: put(mus, I.pad([I.m2f(m) for m in notes], t1 - t0, vel=v, r=r, att=0.4, rel=0.5), t0, 0.6)
march(0.0, S(3), 0.9)                      # kitchen: march starts on frame 0 (hook)
march(S(3), S(6), 1.0, tempo=1.0)          # prices climb
march(S(6), S(11), 1.05)                   # street life
pad(S(11), S(12), [57, 60, 64], 0.35)       # "but where...?" hold
march(S(12), S(15), 0.9, melody=False)     # explanation, darker (no melody)
pad(S(15), S(18), [45, 52, 57, 60], 0.4)    # pizza diagram: warm pad
march(S(18), TWIST, 1.0)                   # the fix
# twist: music stops dead, a low drone continues to the end
put(mus, I.pad([I.m2f(33), I.m2f(40)], DUR - TWIST + 0.2, vel=0.55, r=r, att=0.05, rel=0.4, warm=400), TWIST, 0.9)

# ---------------- SFX ----------------
fx = buf()
def crackle(dur, dens=18):
    n = ns(dur); x = np.zeros(n)
    for _ in range(int(dens * dur)):
        i = int(r.random() * (n - ns(0.02))); m = ns(0.004 + 0.01 * r.random()); x[i:i + m] += hp(r.standard_normal(m), 1500, 2) * np.hanning(m) * (0.2 + 0.6 * r.random())
    return x + 0.05 * lp(r.standard_normal(n), 300, 2)
def bed(sig, a, b, g):
    a, b = max(0, a), min(DUR, b); n0, n1 = ns(a), ns(b)
    seg = st(sig)[:, :n1 - n0].copy(); n = seg.shape[1]; env = np.ones(n); f = min(n // 4, ns(0.2)); env[:f] = np.linspace(0, 1, f); env[-f:] = np.linspace(1, 0, f)
    put(fx, seg * env, a, g)
fire = crackle(DUR)
for a, b in [(0, S(3)), (S(21), S(22))]: bed(fire, a, b, 0.6)
TM = word(0, 10)  # "money": fire flares
put(fx, G.whoosh(0.6, r, peak=0.5, f_lo=200, f_hi=1400), TM - 0.25, 0.7)
put(fx, noise_burst(0.8, 150, 900, 0.3, 0.6), TM - 0.05, 0.6)
put(fx, G.push_thump(r), TM - 0.12, 0.35)
TC = word(2, 3)
put(fx, I.glock(I.m2f(88), vel=0.5, r=r, dur=0.7), TC - 0.4, 0.5); put(fx, I.glock(I.m2f(84), vel=0.4, r=r, dur=0.6), TC - 0.1, 0.4)
# flashes / place jumps: a whoosh into each
for n in [3, 12, 18]: put(fx, G.whoosh(0.5, r, peak=0.7), S(n) - 0.3, 0.6)
for n in [2, 4, 6, 7, 8, 9, 10, 11, 13, 15, 19, 21, 22]: put(fx, G.whoosh(0.4, r, peak=0.6), S(n) - 0.25, 0.25)
# street: shop bell, distant chatter
put(fx, I.triangle(vel=0.4, r=r, dur=1.0, f=1760), S(3, 0.75), 0.4)
bed(G.babble(DUR, r, base=150, scale=1.0, rate=4.0, active=0.6), S(3), S(4), 0.12)
bed(G.babble(DUR, r, base=170, scale=1.1), S(6), S(8), 0.12)
# odometer flaps while the price climbs, ding when it lands
def flaps(t0, t1, rate):
    t = t0
    while t < t1: put(fx, noise_burst(0.03, 1800, 6000, 0.006, 0.6), t, 0.35, 0.15); t += 1 / rate
flaps(word(4, 1), word(4, 6), 14); put(fx, I.glock(I.m2f(91), vel=0.5, r=r, dur=0.6), word(4, 6), 0.45)
flaps(word(5, 1), word(5, 4), 26)
TB = word(5, 4)
put(fx, I.timpani(I.m2f(36), vel=0.9, r=r), TB, 0.8); put(fx, I.cymbal(vel=0.3, r=r, dur=1.4), TB, 0.3)
put(fx, G.oof(r, kind="oh"), TB + 0.15, 0.35)
# wheelbarrows: squeaks + steps
for k in range(8):
    t = S(6) + 0.1 + k * 0.3
    put(fx, G.swing_squeak(r, a=0.6), t, 0.2, -0.3 + 0.08 * k); put(fx, G.stroll_step(r), t + 0.15, 0.3, 0.1)
# kids + kite
put(fx, G.hurrah(r, base=320, scale=1.4, kid=True), S(7, 0.15), 0.15)
bed(G.flag_flutter(DUR, r), word(7, 10) - 0.3, S(8), 0.35)
# paste slaps
for k in range(4): put(fx, G.push_thump(r), S(8) + 0.25 + k * 0.42, 0.25, 0.3)
# chalk + clock ticks
for k in range(5): put(fx, noise_burst(0.18, 2500, 7000, 0.06, 0.4), S(9) + 0.05 + k * (S(10) - S(9)) / 5, 0.35)
for k in range(int((S(10) - S(9)) * 6)): put(fx, G.clink(r, f0=3400, dur=0.04, bright=0.4), S(9) + k / 6, 0.12)
# money on the counter, the loaf cracks and half slides away
put(fx, G.push_thump(r), word(10, 5) - 0.05, 0.3)
TH = word(10, 9)
put(fx, noise_burst(0.12, 900, 4000, 0.03, 0.8), TH - 0.04, 0.5); put(fx, G.whoosh(0.35, r, peak=0.4, f_lo=400, f_hi=1600), TH, 0.35)
# office: paper rustle
for k in range(5): put(fx, noise_burst(0.2, 2000, 8000, 0.08, 0.3), S(12) + 0.2 + 0.5 * k, 0.3, -0.2)
# print hall: press thumps (faster on "day and night"), paper flutter
def press(t0, t1, rate, g):
    t = t0
    while t < t1: put(fx, G.hammer_hit(r, big=0.35), t, g, 0.0); put(fx, noise_burst(0.15, 300, 2500, 0.05, 0.4), t + 0.08, g * 0.6); t += 1 / rate
press(S(13), S(14), 2.6, 0.45); press(S(14), S(15), 4.2, 0.5)
bed(G.flag_flutter(DUR, r), S(13), S(15), 0.25)
press(S(22), word(23, 0) - 0.05, 2.0, 0.3)
# pizza: ting, slices
put(fx, I.glock(I.m2f(84), vel=0.4, r=r, dur=0.8), S(15, 0.15), 0.4)
E1, E2 = word(16, 3), word(16, 6)
for k in range(6): put(fx, noise_burst(0.07, 2500, 9000, 0.02, 0.5), E1 - 0.08 + k * 0.05, 0.3, -0.3 + 0.1 * k)
for k in range(24): put(fx, noise_burst(0.04, 3000, 9000, 0.01, 0.4), E2 - 0.08 + k * 0.017, 0.2, -0.4 + 0.035 * k)
put(fx, G.whoosh(0.8, r, peak=0.5, f_lo=500, f_hi=3000), S(17, 0.25), 0.3)
# the zeros crossed out: 12 quick pencil scratches
TZ = word(19, 4) - 0.1
for k in range(12): put(fx, noise_burst(0.07, 1500, 6000, 0.025, 0.6), TZ + k * 1.15 / 12, 0.3, -0.3 + 0.05 * k)
# the balance settles: thunk, then ting
TBC = word(20, 4)
put(fx, G.push_thump(r), TBC, 0.5); put(fx, I.glock(I.m2f(88), vel=0.45, r=r, dur=1.0), TBC + 0.55, 0.45)
# log into the stove
put(fx, G.push_thump(r), S(21, 0.7), 0.6); put(fx, noise_burst(0.5, 150, 900, 0.2, 0.5), S(21, 0.72), 0.4)
# the sting: low hit at the twist line
put(fx, I.timpani(I.m2f(31), vel=1.0, r=r, dur=2.5), TWIST, 0.9); put(fx, noise_burst(1.5, 40, 200, 0.6, 0.8), TWIST, 0.6)
# "Stop": the lever clunks, the press halts, the last note lands
TS = word(23, 0) - 0.05
put(fx, G.hammer_hit(r, big=1.0), TS, 0.8); put(fx, G.bolt_snap(r), TS + 0.02, 0.35)
put(fx, G.creak(0.45, r, rate0=160, rate1=60, scale=0.6), TS + 0.1, 0.25)
put(fx, noise_burst(0.15, 1500, 5000, 0.05, 0.25), word(23, 1) + 0.3, 0.3)

# ---------------- stems ----------------
ir = make_ir(1.2, 5)
mus = mus + 0.2 * convolve_st(mus, ir)[:, :N]
fx = fx + 0.1 * convolve_st(fx, ir)[:, :N]
os.makedirs(os.path.join(HERE, "audio"), exist_ok=True)
write_wav(os.path.join(HERE, "audio", "music.wav"), (mus / max(1e-9, np.abs(mus).max()) * 0.5).astype(np.float64))
write_wav(os.path.join(HERE, "audio", "sfx.wav"), (fx / max(1e-9, np.abs(fx).max()) * 0.5).astype(np.float64))
print("stems", round(N / SR, 3), "s, frames", round(N / SR * FPS))
