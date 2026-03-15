import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import type { WallConfig, WallOpening, WallSide } from '../../types/walls';
import { getDefaultWallConfig } from '../../types/walls';
import { getSharedWallSegments, getWallRanges, type SharedWallSegments } from '../../utils/walls';
import { WoodWall } from './WoodWall';
import { RoofPanel } from './RoofPanel';
import { SolarPanels3D, type PVOrientation } from './SolarPanels3D';
import { DoorOpening } from './DoorOpening';
import { WindowOpening } from './WindowOpening';
import { WOOD_COLORS } from './textures/createWoodTexture';
import { loadWoodPBR, loadWallPBR, clonePBRMaps } from './textures/loadWoodPBR';

const OUTER_HEIGHT = 2.5;
const WALL_THICKNESS = 0.13;
const FLOOR_THICKNESS = 0.08; // 8cm visible ledge ("Absatz")
const SUPPORT_HEIGHT = 0.10; // 10cm aluminum support posts – module floats slightly
const CEILING_HEIGHT = OUTER_HEIGHT - 0.15;  // 2.35m — hides roof structure from interior
const CEILING_THICKNESS = 0.02; // 2cm panel

/** Compute positions for aluminum support posts under a module */
function getAluminumSupportPositions(widthM: number, depthM: number): [number, number][] {
  const inset = 0.15;
  const positions: [number, number][] = [
    [-widthM / 2 + inset, -depthM / 2 + inset],
    [widthM / 2 - inset, -depthM / 2 + inset],
    [-widthM / 2 + inset, depthM / 2 - inset],
    [widthM / 2 - inset, depthM / 2 - inset],
  ];
  // Extra supports for wider/deeper modules
  if (widthM > 2.0) {
    positions.push([0, -depthM / 2 + inset]);
    positions.push([0, depthM / 2 - inset]);
  }
  if (depthM > 2.0) {
    positions.push([-widthM / 2 + inset, 0]);
    positions.push([widthM / 2 - inset, 0]);
  }
  return positions;
}

