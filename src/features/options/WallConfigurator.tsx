import { useState, useMemo } from 'react';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import type { WallConfig, WallSide, WallOpening } from '../../types/walls';
import { getDefaultWallConfig, DOOR_SPECS, WINDOW_SPECS } from '../../types/walls';
import { useConfigStore } from '../../store/useConfigStore';
import { getSharedWalls } from '../../utils/walls';
import { t } from '../../utils/i18n';

interface WallConfiguratorProps {
  module: PlacedModule;
  allModules: PlacedModule[];
}

const OUTER_HEIGHT = 2.5;

type WallState = 'wall' | 'window' | 'window-normal' | 'door' | 'terrace-door';
type InteriorState = 'open' | 'wall' | 'door' | 'terrace-door';

function getWallState(openings: WallOpening[]): WallState {
  if (openings.length === 0) return 'wall';
  const o = openings[0];
  // Distinguish between floor-level window and normal (elevated) window
  if (o.type === 'window' && o.offsetY > 0.1) return 'window-normal';
  return o.type;
}

function getInteriorState(wallConfig: WallConfig, side: WallSide): InteriorState {
  const interior = wallConfig.interiorWalls?.[side];
  if (!interior) return 'open';
  if (interior.length === 0) return 'wall';
  const tp = interior[0].type;
  if (tp === 'door') return 'door';
  if (tp === 'terrace-door') return 'terrace-door';
  return 'wall';
}

function createOpeningForState(
  state: WallState | InteriorState,
  wallWidthM: number,
): WallOpening[] {
  if (state === 'wall' || state === 'open') return [];
  const maxW = wallWidthM - 0.30; // 15cm margin per side (must match OpeningsGroup clamp)
  if (state === 'window') {
    const w = Math.min(2.0, maxW);
    return [{ type: 'window', position: 0.5, width: w, height: 2.0, offsetY: 0 }];
  }
  if (state === 'window-normal') {
    const w = Math.min(1.0, maxW);
    return [{ type: 'window', position: 0.5, width: w, height: 1.0, offsetY: 0.9 }];
  }
  if (state === 'door') {
    const w = Math.min(1.0, maxW);
    return [{ type: 'door', position: 0.5, width: w, height: 2.0, offsetY: 0, hingeSide: 'left', opensOutward: true }];
  }
  // terrace-door
  const w = Math.min(2.0, maxW);
  return [{ type: 'terrace-door', position: 0.5, width: w, height: 2.0, offsetY: 0, hingeSide: 'left', opensOutward: true }];
}

const WALL_LABELS: Record<WallSide, string> = {
  front: 'Vorne',
  back: 'Hinten',
  left: 'Links',
  right: 'Rechts',
};

// --- SVG Icons (inline, 16x16 viewBox) ---

function WallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="12" height="6" rx="0.5" />
      <line x1="5" y1="5" x2="5" y2="11" />
      <line x1="8" y1="5" x2="8" y2="11" />
      <line x1="11" y1="5" x2="11" y2="11" />
    </svg>
  );
}

function WindowFloorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function WindowNormalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth="1.5">
      {/* Window pane elevated from bottom */}
      <rect x="3" y="3" width="10" height="7" rx="0.5" />
      <line x1="8" y1="3" x2="8" y2="10" />
      <line x1="3" y1="6.5" x2="13" y2="6.5" />
      {/* Sill line */}
      <line x1="2" y1="11" x2="14" y2="11" strokeWidth="2" />
    </svg>
  );
}

function DoorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="8" height="12" rx="1" />
      <circle cx="10" cy="9" r="0.8" fill="currentColor" />
    </svg>
  );
}

function TerraceDoorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="2" width="13" height="12" rx="1" />
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="1.5" y1="8" x2="14.5" y2="8" />
    </svg>
  );
}

function OpenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? 'w-4 h-4'} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2">
      <rect x="2" y="5" width="12" height="6" rx="0.5" />
    </svg>
  );
}

