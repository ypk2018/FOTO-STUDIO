import React, { useRef, useEffect, useState } from 'react';
import { 
  ExportSettings, 
  PhotoSizePreset, 
  BorderSettings, 
  Adjustments, 
  CropState,
  PaperSize,
  PrintSheetConfig,
  PaperPreset
} from '../types';
import { 
  createCroppedPhotoCanvas, 
  generatePrintSheetCanvas, 
  exportCanvasToBlob, 
  formatBytes 
} from '../utils/canvasUtils';
import { 
  generatePrintSheetPdf, 
  generateSinglePhotoPdf 
} from '../utils/pdfUtils';
import { 
  PAPER_PRESETS, 
  PHOTO_SIZE_PRESETS, 
  mmToPixels 
} from '../constants/photoSizes';
import { 
  X, 
  Download, 
  Check, 
  Image as ImageIcon, 
  FileText, 
  Printer, 
  Scissors, 
  Layers, 
  Sparkles,
  FileCheck,
  ChevronRight,
  HardDrive
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: HTMLImageElement | null;
  preset: PhotoSizePreset;
  crop: CropState;
  adjustments: Adjustments;
  border: BorderSettings;
  backgroundColor?: string;
}

type ExportTarget = 'sheet' | 'single';
type ExportDocFormat = 'pdf' | 'png' | 'jpeg' | 'webp';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  image,
  preset,
  crop,
  adjustments,
  border,
  backgroundColor,
}) => {
  // Mode selection: Print Sheet vs Single Photo
  const [exportTarget, setExportTarget] = useState<ExportTarget>('sheet');

  // Format selection for Print Sheet
  const [sheetDocFormat, setSheetDocFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');

  // Print sheet configuration inside ExportModal
  const [sheetConfig, setSheetConfig] = useState<PrintSheetConfig>({
    paper: 'a4',
    layoutMode: preset.category === 'pas_foto' ? 'package_formal' : 'repeat',
    repeatCount: preset.category === 'pas_foto' ? 8 : 4,
    showCutMarks: true,
    spacingMm: 4,
    orientation: 'portrait',
  });

  // Single photo export settings
  const [singleSettings, setSingleSettings] = useState<ExportSettings>({
    format: 'image/jpeg',
    dpi: 300,
    quality: 0.92,
    maxFileSizeKb: undefined,
  });
  const [singleFormatChoice, setSingleFormatChoice] = useState<'jpeg' | 'png' | 'webp' | 'pdf'>('jpeg');

  // Preview & Processing state
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [sheetCanvasCache, setSheetCanvasCache] = useState<HTMLCanvasElement | null>(null);
  const [singleCanvasCache, setSingleCanvasCache] = useState<HTMLCanvasElement | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedPdfBytes, setGeneratedPdfBytes] = useState<number | null>(null);

  const selectedPaper: PaperPreset = 
    PAPER_PRESETS.find((p) => p.id === sheetConfig.paper) || PAPER_PRESETS[0];

  // 1. Generate Cropped Photo Canvas and Print Sheet Canvas
  useEffect(() => {
    if (!isOpen || !image) return;

    let isMounted = true;
    setIsProcessing(true);

    const generate = async () => {
      try {
        // Create 300 DPI single cropped canvas with clean bright & unblur enhancements
        const singleCanvas = createCroppedPhotoCanvas(
          image,
          preset,
          crop,
          adjustments,
          border,
          300,
          backgroundColor
        );

        if (!isMounted) return;
        setSingleCanvasCache(singleCanvas);

        if (exportTarget === 'sheet') {
          // Generate 300 DPI print sheet canvas
          const sheetCanvas = generatePrintSheetCanvas(
            singleCanvas,
            preset,
            sheetConfig,
            PHOTO_SIZE_PRESETS,
            undefined,
            300
          );

          if (!isMounted) return;
          setSheetCanvasCache(sheetCanvas);

          if (sheetDocFormat === 'pdf') {
            // Pre-calculate PDF preview data
            const pdfResult = generatePrintSheetPdf(
              sheetCanvas,
              selectedPaper,
              sheetConfig.orientation
            );
            if (isMounted) {
              setPreviewBlob(pdfResult.blob);
              setGeneratedPdfBytes(pdfResult.sizeBytes);
              // Use sheet canvas as visible image preview
              const previewImgUrl = sheetCanvas.toDataURL('image/jpeg', 0.85);
              setPreviewUrl(previewImgUrl);
              setIsProcessing(false);
            }
          } else {
            // PNG or JPEG Sheet Blob
            const formatMime = sheetDocFormat === 'png' ? 'image/png' : 'image/jpeg';
            const blob = await exportCanvasToBlob(sheetCanvas, {
              format: formatMime,
              dpi: 300,
              quality: 0.95,
            });
            if (isMounted) {
              setPreviewBlob(blob);
              setGeneratedPdfBytes(blob.size);
              const url = URL.createObjectURL(blob);
              setPreviewUrl(url);
              setIsProcessing(false);
            }
          }
        } else {
          // Single Photo Export
          if (singleFormatChoice === 'pdf') {
            const pdfResult = generateSinglePhotoPdf(singleCanvas, preset);
            if (isMounted) {
              setPreviewBlob(pdfResult.blob);
              setGeneratedPdfBytes(pdfResult.sizeBytes);
              const previewImgUrl = singleCanvas.toDataURL('image/jpeg', 0.9);
              setPreviewUrl(previewImgUrl);
              setIsProcessing(false);
            }
          } else {
            const formatMime = 
              singleFormatChoice === 'png' 
                ? 'image/png' 
                : singleFormatChoice === 'webp' 
                ? 'image/webp' 
                : 'image/jpeg';

            const blob = await exportCanvasToBlob(singleCanvas, {
              ...singleSettings,
              format: formatMime,
            });
            if (isMounted) {
              setPreviewBlob(blob);
              setGeneratedPdfBytes(blob.size);
              const url = URL.createObjectURL(blob);
              setPreviewUrl(url);
              setIsProcessing(false);
            }
          }
        }
      } catch (err) {
        console.error('Error generating export:', err);
        if (isMounted) setIsProcessing(false);
      }
    };

    generate();

    return () => {
      isMounted = false;
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [
    isOpen, 
    image, 
    preset, 
    crop, 
    adjustments, 
    border, 
    backgroundColor, 
    exportTarget, 
    sheetDocFormat, 
    sheetConfig, 
    singleSettings, 
    singleFormatChoice
  ]);

  if (!isOpen || !image) return null;

  // Handle Download Action
  const handleDownload = () => {
    if (!previewBlob) return;

    if (exportTarget === 'sheet') {
      if (sheetDocFormat === 'pdf' && sheetCanvasCache) {
        // High quality PDF document export
        const cleanPaperName = selectedPaper.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const filename = `lembar-cetak-${cleanPaperName}-${sheetConfig.layoutMode}-300dpi.pdf`;
        const pdfResult = generatePrintSheetPdf(
          sheetCanvasCache,
          selectedPaper,
          sheetConfig.orientation,
          filename
        );
        const link = document.createElement('a');
        link.download = filename;
        link.href = pdfResult.url;
        link.click();
      } else {
        // High quality PNG or JPG image
        const ext = sheetDocFormat === 'png' ? 'png' : 'jpg';
        const cleanPaperName = selectedPaper.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const filename = `lembar-cetak-${cleanPaperName}-${sheetConfig.layoutMode}-300dpi.${ext}`;
        const link = document.createElement('a');
        link.download = filename;
        link.href = previewUrl;
        link.click();
      }
    } else {
      // Single photo
      if (singleFormatChoice === 'pdf' && singleCanvasCache) {
        const cleanName = preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const filename = `dokumen-foto-${cleanName}-300dpi.pdf`;
        const pdfResult = generateSinglePhotoPdf(singleCanvasCache, preset, filename);
        const link = document.createElement('a');
        link.download = filename;
        link.href = pdfResult.url;
        link.click();
      } else {
        const ext = singleFormatChoice === 'jpeg' ? 'jpg' : singleFormatChoice;
        const cleanName = preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const filename = `foto-${cleanName}-${singleSettings.dpi}dpi.${ext}`;
        const link = document.createElement('a');
        link.download = filename;
        link.href = previewUrl;
        link.click();
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Simpan & Ekspor Cetak</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  300 DPI Studio
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Unduh lembar cetak siap cetak dalam format PDF dokumen atau file gambar foto tunggal
              </p>
            </div>
          </div>

          <button
            id="close-export-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Switcher: Lembar Cetak vs Foto Tunggal */}
        <div className="px-5 pt-4 pb-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              id="export-tab-sheet"
              type="button"
              onClick={() => setExportTarget('sheet')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                exportTarget === 'sheet'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Lembar Cetak Kertas (PDF / Gambar)</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                Rekomendasi
              </span>
            </button>

            <button
              id="export-tab-single"
              type="button"
              onClick={() => setExportTarget('single')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                exportTarget === 'single'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>Foto Tunggal ({preset.name})</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[62vh]">
          
          {/* ===================== MODE 1: LEMBAR CETAK (PRINT SHEET) ===================== */}
          {exportTarget === 'sheet' && (
            <div className="space-y-4">
              {/* Format Document Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Format Dokumen Lembar Cetak
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="sheet-format-pdf"
                    type="button"
                    onClick={() => setSheetDocFormat('pdf')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      sheetDocFormat === 'pdf'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-blue-950 font-bold mb-0.5">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span>Dokumen PDF (300 DPI)</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Skala 1:1 fisik presisi milimeter, siap cetak printer
                    </div>
                  </button>

                  <button
                    id="sheet-format-png"
                    type="button"
                    onClick={() => setSheetDocFormat('png')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      sheetDocFormat === 'png'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-blue-950 font-bold mb-0.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Gambar PNG (Lossless)</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Kualitas gambar tanpa kompresi pixel tajam
                    </div>
                  </button>

                  <button
                    id="sheet-format-jpeg"
                    type="button"
                    onClick={() => setSheetDocFormat('jpeg')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      sheetDocFormat === 'jpeg'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-blue-950 font-bold mb-0.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>Gambar JPG / JPEG</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Ukuran file lebih hemat, kompatibel di semua HP
                    </div>
                  </button>
                </div>
              </div>

              {/* Paper Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilihan Kertas Cetak
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAPER_PRESETS.map((paper) => {
                    const isSelected = sheetConfig.paper === paper.id;
                    return (
                      <button
                        key={paper.id}
                        type="button"
                        onClick={() => setSheetConfig({ ...sheetConfig, paper: paper.id })}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-950 font-semibold ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="text-xs">{paper.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {paper.widthMm} × {paper.heightMm} mm
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layout Mode & Repetitions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mode Tata Letak Foto
                  </label>
                  <div className="space-y-1.5">
                    {preset.category === 'pas_foto' && (
                      <button
                        type="button"
                        onClick={() => setSheetConfig({ ...sheetConfig, layoutMode: 'package_formal' })}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                          sheetConfig.layoutMode === 'package_formal'
                            ? 'border-blue-600 bg-blue-50 text-blue-950 font-semibold ring-2 ring-blue-500/20'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>Paket Pas Foto Komplit</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          4x (4x6 cm) + 4x (3x4 cm) + 6x (2x3 cm)
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSheetConfig({ ...sheetConfig, layoutMode: 'repeat' })}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                        sheetConfig.layoutMode === 'repeat'
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-semibold ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Duplikat Foto ({preset.name})</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Mengisi kertas dengan ukuran foto yang sedang aktif
                      </div>
                    </button>
                  </div>
                </div>

                {/* Additional Settings (Cut Marks, Spacing, Orientation) */}
                <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-slate-500" />
                      Garis Bantu Potong (Crop Marks)
                    </span>
                    <input
                      type="checkbox"
                      checked={sheetConfig.showCutMarks}
                      onChange={(e) => setSheetConfig({ ...sheetConfig, showCutMarks: e.target.checked })}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {sheetConfig.layoutMode === 'repeat' && (
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Jumlah Foto Dicetak:</span>
                        <span className="font-bold text-blue-700">{sheetConfig.repeatCount} Lembar</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={sheetConfig.repeatCount}
                        onChange={(e) => setSheetConfig({ ...sheetConfig, repeatCount: parseInt(e.target.value) })}
                        className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                    <span className="text-slate-600">Orientasi Kertas:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setSheetConfig({ ...sheetConfig, orientation: 'portrait' })}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          sheetConfig.orientation === 'portrait' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700'
                        }`}
                      >
                        Tegak (Portrait)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSheetConfig({ ...sheetConfig, orientation: 'landscape' })}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          sheetConfig.orientation === 'landscape' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700'
                        }`}
                      >
                        Mendatar (Landscape)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="w-24 h-32 bg-white rounded-lg shadow-sm overflow-hidden border border-slate-300 shrink-0 flex items-center justify-center p-1">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Sheet Preview" className="max-w-full max-h-full object-contain shadow-xs" />
                  ) : (
                    <span className="text-xs text-slate-400">Loading...</span>
                  )}
                </div>

                <div className="flex-1 text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Lembar Cetak {selectedPaper.name}</span>
                    {sheetDocFormat === 'pdf' ? (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        PDF High-Res
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {sheetDocFormat.toUpperCase()} 300 DPI
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600">
                    Dimensi Kertas Fisik: <strong>{selectedPaper.widthMm} × {selectedPaper.heightMm} mm</strong>
                  </div>
                  <div className="text-slate-600">
                    Tata Letak: <strong>{sheetConfig.layoutMode === 'package_formal' ? 'Paket Komplit (14 Pas Foto)' : `${sheetConfig.repeatCount} lembar ${preset.name}`}</strong>
                  </div>
                  <div className="text-slate-600">
                    Standar Cetak: <strong className="text-blue-700 font-mono">300 DPI Presisi 1:1</strong>
                  </div>
                  <div className="text-slate-600">
                    Perkiraan Ukuran Berkas: <strong className="text-emerald-700 font-bold">{generatedPdfBytes ? formatBytes(generatedPdfBytes) : 'Menghitung...'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== MODE 2: FOTO TUNGGAL (SINGLE PHOTO) ===================== */}
          {exportTarget === 'single' && (
            <div className="space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Format Foto Tunggal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSingleFormatChoice('jpeg')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      singleFormatChoice === 'jpeg'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>JPEG / JPG</span>
                    <span className="text-[10px] font-normal text-slate-500">Standar Berkas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleFormatChoice('png')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      singleFormatChoice === 'png'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>PNG HD</span>
                    <span className="text-[10px] font-normal text-slate-500">Lossless Jernih</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleFormatChoice('webp')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      singleFormatChoice === 'webp'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>WebP</span>
                    <span className="text-[10px] font-normal text-slate-500">Paling Ringan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleFormatChoice('pdf')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                      singleFormatChoice === 'pdf'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>Dokumen PDF</span>
                    <span className="text-[10px] font-normal text-slate-500">PDF Skala Asli</span>
                  </button>
                </div>
              </div>

              {/* DPI Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resolusi Cetak (DPI)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSingleSettings({ ...singleSettings, dpi: 300 })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      singleSettings.dpi === 300
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>300 DPI (Sangat Tajam)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Standar Cetak Studio Foto</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleSettings({ ...singleSettings, dpi: 150 })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      singleSettings.dpi === 150
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>150 DPI (Sedang)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Berkas Lamaran / Email</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSingleSettings({ ...singleSettings, dpi: 72 })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      singleSettings.dpi === 72
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-semibold'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>72 DPI (Web / Profil)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Avatar Sosmed / Web</div>
                  </button>
                </div>
              </div>

              {/* Target File Size (CPNS / BKN Compression) */}
              {singleFormatChoice !== 'png' && singleFormatChoice !== 'pdf' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Batasan Ukuran Berkas (Kompresi Target KB)
                    </label>
                    <span className="text-[10px] text-slate-500">Khusus Portal CPNS / BKN</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSingleSettings({ ...singleSettings, maxFileSizeKb: undefined, quality: 0.92 })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        singleSettings.maxFileSizeKb === undefined
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      Asli (100%)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleSettings({ ...singleSettings, maxFileSizeKb: 200, quality: 0.85 })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        singleSettings.maxFileSizeKb === 200
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      &lt; 200 KB (CPNS)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleSettings({ ...singleSettings, maxFileSizeKb: 300, quality: 0.85 })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        singleSettings.maxFileSizeKb === 300
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      &lt; 300 KB (UTBK)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleSettings({ ...singleSettings, maxFileSizeKb: 500, quality: 0.9 })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        singleSettings.maxFileSizeKb === 500
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      &lt; 500 KB (Visa)
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="w-20 h-24 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 shrink-0 flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">Loading...</span>
                  )}
                </div>

                <div className="flex-1 text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{preset.name}</div>
                  <div className="text-slate-600">
                    Dimensi Fisik: <strong>{preset.widthMm} × {preset.heightMm} mm</strong> ({(preset.widthMm / 10).toFixed(1)} × {(preset.heightMm / 10).toFixed(1)} cm)
                  </div>
                  <div className="text-slate-600">
                    Resolusi Pixel: <strong className="font-mono text-blue-700">{mmToPixels(preset.widthMm, singleSettings.dpi)} × {mmToPixels(preset.heightMm, singleSettings.dpi)} px</strong> ({singleSettings.dpi} DPI)
                  </div>
                  <div className="text-slate-600">
                    Perkiraan Ukuran File: <strong className="text-emerald-700 font-bold">{previewBlob ? formatBytes(previewBlob.size) : 'Menghitung...'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-2.5 bg-slate-50">
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Hasil foto sudah diproses dengan optimasi kejernihan & ketajaman HD.</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>

            <button
              id="download-final-btn"
              type="button"
              onClick={handleDownload}
              disabled={isProcessing || !previewBlob}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isProcessing 
                  ? 'Menyiapkan Berkas...' 
                  : exportTarget === 'sheet' && sheetDocFormat === 'pdf'
                  ? 'Unduh Dokumen PDF (300 DPI)'
                  : exportTarget === 'sheet'
                  ? `Unduh Lembar Cetak (${sheetDocFormat.toUpperCase()})`
                  : singleFormatChoice === 'pdf'
                  ? 'Unduh PDF Foto Dokumen'
                  : 'Unduh Foto Sekarang'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
