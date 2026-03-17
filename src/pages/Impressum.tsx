import { assetPath } from '../utils/asset-path';

export function Impressum() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Impressum</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-base font-semibold text-gray-900">Angaben gemaess &sect; 5 TMG</h2>
          <p className="mt-2">
            Modul-Garten<br />
            Musterstrasse 1<br />
            12345 Musterstadt
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Kontakt</h2>
          <p className="mt-2">
            Telefon: +49 (0) 123 456 789<br />
            E-Mail: info@modul-garten.de
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Umsatzsteuer-ID</h2>
          <p className="mt-2">
            Umsatzsteuer-Identifikationsnummer gemaess &sect; 27a Umsatzsteuergesetz:<br />
            DE 123 456 789
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Verantwortlich fuer den Inhalt nach &sect; 55 Abs. 2 RStV</h2>
          <p className="mt-2">
            Max Mustermann<br />
            Musterstrasse 1<br />
            12345 Musterstadt
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Haftungsausschluss</h2>
          <p className="mt-2">
            Die Inhalte unserer Seiten wurden mit groesster Sorgfalt erstellt. Fuer die Richtigkeit,
            Vollstaendigkeit und Aktualitaet der Inhalte koennen wir jedoch keine Gewaehr uebernehmen.
          </p>
        </section>

        <p className="text-xs text-gray-400 pt-4">
          Platzhalter -- bitte mit Ihren echten Firmendaten ersetzen.
        </p>
      </div>

      {/* Logo */}
      <div className="mt-12 flex justify-center">
        <img src={assetPath('/logo.png')} alt="Modul-Garten" className="h-16 w-auto opacity-60" />
      </div>
    </div>
  );
}
