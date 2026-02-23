import { useConfigStore } from '../../store/useConfigStore';
import { MODULE_OPTIONS } from '../../data/options';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { t } from '../../utils/i18n';

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
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: def?.color }}
                />
                <h3 className="text-lg font-semibold text-gray-900">
                  {def?.name ?? module.type} #{idx + 1}
                </h3>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface OptionFieldProps {
  option: (typeof MODULE_OPTIONS)[number];
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}

function OptionField({ option, value, onChange }: OptionFieldProps) {
  if (option.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-wood-600 focus:ring-wood-500"
        />
        <span className="text-sm text-gray-700">{option.label}</span>
      </label>
    );
  }

  if (option.type === 'select' && option.options) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {option.label}
        </label>
        <div className="space-y-1.5">
          {option.options.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors
                ${
                  value === opt.value
                    ? 'border-wood-500 bg-wood-50'
                    : 'border-gray-200 hover:border-wood-300'
                }`}
            >
              <input
                type="radio"
                name={`${option.key}`}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="h-4 w-4 border-gray-300 text-wood-600 focus:ring-wood-500"
              />
              <span className="flex-1 text-sm text-gray-700">{opt.label}</span>
              {opt.priceModifier > 0 && (
                <span className="text-xs text-gray-400">
                  +{opt.priceModifier.toLocaleString('de-DE')} €
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
