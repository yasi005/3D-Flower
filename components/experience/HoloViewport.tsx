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
 * Mirrors the main stage exactly: same per-flower opacity crossfade, same
 * bud-to-bloom unfurl, same scroll-kicked rotation. Only the camera differs.
 */
function Specimen({ mode }: { mode: PanelMode }) {
  const flowers = useFlowers();
  const group = useRef<THREE.Group>(null);
  const roots = useRef<(THREE.Group | null)[]>([]);
  // each canvas needs its own copy of every scene graph
  const scenes = useMemo(() => flowers.map((f) => fadeableClone(f.scene)), [flowers]);

  useFrame(({ camera }) => {
    group.current!.rotation.y = spin.angle + anim.rotY;
    flowers.forEach((f, i) => {
      const root = roots.current[i]!;
      const opacity = anim.opacity[i];
      root.visible = opacity > 0.005;
      root.scale.setScalar(f.scale * (0.92 + 0.08 * opacity));
      setOpacity(root, opacity);
      setBloom(scenes[i], anim.bloom[i]);
    });
    camera.position.lerp(VIEWS[mode], 0.08);
    camera.lookAt(0, 0, 0);
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
      dpr={[1, 1.5]}
      camera={{ position: VIEWS[mode].toArray(), fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <hemisphereLight args={["#f4f4f6", "#141419", 1]} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <directionalLight position={[-4, 0.6, -2]} intensity={0.6} color="#dbe3ff" />
      <Suspense fallback={null}>
        <Specimen mode={mode} />
      </Suspense>
    </Canvas>
  );
}
