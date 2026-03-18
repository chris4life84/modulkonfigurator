import { useMemo } from 'react';
import * as THREE from 'three';
import { createRoofTexture } from './textures/createRoofTexture';

const ROOF_THICKNESS = 0.10;
const OVERHANG = 0;
const FASCIA_HEIGHT = 0.03;
const FASCIA_DEPTH = 0.015;

// Skylight defaults & limits
export const SKYLIGHT_DEFAULT_W = 0.8;  // 0.8m default width
export const SKYLIGHT_DEFAULT_D = 0.6;  // 0.6m default depth
export const SKYLIGHT_MIN = 0.4;        // minimum dimension
export const SKYLIGHT_MAX_W = 2.0;      // maximum width
export const SKYLIGHT_MAX_D = 1.5;      // maximum depth
const SKYLIGHT_FRAME = 0.035;
const GLASS_THICKNESS = 0.012;

interface RoofPanelProps {
  moduleWidth: number;
  moduleDepth: number;
  roofY: number;
  overhangFront?: number;
  overhangBack?: number;
  overhangLeft?: number;
  overhangRight?: number;
  hasSkylight?: boolean;
  skylightWidth?: number;
  skylightDepth?: number;
}

export function RoofPanel({
  moduleWidth, moduleDepth, roofY,
  overhangFront = OVERHANG, overhangBack = OVERHANG,
  overhangLeft = OVERHANG, overhangRight = OVERHANG,
  hasSkylight = false,
  skylightWidth = SKYLIGHT_DEFAULT_W,
  skylightDepth = SKYLIGHT_DEFAULT_D,
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

  const offsetX = (overhangRight - overhangLeft) / 2;
  const offsetZ = (overhangFront - overhangBack) / 2;

  const halfW = moduleWidth / 2;
  const halfD = moduleDepth / 2;

  // Clamp skylight to fit within the module (leave 0.15m margin each side)
  const slW = Math.min(skylightWidth, moduleWidth - 0.3);
  const slD = Math.min(skylightDepth, moduleDepth - 0.3);

  return (
    <group position={[0, roofY, 0]}>
      {/* Main roof slab – with or without skylight cutout */}
      {!hasSkylight ? (
        <mesh position={[offsetX, ROOF_THICKNESS / 2, offsetZ]} castShadow receiveShadow>
          <boxGeometry args={[totalWidth, ROOF_THICKNESS, totalDepth]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.9}
            metalness={0.05}
            color="#555555"
          />
        </mesh>
      ) : (
        <RoofWithCutout
          totalWidth={totalWidth}
          totalDepth={totalDepth}
          offsetX={offsetX}
          offsetZ={offsetZ}
          skylightW={slW}
          skylightD={slD}
          texture={texture}
        />
      )}

      {/* Skylight glass + frame */}
      {hasSkylight && (
        <group position={[0, 0, 0]}>
          {/* Glass panel – flush with roof top surface */}
          <mesh position={[0, ROOF_THICKNESS / 2, 0]}>
            <boxGeometry args={[slW - SKYLIGHT_FRAME * 2, GLASS_THICKNESS, slD - SKYLIGHT_FRAME * 2]} />
            <meshPhysicalMaterial
              transmission={0.92}
              roughness={0.02}
              ior={1.5}
              thickness={0.5}
              opacity={0.3}
              transparent
              color="#C8E4FF"
              envMapIntensity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Frame – 4 bars around the glass */}
          {/* Front frame bar (+Z) */}
          <mesh position={[0, ROOF_THICKNESS / 2, slD / 2 - SKYLIGHT_FRAME / 2]}>
            <boxGeometry args={[slW, ROOF_THICKNESS + 0.005, SKYLIGHT_FRAME]} />
            <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
          </mesh>
          {/* Back frame bar (-Z) */}
          <mesh position={[0, ROOF_THICKNESS / 2, -slD / 2 + SKYLIGHT_FRAME / 2]}>
            <boxGeometry args={[slW, ROOF_THICKNESS + 0.005, SKYLIGHT_FRAME]} />
            <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
          </mesh>
          {/* Left frame bar (-X) */}
          <mesh position={[-slW / 2 + SKYLIGHT_FRAME / 2, ROOF_THICKNESS / 2, 0]}>
            <boxGeometry args={[SKYLIGHT_FRAME, ROOF_THICKNESS + 0.005, slD - SKYLIGHT_FRAME * 2]} />
            <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
          </mesh>
          {/* Right frame bar (+X) */}
          <mesh position={[slW / 2 - SKYLIGHT_FRAME / 2, ROOF_THICKNESS / 2, 0]}>
            <boxGeometry args={[SKYLIGHT_FRAME, ROOF_THICKNESS + 0.005, slD - SKYLIGHT_FRAME * 2]} />
            <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
          </mesh>
        </group>
      )}

      {/* Fascia strips on all 4 edges */}
      <mesh position={[offsetX, -FASCIA_HEIGHT / 2, halfD + overhangFront]}>
        <boxGeometry args={[totalWidth - FASCIA_DEPTH * 2, FASCIA_HEIGHT + ROOF_THICKNESS, FASCIA_DEPTH]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[offsetX, -FASCIA_HEIGHT / 2, -(halfD + overhangBack)]}>
        <boxGeometry args={[totalWidth - FASCIA_DEPTH * 2, FASCIA_HEIGHT + ROOF_THICKNESS, FASCIA_DEPTH]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[-(halfW + overhangLeft), -FASCIA_HEIGHT / 2, offsetZ]}>
        <boxGeometry args={[FASCIA_DEPTH, FASCIA_HEIGHT + ROOF_THICKNESS, totalDepth]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[halfW + overhangRight, -FASCIA_HEIGHT / 2, offsetZ]}>
        <boxGeometry args={[FASCIA_DEPTH, FASCIA_HEIGHT + ROOF_THICKNESS, totalDepth]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  );
}

/**
 * Roof slab with a rectangular cutout for the skylight.
 * 4 segments around the opening: front/back span full width, left/right fill the gap.
 *
 * Coordinate system: skylight centered at module origin (0,0).
 */
function RoofWithCutout({
  totalWidth, totalDepth, offsetX, offsetZ,
  skylightW, skylightD, texture,
}: {
  totalWidth: number;
  totalDepth: number;
  offsetX: number;
  offsetZ: number;
  skylightW: number;
  skylightD: number;
  texture: THREE.Texture;
}) {
  const y = ROOF_THICKNESS / 2;
  const halfSW = skylightW / 2;
  const halfSD = skylightD / 2;

  // Roof edges in module-centered coords
  const roofFront = offsetZ + totalDepth / 2;   // +Z edge
  const roofBack = offsetZ - totalDepth / 2;    // -Z edge
  const roofLeft = offsetX - totalWidth / 2;    // -X edge
  const roofRight = offsetX + totalWidth / 2;   // +X edge

  // Segment depths/widths (distance from skylight edge to roof edge)
  const frontD = roofFront - halfSD;            // +Z side
  const backD = -halfSD - roofBack;             // -Z side (fixed sign)
  const leftW = -halfSW - roofLeft;             // -X side (fixed sign)
  const rightW = roofRight - halfSW;            // +X side

  const roofMat = {
    map: texture,
    roughness: 0.9,
    metalness: 0.05,
    color: '#555555',
  };

  return (
    <>
      {/* Front segment (+Z side, full width) */}
      {frontD > 0.01 && (
        <mesh position={[offsetX, y, halfSD + frontD / 2]} castShadow receiveShadow>
          <boxGeometry args={[totalWidth, ROOF_THICKNESS, frontD]} />
          <meshStandardMaterial {...roofMat} />
        </mesh>
      )}

      {/* Back segment (-Z side, full width) */}
      {backD > 0.01 && (
        <mesh position={[offsetX, y, -halfSD - backD / 2]} castShadow receiveShadow>
          <boxGeometry args={[totalWidth, ROOF_THICKNESS, backD]} />
          <meshStandardMaterial {...roofMat} />
        </mesh>
      )}

      {/* Left segment (-X side, spans skylight depth only) */}
      {leftW > 0.01 && (
        <mesh position={[-halfSW - leftW / 2, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[leftW, ROOF_THICKNESS, skylightD]} />
          <meshStandardMaterial {...roofMat} />
        </mesh>
      )}

      {/* Right segment (+X side, spans skylight depth only) */}
      {rightW > 0.01 && (
        <mesh position={[halfSW + rightW / 2, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[rightW, ROOF_THICKNESS, skylightD]} />
          <meshStandardMaterial {...roofMat} />
        </mesh>
      )}
    </>
  );
}
