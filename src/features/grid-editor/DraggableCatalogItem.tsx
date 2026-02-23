import { useDraggable } from '@dnd-kit/core';
import type { ModuleType } from '../../types/modules';

interface DraggableCatalogItemProps {
  type: ModuleType;
  width: number;
  height: number;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function DraggableCatalogItem({
  type,
  width,
  height,
  isSelected,
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
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors touch-manipulation
        ${isDragging ? 'opacity-50' : ''}
        ${
          isSelected
            ? 'border-wood-500 bg-wood-50 text-wood-700'
            : 'border-gray-200 text-gray-600 hover:border-wood-300 hover:bg-wood-50'
        }`}
    >
      {children}
    </button>
  );
}
