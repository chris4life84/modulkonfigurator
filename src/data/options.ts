import type { OptionDefinition } from '../types/configuration';

export const MODULE_OPTIONS: OptionDefinition[] = [
  {
    key: 'ofen',
    label: 'Saunaofen',
    type: 'select',
    options: [
      { value: 'elektro-6kw', label: 'Elektroofen 6 kW', priceModifier: 0 },
      { value: 'elektro-9kw', label: 'Elektroofen 9 kW', priceModifier: 400 },
      { value: 'holz', label: 'Holzofen', priceModifier: 1200 },
    ],
    defaultValue: 'elektro-6kw',
    appliesTo: ['sauna'],
  },
  {
    key: 'fenster',
    label: 'Fenster-Upgrade',
    type: 'checkbox',
    defaultValue: false,
    appliesTo: ['sauna', 'ruhe', 'living', 'umkleide'],
  },
  {
    key: 'isolierung',
    label: 'Premium-Isolierung',
    type: 'checkbox',
    defaultValue: false,
    appliesTo: ['living'],
  },
  {
    key: 'dachtyp',
    label: 'Dachtyp',
    type: 'select',
    options: [
      { value: 'lamellen', label: 'Alu-Lamellen (offen)', priceModifier: 0 },
      { value: 'glas', label: 'Glasdach', priceModifier: 1800 },
      { value: 'epdm', label: 'EPDM-Dachfolie', priceModifier: 900 },
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
      { value: 'pfosten', label: 'Mit Pfosten', priceModifier: 200 },
    ],
    defaultValue: 'wand',
    appliesTo: ['pergola'],
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
export const PV_PRICE = 4500;
