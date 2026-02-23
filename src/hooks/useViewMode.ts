import { create } from 'zustand';

interface ViewModeState {
  viewMode: '3d' | '2d';
  setViewMode: (mode: '3d' | '2d') => void;
  toggle: () => void;
}

export const useViewMode = create<ViewModeState>((set) => ({
  viewMode: '3d',
  setViewMode: (mode) => set({ viewMode: mode }),
  toggle: () => set((s) => ({ viewMode: s.viewMode === '3d' ? '2d' : '3d' })),
}));
