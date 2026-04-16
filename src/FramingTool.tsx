import { useState, useRef, useCallback, useEffect } from 'react';
import { framePresets, frameColors, FramePreset } from './framePresets';

interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

interface FramingToolProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: HTMLImageElement; // Optional: pass image from main app
}

export default function FramingTool({ isOpen, onClose, initialImage }: FramingToolProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<FramePreset>(framePresets[0]);
  const [frameColor, setFrameColor] = useState<string>('#FFFFFF');
  const [padding, setPadding] = useState(5);
  const [processing, setProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const selectedImage = images[selectedIndex];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages((prev) => [
          ...prev,
          { file, url, width: img.width, height: img.height },
        ]);
      };
      img.src = url;
    });

    if (e.target) e.target.value = '';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages((prev) => [
          ...prev,
          { file, url, width: img.width, height: img.height },
        ]);
      };
      img.src = url;
    });
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (selectedIndex >= index && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  // Update preview
  const updatePreview = useCallback(() => {
    if (!selectedImage || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const targetRatio = selectedPreset.ratio;
      const baseSize = 400;

      let canvasWidth: number;
      let canvasHeight: number;

      if (targetRatio >= 1) {
        canvasWidth = baseSize;
        canvasHeight = baseSize / targetRatio;
      } else {
        canvasHeight = baseSize;
        canvasWidth = baseSize * targetRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const paddingFactor = 1 - padding / 100;
      const maxWidth = canvasWidth * paddingFactor;
      const maxHeight = canvasHeight * paddingFactor;

      const imageRatio = img.width / img.height;
      let drawWidth: number;
      let drawHeight: number;

      if (imageRatio > maxWidth / maxHeight) {
        drawWidth = maxWidth;
        drawHeight = maxWidth / imageRatio;
      } else {
        drawHeight = maxHeight;
        drawWidth = maxHeight * imageRatio;
      }

      const x = (canvasWidth - drawWidth) / 2;
      const y = (canvasHeight - drawHeight) / 2;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    };
    img.src = selectedImage.url;
  }, [selectedImage, selectedPreset, frameColor, padding]);

  // Update preview whenever settings change
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleDownload = useCallback(async (imageData?: ImageData, index?: number) => {
    const img = imageData || selectedImage;
    if (!img) return;

    setProcessing(true);

    const targetRatio = selectedPreset.ratio;
    const outputSize = 1440; // High quality export size

    let canvasWidth: number;
    let canvasHeight: number;

    if (targetRatio >= 1) {
      canvasWidth = outputSize;
      canvasHeight = outputSize / targetRatio;
    } else {
      canvasHeight = outputSize;
      canvasWidth = outputSize * targetRatio;
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const paddingFactor = 1 - padding / 100;
    const maxWidth = canvasWidth * paddingFactor;
    const maxHeight = canvasHeight * paddingFactor;

    const image = new Image();
    image.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      image.onload = () => {
        const imageRatio = image.width / image.height;
        let drawWidth: number;
        let drawHeight: number;

        if (imageRatio > maxWidth / maxHeight) {
          drawWidth = maxWidth;
          drawHeight = maxWidth / imageRatio;
        } else {
          drawHeight = maxHeight;
          drawWidth = maxHeight * imageRatio;
        }

        const x = (canvasWidth - drawWidth) / 2;
        const y = (canvasHeight - drawHeight) / 2;

        ctx.drawImage(image, x, y, drawWidth, drawHeight);
        resolve();
      };
      image.src = img.url;
    });

    const link = document.createElement('a');
    const fileName = img.file.name.replace(/\.[^/.]+$/, '');
    link.download = `${fileName}_framed_${selectedPreset.name}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();

    if (!imageData) {
      setProcessing(false);
    }
  }, [selectedImage, selectedPreset, frameColor, padding]);

  const handleDownloadAll = useCallback(async () => {
    setProcessing(true);
    for (let i = 0; i < images.length; i++) {
      await handleDownload(images[i], i);
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setProcessing(false);
  }, [images, handleDownload]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl max-h-[90vh] w-full max-w-2xl flex flex-col border border-zinc-700/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/50 bg-zinc-800/50">
          <h2 className="text-xl font-bold text-white">Photo Framing Tool</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedImage ? (
            // Upload area
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-500/40 rounded-xl p-12 text-center cursor-pointer hover:border-amber-400/60 hover:bg-amber-500/5 transition-all"
            >
              <div className="text-5xl mb-3">📸</div>
              <p className="text-white font-medium mb-1">Drop images here</p>
              <p className="text-zinc-400 text-sm">or click to browse (supports multiple)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <>
              {/* Grid Layout: Preview + Settings on left, Image List on right */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Left: Preview + Settings */}
                <div className="md:col-span-2 space-y-4">
                  {/* Preview */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">Preview</h3>
                    <div className="flex items-center justify-center bg-zinc-950/50 rounded-lg p-4 min-h-64">
                      <canvas
                        ref={previewCanvasRef}
                        className="max-w-full max-h-80 rounded shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Controls Grid */}
                  <div className="grid gap-3">
                    {/* Aspect Ratio */}
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 block">
                        Aspect Ratio
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {framePresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => setSelectedPreset(preset)}
                            className={`px-2 py-2 rounded text-[12px] font-medium transition-all ${
                              selectedPreset.name === preset.name
                                ? 'bg-amber-500 text-black'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frame Color */}
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 block">
                        Frame Color
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {frameColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setFrameColor(color.value)}
                            className={`px-2 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 border ${
                              frameColor === color.value
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-500'
                            }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full border border-zinc-600"
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="hidden sm:inline text-[10px]">{color.name}</span>
                          </button>
                        ))}
                      </div>
                      {/* Custom color */}
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={frameColor}
                          onChange={(e) => setFrameColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <input
                          type="text"
                          value={frameColor}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                              setFrameColor(e.target.value);
                            }
                          }}
                          className="flex-1 bg-zinc-800 text-white px-2 py-2 rounded text-xs uppercase font-mono border border-zinc-700"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    {/* Padding Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                          Padding: {padding}%
                        </label>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={padding}
                        onChange={(e) => setPadding(parseInt(e.target.value))}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-zinc-500 text-xs mt-1">
                        <span>Minimal</span>
                        <span>Large</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Image List */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <span>🖼️</span> Images ({images.length})
                  </h3>
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={`flex items-center gap-2 p-2 rounded-lg w-full transition-all text-left ${
                          selectedIndex === index
                            ? 'bg-amber-500/30 ring-1 ring-amber-500'
                            : 'bg-zinc-800/50 hover:bg-zinc-800 '
                        }`}
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs truncate font-medium">{img.file.name}</p>
                          <p className="text-zinc-500 text-[10px]">
                            {img.width} × {img.height}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="text-red-400 hover:text-red-300 text-sm p-1 flex-shrink-0"
                        >
                          ✕
                        </button>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-3 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium transition-all"
                  >
                    + Add Images
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {selectedImage && (
          <div className="border-t border-zinc-700/50 bg-zinc-800/50 px-6 py-4 flex gap-3 flex-wrap">
            <button
              onClick={onClose}
              className="flex-1 min-w-[120px] px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium transition-all text-sm"
            >
              Close
            </button>
            {images.length > 1 && (
              <button
                onClick={handleDownloadAll}
                disabled={processing}
                className="flex-1 min-w-[120px] px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-all disabled:opacity-50 text-sm"
              >
                {processing ? 'Processing...' : `Download All (${images.length})`}
              </button>
            )}
            <button
              onClick={() => handleDownload()}
              disabled={processing}
              className="flex-1 min-w-[180px] px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all disabled:opacity-50 text-sm"
            >
              {processing ? 'Processing...' : 'Download Current'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
