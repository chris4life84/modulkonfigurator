import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import type { GridDragState } from '../visualization/VisualizationContainer';
import { ModuleCatalog } from './ModuleCatalog';
import { ModuleActions } from './ModuleActions';
import { ModuleConfigPanel } from './ModuleConfigPanel';
import { DragGhostPreview } from './DragGhostPreview';
import {
  getValidPlacements,
  getValidMovePlacements,
  screenToSvgGrid,
  findNearestValidPlacement,
  canRemove,
} from '../../utils/grid';
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

/** Pending drag state before distance threshold is met */
interface PendingDrag {
  moduleId: string;
  startClientX: number;
  startClientY: number;
}

/** Active in-grid drag state */
interface GridDragInternal {
  moduleId: string;
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
  isValid: boolean;
  validSet: Set<string>;
}

const DRAG_THRESHOLD_PX = 6;

export function GridEditorStep() {
  const { modules, addModule, removeModule, rotateModule, moveModule, setModuleOption } = useConfigStore();
  const { viewMode, setViewMode } = useViewMode();
  const [catalogSelection, setCatalogSelection] = useState<SelectedCatalogItem | null>(null);
  const [dragItem, setDragItem] = useState<SelectedCatalogItem | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const totalPrice = selectTotalPrice(modules);

  // SVG ref for coordinate conversion
  const svgRef = useRef<SVGSVGElement>(null);

  // In-grid drag state
  const [gridDrag, setGridDrag] = useState<GridDragInternal | null>(null);
  const pendingDragRef = useRef<PendingDrag | null>(null);
  const justDraggedRef = useRef(false);

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
    // Exit placement mode → green grid disappears
    setCatalogSelection(null);
    setDragItem(null);
    // Auto-select the newly placed module so user can move/rotate/configure it
    const latest = useConfigStore.getState().modules;
    const newMod = latest[latest.length - 1];
    if (newMod) setSelectedModuleId(newMod.id);
  };

  const handleModuleClick = useCallback(
    (id: string) => {
      // Suppress click after drag
      if (justDraggedRef.current) return;

      // If in grid drag, ignore
      if (gridDrag) return;

      // If in placement mode: exit placement and select the clicked module
      if (catalogSelection || dragItem) {
        setCatalogSelection(null);
        setDragItem(null);
        setSelectedModuleId(id);
        return;
      }

      // Functional update avoids stale selectedModuleId in closure
      setSelectedModuleId((prev) => (prev === id ? null : id));
    },
    [gridDrag, catalogSelection, dragItem],
  );

  // --- In-grid module drag (2D SVG drag) ---

  const handleModulePointerDown = useCallback(
    (moduleId: string, e: React.PointerEvent) => {
      // Only in 2D mode, not during other modes
      if (viewMode !== '2d') return;
      if (catalogSelection || dragItem) return;
      if (gridDrag) return;

      e.preventDefault();
      e.stopPropagation();

      // Immediate selection on pointerdown — shows config panel instantly
      setSelectedModuleId(moduleId);

      // Store as pending drag (not activated until threshold met)
      pendingDragRef.current = {
        moduleId,
        startClientX: e.clientX,
        startClientY: e.clientY,
      };
    },
    [viewMode, catalogSelection, dragItem, gridDrag],
  );

  // Pointer move/up listener for in-grid drag
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;

      // Check pending drag threshold
      if (pendingDragRef.current && !gridDrag) {
        const pending = pendingDragRef.current;
        const dx = e.clientX - pending.startClientX;
        const dy = e.clientY - pending.startClientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= DRAG_THRESHOLD_PX) {
          // Activate grid drag
          const mod = modules.find((m) => m.id === pending.moduleId);
          if (!mod) {
            pendingDragRef.current = null;
            return;
          }

          // Precompute valid positions for this module (free placement)
          const validPositions = getValidMovePlacements(
            modules,
            pending.moduleId,
            mod.width,
            mod.height,
            true,
          );
          const validSet = new Set(validPositions.map((p) => `${p.x},${p.y}`));

          setGridDrag({
            moduleId: pending.moduleId,
            originX: mod.gridX,
            originY: mod.gridY,
            currentX: mod.gridX,
            currentY: mod.gridY,
            isValid: true,
            validSet,
          });
        }
        return;
      }

      // Update drag position
      if (gridDrag) {
        const pos = screenToSvgGrid(svg, e.clientX, e.clientY);
        const mod = modules.find((m) => m.id === gridDrag.moduleId);
        if (!mod) return;

        // Snap so cursor is near module center
        const snapX = pos.x - Math.round(mod.width / 2);
        const snapY = pos.y - Math.round(mod.height / 2);
        const isValid = gridDrag.validSet.has(`${snapX},${snapY}`);

        setGridDrag((prev) =>
          prev
            ? {
                ...prev,
                currentX: snapX,
                currentY: snapY,
                isValid,
              }
            : null,
        );
      }
    };

    const handlePointerUp = () => {
      // Pending drag never activated — selection already happened on pointerdown
      if (pendingDragRef.current && !gridDrag) {
        pendingDragRef.current = null;
        return;
      }

      // Complete grid drag
      if (gridDrag) {
        const didMove =
          gridDrag.isValid &&
          (gridDrag.currentX !== gridDrag.originX || gridDrag.currentY !== gridDrag.originY);

        if (didMove) {
          moveModule(gridDrag.moduleId, gridDrag.currentX, gridDrag.currentY);
        }

        pendingDragRef.current = null;
        setGridDrag(null);

        // Suppress click event that fires after pointerUp
        justDraggedRef.current = true;
        requestAnimationFrame(() => {
          justDraggedRef.current = false;
        });
      }
    };

    // Always attach listeners – they are no-ops when idle (no pendingDrag or gridDrag).
    // pendingDragRef is a ref (not state), so we can't conditionally attach on ref changes.
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gridDrag, modules, moveModule]);

  // Cursor feedback during active drag
  useEffect(() => {
    if (gridDrag) {
      document.body.style.cursor = 'grabbing';
      return () => {
        document.body.style.cursor = '';
      };
    }
  }, [gridDrag]);

  const handleCancelPlacement = useCallback(() => {
    setCatalogSelection(null);
    setDragItem(null);
  }, []);

  // Keyboard shortcuts: Escape cancels, Delete/Backspace removes selected module
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCatalogSelection(null);
        setDragItem(null);
        setSelectedModuleId(null);
        setGridDrag(null);
        pendingDragRef.current = null;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedModuleId) {
        // Don't delete when typing in an input
        if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
        if (canRemove(modules, selectedModuleId)) {
          removeModule(selectedModuleId);
          setSelectedModuleId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModuleId, modules, removeModule]);

  const handleBackgroundClick = useCallback(() => {
    setCatalogSelection(null);
    setSelectedModuleId(null);
  }, []);

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
    (event: DragEndEvent) => {
      if (!dragItem) {
        setDragItem(null);
        return;
      }

      const { over, activatorEvent, delta } = event;

      // If dropped over the grid zone, try to auto-place
      if (over?.id === 'grid-drop-zone' && svgRef.current && activatorEvent) {
        const pointerEvent = activatorEvent as PointerEvent;
        const finalX = pointerEvent.clientX + delta.x;
        const finalY = pointerEvent.clientY + delta.y;

        const svgPos = screenToSvgGrid(svgRef.current, finalX, finalY);
        // Offset so the module center aligns with cursor
        const targetX = svgPos.x - Math.round(dragItem.width / 2);
        const targetY = svgPos.y - Math.round(dragItem.height / 2);

        // Find nearest valid placement within 3 grid cells
        const nearest = findNearestValidPlacement(validPlacements, targetX, targetY, 3);

        if (nearest) {
          addModule({
            type: dragItem.type,
            gridX: nearest.x,
            gridY: nearest.y,
            width: dragItem.width,
            height: dragItem.height,
            options: {},
          });
          setDragItem(null);
          return;
        }
      }

      // Fallback: convert to click-mode (existing behavior)
      setCatalogSelection(dragItem);
      setDragItem(null);
    },
    [dragItem, validPlacements, addModule],
  );

  const handleDragCancel = useCallback(() => {
    setDragItem(null);
  }, []);

  // Build gridDrag prop for child components (exclude internal validSet)
  const gridDragProp: GridDragState | null = gridDrag
    ? {
        moduleId: gridDrag.moduleId,
        currentX: gridDrag.currentX,
        currentY: gridDrag.currentY,
        isValid: gridDrag.isValid,
      }
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full flex-col gap-4 lg:flex-row lg:gap-4 overflow-hidden">
        {/* Left: 3D View + Price/Hints */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 3D View - takes all available space */}
          <div
            className="rounded-xl border border-gray-200 bg-gray-50 p-2 flex-1 min-h-0"
            style={{ minHeight: '200px' }}
          >
            <VisualizationContainer
              modules={modules}
              validPlacements={validPlacements}
              ghostModule={activeItem}
              selectedModuleId={selectedModuleId}
              gridDrag={gridDragProp}
              onCellClick={handleCellClick}
              onModuleClick={handleModuleClick}
              onModulePointerDown={handleModulePointerDown}
              onRotate={(id) => rotateModule(id)}
              onRemove={(id) => { removeModule(id); setSelectedModuleId(null); }}
              onBackgroundClick={handleBackgroundClick}
              svgRef={svgRef}
            />
          </div>

          {/* Price + hints - fixed height */}
          <div className="flex-shrink-0">
            <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
              <span>
                {t('dimensions.inner_height')} | {t('dimensions.outer_height')}
              </span>
              <span className="font-semibold text-wood-700">{formatPrice(totalPrice)}</span>
            </div>

            {/* Placement mode hint */}
            {catalogSelection && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                  <span className="text-sm text-green-700">
                    {t('editor.placement_hint')}
                  </span>
                  <button
                    onClick={handleCancelPlacement}
                    className="ml-auto rounded-md border border-green-300 bg-white px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    {t('editor.cancel')}
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                  <svg className="h-3.5 w-3.5 shrink-0 text-amber-500" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 6.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  <span className="text-xs text-amber-700">
                    Verschieben, Drehen und Löschen erst nach Platzierung möglich.
                  </span>
                  <button
                    onClick={handleCancelPlacement}
                    className="ml-auto shrink-0 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                  >
                    Zur Bearbeitung
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Catalog + Config */}
        <div className="w-full lg:w-[360px] flex flex-col min-h-0">
          {/* Modulblöcke – compact, always visible */}
          <div className="flex-shrink-0 px-2">
            <ModuleCatalog selection={catalogSelection} onSelect={handleCatalogSelect} />
          </div>

          {/* Config area – scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 mt-3 px-2">
            {selectedModuleId && (
              <>
                <ModuleActions
                  moduleId={selectedModuleId}
                  modules={modules}
                  onRemove={(id) => {
                    removeModule(id);
                    setSelectedModuleId(null);
                  }}
                  onRotate={(id) => rotateModule(id)}
                  onClose={() => setSelectedModuleId(null)}
                  onToggleFreistehend={(id) => {
                    const mod = modules.find((m) => m.id === id);
                    if (mod) {
                      setModuleOption(id, 'freistehend', !mod.options.freistehend);
                    }
                  }}
                />
                <ModuleConfigPanel moduleId={selectedModuleId} />
              </>
            )}
          </div>
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
