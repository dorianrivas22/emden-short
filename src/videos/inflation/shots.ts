// "The Money Stove": every shot is tied to a sentence of the narration (see inflation/PLAN.md).
import * as THREE from "three";
import { V3, MoodDef, glide, lv, smooth, clamp01, hh, easeOut } from "../emden/lib";
import { Env } from "../emden/env";
import { Cast, blinkAt } from "../emden/chars";
import { fxBurst } from "../bridge/toon";
import { Kitchen, BerlinStreet, Bakery, Office, PrintHall } from "./sets";
import {
  WOMAN, BAKER, WORKER, KIDO, DAD, MUM, OFFICIAL, PRINTER, toque, apron, sweat, pencil, holdBundle, both,
  bundleDraw, trillionDraw, priceDraw, tagDraw, barrowDraw, towerDraw, kiteDraw, clockDraw, loafDraw, pizzaDraw, sliceDraw,
  debtDraw, scaleDraw, fireDraw, qMark, flyNote,
} from "./cast";
import WORDS_EN from "../../../public/inflation_words_en.json";

export const FPS = 30;
type W = { w: string; s: number; e: number };
export const WORDS: W[] = WORDS_EN as W[];
const SENT: number[] = (() => { const st = [0]; WORDS.forEach((w, i) => { if (/[.?]$/.test(w.w) && i < WORDS.length - 1) st.push(WORDS[i + 1].s); }); return st; })();
export const VOICE_DUR = 56.76; // the wav length: the video is exactly as long as the voice
export const FRAMES = Math.round(VOICE_DUR * FPS);
export const at = (n: number, f = 0) => { const a = SENT[n], b = n + 1 < SENT.length ? SENT[n + 1] : VOICE_DUR; return a + f * (b - a); };
/** start time of word k of sentence n */
export const word = (n: number, k: number) => { const i = WORDS.findIndex((w) => w.s >= SENT[n] - 1e-3); return WORDS[Math.min(WORDS.length - 1, i + k)].s; };

// ---------------- moods ----------------
const base = { seaNear: "#000", seaFar: "#000", crest: "#000", stars: 0, disc: 0 };
export type Mood = "kitchen" | "street" | "golden" | "dusk" | "bakery" | "bakeryGold" | "bakeryRed" | "night" | "hall" | "dawn";
export const MOODS: Record<Mood, MoodDef> = {
  kitchen: { ...base, skyTop: "#5a3a22", skyHor: "#7a5434", fogNear: 30, fogFar: 120, sun: "#ffd8a0", sunI: 2.0, sunDir: [-0.7, 0.6, 0.4], amb: "#c0a080", ambI: 1.1, tint: "#fff0dc", grade: [1.05, 1, 0.92] } as MoodDef,
  street: { ...base, skyTop: "#5f8fd0", skyHor: "#e8e2cc", fogNear: 60, fogFar: 260, sun: "#fff4dc", sunI: 2.4, sunDir: [-0.5, 0.8, 0.4], amb: "#b8bcc8", ambI: 1.1, tint: "#ffffff", grade: [1, 1, 1] } as MoodDef,
  golden: { ...base, skyTop: "#6a7ab8", skyHor: "#ffc880", fogNear: 50, fogFar: 240, sun: "#ffc890", sunI: 2.3, sunDir: [-0.8, 0.35, 0.3], amb: "#a890a8", ambI: 1.05, tint: "#ffe8cc", disc: 1, grade: [1.06, 1, 0.9] } as MoodDef,
  dusk: { ...base, skyTop: "#2a2f6a", skyHor: "#d98a6a", fogNear: 40, fogFar: 220, sun: "#ffa880", sunI: 1.6, sunDir: [-0.8, 0.3, -0.3], amb: "#6a62a8", ambI: 1.2, tint: "#e8c8d8", stars: 0.2, grade: [1, 0.96, 1.05] } as MoodDef,
  bakery: { ...base, skyTop: "#6a5a3a", skyHor: "#8a7a5a", fogNear: 30, fogFar: 120, sun: "#fff4dc", sunI: 2.1, sunDir: [-0.4, 0.8, 0.6], amb: "#c8c0b0", ambI: 1.15, tint: "#ffffff", grade: [1, 1, 1] } as MoodDef,
  bakeryGold: { ...base, skyTop: "#6a4a2a", skyHor: "#8a6a3a", fogNear: 30, fogFar: 120, sun: "#ffc070", sunI: 2.2, sunDir: [-0.8, 0.4, 0.5], amb: "#b89870", ambI: 1.05, tint: "#ffe2bc", grade: [1.08, 1, 0.86] } as MoodDef,
  bakeryRed: { ...base, skyTop: "#4a2228", skyHor: "#6a3030", fogNear: 30, fogFar: 120, sun: "#ff8a6a", sunI: 1.9, sunDir: [-0.9, 0.3, 0.4], amb: "#8a5a7a", ambI: 1.05, tint: "#f4c8c8", grade: [1.08, 0.94, 0.94] } as MoodDef,
  night: { ...base, skyTop: "#0e1630", skyHor: "#1c2a4a", fogNear: 30, fogFar: 140, sun: "#9ab0e8", sunI: 1.2, sunDir: [0.5, 0.7, 0.4], amb: "#4a5a8a", ambI: 1.1, tint: "#c8d4f0", grade: [0.94, 0.98, 1.08] } as MoodDef,
  hall: { ...base, skyTop: "#101830", skyHor: "#202c48", fogNear: 30, fogFar: 140, sun: "#a8b8e8", sunI: 1.1, sunDir: [0.4, 0.8, 0.5], amb: "#4a5a88", ambI: 1.15, tint: "#d0d8f0", grade: [0.94, 0.98, 1.08] } as MoodDef,
  dawn: { ...base, skyTop: "#7a6ab0", skyHor: "#f2a8a0", fogNear: 30, fogFar: 140, sun: "#ffc0b0", sunI: 2.0, sunDir: [0.6, 0.4, 0.6], amb: "#b098c0", ambI: 1.15, tint: "#ffe4e4", grade: [1.04, 0.98, 1.0] } as MoodDef,
};
const lerpMood = (a: MoodDef, b: MoodDef, k: number): MoodDef => {
  const c = (x: string, y: string) => "#" + new THREE.Color(x).lerp(new THREE.Color(y), k).getHexString();
  const n = (x: number, y: number) => x + (y - x) * k;
  return { ...a, skyTop: c(a.skyTop, b.skyTop), skyHor: c(a.skyHor, b.skyHor), sun: c(a.sun, b.sun), amb: c(a.amb, b.amb), tint: c(a.tint, b.tint),
    sunI: n(a.sunI, b.sunI), ambI: n(a.ambI, b.ambI), fogNear: n(a.fogNear, b.fogNear), fogFar: n(a.fogFar, b.fogFar),
    sunDir: [n(a.sunDir[0], b.sunDir[0]), n(a.sunDir[1], b.sunDir[1]), n(a.sunDir[2], b.sunDir[2])] } as MoodDef;
};

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Key = { u: number; pos: V3; look: V3; fov: number; roll?: number };
const path = (keys: Key[], creep = 0.05) => (u: number): Cam => {
  let i = 0; while (i < keys.length - 1 && u > keys[i + 1].u) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b === a ? 0 : glide((u - a.u) / (b.u - a.u));
  const pos = lv(a.pos, b.pos, k), look = lv(a.look, b.look, k);
  return { pos: lv(pos, look, Math.min(0.3, creep * u)), look, fov: a.fov + (b.fov - a.fov) * k, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * k };
};

