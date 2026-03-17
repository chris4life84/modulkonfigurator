import { useState } from 'react';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import type { WallSide } from '../../types/walls';
import { getDefaultWallConfig } from '../../types/walls';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { MODULE_OPTIONS } from '../../data/options';
import { calculateModulePrice, formatPrice } from '../../data/pricing';
import { getSharedWalls } from '../../utils/walls';
import { svgToDataUrl } from '../../utils/svg-to-image';
import { calculateMaxPanels, calculateKWp } from '../../utils/pvCalculation';
import { Button } from '../../components/ui/Button';
import { t } from '../../utils/i18n';

interface PdfExportProps {
  modules: PlacedModule[];
  templateName?: string;
  totalPrice: number;
  totalDimensions: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  vizContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function PdfExport({
  modules,
  templateName,
  totalPrice,
  totalDimensions,
  svgRef,
  vizContainerRef,
}: PdfExportProps) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      await generatePdf({
        modules,
        templateName,
        totalPrice,
        totalDimensions,
        svgRef,
        vizContainerRef,
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} disabled={generating}>
      {generating ? t('pdf.generating') : t('pdf.export')}
    </Button>
  );
}

// ─── Types ───────────────────────────────────────────────────────────

export interface PdfData {
  modules: PlacedModule[];
  templateName?: string;
  totalPrice: number;
  totalDimensions: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  vizContainerRef?: React.RefObject<HTMLDivElement | null>;
}

// ─── Color constants ─────────────────────────────────────────────────

const C = {
  brand: [110, 71, 32] as const,
  dark: [17, 24, 39] as const,
  gray: [107, 114, 128] as const,
  light: [156, 163, 175] as const,
  line: [229, 231, 235] as const,
  accent: [168, 118, 50] as const,
  bgWarm: [253, 249, 243] as const,
};

// ─── Helper: Wall details per module ─────────────────────────────────

const SIDE_NAMES: Record<WallSide, string> = {
  front: 'Vorne',
  back: 'Hinten',
  left: 'Links',
  right: 'Rechts',
};

const OPENING_NAMES: Record<string, string> = {
  window: 'Fenster',
  door: 'Tür',
  'terrace-door': 'Terrassentür',
};

const OPPOSITE_SIDE: Record<WallSide, WallSide> = {
  front: 'back',
  back: 'front',
  left: 'right',
  right: 'left',
};

/**
 * Find interior openings on a shared wall – checks both
 * this module's interiorWalls and the neighbor's interiorWalls.
 */
function getInteriorOpenings(
  module: PlacedModule,
  side: WallSide,
  allModules: PlacedModule[],
): typeof module.walls extends undefined ? never : NonNullable<NonNullable<PlacedModule['walls']>[WallSide]> {
  const openings: { type: string; width: number; height: number; position: number; offsetY: number }[] = [];

  // Check this module's interiorWalls
  const walls = module.walls ?? getDefaultWallConfig(module.type, module.width, module.height);
  const own = walls.interiorWalls?.[side];
  if (own) openings.push(...own);

  // Check neighbor's interiorWalls on the opposite side
  const oppSide = OPPOSITE_SIDE[side];
  for (const other of allModules) {
    if (other.id === module.id) continue;
    if (other.type === 'pergola') continue;

    // Check if other is actually adjacent on this side
    let adjacent = false;
    if (side === 'right' && other.gridX === module.gridX + module.width) adjacent = true;
    if (side === 'left' && module.gridX === other.gridX + other.width) adjacent = true;
    if (side === 'front' && other.gridY === module.gridY + module.height) adjacent = true;
    if (side === 'back' && module.gridY === other.gridY + other.height) adjacent = true;

    if (adjacent) {
      const otherWalls = other.walls ?? getDefaultWallConfig(other.type, other.width, other.height);
      const neighborOpenings = otherWalls.interiorWalls?.[oppSide];
      if (neighborOpenings) openings.push(...neighborOpenings);
    }
  }

  return openings as never;
}

function formatPosition(position: number): string {
  if (Math.abs(position - 0.5) < 0.03) return 'Mitte';
  return `${Math.round(position * 100)}%`;
}

