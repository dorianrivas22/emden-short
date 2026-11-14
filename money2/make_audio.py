# Sound for "The Money Stove" v2: oom-pah march under the story (stops dead at the twist), SFX on events, mixed with
# the music well under the voice (owner's request after the sewers short: music at voice -20 LU, ducked 0.6 under
# speech), effects at voice -13 LU, final -14 LUFS / -1 dBTP (research/GUIA_NUMERICA_20.md section 2).
# usage: python money2/make_audio.py  -> money2/audio/mix_en.wav (48 kHz stereo, exact video length)
import sys, os, json, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "skills", "cartoon-3d-short", "templates", "audio"))
import numpy as np
from dsp import SR, ns, rng, lp, hp, bp, pan, st, place, fades, make_ir, convolve_st, integrated, read_wav, write_wav, dbg, true_peak
import instruments as I
import sfx_gen as G

FPS = 30
W = json.load(open(os.path.join(ROOT, "public", "money2_words_en.json"), encoding="utf-8"))
SENT = [0.0] + [W[i + 1]["s"] for i, w in enumerate(W[:-1]) if re.search(r"[.?]$", w["w"])]
FRAMES = round((63.59 + 0.35) * FPS); DUR = FRAMES / FPS; N = ns(DUR)
def S(n, f=0.0):
    a = SENT[n]; b = SENT[n + 1] if n + 1 < len(SENT) else DUR
    return a + f * (b - a)
def word(n, k):
    i = next(j for j, w in enumerate(W) if w["s"] >= SENT[n] - 1e-3); return W[min(len(W) - 1, i + k)]["s"]
r = rng(31)
def buf(): return np.zeros((2, N))
def put(b, x, t, g=1.0, p=0.0):
    if np.ndim(x) == 1: x = pan(x, p)
    if t < DUR: place(b, x, max(0.0, t), g)
def nb(d, lo, hi, tau, g=0.5):
    n = ns(d); return fades(bp(r.standard_normal(n), lo, hi) * np.exp(-np.arange(n) / SR / tau) * g)

