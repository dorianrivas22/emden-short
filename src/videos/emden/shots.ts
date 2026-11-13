// The story: every shot = time span (s), mood, camera, and what is posed in the world.
import * as THREE from "three";
import { FPS, TOTAL, V3, Mood, MOODS, glide, lv, smooth, clamp01, hh, ramp, easeOut } from "./lib";
import { Env } from "./env";
import { Ship, Lighthouse, harbourTown, street, policeStation, stall, DeckSet, waveFlag } from "./props";
import {
  Cast, SAILOR, CAPTAIN, GUARD, RUSSIAN, RUS_CAPTAIN, POLICE, ROBBER, CROWD, TAMIL, KID_T,
  blinkAt, numDraw, zzzDraw, smokeDraw, flashDraw, puffDraw, splashDraw, qDraw, skiMask, scope,
} from "./chars";
import type { Outfit } from "../bridge/toon";

export type Cam = { pos: V3; look: V3; fov: number; roll?: number };
type Key = { t: number; pos: V3; look: V3; fov: number; roll?: number };
/** glide between keys (smootherstep) and creep forward on holds */
const path = (keys: Key[], creep = 0.012) => (t: number): Cam => {
  let i = 0; while (i < keys.length - 1 && t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const u = b === a ? 0 : glide((t - a.t) / (b.t - a.t));
  const pos = lv(a.pos, b.pos, u), look = lv(a.look, b.look, u);
  const k = creep * (t - keys[0].t); // slow push toward the target over the whole shot
  return { pos: lv(pos, look, Math.min(0.25, k)), look, fov: a.fov + (b.fov - a.fov) * u, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * u };
};

export type Shot = { a: number; b: number; mood: Mood; cam: (t: number) => Cam; dof?: number; xfade?: number; seaY?: number; clouds?: boolean; pose: (w: World, t: number) => void };

// ---------------- timings (seconds, from the voice word timings) ----------------
const T = {
  hookEnd: 4.25, bolt: 5.06, sailors: 5.9, ocean: 8.1, crafts: 9.7, map: 11.6, penang: 13.3, going: 13.6, harbour: 14.4, police: 17.4, mask: 20.22,
  sunrise: 20.9, guards: 23.9, count: 24.9, wave: 25.9, inside: 26.4, rcap: 29.1, glide: 30.9, flag: 32.75, fire: 34.0, yousee: 34.5,
  counted: 37.1, four: 39.66, three: 40.98, like: 41.4, face: 44.0, minutes: 45.2, out: 47.95, called: 50.25, tamil: 52.15, end: TOTAL / FPS,
};
export { T };

const L = 60, B = L * 0.135;

export const SHOTS: Shot[] = [
  // 1 hook: sailors building the fake chimney on deck
  { a: 0, b: T.hookEnd, mood: "day", seaY: -5, dof: 6,
    cam: path([{ t: 0, pos: [4, 12, 24], look: [1, 9.5, -1.5], fov: 46 }, { t: 1.4, pos: [3, 12, 22], look: [0, 9.5, -1.5], fov: 46 }, { t: 2.7, pos: [-10.5, 3.2, 13], look: [-10.5, 3.4, -1.5], fov: 42 }, { t: 4.25, pos: [-10.5, 2.6, 11], look: [-10.5, 2.8, -1.5], fov: 40 }]),
    pose: (w, t) => {
      w.deck.g.visible = true; w.deck.wrap(ramp([[2.9, 0], [4.1, 1]], t));
      const hit = (t * 2.4) % 1;
      w.cast.person(SAILOR(0), "s0", -12.3, 0, 1.2, { mode: "stand", expr: "stern", prop: ["hammer", hit < 0.3 ? hit / 0.3 : 1 - (hit - 0.3) / 0.7], blink: blinkAt(t, 1), res: 0.8 });
      w.cast.person(SAILOR(1), "s1", -8.7, 0, 1.3, { mode: "stand", expr: "grin", prop: ["hammer", ((t * 2.4 + 0.5) % 1) < 0.3 ? 1 : 0.2], blink: blinkAt(t, 2), res: 0.8, mirror: true });
      w.cast.person(SAILOR(2), "s2", -10.5, 0, 3.4, { mode: "stand", expr: "neutral", blink: blinkAt(t, 3), res: 0.8 });
      if (hit < 0.18 && t > 1.8) w.cast.card(`puff${Math.floor(hit * 30)}`, 300, 300, puffDraw(hit / 0.18), -11.7, 1.6, 1.5, 0.9, 0.9, { soft: true });
    } },
  // 2 the fake funnel is lowered into place and bolted down
  { a: T.hookEnd, b: T.sailors, mood: "day",
    cam: path([{ t: T.hookEnd, pos: [52, 26, 62], look: [-4, 6, 0], fov: 34 }, { t: T.sailors, pos: [40, 22, 58], look: [-6, 7, 0], fov: 33 }]),
    pose: (w, t) => {
      const s = w.emden; s.g.visible = true; s.g.position.set(0, 0, 0); s.g.rotation.y = 0.25; w.wake(s, t, 1);
      const u = ramp([[4.3, 0], [5.06, 1]], t); s.fake!.position.y = 9.15 + 9 * (1 - u); s.fake!.visible = true;
      if (t > T.bolt && t < T.bolt + 0.5) { const k = (t - T.bolt) / 0.5; for (const sx of [-1, 1]) w.cast.card(`bp${Math.floor(k * 15)}`, 300, 300, puffDraw(k), s.tops[3].x * 0.97 + sx * 1.5 + 0, 5.6, 1.5, 3, 3, { soft: true }); }
      w.smoke(s, t, [0, 1, 2]);
    } },
  // 3 the sailors think the captain lost his mind
  { a: T.sailors, b: T.ocean, mood: "day", seaY: -5, dof: 11,
    cam: path([{ t: T.sailors, pos: [-10.3, 1.6, 8.6], look: [-10.4, 1.45, 2.5], fov: 38 }]),
    pose: (w, t) => {
      w.deck.g.visible = true; w.deck.wrap(1);
      const late = t > 6.9;
      w.cast.person(SAILOR(0), "s0", -11.3, 0, 3.6, { mode: "stand", expr: late ? "nervous" : "neutral", look: late ? 1 : 0, blink: blinkAt(t, 1), res: 1.1 });
      w.cast.person(SAILOR(1), "s1", -9.5, 0, 3.7, { mode: "stand", expr: late ? "shock" : "neutral", look: late ? -1 : 0, blink: blinkAt(t, 2), res: 1.1 });
      w.cast.person(CAPTAIN, "cap", -10.4, 0, 0.6, { mode: "stand", expr: "grin", prop: ["hammer", (t * 2) % 1 < 0.5 ? 0 : 1], blink: blinkAt(t, 3), res: 0.8 });
      if (late) { const k = easeOut((t - 6.9) / 0.25); w.cast.card("q", 300, 300, qDraw, -10.4, 2.3, 3.7, 0.55 * k, 0.55 * k); }
    } },
  // 4 enemy ships on the horizon
  { a: T.ocean, b: T.crafts, mood: "day",
    cam: path([{ t: T.ocean, pos: [0, 10, 40], look: [-30, 7, -160], fov: 30 }, { t: T.crafts, pos: [0, 10, 40], look: [15, 7, -160], fov: 30 }], 0),
    pose: (w, t) => {
      w.enemies.forEach((s, i) => { s.g.visible = true; s.g.position.set(-150 + i * 75 + t * 2, 0, -180 - 60 * hh(i)); s.g.rotation.y = 0.15 * (hh(i, 2) - 0.5); w.smoke(s, t, [0, 1, 2, 3], 2.2); w.wake(s, t, 1); });
    } },
  // 5 ... and he's doing arts and crafts
  { a: T.crafts, b: T.map, mood: "day", seaY: -5, dof: 12,
    cam: path([{ t: T.crafts, pos: [-10.0, 1.55, 5.6], look: [-10.3, 1.35, 1.8], fov: 36 }]),
    pose: (w, t) => {
      w.deck.g.visible = true; w.deck.wrap(1);
      w.cast.person(CAPTAIN, "cap", -10.3, 0, 1.8, { mode: "stand", expr: "lick", prop: ["hammer", (t * 2.6) % 1 < 0.35 ? 1 : 0.1], blink: blinkAt(t, 3), res: 1.2 });
      const hit = (t * 2.6) % 1;
      if (hit < 0.2) w.cast.card(`h${Math.floor(hit * 25)}`, 500, 500, flashDraw(hit / 0.2), -9.75, 1.55, 1.85, 0.45, 0.45);
    } },
  // 6 the map (2D overlay; the 3D view behind is just the cabin colour)
  { a: T.map, b: T.going, mood: "cabin", cam: path([{ t: T.map, pos: [0, 2, 10], look: [0, 2, 0], fov: 40 }]), pose: () => {} },
  // 7 "We're going in."
  { a: T.going, b: T.harbour, mood: "day", seaY: -5, dof: 10,
    cam: path([{ t: T.going, pos: [-10.2, 1.0, 6.6], look: [-10.3, 1.55, 1.8], fov: 40 }, { t: T.harbour, pos: [-10.2, 1.05, 5.8], look: [-10.3, 1.6, 1.8], fov: 40 }]),
    pose: (w, t) => {
      w.deck.g.visible = true; w.deck.wrap(1);
      w.cast.person(CAPTAIN, "cap", -10.3, 0, 1.8, { mode: "stand", expr: "grin", wave: 1, blink: blinkAt(t, 3), res: 1.2 });
      w.cast.person(SAILOR(0), "s0", -11.9, 0, 0.4, { mode: "stand", expr: "shock", blink: false, res: 0.8 });
      w.cast.person(SAILOR(1), "s1", -8.7, 0, 0.3, { mode: "stand", expr: "shock", blink: false, res: 0.8, mirror: true });
    } },
  // 8 Penang: a British harbour full of warships (night)
  { a: T.harbour, b: T.police, mood: "night",
    cam: path([{ t: T.harbour, pos: [95, 48, 95], look: [0, 0, -25], fov: 34 }, { t: T.police, pos: [55, 30, 70], look: [-5, 2, -25], fov: 34 }], 0),
    pose: (w, t) => {
      w.town.visible = true; w.light.g.visible = true; w.light.g.position.set(80, 0, 10); w.light.spin(t);
      w.navy.forEach((s, i) => { s.g.visible = true; s.g.position.set(-70 + i * 42, 0, -6 - 4 * (i % 2)); s.g.rotation.y = 0; s.hoist(1, t); });
      waveFlag((w.town as any).ukFlag, t);
    } },
  // 9 a robber in a ski mask strolling into a police station
  { a: T.police, b: T.sunrise, mood: "warm", dof: 7, clouds: true,
    cam: path([{ t: T.police, pos: [4, 2.2, 25], look: [0.4, 2.6, 4], fov: 40 }, { t: T.sunrise, pos: [2.5, 1.8, 18.5], look: [0.2, 2.2, 4], fov: 40 }]),
    pose: (w, t) => {
      w.cop.visible = true;
      const u = clamp01((t - T.police) / (T.sunrise - T.police - 0.2));
      const shocked = t > T.mask - 0.08;
      w.cast.person(ROBBER, "rob", 0.4, 0, 14.5 - 5.5 * u, { mode: "stroll", phase: (t * 1.6) % 1, expr: "neutral", face: skiMask, res: 0.9 });
      w.cast.person(POLICE(0), "p0", -2.6, 0, 5.4, { mode: "stand", expr: shocked ? "shock" : "neutral", blink: blinkAt(t, 1), res: 0.8 });
      w.cast.person(POLICE(1), "p1", 2.8, 0, 5.3, { mode: "stand", expr: shocked ? "shock" : "smile", blink: blinkAt(t, 2), res: 0.8, mirror: true });
    } },
  // 10 before sunrise, past the lighthouse
  { a: T.sunrise, b: T.guards, mood: "dawn",
    cam: path([{ t: T.sunrise, pos: [-30, 6, 95], look: [-12, 9, 0], fov: 36 }, { t: T.guards, pos: [-10, 6, 92], look: [18, 9, 0], fov: 36 }], 0),
    pose: (w, t) => {
      const s = w.emden; s.g.visible = true; s.g.position.set(-25 + (t - T.sunrise) * 12, 0, 0); s.g.rotation.y = 0; s.fake!.position.y = 9.15; w.wake(s, t, 1); w.smoke(s, t, [0, 1, 2], 1, "#8a8aa8");
      w.light.g.visible = true; w.light.g.position.set(42, 0, -40); w.light.spin(t);
    } },
  // 11 the guards squint
  { a: T.guards, b: T.count, mood: "dawn", dof: 12,
    cam: path([{ t: T.guards, pos: [0.4, 3.7, -15.8], look: [0, 3.55, -21.6], fov: 34 }]),
    pose: (w, t) => {
      w.town.visible = true;
      w.cast.person(GUARD(0), "g0", -0.85, 2.3, -21.8, { mode: "stand", expr: "stern", blink: false, res: 1.0, face: scope });
      w.cast.person(GUARD(1), "g1", 0.85, 2.3, -21.9, { mode: "stand", expr: "stern", look: -1, blink: false, res: 1.0, mirror: true });
    } },
  // 12 ... count the chimneys (their view)
  { a: T.count, b: T.wave, mood: "dawn",
    cam: path([{ t: T.count, pos: [0, 4.5, -18], look: [0, 10, 110], fov: 36 }]),
    pose: (w, t) => {
      w.town.visible = true;
      const s = w.emden; s.g.visible = true; s.g.position.set(4 - (t - T.count) * 4, 0, 110); s.g.rotation.y = 0; s.fake!.position.y = 9.15; w.smoke(s, t, [0, 1, 2], 1, "#8a8aa8");
      const at = [24.98, 25.18, 25.38, 25.6];
      at.forEach((ta, i) => { if (t > ta) { const k = easeOut((t - ta) / 0.15), p = s.g.localToWorld(s.tops[i].clone()); w.cast.card(`n${i + 1}`, 300, 300, numDraw(String(i + 1)), p.x, p.y + 5, p.z - 3, 9 * k, 9 * k); } });
    } },
  // 13 ... and wave
  { a: T.wave, b: T.inside, mood: "dawn", dof: 12,
    cam: path([{ t: T.wave, pos: [0.3, 3.65, -16.2], look: [0, 3.5, -21.6], fov: 36 }]),
    pose: (w, t) => {
      w.town.visible = true;
      const wv = 0.5 + 0.5 * Math.sin(t * 16);
      w.cast.person(GUARD(0), "g0", -0.85, 2.3, -21.8, { mode: "stand", expr: "smile_closed", wave: wv, blink: false, res: 1.0 });
      w.cast.person(GUARD(1), "g1", 0.85, 2.3, -21.9, { mode: "stand", expr: "grin", wave: 1 - wv, blink: false, res: 1.0, mirror: true });
    } },
  // 14 the Russian cruiser asleep at anchor
  { a: T.inside, b: T.rcap, mood: "dawn",
    cam: path([{ t: T.inside, pos: [92, 20, 64], look: [2, 7, 0], fov: 34 }, { t: T.rcap, pos: [80, 17, 56], look: [2, 8, 0], fov: 34 }]),
    pose: (w, t) => {
      w.town.visible = true; const z = w.zhem; z.g.visible = true; z.g.position.set(0, 0, 0); z.g.rotation.y = 0; z.hoist(1, t * 0.3);
      for (let i = 0; i < 3; i++) { const u = ((t - T.inside) * 0.45 + i / 3) % 1; w.cast.card("zzz", 320, 320, zzzDraw, 6 + 3 * u - i * 9, 15 + 9 * u, 0, 9 * (0.6 + 0.4 * u), 9 * (0.6 + 0.4 * u)); }
    } },
  // 15 its captain isn't even on board (he's on the quay with an ice cream)
  { a: T.rcap, b: T.glide, mood: "dawn", dof: 12,
    cam: path([{ t: T.rcap, pos: [10.3, 3.45, -17.6], look: [10, 3.55, -22], fov: 36 }]),
    pose: (w, t) => {
      w.town.visible = true; const z = w.zhem; z.g.visible = true; z.g.position.set(-10, 0, 60); z.g.rotation.y = 0.3;
      w.cast.person(RUS_CAPTAIN, "rc", 10, 2.3, -22, { mode: "stand", expr: "lick", prop: "icecream", blink: blinkAt(t, 5), res: 1.1 });
    } },
  // 16 the Germans glide right up next to it
  { a: T.glide, b: T.flag, mood: "dawn",
    cam: path([{ t: T.glide, pos: [8, 48, 62], look: [6, 0, -8], fov: 38 }, { t: T.flag, pos: [7, 44, 56], look: [6, 0, -8], fov: 38 }], 0),
    pose: (w, t) => {
      w.town.visible = true;
      const z = w.zhem; z.g.visible = true; z.g.position.set(0, 0, -8); z.g.rotation.y = Math.PI / 2; z.hoist(1, t * 0.3);
      const s = w.emden; s.g.visible = true; s.fake!.position.y = 9.15; s.g.rotation.y = Math.PI / 2;
      s.g.position.set(12, 0, -8 + 70 * (1 - easeOut((t - T.glide) / (T.flag - T.glide + 0.4)))); s.hoist(0, t); w.wake(s, t, 0.5);
    } },
  // 17 raise the flag ...
  { a: T.flag, b: T.fire, mood: "dawn", dof: 9,
    cam: path([{ t: T.flag, pos: [19, 5.5, 31], look: [12, 6.6, 22.6], fov: 38 }]),
    pose: (w, t) => {
      w.town.visible = true;
      const z = w.zhem; z.g.visible = true; z.g.position.set(0, 0, -8); z.g.rotation.y = Math.PI / 2;
      const s = w.emden; s.g.visible = true; s.g.position.set(12, 0, -8); s.g.rotation.y = Math.PI / 2; s.fake!.position.y = 9.15;
      s.hoist(ramp([[33.04, 0], [33.6, 1]], t), t);
    } },
  // 18 ... and fire
  { a: T.fire, b: T.yousee, mood: "dawn",
    cam: path([{ t: T.fire, pos: [7, 42, 54], look: [6, 0, -8], fov: 38 }]),
    pose: (w, t) => {
      w.town.visible = true;
      const z = w.zhem; z.g.visible = true; z.g.position.set(0, 0, -8); z.g.rotation.y = Math.PI / 2;
      const s = w.emden; s.g.visible = true; s.g.position.set(12, 0, -8); s.g.rotation.y = Math.PI / 2; s.fake!.position.y = 9.15; s.hoist(1, t);
      const k = clamp01((t - T.fire) / 0.45);
      for (const zz of [-26, -12, 2, 14]) w.cast.card(`mf${Math.floor(k * 12)}`, 500, 500, flashDraw(k), 7.5, 6, zz, 11, 11);
      for (const zz of [-20, -4, 10]) w.cast.card(`hit${Math.floor(k * 12)}`, 500, 500, flashDraw(Math.min(1, k * 1.3)), 0.5, 8, zz, 14, 14);
    } },
  // 19 "You see, in the dark, nobody could see a flag"
  { a: T.yousee, b: T.counted, mood: "night", dof: 10,
    cam: path([{ t: T.yousee, pos: [1.2, 3.55, -18.2], look: [0, 3.55, -22], fov: 36 }, { t: 35.9, pos: [1.2, 3.55, -18.2], look: [0, 3.55, -22], fov: 36 }, { t: T.counted, pos: [-0.2, 4.5, -18.5], look: [3, 9, 160], fov: 26 }]),
    pose: (w, t) => {
      w.town.visible = true;
      w.cast.person(GUARD(0), "g0", 0, 2.3, -22, { mode: "stand", expr: "stern", blink: false, res: 1.0, face: scope });
      if (t > 36.2) { const k = easeOut((t - 36.2) / 0.2); w.cast.card("q", 300, 300, qDraw, 0.45, 4.45, -21.9, 0.7 * k, 0.7 * k); }
      const s = w.emden; s.g.visible = true; s.g.position.set(6, 0, 160); s.g.rotation.y = Math.PI; s.fake!.position.y = 9.15; s.hoist(1, t);
    } },
  // 20 lookouts counted chimneys: British cruisers had four
  { a: T.counted, b: 40.1, mood: "golden", clouds: true,
    cam: path([{ t: T.counted, pos: [0, 6, 62], look: [0, 5.5, 0], fov: 40 }, { t: 40.1, pos: [0, 5.8, 56], look: [0, 5.5, 0], fov: 40 }], 0),
    pose: (w, t) => {
      const b = w.brit; b.g.visible = true; b.g.position.set(0, 0, 0); b.g.rotation.y = Math.PI; b.g.scale.setScalar(0.5); b.hoist(1, t);
      [38.85, 39.1, 39.35, 39.62].forEach((ta, i) => { if (t > ta) { const k = easeOut((t - ta) / 0.15), p = b.g.localToWorld(b.tops[i].clone()); w.cast.card(`n${i + 1}`, 300, 300, numDraw(String(i + 1)), p.x, p.y + 2.6, p.z + 2, 3.6 * k, 3.6 * k); } });
      w.smoke(b, t, [0, 1, 2, 3], 0.5);
    } },
  // 20b ... the German ship had three (then the fake one drops on)
  { a: 40.1, b: T.like, mood: "golden", clouds: true,
    cam: path([{ t: 40.1, pos: [0, 6, 62], look: [0, 5.5, 0], fov: 40 }, { t: T.like, pos: [0, 5.8, 58], look: [0, 5.5, 0], fov: 40 }], 0),
    pose: (w, t) => {
      const g = w.german; g.g.visible = true; g.g.position.set(0, 0, 0); g.g.rotation.y = Math.PI; g.g.scale.setScalar(0.5); g.hoist(1, t);
      const fu = ramp([[41.0, 0], [41.25, 1]], t); g.fake!.visible = fu > 0; g.fake!.position.y = 9.15 + 14 * (1 - fu);
      [40.3, 40.6, 40.95].forEach((ta, i) => { if (t > ta) { const k = easeOut((t - ta) / 0.15), p = g.g.localToWorld(g.tops[i].clone()); w.cast.card(`n${i + 1}y`, 300, 300, numDraw(String(i + 1), "#ffffff"), p.x, p.y + 2.6, p.z + 2, 3.6 * k, 3.6 * k); } });
      if (fu >= 1) { const p = g.g.localToWorld(g.tops[3].clone()); w.cast.card("n4y", 300, 300, numDraw("4", "#ffd43b"), p.x, p.y + 2.6, p.z + 2, 3.6, 3.6); }
      w.smoke(g, t, [0, 1, 2], 0.5);
    } },
  // 21 spotting your friend in a crowd by their red hat
  { a: T.like, b: T.face, mood: "warm", dof: 6, clouds: true,
    cam: path([{ t: T.like, pos: [0.3, 4.2, 15], look: [0.3, 1.3, 0], fov: 40 }, { t: 43.7, pos: [0.6, 1.7, 4.2], look: [0.6, 1.45, -0.5], fov: 36 }]),
    pose: (w, t) => {
      w.square.visible = true;
      for (let i = 0; i < 28; i++) {
        const row = Math.floor(i / 7), x = -7 + (i % 7) * 2.3 + (row % 2) * 1.1 + 0.4 * hh(i), z = 4 - row * 2.2 + 0.4 * hh(i, 1);
        if (Math.abs(x - 0.6) < 1.4 && z > -1.6) continue;
        w.cast.person(CROWD(i), `c${i % 12}`, x, 0, z, { mode: "stroll", phase: ((t * 0.9 + hh(i)) % 1), expr: (["neutral", "stern", "smile"] as const)[i % 3], blink: blinkAt(t, i), res: 0.55, mirror: i % 2 === 0 });
      }
      w.cast.person({ ...CAPTAIN, cap: "#e0302c", jacket: "#3f6fb5", pants: "#3b3f52" }, "friend", 0.6, 0, -0.5, { mode: "stand", expr: "neutral", blink: blinkAt(t, 40), res: 0.8 });
    } },
  // 22 you never check the face: it's the German captain
  { a: T.face, b: T.minutes, mood: "warm", dof: 12, clouds: true,
    cam: path([{ t: T.face, pos: [0.6, 1.55, 2.0], look: [0.6, 1.5, -0.5], fov: 34 }]),
    pose: (w, t) => {
      w.square.visible = true;
      w.cast.person({ ...CAPTAIN, cap: "#e0302c", jacket: "#3f6fb5", pants: "#3b3f52" }, "friend", 0.6, 0, -0.5, { mode: "stand", expr: "grin", wave: 0.5 + 0.5 * Math.sin(t * 14), blink: t > 44.5 && t < 44.75, res: 1.3 });
      for (const [x, z, i] of [[-1.6, -1.8, 1], [2.6, -2.2, 2]] as [number, number, number][]) w.cast.person(CROWD(i), `c${i}`, x, 0, z, { mode: "stand", expr: "neutral", blink: blinkAt(t, i), res: 0.6 });
    } },
  // 23 minutes later the Russian cruiser was at the bottom of the harbour
  { a: T.minutes, b: T.out, mood: "dawn",
    cam: path([{ t: T.minutes, pos: [30, 14, 52], look: [0, 4, -10], fov: 38 }, { t: T.out, pos: [26, 11, 46], look: [0, 2, -10], fov: 38 }]),
    pose: (w, t) => {
      w.town.visible = true;
      const z = w.zhem, u = smooth((t - 45.4) / 2.4); z.g.visible = true; z.g.position.set(0, -10 * u, -10); z.g.rotation.set(0, Math.PI / 2, 0); z.g.rotateZ(-0.12 * u); z.g.rotateX(0.3 * u);
      for (let i = 0; i < 4; i++) { const k = ((t - T.minutes) * 0.5 + i / 4) % 1; w.cast.card(`sm${i}`, 300, 300, smokeDraw(i, "#b9b4c8"), 2 * k, 12 + 12 * k - 8 * u, -26 + i * 9, 5 + 4 * k, 5 + 4 * k, { tint: true }); }
      const sp = clamp01((t - 46.6) / 1.2); if (sp > 0 && sp < 1) w.cast.card(`sp${Math.floor(sp * 20)}`, 800, 800, splashDraw(sp), 0, -1, -4, 20, 20, { tint: true });
    } },
  // 24 ... and the Germans steaming back out to sea (sunrise)
  { a: T.out, b: T.called, mood: "golden",
    cam: path([{ t: T.out, pos: [-62, 16, 52], look: [8, 6, -6], fov: 38 }, { t: T.called, pos: [-50, 15, 46], look: [30, 6, -18], fov: 38 }], 0),
    pose: (w, t) => {
      const s = w.emden; s.g.visible = true; s.fake!.position.y = 9.15; s.g.rotation.y = 0.49; s.g.position.set(-10 + (t - T.out) * 10.5, 0, -(t - T.out) * 5.6); s.hoist(1, t); w.wake(s, t, 1); w.smoke(s, t, [0, 1, 2], 1, "#8a7f8f");
    } },
  // 25 that ship was called the Emden
  { a: T.called, b: T.tamil, mood: "golden", dof: 9,
    cam: path([{ t: T.called, pos: [L * 0.36 + 9, 4.6, 12], look: [L * 0.36, 3.6, B * 0.44], fov: 36 }, { t: T.tamil, pos: [L * 0.36 + 6, 4.2, 9], look: [L * 0.36, 3.4, B * 0.44], fov: 34 }]),
    pose: (w, t) => {
      const s = w.emden; s.g.visible = true; s.g.position.set(0, 0.15 * Math.sin(t * 1.6), 0); s.g.rotation.set(0, 0, 0.01 * Math.sin(t * 1.3)); s.fake!.position.y = 9.15; s.fake!.rotation.z = 0.035 + 0.05 * Math.sin(t * 5) * smooth((t - 51.2) / 0.3); s.hoist(1, t); w.wake(s, t, 0.4);
    } },
  // 26 in Tamil, calling someone an Emden means they're way too clever
  { a: T.tamil, b: T.end, mood: "warm", dof: 8, clouds: true,
    cam: path([{ t: T.tamil, pos: [0, 3.2, 13], look: [-0.3, 1.3, 0], fov: 40 }, { t: 54.4, pos: [0.0, 1.5, 6.6], look: [-0.05, 1.3, 0.6], fov: 46 }]),
    pose: (w, t) => {
      w.bazaar.visible = true;
      const away = t < 55.0;
      w.cast.person(TAMIL(0), "seller", -0.6, 0, -0.5, { mode: "stand", expr: away ? "smile_closed" : "shock", look: away ? -1 : 1, blink: blinkAt(t, 8), res: 0.8 });
      w.cast.person(KID_T, "kid", 0.55, 0, 1.9, { mode: "stand", expr: t > 54.5 ? "grin" : "smile", blink: blinkAt(t, 9), res: 1.0, face: mango });
      for (let i = 1; i < 6; i++) w.cast.person(TAMIL(i), `t${i}`, -6.5 + i * 2.6 + (i > 2 ? 1.5 : 0), 0, -3.5 - 1.5 * hh(i), { mode: "stand", expr: t > 54.0 ? "laugh" : "smile", blink: blinkAt(t, i), res: 0.6, mirror: i % 2 === 0 });
    } },
];

const mango = (p: import("../bridge/toon").Pen) => { p.ell(470, 560, 46, 36, "#f2a22a", 9); p.ell(455, 548, 14, 9, "#ffd27a", 0); p.stroke([[470, 524], [478, 508]], 6, "#3c6a2a"); };

// ---------------- crossfades ----------------
export const XFADE: Record<number, number> = { 8: 8, 10: 8, 14: 6, 20: 6, 24: 8, 25: 8, 27: 6 };
export const shotIndex = (t: number) => { let i = SHOTS.findIndex((s) => t >= s.a && t < s.b); return i < 0 ? SHOTS.length - 1 : i; };
export const layersAt = (f: number): { i: number; alpha: number }[] => {
  const t = f / FPS, i = shotIndex(t), s = SHOTS[i], n = XFADE[i + 1];
  if (n && i > 0) { const k = (f - Math.round(s.a * FPS)) / n; if (k < 1) return [{ i: i - 1, alpha: 1 }, { i, alpha: smooth(k) }]; }
  return [{ i, alpha: 1 }];
};
/** impact shakes: flip sign every frame, decay over 7 frames */
const KICKS = [T.bolt, T.fire, 41.0, 46.6];
export const kick = (t: number) => { let s = 0; for (const k of KICKS) { const df = Math.round((t - k) * FPS); if (df >= 0 && df < 7) s += (df % 2 ? -1 : 1) * (1 - df / 7) * 0.25; } return s; };

// ---------------- world ----------------
export class World {
  root = new THREE.Group(); env = new Env(); cast = new Cast();
  deck = new DeckSet(); emden: Ship; german: Ship; brit: Ship; zhem: Ship; enemies: Ship[] = []; navy: Ship[] = []; light = new Lighthouse(true);
  town: THREE.Group; cop: THREE.Group; square: THREE.Group; bazaar: THREE.Group; foam: THREE.Mesh[] = [];
  private sets: THREE.Object3D[] = [];
  constructor() {
    const grey = { hull: "#8d97a5", upper: "#a3acb8", funnel: "#9aa3ad" };
    this.emden = new Ship({ ...grey, funnels: 4, fakeAt: 3, name: "EMDEN", flag: "de" });
    this.german = new Ship({ ...grey, funnels: 4, fakeAt: 3, flag: "de" });
    this.brit = new Ship({ hull: "#6f7884", upper: "#8a939e", funnel: "#7f8893", funnels: 4, flag: "uk" });
    this.zhem = new Ship({ hull: "#e8e4da", upper: "#f1eee6", funnel: "#d4b06a", funnels: 3, flag: "ru" });
    for (let i = 0; i < 4; i++) this.enemies.push(new Ship({ hull: "#6f7884", upper: "#8a939e", funnel: "#7f8893", funnels: 4, flag: "uk" }));
    for (let i = 0; i < 4; i++) this.navy.push(new Ship({ hull: i % 2 ? "#6f7884" : "#7d8794", upper: "#8a939e", funnel: "#7f8893", funnels: i % 2 ? 4 : 2, flag: "uk", lit: true, L: 50 + 10 * (i % 2) }));
    this.town = harbourTown(true);
    this.cop = new THREE.Group(); this.cop.add(street("#c9b9a0", ["#e8d6b0", "#f0c9a0", "#cfd9e6", "#e7b8a6"], ["#b8483a", "#8a3b34", "#c75f3c"])); const ps = policeStation(); ps.position.set(0, 0, -1); this.cop.add(ps);
    this.square = street("#d8c7a6", ["#f2e6c8", "#e8d6b0", "#cfd9e6", "#e7b8a6", "#d8c6e6"], ["#b8483a", "#c75f3c", "#5a6f8a"], 5);
    this.bazaar = street("#d9b98a", ["#f2c14e", "#e86a5a", "#5ab4a8", "#f4e3c0", "#c98bd8"], ["#b8483a", "#2f7d6a", "#c75f3c"], 9); const st = stall(); st.position.set(-0.6, 0, 0.45); this.bazaar.add(st);
    this.sets = [this.deck.g, this.emden.g, this.german.g, this.brit.g, this.zhem.g, ...this.enemies.map((s) => s.g), ...this.navy.map((s) => s.g), this.light.g, this.town, this.cop, this.square, this.bazaar];
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.8, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.layers.set(3); this.foam.push(m); }
    this.root.add(this.env.root, ...this.sets, this.cast.root, ...this.foam);
  }
  private foamN = 0;
  /** a foamy wake behind a moving ship */
  wake(s: Ship, t: number, k: number) {
    const m = this.foam[this.foamN++]; if (!m) return;
    m.visible = true; const p = s.g.position, yaw = s.g.rotation.y;
    m.position.set(p.x - Math.cos(yaw) * (s.L * 0.5 + 10), 0.05, p.z + Math.sin(yaw) * (s.L * 0.5 + 10));
    m.rotation.z = yaw; m.scale.set(30 * k, s.L * 0.16 * k, 1); (m.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.1 * Math.sin(t * 3);
    const m2 = this.foam[this.foamN++]; if (!m2) return;
    m2.visible = true; m2.position.set(p.x + Math.cos(yaw) * (s.L * 0.5 + 0.5), 0.05, p.z - Math.sin(yaw) * (s.L * 0.5 + 0.5)); m2.rotation.z = yaw; m2.scale.set(4 * k, s.L * 0.15, 1);
  }
  smoke(s: Ship, t: number, idx: number[], size = 1, col = "#c9c6d6") {
    for (const i of idx) for (let j = 0; j < 3; j++) {
      const u = ((t * 0.7 + j / 3 + i * 0.13) % 1), p = s.g.localToWorld(s.tops[i].clone().add(new THREE.Vector3(-u * 9, u * 5, 0)));
      this.cast.card(`smk${i}${j}`, 300, 300, smokeDraw(i * 3 + j, col), p.x, p.y, p.z, (2.2 + 4 * u) * size, (2.2 + 4 * u) * size, { tint: true });
    }
  }
  update(i: number, t: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[i], M = MOODS[s.mood], c = s.cam(t);
    const kk = kick(t);
    cam.position.set(...c.pos); cam.position.y += kk * 0.6; cam.fov = c.fov; cam.up.set(0, 1, 0);
    cam.lookAt(c.look[0], c.look[1] + kk * 0.2, c.look[2]); cam.rotateZ(((c.roll ?? 0) * Math.PI) / 180 + kk * 0.01); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    for (const o of this.sets) o.visible = false;
    for (const f of this.foam) f.visible = false; this.foamN = 0;
    for (const sh of [this.emden, this.german, this.brit, this.zhem, ...this.enemies, ...this.navy]) { sh.g.rotation.set(0, 0, 0); sh.g.scale.setScalar(1); if (sh.fake) { sh.fake.visible = true; sh.fake.position.y = 9.15; sh.fake.rotation.z = 0.035; } }
    this.env.apply(M, scene, cam, t, s.mood === "golden" ? "#ffe0c0" : s.mood === "dawn" ? "#c9a6c8" : s.mood === "night" ? "#5a6aa8" : "#ffffff", s.clouds ?? s.mood !== "cabin");
    this.env.sea.position.y = s.seaY ?? 0; this.env.sea.visible = s.mood !== "cabin" && !["warm"].includes(s.mood);
    this.env.seaU.calm.value.set(0, 0, 1, 0);
    this.cast.begin(cam, M.tint);
    s.pose(this, t);
    return new THREE.Vector3(...c.look);
  }
}
