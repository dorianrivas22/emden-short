"""Métricas objetivas de estilo para un short vertical (complementa scripts/analizar_short.py).

Uso:
  python scripts/metricas_avanzadas.py VIDEO.mp4 CARPETA_SALIDA [--transcripcion research/X/transcripcion_en.json]

Todo se mide sobre fotogramas reescalados a 540x960 (luz, color, detalle, sombras, desenfoque, caras) y a 135x240
(movimiento de cámara con flujo óptico). Escribe:
  avanzadas_por_fotograma.csv   una fila cada 3 fotogramas (10 por segundo)
  avanzadas.json                medias, percentiles p10/p50/p90 y, si hay transcripción, métricas del guion

Definiciones (todas con valores 0..1 salvo que se diga):
  lum, lum_p2/p50/p98    luminancia Rec.709 media y percentiles
  contraste_global       desviación típica de la luminancia
  contraste_local        media de la desviación típica en bloques de 32x32 px
  sat, sat_p90           saturación HSV media y percentil 90
  colorido               índice de Hasler-Süsstrunk (0 = gris, >100 = muy colorido)
  colores_distintos      nº de colores 5 bits/canal con >= 0,05 % de los píxeles
  bordes                 % de píxeles con gradiente Sobel > 0,10 (detalle y líneas)
  detalle_fino           % de píxeles con |Laplaciano| > 0,06 (textura pequeña)
  tinta                  % de píxeles de línea oscura fina (lum < 0,22 y 0,20 más oscuros que su entorno 7x7)
  sombra_pct             % de píxeles con lum < 0,6 x p80 (zonas en sombra)
  sombra_lum / luz_lum   lum media del cuartil oscuro / claro; ratio = sombra/luz
  sombra_sat / luz_sat   saturación media del cuartil oscuro / claro
  sombra_RB / luz_RB     R-B medio del cuartil oscuro / claro (positivo = cálido)
  sombra_tono            tono medio (grados) de los píxeles del cuartil oscuro con sat > 0,15
  viñeta                 lum del 50 % central / lum del marco exterior (15 % de cada borde)
  arriba_abajo           lum del tercio superior / tercio inferior
  nitidez_centro_borde   |Laplaciano| medio del centro / del marco (>1 = fondo desenfocado)
  caras / cara_alto      nº de caras blancas tipo judía (blobs claros, sólidos, ovalados) y su alto en % del cuadro
  pan_x, pan_y           traslación de cámara en píxeles de 1080x1920 por fotograma (flujo óptico + afín)
  zoom                   cambio de escala por segundo (%/s, + = acercándose)
  giro                   rotación en grados por segundo
  mov_objetos            movimiento residual (no explicado por la cámara), px de 1080 por fotograma
"""
import argparse
import json
import os
import re
import subprocess
import sys

import cv2
import numpy as np

W, H, FPS, STEP = 540, 960, 30, 3
FW, FH = 135, 240


def frames(video):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={FPS},scale={W}:{H}:flags=area",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, stdin=subprocess.DEVNULL)
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
    p.wait()


