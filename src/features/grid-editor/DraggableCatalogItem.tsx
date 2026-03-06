import { useDraggable } from '@dnd-kit/core';
import type { ModuleType } from '../../types/modules';

interface DraggableCatalogItemProps {
  type: ModuleType;
  width: number;
  height: number;
  isSelected: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}

export function DraggableCatalogItem({
  type,
  width,
  height,
  isSelected,
  color,
  onClick,
  children,
}: DraggableCatalogItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog-${type}-${width}x${height}`,
    data: { type, width, height },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`flex-1 min-w-0 rounded-lg border-2 px-2 py-2 text-center transition-all touch-manipulation
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${
          isSelected
            ? 'border-current bg-current/5 ring-1 ring-current/20'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      style={isSelected ? { color } : undefined}
    >
      {children}
    </button>
  );
}
