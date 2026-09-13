import { Adjustments, BorderSettings, CropState, ExportSettings, PhotoSizePreset, PrintSheetConfig } from '../types';
import { PAPER_PRESETS, mmToPixels } from '../constants/photoSizes';

/**
 * Loads an image from a URL or File object.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Gagal memuat gambar. Silakan coba file lain.'));
    img.src = src;
  });
}

/**
 * Applies filters (brightness, contrast, saturation, grayscale, sepia, warmth) and renders image.
 */
export function renderProcessedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sWidth: number,
  sHeight: number,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
  adjustments: Adjustments,
  rotation: number = 0,
  flipH: boolean = false,
  flipV: boolean = false
) {
  ctx.save();

  // Move to center of destination for transform
  const centerX = dx + dWidth / 2;
  const centerY = dy + dHeight / 2;
  ctx.translate(centerX, centerY);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  const scaleX = flipH ? -1 : 1;
  const scaleY = flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // CSS Filters
  const filters: string[] = [];
  if (adjustments.brightness !== 0) {
    filters.push(`brightness(${100 + adjustments.brightness}%)`);
  }
  if (adjustments.contrast !== 0) {
    filters.push(`contrast(${100 + adjustments.contrast}%)`);
  }
  if (adjustments.saturation !== 0) {
    filters.push(`saturate(${100 + adjustments.saturation}%)`);
  }
  if (adjustments.grayscale) {
    filters.push('grayscale(100%)');
  }
  if (adjustments.sepia) {
    filters.push('sepia(100%)');
  }

  ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

  // Draw image centered
  ctx.drawImage(
    img,
    sx,
    sy,
    sWidth,
    sHeight,
    -dWidth / 2,
    -dHeight / 2,
    dWidth,
    dHeight
  );

  // Warmth overlay if any
  if (adjustments.warmth !== 0) {
    ctx.filter = 'none';
    ctx.globalCompositeOperation = adjustments.warmth > 0 ? 'color' : 'soft-light';
    const alpha = Math.min(Math.abs(adjustments.warmth) / 100, 0.4);
    ctx.fillStyle = adjustments.warmth > 0 
      ? `rgba(255, 140, 0, ${alpha})` 
      : `rgba(0, 120, 255, ${alpha})`;
    ctx.fillRect(-dWidth / 2, -dHeight / 2, dWidth, dHeight);
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
}

/**
 * Creates high resolution single cropped photo canvas.
 */
export function createCroppedPhotoCanvas(
  img: HTMLImageElement,
  preset: PhotoSizePreset,
  crop: CropState,
  adjustments: Adjustments,
  border: BorderSettings,
  targetDpi: number = 300,
  backgroundColor?: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const targetWidthPx = mmToPixels(preset.widthMm, targetDpi);
  const targetHeightPx = mmToPixels(preset.heightMm, targetDpi);

  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background if specified
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidthPx, targetHeightPx);
  }

  // Calculate inner content area (accounting for border)
  let innerX = 0;
  let innerY = 0;
  let innerW = targetWidthPx;
  let innerH = targetHeightPx;

  if (border.enabled && border.widthMm > 0) {
    const borderPx = mmToPixels(border.widthMm, targetDpi);
    innerX = borderPx;
    innerY = borderPx;
    innerW = Math.max(10, targetWidthPx - borderPx * 2);
    innerH = Math.max(10, targetHeightPx - borderPx * 2);
  }

  // Clip to inner rectangle
  ctx.save();
  ctx.beginPath();
  ctx.rect(innerX, innerY, innerW, innerH);
  ctx.clip();

  // Draw the image
  renderProcessedImage(
    ctx,
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    innerX,
    innerY,
    innerW,
    innerH,
    adjustments,
    crop.rotation,
    crop.flipH,
    crop.flipV
  );

  ctx.restore();

  // Apply Studio Unblur & Clean Brightness Enhancements
  applyImageEnhancements(ctx, innerX, innerY, innerW, innerH, adjustments);

  // Draw border outline if enabled
  if (border.enabled && border.widthMm > 0) {
    const borderPx = mmToPixels(border.widthMm, targetDpi);
    ctx.strokeStyle = border.color || '#FFFFFF';
    ctx.lineWidth = borderPx * 2;
    ctx.strokeRect(0, 0, targetWidthPx, targetHeightPx);
  }

  return canvas;
}

/**
 * Applies sharpening (unblur), clarity (micro-contrast), clean brightness (studio shadow lifting),
 * and dehaze (anti-fog) directly to canvas pixel data.
 */
