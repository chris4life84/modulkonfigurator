import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useWizardStore, STEPS } from '../../store/useWizardStore';
import { useConfigStore } from '../../store/useConfigStore';
import { t } from '../../utils/i18n';

export function WizardNavigation() {
  const navigate = useNavigate();
  const { currentStep, nextStep, prevStep, goToStep } = useWizardStore();
  const modules = useConfigStore((s) => s.modules);

  const isLast = currentStep === STEPS.length - 1;

  // Step validation
  const canProceed = (() => {
    switch (currentStep) {
      case 1:
        return modules.length > 0;
      default:
        return true;
    }
  })();

  const handleBack = () => {
    if (currentStep === 1) {
      // Go back to homepage (template selection)
      goToStep(0);
      navigate('/');
    } else {
      prevStep();
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div>
          <Button variant="secondary" onClick={handleBack}>
            {t('nav.back')}
          </Button>
        </div>
        <div>
          {!isLast && (
            <Button onClick={nextStep} disabled={!canProceed}>
              {t('nav.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
