import type { ModuleType } from './modules';

export interface GridPosition {
  x: number;
  y: number;
}

export interface PlacedModule {
  id: string;
  type: ModuleType;
  gridX: number;
  gridY: number;
  /** Width in grid cells (1 or 2) */
  width: number;
  /** Height in grid cells (1 or 2) */
  height: number;
  options: Record<string, string | boolean>;
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

/** Grid cell size in meters */
export const GRID_CELL_SIZE = 1.5;
