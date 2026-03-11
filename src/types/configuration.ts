import type { PlacedModule } from './grid';

export interface Template {
  id: string;
  name: string;
  description: string;
  persons: string;
  basePrice: number;
  modules: Omit<PlacedModule, 'id'>[];
  image?: string;
}

export interface OptionDefinition {
  key: string;
  label: string;
  type: 'select' | 'checkbox';
  options?: { value: string; label: string; priceModifier: number }[];
  defaultValue: string | boolean;
  /** Which module types this option applies to */
  appliesTo: string[];
  /** Optional description text shown below the option label */
  description?: string;
}

export interface ConfigSummary {
  templateName: string;
  modules: { name: string; dimensions: string; price: number }[];
  options: { label: string; value: string; price: number }[];
  totalPrice: number;
  totalDimensions: string;
}
