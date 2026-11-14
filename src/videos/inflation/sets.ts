// Sets for "The Money Stove" (Germany 1923): kitchen with an iron stove, Berlin street, bakery, government office, print hall.
import * as THREE from "three";
import { toon, glow, ctex, hh, noInk } from "../emden/lib";
import { box, cyl } from "../sewers/sets";

// ---------------- painted textures (flat with dark seams) ----------------
const planks = (key: string, base: string[], rep: [number, number]) => ctex(`ipl_${key}`, 512, 512, (g) => {
  g.fillStyle = "#2a1a12"; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) {
    const off = (r % 2) * 90 + c * 200 - 40; g.fillStyle = base[Math.floor(hh(r * 5 + c, 3) * base.length)]; g.fillRect(off + 3, r * 64 + 3, 194, 58);
    g.fillStyle = "rgba(0,0,0,0.1)"; g.fillRect(off + 3, r * 64 + 46, 194, 15);
  }
}, rep);
const wallpaper = (key: string, bg: string, fg: string) => ctex(`iwp_${key}`, 256, 256, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) { g.fillStyle = fg; g.fillRect(i * 64 + 28, 0, 8, 256); }
  for (let i = 0; i < 8; i++) { const x = (i % 4) * 64 + 32, y = Math.floor(i / 4) * 128 + 64 + (i % 2) * 64; g.beginPath(); g.arc(x, y % 256, 12, 0, 7); g.fillStyle = fg; g.fill(); }
}, [6, 2]);
/** a sheet of banknotes, used as wallpaper and for heaps */
export const notesTex = (rep: [number, number]) => ctex(`inotes_${rep}`, 512, 256, (g) => {
  g.fillStyle = "#3a3a2a"; g.fillRect(0, 0, 512, 256);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const x = c * 256 + 6, y = r * 128 + 6; g.fillStyle = (r + c) % 2 ? "#cfd8b0" : "#e2d2a8"; g.fillRect(x, y, 244, 116);
    g.strokeStyle = "#5a6a4a"; g.lineWidth = 6; g.strokeRect(x + 10, y + 10, 224, 96);
    g.fillStyle = "#4a5a3a"; g.font = "900 34px serif"; g.textAlign = "center"; g.fillText("1000", x + 122, y + 52); g.font = "700 22px serif"; g.fillText("MARK", x + 122, y + 84);
  }
}, rep);
const cobble = () => ctex("icobble", 512, 512, (g) => {
  g.fillStyle = "#4a443e"; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 16; r++) for (let c = -1; c < 17; c++) { const x = c * 32 + (r % 2) * 16, i = r * 17 + c; g.fillStyle = ["#8f8679", "#9c9384", "#857c70", "#a39a8a"][Math.floor(hh(i, 5) * 4)]; g.beginPath(); g.ellipse(x + 16, r * 32 + 16, 14, 13, 0, 0, 7); g.fill(); }
}, [4, 30]);
const facade = (key: string, col: string, lit: boolean) => ctex(`ifac_${key}`, 256, 512, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "rgba(0,0,0,0.12)"; for (let y = 120; y < 512; y += 128) g.fillRect(0, y, 256, 8);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const x = 26 + c * 76, y = 24 + r * 128; g.fillStyle = "#f2ead6"; g.fillRect(x - 6, y - 6, 60, 92);
    g.fillStyle = lit && hh(r * 3 + c, 7) > 0.5 ? "#ffd27a" : "#3a4a66"; g.fillRect(x, y, 48, 80);
    g.strokeStyle = "#f2ead6"; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 24, y); g.lineTo(x + 24, y + 80); g.moveTo(x, y + 34); g.lineTo(x + 48, y + 34); g.stroke();
  }
});
const sign = (text: string, bg: string, fg: string, w = 1024) => ctex(`isign_${text}`, w, 200, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, 200); g.strokeStyle = "#e8c45a"; g.lineWidth = 14; g.strokeRect(8, 8, w - 16, 184);
  g.font = "900 120px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = fg; g.fillText(text, w / 2, 106);
});
const plane = (w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; return m; };
const floor = (w: number, d: number, mat: THREE.Material) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; return m; };
const loaf = (x: number, y: number, z: number, s = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 14, 10), toon("#c98a42")); m.scale.set(1.6, 0.8, 1); m.position.set(x, y + 0.16 * s, z); return m; };

