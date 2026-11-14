// Sets for "The Money Stove" v2 on the kit engine: dense, detailed, lit by practical lights.
import * as THREE from "three";
import { soft, lit, shaft, shadows, noInk } from "../kit/mat";
import { planks, bricks, plaster, wallpaper, cobbles, checker, panels, tiles, rnd, shadeHex } from "../kit/tex";
import { box, cyl, label, crate, barrel, sack, table, chair, shelf, clock, setClock, plant, hangingLamp, streetLamp, windowFrame, bunting, facadeBlock } from "../kit/props";

const floor = (w: number, d: number, m: THREE.Material) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; return f; };
const wall = (w: number, h: number, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; return p; };
const loaf = (s = 1, col = "#c98a42") => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 16, 10), soft(col, { rough: 0.6 })); m.scale.set(1.7, 0.75, 1); m.position.y = 0.11 * s; g.add(m); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.06 * s, 0.012 * s, 4, 10, Math.PI), soft(shadeHex(col, 1.25))); c.rotation.set(-Math.PI / 2, 0, Math.PI / 2); c.position.set((i - 1) * 0.09 * s, 0.19 * s, 0); g.add(c); } return shadows(g); };
const pretzel = () => { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.TorusKnotGeometry(0.07, 0.022, 48, 6, 2, 3), soft("#a8622a", { rough: 0.5 })); t.scale.set(1, 1, 0.4); t.position.y = 0.08; g.add(t); return shadows(g); };

