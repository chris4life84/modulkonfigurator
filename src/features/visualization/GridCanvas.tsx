import { useMemo, useRef, forwardRef } from 'react';
import type { PlacedModule, GridPosition } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { getBoundingBox, canRotate, canRemove } from '../../utils/grid';
import { SVGGrid } from './SVGGrid';
import { SVGModule } from './SVGModule';
import type { GridDragState } from './VisualizationContainer';

interface GridCanvasProps {
  modules: PlacedModule[];
  validPlacements?: GridPosition[];
  ghostModule?: { width: number; height: number } | null;
  selectedModuleId?: string | null;
  gridDrag?: GridDragState | null;
  onCellClick?: (pos: GridPosition) => void;
  onModuleClick?: (id: string) => void;
  onModulePointerDown?: (id: string, e: React.PointerEvent) => void;
  onRotate?: (id: string) => void;
  onRemove?: (id: string) => void;
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
      gridDrag,
      onCellClick,
      onModuleClick,
      onModulePointerDown,
      onRotate,
      onRemove,
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
        style={{ touchAction: 'none' }}
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
              onClick={interactive && !gridDrag && !onModulePointerDown ? () => onModuleClick?.(m.id) : undefined}
              onPointerDown={
                interactive && !gridDrag ? (e) => onModulePointerDown?.(m.id, e) : undefined
              }
            />
          );
        })}

        {/* Action icons on selected module (rotate + delete) */}
        {selectedModuleId && !gridDrag && (() => {
          const mod = modules.find((m) => m.id === selectedModuleId);
          if (!mod) return null;

          const isSquare = mod.width === mod.height;
          const rotatable = !isSquare && canRotate(modules, selectedModuleId);
          const removable = canRemove(modules, selectedModuleId);
          const r = 0.8; // icon circle radius

          return (
            <>
              {/* Rotate icon – top right */}
              {onRotate && !isSquare && (() => {
                const cx = mod.gridX + mod.width - 0.15;
                const cy = mod.gridY + 0.15;
                const iconColor = rotatable ? '#1e293b' : '#b0b0b0';
                return (
                  <g
                    className={rotatable ? 'cursor-pointer' : ''}
                    style={{ pointerEvents: rotatable ? 'auto' : 'none' }}
                    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onClick={(e) => { e.stopPropagation(); if (rotatable) onRotate(selectedModuleId); }}
                  >
                    <circle cx={cx} cy={cy} r={r} fill="white" stroke={iconColor} strokeWidth={0.1} opacity={rotatable ? 0.95 : 0.55} />
                    <g transform={`translate(${cx - 0.42}, ${cy - 0.42}) scale(${0.84 / 16})`} opacity={rotatable ? 1 : 0.45}>
                      <path d="M13 8a5 5 0 0 1-9.33 2.5" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M3 8a5 5 0 0 1 9.33-2.5" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" />
                      <polyline points="13,4 13,8 9,8" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </g>
                );
              })()}

              {/* Delete icon – top left */}
              {onRemove && removable && (() => {
                const cx = mod.gridX + 0.15;
                const cy = mod.gridY + 0.15;
                return (
                  <g
                    className="cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onClick={(e) => { e.stopPropagation(); onRemove(selectedModuleId); }}
                  >
                    <circle cx={cx} cy={cy} r={r} fill="white" stroke="#ef4444" strokeWidth={0.1} opacity={0.95} />
                    <g transform={`translate(${cx - 0.38}, ${cy - 0.42}) scale(${0.84 / 16})`}>
                      <path d="M3 6h10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      <path d="M5 6V4.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      <path d="M4.5 6l.5 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    </g>
                  </g>
                );
              })()}
            </>
          );
        })()}

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

        {/* Dimensions label + direction labels */}
        {modules.length > 0 && <DimensionsLabel modules={modules} />}
        {modules.length > 0 && <DirectionLabels2D modules={modules} />}

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

      </svg>
    );
  },
);

/** Subtle direction labels around the building (Vorne/Hinten/Links/Rechts) – hidden on very small screens */
function DirectionLabels2D({ modules }: { modules: PlacedModule[] }) {
  const bbox = getBoundingBox(modules);
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  const fs = 0.28;
  const off = 1.6;

  return (
    <g className="hidden sm:block" style={{ pointerEvents: 'none' }}>
      {/* Vorne = maxY (bottom in SVG, +Z in 3D) */}
      <text x={cx} y={bbox.maxY + off + 0.6} textAnchor="middle" fill="#b0b8c4" fontSize={fs} fontWeight={300} letterSpacing="0.1em">
        VORNE
      </text>
      {/* Hinten = minY (top in SVG, -Z in 3D) */}
      <text x={cx} y={bbox.minY - off} textAnchor="middle" fill="#b0b8c4" fontSize={fs} fontWeight={300} letterSpacing="0.1em">
        HINTEN
      </text>
      {/* Links = minX (left in SVG, -X in 3D) */}
      <text x={bbox.minX - off} y={cy} textAnchor="middle" fill="#b0b8c4" fontSize={fs} fontWeight={300} letterSpacing="0.1em" transform={`rotate(-90, ${bbox.minX - off}, ${cy})`}>
        LINKS
      </text>
      {/* Rechts = maxX (right in SVG, +X in 3D) */}
      <text x={bbox.maxX + off} y={cy} textAnchor="middle" fill="#b0b8c4" fontSize={fs} fontWeight={300} letterSpacing="0.1em" transform={`rotate(90, ${bbox.maxX + off}, ${cy})`}>
        RECHTS
      </text>
    </g>
  );
}

function DimensionsLabel({ modules }: { modules: PlacedModule[] }) {
  const bbox = getBoundingBox(modules);
  const wM = bbox.widthM;
  const hM = bbox.heightM;

  return (
    <>
      <text
        x={(bbox.minX + bbox.maxX) / 2}
        y={bbox.maxY + 1.2}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={0.65}
        style={{ pointerEvents: 'none' }}
      >
        {wM.toFixed(1)} m
      </text>
      <text
        x={bbox.maxX + 1.2}
        y={(bbox.minY + bbox.maxY) / 2}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={0.65}
        transform={`rotate(90, ${bbox.maxX + 1.2}, ${(bbox.minY + bbox.maxY) / 2})`}
        style={{ pointerEvents: 'none' }}
      >
        {hM.toFixed(1)} m
      </text>
    </>
  );
}
