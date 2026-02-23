import type { PlacedModule } from '../../types/grid';
import { canRemove } from '../../utils/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { Button } from '../../components/ui/Button';
import { t } from '../../utils/i18n';

interface ModuleActionsProps {
  moduleId: string;
  modules: PlacedModule[];
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onClose: () => void;
}

export function ModuleActions({ moduleId, modules, onRemove, onRotate, onClose }: ModuleActionsProps) {
  const module = modules.find((m) => m.id === moduleId);
  if (!module) return null;

  const def = MODULE_DEFINITIONS[module.type];
  const removable = canRemove(modules, moduleId);
  const isSquare = module.width === module.height;

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
      <div
        className="h-4 w-4 rounded"
        style={{ backgroundColor: def?.color ?? '#9ca3af' }}
      />
      <span className="flex-1 text-sm font-medium text-gray-700">
        {def?.name ?? module.type} ({t('editor.selected')})
      </span>

      {!isSquare && (
        <Button variant="ghost" size="sm" onClick={() => onRotate(moduleId)}>
          {t('editor.rotate')}
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(moduleId)}
        disabled={!removable}
        className={removable ? 'text-red-600 hover:bg-red-50' : ''}
      >
        {t('editor.remove')}
      </Button>

      <Button variant="ghost" size="sm" onClick={onClose}>
        ✕
      </Button>
    </div>
  );
}
