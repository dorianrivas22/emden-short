# Sound for "The Rat Tail Bounty": an original sneaky pizzicato score + synthesized SFX (squeaks, coins, scurrying),
# ducked under the voice. Every cue is placed on a sentence of the narration, so it works for EN and ES.
# usage: python rats/make_audio.py en|es  -> rats/audio/mix_<lang>.wav (48 kHz stereo, exact length)
import sys, os, json, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "skills", "cartoon-3d-short", "templates", "audio"))
import numpy as np
from dsp import SR, ns, rng, lp, hp, bp, pan, st, place, fades, make_ir, convolve_st, integrated, read_wav, write_wav, dbg, true_peak
import instruments as I
import sfx_gen as G

LANG = sys.argv[1] if len(sys.argv) > 1 else "en"
FPS = 30
W = json.load(open(os.path.join(ROOT, "public", f"rats_words_{LANG}.json"), encoding="utf-8"))
SENT = [0.0] + [W[i + 1]["s"] for i, w in enumerate(W[:-1]) if re.search(r"[.?]$", w["w"])]
VOICE_END = W[-1]["e"]
TOTAL = round((VOICE_END + 0.9) * FPS); DUR = TOTAL / FPS; N = ns(DUR)
def S(n, f=0.0):
    a = SENT[n]; b = SENT[n + 1] if n + 1 < len(SENT) else DUR
    return a + f * (b - a)
def word(n, k):
    i = next(j for j, w in enumerate(W) if w["s"] >= SENT[n] - 1e-3); return W[min(len(W) - 1, i + k)]["s"]
r = rng(11)
def buf(): return np.zeros((2, N))
def put(b, x, t, g=1.0, p=0.0):
    if np.ndim(x) == 1: x = pan(x, p)
    if t < DUR: place(b, x, max(0.0, t), g)

# ---------------- music ----------------
BPM = 112; beat = 60 / BPM
mus = buf()
sneak = [45, 52, 48, 52, 50, 53, 52, 44]   # A E C E D F E G#: a tiptoeing minor walk
bright = [45, 52, 49, 52, 50, 54, 52, 49]  # A major version for "it worked"
mel = [(0, 76, .5), (.5, 77, .5), (1, 76, .5), (1.5, 72, .5), (2, 69, 1), (4, 74, .5), (4.5, 76, .5), (5, 74, .5), (5.5, 71, .5), (6, 68, 1)]
def walk(t0, t1, prog, e=1.0, melody=True, brush=True):
    t, k = t0, 0
    while t < t1 - 0.05:
        put(mus, I.pluck(I.m2f(prog[k % len(prog)]), vel=0.75 * e, r=r, dur=0.4), t, 0.9, -0.15)
        if brush and k % 2 == 1: put(mus, I.brush(vel=0.3 * e, r=r), t, 0.6, 0.2)
        if melody and k % 8 == 0:
            for (bt, m, d) in mel:
                if t + bt * beat < t1: put(mus, I.glock(I.m2f(m + (1 if prog is bright and m % 12 == 0 else 0)), vel=0.4 * e, r=r, dur=1.0), t + bt * beat, 0.5, 0.25)
        t += beat; k += 1
walk(0.0, S(5), sneak, 1.0)
put(mus, I.pad([I.m2f(45), I.m2f(48), I.m2f(52)], S(6) - S(5), vel=0.45, r=r, att=0.5, rel=0.5), S(5), 0.7)
walk(S(6), S(10), sneak, 0.9, melody=False)
for i, m in enumerate([76, 81, 84, 88]): put(mus, I.glock(I.m2f(m), vel=0.55, r=r, dur=1.0), S(10, 0.4) + i * 0.09, 0.55)
walk(S(11), S(15), bright, 1.05)
put(mus, I.pad([I.m2f(44), I.m2f(47), I.m2f(50)], S(17) - S(15), vel=0.45, r=r, att=0.4, rel=0.5), S(15), 0.7)
walk(S(17), S(22), sneak, 0.95)
put(mus, I.timpani(I.m2f(45), vel=0.9, r=r), S(23), 1.0); put(mus, I.cymbal(vel=0.5, r=r), S(23), 0.6)
walk(S(24), S(27), sneak, 1.0)
put(mus, I.pad([I.m2f(45), I.m2f(48), I.m2f(51)], DUR - S(27) + 0.1, vel=0.5, r=r, att=0.05, rel=0.3), S(27), 0.8)

