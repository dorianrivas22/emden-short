// More sets for "The Money Stove" v2: kitchen, government office, print hall (kit engine, dense detail).
import * as THREE from "three";
import { soft, lit, shaft, shadows, noInk } from "../kit/mat";
import { planks, bricks, plaster, wallpaper, checker, panels, rnd } from "../kit/tex";
import { box, cyl, label, barrel, table, chair, shelf, clock, plant, hangingLamp, windowFrame } from "../kit/props";

const floor = (w: number, d: number, m: THREE.Material) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; return f; };
const wall = (w: number, h: number, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; return p; };
const notesTex = () => {
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256; const c = cv.getContext("2d")!;
  c.fillStyle = "#3a3a2a"; c.fillRect(0, 0, 512, 256);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) {
    const x = k * 256 + 6, y = r * 128 + 6; c.fillStyle = (r + k) % 2 ? "#c8d4b0" : "#e2d2a8"; c.fillRect(x, y, 244, 116);
    c.strokeStyle = "#5a6a4a"; c.lineWidth = 6; c.strokeRect(x + 10, y + 10, 224, 96);
    c.fillStyle = "#4a5a3a"; c.font = "900 38px serif"; c.textAlign = "center"; c.fillText("1000", x + 122, y + 56); c.font = "700 22px serif"; c.fillText("MARK", x + 122, y + 88);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 4); return t;
};

