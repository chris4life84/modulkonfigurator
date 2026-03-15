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

type Category = 'haus' | 'pergola';

const HAUS_COLOR = '#d97706';
const PERGOLA_COLOR = '#6B7280';

const HAUS_BLOCKS: { w: number; h: number }[] = [
  { w: 6, h: 3 },
  { w: 3, h: 6 },
  { w: 6, h: 6 },
];

const HAUS_BLOCKS_LARGE: { w: number; h: number }[] = [
  { w: 12, h: 6 },
  { w: 6, h: 12 },
  { w: 12, h: 12 },
];

// Generate all pergola blocks from 2.0m to 6.0m (0.5m steps), width >= height
const PERGOLA_BLOCKS: { w: number; h: number }[] = (() => {
  const blocks: { w: number; h: number }[] = [];
  for (let wm = 2.0; wm <= 6.0; wm += 0.5) {
    for (let hm = 2.0; hm <= wm + 0.01; hm += 0.5) {
      blocks.push({ w: Math.round(wm / GRID_CELL_SIZE), h: Math.round(hm / GRID_CELL_SIZE) });
    }
  }
  return blocks;
})();

/** Snap a meter value to the nearest valid grid cell multiple */
function snapToGrid(meters: number): number {
  return Math.max(GRID_CELL_SIZE, Math.round(meters / GRID_CELL_SIZE) * GRID_CELL_SIZE);
}