# ---------------- SFX ----------------
fx = buf()
def squeak(n=1, f0=3600):
    out = []
    for _ in range(n):
        d = 0.06 + 0.06 * r.random(); m = ns(d); f = f0 * (1 + 0.4 * r.random()) * (1 + 0.15 * np.sin(np.linspace(0, 6 * np.pi, m)))
        out.append(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(m) * 0.5); out.append(np.zeros(ns(0.03 + 0.05 * r.random())))
    return np.concatenate(out)
def scurry(dur, dens=40):
    n = ns(dur); x = np.zeros(n)
    for _ in range(int(dens * dur)):
        i = int(r.random() * (n - ns(0.02))); x[i:i + ns(0.012)] += hp(r.standard_normal(ns(0.012)), 2500, 2) * np.hanning(ns(0.012)) * (0.3 + 0.4 * r.random())
    return x
def bed(sig, a, b, g):
    a, b = max(0, a), min(DUR, b); n0, n1 = ns(a), ns(b)
    seg = st(sig)[:, :n1 - n0].copy(); n = seg.shape[1]; env = np.ones(n); f = min(n // 4, ns(0.25)); env[:f] = np.linspace(0, 1, f); env[-f:] = np.linspace(1, 0, f)
    put(fx, seg * env, a, g)
CENT = word(0, 4); AND = word(0, 11)
put(fx, G.clink(r, f0=2600), CENT, 0.9); put(fx, G.clink(r, f0=2100), CENT + 0.06, 0.6); put(fx, G.push_thump(r), CENT, 0.4)
put(fx, scurry(S(1) - AND, 90), AND, 0.8); put(fx, squeak(6), AND + 0.2, 0.45, -0.3); put(fx, squeak(5, 4200), AND + 0.6, 0.4, 0.3)
put(fx, G.whoosh(0.5, r, peak=0.4), AND - 0.25, 0.4)
for k in range(8): put(fx, G.hammer_hit(r, big=0.4), S(1) + 0.5 + k * 0.45, 0.35, -0.3 + 0.08 * k)
put(fx, fades(lp(r.standard_normal(ns(1.2)), 1200, 2) * np.exp(-np.arange(ns(1.2)) / SR / 0.4)), S(2, 0.4), 0.6)
put(fx, I.glock(I.m2f(91), vel=0.4, r=r, dur=0.6), S(2, 0.6), 0.4)
water = G.water_bed(DUR, r, close=0.7, slosh_rate=1.2)
for (a, b) in [(S(3), S(5)), (S(7), S(8)), (S(18), S(20))]: bed(water, a, b, 0.3)
put(fx, squeak(3, 3000), S(3, 0.5), 0.35); put(fx, squeak(2, 2600), S(4, 0.3), 0.3)
put(fx, fades(hp(r.standard_normal(ns(0.5)), 2500, 2) * np.hanning(ns(0.5)) * 0.4), S(5), 0.4)
put(fx, G.clink(r, f0=900, bright=0.3), S(6, 0.3), 0.4); put(fx, G.clink(r, f0=800, bright=0.3), S(6, 0.6), 0.4)
for k in range(10): put(fx, G.clink(r, f0=3000), S(7) + k * (S(8) - S(7)) / 10, 0.3)
for k in range(12): put(fx, G.clink(r, f0=3200), S(8) + k * 0.12, 0.3)
put(fx, I.timpani(I.m2f(40), vel=0.7, r=r), S(8, 0.7), 0.6)
put(fx, scurry(S(10) - S(9), 70), S(9), 0.6); put(fx, squeak(4), S(9, 0.3), 0.35)
put(fx, I.glock(I.m2f(88), vel=0.6, r=r, dur=1.0), S(10, 0.4), 0.6)
put(fx, G.push_thump(r), S(11, 0.05), 0.5)
put(fx, G.oof(r, kind="ugh"), S(12, 0.2), 0.3)
for k in range(10): put(fx, G.clink(r, f0=2200 + 300 * (k % 3)), S(13) + 0.1 * k, 0.35, -0.3 + 0.06 * k)
for k in range(16): put(fx, G.clink(r, f0=2400 + 200 * (k % 4)), S(14) + 0.08 * k, 0.3, -0.4 + 0.05 * k)
put(fx, I.glock(I.m2f(84), vel=0.5, r=r, dur=0.6), S(15, 0.45), 0.5)
put(fx, scurry(S(17) - S(16), 50), S(16), 0.6); put(fx, squeak(4, 3200), S(16, 0.2), 0.4)
snip = fades(hp(r.standard_normal(ns(0.05)), 3500, 2) * np.exp(-np.arange(ns(0.05)) / SR / 0.01) * 0.8)
put(fx, snip, S(17, 0.38), 0.7); put(fx, squeak(2, 4000), S(17, 0.42), 0.5)
for k in range(4): put(fx, squeak(1, 5200), S(18, 0.3) + 0.15 * k, 0.3, -0.3 + 0.2 * k)
for i, m in enumerate([86, 88, 90, 93]): put(fx, I.glock(I.m2f(m), vel=0.35, r=r, dur=0.8), S(19, 0.3) + 0.15 * i, 0.4)
put(fx, G.bird_chirps(S(22) - S(20), r), S(20), 0.25); put(fx, scurry(S(22) - S(20), 30), S(20), 0.35)
for k in range(10): put(fx, fades(bp(r.standard_normal(ns(0.08)), 2000, 6000) * np.hanning(ns(0.08)) * 0.3), S(23) + 0.05 + 0.07 * k, 0.4)
for k in range(12): put(fx, G.clink(r, f0=2400), S(24, 0.2) + 0.07 * k, 0.25)
put(fx, scurry(S(26) - S(25), 110), S(25), 0.8); put(fx, squeak(6), S(25, 0.2), 0.4)
put(fx, G.hammer_hit(r, big=0.9), S(26, 0.2), 0.7)
put(fx, G.clink(r, f0=2600), S(27, 0.1), 0.5)
for n in [1, 2, 3, 5, 6, 9, 11, 15, 16, 17, 18, 20, 22, 25, 26, 27]: put(fx, G.whoosh(0.45, r, peak=0.6), S(n) - 0.3, 0.22)

# ---------------- mix ----------------
voice = st(read_wav(os.path.join(HERE, "voice", f"voice_{LANG}.wav"))[0])
v = np.zeros((2, N)); m = min(N, voice.shape[1]); v[:, :m] = voice[:, :m]
ir = make_ir(1.1, 3)
mus = mus + 0.18 * convolve_st(mus, ir)[:, :N]
fx = fx + 0.08 * convolve_st(fx, ir)[:, :N]
env = np.abs(v).mean(0); k = ns(0.12); env = np.convolve(env, np.ones(k) / k, "same"); env = env / (env.max() + 1e-9)
duck = 1 - 0.8 * np.clip(env * 6, 0, 1); duck = np.convolve(duck, np.ones(ns(0.08)) / ns(0.08), "same")
mus *= duck[None, :]
vl = integrated(v); ml = integrated(mus); fl = integrated(fx)
mus *= dbg((vl - 22) - ml)   # music bed well under the voice (it was too loud at -12 LU)
fx *= dbg((vl - 14) - fl)       # effects
mix = v + mus + fx
mix *= dbg(-14.5 - integrated(mix))
pk = true_peak(mix)
if pk > dbg(-1.0): mix *= dbg(-1.0) / pk
os.makedirs(os.path.join(HERE, "audio"), exist_ok=True)
out = os.path.join(HERE, "audio", f"mix_{LANG}.wav"); write_wav(out, mix.astype(np.float64))
print(LANG, "mix", round(integrated(mix), 1), "LUFS, len", round(mix.shape[1] / SR, 2), "s, frames", TOTAL)
