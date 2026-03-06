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
];

export const FENSTER_PRICE = 650;
export const ISOLIERUNG_PRICE = 1200;
