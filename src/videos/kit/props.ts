// Prop library for the v2 engine: the guide wants 8-15 props per shot, 5-10 props with readable text per video,
// practical lights with shafts, and a blurred foreground layer. Everything is built from primitives with the
// detailed textures in tex.ts and soft materials, and receives/casts shadows.
import * as THREE from "three";
import { soft, lit, shaft, noInk, shadows } from "./mat";
import { planks, tex, rnd, shadeHex } from "./tex";

export const box = (w: number, h: number, d: number, m: THREE.Material | string, x = 0, y = 0, z = 0) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === "string" ? soft(m) : m); b.position.set(x, y + h / 2, z); return b;
};
export const cyl = (r0: number, r1: number, h: number, m: THREE.Material | string, seg = 20) =>
  new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), typeof m === "string" ? soft(m) : m);
const at = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };

/** a canvas text label (signs, price tags, posters): flat plane, readable, never mirrored */
export const label = (text: string, w: number, h: number, o: { bg?: string; fg?: string; border?: string; font?: string; sub?: string } = {}) => {
  const W = 1024, H = Math.max(64, Math.round((1024 * h) / w));
  const t = tex(`label_${text}_${o.sub ?? ""}_${o.bg}_${o.fg}_${W}x${H}`, W, H, (g) => {
    g.fillStyle = o.bg ?? "#2a3a32"; g.fillRect(0, 0, W, H);
    if (o.border !== "none") { g.strokeStyle = o.border ?? "#d8b45a"; g.lineWidth = Math.max(6, H * 0.06); g.strokeRect(g.lineWidth, g.lineWidth, W - 2 * g.lineWidth, H - 2 * g.lineWidth); }
    g.fillStyle = o.fg ?? "#f4ead0"; g.textAlign = "center"; g.textBaseline = "middle";
    let fs = Math.round(H * (o.sub ? 0.46 : 0.62)); g.font = `900 ${fs}px ${o.font ?? "serif"}`;
    while (g.measureText(text).width > W * 0.88 && fs > 10) { fs -= 4; g.font = `900 ${fs}px ${o.font ?? "serif"}`; }
    g.fillText(text, W / 2, H * (o.sub ? 0.4 : 0.53));
    if (o.sub) { g.font = `700 ${Math.round(H * 0.2)}px ${o.font ?? "serif"}`; g.fillText(o.sub, W / 2, H * 0.78); }
  }, undefined, 0.03);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), soft("#ffffff", { map: t }));
  m.receiveShadow = true; return m;
};

// ---------------- furniture & clutter ----------------
export const crate = (s = 0.6, col = "#a8784a") => shadows(new THREE.Group().add(
  box(s, s, s, soft("#ffffff", { map: planks(col, [1, 1], 4) })), box(s * 1.02, s * 0.08, s * 1.02, shadeHex(col, 0.7), 0, s * 0.1, 0), box(s * 1.02, s * 0.08, s * 1.02, shadeHex(col, 0.7), 0, s * 0.82, 0)));
