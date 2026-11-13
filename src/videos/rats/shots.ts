// "The Rat Tail Bounty": every shot is tied to a sentence of the narration (EN and ES share one shot list).
import * as THREE from "three";
import { V3, MoodDef, glide, lv, smooth, clamp01, hh, easeOut } from "../emden/lib";
import { Env } from "../emden/env";
import { Cast, blinkAt, qDraw, numDraw } from "../emden/chars";
import { paperDraw, bucketDraw, xDraw } from "../sewers/cast";
import { Street, Pipe, bathroom, Office, village, classroom } from "./sets";
import {
  OFFICIAL, INSPECTOR, LOCAL, CREW, ECON, hasNonLa, pith, nonLa, headband, glasses, lanternHand, both,
  ratDraw, tailDraw, coinDraw, bulbDraw, scissorsDraw, sparkleDraw, bangDraw, deskRatsDraw, posterTex, posterOffTex, boardDraw, tallyDraw, fmt,
} from "./cast";
import WORDS_EN from "../../../public/rats_words_en.json";
import WORDS_ES from "../../../public/rats_words_es.json";

export const FPS = 30;
export type Lang = "en" | "es";
type W = { w: string; s: number; e: number };
export const WORDS: Record<Lang, W[]> = { en: WORDS_EN as W[], es: WORDS_ES as W[] };
const sentences = (ws: W[]) => { const st: number[] = [0]; ws.forEach((w, i) => { if (/[.?]$/.test(w.w) && i < ws.length - 1) st.push(ws[i + 1].s); }); return st; };
export const SENT: Record<Lang, number[]> = { en: sentences(WORDS.en), es: sentences(WORDS.es) };
export const VOICE_END: Record<Lang, number> = { en: WORDS.en[WORDS.en.length - 1].e, es: WORDS.es[WORDS.es.length - 1].e };
export const FRAMES: Record<Lang, number> = { en: Math.round((VOICE_END.en + 0.9) * FPS), es: Math.round((VOICE_END.es + 0.9) * FPS) };
export const at = (L: Lang, n: number, f = 0) => { const S = SENT[L]; const a = S[n], b = n + 1 < S.length ? S[n + 1] : VOICE_END[L] + 0.9; return a + f * (b - a); };
export const word = (L: Lang, n: number, k: number) => { const S = SENT[L]; const i = WORDS[L].findIndex((w) => w.s >= S[n] - 1e-3); return WORDS[L][Math.min(WORDS[L].length - 1, i + k)].s; };

// ---------------- moods ----------------
export type Mood = "tropic" | "office" | "sewer" | "bath" | "dusk" | "village" | "class";
export const MOODS: Record<Mood, MoodDef> = {
  tropic: { skyTop: "#4f8fd6", skyHor: "#f6e6bc", seaNear: "#000", seaFar: "#000", crest: "#000", fogNear: 60, fogFar: 420,
    sun: "#fff0c8", sunI: 2.5, sunDir: [-0.4, 0.8, 0.5], amb: "#c9bfa0", ambI: 1.15, tint: "#fff6e6", stars: 0, disc: 0, grade: [1.04, 1, 0.94] },
  office: { skyTop: "#3a2a1a", skyHor: "#6a5034", seaNear: "#000", seaFar: "#000", crest: "#000", fogNear: 40, fogFar: 200,
    sun: "#ffe8b8", sunI: 2.2, sunDir: [-0.5, 0.7, 0.6], amb: "#b0a090", ambI: 1.15, tint: "#fff2dc", stars: 0, disc: 0, grade: [1.04, 1, 0.94] },
  sewer: { skyTop: "#0c1412", skyHor: "#1c2a26", seaNear: "#000", seaFar: "#000", crest: "#000", fogNear: 6, fogFar: 45,
    sun: "#ffd090", sunI: 1.3, sunDir: [0.2, 0.9, 0.4], amb: "#6a8a80", ambI: 1.2, tint: "#e6eedc", stars: 0, disc: 0, grade: [0.98, 1.02, 1] },
  bath: { skyTop: "#cfe2e8", skyHor: "#eef4f0", seaNear: "#000", seaFar: "#000", crest: "#000", fogNear: 40, fogFar: 200,
    sun: "#fff6e0", sunI: 2.0, sunDir: [-0.6, 0.7, 0.4], amb: "#c0d0d8", ambI: 1.2, tint: "#ffffff", stars: 0, disc: 0, grade: [1, 1, 1] },
  dusk: { skyTop: "#2a2f6a", skyHor: "#d98a6a", seaNear: "#000", seaFar: "#000", crest: "#000", fogNear: 50, fogFar: 380,
    sun: "#ffb890", sunI: 1.6, sunDir: [-0.8, 0.35, -0.3], amb: "#6a62a8", ambI: 1.25, tint: "#e2c8dc", stars: 0.2, disc: 0, grade: [1, 0.96, 1.05] },
  village: { skyTop: "#5f84c9", skyHor: "#ffd08a", seaNear: "#000", seaFar: "#000", crest: "#000", fogNear: 80, fogFar: 600,
    sun: "#ffd8a0", sunI: 2.3, sunDir: [0.8, 0.35, -0.4], amb: "#9a8ac0", ambI: 1.05, tint: "#ffe8cc", stars: 0, disc: 1, grade: [1.05, 1, 0.92] },
  class: { skyTop: "#cfd8c8", skyHor: "#e8ecdf", seaNear: "#000", seaFar: "#000", crest: "#000", fogNear: 40, fogFar: 200,
    sun: "#fff4dc", sunI: 2.0, sunDir: [0.4, 0.8, 0.5], amb: "#b8c0b0", ambI: 1.2, tint: "#ffffff", stars: 0, disc: 0, grade: [1, 1, 1] },
};

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Key = { u: number; pos: V3; look: V3; fov: number; roll?: number };
const path = (keys: Key[], creep = 0.06) => (u: number): Cam => {
  let i = 0; while (i < keys.length - 1 && u > keys[i + 1].u) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b === a ? 0 : glide((u - a.u) / (b.u - a.u));
  const pos = lv(a.pos, b.pos, k), look = lv(a.look, b.look, k);
  return { pos: lv(pos, look, Math.min(0.3, creep * u)), look, fov: a.fov + (b.fov - a.fov) * k, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * k };
};
const still = (pos: V3, look: V3, fov: number, roll = 0) => path([{ u: 0, pos, look, fov, roll }], 0.08);

