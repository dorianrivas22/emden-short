// Ships, harbour, lighthouse, streets: simple toon-shaded geometry with painted canvas details.
import * as THREE from "three";
import { toon, glow, ctex, hh, noInk, CFG } from "./lib";

const box = (w: number, h: number, d: number, col: string | THREE.Material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof col === "string" ? toon(col) : col);
  m.position.set(x, y + h / 2, z); return m;
};
const cyl = (r0: number, r1: number, h: number, col: string | THREE.Material, seg = 24) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), typeof col === "string" ? toon(col) : col);
  return m;
};

// ---------------- flags ----------------
export type FlagKind = "de" | "uk" | "ru" | "white";
export const flagTex = (k: FlagKind) => ctex(`flag_${k}`, 300, 200, (g) => {
  g.fillStyle = "#f6f4ee"; g.fillRect(0, 0, 300, 200);
  if (k === "de") {
    g.fillStyle = "#151515"; g.fillRect(0, 88, 300, 24); g.fillRect(118, 0, 24, 200);
    g.beginPath(); g.arc(130, 100, 26, 0, 7); g.fillStyle = "#f6f4ee"; g.fill(); g.lineWidth = 7; g.strokeStyle = "#151515"; g.stroke();
    g.fillStyle = "#151515"; g.fillRect(0, 0, 100, 25); g.fillStyle = "#f6f4ee"; g.fillRect(0, 25, 100, 25); g.fillStyle = "#c8282c"; g.fillRect(0, 50, 100, 25);
  } else if (k === "uk") {
    g.fillStyle = "#c8282c"; g.fillRect(0, 88, 300, 24); g.fillRect(170, 0, 24, 200);
    g.fillStyle = "#1f3f8f"; g.fillRect(0, 0, 130, 88);
    g.strokeStyle = "#f6f4ee"; g.lineWidth = 16; g.beginPath(); g.moveTo(0, 0); g.lineTo(130, 88); g.moveTo(130, 0); g.lineTo(0, 88); g.stroke();
    g.strokeStyle = "#c8282c"; g.lineWidth = 6; g.stroke();
    g.fillStyle = "#f6f4ee"; g.fillRect(52, 0, 26, 88); g.fillRect(0, 31, 130, 26); g.fillStyle = "#c8282c"; g.fillRect(57, 0, 16, 88); g.fillRect(0, 36, 130, 16);
  } else if (k === "ru") {
    g.strokeStyle = "#2a5cb5"; g.lineWidth = 34; g.beginPath(); g.moveTo(0, 0); g.lineTo(300, 200); g.moveTo(300, 0); g.lineTo(0, 200); g.stroke();
  }
  g.strokeStyle = "rgba(0,0,0,0.85)"; g.lineWidth = 8; g.strokeRect(4, 4, 292, 192);
});
export const flag = (k: FlagKind, w = 3) => {
  const geo = new THREE.PlaneGeometry(w, w * 0.66, 12, 1); geo.translate(w / 2, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: flagTex(k), side: THREE.DoubleSide }));
  (m.geometry as THREE.BufferGeometry).setAttribute("p0", (geo.attributes.position as THREE.BufferAttribute).clone());
  return m;
};
/** ripple a flag made by flag() */
export const waveFlag = (m: THREE.Mesh, t: number, k = 1) => {
  const pos = m.geometry.attributes.position as THREE.BufferAttribute, p0 = m.geometry.attributes.p0 as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) { const x = p0.getX(i); pos.setZ(i, k * 0.18 * x * Math.sin(x * 2.2 - t * 7)); }
  pos.needsUpdate = true; m.geometry.computeVertexNormals();
};

