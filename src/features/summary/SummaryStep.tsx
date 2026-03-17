import { useState, useRef } from 'react';
import type { PlacedModule } from '../../types/grid';
import type { WallSide } from '../../types/walls';
import { getDefaultWallConfig } from '../../types/walls';
import { useConfigStore } from '../../store/useConfigStore';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { MODULE_OPTIONS } from '../../data/options';
import { GRID_CELL_SIZE } from '../../types/grid';
import { calculateModulePrice, formatPrice } from '../../data/pricing';
import { calculateMaxPanels, calculateKWp } from '../../utils/pvCalculation';
import { getSharedWalls } from '../../utils/walls';
import { selectTotalPrice, selectTotalDimensions } from '../../store/selectors';
import { VisualizationContainer } from '../visualization/VisualizationContainer';
import { GridCanvas } from '../visualization/GridCanvas';
import { PdfExport, generatePdfBlob } from './PdfExport';
import { Button } from '../../components/ui/Button';
import { TEMPLATES } from '../../data/templates';
import { t } from '../../utils/i18n';
import { encodeConfig } from '../../utils/config-url';
import { API_BASE_URL } from '../../config/api';

export function SummaryStep() {
  const { modules, templateId } = useConfigStore();
  const totalPrice = selectTotalPrice(modules);
  const totalDims = selectTotalDimensions(modules);
  const template = TEMPLATES.find((tp) => tp.id === templateId);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const vizContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // 1. Generate PDF blob
      const pdfBlob = await generatePdfBlob({
        modules,
        templateName: template?.name,
        totalPrice,
        totalDimensions: totalDims,
        svgRef,
        vizContainerRef,
      });

      // 2. Encode config for shareable link
      const configParam = encodeConfig({ templateId, modules });
      const base = import.meta.env.BASE_URL || '/';
      const shareUrl = `${window.location.origin}${base}view?config=${configParam}`;

      // 3. Build FormData
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('message', message);
      formData.append('configUrl', shareUrl);
      formData.append('pdf', pdfBlob, 'modulhaus-konfiguration.pdf');
      formData.append('_hp', honeypot); // honeypot for spam protection

      // 4. Build config summary for email (including wall details)
      const SIDE_NAMES: Record<WallSide, string> = {
        front: 'Vorne', back: 'Hinten', left: 'Links', right: 'Rechts',
      };
      const OPENING_NAMES: Record<string, string> = {
        window: 'Fenster', door: 'Tür', 'terrace-door': 'Terrassentür',
      };

      const configSummary = {
        templateName: template?.name || null,
        totalPrice: formatPrice(totalPrice),
        totalDimensions: totalDims,
        moduleCount: modules.length,
        modules: modules.map((mod, idx) => {
          const def = MODULE_DEFINITIONS[mod.type];
          const price = calculateModulePrice(mod);
          const widthM = (mod.width * GRID_CELL_SIZE).toFixed(1);
          const depthM = (mod.height * GRID_CELL_SIZE).toFixed(1);

          // Options
          const options: string[] = [];
          for (const opt of MODULE_OPTIONS) {
            if (!opt.appliesTo.includes(mod.type)) continue;
            const value = mod.options[opt.key] ?? opt.defaultValue;
            if (opt.type === 'select' && opt.options) {
              const selected = opt.options.find((o) => o.value === value);
              if (selected && selected.value !== opt.options[0]?.value) {
                options.push(selected.label);
              }
            }
            if (opt.type === 'checkbox' && value === true) {
              options.push(opt.label);
            }
          }

          // Wall details per side
          const walls = mod.walls ?? getDefaultWallConfig(mod.type, mod.width, mod.height);
          const shared = getSharedWalls(mod, modules);
          const sides: WallSide[] = ['front', 'back', 'left', 'right'];
          const wallDetails = sides.map((side) => {
            if (shared.has(side)) {
              return { side: SIDE_NAMES[side], detail: 'Verbundwand' };
            }
            const openings = walls[side];
            if (!openings || openings.length === 0) {
              return { side: SIDE_NAMES[side], detail: 'Geschlossen' };
            }
            const parts = openings.map((o) => {
              const name = OPENING_NAMES[o.type] ?? o.type;
              let text = `${name} ${o.width.toFixed(1)} × ${o.height.toFixed(1)} m`;
              if (o.position !== undefined && Math.abs(o.position - 0.5) >= 0.03) {
                text += `, Pos. ${Math.round(o.position * 100)}%`;
              }
              if (o.type === 'window' && o.offsetY && o.offsetY > 0) {
                text += `, Brüstung ${o.offsetY.toFixed(1)} m`;
              }
              if (o.type === 'door' || o.type === 'terrace-door') {
                const hinge = o.hingeSide === 'right' ? 'rechts' : 'links';
                const dir = o.opensOutward === false ? 'innen' : 'außen';
                text += `, Scharnier ${hinge} ${dir}`;
              }
              return text;
            });
            return { side: SIDE_NAMES[side], detail: parts.join('; ') };
          });

          return {
            name: `${def?.name ?? mod.type} #${idx + 1}`,
            dimensions: `${widthM} × ${depthM} m`,
            price: formatPrice(price),
            options,
            walls: wallDetails,
          };
        }),
      };
      formData.append('configData', JSON.stringify(configSummary));

      // 5. Submit to backend
      const response = await fetch(`${import.meta.env.BASE_URL}api/contact.php`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSent(true);
      } else {
        setError(result.message || 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (err) {
      console.error('Form submission failed:', err);
      setError('Senden fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="mt-4 rounded-xl bg-nature-50 border border-nature-500 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-nature-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-nature-800">Anfrage erfolgreich gesendet!</p>
                <p className="mt-1 text-sm text-nature-700">
                  Vielen Dank für Ihre Anfrage. Sie erhalten in Kürze eine Bestätigung per E-Mail mit Ihrer Konfiguration als PDF.
                  Wir melden uns schnellstmöglich bei Ihnen.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            {/* Honeypot — hidden from users, filled by bots */}
            <input
              type="text"
              name="_hp"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="sr-only"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <input
              type="text"
              placeholder={t('summary.contact.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:ring-1 focus:ring-wood-500 disabled:opacity-50"
            />
            <input
              type="email"
              placeholder={t('summary.contact.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:ring-1 focus:ring-wood-500 disabled:opacity-50"
            />
            <input
              type="tel"
              placeholder={t('summary.contact.phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:ring-1 focus:ring-wood-500 disabled:opacity-50"
            />
            <textarea
              placeholder={t('summary.contact.message')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:ring-1 focus:ring-wood-500 disabled:opacity-50"
            />

            {/* DSGVO Checkbox */}
            <label className="flex items-start gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                required
                disabled={submitting}
                className="mt-0.5 rounded border-gray-300 text-wood-600 focus:ring-wood-500"
              />
              <span>
                Ich stimme der Verarbeitung meiner Daten gemäß der{' '}
                <a href={`${import.meta.env.BASE_URL}datenschutz`} target="_blank" className="text-wood-600 underline hover:text-wood-800">
                  Datenschutzerklärung
                </a>{' '}
                zu.
              </span>
            </label>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={submitting || !privacy}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Wird gesendet...
                </span>
              ) : (
                t('summary.contact.send')
              )}
            </Button>
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
