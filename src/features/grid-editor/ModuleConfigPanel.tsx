import { useState } from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { MODULE_OPTIONS } from '../../data/options';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { OptionField } from '../options/OptionField';
import { WallConfigurator } from '../options/WallConfigurator';
import { t } from '../../utils/i18n';

interface ModuleConfigPanelProps {
  moduleId: string;
}

export function ModuleConfigPanel({ moduleId }: ModuleConfigPanelProps) {
  const { modules, setModuleOption } = useConfigStore();
  const [collapsed, setCollapsed] = useState(false);

  const module = modules.find((m) => m.id === moduleId);
  if (!module) return null;

  const def = MODULE_DEFINITIONS[module.type];
  const applicableOptions = MODULE_OPTIONS.filter((opt) =>
    opt.appliesTo.includes(module.type),
  );

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

          <WallConfigurator module={module} allModules={modules} />
        </div>
      )}
    </div>
  );
}