// ---------------- ship ----------------
const hullShape = (L: number, B: number) => {
  const s = new THREE.Shape(), h = L / 2;
  s.moveTo(-h, -B * 0.32); s.quadraticCurveTo(-h - 1.6, 0, -h, B * 0.32);
  s.lineTo(-h * 0.6, B / 2); s.lineTo(h * 0.45, B / 2); s.quadraticCurveTo(h * 0.85, B * 0.42, h + 1.5, 0);
  s.quadraticCurveTo(h * 0.85, -B * 0.42, h * 0.45, -B / 2); s.lineTo(-h * 0.6, -B / 2); s.lineTo(-h, -B * 0.32);
  return s;
};
const extrude = (shape: THREE.Shape, depth: number, col: string | THREE.Material, y: number, scale = 1) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 });
  g.rotateX(-Math.PI / 2); g.scale(scale, 1, scale);
  const m = new THREE.Mesh(g, typeof col === "string" ? toon(col) : col); m.position.y = y; return m;
};
/** the fake funnel: vertical wooden planks with grain, dark seams, iron hoops with rivets, a sooty black top */
const fakeTex = () => ctex("fakeFunnelWood", 512, 512, (g) => {
  const cols = ["#a8733f", "#b98450", "#9c6a3a", "#b07a46", "#a36f3d", "#bd8a55", "#9a6636", "#ae7845"];
  const P = 8, w = 512 / P;
  for (let i = 0; i < P; i++) {
    g.fillStyle = cols[i]; g.fillRect(i * w, 0, w, 512);
    // grain: wavy darker and lighter streaks along each plank
    for (let k = 0; k < 7; k++) {
      const x0 = i * w + 6 + ((k * 37 + i * 13) % (w - 12)), amp = 2 + ((k + i) % 3), ph = k * 1.7 + i;
      g.beginPath(); for (let y = 0; y <= 512; y += 8) { const x = x0 + amp * Math.sin(y / 46 + ph); y ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.strokeStyle = k % 3 ? "rgba(70,40,18,0.35)" : "rgba(255,225,170,0.25)"; g.lineWidth = k % 3 ? 2 : 1.5; g.stroke();
    }
    // a knot
    const ky = 120 + ((i * 97) % 300), kx = i * w + w * 0.5;
    g.beginPath(); g.ellipse(kx, ky, 6, 11, 0, 0, 7); g.fillStyle = "rgba(70,38,16,0.7)"; g.fill();
    g.beginPath(); g.ellipse(kx, ky, 11, 19, 0, 0, 7); g.strokeStyle = "rgba(70,38,16,0.4)"; g.lineWidth = 2; g.stroke();
    // plank seam
    g.fillStyle = "#3a2312"; g.fillRect(i * w - 2, 0, 4, 512);
  }
  // iron hoops with rivets
  for (const y of [150, 300, 450]) {
    g.fillStyle = "#4a4d52"; g.fillRect(0, y - 10, 512, 20); g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(0, y - 10, 512, 4);
    g.fillStyle = "#26282c"; for (let x = w / 2; x < 512; x += w) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
  }
  // nails at the top and bottom of each plank
  g.fillStyle = "#2a2a2a"; for (let x = w / 2; x < 512; x += w) for (const y of [80, 500]) { g.beginPath(); g.arc(x - 8, y, 3, 0, 7); g.arc(x + 8, y, 3, 0, 7); g.fill(); }
  // soot-black band at the top, fading down
  const gr = g.createLinearGradient(0, 0, 0, 70); gr.addColorStop(0, "#151515"); gr.addColorStop(0.75, "#1d1a18"); gr.addColorStop(1, "rgba(30,25,20,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 70);
});
const funnelTex = (col: string) => ctex(`funnel${col}`, 64, 256, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 64, 256); g.fillStyle = "#1a1a1a"; g.fillRect(0, 0, 64, 34);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, 34, 64, 6);
});
const nameTex = (name: string) => ctex(`name_${name}`, 512, 128, (g) => {
  g.clearRect(0, 0, 512, 128); g.font = "bold 92px serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#f1e3b0"; g.strokeStyle = "#2a2a2a"; g.lineWidth = 6; g.strokeText(name, 256, 70); g.fillText(name, 256, 70);
});

