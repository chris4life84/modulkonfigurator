import type { PlacedModule, GridPosition, BoundingBox } from '../types/grid';
import { GRID_CELL_SIZE } from '../types/grid';

/** Get all cells occupied by a module */
export function getOccupiedCells(module: PlacedModule | Omit<PlacedModule, 'id'>): GridPosition[] {
  const cells: GridPosition[] = [];
  for (let dx = 0; dx < module.width; dx++) {
    for (let dy = 0; dy < module.height; dy++) {
      cells.push({ x: module.gridX + dx, y: module.gridY + dy });
    }
  }
  return cells;
}

/** Get all cells occupied by all placed modules */
function getAllOccupiedCells(modules: PlacedModule[]): Set<string> {
  const occupied = new Set<string>();
  for (const m of modules) {
    for (const cell of getOccupiedCells(m)) {
      occupied.add(`${cell.x},${cell.y}`);
    }
  }
  return occupied;
}

/** Check if a position overlaps with existing modules */
export function overlaps(
  modules: PlacedModule[],
  gridX: number,
  gridY: number,
  width: number,
  height: number,
): boolean {
  const occupied = getAllOccupiedCells(modules);
  for (let dx = 0; dx < width; dx++) {
    for (let dy = 0; dy < height; dy++) {
      if (occupied.has(`${gridX + dx},${gridY + dy}`)) return true;
    }
  }
  return false;
}

/** Check if a new module at given position shares at least one edge with existing modules */
export function sharesEdge(
  modules: PlacedModule[],
  gridX: number,
  gridY: number,
  width: number,
  height: number,
): boolean {
  const occupied = getAllOccupiedCells(modules);
  for (let dx = 0; dx < width; dx++) {
    for (let dy = 0; dy < height; dy++) {
      const cx = gridX + dx;
      const cy = gridY + dy;
      // Check 4 neighbors
      if (
        occupied.has(`${cx - 1},${cy}`) ||
        occupied.has(`${cx + 1},${cy}`) ||
        occupied.has(`${cx},${cy - 1}`) ||
        occupied.has(`${cx},${cy + 1}`)
      ) {
        return true;
      }
    }
  }
  return false;
}

/** Get all valid positions where a new module of given size can be placed */
export function getValidPlacements(
  modules: PlacedModule[],
  width: number,
  height: number,
): GridPosition[] {
  if (modules.length === 0) {
    return [{ x: 0, y: 0 }];
  }

  const bbox = getBoundingBox(modules);
  const positions: GridPosition[] = [];

  // Search area: bounding box expanded by max module dimension
  const searchPad = Math.max(width, height) + 1;
  for (let x = bbox.minX - searchPad; x <= bbox.maxX + searchPad; x++) {
    for (let y = bbox.minY - searchPad; y <= bbox.maxY + searchPad; y++) {
      if (!overlaps(modules, x, y, width, height) && sharesEdge(modules, x, y, width, height)) {
        positions.push({ x, y });
      }
    }
  }

  return positions;
}

/** Helper: check if a module is a freistehend pergola (independent from connected group) */
function isFreistehendPergola(m: PlacedModule): boolean {
  return m.type === 'pergola' && m.options.freistehend === true;
}

/** Check if all modules form a connected group using BFS */
export function isConnected(modules: PlacedModule[]): boolean {
  // Freistehend pergolas are independent — exclude from connectivity check
  const connectedModules = modules.filter((m) => !isFreistehendPergola(m));
  if (connectedModules.length <= 1) return true;

  // Build adjacency: which module indices touch which
  const adjacency: Set<number>[] = connectedModules.map(() => new Set());

  for (let i = 0; i < connectedModules.length; i++) {
    const cellsI = getOccupiedCells(connectedModules[i]);
    for (let j = i + 1; j < connectedModules.length; j++) {
      const cellsJ = getOccupiedCells(connectedModules[j]);
      if (modulesShareEdge(cellsI, cellsJ)) {
        adjacency[i].add(j);
        adjacency[j].add(i);
      }
    }
  }

  // BFS from module 0
  const visited = new Set<number>();
  const queue = [0];
  visited.add(0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === connectedModules.length;
}

function modulesShareEdge(cellsA: GridPosition[], cellsB: GridPosition[]): boolean {
  const setB = new Set(cellsB.map((c) => `${c.x},${c.y}`));
  for (const a of cellsA) {
    if (
      setB.has(`${a.x - 1},${a.y}`) ||
      setB.has(`${a.x + 1},${a.y}`) ||
      setB.has(`${a.x},${a.y - 1}`) ||
      setB.has(`${a.x},${a.y + 1}`)
    ) {
      return true;
    }
  }
  return false;
}

/** Get valid positions for moving an existing module (excludes self from collision) */
export function getValidMovePlacements(
  modules: PlacedModule[],
  moduleId: string,
  width: number,
  height: number,
  skipSharesEdge = false,
): GridPosition[] {
  const others = modules.filter((m) => m.id !== moduleId);
  if (others.length === 0) {
    // Only module - can go anywhere
    const bbox = getBoundingBox(modules);
    const pad = Math.max(width, height) + 2;
    const positions: GridPosition[] = [];
    for (let x = bbox.minX - pad; x <= bbox.maxX + pad; x++) {
      for (let y = bbox.minY - pad; y <= bbox.maxY + pad; y++) {
        positions.push({ x, y });
      }
    }
    return positions;
  }

  const bbox = getBoundingBox(modules);
  const positions: GridPosition[] = [];
  // Larger search area for freistehend (can be placed further from building)
  const searchPad = Math.max(width, height) + (skipSharesEdge ? 5 : 1);

  for (let x = bbox.minX - searchPad; x <= bbox.maxX + searchPad; x++) {
    for (let y = bbox.minY - searchPad; y <= bbox.maxY + searchPad; y++) {
      const noOverlap = !overlaps(others, x, y, width, height);
      const edgeOk = skipSharesEdge || sharesEdge(others, x, y, width, height);
      if (noOverlap && edgeOk) {
        positions.push({ x, y });
      }
    }
  }

  return positions;
}

/** Check if a module can be rotated in place (no overlap, stays connected) */
export function canRotate(modules: PlacedModule[], moduleId: string): boolean {
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod || mod.width === mod.height) return false;

  const newW = mod.height;
  const newH = mod.width;
  const others = modules.filter((m) => m.id !== moduleId);

  // Check overlap with rotated dimensions at same position
  if (overlaps(others, mod.gridX, mod.gridY, newW, newH)) return false;

  // Freistehend pergolas don't need to share an edge
  if (!isFreistehendPergola(mod) && others.length > 0 && !sharesEdge(others, mod.gridX, mod.gridY, newW, newH)) return false;

  const simulated = others.map((m) => ({ ...m }));
  simulated.push({ ...mod, width: newW, height: newH });
  return isConnected(simulated);
}

