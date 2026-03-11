/**
 * Shared PV panel calculation utilities.
 * Constants must stay in sync with SolarPanels3D.tsx rendering.
 */

// Panel dimensions (realistic residential PV panel)
export const PV_PANEL_W = 1.0;    // Width of a single panel (m)
export const PV_PANEL_D = 1.7;    // Depth of a single panel (m)
export const PV_MARGIN = 0.20;    // Distance from roof edge (m)
export const PV_GAP = 0.06;       // Gap between panels (m)

// Power & pricing
export const PV_KWP_PER_PANEL = 0.4;   // 400W = 0.4 kWp per panel
export const PV_PRICE_PER_PANEL = 500;  // EUR per panel (incl. installation)

/**
 * Calculate how many PV panels fit on a roof of the given dimensions.
 * Tries both orientations (normal + rotated) and picks the one with more panels.
 */
export function calculateMaxPanels(
  moduleWidthM: number,
  moduleDepthM: number,
): { cols: number; rows: number; maxPanels: number; rotated: boolean } {
  const availW = moduleWidthM - PV_MARGIN * 2;
  const availD = moduleDepthM - PV_MARGIN * 2;

  // Normal orientation (W=1.0, D=1.7)
  const colsN = Math.max(0, Math.floor((availW + PV_GAP) / (PV_PANEL_W + PV_GAP)));
  const rowsN = Math.max(0, Math.floor((availD + PV_GAP) / (PV_PANEL_D + PV_GAP)));
  const normalCount = colsN * rowsN;

  // Rotated orientation (W=1.7, D=1.0)
  const colsR = Math.max(0, Math.floor((availW + PV_GAP) / (PV_PANEL_D + PV_GAP)));
  const rowsR = Math.max(0, Math.floor((availD + PV_GAP) / (PV_PANEL_W + PV_GAP)));
  const rotatedCount = colsR * rowsR;

  if (rotatedCount > normalCount) {
    return { cols: colsR, rows: rowsR, maxPanels: rotatedCount, rotated: true };
  }
  return { cols: colsN, rows: rowsN, maxPanels: normalCount, rotated: false };
}

/** Calculate kWp for a given number of panels */
export function calculateKWp(panelCount: number): number {
  return panelCount * PV_KWP_PER_PANEL;
}

/** Calculate PV price for a given number of panels */
export function calculatePVPrice(panelCount: number): number {
  return panelCount * PV_PRICE_PER_PANEL;
}
