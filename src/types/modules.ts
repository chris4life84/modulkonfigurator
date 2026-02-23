export type ModuleType = 'sauna' | 'technik' | 'ruhe' | 'umkleide' | 'sanitaer' | 'living';

export interface ModuleDefinition {
  type: ModuleType;
  name: string;
  description: string;
  /** Available sizes in grid cells [width, height] */
  availableSizes: [number, number][];
  basePrice: number;
  color: string;
  icon: string;
}
