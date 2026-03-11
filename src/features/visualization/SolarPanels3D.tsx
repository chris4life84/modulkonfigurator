import { useMemo } from 'react';
import * as THREE from 'three';
import { PV_PANEL_W, PV_PANEL_D, PV_MARGIN, PV_GAP } from '../../utils/pvCalculation';

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
 * Uses a global grid alignment so panels line up across adjacent modules.
 * Removes margins on shared sides for efficient use of combined roof space.
 */
export function SolarPanels3D({
  moduleWidth, moduleDepth, roofY, panelCount,
  adjacentFront = false, adjacentBack = false,
  adjacentLeft = false, adjacentRight = false,
  moduleAbsX = 0, moduleAbsZ = 0,
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
    const effW = rotated ? PV_PANEL_D : PV_PANEL_W;
    const effD = rotated ? PV_PANEL_W : PV_PANEL_D;

    // GLOBAL GRID ALIGNMENT:
    // Panels are placed on a global grid (absolute world coordinates).
    // Each module renders only panels that fit entirely within its usable roof area.
    const stepW = effW + GAP;
    const stepD = effD + GAP;

    // Usable area in absolute coordinates
    const absLeft = moduleAbsX + mLeft;
    const absRight = moduleAbsX + moduleWidth - mRight;
    const absBack = moduleAbsZ + mBack;
    const absFront = moduleAbsZ + moduleDepth - mFront;

    // Module center in absolute coordinates (for converting to local coords)
    const moduleCenterX = moduleAbsX + moduleWidth / 2;
    const moduleCenterZ = moduleAbsZ + moduleDepth / 2;

    // Find panel positions from the global grid that fit within this module's area
    // Global grid: panel center at (c * stepW + effW/2, r * stepD + effD/2)
    // with a small global offset (MARGIN) so panels don't start at world origin edge
    const globalOffsetX = MARGIN;
    const globalOffsetZ = MARGIN;

    const firstCol = Math.max(0, Math.floor((absLeft - globalOffsetX) / stepW));
    const firstRow = Math.max(0, Math.floor((absBack - globalOffsetZ) / stepD));

    const positions: [number, number][] = [];
    for (let c = firstCol; c < 1000; c++) {
      const panelCenterX = globalOffsetX + c * stepW + effW / 2;
      const panelLeft = panelCenterX - effW / 2;
      const panelRight = panelCenterX + effW / 2;
      if (panelLeft < absLeft - 0.01) continue;
      if (panelRight > absRight + 0.01) break;

      for (let r = firstRow; r < 1000; r++) {
        const panelCenterZ = globalOffsetZ + r * stepD + effD / 2;
        const panelBack = panelCenterZ - effD / 2;
        const panelFront = panelCenterZ + effD / 2;
        if (panelBack < absBack - 0.01) continue;
        if (panelFront > absFront + 0.01) break;

        // Convert to module-local coordinates
        const localX = panelCenterX - moduleCenterX;
        const localZ = panelCenterZ - moduleCenterZ;
        positions.push([localX, localZ]);
      }
    }

    if (positions.length === 0) return null;

    // Limit panels if panelCount is specified
    const limited = panelCount !== undefined && panelCount < positions.length
      ? positions.slice(0, Math.max(1, panelCount))
      : positions;

    // Compute rail X positions (2 rails per column, running in Z direction)
    // Use unique X positions from the panel positions
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
      adjacentFront, adjacentBack, adjacentLeft, adjacentRight,
      moduleAbsX, moduleAbsZ]);

  if (!layout || layout.positions.length === 0) return null;

  const { positions, rotated, railXPositions, railLength, railCenterZ } = layout;
  const geos = rotated ? rotatedGeos : normalGeos;

  // Panels float above roof on mounting rails
  const railY = roofY + ROOF_THICKNESS + RAIL_DEPTH / 2 + 0.002;
  const panelY = roofY + ROOF_THICKNESS + RAIL_DEPTH + PANEL_H / 2 + 0.003;

  return (
    <group>
      {/* Mounting rails – aluminum tracks running in Z direction */}
      {railXPositions.map((rx, i) => (
        <mesh key={`rail-${i}`} position={[rx, railY, railCenterZ]} material={railMaterial} castShadow>
          <boxGeometry args={[RAIL_WIDTH, RAIL_DEPTH, railLength]} />
        </mesh>
      ))}

      {/* Solar panels on top of rails */}
      {positions.map(([px, pz], i) => (
        <group key={i} position={[px, panelY, pz]}>
          <mesh geometry={geos.panelGeo} material={panelMaterial} castShadow receiveShadow />
          <mesh geometry={geos.frameGeo} material={frameMaterial} />
        </group>
      ))}
    </group>
  );
}