// ---------------- the kitchen (also the papered living room on its right wall, and the pizza table) ----------------
export class Kitchen {
  g = new THREE.Group(); door = new THREE.Group(); fire: THREE.Mesh; fireLight = new THREE.PointLight("#ff9a3a", 0, 5, 1.5); paper: THREE.Mesh; lamp: THREE.Mesh;
  log: THREE.Mesh;
  constructor() {
    const g = this.g;
    g.add(floor(10, 10, toon("#ffffff", { map: planks("kfl", ["#8a5a36", "#946240", "#7e5232"], [3, 3]) })));
    g.add(plane(10, 4, toon("#ffffff", { map: wallpaper("k", "#d8c9a0", "#c2ad7a") }), 0, 2, -3));
    g.add(plane(10, 4, toon("#ffffff", { map: wallpaper("k2", "#d8c9a0", "#c2ad7a"), side: THREE.DoubleSide }), -3.5, 2, 0, Math.PI / 2));
    g.add(plane(10, 4, toon("#ffffff", { map: wallpaper("k3", "#c9b8d8", "#a894c2"), side: THREE.DoubleSide }), 3.5, 2, 0, -Math.PI / 2));
    g.add(box(10, 0.9, 0.04, "#6a4a32", 0, 0, -2.97));
    // banknote wallpaper on the right wall, revealed left to right by scale.x
    this.paper = plane(1, 2.6, toon("#ffffff", { map: notesTex([4, 3]), side: THREE.DoubleSide }), 3.46, 1.6, 0, -Math.PI / 2);
    this.paper.geometry.translate(0.5, 0, 0); g.add(this.paper);
    // window on the left wall
    g.add(noInk(plane(1.3, 1.6, glow("#fff0c8", 1.4), -3.45, 1.9, -1.0, Math.PI / 2)));
    g.add(box(0.12, 0.08, 1.5, "#f2ead6", -3.42, 1.06, -1.0));
    // iron stove
    const st = new THREE.Group(); st.position.set(0.9, 0, -2.3); g.add(st);
    st.add(box(1.1, 0.95, 0.75, "#34343c", 0, 0, 0)); st.add(box(1.2, 0.06, 0.82, "#24242a", 0, 0.95, 0));
    for (const x of [-0.45, 0.45]) st.add(box(0.1, 0.18, 0.1, "#24242a", x, -0.0, 0.3));
    const pipe = cyl(0.11, 0.11, 2.6, "#2a2a30", 12); pipe.position.set(0.3, 2.3, -0.2); st.add(pipe);
    this.fire = noInk(plane(0.42, 0.3, glow("#ff9a3a", 2.4), 0, 0.42, 0.376)); st.add(this.fire);
    this.door.position.set(-0.22, 0.42, 0.39); st.add(this.door);
    const d = box(0.44, 0.32, 0.03, "#4a4a54", 0.22, -0.16, 0); this.door.add(d);
    const knob = cyl(0.03, 0.03, 0.06, "#c9a24a", 8); knob.rotation.x = Math.PI / 2; knob.position.set(0.4, 0, 0.04); this.door.add(knob);
    this.fireLight.position.set(0, 0.6, 0.9); st.add(this.fireLight);
    // wood box with logs
    g.add(box(0.8, 0.45, 0.5, "#7a5232", -0.5, 0, -2.5));
    for (let i = 0; i < 4; i++) { const l = cyl(0.08, 0.08, 0.7, "#8a6a42", 8); l.rotation.z = Math.PI / 2; l.position.set(-0.5, 0.5 + 0.06 * (i % 2), -2.62 + 0.13 * i); g.add(l); }
    this.log = cyl(0.09, 0.09, 0.55, "#8a6a42", 8); this.log.rotation.z = Math.PI / 2; g.add(this.log); this.log.visible = false;
    // table with a hanging lamp (the pizza shot)
    g.add(box(1.8, 0.06, 1.2, "#7a4a2a", -0.6, 0.84, 1.0));
    for (const [x, z] of [[-1.4, 0.5], [0.2, 0.5], [-1.4, 1.5], [0.2, 1.5]]) g.add(box(0.08, 0.84, 0.08, "#5a3420", x, 0, z));
    this.lamp = noInk(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10), glow("#ffe2a0", 2.2))); this.lamp.position.set(-0.6, 2.6, 1.0); g.add(this.lamp);
    const cord = cyl(0.01, 0.01, 1.4, "#1a1a1a", 4); cord.position.set(-0.6, 3.35, 1.0); g.add(cord);
    const ceil = floor(10, 10, toon("#efe2c0", { side: THREE.DoubleSide })); ceil.position.y = 4; g.add(ceil);
  }
  /** door 0..1 open, fire 0..1 bright, paper 0..1 of the right wall covered */
  set(t: number, door: number, fire: number, paper = 0) {
    this.door.rotation.y = -1.9 * door;
    const fl = fire * (0.8 + 0.2 * Math.sin(t * 23) * Math.sin(t * 7.1));
    (this.fire.material as THREE.MeshBasicMaterial).color.setRGB(0.15 + 1.6 * fl, 0.08 + 0.75 * fl, 0.02 + 0.2 * fl);
    this.fireLight.intensity = 6 * fl * door;
    this.paper.visible = paper > 0.001; this.paper.position.z = -2.9; this.paper.scale.x = 6 * paper;
  }
}

