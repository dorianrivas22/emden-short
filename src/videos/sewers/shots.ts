// "Built Too Big": every shot is tied to a sentence of the narration (so English and Spanish share one shot list).
import * as THREE from "three";
import { V3, MoodDef, glide, lv, smooth, clamp01, hh, easeOut, ramp } from "../emden/lib";
import { Env } from "../emden/env";
import { Cast, blinkAt, smokeDraw, flashDraw, puffDraw, qDraw, splashDraw, numDraw } from "../emden/chars";
import {
  Tunnel, toilet, riverBank, parliament, Chamber, victorianStreet, brickYard, carriage, Embankment, townAerial, modernCity,
} from "./sets";
import {
  BAZ, MP, DOCTOR, WORKER, POOR, KIDP, MODERN, hanky, pinch, chops, sweat,
  stinkDraw, bubbleDraw, germDraw, dropDraw, brickDraw, planDraw, paperDraw, thermoDraw, cupDraw, bucketDraw, glassDraw, horseDraw, ringDraw, xDraw, streamDraw, x2Draw,
} from "./cast";
import WORDS_EN from "../../../public/sewers_words_en.json";
import WORDS_ES from "../../../public/sewers_words_es.json";

export const FPS = 30;
export type Lang = "en" | "es";
type W = { w: string; s: number; e: number };
export const WORDS: Record<Lang, W[]> = { en: WORDS_EN as W[], es: WORDS_ES as W[] };
/** sentence start times (sentences end in . ? or ...) */
const sentences = (ws: W[]) => { const st: number[] = [0]; ws.forEach((w, i) => { if (/[.?]$/.test(w.w) && i < ws.length - 1) st.push(ws[i + 1].s); }); return st; };
export const SENT: Record<Lang, number[]> = { en: sentences(WORDS.en), es: sentences(WORDS.es) };
export const VOICE_END: Record<Lang, number> = { en: WORDS.en[WORDS.en.length - 1].e, es: WORDS.es[WORDS.es.length - 1].e };
export const FRAMES: Record<Lang, number> = { en: Math.round((VOICE_END.en + 0.9) * FPS), es: Math.round((VOICE_END.es + 0.9) * FPS) };
/** time of the n-th sentence start, plus a fraction f of that sentence's length */
export const at = (lang: Lang, n: number, f = 0) => { const S = SENT[lang]; const a = S[n], b = n + 1 < S.length ? S[n + 1] : VOICE_END[lang] + 0.9; return a + f * (b - a); };
/** time a word (by index in the sentence) is spoken */
export const word = (lang: Lang, n: number, k: number) => { const S = SENT[lang]; const i = WORDS[lang].findIndex((w) => w.s >= S[n] - 1e-3); return WORDS[lang][Math.min(WORDS[lang].length - 1, i + k)].s; };

