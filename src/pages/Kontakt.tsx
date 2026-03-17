import { useState, useEffect, useCallback } from 'react';
import { assetPath } from '../utils/asset-path';

function generateCaptcha(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b} = ?`, answer: a + b };
}

export function Kontakt() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [privacy, setPrivacy] = useState(false);

  // Math captcha
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  }, []);

  // Refresh captcha on mount
  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate captcha
    if (parseInt(captchaInput, 10) !== captcha.answer) {
      setError('Die Sicherheitsfrage wurde falsch beantwortet. Bitte versuchen Sie es erneut.');
      refreshCaptcha();
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('message', message);
      formData.append('source', 'kontakt');
      formData.append('_hp', honeypot);

      const response = await fetch(`${import.meta.env.BASE_URL}api/contact.php`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message || 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.');
        refreshCaptcha();
      }
    } catch {
      setError('Senden fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.');
      refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Kontakt</h1>
      <p className="mt-2 text-sm text-gray-500">
        Haben Sie Fragen zu unseren Modulhäusern? Wir helfen Ihnen gerne weiter.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {/* Kontaktdaten */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Modul-Garten</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sven Eickner<br />
              Kemnitzerwaldstr 17<br />
              14542 Werder (Havel)
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Telefon:</span>{' '}
              <a href="tel:+4917621448350" className="text-wood-600 hover:text-wood-700">
                017621448350
              </a>
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
              Mo–Fr: 9:00 – 17:00 Uhr
            </p>
          </div>
        </div>

        {/* Kontaktformular */}
        <div>
          {submitted ? (
            <div className="rounded-lg border border-nature-100 bg-nature-50 p-6 text-center">
              <svg className="mx-auto h-8 w-8 text-nature-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <p className="mt-3 text-sm font-medium text-nature-700">
                Vielen Dank für Ihre Nachricht!
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Wir melden uns schnellstmöglich bei Ihnen.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot */}
              <input
                type="text"
                name="_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="sr-only"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div>
                <label className="block text-xs font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:outline-none focus:ring-1 focus:ring-wood-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">E-Mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:outline-none focus:ring-1 focus:ring-wood-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Nachricht *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  disabled={submitting}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:outline-none focus:ring-1 focus:ring-wood-500 disabled:opacity-50"
                />
              </div>

              {/* Math Captcha */}
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Sicherheitsfrage: Was ergibt {captcha.question.replace(' = ?', '')}? *
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-mono font-bold text-gray-700">
                    {captcha.question}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                    disabled={submitting}
                    placeholder="Antwort"
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-wood-500 focus:outline-none focus:ring-1 focus:ring-wood-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="rounded p-1 text-gray-400 hover:text-gray-600"
                    title="Neue Aufgabe"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.757a.75.75 0 00-.75.75v3.475a.75.75 0 001.5 0v-1.836l.255.254a7 7 0 0011.788-3.54.75.75 0 00-1.238.242zM4.688 8.576a5.5 5.5 0 019.201-2.466l.312.311H11.77a.75.75 0 000 1.5h3.475a.75.75 0 00.75-.75V3.696a.75.75 0 00-1.5 0v1.836l-.255-.254A7 7 0 002.452 8.818a.75.75 0 001.238-.242z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* DSGVO Checkbox */}
              <label className="flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  required
                  disabled={submitting}
                  className="mt-0.5 rounded border-gray-300 text-wood-600 focus:ring-wood-500"
                />
                <span>
                  Ich stimme der Verarbeitung meiner Daten gemäß der{' '}
                  <a href={`${import.meta.env.BASE_URL}datenschutz`} target="_blank" className="text-wood-600 underline hover:text-wood-800">
                    Datenschutzerklärung
                  </a>{' '}
                  zu. *
                </span>
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !privacy}
                className="w-full rounded-lg bg-wood-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Wird gesendet...
                  </span>
                ) : (
                  'Nachricht senden'
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className="mt-12 flex justify-center">
        <img src={assetPath('/logo.png')} alt="Modul-Garten" className="h-16 w-auto opacity-60" />
      </div>
    </div>
  );
}
