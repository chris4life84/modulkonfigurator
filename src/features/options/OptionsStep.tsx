import { useConfigStore } from '../../store/useConfigStore';
import { MODULE_OPTIONS } from '../../data/options';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { t } from '../../utils/i18n';
import { WallConfigurator } from './WallConfigurator';
import { ModuleHighlightPreview } from './ModuleHighlightPreview';
import { OptionField } from './OptionField';

export function OptionsStep() {
  const { modules, setModuleOption } = useConfigStore();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{t('options.title')}</h2>
      <p className="mt-1 text-gray-500">{t('options.description')}</p>

      <div className="mt-6 space-y-6">
        {modules.map((module, idx) => {
          const def = MODULE_DEFINITIONS[module.type];
          const applicableOptions = MODULE_OPTIONS.filter((opt) =>
            opt.appliesTo.includes(module.type),
          );

          return (
            <div
              key={module.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 flex-shrink-0">
                  <ModuleHighlightPreview modules={modules} highlightId={module.id} />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className="h-4 w-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: def?.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {def?.name ?? module.type} #{idx + 1}
                  </h3>
                </div>
              </div>

              {applicableOptions.length === 0 ? (
                <p className="text-sm text-gray-400">{t('options.no_options')}</p>
              ) : (
                <div className="space-y-4">
                  {applicableOptions.map((opt) => (
                    <OptionField
                      key={opt.key}
                      option={opt}
                      value={module.options[opt.key] ?? opt.defaultValue}
                      onChange={(val) => setModuleOption(module.id, opt.key, val)}
                    />
                  ))}
                </div>
              )}

              <WallConfigurator module={module} allModules={modules} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