// ---------------- a Berlin street with the bakery ----------------
export class BerlinStreet {
  g = new THREE.Group();
  constructor() {
    const g = this.g;
    g.add(floor(14, 240, toon("#ffffff", { map: cobble() })));
    for (const s of [-1, 1]) g.add(box(3, 0.2, 240, "#b8b0a0", s * 7.5, 0, 0));
    const cols = ["#e8d2a8", "#d9b88a", "#c9d0b8", "#e2c0a8", "#d0c4b0"];
    for (const s of [-1, 1]) for (let i = 0; i < 12; i++) {
      const h = 11 + 3 * hh(i, s + 9), w = 9.5;
      const b = new THREE.Mesh(new THREE.BoxGeometry(8, h, w), [toon("#ffffff", { map: facade(`${s}${i}`, cols[(i + (s > 0 ? 2 : 0)) % 5], false) }), toon("#ffffff", { map: facade(`${s}${i}b`, cols[(i + (s > 0 ? 2 : 0)) % 5], false) }), toon("#8a5a4a"), toon("#8a5a4a"), toon("#ffffff", { map: facade(`${s}${i}c`, cols[(i + 1) % 5], false) }), toon("#ffffff", { map: facade(`${s}${i}d`, cols[(i + 1) % 5], false) })]);
      b.position.set(s * 13, h / 2, 30 - i * 10); g.add(b);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 4.6, 2.8, 4, 1), toon("#7a4a3a")); roof.rotation.y = Math.PI / 4; roof.scale.z = 1.4; roof.position.set(s * 13, h + 1.4, 30 - i * 10); g.add(roof);
    }
    // bakery storefront on the left house at z = 0: window, door, sign
    g.add(noInk(plane(4.2, 2.4, glow("#ffe2b0", 1.25), -8.98, 1.6, 0.6, Math.PI / 2)));
    for (let i = 0; i < 5; i++) g.add(loaf(-8.7, 0.95, -0.8 + 0.7 * i, 1));
    g.add(box(0.3, 0.12, 4.4, "#5a3420", -8.85, 0.82, 0.6));
    g.add(noInk(plane(4.6, 0.9, new THREE.MeshBasicMaterial({ map: sign("BÄCKEREI", "#2a4a3a", "#f2e2b0") }), -8.96, 3.4, 0.6, Math.PI / 2)));
    // lamp posts
    for (let i = 0; i < 8; i++) for (const s of [-1, 1]) {
      const p = cyl(0.07, 0.09, 4.2, "#2a2a30", 6); p.position.set(s * 6.4, 2.1, 25 - i * 14); g.add(p);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), glow("#fff2c8", 1.2)); l.position.set(s * 6.4, 4.3, 25 - i * 14); g.add(noInk(l));
    }
  }
}

