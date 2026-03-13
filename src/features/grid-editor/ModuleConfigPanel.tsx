import { useState } from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { MODULE_OPTIONS } from '../../data/options';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { GRID_CELL_SIZE } from '../../types/grid';
import { canResize } from '../../utils/grid';
import { calculateMaxPanels, calculateKWp, calculatePVPrice } from '../../utils/pvCalculation';
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

          {/* PV Panel Configuration (shown when pv_panels is enabled) */}
          {module.options.pv_panels === true && module.type !== 'pergola' && (() => {
            const widthM = module.width * GRID_CELL_SIZE;
            const depthM = module.height * GRID_CELL_SIZE;
            const { maxPanels } = calculateMaxPanels(widthM, depthM);
            if (maxPanels <= 0) return null;

            const rawCount = module.options.pv_panel_count;
            const panelCount = typeof rawCount === 'number'
              ? Math.min(Math.max(1, rawCount), maxPanels)
              : maxPanels;
            const kwp = calculateKWp(panelCount);
            const pvPrice = calculatePVPrice(panelCount);
            const currentOrientation = (typeof module.options.pv_orientation === 'string'
              ? module.options.pv_orientation : 'S') as string;

            return (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">PV-Module</span>
                  <span className="text-[11px] text-gray-500">
                    {panelCount} Panels · {kwp.toFixed(1)} kWp · {pvPrice.toLocaleString('de-DE')} €
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={maxPanels}
                  value={panelCount}
                  onChange={(e) => setModuleOption(module.id, 'pv_panel_count', Number(e.target.value))}
                  className="w-full h-1.5 accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>1 Panel ({calculateKWp(1).toFixed(1)} kWp)</span>
                  <span>{maxPanels} Panels (max)</span>
                </div>

                {/* Compass orientation picker */}
                <CompassPicker
                  value={currentOrientation}
                  onChange={(dir) => setModuleOption(module.id, 'pv_orientation', dir)}
                />
              </div>
            );
          })()}

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

// --- Compass direction picker for PV orientation ---
const COMPASS_DIRECTIONS = [
  { key: 'N', label: 'N', angle: 0 },
  { key: 'NE', label: 'NO', angle: 45 },
  { key: 'E', label: 'O', angle: 90 },
  { key: 'SE', label: 'SO', angle: 135 },
  { key: 'S', label: 'S', angle: 180 },
  { key: 'SW', label: 'SW', angle: 225 },
  { key: 'W', label: 'W', angle: 270 },
  { key: 'NW', label: 'NW', angle: 315 },
] as const;

const DIRECTION_NAMES: Record<string, string> = {
  N: 'Nord', NE: 'Nordost', E: 'Ost', SE: 'Südost',
  S: 'Süd', SW: 'Südwest', W: 'West', NW: 'Nordwest',
};

function CompassPicker({ value, onChange }: { value: string; onChange: (dir: string) => void }) {
  // Compass layout: 3x3 grid with center dot
  // Row 0: NW  N  NE
  // Row 1: W   ·  E
  // Row 2: SW  S  SE
  const grid: (typeof COMPASS_DIRECTIONS[number] | null)[][] = [
    [COMPASS_DIRECTIONS[7], COMPASS_DIRECTIONS[0], COMPASS_DIRECTIONS[1]],
    [COMPASS_DIRECTIONS[6], null,                   COMPASS_DIRECTIONS[2]],
    [COMPASS_DIRECTIONS[5], COMPASS_DIRECTIONS[4], COMPASS_DIRECTIONS[3]],
  ];

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-600">Ausrichtung</span>
        <span className="text-[11px] text-gray-400">{DIRECTION_NAMES[value]} (15°)</span>
      </div>
      <div className="inline-grid grid-cols-3 gap-0.5">
        {grid.map((row, ri) =>
          row.map((dir, ci) => {
            if (!dir) {
              // Center cell: compass indicator
              return (
                <div key={`c-${ri}-${ci}`} className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-4 h-4 text-gray-300">
                    <circle cx="8" cy="8" r="2" fill="currentColor" />
                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  </svg>
                </div>
              );
            }
            const isActive = value === dir.key;
            return (
              <button
                key={dir.key}
                type="button"
                onClick={() => onChange(dir.key)}
                className={`w-8 h-8 rounded text-[10px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-700'
                }`}
                title={DIRECTION_NAMES[dir.key]}
              >
                {dir.label}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
