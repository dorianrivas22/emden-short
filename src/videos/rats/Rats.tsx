// "The Rat Tail Bounty": our original short about the Hanoi rat bounty (1902), in the Emden style
// (2D cartoon characters in a 3D toon world). English and Spanish share one sentence-timed shot list.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, continueRender, delayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { SHOTS, World, layersAt, at, MOODS, WORDS, FPS, FRAMES, VOICE_END, Lang } from "./shots";

export const RATS_FRAMES = FRAMES;
const Ctx = React.createContext<{ t: number; L: Lang }>({ t: 0, L: "en" });

const Inner: React.FC<{ i: number }> = ({ i }) => {
  const { t, L } = React.useContext(Ctx);
  const { camera, scene, gl } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 4.2, widthFar: 2.6, distFar: 140 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.2 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.6, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 5, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
  }), [camera, scene]);
  useEffect(() => () => { try { (fx.ink as any)?.dispose?.(); } catch { /* already disposed */ } }, [fx]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(L, i, t, cam, scene);
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

const View: React.FC<{ i: number; alpha: number; t: number; L: Lang }> = ({ i, alpha, t, L }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.3, far: 2500 }}>
      <Ctx.Provider value={{ t, L }}><Inner i={i} /></Ctx.Provider>
    </ThreeCanvas>
  </AbsoluteFill>
);

// ---------------- captions: 1-2 words at a time, bold white with a dark outline, ~66 % down ----------------
type W = { w: string; s: number; e: number };
const chunksOf = (words: W[]) => {
  const out: { text: string; s: number }[] = []; let cur: W[] = [];
  const push = () => { if (cur.length) out.push({ text: cur.map((w) => w.w).join(" "), s: cur[0].s }); cur = []; };
  for (const w of words) {
    cur.push(w);
    const short = w.w.replace(/[^A-Za-zÀ-ÿ]/g, "").length <= 3;
    if (/[.,!?]$/.test(w.w) || cur.length >= 2 || (!short && cur.length === 1 && w.w.length > 7)) push();
  }
  push(); return out;
};
const CHUNKS: Record<Lang, { text: string; s: number }[]> = { en: chunksOf(WORDS.en), es: chunksOf(WORDS.es) };
const Captions: React.FC<{ t: number; L: Lang }> = ({ t, L }) => {
  const C = CHUNKS[L];
  let c = -1; for (let k = 0; k < C.length; k++) if (C[k].s - 0.03 <= t) c = k;
  if (c < 0 || t > VOICE_END[L] + 0.3) return null;
  const pop = Math.min(1, (t - C[c].s + 0.03) / 0.07);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1920 * 0.655, textAlign: "center", fontFamily: "CapFont", fontSize: 78, color: "#fff",
      WebkitTextStroke: "11px #111", paintOrder: "stroke fill", textShadow: "0 6px 10px rgba(0,0,0,0.35)", transform: `scale(${0.9 + 0.1 * pop})`, letterSpacing: 0.5 }}>
      {C[c].text}
    </div>
  );
};

export const RatsShort: React.FC<{ lang?: Lang }> = ({ lang = "en" }) => {
  const f = useCurrentFrame(), t = f / FPS;
  useEffect(() => {
    const h = delayRender("font");
    const ff = new FontFace("CapFont", `url(${staticFile("Inter-Black.otf")})`);
    ff.load().then((x) => { document.fonts.add(x); continueRender(h); }).catch(() => continueRender(h));
  }, []);
  const layers = layersAt(lang, f);
  // white flash after the hook and when Parliament gives in
  const flashAt = (ts: number) => { const df = f - Math.round(ts * FPS); return df >= 0 && df < 4 ? [0.85, 0.55, 0.3, 0.12][df] : 0; };
  const white = Math.max(flashAt(at(lang, 1)), flashAt(at(lang, 23)));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {layers.map((l, k) => <View key={k ? "over" : "base"} i={l.i} alpha={l.alpha} t={t} L={lang} />)}
      {white > 0 && <AbsoluteFill style={{ background: "#fff", opacity: white }} />}
      <Captions t={t} L={lang} />
    </AbsoluteFill>
  );
};