// ---------------- the bakery inside ----------------
export class Bakery {
  g = new THREE.Group();
  constructor() {
    const g = this.g;
    const tiles = ctex("ibtile", 256, 256, (c) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? "#3a4a5a" : "#efe8d8"; c.fillRect(i * 32, j * 32, 32, 32); } }, [5, 5]);
    g.add(floor(10, 10, toon("#ffffff", { map: tiles })));
    g.add(plane(10, 4.5, toon("#ffffff", { map: wallpaper("b", "#e9dcb8", "#d8c49a") }), 0, 2.25, -3));
    for (const s of [-1, 1]) g.add(plane(10, 4.5, toon("#e9dcb8", { side: THREE.DoubleSide }), s * 3.5, 2.25, 0, -s * Math.PI / 2));
    // shelves with loaves
    for (let r = 0; r < 3; r++) { g.add(box(5.6, 0.06, 0.45, "#7a4a2a", 0, 0.9 + r * 0.55, -2.75)); for (let i = 0; i < 9; i++) if (hh(i, r) > 0.25) g.add(loaf(-2.4 + i * 0.6, 0.96 + r * 0.55, -2.72, 0.7)); }
    // counter
    g.add(box(3.4, 1.0, 0.8, "#8a5a32", 0, 0, -0.9)); g.add(box(3.6, 0.07, 0.95, "#6a3e22", 0, 1.0, -0.9));
    const ceil = floor(10, 10, toon("#efe2c0", { side: THREE.DoubleSide })); ceil.position.y = 4.5; g.add(ceil);
  }
}

// ---------------- the government office (night / dawn) ----------------
export class Office {
  g = new THREE.Group(); win: THREE.Mesh;
  constructor() {
    const g = this.g;
    g.add(floor(10, 10, toon("#ffffff", { map: planks("ofl", ["#5a3a26", "#634030", "#523424"], [3, 3]) })));
    const panel = ctex("ipanel", 256, 256, (c) => { c.fillStyle = "#5a3424"; c.fillRect(0, 0, 256, 256); c.strokeStyle = "#3a2018"; c.lineWidth = 8; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) c.strokeRect(14 + i * 128, 14 + j * 128, 100, 100); }, [6, 2]);
    g.add(plane(10, 4.5, toon("#ffffff", { map: panel }), 0, 2.25, -3));
    for (const s of [-1, 1]) g.add(plane(10, 4.5, toon("#ffffff", { map: panel, side: THREE.DoubleSide }), s * 3.5, 2.25, 0, -s * Math.PI / 2));
    this.win = noInk(plane(1.4, 2.2, glow("#3a5a9a", 1.0), 1.6, 2.3, -2.97)); g.add(this.win);
    g.add(box(1.6, 0.1, 0.1, "#2a1a10", 1.6, 1.15, -2.95));
    // desk + green lamp
    g.add(box(2.6, 0.08, 1.2, "#4a2a18", 0, 0.86, -1.3));
    for (const s of [-1, 1]) g.add(box(0.5, 0.86, 1.1, "#3a2014", s * 1.0, 0, -1.3));
    const lampSh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.16, 16, 1, true), toon("#2a7a4a", { side: THREE.DoubleSide })); lampSh.position.set(-0.9, 1.3, -1.6); g.add(lampSh);
    const bulb = noInk(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glow("#ffe2a0", 2.4))); bulb.position.set(-0.9, 1.22, -1.6); g.add(bulb);
    const stem = cyl(0.015, 0.015, 0.36, "#c9a24a", 6); stem.position.set(-0.9, 1.08, -1.6); g.add(stem);
    const lp = new THREE.PointLight("#ffd890", 3, 4, 1.5); lp.position.set(-0.9, 1.4, -1.2); g.add(lp);
    const ceil = floor(10, 10, toon("#3a2418", { side: THREE.DoubleSide })); ceil.position.y = 4.5; g.add(ceil);
  }
  sky(col: string, k: number) { (this.win.material as THREE.MeshBasicMaterial).color.set(col).multiplyScalar(k); }
}

