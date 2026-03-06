import type { ModuleType } from './modules';
import type { WallConfig } from './walls';

export interface GridPosition {
  x: number;
  y: number;
}

export interface PlacedModule {
  id: string;
  type: ModuleType;
  gridX: number;
  gridY: number;
  /** Width in grid cells (e.g. 3 = 1.5m, 6 = 3.0m at 0.5m cell size) */
  width: number;
  /** Height in grid cells (e.g. 3 = 1.5m, 6 = 3.0m at 0.5m cell size) */
  height: number;
  options: Record<string, string | boolean>;
  /** Wall configuration for doors/windows. If undefined, defaults are used. */
  walls?: WallConfig;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Total width in meters */
  widthM: number;
  /** Total height in meters */
  heightM: number;
}

/** Grid cell size in meters (0.5m = placement granularity) */
export const GRID_CELL_SIZE = 0.5;
