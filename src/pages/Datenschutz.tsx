export function Datenschutz() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Datenschutzerklaerung</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-base font-semibold text-gray-900">1. Verantwortlicher</h2>
          <p className="mt-2">
            Smart Modular Space<br />
            Musterstrasse 1, 12345 Musterstadt<br />
            E-Mail: datenschutz@smartmodularspace.de
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. Erhobene Daten</h2>
          <p className="mt-2">
            Diese Website verwendet <strong>keine Cookies</strong> und erhebt <strong>keine personenbezogenen Daten</strong>.
            Ihre Konfiguration wird ausschliesslich lokal in Ihrem Browser gespeichert (LocalStorage)
            und nicht an unsere Server uebertragen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. Hosting</h2>
          <p className="mt-2">
            Diese Website wird gehostet von [Hosting-Provider]. Beim Aufruf der Website werden
            automatisch technische Zugriffsdaten (IP-Adresse, Zeitpunkt, aufgerufene Seite) vom
            Hosting-Provider in Server-Logfiles gespeichert. Dies ist zur Sicherstellung des Betriebs
            gemaess Art. 6 Abs. 1 lit. f DSGVO erforderlich.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Lokale Datenspeicherung</h2>
          <p className="mt-2">
            Der 3D-Konfigurator speichert Ihre aktuelle Konfiguration im LocalStorage Ihres Browsers.
            Diese Daten verbleiben auf Ihrem Geraet und werden nicht an uns uebertragen. Sie koennen
            die gespeicherten Daten jederzeit ueber die Browser-Einstellungen loeschen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">5. Ihre Rechte</h2>
          <p className="mt-2">
            Sie haben das Recht auf Auskunft, Berichtigung, Loeschung und Einschraenkung der
            Verarbeitung Ihrer personenbezogenen Daten. Fuer Anfragen wenden Sie sich bitte an
            die oben genannte E-Mail-Adresse.
          </p>
        </section>

        <p className="text-xs text-gray-400 pt-4">
          Platzhalter -- bitte mit Ihren echten Datenschutzangaben ersetzen.
        </p>
      </div>
    </div>
  );
}
