import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const STEPS = [
  { key: 'template', label: 'Vorlage' },
  { key: 'modules', label: 'Module & Optionen' },
  { key: 'summary', label: 'Zusammenfassung' },
] as const;

interface WizardState {
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const _wizardStore = create<WizardState>()(
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
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { currentStep: number };
        if (version < 2) {
          // Old 4-step wizard → new 3-step: 0→0, 1→1, 2→1, 3→2
          const oldStep = state.currentStep ?? 0;
          const mapping: Record<number, number> = { 0: 0, 1: 1, 2: 1, 3: 2 };
          return { ...state, currentStep: mapping[oldStep] ?? 0 };
        }
        return state;
      },
    },
  ),
);

export const useWizardStore = _wizardStore;
(window as any).__wizardStore = _wizardStore;
