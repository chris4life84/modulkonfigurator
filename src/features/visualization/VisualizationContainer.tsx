import { lazy, Suspense } from 'react';
import type { PlacedModule, GridPosition } from '../../types/grid';
import { useViewMode } from '../../hooks/useViewMode';
import { GridCanvas } from './GridCanvas';
import { ViewToggle } from './ViewToggle';

// Lazy-load 3D scene for code splitting (three.js is large)
const Scene3D = lazy(() =>
  import('./Scene3D').then((mod) => ({ default: mod.Scene3D })),
);

interface VisualizationContainerProps {
  modules: PlacedModule[];
  validPlacements?: GridPosition[];
  ghostModule?: { width: number; height: number } | null;
  selectedModuleId?: string | null;
  onCellClick?: (pos: GridPosition) => void;
  onModuleClick?: (id: string) => void;
  interactive?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
}

export function VisualizationContainer({
  modules,
  validPlacements,
  ghostModule,
  selectedModuleId,
  onCellClick,
  onModuleClick,
  interactive = true,
  svgRef,
}: VisualizationContainerProps) {
  const { viewMode } = useViewMode();

  return (
    <div className="relative h-full w-full">
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
          onCellClick={onCellClick}
          onModuleClick={onModuleClick}
          interactive={interactive}
        />
      )}
    </div>
  );
}