function formatOpening(o: {
  type: string;
  width: number;
  height: number;
  offsetY?: number;
  position?: number;
  hingeSide?: 'left' | 'right';
  opensOutward?: boolean;
}): string {
  const name = OPENING_NAMES[o.type] ?? o.type;
  let text = `${name} ${o.width.toFixed(1)} × ${o.height.toFixed(1)} m`;

  // Position (skip if centered — it's the default)
  if (o.position !== undefined && Math.abs(o.position - 0.5) >= 0.03) {
    text += `, Pos. ${formatPosition(o.position)}`;
  }

  // Window sill height
  if (o.type === 'window' && o.offsetY && o.offsetY > 0) {
    text += `, Brüstung ${o.offsetY.toFixed(1)} m`;
  }

  // Door hinge & opening direction
  if (o.type === 'door' || o.type === 'terrace-door') {
    const hinge = o.hingeSide === 'right' ? 'rechts' : 'links';
    const direction = o.opensOutward === false ? 'innen' : 'außen';
    text += `, Scharnier ${hinge} ${direction}`;
  }

  return text;
}

function getWallDetails(
  module: PlacedModule,
  allModules: PlacedModule[],
): { side: string; detail: string }[] {
  const walls =
    module.walls ?? getDefaultWallConfig(module.type, module.width, module.height);
  const shared = getSharedWalls(module, allModules);
  const sides: WallSide[] = ['front', 'back', 'left', 'right'];

  return sides.map((side) => {
    if (shared.has(side)) {
      // Check for interior openings (doors/windows) on this shared wall
      const interiorOpenings = getInteriorOpenings(module, side, allModules);
      if (interiorOpenings.length > 0) {
        const parts = interiorOpenings.map((o) => formatOpening(o));
        return { side: SIDE_NAMES[side], detail: `Verbundwand (${parts.join('; ')})` };
      }
      return { side: SIDE_NAMES[side], detail: 'Verbundwand' };
    }
    const openings = walls[side];
    if (!openings || openings.length === 0) {
      return { side: SIDE_NAMES[side], detail: 'Geschlossen' };
    }
    const parts = openings.map((o) => formatOpening(o));
    return { side: SIDE_NAMES[side], detail: parts.join('; ') };
  });
}

// ─── Helper: Module options ──────────────────────────────────────────

const PV_ORIENTATION_LABELS: Record<string, string> = {
  S: 'Süd',
  N: 'Nord',
  E: 'Ost',
  W: 'West',
};

function getModuleOptions(module: PlacedModule): string[] {
  const details: string[] = [];
  for (const opt of MODULE_OPTIONS) {
    if (!opt.appliesTo.includes(module.type)) continue;
    const value = module.options[opt.key] ?? opt.defaultValue;
    if (opt.type === 'select' && opt.options) {
      const selected = opt.options.find((o) => o.value === value);
      if (selected) details.push(`${opt.label}: ${selected.label}`);
    }
    if (opt.type === 'checkbox' && value === true) {
      // PV panels: show count, orientation, kWp
      if (opt.key === 'pv_panels') {
        const widthM = module.width * GRID_CELL_SIZE;
        const depthM = module.height * GRID_CELL_SIZE;
        const { maxPanels, rotated } = calculateMaxPanels(widthM, depthM);
        const panelCount = (module.options.pv_panel_count as number) ?? maxPanels;
        const orientation = (module.options.pv_orientation as string) ?? 'S';
        const kWp = calculateKWp(panelCount);
        const orientLabel = PV_ORIENTATION_LABELS[orientation] ?? orientation;
        const formatLabel = rotated ? 'Querformat' : 'Hochformat';
        details.push(
          `Photovoltaik: ${panelCount} Panels (${formatLabel}, ${orientLabel}), ${kWp.toFixed(1)} kWp`,
        );
      } else {
        details.push(opt.label);
      }
    }
  }
  return details;
}

// ─── Main PDF generation ─────────────────────────────────────────────

