import { useMemo } from 'react';
import * as THREE from 'three';
import { PV_PANEL_W, PV_PANEL_D, PV_MARGIN, PV_GAP } from '../../utils/pvCalculation';

/** Compass direction for PV panel orientation */
export type PVOrientation = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

/** Compass heading in radians (clockwise from North = -Z) */
const COMPASS_ANGLES: Record<PVOrientation, number> = {
  N: 0,
  NE: Math.PI / 4,
  E: Math.PI / 2,
  SE: (3 * Math.PI) / 4,
  S: Math.PI,
  SW: (5 * Math.PI) / 4,
  W: (3 * Math.PI) / 2,
  NW: (7 * Math.PI) / 4,
};

/** Fixed tilt angle in radians (~15°) */
const TILT_ANGLE = 0.262;

interface SolarPanels3DProps {
  /** Module width in meters */
  moduleWidth: number;
  /** Module depth in meters */
  moduleDepth: number;
  /** Y position of the roof top surface */
  roofY: number;
  /** If provided, limit rendered panels to this count (1 to maxPanels) */
  panelCount?: number;
  /** Adjacency: true if side touches another non-pergola module */
  adjacentFront?: boolean;
  adjacentBack?: boolean;
  adjacentLeft?: boolean;
  adjacentRight?: boolean;
  /** Absolute position of module's top-left corner in world meters */
  moduleAbsX?: number;
  moduleAbsZ?: number;
  /** Compass direction the panels face (default: 'S' for south) */
  orientation?: PVOrientation;
}

// Panel thickness
const PANEL_H = 0.04;
const FRAME_T = 0.015;

// Layout
const MARGIN = PV_MARGIN;
const GAP = PV_GAP;
const ROOF_THICKNESS = 0.10;

// Mounting rails
const RAIL_WIDTH = 0.03;
const RAIL_DEPTH = 0.025;

/** Simple merge of box geometries (all have same attribute layout) */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let indexOffset = 0;

  for (const geo of geometries) {
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const norm = geo.getAttribute('normal') as THREE.BufferAttribute;
    const idx = geo.getIndex();

    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push(idx.array[i] + indexOffset);
      }
    }

    indexOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setIndex(indices);
  return merged;
}

/** Create panel + frame geometries for a given panel size */
function createPanelGeometries(pw: number, pd: number) {
  const panelGeo = new THREE.BoxGeometry(pw, PANEL_H, pd);

  const hw = pw / 2;
  const hd = pd / 2;
  const top = new THREE.BoxGeometry(pw + FRAME_T * 2, FRAME_T, FRAME_T);
  const bottom = new THREE.BoxGeometry(pw + FRAME_T * 2, FRAME_T, FRAME_T);
  const left = new THREE.BoxGeometry(FRAME_T, FRAME_T, pd);
  const right = new THREE.BoxGeometry(FRAME_T, FRAME_T, pd);

  top.translate(0, PANEL_H / 2, -hd - FRAME_T / 2);
  bottom.translate(0, PANEL_H / 2, hd + FRAME_T / 2);
  left.translate(-hw - FRAME_T / 2, PANEL_H / 2, 0);
  right.translate(hw + FRAME_T / 2, PANEL_H / 2, 0);

  const frameGeo = mergeBufferGeometries([top, bottom, left, right]);

  return { panelGeo, frameGeo };
}

// Pre-create geometries for both orientations (reused across all instances)
const normalGeos = createPanelGeometries(PV_PANEL_W, PV_PANEL_D);
const rotatedGeos = createPanelGeometries(PV_PANEL_D, PV_PANEL_W);

// Shared materials
const panelMaterial = new THREE.MeshStandardMaterial({
  color: '#1a2744',
  roughness: 0.25,
  metalness: 0.5,
});

const frameMaterial = new THREE.MeshStandardMaterial({
  color: '#C0C0C0',
  roughness: 0.4,
  metalness: 0.7,
});

const railMaterial = new THREE.MeshStandardMaterial({
  color: '#B0B0B0',
  roughness: 0.35,
  metalness: 0.8,
});

/**
 * Renders a grid of photovoltaic panels on top of a module roof.
 * Uses module-centered placement with per-side margin reduction for adjacent modules.
 */
