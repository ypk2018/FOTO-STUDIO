import { jsPDF } from 'jspdf';
import { PaperPreset, PhotoSizePreset } from '../types';

export interface GeneratedPdfResult {
  blob: Blob;
  url: string;
  filename: string;
  sizeBytes: number;
}

/**
 * Generates a high quality PDF from a configured print sheet canvas.
 * Sets the exact physical paper dimensions in mm (1:1 true print scale).
 */
export function generatePrintSheetPdf(
  sheetCanvas: HTMLCanvasElement,
  paper: PaperPreset,
  orientation: 'portrait' | 'landscape',
  filename: string = 'lembar-cetak.pdf'
): GeneratedPdfResult {
  const isLandscape = orientation === 'landscape';
  const widthMm = isLandscape ? paper.heightMm : paper.widthMm;
  const heightMm = isLandscape ? paper.widthMm : paper.heightMm;

  // Initialize jsPDF with exact paper dimensions in millimeters
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  // Convert canvas to JPEG at high quality (0.97) for compact PDF without quality loss
  const imgData = sheetCanvas.toDataURL('image/jpeg', 0.97);

  // Draw 100% full bleed of the paper size
  doc.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm, undefined, 'FAST');

  // Metadata
  doc.setProperties({
    title: `FotoStudio - ${paper.name}`,
    subject: 'Lembar Cetak Pas Foto Siap Cetak (300 DPI High-Res)',
    creator: 'FotoStudio 2x2 — 10R',
    author: 'FotoStudio',
  });

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    filename,
    sizeBytes: blob.size,
  };
}

/**
 * Generates a single photo PDF document at exact mm dimensions.
 */
export function generateSinglePhotoPdf(
  photoCanvas: HTMLCanvasElement,
  preset: PhotoSizePreset,
  filename: string = 'foto-dokumen.pdf'
): GeneratedPdfResult {
  const isLandscape = preset.widthMm > preset.heightMm;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [preset.widthMm, preset.heightMm],
    compress: true,
  });

  const imgData = photoCanvas.toDataURL('image/jpeg', 0.98);
  doc.addImage(imgData, 'JPEG', 0, 0, preset.widthMm, preset.heightMm, undefined, 'FAST');

  doc.setProperties({
    title: `FotoStudio - ${preset.name}`,
    subject: `Pas Foto ${preset.name} Dokumen Resmi 300 DPI`,
    creator: 'FotoStudio 2x2 — 10R',
    author: 'FotoStudio',
  });

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    filename,
    sizeBytes: blob.size,
  };
}
