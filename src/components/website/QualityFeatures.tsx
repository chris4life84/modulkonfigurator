const features = [
  {
    title: 'Holzbauweise',
    subtitle: 'Robinie-Holz',
    text: 'Hochwertige Wandpaneele in Holzrahmenbauweise mit 13 cm Wandstarke und Premium-Isolierung.',
    accent: 'bg-wood-100 text-wood-700',
  },
  {
    title: 'Isolierverglasung',
    subtitle: '2-Fach Energiespar',
    text: 'Fenster und Tueren mit 2-Fach Isolier-Verglasung und Energiesparscheiben in Kiefernholz-Rahmen.',
    accent: 'bg-blue-50 text-blue-700',
  },
  {
    title: 'Pergola-System',
    subtitle: '3 Dachtypen',
    text: 'Aluminium-Pergola mit Lamellen, Glasdach oder EPDM-Folie. Intelligente Haus-Anbindung.',
    accent: 'bg-gray-100 text-gray-700',
  },
  {
    title: 'Photovoltaik',
    subtitle: '400W pro Panel',
    text: 'Optionale PV-Paneele mit Smart-Placement: Der Algorithmus maximiert automatisch die Panelanzahl.',
    accent: 'bg-nature-50 text-nature-600',
  },
];

export function QualityFeatures() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Qualitat, die man sieht
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-gray-500">
          Jedes Modul wird mit hochwertigen Materialien gefertigt -- vom Wandaufbau bis zur Verglasung.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <span className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${f.accent}`}>
                {f.subtitle}
              </span>
              <h3 className="mt-3 text-base font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
