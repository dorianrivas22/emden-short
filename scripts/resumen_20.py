"""Junta los análisis de los 20 últimos vídeos del canal de referencia y los compara con nuestros vídeos.
Uso: python scripts/resumen_20.py  -> research/ultimos20/TABLAS.md y research/ultimos20/resumen.json
"""
import csv
import json
import os
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from metricas_avanzadas import guion  # noqa: E402

R = os.path.join(ROOT, "research")
lista = [l.strip().split("|") for l in open(os.path.join(R, "_fuentes", "lista20.txt"), encoding="utf-8") if l.strip()]
info = {}
for fn in ("info.txt", "info_20.txt"):
    p = os.path.join(R, "_fuentes", fn)
    if os.path.exists(p):
        for l in open(p, encoding="utf-8"):
            x = l.strip().split("|")
            if len(x) >= 5:
                info[x[0]] = {"titulo": x[1], "visitas": int(x[3]), "fecha": x[4]}

def carpeta(n, name):
    return os.path.join(R, name[1:]) if name.startswith("=") else os.path.join(R, "ultimos20", f"{n}_{name}")

def arco(csvp, col="lum", partes=10):
    rows = list(csv.DictReader(open(csvp, encoding="utf-8")))
    v = np.array([float(r[col]) for r in rows])
    return [round(float(x.mean()), 3) for x in np.array_split(v, partes)]

videos = []
for n, vid, name in lista:
    d = carpeta(n, name)
    try:
        dat = json.load(open(os.path.join(d, "datos.json"), encoding="utf-8"))
        adv = json.load(open(os.path.join(d, "avanzadas.json"), encoding="utf-8"))
    except FileNotFoundError:
        print("falta", d); continue
    g = guion(os.path.join(d, "transcripcion_en.json")) if os.path.exists(os.path.join(d, "transcripcion_en.json")) else {}
    videos.append({"n": n, "id": vid, "carpeta": os.path.relpath(d, ROOT).replace("\\", "/"), **info.get(vid, {}),
                   "duracion": dat["duracion"], "cortes": len(dat["cortes_duros"]), "transiciones": len(dat["transiciones_detectadas"]),
                   "LUFS": dat["sonoridad"]["integrado_LUFS"], "LRA": dat["sonoridad"]["LRA_LU"],
                   "pausas": len(dat["voz"].get("pausas_>0.25s", [])), "guion": g, "adv": adv,
                   "arco_lum": arco(os.path.join(d, "metricas_por_fotograma.csv")),
                   "arco_calidez": arco(os.path.join(d, "metricas_por_fotograma.csv"), "calidez_R-B")})

propios = {}
for nm in sorted(os.listdir(os.path.join(R, "_propios"))) if os.path.isdir(os.path.join(R, "_propios")) else []:
    p = os.path.join(R, "_propios", nm, "avanzadas.json")
    if os.path.exists(p):
        propios[nm] = json.load(open(p, encoding="utf-8"))

KEYS = ["lum", "lum_p2", "lum_p98", "contraste_global", "contraste_local", "sat", "sat_p90", "colorido", "colores_distintos",
        "bordes", "detalle_fino", "tinta", "sombra_pct", "sombra_ratio", "sombra_sat", "luz_sat", "sombra_RB", "luz_RB", "sombra_tono",
        "viñeta", "arriba_abajo", "nitidez_centro_borde", "mov_objetos"]
CAM = ["px_por_fotograma_media", "pct_fotogramas_quieta(<0.5px,|zoom|<0.5%/s)", "pct_fotogramas_con_zoom(>2%/s)", "pct_zoom_hacia_dentro", "pct_con_giro(>1grado/s)", "pct_paneo(>3px/fot)"]
GU = ["palabras", "palabras_por_s", "frases", "palabras_por_frase_media", "palabras_por_frase_p90", "frases_<=6_palabras", "preguntas", "gancho_palabras", "gancho_fin_s", "numeros", "you_see", "but", "then", "so", "wait", "you", "silencio_inicial_s"]

def stats(vals):
    v = np.array([x for x in vals if x is not None], float)
    return {"p10": round(float(np.percentile(v, 10)), 3), "mediana": round(float(np.median(v)), 3), "p90": round(float(np.percentile(v, 90)), 3)} if len(v) else {}

corpus = {"imagen": {k: stats([v["adv"].get(k, {}).get("media") for v in videos]) for k in KEYS},
          "camara": {k: stats([v["adv"]["camara"][k] for v in videos]) for k in CAM},
          "personajes": {k: stats([v["adv"]["personajes"][k] for v in videos]) for k in videos[0]["adv"]["personajes"]},
          "guion": {k: stats([v["guion"].get(k) for v in videos if v["guion"]]) for k in GU},
          "montaje": {k: stats([v[k] for v in videos]) for k in ("duracion", "cortes", "transiciones", "LUFS", "LRA", "pausas")},
          "transiciones_por_min": stats([v["transiciones"] / v["duracion"] * 60 for v in videos]),
          "arco_lum": [round(float(np.median([v["arco_lum"][i] for v in videos])), 3) for i in range(10)],
          "arco_calidez": [round(float(np.median([v["arco_calidez"][i] for v in videos])), 3) for i in range(10)]}
