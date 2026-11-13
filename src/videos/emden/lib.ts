// Shared helpers for "The Fake Chimney": timing, easing, toon materials, colour moods, canvas textures.
import * as THREE from "three";

export const FPS = 30;
export const VOICE_END = 56.16;
export const TOTAL = Math.round((VOICE_END + 1.0) * FPS); // 1 s tail after the last word
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
/** smootherstep, used for every camera glide */
export const glide = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
export const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;
export const lv = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** deterministic hash in [0,1) */
export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** linear interpolation through [t, value] pairs */
export const ramp = (pts: [number, number][], t: number) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) { const [t0, v0] = pts[i - 1], [t1, v1] = pts[i]; return lerp(v0, v1, smooth((t - t0) / (t1 - t0))); }
  return pts[pts.length - 1][1];
};

// ---------------- moods ----------------
export type Mood = "day" | "warm" | "night" | "dawn" | "golden" | "cabin";
export type MoodDef = {
  skyTop: string; skyHor: string; seaNear: string; seaFar: string; crest: string; fogNear: number; fogFar: number;
  sun: string; sunI: number; sunDir: V3; amb: string; ambI: number; tint: string; stars: number; disc: number; grade: [number, number, number];
};
export const MOODS: Record<Mood, MoodDef> = {
  day: { skyTop: "#3f86dc", skyHor: "#cfe6f6", seaNear: "#1f79c2", seaFar: "#79bde6", crest: "#e9f6ff", fogNear: 120, fogFar: 900,
    sun: "#fff3dc", sunI: 2.3, sunDir: [0.5, 0.75, 0.45], amb: "#a9c3ea", ambI: 1.15, tint: "#ffffff", stars: 0, disc: 0, grade: [1, 1, 1] },
  warm: { skyTop: "#4a8fe0", skyHor: "#f3e7cf", seaNear: "#2a86c4", seaFar: "#8cc7e0", crest: "#ffffff", fogNear: 80, fogFar: 600,
    sun: "#fff0d0", sunI: 2.4, sunDir: [-0.45, 0.7, 0.55], amb: "#c9c0e0", ambI: 1.1, tint: "#fff8f0", stars: 0, disc: 0, grade: [1.03, 1, 0.96] },
  night: { skyTop: "#0a1440", skyHor: "#2c4794", seaNear: "#0f2160", seaFar: "#29488f", crest: "#7f9be0", fogNear: 60, fogFar: 700,
    sun: "#a9bcff", sunI: 1.25, sunDir: [-0.4, 0.6, -0.5], amb: "#3a4fa6", ambI: 1.0, tint: "#9eb0ee", stars: 1, disc: 0, grade: [0.92, 0.97, 1.1] },
  dawn: { skyTop: "#18266a", skyHor: "#ef8f86", seaNear: "#18306e", seaFar: "#5b5f9f", crest: "#f3b6b4", fogNear: 80, fogFar: 800,
    sun: "#ffc0b0", sunI: 1.6, sunDir: [0.9, 0.25, -0.3], amb: "#6a70c4", ambI: 1.35, tint: "#c7b9ec", stars: 0.5, disc: 0, grade: [1, 0.95, 1.06] },
  golden: { skyTop: "#5f74c9", skyHor: "#ffc27a", seaNear: "#2b4c9a", seaFar: "#e09a73", crest: "#ffe1b0", fogNear: 120, fogFar: 900,
    sun: "#ffc98f", sunI: 2.4, sunDir: [0.85, 0.2, -0.45], amb: "#8a7fc6", ambI: 1.0, tint: "#ffe2c2", stars: 0, disc: 1, grade: [1.06, 1, 0.92] },
  cabin: { skyTop: "#2a1a10", skyHor: "#6a4024", seaNear: "#000000", seaFar: "#000000", crest: "#000000", fogNear: 50, fogFar: 300,
    sun: "#ffc58a", sunI: 2.2, sunDir: [0.3, 0.8, 0.5], amb: "#8a6a9a", ambI: 1.0, tint: "#ffe6c8", stars: 0, disc: 0, grade: [1.05, 1, 0.92] },
};

// ---------------- toon materials ----------------
const grad = (() => {
  const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
})();
const mats = new Map<string, THREE.Material>();
/** cached two/three-tone cartoon material */
export const toon = (col: string, opts: { map?: THREE.Texture; emissive?: string; ei?: number; side?: THREE.Side; key?: string } = {}) => {
  const k = opts.key ?? `${col}|${opts.map?.uuid ?? ""}|${opts.emissive ?? ""}|${opts.ei ?? 0}|${opts.side ?? 0}`;
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color: col, gradientMap: grad, map: opts.map ?? null, emissive: opts.emissive ?? "#000000", emissiveIntensity: opts.ei ?? 0, side: opts.side ?? THREE.FrontSide });
    mats.set(k, m);
  }
  return m;
};
/** unlit glowing material (lamps, windows, muzzle flash): HDR so bloom picks it up */
export const glow = (col: string, k = 2.5) => {
  const key = `glow|${col}|${k}`;
  let m = mats.get(key);
  if (!m) { const c = new THREE.Color(col).multiplyScalar(k); m = new THREE.MeshBasicMaterial({ color: c, toneMapped: true }); mats.set(key, m); }
  return m;
};

// ---------------- canvas textures ----------------
const texCache = new Map<string, THREE.CanvasTexture>();
export const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  let t = texCache.get(key);
  if (!t) {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    draw(cv.getContext("2d")!);
    t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    texCache.set(key, t);
  }
  return t;
};

export const NOINK = 3;
export const noInk = <T extends THREE.Object3D>(o: T) => { o.traverse((c) => c.layers.set(NOINK)); return o; };

/** render-wide settings (set by the composition before the world is built) */
export const CFG = { lang: "en" as "en" | "es" };
