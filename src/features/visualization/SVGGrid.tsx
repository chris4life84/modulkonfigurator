import { GRID_CELL_SIZE } from '../../types/grid';

interface SVGGridProps {
  range: { minX: number; minY: number; maxX: number; maxY: number };
}

/** Draw grid lines at 1.5m intervals (visual step) */
const VISUAL_STEP = Math.round(1.5 / GRID_CELL_SIZE); // = 3

export function SVGGrid({ range }: SVGGridProps) {
  const lines: React.ReactNode[] = [];
  const step = VISUAL_STEP;

  for (let x = Math.floor(range.minX / step) * step; x <= Math.ceil(range.maxX); x += step) {
    lines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={range.minY}
        x2={x}
        y2={range.maxY}
        stroke="#e5e7eb"
        strokeWidth={0.06}
      />,
    );
  }
  for (let y = Math.floor(range.minY / step) * step; y <= Math.ceil(range.maxY); y += step) {
    lines.push(
      <line
        key={`h-${y}`}
        x1={range.minX}
        y1={y}
        x2={range.maxX}
        y2={y}
        stroke="#e5e7eb"
        strokeWidth={0.06}
      />,
    );
  }

  return <g>{lines}</g>;
}
