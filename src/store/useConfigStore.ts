import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlacedModule } from '../types/grid';
import { TEMPLATES } from '../data/templates';

interface ConfigState {
  templateId: string | null;
  modules: PlacedModule[];

  loadTemplate: (id: string) => void;
  addModule: (module: Omit<PlacedModule, 'id'>) => void;
  removeModule: (id: string) => void;
  rotateModule: (id: string) => void;
  setModuleOption: (moduleId: string, key: string, value: string | boolean) => void;
  reset: () => void;
}

let nextId = 1;
function generateId(): string {
  return `mod_${nextId++}_${Date.now()}`;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      templateId: null,
      modules: [],

      loadTemplate: (id: string) => {
        const template = TEMPLATES.find((t) => t.id === id);
        if (!template) return;
        set({
          templateId: id,
          modules: template.modules.map((m) => ({
            ...m,
            id: generateId(),
          })),
        });
      },

      addModule: (module) => {
        set((state) => ({
          modules: [...state.modules, { ...module, id: generateId() }],
        }));
      },

      removeModule: (id: string) => {
        set((state) => ({
          modules: state.modules.filter((m) => m.id !== id),
        }));
      },

      rotateModule: (id: string) => {
        set((state) => ({
          modules: state.modules.map((m) => {
            if (m.id !== id) return m;
            // Swap width and height (only for non-square modules)
            if (m.width === m.height) return m;
            return { ...m, width: m.height, height: m.width };
          }),
        }));
      },

      setModuleOption: (moduleId: string, key: string, value: string | boolean) => {
        set((state) => ({
          modules: state.modules.map((m) => {
            if (m.id !== moduleId) return m;
            return { ...m, options: { ...m.options, [key]: value } };
          }),
        }));
      },

      reset: () => {
        set({ templateId: null, modules: [] });
      },
    }),
    {
      name: 'modulhaus-config',
    },
  ),
);
