import React from 'react';
import { 
  Scissors, 
  Upload, 
  Printer, 
  Download, 
  Image as ImageIcon,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../data/sampleImages';

interface HeaderProps {
  onUploadClick: () => void;
  onSelectSample: (sample: SampleImage) => void;
  onOpenPrintSheet: () => void;
  onOpenExport: () => void;
  onResetAll: () => void;
  hasImage: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onUploadClick,
  onSelectSample,
  onOpenPrintSheet,
  onOpenExport,
  onResetAll,
  hasImage,
}) => {
  const [showSampleMenu, setShowSampleMenu] = React.useState(false);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                FotoStudio 2x2 — 10R
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                300 DPI Siap Cetak
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate hidden md:block">
              Editor Pas Foto & Ukuran Seri Cetak Standar Indonesia
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sample photos dropdown */}
          <div className="relative">
            <button
              id="sample-photo-btn"
              type="button"
              onClick={() => setShowSampleMenu(!showSampleMenu)}
              className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Foto Contoh</span>
            </button>

            {showSampleMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-1.5 space-y-1"
                onMouseLeave={() => setShowSampleMenu(false)}
              >
                <div className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pilih Foto Demo
                </div>
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      onSelectSample(sample);
                      setShowSampleMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs sm:text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <img 
                      src={sample.url} 
                      alt={sample.name} 
                      className="w-6 h-6 rounded object-cover" 
                    />
                    <div className="truncate">
                      <div className="font-medium truncate">{sample.name}</div>
                      <div className="text-[10px] text-slate-400">{sample.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            id="upload-photo-btn"
            type="button"
            onClick={onUploadClick}
            className="px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Unggah Foto</span>
          </button>

          {/* Reset */}
          {hasImage && (
            <button
              id="reset-crop-btn"
              type="button"
              onClick={onResetAll}
              title="Reset Pengaturan"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Print Sheet Modal Button */}
          <button
            id="open-print-sheet-btn"
            type="button"
            onClick={onOpenPrintSheet}
            disabled={!hasImage}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center gap-1.5 transition-all ${
              hasImage
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Lembar Cetak</span>
          </button>

          {/* Export / Download */}
          <button
            id="open-export-btn"
            type="button"
            onClick={onOpenExport}
            disabled={!hasImage}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              hasImage
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Simpan Foto</span>
          </button>
        </div>
      </div>
    </header>
  );
};
