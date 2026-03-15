import { Link } from 'react-router-dom';
import { t } from '../../utils/i18n';
import { useConfigStore } from '../../store/useConfigStore';
import { selectTotalPrice } from '../../store/selectors';
import { formatPrice } from '../../data/pricing';

export function Header() {
  const modules = useConfigStore((s) => s.modules);
  const total = selectTotalPrice(modules);

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity" title="Zur Startseite">
            <img src="/logo.png" alt="Modul-Garten" className="h-8 w-auto" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-wood-800">{t('app.title')}</h1>
            <p className="text-sm text-gray-500">{t('app.subtitle')}</p>
          </div>
        </div>
        {modules.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-500">{t('price.total')}</p>
            <p className="text-lg font-bold text-wood-700">{formatPrice(total)}</p>
          </div>
        )}
      </div>
    </header>
  );
}