// ---------------- moods ----------------
export type Mood = "tunnel" | "fog" | "heat" | "chamber" | "day" | "dusk" | "golden" | "yard";
export const MOODS: Record<Mood, MoodDef> = {
  tunnel: { skyTop: "#1c120c", skyHor: "#3a2618", seaNear: "#000000", seaFar: "#000000", crest: "#000000", fogNear: 14, fogFar: 95,
    sun: "#ffc58a", sunI: 1.5, sunDir: [0.2, 0.9, 0.4], amb: "#a0786a", ambI: 1.35, tint: "#ffe6c8", stars: 0, disc: 0, grade: [1.05, 1, 0.92] },
  fog: { skyTop: "#8d9a86", skyHor: "#c9c8a8", seaNear: "#5e6436", seaFar: "#8d9064", crest: "#b4ae7c", fogNear: 30, fogFar: 260,
    sun: "#fff0c8", sunI: 1.5, sunDir: [-0.4, 0.8, 0.5], amb: "#a9ab92", ambI: 1.15, tint: "#eeecda", stars: 0, disc: 0, grade: [1, 1, 0.95] },
  heat: { skyTop: "#5d93d6", skyHor: "#ffe3a0", seaNear: "#666327", seaFar: "#9c9748", crest: "#d6cf84", fogNear: 120, fogFar: 900,
    sun: "#fff0bc", sunI: 2.8, sunDir: [0.3, 0.85, 0.6], amb: "#c9b27a", ambI: 1.15, tint: "#fff3d6", stars: 0, disc: 1, grade: [1.06, 1.02, 0.9] },
  chamber: { skyTop: "#2a1a10", skyHor: "#4a3020", seaNear: "#000000", seaFar: "#000000", crest: "#000000", fogNear: 40, fogFar: 200,
    sun: "#ffe2b0", sunI: 2.0, sunDir: [0.5, 0.8, 0.3], amb: "#a0889a", ambI: 1.1, tint: "#fff0dc", stars: 0, disc: 0, grade: [1.04, 1, 0.94] },
  day: { skyTop: "#3f86dc", skyHor: "#cfe6f6", seaNear: "#1f6fb2", seaFar: "#79bde6", crest: "#e9f6ff", fogNear: 120, fogFar: 900,
    sun: "#fff3dc", sunI: 2.3, sunDir: [0.5, 0.75, 0.45], amb: "#a9c3ea", ambI: 1.15, tint: "#ffffff", stars: 0, disc: 0, grade: [1, 1, 1] },
  yard: { skyTop: "#4a8fe0", skyHor: "#f3e7cf", seaNear: "#2a86c4", seaFar: "#8cc7e0", crest: "#ffffff", fogNear: 80, fogFar: 600,
    sun: "#fff0d0", sunI: 2.4, sunDir: [-0.45, 0.7, 0.55], amb: "#c9c0e0", ambI: 1.1, tint: "#fff8f0", stars: 0, disc: 0, grade: [1.03, 1, 0.96] },
  dusk: { skyTop: "#1f2a64", skyHor: "#b9807e", seaNear: "#2a3050", seaFar: "#5a5a7a", crest: "#9a8aa8", fogNear: 90, fogFar: 700,
    sun: "#ffb8a0", sunI: 1.4, sunDir: [-0.8, 0.35, -0.3], amb: "#5a62a8", ambI: 1.3, tint: "#c9bde4", stars: 0.3, disc: 0, grade: [1, 0.96, 1.06] },
  golden: { skyTop: "#5f74c9", skyHor: "#ffc27a", seaNear: "#2b4c9a", seaFar: "#e09a73", crest: "#ffe1b0", fogNear: 120, fogFar: 900,
    sun: "#ffc98f", sunI: 2.4, sunDir: [0.85, 0.2, -0.45], amb: "#8a7fc6", ambI: 1.0, tint: "#ffe2c2", stars: 0, disc: 1, grade: [1.06, 1, 0.92] },
};

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Key = { u: number; pos: V3; look: V3; fov: number; roll?: number };
/** keys at fractions u of the shot; smootherstep glides; a slow creep toward the target on every hold */
const path = (keys: Key[], creep = 0.06) => (u: number): Cam => {
  let i = 0; while (i < keys.length - 1 && u > keys[i + 1].u) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b === a ? 0 : glide((u - a.u) / (b.u - a.u));
  const pos = lv(a.pos, b.pos, k), look = lv(a.look, b.look, k);
  return { pos: lv(pos, look, Math.min(0.3, creep * u)), look, fov: a.fov + (b.fov - a.fov) * k, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * k };
};
const still = (pos: V3, look: V3, fov: number, roll = 0) => path([{ u: 0, pos, look, fov, roll }], 0.08);

/** a shot starts at sentence n + fraction f; it ends where the next shot starts */
export type Shot = { n: number; f?: number; w?: Record<Lang, number>; kw?: Record<Lang, number>; mood: Mood; cam: (u: number) => Cam; dof?: number; river?: boolean; clouds?: boolean; xfade?: number; kicks?: number[];
  pose: (w: World, t: number, u: number, L: Lang) => void };