export type ShipOpts = { funnels: number; fakeAt?: number; hull: string; upper: string; funnel: string; deck?: string; boot?: string; name?: string; flag?: FlagKind | null; L?: number; lit?: boolean };
export class Ship {
  g = new THREE.Group(); funnels: THREE.Object3D[] = []; fake: THREE.Object3D | null = null; flag: THREE.Mesh | null = null; flagPole = new THREE.Group();
  tops: THREE.Vector3[] = []; L: number;
  constructor(o: ShipOpts) {
    const L = (this.L = o.L ?? 60), B = L * 0.135, shape = hullShape(L, B);
    this.g.add(extrude(shape, 5.2, o.hull, -1.5));
    this.g.add(extrude(shape, 0.55, o.boot ?? "#7a2a2a", -0.35, 1.012));
    this.g.add(extrude(hullShape(L * 0.97, B * 0.9), 0.15, o.deck ?? "#b99a6a", 3.7));
    // forecastle + superstructure
    this.g.add(extrude(hullShape(L * 0.34, B * 0.86), 1.4, o.hull, 3.7)).children;
    const fc = this.g.children[this.g.children.length - 1]; fc.position.x = L * 0.31;
    this.g.add(box(L * 0.12, 2.4, B * 0.62, o.upper, L * 0.22, 5.1, 0));
    this.g.add(box(L * 0.07, 1.6, B * 0.5, o.upper, L * 0.22, 7.5, 0));
    const win = glow(o.lit ? "#ffd9a0" : "#2a3442", o.lit ? 2.2 : 1);
    for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45), win); w.position.set(L * 0.22 + L * 0.036, 8.4, -0.9 + i * 0.45); w.rotation.y = Math.PI / 2; this.g.add(noInk(w)); }
    this.g.add(box(L * 0.3, 1.6, B * 0.5, o.upper, -L * 0.02, 3.8, 0));
    this.g.add(box(L * 0.1, 1.5, B * 0.45, o.upper, -L * 0.3, 3.8, 0));
    // guns
    for (const [x, s] of [[L * 0.4, 1], [-L * 0.4, -1], [L * 0.1, 1], [-L * 0.15, -1]] as [number, number][])
      for (const side of x === L * 0.4 || x === -L * 0.4 ? [0] : [-1, 1]) {
        const base = cyl(0.7, 0.8, 0.6, "#5d6670"); base.position.set(x, x === L * 0.4 ? 5.4 : 4.1, side * B * 0.38); this.g.add(base);
        const barrel = cyl(0.13, 0.13, 3, "#3c434b", 10); barrel.rotation.z = Math.PI / 2; barrel.position.set(x + s * 1.6, base.position.y + 0.35, side * B * 0.38); this.g.add(barrel);
      }
    // funnels
    const n = o.funnels, span = L * 0.28, x0 = L * 0.12;
    for (let i = 0; i < n; i++) {
      const x = x0 - (span * i) / Math.max(1, 3 - 1) * (n === 4 ? 0.75 : 1);
      const fake = o.fakeAt === i;
      const f = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 7.5, 24), toon(fake ? "#ffffff" : "#ffffff", { map: fake ? fakeTex() : funnelTex(o.funnel) }));
      f.scale.z = 0.8; f.position.set(x, 5.4 + 3.75, 0);
      if (fake) { f.rotation.z = 0.035; this.fake = f; }
      this.g.add(f); this.funnels.push(f); this.tops.push(new THREE.Vector3(x, 13, 0));
    }
    // masts
    for (const [x, h] of [[L * 0.3, 16], [-L * 0.36, 13]] as [number, number][]) {
      const m = cyl(0.17, 0.25, h, "#6b5a46", 8); m.position.set(x, 3.7 + h / 2, 0); this.g.add(m);
      const yard = cyl(0.09, 0.09, B * 0.9, "#6b5a46", 6); yard.rotation.x = Math.PI / 2; yard.position.set(x, 3.7 + h * 0.78, 0); this.g.add(yard);
    }
    // rigging
    const pts: THREE.Vector3[] = [];
    const fm = new THREE.Vector3(L * 0.3, 19.6, 0), am = new THREE.Vector3(-L * 0.36, 16.6, 0);
    pts.push(fm, new THREE.Vector3(L / 2 + 1.3, 5.2, 0), fm, am, am, new THREE.Vector3(-L / 2 - 1, 4.2, 0));
    for (const s of [-1, 1]) pts.push(fm, new THREE.Vector3(L * 0.27, 3.8, s * B * 0.48), am, new THREE.Vector3(-L * 0.39, 3.8, s * B * 0.48));
    const rig = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: "#2b2b2b" }));
    this.g.add(noInk(rig));
    // portholes
    const ph = glow(o.lit ? "#ffcf8a" : "#1d232c", o.lit ? 2 : 1), phg = new THREE.CircleGeometry(0.22, 10);
    for (let i = 0; i < 16; i++) for (const s of [-1, 1]) {
      const x = -L * 0.38 + (L * 0.76 * i) / 15, zz = s * (B / 2 + 0.02) * (Math.abs(x) > L * 0.3 ? 0.85 : 1);
      const c = new THREE.Mesh(phg, ph); c.position.set(x, 2.1, zz); c.rotation.y = s > 0 ? 0 : Math.PI; this.g.add(noInk(c));
    }
    if (o.name) for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), new THREE.MeshBasicMaterial({ map: nameTex(o.name), transparent: true, fog: true }));
      p.position.set(L * 0.36, 3.1, s * B * 0.44); p.rotation.y = s > 0 ? 0.12 : Math.PI - 0.12; this.g.add(noInk(p));
    }
    // flag on the stern staff
    this.flagPole.position.set(-L / 2 - 0.6, 3.6, 0);
    const pole = cyl(0.06, 0.06, 4.5, "#4a3a2a", 6); pole.position.y = 2.25; this.flagPole.add(pole);
    if (o.flag) { this.flag = flag(o.flag, 2.4); this.flag.position.set(0, 3.9, 0); this.flag.rotation.y = Math.PI; this.flagPole.add(this.flag); }
    this.g.add(this.flagPole);
    this.g.traverse((c) => { (c as THREE.Mesh).castShadow = true; });
  }
  /** flag hoist 0 (down) .. 1 (top) */
  hoist(u: number, t: number) { if (!this.flag) return; this.flag.position.y = 0.6 + 3.3 * u; this.flag.visible = u > 0.02; waveFlag(this.flag, t, 1); }
}

