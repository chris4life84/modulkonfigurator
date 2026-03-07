import type { ModuleType } from './modules';
import { GRID_CELL_SIZE } from './grid';

export type WallSide = 'front' | 'back' | 'left' | 'right';

export interface WallOpening {
  type: 'window' | 'door' | 'terrace-door';
  /** Horizontal position along wall (0 = left edge, 1 = right edge). Center of opening. */
  position: number;
  /** Width in meters */
  width: number;
  /** Height in meters */
  height: number;
  /** Bottom edge above floor in meters (0 for floor-to-ceiling) */
  offsetY: number;
}

export interface WallConfig {
  front: WallOpening[];
  back: WallOpening[];
  left: WallOpening[];
  right: WallOpening[];
  /** Optional interior partition walls at shared (Verbundwand) boundaries */
  interiorWalls?: Partial<Record<WallSide, WallOpening[]>>;
}

/** Create an empty wall config (all solid walls) */
export function emptyWallConfig(): WallConfig {
  return { front: [], back: [], left: [], right: [] };
}

/** Clamp opening widths and positions so they stay within wall boundaries */
function clampOpenings(openings: WallOpening[], wallWidthM: number): WallOpening[] {
  const margin = 0.15; // 15cm from each wall edge (≥ wall thickness)
  const maxW = Math.max(0.3, wallWidthM - margin * 2);
  return openings.map((o) => {
    const w = Math.min(o.width, maxW);
    // Clamp position so opening center stays far enough from edges
    const halfW = w / 2;
    const minPos = (halfW + margin) / wallWidthM;
    const maxPos = 1 - minPos;
    const pos = Math.max(minPos, Math.min(maxPos, o.position));
    return { ...o, width: w, position: pos };
  });
}

/** Clamp all openings in a WallConfig to the actual wall widths */
function clampConfig(config: WallConfig, frontBackM: number, leftRightM: number): WallConfig {
  return {
    front: clampOpenings(config.front, frontBackM),
    back: clampOpenings(config.back, frontBackM),
    left: clampOpenings(config.left, leftRightM),
    right: clampOpenings(config.right, leftRightM),
    interiorWalls: config.interiorWalls,
  };
}

/**
 * Default wall configurations per module type.
 * These provide sensible starting openings for each module.
 * Opening widths are clamped to fit actual wall dimensions.
 */
export function getDefaultWallConfig(
  type: ModuleType,
  width: number,
  height: number,
): WallConfig {
  const isLarge = width >= 6 && height >= 6;
  const widthM = width * GRID_CELL_SIZE; // front/back wall width in meters
  const depthM = height * GRID_CELL_SIZE; // left/right wall width in meters

  let raw: WallConfig;

  switch (type) {
    case 'sauna':
      raw = {
        front: [{ type: 'door', position: 0.5, width: 1.0, height: 2.0, offsetY: 0 }],
        back: [],
        left: isLarge
          ? [{ type: 'window', position: 0.5, width: 1.0, height: 1.0, offsetY: 0.8 }]
          : [],
        right: [{ type: 'window', position: 0.5, width: 1.0, height: 1.0, offsetY: 0.8 }],
      };
      break;

    case 'living':
      raw = {
        front: [{ type: 'terrace-door', position: 0.5, width: 2.0, height: 2.0, offsetY: 0 }],
        back: isLarge
          ? [{ type: 'window', position: 0.5, width: 2.0, height: 2.0, offsetY: 0 }]
          : [],
        left: [],
        right: [{ type: 'window', position: 0.5, width: 2.0, height: 2.0, offsetY: 0 }],
      };
      break;

    case 'ruhe':
      raw = {
        front: [{ type: 'door', position: 0.5, width: 1.0, height: 2.0, offsetY: 0 }],
        back: isLarge
          ? [{ type: 'window', position: 0.5, width: 2.0, height: 2.0, offsetY: 0 }]
          : [{ type: 'window', position: 0.5, width: 2.0, height: 2.0, offsetY: 0 }],
        left: [],
        right: [],
      };
      break;

    case 'umkleide':
      raw = {
        front: [{ type: 'door', position: 0.5, width: 1.0, height: 2.0, offsetY: 0 }],
        back: [],
        left: [],
        right: [],
      };
      break;

    case 'sanitaer':
      raw = {
        front: [{ type: 'door', position: 0.5, width: 1.0, height: 2.0, offsetY: 0 }],
        back: [],
        left: [],
        right: [{ type: 'window', position: 0.5, width: 0.5, height: 0.4, offsetY: 1.6 }],
      };
      break;

    case 'technik':
      raw = {
        front: [],
        back: [],
        left: [{ type: 'door', position: 0.5, width: 1.0, height: 2.0, offsetY: 0 }],
        right: [],
      };
      break;

    default:
      raw = emptyWallConfig();
      break;
  }

  // Clamp opening widths to fit within actual wall dimensions
  return clampConfig(raw, widthM, depthM);
}
