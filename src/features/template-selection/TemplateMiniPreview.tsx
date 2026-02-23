import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';

interface Props {
  modules: Omit<PlacedModule, 'id'>[];
}

export function TemplateMiniPreview({ modules }: Props) {
  if (modules.length === 0) return null;

  // Calculate bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const m of modules) {
    minX = Math.min(minX, m.gridX);
    minY = Math.min(minY, m.gridY);
    maxX = Math.max(maxX, m.gridX + m.width);
    maxY = Math.max(maxY, m.gridY + m.height);
  }

  const padding = 0.3;
  const vbX = minX - padding;
  const vbY = minY - padding;
  const vbW = maxX - minX + padding * 2;
  const vbH = maxY - minY + padding * 2;

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      className="h-20 w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {modules.map((m, i) => {
        const def = MODULE_DEFINITIONS[m.type];
        return (
          <g key={i}>
            <rect
              x={m.gridX + 0.05}
              y={m.gridY + 0.05}
              width={m.width - 0.1}
              height={m.height - 0.1}
              rx={0.08}
              fill={def?.color ?? '#9ca3af'}
              opacity={0.85}
            />
            <text
              x={m.gridX + m.width / 2}
              y={m.gridY + m.height / 2 + 0.05}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={0.22}
              fontWeight="600"
            >
              {def?.name ?? m.type}
            </text>
            <text
              x={m.gridX + m.width / 2}
              y={m.gridY + m.height / 2 + 0.28}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.7)"
              fontSize={0.14}
            >
              {(m.width * GRID_CELL_SIZE).toFixed(1)}×{(m.height * GRID_CELL_SIZE).toFixed(1)}m
            </text>
          </g>
        );
      })}
    </svg>
  );
}
