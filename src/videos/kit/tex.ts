// Detailed painted textures for the v2 engine. The guide asks for ~285 distinct colours per frame and 14 % fine
// detail (we had 80-117 and 7-10 %): every surface gets value/hue variation, grain, wear and dirt at two scales,
// painted flat-ish (cartoon) but never one flat colour.
import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();
export const rnd = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const shadeHex = (h: string, k: number, hueShift = 0) => {
  const c = new THREE.Color(h); const hsl = { h: 0, s: 0, l: 0 }; c.getHSL(hsl);
  c.setHSL((hsl.h + hueShift + 1) % 1, hsl.s, Math.max(0, Math.min(1, hsl.l * k))); return "#" + c.getHexString();
};

export const tex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number], grain = 0.1) => {
  let t = cache.get(key);
  if (t) return t;
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d")!; draw(g, w, h);
  if (grain > 0) { // per-pixel value grain + a coarser blotch layer: real surfaces are never flat
    const id = g.getImageData(0, 0, w, h), d = id.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, n = (rnd(x * 7 + y * 131, 3) - 0.5) * 2 * grain + (Math.sin(x * 0.045 + rnd(y >> 4, 2) * 6) * Math.sin(y * 0.037 + 1.3)) * grain * 0.6;
      d[i] = Math.max(0, Math.min(255, d[i] * (1 + n))); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] * (1 + n))); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] * (1 + n * 0.8)));
    }
    g.putImageData(id, 0, 0);
  }
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  cache.set(key, t); return t;
};

/** wooden planks with grain lines, knots and worn edges */
export const planks = (base: string, rep: [number, number] = [2, 2], rows = 8) => tex(`planks_${base}_${rows}`, 1024, 1024, (g, w, h) => {
  const ph = h / rows;
  for (let r = 0; r < rows; r++) {
    const off = rnd(r, 1) * w;
    for (let seg = -1; seg < 3; seg++) {
      const x0 = off + seg * w * 0.62 - w * 0.3, col = shadeHex(base, 0.82 + 0.3 * rnd(r * 7 + seg, 2), (rnd(r + seg, 9) - 0.5) * 0.02);
      g.fillStyle = col; g.fillRect(x0, r * ph, w * 0.62, ph);
      g.strokeStyle = shadeHex(base, 0.62); g.lineWidth = 1.5;
      for (let k = 0; k < 7; k++) { const y = r * ph + 6 + rnd(k + r * 9, seg + 4) * (ph - 12); g.globalAlpha = 0.35 + 0.3 * rnd(k, r); g.beginPath(); g.moveTo(x0, y); for (let x = 0; x <= w * 0.62; x += 24) g.lineTo(x0 + x, y + 3 * Math.sin(x * 0.02 + k)); g.stroke(); }
      g.globalAlpha = 1;
      if (rnd(r * 3 + seg, 6) > 0.6) { const kx = x0 + rnd(r, seg) * w * 0.5, ky = r * ph + ph / 2; g.fillStyle = shadeHex(base, 0.55); g.beginPath(); g.ellipse(kx, ky, 9, 5, 0, 0, 7); g.fill(); }
      g.fillStyle = shadeHex(base, 0.45); g.fillRect(x0 - 2, r * ph, 4, ph);
    }
    g.fillStyle = shadeHex(base, 0.4); g.fillRect(0, r * ph, w, 4);
    g.fillStyle = shadeHex(base, 1.15); g.globalAlpha = 0.5; g.fillRect(0, r * ph + 4, w, 2); g.globalAlpha = 1;
  }
}, rep);

/** bricks with mortar, colour variation, chips and soot */
export const bricks = (base: string, mortar = "#b8ab98", rep: [number, number] = [2, 2]) => tex(`bricks_${base}_${mortar}`, 1024, 1024, (g, w, h) => {
  g.fillStyle = mortar; g.fillRect(0, 0, w, h);
  const bh = 48, bw = 112;
  for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) {
    const x = c * bw + (r % 2) * bw / 2, i = r * 31 + c;
    g.fillStyle = shadeHex(base, 0.75 + 0.45 * rnd(i, 1), (rnd(i, 4) - 0.5) * 0.04); g.fillRect(x + 4, r * bh + 4, bw - 8, bh - 8);
    g.fillStyle = "rgba(0,0,0,0.13)"; g.fillRect(x + 4, r * bh + bh - 14, bw - 8, 10);
    g.fillStyle = "rgba(255,255,255,0.1)"; g.fillRect(x + 4, r * bh + 4, bw - 8, 5);
    if (rnd(i, 7) > 0.85) { g.fillStyle = mortar; g.beginPath(); g.arc(x + 4 + rnd(i, 8) * (bw - 8), r * bh + 6, 7, 0, 7); g.fill(); }
  }
  const gr = g.createLinearGradient(0, h, 0, h * 0.55); gr.addColorStop(0, "rgba(30,20,20,0.35)"); gr.addColorStop(1, "rgba(30,20,20,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, rep);

/** plaster / painted wall with water stains, cracks and a darker skirting zone */
export const plaster = (base: string, rep: [number, number] = [1, 1]) => tex(`plaster_${base}`, 1024, 1024, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { const x = rnd(i, 1) * w, y = rnd(i, 2) * h, r = 30 + 120 * rnd(i, 3); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rnd(i, 5) > 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  g.strokeStyle = shadeHex(base, 0.6); g.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) { let x = rnd(i, 7) * w, y = rnd(i, 8) * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd(i * 9 + k, 3) - 0.5) * 60; y += 10 + rnd(i + k, 4) * 30; g.lineTo(x, y); } g.stroke(); }
  const gr = g.createLinearGradient(0, h, 0, h * 0.7); gr.addColorStop(0, "rgba(40,30,30,0.25)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, rep);

/** patterned wallpaper (stripes + motif), slightly faded */
export const wallpaper = (bg: string, fg: string, rep: [number, number] = [3, 1.5]) => tex(`wallp_${bg}_${fg}`, 512, 512, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = fg; g.globalAlpha = 0.55; g.fillRect(i * 128 + 58, 0, 12, h); }
  g.globalAlpha = 0.8;
  for (let i = 0; i < 16; i++) { const x = (i % 4) * 128 + 0, y = Math.floor(i / 4) * 128 + (i % 2) * 64 + 32; g.fillStyle = fg; g.beginPath(); for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; g.ellipse(x + 10 * Math.cos(a), y + 10 * Math.sin(a), 8, 5, a, 0, 7); } g.fill(); g.fillStyle = shadeHex(fg, 0.7); g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}, rep);