def caras(rgb, lum, sat):
    m = ((lum > 0.72) & (sat < 0.28)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    res = []
    for k in range(1, n):
        x, y, w, h, a = st[k]
        if a < 0.0015 * W * H or a > 0.12 * W * H:
            continue
        if not (0.5 < w / max(h, 1) < 1.8):
            continue
        cnt, _ = cv2.findContours((lab == k).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        c = max(cnt, key=cv2.contourArea)
        fill = np.zeros_like(m); cv2.drawContours(fill, [c], -1, 1, -1)   # eyes/mouth holes filled
        sol = cv2.contourArea(c) / max(cv2.contourArea(cv2.convexHull(c)), 1)
        if sol < 0.8:
            continue
        # a bean head has a dark ink rim: the ring just outside must be clearly darker
        ring = cv2.dilate(fill, np.ones((7, 7), np.uint8)) - fill
        if lum[ring > 0].mean() > 0.55:
            continue
        res.append(h / H)
    return len(res), (float(np.median(res)) if res else 0.0)


def medir(rgb):
    f = rgb.astype(np.float32) / 255
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    mx, mn = f.max(-1), f.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    o = {}
    o["lum"] = lum.mean(); o["lum_p2"], o["lum_p50"], o["lum_p98"] = np.percentile(lum, [2, 50, 98])
    o["contraste_global"] = lum.std()
    bl = lum[: H // 32 * 32, : W // 32 * 32].reshape(H // 32, 32, W // 32, 32).std(axis=(1, 3))
    o["contraste_local"] = bl.mean()
    o["sat"] = sat.mean(); o["sat_p90"] = np.percentile(sat, 90)
    rg, yb = (r - g) * 255, (0.5 * (r + g) - b) * 255
    o["colorido"] = np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)
    q = (rgb >> 3).astype(np.int32); code = (q[..., 0] << 10) | (q[..., 1] << 5) | q[..., 2]
    cnt = np.bincount(code.ravel(), minlength=32768); o["colores_distintos"] = int((cnt >= 0.0005 * W * H).sum())
    gx = cv2.Sobel(lum, cv2.CV_32F, 1, 0, ksize=3) / 4; gy = cv2.Sobel(lum, cv2.CV_32F, 0, 1, ksize=3) / 4
    o["bordes"] = (np.hypot(gx, gy) > 0.10).mean() * 100
    lap = cv2.Laplacian(lum, cv2.CV_32F, ksize=1)
    o["detalle_fino"] = (np.abs(lap) > 0.06).mean() * 100
    loc = cv2.blur(lum, (7, 7))
    o["tinta"] = ((lum < 0.22) & (loc - lum > 0.20)).mean() * 100
    p80 = np.percentile(lum, 80); o["sombra_pct"] = (lum < 0.6 * p80).mean() * 100
    q25, q75 = np.percentile(lum, [25, 75]); dk, lt = lum <= q25, lum >= q75
    o["sombra_lum"], o["luz_lum"] = lum[dk].mean(), lum[lt].mean(); o["sombra_ratio"] = o["sombra_lum"] / max(o["luz_lum"], 1e-6)
    o["sombra_sat"], o["luz_sat"] = sat[dk].mean(), sat[lt].mean()
    o["sombra_RB"], o["luz_RB"] = (r - b)[dk].mean(), (r - b)[lt].mean()
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV_FULL); hue = hsv[..., 0].astype(np.float32) / 255 * 2 * np.pi
    sel = dk & (sat > 0.15)
    o["sombra_tono"] = (np.degrees(np.arctan2(np.sin(hue[sel]).mean(), np.cos(hue[sel]).mean())) % 360) if sel.sum() > 50 else -1
    by, bx = int(H * 0.15), int(W * 0.15)
    ring = np.ones_like(lum, bool); ring[by:-by, bx:-bx] = False
    cen = lum[H // 4: 3 * H // 4, W // 4: 3 * W // 4]
    o["viñeta"] = cen.mean() / max(lum[ring].mean(), 1e-6)
    o["arriba_abajo"] = lum[: H // 3].mean() / max(lum[2 * H // 3:].mean(), 1e-6)
    al = np.abs(lap)
    o["nitidez_centro_borde"] = al[int(H * .3):int(H * .7), int(W * .3):int(W * .7)].mean() / max(al[ring].mean(), 1e-6)
    o["caras"], o["cara_alto"] = caras(rgb, lum, sat)
    return {k: float(v) for k, v in o.items()}


def camara(prev, cur):
    fl = cv2.calcOpticalFlowFarneback(prev, cur, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    ys, xs = np.mgrid[4:FH:8, 4:FW:8]
    p0 = np.stack([xs.ravel(), ys.ravel()], 1).astype(np.float32)
    p1 = p0 + fl[ys.ravel(), xs.ravel()]
    M, inl = cv2.estimateAffinePartial2D(p0, p1, method=cv2.RANSAC, ransacReprojThreshold=1.0)
    k = 1080 / FW
    if M is None:
        return 0, 0, 0, 0, float(np.hypot(fl[..., 0], fl[..., 1]).mean() * k)
    s = np.hypot(M[0, 0], M[1, 0]); rot = np.degrees(np.arctan2(M[1, 0], M[0, 0]))
    pred = p0 @ M[:, :2].T + M[:, 2]
    res = np.linalg.norm(p1 - pred, axis=1).mean() * k
    c = np.array([FW / 2, FH / 2]); tc = c @ M[:, :2].T + M[:, 2] - c
    return float(tc[0] * k), float(tc[1] * k), float((s - 1) * 100 * FPS), float(rot * FPS), float(res)


def guion(path):
    tr = json.load(open(path, encoding="utf-8"))
    ws = [w for s in tr for w in s["words"]]
    if not ws:
        return {}
    txt = " ".join(w[2].strip() for w in ws)
    sents = [s.strip() for s in re.split(r"(?<=[.?!])\s+", txt) if s.strip()]
    lens = [len(s.split()) for s in sents]
    low = txt.lower()
    cnt = lambda pat: len(re.findall(pat, low))
    t0, t1 = ws[0][0], ws[-1][1]
    gancho = sents[0] if sents else ""
    return {"palabras": len(ws), "palabras_por_s": round(len(ws) / max(t1 - t0, 1e-6), 2), "frases": len(sents),
            "palabras_por_frase_media": round(float(np.mean(lens)), 1), "palabras_por_frase_p90": int(np.percentile(lens, 90)),
            "frases_<=6_palabras": sum(1 for x in lens if x <= 6), "preguntas": txt.count("?"),
            "gancho_palabras": len(gancho.split()), "gancho_fin_s": round(next((w[1] for w in ws if w[2].strip().endswith((".", "?", "!"))), t1), 2),
            "numeros": len(re.findall(r"\b\d[\d,.]*\b", txt)) + cnt(r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|thousand|million|billion)\b"),
            "you_see": cnt(r"\byou see\b"), "but": cnt(r"\bbut\b"), "then": cnt(r"\bthen\b"), "so": cnt(r"\bso\b"),
            "wait": cnt(r"\bwait\b"), "he_she_they": cnt(r"\b(he|she|they)\b"), "you": cnt(r"\byou\b"),
            "silencio_inicial_s": round(t0, 2)}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("salida"); ap.add_argument("--transcripcion")
    a = ap.parse_args(); os.makedirs(a.salida, exist_ok=True)
    filas, prev, cam = [], None, []
    for i, fr in enumerate(frames(a.video)):
        g = cv2.cvtColor(cv2.resize(fr, (FW, FH), interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2GRAY)
        if prev is not None:
            cam.append(camara(prev, g))
        prev = g
        if i % STEP == 0:
            d = {"t": round(i / FPS, 3), **medir(fr)}
            c = cam[-1] if cam else (0, 0, 0, 0, 0)
            d.update(dict(zip(("pan_x", "pan_y", "zoom", "giro", "mov_objetos"), c)))
            filas.append(d)
    cam = np.array(cam)
    keys = list(filas[0].keys())
    with open(os.path.join(a.salida, "avanzadas_por_fotograma.csv"), "w", encoding="utf-8") as fh:
        fh.write(",".join(keys) + "\n")
        for d in filas:
            fh.write(",".join(f"{d[k]:.4f}" for k in keys) + "\n")
    res = {}
    for k in keys[1:]:
        v = np.array([d[k] for d in filas], float)
        if k == "sombra_tono":
            v = v[v >= 0]
            if not len(v):
                continue
        res[k] = {"media": round(float(v.mean()), 4), "p10": round(float(np.percentile(v, 10)), 4),
                  "p50": round(float(np.percentile(v, 50)), 4), "p90": round(float(np.percentile(v, 90)), 4)}
    # camera behaviour over all frame pairs (30 fps)
    vel = np.hypot(cam[:, 0], cam[:, 1])
    res["camara"] = {"px_por_fotograma_media": round(float(vel.mean()), 2),
                     "pct_fotogramas_quieta(<0.5px,|zoom|<0.5%/s)": round(float(((vel < 0.5) & (np.abs(cam[:, 2]) < 0.5)).mean() * 100), 1),
                     "pct_fotogramas_con_zoom(>2%/s)": round(float((np.abs(cam[:, 2]) > 2).mean() * 100), 1),
                     "pct_zoom_hacia_dentro": round(float((cam[:, 2] > 2).mean() * 100), 1),
                     "pct_con_giro(>1grado/s)": round(float((np.abs(cam[:, 3]) > 1).mean() * 100), 1),
                     "pct_paneo(>3px/fot)": round(float((vel > 3).mean() * 100), 1),
                     "mov_objetos_media": round(float(cam[:, 4].mean()), 2)}
    cf = np.array([d["caras"] for d in filas])
    res["personajes"] = {"pct_fotogramas_con_cara": round(float((cf > 0).mean() * 100), 1), "caras_media_si_hay": round(float(cf[cf > 0].mean()) if (cf > 0).any() else 0, 2),
                         "cara_alto_p50_si_hay_%": round(float(np.median([d["cara_alto"] for d in filas if d["caras"] > 0]) * 100) if (cf > 0).any() else 0, 1)}
    if a.transcripcion and os.path.exists(a.transcripcion):
        res["guion"] = guion(a.transcripcion)
    json.dump(res, open(os.path.join(a.salida, "avanzadas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps({k: (v["media"] if isinstance(v, dict) and "media" in v else v) for k, v in res.items()}, ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())
