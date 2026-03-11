import type { Template } from '../types/configuration';

export const TEMPLATES: Template[] = [
  // --- Einfache Einstiegs-Vorlagen ---
  {
    id: 'starter',
    name: 'Starter-Modul',
    description: 'Ein einzelnes 3.0 × 1.5 m Modul – der kompakteste Einstieg. Perfekt als Gartenhaus, Mini-Office oder Ausgangspunkt für spätere Erweiterungen.',
    persons: 'Flexibel',
    basePrice: 6800,
    image: '/templates/starter.jpg',
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 6, height: 3, options: {} },
    ],
  },
  {
    id: 'kompakt-kubus',
    name: 'Kompakt-Kubus',
    description: 'Quadratisches 3.0 × 3.0 m Raumwunder mit viel Platz auf kleiner Grundfläche. Ideal als vollwertiges Home Office oder gemütliches Gästezimmer.',
    persons: '1–2 Personen',
    basePrice: 6800,
    image: '/templates/kompakt-kubus.jpg',
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
    ],
  },
  {
    id: 'l-form-duo',
    name: 'L-Form Duo',
    description: 'Zwei Module in L-Form für getrennte Bereiche mit offenem Raumgefühl – z. B. Arbeitsbereich und Lounge oder Schlaf- und Wohnzone.',
    persons: '1–2 Personen',
    basePrice: 13600,
    image: '/templates/l-form-duo.jpg',
    modules: [
      { type: 'living', gridX: 3, gridY: 0, width: 3, height: 6, options: {} },
      { type: 'living', gridX: 0, gridY: 6, width: 6, height: 3, options: {} },
    ],
  },
  // --- Größere Konfigurationen ---
  {
    id: 'living-pergola',
    name: 'Living Office mit Pergola',
    description: 'Großzügiger Living-Bereich mit angedockter Glasdach-Pergola – ideal als Home Office, Atelier oder Gästehaus mit überdachtem Außenbereich.',
    persons: 'Flexibel',
    basePrice: 23600,
    image: '/templates/living-pergola.jpg',
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
      { type: 'living', gridX: 6, gridY: 0, width: 3, height: 6, options: {} },
      { type: 'pergola', gridX: 0, gridY: 6, width: 6, height: 6, options: { dachtyp: 'glas' } },
      { type: 'living', gridX: 6, gridY: 6, width: 3, height: 6, options: {} },
    ],
  },
  {
    id: 'sauna-pergola',
    name: 'Sauna mit Glasdach-Pergola',
    description: 'Saunakern mit Technikraum und überdachter Glasdach-Pergola zum Entspannen im Freien – der perfekte Rückzugsort im eigenen Garten.',
    persons: '3 Personen',
    basePrice: 16700,
    image: '/templates/sauna-pergola.jpg',
    modules: [
      { type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
      { type: 'technik', gridX: 6, gridY: 0, width: 3, height: 6, options: {} },
      { type: 'pergola', gridX: 0, gridY: 6, width: 9, height: 6, options: { dachtyp: 'glas' } },
    ],
  },
  // --- Sauna & Wellness ---
  {
    id: 'wellness-komplett',
    name: 'Wellness-Retreat',
    description: 'Komplettes Wellness-Erlebnis: Sauna, Dusche und Ruhebereich auf kompakter Fläche – Ihr privates Spa zu Hause.',
    persons: '4 Personen',
    basePrice: 18200,
    image: '/templates/wellness-komplett.jpg',
    modules: [
      { type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
      { type: 'sanitaer', gridX: 6, gridY: 0, width: 3, height: 6, options: {} },
      { type: 'ruhe', gridX: 0, gridY: 6, width: 6, height: 3, options: {} },
    ],
  },
  {
    id: 'klein',
    name: 'Klein (Sauna)',
    description: 'Kompakte Saunalösung für 3 Personen. Saunakern mit angegliedertem Technikraum.',
    persons: '3 Personen',
    basePrice: 11700,
    modules: [
      { type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 3, options: {} },
      { type: 'technik', gridX: 6, gridY: 0, width: 6, height: 3, options: {} },
    ],
  },
  {
    id: 'gross',
    name: 'Groß (Sauna)',
    description: 'Geräumige Sauna für 6 Personen mit großer Saunafläche und Technikzone.',
    persons: '6 Personen',
    basePrice: 11700,
    modules: [
      { type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
      { type: 'technik', gridX: 6, gridY: 0, width: 6, height: 3, options: {} },
    ],
  },
  {
    id: 'oase-wellness',
    name: 'Oase Wellness',
    description: 'Kompakte Wellness-Oase: Sauna, Dusche und Umkleide auf effizienter Fläche.',
    persons: '3 Personen',
    basePrice: 17500,
    modules: [
      { type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 3, options: {} },
      { type: 'sanitaer', gridX: 6, gridY: 0, width: 6, height: 3, options: {} },
      { type: 'umkleide', gridX: 12, gridY: 0, width: 6, height: 3, options: {} },
    ],
  },
];
