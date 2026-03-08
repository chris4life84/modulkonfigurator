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
  /** Per-side overhang overrides (default: OVERHANG on all sides) */
  overhangFront?: number;
  overhangBack?: number;
  overhangLeft?: number;
  overhangRight?: number;
}

export function RoofPanel({
  moduleWidth, moduleDepth, roofY,
  overhangFront = OVERHANG, overhangBack = OVERHANG,
  overhangLeft = OVERHANG, overhangRight = OVERHANG,
}: RoofPanelProps) {
  const texture = useMemo(() => {
    const t = createRoofTexture();
    const clone = t.clone();
    clone.needsUpdate = true;
    clone.repeat.set(moduleWidth / 2, moduleDepth / 2);
    return clone;
  }, [moduleWidth, moduleDepth]);

  const totalWidth = moduleWidth + overhangLeft + overhangRight;
  const totalDepth = moduleDepth + overhangFront + overhangBack;

  // Asymmetric overhangs shift the roof center relative to the module center
  const offsetX = (overhangRight - overhangLeft) / 2;
  const offsetZ = (overhangFront - overhangBack) / 2;

  const halfW = moduleWidth / 2;
  const halfD = moduleDepth / 2;

  return (
    <group position={[0, roofY, 0]}>
      {/* Main roof slab */}
      <mesh position={[offsetX, ROOF_THICKNESS / 2, offsetZ]} castShadow receiveShadow>
        <boxGeometry args={[totalWidth, ROOF_THICKNESS, totalDepth]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.9}
          metalness={0.05}
          color="#555555"
        />
      </mesh>

      {/* Fascia strips on all 4 edges (darker trim) */}
      {/* Front fascia (+Z) */}
      <mesh position={[offsetX, -FASCIA_HEIGHT / 2, halfD + overhangFront]}>
        <boxGeometry args={[totalWidth, FASCIA_HEIGHT + ROOF_THICKNESS, 0.015]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Back fascia (-Z) */}
      <mesh position={[offsetX, -FASCIA_HEIGHT / 2, -(halfD + overhangBack)]}>
        <boxGeometry args={[totalWidth, FASCIA_HEIGHT + ROOF_THICKNESS, 0.015]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Left fascia (-X) */}
      <mesh position={[-(halfW + overhangLeft), -FASCIA_HEIGHT / 2, offsetZ]}>
        <boxGeometry args={[0.015, FASCIA_HEIGHT + ROOF_THICKNESS, totalDepth]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Right fascia (+X) */}
      <mesh position={[halfW + overhangRight, -FASCIA_HEIGHT / 2, offsetZ]}>
        <boxGeometry args={[0.015, FASCIA_HEIGHT + ROOF_THICKNESS, totalDepth]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  );
}
