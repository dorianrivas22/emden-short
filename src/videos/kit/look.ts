// Light + colour presets for the v2 engine ("kit"), tuned to research/GUIA_NUMERICA_20.md:
// warm, almost white key light (light R-B ~ +0.07, light sat ~ 0.31), cool blue-violet shadows (hue ~ 238 deg,
// shadow sat ~ 0.59), lifted blacks (lum p2 ~ 0.11), bright highlights (p98 ~ 0.88), overall sat ~ 0.46, vignette ~ 1.26.
// The shadows get their colour from a blue hemisphere light + the grade's shadow tint, never from black.
import type { GradeParams } from "../bridge/grade";

export type Look = {
  skyTop: string; skyHor: string;         // sky gradient (also fog colour = skyHor)
  sun: string; sunI: number; sunDir: [number, number, number];
  hemiSky: string; hemiGround: string; hemiI: number;   // fill: sky side cool, ground side warm
  fogNear: number; fogFar: number;
  exposure: number;
  bloom: number;                          // bloom intensity
  grade: GradeParams;
  stars?: number; disc?: number;
  cardTint: string;                       // multiplies the unlit character cards so they sit in the light
};

// base grade: lifted toe, soft shoulder, saturation pulled down (more in the highlights), blue-violet shadow tint,
// faintly warm highlights, vignette
const G = (o: Partial<GradeParams> = {}): GradeParams => ({
  ky: [0.042, 0.172, 0.36, 0.62, 0.825, 0.925, 0.975],
  sat: [1.1, 1.16, 0.84],
  tintS: [0.075, -0.02], tintM: [0.008, -0.004], tintH: [-0.06, -0.012],
  vig: [0.3, 0.36],
  ...o,
});

export const LOOKS = {
  day: { skyTop: "#5d8fd8", skyHor: "#dfe9f2", sun: "#fff1dc", sunI: 2.6, sunDir: [-0.45, 0.8, 0.4], hemiSky: "#c4d0ec", hemiGround: "#c8b090", hemiI: 1.4,
    fogNear: 40, fogFar: 320, exposure: 1.12, bloom: 0.45, grade: G(), cardTint: "#ffffff" },
  golden: { skyTop: "#6f7fc4", skyHor: "#ffd2a0", sun: "#ffd9a8", sunI: 2.5, sunDir: [-0.8, 0.32, 0.35], hemiSky: "#b8bce4", hemiGround: "#d0a888", hemiI: 1.35,
    fogNear: 35, fogFar: 260, exposure: 1.16, bloom: 0.6, disc: 1, grade: G({ tintH: [-0.03, 0.03], tintS: [0.04, 0.012] }), cardTint: "#fbf6ee" },
  dusk: { skyTop: "#2f3a7a", skyHor: "#e59a7a", sun: "#ffb48a", sunI: 1.7, sunDir: [-0.85, 0.22, -0.3], hemiSky: "#6a6ad0", hemiGround: "#a07080", hemiI: 1.35,
    fogNear: 30, fogFar: 220, exposure: 1.05, bloom: 0.75, stars: 0.15, grade: G({ tintS: [0.05, 0.02], tintM: [0.02, 0.012] }), cardTint: "#f0dceb" },
  night: { skyTop: "#0f1840", skyHor: "#2a3a6e", sun: "#a8bcff", sunI: 1.15, sunDir: [0.4, 0.75, 0.45], hemiSky: "#4a62c8", hemiGround: "#3a3050", hemiI: 1.6,
    fogNear: 20, fogFar: 160, exposure: 1.15, bloom: 0.95, stars: 0.6, grade: G({ ky: [0.08, 0.19, 0.33, 0.56, 0.78, 0.9, 0.965], tintS: [0.05, 0.004], tintM: [0.03, 0.0] }), cardTint: "#cdd8ff" },
  interior: { skyTop: "#3a2a20", skyHor: "#6a5a4a", sun: "#fff0e0", sunI: 2.2, sunDir: [-0.5, 0.75, 0.55], hemiSky: "#c8d0ea", hemiGround: "#c0a080", hemiI: 1.4,
    fogNear: 25, fogFar: 140, exposure: 1.22, bloom: 0.55, grade: G(), cardTint: "#f8f8f6" },
  interiorNight: { skyTop: "#141a34", skyHor: "#2a3050", sun: "#9fb2ff", sunI: 0.9, sunDir: [0.4, 0.8, 0.5], hemiSky: "#5068c0", hemiGround: "#40304a", hemiI: 1.4,
    fogNear: 20, fogFar: 120, exposure: 1.15, bloom: 0.95, grade: G({ tintS: [0.05, 0.006] }), cardTint: "#d6dcff" },
  dawn: { skyTop: "#7a70c0", skyHor: "#ffc0b0", sun: "#ffd4c0", sunI: 2.2, sunDir: [0.7, 0.35, 0.5], hemiSky: "#a6a0ea", hemiGround: "#d4a8a0", hemiI: 1.3,
    fogNear: 30, fogFar: 240, exposure: 1.05, bloom: 0.6, grade: G({ tintH: [-0.01, 0.02] }), cardTint: "#ffeef0" },
} satisfies Record<string, Look>;
export type LookName = keyof typeof LOOKS;

const lerpHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k));
  return "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
};
const ln = (a: number, b: number, k: number) => a + (b - a) * k;
const lv = <T extends number[]>(a: T, b: T, k: number) => a.map((x, i) => ln(x, b[i], k)) as T;
/** blend two looks (light changing inside a shot) */
export const mixLook = (a: Look, b: Look, k: number): Look => ({
  skyTop: lerpHex(a.skyTop, b.skyTop, k), skyHor: lerpHex(a.skyHor, b.skyHor, k), sun: lerpHex(a.sun, b.sun, k), sunI: ln(a.sunI, b.sunI, k),
  sunDir: lv(a.sunDir, b.sunDir, k), hemiSky: lerpHex(a.hemiSky, b.hemiSky, k), hemiGround: lerpHex(a.hemiGround, b.hemiGround, k), hemiI: ln(a.hemiI, b.hemiI, k),
  fogNear: ln(a.fogNear, b.fogNear, k), fogFar: ln(a.fogFar, b.fogFar, k), exposure: ln(a.exposure, b.exposure, k), bloom: ln(a.bloom, b.bloom, k),
  stars: ln(a.stars ?? 0, b.stars ?? 0, k), disc: ln(a.disc ?? 0, b.disc ?? 0, k), cardTint: lerpHex(a.cardTint, b.cardTint, k),
  grade: { ky: lv(a.grade.ky, b.grade.ky, k), sat: lv(a.grade.sat, b.grade.sat, k), tintS: lv(a.grade.tintS, b.grade.tintS, k),
    tintM: lv(a.grade.tintM, b.grade.tintM, k), tintH: lv(a.grade.tintH, b.grade.tintH, k), vig: lv(a.grade.vig, b.grade.vig, k) },
});
