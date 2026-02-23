interface SVGGridProps {
  range: { minX: number; minY: number; maxX: number; maxY: number };
}

export function SVGGrid({ range }: SVGGridProps) {
  const lines: React.ReactNode[] = [];

  for (let x = Math.floor(range.minX); x <= Math.ceil(range.maxX); x++) {
    lines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={range.minY}
        x2={x}
        y2={range.maxY}
        stroke="#e5e7eb"
        strokeWidth={0.02}
      />,
    );
  }
  for (let y = Math.floor(range.minY); y <= Math.ceil(range.maxY); y++) {
    lines.push(
      <line
        key={`h-${y}`}
        x1={range.minX}
        y1={y}
        x2={range.maxX}
        y2={y}
        stroke="#e5e7eb"
        strokeWidth={0.02}
      />,
    );
  }

  return <g>{lines}</g>;
}
