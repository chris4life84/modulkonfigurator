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
    </>
  );
}
