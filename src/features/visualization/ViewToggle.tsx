import { useViewMode } from '../../hooks/useViewMode';

export function ViewToggle() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="absolute top-2 right-2 z-10 flex rounded-lg border border-gray-200 bg-white/90 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setViewMode('3d')}
        className={`px-3 py-1.5 text-xs font-medium rounded-l-lg transition-colors
          ${viewMode === '3d' ? 'bg-wood-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        3D
      </button>
      <button
        type="button"
        onClick={() => setViewMode('2d')}
        className={`px-3 py-1.5 text-xs font-medium rounded-r-lg transition-colors
          ${viewMode === '2d' ? 'bg-wood-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        2D
      </button>
    </div>
  );
}
