// Characters for the v2 engine, in the channel's style (research/GUIA_NUMERICA_20.md section 6): white bean heads,
// pure-ink stick limbs, clothes in mid/dark colours with one detail, one silhouette feature each (hat, moustache,
// hair), half-lidded eyes by default. Cards cast real shadows and get a soft contact shadow.
import * as THREE from "three";
import type { Outfit, Pen } from "../bridge/toon";
import { INK } from "../bridge/toon";
import { Cast } from "../emden/chars";

export const WHITE = "#f7f4ee";
export const style = (o: Partial<Outfit> & { jacket: string; pants: string }): Outfit => ({ boots: INK, skin: WHITE, sticks: true, ...o });

const contact = (p: Pen) => { const g = p.g; const gr = g.createRadialGradient(150, 75, 5, 150, 75, 150); gr.addColorStop(0, "rgba(30,28,70,0.55)"); gr.addColorStop(1, "rgba(30,28,70,0)"); g.fillStyle = gr; g.fillRect(0, 0, 300, 150); };

export class Cast2 extends Cast {
  /** a character standing at (x, y, z): casts a shadow, sits on a soft contact shadow, breathes */
  stand(o: Outfit, key: string, x: number, y: number, z: number, t: number, opts: Parameters<Cast["person"]>[5] & { scale?: number } = {}) {
    const i = key.length * 7 + Math.round(x * 13);
    const s = opts.scale ?? 1;
    const m = this.person(o, key, x, y + 0.008 * Math.sin(t * 2.2 + i), z, { mode: "stand", res: 1.0, ...opts });
    m.scale.y *= 1 + 0.006 * Math.sin(t * 2.2 + i + 1);
    m.castShadow = true;
    const c = this.card("contact", 300, 150, contact, x, y + 0.012, z, 0.95 * s, 0.38 * s, { flat: true, soft: true });
    (c.material as THREE.MeshBasicMaterial).fog = true;
    return m;
  }
}

// ---------------- silhouette overlays (design space 600 x 1000, head centre ~ (300, 310), crown ~ y 198) ----------------
export const toque = (p: Pen) => { p.poly([[205, 214], [200, 112], [235, 62], [300, 46], [365, 62], [400, 112], [395, 214]], "#fbf9f4", 9); p.stroke([[208, 190], [392, 190]], 7, "#d8d2c4"); };
export const bun = (p: Pen) => { p.ell(300, 168, 52, 40, "#4a2a1e", 9); p.ell(300, 210, 120, 40, "#4a2a1e", 0); };
export const topHat = (p: Pen) => { p.poly([[222, 214], [228, 70], [372, 70], [378, 214]], "#1e1e26", 9); p.poly([[180, 214], [420, 214], [420, 236], [180, 236]], "#1e1e26", 9); p.poly([[226, 180], [374, 180], [375, 204], [225, 204]], "#8a2a2a", 0); };
export const bowler = (p: Pen) => { p.ell(300, 236, 118, 92, "#3a2e26", 9, 180, 360); p.poly([[158, 238], [442, 238], [432, 262], [168, 262]], "#3a2e26", 9); p.poly([[184, 222], [416, 222], [418, 236], [182, 236]], "#7a2a2a", 0); };
export const flatCap = (p: Pen) => { p.poly([[190, 222], [196, 170], [250, 140], [350, 140], [404, 170], [440, 214], [410, 230], [190, 230]], "#4a5262", 9); };
export const bigMoustache = (p: Pen) => { p.poly([[300, 350], [262, 344], [230, 356], [216, 372], [244, 366], [270, 372], [300, 362], [330, 372], [356, 366], [384, 372], [370, 356], [338, 344]], "#2a2020", 6); };
export const pencilMoustache = (p: Pen) => { p.stroke([[262, 352], [338, 352]], 9, "#2a2020"); };
export const bowtie = (dot = "#f4ead0", col = "#c8302c") => (p: Pen) => { p.poly([[300, 452], [256, 432], [256, 476]], col, 6); p.poly([[300, 452], [344, 432], [344, 476]], col, 6); p.ell(300, 452, 10, 10, col, 5); for (const [x, y] of [[272, 446], [270, 462], [328, 446], [330, 462]]) p.dot(x, y, 4, dot); };
export const glasses = (p: Pen) => { p.ell(266, 312, 26, 24, null, 6); p.ell(334, 312, 26, 24, null, 6); p.stroke([[292, 310], [308, 310]], 5); };
export const sweat = (p: Pen) => { for (const [x, y] of [[402, 250], [418, 298]] as [number, number][]) p.poly([[x, y - 26], [x + 12, y], [x, y + 10], [x - 12, y]], "#8fd0f4", 5); };
export const apron = (p: Pen) => { p.poly([[226, 470], [374, 470], [388, 740], [212, 740]], "#fbf9f4", 7); p.stroke([[226, 470], [250, 420]], 4); p.stroke([[374, 470], [350, 420]], 4); };
export const all = (...fs: ((p: Pen) => void)[]) => (p: Pen) => fs.forEach((f) => f(p));