/** Check if a module can be resized to new dimensions (no overlap, stays connected) */
export function canResize(
  modules: PlacedModule[],
  moduleId: string,
  newWidth: number,
  newHeight: number,
): boolean {
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) return false;
  if (mod.width === newWidth && mod.height === newHeight) return true; // no change

  const others = modules.filter((m) => m.id !== moduleId);

  // Check overlap with new dimensions at same position
  if (overlaps(others, mod.gridX, mod.gridY, newWidth, newHeight)) return false;

  // Freistehend pergolas don't need to share an edge
  if (!isFreistehendPergola(mod) && others.length > 0 && !sharesEdge(others, mod.gridX, mod.gridY, newWidth, newHeight)) return false;

  // Check full connectivity
  const simulated = others.map((m) => ({ ...m }));
  simulated.push({ ...mod, width: newWidth, height: newHeight });
  return isConnected(simulated);
}

/** Check if removing a module would break connectivity */
export function canRemove(modules: PlacedModule[], moduleId: string): boolean {
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) return false;

  // Freistehend pergola: always removable (not part of connected group)
  if (isFreistehendPergola(mod)) return true;

  const remaining = modules.filter((m) => m.id !== moduleId);
  if (remaining.length === 0) return false; // Cannot remove last module
  return isConnected(remaining);
}

/** Convert browser pixel coordinates to SVG grid coordinates */
export function screenToSvgGrid(
  svgElement: SVGSVGElement,
  clientX: number,
  clientY: number,
): GridPosition {
  const ctm = svgElement.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const inv = ctm.inverse();
  return {
    x: Math.round(inv.a * clientX + inv.c * clientY + inv.e),
    y: Math.round(inv.b * clientX + inv.d * clientY + inv.f),
  };
}

/** Find the closest valid placement to a target position (Manhattan distance) */
export function findNearestValidPlacement(
  validPlacements: GridPosition[],
  targetX: number,
  targetY: number,
  maxDistance: number,
): GridPosition | null {
  let best: GridPosition | null = null;
  let bestDist = Infinity;

  for (const pos of validPlacements) {
    const dist = Math.abs(pos.x - targetX) + Math.abs(pos.y - targetY);
    if (dist < bestDist && dist <= maxDistance) {
      bestDist = dist;
      best = pos;
    }
  }

  return best;
}

/** Check if a specific position is valid for moving a module (lightweight single-position check) */
export function isValidMovePosition(
  modules: PlacedModule[],
  moduleId: string,
  newX: number,
  newY: number,
): boolean {
  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) return false;
  const others = modules.filter((m) => m.id !== moduleId);
  if (others.length === 0) return true;
  if (overlaps(others, newX, newY, mod.width, mod.height)) return false;
  if (!sharesEdge(others, newX, newY, mod.width, mod.height)) return false;
  return true;
}

/** Get bounding box of all placed modules */
export function getBoundingBox(modules: PlacedModule[]): BoundingBox {
  if (modules.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, widthM: 0, heightM: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const m of modules) {
    minX = Math.min(minX, m.gridX);
    minY = Math.min(minY, m.gridY);
    maxX = Math.max(maxX, m.gridX + m.width);
    maxY = Math.max(maxY, m.gridY + m.height);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    widthM: (maxX - minX) * GRID_CELL_SIZE,
    heightM: (maxY - minY) * GRID_CELL_SIZE,
  };
}
