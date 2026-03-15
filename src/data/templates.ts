import type { Template } from '../types/configuration';

// Reusable opening definitions
const STANDARD_DOOR = { type: 'door' as const, position: 0.5, width: 0.9, height: 2.0, offsetY: 0 };
const INTERIOR_DOOR = { ...STANDARD_DOOR, hingeSide: 'left' as const, opensOutward: true };
const TERRACE_DOOR = { type: 'terrace-door' as const, position: 0.5, width: 2.0, height: 2.0, offsetY: 0 };
const PANORAMA_WINDOW = { type: 'window' as const, position: 0.5, width: 2.0, height: 2.0, offsetY: 0 };
const SIDE_WINDOW = { type: 'window' as const, position: 0.5, width: 1.5, height: 1.5, offsetY: 0.3 };
const SMALL_WINDOW = { type: 'window' as const, position: 0.5, width: 1.0, height: 1.5, offsetY: 0.3 };
const SAUNA_WINDOW = { type: 'window' as const, position: 0.5, width: 0.8, height: 0.6, offsetY: 0.8 };
const SAUNA_WINDOW_LARGE = { type: 'window' as const, position: 0.5, width: 1.0, height: 1.0, offsetY: 0.8 };
// Elegantes Sauna-Streifenfenster – breit & schmal, Augenhöhe, maximaler Ausblick bei Privatsphäre
const SAUNA_PANORAMA = { type: 'window' as const, position: 0.5, width: 2.0, height: 0.5, offsetY: 1.2 };
const SAUNA_PANORAMA_SMALL = { type: 'window' as const, position: 0.5, width: 1.2, height: 0.4, offsetY: 1.2 };
const PRIVACY_WINDOW = { type: 'window' as const, position: 0.5, width: 0.5, height: 0.4, offsetY: 1.6 };