const Y = 0; // ground
export const SHOTS: Shot[] = [
  // 0a hook, first frame: the benches of Parliament roaring with laughter, pushed in fast
  { n: 0, mood: "chamber", dof: 6, clouds: false, kicks: [0.0],
    cam: path([{ u: 0, pos: [0.4, 2.3, 0.6], look: [3.4, 1.6, -3.6], fov: 46 }, { u: 1, pos: [0.8, 2.15, -0.3], look: [3.4, 1.6, -3.6], fov: 44 }], 0),
    pose: (w, t) => {
      w.chamber.g.visible = true;
      w.mps(t, "laugh");
      w.cast.person(MP(0), "mpL", 2.0, 0.55, -2.2, { mode: "stand", expr: "laugh", blink: false, res: 1.1, tilt: 6 * Math.sin(t * 14) });
    } },
  // 0b ... when he made London's sewers: a fast fly down the giant tunnel to him
  { n: 0, w: { en: 2, es: 3 }, mood: "tunnel", dof: 8,
    cam: path([{ u: 0, pos: [0.2, 4.4, 19], look: [0, 3.4, -20], fov: 52 }, { u: 0.55, pos: [-1.2, 2.3, 7.5], look: [-2.6, 2.0, 3.0], fov: 38 }, { u: 1, pos: [-1.1, 2.35, 7.0], look: [-2.6, 2.0, 3.0], fov: 38 }], 0),
    pose: (w, t, u) => {
      w.tunnel.g.visible = true; w.tunnel.flow(t);
      w.cast.person(BAZ, "baz", -2.6, 1.1, 3.0, { mode: "stand", expr: u > 0.6 ? "grin" : "smile", blink: blinkAt(t, 1), res: 1.1 });
    } },
  // 0c ... TWICE as big: cut wide on the word, the dashed normal-size ring snaps to the real tunnel, "x2"
  { n: 0, w: { en: 7, es: 10 }, mood: "tunnel", dof: 0, kicks: [0.02],
    cam: path([{ u: 0, pos: [0.4, 4.2, 17], look: [0, 4.0, -8], fov: 46 }, { u: 1, pos: [0.3, 4.3, 14.5], look: [0, 4.0, -8], fov: 46 }], 0),
    pose: (w, t, u, L) => {
      w.tunnel.g.visible = true; w.tunnel.flow(t);
      w.cast.person(BAZ, "baz", -2.6, 1.1, 3.0, { mode: "stand", expr: "grin", wave: 0.6, blink: false, res: 1.1 });
      const tw = word(L, 0, L === "es" ? 10 : 7);
      const k = easeOut((t - tw) / 0.25), r = 4.5 * (0.5 + 0.5 * k);
      w.cast.card(`ring${Math.round(r * 20)}`, 500, 500, ringDraw(k > 0.98 ? "#ffd43b" : "#e0302c"), 0, 4.5, -10, 2.2 * r, 2.2 * r);
      const p = easeOut((t - tw - 0.15) / 0.2); if (p > 0) w.cast.card("x2", 600, 400, x2Draw, 0, 8.2, -9.5, 4.2 * p, 2.8 * p);
    } },
  // 1 every toilet in London emptied straight into the river (a row of toilets on the bank, pipes pouring in)
  { n: 1, mood: "fog", river: true, dof: 4,
    cam: path([{ u: 0, pos: [-5.5, 2.6, 9.5], look: [-4.5, 1.4, -3.5], fov: 40 }, { u: 1, pos: [4, 5.0, 18], look: [-1, 1.4, -3], fov: 42 }]),
    pose: (w, t) => {
      w.bank.visible = true;
      for (let i = 0; i < 4; i++) { const x = -8 + i * 3.2; w.toilets[i].visible = true; w.toilets[i].position.set(x, 1.5, -3.2); w.toilets[i].scale.setScalar(1.6); }
      const pipes = (w.bank as any).pipes as THREE.Vector3[];
      pipes.forEach((p, i) => { if (Math.abs(p.x) < 30) w.cast.card(`st${i}${Math.floor(t * 8) % 4}`, 300, 300, streamDraw(t + i), p.x, 0.25, p.z + 0.3, 1.3, 1.3); });
      for (let i = 0; i < 4; i++) w.cast.card(`stk${i}`, 300, 300, stinkDraw(i), -8 + i * 3.2 + 0.2 * Math.sin(t + i), 3.6 + 0.3 * ((t * 0.5 + i * 0.3) % 1), -3.0, 1.2, 1.2, { soft: true });
    } },
  // 2 the same river people drank from
  { n: 2, mood: "fog", river: true, dof: 10,
    cam: path([{ u: 0, pos: [0.7, 1.3, 7.4], look: [0.6, 1.25, 0.6], fov: 40 }, { u: 1, pos: [0.6, 1.3, 6.4], look: [0.6, 1.25, 0.6], fov: 40 }]),
    pose: (w, t) => {
      w.bank.visible = true;
      w.cast.person(POOR(1), "w1", -0.3, 0.3, 0.6, { mode: "stand", expr: "smile_closed", blink: blinkAt(t, 2), res: 1.0 });
      w.cast.person(KIDP, "k1", 1.6, 0.3, 0.9, { mode: "stand", expr: "lick", blink: blinkAt(t, 3), res: 1.0 });
      w.cast.card("cup", 300, 300, cupDraw, 2.05, 1.05, 1.0, 0.42, 0.42);
      w.cast.card("bucket", 300, 300, bucketDraw, 0.3, 0.55, 0.9, 0.7, 0.7);
      const p = ((w.bank as any).pipes as THREE.Vector3[])[7];
      w.cast.card(`st2${Math.floor(t * 8) % 4}`, 300, 300, streamDraw(t), -3.2, 0.25, -1.0, 1.4, 1.4); void p;
    } },
  // 3 cholera; the doctors were sure it came from the smell (foggy street, green stink, doctors sniffing)
  { n: 3, mood: "fog", dof: 9, clouds: false,
    cam: path([{ u: 0, pos: [0.6, 2.0, 10], look: [0, 1.6, 0], fov: 40 }, { u: 1, pos: [0.4, 1.7, 6.2], look: [0, 1.6, 0], fov: 38 }]),
    pose: (w, t, u) => {
      w.street.visible = true;
      w.cast.person(POOR(2), "sick", -2.4, 0, -2.5, { mode: "sit", expr: "pained", blink: false, res: 0.8 });
      const sniff = u > 0.45;
      w.cast.person(DOCTOR(0), "d0", -0.7, 0, 0.2, { mode: "stand", expr: sniff ? "stern" : "nervous", blink: blinkAt(t, 4), res: 1.0, face: sniff ? undefined : pinch });
      w.cast.person(DOCTOR(1), "d1", 1.0, 0, 0.0, { mode: "stand", expr: sniff ? "shock" : "neutral", wave: sniff ? 0.9 : undefined, blink: blinkAt(t, 5), res: 1.0, mirror: true });
      for (let i = 0; i < 5; i++) { const k = (t * 0.25 + i / 5) % 1; w.cast.card(`fs${i}`, 300, 300, stinkDraw(i), -3 + 1.5 * i + 0.6 * Math.sin(t + i), 0.8 + 2.4 * k, -1.5 + 0.5 * hh(i), 1.6 + k, 1.6 + k, { soft: true }); }
    } },
  // 4 he asks for pipes twice as wide; the politicians laugh
  { n: 4, mood: "chamber", dof: 7, clouds: false,
    cam: path([{ u: 0, pos: [0.3, 2.0, 0.8], look: [0.5, 1.8, -4.5], fov: 40 }, { u: 0.62, pos: [0.3, 2.0, 0.4], look: [0.5, 1.8, -4.5], fov: 40 }, { u: 1, pos: [0, 2.6, 1.2], look: [3.6, 1.7, -4.0], fov: 46 }]),
    pose: (w, t, u, L) => {
      w.chamber.g.visible = true;
      const laugh = u > 0.72;
      w.cast.person(BAZ, "baz", 0.2, 0, -4.5, { mode: "stand", expr: laugh ? "nervous" : "smile", blink: blinkAt(t, 1), res: 1.0 });
      w.cast.card(`plan${laugh ? 1 : 0}`, 600, 400, planDraw(smooth((u - 0.2) / 0.4)), 1.0, 1.75, -4.3, 1.2, 0.8);
      w.mps(t, laugh ? "laugh" : "neutral");
    } },
  // 5 "Twice the bricks?"
  { n: 5, mood: "chamber", dof: 11, clouds: false,
    cam: still([-1.0, 1.85, -2.4], [-2.6, 1.75, -4.6], 36, 3),
    pose: (w, t) => {
      w.chamber.g.visible = true;
      w.cast.person(MP(0), "mpA", -2.6, 0.55, -4.6, { mode: "stand", expr: "laugh", blink: false, res: 1.2 });
      w.cast.card("brick", 300, 300, brickDraw, -1.95, 1.55, -4.2, 0.55, 0.55, { rot: 0.2 * Math.sin(t * 9) });
    } },
  // 6 "For a smell?"
  { n: 6, mood: "chamber", dof: 11, clouds: false,
    cam: still([1.0, 1.9, -1.8], [2.6, 1.8, -4.0], 36, -3),
    pose: (w, t) => {
      w.chamber.g.visible = true;
      w.cast.person(MP(4), "mpB", 2.6, 0.55, -4.0, { mode: "stand", expr: "laugh", blink: false, res: 1.2, face: pinch, mirror: true });
      w.cast.person(MP(2), "mpC", 4.0, 1.1, -5.6, { mode: "stand", expr: "laugh", blink: blinkAt(t, 3), res: 0.8 });
    } },
  // 7 the summer of 1858: Parliament by the river, the thermometer climbs
  { n: 7, mood: "heat", river: true,
    cam: path([{ u: 0, pos: [80, 10, 120], look: [55, 36, 0], fov: 42 }, { u: 1, pos: [74, 8, 104], look: [58, 32, 0], fov: 42 }]),
    pose: (w, t, u) => {
      w.parl.visible = true; w.bankFar.visible = true;
      w.cast.card(`th${Math.round(u * 20)}`, 300, 500, thermoDraw(0.2 + 0.8 * easeOut(u * 1.2)), 66, 18, 74, 7, 11.7);
    } },
  // 8 the river cooked like soup, and the stink rolled into Parliament
  { n: 8, mood: "heat", river: true, kicks: [0.62],
    cam: path([{ u: 0, pos: [10, 3, 70], look: [0, 1, 40], fov: 42 }, { u: 0.5, pos: [6, 5, 60], look: [0, 4, 30], fov: 42 }, { u: 1, pos: [0, 12, 42], look: [0, 10, 10], fov: 40 }]),
    pose: (w, t, u) => {
      w.parl.visible = true; w.bankFar.visible = true;
      for (let i = 0; i < 9; i++) { const k = (t * 1.3 + hh(i)) % 1; w.cast.card(`bub${i}${Math.floor(k * 12)}`, 300, 300, bubbleDraw(k), -12 + 24 * hh(i, 2), 0.2, 32 + 30 * hh(i, 3), 2.2, 2.2); }
      for (let i = 0; i < 6; i++) { const k = clamp01(u * 1.4 - i * 0.08); w.cast.card(`sk${i}`, 300, 300, stinkDraw(i), -14 + 6 * i, 2 + 8 * k, 40 - 28 * k, 8, 8, { soft: true }); }
    } },
  // 9 they soaked the curtains in bleach
  { n: 9, mood: "chamber", dof: 8, clouds: false,
    cam: path([{ u: 0, pos: [5.2, 7.9, 8.5], look: [10.6, 8.2, 1.4], fov: 44 }, { u: 1, pos: [5.8, 7.8, 7.4], look: [10.6, 8.2, 1.4], fov: 42 }]),
    pose: (w, t, u) => {
      w.chamber.g.visible = true; w.chamber.wet(t, 1);
      w.cast.card("bucketc", 300, 300, bucketDraw, 9.5, 7.2, 2.2, 0.6, 0.6); w.cast.person(WORKER(1), "clerk", 9.6, 6.3, 2.9, { mode: "stand", expr: "pained", blink: false, res: 0.9, face: pinch });
      for (let i = 0; i < 8; i++) { const k = (t * 1.6 + hh(i)) % 1; w.cast.card(`dr${i}`, 300, 300, dropDraw("#d8e4e8"), 10.7, 7.2 - 2 * k, 0.6 + (i % 4) * 1.0 + (i > 3 ? 2.7 : 0), 0.22, 0.22); }
      void u;
    } },
  // 10 they held hankies to their noses
  { n: 10, mood: "chamber", dof: 9, clouds: false,
    cam: path([{ u: 0, pos: [0.2, 2.4, 2.4], look: [-3.0, 1.7, -3], fov: 42 }, { u: 1, pos: [-0.2, 2.3, 1.6], look: [-3.0, 1.7, -3], fov: 40 }]),
    pose: (w, t) => {
      w.chamber.g.visible = true; w.chamber.wet(t, 1);
      [[-2.6, 0.55, -2.0, 0], [-4.0, 1.1, -3.0, 1], [-2.6, 0.55, -4.6, 3], [-4.0, 1.1, -5.8, 4], [-5.4, 1.65, -3.6, 5]].forEach(([x, y, z, v], i) =>
        w.cast.person(MP(v), `h${i}`, x, y, z, { mode: "stand", expr: i % 2 ? "nervous" : "pained", blink: blinkAt(t, i), res: 0.9, face: (pp) => { hanky(pp); if (i === 0) sweat(pp); } }));
    } },
  // 11 they called it the Great Stink (the newspaper)
  { n: 11, mood: "chamber", dof: 12, clouds: false,
    cam: path([{ u: 0, pos: [0, 2.0, -1.2], look: [0, 1.5, -5], fov: 40 }, { u: 1, pos: [0, 1.9, -2.6], look: [0, 1.5, -5], fov: 36 }]),
    pose: (w, t, u, L) => {
      w.chamber.g.visible = true;
      w.cast.person(MP(1), "news", 0, 0, -5.2, { mode: "stand", expr: "pained", blink: blinkAt(t, 7), res: 1.0, face: pinch });
      w.cast.card(`paper_${L}`, 600, 800, paperDraw(L === "es" ? "LA GRAN PESTE" : "THE GREAT STINK", L === "es" ? "LONDRES · 1858" : "LONDON · 1858"), 0.0, 1.75, -4.85, 0.8, 1.07, { rot: 0.04 * Math.sin(t * 2) });
      void u;
    } },
  // 12 in just eighteen days they gave him everything
  { n: 12, mood: "chamber", dof: 6, clouds: false, kicks: [0.82],
    cam: path([{ u: 0, pos: [0, 6.5, 9], look: [0, 1.4, -5], fov: 56 }, { u: 1, pos: [0, 5.2, 6.0], look: [0, 1.6, -5], fov: 52 }]),
    pose: (w, t, u) => {
      w.chamber.g.visible = true;
      const vote = u > 0.55;
      w.cast.person(BAZ, "baz", 0.2, 0, -4.5, { mode: "stand", expr: vote ? "grin" : "smile", blink: blinkAt(t, 1), res: 1.0 });
      w.mps(t, vote ? "grin" : "pained", vote);
      if (u < 0.5) { const n = Math.min(18, 1 + Math.floor(u * 2 * 18)); w.cast.card(`num${n}`, 300, 300, numDraw(String(n)), 0, 4.2, -6, 2.0, 2.0); }
    } },
  // 13 three hundred million bricks
  { n: 13, mood: "yard", clouds: true,
    cam: path([{ u: 0, pos: [3, 2.2, 14], look: [0, 2.4, -4], fov: 40 }, { u: 1, pos: [10, 12, 30], look: [0, 4, -6], fov: 44 }]),
    pose: (w, t) => {
      w.yard.visible = true;
      for (let i = 0; i < 6; i++) { const ph = (t * 0.9 + i / 6) % 1; w.cast.person(WORKER(i), `wk${i}`, -6 + 2.4 * i, 0, 5 - 1.2 * (i % 2), { mode: "stroll", phase: ph, expr: i % 2 ? "stern" : "whistle", blink: blinkAt(t, i), res: 0.7, mirror: i % 2 === 0 }); w.cast.card("brk", 300, 300, brickDraw, -6 + 2.4 * i + 0.4, 2.15, 5.05 - 1.2 * (i % 2), 0.5, 0.5); }
    } },
  // 14 tunnels you could drive a carriage through
  { n: 14, mood: "tunnel", dof: 0,
    cam: path([{ u: 0, pos: [1.6, 2.4, 14], look: [0, 2.6, -20], fov: 46 }, { u: 1, pos: [1.2, 2.2, 10], look: [0, 2.4, -20], fov: 46 }]),
    pose: (w, t, u) => {
      w.tunnel.g.visible = true; w.tunnel.flow(t);
      const z = -34 + 40 * u;
      w.cart.visible = true; w.cart.position.set(-1.2, 0.55, z); w.cart.rotation.y = 0; w.cart.scale.setScalar(1.3);
      w.cast.card(`horse${Math.floor(t * 8) % 8}`, 600, 500, horseDraw(t * 1.6), -1.2, 0.55 + 1.3, z + 3.4, 3.0, 2.5);
      w.cast.person(BAZ, "baz", 2.8, 1.1, -2, { mode: "stand", expr: "grin", wave: 0.5 + 0.5 * Math.sin(t * 10), blink: blinkAt(t, 1), res: 0.9 });
    } },
  // 15 on top, a new riverside road with a train line hidden inside (cut-away)
  { n: 15, mood: "day", river: false,
    cam: path([{ u: 0, pos: [0.5, 12.0, 8], look: [0.5, 11.4, -4], fov: 42 }, { u: 0.4, pos: [0.5, 11.6, 11], look: [0.5, 10.5, -4], fov: 44 }, { u: 1, pos: [0.6, 7.2, 25], look: [0.6, 6.4, -2], fov: 44 }]),
    pose: (w, t, u) => {
      w.emb.g.visible = true; w.emb.update(t, -70 + 60 * smooth((u - 0.4) / 0.6), 0);
      for (let i = 0; i < 4; i++) w.cast.person(POOR(i), `ws${i}`, -3.6 + 2.4 * i, 10.4, -3 - 2 * (i % 2), { mode: "stroll", phase: (t * 0.8 + i / 4) % 1, expr: "smile", blink: blinkAt(t, i), res: 0.6, mirror: i % 2 === 0 });
    } },
  // 16 that road is the Embankment, and trains still rumble through it today
  { n: 16, mood: "day", kicks: [0.3, 0.38],
    cam: path([{ u: 0, pos: [1.2, 7.0, 11], look: [0, 7.0, -6], fov: 42 }, { u: 1, pos: [0.6, 8.4, 24], look: [0.6, 7.6, -2], fov: 44 }]),
    pose: (w, t, u) => {
      w.emb.g.visible = true; w.emb.update(t, -90 + 82 * u);
      for (let i = 0; i < 5; i++) w.cast.person(MODERN(i), `md${i}`, -4 + 2 * i, 10.4, -2.5 - 2 * (i % 2), { mode: "stroll", phase: (t * 0.9 + i / 5) % 1, expr: i % 2 ? "smile" : "neutral", blink: blinkAt(t, i), res: 0.6, mirror: i % 2 === 1 });
    } },
  // 17 but he was wrong about one thing
  { n: 17, mood: "tunnel", dof: 12, xfade: 6,
    cam: path([{ u: 0, pos: [-2.4, 2.2, 7.2], look: [-2.6, 2.1, 3.0], fov: 36, roll: 0 }, { u: 1, pos: [-2.5, 2.2, 6.2], look: [-2.6, 2.1, 3.0], fov: 36, roll: 4 }]),
    pose: (w, t, u) => {
      w.tunnel.g.visible = true; w.tunnel.flow(t);
      w.cast.person(BAZ, "baz", -2.6, 1.1, 3.0, { mode: "stand", expr: u > 0.55 ? "nervous" : "grin", blink: blinkAt(t, 1), res: 1.2 });
      if (u > 0.55) { const k = easeOut((u - 0.55) / 0.15); w.cast.card("q", 300, 300, qDraw, -1.9, 3.5, 3.05, 0.7 * k, 0.7 * k); }
    } },
  // 18 cholera never came from the smell (a doctor sniffs the stink: nothing)
  { n: 18, mood: "fog", dof: 10, clouds: false,
    cam: still([0.3, 1.9, 4.2], [0, 1.75, 0], 38),
    pose: (w, t, u) => {
      w.street.visible = true;
      w.cast.person(DOCTOR(0), "d0", 0, 0, 0, { mode: "stand", expr: u > 0.6 ? "dazed" : "whistle", blink: blinkAt(t, 4), res: 1.1 });
      w.cast.card("stinkA", 300, 300, stinkDraw(2), 0.9, 2.2, 0.3, 1.2, 1.2, { soft: true });
      if (u > 0.6) w.cast.card("xx", 300, 300, xDraw, 0.9, 2.2, 0.35, 0.9 * easeOut((u - 0.6) / 0.12), 0.9 * easeOut((u - 0.6) / 0.12));
    } },
  // 19 it came from the water (a glass of river water, germs wriggling)
  { n: 19, mood: "fog", clouds: false,
    cam: still([0, 1.2, 1.6], [0, 1.15, 0], 34),
    pose: (w, t) => {
      w.street.visible = true;
      w.cast.card(`glass${Math.floor(t * 10)}`, 600, 800, glassDraw(7, t), 0, 1.15, 0, 0.9, 1.2);
    } },
  // 20 carrying the filth away from the river stopped it anyway (the intercepting sewer runs, the river clears)
  { n: 20, mood: "day", xfade: 6,
    cam: path([{ u: 0, pos: [0, 2.35, 1.5], look: [0, 2.0, -12], fov: 46 }, { u: 0.45, pos: [0, 2.8, 14], look: [0, 2.6, -6], fov: 44 }, { u: 1, pos: [3.0, 9.0, 24], look: [3.0, 8.4, -2], fov: 44 }]),
    pose: (w, t, u) => {
      w.emb.g.visible = true; w.emb.update(t, -200, smooth((u - 0.4) / 0.4));
      for (let i = 0; i < 3; i++) w.cast.person(POOR(i + 3), `dk${i}`, -2.5 + 2.4 * i, 10.4, -2, { mode: "stand", expr: u > 0.5 ? "relief" : "smile", blink: blinkAt(t, i), res: 0.6, mirror: i === 1 });
      if (u > 0.5) w.cast.card(`cup${i0(t)}`, 300, 300, cupDraw, -1.9, 11.6, -1.9, 0.35, 0.35);
    } },
  // 21 when it struck one last time, it hit the only part of town his sewers hadn't reached
  { n: 21, mood: "dusk",
    cam: path([{ u: 0, pos: [-110, 70, 70], look: [-50, 0, 0], fov: 40 }, { u: 1, pos: [40, 60, 80], look: [70, 0, 0], fov: 40 }], 0),
    pose: (w, t) => {
      w.aerial.visible = true;
      for (let i = 0; i < 14; i++) w.cast.card(`gm${i % 3}`, 300, 300, germDraw(i), 20 + 90 * hh(i, 2), 12 + 4 * Math.sin(t * 2 + i), -50 + 100 * hh(i, 3), 13, 13);
    } },
  // 22 today: more than twice the people, and his tunnels still work (then down into the ground)
  { n: 22, mood: "golden", clouds: true,
    cam: path([{ u: 0, pos: [0, 30, 60], look: [0, 40, -80], fov: 46 }, { u: 0.6, pos: [0, 8, 26], look: [0, 4, -10], fov: 44 }, { u: 1, pos: [0, 2.2, 10], look: [0, 1.4, -5], fov: 44 }]),
    pose: (w, t) => {
      w.city.visible = true;
      for (let i = 0; i < 22; i++) { const row = i % 3, x = -14 + ((i * 2.9 + t * (row % 2 ? 1.1 : -1.1)) % 28 + 28) % 28; w.cast.person(MODERN(i), `cr${i % 14}`, x, 0.25, -3 - 1.6 * row, { mode: "stroll", phase: (t * 1.2 + hh(i)) % 1, expr: (["smile", "neutral", "smile_closed"] as const)[i % 3], blink: blinkAt(t, i), res: 0.5, mirror: row % 2 === 1 }); }
    } },
  // 23 "Because..." -> back to the laughing benches (the first frame), so the loop is seamless
  { n: 23, mood: "chamber", dof: 6, clouds: false, xfade: 6,
    cam: path([{ u: 0, pos: [-0.6, 2.6, 2.4], look: [3.4, 1.6, -3.6], fov: 48 }, { u: 1, pos: [0.4, 2.3, 0.6], look: [3.4, 1.6, -3.6], fov: 46 }], 0),
    pose: (w, t) => {
      w.chamber.g.visible = true;
      w.mps(t, "laugh");
      w.cast.person(MP(0), "mpL", 2.0, 0.55, -2.2, { mode: "stand", expr: "laugh", blink: false, res: 1.1, tilt: 6 * Math.sin(t * 14) });
    } },
];
const i0 = (t: number) => Math.floor(t * 2) % 2;