export function SolarPanels3D({
  moduleWidth, moduleDepth, roofY, panelCount,
  adjacentFront = false, adjacentBack = false,
  adjacentLeft = false, adjacentRight = false,
  orientation = 'S',
}: SolarPanels3DProps) {
  const layout = useMemo(() => {
    // Per-side margins: 0 on shared sides, MARGIN on outer edges
    const mLeft = adjacentLeft ? 0 : MARGIN;
    const mRight = adjacentRight ? 0 : MARGIN;
    const mBack = adjacentBack ? 0 : MARGIN;
    const mFront = adjacentFront ? 0 : MARGIN;

    const availW = moduleWidth - mLeft - mRight;
    const availD = moduleDepth - mBack - mFront;

    if (availW < 0.5 || availD < 0.5) return null;

    // Try both orientations, pick better one
    const colsN = Math.max(0, Math.floor((availW + GAP) / (PV_PANEL_W + GAP)));
    const rowsN = Math.max(0, Math.floor((availD + GAP) / (PV_PANEL_D + GAP)));
    const normalCount = colsN * rowsN;

    const colsR = Math.max(0, Math.floor((availW + GAP) / (PV_PANEL_D + GAP)));
    const rowsR = Math.max(0, Math.floor((availD + GAP) / (PV_PANEL_W + GAP)));
    const rotatedCount = colsR * rowsR;

    const rotated = rotatedCount > normalCount;
    const cols = rotated ? colsR : colsN;
    const rows = rotated ? rowsR : rowsN;
    const effW = rotated ? PV_PANEL_D : PV_PANEL_W;
    const effD = rotated ? PV_PANEL_W : PV_PANEL_D;

    if (cols === 0 || rows === 0) return null;

    // Center the panel grid within the usable area (module-local coordinates)
    const stepW = effW + GAP;
    const stepD = effD + GAP;
    const gridW = cols * effW + (cols - 1) * GAP;
    const gridD = rows * effD + (rows - 1) * GAP;

    // Start position: offset from module center
    const startX = -moduleWidth / 2 + mLeft + (availW - gridW) / 2 + effW / 2;
    const startZ = -moduleDepth / 2 + mBack + (availD - gridD) / 2 + effD / 2;

    const positions: [number, number][] = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        positions.push([startX + c * stepW, startZ + r * stepD]);
      }
    }

    if (positions.length === 0) return null;

    // Limit panels if panelCount is specified
    const limited = panelCount !== undefined && panelCount < positions.length
      ? positions.slice(0, Math.max(1, panelCount))
      : positions;

    // Compute rail X positions (2 rails per column, running in Z direction)
    const panelXSet = new Set<number>();
    for (const [px] of limited) panelXSet.add(Math.round(px * 1000) / 1000);
    const railXPositions: number[] = [];
    for (const px of panelXSet) {
      railXPositions.push(px - effW * 0.3);
      railXPositions.push(px + effW * 0.3);
    }

    // Rail Z extent: from min to max panel Z position
    const zValues = limited.map(([, pz]) => pz);
    const minZ = Math.min(...zValues) - effD / 2;
    const maxZ = Math.max(...zValues) + effD / 2;
    const railLength = maxZ - minZ + 0.08;
    const railCenterZ = (minZ + maxZ) / 2;

    return { positions: limited, rotated, railXPositions, railLength, railCenterZ };
  }, [moduleWidth, moduleDepth, panelCount,
      adjacentFront, adjacentBack, adjacentLeft, adjacentRight]);

  if (!layout || layout.positions.length === 0) return null;

  const { positions, rotated, railXPositions, railLength, railCenterZ } = layout;
  const geos = rotated ? rotatedGeos : normalGeos;

  // Effective panel dimensions (used for Y compensation)
  const effW = rotated ? PV_PANEL_D : PV_PANEL_W;
  const effD = rotated ? PV_PANEL_W : PV_PANEL_D;

  // Compute tilt rotation from compass direction
  // Coordinate system: N = -Z, E = +X, S = +Z, W = -X
  const compassAngle = COMPASS_ANGLES[orientation];
  const tiltX = -TILT_ANGLE * Math.cos(compassAngle);
  const tiltZ = -TILT_ANGLE * Math.sin(compassAngle);

  // Y lift: raise each panel so its lowest tilted edge clears the roof surface.
  // When a panel at (±effW/2, 0, ±effD/2) rotates by [tiltX, 0, tiltZ],
  // the maximum downward corner displacement is:
  const yLift = TILT_ANGLE * (
    (effD / 2) * Math.abs(Math.cos(compassAngle)) +
    (effW / 2) * Math.abs(Math.sin(compassAngle))
  );

  // Base Y positions (rails sit on roof, panels on top of rails)
  const railY = roofY + ROOF_THICKNESS + RAIL_DEPTH / 2 + 0.002;
  // Panels: raised by yLift so tilted lowest edge just touches rail tops
  const panelY = roofY + ROOF_THICKNESS + RAIL_DEPTH + PANEL_H / 2 + 0.003 + yLift;

  return (
    <group>
      {/* Mounting rails – flat aluminum tracks on roof */}
      {railXPositions.map((rx, i) => (
        <mesh key={`rail-${i}`} position={[rx, railY, railCenterZ]} material={railMaterial} castShadow>
          <boxGeometry args={[RAIL_WIDTH, RAIL_DEPTH, railLength]} />
        </mesh>
      ))}

      {/* Solar panels – each tilted individually around its own center */}
      {positions.map(([px, pz], i) => (
        <group key={i} position={[px, panelY, pz]} rotation={[tiltX, 0, tiltZ]}>
          <mesh geometry={geos.panelGeo} material={panelMaterial} castShadow receiveShadow />
          <mesh geometry={geos.frameGeo} material={frameMaterial} />
        </group>
      ))}
    </group>
  );
}
