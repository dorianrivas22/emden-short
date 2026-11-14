// "The Money Stove" (Germany 1923): made with the cartoon-audio-short skill on the Emden engine
// (2D cartoon cards in a 3D toon world). No captions; the video is exactly as long as the voice.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { SHOTS, World, layersAt, flashAt, FPS, FRAMES } from "./shots";

export const MONEY_FRAMES = FRAMES;

const Inner: React.FC<{ i: number; t: number }> = ({ i, t }) => {
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
  const { target, mood } = world.update(i, t, cam, scene);
  gl.setClearColor(mood.skyHor);
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, target.clone().sub(cam.position).dot(fwd));
  fx.lens.cInf = SHOTS[i].dof ?? 0;
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
    <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 2500 }}>
      <Inner i={i} t={t} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const MoneyShort: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const white = flashAt(f);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {layersAt(f).map((l, k) => <View key={k ? "over" : "base"} i={l.i} alpha={l.alpha} t={t} />)}
      {white > 0 && <AbsoluteFill style={{ background: "#fff", opacity: white }} />}
    </AbsoluteFill>
  );
};