export type Shot = { n: number; f?: number; w?: Record<Lang, number>; kw?: Record<Lang, number>; mood: Mood; cam: (u: number) => Cam; dof?: number; xfade?: number; kicks?: number[];
  pose: (w: World, t: number, u: number, L: Lang) => void };

// handy cast shortcuts
const local = (w: World, v: number, key: string, x: number, y: number, z: number, o: any = {}) =>
  w.cast.person(LOCAL(v), key, x, y, z, { mode: "stand", expr: "neutral", res: 0.8, ...o, face: o.face ?? (hasNonLa(v) ? nonLa : undefined) });
const official = (w: World, key: string, x: number, y: number, z: number, o: any = {}) => w.cast.person(OFFICIAL, key, x, y, z, { mode: "stand", expr: "neutral", res: 0.9, ...o, face: o.face ? both(pith, o.face) : pith });
/** a running rat billboard (key cycles through 4 leg poses) */
const rat = (w: World, key: string, x: number, y: number, z: number, t: number, o: { tail?: number; s?: number; mirror?: boolean; baby?: boolean; col?: string } = {}) => {
  const ph = Math.floor((t * 8 + hh(key.length, x)) % 4) / 4, s = o.s ?? 0.5;
  const m = w.cast.card(`rat${ph}_${o.tail ?? 1}_${o.baby ? 1 : 0}_${o.col ?? ""}`, 520, 360, ratDraw(ph, o.tail ?? 1, o.col, o.baby), x, y + s * 0.34, z, s * 1.44, s);
  if (o.mirror) m.scale.x *= -1; return m;
};
/** a swarm of rats running toward +z (or the other way) in a band */
const swarm = (w: World, t: number, n: number, x0: number, x1: number, z0: number, z1: number, speed: number, o: { tail?: number; s?: number } = {}) => {
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * hh(i, 1), span = z1 - z0, z = z0 + ((hh(i, 2) * span + t * speed * (0.8 + 0.4 * hh(i, 3))) % span + span) % span;
    rat(w, `sw${i % 6}`, x, 0, z, t + i * 0.13, { tail: o.tail, s: (o.s ?? 0.5) * (0.8 + 0.4 * hh(i, 5)), mirror: speed < 0 });
  }
};

