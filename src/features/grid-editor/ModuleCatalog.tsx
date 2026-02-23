import { MODULE_LIST } from '../../data/module-types';
import { formatPrice } from '../../data/pricing';
import { GRID_CELL_SIZE } from '../../types/grid';
import type { ModuleType } from '../../types/modules';
import { DraggableCatalogItem } from './DraggableCatalogItem';
import { t } from '../../utils/i18n';

interface SelectedCatalogItem {
  type: ModuleType;
  width: number;
  height: number;
}

interface ModuleCatalogProps {
  selection: SelectedCatalogItem | null;
  onSelect: (item: SelectedCatalogItem | null) => void;
}

export function ModuleCatalog({ selection, onSelect }: ModuleCatalogProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900">{t('editor.catalog.title')}</h3>
      {selection && (
        <p className="mt-1 text-sm text-nature-600 font-medium">
          {t('editor.catalog.select')}
        </p>
      )}
      {!selection && (
        <p className="mt-1 text-sm text-gray-400">
          {t('editor.drag_hint')}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {MODULE_LIST.map((def) => (
          <div key={def.type} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: def.color }}
              />
              <span className="font-medium text-gray-900">{def.name}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{def.description}</p>

            <div className="flex flex-wrap gap-1.5">
              {def.availableSizes.map(([w, h]) => {
                const isSelected =
                  selection?.type === def.type &&
                  selection.width === w &&
                  selection.height === h;
                const sizeLabel = `${(w * GRID_CELL_SIZE).toFixed(1)}×${(h * GRID_CELL_SIZE).toFixed(1)}m`;
                const price = w === 2 && h === 2 ? def.basePrice * 1.7 : def.basePrice;

                return (
                  <DraggableCatalogItem
                    key={`${w}x${h}`}
                    type={def.type as ModuleType}
                    width={w}
                    height={h}
                    isSelected={isSelected}
                    onClick={() =>
                      onSelect(
                        isSelected ? null : { type: def.type as ModuleType, width: w, height: h },
                      )
                    }
                  >
                    {sizeLabel} · {formatPrice(Math.round(price))}
                  </DraggableCatalogItem>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