const STATE_BUTTONS: { state: WallState; Icon: typeof WallIcon; label: string }[] = [
  { state: 'wall', Icon: WallIcon, label: 'Wand' },
  { state: 'window-normal', Icon: WindowNormalIcon, label: 'Fenster' },
  { state: 'window', Icon: WindowFloorIcon, label: 'Bodentief' },
  { state: 'door', Icon: DoorIcon, label: 'Tür' },
  { state: 'terrace-door', Icon: TerraceDoorIcon, label: 'Terr.-Tür' },
];

const INTERIOR_BUTTONS: { state: InteriorState; Icon: typeof WallIcon; label: string }[] = [
  { state: 'open', Icon: OpenIcon, label: 'Offen' },
  { state: 'wall', Icon: WallIcon, label: 'Trennw.' },
  { state: 'door', Icon: DoorIcon, label: 'Tür' },
  { state: 'terrace-door', Icon: TerraceDoorIcon, label: 'Terr.-Tür' },
];

export function WallConfigurator({ module, allModules }: WallConfiguratorProps) {
  const { setModuleWalls } = useConfigStore();
  const sharedWalls = useMemo(() => getSharedWalls(module, allModules), [module, allModules]);
  const [selectedSide, setSelectedSide] = useState<WallSide>('front');

  const wallConfig: WallConfig = useMemo(
    () => module.walls ?? getDefaultWallConfig(module.type, module.width, module.height),
    [module.walls, module.type, module.width, module.height],
  );

  const widthM = module.width * GRID_CELL_SIZE;
  const depthM = module.height * GRID_CELL_SIZE;

  const getWallWidthM = (side: WallSide) =>
    side === 'front' || side === 'back' ? widthM : depthM;

  const handleWallChange = (side: WallSide, newState: WallState) => {
    const wallWidthM = getWallWidthM(side);
    const newConfig: WallConfig = {
      ...wallConfig,
      [side]: createOpeningForState(newState, wallWidthM),
    };
    setModuleWalls(module.id, newConfig);
  };

  const handleInteriorWallChange = (side: WallSide, newState: InteriorState) => {
    const wallWidthM = getWallWidthM(side);
    const newConfig: WallConfig = { ...wallConfig };

    if (newState === 'open') {
      if (newConfig.interiorWalls) {
        const { [side]: _, ...rest } = newConfig.interiorWalls;
        newConfig.interiorWalls = Object.keys(rest).length > 0 ? (rest as Partial<Record<WallSide, WallOpening[]>>) : undefined;
      }
    } else {
      newConfig.interiorWalls = {
        ...newConfig.interiorWalls,
        [side]: createOpeningForState(newState, wallWidthM),
      };
    }

    setModuleWalls(module.id, newConfig);
  };

  const handleDimensionChange = (side: WallSide, dim: 'width' | 'height' | 'offsetY', value: number, isInterior = false) => {
    const wallWidthM = getWallWidthM(side);
    const maxW = wallWidthM - 0.30; // 15cm margin per side
    const maxH = OUTER_HEIGHT;

    // Get current opening to cross-validate height + offsetY
    const currentOpenings = isInterior
      ? wallConfig.interiorWalls?.[side]
      : wallConfig[side];
    if (!currentOpenings || currentOpenings.length === 0) return;
    const currentOpening = currentOpenings[0];

    let clampedValue: number;
    if (dim === 'width') {
      clampedValue = Math.min(Math.max(0.3, value), maxW);
    } else if (dim === 'height') {
      // Height must not exceed wall height minus current offsetY
      const effectiveMaxH = Math.max(0.3, maxH - (currentOpening.offsetY ?? 0));
      clampedValue = Math.min(Math.max(0.3, value), effectiveMaxH);
    } else {
      // offsetY must not push window above wall top (offsetY + height <= OUTER_HEIGHT)
      const effectiveMaxOffsetY = Math.max(0, maxH - (currentOpening.height ?? 0.5));
      clampedValue = Math.min(Math.max(0, value), effectiveMaxOffsetY);
    }

    if (isInterior) {
      const updated = currentOpenings.map((o) => ({ ...o, [dim]: clampedValue }));
      setModuleWalls(module.id, {
        ...wallConfig,
        interiorWalls: { ...wallConfig.interiorWalls, [side]: updated },
      });
    } else {
      const updated = currentOpenings.map((o) => ({ ...o, [dim]: clampedValue }));
      setModuleWalls(module.id, { ...wallConfig, [side]: updated });
    }
  };

  const handleOpeningPropertyChange = (side: WallSide, prop: 'hingeSide' | 'opensOutward', value: string | boolean, isInterior = false) => {
    if (isInterior) {
      const openings = wallConfig.interiorWalls?.[side];
      if (!openings || openings.length === 0) return;
      const updated = openings.map((o) => ({ ...o, [prop]: value }));
      setModuleWalls(module.id, {
        ...wallConfig,
        interiorWalls: { ...wallConfig.interiorWalls, [side]: updated },
      });
    } else {
      const openings = wallConfig[side];
      if (openings.length === 0) return;
      const updated = openings.map((o) => ({ ...o, [prop]: value }));
      setModuleWalls(module.id, { ...wallConfig, [side]: updated });
    }
  };

  // --- Render selected side controls ---
  const isShared = sharedWalls.has(selectedSide);
  const wallWidthM = getWallWidthM(selectedSide);
  const maxW = wallWidthM - 0.30; // 15cm margin per side

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {t('walls.title')}
      </label>

      {/* Side tabs */}
      <div className="flex gap-1 mb-2">
        {(['front', 'back', 'left', 'right'] as WallSide[]).map((side) => {
          const isActive = selectedSide === side;
          const sideShared = sharedWalls.has(side);
          return (
            <button
              key={side}
              type="button"
              onClick={() => setSelectedSide(side)}
              className={`flex-1 rounded-md px-1 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {WALL_LABELS[side]}
              {sideShared && <span className="ml-0.5 text-[9px] opacity-70">*</span>}
            </button>
          );
        })}
      </div>

      {/* Selected side header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-800">
          {WALL_LABELS[selectedSide]}
        </span>
        {isShared && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            {t('walls.shared')}
          </span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {wallWidthM.toFixed(1)} m
        </span>
      </div>

      {/* Controls for the selected side */}
      {isShared ? (
        <InteriorWallControls
          side={selectedSide}
          wallConfig={wallConfig}
          maxW={maxW}
          wallWidthM={wallWidthM}
          onStateChange={(state) => handleInteriorWallChange(selectedSide, state)}
          onDimensionChange={(dim, val) => handleDimensionChange(selectedSide, dim, val, true)}
          onOpeningPropertyChange={(prop, val) => handleOpeningPropertyChange(selectedSide, prop, val, true)}
        />
      ) : (
        <ExteriorWallControls
          side={selectedSide}
          wallConfig={wallConfig}
          maxW={maxW}
          wallWidthM={wallWidthM}
          onStateChange={(state) => handleWallChange(selectedSide, state)}
          onDimensionChange={(dim, val) => handleDimensionChange(selectedSide, dim, val)}
          onOpeningPropertyChange={(prop, val) => handleOpeningPropertyChange(selectedSide, prop, val)}
        />
      )}
    </div>
  );
}

// --- Exterior wall controls ---
function ExteriorWallControls({
  side,
  wallConfig,
  maxW,
  wallWidthM,
  onStateChange,
  onDimensionChange,
  onOpeningPropertyChange,
}: {
  side: WallSide;
  wallConfig: WallConfig;
  maxW: number;
  wallWidthM: number;
  onStateChange: (state: WallState) => void;
  onDimensionChange: (dim: 'width' | 'height' | 'offsetY', val: number) => void;
  onOpeningPropertyChange: (prop: 'hingeSide' | 'opensOutward', val: string | boolean) => void;
}) {
  const state = getWallState(wallConfig[side]);
  const opening = wallConfig[side][0];
  const isDoor = state === 'door' || state === 'terrace-door';

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {STATE_BUTTONS.map((btn) => (
          <button
            key={btn.state}
            type="button"
            onClick={() => onStateChange(btn.state)}
            className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors ${
              state === btn.state
                ? 'border-wood-500 bg-wood-50 text-wood-700 font-medium'
                : 'border-gray-200 text-gray-500 hover:border-wood-300 hover:bg-gray-50'
            }`}
          >
            <btn.Icon className="w-5 h-5" />
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {state !== 'wall' && opening && (
        <DimensionInputs
          opening={opening}
          maxW={maxW}
          wallWidthM={wallWidthM}
          showOffsetY={state === 'window-normal'}
          onWidthChange={(v) => onDimensionChange('width', v)}
          onHeightChange={(v) => onDimensionChange('height', v)}
          onOffsetYChange={(v) => onDimensionChange('offsetY', v)}
        />
      )}

      {isDoor && opening && (
        <DoorDirectionControls
          opening={opening}
          onOpeningPropertyChange={onOpeningPropertyChange}
        />
      )}

      {/* Material & glazing info */}
      {state !== 'wall' && (
        <MaterialInfo isDoor={isDoor} />
      )}
    </div>
  );
}

// --- Interior wall controls (for shared walls) ---
function InteriorWallControls({
  side,
  wallConfig,
  maxW,
  wallWidthM,
  onStateChange,
  onDimensionChange,
  onOpeningPropertyChange,
}: {
  side: WallSide;
  wallConfig: WallConfig;
  maxW: number;
  wallWidthM: number;
  onStateChange: (state: InteriorState) => void;
  onDimensionChange: (dim: 'width' | 'height', val: number) => void;
  onOpeningPropertyChange: (prop: 'hingeSide' | 'opensOutward', val: string | boolean) => void;
}) {
  const intState = getInteriorState(wallConfig, side);
  const intOpening = wallConfig.interiorWalls?.[side]?.[0];
  const isDoor = intState === 'door' || intState === 'terrace-door';

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {INTERIOR_BUTTONS.map((btn) => (
          <button
            key={btn.state}
            type="button"
            onClick={() => onStateChange(btn.state)}
            className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors ${
              intState === btn.state
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-gray-50'
            }`}
          >
            <btn.Icon className="w-5 h-5" />
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {intState !== 'open' && intState !== 'wall' && intOpening && (
        <DimensionInputs
          opening={intOpening}
          maxW={maxW}
          wallWidthM={wallWidthM}
          onWidthChange={(v) => onDimensionChange('width', v)}
          onHeightChange={(v) => onDimensionChange('height', v)}
        />
      )}

      {isDoor && intOpening && (
        <DoorDirectionControls
          opening={intOpening}
          onOpeningPropertyChange={onOpeningPropertyChange}
        />
      )}
    </div>
  );
}

// --- Dimension inputs ---
function DimensionInputs({
  opening,
  maxW,
  wallWidthM,
  showOffsetY,
  onWidthChange,
  onHeightChange,
  onOffsetYChange,
}: {
  opening: WallOpening;
  maxW: number;
  wallWidthM: number;
  showOffsetY?: boolean;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
  onOffsetYChange?: (v: number) => void;
}) {
  const atMax = opening.width >= maxW - 0.01;

  return (
    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Breite</span>
          <input
            type="number"
            step="0.1"
            min="0.3"
            max={maxW}
            value={opening.width}
            onChange={(e) => onWidthChange(parseFloat(e.target.value) || 0.5)}
            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center focus:border-wood-400 focus:ring-1 focus:ring-wood-200 focus:outline-none"
          />
          <span className="text-xs text-gray-400">m</span>
        </label>
        <span className="text-gray-300">&times;</span>
        <label className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Höhe</span>
          <input
            type="number"
            step="0.1"
            min="0.3"
            max={OUTER_HEIGHT}
            value={opening.height}
            onChange={(e) => onHeightChange(parseFloat(e.target.value) || 0.5)}
            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center focus:border-wood-400 focus:ring-1 focus:ring-wood-200 focus:outline-none"
          />
          <span className="text-xs text-gray-400">m</span>
        </label>
      </div>
      {showOffsetY && onOffsetYChange && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-xs text-gray-500">Brüstung</span>
          <input
            type="number"
            step="0.1"
            min="0"
            max={OUTER_HEIGHT - 0.5}
            value={opening.offsetY}
            onChange={(e) => onOffsetYChange(parseFloat(e.target.value) || 0)}
            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center focus:border-wood-400 focus:ring-1 focus:ring-wood-200 focus:outline-none"
          />
          <span className="text-xs text-gray-400">m</span>
        </div>
      )}
      {atMax && (
        <p className="mt-1.5 text-[11px] text-amber-600">
          Max. {wallWidthM.toFixed(1)} m Breite
        </p>
      )}
    </div>
  );
}

// --- Door direction controls (hinge side + open direction) ---
function DoorDirectionControls({
  opening,
  onOpeningPropertyChange,
}: {
  opening: WallOpening;
  onOpeningPropertyChange: (prop: 'hingeSide' | 'opensOutward', val: string | boolean) => void;
}) {
  const hingeSide = opening.hingeSide ?? 'left';
  const opensOutward = opening.opensOutward ?? true;

  const options: { label: string; hinge: 'left' | 'right'; outward: boolean }[] = [
    { label: 'Scharnier links — öffnet nach außen', hinge: 'left', outward: true },
    { label: 'Scharnier rechts — öffnet nach außen', hinge: 'right', outward: true },
    { label: 'Scharnier links — öffnet nach innen', hinge: 'left', outward: false },
    { label: 'Scharnier rechts — öffnet nach innen', hinge: 'right', outward: false },
  ];

  return (
    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="text-xs font-medium text-gray-600 mb-2">Öffnungsrichtung</p>
      <div className="grid grid-cols-1 gap-1.5">
        {options.map((opt) => {
          const isActive = hingeSide === opt.hinge && opensOutward === opt.outward;
          return (
            <button
              key={`${opt.hinge}-${opt.outward}`}
              type="button"
              onClick={() => {
                onOpeningPropertyChange('hingeSide', opt.hinge);
                onOpeningPropertyChange('opensOutward', opt.outward);
              }}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs text-left transition-colors ${
                isActive
                  ? 'border-wood-500 bg-wood-50 text-wood-700 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-wood-300 hover:bg-white'
              }`}
            >
              {/* Door direction mini icon */}
              <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.2">
                {/* Door frame */}
                <rect x="3" y="2" width="14" height="16" rx="0.5" />
                {/* Hinge marker */}
                <circle
                  cx={opt.hinge === 'left' ? 4.5 : 15.5}
                  cy="10"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
                {/* Swing arc */}
                <path
                  d={
                    opt.hinge === 'left'
                      ? (opt.outward
                        ? 'M 17 2 Q 17 10, 5 10'
                        : 'M 17 18 Q 17 10, 5 10')
                      : (opt.outward
                        ? 'M 3 2 Q 3 10, 15 10'
                        : 'M 3 18 Q 3 10, 15 10')
                  }
                  strokeDasharray="2 1.5"
                />
              </svg>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Material / glazing info ---
function MaterialInfo({ isDoor }: { isDoor: boolean }) {
  const specs = isDoor ? DOOR_SPECS : WINDOW_SPECS;
  return (
    <div className="mt-2 flex items-start gap-1.5 px-1">
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a1 1 0 110 2 1 1 0 010-2zm1 8H7v-1h1V7.5H7v-1h2V11h1v1z" />
      </svg>
      <span className="text-[11px] text-gray-400 leading-tight">
        {specs.glazing} · {specs.glassType} · {specs.material}
      </span>
    </div>
  );
}

