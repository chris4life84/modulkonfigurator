import type { OptionDefinition } from '../../types/configuration';

interface OptionFieldProps {
  option: OptionDefinition;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  /** Use compact layout (less padding) */
  compact?: boolean;
}

export function OptionField({ option, value, onChange, compact }: OptionFieldProps) {
  if (option.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-wood-600 focus:ring-wood-500"
        />
        <span className={compact ? 'text-xs text-gray-700' : 'text-sm text-gray-700'}>
          {option.label}
        </span>
      </label>
    );
  }

  if (option.type === 'select' && option.options) {
    return (
      <div>
        <label className={`block font-medium text-gray-700 ${compact ? 'text-xs mb-1' : 'text-sm mb-1.5'}`}>
          {option.label}
        </label>
        <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
          {option.options.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 rounded-lg border cursor-pointer transition-colors
                ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
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
                className="h-3.5 w-3.5 border-gray-300 text-wood-600 focus:ring-wood-500"
              />
              <span className={`flex-1 ${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
                {opt.label}
              </span>
              {opt.priceModifier > 0 && (
                <span className="text-[10px] text-gray-400">
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
