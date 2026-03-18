import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/website/Hero';
import { ConceptStrip } from '../components/website/ConceptStrip';
import { QualityFeatures } from '../components/website/QualityFeatures';
import { Stepper } from '../components/ui/Stepper';
import { STEPS, useWizardStore } from '../store/useWizardStore';
import { TemplateSelectionStep } from '../features/template-selection/TemplateSelectionStep';
import { Button } from '../components/ui/Button';
import { t } from '../utils/i18n';

export function Home() {
  const navigate = useNavigate();
  const { goToStep } = useWizardStore();

  const handleWeiter = () => {
    goToStep(1);
    navigate('/konfigurator');
  };

  return (
    <>
      <Hero />
      <ConceptStrip />

      {/* Vorlagen-Auswahl */}
      <section id="konfigurator" className="scroll-mt-16">
        <div className="border-b border-gray-100 bg-white px-4 py-2">
          <Stepper steps={[...STEPS]} currentStep={0} onStepClick={() => {}} />
        </div>
        <div className="mx-auto max-w-5xl px-4 py-6">
          <TemplateSelectionStep />
        </div>
        <div className="sticky bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-w-7xl items-center justify-end">
            <Button onClick={handleWeiter}>
              {t('nav.next')}
            </Button>
          </div>
        </div>
      </section>

      <QualityFeatures />

      {/* Prozess-Info: So funktioniert's */}
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            In 3 Schritten zu Ihrem Modulhaus
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 max-w-xl mx-auto">
            Von der ersten Idee bis zum fertigen Angebot — wir begleiten Sie persönlich.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Konfigurieren',
                text: 'Gestalten Sie Ihr Modulhaus im 3D-Konfigurator: Raumaufteilung, Fenster, Türen, PV-Anlage und Pergola — ganz nach Ihren Vorstellungen.',
                icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
              },
              {
                step: '2',
                title: 'Anfrage senden',
                text: 'Senden Sie uns Ihre Konfiguration mit Ihren Sonderwünschen — Saunaeinbau, Innenausstattung, spezielle Materialien und alles was Sie sich vorstellen.',
                icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
              },
              {
                step: '3',
                title: 'Angebot erhalten',
                text: 'Wir erstellen Ihnen ein individuelles Angebot — inklusive aller gewünschten Extras, Innenausstattung und Materialwahl. Transparent und unverbindlich.',
                icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wood-100">
                  <svg className="h-6 w-6 text-wood-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <div className="mt-1 text-xs font-bold text-wood-500">Schritt {item.step}</div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