// ---------------- the kitchen: iron stove, wood box, dresser, window, door; the right wall gets papered with notes ----------------
export class Kitchen {
  g = new THREE.Group(); door = new THREE.Group(); fire: THREE.Mesh; fireLight = new THREE.PointLight("#ff9a4a", 0, 6, 1.4); paper: THREE.Mesh; log: THREE.Mesh; clock: THREE.Group;
  constructor() {
    const g = this.g;
    g.add(floor(12, 12, soft("#ffffff", { map: planks("#9a6a42", [3, 3], 10) })));
    g.add(wall(12, 1.2, soft("#ffffff", { map: panels("#3a5a4a", [6, 1]) }), 0, 0.6, -3.0));
    g.add(wall(12, 3.8, soft("#ffffff", { map: wallpaper("#e8c8a0", "#b0604a", [5, 2]) }), 0, 3.1, -3.0));
    g.add(wall(12, 5, soft("#ffffff", { map: wallpaper("#e8c8a0", "#b0604a", [5, 2]), side: THREE.DoubleSide }), -3.6, 2.5, 0, Math.PI / 2));
    g.add(wall(12, 5, soft("#ffffff", { map: wallpaper("#c8d8e8", "#6a7aa8", [5, 2]), side: THREE.DoubleSide }), 3.6, 2.5, 0, -Math.PI / 2));
    const ceil = floor(12, 12, soft("#efe2c8", { side: THREE.DoubleSide })); ceil.position.y = 5; g.add(ceil);
    this.paper = new THREE.Mesh(new THREE.PlaneGeometry(1, 3.2), soft("#ffffff", { map: notesTex(), side: THREE.DoubleSide })); this.paper.geometry.translate(0.5, 0, 0);
    this.paper.position.set(3.58, 1.9, -2.9); this.paper.rotation.y = -Math.PI / 2; this.paper.receiveShadow = true; g.add(this.paper);
    // the iron stove
    const st = new THREE.Group(); st.position.set(0.9, 0, -2.4); g.add(st);
    st.add(box(1.2, 0.9, 0.8, soft("#2c2c34", { rough: 0.5, metal: 0.5 })), box(1.32, 0.07, 0.9, soft("#1c1c22", { rough: 0.4, metal: 0.6 }), 0, 0.9, 0));
    for (const x of [-0.5, 0.5]) st.add(box(0.1, 0.16, 0.1, "#1c1c22", x, 0, 0.32));
    for (const x of [-0.3, 0.3]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 6, 20), soft("#4a4a52", { metal: 0.6, rough: 0.4 })); r.rotation.x = Math.PI / 2; r.position.set(x, 0.98, 0); st.add(r); }
    const kettle = cyl(0.14, 0.18, 0.22, soft("#c8502c", { rough: 0.4 })); kettle.position.set(-0.3, 1.08, 0); st.add(kettle);
    const pipe = cyl(0.11, 0.11, 3.2, soft("#2a2a30", { metal: 0.5, rough: 0.5 }), 12); pipe.position.set(0.35, 2.5, -0.25); st.add(pipe);
    this.fire = noInk(new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.32), lit("#ff8a3a", 2.6))); this.fire.material = (this.fire.material as THREE.Material).clone(); this.fire.position.set(0, 0.42, 0.405); st.add(this.fire);
    this.door.position.set(-0.24, 0.42, 0.42); st.add(this.door);
    this.door.add(box(0.48, 0.34, 0.03, soft("#4a4a54", { metal: 0.5, rough: 0.5 }), 0.24, -0.17, 0));
    const knob = cyl(0.03, 0.03, 0.06, soft("#c9a24a", { metal: 0.8, rough: 0.3 }), 8); knob.rotation.x = Math.PI / 2; knob.position.set(0.42, 0, 0.04); this.door.add(knob);
    this.fireLight.position.set(0, 0.6, 1.0); st.add(this.fireLight);
    shadows(st);
    // wood box with logs
    const wb = new THREE.Group(); wb.position.set(-0.6, 0, -2.5); wb.add(box(0.9, 0.5, 0.55, soft("#ffffff", { map: planks("#8a5a34", [1, 1], 4) })));
    for (let i = 0; i < 7; i++) { const l = cyl(0.08, 0.08, 0.75, soft("#ffffff", { map: planks("#9a6a42", [1, 1], 4) }), 10); l.rotation.z = Math.PI / 2; l.position.set(0, 0.56 + 0.08 * (i % 2) + (i > 4 ? 0.14 : 0), -0.18 + 0.12 * (i % 4)); wb.add(l); }
    g.add(shadows(wb));
    this.log = cyl(0.09, 0.09, 0.6, soft("#ffffff", { map: planks("#9a6a42", [1, 1], 4) }), 10); this.log.rotation.z = Math.PI / 2; this.log.visible = false; g.add(shadows(this.log));
    // dresser with plates and jars, clock, calendar, a framed picture
    const dr = shelf(1.8, 2.3, 4, 11, "#5a6a4a"); dr.position.set(-2.4, 0, -2.75); g.add(dr);
    this.clock = clock(0.24); this.clock.position.set(2.3, 3.1, -2.95); g.add(this.clock);
    const cal = label("NOV 1923", 0.5, 0.62, { bg: "#f2ead6", fg: "#b02a2a", border: "#2a2a2a", font: "sans-serif" }); cal.position.set(-0.6, 2.4, -2.97); g.add(cal);
    g.add(box(0.8, 0.6, 0.04, soft("#ffffff", { map: plaster("#7aa0c8") }), 1.0, 2.6, -2.98), box(0.9, 0.06, 0.06, "#6a4a2a", 1.0, 2.57, -2.95), box(0.9, 0.06, 0.06, "#6a4a2a", 1.0, 3.17, -2.95));
    // window (street light) and the door to the stairwell
    const win = windowFrame(1.4, 1.8, "#fff0d0", 1.5, { curtains: "#b84a4a" }); win.position.set(-3.55, 2.2, -0.6); win.rotation.y = Math.PI / 2; g.add(win);
    const sh = shaft("#fff0d0", 0.7, 1.4, 4.5, 0.1); sh.position.set(-3.4, 3.2, -0.6); sh.rotation.z = 0.8; g.add(sh);
    g.add(box(1.1, 2.4, 0.08, soft("#ffffff", { map: planks("#6a4a3a", [1, 1], 2) }), 2.4, 0, -2.96));
    // table (the pizza shot), chairs, lamp
    const tb = table(1.8, 1.1, 0.85, "#7a4a2a"); tb.position.set(-0.6, 0, 1.0); g.add(tb);
    for (const [x, z, r] of [[-1.7, 1.0, Math.PI / 2], [0.5, 1.0, -Math.PI / 2]] as number[][]) { const c = chair(); c.position.set(x, 0, z); c.rotation.y = r; g.add(c); }
    const lamp = hangingLamp("#ffd8a0", { drop: 1.6, intensity: 6, shade: "#b84a3a" }); lamp.position.set(-0.6, 5, 1.0); g.add(lamp);
    const p = plant(1.0); p.position.set(3.0, 0, 1.6); g.add(p);
    const fill = new THREE.PointLight("#ffe2c0", 3, 8, 1.6); fill.position.set(0.5, 2.6, 1.5); g.add(fill);
  }
  set(t: number, door: number, fire: number, paper = 0) {
    this.door.rotation.y = -1.9 * door;
    const fl = fire * (0.82 + 0.18 * Math.sin(t * 23) * Math.sin(t * 7.1));
    (this.fire.material as THREE.MeshBasicMaterial).color.setRGB(0.3 + 2.4 * fl, 0.12 + 1.0 * fl, 0.03 + 0.25 * fl);
    this.fireLight.intensity = 7 * fl * door;
    this.paper.visible = paper > 0.001; this.paper.scale.x = 6 * paper;
  }
}

