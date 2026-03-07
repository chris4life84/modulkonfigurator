import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import type { WallConfig, WallOpening, WallSide } from '../../types/walls';
import { getDefaultWallConfig } from '../../types/walls';
import { getSharedWallSegments, getWallRanges, type SharedWallSegments } from '../../utils/walls';
import { WoodWall } from './WoodWall';
import { RoofPanel } from './RoofPanel';
// CornerPost removed for clean continuous plank aesthetic
import { DoorOpening } from './DoorOpening';
import { WindowOpening } from './WindowOpening';
import { WOOD_COLORS } from './textures/createWoodTexture';

const OUTER_HEIGHT = 2.5;
const WALL_THICKNESS = 0.13;
const FLOOR_THICKNESS = 0.08; // 8cm visible ledge ("Absatz")
const SUPPORT_HEIGHT = 0.10; // 10cm aluminum support posts – module floats slightly

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
      />

      {/* Interior partition walls at shared boundaries */}
      {wallConfig.interiorWalls && Object.entries(wallConfig.interiorWalls).map(([side, openings]) => {
        if (!openings) return null;
        const ws = side as WallSide;
        const isFB = ws === 'front' || ws === 'back';
        const ww = isFB ? widthM : depthM;
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
            openings={openings}
            woodColor={woodColor}
            isInterior
          />
        );
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

  /** Clamp opening dimensions and position to fit within the given wall width */
  const clampToWall = (o: WallOpening, wallW: number): WallOpening => {
    const margin = 0.15; // 15cm from each wall edge (≥ wall thickness)
    const w = Math.min(o.width, Math.max(0.3, wallW - margin * 2));
    const h = Math.min(o.height, OUTER_HEIGHT);
    // Clamp position so opening center stays far enough from edges
    const halfW = w / 2;
    const minPos = (halfW + margin) / wallW;
    const maxPos = 1 - minPos;
    const pos = Math.max(minPos, Math.min(maxPos, o.position));
    return { ...o, width: w, height: h, position: pos };
  };

  const allOpenings: {
    opening: WallOpening;
    side: WallSide;
    position: [number, number, number];
    rotationY: number;
  }[] = [];

  // Only render openings on fully non-shared walls
  if (isFullWall(sharedSegments.front)) {
    for (const o of wallConfig.front) {
      const clamped = clampToWall(o, widthM);
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
      const clamped = clampToWall(o, widthM);
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
      const clamped = clampToWall(o, depthM);
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
      const clamped = clampToWall(o, depthM);
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
            />
          )}
          {item.opening.type === 'terrace-door' && (
            <DoorOpening
              width={item.opening.width}
              height={item.opening.height}
              position={[0, 0, 0]}
              double
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
