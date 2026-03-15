import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-wood-800 via-wood-700 to-wood-900 text-white">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            Ihr modularer Raum
            <br />
            <span className="text-wood-200">in 3 Schritten</span>
          </h1>
          <p className="mt-4 text-lg text-wood-100/80 md:text-xl">
            Premium-Sauna, Home Office, Wohnraum oder Pergola-Lounge -- konfigurieren Sie Ihr individuelles Modulhaus in Echtzeit und erleben Sie es in 3D.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/konfigurator"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-wood-800 shadow-lg transition-all hover:bg-wood-50 hover:shadow-xl"
            >
              Jetzt konfigurieren
            </Link>
            <Link
              to="/ueber-uns"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Mehr erfahren
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