// ---------------- the government office: panelled walls, bookcase, flag, desk under a mountain of paper ----------------
export class Office {
  g = new THREE.Group(); win: THREE.Mesh;
  constructor() {
    const g = this.g;
    g.add(floor(12, 12, soft("#ffffff", { map: planks("#6a3a26", [3, 3], 12) })));
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.6), soft("#ffffff", { map: checker("#8a2a2a", "#c8a24a", [3, 2]) })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, -0.6); rug.receiveShadow = true; g.add(rug);
    g.add(wall(12, 5, soft("#ffffff", { map: panels("#5a3424", [6, 2]) }), 0, 2.5, -3.0));
    for (const s of [-1, 1]) g.add(wall(12, 5, soft("#ffffff", { map: panels("#5a3424", [6, 2]), side: THREE.DoubleSide }), s * 3.6, 2.5, 0, -s * Math.PI / 2));
    const ceil = floor(12, 12, soft("#3a2418", { side: THREE.DoubleSide })); ceil.position.y = 5; g.add(ceil);
    this.win = noInk(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshBasicMaterial({ color: "#3a5a9a" }))); this.win.position.set(1.9, 2.6, -2.96); g.add(this.win);
    const wf = windowFrame(1.4, 2.4, "#000000", 0.01, { frame: "#3a2418", curtains: "#7a1a2a" }); wf.children[0].visible = false; wf.position.set(1.9, 2.6, -2.95); g.add(wf);
    const b1 = shelf(1.8, 3.2, 6, 21, "#3a2014"); b1.position.set(-1.9, 0, -2.75); g.add(b1);
    for (const x of [-0.4, 0.4]) { const pole = cyl(0.025, 0.025, 2.2, soft("#c9a24a", { metal: 0.8, rough: 0.3 })); pole.position.set(x, 1.1, -2.6); g.add(pole); }
    for (const [x, y, c] of [[-0.4, 1.95, "#1a1a1a"], [-0.4, 1.7, "#c82a2a"], [-0.4, 1.45, "#e8c43a"], [0.4, 1.95, "#1a1a1a"], [0.4, 1.7, "#c82a2a"], [0.4, 1.45, "#e8c43a"]] as [number, number, string][]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.25), soft(c, { side: THREE.DoubleSide })); b.position.set(x + 0.3, y, -2.59); g.add(b); }
    const sign = label("REICHSBANK", 2.2, 0.42, { bg: "#2a1a10", fg: "#e8c45a" }); sign.position.set(0, 4.1, -2.97); g.add(sign);
    const dk = new THREE.Group(); dk.position.set(0, 0, -1.3);
    dk.add(box(2.8, 0.08, 1.3, soft("#ffffff", { map: planks("#4a2414", [1, 1], 5) }), 0, 0.86, 0)); for (const s of [-1, 1]) dk.add(box(0.6, 0.86, 1.2, soft("#3a1c10"), s * 1.05, 0, 0));
    const ink = cyl(0.05, 0.06, 0.08, soft("#1a1a2a", { rough: 0.2 })); ink.position.set(0.6, 0.98, 0.2); dk.add(ink);
    const phone = new THREE.Group(); phone.add(cyl(0.12, 0.15, 0.08, soft("#1a1a1a", { rough: 0.3 }))); phone.add(box(0.05, 0.25, 0.05, "#1a1a1a", 0, 0.04, 0)); phone.position.set(1.05, 0.98, -0.1); dk.add(phone);
    const lampSh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.16, 16, 1, true), soft("#2a7a4a", { side: THREE.DoubleSide, rough: 0.3 })); lampSh.position.set(-0.95, 1.36, 0.25); dk.add(lampSh);
    const bulb = noInk(new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), lit("#ffe2a0", 3))); bulb.position.set(-0.95, 1.28, 0.25); dk.add(bulb);
    const stem = cyl(0.015, 0.015, 0.4, soft("#c9a24a", { metal: 0.8 })); stem.position.set(-0.95, 1.12, 0.25); dk.add(stem);
    const lp = new THREE.PointLight("#ffd890", 5, 5, 1.5); lp.position.set(-0.85, 1.5, 0.6); dk.add(lp);
    g.add(shadows(dk));
    const lamp = hangingLamp("#ffe2b0", { drop: 1.0, intensity: 5, shade: "#c9a24a" }); lamp.position.set(0, 5, 0.6); g.add(lamp);
    const fill = new THREE.PointLight("#c8d8ff", 2.5, 8, 1.5); fill.position.set(-1.5, 2.6, 2); g.add(fill);
  }
  sky(col: string, k: number) { (this.win.material as THREE.MeshBasicMaterial).color.set(col).multiplyScalar(k); }
}

