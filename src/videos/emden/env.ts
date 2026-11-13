// Sky dome, painted sea and clouds, all driven by a Mood.
import * as THREE from "three";
import { MoodDef, noInk, ctex, hh } from "./lib";

const skyVert = `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w*0.99999; }`;
const skyFrag = `
uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float stars; uniform float disc;
varying vec3 vDir;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec3 d = normalize(vDir);
  float y = clamp(d.y, -0.05, 1.0);
  float k = pow(clamp(y*1.6, 0.0, 1.0), 0.55);
  vec3 c = mix(hor, top, k);
  float s = max(dot(d, normalize(sunDir)), 0.0);
  c += sunCol * (pow(s, 6.0)*0.35 + pow(s, 40.0)*0.4) * disc;
  if (disc > 0.0 && s > 0.9985) c = mix(c, vec3(1.0, 0.93, 0.8)*2.2, disc);
  if (stars > 0.0 && y > 0.05) {
    vec2 g = vec2(atan(d.z, d.x)*120.0, y*160.0); vec2 cell = floor(g); vec2 f = fract(g) - 0.5;
    float r = h(cell); float on = step(0.93, r);
    float tw = smoothstep(0.12, 0.0, length(f + (vec2(h(cell+3.1), h(cell+7.7))-0.5)*0.6));
    c += vec3(1.0, 0.97, 0.9) * on * tw * stars * (0.6 + 0.8*h(cell+1.3)) * smoothstep(0.05, 0.3, y);
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

const seaVert = `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const seaFrag = `
uniform vec3 near; uniform vec3 far; uniform vec3 hor; uniform vec3 crest; uniform float time; uniform vec3 camPos; uniform float fogNear; uniform float fogFar;
uniform vec4 calm; // xy centre, z radius, w strength (oil slick: smooth golden patch)
varying vec3 vW;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float dash(vec2 p, vec2 cellSz, float seed, float len){
  vec2 g = p / cellSz; vec2 cell = floor(g); vec2 f = fract(g);
  float r = h(cell + seed); if (r < 0.45) return 0.0;
  vec2 c = vec2(0.2 + 0.6*h(cell+seed+2.0), 0.3 + 0.4*h(cell+seed+5.0));
  vec2 q = (f - c) * cellSz; q.x /= len*(0.6+0.8*h(cell+seed+9.0));
  float bend = q.y + 0.18*q.x*q.x;
  return smoothstep(1.0, 0.6, abs(q.x)) * smoothstep(0.09, 0.03, abs(bend));
}
void main(){
  float d = length(vW.xz - camPos.xz);
  float t = clamp((d - 8.0) / 260.0, 0.0, 1.0);
  vec3 c = mix(near, far, pow(t, 0.7));
  vec2 p = vW.xz + vec2(time*0.6, time*0.25);
  float band = 0.5 + 0.5*sin(vW.x*0.08 + vW.z*0.05 + time*0.7);
  c *= 0.94 + 0.08*band;
  float m = dash(p, vec2(7.0, 3.2), 0.0, 1.5) + dash(p*1.0 + 31.0, vec2(11.0, 5.0), 7.0, 2.4)*0.8;
  float calmK = 0.0;
  if (calm.w > 0.0) { calmK = calm.w * smoothstep(calm.z, calm.z*0.6, length(vW.xz - calm.xy)); }
  m *= (1.0 - calmK);
  c = mix(c, mix(c, vec3(1.0, 0.8, 0.35), 0.55), calmK);
  c = mix(c, crest, clamp(m, 0.0, 1.0) * (1.0 - t*0.85));
  float fg = smoothstep(fogNear, fogFar, d);
  c = mix(c, hor, fg);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;

export class Env {
  root = new THREE.Group();
  sky: THREE.Mesh; sea: THREE.Mesh; skyU: Record<string, THREE.IUniform>; seaU: Record<string, THREE.IUniform>;
  sun = new THREE.DirectionalLight("#ffffff", 2); amb = new THREE.AmbientLight("#ffffff", 1); hemi = new THREE.HemisphereLight("#ffffff", "#000000", 0.0);
  clouds = new THREE.Group();
  constructor() {
    this.skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, stars: { value: 0 }, disc: { value: 0 } };
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: this.skyU, side: THREE.BackSide, depthWrite: false }));
    this.sky.renderOrder = -10; this.sky.frustumCulled = false;
    this.seaU = { near: { value: new THREE.Color() }, far: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, crest: { value: new THREE.Color() }, time: { value: 0 },
      camPos: { value: new THREE.Vector3() }, fogNear: { value: 100 }, fogFar: { value: 800 }, calm: { value: new THREE.Vector4(0, 0, 1, 0) } };
    const sg = new THREE.PlaneGeometry(3000, 3000, 1, 1); sg.rotateX(-Math.PI / 2);
    this.sea = new THREE.Mesh(sg, new THREE.ShaderMaterial({ vertexShader: seaVert, fragmentShader: seaFrag, uniforms: this.seaU }));
    this.sea.frustumCulled = false;
    this.root.add(noInk(this.sky), noInk(this.sea), this.sun, this.sun.target, this.amb, noInk(this.clouds));
    for (let i = 0; i < 14; i++) {
      const tex = cloudTex(i % 4);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
      const a = (i / 14) * Math.PI * 2 + hh(i) * 0.4, r = 520 + 200 * hh(i, 2), s = 90 + 90 * hh(i, 3);
      m.position.set(Math.cos(a) * r, 60 + 130 * hh(i, 4), Math.sin(a) * r); m.scale.set(s, s, 1); m.lookAt(0, m.position.y, 0);
      this.clouds.add(m);
    }
  }
  apply(M: MoodDef, scene: THREE.Scene, cam: THREE.Camera, t: number, cloudCol = "#ffffff", cloudsOn = true) {
    this.skyU.top.value.set(M.skyTop); this.skyU.hor.value.set(M.skyHor); this.skyU.sunDir.value.set(...M.sunDir).normalize(); this.skyU.sunCol.value.set(M.sun);
    this.skyU.stars.value = M.stars; this.skyU.disc.value = M.disc;
    this.seaU.near.value.set(M.seaNear); this.seaU.far.value.set(M.seaFar); this.seaU.hor.value.set(M.skyHor); this.seaU.crest.value.set(M.crest);
    this.seaU.time.value = t; this.seaU.camPos.value.copy(cam.position); this.seaU.fogNear.value = M.fogNear; this.seaU.fogFar.value = M.fogFar;
    this.sky.position.copy(cam.position);
    this.clouds.position.set(cam.position.x, 0, cam.position.z);
    this.clouds.visible = cloudsOn;
    this.clouds.children.forEach((c) => ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(cloudCol));
    this.sun.color.set(M.sun); this.sun.intensity = M.sunI;
    this.sun.position.set(cam.position.x + M.sunDir[0] * 100, M.sunDir[1] * 100, cam.position.z + M.sunDir[2] * 100);
    this.sun.target.position.set(cam.position.x, 0, cam.position.z);
    this.amb.color.set(M.amb); this.amb.intensity = M.ambI;
    scene.fog = new THREE.Fog(M.skyHor, M.fogNear, M.fogFar);
  }
}

const cloudTex = (v: number) => ctex(`cloud${v}`, 512, 256, (g) => {
  const blobs = 5 + v;
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < blobs; i++) {
      const x = 80 + (352 * i) / (blobs - 1) + 20 * hh(i, v), y = 170 - 70 * Math.sin((i / (blobs - 1)) * Math.PI) * (0.7 + 0.5 * hh(i, v + 3)), r = 55 + 35 * hh(i, v + 7);
      g.beginPath(); g.ellipse(x, y + (pass ? 0 : 8), r, r * 0.8, 0, 0, Math.PI * 2);
      g.fillStyle = pass ? "rgba(255,255,255,1)" : "rgba(196,206,236,1)"; g.fill();
    }
  g.fillStyle = "rgba(255,255,255,1)"; g.fillRect(60, 175, 392, 30);
  g.globalCompositeOperation = "destination-out"; g.fillRect(0, 205, 512, 60);
});