export function ModuleCatalog({ selection, onSelect }: ModuleCatalogProps) {
  const [category, setCategory] = useState<Category>('haus');
  const [customWm, setCustomWm] = useState(4.5);
  const [customHm, setCustomHm] = useState(3.0);

  const customW = Math.round(customWm / GRID_CELL_SIZE);
  const customH = Math.round(customHm / GRID_CELL_SIZE);

  const blocks = category === 'haus' ? HAUS_BLOCKS : PERGOLA_BLOCKS;
  const blocksLarge = category === 'haus' ? HAUS_BLOCKS_LARGE : [];
  const allBlocks = category === 'haus' ? [...HAUS_BLOCKS, ...HAUS_BLOCKS_LARGE] : PERGOLA_BLOCKS;
  const blockColor = category === 'haus' ? HAUS_COLOR : PERGOLA_COLOR;
  const blockType: ModuleType = category === 'haus' ? 'living' : 'pergola';

  const isCustomSelected =
    selection != null &&
    !allBlocks.some((b) => b.w === selection.width && b.h === selection.height) &&
    selection.width === customW &&
    selection.height === customH;

  const handleMeterInput = (
    value: string,
    setter: (v: number) => void,
  ) => {
    const v = Number(value);
    const minM = category === 'pergola' ? 2.0 : GRID_CELL_SIZE;
    const maxM = category === 'pergola' ? 6.0 : 9;
    if (!isNaN(v) && v >= minM && v <= maxM) {
      setter(snapToGrid(v));
    }
  };

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    onSelect(null);
    if (cat === 'pergola') {
      setCustomWm(3.0);
      setCustomHm(3.0);
    } else {
      setCustomWm(4.5);
      setCustomHm(3.0);
    }
  };

  return (
    <div>
      {/* Category tabs */}
      <div className="flex rounded-lg bg-gray-100 p-0.5 mb-3">
        <button
          type="button"
          onClick={() => handleCategoryChange('haus')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            category === 'haus'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Modulhaus
        </button>
        <button
          type="button"
          onClick={() => handleCategoryChange('pergola')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            category === 'pergola'
              ? 'bg-white text-gray-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pergola
        </button>
      </div>

      <h3 className="text-base font-semibold text-gray-900">
        {category === 'haus' ? 'Modulblöcke' : 'Pergola-Blöcke'}
      </h3>
      <div className="mt-1.5 rounded-md bg-gray-50 border border-gray-100 px-2.5 py-2 space-y-1">
        <div className="flex items-start gap-1.5">
          <span className="text-[11px] text-gray-400 shrink-0 mt-px">☝️</span>
          <span className="text-[11px] text-gray-500"><strong className="text-gray-600">Klicken</strong> – Block wählen, dann auf grüne Fläche klicken</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-[11px] text-gray-400 shrink-0 mt-px">✋</span>
          <span className="text-[11px] text-gray-500"><strong className="text-gray-600">Ziehen</strong> – Block direkt auf die gewünschte Position ziehen</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-[11px] text-gray-400 shrink-0 mt-px">🔄</span>
          <span className="text-[11px] text-gray-500"><strong className="text-gray-600">Nach Platzierung</strong> – Modul anklicken zum Verschieben, Drehen & Konfigurieren</span>
        </div>
      </div>

      {category === 'pergola' ? (
        /* Compact grid for 28 pergola templates */
        <div className="mt-2 flex flex-wrap gap-1.5">
          {blocks.map(({ w, h }) => {
            const isSelected =
              selection?.width === w && selection?.height === h && selection?.type === blockType;
            const wm = (w * GRID_CELL_SIZE).toFixed(1);
            const hm = (h * GRID_CELL_SIZE).toFixed(1);

            return (
              <DraggableCatalogItem
                key={`${w}x${h}`}
                type={blockType}
                width={w}
                height={h}
                isSelected={isSelected}
                color={blockColor}
                compact
                onClick={() =>
                  onSelect(
                    isSelected ? null : { type: blockType, width: w, height: h },
                  )
                }
              >
                <span className="block text-[10px] font-medium leading-tight whitespace-nowrap">
                  {wm}×{hm}
                </span>
              </DraggableCatalogItem>
            );
          })}
        </div>
      ) : (
        /* Standard layout for house blocks */
        <div className="mt-2 flex gap-2">
          {blocks.map(({ w, h }) => {
            const isSelected =
              selection?.width === w && selection?.height === h && selection?.type === blockType;
            const sizeLabel = `${(w * GRID_CELL_SIZE).toFixed(1)}×${(h * GRID_CELL_SIZE).toFixed(1)}m`;
            const isVertical = w < h;
            const isLarge = w >= 6 && h >= 6;

            return (
              <DraggableCatalogItem
                key={`${w}x${h}`}
                type={blockType}
                width={w}
                height={h}
                isSelected={isSelected}
                color={blockColor}
                onClick={() =>
                  onSelect(
                    isSelected ? null : { type: blockType, width: w, height: h },
                  )
                }
              >
                <div className="flex items-center justify-center mb-1">
                  <div
                    className="rounded-[2px] transition-colors"
                    style={{
                      width: isLarge ? 24 : isVertical ? 12 : 24,
                      height: isLarge ? 24 : isVertical ? 24 : 12,
                      backgroundColor: isSelected ? blockColor : `${blockColor}40`,
                    }}
                  />
                </div>
                <span className="block text-[11px] font-medium leading-tight">{sizeLabel}</span>
              </DraggableCatalogItem>
            );
          })}
        </div>
      )}

      {/* Large house blocks (double size) */}
      {category === 'haus' && blocksLarge.length > 0 && (
        <>
          <p className="mt-3 mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Große Module</p>
          <div className="flex gap-2">
            {blocksLarge.map(({ w, h }) => {
              const isSelected =
                selection?.width === w && selection?.height === h && selection?.type === blockType;
              const sizeLabel = `${(w * GRID_CELL_SIZE).toFixed(1)}×${(h * GRID_CELL_SIZE).toFixed(1)}m`;
              const isVertical = w < h;
              const isLarge = w >= 6 && h >= 6;

              return (
                <DraggableCatalogItem
                  key={`${w}x${h}`}
                  type={blockType}
                  width={w}
                  height={h}
                  isSelected={isSelected}
                  color={blockColor}
                  onClick={() =>
                    onSelect(
                      isSelected ? null : { type: blockType, width: w, height: h },
                    )
                  }
                >
                  <div className="flex items-center justify-center mb-1">
                    <div
                      className="rounded-[2px] transition-colors"
                      style={{
                        width: isLarge ? 28 : isVertical ? 14 : 28,
                        height: isLarge ? 28 : isVertical ? 28 : 14,
                        backgroundColor: isSelected ? blockColor : `${blockColor}40`,
                      }}
                    />
                  </div>
                  <span className="block text-[11px] font-medium leading-tight">{sizeLabel}</span>
                </DraggableCatalogItem>
              );
            })}
          </div>
        </>
      )}

      {/* Custom size block */}
      <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-2.5">
        <p className="text-xs font-medium text-gray-600 mb-2">Eigene Größe</p>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-gray-500 shrink-0">B:</label>
          <input
            type="number"
            min={category === 'pergola' ? 2.0 : GRID_CELL_SIZE}
            max={category === 'pergola' ? 6.0 : 9}
            step={GRID_CELL_SIZE}
            value={customWm}
            onChange={(e) => handleMeterInput(e.target.value, setCustomWm)}
            className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-center focus:border-amber-400 focus:outline-none"
          />
          <span className="text-[10px] text-gray-400">m</span>
          <label className="text-[11px] text-gray-500 shrink-0 ml-2">T:</label>
          <input
            type="number"
            min={category === 'pergola' ? 2.0 : GRID_CELL_SIZE}
            max={category === 'pergola' ? 6.0 : 9}
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
                : { type: blockType, width: customW, height: customH },
            );
          }}
          className={`mt-2 w-full rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            isCustomSelected
              ? category === 'haus'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {customWm.toFixed(1)} × {customHm.toFixed(1)}m platzieren
        </button>
        {category === 'pergola' && (
          <a
            href="https://www.modul-garten.de/pergolakonfigurator/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
          >
            Modul-Garten.de – Neues Layout Demo ↗
          </a>
        )}
      </div>

      <p className="mt-2 text-[10px] text-gray-400 leading-snug">
        {category === 'haus'
          ? 'Nutzbar als: Saunakern, Technikraum, Ruheeinheit, Umkleide, Sanitär, Living/Office'
          : 'Aluminium-Pergola mit Lamellen-, Glas- oder EPDM-Dach. Direkt an Modulhäuser anschließbar.'
        }
      </p>
    </div>
  );
}