// ---------------- lighthouse ----------------
export const lighthouseTex = () => ctex("lighthouse", 64, 512, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f2ede2" : "#c8343a"; g.fillRect(0, i * 64, 64, 64); }
});
export class Lighthouse {
  g = new THREE.Group(); beam: THREE.Mesh; lamp: THREE.Mesh;
  constructor(lit = true) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(9, 1), toon("#7a7480")); rock.scale.set(1.3, 0.45, 1.1); rock.position.y = 0.5; this.g.add(rock);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, 22, 28), toon("#ffffff", { map: lighthouseTex() })); tower.position.y = 13; this.g.add(tower);
    const gal = cyl(3.2, 3.2, 0.5, "#30343c", 28); gal.position.y = 24.2; this.g.add(gal);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.07, 6, 32), toon("#30343c")); rail.rotation.x = Math.PI / 2; rail.position.y = 25.3; this.g.add(rail);
    this.lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 20), lit ? glow("#ffe6a8", 4) : toon("#cfe3ef")); this.lamp.position.y = 25.6; this.g.add(noInk(this.lamp));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 2.2, 20), toon("#c8343a")); roof.position.y = 27.9; this.g.add(roof);
    const bg = new THREE.ConeGeometry(9, 70, 24, 1, true); bg.translate(0, -35, 0); bg.rotateZ(Math.PI / 2);
    this.beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: "#fff1c8", transparent: true, opacity: lit ? 0.22 : 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    this.beam.position.y = 25.6; this.g.add(noInk(this.beam));
  }
  spin(t: number) { this.beam.rotation.y = t * 0.9; }
}

