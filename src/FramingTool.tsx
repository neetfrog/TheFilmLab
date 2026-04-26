import { useState, useRef, useCallback, useEffect } from 'react';
import { framePresets, frameColors, FramePreset } from './framePresets';
import { fitRatioIntoBounds, getCanvasSizeForRatio, getCenteredDrawRect } from './canvasUtils';

interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

interface FramingToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FramingTool({ isOpen, onClose }: FramingToolProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<FramePreset>(framePresets[0]);
  const [frameColor, setFrameColor] = useState<string>('#FFFFFF');
  const [padding, setPadding] = useState(5);
  const [processing, setProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const selectedImage = images[selectedIndex];

  const addImages = useCallback((files: FileList) => {
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    addImages(files);
    if (e.target) e.target.value = '';
  }, [addImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    addImages(files);
  }, [addImages]);

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
      const { width: canvasWidth, height: canvasHeight } = getCanvasSizeForRatio(selectedPreset.ratio, 400);
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const paddingFactor = 1 - padding / 100;
      const maxWidth = canvasWidth * paddingFactor;
      const maxHeight = canvasHeight * paddingFactor;
      const { x, y, width: drawWidth, height: drawHeight } = getCenteredDrawRect(img.width, img.height, maxWidth, maxHeight);
      const offsetX = Math.round((canvasWidth - maxWidth) / 2);
      const offsetY = Math.round((canvasHeight - maxHeight) / 2);

      ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
    };
    img.src = selectedImage.url;
  }, [selectedImage, selectedPreset, frameColor, padding]);

  // Update preview whenever settings change
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleDownload = useCallback(async (imageData?: ImageData) => {
    const img = imageData || selectedImage;
    if (!img) return;

    setProcessing(true);

    const targetRatio = selectedPreset.ratio;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const image = new Image();
    image.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      image.onload = () => {
        const size = fitRatioIntoBounds(image.width, image.height, targetRatio);
        canvas.width = Math.round(size.width);
        canvas.height = Math.round(size.height);
        ctx.fillStyle = frameColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const paddingFactor = 1 - padding / 100;
        const maxWidth = canvas.width * paddingFactor;
        const maxHeight = canvas.height * paddingFactor;
        const { x, y, width: drawWidth, height: drawHeight } = getCenteredDrawRect(image.width, image.height, maxWidth, maxHeight);
        const offsetX = Math.round((canvas.width - maxWidth) / 2);
        const offsetY = Math.round((canvas.height - maxHeight) / 2);

        ctx.drawImage(image, x + offsetX, y + offsetY, drawWidth, drawHeight);
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
      await handleDownload(images[i]);
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

                  {/* Controls */}
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/60 p-4">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Crop</p>
                          <h3 className="text-sm font-semibold text-white">Aspect ratio</h3>
                        </div>
                        <span className="text-xs text-zinc-400">{selectedPreset.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {framePresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => setSelectedPreset(preset)}
                            className={`rounded-full px-3 py-2 text-[12px] font-medium transition ${
                              selectedPreset.name === preset.name
                                ? 'bg-amber-500 text-black shadow-sm'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/60 p-4">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Frame</p>
                          <h3 className="text-sm font-semibold text-white">Color</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFrameColor('#FFFFFF')}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {frameColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setFrameColor(color.value)}
                            className={`h-10 w-10 rounded-full border-2 transition ${
                              frameColor === color.value
                                ? 'border-amber-500 shadow-inner'
                                : 'border-zinc-700/80 hover:border-zinc-500'
                            }`}
                            style={{ backgroundColor: color.value }}
                            aria-label={color.name}
                          />
                        ))}
                        <label className="relative flex items-center justify-center h-10 w-10 rounded-full border border-zinc-700/80 bg-zinc-900 text-zinc-300 cursor-pointer hover:border-amber-500">
                          <input
                            type="color"
                            value={frameColor}
                            onChange={(e) => setFrameColor(e.target.value)}
                            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                          />
                          <span className="text-sm">+</span>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/60 p-4">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Padding</p>
                          <h3 className="text-sm font-semibold text-white">{padding}%</h3>
                        </div>
                        <span className="text-xs text-zinc-500">Image spacing</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={padding}
                        onChange={(e) => setPadding(parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg bg-zinc-800 accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Image List */}
                <div className="space-y-4">
                  <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/60 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Images</p>
                        <h3 className="text-sm font-semibold text-white">{images.length} loaded</h3>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full border border-zinc-700/80 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedIndex(index)}
                          className={`group flex items-center gap-3 w-full rounded-3xl border px-3 py-3 text-left transition ${
                            selectedIndex === index
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="h-12 w-12 rounded-2xl object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-white">{img.file.name}</p>
                            <p className="text-xs text-zinc-500">{img.width} × {img.height}</p>
                          </div>
                          <span
                            className="block rounded-full border border-zinc-700 px-2 py-1 text-[10px] text-zinc-400 hover:border-red-400 hover:text-red-300 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                          >
                            Remove
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
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
