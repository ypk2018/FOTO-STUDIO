import React, { useState } from 'react';
import { 
  Adjustments, 
  BackgroundSettings, 
  BorderSettings, 
  PhotoSizePreset 
} from '../types';
import { PAS_FOTO_BG_COLORS, mmToPixels } from '../constants/photoSizes';
import { 
  Palette, 
  Sliders, 
  Sun, 
  Contrast, 
  Droplet, 
  Thermometer, 
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  Eye,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Wind,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface AdjustmentPanelProps {
  adjustments: Adjustments;
  onAdjustmentsChange: (adj: Adjustments) => void;
  border: BorderSettings;
  onBorderChange: (border: BorderSettings) => void;
  background: BackgroundSettings;
  onBackgroundChange: (bg: BackgroundSettings) => void;
  preset: PhotoSizePreset;
}

const PRESET_IMAGE_BGS = [
  { id: 'nature', label: 'Alam', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800&auto=format&fit=crop' },
  { id: 'city', label: 'Bangunan', url: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop' },
  { id: 'abstract', label: 'Abstrak', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop' },
  { id: 'studio', label: 'Studio', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop' }
];

export const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  adjustments,
  onAdjustmentsChange,
  border,
  onBorderChange,
  background,
  onBackgroundChange,
  preset,
}) => {
  const [activeTab, setActiveTab] = useState<'clean_sharp' | 'adjust' | 'border_bg' | 'info'>('clean_sharp');
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [tempAdjustments, setTempAdjustments] = useState<Adjustments | null>(null);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onBackgroundChange({ mode: 'image', color: 'transparent', imageUrl: url });
    }
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  // 1-Click Clean & Unblur Presets
  const applyCleanEnhancePreset = (type: 'auto' | 'bright_face' | 'unblur_hd' | 'natural_clear') => {
    switch (type) {
      case 'auto':
        onAdjustmentsChange({
          ...adjustments,
          sharpness: 45,
          clarity: 45,
          cleanBright: 32,
          dehaze: 22,
          contrast: 8,
          brightness: 6,
        });
        break;
      case 'bright_face':
        onAdjustmentsChange({
          ...adjustments,
          sharpness: 25,
          clarity: 30,
          cleanBright: 50,
          dehaze: 15,
          brightness: 12,
          warmth: 4,
        });
        break;
      case 'unblur_hd':
        onAdjustmentsChange({
          ...adjustments,
          sharpness: 78,
          clarity: 65,
          cleanBright: 20,
          dehaze: 35,
          contrast: 12,
        });
        break;
      case 'natural_clear':
        onAdjustmentsChange({
          ...adjustments,
          sharpness: 28,
          clarity: 30,
          cleanBright: 20,
          dehaze: 15,
          contrast: 4,
          brightness: 4,
        });
        break;
    }
  };

  // Reset Clean & Unblur only
  const resetCleanEnhance = () => {
    onAdjustmentsChange({
      ...adjustments,
      sharpness: 0,
      clarity: 0,
      cleanBright: 0,
      dehaze: 0,
    });
  };

  // Quick preset standard filters
  const applyPresetFilter = (type: 'normal' | 'bw' | 'studio' | 'sepia') => {
    switch (type) {
      case 'bw':
        onAdjustmentsChange({
          ...adjustments,
          brightness: 5,
          contrast: 15,
          saturation: 0,
          warmth: 0,
          grayscale: true,
          sepia: false,
        });
        break;
      case 'studio':
        onAdjustmentsChange({
          ...adjustments,
          brightness: 10,
          contrast: 12,
          saturation: 8,
          warmth: 6,
          grayscale: false,
          sepia: false,
        });
        break;
      case 'sepia':
        onAdjustmentsChange({
          ...adjustments,
          brightness: 0,
          contrast: 10,
          saturation: 0,
          warmth: 20,
          grayscale: false,
          sepia: true,
        });
        break;
      case 'normal':
      default:
        onAdjustmentsChange({
          ...adjustments,
          brightness: 0,
          contrast: 0,
          saturation: 0,
          warmth: 0,
          grayscale: false,
          sepia: false,
        });
        break;
    }
  };

  // Compare original handler
  const handleStartCompare = () => {
    setTempAdjustments({ ...adjustments });
    onAdjustmentsChange({
      ...adjustments,
      sharpness: 0,
      clarity: 0,
      cleanBright: 0,
      dehaze: 0,
      brightness: 0,
      contrast: 0,
      warmth: 0,
      saturation: 0,
    });
    setIsComparingOriginal(true);
  };

  const handleEndCompare = () => {
    if (tempAdjustments) {
      onAdjustmentsChange(tempAdjustments);
      setTempAdjustments(null);
    }
    setIsComparingOriginal(false);
  };

  const isEnhanceActive = 
    (adjustments.sharpness || 0) > 0 || 
    (adjustments.clarity || 0) > 0 || 
    (adjustments.cleanBright || 0) > 0 || 
    (adjustments.dehaze || 0) > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
        <button
          id="tab-clean-sharp"
          type="button"
          onClick={() => setActiveTab('clean_sharp')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'clean_sharp'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="truncate">Anti-Buram & Bersih</span>
        </button>

        <button
          id="tab-adjust"
          type="button"
          onClick={() => setActiveTab('adjust')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'adjust'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Warna</span>
        </button>

        <button
          id="tab-border-bg"
          type="button"
          onClick={() => setActiveTab('border_bg')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'border_bg'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Latar & Tepi</span>
        </button>

        <button
          id="tab-info"
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'info'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Panduan</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
        
        {/* TAB 1: PENJERNIH & PENCERAH FOTO (ANTI-BURAM & BERSIH ALAMI) */}
        {activeTab === 'clean_sharp' && (
          <div className="space-y-4">
            {/* Feature Header Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 p-3 rounded-xl border border-blue-100 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded-md bg-blue-600 text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Penjernih Foto (Anti-Buram & Bersih)
                  </span>
                </div>
                {isEnhanceActive && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Membuat foto tidak buram, menerangi bayangan gelap, dan menampilkan tekstur asli wajah yang bersih seperti hasil foto studio profesional.
              </p>
            </div>

            {/* 1-Click Instant Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Preset 1-Klik Instan</span>
                </label>
                <span className="text-[10px] text-slate-500">Pilih rekomendasi</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="preset-auto-clean"
                  type="button"
                  onClick={() => applyCleanEnhancePreset('auto')}
                  className="p-2.5 rounded-xl border text-left bg-gradient-to-b from-blue-50/80 to-white border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all group"
                >
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Auto Jernih & Bersih</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Pertajam blur + terangkan wajah natural
                  </div>
                </button>

                <button
                  id="preset-bright-face"
                  type="button"
                  onClick={() => applyCleanEnhancePreset('bright_face')}
                  className="p-2.5 rounded-xl border text-left bg-gradient-to-b from-amber-50/50 to-white border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all"
                >
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1 mb-0.5">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>Wajah Terang Bersih</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Cahaya studio, hilangkan kusam
                  </div>
                </button>

                <button
                  id="preset-unblur-hd"
                  type="button"
                  onClick={() => applyCleanEnhancePreset('unblur_hd')}
                  className="p-2.5 rounded-xl border text-left bg-gradient-to-b from-indigo-50/60 to-white border-indigo-200 hover:border-indigo-400 hover:shadow-sm transition-all"
                >
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1 mb-0.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Anti-Buram Tajam HD</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Tebalkan detail mata, alis & rambut
                  </div>
                </button>

                <button
                  id="preset-natural-clear"
                  type="button"
                  onClick={() => applyCleanEnhancePreset('natural_clear')}
                  className="p-2.5 rounded-xl border text-left bg-gradient-to-b from-slate-50 to-white border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                    <span>Alami & Bening</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Peningkatan halus tanpa berlebihan
                  </div>
                </button>
              </div>
            </div>

            {/* Detailed Sliders */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              {/* Slider 1: Ketajaman / Unblur */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-700 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> 
                    Ketajaman & Anti-Buram (Unblur)
                  </span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                    {adjustments.sharpness || 0}%
                  </span>
                </div>
                <input
                  id="unblur-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.sharpness || 0}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, sharpness: parseInt(e.target.value) })}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Mempertegas detail mata, helai rambut, dan batas kontur wajah yang kabur
                </p>
              </div>

              {/* Slider 2: Clean Studio Brightness */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-700 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> 
                    Pencerah Bersih Alami (Clean Studio Tone)
                  </span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                    {adjustments.cleanBright || 0}%
                  </span>
                </div>
                <input
                  id="clean-bright-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.cleanBright || 0}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, cleanBright: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Menerangi bagian gelap/kusam tanpa membuat warna kulit pucat atau membakar warna putih
                </p>
              </div>

              {/* Slider 3: Clarity & Micro Contrast */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-700 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" /> 
                    Kejernihan & Definisi Mikro (Clarity)
                  </span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                    {adjustments.clarity || 0}%
                  </span>
                </div>
                <input
                  id="clarity-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.clarity || 0}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, clarity: parseInt(e.target.value) })}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Meningkatkan pemisahan tekstur dan ketegasan garis wajah agar tampak nyata
                </p>
              </div>

              {/* Slider 4: Dehaze / Anti Kabut Lensa */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-700 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-teal-600" /> 
                    Peredam Kabur Lensa (Dehaze)
                  </span>
                  <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded text-[11px]">
                    {adjustments.dehaze || 0}%
                  </span>
                </div>
                <input
                  id="dehaze-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.dehaze || 0}
                  onChange={(e) => onAdjustmentsChange({ ...adjustments, dehaze: parseInt(e.target.value) })}
                  className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Menghilangkan lapisan putih/buram dari lensa kamera yang berminyak atau berdebu
                </p>
              </div>
            </div>

            {/* Compare & Reset Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <button
                id="btn-compare-original"
                type="button"
                onMouseDown={handleStartCompare}
                onMouseUp={handleEndCompare}
                onTouchStart={handleStartCompare}
                onTouchEnd={handleEndCompare}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 select-none transition-all ${
                  isComparingOriginal
                    ? 'bg-amber-600 text-white shadow-inner ring-2 ring-amber-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isComparingOriginal ? 'Melihat Foto Asli...' : 'Tahan: Bandingkan Asli'}</span>
              </button>

              <button
                id="btn-reset-clean"
                type="button"
                onClick={resetCleanEnhance}
                disabled={!isEnhanceActive}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 transition-colors flex items-center gap-1"
                title="Reset Penjernih Foto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: WARNA & CAHAYA STANDAR */}
        {activeTab === 'adjust' && (
          <div className="space-y-4">
            {/* Filter Quick Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Preset Warna Dasar
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetFilter('normal')}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium text-center transition-colors"
                >
                  Asli
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetFilter('studio')}
                  className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium text-center transition-colors"
                >
                  Cerah
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetFilter('bw')}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium text-center transition-colors"
                >
                  B&W
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetFilter('sepia')}
                  className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-medium text-center transition-colors"
                >
                  Vintage
                </button>
              </div>
            </div>

            {/* Brightness Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Kecerahan Keseluruhan
                </span>
                <span className="font-mono text-slate-500">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}</span>
              </div>
              <input
                id="brightness-slider"
                type="range"
                min="-60"
                max="60"
                value={adjustments.brightness}
                onChange={(e) => onAdjustmentsChange({ ...adjustments, brightness: parseInt(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Contrast Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5 text-indigo-500" /> Kontras Global
                </span>
                <span className="font-mono text-slate-500">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}</span>
              </div>
              <input
                id="contrast-slider"
                type="range"
                min="-60"
                max="60"
                value={adjustments.contrast}
                onChange={(e) => onAdjustmentsChange({ ...adjustments, contrast: parseInt(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Saturation Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-rose-500" /> Kejenuhan Warna
                </span>
                <span className="font-mono text-slate-500">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}</span>
              </div>
              <input
                id="saturation-slider"
                type="range"
                min="-80"
                max="80"
                value={adjustments.saturation}
                onChange={(e) => onAdjustmentsChange({ ...adjustments, saturation: parseInt(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Warmth Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" /> Suhu Warna (Warmth)
                </span>
                <span className="font-mono text-slate-500">{adjustments.warmth > 0 ? `+${adjustments.warmth}` : adjustments.warmth}</span>
              </div>
              <input
                id="warmth-slider"
                type="range"
                min="-50"
                max="50"
                value={adjustments.warmth}
                onChange={(e) => onAdjustmentsChange({ ...adjustments, warmth: parseInt(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            <button
              id="reset-filter-btn"
              type="button"
              onClick={() => applyPresetFilter('normal')}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Penyesuaian Warna</span>
            </button>
          </div>
        )}

        {/* TAB 3: LATAR & TEPI */}
        {activeTab === 'border_bg' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Latar Belakang Pas Foto Resmi
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Standar Indonesia</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                Di Indonesia, latar <strong>Merah</strong> lazim digunakan untuk tahun lahir genap (cth. 1996, 2000), sedangkan <strong>Biru</strong> untuk tahun lahir ganjil (cth. 1997, 2001). Latar <strong>Putih</strong> untuk visa atau paspor.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {PAS_FOTO_BG_COLORS.map((bg) => {
                  const isSelected = background.mode === 'color' && background.color === bg.hex;
                  return (
                    <button
                      key={bg.code}
                      type="button"
                      onClick={() => onBackgroundChange({ mode: 'color', color: bg.hex })}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span 
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-inner shrink-0" 
                        style={{ backgroundColor: bg.hex }}
                      />
                      <span className="text-xs font-medium text-slate-800 leading-tight">
                        {bg.label}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => onBackgroundChange({ mode: 'original', color: 'transparent' })}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    background.mode === 'original'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border border-slate-300 bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                    Ori
                  </span>
                  <span className="text-xs font-medium text-slate-800 leading-tight">
                    Latar Asli Foto
                  </span>
                </button>
              </div>
            </div>

            {/* Latar Belakang Gambar / Abstrak */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block">
                    Latar Belakang Gambar & Abstrak
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Bikin foto makin menarik (Butuh foto objek berlatar transparan)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                {PRESET_IMAGE_BGS.map((bg) => {
                  const isSelected = background.mode === 'image' && background.imageUrl === bg.url;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => onBackgroundChange({ mode: 'image', color: 'transparent', imageUrl: bg.url })}
                      className={`h-10 rounded-xl border relative overflow-hidden transition-all ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={bg.url} alt={bg.label} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-white drop-shadow-md">
                          {bg.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                className="w-full p-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-600 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium">Unggah Gambar Latar...</span>
              </button>
              <input
                type="file"
                ref={bgInputRef}
                onChange={handleBgUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Border / Bingkai Putih Cetak (White Framing) */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block">
                    Bingkai Tepi Cetak (Margin Putih)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Sering dipakai studio cetak foto 2R - 10R untuk pigura
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={border.enabled}
                  onChange={(e) => onBorderChange({ ...border, enabled: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {border.enabled && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 mt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Ketebalan Tepi
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {[1, 2, 3, 5].map((mm) => (
                        <button
                          key={mm}
                          type="button"
                          onClick={() => onBorderChange({ ...border, widthMm: mm })}
                          className={`py-1.5 rounded-lg font-medium text-center border transition-colors ${
                            border.widthMm === mm
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mm} mm
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Warna Tepi
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onBorderChange({ ...border, color: '#FFFFFF' })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                          border.color === '#FFFFFF' ? 'border-blue-600 bg-white ring-2 ring-blue-500/20' : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span>
                        Putih Klasik
                      </button>
                      <button
                        type="button"
                        onClick={() => onBorderChange({ ...border, color: '#000000' })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                          border.color === '#000000' ? 'border-blue-600 bg-slate-900 text-white ring-2 ring-blue-500/20' : 'border-slate-200 bg-slate-900 text-white'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-black border border-slate-600"></span>
                        Hitam Minimalis
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PANDUAN & SPESIFIKASI */}
        {activeTab === 'info' && (
          <div className="space-y-3 text-xs text-slate-600">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <div className="font-semibold text-blue-900 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Spesifikasi Ukuran: {preset.name}</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px]">
                <li>• <strong>Dimensi Milimeter:</strong> {preset.widthMm} × {preset.heightMm} mm</li>
                <li>• <strong>Dimensi Centimeter:</strong> {(preset.widthMm / 10).toFixed(1)} × {(preset.heightMm / 10).toFixed(1)} cm</li>
                <li>• <strong>Dimensi Inci:</strong> {(preset.widthMm / 25.4).toFixed(2)} × {(preset.heightMm / 25.4).toFixed(2)} inch</li>
                <li>• <strong>Resolusi Cetak (300 DPI):</strong> {mmToPixels(preset.widthMm, 300)} × {mmToPixels(preset.heightMm, 300)} px</li>
                <li>• <strong>Resolusi Web (72 DPI):</strong> {mmToPixels(preset.widthMm, 72)} × {mmToPixels(preset.heightMm, 72)} px</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-800 mb-1">Kegunaan & Regulasi:</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {preset.recommendedFor || 'Cocok untuk cetak foto berkualitas tinggi atau kebutuhan dokumentasi resmi.'}
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
              <strong>Tips Cetak:</strong> Gunakan Kertas Foto Silky/Doff untuk pas foto resmi (ijazah/CPNS) agar bebas pantulan cahaya, atau Kertas Glossy untuk foto kenangan keluarga seri 4R - 10R.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
