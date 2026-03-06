import { MODULE_DEFINITIONS } from '../../data/module-types';
import { GRID_CELL_SIZE } from '../../types/grid';
import type { ModuleType } from '../../types/modules';

interface DragGhostPreviewProps {
  type: ModuleType;
  width: number;
  height: number;
}

export function DragGhostPreview({ type, width, height }: DragGhostPreviewProps) {
  const def = MODULE_DEFINITIONS[type];
  const pixelW = width * GRID_CELL_SIZE * 40; // 40px per meter
  const pixelH = height * GRID_CELL_SIZE * 40;
  const sizeLabel = `${(width * GRID_CELL_SIZE).toFixed(1)}×${(height * GRID_CELL_SIZE).toFixed(1)}m`;

  return (
    <div
      style={{
        width: pixelW,
        height: pixelH,
        backgroundColor: def?.color ?? '#9ca3af',
        opacity: 0.8,
      }}
      className="flex flex-col items-center justify-center rounded-lg text-white shadow-lg"
    >
      <span className="text-xs font-semibold">{def?.name ?? type}</span>
      <span className="text-[10px] opacity-70">{sizeLabel}</span>
    </div>
  );
}
