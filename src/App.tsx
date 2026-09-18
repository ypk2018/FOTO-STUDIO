/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Adjustments, 
  BackgroundSettings, 
  BorderSettings, 
  CropState, 
  PhotoSizePreset 
} from './types';
import { PHOTO_SIZE_PRESETS } from './constants/photoSizes';
import { SAMPLE_IMAGES, SampleImage } from './data/sampleImages';
import { loadImage } from './utils/canvasUtils';
import { Header } from './components/Header';
import { SizeSelector } from './components/SizeSelector';
import { PhotoCanvas } from './components/PhotoCanvas';
import { AdjustmentPanel } from './components/AdjustmentPanel';
import { PrintSheetModal } from './components/PrintSheetModal';
import { ExportModal } from './components/ExportModal';
import { PhotoUploader } from './components/PhotoUploader';
import { 
  Scissors, 
  Sparkles, 
  Printer, 
  Download, 
  Upload, 
  Check, 
  Info,
  Maximize2
} from 'lucide-react';

export default function App() {
  // Current loaded image
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSource, setImageSource] = useState<string>('');
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(true);

  // Selected preset: default to 3x4 cm (most used in Indonesia)
  const [selectedPreset, setSelectedPreset] = useState<PhotoSizePreset>(
    PHOTO_SIZE_PRESETS.find((p) => p.id === 'pas-3x4') || PHOTO_SIZE_PRESETS[0]
  );

  // Custom size state
  const [customWidthMm, setCustomWidthMm] = useState<number>(30);
  const [customHeightMm, setCustomHeightMm] = useState<number>(40);

  // Crop box state (in image pixel coordinates)
  const [crop, setCrop] = useState<CropState>({
    x: 0,
    y: 0,
    width: 300,
    height: 400,
    rotation: 0,
    zoom: 1,
    flipH: false,
    flipV: false,
  });

  // Adjustments (Filters, Lighting, Unblur & Clarity)
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    sharpness: 0,
    grayscale: false,
    sepia: false,
    clarity: 0,
    cleanBright: 0,
    dehaze: 0,
  });

  // Border (White border framing)
  const [border, setBorder] = useState<BorderSettings>({
    enabled: false,
    widthMm: 2,
    color: '#FFFFFF',
  });

  // Background
  const [background, setBackground] = useState<BackgroundSettings>({
    mode: 'original',
    color: '#D80000', // Default Merah
  });

  // Modals
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize crop box to fit image with target aspect ratio
  const calculateInitialCrop = useCallback((img: HTMLImageElement, preset: PhotoSizePreset): CropState => {
    const targetRatio = preset.aspectRatio;
    let w = img.width * 0.85;
    let h = w / targetRatio;

    if (h > img.height * 0.85) {
      h = img.height * 0.85;
      w = h * targetRatio;
    }

    return {
      x: Math.round((img.width - w) / 2),
      y: Math.round((img.height - h) / 2),
      width: Math.round(w),
      height: Math.round(h),
      rotation: 0,
      zoom: 1,
      flipH: false,
      flipV: false,
    };
  }, []);

  // Set loaded image
  const handleImageLoaded = (img: HTMLImageElement, sourceName: string) => {
    setImage(img);
    setImageSource(sourceName);
    setIsLoadingImage(false);
    const newCrop = calculateInitialCrop(img, selectedPreset);
    setCrop(newCrop);
  };

  // Load sample image by default on first load
  useEffect(() => {
    const defaultSample = SAMPLE_IMAGES[0];
    loadImage(defaultSample.url)
      .then((img) => {
        handleImageLoaded(img, defaultSample.name);
      })
      .catch(() => {
        setIsLoadingImage(false);
      });
  }, []);

  // Handle Preset change
  const handleSelectPreset = (preset: PhotoSizePreset) => {
    setSelectedPreset(preset);
    if (!image) return;

    // Recalculate crop maintaining current center
    const targetRatio = preset.aspectRatio;
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;

    let newWidth = crop.width;
    let newHeight = newWidth / targetRatio;

    if (newHeight > image.height) {
      newHeight = image.height * 0.9;
      newWidth = newHeight * targetRatio;
    }
    if (newWidth > image.width) {
      newWidth = image.width * 0.9;
      newHeight = newWidth / targetRatio;
    }

    let newX = centerX - newWidth / 2;
    let newY = centerY - newHeight / 2;

    // Clamp boundaries
    newX = Math.max(0, Math.min(image.width - newWidth, newX));
    newY = Math.max(0, Math.min(image.height - newHeight, newY));

    setCrop({
      ...crop,
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    });
  };

  // Handle Sample selection
  const handleSelectSample = (sample: SampleImage) => {
    setIsLoadingImage(true);
    loadImage(sample.url)
      .then((img) => {
        handleImageLoaded(img, sample.name);
      })
      .catch((err) => {
        console.error(err);
        setIsLoadingImage(false);
      });
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      loadImage(src).then((img) => {
        handleImageLoaded(img, file.name);
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // Background image loader
  useEffect(() => {
    if (background.mode === 'image' && background.imageUrl) {
      if (!background.imageElement || background.imageElement.src !== background.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setBackground((prev) => ({
            ...prev,
            imageElement: img,
          }));
        };
        img.src = background.imageUrl;
      }
    }
  }, [background.mode, background.imageUrl]);

  // Clipboard paste listener (Ctrl+V anywhere to paste photo)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const src = event.target?.result as string;
              loadImage(src).then((img) => {
                handleImageLoaded(img, 'Gambar dari Clipboard');
              });
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedPreset]);

  // Reset all adjustments and crop
  const handleResetAll = () => {
    if (!image) return;
    setCrop(calculateInitialCrop(image, selectedPreset));
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      sharpness: 0,
      grayscale: false,
      sepia: false,
      clarity: 0,
      cleanBright: 0,
      dehaze: 0,
    });
    setBorder({
      enabled: false,
      widthMm: 2,
      color: '#FFFFFF',
    });
    setBackground({
      mode: 'original',
      color: '#D80000',
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Navigation Bar */}
      <Header
        onUploadClick={() => fileInputRef.current?.click()}
        onSelectSample={handleSelectSample}
        onOpenPrintSheet={() => setIsPrintSheetOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onResetAll={handleResetAll}
        hasImage={!!image}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {isLoadingImage && !image ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-slate-600">Memuat Studio Foto...</span>
            </div>
          </div>
        ) : !image ? (
          <PhotoUploader
            onImageLoaded={handleImageLoaded}
            onSelectSample={handleSelectSample}
          />
        ) : (
          <div className="space-y-5">
            {/* Top: Size Selection Section */}
            <section aria-label="Pilihan Ukuran Foto">
              <SizeSelector
                selectedPreset={selectedPreset}
                onSelectPreset={handleSelectPreset}
                customWidthMm={customWidthMm}
                customHeightMm={customHeightMm}
                onCustomSizeChange={(w, h) => {
                  setCustomWidthMm(w);
                  setCustomHeightMm(h);
                }}
              />
            </section>

            {/* Bottom: 2-Column Studio (Canvas + Adjustments) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left/Main Column: Canvas Editor (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col">
                <PhotoCanvas
                  image={image}
                  preset={selectedPreset}
                  crop={crop}
                  onCropChange={setCrop}
                  adjustments={adjustments}
                  border={border}
                  background={background}
                />
              </div>

              {/* Right Column: Adjustment & Filter Panel (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <AdjustmentPanel
                  adjustments={adjustments}
                  onAdjustmentsChange={setAdjustments}
                  border={border}
                  onBorderChange={setBorder}
                  background={background}
                  onBackgroundChange={setBackground}
                  preset={selectedPreset}
                />

                {/* Quick Action Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-md border border-slate-700/60">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Cetak Massal
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Buat Lembar Cetak Kertas Foto
                  </h3>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Gabungkan pas foto paket komplit (4x6, 3x4, 2x3) atau duplikasi foto pada kertas A4 / F4 lengkap dengan garis potong.
                  </p>
                  <button
                    id="quick-open-print-btn"
                    type="button"
                    onClick={() => setIsPrintSheetOpen(true)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Buka Tata Letak Cetak</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Print Sheet Modal */}
      {isPrintSheetOpen && (
        <PrintSheetModal
          isOpen={isPrintSheetOpen}
          onClose={() => setIsPrintSheetOpen(false)}
          image={image}
          preset={selectedPreset}
          crop={crop}
          adjustments={adjustments}
          border={border}
          background={background}
        />
      )}

      {/* Export Modal */}
      {isExportOpen && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          image={image}
          preset={selectedPreset}
          crop={crop}
          adjustments={adjustments}
          border={border}
          background={background}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>FotoStudio 2x2 — 10R</strong> • Mendukung Pas Foto (2x2, 2x3, 3x4, 4x6) hingga Cetak Seri R (2R, 3R, 4R, 5R, 6R, 8R, 10R)
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Resolusi 300 DPI Standar Studio</span>
            <span>•</span>
            <span>Kompresi Berkas CPNS/BKN</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
