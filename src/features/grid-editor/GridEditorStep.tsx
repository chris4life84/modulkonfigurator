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
  const { modules, addModule, removeModule, rotateModule, moveModule } = useConfigStore();
  const { viewMode, setViewMode } = useViewMode();
  const [catalogSelection, setCatalogSelection] = useState<SelectedCatalogItem | null>(null);
  const [dragItem, setDragItem] = useState<SelectedCatalogItem | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [movingModuleId, setMovingModuleId] = useState<string | null>(null);
  const [moveReadyModuleId, setMoveReadyModuleId] = useState<string | null>(null);
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

  // Move targets: valid positions for the module being moved
  const moveTargets = useMemo(() => {
    if (!movingModuleId) return [];
    const mod = modules.find((m) => m.id === movingModuleId);
    if (!mod) return [];
    return getValidMovePlacements(modules, movingModuleId, mod.width, mod.height);
  }, [modules, movingModuleId]);

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
    // Suppress click after drag
    if (justDraggedRef.current) return;

    // If in move mode, ignore normal module clicks
    if (movingModuleId) return;

    // If in grid drag, ignore
    if (gridDrag) return;

    // If in placement mode: exit placement and select the clicked module
    if (catalogSelection || dragItem) {
      setCatalogSelection(null);
      setDragItem(null);
      setSelectedModuleId(id);
      return;
    }

    setSelectedModuleId(id === selectedModuleId ? null : id);
  };

  // --- In-grid module drag (2D SVG drag) ---

  const handleModulePointerDown = useCallback(
    (moduleId: string, e: React.PointerEvent) => {
      // Only in 2D mode, not during other modes
      if (viewMode !== '2d') return;
      if (catalogSelection || dragItem) return;

      e.preventDefault();
      e.stopPropagation();

      // If this module is "move-ready" (user clicked Verschieben), start drag immediately
      if (moveReadyModuleId === moduleId) {
        const svg = svgRef.current;
        const mod = modules.find((m) => m.id === moduleId);
        if (!svg || !mod) return;

        // Precompute valid positions
        const validPositions = getValidMovePlacements(modules, moduleId, mod.width, mod.height);
        const validSet = new Set(validPositions.map((p) => `${p.x},${p.y}`));

        setGridDrag({
          moduleId,
          originX: mod.gridX,
          originY: mod.gridY,
          currentX: mod.gridX,
          currentY: mod.gridY,
          isValid: true,
          validSet,
        });
        setMoveReadyModuleId(null);
        setMovingModuleId(null);
        return;
      }

      // If in move mode but not the ready module, ignore
      if (movingModuleId) return;

      // Store as pending drag (not activated until threshold met)
      pendingDragRef.current = {
        moduleId,
        startClientX: e.clientX,
        startClientY: e.clientY,
      };
    },
    [viewMode, movingModuleId, moveReadyModuleId, catalogSelection, dragItem, modules],
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

          // Precompute valid positions for this module
          const validPositions = getValidMovePlacements(
            modules,
            pending.moduleId,
            mod.width,
            mod.height,
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
          setSelectedModuleId(null);
        }
        return;
      }

      // Update drag position
      if (gridDrag) {
        const pos = screenToSvgGrid(svg, e.clientX, e.clientY);
        const mod = modules.find((m) => m.id === gridDrag.moduleId);
        if (!mod) return;

        // Snap so cursor is near module center
        const snapX = pos.x - Math.floor(mod.width / 2);
        const snapY = pos.y - Math.floor(mod.height / 2);
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
      // If pending drag never activated, treat as click
      if (pendingDragRef.current && !gridDrag) {
        const moduleId = pendingDragRef.current.moduleId;
        pendingDragRef.current = null;
        // Let the click handler handle it
        handleModuleClick(moduleId);
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

    // Only attach listeners when there's a pending or active drag
    if (pendingDragRef.current || gridDrag) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [gridDrag, modules, moveModule]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartMove = useCallback(
    (id: string) => {
      setMoveReadyModuleId(id);
      setMovingModuleId(id); // Keep for blue target fallback
      setSelectedModuleId(null);
      setCatalogSelection(null);
      setViewMode('2d'); // Force 2D for move
    },
    [setViewMode],
  );

  const handleMoveTargetClick = useCallback(
    (pos: GridPosition) => {
      if (!movingModuleId) return;
      moveModule(movingModuleId, pos.x, pos.y);
      setMovingModuleId(null);
      setMoveReadyModuleId(null);
    },
    [movingModuleId, moveModule],
  );

  const handleCancelMove = useCallback(() => {
    setMovingModuleId(null);
    setMoveReadyModuleId(null);
  }, []);

  const handleCancelPlacement = useCallback(() => {
    setCatalogSelection(null);
    setDragItem(null);
  }, []);

  // Escape key cancels any active mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCatalogSelection(null);
        setDragItem(null);
        setMovingModuleId(null);
        setMoveReadyModuleId(null);
        setSelectedModuleId(null);
        setGridDrag(null);
        pendingDragRef.current = null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    if (catalogSelection) {
      setCatalogSelection(null);
    }
  }, [catalogSelection]);

  const handleCatalogSelect = (item: SelectedCatalogItem | null) => {
    setCatalogSelection(item);
    setSelectedModuleId(null);
    setMovingModuleId(null);
    setMoveReadyModuleId(null);
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
        setMovingModuleId(null);
        setMoveReadyModuleId(null);
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
        const targetX = svgPos.x - Math.floor(dragItem.width / 2);
        const targetY = svgPos.y - Math.floor(dragItem.height / 2);

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
              movingModuleId={movingModuleId}
              moveReadyModuleId={moveReadyModuleId}
              moveTargets={moveTargets}
              gridDrag={gridDragProp}
              onCellClick={handleCellClick}
              onModuleClick={handleModuleClick}
              onModulePointerDown={handleModulePointerDown}
              onMoveTargetClick={handleMoveTargetClick}
              onBackgroundClick={handleBackgroundClick}
              svgRef={svgRef}
            />
          </div>

          {/* Price + hints - fixed height */}
          <div className="flex-shrink-0">
            {/* Move mode hint */}
            {(movingModuleId || moveReadyModuleId) && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <span className="text-sm text-blue-700">
                  {t('editor.move_hint')}
                </span>
                <button
                  onClick={handleCancelMove}
                  className="ml-auto rounded-md border border-blue-300 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  {t('editor.cancel')}
                </button>
              </div>
            )}

            {!movingModuleId && !moveReadyModuleId && (
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                <span>
                  {t('dimensions.inner_height')} | {t('dimensions.outer_height')}
                </span>
                <span className="font-semibold text-wood-700">{formatPrice(totalPrice)}</span>
              </div>
            )}

            {/* Placement mode hint */}
            {catalogSelection && !movingModuleId && !moveReadyModuleId && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
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
            {selectedModuleId && !movingModuleId && (
              <>
                <ModuleActions
                  moduleId={selectedModuleId}
                  modules={modules}
                  onRemove={(id) => {
                    removeModule(id);
                    setSelectedModuleId(null);
                  }}
                  onRotate={(id) => rotateModule(id)}
                  onMove={handleStartMove}
                  onClose={() => setSelectedModuleId(null)}
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