export type Shot = { n: number; w?: number; kw?: number[]; mood: Mood; mood2?: Mood; mk?: [number, number]; cam: (u: number) => Cam; dof?: number; xfade?: number; flash?: boolean;
  pose: (w: World, t: number, u: number) => void };

// characters never freeze: idle breathing bob + blinks
const who = (w: World, o: any, key: string, x: number, y: number, z: number, t: number, opts: any = {}) => {
  const i = key.length * 7 + Math.round(x * 13);
  const m = w.cast.person(o, key, x, y + 0.012 * Math.sin(t * 2.2 + i), z, { mode: "stand", expr: "neutral", blink: blinkAt(t, i), res: 0.9, ...opts });
  m.scale.y *= 1 + 0.006 * Math.sin(t * 2.2 + i + 1); return m;
};
const baker = (w: World, key: string, x: number, y: number, z: number, t: number, o: any = {}) => who(w, BAKER, key, x, y, z, t, { ...o, face: o.face ? both(apron, toque, o.face) : both(apron, toque) });
const fx = (t0: number) => (p: any) => fxBurst(p, t0, "#fff3b0", 10, 40, 140);
/** spring settle 0 -> 1 with overshoot */
const spring = (x: number) => { const u = clamp01(x); return 1 - Math.exp(-6 * u) * Math.cos(9 * u); };

const KITCHEN_HOOK: Key = { u: 0, pos: [0.4, 1.45, 1.9], look: [0.42, 1.1, -1.9], fov: 48 };
const KITCHEN_HOOK_END: Key = { u: 1, pos: [0.42, 1.4, 1.35], look: [0.45, 1.05, -1.9], fov: 46 };

