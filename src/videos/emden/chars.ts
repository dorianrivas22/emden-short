// Flat cartoon characters and 2D effect cards as camera-facing billboards (drawn with the skill's toon.ts Pen).
import * as THREE from "three";
import { Pen, bodyFront, Outfit, Expr, FrontOpts, INK, fxBurst, fxPuff, fxSplash, SKINS } from "../bridge/toon";
import { NOINK, hh } from "./lib";

export const SU = 0.00216; // metres per design unit (1000 units = 2.16 m)

// ---------------- outfits ----------------
export const SAILOR = (v = 0): Outfit => ({ jacket: v % 2 ? "#f4f2ec" : "#e9e6dd", pants: "#2c3a63", boots: INK, hat: "cap", cap: "#1d2747", skin: SKINS[v % 4], buttons: "#2c3a63", moustache: v % 3 === 1 ? "#4a3426" : undefined });
export const CAPTAIN: Outfit = { jacket: "#1f2a4d", pants: "#1f2a4d", boots: INK, hat: "cap", cap: "#151c33", buttons: "#e8c45a", moustache: "#6b4a2e", build: "stout", skin: SKINS[0] };
export const GUARD = (v = 0): Outfit => ({ jacket: "#b59a64", pants: "#7d6a46", boots: "#4a3426", hat: "cap", cap: "#e9e1cc", belt: "#5a4026", skin: SKINS[(v + 2) % 4], moustache: v % 2 ? "#3a2a1a" : undefined });
export const RUSSIAN = (v = 0): Outfit => ({ jacket: "#f2f0ea", pants: "#1d2a52", boots: INK, hat: "cap", cap: "#f4f4f4", skin: SKINS[v % 4] });
export const RUS_CAPTAIN: Outfit = { jacket: "#22305a", pants: "#22305a", boots: INK, hat: "cap", cap: "#f4f4f4", buttons: "#e8c45a", moustache: "#c9a46a", build: "stout", skin: SKINS[1] };
export const POLICE = (v = 0): Outfit => ({ jacket: "#22305a", pants: "#22305a", boots: INK, hat: "shako_tall", buttons: "#d9dde0", skin: SKINS[v % 4], moustache: v ? "#3a2a1a" : undefined });
export const ROBBER: Outfit = { jacket: "#2a2a2e", pants: "#2a2a2e", boots: INK, hat: "cap", cap: "#1a1a1e", skin: "#1f1f24" };
export const CROWD = (v: number): Outfit => {
  const coats = ["#8c8f9a", "#7d8a8f", "#9a8c7d", "#6f7d8f", "#8f7d86", "#7f8a77"];
  return { jacket: coats[v % 6], pants: "#4a4d58", boots: "#3a2f28", hat: v % 3 === 0 ? "tophat" : "cap", cap: ["#55606e", "#6d5f52", "#4f5a52"][v % 3], skin: SKINS[v % 4] };
};
export const FRIEND_RED: Outfit = { jacket: "#3f6fb5", pants: "#3b3f52", boots: "#4a3426", hat: "cap", cap: "#e0302c", skin: SKINS[1] };
export const TAMIL = (v: number): Outfit => {
  const c = ["#f2a22a", "#2f9a8f", "#d9446a", "#6a5acd", "#e8c02e"];
  return { jacket: c[v % 5], pants: ["#f4efe2", "#3b3f52", "#8a3b34"][v % 3], boots: "#5a3b2a", hat: v % 2 ? "hair" : "cap", hair: "#1e1714", cap: "#f4efe2", skin: ["#b97a4e", "#a86a42", "#c98b5e", "#8f5a38"][v % 4] };
};
export const KID_T: Outfit = { jacket: "#f2a22a", pants: "#2f5f9a", boots: "#5a3b2a", hat: "hair", hair: "#1e1714", skin: "#b97a4e", build: "kid" };

// ---------------- texture cache ----------------
type Ent = { tex: THREE.CanvasTexture; used: number };
const cache = new Map<string, Ent>();
let tick = 0;
const draw = (key: string, w: number, h: number, k: number, fn: (p: Pen) => void) => {
  let e = cache.get(key);
  if (!e) {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d")!; g.setTransform(k, 0, 0, k, 0, 0); fn(new Pen(g));
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    e = { tex, used: 0 }; cache.set(key, e);
    if (cache.size > 260) { // drop the least recently used
      const old = [...cache.entries()].sort((a, b) => a[1].used - b[1].used).slice(0, 60);
      for (const [kk, v] of old) { v.tex.dispose(); cache.delete(kk); }
    }
  }
  e.used = ++tick;
  return e.tex;
};

const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (500 - 975) * SU * -1, 0); return g; })();
const UNIT = new THREE.PlaneGeometry(1, 1);

