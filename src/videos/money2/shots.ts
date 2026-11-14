// "The Money Stove" v2: shot list on the kit engine, timed to public/money2_words_en.json.
// Every shot = keyed camera path (+ the kit's living-camera layer), a look (light preset, may change inside the shot)
// and a pose function that places characters and prop cards. Targets: research/GUIA_NUMERICA_20.md.
import * as THREE from "three";
import { LOOKS, LookName, mixLook, Look } from "../kit/look";
import { live, applyCam, Cam } from "../kit/camera";
import { Cast2, style, toque, bun, topHat, flatCap, bigMoustache, pencilMoustache, bowtie, glasses, sweat, apron, all } from "../kit/cast";
import { blinkAt } from "../emden/chars";
import { Bakery, Street } from "./sets";
import { Kitchen, Office, PrintHall } from "./sets2";
import {
  bundleDraw, priceDraw, tagDraw, barrowDraw, towerDraw, loafDraw, pizzaDraw, sliceDraw, debtDraw, scaleDraw,
  fireDraw, qMark, flyNote, trillionDraw, holdBundle, pencil, bulbDraw, noteDraw,
} from "./props2d";
import WORDS_EN from "../../../public/money2_words_en.json";
import type { Frame, KitWorld, Rig } from "../kit/Stage";

export const FPS = 30;
type W = { w: string; s: number; e: number };
export const WORDS: W[] = WORDS_EN as W[];
const SENT: number[] = (() => { const st = [0]; WORDS.forEach((w, i) => { if (/[.?]$/.test(w.w) && i < WORDS.length - 1) st.push(WORDS[i + 1].s); }); return st; })();
export const VOICE_END = WORDS[WORDS.length - 1].e;
export const DUR = 63.59 + 0.35;
export const FRAMES = Math.round(DUR * FPS);
export const at = (n: number, f = 0) => { const a = SENT[n], b = n + 1 < SENT.length ? SENT[n + 1] : DUR; return a + f * (b - a); };
export const word = (n: number, k: number) => { const i = WORDS.findIndex((w) => w.s >= SENT[n] - 1e-3); return WORDS[Math.min(WORDS.length - 1, i + k)].s; };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const glide = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const spring = (x: number) => { const u = clamp01(x); return 1 - Math.exp(-6 * u) * Math.cos(9 * u); };
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
type V3 = [number, number, number];
const lv = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
type Key = { u: number; pos: V3; look: V3; fov: number; roll?: number };
const path = (keys: Key[]) => (u: number): Cam => {
  let i = 0; while (i < keys.length - 1 && u > keys[i + 1].u) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], k = b === a ? 0 : glide((u - a.u) / (b.u - a.u));
  return { pos: lv(a.pos, b.pos, k), look: lv(a.look, b.look, k), fov: a.fov + (b.fov - a.fov) * k, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * k };
};

// ---------------- cast (channel style: white heads, ink stick limbs, one silhouette feature each) ----------------
const WOMAN = style({ jacket: "#7a3a52", pants: "#2a2a30", hat: null, dress: "#9a3a5a" });
const NEIGHBOR = style({ jacket: "#3a5a3a", pants: "#3a3530", hat: null, buttons: "#c9a24a" });
const BAKER = style({ jacket: "#f2efe8", pants: "#3a3a44", hat: null, build: "stout", buttons: "#c9c2b0" });
const WORKER = (v: number) => style({ jacket: ["#4a5a6a", "#6a4a3a", "#5a6a4a", "#4a4a5a"][v % 4], pants: "#3a3530", hat: null });
const KID = (v: number) => style({ jacket: ["#c8502c", "#3a6ac8", "#e8b43a"][v % 3], pants: ["#3a3a50", "#5a4a3a", "#2a3a4a"][v % 3], hat: null, build: "kid" });
const DAD = style({ jacket: "#5a6a8a", pants: "#3a3a40", hat: null });
const OFFICIAL = style({ jacket: "#2a2e3a", pants: "#2a2e3a", hat: null, build: "stout", buttons: "#c9a24a" });
const PRINTER = (v: number) => style({ jacket: ["#8a7a5a", "#6a7a7a"][v % 2], pants: "#3a3530", hat: null });
const capCol = (c: string) => (p: Parameters<typeof flatCap>[0]) => { flatCap(p); void c; };

export type Shot = { n: number; w?: number; look: LookName; look2?: LookName; lk?: [number, number]; cam: (u: number) => Cam; dof?: number; xfade?: number; flash?: boolean;
  kw?: [number, number][]; liveO?: Parameters<typeof live>[3]; set: "kitchen" | "street" | "bakery" | "office" | "hall";
  pose: (w: World, t: number, u: number) => void };

