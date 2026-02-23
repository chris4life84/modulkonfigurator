import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';

interface SVGModuleProps {
  module: PlacedModule;
  color: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export function SVGModule({ module: m, color, label, selected, onClick }: SVGModuleProps) {
  const gap = 0.06;

  return (
    <g
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
    >
      <rect
        x={m.gridX + gap}
        y={m.gridY + gap}
        width={m.width - gap * 2}
        height={m.height - gap * 2}
        rx={0.1}
        fill={color}
        opacity={0.9}
        stroke={selected ? '#1e293b' : 'white'}
        strokeWidth={selected ? 0.08 : 0.03}
      />
      {/* Module name */}
      <text
        x={m.gridX + m.width / 2}
        y={m.gridY + m.height / 2 - 0.05}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={m.width >= 2 && m.height >= 2 ? 0.28 : 0.22}
        fontWeight="600"
      >
        {label}
      </text>
      {/* Dimensions */}
      <text
        x={m.gridX + m.width / 2}
        y={m.gridY + m.height / 2 + 0.22}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize={0.16}
      >
        {(m.width * GRID_CELL_SIZE).toFixed(1)}×{(m.height * GRID_CELL_SIZE).toFixed(1)}m
      </text>
      {/* Selection indicator */}
      {selected && (
        <rect
          x={m.gridX + gap}
          y={m.gridY + gap}
          width={m.width - gap * 2}
          height={m.height - gap * 2}
          rx={0.1}
          fill="none"
          stroke="white"
          strokeWidth={0.04}
          strokeDasharray="0.12 0.08"
        />
      )}
    </g>
  );
}
