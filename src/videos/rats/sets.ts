// Sets for "The Rat Tail Bounty" (Hanoi 1902): colonial street, sewer pipe, bathroom, bounty office, rat farms, classroom.
import * as THREE from "three";
import { toon, glow, ctex, hh, noInk } from "../emden/lib";
import { house, palm } from "../emden/props";
import { box, cyl, toilet } from "../sewers/sets";

const STONE = ["#a8a196", "#b3ac9f", "#9d968b", "#b8b1a4"];
const stoneTex = (key: string, rep: [number, number]) => ctex(`stone_${key}`, 512, 512, (g) => {
  g.fillStyle = "#5a5650"; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) {
    const x = c * 128 + (r % 2 ? 64 : 0), i = r * 9 + c; g.fillStyle = STONE[Math.floor(hh(i, 2) * 4)]; g.fillRect(x + 4, r * 64 + 4, 120, 56);
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(x + 4, r * 64 + 48, 120, 12);
  }
}, rep);
const tileTex = () => ctex("checker", 256, 256, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#2f3a4a" : "#efe8d8"; g.fillRect(i * 32, j * 32, 32, 32); } }, [6, 6]);
const flowTex = () => ctex("ratflow", 256, 256, (g) => {
  g.fillStyle = "#4a5a4a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.strokeStyle = i % 3 ? "rgba(120,140,110,0.6)" : "rgba(40,50,40,0.6)"; g.lineWidth = 3 + 3 * hh(i); const y = 256 * hh(i, 1); g.beginPath(); g.moveTo(256 * hh(i, 2), y); g.lineTo(256 * hh(i, 2) + 40 + 60 * hh(i, 4), y + 4); g.stroke(); }
}, [1, 8]);
const shutterWall = (col: string) => ctex(`villa_${col}`, 256, 256, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const x = 26 + c * 78, y = 40 + r * 110;
    g.fillStyle = "#2e6a4a"; g.fillRect(x, y, 22, 66); g.fillRect(x + 26, y, 22, 66);
    g.strokeStyle = "#1e4a32"; g.lineWidth = 2; for (let k = 6; k < 66; k += 8) { g.beginPath(); g.moveTo(x, y + k); g.lineTo(x + 48, y + k); g.stroke(); }
    g.strokeStyle = "#1a1a1a"; g.lineWidth = 5; g.strokeRect(x, y, 48, 66);
    g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(x - 6, y + 66, 60, 7);
  }
});
/** a two-storey colonial villa: ochre walls, green louvred shutters, terracotta roof, a balcony */
export const villa = (w: number, h: number, col: string) => {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 8), toon("#ffffff", { map: shutterWall(col) })); b.position.y = h / 2; g.add(b);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, h * 0.32, 4), toon("#b8573a")); roof.rotation.y = Math.PI / 4; roof.scale.z = 8 / w; roof.position.y = h + h * 0.16; g.add(roof);
  g.add(box(w * 0.7, 0.25, 1.4, "#e9e2d0", 0, h * 0.5, 4.6));
  for (let i = 0; i < 7; i++) g.add(box(0.08, 0.9, 0.08, "#e9e2d0", -w * 0.33 + i * w * 0.11, h * 0.5 + 0.25, 5.25));
  return g;
};
export const tamarind = (s = 1) => {
  const g = new THREE.Group();
  const t = cyl(0.25 * s, 0.35 * s, 4 * s, "#6a4a32", 8); t.position.y = 2 * s; g.add(t);
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1.8 * s, 12, 8), toon(i % 2 ? "#4f8c45" : "#3f7a3a")); c.position.set(Math.cos(i * 1.3) * 1.4 * s, 4.6 * s + 0.6 * hh(i) * s, Math.sin(i * 1.3) * 1.2 * s); g.add(c); }
  return g;
};

