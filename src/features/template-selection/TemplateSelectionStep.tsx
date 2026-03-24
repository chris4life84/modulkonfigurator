import { Card } from '../../components/ui/Card';
import { useConfigStore } from '../../store/useConfigStore';
import { TEMPLATES } from '../../data/templates';
import { formatPrice } from '../../data/pricing';
import { t } from '../../utils/i18n';
import { TemplateMiniPreview } from './TemplateMiniPreview';

export function TemplateSelectionStep() {
  const { templateId, loadTemplate } = useConfigStore();
  const showPrices = typeof window !== 'undefined' && (window as any).__CONFIGURATOR_SHOW_PRICES;

  // Separate into sections
  const emptyTemplate = TEMPLATES.find((tpl) => tpl.id === 'leer');
  const hausTemplates = TEMPLATES.filter((tpl) =>
    ['starter-modul', 'geraeteschuppen', 'gartenhaus', 'kompakt-kubus', 'kubus-terrasse', 'garten-studio', 'studio-terrasse', 'garden-office-deluxe'].includes(tpl.id)
  );
  const saunaTemplates = TEMPLATES.filter((tpl) =>
    ['sauna-kompakt', 'sauna-deluxe', 'sauna-terrasse', 'wellness-suite'].includes(tpl.id)
  );

  const renderCard = (tpl: typeof TEMPLATES[0]) => (
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
        <div className="text-right">
          {tpl.modules.length > 0 && (
            <span className="text-sm font-medium text-wood-500">
              {tpl.modules.length} {tpl.modules.length === 1 ? 'Modul' : 'Module'}
            </span>
          )}
          {showPrices && tpl.basePrice > 0 && (
            <div className="text-lg font-bold text-wood-600">
              {t('price.from')} {formatPrice(tpl.basePrice)}
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{tpl.description}</p>

      {/* Preview: use image if available, otherwise SVG mini-preview */}
      {tpl.image ? (
        <div className="rounded-lg overflow-hidden bg-gray-100">
          <img
            src={tpl.image}
            alt={tpl.name}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      ) : tpl.modules.length > 0 ? (
        <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-3">
          <TemplateMiniPreview modules={tpl.modules} />
        </div>
      ) : (
        <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-6 flex flex-col items-center justify-center h-32">
          <span className="text-3xl mb-1">🌿</span>
          <span className="text-sm text-green-600 font-medium">Leere Fläche</span>
        </div>
      )}
    </Card>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{t('template.select')}</h2>
      <p className="mt-1 text-gray-500">{t('template.description')}</p>

      {/* Top row: Leere Szene */}
      {emptyTemplate && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {renderCard(emptyTemplate)}
        </div>
      )}

      {/* Modulhaus section */}
      {hausTemplates.length > 0 && (
        <>
          <h3 className="mt-8 mb-4 text-lg font-semibold text-gray-700 border-b pb-2">
            🏠 Modulhaus
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {hausTemplates.map(renderCard)}
          </div>
        </>
      )}

      {/* Sauna & Wellness section */}
      {saunaTemplates.length > 0 && (
        <>
          <h3 className="mt-8 mb-4 text-lg font-semibold text-gray-700 border-b pb-2">
            🔥 Sauna & Wellness
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {saunaTemplates.map(renderCard)}
          </div>
        </>
      )}
    </div>
  );
}