async function generatePdf(data: PdfData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...C.light);
    doc.text(t('pdf.footer'), margin, pageH - 8);
    doc.text(new Date().toLocaleDateString('de-DE'), pageW - margin, pageH - 8, {
      align: 'right',
    });
  };

  const ensureSpace = (y: number, needed: number): number => {
    if (y + needed > pageH - 15) {
      addFooter();
      doc.addPage();
      return 20;
    }
    return y;
  };

  // ════════════════════════════════════════════════════════════════
  // PAGE 1 — Overview
  // ════════════════════════════════════════════════════════════════

  doc.setFontSize(22);
  doc.setTextColor(...C.brand);
  doc.text('Modulhaus-Konfigurator', margin, 20);

  doc.setFontSize(11);
  doc.setTextColor(...C.gray);
  doc.text('Ihre individuelle Konfiguration', margin, 28);

  if (data.templateName) {
    doc.setFontSize(9);
    doc.setTextColor(...C.light);
    doc.text(`Vorlage: ${data.templateName}`, margin, 34);
  }

  // ── Images: 2D floor plan (left) + 3D view (right) ──
  const imgTop = data.templateName ? 38 : 34;
  const imgH = 75;
  const imgGap = 6;
  const imgW = (contentW - imgGap) / 2;

  // 2D Floor plan
  if (data.svgRef.current) {
    try {
      const svgImage = await svgToDataUrl(data.svgRef.current, 800, 400);
      doc.addImage(svgImage, 'PNG', margin, imgTop, imgW, imgH);
    } catch {
      /* fallback handled by border below */
    }
  }
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.rect(margin, imgTop, imgW, imgH);

  // 3D Visualization
  const img3dX = margin + imgW + imgGap;
  let has3D = false;
  if (data.vizContainerRef?.current) {
    try {
      const canvas = data.vizContainerRef.current.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        doc.addImage(dataUrl, 'PNG', img3dX, imgTop, imgW, imgH);
        has3D = true;
      }
    } catch {
      // fallback below
    }
  }
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.rect(img3dX, imgTop, imgW, imgH);

  if (!has3D) {
    doc.setFontSize(9);
    doc.setTextColor(...C.light);
    doc.text('[3D-Ansicht nicht verfügbar]', img3dX + imgW / 2, imgTop + imgH / 2, {
      align: 'center',
    });
  }

  // Image labels
  doc.setFontSize(7);
  doc.setTextColor(...C.light);
  doc.text('Grundriss', margin + imgW / 2, imgTop + imgH + 4, { align: 'center' });
  doc.text('3D-Ansicht', img3dX + imgW / 2, imgTop + imgH + 4, { align: 'center' });

  // ── Overview box ──
  let yPos = imgTop + imgH + 10;

  doc.setFillColor(...C.bgWarm);
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, yPos, contentW, 20, 2, 2, 'FD');

  const boxY = yPos + 8;
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.text(`Gesamtmaße: ${data.totalDimensions}`, margin + 6, boxY);
  doc.text('Innenhöhe: 2,10 m | Außenhöhe: 2,50 m', margin + 6, boxY + 6);
  doc.text(`Module: ${data.modules.length}`, margin + contentW * 0.4, boxY);

  doc.setFontSize(12);
  doc.setTextColor(...C.brand);
  doc.text('Gesamtpreis:', margin + contentW * 0.65, boxY + 2);
  doc.setFontSize(14);
  doc.text(formatPrice(data.totalPrice), pageW - margin - 6, boxY + 2, { align: 'right' });

  addFooter();

  // ════════════════════════════════════════════════════════════════
  // PAGE 2+ — Module Details
  // ════════════════════════════════════════════════════════════════

  doc.addPage();
  yPos = 20;

  doc.setFontSize(16);
  doc.setTextColor(...C.brand);
  doc.text('Moduldetails', margin, yPos);
  yPos += 10;

  for (let idx = 0; idx < data.modules.length; idx++) {
    const module = data.modules[idx];
    const def = MODULE_DEFINITIONS[module.type];
    const price = calculateModulePrice(module);
    const widthM = (module.width * GRID_CELL_SIZE).toFixed(1);
    const depthM = (module.height * GRID_CELL_SIZE).toFixed(1);
    const wallDetails = getWallDetails(module, data.modules);
    const options = getModuleOptions(module);

    // Estimate needed height for this module block
    const blockH = 38 + (options.length > 0 ? 7 : 0);
    yPos = ensureSpace(yPos, blockH);

    // Separator line
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageW - margin, yPos);
    yPos += 5;

    // Color dot
    const dotColor = def?.color ?? '#9ca3af';
    const cr = parseInt(dotColor.slice(1, 3), 16);
    const cg = parseInt(dotColor.slice(3, 5), 16);
    const cb = parseInt(dotColor.slice(5, 7), 16);
    doc.setFillColor(cr, cg, cb);
    doc.circle(margin + 2, yPos - 1.2, 1.5, 'F');

    // Module name
    doc.setFontSize(11);
    doc.setTextColor(...C.dark);
    doc.text(`${def?.name ?? module.type} #${idx + 1}`, margin + 7, yPos);

    // Dimensions
    doc.setFontSize(10);
    doc.setTextColor(...C.gray);
    doc.text(`${widthM} × ${depthM} m`, margin + 85, yPos);

    // Price
    doc.setTextColor(...C.dark);
    doc.text(formatPrice(price), pageW - margin, yPos, { align: 'right' });
    yPos += 7;

    // ── Wall configuration (2×2 grid layout) ──
    doc.setFontSize(8);
    doc.setTextColor(...C.brand);
    doc.text('Wände:', margin + 7, yPos);
    yPos += 4.5;

    const colL = margin + 7;
    const colR = margin + contentW * 0.5;

    for (let w = 0; w < wallDetails.length; w++) {
      const wall = wallDetails[w];
      const x = w % 2 === 0 ? colL : colR;
      if (w === 2) yPos += 5.5;

      doc.setFontSize(8);
      doc.setTextColor(...C.gray);
      doc.text(`${wall.side}:`, x, yPos);

      doc.setTextColor(...C.dark);
      const maxLen = 70;
      const detail =
        wall.detail.length > maxLen ? wall.detail.substring(0, maxLen - 1) + '…' : wall.detail;
      doc.text(detail, x + 17, yPos);
    }
    yPos += 7;

    // ── Options (if any) ──
    if (options.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(...C.brand);
      doc.text('Optionen:', margin + 7, yPos);

      doc.setTextColor(...C.dark);
      doc.text(options.join(' · '), margin + 30, yPos);
      yPos += 6;
    }

    yPos += 3;
  }

  // ════════════════════════════════════════════════════════════════
  // Price Summary
  // ════════════════════════════════════════════════════════════════

  yPos = ensureSpace(yPos, 50);
  yPos += 4;

  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageW - margin, yPos);
  yPos += 8;

  doc.setFontSize(14);
  doc.setTextColor(...C.brand);
  doc.text('Preisübersicht', margin, yPos);
  yPos += 8;

  // Column headers
  doc.setFontSize(8);
  doc.setTextColor(...C.light);
  doc.text('Modul', margin, yPos);
  doc.text('Maße', margin + 100, yPos);
  doc.text('Preis', pageW - margin, yPos, { align: 'right' });
  yPos += 2;
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageW - margin, yPos);
  yPos += 5;

  for (let idx = 0; idx < data.modules.length; idx++) {
    const module = data.modules[idx];
    const def = MODULE_DEFINITIONS[module.type];
    const price = calculateModulePrice(module);
    const dims = `${(module.width * GRID_CELL_SIZE).toFixed(1)} × ${(module.height * GRID_CELL_SIZE).toFixed(1)} m`;

    yPos = ensureSpace(yPos, 7);

    doc.setFontSize(9);
    doc.setTextColor(...C.dark);
    doc.text(`${def?.name ?? module.type} #${idx + 1}`, margin, yPos);

    doc.setTextColor(...C.gray);
    doc.text(dims, margin + 100, yPos);

    doc.setTextColor(...C.dark);
    doc.text(formatPrice(price), pageW - margin, yPos, { align: 'right' });

    yPos += 6;
  }

  // Total
  yPos += 2;
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.6);
  doc.line(margin, yPos, pageW - margin, yPos);
  yPos += 8;

  doc.setFontSize(14);
  doc.setTextColor(...C.brand);
  doc.text('Gesamtpreis:', margin, yPos);
  doc.text(formatPrice(data.totalPrice), pageW - margin, yPos, { align: 'right' });

  addFooter();

  doc.save('modulhaus-konfiguration.pdf');
}

