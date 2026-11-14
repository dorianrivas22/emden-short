// Render stack of the v2 engine ("kit"): soft lighting with shadows (warm key + cool hemisphere fill), ambient
// occlusion (N8AO), ink outlines on the world, lens blur, bloom, neutral tone mapping and the colour grade fitted to
// research/GUIA_NUMERICA_20.md. A video provides a KitWorld; Stage renders one shot layer of it.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { N8AOPostPass } from "n8ao";
import { InkPass, NOINK } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect } from "../bridge/grade";
import type { Look } from "./look";

export type Frame = { target: THREE.Vector3; look: Look; dof: number; shadowR?: number };
export interface KitWorld { root: THREE.Group; update(i: number, t: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene, rig: Rig): Frame }

const skyVert = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w*0.99999; }`;
const skyFrag = `
uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float stars; uniform float disc;
varying vec3 vDir;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec3 d = normalize(vDir); float y = clamp(d.y, -0.05, 1.0);
  vec3 c = mix(hor, top, pow(clamp(y*1.5, 0.0, 1.0), 0.6));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  c += sunCol * (pow(s, 5.0)*0.3 + pow(s, 40.0)*0.45) * (0.4 + disc);
  if (stars > 0.0 && y > 0.05) { vec2 g = vec2(atan(d.z, d.x)*120.0, y*160.0); vec2 cell = floor(g); vec2 f = fract(g) - 0.5;
    float on = step(0.93, h(cell)); float tw = smoothstep(0.12, 0.0, length(f)); c += vec3(1.0,0.97,0.9)*on*tw*stars*smoothstep(0.05,0.3,y); }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

/** lights + sky shared by every shot: the world only adds practical lights */
export class Rig {
  root = new THREE.Group();
  sun = new THREE.DirectionalLight("#ffffff", 2); hemi = new THREE.HemisphereLight("#9db6f0", "#c8b090", 1.2);
  sky: THREE.Mesh; skyU: Record<string, THREE.IUniform>;
  constructor() {
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02; this.sun.shadow.radius = 4;
    this.skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, stars: { value: 0 }, disc: { value: 0 } };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: this.skyU, side: THREE.BackSide, depthWrite: false, fog: false }));
    this.sky.renderOrder = -10; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    this.root.add(this.sun, this.sun.target, this.hemi, this.sky);
  }
  apply(L: Look, scene: THREE.Scene, cam: THREE.Camera, target: THREE.Vector3, skyOn: boolean, shadowR = 12) {
    this.skyU.top.value.set(L.skyTop); this.skyU.hor.value.set(L.skyHor); this.skyU.sunDir.value.set(...L.sunDir).normalize(); this.skyU.sunCol.value.set(L.sun);
    this.skyU.stars.value = L.stars ?? 0; this.skyU.disc.value = L.disc ?? 0; this.sky.position.copy(cam.position); this.sky.visible = skyOn;
    this.sun.color.set(L.sun); this.sun.intensity = L.sunI;
    const d = new THREE.Vector3(...L.sunDir).normalize();
    this.sun.position.copy(target).addScaledVector(d, 60); this.sun.target.position.copy(target);
    const sc = this.sun.shadow.camera; sc.left = sc.bottom = -shadowR; sc.right = sc.top = shadowR; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix();
    this.hemi.color.set(L.hemiSky); this.hemi.groundColor.set(L.hemiGround); this.hemi.intensity = L.hemiI;
    scene.fog = new THREE.Fog(L.skyHor, L.fogNear, L.fogFar);
  }
}

const Inner: React.FC<{ make: () => KitWorld; i: number; t: number; frame: number }> = ({ make, i, t, frame }) => {
  const { camera, scene, gl, size } = useThree();
  const world = useMemo(make, [make]);
  const rig = useMemo(() => new Rig(), []);
  const fx = useMemo(() => {
    const ao = new N8AOPostPass(scene, camera, size.width, size.height);
    Object.assign(ao.configuration, { aoRadius: 1.2, distanceFalloff: 0.6, intensity: 1.5, aoSamples: 16, denoiseSamples: 8, halfRes: true, color: new THREE.Color("#2a2850") });
    return {
      ao,
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 8.2, widthFar: 4.6, distFar: 120, creaseScale: 1.05, angleLo: 26, angleHi: 40, depthLo: 0.006, depthHi: 0.02, color: "#120e1c" }),
      lens: new LensBlur({ maxCoC: 18, nearScale: 1.2 }),
      bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 0.92, luminanceSmoothing: 0.25, mipmapBlur: true, levels: 6, radius: 0.7 }),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect({ ky: [0, .1, .25, .5, .75, .9, 1], sat: [1, 1, 1], tintS: [0, 0], tintM: [0, 0], tintH: [0, 0], vig: [0, 0.5] }),
    };
  }, [camera, scene]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; return () => { try { (fx.ink as any).dispose?.(); } catch { /* */ } }; }, [world, rig, scene, gl, fx]);
  const cam = camera as THREE.PerspectiveCamera;
  const F = world.update(i, t, cam, scene, rig);
  rig.apply(F.look, scene, cam, F.target, true, F.shadowR);
  gl.toneMappingExposure = F.look.exposure; gl.setClearColor(F.look.skyHor);
  fx.grade.set(F.look.grade); fx.bloom.intensity = F.look.bloom;
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.3, F.target.clone().sub(cam.position).dot(fwd)); fx.lens.cInf = F.dof;
  void frame;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      <primitive object={rig.root} dispose={null} />
      <EffectComposer multisampling={4}>
        <primitive object={fx.ao} dispose={null} />
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
      </EffectComposer>
    </>
  );
};

/** one shot layer (crossfades stack two of these) */
export const StageView: React.FC<{ make: () => KitWorld; i: number; t: number; frame: number; alpha?: number }> = ({ make, i, t, frame, alpha = 1 }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 2500 }}>
      <Inner make={make} i={i} t={t} frame={frame} />
    </ThreeCanvas>
  </AbsoluteFill>
);
