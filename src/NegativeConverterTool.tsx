import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import LibRaw from 'libraw-wasm';
import { useDropzone } from 'react-dropzone';
import {
  defaultParams,
  processNegative,
  detectOrangeMask,
  computeHistogram,
  type ProcessingParams,
} from './negativeConverter/imageProcessor';
import { FILM_PROFILES } from './negativeConverter/filmProfiles';

interface ImageDataEntry {
  file: File;
  url: string;
  imageData: ImageData;
}

interface NegativeConverterToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NegativeConverterTool({
  isOpen,
  onClose,
}: NegativeConverterToolProps) {
  const [srcImageData, setSrcImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [params, setParams] = useState<ProcessingParams>(defaultParams);
  const [outUrl, setOutUrl] = useState<string>('');
  const [srcUrl, setSrcUrl] = useState<string>('');
  const [viewMode, setViewMode] = useState<'original' | 'processed' | 'split'>(
    'split'
  );
  const [splitPos, setSplitPos] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement('canvas')
  );

  const hasImage = !!srcImageData;

  // ─── File loading ─────────────────────────────────────────────────────────

  const isRawFormat = (filename: string): boolean => {
    const rawExtensions = [
      '.raw',
      '.dng',
      '.nef',
      '.cr2',
      '.crw',
      '.arw',
      '.orf',
      '.raf',
      '.rw2',
      '.pef',
      '.srw',
      '.mrw',
      '.3fr',
      '.mef',
      '.mos',
    ];
    return rawExtensions.some((ext) =>
      filename.toLowerCase().endsWith(ext)
    );
  };

  const decodeImage = async (file: File): Promise<ImageData> => {
    setLoadingStage('Decoding image...');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = url;
    });

    try {
      const loaded = await loadPromise;
      setLoadingStage('Processing image...');
      const maxDim = 2400;
      let w = loaded.naturalWidth;
      let h = loaded.naturalHeight;

      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(loaded, 0, 0, w, h);
      return c.getContext('2d')!.getImageData(0, 0, w, h);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const decodeRaw = async (file: File): Promise<ImageData> => {
    try {
      setLoadingStage('Reading raw file...');
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Try canvas image loading first for formats browsers understand
      if (file.name.toLowerCase().endsWith('.dng')) {
        try {
          return await decodeStandardImage(new Blob([uint8Array], { type: 'image/tiff' }));
        } catch (e) {
          // Fall through to libraw
        }
      }

      // Use libraw for CR2, NEF, ARW, etc.
      return await decodeWithLibRaw(uint8Array);
    } catch (error) {
      throw new Error(
        `Raw decode failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const decodeStandardImage = async (blob: Blob): Promise<ImageData> => {
    setLoadingStage('Decoding image...');
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          setLoadingStage('Processing image...');
          const maxDim = 2400;
          let w = img.naturalWidth;
          let h = img.naturalHeight;

          if (w > maxDim || h > maxDim) {
            const scale = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }

          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.getContext('2d')!.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          resolve(c.getContext('2d')!.getImageData(0, 0, w, h));
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not decode as standard image format'));
      };

      img.src = url;
    });
  };

  const decodeWithLibRaw = async (uint8Array: Uint8Array): Promise<ImageData> => {
    try {
      setLoadingStage('Initializing RAW decoder...');
      const libraw = new LibRaw();

      setLoadingStage('Decoding RAW data...');
      await libraw.open(uint8Array, {
        bright: 1.0,
        useAutoWb: false,
        useCameraWb: true,
        outputColor: 1, // sRGB
        outputBps: 8, // 8 bits per sample
        userQual: 3, // interpolation quality
        halfSize: false,
      });

      setLoadingStage('Extracting image data...');
      const rawImageData = await libraw.imageData();

      if (!rawImageData) {
        throw new Error('Failed to extract image data from RAW file');
      }

      const { width, height, data, colors } = rawImageData;

      // Resize if too large
      const maxDim = 2400;
      let finalWidth = width;
      let finalHeight = height;

      if (width > maxDim || height > maxDim) {
        const scale = Math.min(maxDim / width, maxDim / height);
        finalWidth = Math.round(width * scale);
        finalHeight = Math.round(height * scale);
      }

      setLoadingStage('Converting to image format...');

      // Create the target canvas/imagedata
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = finalWidth;
      targetCanvas.height = finalHeight;
      const ctx = targetCanvas.getContext('2d')!;
      const imageData = ctx.createImageData(finalWidth, finalHeight);
      const imgData = imageData.data;

      // If we need to scale, first create a temporary canvas with original dimensions
      if (finalWidth !== width || finalHeight !== height) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d')!;
        const tempImageData = tempCtx.createImageData(width, height);
        const tempData = tempImageData.data;

        // Copy RGB data to temporary canvas
        for (let i = 0; i < Math.min(data.length, width * height * (colors || 3)); i += colors || 3) {
          const pixelIdx = i / (colors || 3);
          const dstIdx = pixelIdx * 4;

          tempData[dstIdx] = data[i] || 0;
          tempData[dstIdx + 1] = colors && colors > 1 ? (data[i + 1] || 0) : data[i] || 0;
          tempData[dstIdx + 2] = colors && colors > 2 ? (data[i + 2] || 0) : data[i] || 0;
          tempData[dstIdx + 3] = 255;
        }

        tempCtx.putImageData(tempImageData, 0, 0);

        // Scale to final size
        ctx.drawImage(tempCanvas, 0, 0, finalWidth, finalHeight);
        return ctx.getImageData(0, 0, finalWidth, finalHeight);
      } else {
        // No scaling needed - direct copy
        for (let i = 0; i < Math.min(data.length, width * height * (colors || 3)); i += colors || 3) {
          const pixelIdx = i / (colors || 3);
          const dstIdx = pixelIdx * 4;

          imgData[dstIdx] = data[i] || 0;
          imgData[dstIdx + 1] = colors && colors > 1 ? (data[i + 1] || 0) : data[i] || 0;
          imgData[dstIdx + 2] = colors && colors > 2 ? (data[i + 2] || 0) : data[i] || 0;
          imgData[dstIdx + 3] = 255;
        }

        return imageData;
      }
    } catch (error) {
      setLoadingStage('');
      throw new Error(
        `RAW decoder error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    setLoadError(null);
    setFileName(file.name);

    try {
      let imageData: ImageData;

      try {
        imageData = await decodeImage(file);
      } catch (stdError) {
        if (isRawFormat(file.name)) {
          imageData = await decodeRaw(file);
        } else {
          throw stdError;
        }
      }

      setLoadingStage('Analyzing image...');
      setSrcImageData(imageData);

      // Create preview URL
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = imageData.width;
      previewCanvas.height = imageData.height;
      previewCanvas
        .getContext('2d')!
        .putImageData(imageData, 0, 0);
      setSrcUrl(previewCanvas.toDataURL());

      // Auto-detect mask
      setLoadingStage('Detecting color mask...');
      const mask = detectOrangeMask(
        imageData.data,
        imageData.width,
        imageData.height
      );
      setParams({
        ...defaultParams,
        maskRed: Math.round(mask.r),
        maskGreen: Math.round(mask.g),
        maskBlue: Math.round(mask.b),
      });

      setLoading(false);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to load image'
      );
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) loadFile(acceptedFiles[0]);
    },
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.bmp', '.webp'],
      'application/octet-stream': [
        '.raw',
        '.dng',
        '.nef',
        '.cr2',
        '.arw',
        '.orf',
        '.raf',
        '.rw2',
        '.pef',
        '.srw',
        '.mrw',
        '.3fr',
      ],
    },
    multiple: false,
  });

  // ─── Processing ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!srcImageData) return;

    setProcessing(true);
    const timer = setTimeout(() => {
      const processed = processNegative(srcImageData, params);
      const canvas = outCanvasRef.current;
      canvas.width = processed.width;
      canvas.height = processed.height;
      canvas.getContext('2d')!.putImageData(processed, 0, 0);
      setOutUrl(canvas.toDataURL());
      setProcessing(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [srcImageData, params]);

  // ─── Download ─────────────────────────────────────────────────────────────

  const download = (format: 'jpeg' | 'png' = 'jpeg') => {
    if (!outCanvasRef.current) return;
    const link = document.createElement('a');
    const base = fileName.replace(/\.[^.]+$/, '') || 'converted';
    link.download = `${base}_positive.${format}`;
    if (format === 'png') {
      link.href = outCanvasRef.current.toDataURL('image/png');
    } else {
      link.href = outCanvasRef.current.toDataURL('image/jpeg', 0.95);
    }
    link.click();
  };

  if (!isOpen) return null;

  const hasOutUrl = !!outUrl && !processing;
  const debouncedProcessing = processing;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Negative Converter
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Convert camera-scanned film negatives to positives
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left sidebar - Controls */}
          <div className="w-72 bg-zinc-800/50 border-r border-zinc-700 overflow-y-auto p-4 space-y-4">
            {/* Film Type */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase">
                Film Type
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['color', 'bw'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setParams({ ...params, filmType: t })}
                    className={`py-2 px-3 rounded text-xs font-medium transition-all ${
                      params.filmType === t
                        ? 'bg-amber-400 text-zinc-900'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {t === 'color' ? 'Color' : 'B&W'}
                  </button>
                ))}
              </div>
            </div>

            {/* Orange Mask */}
            {params.filmType === 'color' && (
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase">
                  Orange Mask (RGB)
                </label>
                <div className="mt-2 space-y-1.5">
                  {(
                    ['maskRed', 'maskGreen', 'maskBlue'] as const
                  ).map((key, idx) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={params[key]}
                        onChange={(e) =>
                          setParams({
                            ...params,
                            [key]: parseInt(e.target.value),
                          })
                        }
                        className="flex-1 h-1.5 rounded"
                      />
                      <span className="text-xs text-zinc-400 w-8 text-right">
                        {params[key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exposure */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase">
                Exposure
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={params.exposure}
                onChange={(e) =>
                  setParams({ ...params, exposure: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 rounded mt-2"
              />
              <span className="text-xs text-zinc-400 inline-block mt-1">
                {params.exposure > 0 ? '+' : ''}
                {params.exposure.toFixed(1)}
              </span>
            </div>

            {/* Contrast */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase">
                Contrast
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={params.contrast}
                onChange={(e) =>
                  setParams({ ...params, contrast: parseInt(e.target.value) })
                }
                className="w-full h-1.5 rounded mt-2"
              />
              <span className="text-xs text-zinc-400 inline-block mt-1">
                {params.contrast}
              </span>
            </div>

            {/* Saturation */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase">
                Saturation
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={params.saturation}
                onChange={(e) =>
                  setParams({ ...params, saturation: parseInt(e.target.value) })
                }
                className="w-full h-1.5 rounded mt-2"
              />
              <span className="text-xs text-zinc-400 inline-block mt-1">
                {params.saturation}
              </span>
            </div>

            {/* Film Presets */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase">
                Film Stocks
              </label>
              <div className="mt-2 space-y-1">
                {FILM_PROFILES.slice(0, 8).map((film) => (
                  <button
                    key={film.name}
                    onClick={() => {
                      const mask = {
                        maskRed: params.maskRed,
                        maskGreen: params.maskGreen,
                        maskBlue: params.maskBlue,
                      };
                      setParams({
                        ...defaultParams,
                        ...film.params,
                        ...mask,
                      } as ProcessingParams);
                    }}
                    disabled={!hasImage}
                    className="w-full text-left px-2 py-1.5 rounded text-xs bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {film.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {hasImage && (
              <button
                onClick={() => {
                  const mask = detectOrangeMask(
                    srcImageData!.data,
                    srcImageData!.width,
                    srcImageData!.height
                  );
                  setParams({
                    ...defaultParams,
                    maskRed: Math.round(mask.r),
                    maskGreen: Math.round(mask.g),
                    maskBlue: Math.round(mask.b),
                  });
                }}
                className="w-full py-2 px-3 rounded text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-all"
              >
                Reset Settings
              </button>
            )}
          </div>

          {/* Center - Image preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            {hasImage && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-700 bg-zinc-800/50 flex-shrink-0">
                <div className="flex items-center gap-1 bg-zinc-700 rounded-lg p-1">
                  {(
                    ['original', 'processed', 'split'] as const
                  ).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                        viewMode === mode
                          ? 'bg-amber-400 text-zinc-900'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mode === 'split'
                        ? 'Compare'
                        : mode === 'processed'
                          ? 'After'
                          : 'Before'}
                    </button>
                  ))}
                </div>

                <div className="flex-1" />

                {hasOutUrl && (
                  <>
                    <button
                      onClick={() => download('jpeg')}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-900 rounded text-xs font-bold transition-colors"
                    >
                      JPEG
                    </button>
                    <button
                      onClick={() => download('png')}
                      className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-bold transition-colors"
                    >
                      PNG
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Canvas area */}
            <div className="flex-1 overflow-auto bg-zinc-950 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-50">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-amber-400 font-medium">{loadingStage}</p>
                  </div>
                </div>
              )}

              {!hasImage ? (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="w-full max-w-sm">
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                        isDragActive
                          ? 'border-amber-400 bg-amber-400/10'
                          : 'border-zinc-600 hover:border-zinc-500'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="text-4xl mb-4">📸</div>
                      <p className="text-white font-semibold mb-1">
                        Drop your negative here
                      </p>
                      <p className="text-xs text-zinc-400">
                        JPEG, PNG, TIFF, WebP, BMP or DNG RAW
                      </p>
                    </div>
                    {loadError && (
                      <div className="mt-4 p-3 rounded bg-red-500/20 border border-red-500/50 text-red-200 text-xs">
                        {loadError}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {viewMode === 'split' && srcUrl && hasOutUrl ? (
                    <div className="relative w-full h-full max-w-2xl max-h-full">
                      <img
                        src={srcUrl}
                        alt="Before"
                        className="w-full h-full object-contain"
                      />
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          clipPath: `inset(0 0 0 ${splitPos}%)`,
                        }}
                      >
                        <img
                          src={outUrl}
                          alt="After"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-amber-400 cursor-col-resize"
                        style={{ left: `${splitPos}%` }}
                        onMouseDown={(e) => {
                          const startX = e.clientX;
                          const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                          const handleMouseMove = (me: MouseEvent) => {
                            const newPos = Math.max(
                              0,
                              Math.min(
                                100,
                                ((me.clientX - rect.left) / rect.width) * 100
                              )
                            );
                            setSplitPos(newPos);
                          };
                          const handleMouseUp = () => {
                            document.removeEventListener(
                              'mousemove',
                              handleMouseMove
                            );
                            document.removeEventListener(
                              'mouseup',
                              handleMouseUp
                            );
                          };
                          document.addEventListener(
                            'mousemove',
                            handleMouseMove
                          );
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    </div>
                  ) : viewMode === 'original' && srcUrl ? (
                    <img
                      src={srcUrl}
                      alt="Original"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : hasOutUrl ? (
                    <img
                      src={outUrl}
                      alt="Converted"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-zinc-400">Processing...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