// ---------------- shots ----------------
export const SHOTS: Shot[] = [
  // 0 HOOK: she throws a bundle of money into the stove; flames burst on "stove"
  { n: 0, set: "kitchen", look: "interior", dof: 6,
    cam: path([{ u: 0, pos: [0.55, 1.5, 1.4], look: [0.45, 1.05, -1.9], fov: 46 }, { u: 1, pos: [0.6, 1.35, 0.6], look: [0.6, 0.9, -1.9], fov: 44 }]),
    pose: (w, t) => {
      const ts = word(0, 8); // "stove"
      const throwK = clamp01((t - (ts - 0.6)) / 0.45);
      w.kitchen.set(t, 1, t > ts - 0.05 ? 1 : 0.55);
      w.cast.stand(WOMAN, "wom", -0.05, 0, -1.45, t, { expr: t > ts ? "smile" : "neutral", blink: blinkAt(t, 1), wave: throwK > 0 && throwK < 1 ? 0.3 : undefined, face: throwK < 0.05 ? all(bun, holdBundle) : bun });
      if (throwK > 0.05 && throwK < 1) { const k = easeOut(throwK); w.cast.card("bn0", 300, 200, bundleDraw(0), 0.1 + 0.8 * k, 0.95 - 0.5 * k + 0.25 * Math.sin(k * Math.PI), -1.3 - 0.6 * k, 0.42, 0.28, { rot: -2 * k }); }
      fire(w, t, t > ts - 0.05 && t < ts + 0.7 ? Math.sin(clamp01((t - ts + 0.05) / 0.75) * Math.PI) : 0);
    } },
  // 1 "because it was cheaper than buying firewood": insert on the wood box, the tags pop
  { n: 0, w: 9, set: "kitchen", look: "interior", dof: 5, xfade: 5,
    cam: path([{ u: 0, pos: [-0.3, 1.2, -1.05], look: [-0.45, 0.66, -2.4], fov: 46 }, { u: 1, pos: [-0.35, 1.1, -1.3], look: [-0.45, 0.66, -2.4], fov: 44 }]),
    pose: (w, t) => {
      w.kitchen.set(t, 1, 0.9);
      const tc = word(0, 12); // "cheaper"
      w.cast.card("bnw", 300, 200, bundleDraw(1), -0.05, 0.64, -2.1, 0.36, 0.24, { rot: 0.1 });
      const k1 = spring((t - (tc - 0.35)) / 0.5), k2 = spring((t - (tc - 0.05)) / 0.5);
      if (k1 > 0) w.cast.card("tagLog", 600, 260, tagDraw("2.000.000 M"), -0.55, 0.95, -2.2, 0.48 * k1, 0.21 * k1, { rot: 0.12 });
      if (k2 > 0) w.cast.card("tagBn", 600, 260, tagDraw("1.000 M"), -0.03, 0.82, -2.05, 0.3 * k2, 0.13 * k2, { rot: -0.1 });
    } },
  // 2 "You see, this is Germany in 1923": out through the window to Berlin, golden afternoon, a busy street
  { n: 1, set: "street", look: "golden", dof: 2, xfade: 6, liveO: { truck: 0.4 },
    cam: path([{ u: 0, pos: [-1, 9, 16], look: [0, 4, -6], fov: 50 }, { u: 1, pos: [-0.5, 3.0, 11], look: [0.5, 1.8, 0], fov: 48 }]),
    pose: (w, t, u) => {
      crowd(w, t, 22, 0);
      w.cast.card("berlin", 1000, 260, (p) => { const g = p.g; g.fillStyle = "#7a2a22"; g.fillRect(0, 0, 1000, 260); g.strokeStyle = "#e8c45a"; g.lineWidth = 14; g.strokeRect(10, 10, 980, 240); g.fillStyle = "#f4e2b8"; g.font = "900 120px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("BERLIN 1923", 500, 136); }, 0, 5.4, -1, 3.6 * smooth(u * 3), 0.94 * smooth(u * 3));
    } },
  // 3 "...and money is losing its value faster than anyone can spend it": a man counts a bundle, the shop price flips behind him
  { n: 1, w: 7, set: "street", look: "golden", dof: 7, xfade: 5,
    cam: path([{ u: 0, pos: [-5.0, 1.75, 4.4], look: [-7.6, 1.6, 1.2], fov: 44 }, { u: 1, pos: [-5.4, 1.7, 3.6], look: [-7.8, 1.65, 1.2], fov: 42 }]),
    pose: (w, t, u) => {
      const k = Math.floor(u * 7), prices = ["800 M", "2.400 M", "9.000 M", "35.000 M", "140.000 M", "600.000 M", "2.000.000 M"];
      w.cast.card(`pw${k}`, 1200, 420, priceDraw(prices[Math.min(6, k)], k > 4 ? 1 : 0), -8.2, 2.1, 0.6, 1.2, 0.42);
      w.cast.stand(WORKER(2), "counter", -7.3, 0.18, 2.2, t, { expr: u < 0.5 ? "nervous" : "shock", blink: blinkAt(t, 4), wave: 0.4 + 0.3 * Math.sin(t * 14), face: all(flatCap, holdBundle, u > 0.5 ? sweat : (p) => p) });
      crowd(w, t, 8, 1);
    } },
  // 4 "At the end of 1922, a loaf of bread in Berlin cost about 160 marks": inside the bakery, the board says 160 M
  { n: 2, set: "bakery", look: "interior", dof: 5, xfade: 6,
    cam: path([{ u: 0, pos: [0.6, 2.3, 4.4], look: [0, 2.0, -1.6], fov: 48 }, { u: 1, pos: [0.4, 2.2, 3.0], look: [0, 2.15, -1.8], fov: 46 }]),
    pose: (w, t) => {
      const tp = word(2, 13); // "160"
      board(w, t > tp - 0.1 ? "160 M" : "", 0);
      w.cast.stand(BAKER, "bak", 0.25, 0, -1.8, t, { expr: "smile", blink: blinkAt(t, 1), face: all(apron, toque, bigMoustache), wave: t > tp - 0.2 ? 0.5 : undefined });
      w.cast.stand(WOMAN, "womB", -0.9, 0, 0.1, t, { expr: "neutral", blink: blinkAt(t, 2), face: bun, mirror: true });
      w.cast.stand(WORKER(1), "custB", 1.2, 0, 0.6, t, { expr: "smile", blink: blinkAt(t, 3), face: flatCap });
    } },
  // 5 "By September, the same loaf cost one and a half million": push to the board, light turns golden
  { n: 3, set: "bakery", look: "interior", look2: "golden", lk: [0.1, 0.9], dof: 4, xfade: 5,
    cam: path([{ u: 0, pos: [0.4, 2.7, 2.6], look: [0, 2.9, -2.6], fov: 46 }, { u: 1, pos: [0.3, 2.75, 1.7], look: [0, 3.0, -2.6], fov: 44 }]),
    pose: (w, t) => {
      const t0 = word(3, 1), tm = word(3, 10); const k = clamp01((t - t0) / (tm - t0));
      const v = k >= 1 ? 1500000 : Math.round(160 * Math.pow(1500000 / 160, smooth(k)) / 10) * 10;
      board(w, v.toLocaleString("de-DE") + " M", k >= 1 ? 1 : 0);
      w.cast.stand(BAKER, "bak", 0.25, 0, -1.8, t, { expr: k < 0.6 ? "stern" : "nervous", blink: blinkAt(t, 1), face: all(apron, toque, bigMoustache, k > 0.7 ? sweat : (p) => p) });
    } },
  // 6 "...and by November, two hundred billion": faster push, roll, kick on "billion"; the baker goes dizzy
  { n: 3, w: 11, set: "bakery", look: "golden", look2: "dusk", lk: [0, 0.8], dof: 4, kw: [[3, 16]], liveO: { roll: 1.4 },
    cam: path([{ u: 0, pos: [0.3, 2.75, 1.7], look: [0, 3.0, -2.6], fov: 44 }, { u: 1, pos: [0.2, 2.75, 0.9], look: [0, 2.95, -2.6], fov: 46, roll: 4 }]),
    pose: (w, t) => {
      const t0 = word(3, 11), tb = word(3, 16); const k = clamp01((t - t0) / (tb - t0));
      const v = k >= 1 ? 200000000000 : Math.round(1500000 * Math.pow(200000000000 / 1500000, smooth(k)) / 1000) * 1000;
      board(w, v.toLocaleString("de-DE") + " M", 1);
      w.cast.stand(BAKER, "bak", 0.25, 0, -1.8, t, { expr: t > tb - 0.05 ? "dazed" : "shock", tilt: t > tb ? -12 * easeOut((t - tb) / 0.4) : 0, face: all(apron, toque, bigMoustache, sweat) });
    } },
  // 7 "Workers get paid": a pay window, bundles handed out
  { n: 4, set: "street", look: "golden", dof: 6, xfade: 5,
    cam: path([{ u: 0, pos: [3.4, 1.7, 6.2], look: [6.6, 1.5, 3.2], fov: 46 }, { u: 1, pos: [3.6, 1.65, 5.4], look: [6.8, 1.5, 3.0], fov: 44 }]),
    pose: (w, t, u) => {
      for (let k = 0; k < 4; k++) { const got = u * 4 > k; w.cast.stand(WORKER(k), `pay${k}`, 6.4 - 0.2 * k, 0.18, 3.6 + 1.1 * k, t, { expr: got ? "grin" : "neutral", blink: blinkAt(t, k + 5), face: got ? all(flatCap, holdBundle) : flatCap }); }
      w.cast.card("paysign", 1000, 240, (p) => { const g = p.g; g.fillStyle = "#2a3a2a"; g.fillRect(0, 0, 1000, 240); g.fillStyle = "#f4e2b8"; g.font = "900 110px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LOHNKASSE", 500, 126); }, 7.9, 2.8, 2.8, 1.6, 0.38);
    } },
  // 8 "push their wages home in wheelbarrows": tracking with the barrows
  { n: 4, w: 3, set: "street", look: "golden", dof: 2, xfade: 5, liveO: { truck: 0.2 },
    cam: path([{ u: 0, pos: [-3.0, 1.6, 7.4], look: [-1.6, 1.0, -1], fov: 48 }, { u: 1, pos: [0.8, 1.6, 7.4], look: [1.8, 1.0, -1], fov: 48 }]),
    pose: (w, t, u) => {
      for (let i = 0; i < 4; i++) {
        const x = -3.2 + 3.6 * u + 0.9 * i - 0.3, z = 1.6 - 2.4 * i, ph = (t * 1.7 + i * 0.37) % 1;
        w.cast.stand(WORKER(i), `wk${i}`, x, 0, z, t, { mode: "stroll", phase: ph, expr: (["stern", "nervous", "whistle", "smile"] as const)[i], res: 0.8, face: flatCap });
        w.cast.card(`bar${Math.floor(ph * 4)}_${i}`, 600, 400, barrowDraw(ph), x + 0.85, 0.52 + 0.02 * Math.sin(ph * 6.28 * 2), z + 0.35, 1.45, 0.97);
      }
      crowd(w, t, 10, 2);
    } },
  // 9 "and run straight to the shops before the prices change again": a rush into the bakery, the window tag flips
  { n: 4, w: 8, set: "street", look: "golden", dof: 3, xfade: 4,
    cam: path([{ u: 0, pos: [-3.6, 2.0, 6.6], look: [-7.6, 1.5, 1.0], fov: 48 }, { u: 1, pos: [-4.6, 1.9, 4.6], look: [-8.0, 1.6, 0.6], fov: 46 }]),
    pose: (w, t, u) => {
      for (let i = 0; i < 6; i++) { const ph = (t * 2.6 + i * 0.29) % 1, k = (u * 1.3 + i * 0.12) % 1; w.cast.stand(WORKER(i), `run${i}`, -3.5 - 4.2 * k, 0.18, 3.5 - 2.0 * k + 0.4 * (i % 2), t, { mode: "march", phase: ph, expr: "shock", res: 0.7, face: all(flatCap, holdBundle) }); }
      const f = Math.floor(u * 6); w.cast.card(`pw2${f}`, 1200, 420, priceDraw(["3 Mio M", "5 Mio M", "9 Mio M", "14 Mio M", "22 Mio M", "40 Mio M"][f % 6], 1), -8.2, 2.1, 0.6, 1.2, 0.42);
    } },
  // 10 "Kids stack bundles of cash like building blocks": a tower in the street, it wobbles
  { n: 5, set: "street", look: "golden", dof: 5, xfade: 5,
    cam: path([{ u: 0, pos: [0.3, 1.05, 3.4], look: [0, 1.15, 0], fov: 46 }, { u: 1, pos: [0.4, 1.3, 2.6], look: [0, 1.5, 0], fov: 46 }]),
    pose: (w, t) => {
      const n = Math.min(12, 4 + Math.floor(clamp01((t - at(5)) / 1.8) * 8));
      w.cast.card(`tw${n}_${Math.round(Math.sin(t * 5) * 10)}`, 300, 700, towerDraw(n, 0.05 * Math.sin(t * 5)), 0, 0.86, 0, 0.74, 1.72);
      w.cast.stand(KID(0), "k0", -0.6, 0, 0.3, t, { expr: "grin", wave: 0.5 + 0.5 * Math.sin(t * 4), face: (p) => p });
      w.cast.stand(KID(1), "k1", 0.62, 0, -0.2, t, { expr: "laugh", face: holdBundle });
      w.cast.stand(KID(2), "k2", 1.3, 0, -1.4, t, { expr: "smile", wave: 1 });
      crowd(w, t, 8, 3);
    } },
  // 11 "...and some families even paper their walls with it": the kitchen's right wall turns into money
  { n: 5, w: 8, set: "kitchen", look: "interior", dof: 4, xfade: 6,
    cam: path([{ u: 0, pos: [-0.8, 1.8, 1.8], look: [3.5, 1.6, -1.4], fov: 48 }, { u: 1, pos: [-0.8, 1.8, 2.8], look: [3.5, 1.6, 0.6], fov: 48 }]),
    pose: (w, t, u) => {
      const pk = 0.15 + 0.6 * u; w.kitchen.set(t, 0, 0.5, pk); const ez = -2.9 + 6 * pk;
      w.cast.stand(DAD, "dad", 3.0, 0.15, ez + 0.1, t, { expr: "whistle", blink: blinkAt(t, 6), wave: 0.6 + 0.4 * Math.sin(t * 7), face: pencilMoustache });
      w.cast.stand(WOMAN, "wom11", 2.85, 0, ez + 1.1, t, { expr: "smile", blink: blinkAt(t, 1), face: all(bun, holdBundle) });
    } },
  // 12 "Her neighbor laughs and goes, why are you burning money?": the neighbour in the doorway, laughing
  { n: 6, set: "kitchen", look: "interior", dof: 6, xfade: 5,
    cam: path([{ u: 0, pos: [0.2, 1.65, 1.7], look: [1.4, 1.5, -2.0], fov: 46 }, { u: 1, pos: [0.4, 1.65, 1.1], look: [1.6, 1.5, -2.0], fov: 44 }]),
    pose: (w, t, u) => {
      w.kitchen.set(t, 1, 0.9);
      w.cast.stand(NEIGHBOR, "nb", 2.3, 0, -2.2, t, { expr: u < 0.45 ? "laugh" : "grin", blink: blinkAt(t, 7), tilt: 6 * Math.sin(t * 12) * (u < 0.45 ? 1 : 0), face: all(flatCap, bigMoustache) });
      w.cast.stand(WOMAN, "wom12", 0.0, 0, -1.4, t, { expr: "stern", blink: blinkAt(t, 1), face: bun, mirror: true });
      fire(w, t, 0);
    } },
  // 13 "She just points at the price tag on the firewood": whip from her to the tag
  { n: 7, set: "kitchen", look: "interior", dof: 6, xfade: 4, liveO: { truck: 0.3 },
    cam: path([{ u: 0, pos: [0.3, 1.6, 1.1], look: [0.0, 1.4, -1.4], fov: 46 }, { u: 0.45, pos: [0.3, 1.6, 1.0], look: [0.0, 1.4, -1.4], fov: 46 }, { u: 0.7, pos: [-0.3, 1.25, -1.1], look: [-0.5, 0.85, -2.4], fov: 44 }, { u: 1, pos: [-0.32, 1.2, -1.3], look: [-0.5, 0.88, -2.4], fov: 42 }]),
    pose: (w, t, u) => {
      w.kitchen.set(t, 1, 0.9);
      w.cast.stand(WOMAN, "wom13", 0.0, 0, -1.4, t, { expr: "smile", blink: blinkAt(t, 1), wave: 0.15, face: bun });
      w.cast.card("tagLog2", 600, 260, tagDraw("2.000.000 M"), -0.55, 0.95, -2.2, 0.48, 0.21, { rot: 0.12 + 0.08 * Math.sin(t * 6) });
      void u;
    } },
  // 14 "Fair point.": the neighbour, deadpan
  { n: 8, set: "kitchen", look: "interior", dof: 5, xfade: 3,
    cam: path([{ u: 0, pos: [1.9, 1.65, -0.6], look: [2.3, 1.55, -2.2], fov: 42 }, { u: 1, pos: [1.95, 1.62, -0.85], look: [2.3, 1.55, -2.2], fov: 40 }]),
    pose: (w, t, u) => { w.kitchen.set(t, 1, 0.9); w.cast.stand(NEIGHBOR, "nb", 2.3, 0, -2.2, t, { expr: u < 0.5 ? "neutral" : "smile_closed", blink: u > 0.3 && u < 0.4, face: all(flatCap, bigMoustache) }); } },
  // 15 "So where was all this money coming from?": dusk street, a question mark, tilt to the sky
  { n: 9, set: "street", look: "dusk", dof: 3, xfade: 6,
    cam: path([{ u: 0, pos: [-1.0, 1.65, 7.4], look: [-1.8, 1.5, 4.0], fov: 46 }, { u: 0.45, pos: [-1.0, 1.65, 7.1], look: [-1.8, 1.6, 4.0], fov: 46 }, { u: 1, pos: [-1.0, 1.5, 7.6], look: [-2.2, 7.0, -6], fov: 50 }]),
    pose: (w, t) => {
      w.cast.stand(WOMAN, "wom15", -1.8, 0, 4.0, t, { expr: "nervous", headTilt: 8, blink: blinkAt(t, 1), face: bun });
      const k = easeOut((t - word(9, 1) + 0.08) / 0.2); if (k > 0) w.cast.card("q", 300, 300, qMark, -1.2, 2.7, 4.0, 0.6 * k, 0.6 * k);
      crowd(w, t, 6, 4);
    } },
  // 16 FLASH -> night office: "The government owed huge debts"
  { n: 10, set: "office", look: "interiorNight", flash: true, dof: 6,
    cam: path([{ u: 0, pos: [0.3, 1.8, 2.6], look: [0.1, 1.5, -1.8], fov: 46 }, { u: 1, pos: [0.2, 1.75, 1.4], look: [0.1, 1.5, -1.8], fov: 44 }]),
    pose: (w, t) => { w.office.sky("#2a4a8a", 1.0); w.cast.stand(OFFICIAL, "off", -0.25, 0, -2.3, t, { expr: "nervous", blink: blinkAt(t, 8), face: all(pencilMoustache, glasses, bowtie("#f4ead0", "#2a2a6a"), sweat) }); w.cast.card("debt", 600, 600, debtDraw, 0.6, 1.36, -1.2, 0.85, 0.85); } },
  // 17 "so it did the easiest thing it could think of": a light-bulb grin
  { n: 10, w: 5, set: "office", look: "interiorNight", dof: 5, xfade: 4,
    cam: path([{ u: 0, pos: [-0.2, 1.75, 0.3], look: [-0.25, 1.6, -2.3], fov: 42 }, { u: 1, pos: [-0.2, 1.72, -0.2], look: [-0.25, 1.6, -2.3], fov: 40 }]),
    pose: (w, t, u) => {
      w.office.sky("#2a4a8a", 1.0);
      w.cast.stand(OFFICIAL, "off", -0.25, 0, -2.3, t, { expr: u > 0.45 ? "grin" : "stern", blink: blinkAt(t, 8), face: all(pencilMoustache, glasses, bowtie("#f4ead0", "#2a2a6a")) });
      if (u > 0.45) { const k = easeOut((u - 0.45) / 0.15); w.cast.card("bulb", 300, 300, bulbDraw, -0.2, 2.75, -2.25, 0.6 * k, 0.6 * k); }
    } },
  // 18 "and printed more money, day and night": the print hall, notes streaming at the lens, windows flicker
  { n: 10, w: 15, set: "hall", look: "night", dof: 3, xfade: 5, liveO: { truck: 0.3 },
    cam: path([{ u: 0, pos: [0.4, 1.6, -0.3], look: [0, 1.4, -3.2], fov: 46 }, { u: 1, pos: [0.5, 2.8, 5.5], look: [0, 1.8, -3.4], fov: 50 }]),
    pose: (w, t, u) => {
      const day = u > 0.55 ? 0.5 + 0.5 * Math.sin((t - word(10, 17)) * Math.PI * 3) : 0;
      w.hall.set(t * 11, day, 0); notes(w, t, 18, 1.2); printers(w, t);
    } },
  // 19 "Think of a pizza.": top-down on the kitchen table at night
  { n: 11, set: "kitchen", look: "interiorNight", dof: 0, xfade: 6, liveO: { truck: 0, orbit: 6 },
    cam: path([{ u: 0, pos: [-0.6, 2.35, 1.12], look: [-0.6, 0.86, 1.0], fov: 44 }, { u: 1, pos: [-0.6, 2.2, 1.1], look: [-0.6, 0.86, 1.0], fov: 44 }]),
    pose: (w, t) => { w.kitchen.set(t, 0, 0.3); w.cast.card("pz1", 600, 600, pizzaDraw(1), -0.6, 0.89, 1.0, 0.7, 0.7, { flat: true, rot: 0.05 * t }); } },
  // 20 "Cut it into eight slices or eight hundred, and it's still the same pizza"
  { n: 12, set: "kitchen", look: "interiorNight", dof: 0, liveO: { truck: 0, orbit: 6 },
    cam: path([{ u: 0, pos: [-0.6, 2.2, 1.1], look: [-0.6, 0.86, 1.0], fov: 44 }, { u: 1, pos: [-0.6, 2.05, 1.1], look: [-0.6, 0.86, 1.0], fov: 44, roll: 6 }]),
    pose: (w, t) => {
      w.kitchen.set(t, 0, 0.3);
      const e1 = word(12, 3), e2 = word(12, 6);
      let n = 1; if (t > e1 - 0.08) n = Math.min(8, 2 + Math.floor((t - e1 + 0.08) * 20)); if (t > e2 - 0.08) n = Math.min(800, 8 * Math.pow(100, clamp01((t - e2 + 0.08) / 0.4)));
      n = Math.round(n); w.cast.card(`pz${n}`, 600, 600, pizzaDraw(n), -0.6, 0.89, 1.0, 0.7, 0.7, { flat: true, rot: 0.05 * t });
    } },
  // 21 "every slice just gets thinner": one slice lifts, see-through
  { n: 12, w: 13, set: "kitchen", look: "interiorNight", dof: 0, liveO: { truck: 0, orbit: 6 },
    cam: path([{ u: 0, pos: [-0.6, 2.05, 1.1], look: [-0.6, 0.86, 1.0], fov: 44, roll: 6 }, { u: 1, pos: [-0.6, 1.6, 1.35], look: [-0.6, 1.0, 0.9], fov: 42, roll: 9 }]),
    pose: (w, t, u) => {
      w.kitchen.set(t, 0, 0.3); const k = smooth((u - 0.15) / 0.5);
      w.cast.card(`pzh${k > 0 ? 1 : 0}`, 600, 600, pizzaDraw(800, k > 0 ? 1 : -1), -0.6, 0.89, 1.0, 0.7, 0.7, { flat: true, rot: 0.05 * t });
      if (k > 0) w.cast.card("slice", 400, 600, sliceDraw, -0.6, 0.95 + 0.28 * k, 0.86, 0.13, 0.2, { soft: true, rot: 0.1 * Math.sin(t * 3) });
    } },
  // 22 "That's exactly what happened to every mark in Germany": a 1000-mark note on the table goes see-through
  { n: 13, set: "kitchen", look: "interiorNight", dof: 6, xfade: 5,
    cam: path([{ u: 0, pos: [-0.4, 1.45, 1.9], look: [-0.6, 1.05, 1.0], fov: 42 }, { u: 1, pos: [-0.45, 1.35, 1.6], look: [-0.6, 1.05, 1.0], fov: 40 }]),
    pose: (w, t, u) => {
      w.kitchen.set(t, 0, 0.3); const a = 1 - 0.7 * smooth((u - 0.3) / 0.5);
      const m = w.cast.card(`note${Math.round(a * 10)}`, 600, 300, (p) => { p.g.globalAlpha = a; noteDraw("1000", "MARK")(p); }, -0.6, 1.08, 1.0, 0.56, 0.28, { soft: true, rot: 0.04 * Math.sin(t * 2) });
      m.position.y += 0.03 * Math.sin(t * 2.4);
    } },
  // 23 FLASH -> pink dawn: "Then, in November, they tried something almost funny"
  { n: 14, set: "office", look: "dawn", flash: true, dof: 7,
    cam: path([{ u: 0, pos: [0.0, 1.75, 1.8], look: [0.0, 1.55, -2.3], fov: 44 }, { u: 1, pos: [0.0, 1.7, 1.0], look: [0.0, 1.55, -2.3], fov: 42 }]),
    pose: (w, t, u) => { w.office.sky("#f2a8a0", 1.4); w.cast.stand(OFFICIAL, "off", -0.1, 0, -2.3, t, { expr: u > 0.55 ? "grin" : "smile_closed", blink: blinkAt(t, 8), wave: 0.8, face: all(pencilMoustache, glasses, bowtie("#f4ead0", "#2a2a6a"), pencil) }); } },
  // 24 "They printed brand new money, crossed out twelve zeros": the zeros struck through one by one
  { n: 15, set: "office", look: "dawn", dof: 0, xfade: 5,
    cam: path([{ u: 0, pos: [0.0, 1.62, 0.75], look: [0, 1.3, -1.3], fov: 44 }, { u: 1, pos: [0.0, 1.56, 0.5], look: [0, 1.3, -1.3], fov: 44 }]),
    pose: (w, t) => { w.office.sky("#f2a8a0", 1.4); const k = Math.floor(12 * clamp01((t - word(15, 6) + 0.1) / 1.0)); w.cast.card(`tri${k}`, 1200, 600, trillionDraw(k), 0, 1.3, -1.3, 0.84, 0.42); } },
  // 25 "and one trillion old marks became one new mark": the balance settles level
  { n: 15, w: 10, set: "office", look: "dawn", dof: 5,
    cam: path([{ u: 0, pos: [0.0, 1.56, 0.5], look: [0, 1.3, -1.3], fov: 44 }, { u: 1, pos: [0.3, 1.75, 1.9], look: [0.1, 1.45, -1.6], fov: 46 }]),
    pose: (w, t) => {
      w.office.sky("#f2a8a0", 1.4); const ts = word(15, 14);
      const tilt = t < ts ? 0.42 : 0.42 * (1 - spring((t - ts) / 0.9));
      w.cast.card(`sc${Math.round(tilt * 60)}`, 900, 700, scaleDraw(tilt), 0, 1.3, -1.3, 0.9, 0.7);
      w.cast.stand(OFFICIAL, "off", -0.75, 0, -2.2, t, { expr: t > ts + 0.6 ? "grin" : "stern", blink: blinkAt(t, 8), face: all(pencilMoustache, glasses, bowtie("#f4ead0", "#2a2a6a")) });
    } },
  // 26 "And it worked": back in the kitchen, a real log goes into the stove
  { n: 16, set: "kitchen", look: "interior", dof: 6, xfade: 5,
    cam: path([{ u: 0, pos: [0.55, 1.5, 1.4], look: [0.45, 1.05, -1.9], fov: 46 }, { u: 1, pos: [0.6, 1.4, 0.9], look: [0.55, 0.95, -1.9], fov: 44 }]),
    pose: (w, t, u) => {
      w.kitchen.set(t, 1, 0.9);
      w.cast.stand(WOMAN, "wom26", -0.05, 0, -1.45, t, { expr: "smile_closed", blink: blinkAt(t, 1), wave: u < 0.7 ? 0.3 : undefined, face: bun });
      const k = easeOut(u / 0.7); w.kitchen.log.visible = u < 0.95; w.kitchen.log.position.set(0.15 + 0.75 * k, 0.95 - 0.5 * k, -1.35 - 0.55 * k);
      fire(w, t, 0);
    } },
  // 27 STING "because this time, they promised to do the one thing that actually mattered": dark hall, push to the lever
  { n: 16, w: 3, set: "hall", look: "night", dof: 6, xfade: 5, kw: [[16, 3]], liveO: { roll: 1.4, truck: 0.2 },
    cam: path([{ u: 0, pos: [3.2, 1.9, 2.8], look: [1.4, 1.5, -2.4], fov: 46 }, { u: 1, pos: [2.3, 1.7, 0.8], look: [1.4, 1.45, -2.4], fov: 42, roll: 4 }]),
    pose: (w, t) => { w.hall.set(t * 10, 0, 0); notes(w, t, 10, 1); w.cast.stand(OFFICIAL, "off", 1.9, 0, -2.0, t, { expr: "stern", blink: blinkAt(t, 8), wave: 0.15, face: all(pencilMoustache, glasses, bowtie("#f4ead0", "#2a2a6a")) }); } },
  // 28 "Stop printing.": the lever snaps on "Stop", the rollers halt, the last note lands on "printing"
  { n: 17, set: "hall", look: "night", dof: 6, kw: [[17, 0]], liveO: { truck: 0.1, push: 0.05 },
    cam: path([{ u: 0, pos: [2.3, 1.7, 0.8], look: [1.4, 1.45, -2.4], fov: 42, roll: 4 }, { u: 1, pos: [2.2, 1.65, 0.5], look: [1.35, 1.4, -2.4], fov: 42 }]),
    pose: (w, t) => {
      const ts = word(17, 0) - 0.05, tp = word(17, 1);
      const lk = t < ts ? 0 : spring((t - ts) / 0.25), stopT = ts + 0.15;
      const spin = t < stopT ? t * 10 : stopT * 10 + 2 * (1 - Math.exp(-(t - stopT) * 6));
      w.hall.set(spin, 0, lk);
      w.cast.stand(OFFICIAL, "off", 1.9, 0, -2.0, t, { expr: t < ts ? "stern" : "smile_closed", blink: blinkAt(t, 8), wave: t < ts ? 0.15 : 0.05, face: all(pencilMoustache, glasses, bowtie("#f4ead0", "#2a2a6a")) });
      const k = clamp01((t - ts) / Math.max(0.3, tp + 0.3 - ts));
      w.cast.card("last", 300, 150, flyNote(1), 1.0 + 0.15 * Math.sin(k * 7), 2.3 - 1.45 * smooth(k), -2.3 + 0.3 * k, 0.32, 0.16, { rot: k < 1 ? 0.5 * Math.sin(k * 9) : 0 });
    } },
];
void capCol; void topHat; void at;

// ---------------- helpers ----------------
function fire(w: World, t: number, burst: number) {
  w.cast.card(`fire${Math.floor(t * 10) % 6}`, 300, 300, fireDraw(Math.floor(t * 10) / 10), 0.9, 0.45 + 0.2 * burst, -1.95, 0.44 + 0.4 * burst, 0.42 + 0.6 * burst, { soft: true });
}
function board(w: World, text: string, hot: number) { if (text) w.cast.card(`pb${text}`, 1200, 420, priceDraw(text, hot), 0, 3.5, -2.93, 1.9, 0.66); }
/** passers-by in the street, depth-staggered, walking both ways */
function crowd(w: World, t: number, n: number, seed: number) {
  for (let k = 0; k < n; k++) {
    const dir = hh(k, seed) > 0.5 ? 1 : -1, z = 30 - ((hh(k, seed + 2) * 60 + t * 1.1 * dir) % 60 + 60) % 60, x = (hh(k, seed + 4) - 0.5) * 8;
    w.cast.stand(WORKER(k + seed), `cr${seed}_${k}`, x, 0, z, t, { mode: "stroll", phase: (t * 1.5 + hh(k, 9)) % 1, expr: (["neutral", "stern", "smile", "nervous"] as const)[k % 4], res: 0.5, face: k % 3 ? flatCap : bun, mirror: dir < 0 });
  }
}
function notes(w: World, t: number, n: number, sp: number) {
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.9 * sp + i / n) % 1, x = (hh(i, 1) - 0.5) * 1.6 * ph, y = 1.4 + 1.2 * Math.sin(ph * Math.PI) * hh(i, 2), z = -2.9 + 4.5 * ph;
    w.cast.card(`fn${i % 3}`, 300, 150, flyNote(i), x, y, z, 0.32, 0.16, { rot: ph * 6 * (hh(i, 3) - 0.5) });
  }
  for (let p = 0; p < 3; p++) for (let i = 0; i < 6; i++) w.cast.card(`pile${i % 3}`, 300, 150, flyNote(i + p), -3.4 + p * 3.4 + (hh(i, p) - 0.5) * 0.9, 0.84 + 0.03 * i, -2.3 + (hh(i, p + 4) - 0.5) * 0.5, 0.32, 0.16, { flat: true, rot: hh(i, p) * 3 });
}
function printers(w: World, t: number) {
  w.cast.stand(PRINTER(0), "pr0", -2.5, 0, -1.5, t, { expr: "stern", blink: blinkAt(t, 9), wave: 0.5 + 0.5 * Math.sin(t * 6), res: 0.8, face: all(flatCap, apron) });
  w.cast.stand(PRINTER(1), "pr1", 2.5, 0, -1.4, t, { expr: "nervous", blink: blinkAt(t, 10), wave: 0.5 + 0.5 * Math.sin(t * 6 + 2), res: 0.8, face: all(flatCap, apron) });
}

