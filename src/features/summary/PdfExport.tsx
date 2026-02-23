import { useState } from 'react';
import type { PlacedModule } from '../../types/grid';
import { GRID_CELL_SIZE } from '../../types/grid';
import { MODULE_DEFINITIONS } from '../../data/module-types';
import { calculateModulePrice, formatPrice } from '../../data/pricing';
import { svgToDataUrl } from '../../utils/svg-to-image';
import { Button } from '../../components/ui/Button';
import { t } from '../../utils/i18n';

interface PdfExportProps {
  modules: PlacedModule[];
  templateName?: string;
  totalPrice: number;
  totalDimensions: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export function PdfExport({
  modules,
  templateName,
  totalPrice,
  totalDimensions,
  svgRef,
}: PdfExportProps) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      await generatePdf({ modules, templateName, totalPrice, totalDimensions, svgRef });
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

interface PdfData {
  modules: PlacedModule[];
  templateName?: string;
  totalPrice: number;
  totalDimensions: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

async function generatePdf(data: PdfData) {
  // Dynamic import for code-splitting
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Header
  doc.setFontSize(22);
  doc.setTextColor(110, 71, 32);
  doc.text('Modulhaus-Konfigurator', 15, 20);

  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text('Ihre individuelle Konfiguration', 15, 28);

  if (data.templateName) {
    doc.setFontSize(10);
    doc.text(`Vorlage: ${data.templateName}`, 15, 35);
  }

  // Floor plan image
  if (data.svgRef.current) {
    try {
      const svgImage = await svgToDataUrl(data.svgRef.current, 800, 400);
      doc.addImage(svgImage, 'PNG', 15, 42, 170, 85);
    } catch {
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text('[Grundriss konnte nicht generiert werden]', 15, 80);
    }
  }

  // Module table header
  let yPos = 135;
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text('Module', 15, yPos);
  yPos += 8;

  // Table header line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(15, yPos, 270, yPos);
  yPos += 5;

  // Module rows
  for (const module of data.modules) {
    const def = MODULE_DEFINITIONS[module.type];
    const price = calculateModulePrice(module);
    const dims = `${(module.width * GRID_CELL_SIZE).toFixed(1)} × ${(module.height * GRID_CELL_SIZE).toFixed(1)} m`;

    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(def?.name ?? module.type, 15, yPos);

    doc.setTextColor(107, 114, 128);
    doc.text(dims, 100, yPos);
    doc.text(formatPrice(price), 220, yPos, { align: 'right' });

    yPos += 7;

    if (yPos > 185) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Total line
  yPos += 3;
  doc.setDrawColor(168, 118, 50);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, 270, yPos);
  yPos += 8;

  doc.setFontSize(13);
  doc.setTextColor(110, 71, 32);
  doc.text('Gesamtpreis:', 15, yPos);
  doc.text(formatPrice(data.totalPrice), 220, yPos, { align: 'right' });

  yPos += 7;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Gesamtmaße: ${data.totalDimensions}`, 15, yPos);
  doc.text('Innenhöhe: 2,10 m | Außenhöhe: 2,50 m', 15, yPos + 5);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(t('pdf.footer'), 15, pageHeight - 10);
  doc.text(new Date().toLocaleDateString('de-DE'), 260, pageHeight - 10, { align: 'right' });

  doc.save('modulhaus-konfiguration.pdf');
}
