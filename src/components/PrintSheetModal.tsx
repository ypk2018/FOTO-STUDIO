import React, { useRef, useEffect, useState } from 'react';
import { 
  PaperSize, 
  PrintLayoutMode, 
  PrintSheetConfig, 
  PhotoSizePreset, 
  BorderSettings, 
  Adjustments, 
  CropState 
} from '../types';
import { PAPER_PRESETS, PHOTO_SIZE_PRESETS } from '../constants/photoSizes';
import { 
  createCroppedPhotoCanvas, 
  generatePrintSheetCanvas 
} from '../utils/canvasUtils';
import { generatePrintSheetPdf } from '../utils/pdfUtils';
import { 
  X, 
  Printer, 
  Download, 
  Scissors, 
  FileText, 
  Check, 
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: HTMLImageElement | null;
  preset: PhotoSizePreset;
  crop: CropState;
  adjustments: Adjustments;
  border: BorderSettings;
  backgroundColor?: string;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  image,
  preset,
  crop,
  adjustments,
  border,
  backgroundColor,
}) => {
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const [sheetConfig, setSheetConfig] = useState<PrintSheetConfig>({
    paper: 'a4',
    layoutMode: preset.category === 'pas_foto' ? 'package_formal' : 'repeat',
    repeatCount: 8,
    showCutMarks: true,
    spacingMm: 4,
    orientation: 'portrait',
  });

  const [previewScale, setPreviewScale] = useState<number>(0.35);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Render sheet whenever settings change
  useEffect(() => {
    if (!isOpen || !image) return;

    // 1. Create single cropped photo canvas
    const singleCanvas = createCroppedPhotoCanvas(
      image,
      preset,
      crop,
      adjustments,
      border,
      300,
      backgroundColor
    );

    // 2. Generate preview sheet (use 150 DPI for snappy UI preview, 300 DPI for export)
    const previewSheet = generatePrintSheetCanvas(
      singleCanvas,
      preset,
      sheetConfig,
      PHOTO_SIZE_PRESETS,
      undefined,
      150
    );

    const canvas = canvasPreviewRef.current;
    if (!canvas) return;

    canvas.width = previewSheet.width;
    canvas.height = previewSheet.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(previewSheet, 0, 0);
    }
  }, [isOpen, image, preset, crop, adjustments, border, backgroundColor, sheetConfig]);

  if (!isOpen || !image) return null;

  // Handle Download High-Res 300 DPI Sheet
  const handleDownloadSheet = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const singleCanvas = createCroppedPhotoCanvas(
          image,
          preset,
          crop,
          adjustments,
          border,
          300,
          backgroundColor
        );

        const highResSheet = generatePrintSheetCanvas(
          singleCanvas,
          preset,
          sheetConfig,
          PHOTO_SIZE_PRESETS,
          undefined,
          300
        );

        const link = document.createElement('a');
        link.download = `lembar-cetak-${sheetConfig.paper}-${sheetConfig.layoutMode}-300dpi.png`;
        link.href = highResSheet.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  // Handle Download High-Res 300 DPI PDF Document
  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const singleCanvas = createCroppedPhotoCanvas(
          image,
          preset,
          crop,
          adjustments,
          border,
          300,
          backgroundColor
        );

        const highResSheet = generatePrintSheetCanvas(
          singleCanvas,
          preset,
          sheetConfig,
          PHOTO_SIZE_PRESETS,
          undefined,
          300
        );

        const selectedPaper = PAPER_PRESETS.find((p) => p.id === sheetConfig.paper) || PAPER_PRESETS[0];
        const filename = `lembar-cetak-${sheetConfig.paper}-${sheetConfig.layoutMode}-300dpi.pdf`;
        const pdfResult = generatePrintSheetPdf(
          highResSheet,
          selectedPaper,
          sheetConfig.orientation,
          filename
        );

        const link = document.createElement('a');
        link.download = filename;
        link.href = pdfResult.url;
        link.click();
      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  // Handle Direct Print
  const handlePrintSheet = () => {
    const singleCanvas = createCroppedPhotoCanvas(
      image,
      preset,
      crop,
      adjustments,
      border,
      300,
      backgroundColor
    );

    const highResSheet = generatePrintSheetCanvas(
      singleCanvas,
      preset,
      sheetConfig,
      PHOTO_SIZE_PRESETS,
      undefined,
      300
    );

    const dataUrl = highResSheet.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Lembar Foto - ${preset.name}</title>
          <style>
            @page {
              size: ${sheetConfig.paper === 'a4' ? 'A4' : sheetConfig.paper === 'f4' ? '215mm 330mm' : 'auto'};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
            }
            img {
              max-width: 100vw;
              max-height: 100vh;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Tata Letak Lembar Cetak Foto (Print Sheet)
              </h2>
              <p className="text-xs text-slate-500">
                Atur pengulangan foto atau paket pas foto komplit pada satu lembar kertas (300 DPI)
              </p>
            </div>
          </div>

          <button
            id="close-print-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls Sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-4 overflow-y-auto bg-slate-50/40">
            {/* Paper Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Ukuran Kertas Cetak
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAPER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSheetConfig({ ...sheetConfig, paper: p.id })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      sheetConfig.paper === p.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-semibold'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div>{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {p.widthMm} × {p.heightMm} mm
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Mode Penataan Foto
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSheetConfig({ ...sheetConfig, layoutMode: 'package_formal' })}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                    sheetConfig.layoutMode === 'package_formal'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">Paket Pas Foto Komplit</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Kombinasi 4x (4x6 cm) + 4x (3x4 cm) + 6x (2x3 cm)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSheetConfig({ ...sheetConfig, layoutMode: 'repeat' })}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                    sheetConfig.layoutMode === 'repeat'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">Duplikat Ukuran Aktif ({preset.name})</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ulangi foto {preset.name} hingga jumlah yang ditentukan
                  </div>
                </button>
              </div>
            </div>

            {/* Repeat count if in repeat mode */}
            {sheetConfig.layoutMode === 'repeat' && (
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold">Jumlah Foto:</span>
                  <span className="font-bold text-blue-600">{sheetConfig.repeatCount} Lembar</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={sheetConfig.repeatCount}
                  onChange={(e) => setSheetConfig({ ...sheetConfig, repeatCount: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Spacing & Cutting Marks */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-slate-500" /> Garis Potong (Crop Marks)
                </span>
                <input
                  type="checkbox"
                  checked={sheetConfig.showCutMarks}
                  onChange={(e) => setSheetConfig({ ...sheetConfig, showCutMarks: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Jarak Antar Foto:</span>
                  <span className="font-mono">{sheetConfig.spacingMm} mm</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={sheetConfig.spacingMm}
                  onChange={(e) => setSheetConfig({ ...sheetConfig, spacingMm: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Canvas Sheet Preview Area */}
          <div className="flex-1 bg-slate-900 p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-auto">
            {/* Sheet Preview */}
            <div className="shadow-2xl border border-slate-700 bg-white max-h-full max-w-full overflow-hidden rounded">
              <canvas
                ref={canvasPreviewRef}
                style={{
                  maxHeight: '62vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
              Pratinjau Kertas {sheetConfig.paper.toUpperCase()} • 300 DPI Siap Dicetak
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-500 hidden sm:block">
            Tips: Pastikan pengaturan printer diatur ke ukuran kertas asli (100% Scale / Actual Size).
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>

            <button
              id="download-sheet-pdf-btn"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>{isGenerating ? 'Menyiapkan PDF...' : 'Unduh PDF (300 DPI)'}</span>
            </button>

            <button
              id="download-sheet-btn"
              type="button"
              onClick={handleDownloadSheet}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Memproses...' : 'Unduh Gambar (PNG)'}</span>
            </button>

            <button
              id="print-sheet-btn"
              type="button"
              onClick={handlePrintSheet}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