// ---------------- timeline ----------------
export const shotStart = (L: Lang, i: number) => (SHOTS[i].w ? word(L, SHOTS[i].n, SHOTS[i].w![L]) - 0.05 : at(L, SHOTS[i].n, SHOTS[i].f ?? 0));
export const shotEnd = (L: Lang, i: number) => (i + 1 < SHOTS.length ? shotStart(L, i + 1) : FRAMES[L] / FPS);
export const shotAt = (L: Lang, t: number) => { let i = 0; while (i + 1 < SHOTS.length && t >= shotStart(L, i + 1)) i++; return i; };
export const layersAt = (L: Lang, f: number): { i: number; alpha: number }[] => {
  const t = f / FPS, i = shotAt(L, t), n = SHOTS[i].xfade;
  if (n && i > 0) { const k = (f - Math.round(shotStart(L, i) * FPS)) / n; if (k < 1) return [{ i: i - 1, alpha: 1 }, { i, alpha: smooth(k) }]; }
  return [{ i, alpha: 1 }];
};
/** impact shake: flip sign every frame, decay over 7 frames */
const kickAt = (L: Lang, i: number, t: number) => {
  let s = 0; const a = shotStart(L, i), b = shotEnd(L, i);
  const ks = (SHOTS[i].kicks ?? []).map((k) => a + k * (b - a)); if (SHOTS[i].kw) ks.push(word(L, SHOTS[i].n, SHOTS[i].kw![L]));
  for (const kt of ks) { const df = Math.round((t - kt) * FPS); if (df >= 0 && df < 7) s += (df % 2 ? -1 : 1) * (1 - df / 7) * 0.25; }
  return s;
};

