import { useMemo } from 'react';
import * as THREE from 'three';
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
  trunkH: number;
  canopyType: 'cone' | 'sphere';
  canopyColor: string;
  trunkColor: string;
  rotation: number;
}

/**
 * Dezente Low-Poly Bäume um das Gebäude herum.
 * Nur Tannen (cone) und Laubbäume (sphere), keine Büsche.
 * Wenige Bäume, weiter entfernt — Fokus bleibt auf dem Haus.
 */
export function GardenVegetation({ modules }: GardenVegetationProps) {
  const trees = useMemo(() => {
    const rand = seededRandom(42);
    const bbox = getBoundingBox(modules);
    const cx = ((bbox.minX + bbox.maxX) / 2) * GRID_CELL_SIZE;
    const cz = ((bbox.minY + bbox.maxY) / 2) * GRID_CELL_SIZE;
    const buildingRadius = Math.max(bbox.widthM, bbox.heightM) / 2 + 1.5;

    const canopyColors = ['#4A7A32', '#3D6B28', '#5B8C3E', '#3A6025'];
    const trunkColors = ['#8B6F47', '#7A5E3A', '#9B7F57'];

    const treeList: TreeData[] = [];
    const treeCount = 8 + Math.floor(rand() * 4); // 8-11 trees

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (rand() - 0.5) * 0.5;
      const minDist = buildingRadius + 5;
      const maxDist = buildingRadius + 22;
      const dist = minDist + rand() * (maxDist - minDist);

      treeList.push({
        x: cx + Math.cos(angle) * dist,
        z: cz + Math.sin(angle) * dist,
        scale: 0.8 + rand() * 0.5,
        trunkH: 1.0 + rand() * 0.8,
        canopyType: rand() > 0.5 ? 'cone' : 'sphere',
        canopyColor: canopyColors[Math.floor(rand() * canopyColors.length)],
        trunkColor: trunkColors[Math.floor(rand() * trunkColors.length)],
        rotation: rand() * Math.PI * 2,
      });
    }

    return treeList;
  }, [modules]);

  return (
    <group>
      {trees.map((t, i) => (
        <LowPolyTree key={`tree-${i}`} data={t} />
      ))}
    </group>
  );
}

// Shared geometries (created once, reused)
const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 1, 6);
const coneCanopyGeo = new THREE.ConeGeometry(1, 2.2, 7);
const sphereCanopyGeo = new THREE.SphereGeometry(1, 7, 5);

function LowPolyTree({ data }: { data: TreeData }) {
  const { x, z, scale, trunkH, canopyType, canopyColor, trunkColor, rotation } = data;
  const canopyY = trunkH * scale + 0.6 * scale;

  const canopyGeometry = canopyType === 'cone' ? coneCanopyGeo : sphereCanopyGeo;
  const canopyScaleY = canopyType === 'cone' ? 1.1 : 0.85;

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {/* Trunk */}
      <mesh
        geometry={trunkGeo}
        position={[0, (trunkH * scale) / 2, 0]}
        scale={[scale, trunkH * scale, scale]}
        castShadow
      >
        <meshStandardMaterial color={trunkColor} roughness={0.9} metalness={0} />
      </mesh>

      {/* Canopy */}
      <mesh
        geometry={canopyGeometry}
        position={[0, canopyY, 0]}
        scale={[scale * 0.9, scale * canopyScaleY, scale * 0.9]}
        castShadow
      >
        <meshStandardMaterial
          color={canopyColor}
          roughness={0.85}
          metalness={0}
          flatShading
        />
      </mesh>
    </group>
  );
}
