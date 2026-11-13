# Sound for "Built Too Big": an original music-hall score (pizzicato bass, glock, brushes) + synthesized SFX,
# ducked under the voice. Every cue is placed on a sentence of the narration, so it works for EN and ES.
# usage: python sewers/make_audio.py en|es  -> sewers/audio/mix_<lang>.wav (48 kHz stereo, exact length)
import sys, os, json, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "skills", "cartoon-3d-short", "templates", "audio"))
import numpy as np
from dsp import SR, ns, rng, lp, hp, bp, pan, st, place, fades, make_ir, convolve_st, integrated, read_wav, write_wav, dbg, true_peak
import instruments as I
import sfx_gen as G

LANG = sys.argv[1] if len(sys.argv) > 1 else "en"
FPS = 30
W = json.load(open(os.path.join(ROOT, "public", f"sewers_words_{LANG}.json"), encoding="utf-8"))
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
BPM = 108; beat = 60 / BPM
mus = buf()
# D major music-hall walk; turns minor for the stink; big tag for "everything"; mysterious for the twist
walk_maj = [38, 45, 42, 45, 43, 50, 45, 49]      # D A F# A G D A C#
walk_min = [38, 45, 41, 45, 43, 46, 45, 44]      # D A F A G Bb A G#
mel = [(0, 74, .5), (.5, 76, .5), (1, 78, .5), (1.5, 81, .5), (2, 78, 1), (3.5, 76, .5), (4, 74, .5), (4.5, 73, .5), (5, 71, .5), (6, 69, 1)]
def walk(t0, t1, prog, e=1.0, melody=True, brush=True):
    t, k = t0, 0
    while t < t1 - 0.05:
        put(mus, I.pluck(I.m2f(prog[k % len(prog)]), vel=0.75 * e, r=r, dur=0.5), t, 0.9, -0.15)
        if brush and k % 2 == 1: put(mus, I.brush(vel=0.35 * e, r=r), t, 0.6, 0.2)
        if melody and k % 8 == 0:
            for (bt, m, d) in mel:
                if t + bt * beat < t1: put(mus, I.glock(I.m2f(m if prog is walk_maj else m - (1 if m % 12 in (6, 11) else 0)), vel=0.4 * e, r=r, dur=1.2), t + bt * beat, 0.5, 0.25)
        t += beat; k += 1
walk(0.0, S(3), walk_maj, 1.0)
walk(S(3), S(7), walk_min, 0.85, melody=False)
# the hot summer: a slow wobbly pad + rising glock
put(mus, I.pad([I.m2f(50), I.m2f(53), I.m2f(57)], S(12) - S(7), vel=0.45, r=r, att=1.0, rel=0.6, trem=lambda tt: 1 + 0.15 * np.sin(2 * np.pi * 4 * tt)), S(7), 0.7)
for i in range(6): put(mus, I.glock(I.m2f(74 + 2 * i), vel=0.35, r=r, dur=0.6), S(7) + i * 0.25, 0.4)
walk(S(8), S(12), walk_min, 0.7, melody=False, brush=False)
# "they gave him everything": timpani + cymbal + a bright major run
put(mus, I.timpani(I.m2f(38), vel=0.9, r=r), S(12, 0.82), 1.1); put(mus, I.cymbal(vel=0.7, r=r), S(12, 0.82), 0.8)
for i, m in enumerate([74, 78, 81, 86]): put(mus, I.glock(I.m2f(m), vel=0.6, r=r, dur=1.4), S(12, 0.82) + i * beat / 2, 0.6, 0.2)
walk(S(13), S(17), walk_maj, 1.05)
# the twist: low pad, a single bell
put(mus, I.pad([I.m2f(38), I.m2f(41), I.m2f(45)], S(20) - S(17), vel=0.5, r=r, att=0.8, rel=0.8), S(17), 0.8)
put(mus, I.vibes(I.m2f(62), vel=0.6, r=r, dur=2.4), S(17, 0.6), 0.6)
walk(S(20), S(22), walk_maj, 0.8, melody=False)
walk(S(22), S(23), walk_maj, 1.0)
# "Because..." hangs on an unresolved chord so the loop back to the hook feels continuous
put(mus, I.pad([I.m2f(43), I.m2f(47), I.m2f(52)], DUR - S(23) + 0.1, vel=0.5, r=r, att=0.05, rel=0.3), S(23), 0.8)
put(mus, I.glock(I.m2f(81), vel=0.6, r=r, dur=1.0), S(23), 0.6)