// ---------------- the print hall: three presses, paper stacks, lamps, brick ----------------
export class PrintHall {
  g = new THREE.Group(); rollers: THREE.Mesh[] = []; wins: THREE.Mesh[] = []; lever = new THREE.Group();
  constructor() {
    const g = this.g;
    g.add(floor(30, 30, soft("#ffffff", { map: planks("#6a6660", [6, 6], 10) })));
    const br = bricks("#8a4a3a", "#c0b4a0", [6, 2]);
    g.add(wall(30, 9, soft("#ffffff", { map: br }), 0, 4.5, -7));
    for (const s of [-1, 1]) g.add(wall(30, 9, soft("#ffffff", { map: br, side: THREE.DoubleSide }), s * 9, 4.5, 0, -s * Math.PI / 2));
    for (let i = 0; i < 4; i++) {
      const w = noInk(new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.4), new THREE.MeshBasicMaterial({ color: "#2a3a6a" }))); w.position.set(-5.4 + i * 3.6, 4.6, -6.97); this.wins.push(w); g.add(w);
      const f = windowFrame(1.8, 3.4, "#000000", 0.01, { frame: "#2a2a30" }); f.children[0].visible = false; f.position.set(-5.4 + i * 3.6, 4.6, -6.95); g.add(f);
    }
    for (let i = 0; i < 3; i++) g.add(box(30, 0.35, 0.3, "#3a3a40", 0, 7.5, -5 + i * 4));
    for (let p = 0; p < 3; p++) {
      const pr = new THREE.Group(); pr.position.set(-3.4 + p * 3.4, 0, -3.2); g.add(pr);
      pr.add(box(2.1, 0.75, 1.5, soft("#2f4a5e", { rough: 0.5, metal: 0.4 })));
      for (const s of [-1, 1]) { pr.add(box(0.18, 2.0, 1.4, soft("#3a5a70", { rough: 0.5, metal: 0.4 }), s * 1.0, 0.75, 0)); const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16), soft("#c9a24a", { metal: 0.7, rough: 0.35 })); gear.rotation.z = Math.PI / 2; gear.position.set(s * 1.12, 1.6, 0); pr.add(gear); this.rollers.push(gear); }
      for (let r = 0; r < 3; r++) { const c = cyl(0.22, 0.22, 1.85, soft(r === 1 ? "#c9a24a" : "#6a7480", { rough: 0.35, metal: 0.6 }), 16); c.rotation.z = Math.PI / 2; c.position.set(0, 1.05 + r * 0.44, 0.1 * (r - 1)); pr.add(c); this.rollers.push(c); }
      pr.add(box(1.7, 0.08, 1.0, "#e2d2a8", 0, 0.75, 0.95));
      for (let k = 0; k < 4; k++) pr.add(box(0.55, 0.3 + 0.25 * rnd(k, p), 0.3, soft(k % 2 ? "#e2d2a8" : "#c8d4b0"), -0.7 + k * 0.45, 0, 1.55));
      const lamp = hangingLamp("#ffd890", { drop: 3.2, intensity: 7, shade: "#2a5a4a", reach: 8 }); lamp.position.set(0, 7.3, 0.5); pr.add(lamp);
      shadows(pr);
    }
    for (let k = 0; k < 8; k++) g.add(shadows(box(0.8, 0.5 + 0.9 * rnd(k, 2), 0.6, soft(k % 2 ? "#e2d2a8" : "#c8d4b0"), -7 + 2 * k, 0, -5.8)));
    for (let k = 0; k < 4; k++) { const b = barrel(1.0, "#5a4a3a"); b.position.set(-8 + k * 0.9, 0, 3); g.add(b); }
    this.lever.position.set(1.25, 0.75, -2.35); g.add(this.lever);
    const rod = cyl(0.05, 0.05, 1.2, soft("#8a8a92", { metal: 0.7, rough: 0.3 }), 8); rod.position.y = 0.6; this.lever.add(rod);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), soft("#d8302c", { rough: 0.35 })); knob.position.y = 1.22; this.lever.add(knob);
    shadows(this.lever); g.add(shadows(box(0.3, 0.2, 0.3, "#2a2a30", 1.25, 0.65, -2.35)));
    const sign = label("STAATSDRUCKEREI", 4.4, 0.7, { bg: "#2a2a30", fg: "#e8c45a" }); sign.position.set(0, 6.6, -6.95); g.add(sign);
    const fill = new THREE.PointLight("#9ab0ff", 3, 14, 1.4); fill.position.set(0, 4, 4); g.add(fill);
  }
  set(spin: number, day: number, lever: number) {
    this.rollers.forEach((r, i) => (r.rotation.x = spin * (i % 2 ? -1 : 1)));
    const c = new THREE.Color("#2a3a6a").lerp(new THREE.Color("#fff0c8"), day);
    this.wins.forEach((w) => (w.material as THREE.MeshBasicMaterial).color.copy(c).multiplyScalar(1 + 0.8 * day));
    this.lever.rotation.x = -0.5 + 1.3 * lever;
  }
}
void lit; void table; void chair;