// ---------------- the French quarter street (with a trench for the new sewer) ----------------
export class Street {
  g = new THREE.Group(); trench: THREE.Group; manhole: THREE.Group; poster: THREE.Mesh; posterX: THREE.Mesh;
  constructor(posterTex: Record<"en" | "es", THREE.Texture>, posterOff: THREE.Texture) {
    const g = this.g;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 220), toon("#c9b48a")); road.rotation.x = -Math.PI / 2; g.add(road);
    for (const s of [-1, 1]) g.add(box(3.4, 0.22, 220, "#d8cdb6", s * 7.2, 0, -60));
    const cols = ["#f0c96a", "#efd9a6", "#e8b866", "#f2e2b8"];
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
      const v = villa(10, 8 + 2 * hh(i, s + 3), cols[(i + (s > 0 ? 1 : 0)) % 4]); v.position.set(s * 15, 0, 14 - i * 14); v.rotation.y = -s * Math.PI / 2; g.add(v);
      const t = tamarind(1 + 0.2 * hh(i, s)); t.position.set(s * 8.4, 0, 8 - i * 14); g.add(t);
    }
    // trench with pipe sections (shot: building the sewers)
    this.trench = new THREE.Group();
    this.trench.add(box(3, 0.6, 30, "#6a5038", 0, -0.55, -10));
    for (let i = 0; i < 5; i++) { const p = cyl(0.9, 0.9, 2.6, "#9a958c", 18); p.rotation.x = Math.PI / 2; p.position.set(0, 0.4, -2 - i * 3); this.trench.add(p); }
    for (let i = 0; i < 6; i++) { const d = box(1.0, 0.6, 1.2, "#8a6a48", -2.4 + (i % 2) * 4.8, 0, -1 - i * 4); this.trench.add(d); }
    g.add(this.trench);
    // manhole
    this.manhole = new THREE.Group();
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.75, 24), new THREE.MeshBasicMaterial({ color: "#0a0a0c" })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.03; this.manhole.add(noInk(hole));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.07, 6, 24), toon("#3a3a40")); rim.rotation.x = Math.PI / 2; rim.position.y = 0.04; this.manhole.add(rim);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 24), toon("#4a4a52")); lid.position.set(1.0, 0.05, 0.4); this.manhole.add(lid);
    this.manhole.position.set(0, 0, 2); g.add(this.manhole);
    // bounty poster on a villa wall
    this.poster = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshBasicMaterial({ map: posterTex.en })); this.poster.position.set(-10.9, 2.6, 0); this.poster.rotation.y = Math.PI / 2; g.add(noInk(this.poster));
    (this.poster as any).tex = posterTex;
    this.posterX = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshBasicMaterial({ map: posterOff, transparent: true })); this.posterX.position.set(-10.88, 2.6, 0); this.posterX.rotation.y = Math.PI / 2; g.add(noInk(this.posterX));
  }
  setLang(L: "en" | "es") { (this.poster.material as THREE.MeshBasicMaterial).map = (this.poster as any).tex[L]; }
}

// ---------------- the sewer pipe (stone, narrow) ----------------
export class Pipe {
  g = new THREE.Group(); water: THREE.Mesh; R = 1.6;
  constructor() {
    const L = 120, R = this.R;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 40, 1, true), toon("#ffffff", { map: stoneTex("pipe", [6, 30]), side: THREE.BackSide }));
    wall.rotation.x = Math.PI / 2; wall.position.set(0, R, -L / 2 + 10); this.g.add(wall);
    for (let z = 8; z > -L + 10; z -= 5) { const r = new THREE.Mesh(new THREE.TorusGeometry(R - 0.03, 0.06, 6, 40), toon("#7a756c")); r.position.set(0, R, z); this.g.add(r); }
    this.g.add(box(2.2, 0.3, L, "#6a665e", 0, 0, -L / 2 + 10));
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(1.4, L), toon("#ffffff", { map: flowTex() })); this.water.rotation.x = -Math.PI / 2; this.water.position.set(0, 0.32, -L / 2 + 10); this.g.add(this.water);
    // scraps of food along the ledges
    for (let i = 0; i < 30; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08 + 0.06 * hh(i), 8, 6), toon(["#c9a24a", "#e0a35a", "#8a6a3a", "#d8d0b0"][i % 4])); b.position.set((hh(i, 2) > 0.5 ? 1 : -1) * (0.75 + 0.1 * hh(i, 3)), 0.36, 6 - i * 1.6); this.g.add(b); }
  }
  flow(t: number) { (this.water.material as THREE.MeshToonMaterial).map!.offset.y = -t * 0.3; }
}