// ---------------- timeline ----------------
export const shotStart = (i: number) => (SHOTS[i].w !== undefined ? word(SHOTS[i].n, SHOTS[i].w!) - 0.05 : at(SHOTS[i].n));
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? shotStart(i + 1) : DUR);
export const shotAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && t >= shotStart(i + 1)) i++; return i; };
export const layersAt = (f: number): { i: number; alpha: number }[] => {
  const t = f / FPS, i = shotAt(t), n = SHOTS[i].xfade;
  if (n && i > 0) { const k = (f - Math.round(shotStart(i) * FPS)) / n; if (k < 1) return [{ i: i - 1, alpha: 1 }, { i, alpha: smooth(k) }]; }
  return [{ i, alpha: 1 }];
};
export const flashAt = (f: number) => {
  let v = 0;
  SHOTS.forEach((s, i) => { if (!s.flash) return; const df = f - Math.round(shotStart(i) * FPS); if (df >= 0 && df < 6) v = Math.max(v, [0.9, 0.7, 0.5, 0.32, 0.16, 0.06][df]); });
  return v;
};
const kickAt = (i: number, t: number) => {
  let s = 0; for (const [n, k] of SHOTS[i].kw ?? []) { const df = Math.round((t - word(n, k)) * FPS); if (df >= 0 && df < 7) s += (df % 2 ? -1 : 1) * (1 - df / 7) * 0.25; }
  return s;
};

