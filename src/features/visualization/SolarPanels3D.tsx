import { useMemo } from 'react';
import * as THREE from 'three';

interface SolarPanels3DProps {
  /** Module width in meters */
  moduleWidth: number;
  /** Module depth in meters */
  moduleDepth: number;
  /** Y position of the roof top surface */
  roofY: number;
}

// Panel dimensions (realistic residential PV panel)
const PANEL_W = 1.0;   // Width of a single panel (m)
const PANEL_D = 1.7;   // Depth of a single panel (m)
const PANEL_H = 0.04;  // Thickness (m)
const FRAME_T = 0.015; // Aluminium frame thickness (m)

// Layout
const MARGIN = 0.20;   // Distance from roof edge (m)
const GAP = 0.06;      // Gap between panels (m)
const ROOF_THICKNESS = 0.10; // Must match RoofPanel

// Shared geometries (created once, reused by all instances)
const panelGeometry = new THREE.BoxGeometry(PANEL_W, PANEL_H, PANEL_D);

// Frame geometry: thin strips on all 4 edges of a panel
const frameParts = (() => {
  const hw = PANEL_W / 2;
  const hd = PANEL_D / 2;
  const top = new THREE.BoxGeometry(PANEL_W + FRAME_T * 2, FRAME_T, FRAME_T);
  const bottom = new THREE.BoxGeometry(PANEL_W + FRAME_T * 2, FRAME_T, FRAME_T);
  const left = new THREE.BoxGeometry(FRAME_T, FRAME_T, PANEL_D);
  const right = new THREE.BoxGeometry(FRAME_T, FRAME_T, PANEL_D);

  // Position the frame strips relative to panel center
  top.translate(0, PANEL_H / 2, -hd - FRAME_T / 2);
  bottom.translate(0, PANEL_H / 2, hd + FRAME_T / 2);
  left.translate(-hw - FRAME_T / 2, PANEL_H / 2, 0);
  right.translate(hw + FRAME_T / 2, PANEL_H / 2, 0);

  const merged = new THREE.BufferGeometry();
  const geo = new THREE.BufferGeometry();
  geo.copy(top);
  const geos = [top, bottom, left, right];

  // Merge all frame pieces into one geometry
  const mergedGeo = mergeBufferGeometries(geos);
  return mergedGeo;
})();

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

/**
 * Renders a grid of photovoltaic panels on top of a module roof.
 * Automatically calculates how many panels fit based on roof dimensions.
 */
export function SolarPanels3D({ moduleWidth, moduleDepth, roofY }: SolarPanels3DProps) {
  const panelPositions = useMemo(() => {
    const availW = moduleWidth - MARGIN * 2;
    const availD = moduleDepth - MARGIN * 2;

    const cols = Math.floor((availW + GAP) / (PANEL_W + GAP));
    const rows = Math.floor((availD + GAP) / (PANEL_D + GAP));

    if (cols <= 0 || rows <= 0) return [];

    // Center the panel grid on the roof
    const gridW = cols * PANEL_W + (cols - 1) * GAP;
    const gridD = rows * PANEL_D + (rows - 1) * GAP;
    const startX = -gridW / 2 + PANEL_W / 2;
    const startZ = -gridD / 2 + PANEL_D / 2;

    const positions: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push([
          startX + c * (PANEL_W + GAP),
          startZ + r * (PANEL_D + GAP),
        ]);
      }
    }
    return positions;
  }, [moduleWidth, moduleDepth]);

  if (panelPositions.length === 0) return null;

  // Panels sit on top of the roof slab
  const panelY = roofY + ROOF_THICKNESS + PANEL_H / 2 + 0.005;

  return (
    <group>
      {panelPositions.map(([px, pz], i) => (
        <group key={i} position={[px, panelY, pz]}>
          {/* Solar cell surface */}
          <mesh geometry={panelGeometry} material={panelMaterial} castShadow receiveShadow />
          {/* Aluminium frame */}
          <mesh geometry={frameParts} material={frameMaterial} />
        </group>
      ))}
    </group>
  );
}
