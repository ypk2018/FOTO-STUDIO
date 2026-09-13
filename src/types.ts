export type SizeCategory = 'pas_foto' | 'seri_r' | 'kustom';

export interface PhotoSizePreset {
  id: string;
  name: string;
  category: SizeCategory;
  widthMm: number;
  heightMm: number;
  description: string;
  recommendedFor?: string;
  aspectRatio: number; // width / height
}

export interface Adjustments {
  brightness: number; // -60 to 60
  contrast: number;   // -60 to 60
  saturation: number; // -80 to 80
  warmth: number;     // -50 to 50
  sharpness: number;  // 0 to 100 (Ketajaman Tepi)
  grayscale: boolean;
  sepia: boolean;
  // Fitur Foto Terang, Bersih & Anti-Buram (Clarity & Unblur)
  clarity: number;     // 0 to 100 (Kejernihan & Definisi Mikro)
  cleanBright: number; // 0 to 100 (Pencerah Bersih Alami / Shadow Lifting)
  dehaze: number;      // 0 to 100 (Peredam Kabur / Lensa Bening)
}

export interface CropState {
  x: number; // normalized 0 to 1 or pixel relative to image
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  zoom: number;     // 1 = 100%
  flipH: boolean;
  flipV: boolean;
}

export interface BackgroundSettings {
  mode: 'original' | 'color';
  color: string; // e.g. '#D80000' (Merah), '#0055D4' (Biru), '#FFFFFF' (Putih)
  tolerance?: number;
}

export interface BorderSettings {
  enabled: boolean;
  widthMm: number; // e.g. 2mm, 3mm, 5mm border
  color: string;
}

export type PaperSize = 'a4' | 'f4' | 'letter' | '4r';

export interface PaperPreset {
  id: PaperSize;
  name: string;
  widthMm: number;
  heightMm: number;
}

export type PrintLayoutMode = 'repeat' | 'package_formal' | 'custom_mix';

export interface PrintSheetConfig {
  paper: PaperSize;
  layoutMode: PrintLayoutMode;
  repeatCount: number;
  showCutMarks: boolean;
  spacingMm: number;
  orientation: 'portrait' | 'landscape';
}

export interface ExportSettings {
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  dpi: number; // default 300
  quality: number; // 0.1 to 1.0
  maxFileSizeKb?: number; // optional target compression e.g. 200 KB for CPNS
}
