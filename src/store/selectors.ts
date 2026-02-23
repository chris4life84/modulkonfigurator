import type { PlacedModule } from '../types/grid';
import { calculateTotalPrice } from '../data/pricing';
import { getBoundingBox } from '../utils/grid';
import { GRID_CELL_SIZE } from '../types/grid';
import { MODULE_DEFINITIONS } from '../data/module-types';

export function selectTotalPrice(modules: PlacedModule[]): number {
  return calculateTotalPrice(modules);
}

export function selectTotalDimensions(modules: PlacedModule[]): string {
  const bbox = getBoundingBox(modules);
  return `${bbox.widthM.toFixed(1)} × ${bbox.heightM.toFixed(1)} m`;
}

export function selectModuleSummary(module: PlacedModule): {
  name: string;
  dimensions: string;
  type: string;
} {
  const def = MODULE_DEFINITIONS[module.type];
  const w = module.width * GRID_CELL_SIZE;
  const h = module.height * GRID_CELL_SIZE;
  return {
    name: def?.name ?? module.type,
    dimensions: `${w.toFixed(1)} × ${h.toFixed(1)} m`,
    type: module.type,
  };
}