json.dump({"videos": videos, "corpus": corpus, "propios": propios}, open(os.path.join(R, "ultimos20", "resumen.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------- markdown tables ----------------
L = ["# Últimos 20 vídeos del canal de referencia: tablas numéricas", "",
     "Generado por `scripts/resumen_20.py` a partir de `datos.json` (scripts/analizar_short.py) y `avanzadas.json` (scripts/metricas_avanzadas.py).",
     "Definición de cada métrica: cabecera de `scripts/metricas_avanzadas.py`. p10/mediana/p90 = entre los 20 vídeos (cada vídeo aporta su media).", ""]
L += ["## 1. Corpus", "", "| # | Título | Visitas | Fecha | Dur. s | Pal./s | Cortes | Transic./min | LUFS | LRA |", "|---|---|---|---|---|---|---|---|---|---|"]
for v in videos:
    L.append(f"| {v['n']} | {v.get('titulo', v['id'])} | {v.get('visitas', 0) / 1e6:.1f} M | {v.get('fecha', '')} | {v['duracion']:.1f} | {v['guion'].get('palabras_por_s', '')} | {v['cortes']} | {v['transiciones'] / v['duracion'] * 60:.0f} | {v['LUFS']} | {v['LRA']} |")
def tabla(titulo, sec, keys, getp=None):
    out = ["", f"## {titulo}", "", "| Métrica | p10 | mediana | p90 | " + " | ".join(propios) + " |", "|---|---|---|---|" + "---|" * len(propios)]
    for k in keys:
        s = corpus[sec].get(k, {})
        if not s: continue
        own = []
        for nm, a in propios.items():
            x = getp(a, k) if getp else None
            own.append("" if x is None else f"{x:.3g}")
        out.append(f"| {k} | {s['p10']:.3g} | **{s['mediana']:.3g}** | {s['p90']:.3g} | " + " | ".join(own) + " |")
    return out
L += tabla("2. Imagen (luz, color, detalle, sombras, lente)", "imagen", KEYS, lambda a, k: a.get(k, {}).get("media"))
L += tabla("3. Cámara", "camara", CAM, lambda a, k: a.get("camara", {}).get(k))
L += tabla("4. Personajes (caras blancas detectadas)", "personajes", list(corpus["personajes"]), lambda a, k: a.get("personajes", {}).get(k))
L += tabla("5. Guion", "guion", GU)
L += tabla("6. Montaje y sonido", "montaje", ["duracion", "cortes", "transiciones", "LUFS", "LRA", "pausas"])
L += ["", "## 7. Arco de luz (mediana de los 20, por décimas del vídeo)", "",
      "| décima | " + " | ".join(str(i + 1) for i in range(10)) + " |", "|---|" + "---|" * 10,
      "| lum | " + " | ".join(str(x) for x in corpus["arco_lum"]) + " |", "| calidez R-B | " + " | ".join(str(x) for x in corpus["arco_calidez"]) + " |"]
L += ["", "## 8. Por vídeo (imagen)", "", "| # | lum | contr. | sat | colorido | colores | bordes % | detalle % | tinta % | sombra % | sombra sat | tono sombra ° | nitidez c/b | cám. px/f | quieta % | giro % | caras % | cara alto % |", "|---" * 19 + "|"]
for v in videos:
    a = v["adv"]; m = lambda k: a.get(k, {}).get("media", float("nan"))
    L.append(f"| {v['n']} | {m('lum'):.2f} | {m('contraste_global'):.2f} | {m('sat'):.2f} | {m('colorido'):.0f} | {m('colores_distintos'):.0f} | {m('bordes'):.1f} | {m('detalle_fino'):.1f} | {m('tinta'):.2f} | {m('sombra_pct'):.0f} | {m('sombra_sat'):.2f} | {m('sombra_tono'):.0f} | {m('nitidez_centro_borde'):.2f} | {a['camara']['px_por_fotograma_media']} | {a['camara']['pct_fotogramas_quieta(<0.5px,|zoom|<0.5%/s)']} | {a['camara']['pct_con_giro(>1grado/s)']} | {a['personajes']['pct_fotogramas_con_cara']} | {a['personajes']['cara_alto_p50_si_hay_%']} |")
open(os.path.join(R, "ultimos20", "TABLAS.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
print("videos", len(videos), "propios", list(propios))