// ---------------- a French bathroom with a brand-new cistern toilet ----------------
export const bathroom = () => {
  const g = new THREE.Group();
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), toon("#ffffff", { map: tileTex() })); fl.rotation.x = -Math.PI / 2; g.add(fl);
  for (const [x, z, ry] of [[0, -3, 0], [-3.5, 0, Math.PI / 2], [3.5, 0, -Math.PI / 2]] as [number, number, number][]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), toon("#bfd8d0", { side: THREE.DoubleSide })); w.position.set(x, 2, z); w.rotation.y = ry; g.add(w); }
  g.add(box(8, 1.2, 0.05, "#efe8d8", 0, 0, -2.97));
  const t = toilet(); t.scale.setScalar(1.6); t.position.set(-0.6, 0, -2.4); g.add(t);
  const tank = box(0.9, 0.5, 0.35, "#efe8d8", -0.6, 2.6, -2.8); g.add(tank);
  const pipe = cyl(0.05, 0.05, 1.4, "#c9a24a", 6); pipe.position.set(-0.9, 1.9, -2.75); g.add(pipe);
  const basin = cyl(0.45, 0.3, 0.3, "#efe8d8", 18); basin.position.set(1.6, 1.0, -2.6); g.add(basin); g.add(box(0.2, 0.9, 0.2, "#efe8d8", 1.6, 0, -2.6));
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), glow("#dff0f4", 1.1)); mirror.position.set(1.6, 2.2, -2.95); g.add(noInk(mirror));
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), glow("#fff2c8", 1.4)); win.position.set(-3.45, 2.3, -0.8); win.rotation.y = Math.PI / 2; g.add(noInk(win));
  return g;
};

// ---------------- the bounty office ----------------
export class Office {
  g = new THREE.Group(); fan = new THREE.Group();
  constructor() {
    const g = this.g;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), toon("#9a6a42")); fl.rotation.x = -Math.PI / 2; g.add(fl);
    for (const [x, z, ry] of [[0, -4, 0], [-5, 0, Math.PI / 2], [5, 0, -Math.PI / 2]] as [number, number, number][]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), toon("#efe2c0", { side: THREE.DoubleSide })); w.position.set(x, 2.5, z); w.rotation.y = ry; g.add(w); }
    g.add(box(12, 1.0, 0.06, "#8a5a32", 0, 0, -3.96));
    // tall window with shutters behind the desk, a map of Indochina-ish blob, the desk
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), glow("#fff2c8", 1.5)); win.position.set(-1.8, 2.4, -3.95); g.add(noInk(win));
    for (const s of [-1, 1]) g.add(box(0.8, 2.6, 0.05, "#2e6a4a", -1.8 + s * 1.25, 1.1, -3.92));
    const map = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshBasicMaterial({ map: ctex("map", 256, 200, (c) => { c.fillStyle = "#e8d8a8"; c.fillRect(0, 0, 256, 200); c.fillStyle = "#c9b27a"; c.beginPath(); c.moveTo(120, 20); c.bezierCurveTo(170, 60, 110, 100, 150, 140); c.bezierCurveTo(180, 170, 130, 190, 110, 180); c.bezierCurveTo(90, 140, 100, 90, 80, 60); c.closePath(); c.fill(); c.strokeStyle = "#3a2a1a"; c.lineWidth = 4; c.stroke(); c.strokeRect(2, 2, 252, 196); }) }));
    map.position.set(1.8, 2.6, -3.95); g.add(noInk(map));
    g.add(box(3.2, 0.12, 1.4, "#6a3e22", 0, 0.9, -1.2));
    for (const [x, z] of [[-1.5, -0.6], [1.5, -0.6], [-1.5, -1.8], [1.5, -1.8]]) g.add(box(0.12, 0.9, 0.12, "#5a3420", x, 0, z));
    g.add(box(1.0, 0.04, 0.7, "#f4ecd2", 0.3, 1.02, -1.0)); // ledger
    for (let i = 0; i < 4; i++) { const c = cyl(0.12, 0.12, 0.05 + 0.04 * i, "#e8c45a", 16); c.position.set(-0.9 + 0.22 * (i % 2), 1.05 + 0.02 * i, -0.9 - 0.15 * Math.floor(i / 2)); g.add(c); }
    // ceiling fan
    const rod = cyl(0.03, 0.03, 0.6, "#3a3a40", 6); rod.position.y = 4.7; this.fan.add(rod);
    for (let i = 0; i < 4; i++) { const b = box(1.4, 0.03, 0.2, "#6a3e22", 0, 0, 0); b.geometry.translate(0.7, 0, 0); b.rotation.y = (i * Math.PI) / 2; b.position.y = 4.4; this.fan.add(b); }
    this.fan.position.set(0, 0, -1); g.add(this.fan);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), toon("#efe2c0", { side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 5; g.add(ceil);
  }
  spin(t: number) { this.fan.rotation.y = t * 3; }
}

