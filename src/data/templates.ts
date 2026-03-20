import type { Template } from '../types/configuration';
import type { WallConfig } from '../types/walls';

// ── Reusable opening definitions ──────────────────────────────────
const STANDARD_DOOR = { type: 'door' as const, position: 0.5, width: 0.9, height: 2.0, offsetY: 0 };
const TERRACE_DOOR = { type: 'terrace-door' as const, position: 0.5, width: 2.0, height: 2.0, offsetY: 0 };
const PANORAMA_WINDOW = { type: 'window' as const, position: 0.5, width: 2.0, height: 2.0, offsetY: 0 };
const STANDARD_WINDOW = { type: 'window' as const, position: 0.5, width: 1.0, height: 1.0, offsetY: 0.8 };
const BODENTIEF_WINDOW = { type: 'window' as const, position: 0.5, width: 1.0, height: 2.0, offsetY: 0 };

// ── Helper: create WallConfig ─────────────────────────────────────
function walls(
  front: typeof STANDARD_DOOR[] = [],
  back: typeof STANDARD_DOOR[] = [],
  left: typeof STANDARD_DOOR[] = [],
  right: typeof STANDARD_DOOR[] = [],
): WallConfig {
  return { front, back, left, right };
}

// ══════════════════════════════════════════════════════════════════
//  MODULHAUS-VORLAGEN
// ══════════════════════════════════════════════════════════════════

