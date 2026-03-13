import { Card } from '../../components/ui/Card';
import { useConfigStore } from '../../store/useConfigStore';
import { TEMPLATES } from '../../data/templates';
import { formatPrice } from '../../data/pricing';
import { t } from '../../utils/i18n';
import { TemplateMiniPreview } from './TemplateMiniPreview';

export function TemplateSelectionStep() {
  const { templateId, modules, loadTemplate, reset } = useConfigStore();

  const isBlankSelected = templateId === null && modules.length === 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{t('template.select')}</h2>
      <p className="mt-1 text-gray-500">{t('template.description')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Blank scene card */}
        <Card
          selected={isBlankSelected}
          onClick={() => reset()}
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Leere Szene</h3>
              <span className="inline-block mt-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Freie Gestaltung
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Starten Sie mit einer leeren Fläche und platzieren Sie Module komplett nach Ihren Vorstellungen – volle Freiheit im 3D-Konfigurator.
          </p>
          <div className="mt-3 flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 h-[104px]">
            <div className="text-center text-gray-400">
              <svg className="mx-auto h-10 w-10 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-xs">Eigene Konfiguration</span>
            </div>
          </div>
        </Card>

        {/* Template cards */}
        {TEMPLATES.map((tpl) => (
          <Card
            key={tpl.id}
            selected={templateId === tpl.id}
            onClick={() => loadTemplate(tpl.id)}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{tpl.name}</h3>
                <span className="inline-block mt-1 rounded-full bg-wood-100 px-2.5 py-0.5 text-xs font-medium text-wood-700">
                  {tpl.persons}
                </span>
              </div>
              <span className="text-lg font-bold text-wood-600">
                {t('price.from')} {formatPrice(tpl.basePrice)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{tpl.description}</p>
            <div className="mt-3 overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
              {tpl.image ? (
                <img
                  src={tpl.image}
                  alt={tpl.name}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="p-3">
                  <TemplateMiniPreview modules={tpl.modules} />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
