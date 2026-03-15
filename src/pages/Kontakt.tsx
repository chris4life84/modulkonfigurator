import { useState } from 'react';

export function Kontakt() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Backend-Integration
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Kontakt</h1>
      <p className="mt-2 text-sm text-gray-500">
        Haben Sie Fragen zu unseren Modulhaeusern? Wir helfen Ihnen gerne weiter.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {/* Kontaktdaten */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Modul-Garten</h2>
            <p className="mt-1 text-sm text-gray-500">
              Musterstrasse 1<br />
              12345 Musterstadt
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Telefon:</span>{' '}
              +49 (0) 123 456 789
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">E-Mail:</span>{' '}
              <a href="mailto:info@modul-garten.de" className="text-wood-600 hover:text-wood-700">
                info@modul-garten.de
              </a>
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Erreichbarkeit:</span><br />
              Mo--Fr: 9:00 -- 17:00 Uhr
            </p>
          </div>
        </div>

        {/* Kontaktformular */}
        <div>
          {submitted ? (
            <div className="rounded-lg border border-nature-100 bg-nature-50 p-6 text-center">
              <p className="text-sm font-medium text-nature-600">
                Vielen Dank fuer Ihre Nachricht!
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Wir melden uns schnellstmoeglich bei Ihnen.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:outline-none focus:ring-1 focus:ring-wood-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">E-Mail</label>
                <input
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:outline-none focus:ring-1 focus:ring-wood-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Nachricht</label>
                <textarea
                  required
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:outline-none focus:ring-1 focus:ring-wood-500"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-wood-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-700"
              >
                Nachricht senden
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="mt-12 flex justify-center">
        <img src="/logo.png" alt="Modul-Garten" className="h-16 w-auto opacity-60" />
      </div>
    </div>
  );
}