# ---------------- SFX ----------------
fx = buf()
def bed(sig, a, b, g):
    a, b = max(0, a), min(DUR, b); n0, n1 = ns(a), ns(b)
    seg = st(sig)[:, :n1 - n0].copy(); n = seg.shape[1]; env = np.ones(n); f = min(n // 4, ns(0.25)); env[:f] = np.linspace(0, 1, f); env[-f:] = np.linspace(1, 0, f)
    put(fx, seg * env, a, g)
flow = G.water_bed(DUR, r, close=0.8, slosh_rate=1.6)
for (a, b) in [(0, S(1)), (S(14), S(15)), (S(17), S(18)), (S(23), DUR)]: bed(flow, a, b, 0.35)          # tunnel water
river = G.water_bed(DUR, r, close=0.4)
for (a, b) in [(S(1), S(3)), (S(7), S(9))]: bed(river, a, b, 0.3)
# drips in the tunnel
for k in range(10): put(fx, I.glock(I.m2f(96 + (k % 3)), vel=0.25, r=r, dur=0.3), 0.3 + k * 0.41, 0.25, -0.5 + 0.1 * k)
# hook: Parliament roaring with laughter from frame 1, a whoosh down the tunnel on "when", a hit on "twice"
TW = word(0, 10 if LANG == "es" else 7); WHEN = word(0, 3 if LANG == "es" else 2)
put(fx, G.babble(WHEN + 0.3, r, base=140, scale=1.0, rate=8.0), 0.0, 0.9); put(fx, G.hurrah(r, base=130, scale=1.0), 0.0, 0.5)
put(fx, G.whoosh(0.6, r, peak=0.25, f_lo=300, f_hi=2600), WHEN - 0.15, 0.7)
put(fx, I.timpani(I.m2f(38), vel=1.0, r=r), TW, 0.9); put(fx, I.cymbal(vel=0.6, r=r), TW, 0.5); put(fx, I.glock(I.m2f(86), vel=0.7, r=r, dur=0.8), TW + 0.05, 0.6)
put(fx, G.babble(DUR - S(23), r, base=140, scale=1.0, rate=8.0), S(23), 0.7)
# toilets flushing into the river
for i in range(4): put(fx, fades(lp(r.standard_normal(ns(1.0)), 900, 2) * np.exp(-np.arange(ns(1.0)) / SR / 0.35)), S(1) + 0.4 + i * 0.6, 0.5, -0.4 + 0.25 * i)
# a slurp at "drank"
put(fx, G.bubbles(0.5, r, rate=22, f_lo=200, f_hi=900), S(2, 0.6), 0.4)
# doctors sniff
for k in range(3): put(fx, fades(bp(r.standard_normal(ns(0.18)), 1500, 4500) * np.hanning(ns(0.18))), S(3, 0.55) + k * 0.2, 0.35)
# Parliament laughs
put(fx, G.oof(r, kind="oh"), S(4, 0.75), 0.35)
put(fx, G.oof(r, kind="oh"), S(5, 0.3), 0.4); put(fx, G.oof(r, kind="oh"), S(6, 0.3), 0.4)
# heat: a rising whistle with the thermometer, flies buzzing over the river
sw = np.sin(2 * np.pi * np.cumsum(np.linspace(700, 1900, ns(1.6))) / SR) * np.hanning(ns(1.6)) * 0.3; put(fx, sw, S(7, 0.1), 0.35)
for k in range(3):
    n = ns(2.5); f = 220 + 30 * k + 25 * np.sin(np.arange(n) / SR * 6 + k); buzz = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.08 * np.hanning(n)
    put(fx, lp(buzz, 2500, 2), S(8) + 0.3 * k, 0.3, -0.5 + 0.5 * k)
put(fx, G.bubbles(S(9) - S(8), r, rate=14, f_lo=120, f_hi=700), S(8), 0.5)
# curtains: a wet slap; hankies: muffled coughs
put(fx, G.splash_big(r) * 0.4, S(9, 0.3), 0.35)
for k in range(3): put(fx, G.oof(r, kind="oof"), S(10, 0.2 + 0.25 * k), 0.25, -0.3 + 0.3 * k)
# the newspaper: paper rustle
put(fx, fades(hp(r.standard_normal(ns(0.5)), 2500, 2) * np.hanning(ns(0.5)) * 0.4), S(11), 0.4)
# 18 days counter ticks, then the vote: gavel + cheer
for k in range(10): put(fx, G.clink(r, f0=3000), S(12) + k * (S(12, 0.5) - S(12)) / 10, 0.35)
put(fx, G.hammer_hit(r, big=1.0), S(12, 0.82), 0.9); put(fx, G.hurrah(r, base=140, scale=1.0), S(12, 0.85), 0.45)
# bricks clinking, a crane creak
for k in range(14): put(fx, G.clink(r, f0=900 + 300 * (k % 3), bright=0.4), S(13) + 0.12 * k + 0.05 * (k % 2), 0.3, -0.5 + 0.07 * k)
# carriage: hooves + wheels in the tunnel
for k in range(int((S(15) - S(14)) / 0.18)): put(fx, G.clink(r, f0=700 + 120 * (k % 2), bright=0.3), S(14) + k * 0.18, 0.35)
# train rumble under the road
for (a, b, g) in [(S(15, 0.4), S(16), 0.35), (S(16), S(17), 0.55)]:
    n = ns(b - a); rum = lp(r.standard_normal(n), 140, 2) * (0.8 + 0.2 * np.sin(np.arange(n) / SR * 2 * np.pi * 4)) * 2.5
    env = np.minimum(1, np.minimum(np.arange(n) / ns(0.4), (n - np.arange(n)) / ns(0.4))); put(fx, rum * env, a, g)
    for k in range(int((b - a) / 0.45)): put(fx, G.clink(r, f0=500, bright=0.2), a + 0.45 * k, 0.25)
# "?" pop
put(fx, I.glock(I.m2f(84), vel=0.5, r=r, dur=0.6), S(17, 0.55), 0.5)
# the stink is crossed out; germs squeak
put(fx, G.oof(r, kind="ugh"), S(18, 0.3), 0.3); put(fx, G.push_thump(r), S(18, 0.6), 0.5)
for k in range(6): put(fx, I.glock(I.m2f(91 + (k % 4)), vel=0.3, r=r, dur=0.25), S(19) + 0.12 * k, 0.35, -0.4 + 0.15 * k)
# the river clears: a soft rising shimmer
for i, m in enumerate([86, 88, 90, 93]): put(fx, I.glock(I.m2f(m), vel=0.35, r=r, dur=0.8), S(20, 0.5) + 0.12 * i, 0.4)
# the last outbreak: a low ominous hit
put(fx, I.timpani(I.m2f(31), vel=0.7, r=r), S(21, 0.5), 0.6)
# modern city: crowd + birds
put(fx, G.babble(S(23) - S(22), r, base=180, scale=1.1, rate=5.0), S(22), 0.3); put(fx, G.bird_chirps(2.5, r), S(22), 0.25)
# whooshes on scene changes
for n in [1, 3, 4, 7, 9, 13, 14, 15, 17, 18, 20, 21, 22, 23]: put(fx, G.whoosh(0.45, r, peak=0.6), S(n) - 0.3, 0.22)

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
