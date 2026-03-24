const concepts = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Plug & Play',
    text: 'Aufstellung ohne Fundament auf Aluminium-Stuetzfuessen. Kein Beton, keine Bodenverdichtung.',
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Modular & Mobil',
    text: 'Jederzeit erweiterbar, demontierbar und an einen neuen Standort versetzbar.',
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: 'Autark & Nachhaltig',
    text: 'Optionale PV-Paneele, Premium-Isolierung und eigenes Entwässerungssystem.',
  },
];

export function ConceptStrip() {
  return (
    <section className="border-b border-gray-100 bg-white py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 md:flex-row md:gap-6">
        {concepts.map((c) => (
          <div key={c.title} className="flex flex-1 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wood-50 text-wood-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {c.icon.props.children}
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{c.title}</h3>
              <p className="text-xs leading-snug text-gray-500">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
