import { Stepper } from '../ui/Stepper';
import { STEPS, useWizardStore } from '../../store/useWizardStore';

interface WizardLayoutProps {
  children: React.ReactNode;
}

export function WizardLayout({ children }: WizardLayoutProps) {
  const { currentStep, goToStep } = useWizardStore();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <Stepper
          steps={[...STEPS]}
          currentStep={currentStep}
          onStepClick={goToStep}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
