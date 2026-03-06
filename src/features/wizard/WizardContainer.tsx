import { useWizardStore } from '../../store/useWizardStore';
import { TemplateSelectionStep } from '../template-selection/TemplateSelectionStep';
import { GridEditorStep } from '../grid-editor/GridEditorStep';
import { SummaryStep } from '../summary/SummaryStep';

const STEP_COMPONENTS = [
  TemplateSelectionStep,
  GridEditorStep,
  SummaryStep,
];

export function WizardContainer() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const StepComponent = STEP_COMPONENTS[currentStep];

  if (!StepComponent) return null;

  return <StepComponent />;
}
