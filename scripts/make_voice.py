"""Narration for the sewers short: Piper TTS sentence by sentence + Whisper word timings mapped onto the script words.
Usage: python scripts/make_voice.py <project> en|es  -> <project>/voice/voice_<lang>.wav, public/<project>_words_<lang>.json
(lines and voice models come from <project>/script.json)
"""
import json, os, re, subprocess, sys, wave, io
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR_OUT = 48000

PROJECT = sys.argv[1]; LANG = sys.argv[2] if len(sys.argv) > 2 else "en"
CFG = json.load(open(os.path.join(ROOT, PROJECT, "script.json"), encoding="utf-8"))
SCRIPT = {k: [tuple(x) for x in CFG[k]] for k in ("en", "es")}
MODEL = {k: tuple(v) for k, v in CFG["model"].items()}
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
    raw = os.path.join(ROOT, PROJECT, "voice", f"voice_{LANG}_raw.wav")
    with wave.open(raw, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    out = os.path.join(ROOT, PROJECT, "voice", f"voice_{LANG}.wav")
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
    dst = os.path.join(ROOT, "public", f"{PROJECT}_words_{LANG}.json")
    json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout)
    print(f"{LANG}: {len(script)} words, voice {dur:.2f} s, {len(script) / out[-1]['e']:.2f} w/s, heard {len(heard)} (diff {miss})")
    return out


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, PROJECT, "voice"), exist_ok=True)
    wav = synth()
    import shutil; shutil.copy(wav, os.path.join(ROOT, "public", f"{PROJECT}_voice_{LANG}.wav"))
    timings(wav)