// ---------------- the bakery, inside: shelves of bread, counter, till, lamps, window to the street ----------------
export class Bakery {
  g = new THREE.Group(); board: THREE.Mesh; clock: THREE.Group;
  constructor() {
    const g = this.g;
    g.add(floor(12, 12, soft("#ffffff", { map: checker("#a8423a", "#efe4cc", [5, 5]) })));
    g.add(wall(12, 2.0, soft("#ffffff", { map: panels("#2c4a5e", [6, 1]) }), 0, 1.0, -3.0));
    g.add(wall(12, 3.0, soft("#ffffff", { map: wallpaper("#a8d4bc", "#4f8f74", [5, 1.5]) }), 0, 3.5, -3.0));
    for (const s of [-1, 1]) { g.add(wall(12, 2.0, soft("#ffffff", { map: panels("#2c4a5e", [6, 1]), side: THREE.DoubleSide }), s * 3.6, 1.0, 0, -s * Math.PI / 2)); g.add(wall(12, 3.0, soft("#ffffff", { map: wallpaper("#a8d4bc", "#4f8f74", [5, 1.5]), side: THREE.DoubleSide }), s * 3.6, 3.5, 0, -s * Math.PI / 2)); }
    const ceil = floor(12, 12, soft("#ffffff", { map: planks("#8a6a4a", [3, 3], 10), side: THREE.DoubleSide })); ceil.position.y = 5; g.add(ceil);
    for (let i = 0; i < 4; i++) g.add(box(12, 0.2, 0.25, "#5a3a24", 0, 4.8, -2.5 + i * 2));
    // bread wall: two shelf units full of loaves, plus jar shelves at the sides
    for (const sx of [-1.35, 1.35]) {
      const sh = new THREE.Group(); sh.position.set(sx, 0.95, -2.75);
      for (let r = 0; r < 4; r++) { sh.add(box(2.4, 0.05, 0.42, "#6a4024", 0, r * 0.5, 0)); for (let k = 0; k < 6; k++) { const l = r % 2 ? pretzel() : loaf(0.8 + 0.25 * rnd(k, r), ["#c98a42", "#b8742e", "#d9a05a", "#8a5a2a"][(k + r) % 4]); l.position.set(-1.0 + k * 0.4 + 0.05 * rnd(k, r + 3), r * 0.5 + 0.03, 0.02); l.rotation.y = rnd(k, r) - 0.5; sh.add(l); } }
      for (const s of [-1, 1]) sh.add(box(0.06, 2.0, 0.44, "#5a3420", s * 1.22, 0, 0));
      g.add(shadows(sh));
    }
    const j1 = shelf(1.4, 2.4, 5, 3); j1.position.set(-3.3, 0, -1.6); j1.rotation.y = Math.PI / 2; g.add(j1);
    const j2 = shelf(1.4, 2.4, 5, 7); j2.position.set(3.3, 0, -1.6); j2.rotation.y = -Math.PI / 2; g.add(j2);
    // counter with glass case, till, scale, baskets, paper bags
    const ct = new THREE.Group(); ct.position.set(0, 0, -0.9);
    ct.add(box(4.2, 1.0, 0.85, soft("#ffffff", { map: panels("#8a3a32", [4, 1]) })), box(4.4, 0.07, 1.0, "#4a2a18", 0, 1.0, 0));
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.7), new THREE.MeshStandardMaterial({ color: "#dfefff", transparent: true, opacity: 0.25, roughness: 0.05 })); glass.position.set(-1.1, 1.28, 0); ct.add(glass);
    for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16), soft(["#e8b0b8", "#f2e2b8", "#8a5a3a"][k % 3], { rough: 0.5 })); c.position.set(-1.7 + k * 0.24, 1.11, -0.1 + 0.15 * (k % 2)); ct.add(c); }
    const till = new THREE.Group(); till.add(box(0.5, 0.32, 0.4, soft("#b8902a", { rough: 0.3, metal: 0.7 }))); for (let k = 0; k < 9; k++) till.add(box(0.06, 0.04, 0.06, "#f2ead6", -0.15 + (k % 3) * 0.15, 0.32 + Math.floor(k / 3) * 0.0, 0.05 + Math.floor(k / 3) * 0.08)); till.position.set(1.25, 1.07, 0.05); ct.add(till);
    const basket = cyl(0.3, 0.22, 0.2, soft("#b8904a")); basket.position.set(0.35, 1.17, 0.1); ct.add(basket); for (let k = 0; k < 4; k++) { const l = loaf(0.7, "#c98a42"); l.position.set(0.25 + 0.08 * k, 1.25, 0.05 + 0.05 * (k % 2)); l.rotation.y = k; ct.add(l); }
    for (let k = 0; k < 3; k++) ct.add(box(0.2, 0.32, 0.12, "#c8b088", 1.75 - k * 0.24, 1.07, -0.25));
    g.add(shadows(ct));
    // price board (dynamic label is a card in the shot), clock, lamps
    this.board = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.68), soft("#2f3a34")); this.board.position.set(0, 3.5, -2.97); g.add(this.board);
    g.add(box(2.0, 0.78, 0.04, "#6a4a2a", 0, 3.11, -2.99));
    this.clock = clock(0.28); this.clock.position.set(-2.4, 3.6, -2.95); g.add(this.clock);
    for (const x of [-1.6, 1.6]) { const l = hangingLamp("#ffd8a0", { drop: 1.0, intensity: 7, shade: "#2a5a4a" }); l.position.set(x, 5, -0.6); g.add(l); }
    g.add(label("BÄCKEREI MÜLLER", 2.2, 0.4, { bg: "#7a2a22", fg: "#f4e2b8" }).translateX(0).translateY(4.4).translateZ(-2.96));
    // flour sacks, crates and a broom in the corners: foreground clutter
    const s1 = sack(0.7); s1.position.set(-2.8, 0, 0.6); g.add(s1); const s2 = sack(0.6, "#d8c8a0"); s2.position.set(-2.4, 0, 0.9); s2.rotation.y = 0.6; g.add(s2);
    const c1 = crate(0.55); c1.position.set(2.7, 0, 0.8); g.add(c1);
    const p1 = plant(1.1); p1.position.set(2.9, 0, -0.4); g.add(p1);
    // the shop window behind the camera side wall (light from the street)
    const win = windowFrame(2.2, 2.0, "#fff2d8", 1.6); win.position.set(-3.55, 2.2, 1.2); win.rotation.y = Math.PI / 2; g.add(win);
    const sh = shaft("#fff2d8", 0.9, 1.6, 5.5, 0.12); sh.position.set(-3.4, 3.4, 1.2); sh.rotation.z = 0.9; g.add(sh);
    const fill = new THREE.PointLight("#ffe6c0", 4, 9, 1.6); fill.position.set(0, 2.5, 2.5); g.add(fill);
  }
  tick(t: number) { setClock(this.clock, 9 + t * 0.6); }
}