# ---------------- music ----------------
BPM = 116; beat = 60 / BPM; TWIST = word(16, 3)
mus = buf()
BASS = [45, 40, 45, 40, 41, 36, 40, 44]
CHORD = [[57, 60, 64], [57, 60, 64], [56, 59, 64], [57, 60, 64], [53, 57, 60], [53, 57, 60], [52, 56, 59], [52, 56, 59]]
MEL = [69, 72, 76, 74, 72, 71, 72, 69, 68, 71, 74, 72, 71, 69, 68, 64]
def march(t0, t1, e=1.0, melody=True):
    t, k = t0, 0
    while t < min(t1, TWIST) - 0.03:
        bar = (k // 4) % len(BASS)
        if k % 2 == 0:
            put(mus, I.brass(I.m2f(BASS[bar]), beat * 0.9, vel=0.75 * e, r=r, kind="tuba"), t, 0.8, -0.1)
            put(mus, I.timpani(I.m2f(33), vel=0.4 * e, r=r, dur=0.4), t, 0.5)
        else:
            for m in CHORD[bar]: put(mus, I.pluck(I.m2f(m), vel=0.45 * e, r=r, dur=0.25), t, 0.45, 0.2)
            put(mus, I.snare(vel=0.32 * e, r=r), t, 0.45, 0.1)
        if melody and k % 2 == 0: put(mus, I.glock(I.m2f(MEL[(k // 2) % len(MEL)] + 12), vel=0.3 * e, r=r, dur=0.6), t, 0.35, 0.3)
        t += beat; k += 1
def pad(t0, t1, notes, v=0.4):
    t1 = min(t1, TWIST)
    if t1 > t0: put(mus, I.pad([I.m2f(m) for m in notes], t1 - t0, vel=v, r=r, att=0.4, rel=0.5), t0, 0.6)
march(0.0, S(6), 1.0)
pad(S(6), S(9), [57, 60, 64], 0.35)
march(S(9), S(11), 0.9, melody=False)
pad(S(11), S(14), [45, 52, 57, 60], 0.4)
march(S(14), TWIST, 1.0)
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
def flaps(t0, t1, rate):
    t = t0
    while t < t1: put(fx, nb(0.03, 1800, 6000, 0.006, 0.6), t, 0.35, 0.15); t += 1 / rate
fire = crackle(DUR)
for a, b in [(0, S(1)), (S(6), S(9)), (S(16), TWIST)]: bed(fire, a, b, 0.6)
TS = word(0, 8)
put(fx, G.whoosh(0.6, r, peak=0.5, f_lo=200, f_hi=1400), TS - 0.3, 0.7); put(fx, nb(0.8, 150, 900, 0.3, 0.6), TS - 0.05, 0.6); put(fx, G.push_thump(r), TS - 0.12, 0.35)
TC = word(0, 12)
put(fx, I.glock(I.m2f(88), vel=0.5, r=r, dur=0.7), TC - 0.35, 0.5); put(fx, I.glock(I.m2f(84), vel=0.4, r=r, dur=0.6), TC - 0.05, 0.4)
for n in [10, 14]: put(fx, G.whoosh(0.5, r, peak=0.7), S(n) - 0.3, 0.6)
for t in [S(1), word(1, 7), S(2), S(3), S(4), word(4, 3), word(4, 8), S(5), word(5, 8), S(6), S(9), word(10, 15), S(11), S(13), S(15), S(16), TWIST]: put(fx, G.whoosh(0.4, r, peak=0.6), t - 0.25, 0.25)
bed(G.babble(DUR, r, base=150, scale=1.0, rate=4.0, active=0.6), S(1), S(2), 0.12)
bed(G.babble(DUR, r, base=170, scale=1.1), S(4), S(6), 0.12)
flaps(word(1, 7), S(2), 9)
put(fx, I.triangle(vel=0.4, r=r, dur=1.0, f=1760), S(2) + 0.1, 0.35)
put(fx, I.glock(I.m2f(91), vel=0.5, r=r, dur=0.6), word(2, 13), 0.45)
flaps(word(3, 1), word(3, 10), 14); put(fx, I.glock(I.m2f(91), vel=0.5, r=r, dur=0.6), word(3, 10), 0.45)
flaps(word(3, 11), word(3, 16), 26)
TB = word(3, 16); put(fx, I.timpani(I.m2f(36), vel=0.9, r=r), TB, 0.8); put(fx, I.cymbal(vel=0.3, r=r, dur=1.4), TB, 0.3); put(fx, G.oof(r, kind="oh"), TB + 0.15, 0.35)
for k in range(4): put(fx, G.clink(r, f0=2400 + 300 * k), S(4) + 0.2 + 0.25 * k, 0.3)
for k in range(6): t = word(4, 3) + 0.1 + k * 0.28; put(fx, G.swing_squeak(r, a=0.6), t, 0.2, -0.3 + 0.1 * k); put(fx, G.stroll_step(r), t + 0.14, 0.3, 0.1)
for k in range(10): put(fx, G.stroll_step(r, scuff=0.2), word(4, 8) + k * 0.2, 0.3, -0.4 + 0.08 * k)
flaps(word(4, 8), S(5), 6)
put(fx, G.hurrah(r, base=320, scale=1.4, kid=True), S(5) + 0.2, 0.15)
for k in range(4): put(fx, G.push_thump(r), word(5, 8) + 0.1 + k * 0.42, 0.25, 0.3)
for k in range(3): put(fx, G.vox(180 + 20 * k, [(0.0, "a"), (0.12, "a")], 0.3, r, scale=0.12) if False else nb(0.12, 300, 1600, 0.05, 0.5), S(6) + 0.45 + 0.17 * k, 0.25)
TW = S(7) + 0.45 * (S(8) - S(7)); put(fx, G.whoosh(0.35, r, peak=0.8), TW - 0.1, 0.45); put(fx, I.glock(I.m2f(86), vel=0.4, r=r, dur=0.5), TW + 0.35, 0.4)
put(fx, I.glock(I.m2f(79), vel=0.45, r=r, dur=0.5), S(8) + 0.05, 0.4); put(fx, I.glock(I.m2f(74), vel=0.45, r=r, dur=0.7), S(8) + 0.3, 0.4)
bed(G.breeze(DUR, r, level=0.8), S(9), S(10), 0.25)
for k in range(5): put(fx, nb(0.2, 2000, 8000, 0.08, 0.3), S(10) + 0.2 + 0.4 * k, 0.3, -0.2)
put(fx, I.glock(I.m2f(91), vel=0.5, r=r, dur=0.8), word(10, 5) + 0.45 * (word(10, 15) - word(10, 5)), 0.45)
def press(t0, t1, rate, g):
    t = t0
    while t < t1: put(fx, G.hammer_hit(r, big=0.35), t, g); put(fx, nb(0.15, 300, 2500, 0.05, 0.4), t + 0.08, g * 0.6); t += 1 / rate
press(word(10, 15), word(10, 18), 2.6, 0.45); press(word(10, 18), S(11), 4.2, 0.5)
bed(G.flag_flutter(DUR, r), word(10, 15), S(11), 0.25)
put(fx, I.glock(I.m2f(84), vel=0.4, r=r, dur=0.8), S(11) + 0.1, 0.4)
E1, E2 = word(12, 3), word(12, 6)
for k in range(6): put(fx, nb(0.07, 2500, 9000, 0.02, 0.5), E1 - 0.08 + k * 0.05, 0.3, -0.3 + 0.1 * k)
for k in range(24): put(fx, nb(0.04, 3000, 9000, 0.01, 0.4), E2 - 0.08 + k * 0.017, 0.2, -0.4 + 0.035 * k)
put(fx, G.whoosh(0.8, r, peak=0.5, f_lo=500, f_hi=3000), word(12, 13), 0.3)
put(fx, nb(0.5, 1500, 6000, 0.2, 0.3), S(13) + 0.4, 0.25)
TZ = word(15, 6) - 0.1
for k in range(12): put(fx, nb(0.07, 1500, 6000, 0.025, 0.6), TZ + k * 1.0 / 12, 0.3, -0.3 + 0.05 * k)
TBC = word(15, 14); put(fx, G.push_thump(r), TBC, 0.5); put(fx, I.glock(I.m2f(88), vel=0.45, r=r, dur=1.0), TBC + 0.55, 0.45)
put(fx, G.push_thump(r), S(16) + 0.7 * (TWIST - S(16)), 0.6)
put(fx, I.timpani(I.m2f(31), vel=1.0, r=r, dur=2.5), TWIST, 0.9); put(fx, nb(1.5, 40, 200, 0.6, 0.8), TWIST, 0.6)
press(TWIST, word(17, 0) - 0.05, 2.0, 0.3)
TST = word(17, 0) - 0.05
put(fx, G.hammer_hit(r, big=1.0), TST, 0.8); put(fx, G.bolt_snap(r), TST + 0.02, 0.35); put(fx, G.creak(0.45, r, rate0=160, rate1=60, scale=0.6), TST + 0.1, 0.25)
put(fx, nb(0.15, 1500, 5000, 0.05, 0.25), word(17, 1) + 0.3, 0.3)

# ---------------- mix ----------------
voice = st(read_wav(os.path.join(HERE, "voice", "voice_en.wav"))[0])
v = np.zeros((2, N)); m = min(N, voice.shape[1]); v[:, :m] = voice[:, :m]
ir = make_ir(1.2, 5)
mus = mus + 0.2 * convolve_st(mus, ir)[:, :N]
fx = fx + 0.1 * convolve_st(fx, ir)[:, :N]
env = np.abs(v).mean(0); k = ns(0.12); env = np.convolve(env, np.ones(k) / k, "same"); env = env / (env.max() + 1e-9)
duck = 1 - 0.6 * np.clip(env * 6, 0, 1); duck = np.convolve(duck, np.ones(ns(0.08)) / ns(0.08), "same")
mus *= duck[None, :]
vl = integrated(v)
mus *= dbg((vl - 20) - integrated(mus))
fx *= dbg((vl - 13) - integrated(fx))
mix = v + mus + fx
mix *= dbg(-14.0 - integrated(mix))
pk = true_peak(mix)
if pk > dbg(-1.0): mix *= dbg(-1.0) / pk
os.makedirs(os.path.join(HERE, "audio"), exist_ok=True)
write_wav(os.path.join(HERE, "audio", "mix_en.wav"), mix.astype(np.float64))
print("mix", round(integrated(mix), 1), "LUFS, len", round(mix.shape[1] / SR, 2), "s, frames", FRAMES)
