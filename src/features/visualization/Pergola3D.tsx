import type { JSX } from 'react';
import { useState, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';

const SUPPORT_HEIGHT = 0.10; // Same as Module3D — aluminum supports under floor
const POST_W = 0.08; // Square post profile width (same as beam for harmony)
const BEAM_W = 0.08; // Main beam width
const BEAM_H = 0.12; // Main beam height
const SLAT_W = 0.04; // Roof slat width
const SLAT_H = 0.06; // Roof slat height
const ANCHOR_SIZE = 0.12; // Base plate size (slightly larger than post)
const INSET = 0.08; // Default inset from edge for posts/beams
const HOUSE_INSET = 0.01; // Small gap to house wall (overhang removed on pergola side)

// Target: pergola roof surface aligns with house roof top
// House roof top = OUTER_HEIGHT(2.5) + FRAME_H(0.04) = 2.54m
const HOUSE_ROOF_TOP = 2.54;

// Roof structure thickness by type (everything above post tops)
const ROOF_OFFSET: Record<string, number> = {
  lamellen: BEAM_H + SLAT_H, // 0.12 + 0.06 = 0.18
  glas: BEAM_H + SLAT_H + 0.012, // 0.18 + 0.012 = 0.192
  epdm: BEAM_H + SLAT_H + 0.006, // 0.18 + 0.006 = 0.186
};

// ── Shared materials (created once) ──────────────────────────────────

const aluMaterial = new THREE.MeshStandardMaterial({
  color: '#404040',
  roughness: 0.3,
  metalness: 0.8,
});

const anchorMaterial = new THREE.MeshStandardMaterial({
  color: '#C0C0C0',
  roughness: 0.3,
  metalness: 0.7,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#C8E4FF',
  transmission: 0.7,
  roughness: 0.05,
  metalness: 0,
  ior: 1.5,
  thickness: 0.5,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
});

const epdmMaterial = new THREE.MeshStandardMaterial({
  color: '#2A2A2A',
  roughness: 0.9,
  metalness: 0,
  side: THREE.DoubleSide,
});

// Markise (roll-down screen) fabric material
const markiseMaterial = new THREE.MeshStandardMaterial({
  color: '#8A8A8A',
  roughness: 0.85,
  metalness: 0,
  transparent: true,
  opacity: 0.7,
  side: THREE.DoubleSide,
});

// ── Shared geometries ────────────────────────────────────────────────

const anchorGeometry = new THREE.BoxGeometry(ANCHOR_SIZE, 0.005, ANCHOR_SIZE);

// ── Adjacent sides helper type ───────────────────────────────────────

interface AdjacentSides {
  front: boolean; // +Z side
  back: boolean; // -Z side
  left: boolean; // -X side
  right: boolean; // +X side
}

// ─────────────────────────────────────────────────────────────────────

interface Pergola3DProps {
  module: PlacedModule;
  allModules: PlacedModule[];
  color: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export function Pergola3D({ module: m, allModules, color, label, selected, onClick }: Pergola3DProps) {
  const [hovered, setHovered] = useState(false);

  const widthM = m.width * GRID_CELL_SIZE;
  const depthM = m.height * GRID_CELL_SIZE;

  // World position (center of module)
  const posX = m.gridX * GRID_CELL_SIZE + widthM / 2;
  const posZ = m.gridY * GRID_CELL_SIZE + depthM / 2;

  // Read options
  const roofType = (m.options.dachtyp as string) ?? 'lamellen';
  const anschluss = (m.options.anschluss as string) ?? 'wand';
  const isFreistehend = m.options.freistehend === true;

  // Auto-calculate post height so roof top matches house roof
  const postHeight = HOUSE_ROOF_TOP - (ROOF_OFFSET[roofType] ?? ROOF_OFFSET.lamellen);

  const halfW = widthM / 2;
  const halfD = depthM / 2;

  // ── Detect which sides face a house module ──
  const adjacentSides = useMemo<AdjacentSides>(() => {
    // Freistehend: no house adjacency at all
    if (isFreistehend) {
      return { front: false, back: false, left: false, right: false };
    }

    const sides: AdjacentSides = { front: false, back: false, left: false, right: false };

    // Build set of cells occupied by non-pergola (house) modules
    const houseCells = new Set<string>();
    for (const other of allModules) {
      if (other.id === m.id || other.type === 'pergola') continue;
      for (let dx = 0; dx < other.width; dx++) {
        for (let dy = 0; dy < other.height; dy++) {
          houseCells.add(`${other.gridX + dx},${other.gridY + dy}`);
        }
      }
    }

    // Front edge (+Z = gridY + height)
    for (let dx = 0; dx < m.width; dx++) {
      if (houseCells.has(`${m.gridX + dx},${m.gridY + m.height}`)) { sides.front = true; break; }
    }
    // Back edge (-Z = gridY - 1)
    for (let dx = 0; dx < m.width; dx++) {
      if (houseCells.has(`${m.gridX + dx},${m.gridY - 1}`)) { sides.back = true; break; }
    }
    // Left edge (-X = gridX - 1)
    for (let dy = 0; dy < m.height; dy++) {
      if (houseCells.has(`${m.gridX - 1},${m.gridY + dy}`)) { sides.left = true; break; }
    }
    // Right edge (+X = gridX + width)
    for (let dy = 0; dy < m.height; dy++) {
      if (houseCells.has(`${m.gridX + m.width},${m.gridY + dy}`)) { sides.right = true; break; }
    }

    return sides;
  }, [m.id, m.gridX, m.gridY, m.width, m.height, allModules, isFreistehend]);

  // ── Compute edge insets per side ──
  // Wandanschluss ('wand'): beams flush against wall, roof stops at fascia
  // Mit Pfosten ('pfosten'): house sides use INSET (0.08) + posts
  const useHouseInset = anschluss === 'wand';
  // Beam/post insets — near wall (house roof overhang removed on pergola side)
  // Left/Right: beam center at BEAM_W/2 + gap → beam face 1cm from wall
  // Front/Back: beam span endpoint at gap → beam end 1cm from wall
  const insetLeft = (adjacentSides.left && useHouseInset) ? BEAM_W / 2 + HOUSE_INSET : INSET;
  const insetRight = (adjacentSides.right && useHouseInset) ? BEAM_W / 2 + HOUSE_INSET : INSET;
  // Front/back beam inset: BEAM_W/2 so cross beam face sits flush against house wall
  const insetFront = (adjacentSides.front && useHouseInset) ? BEAM_W / 2 + HOUSE_INSET : INSET;
  const insetBack = (adjacentSides.back && useHouseInset) ? BEAM_W / 2 + HOUSE_INSET : INSET;
  // Roof covering insets — same as beam insets so roof ends at cross beam, not at wall
  const roofInsetLeft = insetLeft;
  const roofInsetRight = insetRight;
  const roofInsetFront = insetFront;
  const roofInsetBack = insetBack;

  // ── Post positions (skip posts on house-adjacent edges with Wandanschluss) ──
  const posts = useMemo(() => {
    const positions: [number, number][] = [];

    // Skip posts on house-adjacent edges only when using Wandanschluss
    const skipLeft = adjacentSides.left && useHouseInset;
    const skipRight = adjacentSides.right && useHouseInset;
    const skipFront = adjacentSides.front && useHouseInset;
    const skipBack = adjacentSides.back && useHouseInset;

    // Corner posts: skip if either of the two meeting edges is skipped
    if (!skipLeft && !skipBack)
      positions.push([-halfW + insetLeft, -halfD + insetBack]);
    if (!skipRight && !skipBack)
      positions.push([halfW - insetRight, -halfD + insetBack]);
    if (!skipLeft && !skipFront)
      positions.push([-halfW + insetLeft, halfD - insetFront]);
    if (!skipRight && !skipFront)
      positions.push([halfW - insetRight, halfD - insetFront]);

    // Mid-posts for wide spans (only on non-skipped edges)
    if (widthM > 3.5) {
      if (!skipBack) positions.push([0, -halfD + insetBack]);
      if (!skipFront) positions.push([0, halfD - insetFront]);
    }
    if (depthM > 3.5) {
      if (!skipLeft) positions.push([-halfW + insetLeft, 0]);
      if (!skipRight) positions.push([halfW - insetRight, 0]);
    }

    return positions;
  }, [halfW, halfD, widthM, depthM, adjacentSides, useHouseInset, insetLeft, insetRight, insetFront, insetBack]);

  // ── Beam frame spans (structural — flush against wall) ──
  const beamZStart = -halfD + insetBack;
  const beamZEnd = halfD - insetFront;
  const backIsHouseWall = adjacentSides.back && useHouseInset;
  const frontIsHouseWall = adjacentSides.front && useHouseInset;
  // Longitudinal beams extend BEAM_W/2 past cross beams on ALL sides (closed corners)
  const longBeamZStart = beamZStart - BEAM_W / 2;
  const longBeamZEnd = beamZEnd + BEAM_W / 2;
  const longBeamDepth = longBeamZEnd - longBeamZStart;
  const longBeamCenterZ = (longBeamZStart + longBeamZEnd) / 2;

  // Beam X span (structural frame)
  const beamXStart = -halfW + insetLeft;
  const beamXEnd = halfW - insetRight;
  const beamXWidth = beamXEnd - beamXStart;
  const beamXCenter = (beamXStart + beamXEnd) / 2;
  const crossBeamWidth = beamXWidth - BEAM_W;

  // ── Roof covering spans (stop at house roof fascia on house sides) ──
  const roofXStart = -halfW + roofInsetLeft;
  const roofXEnd = halfW - roofInsetRight;
  const roofWidth = roofXEnd - roofXStart;
  const roofXCenter = (roofXStart + roofXEnd) / 2;

  const roofZStart = -halfD + roofInsetBack;
  const roofZEnd = halfD - roofInsetFront;
  const roofDepth = roofZEnd - roofZStart;
  const roofZCenter = (roofZStart + roofZEnd) / 2;

  // ── Roof slats positions (running along width, spaced in Z) ──
  const slats = useMemo(() => {
    const spacing = 0.15; // 15cm center-to-center
    const spanZ = roofZEnd - roofZStart;
    const count = Math.max(2, Math.floor(spanZ / spacing));
    const actualSpacing = spanZ / count;
    const positions: number[] = [];
    for (let i = 0; i <= count; i++) {
      positions.push(roofZStart + i * actualSpacing);
    }
    return positions;
  }, [roofZStart, roofZEnd]);

  const beamTop = postHeight;
  const slatTop = beamTop + BEAM_H;

  // Glass variant: longitudinal beams are taller so glass rests directly on them
  const isGlass = roofType === 'glas';
  const tallBeamH = BEAM_H + SLAT_H; // 0.18m — glass sits on top of these

  return (
    <group
      position={[posX, 0, posZ]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (onClick) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Elevated group (on supports, like Module3D) */}
      <group position={[0, SUPPORT_HEIGHT, 0]}>

        {/* ── Posts (square aluminum profile, same as beam width) ── */}
        {posts.map(([px, pz], i) => (
          <group key={`post-${i}`}>
            {/* Square post */}
            <mesh
              position={[px, postHeight / 2, pz]}
              material={aluMaterial}
              castShadow
            >
              <boxGeometry args={[POST_W, postHeight, POST_W]} />
            </mesh>
            {/* Base anchor plate */}
            <mesh
              position={[px, 0.003, pz]}
              geometry={anchorGeometry}
              material={anchorMaterial}
              castShadow
            />
          </group>
        ))}

        {/* ── Main beams + cross beams (always rendered on all sides) ── */}
        {(() => {
          const bH = isGlass ? tallBeamH : BEAM_H;
          const bY = beamTop + bH / 2;
          return (
            <>
              {/* ── Longitudinal beams (front-to-back, extended to fill corners) ── */}
              {/* Left beam */}
              <mesh position={[-halfW + insetLeft, bY, longBeamCenterZ]} castShadow>
                <boxGeometry args={[BEAM_W, bH, longBeamDepth]} />
                <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
              </mesh>
              {/* Right beam */}
              <mesh position={[halfW - insetRight, bY, longBeamCenterZ]} castShadow>
                <boxGeometry args={[BEAM_W, bH, longBeamDepth]} />
                <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
              </mesh>
              {/* Optional center beam for wide pergolas */}
              {widthM > 3.5 && (
                <mesh position={[0, bY, longBeamCenterZ]} castShadow>
                  <boxGeometry args={[BEAM_W, bH, longBeamDepth]} />
                  <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
                </mesh>
              )}

              {/* ── Cross beams (shortened to fit between inner edges of longitudinal beams) ── */}
              {/* Front cross beam */}
              <mesh position={[beamXCenter, bY, halfD - insetFront]} castShadow>
                <boxGeometry args={[crossBeamWidth, bH, BEAM_W]} />
                <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
              </mesh>
              {/* Back cross beam */}
              <mesh position={[beamXCenter, bY, -halfD + insetBack]} castShadow>
                <boxGeometry args={[crossBeamWidth, bH, BEAM_W]} />
                <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
              </mesh>
            </>
          );
        })()}

        {/* ── Roof slats (running along width, on top of beams) ── */}
        {roofType === 'lamellen' && slats.map((sz, i) => (
          <mesh key={`slat-${i}`} position={[roofXCenter, slatTop + SLAT_H / 2, sz]} castShadow>
            <boxGeometry args={[roofWidth + 0.04, SLAT_H, SLAT_W]} />
            <meshStandardMaterial color="#484848" roughness={0.35} metalness={0.7} />
          </mesh>
        ))}

        {/* ── Glass roof ── */}
        {roofType === 'glas' && (
          <group>
            {/* Single middle cross beam (welded to longitudinal beams, same height) */}
            <mesh position={[beamXCenter, beamTop + tallBeamH / 2, roofZCenter]} castShadow>
              <boxGeometry args={[crossBeamWidth, tallBeamH, BEAM_W]} />
              <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Glass panel — sits directly on the tall longitudinal beams */}
            <mesh
              position={[roofXCenter, beamTop + tallBeamH + 0.006, roofZCenter]}
              material={glassMaterial}
              receiveShadow
            >
              <boxGeometry args={[roofWidth, 0.012, roofDepth]} />
            </mesh>
          </group>
        )}

        {/* ── EPDM roof membrane ── */}
        {/* EPDM membrane covers the full beam frame + overhang (like a real membrane) */}
        {roofType === 'epdm' && (
          <group>
            {/* Support slats (span beam frame width) */}
            {slats.filter((_, i) => i % 3 === 0 || i === slats.length - 1).map((sz, i) => (
              <mesh key={`eslat-${i}`} position={[beamXCenter, slatTop + SLAT_H / 2, sz]} castShadow>
                <boxGeometry args={[beamXWidth + BEAM_W + 0.04, SLAT_H, SLAT_W]} />
                <meshStandardMaterial color="#484848" roughness={0.35} metalness={0.7} />
              </mesh>
            ))}
            {/* EPDM membrane – covers full beam frame + 3cm overhang per side */}
            <mesh
              position={[beamXCenter, slatTop + SLAT_H + 0.003, longBeamCenterZ]}
              material={epdmMaterial}
              receiveShadow
              castShadow
            >
              <boxGeometry args={[beamXWidth + BEAM_W + 0.06, 0.006, longBeamDepth + 0.06]} />
            </mesh>
          </group>
        )}

        {/* ── Sichtschutz / Markise per side ── */}
        {(() => {
          const sides: { key: string; side: 'front' | 'back' | 'left' | 'right' }[] = [
            { key: 'sichtschutz_front', side: 'front' },
            { key: 'sichtschutz_back', side: 'back' },
            { key: 'sichtschutz_left', side: 'left' },
            { key: 'sichtschutz_right', side: 'right' },
          ];

          // Lamellen slat dimensions
          const SCREEN_SLAT_H = 0.03;   // 3cm height per slat
          const SCREEN_SLAT_D = 0.015;   // 1.5cm depth
          const SCREEN_GAP = 0.015;      // 1.5cm gap between slats
          const SCREEN_STEP = SCREEN_SLAT_H + SCREEN_GAP; // 4.5cm per row

          // Markise dimensions
          const HOUSING_H = 0.08;       // Roll housing height
          const HOUSING_D = 0.10;       // Roll housing depth
          const RAIL_W = 0.025;         // Guide rail width
          const FABRIC_THICKNESS = 0.003;

          return sides.map(({ key, side }) => {
            const val = m.options[key] as string | undefined;
            if (!val || val === 'none') return null;

            // Skip on house-adjacent sides (wall is there already)
            const isAdj = adjacentSides[side];
            if (isAdj && useHouseInset) return null;

            const isFB = side === 'front' || side === 'back';
            const spanW = isFB ? (beamXEnd - beamXStart) : (beamZEnd - beamZStart);
            const screenH = postHeight - 0.05; // Leave small gap at bottom

            // Position and rotation for each side
            let cx: number, cz: number, rotY: number;
            if (side === 'front') {
              cx = beamXCenter; cz = halfD - insetFront; rotY = 0;
            } else if (side === 'back') {
              cx = beamXCenter; cz = -halfD + insetBack; rotY = Math.PI;
            } else if (side === 'left') {
              cx = -halfW + insetLeft; cz = (beamZStart + beamZEnd) / 2; rotY = Math.PI / 2;
            } else {
              cx = halfW - insetRight; cz = (beamZStart + beamZEnd) / 2; rotY = -Math.PI / 2;
            }

            if (val === 'lamellen') {
              // Horizontal aluminum slat screen
              const slatCount = Math.floor(screenH / SCREEN_STEP);
              const slats: JSX.Element[] = [];
              for (let i = 0; i < slatCount; i++) {
                const y = 0.05 + i * SCREEN_STEP + SCREEN_SLAT_H / 2;
                slats.push(
                  <mesh key={`screen-slat-${i}`} position={[0, y, 0]} castShadow>
                    <boxGeometry args={[spanW, SCREEN_SLAT_H, SCREEN_SLAT_D]} />
                    <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
                  </mesh>
                );
              }
              return (
                <group key={key} position={[cx, 0, cz]} rotation={[0, rotY, 0]}>
                  {slats}
                </group>
              );
            }

            if (val === 'markise') {
              // Roll-down screen (Senkrechtmarkise)
              const fabricH = screenH - HOUSING_H;
              return (
                <group key={key} position={[cx, 0, cz]} rotation={[0, rotY, 0]}>
                  {/* Roll housing (top box) */}
                  <mesh position={[0, postHeight - HOUSING_H / 2, 0]} castShadow>
                    <boxGeometry args={[spanW + RAIL_W * 2, HOUSING_H, HOUSING_D]} />
                    <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
                  </mesh>
                  {/* Left guide rail */}
                  <mesh position={[-spanW / 2 - RAIL_W / 2, (postHeight - HOUSING_H) / 2, 0]} castShadow>
                    <boxGeometry args={[RAIL_W, postHeight - HOUSING_H, RAIL_W]} />
                    <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
                  </mesh>
                  {/* Right guide rail */}
                  <mesh position={[spanW / 2 + RAIL_W / 2, (postHeight - HOUSING_H) / 2, 0]} castShadow>
                    <boxGeometry args={[RAIL_W, postHeight - HOUSING_H, RAIL_W]} />
                    <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
                  </mesh>
                  {/* Fabric screen */}
                  <mesh position={[0, 0.05 + fabricH / 2, 0]} material={markiseMaterial}>
                    <boxGeometry args={[spanW, fabricH, FABRIC_THICKNESS]} />
                  </mesh>
                  {/* Bottom bar (Fallstange) */}
                  <mesh position={[0, 0.05, 0]} castShadow>
                    <boxGeometry args={[spanW + RAIL_W * 2, 0.025, 0.025]} />
                    <meshStandardMaterial color="#404040" roughness={0.3} metalness={0.8} />
                  </mesh>
                </group>
              );
            }

            return null;
          });
        })()}

      </group>{/* Close elevated group */}

      {/* Selection indicator */}
      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(widthM, depthM) * 0.56, Math.max(widthM, depthM) * 0.58, 48]} />
          <meshBasicMaterial color="#6B7280" opacity={0.7} transparent />
        </mesh>
      )}

      {/* Hover glow */}
      {hovered && !selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(widthM, depthM) * 0.56, Math.max(widthM, depthM) * 0.575, 48]} />
          <meshBasicMaterial color={color} opacity={0.25} transparent />
        </mesh>
      )}

      {/* Label */}
      {(hovered || selected) && (
        <Html
          position={[0, HOUSE_ROOF_TOP + SUPPORT_HEIGHT + 0.5, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="whitespace-nowrap text-[10px] font-medium"
            style={{
              color: selected ? '#1e293b' : '#6b7280',
              textShadow: '0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.6)',
              opacity: selected ? 1 : 0.85,
            }}
          >
            {label}
            <span className="ml-1 text-[9px] font-normal" style={{ opacity: 0.6 }}>
              {widthM.toFixed(1)}×{depthM.toFixed(1)}m
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
