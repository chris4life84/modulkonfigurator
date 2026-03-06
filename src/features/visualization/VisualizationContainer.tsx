import { lazy, Suspense } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { PlacedModule, GridPosition } from '../../types/grid';
import { useViewMode } from '../../hooks/useViewMode';
import { GridCanvas } from './GridCanvas';
import { ViewToggle } from './ViewToggle';

// Lazy-load 3D scene for code splitting (three.js is large)
const Scene3D = lazy(() =>
  import('./Scene3D').then((mod) => ({ default: mod.Scene3D })),
);

export interface GridDragState {
  moduleId: string;
  currentX: number;
  currentY: number;
  isValid: boolean;
}

interface VisualizationContainerProps {
  modules: PlacedModule[];
  validPlacements?: GridPosition[];
  ghostModule?: { width: number; height: number } | null;
  selectedModuleId?: string | null;
  movingModuleId?: string | null;
  moveReadyModuleId?: string | null;
  moveTargets?: GridPosition[];
  gridDrag?: GridDragState | null;
  onCellClick?: (pos: GridPosition) => void;
  onModuleClick?: (id: string) => void;
  onModulePointerDown?: (id: string, e: React.PointerEvent) => void;
  onMoveTargetClick?: (pos: GridPosition) => void;
  onBackgroundClick?: () => void;
  interactive?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
}

export function VisualizationContainer({
  modules,
  validPlacements,
  ghostModule,
  selectedModuleId,
  movingModuleId,
  moveReadyModuleId,
  moveTargets,
  gridDrag,
  onCellClick,
  onModuleClick,
  onModulePointerDown,
  onMoveTargetClick,
  onBackgroundClick,
  interactive = true,
  svgRef,
}: VisualizationContainerProps) {
  const { viewMode } = useViewMode();
  const { setNodeRef: setDropRef } = useDroppable({ id: 'grid-drop-zone' });

  return (
    <div ref={setDropRef} className="relative h-full w-full">
      <ViewToggle />

      {viewMode === '3d' ? (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              3D wird geladen...
            </div>
          }
        >
          <Scene3D
            modules={modules}
            selectedModuleId={selectedModuleId}
            onModuleClick={interactive ? onModuleClick : undefined}
          />
        </Suspense>
      ) : (
        <GridCanvas
          ref={svgRef}
          modules={modules}
          validPlacements={validPlacements}
          ghostModule={ghostModule}
          selectedModuleId={selectedModuleId}
          movingModuleId={movingModuleId}
          moveReadyModuleId={moveReadyModuleId}
          moveTargets={moveTargets}
          gridDrag={gridDrag}
          onCellClick={onCellClick}
          onModuleClick={onModuleClick}
          onModulePointerDown={onModulePointerDown}
          onMoveTargetClick={onMoveTargetClick}
          onBackgroundClick={onBackgroundClick}
          interactive={interactive}
        />
      )}
    </div>
  );
}