export const SHOTS: Shot[] = [
  // 0 HOOK: a woman feeds banknote bundles into her iron stove (frame 0 is already the image)
  { n: 0, mood: "kitchen", dof: 9,
    cam: path([KITCHEN_HOOK, KITCHEN_HOOK_END], 0),
    pose: (w, t) => {
      w.kitchen.g.visible = true; const tm = word(0, 10); // "money"
      const throwK = clamp01((t - (tm - 0.55)) / 0.4);
      w.kitchen.set(t, 1, t > tm - 0.08 ? 1 : 0.55);
      who(w, WOMAN, "wom", 0.0, 0, -1.45, t, { expr: t > tm ? "smile" : "neutral", wave: throwK > 0 && throwK < 1 ? 0.3 : undefined, face: throwK < 0.05 ? holdBundle : undefined });
      if (throwK > 0.05 && throwK < 1) { const k = easeOut(throwK); w.cast.card("bn0", 300, 200, bundleDraw(0), 0.05 + 0.85 * k, 0.95 - 0.5 * k + 0.25 * Math.sin(k * Math.PI), -1.3 - 0.6 * k, 0.42, 0.28, { rot: -2 * k }); }
      w.cast.card(`fire${Math.floor(t * 10) % 6}`, 300, 300, fireDraw(Math.floor(t * 10) / 10), 0.9, 0.45 + (t > tm - 0.08 ? 0.06 : 0), -1.9, 0.42 + (t > tm - 0.08 ? 0.12 : 0), 0.42, { soft: true });
      if (t > tm - 0.08 && t < tm + 0.6) { const k = Math.sin(clamp01((t - tm + 0.08) / 0.68) * Math.PI); w.cast.card(`fireB${Math.floor(t * 10) % 6}`, 300, 300, fireDraw(Math.floor(t * 10) / 10 + 0.3), 0.9, 0.5 + 0.25 * k, -1.86, 0.5 + 0.35 * k, 0.5 + 0.6 * k, { soft: true }); }
      void fx;
    } },
  // 1 "Not to show off." deadpan shrug, the camera drifts out to a two-shot of her and the stove
  { n: 1, mood: "kitchen", dof: 7,
    cam: path([{ ...KITCHEN_HOOK_END, u: 0 }, { u: 1, pos: [0.3, 1.5, 2.2], look: [0.4, 1.2, -1.9], fov: 48 }], 0),
    pose: (w, t, u) => {
      w.kitchen.g.visible = true; w.kitchen.set(t, 1, 0.9);
      who(w, WOMAN, "wom", 0.0, 0, -1.45, t, { expr: u < 0.3 ? "smile" : "stern", headTilt: u > 0.3 ? -8 : 0 });
      w.cast.card(`fire${Math.floor(t * 10) % 6}`, 300, 300, fireDraw(Math.floor(t * 10) / 10), 0.9, 0.48, -1.9, 0.5, 0.45, { soft: true });
    } },
  // 2 "Because it was cheaper than firewood." insert on the wood box: one log costs more than the bundle
  { n: 2, mood: "kitchen", dof: 10, xfade: 6,
    cam: path([{ u: 0, pos: [-0.3, 1.15, -0.75], look: [-0.4, 0.62, -2.4], fov: 46 }, { u: 1, pos: [-0.32, 1.08, -0.95], look: [-0.4, 0.64, -2.4], fov: 46 }], 0),
    pose: (w, t) => {
      w.kitchen.g.visible = true; w.kitchen.set(t, 1, 0.9);
      const tc = word(2, 3); // "cheaper"
      w.cast.card("bnw", 300, 200, bundleDraw(1), -0.18, 0.62, -2.15, 0.36, 0.24);
      const k1 = spring((t - (tc - 0.4)) / 0.5), k2 = spring((t - (tc - 0.1)) / 0.5);
      if (k1 > 0) w.cast.card("tagLog", 600, 260, tagDraw("2.000.000 M"), -0.5, 0.92, -2.25, 0.44 * k1, 0.19 * k1, { rot: 0.12 });
      if (k2 > 0) w.cast.card("tagBn", 600, 260, tagDraw("1.000 M"), -0.2, 0.78, -2.1, 0.3 * k2, 0.13 * k2, { rot: -0.1 });
    } },
  // 3 FLASH -> Berlin 1922: crane down from the roofs to the bakery window, price on the glass "160 M"
  { n: 3, mood: "street", flash: true, dof: 3,
    cam: path([{ u: 0, pos: [-1, 13, 16], look: [-6, 7, -8], fov: 46 }, { u: 0.55, pos: [-3.4, 2.2, 4.2], look: [-8.6, 2.0, 0.9], fov: 44 }, { u: 1, pos: [-4.9, 2.1, 1.9], look: [-8.6, 2.05, 0.9], fov: 42 }]),
    pose: (w, t, u) => {
      w.street.g.visible = true;
      w.cast.card("p160", 1200, 420, priceDraw("160 M"), -8.55, 2.1, 0.9, 1.2, 0.42);
      for (let i = 0; i < 3; i++) { const ph = (t * 0.9 + i / 3) % 1; who(w, WORKER(i), `pass${i}`, -5.5 + 3 * i, 0.2, 6 - 18 * ((t * 0.08 + hh(i, 3)) % 1), t, { mode: "stroll", phase: ph, res: 0.6 }); }
      void u;
    } },
  // 4 "By September, one and a half million." inside: the board climbs, light turns golden
  { n: 4, mood: "bakery", mood2: "bakeryGold", mk: [0.1, 0.9], dof: 5, xfade: 6,
    cam: path([{ u: 0, pos: [0.5, 1.9, 2.6], look: [0, 2.1, -2.5], fov: 44 }, { u: 1, pos: [0.35, 2.1, 1.6], look: [0, 2.25, -2.5], fov: 42 }]),
    pose: (w, t) => {
      w.bakery.g.visible = true; const tm = word(4, 6); // "million"
      const k = clamp01((t - word(4, 1)) / (tm - word(4, 1)));
      const v = Math.round(160 * Math.pow(1500000 / 160, smooth(k)) / (k < 1 ? 1 : 1));
      const s = (k >= 1 ? 1500000 : Math.round(v / 10) * 10).toLocaleString("de-DE") + " M";
      w.cast.card(`pb${s}`, 1200, 420, priceDraw(s, k >= 1 ? 1 : 0), 0, 2.75, -2.88, 1.8, 0.63);
      baker(w, "bak", 0.2, 0, -1.8, t, { expr: k < 0.6 ? "stern" : "nervous", face: k > 0.7 ? sweat : undefined });
    } },
  // 5 "By November, two hundred billion." faster push, 3 deg roll, kick on "billion"; the baker goes dizzy
  { n: 5, mood: "bakeryGold", mood2: "bakeryRed", mk: [0.0, 0.7], dof: 5, kw: [5],
    cam: path([{ u: 0, pos: [0.35, 2.1, 1.6], look: [0, 2.25, -2.5], fov: 42 }, { u: 1, pos: [0.2, 2.2, 1.0], look: [0, 2.3, -2.5], fov: 46, roll: 3 }], 0),
    pose: (w, t) => {
      w.bakery.g.visible = true; const tb = word(5, 4); // "billion"
      const k = clamp01((t - word(5, 1)) / (tb - word(5, 1)));
      const v = 1500000 * Math.pow(200000000000 / 1500000, smooth(k));
      const s = (k >= 1 ? 200000000000 : Math.round(v / 1000) * 1000).toLocaleString("de-DE") + " M";
      w.cast.card(`pb${s}`, 1200, 420, priceDraw(s, 1), 0, 2.75, -2.88, 1.8, 0.63);
      baker(w, "bak", 0.2, 0, -1.8, t, { expr: t > tb - 0.05 ? "dazed" : "shock", tilt: t > tb ? -10 * easeOut((t - tb) / 0.4) : 0, face: sweat });
    } },
  // 6 "People carried their wages home in wheelbarrows." tracking with three workers, golden afternoon
  { n: 6, mood: "golden", dof: 2, xfade: 6,
    cam: path([{ u: 0, pos: [-2.4, 1.7, 7.0], look: [-1.4, 1.1, -1], fov: 46 }, { u: 1, pos: [0.4, 1.7, 7.0], look: [1.4, 1.1, -1], fov: 46 }], 0),
    pose: (w, t, u) => {
      w.street.g.visible = true;
      for (let i = 0; i < 3; i++) {
        const x = -2.6 + 3.0 * u + 0.9 * i - 0.3, z = 1.2 - 2.6 * i, ph = (t * 1.6 + i * 0.37) % 1;
        who(w, WORKER(i), `wk${i}`, x, 0, z, t, { mode: "stroll", phase: ph, expr: ["stern", "nervous", "whistle"][i], res: 0.7 });
        w.cast.card(`bar${Math.floor(ph * 4)}_${i}`, 600, 400, barrowDraw(ph), x + 0.8, 0.5 + 0.02 * Math.sin(ph * 6.28 * 2), z + 0.35, 1.4, 0.93);
      }
    } },
  // 7 "Kids stacked bundles ... kites out of banknotes." tower of bundles, then tilt up with the kite
  { n: 7, mood: "golden", dof: 4, xfade: 6,
    cam: path([{ u: 0, pos: [0.3, 1.0, 3.2], look: [0, 1.0, 0], fov: 46 }, { u: 0.52, pos: [0.4, 1.1, 2.9], look: [0, 1.05, 0], fov: 46 }, { u: 1, pos: [0.7, 1.3, 3.4], look: [1.0, 5.2, -1.5], fov: 50 }], 0),
    pose: (w, t, u) => {
      w.street.g.visible = true;
      const n = Math.min(11, 4 + Math.floor(clamp01((t - at(7)) / 1.6) * 7));
      w.cast.card(`tw${n}_${Math.round(Math.sin(t * 5) * 10)}`, 300, 700, towerDraw(n, 0.05 * Math.sin(t * 5)), 0, 0.78, 0, 0.66, 1.54);
      who(w, KIDO(0), "k0", -0.55, 0, 0.3, t, { expr: "grin", wave: 0.5 + 0.5 * Math.sin(t * 4) });
      who(w, KIDO(1), "k1", 0.55, 0, -0.2, t, { expr: "laugh" });
      const tk = word(7, 10); // "made"
      who(w, KIDO(2), "k2", 1.4, 0, -1.4, t, { expr: "smile", wave: 1 });
      const kx = 1.1 + 0.25 * Math.sin(t * 1.3), ky = 1.9 + 3.9 * smooth((t - tk + 0.6) / 1.8), kz = -1.5;
      w.cast.card(`kite${Math.floor(t * 6) % 6}`, 400, 700, kiteDraw(Math.floor(t * 6) / 6), kx, ky, kz, 0.9, 1.58, { rot: 0.15 * Math.sin(t * 2) });
      void u;
    } },
  // 8 "Some families papered their walls with it." lateral pan along the wall being papered with notes
  { n: 8, mood: "kitchen", dof: 5, xfade: 6,
    cam: path([{ u: 0, pos: [-0.6, 1.7, 1.6], look: [3.5, 1.5, -1.4], fov: 48 }, { u: 1, pos: [-0.6, 1.7, 2.6], look: [3.5, 1.5, 0.6], fov: 48 }], 0),
    pose: (w, t, u) => {
      w.kitchen.g.visible = true; const pk = 0.15 + 0.6 * u; w.kitchen.set(t, 0, 0.6, pk);
      const ez = -2.9 + 6 * pk;
      who(w, DAD, "dad", 3.0, 0.15, ez + 0.1, t, { expr: "whistle", wave: 0.6 + 0.4 * Math.sin(t * 7) });
      who(w, MUM, "mum", 2.9, 0, ez + 1.0, t, { expr: "smile", face: holdBundle });
    } },
  // 9 "Shops changed their prices several times a day." the baker re-chalks the board, the clock spins
  { n: 9, mood: "bakery", dof: 4, xfade: 6,
    cam: path([{ u: 0, pos: [-0.4, 2.1, 1.8], look: [0, 2.6, -2.5], fov: 46 }, { u: 1, pos: [-0.3, 2.1, 1.2], look: [0, 2.65, -2.5], fov: 46 }]),
    pose: (w, t, u) => {
      w.bakery.g.visible = true;
      const step = Math.min(4, Math.floor(u * 5)), prices = ["3.000.000 M", "7.500.000 M", "21.000.000 M", "88.000.000 M", "160.000.000 M"];
      w.cast.card(`pb${prices[step]}`, 1200, 420, priceDraw(prices[step]), 0, 2.75, -2.88, 1.8, 0.63);
      w.cast.card(`clk${Math.floor(t * 12)}`, 300, 300, clockDraw(t * 9), 0, 3.75, -2.9, 0.6, 0.6);
      baker(w, "bak9", 0.65, 0, -2.2, t, { expr: "nervous", wave: 0.6 + 0.4 * Math.abs(Math.sin(t * 10)), face: sweat });
    } },
  // 10 "Wait until tomorrow, and your money might only buy half a loaf." the loaf splits on "half"
  { n: 10, mood: "bakery", dof: 9, xfade: 6,
    cam: path([{ u: 0, pos: [0.1, 1.55, 1.3], look: [0, 1.25, -0.9], fov: 44 }, { u: 1, pos: [0.08, 1.5, 0.9], look: [0, 1.25, -0.9], fov: 44 }]),
    pose: (w, t) => {
      w.bakery.g.visible = true;
      const th = word(10, 9); // "half"
      const k = Math.round(easeOut((t - th + 0.06) / 0.4) * 20) / 20;
      w.cast.card(`loaf${k}`, 600, 300, loafDraw(k), 0.05, 1.23, -0.95, 0.62, 0.31);
      const kb = easeOut((t - word(10, 5) + 0.1) / 0.3); // bundle slides onto the counter on "money"
      if (kb > 0) w.cast.card("bnc", 300, 200, bundleDraw(2), -0.35, 1.13, -0.55 - 0.1 * kb, 0.36, 0.24, { flat: true, rot: 0.2 });
      baker(w, "bak10", 0.1, 0, -1.9, t, { expr: "nervous", face: sweat });
    } },
  // 11 "But where did all that money come from?" the woman in the dusk street, a "?" and a tilt to the sky
  { n: 11, mood: "dusk", dof: 3, xfade: 6,
    cam: path([{ u: 0, pos: [-1.0, 1.6, 6.4], look: [-2.0, 1.5, 3.0], fov: 46 }, { u: 0.5, pos: [-1.0, 1.6, 6.1], look: [-2.0, 1.6, 3.0], fov: 46 }, { u: 1, pos: [-1.0, 1.4, 6.6], look: [-2.4, 6.5, -6], fov: 50 }]),
    pose: (w, t) => {
      w.street.g.visible = true;
      who(w, WOMAN, "wom11", -2.0, 0.2, 3.0, t, { expr: "nervous", headTilt: 8 });
      const k = easeOut((t - word(11, 1) + 0.08) / 0.2);
      if (k > 0) w.cast.card("q", 300, 300, qMark, -1.4, 2.6, 3.0, 0.6 * k, 0.6 * k);
    } },
  // 12 FLASH -> night-blue office: debts piled on the desk; "the easy thing" -> a grin
  { n: 12, mood: "night", flash: true, dof: 6,
    cam: path([{ u: 0, pos: [0.3, 1.75, 2.4], look: [0.2, 1.5, -1.8], fov: 46 }, { u: 1, pos: [0.2, 1.7, 1.2], look: [0.2, 1.5, -1.8], fov: 44 }]),
    pose: (w, t) => {
      w.office.g.visible = true; w.office.sky("#3a5a9a", 1.0);
      const te = word(12, 12); // "easy"
      who(w, OFFICIAL, "off12", -0.2, 0, -2.3, t, { expr: t > te - 0.05 ? "grin" : "nervous", face: t > te - 0.05 ? undefined : sweat });
      w.cast.card("debt", 600, 600, debtDraw, 0.55, 1.3, -1.25, 0.8, 0.8);
    } },
  // 13 "It printed more money." following the stream of notes out of the press
  { n: 13, mood: "hall", dof: 5, xfade: 6,
    cam: path([{ u: 0, pos: [0.4, 1.6, -0.4], look: [0, 1.4, -3.2], fov: 46 }, { u: 1, pos: [0.6, 1.9, 1.6], look: [0, 1.3, -3.2], fov: 48 }], 0),
    pose: (w, t) => { w.hall.g.visible = true; w.hall.set(t * 9, 0, 0); notes(w, t, 14, 1); w.hall.g.visible = true; printers(w, t); } },
  // 14 "Presses ran day and night." wide; the windows flicker day <-> night
  { n: 14, mood: "hall", dof: 0,
    cam: path([{ u: 0, pos: [0.6, 1.9, 1.6], look: [0, 1.3, -3.2], fov: 48 }, { u: 1, pos: [0.4, 3.2, 6.5], look: [0, 1.8, -3.5], fov: 50 }], 0),
    pose: (w, t) => {
      const day = 0.5 + 0.5 * Math.sin((t - at(14)) * Math.PI * 2.4);
      w.hall.g.visible = true; w.hall.set(t * 12, day, 0); notes(w, t, 18, 1.3); printers(w, t);
    } },
  // 15 "Think of a pizza." top-down macro on the kitchen table under the lamp (the diagram)
  { n: 15, mood: "night", dof: 0, xfade: 6,
    cam: path([{ u: 0, pos: [-0.6, 2.5, 1.32], look: [-0.6, 0.87, 1.0], fov: 44 }, { u: 1, pos: [-0.6, 2.35, 1.3], look: [-0.6, 0.87, 1.0], fov: 44, roll: 2 }], 0),
    pose: (w, t) => { w.kitchen.g.visible = true; w.kitchen.set(t, 0, 0.3); w.cast.card("pz1", 600, 600, pizzaDraw(1), -0.6, 0.905, 1.0, 0.62, 0.62, { flat: true, rot: 0.05 * t }); } },
  // 16 "Cut it into eight slices or eight hundred, it's still one pizza."
  { n: 16, mood: "night", dof: 0,
    cam: path([{ u: 0, pos: [-0.6, 2.35, 1.3], look: [-0.6, 0.87, 1.0], fov: 44, roll: 2 }, { u: 1, pos: [-0.6, 2.25, 1.28], look: [-0.6, 0.87, 1.0], fov: 44, roll: 8 }], 0.12),
    pose: (w, t) => {
      w.kitchen.g.visible = true; w.kitchen.set(t, 0, 0.3);
      const e1 = word(16, 3), e2 = word(16, 6); // "eight" (slices), "eight" (hundred)
      let n = 1; if (t > e1 - 0.08) n = Math.min(8, 2 + Math.floor((t - e1 + 0.08) * 20)); if (t > e2 - 0.08) n = Math.min(800, 8 * Math.pow(100, clamp01((t - e2 + 0.08) / 0.4)));
      n = Math.round(n);
      w.cast.card(`pz${n}`, 600, 600, pizzaDraw(n), -0.6, 0.905, 1.0, 0.62, 0.62, { flat: true, rot: 0.05 * t });
    } },
  // 17 "Germany kept cutting, and every slice got thinner." one slice lifts, so thin you can see through it
  { n: 17, mood: "night", dof: 0,
    cam: path([{ u: 0, pos: [-0.6, 2.25, 1.28], look: [-0.6, 0.87, 1.0], fov: 44, roll: 8 }, { u: 1, pos: [-0.6, 1.7, 1.45], look: [-0.6, 1.05, 0.85], fov: 42, roll: 10 }], 0),
    pose: (w, t, u) => {
      w.kitchen.g.visible = true; w.kitchen.set(t, 0, 0.3);
      const k = smooth((u - 0.25) / 0.5);
      w.cast.card(`pzh${k > 0 ? 1 : 0}`, 600, 600, pizzaDraw(800, k > 0 ? 1 : -1), -0.6, 0.905, 1.0, 0.62, 0.62, { flat: true, rot: 0.05 * t });
      if (k > 0) w.cast.card("slice", 400, 600, sliceDraw, -0.6, 0.95 + 0.3 * k, 0.85 - 0.05 * k, 0.16, 0.24, { soft: true, rot: 0.1 * Math.sin(t * 3) });
    } },
  // 18 FLASH -> pink dawn: the official raises a red pencil with a cheeky grin
  { n: 18, mood: "dawn", flash: true, dof: 7,
    cam: path([{ u: 0, pos: [0.0, 1.7, 1.6], look: [0.05, 1.55, -2.3], fov: 44 }, { u: 1, pos: [0.0, 1.65, 0.9], look: [0.05, 1.55, -2.3], fov: 42 }]),
    pose: (w, t, u) => {
      w.office.g.visible = true; w.office.sky("#f2a8a0", 1.3);
      who(w, OFFICIAL, "off18", 0.05, 0, -2.3, t, { expr: u > 0.55 ? "grin" : "smile_closed", face: pencil, wave: 0.8 });
    } },
  // 19 "Brand new money, with twelve zeros crossed out." insert: the zeros struck through one by one
  { n: 19, mood: "dawn", dof: 0, xfade: 6,
    cam: path([{ u: 0, pos: [0.0, 1.6, 0.85], look: [0, 1.3, -1.3], fov: 44 }, { u: 1, pos: [0.0, 1.55, 0.6], look: [0, 1.3, -1.3], fov: 44 }]),
    pose: (w, t) => {
      w.office.g.visible = true; w.office.sky("#f2a8a0", 1.3);
      const k = Math.floor(12 * clamp01((t - word(19, 4) + 0.1) / 1.15)); // from "twelve"
      w.cast.card(`tri${k}`, 1200, 600, trillionDraw(k), 0, 1.3, -1.3, 0.84, 0.42);
    } },
  // 20 "One trillion old marks became one new mark." the balance settles level
  { n: 20, mood: "dawn", dof: 5,
    cam: path([{ u: 0, pos: [0.0, 1.55, 0.6], look: [0, 1.3, -1.3], fov: 44 }, { u: 1, pos: [0.3, 1.75, 1.9], look: [0.1, 1.45, -1.6], fov: 46 }], 0),
    pose: (w, t) => {
      w.office.g.visible = true; w.office.sky("#f2a8a0", 1.3);
      const ts = word(20, 4); // "became"
      const tilt = t < ts ? 0.42 : 0.42 * (1 - spring((t - ts) / 0.9));
      w.cast.card(`sc${Math.round(tilt * 60)}`, 900, 700, scaleDraw(tilt), 0, 1.3, -1.3, 0.9, 0.7);
      who(w, OFFICIAL, "off20", -0.75, 0, -2.2, t, { expr: t > ts + 0.6 ? "grin" : "stern" });
    } },
  // 21 "And it worked." back in the kitchen: a real log goes into the stove (callback to the hook)
  { n: 21, mood: "kitchen", dof: 8, xfade: 6,
    cam: path([KITCHEN_HOOK, KITCHEN_HOOK_END], 0),
    pose: (w, t, u) => {
      w.kitchen.g.visible = true; w.kitchen.set(t, 1, 0.9);
      who(w, WOMAN, "wom21", 0.0, 0, -1.45, t, { expr: "smile", wave: u < 0.7 ? 0.3 : undefined });
      const k = easeOut(u / 0.7); w.kitchen.log.visible = u < 0.95; w.kitchen.log.position.set(0.15 + 0.75 * k, 0.95 - 0.5 * k, -1.35 - 0.55 * k);
      w.cast.card(`fire${Math.floor(t * 10) % 6}`, 300, 300, fireDraw(Math.floor(t * 10) / 10), 0.9, 0.48, -1.9, 0.5, 0.45, { soft: true });
    } },
  // 22 STING "Because this time, they promised to do one thing." music stops, low hit, push-in with roll to the lever
  { n: 22, mood: "hall", dof: 8, xfade: 6, kw: [0],
    cam: path([{ u: 0, pos: [3.0, 1.9, 2.6], look: [1.3, 1.5, -2.5], fov: 46 }, { u: 1, pos: [2.2, 1.7, 0.9], look: [1.3, 1.45, -2.5], fov: 44, roll: 4 }], 0),
    pose: (w, t) => {
      w.hall.g.visible = true; w.hall.set(t * 10, 0, 0); notes(w, t, 10, 1);
      who(w, OFFICIAL, "off22", 1.85, 0, -2.1, t, { expr: "stern", wave: 0.15 });
    } },
  // 23 "Stop printing." the lever snaps on "Stop", the rollers halt, the last note lands on "printing"
  { n: 23, mood: "hall", dof: 8, kw: [0],
    cam: path([{ u: 0, pos: [2.2, 1.7, 0.9], look: [1.3, 1.45, -2.5], fov: 44, roll: 4 }, { u: 1, pos: [2.1, 1.65, 0.6], look: [1.25, 1.4, -2.5], fov: 44, roll: 0 }], 0),
    pose: (w, t) => {
      const ts = word(23, 0) - 0.05, tp = word(23, 1);
      const lk = t < ts ? 0 : spring((t - ts) / 0.25), stopT = ts + 0.15;
      const spin = t < stopT ? t * 10 : stopT * 10 + 2 * (1 - Math.exp(-(t - stopT) * 6));
      w.hall.g.visible = true; w.hall.set(spin, 0, lk);
      who(w, OFFICIAL, "off23", 1.85, 0, -2.1, t, { expr: t < ts ? "stern" : "smile_closed", wave: t < ts ? 0.15 : 0.05 });
      // the last note drifts down and lands on "printing"
      const k = clamp01((t - ts) / Math.max(0.3, tp + 0.35 - ts));
      w.cast.card("last", 300, 150, flyNote(1), 0.9 + 0.15 * Math.sin(k * 7), 2.3 - 1.48 * smooth(k), -2.4 + 0.3 * k, 0.32, 0.16, { rot: k < 1 ? 0.5 * Math.sin(k * 9) : 0 });
    } },
];

