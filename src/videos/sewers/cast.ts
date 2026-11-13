// Cast and 2D effect cards for "Built Too Big" (drawn with the skill's Pen; billboards via the Emden Cast).
import type { Outfit, Pen } from "../bridge/toon";
import { INK, SKINS, fxBurst } from "../bridge/toon";
import { hh } from "../emden/lib";

// ---------------- outfits ----------------
export const BAZ: Outfit = { jacket: "#2b2f3d", pants: "#3a3a44", boots: INK, hat: "tophat", moustache: "#3a2a1e", buttons: "#c9a24a", skin: SKINS[0] };
export const MP = (v: number): Outfit => ({
  jacket: ["#2a2a34", "#3a2f2a", "#2f3a34", "#34303f", "#2a3242"][v % 5], pants: "#3a3a44", boots: INK, hat: v % 3 === 2 ? "hair" : "tophat",
  hair: ["#d8d4cc", "#5a3b2a", "#8a8a8a"][v % 3], moustache: v % 2 ? ["#5a3b2a", "#d8d4cc", "#2a201a"][v % 3] : undefined, build: v % 3 === 0 ? "stout" : "adult", skin: SKINS[v % 3],
  buttons: "#c9a24a",
});
export const DOCTOR = (v: number): Outfit => ({ jacket: "#1f1f26", pants: "#2a2a30", boots: INK, hat: "tophat", moustache: v % 2 ? "#6a6a6a" : "#3a2a1a", build: v % 2 ? "stout" : "adult", skin: SKINS[(v + 1) % 4], buttons: "#d9dde0" });
export const WORKER = (v: number): Outfit => ({ jacket: ["#8a6a4a", "#6a7a5a", "#9a7a5a", "#5a6a7a"][v % 4], pants: "#4a4238", boots: "#3a2f28", hat: "cap", cap: ["#4a4238", "#5a4a3a", "#3a3a42"][v % 3], skin: SKINS[v % 4], moustache: v % 3 === 1 ? "#4a3426" : undefined });
export const POOR = (v: number): Outfit => v % 2
  ? { jacket: "#8a7a6a", pants: "#4a4238", boots: "#3a2f28", hat: "bonnet", dress: ["#9a7a6a", "#7a8a8a", "#8a6a6a"][v % 3], skin: SKINS[v % 4] }
  : { jacket: "#7a6a5a", pants: "#4a4238", boots: "#3a2f28", hat: "cap", cap: "#4a4238", skin: SKINS[(v + 1) % 4] };
export const KIDP: Outfit = { jacket: "#8a6a4a", pants: "#4a4238", boots: "#3a2f28", hat: "cap", cap: "#5a4a3a", build: "kid", skin: SKINS[1] };
export const MODERN = (v: number): Outfit => {
  const c = ["#e0533a", "#2f7d9a", "#f2a22a", "#6a5acd", "#2f9a5f", "#d9446a", "#3f6fb5"];
  return { jacket: c[v % 7], pants: ["#2a3a5a", "#3b3f52", "#d8c8a8"][v % 3], boots: ["#f4f1ea", "#3a2f28"][v % 2], hat: "hair", hair: ["#1e1714", "#5a3b2a", "#c98a3a", "#2a2a2a"][v % 4], skin: SKINS[v % 4], build: v % 6 === 5 ? "kid" : "adult" };
};

// ---------------- face / hand overlays (design space 600 x 1000; head centre ~ (300, 310)) ----------------
/** a white hanky pressed over the nose and mouth */
export const hanky = (p: Pen) => {
  p.poly([[250, 330], [350, 322], [362, 378], [300, 400], [240, 384]], "#f4f1ea", 8);
  p.stroke([[262, 352], [338, 346]], 3, "#c9c4b8");
  p.dot(370, 360, 14); p.stroke([[370, 360], [420, 470]], 12, "#2a2a34");
};
/** pinching the nose */
export const pinch = (p: Pen) => { p.dot(312, 336, 15); p.stroke([[312, 336], [400, 450]], 12, "#2a2a34"); };
/** mutton-chop sideburns for Bazalgette */
export const chops = (p: Pen) => { for (const s of [-1, 1]) p.poly([[300 + s * 92, 260], [300 + s * 108, 300], [300 + s * 96, 352], [300 + s * 70, 340], [300 + s * 78, 290]], "#3a2a1e", 6); };
/** sweat drops / tears */
export const sweat = (p: Pen) => { p.ell(410, 250, 12, 20, "#9fd4ff", 5); p.ell(190, 280, 9, 15, "#9fd4ff", 5); };