// ---------------- the print hall ----------------
export class PrintHall {
  g = new THREE.Group(); rollers: THREE.Mesh[] = []; wins: THREE.Mesh[] = []; lever = new THREE.Group();
  constructor() {
    const g = this.g;
    g.add(floor(30, 30, toon("#ffffff", { map: planks("pfl", ["#6a6660", "#74706a", "#5f5b55"], [6, 6]) })));
    const brick = ctex("ipbrick", 512, 512, (c) => { c.fillStyle = "#3a2420"; c.fillRect(0, 0, 512, 512); for (let r = 0; r < 16; r++) for (let k = -1; k < 9; k++) { c.fillStyle = ["#8a4a3a", "#9a5644", "#7a4234"][Math.floor(hh(r * 11 + k, 2) * 3)]; c.fillRect(k * 64 + (r % 2) * 32 + 3, r * 32 + 3, 58, 26); } }, [6, 3]);
    g.add(plane(30, 9, toon("#ffffff", { map: brick }), 0, 4.5, -7));
    for (const s of [-1, 1]) g.add(plane(30, 9, toon("#ffffff", { map: brick, side: THREE.DoubleSide }), s * 9, 4.5, 0, -s * Math.PI / 2));
    for (let i = 0; i < 4; i++) { const w = noInk(plane(1.8, 3.4, glow("#2a3a6a", 1.0), -5.4 + i * 3.6, 4.6, -6.97)); this.wins.push(w); g.add(w); g.add(box(1.9, 0.1, 0.1, "#2a2a30", -5.4 + i * 3.6, 4.55, -6.94)); }
    // three presses
    for (let p = 0; p < 3; p++) {
      const x = -3.4 + p * 3.4, pr = new THREE.Group(); pr.position.set(x, 0, -3.2); g.add(pr);
      pr.add(box(2.0, 0.7, 1.4, "#2f3a46", 0, 0, 0));
      for (const s of [-1, 1]) pr.add(box(0.16, 1.9, 1.3, "#3a4856", s * 0.95, 0.7, 0));
      for (let r = 0; r < 3; r++) { const c = cyl(0.22, 0.22, 1.8, r === 1 ? "#c9a24a" : "#5a6470", 14); c.rotation.z = Math.PI / 2; c.position.set(0, 1.0 + r * 0.42, 0.1 * (r - 1)); pr.add(c); this.rollers.push(c); }
      pr.add(box(1.6, 0.08, 0.9, "#e2d2a8", 0, 0.7, 0.9)); // output tray
      const lamp = noInk(new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), glow("#ffd890", 2.2))); lamp.position.set(0, 3.6, 0.4); pr.add(lamp);
      const pl = new THREE.PointLight("#ffcf80", 5, 6, 1.4); pl.position.set(0, 3.2, 1.2); pr.add(pl);
    }
    // the big lever on the middle press (pivot at the base)
    this.lever.position.set(1.15, 0.75, -2.5); g.add(this.lever);
    const rod = cyl(0.05, 0.05, 1.2, "#8a8a92", 8); rod.position.y = 0.6; this.lever.add(rod);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), toon("#d8302c")); knob.position.y = 1.22; this.lever.add(knob);
    g.add(box(0.3, 0.2, 0.3, "#2a2a30", 1.15, 0.65, -2.5));
  }
  /** spin = roller turns (rad), day 0..1 for the windows, lever 0 (up/on) .. 1 (pulled/off) */
  set(spin: number, day: number, lever: number) {
    this.rollers.forEach((r, i) => (r.rotation.x = spin * (i % 2 ? -1 : 1)));
    const c = new THREE.Color("#2a3a6a").lerp(new THREE.Color("#fff0c8"), day);
    this.wins.forEach((w) => (w.material as THREE.MeshBasicMaterial).color.copy(c).multiplyScalar(1 + 0.5 * day));
    this.lever.rotation.x = -0.5 + 1.3 * lever;
  }
}
void hh;
