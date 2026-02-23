import type { Template } from '../types/configuration';

export const TEMPLATES: Template[] = [
  {
    id: 'klein',
    name: 'Klein (Sauna)',
    description: 'Kompakte Saunalösung für 3 Personen. Saunakern mit angegliedertem Technikraum.',
    persons: '3 Personen',
    basePrice: 11700,
    modules: [
      { type: 'sauna', gridX: 0, gridY: 0, width: 2, height: 1, options: {} },
      { type: 'technik', gridX: 2, gridY: 0, width: 2, height: 1, options: {} },
    ],
  },
  {
    id: 'gross',
    name: 'Groß (Sauna)',
    description: 'Geräumige Sauna für 6 Personen mit großer Saunafläche und Technikzone.',
    persons: '6 Personen',
    basePrice: 11700,
    modules: [
      { type: 'sauna', gridX: 0, gridY: 0, width: 2, height: 2, options: {} },
      { type: 'technik', gridX: 2, gridY: 0, width: 2, height: 1, options: {} },
    ],
  },
  {
    id: 'oase-wellness',
    name: 'Oase Wellness',
    description: 'Kompakte Wellness-Oase: Sauna, Dusche und Umkleide auf effizienter Fläche.',
    persons: '3 Personen',
    basePrice: 17500,
    modules: [
      { type: 'sauna', gridX: 0, gridY: 0, width: 2, height: 1, options: {} },
      { type: 'sanitaer', gridX: 2, gridY: 0, width: 2, height: 1, options: {} },
      { type: 'umkleide', gridX: 4, gridY: 0, width: 2, height: 1, options: {} },
    ],
  },
  {
    id: 'oase-living',
    name: 'Oase Living',
    description: 'Vollisoliertes Ganzjahres-Modul. Flexibel als Home Office, Atelier oder Gästezimmer.',
    persons: 'Flexibel',
    basePrice: 6800,
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 2, height: 1, options: {} },
    ],
  },
];