interface Module3DProps {
  module: PlacedModule;
  allModules: PlacedModule[];
  color: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

/** Check if an entire wall side has NO shared cells (fully present) */
function isFullWall(shared: boolean[]): boolean {
  return shared.every((s) => !s);
}

export function Module3D({ module: m, allModules, color, label, selected, onClick }: Module3DProps) {
  const [hovered, setHovered] = useState(false);

  const widthM = m.width * GRID_CELL_SIZE;
  const depthM = m.height * GRID_CELL_SIZE;

  // Position: center of the module in world coordinates
  const posX = m.gridX * GRID_CELL_SIZE + widthM / 2;
  const posZ = m.gridY * GRID_CELL_SIZE + depthM / 2;

  // Get wall configuration (custom or default)
  const wallConfig: WallConfig = useMemo(
    () => m.walls ?? getDefaultWallConfig(m.type, m.width, m.height),
    [m.walls, m.type, m.width, m.height],
  );

  // Fixed wood color (robinie)
  const woodColor = WOOD_COLORS.robinie;
  // Per-cell shared wall detection for accurate partial wall rendering
  const sharedSegments = useMemo(
    () => getSharedWallSegments(m, allModules),
    [m, allModules],
  );

  const halfW = widthM / 2;
  const halfD = depthM / 2;

  // Precompute wall segment ranges (where walls SHOULD be rendered)
  const frontRanges = useMemo(() => getWallRanges(sharedSegments.front), [sharedSegments.front]);
  const backRanges = useMemo(() => getWallRanges(sharedSegments.back), [sharedSegments.back]);
  const leftRanges = useMemo(() => getWallRanges(sharedSegments.left), [sharedSegments.left]);
  const rightRanges = useMemo(() => getWallRanges(sharedSegments.right), [sharedSegments.right]);

  // Full-wall checks (for deciding whether to include configured openings)
  const frontFull = isFullWall(sharedSegments.front);
  const backFull = isFullWall(sharedSegments.back);
  const leftFull = isFullWall(sharedSegments.left);
  const rightFull = isFullWall(sharedSegments.right);

  const supportPositions = useMemo(
    () => getAluminumSupportPositions(widthM, depthM),
    [widthM, depthM],
  );

  // Detect which sides have an adjacent pergola module — remove roof overhang there
  const pergolaAdjacent = useMemo(() => {
    const sides = { front: false, back: false, left: false, right: false };
    const pergolaCells = new Set<string>();
    for (const other of allModules) {
      if (other.id === m.id || other.type !== 'pergola') continue;
      for (let dx = 0; dx < other.width; dx++) {
        for (let dy = 0; dy < other.height; dy++) {
          pergolaCells.add(`${other.gridX + dx},${other.gridY + dy}`);
        }
      }
    }
    for (let dx = 0; dx < m.width; dx++) {
      if (pergolaCells.has(`${m.gridX + dx},${m.gridY + m.height}`)) { sides.front = true; break; }
    }
    for (let dx = 0; dx < m.width; dx++) {
      if (pergolaCells.has(`${m.gridX + dx},${m.gridY - 1}`)) { sides.back = true; break; }
    }
    for (let dy = 0; dy < m.height; dy++) {
      if (pergolaCells.has(`${m.gridX - 1},${m.gridY + dy}`)) { sides.left = true; break; }
    }
    for (let dy = 0; dy < m.height; dy++) {
      if (pergolaCells.has(`${m.gridX + m.width},${m.gridY + dy}`)) { sides.right = true; break; }
    }
    return sides;
  }, [m.id, m.gridX, m.gridY, m.width, m.height, allModules]);

  // Detect which sides have an adjacent non-pergola module — for PV group layout
  const pvAdjacentSides = useMemo(() => {
    const sides = { front: false, back: false, left: false, right: false };
    const nonPergolaCells = new Set<string>();
    for (const other of allModules) {
      if (other.id === m.id || other.type === 'pergola') continue;
      for (let dx = 0; dx < other.width; dx++) {
        for (let dy = 0; dy < other.height; dy++) {
          nonPergolaCells.add(`${other.gridX + dx},${other.gridY + dy}`);
        }
      }
    }
    for (let dx = 0; dx < m.width; dx++) {
      if (nonPergolaCells.has(`${m.gridX + dx},${m.gridY + m.height}`)) { sides.front = true; break; }
    }
    for (let dx = 0; dx < m.width; dx++) {
      if (nonPergolaCells.has(`${m.gridX + dx},${m.gridY - 1}`)) { sides.back = true; break; }
    }
    for (let dy = 0; dy < m.height; dy++) {
      if (nonPergolaCells.has(`${m.gridX - 1},${m.gridY + dy}`)) { sides.left = true; break; }
    }
    for (let dy = 0; dy < m.height; dy++) {
      if (nonPergolaCells.has(`${m.gridX + m.width},${m.gridY + dy}`)) { sides.right = true; break; }
    }
    return sides;
  }, [m.id, m.gridX, m.gridY, m.width, m.height, allModules]);

  return (
    <group
      position={[posX, 0, posZ]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (onClick) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Aluminum support posts (at ground level, slightly shorter to avoid Z-fighting with floor) */}
      {supportPositions.map((pos, i) => {
        const postH = SUPPORT_HEIGHT - 0.02; // 2cm gap to floor plate
        return (
          <mesh key={`support-${i}`} position={[pos[0], postH / 2, pos[1]]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, postH, 8]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.3} metalness={0.7} />
          </mesh>
        );
      })}

      {/* Module body – elevated on supports */}
      <group position={[0, SUPPORT_HEIGHT, 0]}>

      {/* Floor plate – visible "Absatz" ledge, slightly wider than walls */}
      <mesh position={[0, FLOOR_THICKNESS / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[widthM + 0.04, FLOOR_THICKNESS, depthM + 0.04]} />
        <meshStandardMaterial color="#9D8565" roughness={0.8} />
      </mesh>

      {/* Front wall segments (facing +Z) */}
      {frontRanges.map((range, idx) => {
        const segW = range.count * GRID_CELL_SIZE;
        const cx = -halfW + range.start * GRID_CELL_SIZE + segW / 2;
        return (
          <WoodWall
            key={`front-${idx}`}
            wallWidth={segW}
            wallHeight={OUTER_HEIGHT}
            position={[cx, 0, halfD - WALL_THICKNESS / 2]}
            openings={frontFull ? wallConfig.front : []}
            woodColor={woodColor}
          />
        );
      })}

      {/* Back wall segments (facing -Z) */}
      {backRanges.map((range, idx) => {
        const segW = range.count * GRID_CELL_SIZE;
        const cx = -halfW + range.start * GRID_CELL_SIZE + segW / 2;
        return (
          <WoodWall
            key={`back-${idx}`}
            wallWidth={segW}
            wallHeight={OUTER_HEIGHT}
            position={[cx, 0, -halfD + WALL_THICKNESS / 2]}
            rotationY={Math.PI}
            openings={backFull ? wallConfig.back : []}
            woodColor={woodColor}
          />
        );
      })}

      {/* Left wall segments (facing -X) */}
      {leftRanges.map((range, idx) => {
        const segD = range.count * GRID_CELL_SIZE;
        const cz = -halfD + range.start * GRID_CELL_SIZE + segD / 2;
        return (
          <WoodWall
            key={`left-${idx}`}
            wallWidth={segD}
            wallHeight={OUTER_HEIGHT}
            position={[-halfW + WALL_THICKNESS / 2, 0, cz]}
            rotationY={Math.PI / 2}
            openings={leftFull ? wallConfig.left : []}
            woodColor={woodColor}
          />
        );
      })}

      {/* Right wall segments (facing +X) */}
      {rightRanges.map((range, idx) => {
        const segD = range.count * GRID_CELL_SIZE;
        const cz = -halfD + range.start * GRID_CELL_SIZE + segD / 2;
        return (
          <WoodWall
            key={`right-${idx}`}
            wallWidth={segD}
            wallHeight={OUTER_HEIGHT}
            position={[halfW - WALL_THICKNESS / 2, 0, cz]}
            rotationY={-Math.PI / 2}
            openings={rightFull ? wallConfig.right : []}
            woodColor={woodColor}
          />
        );
      })}

      {/* Roof */}
      <RoofPanel
        moduleWidth={widthM}
        moduleDepth={depthM}
        roofY={OUTER_HEIGHT}
        overhangFront={pergolaAdjacent.front ? 0 : undefined}
        overhangBack={pergolaAdjacent.back ? 0 : undefined}
        overhangLeft={pergolaAdjacent.left ? 0 : undefined}
        overhangRight={pergolaAdjacent.right ? 0 : undefined}
        hasSkylight={m.options.dachfenster === true}
        skylightWidth={typeof m.options.dachfenster_w === 'number' ? m.options.dachfenster_w : undefined}
        skylightDepth={typeof m.options.dachfenster_d === 'number' ? m.options.dachfenster_d : undefined}
      />

      {/* Optional solar panels on roof */}
      {m.options.pv_panels === true && (
        <SolarPanels3D
          moduleWidth={widthM}
          moduleDepth={depthM}
          roofY={OUTER_HEIGHT}
          panelCount={typeof m.options.pv_panel_count === 'number' ? m.options.pv_panel_count : undefined}
          adjacentFront={pvAdjacentSides.front}
          adjacentBack={pvAdjacentSides.back}
          adjacentLeft={pvAdjacentSides.left}
          adjacentRight={pvAdjacentSides.right}
          moduleAbsX={m.gridX * GRID_CELL_SIZE}
          moduleAbsZ={m.gridY * GRID_CELL_SIZE}
          orientation={typeof m.options.pv_orientation === 'string' ? m.options.pv_orientation as PVOrientation : undefined}
        />
      )}

      {/* Ceiling panel – hides roof structure from interior, same wood texture as walls */}
      {m.type !== 'pergola' && (
        <CeilingPanel
          width={widthM}
          depth={depthM}
          hasSkylight={m.options.dachfenster === true}
          skylightWidth={typeof m.options.dachfenster_w === 'number' ? m.options.dachfenster_w : undefined}
          skylightDepth={typeof m.options.dachfenster_d === 'number' ? m.options.dachfenster_d : undefined}
        />
      )}

      {/* Interior partition walls at shared boundaries */}
      {wallConfig.interiorWalls && Object.entries(wallConfig.interiorWalls).map(([side, openings]) => {
        if (!openings) return null;
        const ws = side as WallSide;
        const isFB = ws === 'front' || ws === 'back';
        const ww = isFB ? widthM : depthM;
        const segments = sharedSegments[ws];
        const sharedRange = getSharedRange(segments);
        // For left and back walls, the WoodWall's local X axis runs opposite to the
        // grid cell index direction. Left (rotation π/2): position 0 = front (high gridY),
        // but cell 0 = back (low gridY). Back (rotation π): position 0 = right (high gridX),
        // but cell 0 = left (low gridX). So we must invert the normalized position
        // to place the cutout in the correct (shared) area of the wall.
        const needsInvert = ws === 'left' || ws === 'back';
        // Clamp openings to shared segment for correct cutout positioning
        const clampedOpenings = sharedRange
          ? openings.map(o => {
              const c = clampInteriorOpening(o, ww, sharedRange).clamped;
              return needsInvert ? { ...c, position: 1 - c.position } : c;
            })
          : openings.map(o => needsInvert
              ? { ...o, position: 1 - o.position }
              : o
            );
        const pos: [number, number, number] =
          ws === 'front' ? [0, 0, halfD - WALL_THICKNESS / 2] :
          ws === 'back' ? [0, 0, -halfD + WALL_THICKNESS / 2] :
          ws === 'left' ? [-halfW + WALL_THICKNESS / 2, 0, 0] :
          [halfW - WALL_THICKNESS / 2, 0, 0];
        const rot =
          ws === 'front' ? 0 :
          ws === 'back' ? Math.PI :
          ws === 'left' ? Math.PI / 2 :
          -Math.PI / 2;
        return (
          <WoodWall
            key={`interior-${side}`}
            wallWidth={ww}
            wallHeight={OUTER_HEIGHT}
            position={pos}
            rotationY={rot}
            openings={clampedOpenings}
            woodColor={woodColor}
            isInterior
          />
        );
      })}

      {/* Interior door/window 3D components (frames + handles on shared boundaries) */}
      {wallConfig.interiorWalls && Object.entries(wallConfig.interiorWalls).map(([side, openings]) => {
        if (!openings || openings.length === 0) return null;
        const ws = side as WallSide;
        const isFB = ws === 'front' || ws === 'back';
        const wallW = isFB ? widthM : depthM;
        const segments = sharedSegments[ws];
        const sharedRange = getSharedRange(segments);
        const basePos: [number, number, number] =
          ws === 'front' ? [0, 0, halfD - WALL_THICKNESS / 2] :
          ws === 'back' ? [0, 0, -halfD + WALL_THICKNESS / 2] :
          ws === 'left' ? [-halfW + WALL_THICKNESS / 2, 0, 0] :
          [halfW - WALL_THICKNESS / 2, 0, 0];
        const rot =
          ws === 'front' ? 0 :
          ws === 'back' ? Math.PI :
          ws === 'left' ? Math.PI / 2 :
          -Math.PI / 2;

        // For left/back walls, invert the position to match the WoodWall's
        // local X axis direction (see comment above in WoodWall rendering).
        const needsInvert = ws === 'left' || ws === 'back';

        return openings.map((o, i) => {
          // Use shared range to clamp interior openings within the shared wall segment
          let clamped: WallOpening = sharedRange
            ? clampInteriorOpening(o, wallW, sharedRange).clamped
            : clampOpeningToWall(o, wallW);
          // Invert position for left/back walls so door frame matches WoodWall cutout
          if (needsInvert) {
            clamped = { ...clamped, position: 1 - clamped.position };
          }
          // Position opening along the wall:
          // After inversion, use consistent sign convention:
          //   back: negative X offset, front: positive X offset
          //   left: negative Z offset, right: positive Z offset
          let offset: number;
          if (isFB) {
            const signFlip = ws === 'back' ? -1 : 1;
            offset = signFlip * (clamped.position - 0.5) * wallW;
          } else {
            const signFlip = ws === 'left' ? -1 : 1;
            offset = signFlip * (clamped.position - 0.5) * wallW;
          }
          const pos: [number, number, number] = isFB
            ? [basePos[0] + offset, clamped.offsetY, basePos[2]]
            : [basePos[0], clamped.offsetY, basePos[2] + offset];

          return (
            <group key={`interior-opening-${side}-${i}`} position={pos} rotation={[0, rot, 0]}>
              {clamped.type === 'door' && (
                <DoorOpening
                  width={clamped.width}
                  height={clamped.height}
                  position={[0, 0, 0]}
                  hingeSide={clamped.hingeSide}
                  opensOutward={clamped.opensOutward}
                />
              )}
              {clamped.type === 'terrace-door' && (
                <DoorOpening
                  width={clamped.width}
                  height={clamped.height}
                  position={[0, 0, 0]}
                  double
                  hingeSide={clamped.hingeSide}
                  opensOutward={clamped.opensOutward}
                />
              )}
              {clamped.type === 'window' && (
                <WindowOpening
                  width={clamped.width}
                  height={clamped.height}
                  position={[0, 0, 0]}
                  floorLevel={clamped.offsetY < 0.01}
                />
              )}
            </group>
          );
        });
      })}

      {/* Door and window openings – only on fully non-shared walls */}
      <OpeningsGroup
        wallConfig={wallConfig}
        sharedSegments={sharedSegments}
        widthM={widthM}
        depthM={depthM}
      />

      {/* Selection indicator – thin elegant line */}
      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(widthM, depthM) * 0.56, Math.max(widthM, depthM) * 0.58, 48]} />
          <meshBasicMaterial color="#d97706" opacity={0.7} transparent />
        </mesh>
      )}

      {/* Hover glow (very subtle) */}
      {hovered && !selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(widthM, depthM) * 0.56, Math.max(widthM, depthM) * 0.575, 48]} />
          <meshBasicMaterial color={color} opacity={0.25} transparent />
        </mesh>
      )}

      {/* Label: nur bei Hover oder Selektion sichtbar */}
      {(hovered || selected) && (
        <Html
          position={[0, OUTER_HEIGHT + 0.3, 0]}
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

      </group>{/* Close elevated module body group */}
    </group>
  );
}

