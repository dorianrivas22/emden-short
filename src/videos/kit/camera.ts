// "Living" camera for the v2 engine. The guide measured the channel's camera as never still: zoom > 2 %/s in 75 %
// of frames (the metric most correlated with views, rho +0.78), roll > 1 deg/s in 44 %, pans > 3 px/frame in 37 %,
// still in only 5.5 %, mean 5.7 px/frame. Every shot's keyed path gets this layer on top:
//   - a continuous push-in (fov shrinking ~3.5 %/s, never zero),
//   - a lateral truck (camera AND look target slide sideways, ~13 % of the frame width per second) so the whole
//     picture pans, alternating direction per shot, plus a slow orbit for parallax,
//   - a gentle roll oscillation (+-1.1 deg),
//   - a tiny handheld wobble.
import * as THREE from "three";

export type Cam = { pos: [number, number, number]; look: [number, number, number]; fov: number; roll?: number };
export type LiveOpts = { push?: number; truck?: number; orbit?: number; roll?: number; wobble?: number };

/** t = seconds since the shot started, seed = shot index */
export const live = (c: Cam, t: number, seed: number, o: LiveOpts = {}): Cam => {
  const dir = seed % 2 ? 1 : -1;
  const push = o.push ?? (seed % 5 === 4 ? 0.012 : seed % 2 ? 0.03 : -0.026), truck = (o.truck ?? 0.85) * dir, orbit = (o.orbit ?? 3) * dir, roll = o.roll ?? 0.8, wob = o.wobble ?? 1;
  const P = new THREE.Vector3(...c.pos), L = new THREE.Vector3(...c.look);
  const off = P.clone().sub(L), dist = off.length();
  const right = new THREE.Vector3(0, 1, 0).cross(off).normalize().multiplyScalar(-1);
  // frame width at the target = 2 d tan(hfov/2); truck 13 %/s of it, eased in over the first 0.3 s
  const hw = dist * Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) * (1080 / 1920);
  const slide = right.multiplyScalar(truck * 0.13 * 2 * hw * (t - 0.15 * (1 - Math.exp(-t / 0.15))));
  off.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(orbit * t));
  const ph = seed * 1.7;
  const w = new THREE.Vector3(Math.sin(t * 1.3 + ph) * 0.01, Math.sin(t * 1.7 + ph * 2) * 0.008, 0).multiplyScalar(wob * dist);
  const look = L.clone().add(slide), pos = look.clone().add(off).add(w);
  return { pos: [pos.x, pos.y, pos.z], look: [look.x, look.y, look.z], fov: c.fov * Math.exp(-push * t), roll: (c.roll ?? 0) + roll * Math.sin(t * 0.85 + ph) };
};

/** place a perspective camera from a Cam (roll in degrees) */
export const applyCam = (cam: THREE.PerspectiveCamera, c: Cam, kick = 0) => {
  cam.position.set(c.pos[0], c.pos[1] + kick * 0.3, c.pos[2]); cam.fov = c.fov; cam.up.set(0, 1, 0);
  cam.lookAt(c.look[0], c.look[1] + kick * 0.1, c.look[2]); cam.rotateZ(THREE.MathUtils.degToRad(c.roll ?? 0) + kick * 0.012);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
};