export function applyImageEnhancements(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  adjustments: Adjustments
) {
  const { sharpness = 0, clarity = 0, cleanBright = 0, dehaze = 0 } = adjustments;
  if (sharpness <= 0 && clarity <= 0 && cleanBright <= 0 && dehaze <= 0) {
    return;
  }

  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const drawW = Math.min(ctx.canvas.width - startX, Math.floor(width));
  const drawH = Math.min(ctx.canvas.height - startY, Math.floor(height));

  if (drawW <= 2 || drawH <= 2) return;

  const imgData = ctx.getImageData(startX, startY, drawW, drawH);
  const data = imgData.data;
  const len = data.length;

  // 1. Studio Clean Brightness & Dehaze (Color Tone & Shadow Lifting):
  // Lifts dull/dark areas cleanly without blowing out highlights, making skin clear & radiant
  if (cleanBright > 0 || dehaze > 0) {
    const brightFactor = (cleanBright / 100) * 0.55;
    const dehazeFactor = (dehaze / 100) * 0.35;

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Studio Clean Brightness: lifts midtones and shadows while smoothly rolling off highlights
      if (cleanBright > 0) {
        const normR = r / 255;
        const normG = g / 255;
        const normB = b / 255;

        r += Math.round((255 - r) * (1 - normR * normR) * brightFactor * 0.95 + 255 * brightFactor * 0.12);
        g += Math.round((255 - g) * (1 - normG * normG) * brightFactor * 0.95 + 255 * brightFactor * 0.12);
        b += Math.round((255 - b) * (1 - normB * normB) * brightFactor * 0.95 + 255 * brightFactor * 0.12);
      }

      // Dehaze: cut through lens haze and soft veil
      if (dehaze > 0) {
        r = (r - 128) * (1 + dehazeFactor) + 128 - dehazeFactor * 16;
        g = (g - 128) * (1 + dehazeFactor) + 128 - dehazeFactor * 16;
        b = (b - 128) * (1 + dehazeFactor) + 128 - dehazeFactor * 16;
      }

      data[i] = Math.max(0, Math.min(255, Math.round(r)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
  }

  // 2. Unblur & Sharpening (Convolution Kernel):
  // Removes blur, sharpens facial contours, eyes, eyelashes, hair, and edges
  const totalSharpness = (sharpness * 0.75 + clarity * 0.6) / 100;
  if (totalSharpness > 0) {
    const srcData = new Uint8ClampedArray(data);
    const k = Math.min(totalSharpness * 0.85, 1.25);
    const centerWeight = 1 + 4 * k;
    const neighborWeight = -k;
    const rowBytes = drawW * 4;

    for (let py = 1; py < drawH - 1; py++) {
      let idx = py * rowBytes + 4;
      for (let px = 1; px < drawW - 1; px++) {
        for (let c = 0; c < 3; c++) {
          const val =
            centerWeight * srcData[idx + c] +
            neighborWeight * (
              srcData[idx - rowBytes + c] +
              srcData[idx + rowBytes + c] +
              srcData[idx - 4 + c] +
              srcData[idx + 4 + c]
            );
          data[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
        }
        idx += 4;
      }
    }
  }

  ctx.putImageData(imgData, startX, startY);
}

/**
 * Generates an A4/Letter/F4/4R sheet canvas ready for printing or download.
 */
export function generatePrintSheetCanvas(
  croppedCanvas: HTMLCanvasElement,
  preset: PhotoSizePreset,
  sheetConfig: PrintSheetConfig,
  allPresets: PhotoSizePreset[],
  allCroppedCanvases?: Record<string, HTMLCanvasElement>,
  dpi: number = 300
): HTMLCanvasElement {
  const paper = PAPER_PRESETS.find((p) => p.id === sheetConfig.paper) || PAPER_PRESETS[0];
  
  let paperWidthMm = paper.widthMm;
  let paperHeightMm = paper.heightMm;

  if (sheetConfig.orientation === 'landscape') {
    [paperWidthMm, paperHeightMm] = [paperHeightMm, paperWidthMm];
  }

  const paperW = mmToPixels(paperWidthMm, dpi);
  const paperH = mmToPixels(paperHeightMm, dpi);

  const canvas = document.createElement('canvas');
  canvas.width = paperW;
  canvas.height = paperH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Fill crisp white sheet
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, paperW, paperH);

  // Margin 8mm
  const marginMm = 8;
  const marginPx = mmToPixels(marginMm, dpi);
  const spacingPx = mmToPixels(sheetConfig.spacingMm, dpi);

  if (sheetConfig.layoutMode === 'package_formal') {
    // Paket Pas Foto Campuran: 4 pcs 4x6 cm, 4 pcs 3x4 cm, 4 pcs 2x3 cm
    const comboSpecs = [
      { id: 'pas-4x6', name: '4x6 cm', count: 4, widthMm: 38.1, heightMm: 55.9 },
      { id: 'pas-3x4', name: '3x4 cm', count: 4, widthMm: 27.9, heightMm: 38.1 },
      { id: 'pas-2x3', name: '2x3 cm', count: 6, widthMm: 21.6, heightMm: 27.9 },
    ];

    let currentY = marginPx;

    // Header info on sheet
    ctx.fillStyle = '#64748B';
    ctx.font = `${Math.round(dpi * 0.045)}px sans-serif`;
    ctx.fillText('Paket Cetak Pas Foto Resmi (Standar Dokumen Indonesia) • 300 DPI High-Res', marginPx, currentY + 20);
    currentY += Math.round(dpi * 0.12);

    for (const spec of comboSpecs) {
      // Group header
      ctx.fillStyle = '#1E293B';
      ctx.font = `bold ${Math.round(dpi * 0.04)}px sans-serif`;
      ctx.fillText(`Ukuran ${spec.name} (${spec.count} Lembar)`, marginPx, currentY + 16);
      currentY += Math.round(dpi * 0.08);

      const pW = mmToPixels(spec.widthMm, dpi);
      const pH = mmToPixels(spec.heightMm, dpi);
      let curX = marginPx;

      for (let i = 0; i < spec.count; i++) {
        if (curX + pW > paperW - marginPx) {
          curX = marginPx;
          currentY += pH + spacingPx;
        }

        // Draw photo
        ctx.drawImage(croppedCanvas, curX, currentY, pW, pH);

        // Optional cut lines
        if (sheetConfig.showCutMarks) {
          drawCutMarks(ctx, curX, currentY, pW, pH, dpi);
        }

        curX += pW + spacingPx;
      }
      currentY += pH + spacingPx + Math.round(dpi * 0.08);
    }
  } else {
    // Mode Repeat
    const pW = mmToPixels(preset.widthMm, dpi);
    const pH = mmToPixels(preset.heightMm, dpi);

    let curX = marginPx;
    let curY = marginPx;

    // Sheet label
    ctx.fillStyle = '#94A3B8';
    ctx.font = `${Math.round(dpi * 0.035)}px sans-serif`;
    ctx.fillText(`Lembar Cetak Foto: ${preset.name} (${preset.widthMm} x ${preset.heightMm} mm) • ${paper.name}`, marginPx, curY + 15);
    curY += Math.round(dpi * 0.08);

    const availableW = paperW - marginPx * 2;
    const cols = Math.max(1, Math.floor((availableW + spacingPx) / (pW + spacingPx)));

    for (let i = 0; i < sheetConfig.repeatCount; i++) {
      if (curX + pW > paperW - marginPx) {
        curX = marginPx;
        curY += pH + spacingPx;
      }

      if (curY + pH > paperH - marginPx) {
        break; // Sheet full
      }

      ctx.drawImage(croppedCanvas, curX, curY, pW, pH);

      if (sheetConfig.showCutMarks) {
        drawCutMarks(ctx, curX, curY, pW, pH, dpi);
      }

      curX += pW + spacingPx;
    }
  }

  return canvas;
}

/**
 * Draws sharp corner crop marks or hairline borders for cutting guide.
 */
function drawCutMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dpi: number
) {
  const lineLen = Math.round(dpi * 0.035); // ~3mm
  ctx.save();
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = Math.max(1, Math.round(dpi / 300));

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x - lineLen, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y - lineLen);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + w + lineLen, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y - lineLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x - lineLen, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h + lineLen);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w + lineLen, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h + lineLen);
  ctx.stroke();

  // Subtle dashed boundary
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}

/**
 * Converts canvas to Blob with quality control and optional target max KB size.
 */
export async function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  settings: ExportSettings
): Promise<Blob> {
  const { format, quality, maxFileSizeKb } = settings;

  if (!maxFileSizeKb || format === 'image/png') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal menghasilkan file foto.'));
      }, format, quality);
    });
  }

  // Binary search for target KB compression (especially for CPNS/BKN upload requirements)
  const maxBytes = maxFileSizeKb * 1024;
  let minQ = 0.1;
  let maxQ = 0.98;
  let bestBlob: Blob | null = null;

  for (let iter = 0; iter < 6; iter++) {
    const curQ = (minQ + maxQ) / 2;
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), format, curQ));
    
    if (blob.size <= maxBytes) {
      bestBlob = blob;
      minQ = curQ; // Try slightly better quality
    } else {
      maxQ = curQ; // Compress further
    }
  }

  if (bestBlob) return bestBlob;

  // Fallback to minQ
  return new Promise((res) => canvas.toBlob((b) => res(b!), format, 0.2));
}

/**
 * Formats bytes to readable string (e.g. "145 KB", "1.2 MB").
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
