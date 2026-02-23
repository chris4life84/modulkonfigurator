import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const STEPS = [
  { key: 'template', label: 'Vorlage' },
  { key: 'modules', label: 'Module' },
  { key: 'options', label: 'Optionen' },
  { key: 'summary', label: 'Zusammenfassung' },
] as const;

interface WizardState {
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      currentStep: 0,

      goToStep: (step: number) => {
        if (step >= 0 && step < STEPS.length) {
          set({ currentStep: step });
        }
      },

      nextStep: () => {
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, STEPS.length - 1),
        }));
      },

      prevStep: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        }));
      },
    }),
    {
      name: 'modulhaus-wizard',
    },
  ),
);
