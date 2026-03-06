import type { PlacedModule } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';

interface ModuleHighlightPreviewProps {
  modules: PlacedModule[];
  highlightId: string;
}

/**
 * Mini SVG floor plan showing all modules, with one highlighted
 * and the rest dimmed. Compact inline preview (~60px high).
 */
export function ModuleHighlightPreview({ modules, highlightId }: ModuleHighlightPreviewProps) {
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

  const padding = 0.6;
  const vbX = minX - padding;
  const vbY = minY - padding;
  const vbW = maxX - minX + padding * 2;
  const vbH = maxY - minY + padding * 2;

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      className="h-14 w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {modules.map((m) => {
        const def = MODULE_DEFINITIONS[m.type];
        const isHighlighted = m.id === highlightId;

        return (
          <rect
            key={m.id}
            x={m.gridX + 0.12}
            y={m.gridY + 0.12}
            width={m.width - 0.24}
            height={m.height - 0.24}
            rx={0.18}
            fill={def?.color ?? '#9ca3af'}
            opacity={isHighlighted ? 0.9 : 0.2}
            stroke={isHighlighted ? '#1e293b' : 'none'}
            strokeWidth={isHighlighted ? 0.18 : 0}
          />
        );
      })}
    </svg>
  );
}
