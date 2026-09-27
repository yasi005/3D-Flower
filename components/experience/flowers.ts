import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { MODEL_URLS } from "./config";

export type FlowerData = {
  /** the original GLB scene, with its own materials and textures */
  scene: THREE.Object3D;
  /** maps the scene into a centered box of FIT_SIZE: scale * (p + offset) */
  offset: THREE.Vector3;
  scale: number;
};

/** Target size of the largest bounding-box side, in world units. */
const FIT_SIZE = 2.8;

let cache: FlowerData[] | null = null;

function measure(scene: THREE.Object3D): FlowerData {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene, true);
  const size = box.getSize(new THREE.Vector3());
  return {
    scene,
    offset: box.getCenter(new THREE.Vector3()).negate(),
    scale: FIT_SIZE / Math.max(size.x, size.y, size.z),
  };
}

/**
 * Bloom deformation, applied in world space so it works on merged meshes with
 * no per-petal rig. As uBloom goes 1 → 0 every vertex folds up and in around
 * the flower's centre, winds into a slight spiral and shrinks: the open flower
 * closes into a bud. Outer petals lead the opening, inner ones follow.
 */
const BLOOM_GLSL = /* glsl */ `
uniform float uBloom;
const float BLOOM_RADIUS = 0.9;  // open flower radius in world units
const float BLOOM_STAGGER = 0.4; // how far inner petals lag the outer ones
const float BLOOM_FOLD = 1.25;   // radians petals tilt up when closed
const float BLOOM_TWIST = 1.1;   // radians of spiral at the rim when closed
vec3 bloomWarp(vec3 p) {
  float r = length(p.xz);
  float rn = clamp(r / BLOOM_RADIUS, 0.0, 1.0);
  float q = clamp((uBloom - BLOOM_STAGGER * (1.0 - rn)) / (1.0 - BLOOM_STAGGER), 0.0, 1.0);
  float closed = 1.0 - q * q * (3.0 - 2.0 * q);
  if (closed < 1e-4) return p;
  float tw = closed * BLOOM_TWIST * rn;
  vec2 dir = r > 1e-5 ? mat2(cos(tw), sin(tw), -sin(tw), cos(tw)) * (p.xz / r) : vec2(0.0);
  // cup fold: lift and pull in by radial distance only, so tall parts near the
  // centre (stamens) stay upright instead of swinging out over the petals
  float th = closed * BLOOM_FOLD;
  float rr = r * cos(th);
  float hh = p.y + r * sin(th);
  float shrink = mix(1.0, 0.45, closed);
  return vec3(dir.x * rr, hh, dir.y * rr) * shrink;
}
`;

const BLOOM_PROJECT = /* glsl */ `
vec4 bloomPos = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  bloomPos = batchingMatrix * bloomPos;
#endif
#ifdef USE_INSTANCING
  bloomPos = instanceMatrix * bloomPos;
#endif
bloomPos = modelMatrix * bloomPos;
bloomPos.xyz = bloomWarp( bloomPos.xyz );
vec4 mvPosition = viewMatrix * bloomPos;
gl_Position = projectionMatrix * mvPosition;
`;

function addBloom(m: THREE.Material, uniform: { value: number }) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBloom = uniform;
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", `${BLOOM_GLSL}
void main() {`)
      .replace("#include <project_vertex>", BLOOM_PROJECT);
  };
  m.customProgramCacheKey = () => "bloom";
}

/**
 * Copy of a model whose materials can be faded and bloomed without touching
 * the original. Drive the bloom with `setBloom`.
 */
export function fadeableClone(scene: THREE.Object3D) {
  const clone = scene.clone(true);
  const bloom = { value: 1 };
  clone.userData.bloom = bloom;
  clone.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const fade = (m: THREE.Material) => {
      const c = m.clone();
      c.userData.baseOpacity = c.opacity;
      c.userData.baseTransparent = c.transparent;
      addBloom(c, bloom);
      return c;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(fade) : fade(mesh.material);
  });
  return clone;
}

/** 0 = closed bud, 1 = open, for a fadeableClone. */
export function setBloom(clone: THREE.Object3D, value: number) {
  clone.userData.bloom.value = value;
}

/** Sets the opacity of a fadeableClone (1 = exactly as authored). */
export function setOpacity(root: THREE.Object3D, opacity: number) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const m of ([] as THREE.Material[]).concat(mesh.material)) {
      m.opacity = m.userData.baseOpacity * opacity;
      m.transparent = m.userData.baseTransparent || opacity < 0.999;
      m.depthWrite = !m.transparent || opacity > 0.6;
    }
  });
}

/**
 * Loads every flower (suspends) and returns them with their fit transforms.
 * The array is cached so it is stable across renders and canvases.
 */
export function useFlowers(): FlowerData[] {
  const gltfs = useGLTF(MODEL_URLS as unknown as string[]);
  cache ??= gltfs.map((g) => measure(g.scene));
  return cache;
}

MODEL_URLS.forEach((url) => useGLTF.preload(url));
