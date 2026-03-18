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

// Only two base elements for Modulhaus
const HAUS_BLOCKS: { w: number; h: number }[] = [
  { w: 6, h: 3 },   // 3.0 × 1.5 m
  { w: 3, h: 6 },   // 1.5 × 3.0 m
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

export function ModuleCatalog({ selection, onSelect }: ModuleCatalogProps) {
  const [category, setCategory] = useState<Category>('haus');

  const blocks = category === 'haus' ? HAUS_BLOCKS : PERGOLA_BLOCKS;
  const blockColor = category === 'haus' ? HAUS_COLOR : PERGOLA_COLOR;
  const blockType: ModuleType = category === 'haus' ? 'living' : 'pergola';

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    onSelect(null);
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

      {/* Pergola custom size — only for pergola */}

      {/* Pergolakonfigurator CTA */}
      {category === 'pergola' && (
        <div className="mt-4 rounded-xl border-2 border-wood-300 bg-gradient-to-b from-wood-50 to-white p-4 text-center">
          <p className="text-xs text-gray-500 leading-snug mb-3">
            Keine passende Größe? Gestalten Sie Ihre Pergola individuell mit Lamellen-, Glas- oder EPDM-Dach.
          </p>
          <a
            href="https://www.modul-garten.de/pergolakonfigurator/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-wood-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-wood-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
            </svg>
            Pergolakonfigurator öffnen
          </a>
        </div>
      )}

      {category === 'haus' && (
        <p className="mt-2 text-[10px] text-gray-400 leading-snug">
          Nutzbar als: Saunakern, Technikraum, Ruheeinheit, Umkleide, Sanitär, Living/Office
        </p>
      )}
    </div>
  );
}