// ---------------- a Berlin street, 1922: facades, shop fronts, lamps, carts, bunting ----------------
export class Street {
  lamps = new THREE.Group();
  g = new THREE.Group();
  constructor() {
    const g = this.g;
    g.add(floor(16, 260, soft("#ffffff", { map: cobbles("#b0a490", [5, 80]) })));
    for (const s of [-1, 1]) { const sw = box(3.2, 0.18, 260, soft("#ffffff", { map: checker("#b8b0a0", "#a8a090", [2, 140]) }), s * 6.6, 0, 0); sw.receiveShadow = true; g.add(sw); g.add(box(0.18, 0.2, 260, "#7a7468", s * 5.0, 0, 0)); }
    const walls = [bricks("#b25a42"), plaster("#9fc0d8"), plaster("#e8b0a0"), plaster("#b8d8a8"), plaster("#f0d890"), bricks("#8a6a8a", "#d8ccb8"), plaster("#d8b8e0")];
    const roofs = ["#7a4a3a", "#5a5a6a", "#8a5a3a", "#4a4a52"];
    const shops = ["BÄCKEREI", "KOLONIALWAREN", "APOTHEKE", "CAFÉ", "SCHNEIDER", "METZGEREI", "UHREN", "ZIGARREN"];
    for (const s of [-1, 1]) for (let i = 0; i < 14; i++) {
      const w = 8.6, h = 12 + 4 * rnd(i, s + 7), z = 34 - i * 9;
      const f = facadeBlock(w, h, 8, walls[(i + (s > 0 ? 3 : 0)) % walls.length], { roof: roofs[i % 4], lit: 0.3, seed: i * 3 + (s > 0 ? 1 : 0), shopSign: "y" });
      f.position.set(s * 12.4, 0, z); f.rotation.y = -s * Math.PI / 2; g.add(f);
      // shop front on the ground floor: glowing window, awning, sign
      const shopName = shops[(i + (s > 0 ? 4 : 0)) % shops.length];
      const sw = windowFrame(3.6, 2.0, "#ffe8c0", 1.4, { frame: "#3a2a20" }); sw.position.set(s * 8.36, 1.7, z + 0.8); sw.rotation.y = -s * Math.PI / 2; g.add(sw);
      const sg = label(shopName, 3.8, 0.6, { bg: ["#2a4a3a", "#7a2a22", "#2a3a6a", "#3a2a20"][i % 4], fg: "#f4e2b8" }); sg.position.set(s * 8.34, 3.15, z); sg.rotation.y = -s * Math.PI / 2; g.add(sg);
      const aw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 3.8), soft(["#c8402c", "#2a6a4a", "#e8c45a"][i % 3])); aw.position.set(s * 7.9, 2.75, z + 0.8); aw.rotation.z = s * 0.6; aw.castShadow = true; g.add(aw);
      const door = box(0.05, 2.3, 1.1, "#4a2a1a", s * 8.37, 0, z - 2.4); door.rotation.y = 0; g.add(door);
      if (shopName === "BÄCKEREI") for (let k = 0; k < 6; k++) { const l = loaf(0.9); l.position.set(s * 8.1, 1.05, z - 0.4 + k * 0.4); g.add(l); }
    }
    for (let i = 0; i < 10; i++) for (const s of [-1, 1]) { const l = streetLamp(4.2, "#ffe2a8", 0.6); l.position.set(s * 5.3, 0, 30 - i * 13); this.lamps.add(l); } g.add(this.lamps);
    for (let i = 0; i < 4; i++) g.add(bunting(new THREE.Vector3(-8.2, 5.5, 18 - i * 16), new THREE.Vector3(8.2, 5.5, 18 - i * 16), 16));
    for (let i = 0; i < 6; i++) { const b = barrel(0.9); b.position.set((i % 2 ? 1 : -1) * 6.0, 0.18, 12 - i * 11); g.add(b); const c = crate(0.6); c.position.set((i % 2 ? 1 : -1) * 6.4, 0.18, 13 - i * 11); c.rotation.y = i; g.add(c); }
    // a horse-less market cart
    const cart = new THREE.Group(); cart.add(box(1.4, 0.5, 2.2, soft("#ffffff", { map: planks("#8a5a34", [1, 1], 4) }), 0, 0.5, 0)); for (const [x, z] of [[-0.75, -0.7], [0.75, -0.7], [-0.75, 0.7], [0.75, 0.7]]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16), soft("#4a3020")); w.position.set(x, 0.34, z); w.rotation.y = Math.PI / 2; cart.add(w); }
    for (let k = 0; k < 5; k++) { const sk = sack(0.5, "#c8b088"); sk.position.set(-0.35 + 0.35 * (k % 3), 1.0, -0.6 + 0.5 * k / 2); cart.add(sk); }
    cart.position.set(3.4, 0, 2); cart.rotation.y = 0.3; g.add(shadows(cart));
    // far end: a church spire to close the vista
    const sp = new THREE.Group(); sp.add(box(5, 22, 5, soft("#ffffff", { map: bricks("#9a6a52") }))); const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 12, 4), soft("#4a6a5a")); cone.position.y = 28; cone.rotation.y = Math.PI / 4; sp.add(cone); sp.position.set(0, 0, -110); g.add(shadows(sp));
    void tiles; void table; void chair; void cyl; void lit; void noInk;
  }
}
