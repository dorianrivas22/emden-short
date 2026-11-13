// "The Fake Chimney": our original short about SMS Emden at Penang (1914), in the flat-characters-in-a-3D-toon-world style.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { FPS, TOTAL, MOODS, CFG } from "./lib";
import { SHOTS, World, layersAt, T } from "./shots";
import WORDS from "../../../public/words.json";
import WORDS_ES from "../../../public/words_es.json";
import WARP_ES from "../../../public/warp_es.json";

export type Lang = "en" | "es";
const VOICE_END_ES = 65.28;
export const EMDEN_FRAMES_ES = Math.round((VOICE_END_ES + 1.0) * FPS);
/** Spanish time -> English picture time (piecewise linear through matched sentence / key-word starts) */
const warpEs = (t: number) => {
  const P = WARP_ES as [number, number][];
  if (t <= P[0][0]) return t - P[0][0] + P[0][1];
  for (let k = 1; k < P.length; k++) if (t < P[k][0]) { const [a0, b0] = P[k - 1], [a1, b1] = P[k]; return b0 + ((t - a0) * (b1 - b0)) / (a1 - a0); }
  const [aL, bL] = P[P.length - 1]; return Math.min(TOTAL / FPS - 0.001, bL + (t - aL));
};
const TimeCtx = React.createContext(0);

export const EMDEN_FRAMES = TOTAL;

const Inner: React.FC<{ i: number }> = ({ i }) => {
  const tPic = React.useContext(TimeCtx);
  const { camera, scene, gl } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 4.2, widthFar: 2.6, distFar: 140 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.2 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.6, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
  }), [camera, scene]);
  useEffect(() => () => { try { (fx.ink as any)?.dispose?.(); } catch { /* already disposed by the composer */ } }, [fx]);
  const cam = camera as THREE.PerspectiveCamera;
  const t = tPic;
  const target = world.update(i, t, cam, scene);
  const s = SHOTS[i];
  gl.setClearColor(MOODS[s.mood].skyHor);
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, target.clone().sub(cam.position).dot(fwd));
  fx.lens.cInf = s.dof ?? 0;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      <EffectComposer multisampling={4}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
      </EffectComposer>
    </>
  );
};

const View: React.FC<{ i: number; alpha: number; t: number }> = ({ i, alpha, t }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.3, far: 2500 }}>
      <TimeCtx.Provider value={t}><Inner i={i} /></TimeCtx.Provider>
    </ThreeCanvas>
  </AbsoluteFill>
);

// ---------------- 2D overlays ----------------
type W = { w: string; s: number; e: number };
const chunksOf = (words: W[]) => {
/** captions: 1-2 words at a time, like the reference channel; a chunk breaks at punctuation or after 2 words */
  const out: { text: string; s: number }[] = []; let cur: W[] = [];
  const push = () => { if (cur.length) out.push({ text: cur.map((w) => w.w).join(" "), s: cur[0].s }); cur = []; };
  for (const w of words) {
    cur.push(w);
    const short = w.w.replace(/[^A-Za-z]/g, "").length <= 3;
    if (/[.,!?]$/.test(w.w) || cur.length >= 2 || (!short && cur.length === 1 && w.w.length > 7)) push();
  }
  push(); return out;
};
const CHUNKS_EN = chunksOf(WORDS as W[]), CHUNKS_ES = chunksOf(WORDS_ES as W[]);
const Captions: React.FC<{ t: number; lang: Lang }> = ({ t, lang }) => {
  const CHUNKS = lang === "es" ? CHUNKS_ES : CHUNKS_EN, endT = lang === "es" ? VOICE_END_ES + 0.25 : 56.4;
  let c = -1; for (let k = 0; k < CHUNKS.length; k++) if (CHUNKS[k].s - 0.03 <= t) c = k;
  if (c < 0 || t > endT) return null;
  const pop = Math.min(1, (t - CHUNKS[c].s + 0.03) / 0.07);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1920 * 0.655, textAlign: "center", fontFamily: "CapFont", fontSize: 78, color: "#fff",
      WebkitTextStroke: "11px #111", paintOrder: "stroke fill", textShadow: "0 6px 10px rgba(0,0,0,0.35)", transform: `scale(${0.9 + 0.1 * pop})`, letterSpacing: 0.5 }}>
      {CHUNKS[c].text}
    </div>
  );
};

