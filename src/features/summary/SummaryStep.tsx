import { useState, useRef } from 'react';
import type { PlacedModule } from '../../types/grid';
import { useConfigStore } from '../../store/useConfigStore';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { MODULE_OPTIONS } from '../../data/options';
import { GRID_CELL_SIZE } from '../../types/grid';
import { calculateModulePrice, formatPrice } from '../../data/pricing';
import { calculateMaxPanels, calculateKWp } from '../../utils/pvCalculation';
import { selectTotalPrice, selectTotalDimensions } from '../../store/selectors';
import { VisualizationContainer } from '../visualization/VisualizationContainer';
import { GridCanvas } from '../visualization/GridCanvas';
import { PdfExport } from './PdfExport';
import { Button } from '../../components/ui/Button';
import { TEMPLATES } from '../../data/templates';
import { t } from '../../utils/i18n';

export function SummaryStep() {
  const { modules, templateId } = useConfigStore();
  const totalPrice = selectTotalPrice(modules);
  const totalDims = selectTotalDimensions(modules);
  const template = TEMPLATES.find((tp) => tp.id === templateId);
  const [sent, setSent] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const vizContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{t('summary.title')}</h2>

      {/* 3D/2D Visualization */}
      <div
        ref={vizContainerRef}
        className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-2 overflow-hidden"
        style={{ height: '300px' }}
      >
        <VisualizationContainer modules={modules} interactive={false} />
      </div>

      {/* Hidden SVG for PDF export */}
      <div className="sr-only" aria-hidden="true">
        <div style={{ width: 800, height: 400 }}>
          <GridCanvas ref={svgRef} modules={modules} interactive={false} />
        </div>
      </div>

      {/* Summary info */}
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {t('summary.dimensions')}: <strong>{totalDims}</strong>
        </span>
        {template && <span className="text-gray-400">Vorlage: {template.name}</span>}
      </div>

      {/* Module breakdown */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('summary.modules')}</h3>
        <div className="space-y-2">
          {modules.map((module, idx) => {
            const def = MODULE_DEFINITIONS[module.type];
            const price = calculateModulePrice(module);

            return (
              <div
                key={module.id}
                className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-1 h-3 w-3 rounded-full"
                    style={{ backgroundColor: def?.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {def?.name} #{idx + 1}
                    </p>
                    <ModuleOptionsSummary module={module} />
                  </div>
                </div>
                <span className="font-semibold text-gray-700">{formatPrice(price)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total + PDF */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-wood-50 border border-wood-200 p-4">
        <div>
          <span className="text-lg font-bold text-wood-800">{t('summary.total')}</span>
          <div className="mt-1">
            <PdfExport
              modules={modules}
              templateName={template?.name}
              totalPrice={totalPrice}
              totalDimensions={totalDims}
              svgRef={svgRef}
              vizContainerRef={vizContainerRef}
            />
          </div>
        </div>
        <span className="text-2xl font-bold text-wood-700">{formatPrice(totalPrice)}</span>
      </div>

      {/* Contact form */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900">{t('summary.contact')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('summary.contact.description')}</p>

        {sent ? (
          <div className="mt-4 rounded-xl bg-nature-50 border border-nature-500 p-4 text-nature-700">
            {t('summary.contact.sent')}
          </div>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <input
              type="text"
              placeholder={t('summary.contact.name')}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:ring-1 focus:ring-wood-500"
            />
            <input
              type="email"
              placeholder={t('summary.contact.email')}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:ring-1 focus:ring-wood-500"
            />
            <input
              type="tel"
              placeholder={t('summary.contact.phone')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:ring-1 focus:ring-wood-500"
            />
            <textarea
              placeholder={t('summary.contact.message')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:ring-1 focus:ring-wood-500"
            />
            <Button type="submit">{t('summary.contact.send')}</Button>
          </form>
        )}
      </div>
    </div>
  );
}

function ModuleOptionsSummary({ module }: { module: PlacedModule }) {
  const details: string[] = [];

  for (const opt of MODULE_OPTIONS) {
    if (!opt.appliesTo.includes(module.type)) continue;
    const value = module.options[opt.key] ?? opt.defaultValue;

    if (opt.type === 'select' && opt.options) {
      const selected = opt.options.find((o) => o.value === value);
      if (selected && selected.value !== opt.options[0]?.value) {
        details.push(selected.label);
      }
    }
    if (opt.type === 'checkbox' && value === true) {
      if (opt.key === 'pv_panels') {
        const widthM = module.width * GRID_CELL_SIZE;
        const depthM = module.height * GRID_CELL_SIZE;
        const { maxPanels, rotated } = calculateMaxPanels(widthM, depthM);
        const panelCount = (module.options.pv_panel_count as number) ?? maxPanels;
        const orientation = (module.options.pv_orientation as string) ?? 'S';
        const kWp = calculateKWp(panelCount);
        const orientLabels: Record<string, string> = { S: 'Süd', N: 'Nord', E: 'Ost', W: 'West' };
        const formatLabel = rotated ? 'Querformat' : 'Hochformat';
        details.push(
          `PV: ${panelCount} Panels (${formatLabel}, ${orientLabels[orientation] ?? orientation}), ${kWp.toFixed(1)} kWp`,
        );
      } else {
        details.push(opt.label);
      }
    }
  }

  if (details.length === 0) return null;

  return <p className="text-xs text-gray-500 mt-0.5">{details.join(' · ')}</p>;
}
