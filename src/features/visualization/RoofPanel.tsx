import { useMemo } from 'react';
import { createRoofTexture } from './textures/createRoofTexture';

const ROOF_THICKNESS = 0.10;
const OVERHANG = 0.10;
const FASCIA_HEIGHT = 0.03;

interface RoofPanelProps {
  /** Width of the module in meters */
  moduleWidth: number;
  /** Depth of the module in meters */
  moduleDepth: number;
  /** Height at which the roof sits */
  roofY: number;
}

export function RoofPanel({ moduleWidth, moduleDepth, roofY }: RoofPanelProps) {
  const texture = useMemo(() => {
    const t = createRoofTexture();
    const clone = t.clone();
    clone.needsUpdate = true;
    clone.repeat.set(moduleWidth / 2, moduleDepth / 2);
    return clone;
  }, [moduleWidth, moduleDepth]);

  const totalWidth = moduleWidth + OVERHANG * 2;
  const totalDepth = moduleDepth + OVERHANG * 2;

  return (
    <group position={[0, roofY, 0]}>
      {/* Main roof slab */}
      <mesh position={[0, ROOF_THICKNESS / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[totalWidth, ROOF_THICKNESS, totalDepth]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.9}
          metalness={0.05}
          color="#555555"
        />
      </mesh>

      {/* Fascia strips on all 4 edges (darker trim) */}
      {/* Front fascia */}
      <mesh position={[0, -FASCIA_HEIGHT / 2, totalDepth / 2]}>
        <boxGeometry args={[totalWidth, FASCIA_HEIGHT + ROOF_THICKNESS, 0.015]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Back fascia */}
      <mesh position={[0, -FASCIA_HEIGHT / 2, -totalDepth / 2]}>
        <boxGeometry args={[totalWidth, FASCIA_HEIGHT + ROOF_THICKNESS, 0.015]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Left fascia */}
      <mesh position={[-totalWidth / 2, -FASCIA_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.015, FASCIA_HEIGHT + ROOF_THICKNESS, totalDepth]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Right fascia */}
      <mesh position={[totalWidth / 2, -FASCIA_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.015, FASCIA_HEIGHT + ROOF_THICKNESS, totalDepth]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  );
}
