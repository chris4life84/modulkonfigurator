import { Link } from 'react-router-dom';

export function UeberUns() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Unser Konzept</h1>
      <p className="mt-2 text-sm text-gray-500">
        Smart Modular Space -- modulare Raumsysteme, die sich Ihrem Leben anpassen.
      </p>

      <div className="mt-10 space-y-10">
        {/* Vision */}
        <section>
          <h2 className="text-lg font-semibold text-wood-800">Die Vision</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Wir entwickeln ein mobiles, modulares Raumsystem in Holzbauweise, das sich als
            Premium-Sauna, autarkes Home Office oder vollwertiger Wohnraum flexibel an das
            Leben des Nutzers anpasst. Kein starres Fertighaus, sondern ein lebendiges System,
            das mit Ihren Beduerfnissen waechst.
          </p>
        </section>

        {/* Kernprinzipien */}
        <section>
          <h2 className="text-lg font-semibold text-wood-800">Unsere Prinzipien</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Plug & Play',
                text: 'Einfacher Aufbau ohne Bodenverdichtung. Unsere Module stehen auf schonenden Aluminium-Stuetzfuessen -- kein Fundament, kein Beton, keine Versiegelung.',
              },
              {
                title: 'Circular Economy',
                text: 'Module sind jederzeit demontierbar, transportfaehig und fuer neue Zwecke umnutzbar. Heute Sauna, morgen Home Office -- Ihr Modul macht jeden Wandel mit.',
              },
              {
                title: 'Autarkes Dachsystem',
                text: 'Jedes Modul verfuegt ueber ein eigenes integriertes Entwasserungssystem. Bei Kopplung verbinden sich die Rinnen automatisch; bei Trennung bleibt jedes Modul sofort einzeln wetterfest.',
              },
              {
                title: 'Genehmigungsfrei',
                text: 'Mit 2,50 m Aussenhoehe und 2,10 m Innenhoehe ist das System auf vereinfachte Genehmigungsverfahren optimiert -- je nach Bundesland oft komplett genehmigungsfrei.',
              },
            ].map((p) => (
              <div key={p.title} className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Das Baukastensystem */}
        <section>
          <h2 className="text-lg font-semibold text-wood-800">Das Baukastensystem</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Sieben spezialisierte Modultypen bilden die Grundlage: Saunakern, Technikraum,
            Ruheeinheit, Umkleide, Sanitaer, Living/Office und Pergola. Jedes Modul basiert
            auf dem Rastermass 3,0 x 1,5 m und laesst sich frei mit anderen kombinieren.
            Angrenzende Module erkennen sich automatisch und ermoglichen Interior-Tueren
            fuer einen nahtlosen Raumfluss. Ergaenzt wird das System durch eine frei
            konfigurierbare Aluminium-Pergola mit drei Dachtypen (Lamellen, Glasdach
            oder EPDM-Folie), die sich intelligent an das Haus anbindet.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Von der kompakten 3-Personen-Sauna (ab 11.700 EUR) ueber das vollausgestattete
            Tiny House (ab 22.200 EUR) bis zum luxurioesen Spa Resort (ab 36.500 EUR) --
            19 vordefinierte Vorlagen dienen als Inspiration, die Sie im 3D-Konfigurator
            frei anpassen koennen.
          </p>
          <div className="mt-4 rounded-lg border border-wood-200 bg-wood-50 p-4">
            <p className="text-sm leading-relaxed text-wood-800">
              <strong>Hinweis:</strong> Die Modulbezeichnungen wie &bdquo;Technikraum&ldquo;, &bdquo;Saunakern&ldquo;
              oder &bdquo;Sanitaer&ldquo; beschreiben die vorgesehene Nutzung des jeweiligen Raums -- sie dienen
              als Planungsgrundlage. Die Module werden aktuell nicht mit der fachspezifischen Ausstattung
              (z.&thinsp;B. Saunaofen, Sanitaerinstallationen oder Haustechnik) ausgeliefert. Was wir
              jedoch in jedem Modul vollstaendig vorbereiten, ist die komplette Elektroinstallation.
            </p>
          </div>
        </section>

        {/* Materialien */}
        <section>
          <h2 className="text-lg font-semibold text-wood-800">Materialien & Qualitaet</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-wood-100 text-center text-xs leading-5 text-wood-700">H</span>
              <p><strong className="text-gray-900">Robinie-Holz:</strong> Langlebige, wetterfeste Fassade in Holzrahmenbauweise mit 13 cm Wandstaerke.</p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-blue-50 text-center text-xs leading-5 text-blue-700">G</span>
              <p><strong className="text-gray-900">Verglasung:</strong> 2-Fach Isolier-Verglasung mit Energiesparscheiben und Kiefernholz-Rahmen.</p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-gray-100 text-center text-xs leading-5 text-gray-700">A</span>
              <p><strong className="text-gray-900">Aluminium:</strong> Pergola-Konstruktion aus dunkelgrauem Aluminium-Profil (80x80mm Pfosten, 80x120mm Traeger).</p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-nature-50 text-center text-xs leading-5 text-nature-600">P</span>
              <p><strong className="text-gray-900">Photovoltaik:</strong> 400W-Panels mit Montageschienenm, automatischer Orientierungsoptimierung und Kompass-Ausrichtung.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl bg-wood-50 p-6 text-center">
          <p className="text-sm font-medium text-wood-800">
            Ueberzeugt? Konfigurieren Sie Ihr Modulhaus in Echtzeit.
          </p>
          <Link
            to="/konfigurator"
            className="mt-3 inline-block rounded-lg bg-wood-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-700"
          >
            Zum Konfigurator
          </Link>
        </section>
      </div>
    </div>
  );
}
