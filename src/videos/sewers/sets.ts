// Sets for "Built Too Big" (London's sewers): toon-shaded geometry + painted canvas textures, reusing the Emden helpers.
import * as THREE from "three";
import { toon, glow, ctex, hh, noInk } from "../emden/lib";
import { house } from "../emden/props";

export const box = (w: number, h: number, d: number, col: string | THREE.Material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof col === "string" ? toon(col) : col);
  m.position.set(x, y + h / 2, z); return m;
};
export const cyl = (r0: number, r1: number, h: number, col: string | THREE.Material, seg = 24) =>
  new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), typeof col === "string" ? toon(col) : col);

// ---------------- painted textures ----------------
/** London stock brick: warm orange-yellow courses with dark mortar */
export const brickTex = (key: string, base: string[], rep: [number, number]) => ctex(`brick_${key}`, 512, 512, (g) => {
  g.fillStyle = "#3b2a22"; g.fillRect(0, 0, 512, 512);
  const bh = 32, bw = 64;
  for (let r = 0; r < 512 / bh; r++) for (let c = -1; c < 512 / bw + 1; c++) {
    const x = c * bw + (r % 2 ? bw / 2 : 0), i = r * 17 + c;
    g.fillStyle = base[Math.floor(hh(i, 3) * base.length)];
    g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6);
    g.fillStyle = "rgba(255,240,210,0.16)"; g.fillRect(x + 3, r * bh + 3, bw - 6, 5);
    if (hh(i, 7) > 0.8) { g.fillStyle = "rgba(40,25,15,0.25)"; g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6); }
  }
}, rep);
const BRICK = ["#c98a4a", "#d29a58", "#b97a42", "#cf9150", "#be8448", "#d8a466"];
const BRICK_RED = ["#a5523a", "#b45e42", "#9a4a34", "#b8664a"];
const flowTex = () => ctex("flow", 256, 256, (g) => {
  g.fillStyle = "#5f5a2e"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.strokeStyle = i % 3 ? "rgba(140,130,70,0.6)" : "rgba(60,50,25,0.6)"; g.lineWidth = 3 + 3 * hh(i); const y = 256 * hh(i, 1); g.beginPath(); g.moveTo(256 * hh(i, 2), y); g.lineTo(256 * hh(i, 2) + 40 + 60 * hh(i, 4), y + 4); g.stroke(); }
}, [1, 8]);
export const signTex = (text: string, bg: string, fg: string, w = 1024, font = 90) => ctex(`ssign_${text}_${bg}`, w, 160, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, 160); g.strokeStyle = "#1a1a1a"; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, 148);
  g.font = `900 ${font}px serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = fg; g.fillText(text, w / 2, 86);
});

// ---------------- the great brick sewer tunnel ----------------
export class Tunnel {
  g = new THREE.Group(); water: THREE.Mesh; R = 4.5; lamps: THREE.Mesh[] = [];
  constructor() {
    const L = 160, R = this.R;
    const t = brickTex("tunnel", BRICK, [10, 22]);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 48, 1, true), toon("#ffffff", { map: t, side: THREE.BackSide }));
    wall.rotation.x = Math.PI / 2; wall.position.set(0, R, -L / 2 + 20); this.g.add(wall);
    // stone rings every 8 m (they read as the tunnel's scale)
    for (let z = 14; z > -L + 20; z -= 8) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R - 0.05, 0.16, 6, 48), toon("#a88a6a")); ring.position.set(0, R, z); this.g.add(ring);
    }
    // walkways and the flowing channel
    for (const s of [-1, 1]) this.g.add(box(2.6, 1.1, L, "#9a8a76", s * 3.0, 0, -L / 2 + 20));
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(3.4, L), toon("#ffffff", { map: flowTex() }));
    this.water.rotation.x = -Math.PI / 2; this.water.position.set(0, 0.55, -L / 2 + 20); this.g.add(this.water);
    // gas lamps on brackets
    for (let z = 10, i = 0; z > -L + 20; z -= 12, i++) for (const s of [-1, 1]) {
      const arm = box(0.08, 0.08, 0.6, "#2a2a30", s * 3.9, 3.2, z); arm.rotation.y = Math.PI / 2; this.g.add(arm);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), glow("#ffc879", 6)); l.position.set(s * 3.65, 3.05, z); this.g.add(noInk(l)); this.lamps.push(l);
    }
  }
  flow(t: number) { const m = (this.water.material as THREE.MeshToonMaterial).map!; m.offset.y = -t * 0.35; }
}

// ---------------- toilets, pipes, river bank ----------------
export const toilet = () => {
  const g = new THREE.Group();
  g.add(box(0.5, 0.45, 0.6, "#f4f1ea", 0, 0, 0));
  const bowl = cyl(0.36, 0.28, 0.25, "#f4f1ea", 20); bowl.position.set(0, 0.55, 0.05); bowl.scale.z = 1.2; g.add(bowl);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 6, 20), toon("#7a4a2a")); seat.rotation.x = Math.PI / 2; seat.scale.y = 1.2; seat.position.set(0, 0.68, 0.05); g.add(seat);
  g.add(box(0.55, 0.6, 0.22, "#f4f1ea", 0, 0.68, -0.32));
  const chain = box(0.03, 0.9, 0.03, "#5a5a60", 0.2, 1.3, -0.3); g.add(chain);
  return g;
};
/** river bank with houses, outfall pipes; the river itself is the Env "sea" plane */
export const riverBank = (seed = 0, lit = false) => {
  const g = new THREE.Group();
  const bank = box(400, 2.2, 60, "#7d6a52", 0, -0.7, -32); g.add(bank);
  const mud = box(400, 0.6, 6, "#5d4f3a", 0, -0.4, -1); g.add(mud);
  const walls = ["#c9b9a0", "#b8a890", "#d6c8ae", "#a89a86", "#c0aa8e"], roofs = ["#5a4a42", "#6a5246", "#4a4a52"];
  for (let i = 0; i < 26; i++) {
    const w = 6 + 3 * hh(i, seed), h = 7 + 6 * hh(i, seed + 1), x = -110 + i * 8.6;
    const hs = house(w, 7, h, walls[i % 5], roofs[i % 3], lit); hs.position.set(x, 1.5, -12 - 3 * hh(i, seed + 2) - (i % 2) * 2); g.add(hs);
    // chimney pots
    const ch = box(0.8, 1.6, 0.8, "#7a5a4a", x + w * 0.25, 1.5 + h + 0.6, -12); g.add(ch);
  }
  // outfall pipes poking out of the bank
  const pipes: THREE.Vector3[] = [];
  for (let i = 0; i < 14; i++) {
    const x = -60 + i * 9 + 2 * hh(i, seed + 5);
    const p = cyl(0.45, 0.45, 2.6, "#5a5048", 14); p.rotation.x = Math.PI / 2; p.position.set(x, 0.9, -2.6); g.add(p);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.09, 6, 16), toon("#3a342e")); rim.position.set(x, 0.9, -1.3); g.add(rim);
    pipes.push(new THREE.Vector3(x, 0.9, -1.2));
  }
  (g as any).pipes = pipes;
  return g;
};

// ---------------- Palace of Westminster (stylised) ----------------
const gothicTex = (lit: boolean) => ctex(`gothic_${lit}`, 512, 512, (g) => {
  g.fillStyle = "#d9c49a"; g.fillRect(0, 0, 512, 512);
  for (let c = 0; c < 8; c++) {
    const x = 12 + c * 63;
    g.fillStyle = "#b9a276"; g.fillRect(x - 6, 0, 8, 512);
    for (let r = 0; r < 3; r++) {
      const y = 40 + r * 160;
      g.fillStyle = lit && hh(c * 3 + r) > 0.5 ? "#ffd27a" : "#3a4258";
      g.beginPath(); g.moveTo(x + 6, y + 110); g.lineTo(x + 6, y + 30); g.quadraticCurveTo(x + 24, y, x + 42, y + 30); g.lineTo(x + 42, y + 110); g.closePath(); g.fill();
      g.strokeStyle = "#5a4a32"; g.lineWidth = 5; g.stroke();
    }
  }
}, [4, 1]);
export const clockFace = () => ctex("clockface", 256, 256, (g) => {
  g.fillStyle = "#1e2a3a"; g.fillRect(0, 0, 256, 256);
  g.beginPath(); g.arc(128, 128, 110, 0, 7); g.fillStyle = "#f4ecd2"; g.fill(); g.lineWidth = 12; g.strokeStyle = "#c9a24a"; g.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillStyle = "#1a1a1a"; g.fillRect(128 + 90 * Math.cos(a) - 4, 128 + 90 * Math.sin(a) - 4, 8, 8); }
  g.strokeStyle = "#1a1a1a"; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.moveTo(128, 128); g.lineTo(175, 140); g.stroke();
});
export const parliament = (lit = false) => {
  const g = new THREE.Group();
  g.add(box(400, 1.5, 220, "#8a8070", 0, 0, -100));
  const wall = toon("#ffffff", { map: gothicTex(lit) });
  const main = new THREE.Mesh(new THREE.BoxGeometry(110, 16, 18), wall); main.position.set(0, 8 + 1.5, 0); g.add(main);
  g.add(box(111, 1.2, 19, "#8a7a5a", 0, 17.5, 0));
  for (let i = 0; i < 22; i++) { const p = box(0.8, 3, 0.8, "#c9b48a", -54 + i * 5.14, 18.7, 9); g.add(p); const c = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2, 6), toon("#c9b48a")); c.position.set(-54 + i * 5.14, 22.7, 9); g.add(c); }
  // clock tower
  const tw = new THREE.Group(); tw.position.set(62, 1.5, 4);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(9, 56, 9), wall); shaft.position.y = 28; tw.add(shaft);
  tw.add(box(10.5, 9, 10.5, "#d9c49a", 0, 56, 0));
  for (const [ry, dx, dz] of [[0, 0, 5.3], [Math.PI / 2, 5.3, 0], [Math.PI, 0, -5.3], [-Math.PI / 2, -5.3, 0]] as [number, number, number][]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: clockFace() })); f.position.set(dx, 60.5, dz); f.rotation.y = ry; tw.add(noInk(f));
  }
  tw.add(box(9, 6, 9, "#c9b48a", 0, 65, 0));
  const spire = new THREE.Mesh(new THREE.ConeGeometry(6.6, 18, 4), toon("#3a4a5a")); spire.rotation.y = Math.PI / 4; spire.position.y = 80; tw.add(spire);
  g.add(tw);
  // big square tower at the other end
  const vt = new THREE.Mesh(new THREE.BoxGeometry(14, 70, 14), wall); vt.position.set(-62, 35 + 1.5, -2); g.add(vt);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.2, 6, 6), toon("#c9b48a")); c.position.set(-62 + sx * 6.5, 74.5, -2 + sz * 6.5); g.add(c); }
  // embankment wall along the river
  g.add(box(150, 3, 4, "#9a8f80", 0, -1.5, 11));
  // ink lines need small details: windows of the long wall facing the river are in the texture
  (g as any).windows = [new THREE.Vector3(-20, 9, 9.2), new THREE.Vector3(0, 9, 9.2), new THREE.Vector3(20, 9, 9.2)];
  return g;
};

// ---------------- House of Commons chamber ----------------
const panelTex = () => ctex("panel", 512, 256, (g) => {
  g.fillStyle = "#6a4426"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 8; i++) { g.strokeStyle = "#3e2614"; g.lineWidth = 8; g.strokeRect(i * 64 + 8, 16, 48, 224); g.fillStyle = "rgba(255,210,150,0.08)"; g.fillRect(i * 64 + 14, 22, 36, 30); }
}, [6, 1]);
const benchTex = () => ctex("bench", 256, 64, (g) => {
  g.fillStyle = "#3f7a4a"; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 16; i++) { g.fillStyle = "#2e5e38"; g.beginPath(); g.arc(8 + i * 16, 32, 3, 0, 7); g.fill(); }
}, [8, 1]);
export class Chamber {
  g = new THREE.Group(); curtains: THREE.Mesh[] = [];
  constructor() {
    const g = this.g;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), toon("#7a5a3a")); floor.rotation.x = -Math.PI / 2; g.add(floor);
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5, 50), toon("#2f6a3e")); carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.01; g.add(carpet);
    // tiered green benches on both sides
    for (const s of [-1, 1]) for (let r = 0; r < 4; r++) {
      const x = s * (2.6 + r * 1.4), y = r * 0.55;
      g.add(box(1.6, 0.5 + y, 40, "#5a3a22", x, 0, -6));
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 40), toon("#ffffff", { map: benchTex() })); seat.position.set(x - s * 0.1, 0.5 + y + 0.1, -6); g.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 40), toon("#3f7a4a")); back.position.set(x + s * 0.65, 0.5 + y + 0.5, -6); g.add(back);
    }
    // panelled walls, windows with curtains, gallery
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(60, 6), toon("#ffffff", { map: panelTex(), side: THREE.DoubleSide })); w.position.set(s * 11, 3, -6); w.rotation.y = -s * Math.PI / 2; g.add(w);
      g.add(box(0.6, 7, 60, "#d9c49a", s * 11.3, 6, -6));
      g.add(box(2, 0.3, 60, "#4a2e18", s * 10.2, 6, -6));
      for (let i = 0; i < 5; i++) {
        const z = 10 - i * 8;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.2), glow("#e8dcb8", 1.1)); win.position.set(s * 10.95, 9, z); win.rotation.y = -s * Math.PI / 2; g.add(noInk(win));
        for (const k of [-1, 1]) {
          const c = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 4.8, 1, 6), toon("#8a2a2e", { side: THREE.DoubleSide })); c.position.set(s * 10.85, 8.9, z + k * 1.35); c.rotation.y = -s * Math.PI / 2; g.add(c); this.curtains.push(c);
        }
      }
    }
    // the Speaker's chair and the table with the mace
    g.add(box(2.6, 4.6, 1.6, "#4a2e18", 0, 0, -26)); g.add(box(3, 0.8, 1.8, "#3a2412", 0, 4.6, -26));
    g.add(box(2.2, 1.0, 6, "#5a3a22", 0, 0, -18));
    const mace = cyl(0.08, 0.08, 2.4, "#e8c45a", 8); mace.rotation.x = Math.PI / 2; mace.position.set(0, 1.1, -18); g.add(mace);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(24, 60), toon("#4a2e18", { side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 12, -6); g.add(ceil);
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), glow("#ffd890", 4)); l.position.set(0, 10.5, 6 - i * 9); g.add(noInk(l)); }
  }
  /** soaked curtains sag and swing a little */
  wet(t: number, k: number) { this.curtains.forEach((c, i) => { c.rotation.z = k * 0.04 * Math.sin(t * 2 + i); (c.material as THREE.MeshToonMaterial).color.set(k > 0.5 ? "#6e2024" : "#8a2a2e"); }); }
}

// ---------------- Victorian foggy street ----------------
export const victorianStreet = () => {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 200), toon("#8a8070")); road.rotation.x = -Math.PI / 2; g.add(road);
  for (const s of [-1, 1]) g.add(box(3, 0.25, 200, "#a59a88", s * 6.5, 0, -40));
  const walls = ["#b8a890", "#a89884", "#c4b49a", "#9a8c7a"], roofs = ["#4a4248", "#5a4a42"];
  for (const s of [-1, 1]) for (let i = 0; i < 10; i++) {
    const w = 7 + 2 * hh(i, s + 4), h = 8 + 5 * hh(i, s + 9);
    const hs = house(w, 7, h, walls[(i + (s > 0 ? 1 : 0)) % 4], roofs[i % 2]); hs.position.set(s * 12, 0, 12 - i * 8.2); hs.rotation.y = -s * Math.PI / 2; g.add(hs);
  }
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { // gas lamps
    const p = cyl(0.07, 0.09, 3.6, "#25252c", 6); p.position.set(s * 7.4, 1.8, 6 - i * 14); g.add(p);
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), glow("#ffd890", 3.5)); l.position.set(s * 7.4, 3.75, 6 - i * 14); g.add(noInk(l));
  }
  return g;
};

// ---------------- brick yard ----------------
export const brickYard = () => {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), toon("#8f7a5c")); ground.rotation.x = -Math.PI / 2; g.add(ground);
  const geo = new THREE.BoxGeometry(0.9, 0.3, 0.45), cols = BRICK.map((c) => toon(c));
  // stacks: a growing mountain of bricks, instanced per colour
  for (let ci = 0; ci < cols.length; ci++) {
    const N = 900, inst = new THREE.InstancedMesh(geo, cols[ci], N), m = new THREE.Matrix4();
    let n = 0;
    for (let i = 0; n < N && i < N * 6; i++) {
      const k = i * cols.length + ci, ang = hh(k, 1) * Math.PI * 2, rr = 9 * Math.sqrt(hh(k, 2));
      const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr - 6, top = Math.max(0, 7.5 - rr * 0.8) * (0.85 + 0.15 * hh(k, 3));
      const y = top * hh(k, 4);
      m.makeRotationY(hh(k, 5) * Math.PI); m.setPosition(x, y + 0.15, z); inst.setMatrixAt(n++, m);
    }
    inst.count = n; g.add(inst);
  }
  // crane
  const mast = box(0.5, 16, 0.5, "#6a4a2a", 9, 0, -10); g.add(mast);
  const jib = box(14, 0.4, 0.4, "#6a4a2a", 3, 15.6, -10); g.add(jib);
  for (let i = 0; i < 6; i++) { const hs = house(8, 7, 9 + 3 * hh(i), ["#b8a890", "#a89884"][i % 2], "#4a4248"); hs.position.set(-40 + i * 15, 0, -40); g.add(hs); }
  return g;
};

// ---------------- carriage (for "drive a carriage through") ----------------
export const carriage = () => {
  const g = new THREE.Group();
  g.add(box(1.6, 1.3, 2.4, "#2a2a3a", 0, 0.9, 0));
  g.add(box(1.7, 0.15, 2.5, "#c9a24a", 0, 2.2, 0));
  for (const s of [-1, 1]) for (const z of [-0.85, 0.85]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 6, 18), toon("#c9a24a")); w.rotation.y = Math.PI / 2; w.position.set(s * 0.9, 0.55, z); g.add(w);
  }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), glow("#ffe2a8", 1.6)); win.position.set(0.81, 1.7, 0); win.rotation.y = Math.PI / 2; g.add(noInk(win));
  const win2 = win.clone(); win2.position.x = -0.81; win2.rotation.y = -Math.PI / 2; g.add(win2);
  return g;
};

// ---------------- Embankment cross-section ----------------
/** a vertical cut-away (fits a 9:16 frame): the road on top, the railway box in the middle, the low-level sewer at the
 *  bottom, the granite river wall and the river on the right. Front face at z = 0; everything runs along -z. */
export class Embankment {
  g = new THREE.Group(); train = new THREE.Group(); flow: THREE.Mesh; river!: THREE.Mesh; ROAD = 10.4;
  constructor() {
    const g = this.g, D = 140;
    // the earth: one extruded shape with the two holes cut out (rail box and sewer circle)
    const s = new THREE.Shape(); s.moveTo(-6, -12); s.lineTo(6, -12); s.lineTo(6, 10); s.lineTo(-6, 10); s.lineTo(-6, -12);
    const rail = new THREE.Path(); rail.moveTo(-4.5, 5); rail.lineTo(-4.5, 9); rail.lineTo(4.5, 9); rail.lineTo(4.5, 5); rail.lineTo(-4.5, 5); s.holes.push(rail);
    const sw = new THREE.Path(); sw.absarc(0, 2.6, 1.75, 0, Math.PI * 2, true); s.holes.push(sw);
    const eg = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false, curveSegments: 40 }); eg.translate(0, 0, -D);
    g.add(new THREE.Mesh(eg, toon("#8a6f52")));
    // strata lines painted on the cut face
    const face = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), new THREE.MeshBasicMaterial({ map: ctex("strata", 256, 256, (c) => {
      c.clearRect(0, 0, 256, 256); for (let i = 0; i < 9; i++) { c.strokeStyle = "rgba(60,40,25,0.35)"; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= 256; x += 16) { const y = 20 + i * 28 + 4 * Math.sin(x / 30 + i); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
      for (let i = 0; i < 40; i++) { c.fillStyle = "rgba(70,50,30,0.35)"; c.beginPath(); c.arc(256 * hh(i, 1), 256 * hh(i, 2), 2 + 3 * hh(i, 3), 0, 7); c.fill(); }
    }), transparent: true, depthWrite: false }));
    face.position.set(0, 5, 0.01); g.add(noInk(face));
    // road on top, kerb, gas lamps, the sign
    g.add(box(30, 0.4, D, "#6f6a62", 0, 10, -D / 2));
    g.add(box(1.2, 1.0, D, "#9a8f80", 6.6, 10.4, -D / 2));
    for (let i = 0; i < 9; i++) { const p = cyl(0.07, 0.09, 3.2, "#25252c", 6); p.position.set(6.2, 12.0, -1.5 - i * 12); g.add(p); const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), glow("#ffd890", 3)); l.position.set(6.2, 13.8, -1.5 - i * 12); g.add(noInk(l)); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.85), new THREE.MeshBasicMaterial({ map: signTex("VICTORIA EMBANKMENT", "#1f3f8f", "#f4f1ea") })); sign.position.set(-1.0, 13.3, -3.5); g.add(noInk(sign));
    for (const x of [-3.4, 1.4]) { const sp = cyl(0.06, 0.06, 2.9, "#25252c", 6); sp.position.set(x, 11.85, -3.6); g.add(sp); }
    // granite river wall + river
    g.add(box(1.6, 22.8, D, "#9a8f80", 6.8, -12, -D / 2)); g.add(box(60, 19.5, D, "#5d4f3a", 37.6, -12, -D / 2));
    const river = new THREE.Mesh(new THREE.PlaneGeometry(60, D), new THREE.MeshToonMaterial({ color: "#2a6aa8" })); river.rotation.x = -Math.PI / 2; river.position.set(37.6, 7.5, -D / 2); g.add(river); this.river = river;
    // the sewer: brick tube + flowing channel
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, D, 40, 1, true), toon("#ffffff", { map: brickTex("emb", BRICK, [4, 34]), side: THREE.BackSide }));
    tube.rotation.x = Math.PI / 2; tube.position.set(0, 2.6, -D / 2); g.add(tube);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.2, 8, 40), toon("#b97a42")); ring.position.set(0, 2.6, 0.03); g.add(ring);
    this.flow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, D), toon("#ffffff", { map: flowTex() })); this.flow.rotation.x = -Math.PI / 2; this.flow.position.set(0, 1.35, -D / 2); g.add(this.flow);
    // railway box: brick lining on the walls, rails
    for (const sx of [-1, 1]) { const lining = new THREE.Mesh(new THREE.PlaneGeometry(D, 4), toon("#ffffff", { map: brickTex("rail", BRICK_RED, [28, 1]), side: THREE.DoubleSide })); lining.rotation.y = Math.PI / 2; lining.position.set(sx * 4.49, 7, -D / 2); g.add(lining); }
    for (const x of [-2.6, -1.2, 1.2, 2.6]) g.add(box(0.12, 0.1, D, "#5a5a62", x, 5, -D / 2));
    for (let c = 0; c < 5; c++) {
      const car = new THREE.Group(); car.position.z = -c * 9.2;
      car.add(box(3.2, 3.0, 8.8, "#2f7a4a", 0, 0.25, 0));
      car.add(box(3.3, 0.28, 8.9, "#e9e4d6", 0, 1.9, 0));
      for (let w = 0; w < 4; w++) for (const sx of [-1, 1]) { const wi = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), glow("#fff1c8", 2)); wi.position.set(sx * 1.62, 2.4, -3 + w * 2); wi.rotation.y = sx * Math.PI / 2; car.add(noInk(wi)); }
      if (c === 0) { const front = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), glow("#fff6d8", 2.5)); front.position.set(0, 2.3, 4.42); car.add(noInk(front)); for (const sx of [-1, 1]) { const hl = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), glow("#fff2c0", 6)); hl.position.set(sx * 1.1, 0.9, 4.42); car.add(noInk(hl)); } }
      this.train.add(car);
    }
    this.train.position.set(0, 5.05, -60); g.add(this.train);
  }
  update(t: number, trainZ: number, clean = 1) { (this.flow.material as THREE.MeshToonMaterial).map!.offset.y = -t * 0.4; this.train.position.z = trainZ; (this.river.material as THREE.MeshToonMaterial).color.set("#5e6436").lerp(new THREE.Color("#2a6aa8"), clean); }
}

// ---------------- town from above (west connected, east not yet) ----------------
export const townAerial = () => {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), toon("#8a8070")); ground.rotation.x = -Math.PI / 2; g.add(ground);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(400, 9), toon("#3a4a6a")); river.rotation.x = -Math.PI / 2; river.position.y = 0.04; g.add(river);
  const walls = ["#c9b9a0", "#b8a890", "#d6c8ae", "#a89a86"], roofs = ["#5a4a42", "#6a5246", "#4a4a52", "#7a4a3a"];
  let i = 0;
  for (let gx = -8; gx <= 8; gx++) for (let gz = -5; gz <= 5; gz++) {
    if (gz === 0) continue; // the river runs along z = 0
    const hs = house(8, 8, 6 + 5 * hh(i, 2), walls[i % 4], roofs[i % 4]); hs.position.set(gx * 13 + 2 * hh(i), 0, gz * 13 + 2 * hh(i, 1)); hs.rotation.y = (hh(i, 3) > 0.5 ? 0 : Math.PI / 2); g.add(hs); i++;
  }
  // glowing sewer lines under the west half
  const lineMat = glow("#ff9a3a", 2.2);
  for (let k = -4; k <= 4; k++) { if (k === 0) continue; const l = new THREE.Mesh(new THREE.PlaneGeometry(110, 2.4), lineMat); l.rotation.x = -Math.PI / 2; l.position.set(-55, 0.06, k * 13 - 6.5); g.add(noInk(l)); }
  for (let k = -8; k <= 0; k++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 120), lineMat); l.rotation.x = -Math.PI / 2; l.position.set(k * 13 + 6.5, 0.06, 0); g.add(noInk(l)); }
  return g;
};

// ---------------- modern London ----------------
const glassTex = (col: string) => ctex(`glass_${col}`, 256, 512, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 512);
  for (let r = 0; r < 32; r++) for (let c = 0; c < 8; c++) { g.fillStyle = hh(r * 8 + c, col.length) > 0.7 ? "rgba(255,230,170,0.9)" : "rgba(255,255,255,0.18)"; g.fillRect(c * 32 + 4, r * 16 + 3, 24, 10); }
});
export const modernCity = () => {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), toon("#9a948a")); ground.rotation.x = -Math.PI / 2; g.add(ground);
  const cols = ["#5a7aa8", "#6a8ab0", "#7a8a9a", "#4a6a8a", "#8aa0b8"];
  for (let i = 0; i < 26; i++) {
    const w = 10 + 8 * hh(i), h = 30 + 70 * hh(i, 1), x = -120 + (i % 13) * 20 + 4 * hh(i, 2), z = -40 - Math.floor(i / 13) * 30 - 10 * hh(i, 3);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), toon("#ffffff", { map: glassTex(cols[i % 5]) })); b.position.set(x, h / 2, z); g.add(b);
  }
  // a pointed glass tower and a gherkin-like egg (generic shapes, no landmarks copied exactly)
  const shard = new THREE.Mesh(new THREE.ConeGeometry(12, 120, 4), toon("#ffffff", { map: glassTex("#8aa8c8") })); shard.position.set(40, 60, -90); g.add(shard);
  const egg = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), toon("#ffffff", { map: glassTex("#4a7a8a") })); egg.scale.y = 3; egg.position.set(-30, 28, -80); g.add(egg);
  // pavement + road
  g.add(box(200, 0.25, 8, "#b8b0a2", 0, 0, -6));
  for (let i = 0; i < 10; i++) { const tr = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8), toon("#4f8c55")); tr.position.set(-60 + i * 13, 4.5, -10); g.add(tr); const tk = cyl(0.18, 0.22, 3.2, "#5a4030", 6); tk.position.set(-60 + i * 13, 1.6, -10); g.add(tk); }
  return g;
};
