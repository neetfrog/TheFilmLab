import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { filmPresets, FilmPreset } from './filmPresets';
import { processImage, ProcessingParams } from './filmProcessor';

// ─── Icons ───────────────────────────────────────────────
const UploadIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const CompareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);
const DiceIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
    <circle cx="8" cy="8" r="1" fill="currentColor" /><circle cx="16" cy="8" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="8" cy="16" r="1" fill="currentColor" /><circle cx="16" cy="16" r="1" fill="currentColor" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ResetIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

type FilmType = 'all' | 'color-negative' | 'bw-negative' | 'slide' | 'cinema';

const typeLabels: Record<FilmType, string> = {
  all: 'All Films',
  'color-negative': 'Color Neg',
  'bw-negative': 'B&W',
  slide: 'Slide',
  cinema: 'Cinema',
};

const typeColors: Record<string, string> = {
  'color-negative': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'bw-negative': 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25',
  slide: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  cinema: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

const typeBadge: Record<string, string> = {
  'color-negative': 'C-41',
  'bw-negative': 'B&W',
  slide: 'E-6',
  cinema: 'ECN',
};

// Demo image URLs (royalty free)
const DEMO_IMAGES = [
  { label: 'Portrait', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=80' },
  { label: 'Street', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80' },
  { label: 'Landscape', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80' },
  { label: 'Still Life', url: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=1200&q=80' },
];

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<FilmPreset>(filmPresets[0]);
  const [filterType, setFilterType] = useState<FilmType>('all');
  const [processing, setProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const [grainSeed, setGrainSeed] = useState(42);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [processTime, setProcessTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  // Override params
  const [grainAmount, setGrainAmount] = useState<number | null>(null);
  const [grainSize, setGrainSize] = useState<number | null>(null);
  const [grainRoughness, setGrainRoughness] = useState<number | null>(null);
  const [vignetteAmount, setVignetteAmount] = useState<number | null>(null);
  const [halationAmount, setHalationAmount] = useState<number | null>(null);
  const [contrastAmount, setContrastAmount] = useState<number | null>(null);
  const [saturationAmount, setSaturationAmount] = useState<number | null>(null);
  const [brightnessAmount, setBrightnessAmount] = useState<number | null>(null);
  const [fadedBlacks, setFadedBlacks] = useState<number | null>(null);
  const [exposure, setExposure] = useState(0);
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const processTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset overrides when preset changes
  useEffect(() => {
    setGrainAmount(null);
    setGrainSize(null);
    setGrainRoughness(null);
    setVignetteAmount(null);
    setHalationAmount(null);
    setContrastAmount(null);
    setSaturationAmount(null);
    setBrightnessAmount(null);
    setFadedBlacks(null);
    setExposure(0);
    setGrainSeed(Math.floor(Math.random() * 100000));
  }, [selectedPreset.id]);

  const currentParams: ProcessingParams = useMemo(() => ({
    grainAmountOverride: grainAmount ?? undefined,
    grainSizeOverride: grainSize ?? undefined,
    grainRoughnessOverride: grainRoughness ?? undefined,
    vignetteOverride: vignetteAmount ?? undefined,
    halationOverride: halationAmount ?? undefined,
    contrastOverride: contrastAmount ?? undefined,
    saturationOverride: saturationAmount ?? undefined,
    brightnessOverride: brightnessAmount ?? undefined,
    fadedBlacksOverride: fadedBlacks ?? undefined,
    exposureCompensation: exposure,
  }), [grainAmount, grainSize, grainRoughness, vignetteAmount, halationAmount, contrastAmount, saturationAmount, brightnessAmount, fadedBlacks, exposure]);

  // Optimized processing with adaptive debounce
  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);

    setProcessing(true);

    // Adaptive debounce: 40ms for fast feedback, increases slightly for slower interactions
    const debounceDelay = 45;

    processTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        const t0 = performance.now();
        const result = processImage(imageData, selectedPreset, currentParams, grainSeed);
        const elapsed = performance.now() - t0;
        setProcessTime(Math.round(elapsed));

        const canvas = canvasRef.current!;
        if (canvas) {
          canvas.width = result.width;
          canvas.height = result.height;
          const ctx = canvas.getContext('2d')!;
          ctx.putImageData(result, 0, 0);
        }

        // Cache processed image data for split view and fast switching
        setProcessedImageData(result);
        processedCanvasRef.current = canvas;
        setProcessing(false);
      });
    }, debounceDelay);

    return () => {
      if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
    };
  }, [imageData, selectedPreset, currentParams, grainSeed]);

  // Repaint original canvas when data or split mode changes.
  useEffect(() => {
    if (!imageData || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  }, [imageData, splitView]);

  // Repaint processed canvas when split mode changes and we have cached output.
  useEffect(() => {
    if (!processedImageData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;
    canvas.getContext('2d')!.putImageData(processedImageData, 0, 0);
  }, [processedImageData, splitView]);

  const loadImage = useCallback((img: HTMLImageElement) => {
    // Limit size for performance
    const maxDim = 1600;
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);

    setImage(img);
    setImageData(data);

    if (originalCanvasRef.current) {
      originalCanvasRef.current.width = w;
      originalCanvasRef.current.height = h;
      originalCanvasRef.current.getContext('2d')!.putImageData(data, 0, 0);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => loadImage(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [loadImage]);

  const handleDemo = useCallback((url: string) => {
    setLoadingDemo(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadImage(img);
      setLoadingDemo(false);
    };
    img.onerror = () => setLoadingDemo(false);
    img.src = url;
  }, [loadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${selectedPreset.brand}-${selectedPreset.name.replace(/\s+/g, '-')}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  }, [selectedPreset]);

  const handleRerollGrain = useCallback(() => {
    setGrainSeed(Math.floor(Math.random() * 100000));
  }, []);

  const resetOverrides = useCallback(() => {
    setGrainAmount(null);
    setGrainSize(null);
    setGrainRoughness(null);
    setVignetteAmount(null);
    setHalationAmount(null);
    setContrastAmount(null);
    setSaturationAmount(null);
    setBrightnessAmount(null);
    setFadedBlacks(null);
    setExposure(0);
  }, []);

  const filteredPresets = filterType === 'all'
    ? filmPresets
    : filmPresets.filter(p => p.type === filterType);

  // Effective values (override or preset default)
  const eff = {
    grainAmount: grainAmount ?? selectedPreset.grainAmount,
    grainSize: grainSize ?? selectedPreset.grainSize,
    grainRoughness: grainRoughness ?? selectedPreset.grainRoughness,
    vignette: vignetteAmount ?? selectedPreset.vignette,
    halation: halationAmount ?? selectedPreset.halation,
    contrast: contrastAmount ?? selectedPreset.contrast,
    saturation: saturationAmount ?? selectedPreset.saturation,
    brightness: brightnessAmount ?? selectedPreset.brightness,
    fadedBlacks: fadedBlacks ?? selectedPreset.fadedBlacks,
  };

  // Check if any overrides are active
  const hasOverrides = grainAmount !== null || grainSize !== null || grainRoughness !== null ||
    vignetteAmount !== null || halationAmount !== null || contrastAmount !== null ||
    saturationAmount !== null || brightnessAmount !== null || fadedBlacks !== null || exposure !== 0;

  // Split view mouse handling
  const handleSplitMove = useCallback((clientX: number) => {
    if (!draggingSplit || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(2, Math.min(98, x)));
  }, [draggingSplit]);

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl z-50 shrink-0">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors text-zinc-400 hover:text-zinc-200"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-amber-500/20">
              F
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight">FilmLab</h1>
              <p className="hidden md:block text-[9px] text-zinc-600 tracking-[0.2em] uppercase leading-tight">Analog Film Emulator</p>
            </div>
          </div>

          {image && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSplitView(!splitView)}
                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all border flex-shrink-0 ${
                  splitView
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                    : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border-zinc-700/50'
                }`}
              >
                <span className="inline-flex items-center justify-center">
                  <CompareIcon />
                </span>
                <span className="hidden md:inline ml-1.5">Compare</span>
              </button>
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all select-none flex items-center gap-1.5 flex-shrink-0 ${
                  showOriginal
                    ? 'bg-zinc-700 text-zinc-200 border-zinc-600'
                    : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border-zinc-700/50'
                }`}
              >
                <EyeIcon />
                <span className="hidden md:inline">Hold: Original</span>
              </button>
              <div className="w-px h-5 bg-zinc-800 mx-1" />
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 flex-shrink-0 whitespace-nowrap"
              >
                <DownloadIcon />
                <span className="hidden md:inline ml-1">Export JPG</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ─── */}
        <aside className={`${
          sidebarOpen ? 'w-[310px] min-w-[310px]' : 'w-0 min-w-0'
        } md:w-[310px] md:min-w-[310px] border-r border-zinc-800/50 bg-zinc-900/40 flex flex-col overflow-hidden transition-all duration-200 ${
          sidebarOpen ? 'md:relative fixed md:static top-16 left-0 right-auto bottom-0 z-40' : ''
        }`}>
          {/* Type Filter */}
          <div className="sticky top-0 z-10 px-3 pt-3 pb-2 border-b border-zinc-800/40 bg-zinc-900/40 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              {(Object.keys(typeLabels) as FilmType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    filterType === type
                      ? 'bg-zinc-700/80 text-zinc-100 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Film Stock + Controls scroll container */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-2 py-1.5 space-y-0.5">
              {filteredPresets.map(preset => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset);
                    }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all group relative ${
                    isSelected
                      ? 'bg-zinc-800/90 shadow-sm'
                      : 'hover:bg-zinc-800/40'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-500 rounded-r-full" />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">{preset.brand}</span>
                      </div>
                      <h3 className={`text-[13px] font-semibold leading-tight ${
                        isSelected ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}>
                        {preset.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] text-zinc-700 font-mono tabular-nums">{preset.iso}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${typeColors[preset.type]}`}>
                        {typeBadge[preset.type]}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">{preset.description}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── Controls ─── */}
          <div className="border-t border-zinc-800/50">
            {/* Tone Section */}
            <div className="px-3 pt-3 pb-1">
              <SectionHeader title="Tone" />
            </div>
            <div className="px-3 pb-2 space-y-1.5">
              <SliderControl label="Exposure" value={exposure} min={-2} max={2} step={0.05}
                defaultValue={0} onChange={(v) => setExposure(v ?? 0)} format={v => `${v > 0 ? '+' : ''}${v.toFixed(1)} EV`} />
              <SliderControl label="Contrast" value={eff.contrast} min={-0.5} max={0.5} step={0.01}
                defaultValue={selectedPreset.contrast} onChange={setContrastAmount} format={v => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}`} />
              <SliderControl label="Brightness" value={eff.brightness} min={-0.3} max={0.3} step={0.01}
                defaultValue={selectedPreset.brightness} onChange={setBrightnessAmount} format={v => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}`} />
              <SliderControl label="Saturation" value={eff.saturation} min={0} max={2} step={0.01}
                defaultValue={selectedPreset.saturation} onChange={setSaturationAmount} format={v => `${(v * 100).toFixed(0)}%`} />
              <SliderControl label="Faded Blacks" value={eff.fadedBlacks} min={0} max={0.25} step={0.005}
                defaultValue={selectedPreset.fadedBlacks} onChange={setFadedBlacks} format={v => `${(v * 100).toFixed(0)}%`} />
            </div>

            {/* Grain Section */}
            <div className="px-3 pt-1 pb-1 flex items-center justify-between">
              <SectionHeader title="Film Grain" />
              <button
                onClick={handleRerollGrain}
                className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-amber-400 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800/60"
                title="Randomize grain pattern"
              >
                <DiceIcon /> New Pattern
              </button>
            </div>
            <div className="px-3 pb-2 space-y-1.5">
              <SliderControl label="Amount" value={eff.grainAmount} min={0} max={1} step={0.01}
                defaultValue={selectedPreset.grainAmount} onChange={setGrainAmount} format={v => `${(v * 100).toFixed(0)}%`} />
              <SliderControl label="Size" value={eff.grainSize} min={0.3} max={5} step={0.1}
                defaultValue={selectedPreset.grainSize} onChange={setGrainSize} format={v => v.toFixed(1)} />
              <SliderControl label="Roughness" value={eff.grainRoughness} min={0} max={1} step={0.01}
                defaultValue={selectedPreset.grainRoughness} onChange={setGrainRoughness} format={v => `${(v * 100).toFixed(0)}%`} />
            </div>

            {/* Effects Section */}
            <div className="px-3 pt-1 pb-1">
              <SectionHeader title="Effects" />
            </div>
            <div className="px-3 pb-3 space-y-1.5">
              <SliderControl label="Vignette" value={eff.vignette} min={0} max={0.6} step={0.01}
                defaultValue={selectedPreset.vignette} onChange={setVignetteAmount} format={v => `${(v * 100).toFixed(0)}%`} />
              <SliderControl label="Halation" value={eff.halation} min={0} max={0.8} step={0.01}
                defaultValue={selectedPreset.halation} onChange={setHalationAmount} format={v => `${(v * 100).toFixed(0)}%`} />
            </div>

            {/* Reset */}
            {hasOverrides && (
              <div className="px-3 pb-3">
                <button
                  onClick={resetOverrides}
                  className="w-full py-1.5 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-200 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 transition-all flex items-center justify-center gap-1.5"
                >
                  <ResetIcon /> Reset All to Preset Defaults
                </button>
              </div>
            )}
          </div>
        </div>
        </aside>

        {/* Mobile overlay when sidebar is open */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── Main Canvas Area ─── */}
        <main className="flex-1 flex items-center justify-center bg-zinc-950 relative overflow-hidden">
          {!image ? (
            /* Upload / Demo area */
            <div className="flex flex-col items-center gap-6 max-w-lg px-6">
              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-amber-500/60', 'bg-amber-500/5'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('border-amber-500/60', 'bg-amber-500/5'); }}
                onDrop={(e) => { e.currentTarget.classList.remove('border-amber-500/60', 'bg-amber-500/5'); handleDrop(e); }}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center gap-3 p-10 border-2 border-dashed border-zinc-800 rounded-2xl hover:border-amber-500/40 hover:bg-zinc-900/30 transition-all w-full group"
              >
                <div className="text-zinc-700 group-hover:text-amber-500/60 transition-colors">
                  <UploadIcon />
                </div>
                <div className="text-center">
                  <p className="text-zinc-300 font-medium text-sm">Drop an image or click to upload</p>
                  <p className="text-zinc-700 text-xs mt-1">JPG, PNG, WebP — max 1600px</p>
                </div>
              </div>

              <div className="w-full">
                <p className="text-[10px] text-zinc-700 uppercase tracking-widest text-center mb-2">or try a sample</p>
                <div className="grid grid-cols-4 gap-2">
                  {DEMO_IMAGES.map(demo => (
                    <button
                      key={demo.label}
                      onClick={() => handleDemo(demo.url)}
                      disabled={loadingDemo}
                      className="aspect-[4/3] rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all overflow-hidden group relative"
                    >
                      <img
                        src={demo.url.replace('w=1200', 'w=200')}
                        alt={demo.label}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                        crossOrigin="anonymous"
                      />
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/80 font-medium bg-black/50 px-1.5 py-0.5 rounded">
                        {demo.label}
                      </span>
                    </button>
                  ))}
                </div>
                {loadingDemo && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500">Loading image...</span>
                  </div>
                )}
              </div>
            </div>
          ) : splitView ? (
            /* Split View */
            <div
              ref={splitContainerRef}
              className="relative w-full h-full flex items-center justify-center select-none"
              onMouseMove={(e) => handleSplitMove(e.clientX)}
              onMouseUp={() => setDraggingSplit(false)}
              onMouseLeave={() => setDraggingSplit(false)}
              onTouchMove={(e) => handleSplitMove(e.touches[0].clientX)}
              onTouchEnd={() => setDraggingSplit(false)}
            >
              <div className="relative inline-block max-w-full max-h-full">
                <canvas
                  ref={originalCanvasRef}
                  className="max-w-full max-h-[calc(100vh-52px)] object-contain block"
                />
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                >
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[calc(100vh-52px)] object-contain block"
                  />
                </div>
                {/* Split handle */}
                <div
                  className="absolute top-0 bottom-0 cursor-col-resize z-10"
                  style={{ left: `${splitPos}%`, transform: 'translateX(-50%)', width: '32px' }}
                  onMouseDown={() => setDraggingSplit(true)}
                  onTouchStart={() => setDraggingSplit(true)}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-white/60" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-xl flex items-center justify-center">
                    <span className="text-zinc-700 text-[10px] font-bold">⇔</span>
                  </div>
                </div>
                {/* Labels */}
                <div className="absolute top-2 left-2 bg-black/60 text-white/80 text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {selectedPreset.name}
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white/80 text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">
                  Original
                </div>
              </div>
            </div>
          ) : (
            /* Normal View */
            <div className="relative flex items-center justify-center w-full h-full p-4">
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-[calc(100vh-52px)] object-contain shadow-2xl transition-opacity duration-150 ${
                  showOriginal ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ imageRendering: 'auto' }}
              />
              {showOriginal && imageData && <OriginalOverlay imageData={imageData} />}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />

          {/* Processing indicator */}
          {processing && image && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-zinc-800/50">
              <div className="w-3 h-3 border-[1.5px] border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-zinc-500">Processing</span>
            </div>
          )}

          {/* Bottom info bar */}
          {image && !splitView && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/50 rounded-xl px-3 py-1.5 text-[11px]">
              <span className={`px-1.5 py-0.5 rounded border font-medium text-[9px] ${typeColors[selectedPreset.type]}`}>
                {typeBadge[selectedPreset.type]}
              </span>
              <span className="font-semibold text-zinc-200">{selectedPreset.brand} {selectedPreset.name}</span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-600 font-mono tabular-nums">ISO {selectedPreset.iso}</span>
              {imageData && (
                <>
                  <span className="text-zinc-700">|</span>
                  <span className="text-zinc-600 font-mono tabular-nums">{imageData.width}×{imageData.height}</span>
                </>
              )}
              {processTime > 0 && (
                <>
                  <span className="text-zinc-700">|</span>
                  <span className="text-zinc-700 font-mono tabular-nums">{processTime}ms</span>
                </>
              )}
              <span className="text-zinc-700">|</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-zinc-500 hover:text-amber-400 transition-colors font-medium"
              >
                Change
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]">{title}</h3>
  );
}

function SliderControl({
  label, value, min, max, step, defaultValue, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (v: number | null) => void;
  format: (v: number) => string;
}) {
  const isModified = Math.abs(value - defaultValue) > step * 0.5;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-0.5">
        <label className={`text-[11px] font-medium transition-colors ${isModified ? 'text-amber-500/80' : 'text-zinc-500'}`}>
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600 font-mono tabular-nums">{format(value)}</span>
          {isModified && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-zinc-700 hover:text-amber-400 transition-colors p-0.5"
              title="Reset"
            >
              <ResetIcon />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
}

function OriginalOverlay({ imageData }: { imageData: ImageData }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.width = imageData.width;
      ref.current.height = imageData.height;
      ref.current.getContext('2d')!.putImageData(imageData, 0, 0);
    }
  }, [imageData]);

  return (
    <canvas
      ref={ref}
      className="absolute max-w-full max-h-[calc(100vh-52px)] object-contain shadow-2xl"
    />
  );
}
