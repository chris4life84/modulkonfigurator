import { assetPath } from '../utils/asset-path';

export function Datenschutz() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Datenschutzerklärung</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-base font-semibold text-gray-900">1. Verantwortlicher</h2>
          <p className="mt-2">
            Modul-Garten<br />
            Sven Eickner<br />
            Kemnitzerwaldstr 17<br />
            14542 Werder (Havel), Deutschland<br />
            <br />
            Telefon: 017621448350<br />
            E-Mail: info@modul-garten.de
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. Erhobene Daten</h2>
          <p className="mt-2">
            Diese Website verwendet derzeit <strong>keine Cookies</strong>. Ihre Konfiguration im
            Modulhaus-Konfigurator wird ausschließlich lokal in Ihrem Browser gespeichert (LocalStorage)
            und nicht automatisch an unsere Server übertragen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. Hosting</h2>
          <p className="mt-2">
            Diese Website wird bei der ALL-INKL.COM - Neue Medien Münnich, Inhaber René Münnich,
            Hauptstraße 68, 02742 Friedersdorf gehostet. Beim Aufruf der Website werden automatisch
            technische Zugriffsdaten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser-Typ) vom
            Hosting-Provider in Server-Logfiles gespeichert. Dies ist zur Sicherstellung des Betriebs
            gemäß Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO erforderlich. Die Logfiles werden nach
            30 Tagen automatisch gelöscht.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Lokale Datenspeicherung</h2>
          <p className="mt-2">
            Der Modulhaus-Konfigurator speichert Ihre aktuelle Konfiguration im LocalStorage Ihres Browsers.
            Diese Daten verbleiben auf Ihrem Gerät und werden nicht an uns übertragen. Sie können
            die gespeicherten Daten jederzeit über die Browser-Einstellungen löschen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">5. Kontaktformular &amp; E-Mail-Versand</h2>
          <p className="mt-2">
            Wenn Sie uns über das Kontaktformular auf der Kontaktseite oder über den Konfigurator eine
            Anfrage senden, werden die von Ihnen eingegebenen Daten (Name, E-Mail-Adresse, Nachricht
            sowie ggf. Telefonnummer und Konfigurationsdaten) zum Zwecke der Bearbeitung Ihrer Anfrage
            verarbeitet und per E-Mail an uns übermittelt. Rechtsgrundlage ist Art.&nbsp;6 Abs.&nbsp;1
            lit.&nbsp;b DSGVO (vorvertragliche Maßnahmen) bzw. Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO
            (Ihre Einwilligung durch Absenden des Formulars).
          </p>
          <p className="mt-2">
            Sie erhalten eine automatische Bestätigungs-E-Mail an die von Ihnen angegebene E-Mail-Adresse.
            Ihre Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und nicht an Dritte
            weitergegeben. Die Daten werden gelöscht, sobald sie für den Zweck ihrer Erhebung nicht mehr
            erforderlich sind, spätestens jedoch nach 6 Monaten, sofern keine gesetzlichen
            Aufbewahrungspflichten entgegenstehen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">6. Teilbare Konfigurations-Links</h2>
          <p className="mt-2">
            Der Modulhaus-Konfigurator bietet die Möglichkeit, einen Link zu Ihrer Konfiguration zu
            erstellen. Die Konfigurationsdaten werden dabei direkt in der URL kodiert. Es werden keine
            Daten auf unseren Servern gespeichert. Jeder, der über den Link verfügt, kann die
            Konfiguration einsehen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">7. SSL-Verschlüsselung</h2>
          <p className="mt-2">
            Diese Seite nutzt aus Sicherheitsgründen eine SSL-Verschlüsselung. Eine verschlüsselte
            Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von &quot;http://&quot; auf
            &quot;https://&quot; wechselt und an dem Schloss-Symbol in Ihrer Browserzeile. Wenn die
            SSL-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von
            Dritten mitgelesen werden.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">8. Ihre Rechte</h2>
          <p className="mt-2">
            Sie haben gemäß DSGVO folgende Rechte:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Auskunftsrecht</strong> (Art.&nbsp;15 DSGVO): Sie können Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten verlangen.</li>
            <li><strong>Berichtigungsrecht</strong> (Art.&nbsp;16 DSGVO): Sie können die Berichtigung unrichtiger Daten verlangen.</li>
            <li><strong>Löschungsrecht</strong> (Art.&nbsp;17 DSGVO): Sie können die Löschung Ihrer Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</li>
            <li><strong>Einschränkung der Verarbeitung</strong> (Art.&nbsp;18 DSGVO): Sie können die Einschränkung der Verarbeitung Ihrer Daten verlangen.</li>
            <li><strong>Datenübertragbarkeit</strong> (Art.&nbsp;20 DSGVO): Sie können verlangen, dass wir Ihnen Ihre Daten in einem gängigen Format übermitteln.</li>
            <li><strong>Widerspruchsrecht</strong> (Art.&nbsp;21 DSGVO): Sie können der Verarbeitung Ihrer Daten jederzeit widersprechen.</li>
          </ul>
          <p className="mt-2">
            Für Anfragen wenden Sie sich bitte an: info@modul-garten.de
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">9. Beschwerderecht</h2>
          <p className="mt-2">
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
            Ihrer personenbezogenen Daten zu beschweren. Die für uns zuständige Aufsichtsbehörde ist:
          </p>
          <p className="mt-2">
            Die Landesbeauftragte für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg<br />
            Stahnsdorfer Damm 77<br />
            14532 Kleinmachnow<br />
            <a href="https://www.lda.brandenburg.de" target="_blank" rel="noopener noreferrer" className="text-wood-600 hover:text-wood-700">
              www.lda.brandenburg.de
            </a>
          </p>
        </section>

        <p className="text-xs text-gray-400 pt-4">
          Stand: März 2025
        </p>
      </div>

      {/* Logo */}
      <div className="mt-12 flex justify-center">
        <img src={assetPath('/logo.png')} alt="Modul-Garten" className="h-16 w-auto opacity-60" />
      </div>
    </div>
  );
}
