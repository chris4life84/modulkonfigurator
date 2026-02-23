import type { ModuleDefinition } from '../types/modules';

export const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  sauna: {
    type: 'sauna',
    name: 'Saunakern',
    description: 'Saunaraum mit Bänken und Ofen',
    availableSizes: [[2, 1], [2, 2]],
    basePrice: 8500,
    color: '#c2410c',
    icon: '🔥',
  },
  technik: {
    type: 'technik',
    name: 'Technikraum',
    description: 'Haustechnik, Steuerung und Ofentechnik',
    availableSizes: [[2, 1]],
    basePrice: 3200,
    color: '#6b7280',
    icon: '⚙️',
  },
  ruhe: {
    type: 'ruhe',
    name: 'Ruheeinheit',
    description: 'Entspannungsbereich mit Liegen',
    availableSizes: [[2, 1], [2, 2]],
    basePrice: 4500,
    color: '#059669',
    icon: '🌿',
  },
  umkleide: {
    type: 'umkleide',
    name: 'Umkleide',
    description: 'Umkleidebereich mit Garderobe',
    availableSizes: [[2, 1]],
    basePrice: 3800,
    color: '#7c3aed',
    icon: '👔',
  },
  sanitaer: {
    type: 'sanitaer',
    name: 'Sanitär',
    description: 'WC und Dusche',
    availableSizes: [[2, 1]],
    basePrice: 5200,
    color: '#2563eb',
    icon: '🚿',
  },
  living: {
    type: 'living',
    name: 'Living / Office',
    description: 'Ganzjahres-Nutzraum: Home Office, Atelier oder Gästezimmer',
    availableSizes: [[2, 1], [2, 2]],
    basePrice: 6800,
    color: '#d97706',
    icon: '🏠',
  },
};

export const MODULE_LIST = Object.values(MODULE_DEFINITIONS);
