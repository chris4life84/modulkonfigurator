import { Button } from '../../components/ui/Button';
import { useWizardStore, STEPS } from '../../store/useWizardStore';
import { useConfigStore } from '../../store/useConfigStore';
import { t } from '../../utils/i18n';

export function WizardNavigation() {
  const { currentStep, nextStep, prevStep } = useWizardStore();
  const templateId = useConfigStore((s) => s.templateId);
  const modules = useConfigStore((s) => s.modules);

  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  // Step validation
  const canProceed = (() => {
    switch (currentStep) {
      case 0:
        return templateId !== null;
      case 1:
        return modules.length > 0;
      default:
        return true;
    }
  })();

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div>
          {!isFirst && (
            <Button variant="secondary" onClick={prevStep}>
              {t('nav.back')}
            </Button>
          )}
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
