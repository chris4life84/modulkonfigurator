import { useState } from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { MODULE_OPTIONS } from '../../data/options';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { GRID_CELL_SIZE } from '../../types/grid';
import { canResize } from '../../utils/grid';
import { OptionField } from '../options/OptionField';
import { WallConfigurator } from '../options/WallConfigurator';
import { t } from '../../utils/i18n';

interface ModuleConfigPanelProps {
  moduleId: string;
}

/** Generate cell counts from 1.0m to 9.0m in GRID_CELL_SIZE steps */
const DIMENSION_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 2); // 2..18 cells = 1.0..9.0m

export function ModuleConfigPanel({ moduleId }: ModuleConfigPanelProps) {
  const { modules, setModuleOption, resizeModule } = useConfigStore();
  const [collapsed, setCollapsed] = useState(false);

  const module = modules.find((m) => m.id === moduleId);
  if (!module) return null;

  const def = MODULE_DEFINITIONS[module.type];
  const applicableOptions = MODULE_OPTIONS.filter((opt) => {
    if (!opt.appliesTo.includes(module.type)) return false;
    // Hide 'anschluss' option when pergola is freistehend (no house to connect to)
    if (opt.key === 'anschluss' && module.options.freistehend === true) return false;
    return true;
  });

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
      >
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: def?.color }}
        />
        <span className="text-sm font-semibold text-gray-900 flex-1">
          {t('editor.config.title')}: {def?.name ?? module.type}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {applicableOptions.length === 0 ? (
            <p className="text-xs text-gray-400">{t('options.no_options')}</p>
          ) : (
            applicableOptions.map((opt) => (
              <OptionField
                key={opt.key}
                option={opt}
                value={module.options[opt.key] ?? opt.defaultValue}
                onChange={(val) => setModuleOption(module.id, opt.key, val)}
                compact
              />
            ))
          )}

          {/* Pergola dimension controls */}
          {module.type === 'pergola' && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-gray-600">Abmessungen</p>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-gray-500 shrink-0 w-10">Breite</label>
                <select
                  value={module.width}
                  onChange={(e) => {
                    const newW = Number(e.target.value);
                    if (canResize(modules, module.id, newW, module.height)) {
                      resizeModule(module.id, newW, module.height);
                    }
                  }}
                  className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs bg-white"
                >
                  {DIMENSION_OPTIONS.map((cells) => {
                    const meters = cells * GRID_CELL_SIZE;
                    const valid = canResize(modules, module.id, cells, module.height);
                    return (
                      <option key={cells} value={cells} disabled={!valid}>
                        {meters.toFixed(1)} m{!valid && cells !== module.width ? ' (blockiert)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-gray-500 shrink-0 w-10">Tiefe</label>
                <select
                  value={module.height}
                  onChange={(e) => {
                    const newH = Number(e.target.value);
                    if (canResize(modules, module.id, module.width, newH)) {
                      resizeModule(module.id, module.width, newH);
                    }
                  }}
                  className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs bg-white"
                >
                  {DIMENSION_OPTIONS.map((cells) => {
                    const meters = cells * GRID_CELL_SIZE;
                    const valid = canResize(modules, module.id, module.width, cells);
                    return (
                      <option key={cells} value={cells} disabled={!valid}>
                        {meters.toFixed(1)} m{!valid && cells !== module.height ? ' (blockiert)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="text-[10px] text-gray-400">
                Aktuell: {(module.width * GRID_CELL_SIZE).toFixed(1)} &times; {(module.height * GRID_CELL_SIZE).toFixed(1)} m
              </p>
            </div>
          )}

          {module.type !== 'pergola' && (
            <WallConfigurator module={module} allModules={modules} />
          )}
        </div>
      )}
    </div>
  );
}
