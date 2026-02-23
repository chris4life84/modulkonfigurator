import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useConfigStore } from '../../store/useConfigStore';
import { VisualizationContainer } from '../visualization/VisualizationContainer';
import { ModuleCatalog } from './ModuleCatalog';
import { ModuleActions } from './ModuleActions';
import { DragGhostPreview } from './DragGhostPreview';
import { getValidPlacements } from '../../utils/grid';
import { selectTotalPrice } from '../../store/selectors';
import { formatPrice } from '../../data/pricing';
import { useViewMode } from '../../hooks/useViewMode';
import type { ModuleType } from '../../types/modules';
import type { GridPosition } from '../../types/grid';
import { t } from '../../utils/i18n';

interface SelectedCatalogItem {
  type: ModuleType;
  width: number;
  height: number;
}

export function GridEditorStep() {
  const { modules, addModule, removeModule, rotateModule } = useConfigStore();
  const { setViewMode } = useViewMode();
  const [catalogSelection, setCatalogSelection] = useState<SelectedCatalogItem | null>(null);
  const [dragItem, setDragItem] = useState<SelectedCatalogItem | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const totalPrice = selectTotalPrice(modules);

  // Use either drag item or catalog click selection for placement highlights
  const activeItem = dragItem ?? catalogSelection;

  const validPlacements = useMemo(() => {
    if (!activeItem) return [];
    return getValidPlacements(modules, activeItem.width, activeItem.height);
  }, [modules, activeItem]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleCellClick = (pos: GridPosition) => {
    if (!activeItem) return;
    addModule({
      type: activeItem.type,
      gridX: pos.x,
      gridY: pos.y,
      width: activeItem.width,
      height: activeItem.height,
      options: {},
    });
  };

  const handleModuleClick = (id: string) => {
    if (catalogSelection) {
      setCatalogSelection(null);
    }
    setSelectedModuleId(id === selectedModuleId ? null : id);
  };

  const handleCatalogSelect = (item: SelectedCatalogItem | null) => {
    setCatalogSelection(item);
    setSelectedModuleId(null);
    if (item) {
      setViewMode('2d'); // Auto-switch to 2D for placement
    }
  };

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as SelectedCatalogItem | undefined;
      if (data) {
        setDragItem(data);
        setViewMode('2d'); // Force 2D for drag placement
        setCatalogSelection(null);
        setSelectedModuleId(null);
      }
    },
    [setViewMode],
  );

  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      // Drop is handled by clicking on valid placements in 2D mode
      // After drag ends, keep the selection active so user can click-place
      if (dragItem) {
        setCatalogSelection(dragItem);
      }
      setDragItem(null);
    },
    [dragItem],
  );

  const handleDragCancel = useCallback(() => {
    setDragItem(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Left: Visualization */}
        <div className="flex-1">
          <div
            className="rounded-xl border border-gray-200 bg-gray-50 p-2"
            style={{ minHeight: '350px', height: '400px' }}
          >
            <VisualizationContainer
              modules={modules}
              validPlacements={validPlacements}
              ghostModule={activeItem}
              selectedModuleId={selectedModuleId}
              onCellClick={handleCellClick}
              onModuleClick={handleModuleClick}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
            <span>
              {t('dimensions.inner_height')} | {t('dimensions.outer_height')}
            </span>
            <span className="font-semibold text-wood-700">{formatPrice(totalPrice)}</span>
          </div>

          {/* Module actions (remove/rotate) */}
          {selectedModuleId && (
            <ModuleActions
              moduleId={selectedModuleId}
              modules={modules}
              onRemove={(id) => {
                removeModule(id);
                setSelectedModuleId(null);
              }}
              onRotate={(id) => rotateModule(id)}
              onClose={() => setSelectedModuleId(null)}
            />
          )}
        </div>

        {/* Right: Catalog */}
        <div className="w-full lg:w-72">
          <ModuleCatalog selection={catalogSelection} onSelect={handleCatalogSelect} />
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {dragItem && (
          <DragGhostPreview
            type={dragItem.type}
            width={dragItem.width}
            height={dragItem.height}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
