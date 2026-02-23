interface StepperProps {
  steps: { key: string; label: string }[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isClickable = isCompleted && !!onStepClick;

        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(index)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors
                ${isActive ? 'bg-wood-600 text-white' : ''}
                ${isCompleted ? 'bg-wood-100 text-wood-700 hover:bg-wood-200 cursor-pointer' : ''}
                ${!isActive && !isCompleted ? 'bg-gray-100 text-gray-400' : ''}
                disabled:cursor-default`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                  ${isActive ? 'bg-white text-wood-600' : ''}
                  ${isCompleted ? 'bg-wood-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}`}
              >
                {isCompleted ? '✓' : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-4 sm:w-8 ${
                  index < currentStep ? 'bg-wood-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