export const TEMPLATES: Template[] = [
  // =============================================
  // LIVING & OFFICE – progressive: einfach → komplex
  // =============================================

  // ★ Einstieg: ein einzelnes Modul
  {
    id: 'starter',
    name: 'Starter-Modul',
    description:
      'Ein einzelnes 3,0 × 1,5 m Modul – der kompakteste Einstieg. Perfekt als Gartenhaus, Mini-Office oder Ausgangspunkt für spätere Erweiterungen.',
    image: '/templates/starter.jpg',
    persons: 'Flexibel',
    basePrice: 6800,
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 6, height: 3, options: {} },
    ],
  },

  // ★★ Mehr Raum: einzelner Kubus
  {
    id: 'kompakt-kubus',
    name: 'Kompakt-Kubus',
    description:
      'Quadratisches 3,0 × 3,0 m Raumwunder mit Panoramafenster. Ideal als vollwertiges Home Office oder gemütliches Gästezimmer.',
    image: '/templates/kompakt-kubus.jpg',
    persons: '1–2 Personen',
    basePrice: 11500,
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
    ],
  },

  // ★★★ Erste Erweiterung: Kubus + Pergola
  {
    id: 'kubus-terrasse',
    name: 'Kubus mit Terrasse',
    description:
      'Großzügiger Kubus mit überdachter Glasdach-Terrasse – perfekt als Home Office mit Pausenbereich oder als Gartenlounge mit Rückzugsraum.',
    image: '/templates/kubus-terrasse.jpg',
    persons: '1–2 Personen',
    basePrice: 17000,
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
      { type: 'pergola', gridX: 0, gridY: 6, width: 6, height: 6, options: { dachtyp: 'glas' } },
    ],
  },

  // ★★★ Zwei Räume: verbundenes Studio
  {
    id: 'garten-studio',
    name: 'Garten-Studio',
    description:
      'Zwei verbundene Living-Module: großer Hauptraum mit Panoramafenster und separater Eingangsbereich. Ideal als Atelier, Praxis oder Gästewohnung.',
    image: '/templates/garten-studio.jpg',
    persons: '1–3 Personen',
    basePrice: 18400,
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
      { type: 'living', gridX: 0, gridY: 6, width: 6, height: 3, options: {} },
    ],
  },

  // ★★★★ Funktional: Studio + Terrasse
  {
    id: 'studio-terrasse',
    name: 'Studio mit Terrasse',
    description:
      'Zwei Living-Module mit vorgelagerter Glasdach-Pergola: Arbeiten, Empfangen und Entspannen unter einem Dach.',
    image: '/templates/studio-terrasse.jpg',
    persons: '2–4 Personen',
    basePrice: 23800,
    modules: [
      { type: 'living', gridX: 0, gridY: 0, width: 6, height: 6, options: {} },
      { type: 'living', gridX: 0, gridY: 6, width: 6, height: 3, options: {} },
      { type: 'pergola', gridX: 0, gridY: 9, width: 6, height: 6, options: { dachtyp: 'glas' } },
    ],
  },

  // ★★★★★★ Premium: Garden Office Deluxe
  {
    id: 'garden-office-deluxe',
    name: 'Garden Office Deluxe',
    description:
      'Premium Home Office: Empfangs-/Meetingraum, großes Büro, eigenes WC und Glasdach-Pergola. WC intern über das Büro erreichbar.',
    image: '/templates/garden-office-deluxe.jpg',
    persons: '2–6 Personen',
    basePrice: 29000,
    modules: [
      // Hauptbüro – Panorama hinten, Interior-Tür rechts zum WC
      {
        type: 'living', gridX: 0, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [],
          back: [PANORAMA_WINDOW],
          left: [SIDE_WINDOW],
          right: [],
          interiorWalls: {
            right: [INTERIOR_DOOR],
          },
        },
      },
      // Empfang/Meeting – Terrassentür als Haupteingang, offen zum Büro
      {
        type: 'living', gridX: 0, gridY: 6, width: 6, height: 3, options: {},
        walls: {
          front: [TERRACE_DOOR],
          back: [],
          left: [SMALL_WINDOW],
          right: [],
        },
      },
      // WC – kein Außeneingang, nur intern über Büro erreichbar
      {
        type: 'sanitaer', gridX: 6, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [],
          back: [],
          left: [],
          right: [PRIVACY_WINDOW],
        },
      },
      // Terrasse vor dem Empfang
      { type: 'pergola', gridX: 0, gridY: 9, width: 6, height: 6, options: { dachtyp: 'glas' } },
    ],
  },

  // =============================================
  // SAUNA & WELLNESS – progressive: einfach → komplex
  // =============================================

  // ★ Einstieg: Sauna + Technik (Sauna nur von innen)
  {
    id: 'sauna-kompakt',
    name: 'Sauna Kompakt',
    description:
      'Einstieg in die eigene Sauna: kompakter Saunakern mit Technikraum als Vorraum. Saunaeingang nur über den Technikraum – wie es sein soll.',
    image: '/templates/sauna-kompakt.jpg',
    persons: '3 Personen',
    basePrice: 11700,
    modules: [
      // Sauna – KEIN Außeneingang, elegantes Panorama-Streifenfenster
      {
        type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 3, options: {},
        walls: {
          front: [SAUNA_PANORAMA],
          back: [],
          left: [],
          right: [],
        },
      },
      // Technik – Außentür vorne (= Haupteingang), Interior-Tür links zur Sauna
      {
        type: 'technik', gridX: 6, gridY: 0, width: 6, height: 3, options: {},
        walls: {
          front: [STANDARD_DOOR],
          back: [],
          left: [],
          right: [],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
    ],
  },

  // ★★ Größere Sauna
  {
    id: 'sauna-deluxe',
    name: 'Sauna Deluxe',
    description:
      'Großzügige 3 × 3 m Sauna mit Panorama-Saunafenster und separatem Technikraum. Saunaeingang nur über den Technikraum.',
    image: '/templates/sauna-deluxe.jpg',
    persons: '6 Personen',
    basePrice: 17650,
    modules: [
      // Sauna – KEIN Außeneingang, elegante Panorama-Streifenfenster
      {
        type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 6, options: { dachfenster: true },
        walls: {
          front: [SAUNA_PANORAMA],
          back: [],
          left: [SAUNA_PANORAMA],
          right: [],
        },
      },
      // Technik – Außentür vorne, Interior-Tür links zur Sauna
      {
        type: 'technik', gridX: 6, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [STANDARD_DOOR],
          back: [],
          left: [],
          right: [],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
    ],
  },

  // ★★★ Sauna + Terrasse
  {
    id: 'sauna-terrasse',
    name: 'Sauna mit Terrasse',
    description:
      'Saunakern mit Technikraum und Glasdach-Pergola zum Entspannen nach dem Saunieren. Saunaeinstieg über den Technikraum.',
    image: '/templates/sauna-terrasse.jpg',
    persons: '4–6 Personen',
    basePrice: 23100,
    modules: [
      // Sauna – kein Außeneingang, Panorama-Streifenfenster
      {
        type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [SAUNA_PANORAMA],
          back: [],
          left: [SAUNA_PANORAMA],
          right: [],
        },
      },
      // Technik – Außentür vorne, Interior-Tür links zur Sauna
      {
        type: 'technik', gridX: 6, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [STANDARD_DOOR],
          back: [],
          left: [],
          right: [],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
      // Pergola (gleiche Breite wie Sauna + Technik)
      { type: 'pergola', gridX: 0, gridY: 6, width: 9, height: 6, options: { dachtyp: 'glas' } },
    ],
  },

  // ★★★★ Wellness-Suite: Sauna + Umkleide + Eingangsbereich + Chillout
  {
    id: 'wellness-suite',
    name: 'Wellness-Suite',
    description:
      'Komplettes Wellness-Erlebnis: Saunakern, Umkleide, Eingangsbereich und Chillout-Lounge – alles intern verbunden. 9,0 × 3,0 m Gesamtlänge.',
    image: '/templates/wellness-suite.jpg',
    persons: '4–6 Personen',
    basePrice: 25800,
    modules: [
      // Sauna – KEIN Außeneingang, Panorama-Streifenfenster + großes Dachfenster (Sternenhimmel)
      {
        type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 6,
        options: { dachfenster: true, dachfenster_w: 2.0, dachfenster_d: 1.5 },
        walls: {
          front: [{ type: 'window' as const, position: 0.5, width: 2.0, height: 0.5, offsetY: 1.6 }],
          back: [],
          left: [{ type: 'window' as const, position: 0.5, width: 2.0, height: 0.5, offsetY: 1.6 }],
          right: [],
        },
      },
      // Umkleide – kein Außeneingang, Interior-Tür links zur Sauna
      {
        type: 'umkleide', gridX: 6, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [],
          back: [],
          left: [],
          right: [],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
      // Eingangsbereich (Living) – Haupteingangstür vorne, Interior-Tür links zur Umkleide
      {
        type: 'living', gridX: 9, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [STANDARD_DOOR],
          back: [],
          left: [],
          right: [],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
      // Chillout-Lounge – Panoramafenster vorne + Seite (Gartenblick)
      {
        type: 'ruhe', gridX: 12, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [PANORAMA_WINDOW],
          back: [],
          left: [],
          right: [SIDE_WINDOW],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
    ],
  },

  // ★★★★ Wellness komplett: Sauna + Sanitär + Ruhe (intern verbunden)
  {
    id: 'wellness-retreat',
    name: 'Wellness-Retreat',
    description:
      'Sauna, Dusche und Ruhebereich – Ihr privates Spa. Einstieg über den Ruheraum, intern zur Sauna und Dusche verbunden.',
    image: '/templates/wellness-retreat.jpg',
    persons: '4 Personen',
    basePrice: 24200,
    modules: [
      // Sauna – KEIN Außeneingang, Panorama-Streifenfenster, Interior-Tür rechts zum Sanitär
      {
        type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [],
          back: [SAUNA_PANORAMA],
          left: [SAUNA_PANORAMA],
          right: [],
          interiorWalls: {
            right: [INTERIOR_DOOR],
          },
        },
      },
      // Sanitär – KEIN Außeneingang, nur über Sauna erreichbar
      {
        type: 'sanitaer', gridX: 6, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [],
          back: [],
          left: [],
          right: [PRIVACY_WINDOW],
        },
      },
      // Ruheraum vorne – Außentür = Haupteinstieg, Interior-Tür hinten zur Sauna
      {
        type: 'ruhe', gridX: 0, gridY: 6, width: 6, height: 3, options: {},
        walls: {
          front: [STANDARD_DOOR],
          back: [],
          left: [],
          right: [],
          interiorWalls: {
            back: [INTERIOR_DOOR],
          },
        },
      },
    ],
  },

  // ★★★★★★ Premium: Spa Resort (komplett intern verbunden)
  {
    id: 'spa-resort',
    name: 'Spa Resort',
    description:
      'Luxuriöses Wellness-Resort: Umkleiden → Sauna → Duschen → Ruhen → Terrasse. Alle Räume intern verbunden, Sauna mit Panoramafenster.',
    persons: '6–8 Personen',
    basePrice: 36500,
    image: '/templates/spa-resort.jpg',
    modules: [
      // Umkleide links – Außentür vorne (Haupteinstieg), Interior-Tür rechts → Sauna
      {
        type: 'umkleide', gridX: 0, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [STANDARD_DOOR],
          back: [],
          left: [],
          right: [],
          interiorWalls: {
            right: [INTERIOR_DOOR],
          },
        },
      },
      // Sauna groß – KEIN Außeneingang, Panorama-Streifenfenster hinten, Interior rechts → Sanitär, Interior vorne → Ruhe
      {
        type: 'sauna', gridX: 3, gridY: 0, width: 6, height: 6, options: { dachfenster: true },
        walls: {
          front: [],
          back: [SAUNA_PANORAMA],
          left: [],
          right: [],
          interiorWalls: {
            right: [INTERIOR_DOOR],
            front: [INTERIOR_DOOR],
          },
        },
      },
      // Sanitär rechts – KEIN Außeneingang
      {
        type: 'sanitaer', gridX: 9, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [],
          back: [],
          left: [],
          right: [PRIVACY_WINDOW],
        },
      },
      // Ruheraum – Terrassentür vorne zur Pergola, Panoramafenster links + rechts
      {
        type: 'ruhe', gridX: 3, gridY: 6, width: 6, height: 6, options: {},
        walls: {
          front: [TERRACE_DOOR],
          back: [],
          left: [PANORAMA_WINDOW],
          right: [PANORAMA_WINDOW],
        },
      },
      // Pergola vor Ruheraum – Outdoor-Lounge nach dem Saunieren
      { type: 'pergola', gridX: 3, gridY: 12, width: 6, height: 6, options: { dachtyp: 'glas' } },
    ],
  },

  // =============================================
  // KREATIV & BESONDERS
  // =============================================

  // Gästehaus: eigenständig bewohnbar mit internem Bad
  {
    id: 'gaestehouse',
    name: 'Gästehaus',
    description:
      'Eigenständiges Gästehaus: Wohnraum mit Panoramafenster, eigenes Bad intern erreichbar und überdachter Eingangsbereich.',
    persons: '2 Personen',
    basePrice: 20000,
    image: '/templates/gaestehouse.jpg',
    modules: [
      // Wohnraum – Terrassentür vorne, Interior-Tür links zum Bad
      {
        type: 'living', gridX: 3, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [TERRACE_DOOR],
          back: [PANORAMA_WINDOW],
          left: [],
          right: [SIDE_WINDOW],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
      // Bad – KEIN Außeneingang, nur über Wohnraum erreichbar
      {
        type: 'sanitaer', gridX: 0, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [PRIVACY_WINDOW],
          back: [],
          left: [PRIVACY_WINDOW],
          right: [],
        },
      },
      // Eingangs-Pergola (gleiche Breite wie Wohn + Bad)
      { type: 'pergola', gridX: 0, gridY: 6, width: 9, height: 4, options: { dachtyp: 'glas' } },
    ],
  },

  // Pool-Lounge: offene Struktur mit separaten Funktionsräumen
  {
    id: 'pool-lounge',
    name: 'Pool-Lounge',
    description:
      'Große Glasdach-Pergola als Pool-Überdachung oder Outdoor-Lounge mit separater Umkleide und Sanitärmodul.',
    persons: '4 Personen',
    basePrice: 14400,
    image: '/templates/pool-lounge.jpg',
    modules: [
      // Große Pergola (Hauptfläche)
      { type: 'pergola', gridX: 0, gridY: 0, width: 10, height: 6, options: { dachtyp: 'glas' } },
      // Umkleide links unter der Pergola
      { type: 'umkleide', gridX: 0, gridY: 6, width: 6, height: 3, options: {} },
      // Sanitär rechts daneben
      { type: 'sanitaer', gridX: 6, gridY: 6, width: 6, height: 3, options: {} },
    ],
  },

  // L-Form: architektonisches Statement
  {
    id: 'l-form-villa',
    name: 'L-Form Villa',
    description:
      'Drei offene Wohnräume in L-Form mit geschützter Glasdach-Pergola im Innenhof – ein architektonisches Statement.',
    persons: '2–4 Personen',
    basePrice: 30000,
    image: '/templates/l-form-villa.jpg',
    modules: [
      // Hauptraum (hinten, Panorama links + hinten)
      {
        type: 'living', gridX: 0, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [],
          back: [PANORAMA_WINDOW],
          left: [PANORAMA_WINDOW],
          right: [],
        },
      },
      // Eingangsbereich (vorne, Terrassentür = Haupteingang)
      {
        type: 'living', gridX: 0, gridY: 6, width: 6, height: 3, options: {},
        walls: {
          front: [TERRACE_DOOR],
          back: [],
          left: [SMALL_WINDOW],
          right: [],
        },
      },
      // Seitenflügel (rechts, Terrassentür rechts zum Garten)
      {
        type: 'living', gridX: 6, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [SMALL_WINDOW],
          back: [SMALL_WINDOW],
          left: [],
          right: [{ type: 'terrace-door', position: 0.5, width: 1.2, height: 2.0, offsetY: 0 }],
        },
      },
      // Innenhof-Pergola (im L-Winkel)
      { type: 'pergola', gridX: 6, gridY: 6, width: 3, height: 3, options: { dachtyp: 'glas' } },
    ],
  },

  // Grand Residence: große Villa mit Sanitär, 3 Living-Modulen + Pergola
  {
    id: 'grand-residence',
    name: 'Grand Residence',
    description:
      'Stilvolle Modulvilla auf 10,5 × 6,0 m: drei großzügige Wohnbereiche, eigenes Bad und überdachte Glasdach-Terrasse. Der große 3 × 6 m Flügel bietet Raum für Masterbereich oder offenes Wohnzimmer – modern, weitläufig, beeindruckend.',
    persons: '4–6 Personen',
    basePrice: 52000,
    image: '/templates/grand-residence.jpg',
    modules: [
      // Sanitär links – kein Außeneingang, nur intern über Living 1 erreichbar
      {
        type: 'sanitaer', gridX: 0, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [],
          back: [],
          left: [PRIVACY_WINDOW],
          right: [],
        },
      },
      // Living 1 (Zentrum) – Terrassentür vorne zur Pergola, Interior links zum Bad
      {
        type: 'living', gridX: 3, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [TERRACE_DOOR],
          back: [PANORAMA_WINDOW],
          left: [],
          right: [],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
      // Living 2 (Mitte) – offener Übergang zu Living 1, Panorama hinten
      {
        type: 'living', gridX: 9, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [],
          back: [PANORAMA_WINDOW],
          left: [],
          right: [],
        },
      },
      // Living 3 (großer Flügel rechts, 3×6m) – Masterbereich, Terrassentür + Panorama
      {
        type: 'living', gridX: 15, gridY: 0, width: 6, height: 12, options: {},
        walls: {
          front: [TERRACE_DOOR],
          back: [SIDE_WINDOW],
          left: [],
          right: [PANORAMA_WINDOW],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
      // Pergola vorne (Glasdach-Terrasse unter Living 1 + Living 2)
      { type: 'pergola', gridX: 3, gridY: 6, width: 12, height: 6, options: { dachtyp: 'glas' } },
    ],
  },

  // Saunagarten: Sauna mit großem Außenbereich
  {
    id: 'saunagarten',
    name: 'Saunagarten',
    description:
      'Sauna-Ensemble mit Außendusche, Technikraum und großer Glasdach-Pergola. Saunaeinstieg über den Technikraum, danach ab auf die Terrasse.',
    persons: '4–6 Personen',
    basePrice: 26500,
    image: '/templates/saunagarten.jpg',
    modules: [
      // Sauna – kein Außeneingang, Panorama-Streifenfenster vorne + hinten
      {
        type: 'sauna', gridX: 0, gridY: 0, width: 6, height: 6, options: {},
        walls: {
          front: [SAUNA_PANORAMA],
          back: [SAUNA_PANORAMA],
          left: [],
          right: [],
        },
      },
      // Technik – Außentür vorne, Interior-Tür links zur Sauna
      {
        type: 'technik', gridX: 6, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [STANDARD_DOOR],
          back: [],
          left: [],
          right: [],
          interiorWalls: {
            left: [INTERIOR_DOOR],
          },
        },
      },
      // Sanitär (Außendusche neben Technik)
      {
        type: 'sanitaer', gridX: 9, gridY: 0, width: 3, height: 6, options: {},
        walls: {
          front: [STANDARD_DOOR],
          back: [],
          left: [],
          right: [PRIVACY_WINDOW],
        },
      },
      // Große Pergola (Außenbereich zum Abkühlen)
      { type: 'pergola', gridX: 0, gridY: 6, width: 12, height: 6, options: { dachtyp: 'glas' } },
    ],
  },
];