/** Default skylight dimensions (must match RoofPanel defaults) */
const SKYLIGHT_DEFAULT_W = 0.8;
const SKYLIGHT_DEFAULT_D = 0.6;

/** Ceiling panel with wood PBR texture (same as exterior walls).
 *  When a skylight is active, renders 4 segments around the opening
 *  so you can look through the roof glass from inside. */
function CeilingPanel({ width, depth, hasSkylight = false, skylightWidth, skylightDepth }: {
  width: number;
  depth: number;
  hasSkylight?: boolean;
  skylightWidth?: number;
  skylightDepth?: number;
}) {
  const pbrMaps = useMemo(() => loadWoodPBR() ?? loadWallPBR(), []);
  const y = CEILING_HEIGHT + CEILING_THICKNESS / 2;

  // Clamp skylight to fit within module (same logic as RoofPanel)
  const slW = Math.min(skylightWidth ?? SKYLIGHT_DEFAULT_W, width - 0.3);
  const slD = Math.min(skylightDepth ?? SKYLIGHT_DEFAULT_D, depth - 0.3);

  const makeMaterial = (segW: number, segD: number, offX: number, offZ: number) => {
    if (pbrMaps) {
      const scale = 1.0;
      const repeat: [number, number] = [segW / scale, segD / scale];
      const offset: [number, number] = [offX / scale, offZ / scale];
      const cloned = clonePBRMaps(pbrMaps, repeat, offset, 0);

      const mat = new THREE.MeshStandardMaterial({
        map: cloned.diffuse,
        roughnessMap: cloned.roughness,
        roughness: 1.0,
        metalness: 0,
      });
      if (cloned.normal) {
        mat.normalMap = cloned.normal;
        mat.normalScale = new THREE.Vector2(0.8, 0.8);
      }
      return mat;
    }
    return new THREE.MeshStandardMaterial({ color: '#C4B48A', roughness: 0.8 });
  };

  if (!hasSkylight) {
    const material = makeMaterial(width, depth, 0, 0);
    return (
      <mesh position={[0, y, 0]} receiveShadow material={material}>
        <boxGeometry args={[width, CEILING_THICKNESS, depth]} />
      </mesh>
    );
  }

  // 4 segments around the skylight cutout (same approach as RoofWithCutout)
  const halfSW = slW / 2;
  const halfSD = slD / 2;
  const halfW = width / 2;
  const halfD = depth / 2;

  const frontD = halfD - halfSD;   // +Z side
  const backD = halfD - halfSD;    // -Z side (symmetric, centered)
  const leftW = halfW - halfSW;    // -X side
  const rightW = halfW - halfSW;   // +X side

  return (
    <group>
      {/* Front ceiling segment (+Z) */}
      {frontD > 0.01 && (
        <mesh position={[0, y, halfSD + frontD / 2]} receiveShadow
          material={makeMaterial(width, frontD, 0, halfSD)}>
          <boxGeometry args={[width, CEILING_THICKNESS, frontD]} />
        </mesh>
      )}
      {/* Back ceiling segment (-Z) */}
      {backD > 0.01 && (
        <mesh position={[0, y, -halfSD - backD / 2]} receiveShadow
          material={makeMaterial(width, backD, 0, 0)}>
          <boxGeometry args={[width, CEILING_THICKNESS, backD]} />
        </mesh>
      )}
      {/* Left ceiling segment (-X, spans skylight depth only) */}
      {leftW > 0.01 && (
        <mesh position={[-halfSW - leftW / 2, y, 0]} receiveShadow
          material={makeMaterial(leftW, slD, 0, halfD - halfSD)}>
          <boxGeometry args={[leftW, CEILING_THICKNESS, slD]} />
        </mesh>
      )}
      {/* Right ceiling segment (+X, spans skylight depth only) */}
      {rightW > 0.01 && (
        <mesh position={[halfSW + rightW / 2, y, 0]} receiveShadow
          material={makeMaterial(rightW, slD, halfW + halfSW, halfD - halfSD)}>
          <boxGeometry args={[rightW, CEILING_THICKNESS, slD]} />
        </mesh>
      )}
    </group>
  );
}