// ---------------- harbour town ----------------
const roofGeo = (w: number, d: number, h: number) => {
  const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.4, 0); s.lineTo(0, h); s.lineTo(w / 2 + 0.4, 0); s.lineTo(-w / 2 - 0.4, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: d + 0.8, bevelEnabled: false }); g.translate(0, 0, -(d + 0.8) / 2); return g;
};
const wallTex = (col: string, lit: boolean) => ctex(`wall_${col}_${lit}`, 256, 256, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const x = 28 + c * 76, y = 40 + r * 110, on = lit && hh(r * 3 + c, col.length) > 0.4;
    g.fillStyle = on ? "#ffd27a" : "#2c3550"; g.fillRect(x, y, 44, 62);
    g.strokeStyle = "#1a1a1a"; g.lineWidth = 5; g.strokeRect(x, y, 44, 62);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x - 6, y + 62, 56, 7);
  }
});
export const house = (w: number, d: number, h: number, wall: string, roof: string, lit = false) => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon("#ffffff", { map: wallTex(wall, lit) })); body.position.y = h / 2; g.add(body);
  const r = new THREE.Mesh(roofGeo(w, d, h * 0.45), toon(roof)); r.position.y = h; g.add(r);
  return g;
};
export const palm = (h = 9, seed = 1) => {
  const g = new THREE.Group(); let x = 0, y = 0;
  for (let i = 0; i < 6; i++) {
    const seg = cyl(0.32 - i * 0.03, 0.38 - i * 0.03, h / 6, "#8a6a48", 8);
    x += 0.18 * (1 + hh(seed)) * i * 0.3; y += h / 6; seg.position.set(x, y - h / 12, 0); seg.rotation.z = -0.06 * i; g.add(seg);
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + hh(seed, i);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), toon(i % 2 ? "#3f9a4a" : "#2f7d3d"));
    leaf.scale.set(2.8, 0.25, 0.75); leaf.position.set(x + Math.cos(a) * 2.2, y - 0.5, Math.sin(a) * 2.2); leaf.rotation.y = -a; leaf.rotation.z = -0.35;
    g.add(leaf);
  }
  return g;
};
export const harbourTown = (lit: boolean) => {
  const g = new THREE.Group();
  const land = new THREE.Mesh(new THREE.BoxGeometry(260, 3, 70), toon("#c9b48a")); land.position.set(0, -0.2, -60); g.add(land);
  const quay = box(200, 2.6, 6, "#9a958e", 0, -0.3, -24); g.add(quay);
  const walls = ["#e8d6b0", "#f0c9a0", "#cfd9e6", "#e7b8a6", "#f2e6c8", "#d8c6e6"], roofs = ["#b8483a", "#8a3b34", "#c75f3c", "#5a6f8a"];
  for (let i = 0; i < 22; i++) {
    const w = 7 + 4 * hh(i), d = 7 + 3 * hh(i, 1), h = 6 + 6 * hh(i, 2), x = -100 + i * 9.5 + 2 * hh(i, 3), z = -34 - 4 * hh(i, 4) - (i % 3) * 9;
    const hs = house(w, d, h, walls[i % 6], roofs[i % 4], lit); hs.position.set(x, 1.3, z); hs.rotation.y = (hh(i, 5) - 0.5) * 0.2; g.add(hs);
  }
  for (let i = 0; i < 9; i++) { const p = palm(8 + 3 * hh(i, 8), i); p.position.set(-90 + i * 22 + 5 * hh(i), 1.3, -28 - 3 * hh(i, 9)); g.add(p); }
  // hills
  for (let i = 0; i < 6; i++) { const hl = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), toon(i % 2 ? "#3c7a4c" : "#4f8c55")); hl.scale.set(60 + 30 * hh(i), 28 + 20 * hh(i, 1), 30); hl.position.set(-150 + i * 60, -4, -120); g.add(hl); }
  // lamps along the quay
  if (lit) for (let i = 0; i < 12; i++) {
    const post = cyl(0.08, 0.1, 4, "#2a2a30", 6); post.position.set(-90 + i * 16, 4.3, -22); g.add(post);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), glow("#ffd890", 5)); l.position.set(-90 + i * 16, 6.4, -22); g.add(noInk(l));
  }
  const uk = flag("uk", 5); uk.position.set(30, 16, -36); g.add(uk);
  const pole = cyl(0.12, 0.12, 15, "#d0d0d0", 6); pole.position.set(30, 8.8, -36); g.add(pole);
  (g as any).ukFlag = uk;
  return g;
};

// ---------------- street sets (analogies) ----------------
export const signTex = (text: string, bg: string, fg: string, w = 512) => ctex(`sign_${text}_${bg}`, w, 128, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, 128); g.strokeStyle = "#1a1a1a"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, 118);
  g.font = "900 78px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = fg; g.fillText(text, w / 2, 68);
});
export const street = (ground: string, walls: string[], roofs: string[], seed = 0) => {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), toon(ground)); road.rotation.x = -Math.PI / 2; g.add(road);
  for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 9; i++) {
    const w = 7 + 3 * hh(i, seed + side), h = 7 + 5 * hh(i, seed + 3 + side);
    const hs = house(w, 7, h, walls[(i + (side > 0 ? 2 : 0)) % walls.length], roofs[i % roofs.length]);
    hs.position.set(side * 13, 0, -i * 9.5 + 10); hs.rotation.y = -side * Math.PI / 2; g.add(hs);
  }
  return g;
};
export const policeStation = () => {
  const g = new THREE.Group();
  g.add(box(16, 9, 9, "#3d5a8f", 0, 0, 0));
  g.add(box(17, 0.8, 10, "#2a3550", 0, 9, 0));
  const door = box(3, 4.6, 0.3, "#2a2420", 0, 0, 4.55); g.add(door);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: signTex("POLICE", "#f2efe6", "#1f3f8f") })); sign.position.set(0, 6.4, 4.66); g.add(noInk(sign));
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.9), glow("#7fb6ff", 3)); lamp.position.set(0, 8.4, 5.0); g.add(noInk(lamp));
  for (const x of [-5.5, 5.5]) { const w = box(2.6, 2.6, 0.2, "#a8c8e8", x, 3, 4.6); g.add(w); }
  for (const x of [-2, 2]) { const s = box(1.2, 0.5, 1.6, "#bdb7aa", x * 0, -0.2, 5.4); g.add(s); }
  return g;
};
export const stall = () => {
  const g = new THREE.Group();
  g.add(box(4.2, 0.8, 1.8, "#9a6b3e", 0, 0, 0));
  for (const x of [-2, 2]) g.add(box(0.14, 2.8, 0.14, "#6b4a2a", x, 0, -0.8));
  const aw = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.2, 1, 1), toon("#ffffff", { map: ctex("awning", 256, 128, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#f4ead6" : "#e0533a"; c.fillRect(i * 32, 0, 32, 128); } }), side: THREE.DoubleSide }));
  aw.position.set(0, 3.0, -0.1); aw.rotation.x = -1.1; g.add(aw);
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), toon(i % 3 ? "#f2a22a" : "#e8c02e")); m.scale.y = 0.8; m.position.set(-1.7 + (i % 9) * 0.42 + 0.1 * hh(i), 0.95, -0.4 + 0.3 * hh(i, 2)); g.add(m); }
  return g;
};

