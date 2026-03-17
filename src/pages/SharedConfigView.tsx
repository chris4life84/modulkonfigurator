import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { decodeConfig } from '../utils/config-url';
import { MODULE_DEFINITIONS } from '../data/module-types';
import { GRID_CELL_SIZE } from '../types/grid';
import { VisualizationContainer } from '../features/visualization/VisualizationContainer';

export function SharedConfigView() {
  const [searchParams] = useSearchParams();
  const configParam = searchParams.get('config');

  const config = useMemo(() => {
    if (!configParam) return null;
    return decodeConfig(configParam);
  }, [configParam]);

  if (!config || config.modules.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Konfiguration nicht gefunden</h2>
          <p className="mt-2 text-sm text-gray-500">
            Der Link ist ungültig oder die Konfiguration konnte nicht geladen werden.
          </p>
          <a
            href={`${import.meta.env.BASE_URL}konfigurator`}
            className="mt-6 inline-block rounded-lg bg-wood-600 px-4 py-2 text-sm font-medium text-white hover:bg-wood-700"
          >
            Zum Konfigurator
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Minimal header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">Modulhaus-Konfigurator</h1>
            <span className="rounded-full bg-wood-100 px-2.5 py-0.5 text-xs font-medium text-wood-700">
              Geteilte Ansicht
            </span>
          </div>
          <a
            href={`${import.meta.env.BASE_URL}konfigurator`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Eigene Konfiguration erstellen
          </a>
        </div>
      </header>

      {/* Info banner */}
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-2">
        <p className="mx-auto max-w-6xl text-xs text-blue-700">
          <svg className="mr-1 inline-block h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 6.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
          </svg>
          Diese Ansicht zeigt eine geteilte Konfiguration. Wechseln Sie zwischen 2D- und 3D-Ansicht mit dem Toggle oben rechts.
        </p>
      </div>

      {/* Visualization - takes most of the viewport */}
      <div className="flex-1 p-4">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
            <VisualizationContainer modules={config.modules} interactive={false} />
          </div>

          {/* Compact module list */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {config.modules.map((module, idx) => {
              const def = MODULE_DEFINITIONS[module.type];
              const widthM = (module.width * GRID_CELL_SIZE).toFixed(1);
              const depthM = (module.height * GRID_CELL_SIZE).toFixed(1);
              return (
                <div
                  key={module.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: def?.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {def?.name} #{idx + 1}
                    </p>
                    <p className="text-xs text-gray-500">
                      {widthM} × {depthM} m
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