export const SHOTS: Shot[] = [
  // 0a hook: a tail slapped on the ledger, a coin slapped next to it (kick on "cent")
  { n: 0, mood: "office", dof: 7, kw: { en: 4, es: 4 },
    cam: path([{ u: 0, pos: [0.3, 2.0, 1.1], look: [0.1, 1.35, -1.3], fov: 44 }, { u: 1, pos: [0.25, 1.9, 0.7], look: [0.1, 1.35, -1.3], fov: 42 }], 0),
    pose: (w, t, u, L) => {
      w.office.g.visible = true; w.office.spin(t);
      official(w, "off", 0.0, 0, -2.2, { expr: t > word(L, 0, 4) ? "grin" : "neutral", blink: blinkAt(t, 1), res: 0.9 });
      w.cast.card("tail", 400, 300, tailDraw, 0.25, 1.06, -0.95, 0.7, 0.52, { flat: true, rot: 0.3 });
      const ct = word(L, 0, 4), k = easeOut((t - ct + 0.1) / 0.15);
      if (k > 0) w.cast.card("coin", 300, 300, coinDraw, -0.25, 1.06 + 0.4 * (1 - k), -0.85, 0.32, 0.32, { flat: true });
      void u;
    } },
  // 0b ... and the city ended up with MORE rats: the street floods with rats
  { n: 0, w: { en: 11, es: 11 }, mood: "tropic", kicks: [0.05],
    cam: path([{ u: 0, pos: [0.5, 1.4, 8], look: [0, 1.6, -10], fov: 46 }, { u: 1, pos: [0.4, 2.4, 11], look: [0, 1.2, -10], fov: 48 }], 0),
    pose: (w, t, u) => {
      w.street.g.visible = true;
      swarm(w, t, 80, -6, 6, -30, 8, 7, { s: 0.55 });
      official(w, "offS", 3.6, 0.22, 0, { expr: "shock", blink: false, res: 0.8, wave: 1 });
      local(w, 0, "l0", -4, 0.22, -2, { expr: "shock", blink: false });
      void u;
    } },
  // 1 in 1902 they built shiny new sewers under the French part of town
  { n: 1, mood: "tropic", xfade: 6,
    cam: path([{ u: 0, pos: [0, 12, 18], look: [0, 6, -20], fov: 44 }, { u: 1, pos: [3, 3.0, 9], look: [0, 0.2, -6], fov: 44 }]),
    pose: (w, t) => {
      w.street.g.visible = true; w.street.trench.visible = true;
      for (let i = 0; i < 4; i++) w.cast.person(CREW(i), `cr${i}`, -2.4 + (i % 2) * 4.8, 0.22, 1 - i * 4, { mode: "stand", expr: i % 2 ? "stern" : "whistle", prop: ["hammer", (t * 2 + i * 0.3) % 1 < 0.3 ? 1 : 0.2], blink: blinkAt(t, i), res: 0.6, face: headband });
      official(w, "offB", 4.2, 0.22, 4, { expr: "smile_closed", blink: blinkAt(t, 3), res: 0.7 });
    } },
  // 2 with flushing toilets, just like Paris
  { n: 2, mood: "bath", dof: 8,
    cam: path([{ u: 0, pos: [1.0, 1.9, 3.4], look: [0.1, 1.3, -2.2], fov: 44 }, { u: 1, pos: [0.8, 1.8, 2.7], look: [0.1, 1.3, -2.2], fov: 42 }]),
    pose: (w, t, u) => {
      w.bath.visible = true;
      official(w, "offT", 0.7, 0, -1.8, { expr: u > 0.5 ? "grin" : "smile", wave: u > 0.35 && u < 0.6 ? 1 : undefined, blink: blinkAt(t, 2), res: 0.9 });
      if (u > 0.55) w.cast.card(`sp${Math.floor(t * 6) % 3}`, 300, 300, sparkleDraw, -0.6, 1.4, -2.2, 0.8, 0.8);
    } },
  // 3 to a rat, those sewers were a luxury hotel
  { n: 3, mood: "sewer", dof: 6,
    cam: path([{ u: 0, pos: [0, 1.0, 6], look: [0, 0.9, -10], fov: 50 }, { u: 1, pos: [0, 0.9, 3.5], look: [0, 0.8, -10], fov: 48 }]),
    pose: (w, t) => {
      w.pipe.g.visible = true; w.pipe.flow(t);
      for (let i = 0; i < 9; i++) rat(w, `h${i}`, (i % 2 ? 0.8 : -0.8), 0.36, -1 - i * 1.4, t * 0.25 + i, { s: 0.42, mirror: i % 2 === 0 });
      w.cast.card(`hotel_${0}`, 600, 200, (p) => { const g = p.g; g.fillStyle = "#2a1a10"; g.fillRect(0, 0, 600, 200); g.strokeStyle = "#e8c45a"; g.lineWidth = 12; g.strokeRect(6, 6, 588, 188); g.font = "900 120px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffd27a"; g.fillText("HÔTEL", 300, 106); }, 0, 2.4, -6, 1.6, 0.53);
    } },
  // 4 warm, dark and full of food
  { n: 4, mood: "sewer", dof: 10,
    cam: still([0.4, 0.75, 1.6], [0.8, 0.5, -1.2], 40),
    pose: (w, t) => {
      w.pipe.g.visible = true; w.pipe.flow(t);
      rat(w, "e0", 0.8, 0.36, -1.2, t * 0.6, { s: 0.5 }); rat(w, "e1", 0.45, 0.36, -2.0, t * 0.5 + 1, { s: 0.45, mirror: true });
      for (let i = 0; i < 3; i++) w.cast.card(`zz${i}`, 300, 300, (p) => { const g = p.g; g.font = "900 140px sans-serif"; g.fillStyle = "#ffe8b0"; g.strokeStyle = "#241726"; g.lineWidth = 18; g.textAlign = "center"; g.strokeText("~", 150, 150); g.fillText("~", 150, 150); }, 0.8 + 0.1 * Math.sin(t + i), 0.9 + 0.25 * (((t * 0.6) + i / 3) % 1), -1.1, 0.25, 0.25, { soft: true });
    } },
  // 5 plague was spreading across Asia, and rats carry plague
  { n: 5, mood: "office", dof: 9,
    cam: path([{ u: 0, pos: [0, 1.85, 0.6], look: [0, 1.6, -2.2], fov: 40 }, { u: 1, pos: [0, 1.8, -0.2], look: [0, 1.6, -2.2], fov: 38 }]),
    pose: (w, t, u, L) => {
      w.office.g.visible = true; w.office.spin(t);
      official(w, "offP", 0, 0, -2.4, { expr: "nervous", blink: blinkAt(t, 1), res: 0.9 });
      w.cast.card(`plague_${L}`, 600, 800, paperDraw(L === "es" ? "¡PESTE EN ASIA!" : "PLAGUE IN ASIA!", "HANOÏ · 1902"), 0, 1.55, -1.85, 0.75, 1.0);
      if (u > 0.55) rat(w, "peek", 0.15, 2.05, -1.8, t, { s: 0.3 });
    } },
  // 6 crews sent down into the pipes
  { n: 6, mood: "tropic", dof: 6,
    cam: path([{ u: 0, pos: [2.0, 2.4, 6.5], look: [0, 0.6, 2], fov: 44 }, { u: 1, pos: [1.2, 1.8, 5.2], look: [0, 0.2, 2], fov: 44 }]),
    pose: (w, t, u) => {
      w.street.g.visible = true; w.street.manhole.visible = true;
      for (let i = 0; i < 3; i++) { const down = clamp01(u * 2.4 - i * 0.5); w.cast.person(CREW(i), `cw${i}`, -0.2 + 0.25 * i, 0.04 - 2.2 * down, 2.0 + 0.1 * i, { mode: "stand", expr: "stern", blink: blinkAt(t, i), res: 0.8, face: both(headband, lanternHand) }); }
      w.cast.person(CREW(1), "cwa", -1.6, 0.22, 3.0, { mode: "stand", expr: "nervous", blink: blinkAt(t, 5), res: 0.8, face: both(headband, lanternHand) });
    } },
  // 7 thousands a day (the tally climbs)
  { n: 7, mood: "sewer",
    cam: path([{ u: 0, pos: [0, 1.3, 7], look: [0, 1.2, -8], fov: 50 }, { u: 1, pos: [0, 1.2, 4], look: [0, 1.1, -8], fov: 50 }]),
    pose: (w, t, u, L) => {
      w.pipe.g.visible = true; w.pipe.flow(t);
      for (let i = 0; i < 3; i++) w.cast.person(CREW(i), `cp${i}`, -0.5 + 0.5 * i, 0.32, -3 - i * 1.2, { mode: "stroll", phase: (t * 1.4 + i / 3) % 1, expr: "stern", blink: blinkAt(t, i), res: 0.6, face: both(headband, lanternHand) });
      for (let i = 0; i < 8; i++) rat(w, `fl${i}`, -0.6 + 1.2 * hh(i, 4), 0.32, -5 - ((t * 5 + i * 1.7) % 12), t + i, { s: 0.35, mirror: true });
      w.cast.card(`tl${Math.floor(u * 10)}`, 800, 320, tallyDraw(fmt(1000 + 9000 * smooth(u), L)), 0, 2.45, -2, 2.4, 0.96);
    } },
  // 8 one day in June, more than twenty thousand
  { n: 8, mood: "office", dof: 8, kicks: [0.7],
    cam: path([{ u: 0, pos: [0, 2.2, 2.6], look: [0, 2.1, -2.4], fov: 44 }, { u: 1, pos: [0, 2.15, 2.0], look: [0, 2.1, -2.4], fov: 44 }]),
    pose: (w, t, u, L) => {
      w.office.g.visible = true; w.office.spin(t);
      official(w, "offN", 0, 0, -2.6, { expr: u > 0.7 ? "shock" : "stern", blink: blinkAt(t, 1), res: 0.9 });
      w.cast.card(`tl2${Math.floor(u * 12)}`, 800, 320, tallyDraw(fmt(Math.min(20114, 12000 + 8114 * easeOut(u * 1.4)), L)), 0, 3.15, -2.5, 2.2, 0.88);
    } },
  // 9 but the rats kept coming (out of the manhole)
  { n: 9, mood: "dusk",
    cam: path([{ u: 0, pos: [0.4, 1.0, 6], look: [0, 0.4, 1.5], fov: 44 }, { u: 1, pos: [0.4, 1.3, 7], look: [0, 0.4, 1.5], fov: 46 }]),
    pose: (w, t) => {
      w.street.g.visible = true; w.street.manhole.visible = true;
      for (let i = 0; i < 26; i++) { const k = (t * 0.9 + i / 26) % 1, a = hh(i, 1) * Math.PI * 2; rat(w, `mh${i % 5}`, Math.cos(a) * 5 * k, 0.05, 2 + Math.sin(a) * 4 * k, t + i, { s: 0.42, mirror: Math.cos(a) < 0 }); }
    } },
  // 10 so the French had a brilliant idea
  { n: 10, mood: "office", dof: 10,
    cam: still([0, 2.15, 1.6], [0, 2.15, -2.4], 42),
    pose: (w, t, u) => {
      w.office.g.visible = true; w.office.spin(t);
      official(w, "offI", 0, 0, -2.4, { expr: u > 0.4 ? "grin" : "stern", blink: blinkAt(t, 1), res: 1.0 });
      if (u > 0.4) { const k = easeOut((u - 0.4) / 0.15); w.cast.card("bulb", 300, 300, bulbDraw, 0.05, 2.75, -2.35, 0.7 * k, 0.7 * k); }
    } },
  // 11 anyone who brought in a rat tail would get paid one cent (the poster)
  { n: 11, mood: "tropic", dof: 6,
    cam: path([{ u: 0, pos: [-6.5, 2.0, 3.5], look: [-10.9, 2.5, 0], fov: 42 }, { u: 1, pos: [-7.6, 2.3, 1.6], look: [-10.9, 2.6, 0], fov: 40 }]),
    pose: (w, t, u, L) => {
      w.street.g.visible = true; w.street.poster.visible = true; w.street.setLang(L);
      for (let i = 0; i < 4; i++) local(w, i, `rd${i}`, -10.2, 0.22, [2.2, 1.6, -1.6, -2.2][i], { expr: i === 1 ? "grin" : "smile", blink: blinkAt(t, i), res: 0.7 });
    } },
  // 12 just the tail: nobody wanted a pile of dead rats on their desk
  { n: 12, mood: "office", dof: 9,
    cam: path([{ u: 0, pos: [0, 2.0, 1.3], look: [0, 1.45, -2.2], fov: 44 }, { u: 1, pos: [0, 1.95, 0.8], look: [0, 1.45, -2.2], fov: 42 }]),
    pose: (w, t, u) => {
      w.office.g.visible = true; w.office.spin(t);
      official(w, "offD", 0, 0, -2.3, { expr: u < 0.55 ? "pained" : "smile", blink: blinkAt(t, 1), res: 0.9 });
      if (u < 0.55) { w.cast.card("deskrats", 300, 160, deskRatsDraw, 0, 1.12, -1.0, 1.4, 0.75); w.cast.card("xx", 300, 300, xDraw, 0, 1.25, -0.85, 0.4, 0.4); }
      else w.cast.card("tail2", 400, 300, tailDraw, 0, 1.06, -0.95, 0.7, 0.52, { flat: true, rot: 0.2 });
    } },
  // 13 and it worked (a queue of people with tails, coins paid)
  { n: 13, mood: "office", dof: 4,
    cam: path([{ u: 0, pos: [3.6, 2.3, 3.4], look: [-0.2, 1.3, -1.2], fov: 48 }, { u: 1, pos: [3.3, 2.2, 3.0], look: [-0.2, 1.3, -1.2], fov: 46 }]),
    pose: (w, t) => {
      w.office.g.visible = true; w.office.spin(t);
      official(w, "offQ", -0.6, 0, -2.3, { expr: "grin", blink: blinkAt(t, 1), res: 0.9 });
      for (let i = 0; i < 5; i++) local(w, i + 1, `q${i}`, 0.5 - 0.35 * i, 0, -0.2 + 0.9 * i, { expr: "smile", blink: blinkAt(t, i + 3), res: 0.7, mirror: true });
    } },
  // 14 tails poured in by the bucket
  { n: 14, mood: "office", dof: 7,
    cam: still([0.2, 2.1, 1.0], [0, 1.4, -1.4], 44),
    pose: (w, t, u) => {
      w.office.g.visible = true; w.office.spin(t);
      official(w, "offR", 0, 0, -2.3, { expr: "laugh", blink: false, res: 0.9 });
      w.cast.card("bk", 300, 300, bucketDraw, 0.75, 1.5 - 0.2 * u, -0.8, 0.6, 0.6, { rot: -0.6 });
      for (let i = 0; i < 6 + Math.floor(u * 14); i++) w.cast.card("tl", 400, 300, tailDraw, -0.5 + 1.0 * hh(i, 2), 1.06 + 0.012 * i, -1.3 + 0.6 * hh(i, 3), 0.5, 0.37, { flat: true, rot: hh(i) * 6 });
    } },
  // 15 until officials noticed something strange
  { n: 15, mood: "tropic", dof: 9,
    cam: path([{ u: 0, pos: [1.0, 1.8, 5.5], look: [0.3, 1.7, 0], fov: 40 }, { u: 1, pos: [0.8, 1.75, 4.2], look: [0.3, 1.7, 0], fov: 38 }]),
    pose: (w, t, u) => {
      w.street.g.visible = true;
      official(w, "offW", 0.3, 0.22, 0, { mode: u < 0.4 ? "stroll" : "stand", phase: (t * 1.2) % 1, expr: u < 0.4 ? "whistle" : "nervous", blink: blinkAt(t, 1), res: 0.9 });
      if (u > 0.45) { const k = easeOut((u - 0.45) / 0.15); w.cast.card("q", 300, 300, qDraw, 0.95, 2.55, 0, 0.6 * k, 0.6 * k); }
    } },
  // 16 rats running through the streets with no tails
  { n: 16, mood: "tropic", kicks: [0.15],
    cam: path([{ u: 0, pos: [0.3, 0.45, 3.2], look: [0, 0.3, -4], fov: 46 }, { u: 1, pos: [0.3, 0.6, 4.5], look: [0, 0.3, -4], fov: 48 }]),
    pose: (w, t) => {
      w.street.g.visible = true;
      swarm(w, t, 14, -2.5, 2.5, -14, 3, 3, { tail: 0, s: 0.5 });
      official(w, "offX", 2.4, 0.22, -3, { expr: "shock", blink: false, res: 0.7 });
    } },
  // 17 people were catching rats, cutting off the tail, and letting them go
  { n: 17, mood: "dusk", dof: 9,
    cam: path([{ u: 0, pos: [0.4, 1.5, 3.8], look: [0, 1.2, 0], fov: 40 }, { u: 1, pos: [0.3, 1.4, 3.0], look: [0, 1.1, 0], fov: 38 }]),
    pose: (w, t, u) => {
      w.street.g.visible = true;
      local(w, 3, "snip", -0.5, 0.22, 0, { expr: u < 0.66 ? "smile" : "grin", blink: blinkAt(t, 2), res: 0.9 });
      if (u < 0.66) { rat(w, "held", 0.35, 1.0, 0.1, t, { s: 0.38, tail: u < 0.4 ? 1 : 0 }); w.cast.card(`sc${Math.floor(clamp01((u - 0.25) / 0.15) * 4)}`, 300, 300, scissorsDraw(clamp01((u - 0.25) / 0.15)), 0.0, 1.15, 0.2, 0.45, 0.45); }
      else { const k = (u - 0.66) / 0.34; rat(w, "free", 0.4 + 3 * k, 0.24, 0.3, t, { s: 0.38, tail: 0 }); w.cast.card("tail3", 400, 300, tailDraw, -0.1, 0.9, 0.3, 0.4, 0.3); }
    } },
  // 18 a rat with no tail can still have babies
  { n: 18, mood: "sewer", dof: 10,
    cam: still([0.45, 0.62, 1.2], [0.5, 0.48, -0.8], 40),
    pose: (w, t) => {
      w.pipe.g.visible = true; w.pipe.flow(t);
      rat(w, "mom", 0.7, 0.36, -0.9, t * 0.3, { s: 0.55, tail: 0 });
      for (let i = 0; i < 4; i++) rat(w, `b${i}`, 0.2 + 0.28 * i, 0.36, -0.6 + 0.05 * i, t * 0.3 + i, { s: 0.22, tail: 0.0001, baby: true, mirror: i % 2 === 1 });
    } },
  // 19 and every baby grows a brand new tail
  { n: 19, mood: "sewer", dof: 10,
    cam: still([0.5, 0.6, 1.1], [0.55, 0.48, -0.8], 38),
    pose: (w, t, u) => {
      w.pipe.g.visible = true; w.pipe.flow(t);
      rat(w, "mom", 0.95, 0.36, -1.0, t * 0.3, { s: 0.55, tail: 0 });
      const k = Math.round(smooth((u - 0.15) / 0.5) * 10) / 10;
      for (let i = 0; i < 4; i++) rat(w, `b${i}`, 0.15 + 0.3 * i, 0.36, -0.6 + 0.05 * i, t * 0.3 + i, { s: 0.22 + 0.06 * k, tail: Math.max(0.0001, k), baby: true, mirror: i % 2 === 1 });
      if (u > 0.6) w.cast.card(`sp2${Math.floor(t * 6) % 3}`, 300, 300, sparkleDraw, 0.6, 0.75, -0.5, 0.7, 0.7);
    } },
  // 20 inspectors found farms outside the city, raising rats on purpose
  { n: 20, mood: "village", dof: 6,
    cam: path([{ u: 0, pos: [-5, 2.0, 6], look: [-9, 1.0, -4], fov: 42 }, { u: 1, pos: [-6, 2.2, 3.5], look: [-10, 0.8, -4], fov: 40 }]),
    pose: (w, t, u) => {
      w.farm.visible = true;
      const pens = (w.farm as any).pens as THREE.Vector3[];
      for (let p = 0; p < 2; p++) for (let i = 0; i < 9; i++) { const c = pens[p], a = hh(i, p) * 6.28 + t * 0.6 * (i % 2 ? 1 : -1), r = 1.8 * hh(i, 3 + p); rat(w, `pf${p}${i % 4}`, c.x + Math.cos(a) * r, 0, c.z + Math.sin(a) * r, t + i, { s: 0.4, mirror: Math.sin(a) > 0 }); }
      w.cast.person(INSPECTOR, "insp", -7.0, 0, 0.2, { mode: "stand", expr: u > 0.4 ? "shock" : "stern", blink: blinkAt(t, 1), res: 0.8, face: both(pith, glasses) });
      local(w, 0, "farmer", -11.2, 0, -0.6, { expr: "grin", blink: blinkAt(t, 5), res: 0.8, wave: 0.6 + 0.4 * Math.sin(t * 8) });
    } },
  // 21 the French had accidentally invented rat farming (aerial of many pens)
  { n: 21, mood: "village",
    cam: path([{ u: 0, pos: [2, 16, 18], look: [-2, 0, -8], fov: 44 }, { u: 1, pos: [0, 22, 24], look: [-2, 0, -8], fov: 46 }], 0),
    pose: (w, t) => {
      w.farm.visible = true;
      const pens = (w.farm as any).pens as THREE.Vector3[];
      pens.forEach((c, p) => { for (let i = 0; i < 7; i++) { const a = hh(i, p) * 6.28 + t * 0.6 * (i % 2 ? 1 : -1), r = 1.8 * hh(i, 3 + p); rat(w, `pa${i % 4}`, c.x + Math.cos(a) * r, 0, c.z + Math.sin(a) * r, t + i, { s: 0.5 }); } });
    } },
  // 22 economists have a name for this
  { n: 22, mood: "class", dof: 8, xfade: 6,
    cam: still([0.7, 1.9, 4.6], [0.5, 1.8, -2.4], 44),
    pose: (w, t, u) => {
      w.classroom.visible = true;
      w.cast.person(ECON, "econ", 1.1, 0, -1.6, { mode: "stand", expr: "smile", wave: u > 0.5 ? 0.8 : undefined, blink: blinkAt(t, 1), res: 0.9, face: glasses });
      w.cast.card("board0", 600, 480, boardDraw("en", 0), -0.2, 2.6, -2.85, 3.0, 2.4);
    } },
  // 23 a perverse incentive (written on the board)
  { n: 23, mood: "class", dof: 0, kicks: [0.55],
    cam: path([{ u: 0, pos: [-0.15, 2.3, 4.8], look: [-0.15, 2.25, -2.9], fov: 46 }, { u: 1, pos: [-0.15, 2.3, 4.3], look: [-0.15, 2.25, -2.9], fov: 46 }], 0),
    pose: (w, t, u, L) => {
      w.classroom.visible = true;
      w.cast.card(`board_${L}${Math.round(clamp01(u / 0.5) * 12)}`, 600, 480, boardDraw(L, clamp01(u / 0.5)), -0.2, 2.6, -2.85, 3.0, 2.4);
      w.cast.person(ECON, "econ2", 0.95, 0, -1.6, { mode: "stand", expr: "grin", blink: blinkAt(t, 1), res: 0.9, face: glasses });
    } },
  // 24 pay for rat tails, and you'll get rat tails
  { n: 24, mood: "office", dof: 7,
    cam: still([0.0, 1.7, 0.35], [0, 1.1, -1.0], 40),
    pose: (w, t, u) => {
      w.office.g.visible = true; w.office.spin(t);
      for (let i = 0; i < 8 + Math.floor(u * 30); i++) w.cast.card("tl", 400, 300, tailDraw, -0.6 + 1.2 * hh(i, 2), 1.06 + 0.01 * i, -1.4 + 0.8 * hh(i, 3), 0.5, 0.37, { flat: true, rot: hh(i) * 6 });
      w.cast.card("coin2", 300, 300, coinDraw, 0.45, 1.3 + 0.05 * Math.sin(t * 6), -0.7, 0.3, 0.3);
    } },
  // 25 not fewer rats
  { n: 25, mood: "dusk", kicks: [0.1],
    cam: path([{ u: 0, pos: [0.5, 1.2, 7], look: [0, 1.0, -10], fov: 46 }, { u: 1, pos: [0.5, 1.6, 9], look: [0, 1.0, -10], fov: 48 }], 0),
    pose: (w, t) => {
      w.street.g.visible = true;
      swarm(w, t, 90, -6, 6, -30, 8, 6, { s: 0.55 });
    } },
  // 26 the bounty was cancelled, and the rats kept their luxury hotel
  { n: 26, mood: "tropic", dof: 5,
    cam: path([{ u: 0, pos: [-7.2, 2.4, 2.4], look: [-10.9, 2.6, 0], fov: 40 }, { u: 0.45, pos: [-7.4, 2.4, 2.0], look: [-10.9, 2.6, 0], fov: 40 }, { u: 1, pos: [-3, 1.2, 6], look: [0, 0.2, 2], fov: 44 }]),
    pose: (w, t, u, L) => {
      w.street.g.visible = true; w.street.poster.visible = true; w.street.setLang(L); w.street.manhole.visible = true;
      w.street.posterX.visible = u > 0.2; if (u > 0.2) w.street.posterX.scale.setScalar(0.6 + 0.4 * easeOut((u - 0.2) / 0.1));
      if (u > 0.5) for (let i = 0; i < 4; i++) rat(w, `ht${i}`, 0.3 * i - 0.4, 0.05, 2 + 0.2 * Math.sin(t + i), t * 0.4 + i, { s: 0.42, mirror: i % 2 === 0 });
    } },
  // 27 "Because..." -> back to the tail on the ledger (the first frame) for the loop
  { n: 27, mood: "office", dof: 7, xfade: 6,
    cam: path([{ u: 0, pos: [0.4, 2.2, 1.9], look: [0.1, 1.35, -1.3], fov: 46 }, { u: 1, pos: [0.3, 2.0, 1.1], look: [0.1, 1.35, -1.3], fov: 44 }], 0),
    pose: (w, t) => {
      w.office.g.visible = true; w.office.spin(t);
      official(w, "off", 0.0, 0, -2.2, { expr: "neutral", blink: blinkAt(t, 1), res: 0.9 });
      w.cast.card("tail", 400, 300, tailDraw, 0.25, 1.06, -0.95, 0.7, 0.52, { flat: true, rot: 0.3 });
    } },
];
void numDraw; void bangDraw;