/** a pool of billboard meshes reset every frame */
export class Cast {
  root = new THREE.Group(); private bodies: THREE.Mesh[] = []; private cards: THREE.Mesh[] = []; private nb = 0; private nc = 0;
  tint = new THREE.Color("#ffffff");
  private camPos = new THREE.Vector3();
  begin(cam: THREE.Camera, tint: string) {
    this.nb = this.nc = 0; this.camPos.copy(cam.position); this.tint.set(tint);
    for (const m of this.bodies) m.visible = false;
    for (const m of this.cards) m.visible = false;
  }
  private yawTo(m: THREE.Object3D) { m.rotation.set(0, Math.atan2(this.camPos.x - m.position.x, this.camPos.z - m.position.z), 0); }
  /** a character standing at (x,y,z); res = canvas scale vs the 600x1000 design */
  person(o: Outfit, key: string, x: number, y: number, z: number, opts: FrontOpts & { scale?: number; res?: number; mirror?: boolean; face?: (p: Pen) => void }) {
    const res = opts.res ?? 0.9, blink = opts.blink ? 1 : 0;
    const k = [key, opts.expr, opts.mode, blink, opts.look, opts.wave?.toFixed(2), opts.phase?.toFixed(2), opts.tilt?.toFixed(1), opts.headTilt?.toFixed(1), JSON.stringify(opts.prop ?? null), opts.facing, res].join("|");
    const tex = draw(k, Math.round(600 * res), Math.round(1000 * res), res, (p) => { bodyFront(p, o, { light: (-120 * Math.PI) / 180, ...opts, blink: opts.blink }); opts.face?.(p); });
    let m = this.bodies[this.nb++];
    if (!m) { m = new THREE.Mesh(BODY, new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.DoubleSide, fog: true })); m.layers.set(NOINK); m.renderOrder = 1; this.bodies.push(m); this.root.add(m); }
    const mat = m.material as THREE.MeshBasicMaterial; mat.map = tex; mat.color.copy(this.tint); mat.needsUpdate = mat.map !== tex;
    m.position.set(x, y, z); this.yawTo(m); const s = opts.scale ?? 1; m.scale.set(opts.mirror ? -s : s, s, s); m.visible = true;
    return m;
  }
  /** an unlit effect card (w x h metres) facing the camera; flat = lying on the ground */
  card(key: string, cw: number, ch: number, fn: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, o: { flat?: boolean; rot?: number; soft?: boolean; tint?: boolean } = {}) {
    const tex = draw(`fx|${key}|${cw}x${ch}`, cw, ch, 1, fn);
    let m = this.cards[this.nc++];
    if (!m) { m = new THREE.Mesh(UNIT, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, fog: false })); m.layers.set(NOINK); m.renderOrder = 2; this.cards.push(m); this.root.add(m); }
    const mat = m.material as THREE.MeshBasicMaterial; mat.map = tex;
    mat.transparent = !!o.soft; mat.alphaTest = o.soft ? 0 : 0.5; mat.depthWrite = !o.soft; mat.color.set(o.tint ? this.tint : "#ffffff"); mat.needsUpdate = true;
    m.position.set(x, y, z);
    if (o.flat) m.rotation.set(-Math.PI / 2, 0, o.rot ?? 0); else { this.yawTo(m); m.rotateZ(o.rot ?? 0); }
    m.scale.set(w, h, 1); m.visible = true;
    return m;
  }
}

// ---------------- custom drawings ----------------
export const blinkAt = (t: number, i: number) => { const per = 1.4 + 1.6 * hh(i, 9), ph = (t + hh(i, 4) * per) % per; return ph < 0.13; };
export const numDraw = (n: string, col = "#ffd43b") => (p: Pen) => {
  const g = p.g; g.font = "900 230px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round"; g.lineWidth = 34; g.strokeStyle = INK; g.strokeText(n, 150, 160); g.fillStyle = col; g.fillText(n, 150, 160);
};
export const zzzDraw = (p: Pen) => {
  const g = p.g; g.font = "900 120px sans-serif"; g.textAlign = "center"; g.lineJoin = "round";
  [["Z", 80, 250, 1], ["z", 170, 160, 0.8], ["z", 240, 80, 0.6]].forEach(([s, x, y, k]) => { g.save(); g.translate(x as number, y as number); g.scale(k as number, k as number); g.lineWidth = 22; g.strokeStyle = INK; g.strokeText(s as string, 0, 0); g.fillStyle = "#ffffff"; g.fillText(s as string, 0, 0); g.restore(); });
};
export const smokeDraw = (seed: number, col = "#d9d6e4") => (p: Pen) => {
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + seed, r = 60 + 25 * hh(i, seed); p.ell(150 + 55 * Math.cos(a), 150 + 45 * Math.sin(a), r, r * 0.85, col, 9); }
  p.ell(150, 150, 70, 60, col, 0);
};
export const flashDraw = (t: number) => (p: Pen) => fxBurst(p, t, "#ffe27a", 12, 50, 240);
export const puffDraw = (t: number) => (p: Pen) => fxPuff(p, t);
export const splashDraw = (t: number) => (p: Pen) => fxSplash(p, t);
export const qDraw = (p: Pen) => {
  const g = p.g; g.font = "900 240px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 30; g.strokeStyle = INK; g.strokeText("?", 150, 160); g.fillStyle = "#ffffff"; g.fillText("?", 150, 160);
};
/** a ski mask pulled over the head (drawn after the body on the same canvas) */
export const skiMask = (p: Pen) => {
  p.ell(300, 300, 130, 150, "#1c1c22", 12);
  p.ell(300, 175, 36, 30, "#e0302c", 8);
  p.ell(255, 300, 32, 20, "#ffe2c2", 6); p.ell(345, 300, 32, 20, "#ffe2c2", 6);
  p.dot(262, 302, 9); p.dot(338, 302, 9);
  p.ell(300, 375, 34, 16, "#ffe2c2", 6); p.stroke([[282, 377], [318, 377]], 5);
};
/** a telescope held at the eye */
export const scope = (p: Pen) => { p.poly([[330, 280], [520, 230], [530, 270], [340, 318]], "#b88a3a", 10); p.ell(527, 250, 14, 22, "#2a2a30", 6); };
/** a paint brush / hammer is in toon.ts; a map scroll for the captain */
export const pointArm = (p: Pen) => { p.stroke([[390, 470], [560, 400]], 12); p.dot(565, 398, 14); };
