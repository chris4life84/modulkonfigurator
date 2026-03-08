import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';

interface SVGModuleProps {
  module: PlacedModule;
  color: string;
  label: string;
  selected?: boolean;
  dragging?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function SVGModule({
  module: m,
  color,
  label,
  selected,
  dragging,
  onClick,
  onPointerDown,
}: SVGModuleProps) {
  const gap = 0.18;
  const isPergola = m.type === 'pergola';

  return (
    <g
      className={onClick || onPointerDown ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}
      onClick={onClick}
      onPointerDown={onPointerDown}
      opacity={dragging ? 0.5 : 1}
      style={{ pointerEvents: dragging ? 'none' : 'auto' }}
    >
      <rect
        x={m.gridX + gap}
        y={m.gridY + gap}
        width={m.width - gap * 2}
        height={m.height - gap * 2}
        rx={0.3}
        fill={isPergola ? `${color}30` : color}
        opacity={0.9}
        stroke={selected ? '#1e293b' : isPergola ? color : 'white'}
        strokeWidth={selected ? 0.24 : isPergola ? 0.15 : 0.09}
        strokeDasharray={isPergola && !selected ? '0.4 0.2' : undefined}
      />
      {/* Pergola diagonal lines pattern */}
      {isPergola && (
        <>
          {Array.from({ length: Math.ceil(m.width / 0.8) + Math.ceil(m.height / 0.8) }, (_, i) => {
            const offset = (i - Math.ceil(m.height / 0.8)) * 0.8;
            const x1 = Math.max(gap, offset) + m.gridX;
            const y1 = Math.max(gap, -offset) + m.gridY;
            const x2 = Math.min(m.width - gap, offset + m.height) + m.gridX;
            const y2 = Math.min(m.height - gap, m.height - offset) + m.gridY;
            if (x1 >= m.gridX + m.width - gap || y1 >= m.gridY + m.height - gap) return null;
            if (x2 <= m.gridX + gap || y2 <= m.gridY + gap) return null;
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth={0.04}
                opacity={0.35}
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
        </>
      )}
      {/* Module name */}
      <text
        x={m.gridX + m.width / 2}
        y={m.gridY + m.height / 2 - 0.15}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={m.width >= 6 && m.height >= 6 ? 0.84 : 0.66}
        fontWeight="600"
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>
      {/* Dimensions */}
      <text
        x={m.gridX + m.width / 2}
        y={m.gridY + m.height / 2 + 0.66}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize={0.48}
        style={{ pointerEvents: 'none' }}
      >
        {(m.width * GRID_CELL_SIZE).toFixed(1)}x{(m.height * GRID_CELL_SIZE).toFixed(1)}m
      </text>
      {/* Selection indicator */}
      {selected && (
        <rect
          x={m.gridX + gap}
          y={m.gridY + gap}
          width={m.width - gap * 2}
          height={m.height - gap * 2}
          rx={0.3}
          fill="none"
          stroke="white"
          strokeWidth={0.12}
          strokeDasharray="0.36 0.24"
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* Dragging indicator – dashed border when being moved */}
      {dragging && (
        <rect
          x={m.gridX + gap}
          y={m.gridY + gap}
          width={m.width - gap * 2}
          height={m.height - gap * 2}
          rx={0.3}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={0.15}
          strokeDasharray="0.4 0.25"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
}