// ---------------- world ----------------
export class World {
  root = new THREE.Group(); env = new Env(); cast = new Cast();
  tunnel = new Tunnel(); bank: THREE.Group; bankFar: THREE.Group; parl: THREE.Group; chamber = new Chamber(); street: THREE.Group; yard: THREE.Group;
  cart: THREE.Group; emb = new Embankment(); aerial: THREE.Group; city: THREE.Group; toilets: THREE.Group[] = [];
  private sets: THREE.Object3D[];
  constructor() {
    this.bank = riverBank(0); this.bankFar = riverBank(3); this.bankFar.position.set(0, 0, -6); this.bankFar.rotation.y = Math.PI; this.bankFar.position.z = 130;
    this.parl = parliament(false); this.parl.position.set(0, 0, -12);
    this.street = victorianStreet(); this.yard = brickYard(); this.cart = carriage(); this.aerial = townAerial(); this.city = modernCity();
    for (let i = 0; i < 4; i++) { const t = toilet(); this.toilets.push(t); this.bank.add(t); }
    this.sets = [this.tunnel.g, this.bank, this.bankFar, this.parl, this.chamber.g, this.street, this.yard, this.cart, this.emb.g, this.aerial, this.city];
    this.root.add(this.env.root, ...this.sets, this.cast.root);
  }
  /** the benches of MPs on the left and right (laughing, sniffing, or voting with raised hands) */
  mps(t: number, expr: "laugh" | "neutral" | "grin" | "pained", vote = false) {
    let k = 0;
    for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let j = 0; j < 4; j++) {
      const x = s * (2.6 + r * 1.4), y = r * 0.55 + 0.55, z = -1 - j * 2.6 - (r % 2) * 1.3;
      const v = k++;
      this.cast.person(MP(v), `mp${v}`, x, y, z, { mode: "stand", expr: expr === "neutral" ? (v % 3 ? "neutral" : "smile") : expr, wave: vote ? 0.7 + 0.3 * Math.sin(t * 6 + v) : undefined, blink: blinkAt(t, v), res: 0.55, mirror: s > 0, face: expr === "pained" && !vote ? hanky : undefined });
    }
  }
  update(L: Lang, i: number, t: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[i], M = MOODS[s.mood], a = shotStart(L, i), b = shotEnd(L, i), u = clamp01((t - a) / Math.max(0.01, b - a)), c = s.cam(u);
    const kk = kickAt(L, i, t);
    cam.position.set(...c.pos); cam.position.y += kk * 0.6; cam.fov = c.fov; cam.up.set(0, 1, 0);
    cam.lookAt(c.look[0], c.look[1] + kk * 0.2, c.look[2]); cam.rotateZ(((c.roll ?? 0) * Math.PI) / 180 + kk * 0.01); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    for (const o of this.sets) o.visible = false;
    for (const tl of this.toilets) tl.visible = false;
    const outdoor = ["fog", "heat", "day", "dusk", "golden", "yard"].includes(s.mood);
    this.env.apply(M, scene, cam, t, s.mood === "golden" ? "#ffe0c0" : s.mood === "dusk" ? "#c9a6c8" : s.mood === "fog" ? "#d8d8c4" : "#ffffff", (s.clouds ?? outdoor) && outdoor);
    this.env.sky.visible = outdoor;
    this.env.sea.position.y = 0; this.env.sea.visible = !!s.river;
    this.env.seaU.calm.value.set(0, 0, 1, 0);
    this.cast.begin(cam, M.tint);
    s.pose(this, t, u, L);
    return new THREE.Vector3(...c.look);
  }
}
void ramp; void flashDraw; void puffDraw; void splashDraw; void Y;
