import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { WizardLayout } from '../components/layout/WizardLayout';
import { WizardContainer } from '../features/wizard/WizardContainer';
import { WizardNavigation } from '../features/wizard/WizardNavigation';
import { useWizardStore } from '../store/useWizardStore';

export function Konfigurator() {
  const navigate = useNavigate();
  const currentStep = useWizardStore((s) => s.currentStep);

  // If user lands here on step 0, redirect to homepage
  useEffect(() => {
    if (currentStep === 0) {
      navigate('/', { replace: true });
    }
  }, [currentStep, navigate]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <Header />
      <WizardLayout>
        <WizardContainer />
      </WizardLayout>
      <WizardNavigation />
    </div>
  );
}
