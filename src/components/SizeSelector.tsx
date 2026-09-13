import React from 'react';
import { PhotoSizePreset, SizeCategory } from '../types';
import { PHOTO_SIZE_PRESETS, mmToPixels } from '../constants/photoSizes';
import { SlidersHorizontal, Check, Info } from 'lucide-react';

interface SizeSelectorProps {
  selectedPreset: PhotoSizePreset;
  onSelectPreset: (preset: PhotoSizePreset) => void;
  customWidthMm: number;
  customHeightMm: number;
  onCustomSizeChange: (w: number, h: number) => void;
  dpi?: number;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  selectedPreset,
  onSelectPreset,
  customWidthMm,
  customHeightMm,
  onCustomSizeChange,
  dpi = 300,
}) => {
  const [activeTab, setActiveTab] = React.useState<SizeCategory | 'all'>('all');

  const filteredPresets = React.useMemo(() => {
    if (activeTab === 'all') return PHOTO_SIZE_PRESETS;
    return PHOTO_SIZE_PRESETS.filter((p) => p.category === activeTab);
  }, [activeTab]);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
      {/* Category Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          <button
            id="tab-all"
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Ukuran
          </button>
          <button
            id="tab-pas-foto"
            type="button"
            onClick={() => setActiveTab('pas_foto')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'pas_foto'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pas Foto & Dokumen
          </button>
          <button
            id="tab-seri-r"
            type="button"
            onClick={() => setActiveTab('seri_r')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'seri_r'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Seri Cetak (2R - 10R)
          </button>
          <button
            id="tab-kustom"
            type="button"
            onClick={() => setActiveTab('kustom')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'kustom'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ukuran Kustom
          </button>
        </div>
      </div>

      {/* If Custom tab is selected */}
      {activeTab === 'kustom' ? (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Tentukan Ukuran Bebas</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-width" className="block text-xs font-medium text-slate-600 mb-1">
                Lebar (cm)
              </label>
              <input
                id="custom-width"
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={(customWidthMm / 10).toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1;
                  onCustomSizeChange(val * 10, customHeightMm);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {customWidthMm.toFixed(0)} mm • {mmToPixels(customWidthMm, dpi)} px
              </span>
            </div>

            <div>
              <label htmlFor="custom-height" className="block text-xs font-medium text-slate-600 mb-1">
                Tinggi (cm)
              </label>
              <input
                id="custom-height"
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={(customHeightMm / 10).toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1;
                  onCustomSizeChange(customWidthMm, val * 10);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {customHeightMm.toFixed(0)} mm • {mmToPixels(customHeightMm, dpi)} px
              </span>
            </div>
          </div>

          <button
            id="apply-custom-btn"
            type="button"
            onClick={() => {
              onSelectPreset({
                id: 'custom-preset',
                name: `Kustom ${(customWidthMm / 10).toFixed(1)} x ${(customHeightMm / 10).toFixed(1)} cm`,
                category: 'kustom',
                widthMm: customWidthMm,
                heightMm: customHeightMm,
                description: `${customWidthMm} x ${customHeightMm} mm`,
                aspectRatio: customWidthMm / customHeightMm,
              });
            }}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Terapkan Ukuran Kustom
          </button>
        </div>
      ) : (
        /* Presets Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          {filteredPresets.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            const pxW = mmToPixels(preset.widthMm, dpi);
            const pxH = mmToPixels(preset.heightMm, dpi);

            return (
              <button
                key={preset.id}
                id={`preset-btn-${preset.id}`}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`text-left p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-blue-700 mt-0.5">
                    {preset.description}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="text-[10px] text-slate-500 font-mono">
                    {pxW} × {pxH} px (300 DPI)
                  </div>
                  {preset.recommendedFor && (
                    <div className="text-[10px] text-slate-500 truncate mt-0.5" title={preset.recommendedFor}>
                      {preset.recommendedFor}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Quick Summary of Active Size */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5 min-w-0">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">
            Aktif: <strong className="text-slate-900">{selectedPreset.name}</strong> ({selectedPreset.widthMm} × {selectedPreset.heightMm} mm)
          </span>
        </div>
        <span className="font-mono text-slate-500 shrink-0 font-medium ml-2">
          Rasio {(selectedPreset.widthMm / selectedPreset.heightMm).toFixed(2)} : 1
        </span>
      </div>
    </div>
  );
};
