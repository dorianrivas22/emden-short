"""Narration for the sewers short: Piper TTS sentence by sentence + Whisper word timings mapped onto the script words.
Usage: python sewers/make_voice.py en|es   -> sewers/voice/voice_<lang>.wav, public/sewers_words_<lang>.json
"""
import json, os, re, subprocess, sys, wave, io
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LANG = sys.argv[1] if len(sys.argv) > 1 else "en"
SR_OUT = 48000

# what is shown in captions / what the TTS reads (spelling tricks for the TTS only)
SCRIPT = {
    "en": [
        ("Everyone laughed when he made London's sewers twice as big as they needed to be.", None),
        ("You see, back then, every toilet in London emptied straight into the river.", None),
        ("The same river people drank from.", None),
        ("And people kept dying of cholera, but the doctors were sure it came from the smell.", "And people kept dying of collera, but the doctors were sure it came from the smell."),
        ("So when he asked for pipes twice as wide, the politicians thought he was mad.", None),
        ("Twice the bricks? For a smell?", None),
        ("Then came the summer of 1858.", "Then came the summer of eighteen fifty-eight."),
        ("The river cooked like soup, and the stink rolled right into Parliament.", None),
        ("They soaked the curtains in bleach. They held hankies to their noses.", None),
        ("They called it the Great Stink.", None),
        ("And in just eighteen days, they gave him everything.", None),
        ("Three hundred million bricks. Tunnels you could drive a carriage through.", None),
        ("And on top, a brand new riverside road, with a train line hidden inside.", None),
        ("That road is the Embankment, and trains still rumble through it today.", None),
        ("But he was wrong about one thing.", None),
        ("Cholera never came from the smell. It came from the water.", "Collera never came from the smell. It came from the water."),
        ("And by carrying the filth away from the river, his tunnels stopped it anyway.", None),
        ("When it struck one last time, it hit the only part of town his sewers hadn't reached yet.", None),
        ("Today, London has more than twice the people he planned for, and his tunnels still work.", None),
        ("Because...", "Because"),
    ],
    "es": [
        ("Todos se rieron cuando hizo las alcantarillas de Londres el doble de grandes de lo necesario.", None),
        ("Verás, entonces, cada váter de Londres desaguaba directamente en el río.", None),
        ("El mismo río del que bebía la gente.", None),
        ("Y la gente seguía muriendo de cólera, pero los médicos estaban seguros de que venía del olor.", None),
        ("Así que cuando pidió tuberías el doble de anchas, los políticos pensaron que estaba loco.", None),
        ("¿El doble de ladrillos? ¿Por un olor?", None),
        ("Entonces llegó el verano de 1858.", "Entonces llegó el verano de mil ochocientos cincuenta y ocho."),
        ("El río se coció como una sopa, y la peste entró de lleno en el Parlamento.", None),
        ("Empaparon las cortinas en lejía. Se taparon la nariz con pañuelos.", None),
        ("Lo llamaron la Gran Peste.", None),
        ("Y en solo dieciocho días, le dieron todo.", None),
        ("Trescientos millones de ladrillos. Túneles por los que cabía un carruaje.", None),
        ("Y encima, un paseo nuevo junto al río, con un tren escondido dentro.", None),
        ("Ese paseo es el Embankment, y los trenes todavía pasan por dentro.", "Ese paseo es el Embánkment, y los trenes todavía pasan por dentro."),
        ("Pero se equivocaba en una cosa.", None),
        ("El cólera nunca vino del olor. Venía del agua.", None),
        ("Y al llevarse la porquería lejos del río, sus túneles lo frenaron igualmente.", None),
        ("Cuando atacó por última vez, golpeó la única parte de la ciudad a la que sus alcantarillas aún no habían llegado.", None),
        ("Hoy, Londres tiene más del doble de gente de la que él calculó, y sus túneles siguen funcionando.", None),
        ("Porque...", "Porque"),
    ],
}
MODEL = {"en": ("en_US-ryan-high", 0.92), "es": ("es_ES-davefx-medium", 0.84)}
GAP = 0.16  # silence between sentences (the reference keeps pauses < 0.35 s)


