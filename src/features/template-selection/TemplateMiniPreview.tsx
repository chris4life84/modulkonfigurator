import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';

interface Props {
  modules: Omit<PlacedModule, 'id'>[];
}

/**
 * Isometric 2.5D preview of a template layout.
 * Uses CSS transform for pseudo-3D effect with depth.
 */
export function TemplateMiniPreview({ modules }: Props) {
  if (modules.length === 0) return null;

  // Calculate bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const m of modules) {
    minX = Math.min(minX, m.gridX);
    minY = Math.min(minY, m.gridY);
    maxX = Math.max(maxX, m.gridX + m.width);
    maxY = Math.max(maxY, m.gridY + m.height);
  }

  const padding = 0.9;
  const vbX = minX - padding;
  const vbY = minY - padding;
  const vbW = maxX - minX + padding * 2;
  const vbH = maxY - minY + padding * 2;

  // Depth offset for 3D effect
  const depth = 0.45;

  return (
    <div
      className="h-32 w-full flex items-center justify-center"
      style={{
        perspective: '400px',
      }}
    >
      <svg
        viewBox={`${vbX - depth} ${vbY - depth} ${vbW + depth * 2} ${vbH + depth * 2}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{
          transform: 'rotateX(20deg) rotateZ(-5deg)',
          transformOrigin: 'center center',
        }}
      >
        {/* Shadow layer underneath */}
        {modules.map((m, i) => (
          <rect
            key={`shadow-${i}`}
            x={m.gridX + 0.15 + depth * 0.5}
            y={m.gridY + 0.15 + depth * 0.5}
            width={m.width - 0.30}
            height={m.height - 0.30}
            rx={0.18}
            fill="#000"
            opacity={0.08}
          />
        ))}

        {/* Side faces for depth illusion (bottom + right edges) */}
        {modules.map((m, i) => {
          const def = MODULE_DEFINITIONS[m.type];
          const color = def?.color ?? '#9ca3af';
          return (
            <g key={`sides-${i}`}>
              {/* Bottom edge */}
              <polygon
                points={`
                  ${m.gridX + 0.15},${m.gridY + m.height - 0.15}
                  ${m.gridX + m.width - 0.15},${m.gridY + m.height - 0.15}
                  ${m.gridX + m.width - 0.15 + depth},${m.gridY + m.height - 0.15 + depth}
                  ${m.gridX + 0.15 + depth},${m.gridY + m.height - 0.15 + depth}
                `}
                fill={color}
                opacity={0.45}
              />
              {/* Right edge */}
              <polygon
                points={`
                  ${m.gridX + m.width - 0.15},${m.gridY + 0.15}
                  ${m.gridX + m.width - 0.15 + depth},${m.gridY + 0.15 + depth}
                  ${m.gridX + m.width - 0.15 + depth},${m.gridY + m.height - 0.15 + depth}
                  ${m.gridX + m.width - 0.15},${m.gridY + m.height - 0.15}
                `}
                fill={color}
                opacity={0.35}
              />
            </g>
          );
        })}

        {/* Top faces (main module rectangles) */}
        {modules.map((m, i) => {
          const def = MODULE_DEFINITIONS[m.type];
          return (
            <g key={i}>
              <rect
                x={m.gridX + 0.15}
                y={m.gridY + 0.15}
                width={m.width - 0.30}
                height={m.height - 0.30}
                rx={0.18}
                fill={def?.color ?? '#9ca3af'}
                opacity={0.88}
              />
              {/* Module name */}
              <text
                x={m.gridX + m.width / 2}
                y={m.gridY + m.height / 2 - 0.06}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={m.width >= 6 && m.height >= 6 ? 0.72 : 0.60}
                fontWeight="600"
              >
                {def?.name ?? m.type}
              </text>
              {/* Dimensions */}
              <text
                x={m.gridX + m.width / 2}
                y={m.gridY + m.height / 2 + 0.66}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.7)"
                fontSize={0.42}
              >
                {(m.width * GRID_CELL_SIZE).toFixed(1)}×{(m.height * GRID_CELL_SIZE).toFixed(1)}m
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
