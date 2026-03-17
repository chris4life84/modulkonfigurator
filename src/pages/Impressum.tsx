import { assetPath } from '../utils/asset-path';

export function Impressum() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Impressum</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-base font-semibold text-gray-900">Angaben gemäß &sect; 5 TMG</h2>
          <p className="mt-2">
            Modul-Garten<br />
            Sven Eickner<br />
            Kemnitzerwaldstr 17<br />
            14542 Werder (Havel), Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Kontakt</h2>
          <p className="mt-2">
            Telefon: 017621448350<br />
            E-Mail: s.eickner@gmx.de
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Rechtsform</h2>
          <p className="mt-2">Einzelunternehmer</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Umsatzsteuer-ID</h2>
          <p className="mt-2">
            Umsatzsteuer-Identifikationsnummer gemäß &sect; 27a Umsatzsteuergesetz:<br />
            DE339577549
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Verantwortlich für den Inhalt nach &sect; 55 Abs. 2 RStV</h2>
          <p className="mt-2">
            Sven Eickner<br />
            Kemnitzerwaldstr 17<br />
            14542 Werder (Havel), Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Haftungsausschluss</h2>
          <p className="mt-2">
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          </p>
        </section>
      </div>

      {/* Logo */}
      <div className="mt-12 flex justify-center">
        <img src={assetPath('/logo.png')} alt="Modul-Garten" className="h-16 w-auto opacity-60" />
      </div>
    </div>
  );
}
