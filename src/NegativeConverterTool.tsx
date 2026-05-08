import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { useDropzone } from 'react-dropzone';
import {
  defaultParams,
  processNegative,
  detectOrangeMask,
  type ProcessingParams,
} from './negativeConverter/imageProcessor';
import { FILM_PROFILES } from './negativeConverter/filmProfiles';
import { decodeImage } from './utils/imageDecoder';
import SliderControl from './components/SliderControl';
import SectionHeader from './components/SectionHeader';
import {
  ExposureIcon,
  ContrastIcon,
  SaturationIcon,
  WhiteBalanceIcon,
  GrainIconSmall,
  ResetIcon,
} from './App.helpers';

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

  const outCanvasRef = useRef<HTMLCanvasElement>(
    document.createElement('canvas')
  );

  const hasImage = !!srcImageData;

  // ─── File loading ─────────────────────────────────────────────────────────

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    setLoadError(null);
    setFileName(file.name);

    try {
      const imageData = await decodeImage(file, {
        maxDim: 2400,
        onProgress: setLoadingStage,
      });

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
          <div className="w-72 bg-zinc-800/50 border-r border-zinc-700 overflow-y-auto p-4">
            <ControlsPanel
              params={params}
              defaultParams={defaultParams}
              setParams={setParams}
              srcImageData={srcImageData}
              hasImage={hasImage}
              onReset={(newParams) => setParams(newParams)}
            />
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

// ─── Controls Panel Component ─────────────────────────────────────────────

interface SliderConfig {
  key: keyof ProcessingParams;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  icon?: React.ReactNode;
}

interface ControlsPanelProps {
  params: ProcessingParams;
  defaultParams: ProcessingParams;
  setParams: (p: ProcessingParams) => void;
  srcImageData: ImageData | null;
  hasImage: boolean;
  onReset: (params: ProcessingParams) => void;
}

function ControlsPanel({
  params,
  defaultParams,
  setParams,
  srcImageData,
  hasImage,
  onReset,
}: ControlsPanelProps) {
  // Slider configurations organized by section
  const sliderSections: Record<string, SliderConfig[]> = {
    exposure: [
      {
        key: 'exposure',
        label: 'Exposure',
        min: -2,
        max: 2,
        step: 0.1,
        format: (v) => (v > 0 ? '+' : '') + v.toFixed(1),
        icon: <ExposureIcon />,
      },
    ],
    tone: [
      {
        key: 'contrast',
        label: 'Contrast',
        min: -100,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
        icon: <ContrastIcon />,
      },
      {
        key: 'saturation',
        label: 'Saturation',
        min: -100,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
        icon: <SaturationIcon />,
      },
      {
        key: 'vibrance',
        label: 'Vibrance',
        min: -100,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
      },
      {
        key: 'highlights',
        label: 'Highlights',
        min: -100,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
      },
      {
        key: 'shadows',
        label: 'Shadows',
        min: -100,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
      },
      {
        key: 'whites',
        label: 'Whites',
        min: -100,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
      },
      {
        key: 'blacks',
        label: 'Blacks',
        min: -100,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
      },
    ],
    temperature: [
      {
        key: 'temperature',
        label: 'Temperature',
        min: -50,
        max: 50,
        step: 1,
        format: (v) => v.toString(),
        icon: <WhiteBalanceIcon />,
      },
      {
        key: 'tint',
        label: 'Tint',
        min: -50,
        max: 50,
        step: 1,
        format: (v) => v.toString(),
      },
    ],
    effects: [
      {
        key: 'sharpening',
        label: 'Sharpening',
        min: 0,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
      },
      {
        key: 'grainAmount',
        label: 'Grain',
        min: 0,
        max: 100,
        step: 1,
        format: (v) => v.toString(),
        icon: <GrainIconSmall />,
      },
    ],
  };

  const handleSliderChange = (key: keyof ProcessingParams, value: number | null) => {
    if (value === null) {
      // Reset to default
      setParams({ ...params, [key]: defaultParams[key] });
    } else {
      setParams({ ...params, [key]: value });
    }
  };

  const handleReset = () => {
    if (!srcImageData) return;
    const mask = detectOrangeMask(
      srcImageData.data,
      srcImageData.width,
      srcImageData.height
    );
    onReset({
      ...defaultParams,
      maskRed: Math.round(mask.r),
      maskGreen: Math.round(mask.g),
      maskBlue: Math.round(mask.b),
    });
  };

  return (
    <div className="space-y-4">
      {/* Film Type */}
      <div>
        <SectionHeader icon="📽️" title="Film Type" />
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
          <SectionHeader icon="🎭" title="Orange Mask" />
          <div className="mt-2 space-y-2">
            {(
              [
                { key: 'maskRed' as const, label: 'Red' },
                { key: 'maskGreen' as const, label: 'Green' },
                { key: 'maskBlue' as const, label: 'Blue' },
              ]
            ).map(({ key, label }) => (
              <SliderControl
                key={key}
                label={label}
                value={params[key]}
                min={0}
                max={255}
                step={1}
                defaultValue={defaultParams[key]}
                onChange={(v) => handleSliderChange(key, v)}
                format={(v) => v.toString()}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {Object.entries(sliderSections).map(([section, sliders]) => (
        <div key={section}>
          <SectionHeader
            icon={
              section === 'exposure'
                ? '☀️'
                : section === 'tone'
                  ? '🎨'
                  : section === 'temperature'
                    ? '🌡️'
                    : '✨'
            }
            title={
              section.charAt(0).toUpperCase() +
              section.slice(1).replace(/([A-Z])/g, ' $1')
            }
          />
          <div className="mt-2 space-y-2">
            {sliders.map((slider) => (
              <SliderControl
                key={slider.key}
                label={slider.label}
                value={params[slider.key] as number}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                defaultValue={defaultParams[slider.key] as number}
                onChange={(v) => handleSliderChange(slider.key, v)}
                format={slider.format}
                icon={slider.icon}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Film Presets */}
      <div>
        <SectionHeader icon="🎬" title="Film Stocks" />
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
          onClick={handleReset}
          className="w-full py-2 px-3 rounded text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-all flex items-center justify-center gap-2"
        >
          <ResetIcon />
          Reset Settings
        </button>
      )}
    </div>
  );
}
