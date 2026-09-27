"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import type { PanelMode } from "./config";
import { anim, spin } from "./state";
import { fadeableClone, setBloom, setOpacity, useFlowers } from "./flowers";
import { MODEL_SCALE } from "./Scene";

/** Where the panel camera sits for each mode (flowers are at MODEL_SCALE). */
const VIEWS: Record<PanelMode, THREE.Vector3> = {
  side: new THREE.Vector3(0, 0.16, 2.6),
  detail: new THREE.Vector3(0, 1.5, 1.18),
};

/**
 * Mirrors the main stage: opacity, bloom, spin. Only the camera differs.
 * Only the visible specimen is updated — side cards were cloning all four.
 */
function Specimen({ mode }: { mode: PanelMode }) {
  const flowers = useFlowers();
  const group = useRef<THREE.Group>(null);
  const roots = useRef<(THREE.Group | null)[]>([]);
  const scenes = useMemo(() => flowers.map((f) => fadeableClone(f.scene)), [flowers]);
  const look = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(({ camera }) => {
    group.current!.rotation.y = spin.angle + anim.rotY;
    for (let i = 0; i < flowers.length; i++) {
      const opacity = anim.opacity[i];
      const root = roots.current[i];
      if (!root) continue;
      const visible = opacity > 0.005;
      root.visible = visible;
      if (!visible) continue;
      root.scale.setScalar(flowers[i].scale * (0.92 + 0.08 * opacity));
      setOpacity(scenes[i], opacity);
      setBloom(scenes[i], anim.bloom[i]);
    }
    camera.position.lerp(VIEWS[mode], 0.08);
    camera.lookAt(look);
  });

  return (
    <group ref={group} scale={MODEL_SCALE}>
      {flowers.map((f, i) => (
        <group
          key={i}
          ref={(el) => {
            roots.current[i] = el;
          }}
          scale={f.scale}
          visible={false}
        >
          <primitive object={scenes[i]} position={f.offset} />
        </group>
      ))}
    </group>
  );
}

export default function HoloViewport({ mode }: { mode: PanelMode }) {
  return (
    <Canvas
      dpr={1}
      frameloop="always"
      camera={{ position: VIEWS[mode].toArray(), fov: 40 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power", stencil: false, depth: true }}
      performance={{ min: 0.5 }}
    >
      <hemisphereLight args={["#f4f4f6", "#141419", 1]} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <Suspense fallback={null}>
        <Specimen mode={mode} />
      </Suspense>
    </Canvas>
  );
}
