import { useState } from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { MODULE_OPTIONS } from '../../data/options';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { GRID_CELL_SIZE } from '../../types/grid';
import { canResize } from '../../utils/grid';
import { calculateMaxPanels, calculateKWp, calculatePVPrice } from '../../utils/pvCalculation';
import { SKYLIGHT_DEFAULT_W, SKYLIGHT_DEFAULT_D, SKYLIGHT_MIN, SKYLIGHT_MAX_W, SKYLIGHT_MAX_D } from '../../features/visualization/RoofPanel';
import { OptionField } from '../options/OptionField';
import { WallConfigurator } from '../options/WallConfigurator';
import { t } from '../../utils/i18n';

interface ModuleConfigPanelProps {
  moduleId: string;
}

/** Generate cell counts from 1.0m to 9.0m in GRID_CELL_SIZE steps */
const DIMENSION_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 2); // 2..18 cells = 1.0..9.0m

// Enclosed module types that can be switched between (pergola excluded – structurally different)
const ENCLOSED_TYPES = ['living', 'sauna', 'technik', 'ruhe', 'umkleide', 'sanitaer'] as const;

export function ModuleConfigPanel({ moduleId }: ModuleConfigPanelProps) {
  const { modules, setModuleOption, setModuleType, resizeModule } = useConfigStore();
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
          {/* Module type selector (not for pergola – structurally different) */}
          {module.type !== 'pergola' && (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">Modultyp</label>
              <select
                value={module.type}
                onChange={(e) => setModuleType(module.id, e.target.value as typeof ENCLOSED_TYPES[number])}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-colors"
              >
                {ENCLOSED_TYPES.map((t) => {
                  const d = MODULE_DEFINITIONS[t];
                  return (
                    <option key={t} value={t}>
                      {d.icon} {d.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {applicableOptions.length === 0 ? (
            <p className="text-xs text-gray-400">{t('options.no_options')}</p>
          ) : (
            applicableOptions.map((opt) => (
              <OptionField
                key={opt.key}
                option={opt}
                value={(module.options[opt.key] ?? opt.defaultValue) as string | boolean}
                onChange={(val) => {
                  setModuleOption(module.id, opt.key, val);
                  // Mutual exclusion: skylight and PV panels can't coexist on the same roof
                  if (opt.key === 'dachfenster' && val === true) {
                    setModuleOption(module.id, 'pv_panels', false);
                  }
                  if (opt.key === 'pv_panels' && val === true) {
                    setModuleOption(module.id, 'dachfenster', false);
                  }
                }}
                compact
              />
            ))
          )}

          {/* Skylight Configuration (shown when dachfenster is enabled) */}
          {module.options.dachfenster === true && module.type !== 'pergola' && (() => {
            const widthM = module.width * GRID_CELL_SIZE;
            const depthM = module.height * GRID_CELL_SIZE;
            const maxW = Math.min(SKYLIGHT_MAX_W, widthM - 0.3);
            const maxD = Math.min(SKYLIGHT_MAX_D, depthM - 0.3);

            const rawW = module.options.dachfenster_w;
            const slW = typeof rawW === 'number'
              ? Math.min(Math.max(SKYLIGHT_MIN, rawW), maxW)
              : Math.min(SKYLIGHT_DEFAULT_W, maxW);
            const rawD = module.options.dachfenster_d;
            const slD = typeof rawD === 'number'
              ? Math.min(Math.max(SKYLIGHT_MIN, rawD), maxD)
              : Math.min(SKYLIGHT_DEFAULT_D, maxD);

            return (
              <div className="rounded-lg border border-sky-200 bg-sky-50/50 px-3 py-2.5 space-y-2">
                <span className="text-xs font-medium text-gray-700">Dachfenster-Größe</span>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-gray-500">Breite</span>
                      <span className="text-[11px] text-gray-500">{slW.toFixed(1)} m</span>
                    </div>
                    <input
                      type="range"
                      min={SKYLIGHT_MIN}
                      max={maxW}
                      step={0.1}
                      value={slW}
                      onChange={(e) => setModuleOption(module.id, 'dachfenster_w', Number(e.target.value))}
                      className="w-full h-1.5 accent-sky-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-gray-500">Tiefe</span>
                      <span className="text-[11px] text-gray-500">{slD.toFixed(1)} m</span>
                    </div>
                    <input
                      type="range"
                      min={SKYLIGHT_MIN}
                      max={maxD}
                      step={0.1}
                      value={slD}
                      onChange={(e) => setModuleOption(module.id, 'dachfenster_d', Number(e.target.value))}
                      className="w-full h-1.5 accent-sky-500 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Min: {SKYLIGHT_MIN} m</span>
                  <span>Max: {maxW.toFixed(1)} × {maxD.toFixed(1)} m</span>
                </div>
              </div>
            );
          })()}

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
            const VALID_ORIENTATIONS = ['N', 'E', 'S', 'W'];
            const rawOrientation = typeof module.options.pv_orientation === 'string'
              ? module.options.pv_orientation : 'S';
            const currentOrientation = VALID_ORIENTATIONS.includes(rawOrientation) ? rawOrientation : 'S';

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

          {/* Pergola: Sichtschutz per side */}
          {module.type === 'pergola' && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-gray-600">Seitenschutz</p>
              {(['front', 'back', 'left', 'right'] as const).map((side) => {
                const key = `sichtschutz_${side}`;
                const labelMap = { front: 'Vorne', back: 'Hinten', left: 'Links', right: 'Rechts' };
                const val = (module.options[key] as string) ?? 'none';
                return (
                  <div key={side} className="flex items-center gap-2">
                    <label className="text-[11px] text-gray-500 shrink-0 w-12">{labelMap[side]}</label>
                    <select
                      value={val}
                      onChange={(e) => setModuleOption(module.id, key, e.target.value)}
                      className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs bg-white"
                    >
                      <option value="none">Keine</option>
                      <option value="lamellen">Lamellen-Sichtschutz</option>
                      <option value="markise">Senkrechtmarkise</option>
                    </select>
                  </div>
                );
              })}
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

const DIRECTION_NAMES: Record<string, string> = {
  N: 'Nord', E: 'Ost', S: 'Süd', W: 'West',
};

function CompassPicker({ value, onChange }: { value: string; onChange: (dir: string) => void }) {
  // Compass layout: 3x3 grid with only N/E/S/W + center dot
  // Row 0:  ·  N  ·
  // Row 1:  W  ·  E
  // Row 2:  ·  S  ·
  type DirEntry = { key: string; label: string } | null;
  const grid: DirEntry[][] = [
    [null, { key: 'N', label: 'N' }, null],
    [{ key: 'W', label: 'W' }, null, { key: 'E', label: 'O' }],
    [null, { key: 'S', label: 'S' }, null],
  ];

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-600">Ausrichtung</span>
        <span className="text-[11px] text-gray-400">{DIRECTION_NAMES[value] ?? value} (15°)</span>
      </div>
      <div className="inline-grid grid-cols-3 gap-0.5">
        {grid.map((row, ri) =>
          row.map((dir, ci) => {
            if (!dir) {
              // Empty corner cell or center compass indicator
              if (ri === 1 && ci === 1) {
                return (
                  <div key={`c-${ri}-${ci}`} className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 16 16" className="w-4 h-4 text-gray-300">
                      <circle cx="8" cy="8" r="2" fill="currentColor" />
                      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="0.8" />
                    </svg>
                  </div>
                );
              }
              return <div key={`e-${ri}-${ci}`} className="w-8 h-8" />;
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
