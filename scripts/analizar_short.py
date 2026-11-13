"""Análisis fotograma a fotograma de un short vertical (mismo formato que research/0X_*).

Uso:
  python scripts/analizar_short.py VIDEO.mp4 research/NN_nombre [--idioma en] [--modelo large-v3]

Genera en la carpeta de salida:
  metricas_por_fotograma.csv  métricas de imagen a 30 fps
  hojas/sNN.jpg               hojas de contacto a 30 fps: todos los fotogramas (8x4, ~1,07 s por hoja)
  revision/rNN.jpg            hojas a 2 fps (8x4, 16 s por hoja) para revisar rápido
  transiciones_30fps/         16 fotogramas seguidos alrededor de cada corte, fundido o barrido
  fotogramas_clave.jpg        14 fotogramas repartidos (7x2)
  espectrograma.png           espectrograma del audio
  transcripcion_<idioma>.json Whisper con tiempos por palabra
  datos.json                  resumen: duración, cortes, bloques, voz, sonoridad
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np

W, H, FPS = 270, 480, 30


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def duracion(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", video], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def metricas(video, salida):
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf",
                             f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                            stdout=subprocess.PIPE)
    filas, prev, i = [], None, 0
    n = W * H * 3
    while True:
        buf = proc.stdout.read(n)
        if len(buf) < n:
            break
        f = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.float32) / 255.0
        r, g, b = f[..., 0], f[..., 1], f[..., 2]
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        mx, mn = f.max(-1), f.min(-1)
        sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
        gris = lum
        mov = 0.0 if prev is None else float(np.abs(gris - prev).mean() * 255)
        prev = gris
        filas.append((i / FPS, float(lum.mean()), float(lum.std()), float(np.percentile(lum, 2)),
                      float(np.percentile(lum, 98)), float(sat.mean()), float((lum < 0.05).mean()),
                      float((lum > 0.95).mean()), float((r - b).mean()), mov))
        i += 1
    proc.wait()
    with open(os.path.join(salida, "metricas_por_fotograma.csv"), "w", encoding="utf-8") as fh:
        fh.write("t,lum,contraste,p2,p98,saturacion,pct_negro,pct_blanco,calidez_R-B,movimiento\n")
        for row in filas:
            fh.write(",".join(f"{v:.4f}" for v in row) + "\n")
    return np.array(filas)


def cortes(m):
    """Cambios de plano: picos de movimiento muy por encima de su entorno."""
    mov = m[:, 9]
    res = []
    for k in range(1, len(mov) - 1):
        vecinos = np.median(mov[max(0, k - 15):k + 15])
        if mov[k] > 25 and mov[k] > 3 * max(vecinos, 2) and mov[k] >= mov[k - 1] and mov[k] >= mov[k + 1]:
            if not res or m[k, 0] - res[-1] > 0.25:
                res.append(round(float(m[k, 0]), 2))
    return res


def hojas(video, salida, fps, carpeta, prefijo):
    d = os.path.join(salida, carpeta)
    os.makedirs(d, exist_ok=True)
    texto = "drawtext=fontfile='C\\:/Windows/Fonts/consola.ttf':text='%{pts\\:hms}':x=6:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.55"
    run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf",
         f"fps={fps},scale=180:320,{texto},tile=8x4", os.path.join(d, prefijo + "%02d.jpg")])


def transiciones(video, salida, m):
    """Hojas a 30 fps (16 fotogramas = 0,53 s) alrededor de cada cambio de plano o transición.
    Detecta picos de movimiento (cortes) y tramos de cambio sostenido (fundidos, barridos)."""
    mov = m[:, 9]
    sm = np.convolve(mov, np.ones(5) / 5, mode="same")
    fondo = np.array([np.median(mov[max(0, k - 45):k + 45]) for k in range(len(mov))])
    marca = (mov > np.maximum(18, 3 * fondo)) | (sm > np.maximum(10, 2.5 * fondo))
    centros, k = [], 0
    while k < len(marca):
        if marca[k]:
            j = k
            while j + 1 < len(marca) and marca[j + 1]:
                j += 1
            c = (k + j) // 2
            if not centros or c - centros[-1] > 12:
                centros.append(c)
            k = j + 1
        else:
            k += 1
    d = os.path.join(salida, "transiciones_30fps")
    os.makedirs(d, exist_ok=True)
    texto = "drawtext=fontfile='C\\:/Windows/Fonts/consola.ttf':text='%{pts\\:hms}':x=6:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.55"
    for n, c in enumerate(centros, 1):
        t0 = max(0, (c - 8) / FPS)
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-i", video, "-vf",
             f"fps={FPS},setpts=PTS+{t0:.3f}/TB,scale=180:320,{texto},tile=8x2", "-frames:v", "1",
             os.path.join(d, f"t{n:02d}_{c / FPS:05.2f}s.jpg")])
    return [round(c / FPS, 2) for c in centros]


def clave(video, salida, dur):
    paso = dur / 14
    run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf",
         f"fps=1/{paso:.4f},scale={W}:{H},tile=7x2", "-frames:v", "1",
         os.path.join(salida, "fotogramas_clave.jpg")])


def espectrograma(video, salida):
    run(["ffmpeg", "-v", "error", "-y", "-i", video, "-lavfi",
         "showspectrumpic=s=1600x512:legend=1:scale=log", os.path.join(salida, "espectrograma.png")])


def sonoridad(video):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", video, "-af", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True)
    txt = p.stderr[p.stderr.rfind("Summary"):]
    get = lambda k: float(re.search(k + r":\s+(-?[\d.]+)", txt).group(1))
    return {"integrado_LUFS": get("I"), "LRA_LU": get("LRA")}


def transcribir(video, salida, idioma, modelo):
    import site
    for sp in site.getsitepackages():
        for sub in ("nvidia/cublas/bin", "nvidia/cudnn/bin"):
            p = os.path.join(sp, *sub.split("/"))
            if os.path.isdir(p):
                os.add_dll_directory(p)
                os.environ["PATH"] = p + os.pathsep + os.environ["PATH"]
    from faster_whisper import WhisperModel
    try:
        wm = WhisperModel(modelo, device="cuda", compute_type="float16")
    except Exception:
        wm = WhisperModel(modelo, device="cpu", compute_type="int8")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-ac", "1", "-ar", "16000",
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.float32)
    segs, _ = wm.transcribe(audio, language=idioma, word_timestamps=True, vad_filter=False,
                            beam_size=5, condition_on_previous_text=True)
    out = []
    for s in segs:
        out.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text,
                    "words": [[round(w.start, 2), round(w.end, 2), w.word] for w in s.words]})
    with open(os.path.join(salida, f"transcripcion_{idioma}.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
    return out


def voz(trans):
    palabras = [w for s in trans for w in s["words"]]
    if not palabras:
        return {}
    t0, t1 = palabras[0][0], palabras[-1][1]
    pausas = []
    for a, b in zip(palabras, palabras[1:]):
        gap = b[0] - a[1]
        if gap > 0.25:
            pausas.append([round(a[1], 2), round(gap, 2), a[2].strip(), b[2].strip()])
    return {"palabras": len(palabras), "inicio_voz": t0, "fin_voz": t1,
            "palabras_por_s": round(len(palabras) / (t1 - t0), 2), "pausas_>0.25s": pausas}


def bloques(m, cs, dur):
    """Métricas medias entre cortes (o cada 3 s si no hay cortes)."""
    lim = [0.0] + cs + [dur]
    res = []
    for a, b in zip(lim, lim[1:]):
        sel = (m[:, 0] >= a) & (m[:, 0] < b)
        if sel.sum() == 0:
            continue
        x = m[sel]
        res.append({"de": round(a, 2), "a": round(b, 2), "lum": round(x[:, 1].mean(), 3),
                    "contraste": round(x[:, 2].mean(), 3), "p2": round(x[:, 3].mean(), 3),
                    "sat": round(x[:, 5].mean(), 3), "calidez": round(x[:, 8].mean(), 3),
                    "mov": round(x[:, 9].mean(), 1)})
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("salida")
    ap.add_argument("--idioma", default="en")
    ap.add_argument("--modelo", default="large-v3")
    a = ap.parse_args()
    os.makedirs(a.salida, exist_ok=True)
    dur = duracion(a.video)
    m = metricas(a.video, a.salida)
    cs = cortes(m)
    hojas(a.video, a.salida, 30, "hojas", "s")
    hojas(a.video, a.salida, 2, "revision", "r")
    trans_t = transiciones(a.video, a.salida, m)
    clave(a.video, a.salida, dur)
    espectrograma(a.video, a.salida)
    tr = transcribir(a.video, a.salida, a.idioma, a.modelo)
    datos = {"duracion": round(dur, 2), "cortes_duros": cs, "transiciones_detectadas": trans_t,
             "global": {"lum": round(m[:, 1].mean(), 3), "contraste": round(m[:, 2].mean(), 3),
                        "p2": round(m[:, 3].mean(), 3), "p98": round(m[:, 4].mean(), 3),
                        "sat": round(m[:, 5].mean(), 3), "calidez": round(m[:, 8].mean(), 3),
                        "mov": round(m[:, 9].mean(), 2)},
             "por_segundo": [{"t": s, **{k: round(float(m[(m[:, 0] >= s) & (m[:, 0] < s + 1)][:, j].mean()), 3)
                                         for k, j in (("lum", 1), ("sat", 5), ("calidez", 8), ("mov", 9))}}
                             for s in range(int(dur))],
             "bloques_entre_cortes": bloques(m, cs, dur),
             "voz": voz(tr), "sonoridad": sonoridad(a.video)}
    with open(os.path.join(a.salida, "datos.json"), "w", encoding="utf-8") as fh:
        json.dump(datos, fh, ensure_ascii=False, indent=1)
    print(json.dumps({k: datos[k] for k in ("duracion", "global", "sonoridad")}, ensure_ascii=False))
    print("cortes:", len(cs), "| voz:", {k: v for k, v in datos["voz"].items() if k != "pausas_>0.25s"},
          "| pausas:", len(datos["voz"].get("pausas_>0.25s", [])))


if __name__ == "__main__":
    sys.exit(main())
