import { useMemo } from 'react';
import * as THREE from 'three';
import { createRoofTexture } from './textures/createRoofTexture';

const OVERHANG = 0;

// Roof = U-profile frame (Dachrand) + recessed EPDM inner panel
// The U-profile frame IS the roof edge. The EPDM sits inside, lower.
const FRAME_H = 0.04;         // 4cm frame height — both outer and inner walls same height
const FRAME_CHANNEL = 0.035;  // 3.5cm channel width (gutter depth)
const FRAME_T = 0.003;        // 3mm aluminium wall/bottom thickness
const FRAME_COLOR = '#2A2A2A';

// Inner EPDM panel sits at the bottom of the channel
const EPDM_THICKNESS = 0.01;  // 1cm thin EPDM membrane

// For skylight and other calculations
const ROOF_THICKNESS = FRAME_H; // effective roof height for external references

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

  // Inner panel dimensions (inside the inner walls, no overlap)
  const innerW = totalWidth - FRAME_CHANNEL * 2 - FRAME_T * 2;
  const innerD = totalDepth - FRAME_CHANNEL * 2 - FRAME_T * 2;

  // Y reference: y=0 at roofY. Frame walls go from 0 to FRAME_H.
  // EPDM panel top flush with inner wall top (FRAME_H)
  const epdmY = FRAME_H - EPDM_THICKNESS / 2;

  return (
    <group position={[0, roofY, 0]}>

      {/* ── Part 1: Inner EPDM panel (recessed) ── */}
      {!hasSkylight ? (
        <mesh position={[offsetX, epdmY, offsetZ]} castShadow receiveShadow>
          <boxGeometry args={[innerW, EPDM_THICKNESS, innerD]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.9}
            metalness={0.05}
            color="#555555"
          />
        </mesh>
      ) : (
        <RoofWithCutout
          totalWidth={innerW}
          totalDepth={innerD}
          offsetX={offsetX}
          offsetZ={offsetZ}
          skylightW={slW}
          skylightD={slD}
          texture={texture}
        />
      )}

      {/* Skylight glass + frame (positioned on inner panel) */}
      {hasSkylight && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, epdmY, 0]}>
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
          {/* Frame bars */}
          {[
            { px: 0, pz: slD / 2 - SKYLIGHT_FRAME / 2, w: slW, d: SKYLIGHT_FRAME },
            { px: 0, pz: -slD / 2 + SKYLIGHT_FRAME / 2, w: slW, d: SKYLIGHT_FRAME },
            { px: -slW / 2 + SKYLIGHT_FRAME / 2, pz: 0, w: SKYLIGHT_FRAME, d: slD - SKYLIGHT_FRAME * 2 },
            { px: slW / 2 - SKYLIGHT_FRAME / 2, pz: 0, w: SKYLIGHT_FRAME, d: slD - SKYLIGHT_FRAME * 2 },
          ].map((bar, i) => (
            <mesh key={i} position={[bar.px, epdmY, bar.pz]}>
              <boxGeometry args={[bar.w, EPDM_THICKNESS + 0.005, bar.d]} />
              <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Part 2: U-Profile frame (4 sides, closed corners) ── */}
      {(() => {
        const mat = <meshStandardMaterial color={FRAME_COLOR} roughness={0.4} metalness={0.3} />;
        // All 4 sides use same height. Front/back = totalWidth, left/right = totalDepth.
        // Outer walls run the full length. Bottom plates and inner walls fit inside.
        const edgeF = halfD + overhangFront;
        const edgeB = halfD + overhangBack;
        const edgeL = halfW + overhangLeft;
        const edgeR = halfW + overhangRight;

        return (
          <>
            {/* ── Outer walls (4 sides, full length each, forming closed rectangle) ── */}
            {/* Front outer (+Z) */}
            <mesh position={[offsetX, FRAME_H / 2, edgeF]}>
              <boxGeometry args={[totalWidth + FRAME_T * 2, FRAME_H, FRAME_T]} />
              {mat}
            </mesh>
            {/* Back outer (-Z) */}
            <mesh position={[offsetX, FRAME_H / 2, -edgeB]}>
              <boxGeometry args={[totalWidth + FRAME_T * 2, FRAME_H, FRAME_T]} />
              {mat}
            </mesh>
            {/* Left outer (-X) */}
            <mesh position={[-edgeL, FRAME_H / 2, offsetZ]}>
              <boxGeometry args={[FRAME_T, FRAME_H, totalDepth + FRAME_T * 2]} />
              {mat}
            </mesh>
            {/* Right outer (+X) */}
            <mesh position={[edgeR, FRAME_H / 2, offsetZ]}>
              <boxGeometry args={[FRAME_T, FRAME_H, totalDepth + FRAME_T * 2]} />
              {mat}
            </mesh>

            {/* ── Bottom plates (4 sides) ── */}
            {/* Front bottom */}
            <mesh position={[offsetX, FRAME_T / 2, edgeF - FRAME_CHANNEL / 2]}>
              <boxGeometry args={[totalWidth, FRAME_T, FRAME_CHANNEL]} />
              {mat}
            </mesh>
            {/* Back bottom */}
            <mesh position={[offsetX, FRAME_T / 2, -(edgeB - FRAME_CHANNEL / 2)]}>
              <boxGeometry args={[totalWidth, FRAME_T, FRAME_CHANNEL]} />
              {mat}
            </mesh>
            {/* Left bottom */}
            <mesh position={[-(edgeL - FRAME_CHANNEL / 2), FRAME_T / 2, offsetZ]}>
              <boxGeometry args={[FRAME_CHANNEL, FRAME_T, totalDepth]} />
              {mat}
            </mesh>
            {/* Right bottom */}
            <mesh position={[edgeR - FRAME_CHANNEL / 2, FRAME_T / 2, offsetZ]}>
              <boxGeometry args={[FRAME_CHANNEL, FRAME_T, totalDepth]} />
              {mat}
            </mesh>

            {/* ── Inner walls (4 sides, fit inside the bottom plates) ── */}
            {/* Front inner */}
            <mesh position={[offsetX, FRAME_H / 2, edgeF - FRAME_CHANNEL]}>
              <boxGeometry args={[totalWidth - FRAME_CHANNEL * 2, FRAME_H, FRAME_T]} />
              {mat}
            </mesh>
            {/* Back inner */}
            <mesh position={[offsetX, FRAME_H / 2, -(edgeB - FRAME_CHANNEL)]}>
              <boxGeometry args={[totalWidth - FRAME_CHANNEL * 2, FRAME_H, FRAME_T]} />
              {mat}
            </mesh>
            {/* Left inner */}
            <mesh position={[-(edgeL - FRAME_CHANNEL), FRAME_H / 2, offsetZ]}>
              <boxGeometry args={[FRAME_T, FRAME_H, totalDepth - FRAME_CHANNEL * 2]} />
              {mat}
            </mesh>
            {/* Right inner */}
            <mesh position={[edgeR - FRAME_CHANNEL, FRAME_H / 2, offsetZ]}>
              <boxGeometry args={[FRAME_T, FRAME_H, totalDepth - FRAME_CHANNEL * 2]} />
              {mat}
            </mesh>

            {/* ── Corner bottom plates (4 corners, fill the gap) ── */}
            {[
              { x: edgeR - FRAME_CHANNEL / 2, z: edgeF - FRAME_CHANNEL / 2 },
              { x: -(edgeL - FRAME_CHANNEL / 2), z: edgeF - FRAME_CHANNEL / 2 },
              { x: edgeR - FRAME_CHANNEL / 2, z: -(edgeB - FRAME_CHANNEL / 2) },
              { x: -(edgeL - FRAME_CHANNEL / 2), z: -(edgeB - FRAME_CHANNEL / 2) },
            ].map((c, i) => (
              <mesh key={`corner-${i}`} position={[c.x, FRAME_T / 2, c.z]}>
                <boxGeometry args={[FRAME_CHANNEL, FRAME_T, FRAME_CHANNEL]} />
                {mat}
              </mesh>
            ))}
          </>
        );
      })()}
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