/** Clamp opening dimensions and position to fit within the given wall width */
function clampOpeningToWall(o: WallOpening, wallW: number): WallOpening {
  const margin = 0.15; // 15cm from each wall edge (≥ wall thickness)
  const w = Math.min(o.width, Math.max(0.3, wallW - margin * 2));
  const h = Math.min(o.height, OUTER_HEIGHT);
  const halfW = w / 2;
  const minPos = (halfW + margin) / wallW;
  const maxPos = 1 - minPos;
  const pos = Math.max(minPos, Math.min(maxPos, o.position));
  return { ...o, width: w, height: h, position: pos };
}

/**
 * Compute the shared wall segment range in meters from a boolean[] of per-cell sharing.
 * Returns { startM, endM } – the first and last shared cell boundaries in meters.
 * If no shared cells, returns null.
 */
function getSharedRange(segments: boolean[]): { startM: number; endM: number } | null {
  let first = -1;
  let last = -1;
  for (let i = 0; i < segments.length; i++) {
    if (segments[i]) {
      if (first === -1) first = i;
      last = i;
    }
  }
  if (first === -1) return null;
  return { startM: first * GRID_CELL_SIZE, endM: (last + 1) * GRID_CELL_SIZE };
}

/**
 * Clamp an interior opening to fit within the shared wall segment only.
 * The position is mapped from normalized (0-1 on full wall) to the shared range center.
 * Returns { clamped opening, absolute offset in meters from wall center }.
 */
