import { useState } from 'react';
import { GRID_CELL_SIZE } from '../../types/grid';
import type { ModuleType } from '../../types/modules';
import { DraggableCatalogItem } from './DraggableCatalogItem';

interface SelectedCatalogItem {
  type: ModuleType;
  width: number;
  height: number;
}

interface ModuleCatalogProps {
  selection: SelectedCatalogItem | null;
  onSelect: (item: SelectedCatalogItem | null) => void;
}

const BLOCK_COLOR = '#d97706';

const BLOCKS: { w: number; h: number }[] = [
  { w: 6, h: 3 },
  { w: 3, h: 6 },
  { w: 6, h: 6 },
];

/** Snap a meter value to the nearest valid grid cell multiple */
function snapToGrid(meters: number): number {
  return Math.max(GRID_CELL_SIZE, Math.round(meters / GRID_CELL_SIZE) * GRID_CELL_SIZE);
}

export function ModuleCatalog({ selection, onSelect }: ModuleCatalogProps) {
  // State in meters (step = GRID_CELL_SIZE = 0.5m)
  const [customWm, setCustomWm] = useState(4.5);
  const [customHm, setCustomHm] = useState(3.0);

  // Convert meters → grid cells for internal use
  const customW = Math.round(customWm / GRID_CELL_SIZE);
  const customH = Math.round(customHm / GRID_CELL_SIZE);

  const isCustomSelected =
    selection != null &&
    !BLOCKS.some((b) => b.w === selection.width && b.h === selection.height) &&
    selection.width === customW &&
    selection.height === customH;

  const handleMeterInput = (
    value: string,
    setter: (v: number) => void,
  ) => {
    const v = Number(value);
    if (!isNaN(v) && v >= GRID_CELL_SIZE && v <= 9) {
      setter(snapToGrid(v));
    }
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900">Modulblöcke</h3>
      <p className="mt-1 text-xs text-gray-400">
        Klicken = platzieren · Ziehen = gezielt platzieren
      </p>

      <div className="mt-2 flex gap-2">
        {BLOCKS.map(({ w, h }) => {
          const isSelected =
            selection?.width === w && selection?.height === h;
          const sizeLabel = `${(w * GRID_CELL_SIZE).toFixed(1)}×${(h * GRID_CELL_SIZE).toFixed(1)}m`;
          const isVertical = w < h;
          const isLarge = w === 6 && h === 6;

          return (
            <DraggableCatalogItem
              key={`${w}x${h}`}
              type={'living' as ModuleType}
              width={w}
              height={h}
              isSelected={isSelected}
              color={BLOCK_COLOR}
              onClick={() =>
                onSelect(
                  isSelected ? null : { type: 'living' as ModuleType, width: w, height: h },
                )
              }
            >
              {/* Proportional shape indicator */}
              <div className="flex items-center justify-center mb-1">
                <div
                  className="rounded-[2px] transition-colors"
                  style={{
                    width: isLarge ? 24 : isVertical ? 12 : 24,
                    height: isLarge ? 24 : isVertical ? 24 : 12,
                    backgroundColor: isSelected ? BLOCK_COLOR : `${BLOCK_COLOR}40`,
                  }}
                />
              </div>
              <span className="block text-[11px] font-medium leading-tight">{sizeLabel}</span>
            </DraggableCatalogItem>
          );
        })}
      </div>

      {/* Custom size block – inputs in meters */}
      <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-2.5">
        <p className="text-xs font-medium text-gray-600 mb-2">Eigene Größe</p>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-gray-500 shrink-0">B:</label>
          <input
            type="number"
            min={GRID_CELL_SIZE}
            max={9}
            step={GRID_CELL_SIZE}
            value={customWm}
            onChange={(e) => handleMeterInput(e.target.value, setCustomWm)}
            className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-center focus:border-amber-400 focus:outline-none"
          />
          <span className="text-[10px] text-gray-400">m</span>
          <label className="text-[11px] text-gray-500 shrink-0 ml-2">T:</label>
          <input
            type="number"
            min={GRID_CELL_SIZE}
            max={9}
            step={GRID_CELL_SIZE}
            value={customHm}
            onChange={(e) => handleMeterInput(e.target.value, setCustomHm)}
            className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-center focus:border-amber-400 focus:outline-none"
          />
          <span className="text-[10px] text-gray-400">m</span>
        </div>
        <button
          onClick={() => {
            onSelect(
              isCustomSelected
                ? null
                : { type: 'living' as ModuleType, width: customW, height: customH },
            );
          }}
          className={`mt-2 w-full rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            isCustomSelected
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {customWm.toFixed(1)} × {customHm.toFixed(1)}m platzieren
        </button>
      </div>

      <p className="mt-2 text-[10px] text-gray-400 leading-snug">
        Nutzbar als: Saunakern, Technikraum, Ruheeinheit, Umkleide, Sanitär, Living/Office
      </p>
    </div>
  );
}
