import type { PlacedModule } from '../../types/grid';
import { canRemove, canRotate, sharesEdge } from '../../utils/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { t } from '../../utils/i18n';

interface ModuleActionsProps {
  moduleId: string;
  modules: PlacedModule[];
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onClose: () => void;
  onToggleFreistehend?: (id: string) => void;
}

// --- SVG Icons (inline, matching WallConfigurator style) ---

function RotateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 8a5 5 0 0 1-9.33 2.5" />
      <path d="M3 8a5 5 0 0 1 9.33-2.5" />
      <polyline points="13,4 13,8 9,8" />
    </svg>
  );
}

function RemoveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h10" />
      <path d="M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
      <path d="M4 4l0.7 9.1a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4" />
      <line x1="7" y1="7" x2="7" y2="11" />
      <line x1="9" y1="7" x2="9" y2="11" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
  );
}

/** Unlink icon — detach pergola from house */
function UnlinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 9l-1.5 1.5a2.12 2.12 0 0 1-3-3L4 6" />
      <path d="M9 7l1.5-1.5a2.12 2.12 0 0 1 3 3L12 10" />
      <line x1="3" y1="13" x2="5" y2="11" />
      <line x1="11" y1="5" x2="13" y2="3" />
    </svg>
  );
}

/** Link icon — attach pergola to house */
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 9l-1.5 1.5a2.12 2.12 0 0 1-3-3L4 6" />
      <path d="M9 7l1.5-1.5a2.12 2.12 0 0 1 3 3L12 10" />
      <line x1="6.5" y1="9.5" x2="9.5" y2="6.5" />
    </svg>
  );
}

const btnBase =
  'flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const btnNormal = `${btnBase} border-gray-200 text-gray-500 hover:border-wood-300 hover:bg-gray-50`;
const btnDanger = `${btnBase} border-red-200 text-red-500 hover:border-red-300 hover:bg-red-50`;
const btnDangerDisabled = `${btnBase} border-gray-200 text-gray-500`;

export function ModuleActions({
  moduleId,
  modules,
  onRemove,
  onRotate,
  onClose,
  onToggleFreistehend,
}: ModuleActionsProps) {
  const module = modules.find((m) => m.id === moduleId);
  if (!module) return null;

  const def = MODULE_DEFINITIONS[module.type];
  const removable = canRemove(modules, moduleId);
  const isSquare = module.width === module.height;
  const rotatable = !isSquare && canRotate(modules, moduleId);

  // Pergola-specific: Lösen/Verbinden toggle
  const isPergola = module.type === 'pergola';
  const isFreistehend = isPergola && module.options.freistehend === true;

  // Check if pergola is adjacent to any house module (for "Verbinden" enablement)
  const canAttach = isPergola && isFreistehend && (() => {
    const houseModules = modules.filter((m) => m.id !== module.id && m.type !== 'pergola');
    return houseModules.length > 0 && sharesEdge(houseModules, module.gridX, module.gridY, module.width, module.height);
  })();

  // Dynamic grid columns: count buttons
  const buttonCount = (isSquare ? 0 : 1) + (isPergola ? 1 : 0) + 2; // rotate? + lösen? + remove + close
  const gridCols = buttonCount >= 4 ? 'grid-cols-4' : buttonCount === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className="mt-2">
      {/* Module info header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-3.5 w-3.5 rounded shrink-0"
          style={{ backgroundColor: def?.color ?? '#9ca3af' }}
        />
        <span className="flex-1 text-xs font-medium text-gray-700 truncate">
          {def?.name ?? module.type}
        </span>
      </div>

      {/* Action buttons in grid (like WallConfigurator) */}
      <div className={`grid ${gridCols} gap-1.5`}>
        {/* Rotate (only for non-square) */}
        {!isSquare && (
          <button
            type="button"
            className={btnNormal}
            onClick={() => onRotate(moduleId)}
            disabled={!rotatable}
            title={rotatable ? t('editor.rotate') : t('editor.rotate_blocked')}
          >
            <RotateIcon className="w-5 h-5" />
            <span>Drehen</span>
          </button>
        )}

        {/* Lösen / Verbinden (only for pergola) */}
        {isPergola && (
          <button
            type="button"
            className={btnNormal}
            onClick={() => onToggleFreistehend?.(moduleId)}
            disabled={isFreistehend && !canAttach}
            title={isFreistehend ? 'Am Haus anbinden' : 'Vom Haus lösen (freistehend)'}
          >
            {isFreistehend ? <LinkIcon className="w-5 h-5" /> : <UnlinkIcon className="w-5 h-5" />}
            <span>{isFreistehend ? 'Verbinden' : 'Lösen'}</span>
          </button>
        )}

        {/* Remove */}
        <button
          type="button"
          className={removable ? btnDanger : btnDangerDisabled}
          onClick={() => onRemove(moduleId)}
          disabled={!removable}
          title={t('editor.remove')}
        >
          <RemoveIcon className="w-5 h-5" />
          <span>Entf.</span>
        </button>

        {/* Close */}
        <button
          type="button"
          className={btnNormal}
          onClick={onClose}
          title="Schließen"
        >
          <CloseIcon className="w-5 h-5" />
          <span>Schließen</span>
        </button>
      </div>
    </div>
  );
}
