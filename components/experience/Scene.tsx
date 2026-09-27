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
const LENS_COMPENSATION =
  Math.tan(THREE.MathUtils.degToRad(35 / 2)) / Math.tan(THREE.MathUtils.degToRad(TOP_DOWN_FOV / 2));

export const MODEL_SCALE = 0.72;

function Specimen({ data, index }: { data: FlowerData; index: number }) {
  const root = useRef<THREE.Group>(null);
  const scene = useMemo(() => fadeableClone(data.scene), [data]);

  useFrame(() => {
    const opacity = anim.opacity[index];
    const visible = opacity > 0.005;
    root.current!.visible = visible;
    if (!visible) return;
    root.current!.scale.setScalar(data.scale * (0.92 + 0.08 * opacity));
    setOpacity(scene, opacity);
    setBloom(scene, anim.bloom[index]);
  });

  return (
    <group ref={root} scale={data.scale}>
      <primitive object={scene} position={data.offset} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#f4f1ea", "#171614", 0.9]} />
      <directionalLight position={[1.5, 6, 1]} intensity={2} />
      <directionalLight position={[-5, 0.6, -3]} intensity={0.7} color="#dbe3ff" />
      <directionalLight position={[5, 0.4, 3]} intensity={0.55} color="#f3e2c4" />
      <Environment resolution={64} environmentIntensity={0.5} frames={1}>
        <Lightformer intensity={1.8} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        <Lightformer intensity={0.65} color="#e3e0ff" position={[-4, 1, 0]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
        <Lightformer intensity={0.65} color="#fff1dc" position={[4, 1, 0]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
      </Environment>
    </>
  );
}

function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        resolutionScale={0.5}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.15}
        intensity={0.22}
        radius={0.28}
        levels={4}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(TOP_DOWN_FOV / 2));
const FLOWER_SPAN = 2.8 * MODEL_SCALE;

function CameraRig() {
  useFrame(({ camera, size }) => {
    const h = size.height;
    const measured = layout.right > layout.left && layout.bottom > layout.top;
    let px = (FLOWER_SPAN * h) / (2 * anim.camZ * LENS_COMPENSATION * TAN_HALF_FOV);
    let cy = h / 2;
    if (measured) {
      if (layout.wide) {
        px = Math.min(px, 0.72 * (layout.right - layout.left), 0.78 * (layout.bottom - layout.top));
      } else {
        px = Math.min(px, 0.92 * (layout.right - layout.left), 0.9 * (layout.bottom - layout.top));
        cy = (layout.top + layout.bottom) / 2;
      }
    }
    const dist = (FLOWER_SPAN * h) / (2 * px * TAN_HALF_FOV);
    const panZ = -(cy - h / 2) * ((2 * dist * TAN_HALF_FOV) / h);
    camera.position.set(0, dist, panZ);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, panZ);
  });
  return null;
}

function Flower() {
  const group = useRef<THREE.Group>(null);
  const flowers = useFlowers();
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    spin.boost *= Math.exp(-SPIN_FRICTION * dt);
    const target = anim.spin + spin.boost;
    spin.velocity = THREE.MathUtils.lerp(spin.velocity, target, 1 - Math.exp(-SPIN_INERTIA * dt));
    spin.angle += spin.velocity * dt;
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
      <color attach="background" args={["#171614"]} />
      <Lights />
      <CameraRig />
      <Flower />
      <ContactShadows
        position={[0, -1.05, 0]}
        scale={4}
        resolution={128}
        blur={2.2}
        far={2.2}
        opacity={0.35}
        color="#050508"
        frames={1}
      />
      <Effects />
    </>
  );
}
