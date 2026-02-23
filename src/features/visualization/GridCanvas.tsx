import { useMemo, useRef, forwardRef } from 'react';
import type { PlacedModule, GridPosition } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { getBoundingBox } from '../../utils/grid';
import { SVGGrid } from './SVGGrid';
import { SVGModule } from './SVGModule';

interface GridCanvasProps {
  modules: PlacedModule[];
  validPlacements?: GridPosition[];
  ghostModule?: { width: number; height: number } | null;
  selectedModuleId?: string | null;
  onCellClick?: (pos: GridPosition) => void;
  onModuleClick?: (id: string) => void;
  interactive?: boolean;
}

export const GridCanvas = forwardRef<SVGSVGElement, GridCanvasProps>(
  function GridCanvas(
    {
      modules,
      validPlacements = [],
      ghostModule,
      selectedModuleId,
      onCellClick,
      onModuleClick,
      interactive = true,
    },
    forwardedRef,
  ) {
    const internalRef = useRef<SVGSVGElement>(null);
    const svgRef = (forwardedRef as React.RefObject<SVGSVGElement>) ?? internalRef;

    const { viewBox, gridRange } = useMemo(() => {
      const bbox = getBoundingBox(modules);
      const pad = 2;
      const minX = Math.min(bbox.minX, 0) - pad;
      const minY = Math.min(bbox.minY, 0) - pad;
      const maxX = Math.max(bbox.maxX, 1) + pad;
      const maxY = Math.max(bbox.maxY, 1) + pad;

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
        <SVGGrid range={gridRange} />

        {/* Valid placement highlights */}
        {ghostModule &&
          validPlacements.map((pos) => (
            <rect
              key={`valid-${pos.x}-${pos.y}`}
              x={pos.x + 0.05}
              y={pos.y + 0.05}
              width={ghostModule.width - 0.1}
              height={ghostModule.height - 0.1}
              rx={0.08}
              fill="#22c55e"
              opacity={0.25}
              stroke="#22c55e"
              strokeWidth={0.04}
              strokeDasharray="0.1 0.06"
              className="cursor-pointer"
              onClick={() => onCellClick?.({ x: pos.x, y: pos.y })}
            >
              <title>Klicken zum Platzieren</title>
            </rect>
          ))}

        {/* Placed modules */}
        {modules.map((m) => {
          const def = MODULE_DEFINITIONS[m.type];
          return (
            <SVGModule
              key={m.id}
              module={m}
              color={def?.color ?? '#9ca3af'}
              label={def?.name ?? m.type}
              selected={m.id === selectedModuleId}
              onClick={interactive ? () => onModuleClick?.(m.id) : undefined}
            />
          );
        })}

        {/* Dimensions label */}
        {modules.length > 0 && <DimensionsLabel modules={modules} />}
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
      {/* Width label (bottom) */}
      <text
        x={(bbox.minX + bbox.maxX) / 2}
        y={bbox.maxY + 0.6}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={0.3}
      >
        {wM.toFixed(1)} m
      </text>
      {/* Height label (right) */}
      <text
        x={bbox.maxX + 0.6}
        y={(bbox.minY + bbox.maxY) / 2}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={0.3}
        transform={`rotate(90, ${bbox.maxX + 0.6}, ${(bbox.minY + bbox.maxY) / 2})`}
      >
        {hM.toFixed(1)} m
      </text>
    </>
  );
}