export const barrel = (h = 0.9, col = "#8a5a34") => {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.33, h * 0.33, h, 20, 6), soft("#ffffff", { map: planks(col, [3, 1], 10) }));
  const pos = b.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / h; const k = 1 + 0.14 * Math.cos(y * Math.PI); pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
  b.geometry.computeVertexNormals(); b.position.y = h / 2; g.add(b);
  for (const y of [0.15, 0.85]) { const r = new THREE.Mesh(new THREE.TorusGeometry(h * 0.35, 0.02, 6, 24), soft("#4a4a52", { rough: 0.5, metal: 0.4 })); r.rotation.x = Math.PI / 2; r.position.y = y * h; g.add(r); }
  return shadows(g);
};
export const sack = (s = 0.5, col = "#c8b088") => { const m = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 14, 10), soft(col)); m.scale.set(1, 1.25, 0.8); m.position.y = s * 0.55; const g = new THREE.Group(); g.add(m); const t = cyl(0.04, 0.08, s * 0.25, shadeHex(col, 0.8)); t.position.y = s * 1.2; g.add(t); return shadows(g); };
export const table = (w = 1.6, d = 0.9, h = 0.8, col = "#7a4a2a") => {
  const g = new THREE.Group(); g.add(box(w, 0.07, d, soft("#ffffff", { map: planks(col, [1, 1], 4) }), 0, h - 0.07, 0));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.07, h - 0.07, 0.07, shadeHex(col, 0.75), x * (w / 2 - 0.08), 0, z * (d / 2 - 0.08)));
  return shadows(g);
};
export const chair = (col = "#6a4024") => { const g = new THREE.Group(); g.add(box(0.45, 0.05, 0.45, col, 0, 0.45, 0)); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.04, 0.45, 0.04, shadeHex(col, 0.8), x * 0.19, 0, z * 0.19)); g.add(box(0.45, 0.5, 0.04, col, 0, 0.5, -0.21)); return shadows(g); };
const JAR_COLS = ["#c8a24a", "#7aa86a", "#c86a4a", "#6a8ac8", "#e8d8b0", "#a8506a", "#d8c070"];
/** shelf unit with jars, bottles, boxes and books: lots of small colourful detail */
export const shelf = (w = 2.4, h = 2.2, rows = 4, seed = 1, col = "#6a4024") => {
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(box(0.06, h, 0.4, col, s * w / 2, 0, 0));
  g.add(box(w, h, 0.03, shadeHex(col, 0.6), 0, 0, -0.19));
  for (let r = 0; r < rows; r++) {
    const y = 0.1 + r * (h - 0.1) / rows; g.add(box(w, 0.04, 0.4, col, 0, y, 0));
    let x = -w / 2 + 0.1;
    while (x < w / 2 - 0.15) {
      const k = rnd(seed * 97 + r * 13 + Math.round(x * 10), 1), c = JAR_COLS[Math.floor(rnd(seed + x * 7, r) * JAR_COLS.length)];
      if (k < 0.35) { const j = cyl(0.07, 0.07, 0.2, soft(c, { rough: 0.35 })); j.position.set(x + 0.07, y + 0.14, 0.02); g.add(j); const lid = cyl(0.075, 0.075, 0.03, "#8a6a3a"); lid.position.set(x + 0.07, y + 0.26, 0.02); g.add(lid); x += 0.17; }
      else if (k < 0.6) { const b = cyl(0.045, 0.05, 0.28, soft(c, { rough: 0.25 })); b.position.set(x + 0.05, y + 0.18, 0.03); g.add(b); const n = cyl(0.018, 0.02, 0.09, soft(c, { rough: 0.25 })); n.position.set(x + 0.05, y + 0.36, 0.03); g.add(n); x += 0.12; }
      else if (k < 0.82) { for (let q = 0; q < 4; q++) g.add(box(0.05, 0.22 + 0.06 * rnd(q, k), 0.26, JAR_COLS[(q + Math.floor(k * 9)) % JAR_COLS.length], x + 0.03 + q * 0.055, y + 0.02, 0)); x += 0.25; }
      else { g.add(box(0.22, 0.14, 0.22, soft(c), x + 0.11, y + 0.02, 0)); x += 0.26; }
    }
  }
  return shadows(g);
};
export const clock = (r = 0.3) => { const g = new THREE.Group(); const f = cyl(r, r, 0.05, "#f2ead6", 32); f.rotation.x = Math.PI / 2; g.add(f); const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 32), soft("#4a3a2a")); g.add(rim); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.add(box(0.015, 0.05, 0.01, "#2a2a2a", Math.sin(a) * r * 0.8, Math.cos(a) * r * 0.8 - 0.025, 0.03)); } const hh = box(0.02, r * 0.5, 0.01, "#1a1a1a", 0, 0, 0.04); const mh = box(0.015, r * 0.8, 0.01, "#1a1a1a", 0, 0, 0.045); g.add(hh, mh); (g as any).hands = [hh, mh]; return g; };
export const setClock = (c: THREE.Group, hours: number) => { const [hh, mh] = (c as any).hands as THREE.Mesh[]; hh.rotation.z = -(hours / 12) * Math.PI * 2; mh.rotation.z = -(hours % 1) * Math.PI * 2; };
export const plant = (h = 0.9) => { const g = new THREE.Group(); const p = cyl(0.16, 0.12, 0.3, "#b8643a"); p.position.y = 0.15; g.add(p); for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), soft(i % 2 ? "#4f8a45" : "#3f7a3a")); const a = i * 2.4; l.scale.set(0.6, 1.4, 0.35); l.position.set(Math.cos(a) * 0.12, 0.35 + (h - 0.3) * (i / 9), Math.sin(a) * 0.12); l.rotation.set(Math.cos(a) * 0.5, a, Math.sin(a) * 0.5); g.add(l); } return shadows(g); };

