// Calibration scene for the v2 engine: two 4-second shots (bakery inside, Berlin street) measured against
// research/GUIA_NUMERICA_20.md with scripts/metricas_avanzadas.py before the full remake.
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { StageView, KitWorld, Rig } from "../kit/Stage";
import { LOOKS } from "../kit/look";
import { live, applyCam, Cam } from "../kit/camera";
import { Cast2, style, toque, bun, topHat, bowler, flatCap, bigMoustache, bowtie, glasses, apron, all } from "../kit/cast";
import { blinkAt } from "../emden/chars";
import { Bakery, Street } from "./sets";

export const TEST_FRAMES = 240;
const BAKER = style({ jacket: "#f2efe8", pants: "#3a3a44", hat: null, moustache: undefined, build: "stout", buttons: "#c9c2b0" });
const WOMAN = style({ jacket: "#7a3a52", pants: "#2a2a30", hat: null, dress: "#8a4a62" });
const MAN = style({ jacket: "#3a5a7a", pants: "#2a2a34", hat: null });
const RICH = style({ jacket: "#2a2a34", pants: "#2a2a34", hat: null, buttons: "#d8b45a", build: "stout" });
const WORKER = (v: number) => style({ jacket: ["#5a6a4a", "#6a4a3a", "#4a5a6a"][v % 3], pants: "#3a3530", hat: null });

class TestWorld implements KitWorld {
  root = new THREE.Group(); cast = new Cast2(); bakery = new Bakery(); street = new Street();
  constructor() { this.root.add(this.bakery.g, this.street.g, this.cast.root); }
  update(i: number, t: number, cam: THREE.PerspectiveCamera, _s: THREE.Scene, _r: Rig) {
    const ts = t - i * 4;
    this.bakery.g.visible = i === 0; this.street.g.visible = i === 1;
    let c: Cam, look = LOOKS.interior, dof = 4;
    if (i === 0) {
      this.bakery.tick(t);
      c = live({ pos: [0.5, 1.95, 3.6], look: [0.1, 1.65, -1.4], fov: 46 }, ts, i);
      this.cast.begin(cam, look.cardTint);
      this.cast.stand(BAKER, "baker", 0.2, 0, -1.9, t, { expr: ts > 2 ? "shock" : "neutral", blink: blinkAt(t, 1), face: all(apron, toque, bigMoustache, ts > 2 ? (p) => p : (p) => p) });
      this.cast.stand(WOMAN, "wom", -0.75, 0, -0.1, t, { expr: "stern", blink: blinkAt(t, 2), face: bun, mirror: true });
      this.cast.stand(MAN, "man", 0.95, 0, 0.2, t, { expr: "smile", blink: blinkAt(t, 3), face: all(bowler, bowtie()) });
    } else {
      look = LOOKS.golden; dof = 3;
      c = live({ pos: [-1.5, 1.7, 9.5], look: [0.5, 1.6, 2], fov: 48 }, ts, i);
      this.cast.begin(cam, look.cardTint);
      this.cast.stand(WOMAN, "wom2", -0.6, 0, 4.2, t, { expr: "nervous", blink: blinkAt(t, 2), face: bun });
      this.cast.stand(RICH, "rich", 1.4, 0, 3.0, t, { expr: "grin", blink: blinkAt(t, 5), face: all(topHat, bigMoustache, glasses) });
      for (let k = 0; k < 14; k++) { const ph = (t * 0.9 + k * 0.37) % 1; this.cast.stand(WORKER(k), `w${k}`, -4 + (k % 5) * 2 + 0.6 * Math.sin(k), 0, -2 - k * 3.2, t, { mode: "stroll", phase: ph, expr: (["neutral", "stern", "smile"] as const)[k % 3], res: 0.6, face: k % 2 ? flatCap : bowler }); }
    }
    applyCam(cam, c);
    return { target: new THREE.Vector3(...c.look), look, dof, shadowR: 14 };
  }
}
const make = () => new TestWorld();

export const KitTest: React.FC = () => {
  const f = useCurrentFrame(), t = f / 30, i = Math.min(1, Math.floor(t / 4));
  return <AbsoluteFill style={{ background: "#000" }}><StageView make={make} i={i} t={t} frame={f} /></AbsoluteFill>;
};