// ---------------- effect cards (drawn on their own canvas) ----------------
/** a stink: three wavy yellow-green wisps rising from a thin haze (soft card) */
export const stinkDraw = (seed: number, col = "#b9c75a") => (p: Pen) => {
  const g = p.g;
  g.globalAlpha = 0.35; p.ell(150, 235, 110, 40, col, 0); g.globalAlpha = 1;
  for (const [x, ph] of [[100, 0], [150, 1.7], [200, 3.1]] as [number, number][]) {
    const s: [number, number][] = []; for (let k = 0; k < 12; k++) s.push([x + 16 * Math.sin(k * 0.8 + seed + ph), 250 - k * 19]);
    p.stroke(s, 22, "#4a5a1e"); p.stroke(s, 12, col);
  }
};
export const bubbleDraw = (t: number) => (p: Pen) => {
  const r = 30 + 60 * t;
  if (t < 0.85) { p.ell(150, 170 - 30 * t, r, r * 0.8, "#8a8a3a", 9); p.ell(150 - r * 0.35, 150 - 30 * t, r * 0.2, r * 0.14, "#c9c98a", 0); }
  else fxBurst(p, (t - 0.85) / 0.15, "#b9b46a", 8, 30, 130);
};
export const germDraw = (seed: number) => (p: Pen) => {
  const col = ["#5fbf4a", "#8acb3a", "#4aa89a"][seed % 3];
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; p.stroke([[150 + 55 * Math.cos(a), 150 + 55 * Math.sin(a)], [150 + 85 * Math.cos(a + 0.2), 150 + 85 * Math.sin(a + 0.2)]], 9); }
  p.ell(150, 150, 62, 58, col, 10);
  p.ell(128, 140, 13, 15, "#ffffff", 5); p.ell(170, 140, 13, 15, "#ffffff", 5); p.dot(131, 144, 6); p.dot(167, 144, 6);
  p.arc(150, 170, 20, 10, 200, 340, 7);
};
export const dropDraw = (col = "#6a5a3a") => (p: Pen) => p.poly([[150, 40], [200, 170], [180, 230], [120, 230], [100, 170]], col, 10);
export const brickDraw = (p: Pen) => {
  p.poly([[40, 110], [260, 110], [260, 200], [40, 200]], "#c98a4a", 10); p.poly([[40, 110], [90, 70], [300, 70], [260, 110]], "#d8a466", 10); p.poly([[260, 110], [300, 70], [300, 160], [260, 200]], "#a8723a", 10);
};
export const planDraw = (k: number) => (p: Pen) => {
  const g = p.g;
  p.poly([[20, 40], [580, 40], [580, 360], [20, 360]], "#2f5f9a", 10);
  g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 2; for (let x = 40; x < 580; x += 30) { g.beginPath(); g.moveTo(x, 50); g.lineTo(x, 350); g.stroke(); }
  for (let y = 60; y < 360; y += 30) { g.beginPath(); g.moveTo(30, y); g.lineTo(570, y); g.stroke(); }
  // a small pipe and a pipe twice as wide
  g.strokeStyle = "#ffffff"; g.lineWidth = 9; g.beginPath(); g.arc(160, 200, 50, 0, 7); g.stroke();
  g.beginPath(); g.arc(400, 200, 50 + 50 * k, 0, 7); g.stroke();
  g.font = "900 90px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#ffd43b"; g.lineWidth = 14; g.strokeStyle = INK; g.strokeText("×2", 400, 200); g.fillText("×2", 400, 200);
};
export const paperDraw = (title: string, sub: string) => (p: Pen) => {
  const g = p.g;
  p.poly([[20, 20], [580, 20], [580, 780], [20, 780]], "#f2ead6", 10);
  g.fillStyle = "#1a1a1a"; g.font = "900 64px serif"; g.textAlign = "center"; g.fillText(sub, 300, 95);
  g.fillRect(50, 115, 500, 6);
  g.font = "900 108px serif"; const words = title.split(" "); words.forEach((w, i) => g.fillText(w, 300, 240 + i * 115));
  g.fillRect(50, 260 + words.length * 115 - 90, 500, 4);
  for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(30,30,30,0.55)"; g.fillRect(60, 300 + words.length * 115 - 90 + i * 34, 220 - (i % 3) * 30, 14); g.fillRect(320, 300 + words.length * 115 - 90 + i * 34, 220 - ((i + 1) % 3) * 30, 14); }
};
export const thermoDraw = (k: number) => (p: Pen) => {
  p.poly([[125, 30], [175, 30], [175, 400], [125, 400]], "#f4f1ea", 10);
  p.ell(150, 440, 52, 52, "#e0302c", 10);
  const top = 380 - 330 * k; p.poly([[137, top], [163, top], [163, 420], [137, 420]], "#e0302c", 0);
  for (let i = 0; i < 8; i++) p.stroke([[175, 70 + i * 42], [195, 70 + i * 42]], 6);
};
export const cupDraw = (p: Pen) => { p.poly([[90, 80], [210, 80], [195, 230], [105, 230]], "#c9c4b8", 10); p.ell(150, 82, 60, 16, "#6a6a3a", 8); };
export const bucketDraw = (p: Pen) => { p.poly([[80, 110], [220, 110], [200, 270], [100, 270]], "#7a5a3a", 10); p.ell(150, 112, 70, 18, "#5a5a2e", 8); p.arc(150, 112, 70, 80, 180, 360, 8); };
export const glassDraw = (germs: number, t: number) => (p: Pen) => {
  const g = p.g;
  p.poly([[120, 120], [480, 120], [450, 700], [150, 700]], "rgba(220,235,240,0.35)" as any, 12);
  p.poly([[132, 260], [468, 260], [450, 690], [150, 690]], "#8a8a4a", 0);
  g.globalAlpha = 0.5; p.ell(300, 262, 168, 22, "#a8a86a", 0); g.globalAlpha = 1;
  for (let i = 0; i < germs; i++) {
    const x = 200 + 200 * hh(i, 3) + 18 * Math.sin(t * 3 + i), y = 330 + 300 * hh(i, 5) + 12 * Math.cos(t * 2.5 + i), s = 0.38 + 0.18 * hh(i, 7);
    g.save(); g.translate(x - 150 * s, y - 150 * s); g.scale(s, s); germDraw(i)(p); g.restore();
  }
  p.poly([[120, 120], [480, 120], [450, 700], [150, 700]], null, 12);
  p.stroke([[160, 160], [185, 640]], 10, "rgba(255,255,255,0.7)");
};
export const horseDraw = (phase: number) => (p: Pen) => {
  const leg = (x: number, o: number) => { const s = Math.sin(phase * Math.PI * 2 + o) * 18; p.stroke([[x, 300], [x + s, 410]], 16, "#3a2a1e"); };
  leg(130, 0); leg(170, Math.PI); leg(330, Math.PI); leg(370, 0);
  p.ell(250, 260, 150, 70, "#7a5a3a", 10);
  p.poly([[370, 230], [430, 120], [480, 110], [500, 150], [440, 200], [400, 280]], "#7a5a3a", 10);
  p.dot(470, 135, 7); p.poly([[440, 100], [455, 70], [462, 108]], "#7a5a3a", 6);
  p.stroke([[390, 150], [420, 100]], 14, "#3a2a1e"); p.stroke([[100, 230], [60, 300]], 14, "#3a2a1e");
};
export const ringDraw = (col = "#e0302c") => (p: Pen) => { const g = p.g; g.setLineDash([40, 24]); p.arc(250, 250, 225, 225, 0, 360, 22, col); g.setLineDash([]); };
export const xDraw = (p: Pen) => { p.stroke([[60, 60], [240, 240]], 44, INK); p.stroke([[240, 60], [60, 240]], 44, INK); p.stroke([[60, 60], [240, 240]], 28, "#e0302c"); p.stroke([[240, 60], [60, 240]], 28, "#e0302c"); };
export const streamDraw = (t: number, col = "#6a5a2e") => (p: Pen) => {
  const s: [number, number][] = []; for (let k = 0; k <= 12; k++) s.push([150 + 8 * Math.sin(k * 0.9 + t * 12), 20 + k * 22]);
  p.stroke(s, 46, INK); p.stroke(s, 34, col);
  for (let i = 0; i < 4; i++) p.ell(150 + 50 * Math.cos(i * 1.7 + t * 9), 285 + 8 * Math.sin(i + t * 9), 14, 10, col, 5);
};
export const x2Draw = (p: Pen) => {
  const g = p.g; g.font = "900 300px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 40; g.strokeStyle = INK; g.strokeText("×2", 300, 210); g.fillStyle = "#ffd43b"; g.fillText("×2", 300, 210);
};
