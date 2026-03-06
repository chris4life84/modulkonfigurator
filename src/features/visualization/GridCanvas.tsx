import { useMemo, useRef, forwardRef } from 'react';
import type { PlacedModule, GridPosition } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { getBoundingBox } from '../../utils/grid';
import { SVGGrid } from './SVGGrid';
import { SVGModule } from './SVGModule';
import type { GridDragState } from './VisualizationContainer';

interface GridCanvasProps {
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
}

export const GridCanvas = forwardRef<SVGSVGElement, GridCanvasProps>(
  function GridCanvas(
    {
      modules,
      validPlacements = [],
      ghostModule,
      selectedModuleId,
      movingModuleId,
      moveReadyModuleId,
      moveTargets = [],
      gridDrag,
      onCellClick,
      onModuleClick,
      onModulePointerDown,
      onMoveTargetClick,
      onBackgroundClick,
      interactive = true,
    },
    forwardedRef,
  ) {
    const internalRef = useRef<SVGSVGElement>(null);
    const svgRef = (forwardedRef as React.RefObject<SVGSVGElement>) ?? internalRef;

    const { viewBox, gridRange } = useMemo(() => {
      const bbox = getBoundingBox(modules);
      const pad = 6; // 6 cells × 0.5m = 3m padding
      const minX = Math.min(bbox.minX, 0) - pad;
      const minY = Math.min(bbox.minY, 0) - pad;
      const maxX = Math.max(bbox.maxX, 3) + pad; // min 3 cells = 1.5m
      const maxY = Math.max(bbox.maxY, 3) + pad;

      return {
        viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
        gridRange: { minX, minY, maxX, maxY },
      };
    }, [modules]);

    return (
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Invisible background rect – catches clicks to cancel placement */}
        {onBackgroundClick && (
          <rect
            x={gridRange.minX}
            y={gridRange.minY}
            width={gridRange.maxX - gridRange.minX}
            height={gridRange.maxY - gridRange.minY}
            fill="transparent"
            onClick={onBackgroundClick}
          />
        )}

        <SVGGrid range={gridRange} />

        {/* Placed modules – render FIRST so placement rects sit on top */}
        {modules.map((m) => {
          const def = MODULE_DEFINITIONS[m.type];
          const isDragTarget = gridDrag?.moduleId === m.id;
          // During grid drag, show the module at its dragged position
          const displayModule = isDragTarget
            ? { ...m, gridX: gridDrag!.currentX, gridY: gridDrag!.currentY }
            : m;
          return (
            <SVGModule
              key={m.id}
              module={displayModule}
              color={def?.color ?? '#9ca3af'}
              label={def?.name ?? m.type}
              selected={m.id === selectedModuleId}
              dragging={isDragTarget}
              moveReady={m.id === moveReadyModuleId}
              onClick={interactive && !gridDrag ? () => onModuleClick?.(m.id) : undefined}
              onPointerDown={
                interactive && !gridDrag ? (e) => onModulePointerDown?.(m.id, e) : undefined
              }
            />
          );
        })}

        {/* Ghost overlay showing validity during grid drag */}
        {gridDrag && (() => {
          const mod = modules.find((m) => m.id === gridDrag.moduleId);
          if (!mod) return null;
          const gap = 0.15;
          return (
            <rect
              x={gridDrag.currentX + gap}
              y={gridDrag.currentY + gap}
              width={mod.width - gap * 2}
              height={mod.height - gap * 2}
              rx={0.24}
              fill={gridDrag.isValid ? '#22c55e' : '#ef4444'}
              opacity={0.3}
              stroke={gridDrag.isValid ? '#16a34a' : '#dc2626'}
              strokeWidth={0.12}
              strokeDasharray="0.30 0.18"
              style={{ pointerEvents: 'none' }}
            />
          );
        })()}

        {/* Dimensions label */}
        {modules.length > 0 && <DimensionsLabel modules={modules} />}

        {/* Valid placement highlights (for new modules) – ON TOP of modules */}
        {ghostModule &&
          validPlacements.map((pos) => (
            <rect
              key={`valid-${pos.x}-${pos.y}`}
              x={pos.x + 0.15}
              y={pos.y + 0.15}
              width={ghostModule.width - 0.30}
              height={ghostModule.height - 0.30}
              rx={0.24}
              fill="#22c55e"
              opacity={0.25}
              stroke="#22c55e"
              strokeWidth={0.12}
              strokeDasharray="0.30 0.18"
              className="cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => {
                e.stopPropagation();
                onCellClick?.({ x: pos.x, y: pos.y });
              }}
            >
              <title>Klicken zum Platzieren</title>
            </rect>
          ))}

        {/* Move target highlights (for moving existing modules) – ON TOP of modules */}
        {movingModuleId &&
          moveTargets.map((pos) => {
            const movingMod = modules.find((m) => m.id === movingModuleId);
            return (
              <rect
                key={`move-${pos.x}-${pos.y}`}
                x={pos.x + 0.15}
                y={pos.y + 0.15}
                width={(movingMod?.width ?? 3) - 0.30}
                height={(movingMod?.height ?? 3) - 0.30}
                rx={0.24}
                fill="#3b82f6"
                opacity={0.2}
                stroke="#3b82f6"
                strokeWidth={0.12}
                strokeDasharray="0.30 0.18"
                className="cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  onMoveTargetClick?.({ x: pos.x, y: pos.y });
                }}
              >
                <title>Hierher verschieben</title>
              </rect>
            );
          })}
      </svg>
    );
  },
);

function DimensionsLabel({ modules }: { modules: PlacedModule[] }) {
  const bbox = getBoundingBox(modules);
  const wM = bbox.widthM;
  const hM = bbox.heightM;

  return (
    <>
      <text
        x={(bbox.minX + bbox.maxX) / 2}
        y={bbox.maxY + 1.8}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={0.9}
      >
        {wM.toFixed(1)} m
      </text>
      <text
        x={bbox.maxX + 1.8}
        y={(bbox.minY + bbox.maxY) / 2}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={0.9}
        transform={`rotate(90, ${bbox.maxX + 1.8}, ${(bbox.minY + bbox.maxY) / 2})`}
      >
        {hM.toFixed(1)} m
      </text>
    </>
  );
}