/** the captain's map: a stylised Malay Peninsula with Penang, the route drawing in, a pointing finger */
const MapInsert: React.FC<{ t: number }> = ({ t }) => {
  const u = Math.min(1, Math.max(0, (t - T.map - 0.2) / 1.4));
  const pin = Math.min(1, Math.max(0, (t - T.penang + 0.05) / 0.15));
  const finger = Math.min(1, Math.max(0, (t - 12.05) / 0.3));
  const push = 1 + 0.06 * (t - T.map);
  return (
    <AbsoluteFill style={{ background: "#3a2414" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push}) rotate(-2deg)`, transformOrigin: "55% 40%" }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <defs><filter id="paper"><feTurbulence baseFrequency="0.9" numOctaves={2} seed={3} /><feColorMatrix values="0 0 0 0 0.45 0 0 0 0 0.33 0 0 0 0 0.2 0 0 0 0.12 0" /><feComposite in2="SourceGraphic" operator="in" /></filter></defs>
          <mask id="reveal"><path d="M140 300 C260 380 330 470 420 540 C470 580 510 610 545 635" fill="none" stroke="#fff" strokeWidth={30} pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - u)} /></mask>
          <rect x={40} y={180} width={1000} height={1560} rx={18} fill="#ecd9ae" stroke="#2a1a10" strokeWidth={10} />
          <rect x={80} y={220} width={920} height={1480} fill="#8fc4d8" stroke="#2a1a10" strokeWidth={6} />
          {/* Malay Peninsula */}
          <path d="M610 230 C660 300 640 420 700 520 C760 640 740 760 780 900 C820 1040 800 1150 860 1260 C900 1330 880 1420 840 1460 C790 1500 770 1430 750 1380 C700 1260 690 1150 640 1050 C590 940 600 820 560 700 C520 580 540 460 520 360 C510 300 560 240 610 230 Z" fill="#e6cf8f" stroke="#2a1a10" strokeWidth={7} />
          {/* Sumatra */}
          <path d="M80 760 C200 800 330 900 420 1030 C520 1170 600 1300 640 1440 C660 1520 640 1640 600 1700 L80 1700 Z" fill="#dcc283" stroke="#2a1a10" strokeWidth={7} />
          {/* Thailand coast top */}
          <path d="M520 220 L1000 220 L1000 520 C930 470 850 420 760 360 C700 320 640 260 520 220 Z" fill="#e6cf8f" stroke="#2a1a10" strokeWidth={7} />
          {/* Penang island */}
          <ellipse cx={560} cy={640} rx={26} ry={34} fill="#e6cf8f" stroke="#2a1a10" strokeWidth={6} />
          <rect x={80} y={220} width={920} height={1480} fill="transparent" filter="url(#paper)" />
          {/* route */}
          <path d="M140 300 C260 380 330 470 420 540 C470 580 510 610 545 635" fill="none" stroke="#c8282c" strokeWidth={12} strokeDasharray="28 22" strokeLinecap="round"
            mask="url(#reveal)" />
          <g transform={`translate(${140 + 405 * u - 20 * u * u}, ${300 + 335 * u}) rotate(40)`}>
            <path d="M-34 0 L26 -12 L40 0 L26 12 Z" fill="#6f7884" stroke="#111" strokeWidth={5} />
          </g>
          {pin > 0 && <g transform={`translate(560 ${600 - 10 * pin}) scale(${pin})`}>
            <path d="M0 0 C-30 -40 -30 -80 0 -95 C30 -80 30 -40 0 0 Z" fill="#e0302c" stroke="#111" strokeWidth={6} /><circle cx={0} cy={-62} r={12} fill="#fff" />
            <text x={0} y={-120} textAnchor="middle" fontFamily="CapFont" fontSize={64} fill="#fff" stroke="#111" strokeWidth={10} style={{ paintOrder: "stroke" }}>PENANG</text>
          </g>}
          <g transform={`translate(${520 + 260 * (1 - finger)} ${760 + 300 * (1 - finger)}) rotate(-35)`} opacity={finger > 0 ? 1 : 0}>
            <rect x={-30} y={20} width={60} height={260} rx={28} fill="#ffe2c2" stroke="#241726" strokeWidth={9} />
            <rect x={-38} y={200} width={76} height={150} rx={20} fill="#1f2a4d" stroke="#241726" strokeWidth={9} />
            <circle cx={0} cy={20} r={30} fill="#ffe2c2" stroke="#241726" strokeWidth={9} />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

const fontHandle = { h: 0 };
export const EmdenShort: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  CFG.lang = lang;
  const f = useCurrentFrame(), tv = f / FPS;           // voice / caption time
  const t = lang === "es" ? warpEs(tv) : tv;            // picture time (the English timeline)
  const fp = t * FPS;
  useEffect(() => {
    const h = delayRender("font");
    const ff = new FontFace("CapFont", `url(${staticFile("Inter-Black.otf")})`);
    ff.load().then((x) => { document.fonts.add(x); continueRender(h); }).catch(() => continueRender(h));
  }, []);
  const layers = layersAt(fp);
  const isMap = t >= T.map && t < T.going;
  const flash = (k: number) => { const df = Math.floor(f - (lang === "es" ? 0 : 0) - frameOf(k, lang)); return df >= 0 && df < 4 ? [0.9, 0.6, 0.35, 0.15][df] : 0; };
  const white = Math.max(flash(T.hookEnd), flash(T.fire));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {!isMap && layers.map((l, k) => <View key={k ? "over" : "base"} i={l.i} alpha={l.alpha} t={t} />)}
      {isMap && <MapInsert t={t} />}
      {white > 0 && <AbsoluteFill style={{ background: "#fff", opacity: white }} />}
      <Captions t={tv} lang={lang} />
    </AbsoluteFill>
  );
};
/** output frame where the picture reaches English time k */
const frameOf = (k: number, lang: Lang) => {
  if (lang === "en") return Math.round(k * FPS);
  let f = 0; while (f < EMDEN_FRAMES_ES && warpEs(f / FPS) < k - 1e-6) f++; return f;
};
void fontHandle;