def synth():
    from piper import PiperVoice, SynthesisConfig
    name, ls = MODEL[LANG]
    v = PiperVoice.load(os.path.join(ROOT, "voice", "models", name + ".onnx"))
    cfg = SynthesisConfig(length_scale=ls, noise_scale=0.6, noise_w_scale=0.7)
    parts, sr = [], None
    for show, tts in SCRIPT[LANG]:
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            v.synthesize_wav(tts or show, w, syn_config=cfg)
        buf.seek(0)
        with wave.open(buf, "rb") as r:
            sr = r.getframerate(); a = np.frombuffer(r.readframes(r.getnframes()), np.int16).astype(np.float32) / 32768
        # trim leading/trailing silence so the gaps are ours
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - int(0.02 * sr)): nz[-1] + int(0.04 * sr)]
        parts += [a, np.zeros(int(GAP * sr), np.float32)]
    x = np.concatenate(parts[:-1])
    raw = os.path.join(HERE, "voice", f"voice_{LANG}_raw.wav")
    with wave.open(raw, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    out = os.path.join(HERE, "voice", f"voice_{LANG}.wav")
    # light radio-narrator polish: high-pass, gentle compression, loudness -16 LUFS (the mix sets the final level)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af",
                    "highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=4",
                    "-ar", str(SR_OUT), "-ac", "1", out], check=True)
    return out


def timings(wav):
    import site
    for sp in site.getsitepackages():
        for sub in ("nvidia/cublas/bin", "nvidia/cudnn/bin"):
            p = os.path.join(sp, *sub.split("/"))
            if os.path.isdir(p):
                os.add_dll_directory(p); os.environ["PATH"] = p + os.pathsep + os.environ["PATH"]
    from faster_whisper import WhisperModel
    try:
        m = WhisperModel("large-v3", device="cuda", compute_type="float16")
    except Exception:
        m = WhisperModel("large-v3", device="cpu", compute_type="int8")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    segs, _ = m.transcribe(np.frombuffer(pcm, np.float32), language=LANG, word_timestamps=True, beam_size=5,
                           initial_prompt=" ".join(s for s, _ in SCRIPT[LANG]))
    heard = [(w.start, w.end, w.word.strip()) for s in segs for w in s.words]
    script = " ".join(s for s, _ in SCRIPT[LANG]).split()
    norm = lambda s: re.sub(r"[^a-z0-9áéíóúñü]", "", s.lower())
    # align script words to heard words (monotonic, by normalised text; unmatched words are interpolated)
    out, j = [], 0
    for w in script:
        k = None
        for jj in range(j, min(j + 6, len(heard))):
            if norm(heard[jj][2]) == norm(w) or (norm(w) and norm(heard[jj][2]).startswith(norm(w)[:4])):
                k = jj; break
        if k is not None:
            out.append({"w": w, "s": round(heard[k][0], 2), "e": round(heard[k][1], 2)}); j = k + 1
        else:
            out.append({"w": w, "s": None, "e": None})
    # interpolate gaps
    for i, o in enumerate(out):
        if o["s"] is None:
            a = next((out[p]["e"] for p in range(i - 1, -1, -1) if out[p]["e"] is not None), 0.0)
            b = next((out[p]["s"] for p in range(i + 1, len(out)) if out[p]["s"] is not None), a + 0.4)
            n = next((p for p in range(i + 1, len(out)) if out[p]["s"] is not None), len(out)) - next((p for p in range(i - 1, -1, -1) if out[p]["e"] is not None), -1) - 1
            pos = i - next((p for p in range(i - 1, -1, -1) if out[p]["e"] is not None), -1) - 1
            st = a + (b - a) * pos / max(1, n); o["s"] = round(st, 2); o["e"] = round(st + (b - a) / max(1, n), 2)
    miss = sum(1 for w in script) - sum(1 for _ in heard)
    dst = os.path.join(ROOT, "public", f"sewers_words_{LANG}.json")
    json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout)
    print(f"{LANG}: {len(script)} words, voice {dur:.2f} s, {len(script) / out[-1]['e']:.2f} w/s, heard {len(heard)} (diff {miss})")
    return out


if __name__ == "__main__":
    os.makedirs(os.path.join(HERE, "voice"), exist_ok=True)
    wav = synth()
    import shutil; shutil.copy(wav, os.path.join(ROOT, "public", f"sewers_voice_{LANG}.wav"))
    timings(wav)