// ---------------- rat farms outside the city ----------------
export const village = () => {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), toon("#9a8a5a")); ground.rotation.x = -Math.PI / 2; g.add(ground);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), toon(i % 2 ? "#6fae5a" : "#7fbe62")); p.rotation.x = -Math.PI / 2; p.position.set(-60 + (i % 3) * 30, 0.02, -40 - Math.floor(i / 3) * 22); g.add(p); }
  const pens: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const x = -14 + (i % 4) * 9, z = -4 - Math.floor(i / 4) * 9; pens.push(new THREE.Vector3(x, 0, z));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; const post = cyl(0.06, 0.06, 1.0, "#c9b06a", 5); post.position.set(x + Math.cos(a) * 2.6, 0.5, z + Math.sin(a) * 2.6); g.add(post); }
    const rail = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.05, 4, 32), toon("#b89a52")); rail.rotation.x = Math.PI / 2; rail.position.set(x, 0.85, z); g.add(rail);
    const straw = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), toon("#d8c27a")); straw.rotation.x = -Math.PI / 2; straw.position.set(x, 0.03, z); g.add(straw);
  }
  for (let i = 0; i < 5; i++) {
    const hut = new THREE.Group(); hut.add(box(4, 2.6, 4, "#c9a878", 0, 0, 0)); const r = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 4), toon("#b8a05a")); r.rotation.y = Math.PI / 4; r.position.y = 3.8; hut.add(r);
    hut.position.set(-26 + i * 13, 0, -22 - 4 * hh(i)); g.add(hut);
  }
  for (let i = 0; i < 8; i++) { const p = palm(7 + 3 * hh(i, 4), i); p.position.set(-40 + i * 11, 0, -30 - 6 * hh(i, 2)); g.add(p); }
  (g as any).pens = pens;
  return g;
};

// ---------------- the economist's classroom ----------------
export const classroom = () => {
  const g = new THREE.Group();
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), toon("#b88a5a")); fl.rotation.x = -Math.PI / 2; g.add(fl);
  const w = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), toon("#d9e2d0")); w.position.set(0, 2.5, -3); g.add(w);
  g.add(box(6.4, 3.0, 0.12, "#6a4a2a", 0, 1.0, -2.95));
  for (let i = 0; i < 4; i++) { const d = box(1.4, 0.75, 0.8, "#8a6a4a", -3 + i * 2, 0, 3); g.add(d); }
  return g;
};
