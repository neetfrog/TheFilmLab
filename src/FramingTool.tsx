import { useState, useRef, useCallback, useEffect } from 'react';
import { framePresets, frameColors, FramePreset } from './framePresets';
import { getCanvasSizeForRatio, getCenteredDrawRect, padRatioToSourceBounds } from './canvasUtils';

interface ImageDataEntry {
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
  const [images, setImages] = useState<ImageDataEntry[]>([]);
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

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleDownload = useCallback(async (imageData?: ImageDataEntry) => {
    const img = imageData || selectedImage;
    if (!img) return;

    setProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const image = new Image();
    image.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      image.onload = () => {
        const size = padRatioToSourceBounds(image.width, image.height, selectedPreset.ratio);
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
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setProcessing(false);
  }, [images, handleDownload]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl max-h-[90vh] w-full max-w-2xl flex flex-col border border-zinc-700/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/50 bg-zinc-800/50">
          <h2 className="text-xl font-bold text-white">Photo Framing Tool</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-500/40 rounded-xl p-12 text-center cursor-pointer hover:border-amber-400/60 hover:bg-amber-500/5 transition-all"
            >
              <div className="text-5xl mb-3">🖼️</div>
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
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">Preview</h3>
                    <div className="flex items-center justify-center bg-zinc-950/50 rounded-lg p-4 min-h-64">
                      <canvas
                        ref={previewCanvasRef}
                        className="max-w-full max-h-80 rounded shadow-lg"
                      />
                    </div>
                  </div>

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
                                : 'border-zinc-700/50 hover:border-zinc-500'
                            }`}
                            style={{ backgroundColor: color.value }}
                          />
                        ))}
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Padding</p>
                            <h3 className="text-sm font-semibold text-white">{padding}%</h3>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            step="1"
                            value={padding}
                            onChange={(e) => setPadding(parseInt(e.target.value, 10))}
                            className="w-full"
                          />
                        </div>
                        <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/60 p-4 space-y-3">
                          <button
                            type="button"
                            onClick={() => handleDownload()}
                            disabled={processing}
                            className="w-full px-4 py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-all disabled:opacity-50"
                          >
                            {processing ? 'Rendering…' : 'Download framed image'}
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadAll}
                            disabled={processing || images.length === 0}
                            className="w-full px-4 py-3 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-all disabled:opacity-50"
                          >
                            Download all
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/60 p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Images</h3>
                    <div className="space-y-2">
                      {images.map((image, index) => (
                        <div
                          key={image.url}
                          className={`rounded-2xl p-3 border ${
                            index === selectedIndex ? 'border-amber-500 bg-zinc-900/80' : 'border-zinc-700/50 bg-zinc-950/60'
                          } flex items-center justify-between gap-3`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedIndex(index)}
                            className="text-left flex-1 flex items-center gap-3"
                          >
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-zinc-800 border border-zinc-700/60">
                              <img src={image.url} alt={image.file.name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{image.file.name}</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            aria-label={`Remove ${image.file.name}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full mt-4 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-all"
                    >
                      Add more images
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
