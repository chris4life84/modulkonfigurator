import { useMemo } from 'react';
import * as THREE from 'three';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { getBoundingBox } from '../../utils/grid';

interface GroundPlaneProps {
  size?: number;
  modules?: PlacedModule[];
}

/**
 * Ground plane with seamless grass texture + concrete foundation pad.
 * The procedural Sky provides the backdrop; fog blends grass edges
 * into the horizon naturally — no alpha fade needed.
 */
export function GroundPlane({ size = 100, modules = [] }: GroundPlaneProps) {
  // Load seamless grass texture (repeated across large plane)
  const grassTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/pbr/grass/diff_1k.jpg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 30); // ~3.3m per tile on 100m plane — natural grass density
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  return (
    <group>
      {/* Grass ground plane – extends to fog horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          map={grassTexture}
          roughness={0.92}
          metalness={0}
          side={THREE.DoubleSide}
          color="#90A868"
        />
      </mesh>

      {/* Concrete foundation pad under modules */}
      {modules.length > 0 && <FoundationPad modules={modules} />}
    </group>
  );
}

/** Concrete pad that sits under the module group */
function FoundationPad({ modules }: { modules: PlacedModule[] }) {
  const bbox = getBoundingBox(modules);
  const padding = 0.3; // Extra space around modules

  const width = bbox.widthM + padding * 2;
  const depth = bbox.heightM + padding * 2;
  const centerX = (bbox.minX * GRID_CELL_SIZE + bbox.maxX * GRID_CELL_SIZE) / 2;
  const centerZ = (bbox.minY * GRID_CELL_SIZE + bbox.maxY * GRID_CELL_SIZE) / 2;
  const height = 0.04;

  return (
    <mesh
      position={[centerX, height / 2 - 0.01, centerZ]}
      receiveShadow
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color="#B0ADA8"
        roughness={0.80}
        metalness={0.02}
      />
    </mesh>
  );
}