export const TEMPLATES: Template[] = [
  // ── Leere Szene ─────────────────────────────────────────────────
  {
    id: 'leer',
    name: 'Leere Szene',
    description: 'Starten Sie mit einer leeren Fläche und platzieren Sie Module komplett nach Ihren Vorstellungen – volle Freiheit im 3D-Konfigurator.',
    persons: 'Freie Gestaltung',
    basePrice: 0,
    modules: [],
  },

  // ── Starter-Modul ───────────────────────────────────────────────
  {
    id: 'starter-modul',
    name: 'Starter-Modul',
    description: 'Ein einzelnes 3,0 × 1,5 m Modul – der kompakteste Einstieg. Perfekt als Gartenhaus, Mini-Office oder Ausgangspunkt für spätere Erweiterungen.',
    persons: 'Flexibel',
    basePrice: 6800,
    image: '/newsite/templates/starter-modul.png',
    modules: [
      {
        type: 'living', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([TERRACE_DOOR], [], [], [STANDARD_WINDOW]),
      },
    ],
  },

  // ── Kompakt-Kubus ───────────────────────────────────────────────
  {
    id: 'kompakt-kubus',
    name: 'Kompakt-Kubus',
    description: 'Zwei Module zu einem 3,0 × 3,0 m Raum verbunden. Ideal als vollwertiges Home Office oder gemütliches Gästezimmer.',
    persons: '1–2 Personen',
    basePrice: 13600,
    image: '/newsite/templates/kompakt-kubus.png',
    modules: [
      {
        type: 'living', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'living', gridX: 0, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([TERRACE_DOOR], [], [BODENTIEF_WINDOW], []),
      },
    ],
  },

  // ── Kubus mit Terrasse ──────────────────────────────────────────
  {
    id: 'kubus-terrasse',
    name: 'Kubus mit Terrasse',
    description: 'Großzügiger Kubus mit überdachter Glasdach-Terrasse – perfekt als Home Office mit Pausenbereich oder als Gartenlounge mit Rückzugsraum.',
    persons: '1–2 Personen',
    basePrice: 16800,
    image: '/newsite/templates/kubus-terrasse.png',
    modules: [
      {
        type: 'living', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'living', gridX: 0, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([TERRACE_DOOR], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'pergola', gridX: 0, gridY: 6, width: 6, height: 6, options: { dachtyp: 'glas' },
      },
    ],
  },

  // ── Garten-Studio ──────────────────────────────────────────────
  {
    id: 'garten-studio',
    name: 'Garten-Studio',
    description: 'Drei verbundene Living-Module: großer Hauptraum mit separatem Eingangsbereich. Ideal als Atelier, Praxis oder Gästewohnung.',
    persons: '1–3 Personen',
    basePrice: 20400,
    image: '/newsite/templates/garten-studio.png',
    modules: [
      {
        type: 'living', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'living', gridX: 0, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'living', gridX: 0, gridY: 6, width: 6, height: 3, options: {},
        walls: walls([TERRACE_DOOR], [], [BODENTIEF_WINDOW], []),
      },
    ],
  },

  // ── Studio mit Terrasse ─────────────────────────────────────────
  {
    id: 'studio-terrasse',
    name: 'Studio mit Terrasse',
    description: 'Drei Living-Module mit vorgelagerter Glasdach-Pergola: Arbeiten, Empfangen und Entspannen unter einem Dach.',
    persons: '2–4 Personen',
    basePrice: 23600,
    image: '/newsite/templates/studio-terrasse.png',
    modules: [
      {
        type: 'living', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'living', gridX: 0, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'living', gridX: 0, gridY: 6, width: 6, height: 3, options: {},
        walls: walls([TERRACE_DOOR], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'pergola', gridX: 0, gridY: 9, width: 6, height: 8, options: { dachtyp: 'glas' },
      },
    ],
  },

  // ── Garden Office Deluxe ────────────────────────────────────────
  {
    id: 'garden-office-deluxe',
    name: 'Garden Office Deluxe',
    description: 'Vier Living-Module als großzügiges L-Format: viel Platz für professionelle Nutzung mit lichtdurchflutetem Arbeitsbereich.',
    persons: '2–4 Personen',
    basePrice: 27200,
    image: '/newsite/templates/garden-office-deluxe.png',
    modules: [
      {
        type: 'living', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'living', gridX: 0, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'living', gridX: 6, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [BODENTIEF_WINDOW], [], []),
      },
      {
        type: 'living', gridX: 6, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([TERRACE_DOOR], [], [], []),
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  //  SAUNA-VORLAGEN
  // ══════════════════════════════════════════════════════════════════

  // ── Sauna Kompakt ───────────────────────────────────────────────
  {
    id: 'sauna-kompakt',
    name: 'Sauna Kompakt',
    description: 'Saunakern mit Technikraum – kompakte Gartensauna auf kleinstem Raum.',
    persons: '2–3 Personen',
    basePrice: 11700,
    image: '/newsite/templates/sauna-kompakt.png',
    modules: [
      {
        type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [], [STANDARD_DOOR]),
      },
      {
        type: 'technik', gridX: 6, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([STANDARD_DOOR], [], [], []),
      },
    ],
  },

  // ── Sauna Deluxe ────────────────────────────────────────────────
  {
    id: 'sauna-deluxe',
    name: 'Sauna Deluxe',
    description: 'Geräumige Sauna mit Technikraum und Ruhebereich – das volle Saunaerlebnis im eigenen Garten.',
    persons: '3–4 Personen',
    basePrice: 16200,
    image: '/newsite/templates/sauna-deluxe.png',
    modules: [
      {
        type: 'ruhe', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [], []),
      },
      {
        type: 'sauna', gridX: 6, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [STANDARD_DOOR], []),
      },
      {
        type: 'ruhe', gridX: 0, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([TERRACE_DOOR], [], [BODENTIEF_WINDOW], []),
      },
    ],
  },

  // ── Sauna Deluxe mit Terrasse ───────────────────────────────────
  {
    id: 'sauna-terrasse',
    name: 'Sauna Deluxe mit Terrasse',
    description: 'Premium-Saunahaus mit Ruheraum und überdachter Terrasse – Wellness und Entspannung unter freiem Himmel.',
    persons: '3–5 Personen',
    basePrice: 19400,
    image: '/newsite/templates/sauna-terrasse.png',
    modules: [
      {
        type: 'ruhe', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [], []),
      },
      {
        type: 'sauna', gridX: 6, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [], [STANDARD_DOOR], []),
      },
      {
        type: 'ruhe', gridX: 0, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([TERRACE_DOOR], [], [BODENTIEF_WINDOW], []),
      },
      {
        type: 'pergola', gridX: 0, gridY: 6, width: 6, height: 8, options: { dachtyp: 'glas' },
      },
    ],
  },

  // ── Wellness Suite ──────────────────────────────────────────────
  {
    id: 'wellness-suite',
    name: 'Wellness Suite',
    description: 'Großzügige Wellness-Anlage mit Sauna, Technikraum, Ruhebereich, Umkleide und Sanitär – Ihr privates Spa.',
    persons: '4–6 Personen',
    basePrice: 25200,
    image: '/newsite/templates/wellness-suite.png',
    modules: [
      {
        type: 'ruhe', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: { front: [], back: [], left: [], right: [STANDARD_DOOR], interiorWalls: { front: [] } },
      },
      {
        type: 'sauna', gridX: 6, gridY: 0, width: 6, height: 3, options: {},
        walls: walls([], [BODENTIEF_WINDOW], [], []),
      },
      {
        type: 'ruhe', gridX: 12, gridY: 0, width: 3, height: 6, options: {},
        walls: walls([STANDARD_DOOR], [BODENTIEF_WINDOW], [], []),
      },
      {
        type: 'umkleide', gridX: 0, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([], [], [], [STANDARD_DOOR]),
      },
      {
        type: 'ruhe', gridX: 6, gridY: 3, width: 6, height: 3, options: {},
        walls: walls([STANDARD_DOOR], [], [], []),
      },
    ],
  },
];