/**
 * Generate the PDF and return it as a Blob (for email attachment upload).
 * Uses the same layout as generatePdf() but returns a blob instead of triggering download.
 */
export async function generatePdfBlob(data: PdfData): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...C.light);
    doc.text(t('pdf.footer'), margin, pageH - 8);
    doc.text(new Date().toLocaleDateString('de-DE'), pageW - margin, pageH - 8, {
      align: 'right',
    });
  };

  const ensureSpace = (y: number, needed: number): number => {
    if (y + needed > pageH - 15) {
      addFooter();
      doc.addPage();
      return 20;
    }
    return y;
  };

  // PAGE 1 — Overview
  doc.setFontSize(22);
  doc.setTextColor(...C.brand);
  doc.text('Modulhaus-Konfigurator', margin, 20);

  doc.setFontSize(11);
  doc.setTextColor(...C.gray);
  doc.text('Ihre individuelle Konfiguration', margin, 28);

  if (data.templateName) {
    doc.setFontSize(9);
    doc.setTextColor(...C.light);
    doc.text(`Vorlage: ${data.templateName}`, margin, 34);
  }

  const imgTop = data.templateName ? 38 : 34;
  const imgH = 75;
  const imgGap = 6;
  const imgW = (contentW - imgGap) / 2;

  if (data.svgRef.current) {
    try {
      const svgImage = await svgToDataUrl(data.svgRef.current, 800, 400);
      doc.addImage(svgImage, 'PNG', margin, imgTop, imgW, imgH);
    } catch { /* fallback */ }
  }
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.rect(margin, imgTop, imgW, imgH);

  const img3dX = margin + imgW + imgGap;
  let has3D = false;
  if (data.vizContainerRef?.current) {
    try {
      const canvas = data.vizContainerRef.current.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        doc.addImage(dataUrl, 'PNG', img3dX, imgTop, imgW, imgH);
        has3D = true;
      }
    } catch { /* fallback */ }
  }
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.3);
  doc.rect(img3dX, imgTop, imgW, imgH);

  if (!has3D) {
    doc.setFontSize(9);
    doc.setTextColor(...C.light);
    doc.text('[3D-Ansicht nicht verfügbar]', img3dX + imgW / 2, imgTop + imgH / 2, { align: 'center' });
  }

  doc.setFontSize(7);
  doc.setTextColor(...C.light);
  doc.text('Grundriss', margin + imgW / 2, imgTop + imgH + 4, { align: 'center' });
  doc.text('3D-Ansicht', img3dX + imgW / 2, imgTop + imgH + 4, { align: 'center' });

  let yPos = imgTop + imgH + 10;
  doc.setFillColor(...C.bgWarm);
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, yPos, contentW, 20, 2, 2, 'FD');

  const boxY = yPos + 8;
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.text(`Gesamtmaße: ${data.totalDimensions}`, margin + 6, boxY);
  doc.text('Innenhöhe: 2,10 m | Außenhöhe: 2,50 m', margin + 6, boxY + 6);
  doc.text(`Module: ${data.modules.length}`, margin + contentW * 0.4, boxY);

  doc.setFontSize(12);
  doc.setTextColor(...C.brand);
  doc.text('Gesamtpreis:', margin + contentW * 0.65, boxY + 2);
  doc.setFontSize(14);
  doc.text(formatPrice(data.totalPrice), pageW - margin - 6, boxY + 2, { align: 'right' });

  addFooter();

  // PAGE 2+ — Module Details
  doc.addPage();
  yPos = 20;

  doc.setFontSize(16);
  doc.setTextColor(...C.brand);
  doc.text('Moduldetails', margin, yPos);
  yPos += 10;

  for (let idx = 0; idx < data.modules.length; idx++) {
    const module = data.modules[idx];
    const def = MODULE_DEFINITIONS[module.type];
    const price = calculateModulePrice(module);
    const widthM = (module.width * GRID_CELL_SIZE).toFixed(1);
    const depthM = (module.height * GRID_CELL_SIZE).toFixed(1);
    const wallDetails = getWallDetails(module, data.modules);
    const options = getModuleOptions(module);

    const blockH = 38 + (options.length > 0 ? 7 : 0);
    yPos = ensureSpace(yPos, blockH);

    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageW - margin, yPos);
    yPos += 5;

    const dotColor = def?.color ?? '#9ca3af';
    const cr = parseInt(dotColor.slice(1, 3), 16);
    const cg = parseInt(dotColor.slice(3, 5), 16);
    const cb = parseInt(dotColor.slice(5, 7), 16);
    doc.setFillColor(cr, cg, cb);
    doc.circle(margin + 2, yPos - 1.2, 1.5, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...C.dark);
    doc.text(`${def?.name ?? module.type} #${idx + 1}`, margin + 7, yPos);

    doc.setFontSize(10);
    doc.setTextColor(...C.gray);
    doc.text(`${widthM} × ${depthM} m`, margin + 85, yPos);

    doc.setTextColor(...C.dark);
    doc.text(formatPrice(price), pageW - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.setFontSize(8);
    doc.setTextColor(...C.brand);
    doc.text('Wände:', margin + 7, yPos);
    yPos += 4.5;

    const colL = margin + 7;
    const colR = margin + contentW * 0.5;

    for (let w = 0; w < wallDetails.length; w++) {
      const wall = wallDetails[w];
      const x = w % 2 === 0 ? colL : colR;
      if (w === 2) yPos += 5.5;

      doc.setFontSize(8);
      doc.setTextColor(...C.gray);
      doc.text(`${wall.side}:`, x, yPos);

      doc.setTextColor(...C.dark);
      const maxLen = 70;
      const detail = wall.detail.length > maxLen ? wall.detail.substring(0, maxLen - 1) + '…' : wall.detail;
      doc.text(detail, x + 17, yPos);
    }
    yPos += 7;

    if (options.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(...C.brand);
      doc.text('Optionen:', margin + 7, yPos);
      doc.setTextColor(...C.dark);
      doc.text(options.join(' · '), margin + 30, yPos);
      yPos += 6;
    }

    yPos += 3;
  }

  // Price Summary
  yPos = ensureSpace(yPos, 50);
  yPos += 4;

  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageW - margin, yPos);
  yPos += 8;

  doc.setFontSize(14);
  doc.setTextColor(...C.brand);
  doc.text('Preisübersicht', margin, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.setTextColor(...C.light);
  doc.text('Modul', margin, yPos);
  doc.text('Maße', margin + 100, yPos);
  doc.text('Preis', pageW - margin, yPos, { align: 'right' });
  yPos += 2;
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageW - margin, yPos);
  yPos += 5;

  for (let idx = 0; idx < data.modules.length; idx++) {
    const module = data.modules[idx];
    const def = MODULE_DEFINITIONS[module.type];
    const price = calculateModulePrice(module);
    const dims = `${(module.width * GRID_CELL_SIZE).toFixed(1)} × ${(module.height * GRID_CELL_SIZE).toFixed(1)} m`;

    yPos = ensureSpace(yPos, 7);

    doc.setFontSize(9);
    doc.setTextColor(...C.dark);
    doc.text(`${def?.name ?? module.type} #${idx + 1}`, margin, yPos);
    doc.setTextColor(...C.gray);
    doc.text(dims, margin + 100, yPos);
    doc.setTextColor(...C.dark);
    doc.text(formatPrice(price), pageW - margin, yPos, { align: 'right' });
    yPos += 6;
  }

  yPos += 2;
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.6);
  doc.line(margin, yPos, pageW - margin, yPos);
  yPos += 8;

  doc.setFontSize(14);
  doc.setTextColor(...C.brand);
  doc.text('Gesamtpreis:', margin, yPos);
  doc.text(formatPrice(data.totalPrice), pageW - margin, yPos, { align: 'right' });

  addFooter();

  return doc.output('blob');
}