// ---------------- deck set (hook) ----------------
export const plankTex = () => ctex("planks", 512, 512, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = ["#c79a62", "#bb8f58", "#d0a46a", "#c09157"][i % 4]; g.fillRect(0, i * 64, 512, 64); g.fillStyle = "#3a2618"; g.fillRect(0, i * 64, 512, 4); }
  for (let i = 0; i < 16; i++) { g.fillStyle = "#3a2618"; g.fillRect(((i * 197) % 512), Math.floor(i / 2) * 64, 4, 64); }
}, [4, 4]);
export class DeckSet {
  g = new THREE.Group(); frame = new THREE.Group(); canvas: THREE.Mesh; real: THREE.Mesh[] = [];
  constructor() {
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), toon("#ffffff", { map: plankTex() })); deck.rotation.x = -Math.PI / 2; this.g.add(deck);
    for (let i = 0; i < 21; i++) { const p = cyl(0.05, 0.05, 1.1, "#d8d8d8", 6); p.position.set(-20 + i * 2, 0.55, 7.6); this.g.add(p); }
    const rail = cyl(0.06, 0.06, 40, "#d8d8d8", 6); rail.rotation.z = Math.PI / 2; rail.position.set(0, 1.1, 7.6); this.g.add(rail);
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 11, 28), toon("#ffffff", { map: funnelTex("#9aa3ad") })); f.scale.z = 0.8; f.position.set(9 - i * 6.5, 5.5, -1.5); this.g.add(f); this.real.push(f);
    }
    // the fake funnel: wooden battens + hoops, then canvas wraps round
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const b = box(0.16, 11, 0.16, "#b98b52", Math.cos(a) * 1.7, 0, Math.sin(a) * 1.36); this.frame.add(b); }
    for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.07, 6, 30), toon("#a07a48")); r.rotation.x = Math.PI / 2; r.scale.y = 0.8; r.position.y = 1.5 + k * 3; this.frame.add(r); }
    this.frame.position.set(-10.5, 0, -1.5); this.g.add(this.frame);
    this.canvas = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.82, 11, 28, 1, true, 0, Math.PI * 2), toon("#ffffff", { map: fakeTex(), side: THREE.DoubleSide }));
    this.canvas.scale.z = 0.8; this.canvas.position.set(-10.5, 5.5, -1.5); this.g.add(this.canvas);
    const crate = box(1.4, 1.0, 1.0, "#a37a4a", -6.5, 0, 2.5); this.g.add(crate);
    const roll = cyl(0.4, 0.4, 1.6, "#e6dcc4", 14); roll.rotation.z = Math.PI / 2; roll.position.set(-6.5, 1.4, 2.5); this.g.add(roll);
  }
  /** canvas wrap progress 0..1 */
  wrap(u: number) {
    const g = this.canvas.geometry as THREE.CylinderGeometry;
    const want = Math.max(0.01, u) * Math.PI * 2;
    if (Math.abs(g.parameters.thetaLength - want) > 1e-3) { this.canvas.geometry.dispose(); this.canvas.geometry = new THREE.CylinderGeometry(1.78, 1.82, 11, 28, 1, true, -Math.PI / 2, want); }
    this.canvas.visible = u > 0.01;
  }
}
