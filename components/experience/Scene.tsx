"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { anim, layout, spin, SPIN_FRICTION, SPIN_INERTIA } from "./state";
import { fadeableClone, setBloom, setOpacity, useFlowers, type FlowerData } from "./flowers";

/** Narrow lens so the overhead view reads almost orthographic. */
export const TOP_DOWN_FOV = 20;
// the chapter camZ values were tuned for a 35° lens; scale them for the narrow one
const LENS_COMPENSATION =
  Math.tan(THREE.MathUtils.degToRad(35 / 2)) / Math.tan(THREE.MathUtils.degToRad(TOP_DOWN_FOV / 2));

/** Keeps the flower dominant in the open middle between the side plates. */
// exported: the side cards use it too, so the world-space bloom warp folds
// their flowers exactly like the main one
export const MODEL_SCALE = 0.72;

/** One of your GLBs, exactly as authored, bloomed open / closed and faded on chapter changes. */
function Specimen({ data, index }: { data: FlowerData; index: number }) {
  const root = useRef<THREE.Group>(null);
  const scene = useMemo(() => fadeableClone(data.scene), [data]);

  useFrame(() => {
    const opacity = anim.opacity[index];
    root.current!.visible = opacity > 0.005;
    // a slight grow as it fades in
    root.current!.scale.setScalar(data.scale * (0.92 + 0.08 * opacity));
    setOpacity(root.current!, opacity);
    setBloom(scene, anim.bloom[index]);
  });

  return (
    <group ref={root} scale={data.scale}>
      <primitive object={scene} position={data.offset} />
    </group>
  );
}

/**
 * Neutral studio key from above, so the models keep their own colours, plus
 * two faint low rims (cool platinum / warm champagne) that trace the petal
 * edges with a soft iridescent sheen.
 */
function Lights() {
  return (
    <>
      <hemisphereLight args={["#f4f1ea", "#171614", 0.9]} />
      <directionalLight position={[1.5, 6, 1]} intensity={2} />
      <directionalLight position={[-5, 0.6, -3]} intensity={0.9} color="#dbe3ff" />
      <directionalLight position={[5, 0.4, 3]} intensity={0.7} color="#f3e2c4" />
      {/* reflections for the PBR materials, built locally (no HDR download);
          the side panels are tinted a whisper apart for an iridescent sheen */}
      <Environment resolution={256} environmentIntensity={0.55}>
        <Lightformer intensity={1.8} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer intensity={0.7} color="#e3e0ff" position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer intensity={0.7} color="#fff1dc" position={[4, 1, 0]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer intensity={0.4} color="#dff6f3" position={[0, 1, 4]} scale={[4, 2, 1]} />
      </Environment>
    </>
  );
}

/**
 * Micro-glow: a high threshold means only the brightest specular glints on the
 * petal tips bloom, with a tight radius so nothing hazes over.
 */
function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.88} luminanceSmoothing={0.12} intensity={0.28} radius={0.35} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(TOP_DOWN_FOV / 2));
/** world-space span of a fitted flower (FIT_SIZE in flowers.ts × MODEL_SCALE) */
const FLOWER_SPAN = 2.8 * MODEL_SCALE;

/**
 * Bird's-eye camera: sits above the flower and looks straight down into the
 * open petals. No tilt; chapters set the zoom (camZ), the spin turns the
 * flower in place, and the framing adapts to the layout measured from the DOM.
 */
function CameraRig() {
  useFrame(({ camera, size }) => {
    const h = size.height;
    const measured = layout.right > layout.left && layout.bottom > layout.top;
    // the chapter's framing, as on-screen flower diameter in px
    let px = (FLOWER_SPAN * h) / (2 * anim.camZ * LENS_COMPENSATION * TAN_HALF_FOV);
    let cy = h / 2;
    if (measured) {
      // desktop: leave air around the specimen so the plates stay balanced.
      // phone: use more of the vertical stage between copy and cards.
      if (layout.wide) {
        px = Math.min(px, 0.72 * (layout.right - layout.left), 0.78 * (layout.bottom - layout.top));
      } else {
        px = Math.min(px, 0.92 * (layout.right - layout.left), 0.9 * (layout.bottom - layout.top));
        cy = (layout.top + layout.bottom) / 2;
      }
    }
    const dist = (FLOWER_SPAN * h) / (2 * px * TAN_HALF_FOV);
    // flat pan (never a tilt): CSS px → world units at the flower's depth.
    // Screen up is -Z, so the camera moves opposite to where the flower goes.
    const panZ = -(cy - h / 2) * ((2 * dist * TAN_HALF_FOV) / h);
    camera.position.set(0, dist, panZ);
    // looking along -Y, so "up" on screen must be a horizontal axis
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, panZ);
  });
  return null;
}

function Flower() {
  const group = useRef<THREE.Group>(null);
  const flowers = useFlowers();
  useFrame((_, delta) => {
    // cap dt so a backgrounded tab doesn't come back with a huge jump
    const dt = Math.min(delta, 1 / 20);
    // friction bleeds off the scroll drive, then a frame-rate independent lerp
    // lets the heavy flower chase idle + drive: it winds up, peaks well below
    // the drive, and glides back down to the chapter's calm idle spin
    spin.boost *= Math.exp(-SPIN_FRICTION * dt);
    const target = anim.spin + spin.boost;
    spin.velocity = THREE.MathUtils.lerp(spin.velocity, target, 1 - Math.exp(-SPIN_INERTIA * dt));
    spin.angle += spin.velocity * dt;
    // spin only around the vertical axis so the overhead view never tilts
    group.current!.rotation.y = spin.angle + anim.rotY;
  });
  return (
    <group ref={group} scale={MODEL_SCALE}>
      {flowers.map((data, i) => (
        <Specimen key={i} data={data} index={i} />
      ))}
    </group>
  );
}

export default function Scene() {
  return (
    <>
      {/* must be clearly lighter than void — the composer covers the CSS layer */}
      <color attach="background" args={["#171614"]} />
      <Lights />
      <CameraRig />
      <Flower />
      <ContactShadows
        position={[0, -1.05, 0]}
        scale={4}
        resolution={512}
        blur={3.5}
        far={2.4}
        opacity={0.4}
        color="#050508"
      />
      <Effects />
    </>
  );
}