// ---------------- light sources (with real light + glow + shaft) ----------------
/** hanging lamp: shade, glowing bulb, point light, optional downward shaft */
export const hangingLamp = (col = "#ffd890", o: { shade?: string; drop?: number; intensity?: number; shaft?: boolean; reach?: number } = {}) => {
  const g = new THREE.Group(), drop = o.drop ?? 0.8;
  const cord = cyl(0.008, 0.008, drop, "#1a1a1a", 4); cord.position.y = -drop / 2; g.add(cord);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.26, 0.2, 20, 1, true), soft(o.shade ?? "#2a6a4a", { side: THREE.DoubleSide, rough: 0.5 })); sh.position.y = -drop - 0.1; g.add(sh);
  const b = noInk(new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), lit(col, 3))); b.position.y = -drop - 0.16; g.add(b);
  const L = new THREE.PointLight(col, o.intensity ?? 6, o.reach ?? 7, 1.6); L.position.y = -drop - 0.25; L.castShadow = false; g.add(L);
  if (o.shaft !== false) { const s = shaft(col, 0.22, 1.1, 2.6, 0.16); s.position.y = -drop - 0.15; g.add(s); }
  return g;
};
export const streetLamp = (h = 4.2, col = "#ffe2a8", on = 1) => {
  const g = new THREE.Group();
  const p = cyl(0.06, 0.09, h, soft("#2a2a30", { rough: 0.5, metal: 0.5 }), 10); p.position.y = h / 2; g.add(p);
  g.add(box(0.36, 0.06, 0.36, "#2a2a30", 0, h, 0));
  const glass = noInk(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.42, 8), on > 0 ? lit(col, 1 + 2 * on) : soft("#cfd6dc", { rough: 0.2 }))); glass.position.y = h + 0.27; g.add(glass);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.2, 8), soft("#2a2a30")); cap.position.y = h + 0.58; g.add(cap);
  if (on > 0) { const L = new THREE.PointLight(col, 5 * on, 9, 1.6); L.position.y = h + 0.2; g.add(L); }
  return shadows(g);
};
/** a window: frame, mullions, glowing (or sky) glass, sill, optional curtains */
export const windowFrame = (w = 1.2, h = 1.6, glow = "#fff0cc", k = 1.4, o: { curtains?: string; frame?: string } = {}) => {
  const g = new THREE.Group(), fr = o.frame ?? "#f2ead6";
  g.add(noInk(new THREE.Mesh(new THREE.PlaneGeometry(w, h), lit(glow, k))));
  for (const [x, y, ww, hh] of [[0, h / 2, w + 0.12, 0.08], [0, -h / 2, w + 0.12, 0.08], [-w / 2, 0, 0.08, h], [w / 2, 0, 0.08, h], [0, 0, 0.05, h], [0, h * 0.1, w, 0.05]] as number[][]) { const b = box(ww, hh, 0.08, fr, x, y - hh / 2, 0.03); g.add(b); }
  g.add(box(w + 0.3, 0.06, 0.22, fr, 0, -h / 2 - 0.09, 0.1));
  if (o.curtains) for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(w * 0.32, h * 1.1, 0.04), soft(o.curtains)); c.position.set(s * (w / 2 - w * 0.08), 0, 0.12); g.add(c); }
  return shadows(g, false, true);
};
/** bunting / pennant string between two points */
export const bunting = (a: THREE.Vector3, b: THREE.Vector3, n = 12, cols = ["#c8402c", "#e8c45a", "#3a6ac8", "#f2ead6"]) => {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, p = a.clone().lerp(b, k); p.y -= 0.35 * Math.sin(k * Math.PI); const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 3), soft(cols[i % cols.length], { side: THREE.DoubleSide })); f.rotation.z = Math.PI; f.position.copy(p); f.position.y -= 0.14; g.add(f); }
  return g;
};
/** a building facade block with textured walls, framed windows (some lit), cornice, roof and a door */
export const facadeBlock = (w: number, h: number, d: number, wallTex: THREE.Texture, o: { roof?: string; lit?: number; seed?: number; trim?: string; shopSign?: string } = {}) => {
  const g = new THREE.Group(), seed = o.seed ?? 1, trim = o.trim ?? "#efe6d2";
  g.add(box(w, h, d, soft("#ffffff", { map: wallTex })));
  const floors = Math.max(1, Math.floor(h / 3.2)), cols = Math.max(1, Math.floor(w / 2.1));
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    if (f === 0 && o.shopSign) continue;
    const x = -w / 2 + (c + 0.5) * (w / cols), y = 1.7 + f * 3.2, on = rnd(seed * 31 + f * 7 + c, 2) < (o.lit ?? 0.25);
    const win = windowFrame(0.95, 1.5, on ? "#ffd890" : "#36466a", on ? 1.6 : 1.0, { frame: trim, curtains: rnd(seed + f + c, 5) > 0.5 ? "#a8505a" : undefined });
    win.position.set(x, y, d / 2 + 0.02); g.add(win);
  }
  g.add(box(w + 0.3, 0.3, d + 0.3, trim, 0, h - 0.3, 0));
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.62, 2.4, 4, 1), soft(o.roof ?? "#8a4a3a")); roof.rotation.y = Math.PI / 4; roof.scale.z = d / w; roof.position.y = h + 1.2; g.add(roof);
  return shadows(g);
};

// ---------------- foreground layer ----------------
/** a dark blurred foreground element (post, railing, plant, crate) to give the 3-layer depth the channel uses */
export const foreground = (kind: "post" | "crates" | "plant" | "rail", seed = 1) => {
  if (kind === "post") return shadows(box(0.25, 3.5, 0.25, soft("#ffffff", { map: planks("#6a4a32", [1, 4], 3) })));
  if (kind === "crates") { const g = new THREE.Group(); g.add(crate(0.6)); const c2 = crate(0.5, "#946a40"); c2.position.set(0.15, 0.6, 0.05); c2.rotation.y = 0.4; g.add(c2); return g; }
  if (kind === "plant") return plant(1.2);
  const g = new THREE.Group(); for (let i = 0; i < 6; i++) g.add(box(0.06, 1.0, 0.06, "#3a2a20", i * 0.35, 0, 0)); g.add(box(2.0, 0.08, 0.1, "#3a2a20", 0.875, 0.95, 0)); return shadows(g);
};
void at; void lit;