/** a stream of notes shooting out of the middle press toward the camera */
function notes(w: World, t: number, n: number, sp: number) {
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.9 * sp + i / n) % 1, x = (hh(i, 1) - 0.5) * 1.6 * ph, y = 1.4 + 1.2 * Math.sin(ph * Math.PI) * hh(i, 2), z = -2.9 + 4.5 * ph;
    w.cast.card(`fn${i % 3}`, 300, 150, flyNote(i), x, y, z, 0.32, 0.16, { rot: ph * 6 * (hh(i, 3) - 0.5) });
  }
  for (let p = 0; p < 3; p++) for (let i = 0; i < 6; i++) w.cast.card(`pile${i % 3}`, 300, 150, flyNote(i + p), -3.4 + p * 3.4 + (hh(i, p) - 0.5) * 0.9, 0.82 + 0.03 * i, -2.3 + (hh(i, p + 4) - 0.5) * 0.5, 0.32, 0.16, { flat: true, rot: hh(i, p) * 3 });
}
function printers(w: World, t: number) {
  who(w, PRINTER(0), "pr0", -3.4 + 0.9, 0, -1.6, t, { expr: "stern", wave: 0.5 + 0.5 * Math.sin(t * 6), res: 0.7 });
  who(w, PRINTER(1), "pr1", 3.4 - 0.9, 0, -1.5, t, { expr: "nervous", wave: 0.5 + 0.5 * Math.sin(t * 6 + 2), res: 0.7 });
}

