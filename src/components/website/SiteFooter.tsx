import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/* Logo / Brand */}
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-wood-700">Modul-Garten</p>
            <p className="text-xs text-gray-400">Modulare Raumsysteme in Holzbauweise</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <Link to="/ueber-uns" className="hover:text-wood-600 transition-colors">Konzept</Link>
            <Link to="/kontakt" className="hover:text-wood-600 transition-colors">Kontakt</Link>
            <Link to="/impressum" className="hover:text-wood-600 transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-wood-600 transition-colors">Datenschutz</Link>
          </nav>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Modul-Garten. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