function clampInteriorOpening(
  o: WallOpening,
  wallW: number,
  sharedRange: { startM: number; endM: number },
): { clamped: WallOpening; offsetM: number } {
  const margin = 0.15;
  const segW = sharedRange.endM - sharedRange.startM;
  const w = Math.min(o.width, Math.max(0.3, segW - margin * 2));
  const h = Math.min(o.height, OUTER_HEIGHT);
  // Position within the shared segment (0-1 normalized within segment)
  const segCenter = (sharedRange.startM + sharedRange.endM) / 2;
  const halfW = w / 2;
  const minAbs = sharedRange.startM + halfW + margin;
  const maxAbs = sharedRange.endM - halfW - margin;
  // Default: center of shared segment. Use o.position to offset within segment.
  const targetAbs = sharedRange.startM + o.position * segW;
  const clampedAbs = Math.max(minAbs, Math.min(maxAbs, targetAbs));
  // Convert to offset from wall center (wallW/2)
  const offsetM = clampedAbs - wallW / 2;
  // Keep normalized position for WoodWall rendering (relative to full wall)
  const normalizedPos = clampedAbs / wallW;
  return {
    clamped: { ...o, width: w, height: h, position: normalizedPos },
    offsetM,
  };
}

/** Render door/window openings – only on fully non-shared wall sides */
function OpeningsGroup({
  wallConfig,
  sharedSegments,
  widthM,
  depthM,
}: {
  wallConfig: WallConfig;
  sharedSegments: SharedWallSegments;
  widthM: number;
  depthM: number;
}) {
  const WALL_T = 0.13;
  const halfW = widthM / 2;
  const halfD = depthM / 2;

  const allOpenings: {
    opening: WallOpening;
    side: WallSide;
    position: [number, number, number];
    rotationY: number;
  }[] = [];

  // Only render openings on fully non-shared walls
  if (isFullWall(sharedSegments.front)) {
    for (const o of wallConfig.front) {
      const clamped = clampOpeningToWall(o, widthM);
      const cx = (clamped.position - 0.5) * widthM;
      allOpenings.push({
        opening: clamped,
        side: 'front',
        position: [cx, clamped.offsetY, halfD - WALL_T / 2],
        rotationY: 0,
      });
    }
  }

  if (isFullWall(sharedSegments.back)) {
    for (const o of wallConfig.back) {
      const clamped = clampOpeningToWall(o, widthM);
      const cx = -(clamped.position - 0.5) * widthM;
      allOpenings.push({
        opening: clamped,
        side: 'back',
        position: [cx, clamped.offsetY, -halfD + WALL_T / 2],
        rotationY: Math.PI,
      });
    }
  }

  if (isFullWall(sharedSegments.left)) {
    for (const o of wallConfig.left) {
      const clamped = clampOpeningToWall(o, depthM);
      const cz = (clamped.position - 0.5) * depthM;
      allOpenings.push({
        opening: clamped,
        side: 'left',
        position: [-halfW + WALL_T / 2, clamped.offsetY, cz],
        rotationY: Math.PI / 2,
      });
    }
  }

  if (isFullWall(sharedSegments.right)) {
    for (const o of wallConfig.right) {
      const clamped = clampOpeningToWall(o, depthM);
      const cz = -(clamped.position - 0.5) * depthM;
      allOpenings.push({
        opening: clamped,
        side: 'right',
        position: [halfW - WALL_T / 2, clamped.offsetY, cz],
        rotationY: -Math.PI / 2,
      });
    }
  }

  return (
    <>
      {allOpenings.map((item, i) => (
        <group key={i} position={item.position} rotation={[0, item.rotationY, 0]}>
          {item.opening.type === 'door' && (
            <DoorOpening
              width={item.opening.width}
              height={item.opening.height}
              position={[0, 0, 0]}
              hingeSide={item.opening.hingeSide}
              opensOutward={item.opening.opensOutward}
            />
          )}
          {item.opening.type === 'terrace-door' && (
            <DoorOpening
              width={item.opening.width}
              height={item.opening.height}
              position={[0, 0, 0]}
              double
              hingeSide={item.opening.hingeSide}
              opensOutward={item.opening.opensOutward}
            />
          )}
          {item.opening.type === 'window' && (
            <WindowOpening
              width={item.opening.width}
              height={item.opening.height}
              position={[0, 0, 0]}
              floorLevel={item.opening.offsetY < 0.01}
            />
          )}
        </group>
      ))}
    </>
  );
}
