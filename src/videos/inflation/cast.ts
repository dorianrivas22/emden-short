// Cast and prop cards for "The Money Stove". Same bean-head style as every short; clothes mark the 1920s.
import type { Outfit, Pen } from "../bridge/toon";
import { INK, SKINS } from "../bridge/toon";
import { hh } from "../emden/lib";

type P2 = [number, number];
// ---------------- outfits ----------------
export const WOMAN: Outfit = { jacket: "#7a4a6a", pants: "#3a2a30", boots: "#3a2a24", hat: "hair", hair: "#6a3a24", dress: "#8a5a7a", skin: SKINS[0] };
export const NEIGHBOUR: Outfit = { jacket: "#2a2a34", pants: "#2a2a34", boots: INK, hat: "tophat", moustache: "#3a2a1a", build: "stout", skin: SKINS[2], buttons: "#c9a24a" };
export const BAKER: Outfit = { jacket: "#f4f1ea", pants: "#d8d2c4", boots: "#5a3b2a", hat: null, moustache: "#5a3b2a", build: "stout", skin: SKINS[1], buttons: "#c9c2b0" };
export const WORKER = (v: number): Outfit => ({ jacket: ["#4a5a6a", "#6a5a4a", "#5a4a5a"][v % 3], pants: "#3a3530", boots: "#3a2a20", hat: "cap", cap: ["#3a3a40", "#5a4a3a", "#2a3a4a"][v % 3], skin: [SKINS[0], SKINS[2], SKINS[1]][v % 3], moustache: v === 1 ? "#4a3426" : undefined });
export const KIDO = (v: number): Outfit => ({ jacket: ["#c25a3a", "#3a6a9a", "#d9a441"][v % 3], pants: ["#3a3a50", "#5a4a3a", "#2a3a4a"][v % 3], boots: "#4a3426", hat: v % 2 ? "cap" : "hair", cap: "#5a4a6a", hair: ["#8a5a2a", "#e0c070", "#3a2a1a"][v % 3], build: "kid", skin: SKINS[v % 3] });
export const DAD: Outfit = { jacket: "#5a6a4a", pants: "#3a3a40", boots: "#3a2a20", hat: "hair", hair: "#3a2a1a", moustache: "#3a2a1a", skin: SKINS[2] };
export const MUM: Outfit = { jacket: "#3a6a8a", pants: "#2a2a30", boots: "#3a2a24", hat: "bonnet", dress: "#4a7a9a", skin: SKINS[1] };
export const OFFICIAL: Outfit = { jacket: "#2a2e3a", pants: "#2a2e3a", boots: INK, hat: "hair", hair: "#7a7a82", moustache: "#9a9aa2", build: "stout", skin: SKINS[0], buttons: "#c9a24a" };
export const PRINTER = (v: number): Outfit => ({ jacket: ["#8a7a5a", "#6a7a7a"][v % 2], pants: "#3a3530", boots: "#3a2a20", hat: "cap", cap: "#2a2a30", skin: SKINS[(v + 1) % 4] });

// ---------------- overlays (design space 600 x 1000, head centre ~ (300, 310), crown ~ y 198) ----------------
export const toque = (p: Pen) => { p.poly([[200, 214], [205, 120], [240, 80], [300, 66], [360, 80], [395, 120], [400, 214]], "#fbf9f4", 9); p.stroke([[204, 196], [396, 196]], 8, "#d8d2c4"); };
export const apron = (p: Pen) => { p.poly([[222, 480], [378, 480], [392, 760], [208, 760]], "#fbf9f4", 8); };
export const sweat = (p: Pen) => { for (const [x, y] of [[392, 250], [410, 300]] as P2[]) p.poly([[x, y - 26], [x + 12, y], [x, y + 10], [x - 12, y]], "#9fd4f0", 5); };
export const pencil = (p: Pen) => { p.stroke([[420, 470], [470, 330]], 22, INK); p.stroke([[420, 470], [470, 330]], 13, "#d8302c"); p.poly([[462, 338], [478, 340], [472, 312]], "#e8c49a", 4); };
export const holdBundle = (p: Pen) => { bundleAt(p, 300, 560, 0.9); };
export const both = (...fs: ((p: Pen) => void)[]) => (p: Pen) => fs.forEach((f) => f(p));

