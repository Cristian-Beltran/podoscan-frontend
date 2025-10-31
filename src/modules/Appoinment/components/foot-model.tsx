"use client";

import { Suspense, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Canvas, type ThreeElements } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Grid } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Ruta/URL a .glb/.gltf. Si no pasas nada, se usa el placeholder. */
  modelUrl?: string;
  /** Futuro: imagen plantar para texturizar la base. */
  plantarImageUrl?: string;
};

function FootPlaceholder(props: ThreeElements["group"]) {
  const skin = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d9b7a5",
        roughness: 0.7,
        metalness: 0.0,
      }),
    [],
  );

  return (
    <group {...props} rotation={[0, Math.PI / 2.5, 0]} position={[0, 0.1, 0]}>
      <mesh castShadow receiveShadow material={skin}>
        <capsuleGeometry args={[0.55, 0.9, 8, 16]} />
      </mesh>
      <mesh
        position={[-0.65, -0.05, 0]}
        castShadow
        receiveShadow
        material={skin}
      >
        <capsuleGeometry args={[0.38, 0.2, 8, 16]} />
      </mesh>
      <mesh
        position={[0.55, -0.05, 0]}
        castShadow
        receiveShadow
        material={skin}
      >
        <capsuleGeometry args={[0.45, 0.35, 8, 16]} />
      </mesh>
      {[...Array(5)].map((_, i) => (
        <mesh
          key={i}
          position={[0.9, -0.08, (i - 2) * 0.18]}
          scale={[0.22 - i * 0.02, 0.22 - i * 0.02, 0.22 - i * 0.02]}
          castShadow
          receiveShadow
          material={skin}
        >
          <sphereGeometry args={[0.35, 16, 16]} />
        </mesh>
      ))}
    </group>
  );
}

function FootGLTF({ url }: { url: string }) {
  // Hook SIEMPRE se llama al renderizar este componente
  const gltf = useGLTF(url) as unknown as GLTF;
  return (
    <group position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
      <primitive object={gltf.scene as THREE.Object3D} castShadow />
    </group>
  );
}

export default function FootPreviewModal({ isOpen, onClose, modelUrl }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Vista 3D del pie</DialogTitle>
        </DialogHeader>

        <div className="h-[520px] w-full">
          <Canvas shadows camera={{ position: [2.2, 1.2, 2.2], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[3, 4, 2]}
              intensity={1.0}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />

            <Stage
              intensity={0.6}
              environment="city"
              adjustCamera={false}
              shadows="contact"
            >
              <Suspense fallback={null}>
                {modelUrl ? <FootGLTF url={modelUrl} /> : <FootPlaceholder />}
              </Suspense>
            </Stage>

            <Grid
              args={[10, 10]}
              sectionColor="#999"
              position={[0, -0.5, 0]}
              infiniteGrid
              cellSize={0.5}
              cellThickness={0.6}
              sectionThickness={1}
              fadeDistance={25}
              fadeStrength={2}
            />

            <OrbitControls
              enableDamping
              dampingFactor={0.08}
              minDistance={1.2}
              maxDistance={5}
              target={[0, 0.15, 0]}
              maxPolarAngle={Math.PI - 0.05} // antes ~0.49π; ahora casi 180°
            />
          </Canvas>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Preload opcional si vas a servir un modelo por defecto:
useGLTF.preload?.("foot.glb");
