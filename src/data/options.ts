import type { OptionDefinition } from '../types/configuration';

export const MODULE_OPTIONS: OptionDefinition[] = [
  {
    key: 'fenster',
    label: 'Fenster-Upgrade',
    type: 'checkbox',
    defaultValue: false,
    appliesTo: ['sauna', 'ruhe', 'living', 'umkleide'],
  },
  {
    key: 'dachtyp',
    label: 'Dachtyp',
    type: 'select',
    options: [
      { value: 'lamellen', label: 'Alu-Lamellen (offen)', priceModifier: 0 },
      { value: 'glas', label: 'Glasdach', priceModifier: 0 },
      { value: 'epdm', label: 'EPDM-Dachfolie', priceModifier: 0 },
    ],
    defaultValue: 'lamellen',
    appliesTo: ['pergola'],
  },
  {
    key: 'anschluss',
    label: 'Wandanschluss',
    type: 'select',
    options: [
      { value: 'wand', label: 'Wandanschluss (keine Pfosten)', priceModifier: 0 },
      { value: 'pfosten', label: 'Mit Pfosten', priceModifier: 0 },
    ],
    defaultValue: 'wand',
    appliesTo: ['pergola'],
  },
  {
    key: 'dachfenster',
    label: 'Dachfenster (Skylight)',
    type: 'checkbox',
    defaultValue: false,
    appliesTo: ['sauna', 'ruhe', 'living', 'umkleide'],
    description: 'Integriertes Dachfenster für Blick in den Himmel',
  },
  {
    key: 'pv_panels',
    label: 'Photovoltaik',
    type: 'checkbox',
    defaultValue: false,
    appliesTo: ['sauna', 'ruhe', 'living', 'umkleide', 'sanitaer', 'technik'],
  },
];

export const FENSTER_PRICE = 650;
export const ISOLIERUNG_PRICE = 1200;
export const DACHFENSTER_PRICE = 1800;