// ---------------- timeline ----------------
export const shotStart = (i: number) => (SHOTS[i].w !== undefined ? word(SHOTS[i].n, SHOTS[i].w!) - 0.05 : at(SHOTS[i].n));
export const shotEnd = (i: number) => (i + 1 < SHOTS.length ? shotStart(i + 1) : VOICE_DUR);
export const shotAt = (t: number) => { let i = 0; while (i + 1 < SHOTS.length && t >= shotStart(i + 1)) i++; return i; };
export const layersAt = (f: number): { i: number; alpha: number }[] => {
  const t = f / FPS, i = shotAt(t), n = SHOTS[i].xfade;
  if (n && i > 0) { const k = (f - Math.round(shotStart(i) * FPS)) / n; if (k < 1) return [{ i: i - 1, alpha: 1 }, { i, alpha: smooth(k) }]; }
  return [{ i, alpha: 1 }];
};
/** 6-frame white flash at place/time jumps */
export const flashAt = (f: number) => {
  let v = 0;
  SHOTS.forEach((s, i) => { if (!s.flash) return; const df = f - Math.round(shotStart(i) * FPS); if (df >= 0 && df < 6) v = Math.max(v, [0.9, 0.7, 0.5, 0.32, 0.16, 0.06][df]); });
  return v;
};
const kickAt = (i: number, t: number) => {
  let s = 0; const ks = (SHOTS[i].kw ?? []).map((k) => word(SHOTS[i].n, k));
  for (const kt of ks) { const df = Math.round((t - kt) * FPS); if (df >= 0 && df < 7) s += (df % 2 ? -1 : 1) * (1 - df / 7) * 0.25; }
  return s;
};

