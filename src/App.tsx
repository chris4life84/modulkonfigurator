import { Header } from './components/layout/Header';
import { WizardLayout } from './components/layout/WizardLayout';
import { WizardContainer } from './features/wizard/WizardContainer';
import { WizardNavigation } from './features/wizard/WizardNavigation';

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900">
      <Header />
      <WizardLayout>
        <WizardContainer />
      </WizardLayout>
      <WizardNavigation />
    </div>
  );
}