// ---------------- timeline ----------------
export const shotStart = (L: Lang, i: number) => (SHOTS[i].w ? word(L, SHOTS[i].n, SHOTS[i].w![L]) - 0.05 : at(L, SHOTS[i].n, SHOTS[i].f ?? 0));
export const shotEnd = (L: Lang, i: number) => (i + 1 < SHOTS.length ? shotStart(L, i + 1) : FRAMES[L] / FPS);
export const shotAt = (L: Lang, t: number) => { let i = 0; while (i + 1 < SHOTS.length && t >= shotStart(L, i + 1)) i++; return i; };
export const layersAt = (L: Lang, f: number): { i: number; alpha: number }[] => {
  const t = f / FPS, i = shotAt(L, t), n = SHOTS[i].xfade;
  if (n && i > 0) { const k = (f - Math.round(shotStart(L, i) * FPS)) / n; if (k < 1) return [{ i: i - 1, alpha: 1 }, { i, alpha: smooth(k) }]; }
  return [{ i, alpha: 1 }];
};
const kickAt = (L: Lang, i: number, t: number) => {
  let s = 0; const a = shotStart(L, i), b = shotEnd(L, i);
  const ks = (SHOTS[i].kicks ?? []).map((k) => a + k * (b - a)); if (SHOTS[i].kw) ks.push(word(L, SHOTS[i].n, SHOTS[i].kw![L]));
  for (const kt of ks) { const df = Math.round((t - kt) * FPS); if (df >= 0 && df < 7) s += (df % 2 ? -1 : 1) * (1 - df / 7) * 0.25; }
  return s;
};