// ---------------- money ----------------
const noteCols = ["#d9cfa0", "#c8d4b0", "#e2c8a8"];
/** a banded bundle of notes, centred at (x, y), 1 = 220 px wide */
export const bundleAt = (p: Pen, x: number, y: number, s = 1, v = 0) => {
  const w = 110 * s, h = 52 * s, c = noteCols[v % 3];
  p.poly([[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h]], c, 8);
  for (let k = 1; k < 5; k++) p.stroke([[x - w + 6, y - h + k * h * 0.4], [x + w - 6, y - h + k * h * 0.4]], 2, "rgba(60,70,40,0.55)" as any);
  p.poly([[x - 16 * s, y - h], [x + 16 * s, y - h], [x + 16 * s, y + h], [x - 16 * s, y + h]], "#f4f1ea", 6);
};
export const bundleDraw = (v = 0) => (p: Pen) => bundleAt(p, 150, 100, 1.15, v);
/** one banknote (600 x 300 canvas) */
export const noteDraw = (big = "1000", small = "MARK", v = 0) => (p: Pen) => {
  const g = p.g; p.poly([[20, 20], [580, 20], [580, 280], [20, 280]], noteCols[v % 3], 10);
  g.strokeStyle = "rgba(70,90,60,0.45)"; g.lineWidth = 1.6; for (let k = 0; k < 18; k++) { g.beginPath(); for (let x = 24; x <= 576; x += 6) { const y = 30 + k * 14 + 6 * Math.sin(x * 0.05 + k * 0.7); x === 24 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = "#5a6a4a"; g.lineWidth = 8; g.strokeRect(50, 50, 500, 200);
  g.fillStyle = "#3a4a2a"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 110px serif"; g.fillText(big, 300, 140); g.font = "700 44px serif"; g.fillText(small, 300, 218);
  p.ell(110, 150, 40, 50, null, 5); p.ell(490, 150, 40, 50, null, 5);
};
/** the trillion-mark note: twelve zeros crossed out one by one (k = 0..12) */
export const trillionDraw = (k: number) => (p: Pen) => {
  const g = p.g; p.poly([[20, 20], [1180, 20], [1180, 580], [20, 580]], "#e2d2a8", 14);
  g.strokeStyle = "rgba(110,90,60,0.4)"; g.lineWidth = 2; for (let k = 0; k < 26; k++) { g.beginPath(); for (let x = 30; x <= 1170; x += 8) { const y = 40 + k * 21 + 8 * Math.sin(x * 0.03 + k * 0.6); x === 30 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = "#6a5a3a"; g.lineWidth = 10; g.strokeRect(60, 60, 1080, 480);
  const s = "1.000.000.000.000"; g.font = "900 120px serif"; g.textBaseline = "middle"; g.textAlign = "left";
  const W = g.measureText(s).width; let x = 600 - W / 2; let z = 0;
  for (const ch of s) {
    const w = g.measureText(ch).width; g.fillStyle = "#3a2a1a"; g.fillText(ch, x, 260);
    if (ch === "0") { z++; if (z <= k) { p.stroke([[x - 4, 300], [x + w + 4, 210]], 16, "#d8302c"); } }
    x += w;
  }
  g.font = "900 70px serif"; g.textAlign = "center"; g.fillStyle = "#3a2a1a"; g.fillText("MARK", 600, 420);
};
/** the new note: plain "1 MARK" shiny */
export const newNoteDraw = (p: Pen) => {
  const g = p.g; p.poly([[20, 20], [580, 20], [580, 280], [20, 280]], "#a8d4b8", 10); g.strokeStyle = "#2a6a4a"; g.lineWidth = 8; g.strokeRect(50, 50, 500, 200);
  g.fillStyle = "#1a4a2a"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 140px serif"; g.fillText("1", 300, 130); g.font = "700 44px serif"; g.fillText("NEW MARK", 300, 222);
};

// ---------------- props ----------------
/** a chalk price board, auto-fitting the text (1200 x 420) */
export const priceDraw = (price: string, sweat = 0) => (p: Pen) => {
  const g = p.g; p.poly([[20, 20], [1180, 20], [1180, 400], [20, 400]], "#2f3a34", 22);
  g.fillStyle = "#f4f1ea"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 96px serif"; g.fillText("BROT", 600, 110);
  let fs = 180; g.font = `900 ${fs}px sans-serif`; while (g.measureText(price).width > 1080 && fs > 40) { fs -= 6; g.font = `900 ${fs}px sans-serif`; }
  g.fillStyle = sweat > 0 ? "#ffd27a" : "#f4f1ea"; g.fillText(price, 600, 280);
};
export const tagDraw = (text: string) => (p: Pen) => {
  const g = p.g; p.poly([[60, 30], [560, 30], [560, 230], [60, 230], [10, 130]], "#f4ecd2", 10); p.ell(60, 130, 14, 14, "#2a1a10", 4);
  let fs = 110; g.font = `900 ${fs}px sans-serif`; while (g.measureText(text).width > 460 && fs > 30) { fs -= 4; g.font = `900 ${fs}px sans-serif`; }
  g.fillStyle = "#c8282c"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 320, 134);
};
/** side-view wheelbarrow heaped with bundles, wheel turning (600 x 400, facing right) */
export const barrowDraw = (ph: number) => (p: Pen) => {
  for (let i = 0; i < 9; i++) bundleAt(p, 200 + (i % 4) * 70 + (Math.floor(i / 4) % 2) * 35, 170 - Math.floor(i / 4) * 50, 0.55, i);
  p.poly([[110, 200], [470, 200], [420, 290], [170, 290]], "#7a5232", 10);
  p.stroke([[110, 210], [20, 250]], 14, "#5a3a22"); p.stroke([[170, 290], [160, 360]], 12, "#5a3a22");
  p.ell(430, 320, 50, 50, "#5a5a62", 10); const a = ph * Math.PI * 2; p.stroke([[430 + 40 * Math.cos(a), 320 + 40 * Math.sin(a)], [430 - 40 * Math.cos(a), 320 - 40 * Math.sin(a)]], 6);
};
/** a tower of bundles, wobble in radians at the top (300 x 700) */
export const towerDraw = (n: number, wob: number) => (p: Pen) => {
  for (let i = 0; i < n; i++) { const k = i / Math.max(1, n - 1); p.rot = [wob * k, 150, 680]; bundleAt(p, 150 + (hh(i, 3) - 0.5) * 16, 650 - i * 52, 0.55, i); }
  p.rot = null;
};
/** a banknote kite with a bow tail (400 x 700) */
export const kiteDraw = (t: number) => (p: Pen) => {
  const g = p.g; p.poly([[200, 20], [360, 200], [200, 420], [40, 200]], "#d9cfa0", 10);
  g.save(); p.path([[200, 20], [360, 200], [200, 420], [40, 200]], true); g.clip(); g.fillStyle = "#3a4a2a"; g.font = "900 70px serif"; g.textAlign = "center"; g.fillText("1000", 200, 230); g.restore();
  p.stroke([[200, 20], [200, 420]], 5); p.stroke([[40, 200], [360, 200]], 5);
  const tail: P2[] = []; for (let k = 0; k <= 8; k++) tail.push([200 + 30 * Math.sin(k * 0.9 + t * 8), 420 + k * 34]); p.stroke(tail, 5);
  for (let k = 2; k <= 8; k += 3) { const [x, y] = tail[k]; p.poly([[x - 26, y - 14], [x, y], [x - 26, y + 14]], "#c25a3a", 4); p.poly([[x + 26, y - 14], [x, y], [x + 26, y + 14]], "#c25a3a", 4); }
};
export const clockDraw = (a: number) => (p: Pen) => {
  p.ell(150, 150, 120, 120, "#f4ecd2", 12); for (let i = 0; i < 12; i++) { const b = (i / 12) * Math.PI * 2; p.dot(150 + 96 * Math.sin(b), 150 - 96 * Math.cos(b), 7); }
  p.stroke([[150, 150], [150 + 55 * Math.sin(a / 12), 150 - 55 * Math.cos(a / 12)]], 12); p.stroke([[150, 150], [150 + 85 * Math.sin(a), 150 - 85 * Math.cos(a)]], 8); p.dot(150, 150, 12);
};
/** a loaf that splits: the right half slides away by k (600 x 300) */
export const loafDraw = (k: number) => (p: Pen) => {
  const dx = 220 * k;
  p.clip([[0, 0], [300, 0], [300, 300], [0, 300]], () => p.ell(300, 170, 230, 100, "#c98a42", 12));
  p.rot = [0.15 * k, 300, 260, dx, 10 * k]; p.clip([[300, 0], [600, 0], [600, 300], [300, 300]], () => p.ell(300, 170, 230, 100, "#c98a42", 12)); p.rot = null;
  for (const x of [170, 250, 370, 440]) { const sx = x > 300 ? dx : 0; p.arc(x + sx, 120, 30, 16, 200, 340, 8); }
  if (k > 0.02) { p.stroke([[300, 80], [310, 140], [295, 200], [305, 262]], 8); p.stroke([[300 + dx, 80], [310 + dx, 140], [295 + dx, 200], [305 + dx, 262]], 8); }
};
/** top-down pizza cut into n slices (600 x 600) */
export const pizzaDraw = (n: number, hole = -1) => (p: Pen) => {
  const g = p.g; p.ell(300, 300, 280, 280, "#d99a52", 14); p.ell(300, 300, 236, 236, "#f2c85a", 0);
  for (let i = 0; i < 14; i++) { const a = hh(i, 1) * 6.28, r = 40 + 170 * hh(i, 2); p.ell(300 + r * Math.cos(a), 300 + r * Math.sin(a), 26, 26, "#c8402c", 5); }
  for (let i = 0; i < 60; i++) { const a = hh(i, 5) * 6.28, r = 20 + 200 * hh(i, 6); p.ell(300 + r * Math.cos(a), 300 + r * Math.sin(a), 6 + 6 * hh(i, 7), 4 + 4 * hh(i, 8), hh(i, 9) > 0.5 ? "#fbe08a" : "#e8a84a", 0); }
  for (let i = 0; i < 26; i++) { const a = hh(i, 11) * 6.28, r = 30 + 180 * hh(i, 12); p.poly([[300 + r * Math.cos(a), 300 + r * Math.sin(a)], [306 + r * Math.cos(a), 290 + r * Math.sin(a)], [314 + r * Math.cos(a), 302 + r * Math.sin(a)]], "#3a7a3a", 2); }
  for (let i = 0; i < 48; i++) { const a = (i / 48) * 6.28; p.ell(300 + 258 * Math.cos(a), 300 + 258 * Math.sin(a), 14, 9, "#c88a42", 3, 0, 360, a); }
  const lines = n < 2 ? 0 : Math.min(n, 400), alpha = n > 60 ? 0.55 : 1;
  g.strokeStyle = `rgba(36,23,38,${alpha})`; g.lineWidth = n > 60 ? 1.2 : 6;
  for (let i = 0; i < lines; i++) { const a = (i / lines) * Math.PI * 2; g.beginPath(); g.moveTo(300, 300); g.lineTo(300 + 282 * Math.cos(a), 300 + 282 * Math.sin(a)); g.stroke(); }
  if (hole >= 0) { const a0 = -Math.PI / 2 - 0.12, a1 = -Math.PI / 2 + 0.12; g.fillStyle = "#7a4a2a"; g.beginPath(); g.moveTo(300, 300); g.arc(300, 300, 284, a0, a1); g.closePath(); g.fill(); }
};
/** one paper-thin slice you can see through (400 x 600, soft card) */
export const sliceDraw = (p: Pen) => {
  const g = p.g; g.globalAlpha = 0.55; p.poly([[200, 560], [120, 40], [280, 40]], "#f2c85a", 8); p.poly([[120, 40], [280, 40], [270, 70], [130, 70]], "#d99a52", 6); g.globalAlpha = 1;
  p.stroke([[200, 560], [120, 40], [280, 40], [200, 560]], 8);
};
/** a mountain of papers labelled DEBTS (600 x 600) */
export const debtDraw = (p: Pen) => {
  const g = p.g;
  for (let i = 0; i < 16; i++) { const y = 560 - i * 30, w = 250 - i * 9 + 20 * hh(i); p.rot = [(hh(i, 4) - 0.5) * 0.16, 300, y]; p.poly([[300 - w, y - 16], [300 + w, y - 16], [300 + w, y + 16], [300 - w, y + 16]], i % 2 ? "#f4ecd2" : "#e8dcc0", 6); }
  p.rot = null; p.poly([[160, 250], [440, 250], [440, 350], [160, 350]], "#c8282c", 10);
  g.fillStyle = "#fff"; g.font = "900 80px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("DEBTS", 300, 304);
};
/** a balance: left pan a heap of old notes, right pan one new note; tilt in radians (+ = left down) (900 x 700) */
export const scaleDraw = (tilt: number) => (p: Pen) => {
  p.poly([[420, 660], [480, 660], [465, 220], [435, 220]], "#c9a24a", 10); p.poly([[330, 680], [570, 680], [540, 640], [360, 640]], "#8a6a3a", 10);
  const L = 330, dx = L * Math.cos(tilt), dy = L * Math.sin(tilt), lx = 450 - dx, ly = 220 + dy, rx = 450 + dx, ry = 220 - dy;
  p.stroke([[lx, ly], [rx, ry]], 18, INK); p.stroke([[lx, ly], [rx, ry]], 10, "#c9a24a"); p.dot(450, 220, 18, "#c9a24a");
  for (const [x, y, heap] of [[lx, ly, 1], [rx, ry, 0]] as [number, number, number][]) {
    p.stroke([[x, y], [x - 90, y + 200]], 4); p.stroke([[x, y], [x + 90, y + 200]], 4);
    p.ell(x, y + 205, 110, 22, "#c9a24a", 8);
    if (heap) for (let i = 0; i < 9; i++) bundleAt(p, x - 60 + (i % 3) * 60, y + 180 - Math.floor(i / 3) * 34, 0.32, i);
    else { const g = p.g; g.save(); g.translate(x, y + 175); g.fillStyle = "#a8d4b8"; g.strokeStyle = INK; g.lineWidth = 6; g.fillRect(-60, -26, 120, 52); g.strokeRect(-60, -26, 120, 52); g.fillStyle = "#1a4a2a"; g.font = "900 40px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("1", 0, 2); g.restore(); }
  }
};
/** flames for the open stove (300 x 300, soft) */
export const fireDraw = (t: number) => (p: Pen) => {
  for (let i = 0; i < 6; i++) { const x = 50 + i * 40, h = 120 + 70 * Math.abs(Math.sin(t * 9 + i * 1.7)); p.poly([[x - 34, 280], [x + 34, 280], [x + 6, 280 - h], [x, 280 - h - 30]], i % 2 ? "#ffb23a" : "#ff7a2a", 0); }
  for (let i = 0; i < 4; i++) { const x = 80 + i * 50, h = 60 + 40 * Math.abs(Math.sin(t * 11 + i)); p.poly([[x - 18, 280], [x + 18, 280], [x, 280 - h]], "#ffe27a", 0); }
};
export const qMark = (p: Pen) => { const g = p.g; g.font = "900 240px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.lineWidth = 30; g.strokeStyle = INK; g.strokeText("?", 150, 160); g.fillStyle = "#ffd43b"; g.fillText("?", 150, 160); };
export const flyNote = (v: number) => (p: Pen) => { const g = p.g; p.poly([[10, 10], [290, 10], [290, 140], [10, 140]], noteCols[v % 3], 6); g.fillStyle = "#3a4a2a"; g.font = "900 60px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("1000", 150, 80); };
