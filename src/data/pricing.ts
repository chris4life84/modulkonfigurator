import type { PlacedModule } from '../types/grid';
import { MODULE_DEFINITIONS } from './module-types';
import { MODULE_OPTIONS, FENSTER_PRICE, ISOLIERUNG_PRICE } from './options';

export function calculateModulePrice(module: PlacedModule): number {
  const def = MODULE_DEFINITIONS[module.type];
  if (!def) return 0;

  const isLarge = module.width >= 6 && module.height >= 6;
  let price = isLarge ? def.basePrice * 1.7 : def.basePrice;

  // Add option prices
  for (const opt of MODULE_OPTIONS) {
    if (!opt.appliesTo.includes(module.type)) continue;
    const value = module.options[opt.key] ?? opt.defaultValue;

    if (opt.type === 'select' && opt.options) {
      const selected = opt.options.find((o) => o.value === value);
      if (selected) price += selected.priceModifier;
    }
    if (opt.key === 'fenster' && value === true) {
      price += FENSTER_PRICE;
    }
    if (opt.key === 'isolierung' && value === true) {
      price += ISOLIERUNG_PRICE;
    }
  }

  return Math.round(price);
}

export function calculateTotalPrice(modules: PlacedModule[]): number {
  return modules.reduce((sum, m) => sum + calculateModulePrice(m), 0);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