// ---------------- world ----------------
export class World {
  root = new THREE.Group(); env = new Env(); cast = new Cast();
  kitchen = new Kitchen(); street = new BerlinStreet(); bakery = new Bakery(); office = new Office(); hall = new PrintHall();
  private sets: THREE.Object3D[];
  constructor() {
    this.sets = [this.kitchen.g, this.street.g, this.bakery.g, this.office.g, this.hall.g];
    this.root.add(this.env.root, ...this.sets, this.cast.root);
  }
  update(i: number, t: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[i], a = shotStart(i), b = shotEnd(i), u = clamp01((t - a) / Math.max(0.01, b - a)), c = s.cam(u);
    const M = s.mood2 ? lerpMood(MOODS[s.mood], MOODS[s.mood2], smooth((u - (s.mk?.[0] ?? 0)) / ((s.mk?.[1] ?? 1) - (s.mk?.[0] ?? 0)))) : MOODS[s.mood];
    const kk = kickAt(i, t);
    cam.position.set(...c.pos); cam.position.y += kk * 0.3; cam.fov = c.fov; cam.up.set(0, 1, 0);
    cam.lookAt(c.look[0], c.look[1] + kk * 0.1, c.look[2]); cam.rotateZ(((c.roll ?? 0) * Math.PI) / 180 + kk * 0.012); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    for (const o of this.sets) o.visible = false;
    const outdoor = ["street", "golden", "dusk"].includes(s.mood);
    this.env.apply(M, scene, cam, t, s.mood === "dusk" ? "#e0b8c8" : s.mood === "golden" ? "#ffe0c0" : "#ffffff", outdoor);
    this.env.sky.visible = outdoor; this.env.sea.visible = false;
    this.cast.begin(cam, M.tint);
    s.pose(this, t, u);
    return { target: new THREE.Vector3(...c.look), mood: M };
  }
}
