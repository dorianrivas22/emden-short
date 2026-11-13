// Cast and effect cards for "The Rat Tail Bounty". Everyone uses the same bean-head style; hats and clothes mark the period.
import * as THREE from "three";
import type { Outfit, Pen } from "../bridge/toon";
import { INK, SKINS } from "../bridge/toon";
import { ctex, hh } from "../emden/lib";

// ---------------- outfits ----------------
export const OFFICIAL: Outfit = { jacket: "#efe9da", pants: "#e6dfcc", boots: "#5a3b2a", hat: null, moustache: "#5a3b2a", build: "stout", skin: SKINS[0], buttons: "#c9a24a" };
export const INSPECTOR: Outfit = { jacket: "#e9e2d0", pants: "#d8d0bc", boots: "#3a2f28", hat: null, moustache: "#2a201a", skin: SKINS[2], buttons: "#8a8a8a" };
export const LOCAL = (v: number): Outfit => ({
  jacket: ["#3f4a6a", "#7a5a3a", "#e9e2d0", "#5a4a6a", "#4a6a5a"][v % 5], pants: ["#2a2a30", "#4a3a2a", "#3a3a40"][v % 3], boots: "#6a4a32",
  hat: v % 3 === 2 ? "hair" : null, hair: "#1e1714", skin: ["#ecd0b6", "#e2bf9a", "#d9b48e", "#f0d4b8"][v % 4], build: v % 7 === 6 ? "kid" : "adult",
});
export const CREW = (v: number): Outfit => ({ jacket: ["#5a5048", "#4a5a5a", "#6a5a4a"][v % 3], pants: "#3a3530", boots: "#4a3a2a", hat: null, skin: ["#e2bf9a", "#d9b48e", "#ecd0b6"][v % 3] });
export const ECON: Outfit = { jacket: "#8a6a4a", pants: "#3b3f52", boots: "#3a2f28", hat: "hair", hair: "#b8b4ac", skin: SKINS[1] };
/** whether a LOCAL variant wears the conical hat */
export const hasNonLa = (v: number) => v % 3 !== 2;

// ---------------- overlays (design space 600 x 1000, head centre ~ (300, 310), crown ~ y 198) ----------------
export const pith = (p: Pen) => {
  p.ell(300, 222, 168, 30, "#e6dcc0", 9);
  p.poly([[168, 222], [190, 150], [240, 112], [300, 102], [360, 112], [410, 150], [432, 222]], "#efe6cc", 9);
  p.stroke([[176, 196], [424, 196]], 9, "#8a6a3a");
};
export const nonLa = (p: Pen) => {
  p.poly([[300, 70], [118, 232], [482, 232]], "#e6cf8f", 9);
  for (const k of [0.35, 0.6, 0.85]) p.stroke([[300 - 182 * k, 70 + 162 * k], [300 + 182 * k, 70 + 162 * k]], 4, "#b8a060");
};
export const headband = (p: Pen) => { p.poly([[186, 236], [414, 236], [414, 262], [186, 262]], "#d8cfb8", 6); };
export const glasses = (p: Pen) => { p.ell(269, 309, 24, 22, null, 6); p.ell(331, 309, 24, 22, null, 6); p.stroke([[293, 306], [307, 306]], 5); };
export const lanternHand = (p: Pen) => { p.stroke([[410, 470], [430, 560]], 6); p.poly([[400, 560], [460, 560], [455, 640], [405, 640]], "#ffd27a", 7); };
export const both = (...fs: ((p: Pen) => void)[]) => (p: Pen) => fs.forEach((f) => f(p));

