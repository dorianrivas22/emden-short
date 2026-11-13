"""Métricas medias por bloques de tiempo.
Uso: python scripts/bloques.py research/NN_x 0 3.7 11.5 21.4 ...   (límites en segundos)"""
import csv
import os
import sys

carpeta, lims = sys.argv[1], [float(x) for x in sys.argv[2:]]
filas = list(csv.DictReader(open(os.path.join(carpeta, "metricas_por_fotograma.csv"), encoding="utf-8")))
print("| Bloque | Brillo | Contraste | p2 | Saturación | Calidez | Movimiento |")
for a, b in zip(lims, lims[1:]):
    sel = [f for f in filas if a <= float(f["t"]) < b]
    m = lambda k: sum(float(f[k]) for f in sel) / len(sel)
    print(f"| {a:g}–{b:g} | {m('lum'):.2f} | {m('contraste'):.2f} | {m('p2'):.2f} | {m('saturacion'):.2f} | "
          f"{m('calidez_R-B'):+.2f} | {m('movimiento'):.1f} |")