/** cobblestones with individual shading and dark gaps */
export const cobbles = (base: string, rep: [number, number] = [4, 20]) => tex(`cobbles_${base}`, 1024, 1024, (g, w, h) => {
  g.fillStyle = shadeHex(base, 0.4); g.fillRect(0, 0, w, h);
  const s = 64;
  for (let r = 0; r < h / s; r++) for (let c = -1; c < w / s + 1; c++) {
    const x = c * s + (r % 2) * s / 2 + s / 2, y = r * s + s / 2, i = r * 41 + c, rx = s * 0.42 + 4 * rnd(i, 1), ry = s * 0.38 + 4 * rnd(i, 2);
    const gr = g.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 2, x, y, rx * 1.1);
    const col = shadeHex(base, 0.8 + 0.4 * rnd(i, 3), (rnd(i, 5) - 0.5) * 0.05); gr.addColorStop(0, shadeHex(col, 1.2)); gr.addColorStop(1, shadeHex(col, 0.75));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, rnd(i, 4) * 0.5, 0, 7); g.fill();
  }
}, rep);

/** roof tiles / shingles in rows */
export const tiles = (base: string, rep: [number, number] = [4, 4]) => tex(`rooft_${base}`, 512, 512, (g, w, h) => {
  g.fillStyle = shadeHex(base, 0.5); g.fillRect(0, 0, w, h);
  for (let r = 0; r < 12; r++) for (let c = -1; c < 10; c++) { const x = c * 56 + (r % 2) * 28, y = r * 44, i = r * 17 + c; g.fillStyle = shadeHex(base, 0.8 + 0.35 * rnd(i, 1)); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 54, y); g.lineTo(x + 54, y + 36); g.quadraticCurveTo(x + 27, y + 50, x, y + 36); g.closePath(); g.fill(); g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(x, y + 30, 54, 6); }
}, rep);

/** checker floor tiles with worn grout */
export const checker = (a: string, b: string, rep: [number, number] = [6, 6]) => tex(`check_${a}_${b}`, 512, 512, (g, w, h) => {
  const n = 8, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = shadeHex((i + j) % 2 ? a : b, 0.92 + 0.14 * rnd(i * n + j, 2)); g.fillRect(i * s, j * s, s, s); }
  g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 3; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
}, rep);

/** dark-painted panelling (wainscot) */
export const panels = (base: string, rep: [number, number] = [4, 1]) => tex(`panels_${base}`, 512, 512, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x = 20 + i * 256, y = 20 + j * 256;
    g.fillStyle = shadeHex(base, 0.82); g.fillRect(x, y, 216, 216);
    g.fillStyle = shadeHex(base, 1.18); g.fillRect(x, y, 216, 8); g.fillRect(x, y, 8, 216);
    g.fillStyle = shadeHex(base, 0.6); g.fillRect(x, y + 208, 216, 8); g.fillRect(x + 208, y, 8, 216);
  }
}, rep);

/** paper with printed text lines (posters, newspapers, ledgers) */
export const printed = (key: string, title: string, bg = "#efe6cc", ink = "#2a2220", lines = 14) => tex(`printed_${key}`, 512, 704, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = ink; g.textAlign = "center"; g.font = "900 64px serif"; g.fillText(title, w / 2, 90); g.fillRect(40, 112, w - 80, 5);
  for (let i = 0; i < lines; i++) { const y = 160 + i * 36; g.globalAlpha = 0.55; g.fillRect(40, y, (w - 80) * (0.6 + 0.4 * rnd(i, title.length)), 10); }
  g.globalAlpha = 1;
}, undefined, 0.05);