// ---------------- rats ----------------
/** side-view rat, facing right; phase animates the legs; tail 0..1 (0 = no tail); baby = smaller rounder */
export const ratDraw = (phase: number, tail = 1, col = "#8a8794", baby = false) => (p: Pen) => {
  const s = baby ? 0.75 : 1, cx = 300, cy = 200 + (baby ? 20 : 0), bob = 6 * Math.sin(phase * Math.PI * 4);
  if (tail > 0) { const L = 230 * tail * s, pts: [number, number][] = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push([cx - 110 * s - L * u, cy + 30 + 30 * Math.sin(u * 3 + phase * 6) * u]); } p.stroke(pts, 16 * s, INK); p.stroke(pts, 9 * s, "#e8a0a8"); }
  for (const [x, o] of [[cx - 60 * s, 0], [cx + 50 * s, Math.PI]] as [number, number][]) { const k = 18 * Math.sin(phase * Math.PI * 2 + o); p.stroke([[x, cy + 40 * s], [x + k, cy + 85 * s]], 13 * s); }
  p.ell(cx, cy + bob, 120 * s, 62 * s, col, 10);
  p.ell(cx + 110 * s, cy - 18 * s + bob, 58 * s, 44 * s, col, 10);
  p.ell(cx + 85 * s, cy - 60 * s + bob, 26 * s, 30 * s, "#e8a0a8", 8);
  p.dot(cx + 125 * s, cy - 28 * s + bob, 8 * s); p.dot(cx + 166 * s, cy - 12 * s + bob, 9 * s, "#e8a0a8");
  for (const dy of [-6, 6]) p.stroke([[cx + 160 * s, cy - 10 * s + bob], [cx + 210 * s, cy - 10 * s + dy * 3 + bob]], 3);
};
/** a cut-off tail lying on its own */
export const tailDraw = (p: Pen) => { const pts: [number, number][] = []; for (let k = 0; k <= 12; k++) pts.push([40 + k * 18, 150 + 30 * Math.sin(k * 0.7)]); p.stroke(pts, 18, INK); p.stroke(pts, 10, "#e8a0a8"); };
export const coinDraw = (p: Pen) => { p.ell(150, 150, 110, 110, "#e8c45a", 12); p.ell(150, 150, 78, 78, null, 6); const g = p.g; g.font = "900 110px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#8a6a1a"; g.fillText("1¢", 150, 156); };
export const bulbDraw = (p: Pen) => { p.ell(150, 120, 80, 85, "#ffe27a", 12); p.poly([[115, 200], [185, 200], [175, 250], [125, 250]], "#9a9a9a", 10); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.stroke([[150 + 105 * Math.cos(a), 120 + 105 * Math.sin(a)], [150 + 135 * Math.cos(a), 120 + 135 * Math.sin(a)]], 10, "#ffd23a"); } };
export const scissorsDraw = (k: number) => (p: Pen) => {
  const a = 0.35 * (1 - k);
  for (const s of [-1, 1]) { const g = p.g; g.save(); g.translate(150, 150); g.rotate(s * a); p.poly([[-10, -8], [140, -4], [140, 4], [-10, 8]], "#c9ccd2", 6); p.ell(-50, s * 30, 34, 26, null, 12); g.restore(); }
};
export const sparkleDraw = (p: Pen) => { for (let i = 0; i < 5; i++) { const x = 60 + 180 * hh(i, 1), y = 60 + 180 * hh(i, 2), r = 20 + 20 * hh(i, 3); p.poly([[x, y - r], [x + r * 0.25, y - r * 0.25], [x + r, y], [x + r * 0.25, y + r * 0.25], [x, y + r], [x - r * 0.25, y + r * 0.25], [x - r, y], [x - r * 0.25, y - r * 0.25]], "#fff3b0", 5); } };
export const bangDraw = (p: Pen) => { const g = p.g; g.font = "900 240px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.lineWidth = 30; g.strokeStyle = INK; g.strokeText("!", 150, 160); g.fillStyle = "#ffd43b"; g.fillText("!", 150, 160); };
export const deskRatsDraw = (p: Pen) => { for (let i = 0; i < 7; i++) { const g = p.g; g.save(); g.translate(40 + 60 * (i % 4) + 20 * Math.floor(i / 4), 70 - 40 * Math.floor(i / 4)); g.scale(0.35, 0.35); g.rotate(Math.PI); ratDraw(0, 1, "#7a7784")(p); g.restore(); } };

// ---------------- painted posters / boards (per language) ----------------
export const posterTex = (L: "en" | "es") => ctex(`bounty_${L}`, 600, 800, (g) => {
  g.fillStyle = "#f2e6c4"; g.fillRect(0, 0, 600, 800); g.strokeStyle = "#2a1a10"; g.lineWidth = 16; g.strokeRect(10, 10, 580, 780);
  g.fillStyle = "#1a1a1a"; g.textAlign = "center";
  g.font = "900 70px serif"; g.fillText("AVIS", 300, 110); g.fillRect(70, 135, 460, 6);
  g.font = "900 64px serif"; (L === "es" ? ["1 CÉNTIMO", "POR CADA", "COLA DE RATA"] : ["1 CENT", "FOR EVERY", "RAT TAIL"]).forEach((s, i) => g.fillText(s, 300, 230 + i * 80));
  // a drawn tail
  g.strokeStyle = "#1a1a1a"; g.lineWidth = 16; g.beginPath(); for (let k = 0; k <= 12; k++) { const x = 140 + k * 26, y = 560 + 26 * Math.sin(k * 0.8); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.strokeStyle = "#e8a0a8"; g.lineWidth = 8; g.stroke();
  g.font = "700 40px serif"; g.fillStyle = "#3a2a1a"; g.fillText("HANOÏ · 1902", 300, 720);
});
export const posterOffTex = () => ctex("bounty_off", 300, 400, (g) => {
  g.clearRect(0, 0, 300, 400); g.lineCap = "round"; g.strokeStyle = "#c8282c"; g.lineWidth = 34; g.beginPath(); g.moveTo(30, 40); g.lineTo(270, 360); g.moveTo(270, 40); g.lineTo(30, 360); g.stroke();
});
export const boardDraw = (L: "en" | "es", k: number) => (p: Pen) => {
  const g = p.g; g.fillStyle = "#2f4a3a"; g.fillRect(0, 0, 600, 480); g.strokeStyle = "#6a4a2a"; g.lineWidth = 24; g.strokeRect(0, 0, 600, 480);
  const words = L === "es" ? ["INCENTIVO", "PERVERSO"] : ["PERVERSE", "INCENTIVE"];
  g.font = "900 96px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.save(); g.beginPath(); g.rect(0, 0, 40 + 560 * k, 480); g.clip();
  g.fillStyle = "#f4f1ea"; words.forEach((w, i) => g.fillText(w, 300, 170 + i * 140)); g.restore();
};
export const tallyDraw = (n: string) => (p: Pen) => {
  const g = p.g; g.font = "900 200px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = 34; g.strokeStyle = INK; g.strokeText(n, 400, 160); g.fillStyle = "#ffd43b"; g.fillText(n, 400, 160);
};
export const fmt = (n: number, L: "en" | "es") => { const s = String(Math.round(n)); return s.replace(/\B(?=(\d{3})+(?!\d))/g, L === "es" ? "." : ","); };
void THREE;
