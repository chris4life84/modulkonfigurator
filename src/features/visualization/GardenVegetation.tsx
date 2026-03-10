import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { getBoundingBox } from '../../utils/grid';

interface GardenVegetationProps {
  modules: PlacedModule[];
}

/** Seeded pseudo-random for deterministic tree placement */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface TreeData {
  x: number;
  z: number;
  scale: number;
  rotation: number;
  model: 'deciduous' | 'fir';
}

const DECIDUOUS_MODEL = '/models/trees/tree_small_02_opt.glb';
const FIR_MODEL = '/models/trees/fir_sapling_medium.glb';

/**
 * Mixed realistic trees (Polyhaven) placed around the building.
 * Deciduous trees (tree_small_02) and fir saplings (fir_sapling_medium)
 * are randomly distributed for a natural garden look.
 */
export function GardenVegetation({ modules }: GardenVegetationProps) {
  const trees = useMemo(() => {
    const rand = seededRandom(42);
    const bbox = getBoundingBox(modules);
    const cx = ((bbox.minX + bbox.maxX) / 2) * GRID_CELL_SIZE;
    const cz = ((bbox.minY + bbox.maxY) / 2) * GRID_CELL_SIZE;
    const buildingRadius = Math.max(bbox.widthM, bbox.heightM) / 2 + 1.5;

    const treeList: TreeData[] = [];
    const treeCount = 10 + Math.floor(rand() * 4); // 10-13 trees

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (rand() - 0.5) * 0.5;
      const minDist = buildingRadius + 5;
      const maxDist = buildingRadius + 22;
      const dist = minDist + rand() * (maxDist - minDist);

      // ~40% fir, 60% deciduous
      const isFir = rand() < 0.4;

      treeList.push({
        x: cx + Math.cos(angle) * dist,
        z: cz + Math.sin(angle) * dist,
        scale: isFir ? (0.8 + rand() * 0.4) : (0.6 + rand() * 0.4),
        rotation: rand() * Math.PI * 2,
        model: isFir ? 'fir' : 'deciduous',
      });
    }

    return treeList;
  }, [modules]);

  return (
    <group>
      {trees.map((t, i) => (
        <TreeInstance key={`tree-${i}`} data={t} />
      ))}
    </group>
  );
}

/** Single tree instance using the appropriate glTF model */
function TreeInstance({ data }: { data: TreeData }) {
  const modelPath = data.model === 'fir' ? FIR_MODEL : DECIDUOUS_MODEL;
  const { scene } = useGLTF(modelPath);
  const ref = useRef<THREE.Group>(null);

  // Clone the scene so each instance has independent transforms
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Enable shadows on all meshes
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Fix alpha for leaf/needle materials
        if (child.material instanceof THREE.MeshStandardMaterial) {
          if (child.material.alphaMap || child.material.transparent) {
            child.material.alphaTest = 0.5;
            child.material.side = THREE.DoubleSide;
          }
        }
      }
    });
    return clone;
  }, [scene]);

  return (
    <group
      ref={ref}
      position={[data.x, 0, data.z]}
      rotation={[0, data.rotation, 0]}
      scale={data.scale}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload both tree models
useGLTF.preload(DECIDUOUS_MODEL);
useGLTF.preload(FIR_MODEL);
