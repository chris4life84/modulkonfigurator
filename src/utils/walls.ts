import type { PlacedModule } from '../types/grid';
import type { WallSide } from '../types/walls';

/**
 * Get all grid cells occupied by a module.
 */
export function getModuleCells(m: PlacedModule): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let dx = 0; dx < m.width; dx++) {
    for (let dy = 0; dy < m.height; dy++) {
      cells.push({ x: m.gridX + dx, y: m.gridY + dy });
    }
  }
  return cells;
}

/**
 * Detect which walls of a module are shared (adjacent) with other modules.
 * Returns a simple Set – used by WallConfigurator UI.
 */
export function getSharedWalls(module: PlacedModule, allModules: PlacedModule[]): Set<WallSide> {
  const segments = getSharedWallSegments(module, allModules);
  const shared = new Set<WallSide>();
  if (segments.front.some(Boolean)) shared.add('front');
  if (segments.back.some(Boolean)) shared.add('back');
  if (segments.left.some(Boolean)) shared.add('left');
  if (segments.right.some(Boolean)) shared.add('right');
  return shared;
}

/**
 * Per-cell shared wall detection.
 * For each wall side, returns a boolean array (one entry per cell along that edge)
 * indicating whether that cell's edge is adjacent to another module.
 *
 * front/back arrays have length = module.width  (cells along X)
 * left/right arrays have length = module.height (cells along Y)
 */
export interface SharedWallSegments {
  front: boolean[];
  back: boolean[];
  left: boolean[];
  right: boolean[];
}

export function getSharedWallSegments(
  module: PlacedModule,
  allModules: PlacedModule[],
): SharedWallSegments {
  const result: SharedWallSegments = {
    front: new Array(module.width).fill(false),
    back: new Array(module.width).fill(false),
    left: new Array(module.height).fill(false),
    right: new Array(module.height).fill(false),
  };

  // Build set of all cells occupied by OTHER modules.
  // Enclosed modules (houses) ignore pergola neighbors so their walls stay visible.
  const isEnclosed = module.type !== 'pergola';
  const occupied = new Set<string>();
  for (const other of allModules) {
    if (other.id === module.id) continue;
    if (isEnclosed && other.type === 'pergola') continue;
    for (let dx = 0; dx < other.width; dx++) {
      for (let dy = 0; dy < other.height; dy++) {
        occupied.add(`${other.gridX + dx},${other.gridY + dy}`);
      }
    }
  }

  // Front edge: cells just beyond y = gridY + height (facing +Z)
  for (let dx = 0; dx < module.width; dx++) {
    const x = module.gridX + dx;
    const y = module.gridY + module.height; // one beyond front edge
    if (occupied.has(`${x},${y}`)) result.front[dx] = true;
  }

  // Back edge: cells just before y = gridY (facing -Z)
  for (let dx = 0; dx < module.width; dx++) {
    const x = module.gridX + dx;
    const y = module.gridY - 1;
    if (occupied.has(`${x},${y}`)) result.back[dx] = true;
  }

  // Left edge: cells just before x = gridX (facing -X)
  for (let dy = 0; dy < module.height; dy++) {
    const x = module.gridX - 1;
    const y = module.gridY + dy;
    if (occupied.has(`${x},${y}`)) result.left[dy] = true;
  }

  // Right edge: cells just beyond x = gridX + width (facing +X)
  for (let dy = 0; dy < module.height; dy++) {
    const x = module.gridX + module.width;
    const y = module.gridY + dy;
    if (occupied.has(`${x},${y}`)) result.right[dy] = true;
  }

  return result;
}

/**
 * Group consecutive non-shared cells into wall segment ranges.
 * Returns ranges where walls SHOULD be rendered.
 */
export function getWallRanges(shared: boolean[]): { start: number; count: number }[] {
  const ranges: { start: number; count: number }[] = [];
  let i = 0;
  while (i < shared.length) {
    if (!shared[i]) {
      const start = i;
      while (i < shared.length && !shared[i]) i++;
      ranges.push({ start, count: i - start });
    } else {
      i++;
    }
  }
  return ranges;
}
