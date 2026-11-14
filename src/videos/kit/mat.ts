// Materials for the v2 engine: soft physically-lit surfaces (smooth light falloff + AO + coloured fill) instead of the
// old 2-step toon ramp, plus glowing lamps and additive light shafts.
import * as THREE from "three";
import { NOINK } from "../bridge/ink";

const cache = new Map<string, THREE.Material>();
/** soft-lit surface: base colour x optional texture; rough matte by default */
export const soft = (col: string, o: { map?: THREE.Texture; rough?: number; metal?: number; side?: THREE.Side; emissive?: string; ei?: number } = {}) => {
  const k = `soft|${col}|${o.map?.uuid ?? ""}|${o.rough ?? 0.88}|${o.metal ?? 0}|${o.side ?? 0}|${o.emissive ?? ""}|${o.ei ?? 0}`;
  let m = cache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: col, map: o.map ?? null, roughness: o.rough ?? 0.88, metalness: o.metal ?? 0, side: o.side ?? THREE.FrontSide,
      emissive: o.emissive ?? "#000000", emissiveIntensity: o.ei ?? 0 });
    cache.set(k, m);
  }
  return m;
};
/** unlit HDR glow (lamp bulbs, lit windows, fire): bloom picks it up */
export const lit = (col: string, k = 2.5) => {
  const key = `lit|${col}|${k}`;
  let m = cache.get(key);
  if (!m) { m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k) }); cache.set(key, m); }
  return m;
};
/** a volumetric-looking light shaft: additive cone, bright at the source, fading to nothing (never inked) */
const shaftTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 256; const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, "rgba(0,0,0,1)"); gx.addColorStop(0.3, "rgba(0,0,0,0)"); gx.addColorStop(0.7, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
    t = new THREE.CanvasTexture(cv); return t;
  };
})();
export const shaft = (col: string, r0: number, r1: number, len: number, opacity = 0.22) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: col, map: shaftTex(), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.geometry.translate(0, -len / 2, 0); m.layers.set(NOINK); m.renderOrder = 5; (m as any).isShaft = true;
  return m;
};
export const noInk = <T extends THREE.Object3D>(o: T) => { o.traverse((c) => c.layers.set(NOINK)); return o; };
/** turn shadows on for everything solid in a group */
export const shadows = <T extends THREE.Object3D>(o: T, cast = true, receive = true) => {
  o.traverse((c) => { const m = c as THREE.Mesh; if (m.isMesh && !(m as any).isShaft && !(m.material as THREE.Material & { isMeshBasicMaterial?: boolean }).isMeshBasicMaterial) { m.castShadow = cast; m.receiveShadow = receive; } });
  return o;
};