// ---------------- world ----------------
export class World implements KitWorld {
  root = new THREE.Group(); cast = new Cast2();
  kitchen = new Kitchen(); street = new Street(); bakery = new Bakery(); office = new Office(); hall = new PrintHall();
  private sets: Record<Shot["set"], THREE.Object3D>;
  constructor() {
    this.sets = { kitchen: this.kitchen.g, street: this.street.g, bakery: this.bakery.g, office: this.office.g, hall: this.hall.g };
    this.root.add(...Object.values(this.sets), this.cast.root);
  }
  update(i: number, t: number, cam: THREE.PerspectiveCamera, _scene: THREE.Scene, _rig: Rig): Frame {
    const s = SHOTS[i], a = shotStart(i), b = shotEnd(i), u = clamp01((t - a) / Math.max(0.01, b - a));
    const L: Look = s.look2 ? mixLook(LOOKS[s.look], LOOKS[s.look2], smooth((u - (s.lk?.[0] ?? 0)) / ((s.lk?.[1] ?? 1) - (s.lk?.[0] ?? 0)))) : LOOKS[s.look];
    const c = live(s.cam(u), t - a, i, s.liveO);
    applyCam(cam, c, kickAt(i, t));
    for (const [k, o] of Object.entries(this.sets)) o.visible = k === s.set;
    this.kitchen.log.visible = false; this.bakery.tick(t); this.street.lamps.visible = !(i === 3 || i === 7 || i === 9);
    this.cast.begin(cam, L.cardTint);
    s.pose(this, t, u);
    // floating dust / paper specks drifting through the light: something always moves (guide: object motion ~7 px/frame)
    const tgt = new THREE.Vector3(...c.look), cp = new THREE.Vector3(...c.pos), d = tgt.clone().sub(cp);
    for (let k = 0; k < 26; k++) {
      const f = 0.55 + 0.4 * hh(k, 3), ph = t * (0.15 + 0.25 * hh(k, 4)) + hh(k, 5);
      const p = cp.clone().addScaledVector(d, f).add(new THREE.Vector3((hh(k, 6) - 0.5) * 2.4 * f + 0.3 * Math.sin(ph * 2.1), ((ph % 1) - 0.5) * 2.2 * f, (hh(k, 7) - 0.5) * 0.6));
      this.cast.card(`dust${k % 3}`, 32, 32, (pn) => { const g = pn.g; const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,244,220,0.55)"); gr.addColorStop(1, "rgba(255,244,220,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }, p.x, p.y, p.z, 0.008 + 0.008 * hh(k, 8), 0.008 + 0.008 * hh(k, 8), { soft: true });
    }
    return { target: tgt, look: L, dof: (s.dof ?? 0) * 0.7, shadowR: s.set === "street" ? 18 : 9 };
  }
}
