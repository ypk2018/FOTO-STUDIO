import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CropState, 
  PhotoSizePreset, 
  Adjustments, 
  BorderSettings, 
  BackgroundSettings 
} from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical, 
  Grid3X3, 
  UserCheck, 
  Maximize2,
  Move
} from 'lucide-react';
import { mmToPixels } from '../constants/photoSizes';
import { applyImageEnhancements } from '../utils/canvasUtils';

interface PhotoCanvasProps {
  image: HTMLImageElement | null;
  preset: PhotoSizePreset;
  crop: CropState;
  onCropChange: (crop: CropState) => void;
  adjustments: Adjustments;
  border: BorderSettings;
  background: BackgroundSettings;
}

export const PhotoCanvas: React.FC<PhotoCanvasProps> = ({
  image,
  preset,
  crop,
  onCropChange,
  adjustments,
  border,
  background,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Overlay guides
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Interaction dragging states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'tl' | 'tr' | 'bl' | 'br'
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropState>(crop);

  // Canvas visual size on screen
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 500,
  });

  // Calculate container dimensions on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute display scale of image inside container
  const getRenderTransform = useCallback(() => {
    if (!image) return { scale: 1, offsetX: 0, offsetY: 0 };

    const availW = containerSize.width - 40;
    const availH = containerSize.height - 40;

    const scale = Math.min(availW / image.width, availH / image.height, 1);
    const renderW = image.width * scale;
    const renderH = image.height * scale;

    const offsetX = (containerSize.width - renderW) / 2;
    const offsetY = (containerSize.height - renderH) / 2;

    return { scale, offsetX, offsetY, renderW, renderH };
  }, [image, containerSize]);

  // Main rendering loop for editor canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    const { scale, offsetX, offsetY, renderW, renderH } = getRenderTransform();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dark studio backdrop
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Draw original image with adjustments applied
    ctx.save();
    
    // Apply filters
    const filters: string[] = [];
    if (adjustments.brightness !== 0) filters.push(`brightness(${100 + adjustments.brightness}%)`);
    if (adjustments.contrast !== 0) filters.push(`contrast(${100 + adjustments.contrast}%)`);
    if (adjustments.saturation !== 0) filters.push(`saturate(${100 + adjustments.saturation}%)`);
    if (adjustments.grayscale) filters.push('grayscale(100%)');
    if (adjustments.sepia) filters.push('sepia(100%)');

    ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';

    // Center transform for flip & rotation
    const imgCenterX = offsetX + renderW / 2;
    const imgCenterY = offsetY + renderH / 2;

    ctx.translate(imgCenterX, imgCenterY);
    if (crop.rotation !== 0) {
      ctx.rotate((crop.rotation * Math.PI) / 180);
    }
    ctx.scale(crop.flipH ? -1 : 1, crop.flipV ? -1 : 1);

    ctx.drawImage(
      image,
      -renderW / 2,
      -renderH / 2,
      renderW,
      renderH
    );

    // Warmth overlay
    if (adjustments.warmth !== 0) {
      ctx.filter = 'none';
      ctx.globalCompositeOperation = adjustments.warmth > 0 ? 'color' : 'soft-light';
      const alpha = Math.min(Math.abs(adjustments.warmth) / 100, 0.4);
      ctx.fillStyle = adjustments.warmth > 0 ? `rgba(255, 140, 0, ${alpha})` : `rgba(0, 120, 255, ${alpha})`;
      ctx.fillRect(-renderW / 2, -renderH / 2, renderW, renderH);
    }

    ctx.restore();

    const cropScreenX = offsetX + crop.x * scale;
    const cropScreenY = offsetY + crop.y * scale;
    const cropScreenW = crop.width * scale;
    const cropScreenH = crop.height * scale;

    // Apply Studio Unblur & Clean Brightness inside crop area
    applyImageEnhancements(ctx, cropScreenX, cropScreenY, cropScreenW, cropScreenH, adjustments);

    // 2. Darken area outside crop (dim mask)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    // Cut hole for crop rect
    ctx.rect(cropScreenX + cropScreenW, cropScreenY, -cropScreenW, cropScreenH);
    ctx.fill();
    ctx.restore();

    // 3. Draw border inside crop area if enabled
    if (border.enabled && border.widthMm > 0) {
      const borderScreenPx = (border.widthMm / preset.widthMm) * cropScreenW;
      ctx.save();
      ctx.strokeStyle = border.color || '#FFFFFF';
      ctx.lineWidth = borderScreenPx * 2;
      ctx.strokeRect(cropScreenX, cropScreenY, cropScreenW, cropScreenH);
      ctx.restore();
    }

    // 4. Crop Box Border & Handles
    ctx.save();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropScreenX, cropScreenY, cropScreenW, cropScreenH);

    // Grid (Rule of Thirds)
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(cropScreenX + cropScreenW / 3, cropScreenY);
      ctx.lineTo(cropScreenX + cropScreenW / 3, cropScreenY + cropScreenH);
      ctx.moveTo(cropScreenX + (cropScreenW * 2) / 3, cropScreenY);
      ctx.lineTo(cropScreenX + (cropScreenW * 2) / 3, cropScreenY + cropScreenH);
      // Horizontal lines
      ctx.moveTo(cropScreenX, cropScreenY + cropScreenH / 3);
      ctx.lineTo(cropScreenX + cropScreenW, cropScreenY + cropScreenH / 3);
      ctx.moveTo(cropScreenX, cropScreenY + (cropScreenH * 2) / 3);
      ctx.lineTo(cropScreenX + cropScreenW, cropScreenY + (cropScreenH * 2) / 3);
      ctx.stroke();
    }

    // Biometric / Face Guide for Pas Foto
    if (showFaceGuide && (preset.category === 'pas_foto' || preset.aspectRatio < 1)) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      
      // Head Oval Guide
      const headCenterX = cropScreenX + cropScreenW / 2;
      const headCenterY = cropScreenY + cropScreenH * 0.42;
      const headRadiusX = cropScreenW * 0.26;
      const headRadiusY = cropScreenH * 0.28;

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(headCenterX, headCenterY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Eye line guide
      const eyeY = cropScreenY + cropScreenH * 0.45;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
      ctx.beginPath();
      ctx.moveTo(headCenterX - headRadiusX * 1.1, eyeY);
      ctx.lineTo(headCenterX + headRadiusX * 1.1, eyeY);
      ctx.stroke();

      // Chin guide
      const chinY = cropScreenY + cropScreenH * 0.70;
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
      ctx.beginPath();
      ctx.moveTo(headCenterX - headRadiusX * 0.6, chinY);
      ctx.lineTo(headCenterX + headRadiusX * 0.6, chinY);
      ctx.stroke();

      // Label at top
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Panduan Posisi Wajah (Mata & Dagu)', headCenterX, cropScreenY + 16);
      ctx.restore();
    }

    // 5. Corner Drag Handles
    const handleSize = 12;
    const handles = [
      { x: cropScreenX, y: cropScreenY }, // TL
      { x: cropScreenX + cropScreenW, y: cropScreenY }, // TR
      { x: cropScreenX, y: cropScreenY + cropScreenH }, // BL
      { x: cropScreenX + cropScreenW, y: cropScreenY + cropScreenH }, // BR
    ];

    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (const h of handles) {
      ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
    }

    ctx.restore();
  }, [
    image,
    containerSize,
    crop,
    adjustments,
    border,
    preset,
    showGrid,
    showFaceGuide,
    getRenderTransform,
  ]);

  // Handle pointer down (Drag or Resize)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { scale, offsetX, offsetY } = getRenderTransform();
    const cropScreenX = offsetX + crop.x * scale;
    const cropScreenY = offsetY + crop.y * scale;
    const cropScreenW = crop.width * scale;
    const cropScreenH = crop.height * scale;

    const handleRadius = 15;

    // Check corner handles
    if (Math.hypot(clickX - cropScreenX, clickY - cropScreenY) <= handleRadius) {
      setIsResizing('tl');
    } else if (Math.hypot(clickX - (cropScreenX + cropScreenW), clickY - cropScreenY) <= handleRadius) {
      setIsResizing('tr');
    } else if (Math.hypot(clickX - cropScreenX, clickY - (cropScreenY + cropScreenH)) <= handleRadius) {
      setIsResizing('bl');
    } else if (Math.hypot(clickX - (cropScreenX + cropScreenW), clickY - (cropScreenY + cropScreenH)) <= handleRadius) {
      setIsResizing('br');
    } else if (
      clickX >= cropScreenX &&
      clickX <= cropScreenX + cropScreenW &&
      clickY >= cropScreenY &&
      clickY <= cropScreenY + cropScreenH
    ) {
      setIsDragging(true);
    } else {
      return;
    }

    setDragStart({ x: clickX, y: clickY });
    setInitialCrop({ ...crop });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle pointer move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image) return;
    if (!isDragging && !isResizing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const { scale } = getRenderTransform();
    const dxImg = (currentX - dragStart.x) / scale;
    const dyImg = (currentY - dragStart.y) / scale;

    const targetRatio = preset.aspectRatio;

    if (isDragging) {
      // Reposition crop box within image boundaries
      let newX = initialCrop.x + dxImg;
      let newY = initialCrop.y + dyImg;

      newX = Math.max(0, Math.min(image.width - initialCrop.width, newX));
      newY = Math.max(0, Math.min(image.height - initialCrop.height, newY));

      onCropChange({
        ...initialCrop,
        x: Math.round(newX),
        y: Math.round(newY),
      });
    } else if (isResizing) {
      // Resize with aspect ratio locked
      let newWidth = initialCrop.width;
      let newHeight = initialCrop.height;
      let newX = initialCrop.x;
      let newY = initialCrop.y;

      if (isResizing === 'br') {
        const delta = Math.max(dxImg, dyImg * targetRatio);
        newWidth = Math.max(50, Math.min(image.width - initialCrop.x, initialCrop.width + delta));
        newHeight = newWidth / targetRatio;
      } else if (isResizing === 'tl') {
        const delta = Math.min(dxImg, dyImg * targetRatio);
        newWidth = Math.max(50, Math.min(initialCrop.x + initialCrop.width, initialCrop.width - delta));
        newHeight = newWidth / targetRatio;
        newX = initialCrop.x + (initialCrop.width - newWidth);
        newY = initialCrop.y + (initialCrop.height - newHeight);
      } else if (isResizing === 'tr') {
        const delta = dxImg;
        newWidth = Math.max(50, Math.min(image.width - initialCrop.x, initialCrop.width + delta));
        newHeight = newWidth / targetRatio;
        newY = initialCrop.y + (initialCrop.height - newHeight);
      } else if (isResizing === 'bl') {
        const delta = -dxImg;
        newWidth = Math.max(50, Math.min(initialCrop.x + initialCrop.width, initialCrop.width + delta));
        newHeight = newWidth / targetRatio;
        newX = initialCrop.x + (initialCrop.width - newWidth);
      }

      // Check boundary bounds
      if (newX >= 0 && newY >= 0 && newX + newWidth <= image.width && newY + newHeight <= image.height) {
        onCropChange({
          ...initialCrop,
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    setIsResizing(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  // Center crop on image
  const handleCenterCrop = () => {
    if (!image) return;
    const targetRatio = preset.aspectRatio;
    let w = image.width * 0.85;
    let h = w / targetRatio;

    if (h > image.height * 0.85) {
      h = image.height * 0.85;
      w = h * targetRatio;
    }

    onCropChange({
      ...crop,
      width: Math.round(w),
      height: Math.round(h),
      x: Math.round((image.width - w) / 2),
      y: Math.round((image.height - h) / 2),
    });
  };

  // Rotate 90 deg
  const handleRotate90 = () => {
    onCropChange({
      ...crop,
      rotation: (crop.rotation + 90) % 360,
    });
  };

  // Flip H / V
  const handleFlipH = () => {
    onCropChange({ ...crop, flipH: !crop.flipH });
  };
  const handleFlipV = () => {
    onCropChange({ ...crop, flipV: !crop.flipV });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg relative">
      {/* Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full min-h-[360px] sm:min-h-[480px] relative flex items-center justify-center cursor-crosshair select-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="touch-none block"
        />

        {/* Floating Top Indicator */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-200 flex items-center gap-2 shadow-md pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="font-semibold text-white">{preset.name}</span>
          <span className="text-slate-400">({preset.widthMm} × {preset.heightMm} mm)</span>
        </div>
      </div>

      {/* Canvas Tool Controls Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        {/* Transform Tools */}
        <div className="flex items-center gap-1.5">
          <button
            id="rotate-btn"
            type="button"
            onClick={handleRotate90}
            title="Putar 90° Searah Jarum Jam"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Putar 90°</span>
          </button>

          <button
            id="flip-h-btn"
            type="button"
            onClick={handleFlipH}
            title="Balik Horizontal (Mirror)"
            className={`p-2 rounded-lg border transition-colors flex items-center gap-1 ${
              crop.flipH
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mirror</span>
          </button>

          <button
            id="flip-v-btn"
            type="button"
            onClick={handleFlipV}
            title="Balik Vertikal"
            className={`p-2 rounded-lg border transition-colors flex items-center gap-1 ${
              crop.flipV
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
            }`}
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>

          <button
            id="fit-crop-btn"
            type="button"
            onClick={handleCenterCrop}
            title="Pusatkan Kotak Potong"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-colors flex items-center gap-1"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Pusatkan</span>
          </button>
        </div>

        {/* Guides & Overlay Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            id="toggle-face-guide-btn"
            type="button"
            onClick={() => setShowFaceGuide(!showFaceGuide)}
            title="Panduan Biometrik Wajah / Mata / Dagu Pas Foto"
            className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-medium ${
              showFaceGuide
                ? 'bg-blue-600/90 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Panduan Pas Foto</span>
          </button>

          <button
            id="toggle-grid-btn"
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Garis Komposisi Grid 3x3"
            className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-medium ${
              showGrid
                ? 'bg-blue-600/90 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Grid 3x3</span>
          </button>
        </div>
      </div>
    </div>
  );
};