// ---------------- world ----------------
export class World {
  root = new THREE.Group(); env = new Env(); cast = new Cast();
  street = new Street({ en: posterTex("en"), es: posterTex("es") }, posterOffTex()); pipe = new Pipe(); bath = bathroom(); office = new Office(); farm = village(); classroom = classroom();
  private sets: THREE.Object3D[];
  constructor() {
    this.sets = [this.street.g, this.pipe.g, this.bath, this.office.g, this.farm, this.classroom];
    this.root.add(this.env.root, ...this.sets, this.cast.root);
  }
  update(L: Lang, i: number, t: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[i], M = MOODS[s.mood], a = shotStart(L, i), b = shotEnd(L, i), u = clamp01((t - a) / Math.max(0.01, b - a)), c = s.cam(u);
    const kk = kickAt(L, i, t);
    cam.position.set(...c.pos); cam.position.y += kk * 0.4; cam.fov = c.fov; cam.up.set(0, 1, 0);
    cam.lookAt(c.look[0], c.look[1] + kk * 0.15, c.look[2]); cam.rotateZ(((c.roll ?? 0) * Math.PI) / 180 + kk * 0.01); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    for (const o of this.sets) o.visible = false;
    this.street.trench.visible = false; this.street.manhole.visible = false; this.street.poster.visible = true; this.street.posterX.visible = false;
    const outdoor = ["tropic", "dusk", "village"].includes(s.mood);
    this.env.apply(M, scene, cam, t, s.mood === "village" ? "#ffe0c0" : s.mood === "dusk" ? "#e0b8c8" : "#ffffff", outdoor);
    this.env.sky.visible = outdoor; this.env.sea.visible = false;
    this.cast.begin(cam, M.tint);
    s.pose(this, t, u, L);
    return new THREE.Vector3(...c.look);
  }
}
