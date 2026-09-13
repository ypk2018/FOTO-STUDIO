import React, { useRef, useState } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../data/sampleImages';

interface PhotoUploaderProps {
  onImageLoaded: (img: HTMLImageElement, fileSource: string) => void;
  onSelectSample: (sample: SampleImage) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onImageLoaded,
  onSelectSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, atau WebP).');
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onImageLoaded(img, file.name);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Hero Welcome Card */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white shadow-sm ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
          <Upload className="w-8 h-8" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Atur Foto Ukuran 2x2 sampai 10R
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
          Tarik dan lepas file foto Anda di sini, atau klik tombol di bawah untuk memilih foto dari perangkat Anda.
        </p>

        {errorMsg && (
          <div className="mb-4 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 py-2 px-3 rounded-xl inline-block">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            id="choose-file-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Pilih File Foto</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Atau Coba dengan Foto Contoh</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className="group p-2.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all flex flex-col items-center"
              >
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-20 h-20 rounded-xl object-cover mb-2 group-hover:scale-105 transition-transform"
                />
                <span className="text-xs font-medium text-slate-800 text-center line-clamp-1">
                  {sample.name}
                </span>
                <span className="text-[10px] text-blue-600 font-medium mt-0.5">
                  {sample.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-center">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-900 mb-1">Standar Pas Foto Lengkap</div>
          <div className="text-[11px] text-slate-500">2x2 cm, 2x2 inch Visa, 2x3, 3x4, 4x6, dan Visa Schengen</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-900 mb-1">Seri Cetak Foto R Komplit</div>
          <div className="text-[11px] text-slate-500">2R, 3R, 4R, 5R, 6R, 8R, 8R Plus, 10R, dan 10R Plus</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-900 mb-1">Lembar Cetak & Kompresi</div>
          <div className="text-[11px] text-slate-500">Paket cetak A4/F4 dengan garis potong dan kompresi &lt;200KB CPNS</div>
        </div>
      </div>
    </div>
  );
};
