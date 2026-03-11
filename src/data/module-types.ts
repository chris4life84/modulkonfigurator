import type { ModuleDefinition } from '../types/modules';

export const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  sauna: {
    type: 'sauna',
    name: 'Saunakern',
    description: 'Saunaraum mit Bänken und Ofen',
    availableSizes: [[6, 3], [3, 6], [6, 6]],
    basePrice: 8500,
    color: '#c2410c',
    icon: '🔥',
  },
  technik: {
    type: 'technik',
    name: 'Technikraum',
    description: 'Haustechnik, Steuerung und Ofentechnik',
    availableSizes: [[6, 3], [3, 6]],
    basePrice: 3200,
    color: '#6b7280',
    icon: '⚙️',
  },
  ruhe: {
    type: 'ruhe',
    name: 'Ruheeinheit',
    description: 'Entspannungsbereich mit Liegen',
    availableSizes: [[6, 3], [3, 6], [6, 6]],
    basePrice: 4500,
    color: '#059669',
    icon: '🌿',
  },
  umkleide: {
    type: 'umkleide',
    name: 'Umkleide',
    description: 'Umkleidebereich mit Garderobe',
    availableSizes: [[6, 3], [3, 6]],
    basePrice: 3800,
    color: '#7c3aed',
    icon: '👔',
  },
  sanitaer: {
    type: 'sanitaer',
    name: 'Sanitär',
    description: 'WC und Dusche',
    availableSizes: [[6, 3], [3, 6]],
    basePrice: 5200,
    color: '#2563eb',
    icon: '🚿',
  },
  living: {
    type: 'living',
    name: 'Living / Office',
    description: 'Ganzjahres-Nutzraum: Home Office, Atelier oder Gästezimmer',
    availableSizes: [[6, 3], [3, 6], [6, 6]],
    basePrice: 6800,
    color: '#d97706',
    icon: '🏠',
  },
  pergola: {
    type: 'pergola',
    name: 'Pergola',
    description: 'Aluminium-Pergola mit konfigurierbarem Dach',
    availableSizes: [
      [4,4],[5,4],[5,5],[6,4],[6,5],[6,6],[7,4],[7,5],[7,6],[7,7],
      [8,4],[8,5],[8,6],[8,7],[8,8],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],
      [10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],
    ],
    basePrice: 3200,
    color: '#6B7280',
    icon: '☀️',
  },
};

export const MODULE_LIST = Object.values(MODULE_DEFINITIONS);
