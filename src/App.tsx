import { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect, type ReactNode } from 'react';
import { filmPresets, FilmPreset } from './filmPresets';
import { processImage, ProcessingParams } from './filmProcessor';
import FramingTool from './FramingTool';
import logo from './favicon/logo.png';

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

const SectionIcon = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-800 text-zinc-400">
    {children}
  </span>
);

const LevelsIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 14V6m4 8V8m4 6V4m4 10V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SectionIcon>
);

const ToneIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 4V2m0 16v-2m8-6h2M0 10h2m14.14-5.86l1.42-1.42M2.44 17.56l1.42-1.42M17.56 17.56l-1.42-1.42M2.44 2.44l1.42 1.42" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  </SectionIcon>
);

const GrainIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <circle cx="14" cy="6" r="1.5" fill="currentColor" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
    </svg>
  </SectionIcon>
);

const EffectsIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 3l1.5 4.5L16 9l-4 2L11.5 16 10 12 6 14l2-4-4-2 4.5-.5L10 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SectionIcon>
);

const OpticalIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  </SectionIcon>
);

const OverlayIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <rect x="6" y="6" width="10" height="10" rx="1" fill="currentColor" opacity="0.15" />
    </svg>
  </SectionIcon>
);

const FrameIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="4" width="12" height="12" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4v4M4 8h4" strokeLinecap="round" />
    </svg>
  </SectionIcon>
);

const WhiteBalanceIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 4V2m0 16v-2m8-6h2M0 10h2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  </span>
);

const ExposureIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 5V3m0 14v-2m5-5h2M3 10H5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  </span>
);

const ContrastIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 4v12M6 4h8" strokeLinecap="round" />
    </svg>
  </span>
);

const BrightnessIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 6a4 4 0 100 8 4 4 0 000-8z" />
      <path d="M10 2v2M10 16v2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M2 10h2M16 10h2M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  </span>
);

const SaturationIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="3" fill="currentColor" />
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3" strokeLinecap="round" />
    </svg>
  </span>
);

const FadedBlacksIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 16h12M4 12h10M4 8h8M4 4h6" strokeLinecap="round" />
    </svg>
  </span>
);

const GrainIconSmall = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6h.01M10 10h.01M14 14h.01" strokeLinecap="round" />
    </svg>
  </span>
);

const VignetteIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="6" opacity="0.2" />
    </svg>
  </span>
);

const HalationIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="3" />
      <circle cx="10" cy="10" r="5" opacity="0.25" />
    </svg>
  </span>
);

const PurpleFringingIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="3" />
      <path d="M5 5l3 3M12 12l3 3" strokeLinecap="round" />
    </svg>
  </span>
);

const LensDistortionIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 10c2-4 6-4 8 0s6 4 8 0" strokeLinecap="round" />
    </svg>
  </span>
);

const ColorShiftIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 10h8M10 6l4 4-4 4" strokeLinecap="round" />
    </svg>
  </span>
);

const CropIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 3v4M6 3h4M14 17v-4M14 17h-4M17 6h-4M17 6v4M3 14h4M3 14v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SectionIcon>
);

const PresetIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h12M4 10h12M4 14h8" strokeLinecap="round" />
    </svg>
  </SectionIcon>
);

const SliderLabelIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="2" />
    </svg>
  </span>
);

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.262 3.885a1 1 0 00.95.69h4.084c.969 0 1.371 1.24.588 1.81l-3.305 2.405a1 1 0 00-.364 1.118l1.262 3.885c.3.921-.755 1.688-1.54 1.118l-3.305-2.405a1 1 0 00-1.176 0l-3.305 2.405c-.784.57-1.838-.197-1.539-1.118l1.262-3.885a1 1 0 00-.364-1.118L2.115 9.312c-.783-.57-.38-1.81.588-1.81h4.084a1 1 0 00.95-.69l1.262-3.885z" />
  </svg>
);

interface BatchImageEditState {
  selectedPreset: FilmPreset;
  frameColor: 'none' | 'white' | 'black';
  frameThickness: number;
  selectedOverlay: string | null;
  overlayOpacity: number;
  overlayBlend: BlendMode;
  selectedFrame: string | null;
  grainAmount: number | null;
  grainSize: number | null;
  grainRoughness: number | null;
  vignetteAmount: number | null;
  halationAmount: number | null;
  contrastAmount: number | null;
  saturationAmount: number | null;
  brightnessAmount: number | null;
  fadedBlacks: number | null;
  exposure: number;
  purpleFringing: number | null;
  lensDistortion: number | null;
  colorShiftX: number | null;
  colorShiftY: number | null;
  whiteBalance: number | null;
  levelsInputBlack: number | null;
  levelsInputWhite: number | null;
  levelsGamma: number | null;
  levelsOutputBlack: number | null;
  levelsOutputWhite: number | null;
}

interface BatchImage {
  id: string;
  file?: File;
  url: string;
  width: number;
  height: number;
  name: string;
  data: ImageData;
  thumbUrl?: string;
  editState: BatchImageEditState;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CropDragType = 'move' | 'nw' | 'ne' | 'sw' | 'se';

interface HistoryEntry {
  imageData: ImageData;
  selectedPreset: FilmPreset;
  grainAmount: number | null;
  grainSize: number | null;
  grainRoughness: number | null;
  vignetteAmount: number | null;
  halationAmount: number | null;
  contrastAmount: number | null;
  saturationAmount: number | null;
  brightnessAmount: number | null;
  fadedBlacks: number | null;
  exposure: number;
  purpleFringing: number | null;
  lensDistortion: number | null;
  colorShiftX: number | null;
  colorShiftY: number | null;
  whiteBalance: number | null;
  levelsInputBlack: number | null;
  levelsInputWhite: number | null;
  levelsGamma: number | null;
  levelsOutputBlack: number | null;
  levelsOutputWhite: number | null;
  frameColor: 'none' | 'white' | 'black';
  frameThickness: number;
  selectedOverlay: string | null;
  overlayOpacity: number;
  overlayBlend: BlendMode;
  selectedFrame: string | null;
  activeBatchIndex: number | null;
}

const PRESET_STORAGE_KEY = 'filmLabCustomPresets';
const FAVORITES_STORAGE_KEY = 'filmLabFavorites';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

type FilmType = 'all' | 'color-negative' | 'bw-negative' | 'slide' | 'cinema';

const typeLabels: Record<FilmType, string> = {
  all: 'All',
  'color-negative': 'Color',
  'bw-negative': 'B&W',
  slide: 'Slide',
  cinema: 'Cine',
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

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

// ─── Overlay / Frame Assets ───────────────────────────────────────────────────
type OverlayCategory = 'lightleaks' | 'bokeh' | 'textures';
type BlendMode = 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'normal';

const OVERLAYS: Record<OverlayCategory, { label: string; urls: string[]; thumbs: string[]; defaultBlend: BlendMode }> = {
  lightleaks: {
    label: 'Light Leaks',
    urls: Object.values(import.meta.glob('./overlays/lightleak*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>).sort(),
    thumbs: Object.values(import.meta.glob('./overlays/thumbs/lightleak*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>).sort(),
    defaultBlend: 'screen',
  },
  bokeh: {
    label: 'Bokeh',
    urls: Object.values(import.meta.glob('./overlays/bokeh*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>).sort(),
    thumbs: Object.values(import.meta.glob('./overlays/thumbs/bokeh*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>).sort(),
    defaultBlend: 'screen',
  },
  textures: {
    label: 'Textures',
    urls: Object.values(import.meta.glob('./overlays/texture*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>).sort(),
    thumbs: Object.values(import.meta.glob('./overlays/thumbs/texture*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>).sort(),
    defaultBlend: 'multiply',
  },
};

const FRAME_URLS = Object.values(
  import.meta.glob('./frames/*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>
).sort();

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'screen',     label: 'Screen'   },
  { value: 'multiply',   label: 'Multiply' },
  { value: 'overlay',    label: 'Overlay'  },
  { value: 'soft-light', label: 'Soft'     },
  { value: 'normal',     label: 'Normal'   },
];

const CANVAS_BLEND: Record<BlendMode, GlobalCompositeOperation> = {
  screen:      'screen',
  multiply:    'multiply',
  overlay:     'overlay',
  'soft-light':'soft-light',
  normal:      'source-over',
};

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const imgAR = img.naturalWidth / img.naturalHeight;
  const canvasAR = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgAR > canvasAR) {
    sw = img.naturalHeight * canvasAR;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasAR;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

function rotateImageData(source: ImageData, angle: number): ImageData {
  const normalized = ((angle % 360) + 360) % 360;
  const swap = normalized === 90 || normalized === 270;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? source.height : source.width;
  canvas.height = swap ? source.width : source.height;
  const ctx = canvas.getContext('2d')!;

  const temp = document.createElement('canvas');
  temp.width = source.width;
  temp.height = source.height;
  temp.getContext('2d')!.putImageData(source, 0, 0);

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(temp, -source.width / 2, -source.height / 2);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function cropImageData(source: ImageData, ratio: 'original' | '1:1' | '4:3' | '16:9'): ImageData {
  if (ratio === 'original') return source;

  const targetRatio = ratio === '1:1' ? 1 : ratio === '4:3' ? 4 / 3 : 16 / 9;
  const width = source.width;
  const height = source.height;
  let cropWidth = width;
  let cropHeight = height;

  if (width / height > targetRatio) {
    cropWidth = Math.round(height * targetRatio);
  } else {
    cropHeight = Math.round(width / targetRatio);
  }

  const cropX = Math.round((width - cropWidth) / 2);
  const cropY = Math.round((height - cropHeight) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext('2d')!;

  const temp = document.createElement('canvas');
  temp.width = width;
  temp.height = height;
  temp.getContext('2d')!.putImageData(source, 0, 0);

  ctx.drawImage(temp, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return ctx.getImageData(0, 0, cropWidth, cropHeight);
}

function cropImageDataRect(source: ImageData, rect: CropRect): ImageData {
  const cropX = Math.round(rect.x * source.width);
  const cropY = Math.round(rect.y * source.height);
  const cropWidth = Math.round(rect.w * source.width);
  const cropHeight = Math.round(rect.h * source.height);

  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext('2d')!;

  const temp = document.createElement('canvas');
  temp.width = source.width;
  temp.height = source.height;
  temp.getContext('2d')!.putImageData(source, 0, 0);

  ctx.drawImage(temp, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return ctx.getImageData(0, 0, cropWidth, cropHeight);
}

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<FilmPreset>(filmPresets[0]);
  const [customPresets, setCustomPresets] = useState<FilmPreset[]>(() => loadFromStorage<FilmPreset[]>(PRESET_STORAGE_KEY, []));
  const [favorites, setFavorites] = useState<string[]>(() => loadFromStorage<string[]>(FAVORITES_STORAGE_KEY, []));
  const [customPresetName, setCustomPresetName] = useState('');
  const [customPresetDescription, setCustomPresetDescription] = useState('');
  const [batchImages, setBatchImages] = useState<BatchImage[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState<number | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropRatio, setCropRatio] = useState<'original' | '1:1' | '4:3' | '16:9'>('original');
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [draggingCrop, setDraggingCrop] = useState(false);
  const cropDragRef = useRef<{ startX: number; startY: number; startRect: CropRect | null; type: CropDragType } | null>(null);
  const [canvasBounds, setCanvasBounds] = useState<DOMRect | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [filterType, setFilterType] = useState<FilmType>('all');
  const [processing, setProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const [frameColor, setFrameColor] = useState<'none' | 'white' | 'black'>('none');
  const [frameThickness, setFrameThickness] = useState(8); // percentage of container
  const [grainSeed, setGrainSeed] = useState(42);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [processTime, setProcessTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.1;

  // Overlay / Frame
  const [overlayCategory, setOverlayCategory] = useState<OverlayCategory>('lightleaks');
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [overlayBlend, setOverlayBlend] = useState<BlendMode>('screen');
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);

  // Framing tool modal state
  const [framingToolOpen, setFramingToolOpen] = useState(false);

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
  const [purpleFringing, setPurpleFringing] = useState<number | null>(null);
  const [lensDistortion, setLensDistortion] = useState<number | null>(null);
  const [colorShiftX, setColorShiftX] = useState<number | null>(null);
  const [colorShiftY, setColorShiftY] = useState<number | null>(null);
  const [whiteBalance, setWhiteBalance] = useState<number | null>(null);
  const [levelsInputBlack, setLevelsInputBlack] = useState<number | null>(null);
  const [levelsInputWhite, setLevelsInputWhite] = useState<number | null>(null);
  const [levelsGamma, setLevelsGamma] = useState<number | null>(null);
  const [levelsOutputBlack, setLevelsOutputBlack] = useState<number | null>(null);
  const [levelsOutputWhite, setLevelsOutputWhite] = useState<number | null>(null);
  const [processedImageData, setProcessedImageData] = useState<ImageData | null>(null);

  const getCurrentBatchEditState = useCallback((): BatchImageEditState => ({
    selectedPreset,
    frameColor,
    frameThickness,
    selectedOverlay,
    overlayOpacity,
    overlayBlend,
    selectedFrame,
    grainAmount,
    grainSize,
    grainRoughness,
    vignetteAmount,
    halationAmount,
    contrastAmount,
    saturationAmount,
    brightnessAmount,
    fadedBlacks,
    exposure,
    purpleFringing,
    lensDistortion,
    colorShiftX,
    colorShiftY,
    whiteBalance,
    levelsInputBlack,
    levelsInputWhite,
    levelsGamma,
    levelsOutputBlack,
    levelsOutputWhite,
  }), [
    selectedPreset,
    frameColor,
    frameThickness,
    selectedOverlay,
    overlayOpacity,
    overlayBlend,
    selectedFrame,
    grainAmount,
    grainSize,
    grainRoughness,
    vignetteAmount,
    halationAmount,
    contrastAmount,
    saturationAmount,
    brightnessAmount,
    fadedBlacks,
    exposure,
    purpleFringing,
    lensDistortion,
    colorShiftX,
    colorShiftY,
    whiteBalance,
    levelsInputBlack,
    levelsInputWhite,
    levelsGamma,
    levelsOutputBlack,
    levelsOutputWhite,
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const processTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);

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
    setPurpleFringing(null);
    setLensDistortion(null);
    setColorShiftX(null);
    setColorShiftY(null);
    setWhiteBalance(null);
    setLevelsInputBlack(null);
    setLevelsInputWhite(null);
    setLevelsGamma(null);
    setLevelsOutputBlack(null);
    setLevelsOutputWhite(null);
    setGrainSeed(Math.floor(Math.random() * 100000));
  }, [selectedPreset.id]);

  // Keep compare and hold-original states in sync
  useEffect(() => {
    // Never show original overlay during split view; on exit ensure processed remains visible.
    if (splitView) {
      setShowOriginal(false);
    }
  }, [splitView]);

  // Ensure processed canvas gets redrawn on exit compare mode.
  useEffect(() => {
    if (!splitView && processedImageData && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = processedImageData.width;
      canvas.height = processedImageData.height;
      canvas.getContext('2d')!.putImageData(processedImageData, 0, 0);
    }
  }, [splitView, processedImageData]);

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
    purpleFringingOverride: purpleFringing ?? undefined,
    lensDistortionOverride: lensDistortion ?? undefined,
    colorShiftXOverride: colorShiftX ?? undefined,
    colorShiftYOverride: colorShiftY ?? undefined,
    whiteBalanceOverride: whiteBalance ?? undefined,
    levelsInputBlackOverride: levelsInputBlack ?? undefined,
    levelsInputWhiteOverride: levelsInputWhite ?? undefined,
    levelsGammaOverride: levelsGamma ?? undefined,
    levelsOutputBlackOverride: levelsOutputBlack ?? undefined,
    levelsOutputWhiteOverride: levelsOutputWhite ?? undefined,
  }), [grainAmount, grainSize, grainRoughness, vignetteAmount, halationAmount, contrastAmount, saturationAmount, brightnessAmount, fadedBlacks, exposure, purpleFringing, lensDistortion, colorShiftX, colorShiftY, whiteBalance, levelsInputBlack, levelsInputWhite, levelsGamma, levelsOutputBlack, levelsOutputWhite]);

  const frameBackground = frameColor === 'white' ? '#ffffff' : frameColor === 'black' ? '#000000' : 'transparent';
  const framePadding = frameColor !== 'none' ? `${frameThickness}%` : '0';

  // Optimized processing with debounce to keep slider dragging responsive.
  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);

    const debounceDelay = 80;
    processTimeoutRef.current = setTimeout(() => {
      setProcessing(true);
      requestAnimationFrame(() => {
        const t0 = performance.now();
        const result = processImage(imageData, selectedPreset, currentParams, grainSeed);
        const elapsed = performance.now() - t0;
        setProcessTime(Math.round(elapsed));

        const canvas = canvasRef.current!;
        canvas.width = result.width;
        canvas.height = result.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(result, 0, 0);

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

  // Repaint original canvas when data changes (not on splitView toggle)
  useEffect(() => {
    if (!imageData || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  }, [imageData]);

  // Repaint processed canvas when data changes (not on splitView toggle)
  useEffect(() => {
    if (!processedImageData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;
    canvas.getContext('2d')!.putImageData(processedImageData, 0, 0);
  }, [processedImageData]);

  // In split view, ensure canvases are properly aligned and sized
  useEffect(() => {
    if (!splitView || !imageData) return;
    
    // Make sure original canvas is always original image
    if (originalCanvasRef.current) {
      originalCanvasRef.current.width = imageData.width;
      originalCanvasRef.current.height = imageData.height;
      originalCanvasRef.current.getContext('2d')!.putImageData(imageData, 0, 0);
    }
    
    // For processed canvas in split view, match original dimensions if possible
    if (canvasRef.current && processedImageData) {
      // If sizes match, use as-is; if not, we'll center it
      canvasRef.current.width = processedImageData.width;
      canvasRef.current.height = processedImageData.height;
      canvasRef.current.getContext('2d')!.putImageData(processedImageData, 0, 0);
    }
  }, [splitView, imageData, processedImageData]);

  // Preload overlay / frame images so they're ready for canvas export
  useEffect(() => {
    if (!selectedOverlay) { overlayImgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { overlayImgRef.current = img; };
    img.src = selectedOverlay;
  }, [selectedOverlay]);

  useEffect(() => {
    if (!selectedFrame) { frameImgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { frameImgRef.current = img; };
    img.src = selectedFrame;
  }, [selectedFrame]);

  const loadImage = useCallback((img: HTMLImageElement) => {
    // Limit size for performance (increased max for local computation)
    const maxDim = 3200;
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
    originalImageDataRef.current = data;
    setHistory([]);
    setRedoStack([]);
    setCropMode(false);
    setCropRect(null);
    setSelectedPreset(filmPresets[0]);

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

  const addBatchEntry = useCallback((entry: BatchImage) => {
    setBatchImages((prev) => {
      const next = [...prev, entry];
      setActiveBatchIndex(next.length - 1);
      return next;
    });
    const img = new Image();
    img.src = entry.url;
    setImage(img);
    setImageData(entry.data);
    originalImageDataRef.current = entry.data;
    setSelectedPreset(entry.editState.selectedPreset);
    setFrameColor(entry.editState.frameColor);
    setFrameThickness(entry.editState.frameThickness);
    setSelectedOverlay(entry.editState.selectedOverlay);
    setOverlayOpacity(entry.editState.overlayOpacity);
    setOverlayBlend(entry.editState.overlayBlend);
    setSelectedFrame(entry.editState.selectedFrame);
    setGrainAmount(entry.editState.grainAmount);
    setGrainSize(entry.editState.grainSize);
    setGrainRoughness(entry.editState.grainRoughness);
    setVignetteAmount(entry.editState.vignetteAmount);
    setHalationAmount(entry.editState.halationAmount);
    setContrastAmount(entry.editState.contrastAmount);
    setSaturationAmount(entry.editState.saturationAmount);
    setBrightnessAmount(entry.editState.brightnessAmount);
    setFadedBlacks(entry.editState.fadedBlacks);
    setExposure(entry.editState.exposure);
    setPurpleFringing(entry.editState.purpleFringing);
    setLensDistortion(entry.editState.lensDistortion);
    setColorShiftX(entry.editState.colorShiftX);
    setColorShiftY(entry.editState.colorShiftY);
    setWhiteBalance(entry.editState.whiteBalance);
    setHistory([]);
    setRedoStack([]);
    setCropMode(false);
    setCropRect(null);
  }, [getCurrentBatchEditState]);

  const handleBatchFiles = useCallback((files: FileList | File[]) => {
    const useNeutralPreset = batchImages.length === 0;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (!result || typeof result !== 'string') return;

        const img = new Image();
        img.onload = () => {
          const maxDim = 3200;
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
          addBatchEntry({
            id: `${file.name}-${Date.now()}`,
            file,
            url: result,
            width: w,
            height: h,
            name: file.name,
            data,
            thumbUrl: result,
            editState: {
              ...getCurrentBatchEditState(),
              selectedPreset: useNeutralPreset ? filmPresets[0] : getCurrentBatchEditState().selectedPreset,
            },
          });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
  }, [addBatchEntry, batchImages.length]);

  const handleDemo = useCallback((url: string) => {
    setLoadingDemo(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxDim = 3200;
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
      addBatchEntry({
        id: `demo-${Date.now()}`,
        url,
        width: w,
        height: h,
        name: 'Sample',
        data,
        thumbUrl: url,
        editState: {
          ...getCurrentBatchEditState(),
          selectedPreset: batchImages.length === 0 ? filmPresets[0] : getCurrentBatchEditState().selectedPreset,
        },
      });
      setLoadingDemo(false);
    };
    img.onerror = () => setLoadingDemo(false);
    img.src = url;
  }, [addBatchEntry, batchImages.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleBatchFiles(files);
    }
  }, [handleBatchFiles]);

  const selectBatchImage = useCallback((index: number) => {
    const entry = batchImages[index];
    if (!entry) return;

    if (activeBatchIndex !== null) {
      setBatchImages((prev) => prev.map((item, idx) => idx === activeBatchIndex ? { ...item, editState: getCurrentBatchEditState() } : item));
    }

    setActiveBatchIndex(index);
    setSelectedPreset(entry.editState.selectedPreset);
    setFrameColor(entry.editState.frameColor);
    setFrameThickness(entry.editState.frameThickness);
    setSelectedOverlay(entry.editState.selectedOverlay);
    setOverlayOpacity(entry.editState.overlayOpacity);
    setOverlayBlend(entry.editState.overlayBlend);
    setSelectedFrame(entry.editState.selectedFrame);
    setGrainAmount(entry.editState.grainAmount);
    setGrainSize(entry.editState.grainSize);
    setGrainRoughness(entry.editState.grainRoughness);
    setVignetteAmount(entry.editState.vignetteAmount);
    setHalationAmount(entry.editState.halationAmount);
    setContrastAmount(entry.editState.contrastAmount);
    setSaturationAmount(entry.editState.saturationAmount);
    setBrightnessAmount(entry.editState.brightnessAmount);
    setFadedBlacks(entry.editState.fadedBlacks);
    setExposure(entry.editState.exposure);
    setPurpleFringing(entry.editState.purpleFringing);
    setLensDistortion(entry.editState.lensDistortion);
    setColorShiftX(entry.editState.colorShiftX);
    setColorShiftY(entry.editState.colorShiftY);
    setWhiteBalance(entry.editState.whiteBalance);
    setLevelsInputBlack(entry.editState.levelsInputBlack);
    setLevelsInputWhite(entry.editState.levelsInputWhite);
    setLevelsGamma(entry.editState.levelsGamma);
    setLevelsOutputBlack(entry.editState.levelsOutputBlack);
    setLevelsOutputWhite(entry.editState.levelsOutputWhite);

    const img = new Image();
    img.src = entry.url;
    setImage(img);
    setImageData(entry.data);
    originalImageDataRef.current = entry.data;
    setHistory([]);
    setRedoStack([]);
    setCropMode(false);
    setCropRect(null);
  }, [activeBatchIndex, batchImages, getCurrentBatchEditState]);

  useEffect(() => {
    if (activeBatchIndex === null) return;
    const editState = getCurrentBatchEditState();
    setBatchImages((prev) => prev.map((entry, idx) => idx === activeBatchIndex ? { ...entry, editState } : entry));
  }, [activeBatchIndex, getCurrentBatchEditState]);

  useEffect(() => {
    if (activeBatchIndex === null || !processedCanvasRef.current) return;
    const source = processedCanvasRef.current;
    const maxDim = 120;
    const scale = Math.min(1, maxDim / Math.max(source.width || 1, source.height || 1));
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = Math.max(1, Math.round(source.width * scale));
    thumbCanvas.height = Math.max(1, Math.round(source.height * scale));
    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(source, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
    setBatchImages((prev) => prev.map((entry, idx) => idx === activeBatchIndex ? { ...entry, thumbUrl } : entry));
  }, [processedImageData, activeBatchIndex]);

  const createSnapshot = useCallback((): HistoryEntry | null => {
    if (!imageData) return null;
    return {
      imageData: new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height),
      selectedPreset,
      grainAmount,
      grainSize,
      grainRoughness,
      vignetteAmount,
      halationAmount,
      contrastAmount,
      saturationAmount,
      brightnessAmount,
      fadedBlacks,
      exposure,
      purpleFringing,
      lensDistortion,
      colorShiftX,
      colorShiftY,
      whiteBalance,
      levelsInputBlack,
      levelsInputWhite,
      levelsGamma,
      levelsOutputBlack,
      levelsOutputWhite,
      frameColor,
      frameThickness,
      selectedOverlay,
      overlayOpacity,
      overlayBlend,
      selectedFrame,
      activeBatchIndex,
    };
  }, [imageData, selectedPreset, grainAmount, grainSize, grainRoughness, vignetteAmount, halationAmount, contrastAmount, saturationAmount, brightnessAmount, fadedBlacks, exposure, purpleFringing, lensDistortion, colorShiftX, colorShiftY, whiteBalance, frameColor, frameThickness, selectedOverlay, overlayOpacity, overlayBlend, selectedFrame, activeBatchIndex]);

  const restoreSnapshot = useCallback((snapshot: HistoryEntry) => {
    setImageData(snapshot.imageData);
    originalImageDataRef.current = snapshot.imageData;
    setImage(new Image());
    setSelectedPreset(snapshot.selectedPreset);
    setGrainAmount(snapshot.grainAmount);
    setGrainSize(snapshot.grainSize);
    setGrainRoughness(snapshot.grainRoughness);
    setVignetteAmount(snapshot.vignetteAmount);
    setHalationAmount(snapshot.halationAmount);
    setContrastAmount(snapshot.contrastAmount);
    setSaturationAmount(snapshot.saturationAmount);
    setBrightnessAmount(snapshot.brightnessAmount);
    setFadedBlacks(snapshot.fadedBlacks);
    setExposure(snapshot.exposure);
    setPurpleFringing(snapshot.purpleFringing);
    setLensDistortion(snapshot.lensDistortion);
    setColorShiftX(snapshot.colorShiftX);
    setColorShiftY(snapshot.colorShiftY);
    setWhiteBalance(snapshot.whiteBalance);
    setLevelsInputBlack(snapshot.levelsInputBlack);
    setLevelsInputWhite(snapshot.levelsInputWhite);
    setLevelsGamma(snapshot.levelsGamma);
    setLevelsOutputBlack(snapshot.levelsOutputBlack);
    setLevelsOutputWhite(snapshot.levelsOutputWhite);
    setFrameColor(snapshot.frameColor);
    setFrameThickness(snapshot.frameThickness);
    setSelectedOverlay(snapshot.selectedOverlay);
    setOverlayOpacity(snapshot.overlayOpacity);
    setOverlayBlend(snapshot.overlayBlend);
    setSelectedFrame(snapshot.selectedFrame);
    setActiveBatchIndex(snapshot.activeBatchIndex);
  }, []);

  const pushHistory = useCallback(() => {
    const snapshot = createSnapshot();
    if (!snapshot) return;
    setHistory((prev) => [...prev, snapshot].slice(-30));
    setRedoStack([]);
  }, [createSnapshot]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const current = createSnapshot();
    if (current) {
      setRedoStack((prev) => [current, ...prev].slice(0, 30));
    }
    setHistory((prev) => prev.slice(0, -1));
    restoreSnapshot(previous);
  }, [history, createSnapshot, restoreSnapshot]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    const current = createSnapshot();
    if (current) {
      setHistory((prev) => [...prev, current].slice(-30));
    }
    setRedoStack((prev) => prev.slice(1));
    restoreSnapshot(next);
  }, [redoStack, createSnapshot, restoreSnapshot]);

  const toggleFavorite = useCallback((presetId: string) => {
    setFavorites((prev) => prev.includes(presetId) ? prev.filter((id) => id !== presetId) : [...prev, presetId]);
  }, []);

  const handleDownloadBatch = useCallback(async () => {
    if (batchImages.length === 0) return;
    setProcessing(true);
    for (const entry of batchImages) {
      const editState = entry.editState || getCurrentBatchEditState();
      const params: ProcessingParams = {
        grainAmountOverride: editState.grainAmount ?? undefined,
        grainSizeOverride: editState.grainSize ?? undefined,
        grainRoughnessOverride: editState.grainRoughness ?? undefined,
        vignetteOverride: editState.vignetteAmount ?? undefined,
        halationOverride: editState.halationAmount ?? undefined,
        contrastOverride: editState.contrastAmount ?? undefined,
        saturationOverride: editState.saturationAmount ?? undefined,
        brightnessOverride: editState.brightnessAmount ?? undefined,
        fadedBlacksOverride: editState.fadedBlacks ?? undefined,
        exposureCompensation: editState.exposure,
        purpleFringingOverride: editState.purpleFringing ?? undefined,
        lensDistortionOverride: editState.lensDistortion ?? undefined,
        colorShiftXOverride: editState.colorShiftX ?? undefined,
        colorShiftYOverride: editState.colorShiftY ?? undefined,
        whiteBalanceOverride: editState.whiteBalance ?? undefined,
      };

      const result = processImage(entry.data, editState.selectedPreset, params, grainSeed);
      const canvas = document.createElement('canvas');
      canvas.width = result.width;
      canvas.height = result.height;
      canvas.getContext('2d')!.putImageData(result, 0, 0);
      const link = document.createElement('a');
      const name = entry.file?.name.replace(/\.[^/.]+$/, '') || entry.name || 'batch-image';
      link.download = `${name}-${editState.selectedPreset.name.replace(/\s+/g, '-')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
    setProcessing(false);
  }, [batchImages, getCurrentBatchEditState, grainSeed]);

  useEffect(() => {
    saveToStorage(PRESET_STORAGE_KEY, customPresets);
  }, [customPresets]);

  useEffect(() => {
    saveToStorage(FAVORITES_STORAGE_KEY, favorites);
  }, [favorites]);

  useLayoutEffect(() => {
    const updateBounds = () => {
      if (canvasRef.current) {
        setCanvasBounds(canvasRef.current.getBoundingClientRect());
      }
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [imageData, zoom, splitView, cropMode]);

  useEffect(() => {
    if (!imageData || !cropMode) return;

    const targetRatio = cropRatio === 'original'
      ? imageData.width / imageData.height
      : cropRatio === '1:1'
        ? 1
        : cropRatio === '4:3'
          ? 4 / 3
          : 16 / 9;

    const width = imageData.width;
    const height = imageData.height;
    let cropWidth = width;
    let cropHeight = height;

    if (width / height > targetRatio) {
      cropWidth = Math.round(height * targetRatio);
    } else {
      cropHeight = Math.round(width / targetRatio);
    }

    setCropRect({
      x: (width - cropWidth) / 2 / width,
      y: (height - cropHeight) / 2 / height,
      w: cropWidth / width,
      h: cropHeight / height,
    });
  }, [imageData, cropMode, cropRatio]);

  const applyRotation = useCallback((angle: number) => {
    if (!imageData) return;
    pushHistory();
    const rotated = rotateImageData(imageData, angle);
    setImageData(rotated);
    originalImageDataRef.current = rotated;
    setProcessedImageData(null);
  }, [imageData, pushHistory]);

  const applyCrop = useCallback(() => {
    if (!imageData || !cropRect) return;
    pushHistory();
    const cropped = cropImageDataRect(imageData, cropRect);
    setImageData(cropped);
    originalImageDataRef.current = cropped;
    setProcessedImageData(null);
    setCropMode(false);
    setCropRect(null);
  }, [imageData, cropRect, pushHistory]);

  const onCropPointerDown = useCallback((type: CropDragType) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cropRect || !canvasBounds) return;
    e.preventDefault();
    e.stopPropagation();
    cropDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRect: cropRect,
      type,
    };
    setDraggingCrop(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [cropRect, canvasBounds]);

  const onCropPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingCrop || !cropRect || !cropDragRef.current || !canvasBounds) return;
    e.preventDefault();
    const dx = (e.clientX - cropDragRef.current.startX) / canvasBounds.width;
    const dy = (e.clientY - cropDragRef.current.startY) / canvasBounds.height;
    const start = cropDragRef.current.startRect;
    if (!start) return;

    const aspectRatio = cropRatio === 'original'
      ? start.w / start.h
      : cropRatio === '1:1'
        ? 1
        : cropRatio === '4:3'
          ? 4 / 3
          : 16 / 9;

    const clampRect = (rect: CropRect) => {
      let x = rect.x;
      let y = rect.y;
      let w = Math.max(minSize, Math.min(rect.w, 1));
      let h = Math.max(minSize, Math.min(rect.h, 1));

      if (cropRatio !== 'original') {
        if (type === 'nw') {
          const right = start.x + start.w;
          const bottom = start.y + start.h;
          x = Math.max(0, Math.min(x, right - minSize));
          y = Math.max(0, Math.min(y, bottom - minSize));
          w = right - x;
          h = bottom - y;
          if (w / h > aspectRatio) {
            w = h * aspectRatio;
            x = right - w;
          } else {
            h = w / aspectRatio;
            y = bottom - h;
          }
          x = Math.max(0, x);
          y = Math.max(0, y);
        } else if (type === 'ne') {
          const left = start.x;
          const bottom = start.y + start.h;
          x = left;
          y = Math.max(0, Math.min(y, bottom - minSize));
          h = bottom - y;
          w = Math.max(minSize, h * aspectRatio);
          if (x + w > 1) {
            w = 1 - x;
            h = w / aspectRatio;
            y = bottom - h;
          }
        } else if (type === 'sw') {
          const top = start.y;
          const right = start.x + start.w;
          y = top;
          x = Math.max(0, Math.min(x, right - minSize));
          w = right - x;
          h = Math.max(minSize, w / aspectRatio);
          if (y + h > 1) {
            h = 1 - y;
            w = h * aspectRatio;
            x = right - w;
          }
        } else if (type === 'se') {
          x = Math.max(0, Math.min(x, 1 - w));
          y = Math.max(0, Math.min(y, 1 - h));
          if (x + w > 1) {
            w = 1 - x;
            h = w / aspectRatio;
          }
          if (y + h > 1) {
            h = 1 - y;
            w = h * aspectRatio;
          }
          if (w < minSize) {
            w = minSize;
            h = w / aspectRatio;
          }
          if (h < minSize) {
            h = minSize;
            w = h * aspectRatio;
          }
        }
      } else {
        x = Math.min(Math.max(0, x), 1 - w);
        y = Math.min(Math.max(0, y), 1 - h);
      }

      return {
        x,
        y,
        w: Math.max(minSize, Math.min(w, 1)),
        h: Math.max(minSize, Math.min(h, 1)),
      };
    };

    let next = { ...start };
    const minSize = 0.05;
    const type = cropDragRef.current.type;

    if (type === 'move') {
      next.x = Math.min(Math.max(0, start.x + dx), 1 - start.w);
      next.y = Math.min(Math.max(0, start.y + dy), 1 - start.h);
    } else {
      let newX = start.x;
      let newY = start.y;
      let newW = start.w;
      let newH = start.h;

      if (type === 'nw' || type === 'sw') {
        newX = start.x + dx;
      }
      if (type === 'nw' || type === 'ne') {
        newY = start.y + dy;
      }
      if (type === 'ne' || type === 'se') {
        newW = start.w + dx;
      }
      if (type === 'sw' || type === 'se') {
        newH = start.h + dy;
      }

      if (cropRatio !== 'original') {
        const widthDelta = type === 'nw' || type === 'sw' ? -dx : dx;
        const heightDelta = type === 'nw' || type === 'ne' ? -dy : dy;
        const rawWidth = start.w + (type === 'nw' || type === 'sw' ? -dx : dx);
        const rawHeight = start.h + (type === 'nw' || type === 'ne' ? -dy : dy);

        if (Math.abs(widthDelta) > Math.abs(heightDelta * aspectRatio)) {
          newW = Math.max(minSize, rawWidth);
          newH = Math.max(minSize, newW / aspectRatio);
          if (type === 'nw' || type === 'sw') {
            newX = start.x + (start.w - newW);
          }
          if (type === 'nw' || type === 'ne') {
            newY = start.y + (start.h - newH);
          }
        } else {
          newH = Math.max(minSize, rawHeight);
          newW = Math.max(minSize, newH * aspectRatio);
          if (type === 'nw' || type === 'sw') {
            newX = start.x + (start.w - newW);
          }
          if (type === 'nw' || type === 'ne') {
            newY = start.y + (start.h - newH);
          }
        }
      }

      if (type === 'nw') {
        next = {
          x: newX,
          y: newY,
          w: start.x + start.w - newX,
          h: start.y + start.h - newY,
        };
      } else if (type === 'ne') {
        next = {
          x: start.x,
          y: newY,
          w: newW,
          h: start.y + start.h - newY,
        };
      } else if (type === 'sw') {
        next = {
          x: newX,
          y: start.y,
          w: start.x + start.w - newX,
          h: newH,
        };
      } else if (type === 'se') {
        next = {
          x: start.x,
          y: start.y,
          w: newW,
          h: newH,
        };
      }
    }

    setCropRect(clampRect(next));
  }, [draggingCrop, cropRatio, cropRect, canvasBounds]);

  const onCropPointerUp = useCallback(() => {
    setDraggingCrop(false);
    cropDragRef.current = null;
  }, []);

  const resetTransform = useCallback(() => {
    if (!originalImageDataRef.current) return;
    pushHistory();
    setImageData(originalImageDataRef.current);
    setProcessedImageData(null);
    setCropMode(false);
    setCropRect(null);
  }, [pushHistory]);

  useEffect(() => {
    const el = mainAreaRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!image) return;
      e.preventDefault();

      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [image]);

  useEffect(() => {
    setZoom(1);
  }, [image]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;

    const sourceCanvas = canvasRef.current;
    const dstCanvas = document.createElement('canvas');
    const ctx = dstCanvas.getContext('2d');
    if (!ctx) return;

    // Apply white/black frame first
    if (frameColor === 'none') {
      dstCanvas.width = sourceCanvas.width;
      dstCanvas.height = sourceCanvas.height;
      ctx.drawImage(sourceCanvas, 0, 0);
    } else {
      const frameBg = frameColor === 'white' ? '#ffffff' : '#000000';
      const thicknessPx = Math.round((frameThickness / 100) * Math.max(sourceCanvas.width, sourceCanvas.height));
      dstCanvas.width = sourceCanvas.width + thicknessPx * 2;
      dstCanvas.height = sourceCanvas.height + thicknessPx * 2;
      ctx.fillStyle = frameBg;
      ctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
      ctx.drawImage(sourceCanvas, thicknessPx, thicknessPx, sourceCanvas.width, sourceCanvas.height);
    }

    // Composite overlay
    if (selectedOverlay && overlayImgRef.current) {
      ctx.save();
      ctx.globalAlpha = overlayOpacity;
      ctx.globalCompositeOperation = CANVAS_BLEND[activeOverlayBlend as BlendMode] || 'source-over';
      drawImageCover(ctx, overlayImgRef.current, dstCanvas.width, dstCanvas.height);
      ctx.restore();
    }

    // Composite film frame
    if (selectedFrame && frameImgRef.current) {
      ctx.save();
      drawImageCover(ctx, frameImgRef.current, dstCanvas.width, dstCanvas.height);
      ctx.restore();
    }

    const link = document.createElement('a');
    link.download = `${selectedPreset.brand}-${selectedPreset.name.replace(/\s+/g, '-')}.jpg`;
    link.href = dstCanvas.toDataURL('image/jpeg', 0.95);
    link.click();
  }, [selectedPreset, frameColor, frameThickness, selectedOverlay, overlayOpacity, overlayBlend, selectedFrame]);

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
    setPurpleFringing(null);
    setLensDistortion(null);
    setColorShiftX(null);
    setColorShiftY(null);
    setWhiteBalance(null);
    setLevelsInputBlack(null);
    setLevelsInputWhite(null);
    setLevelsGamma(null);
    setLevelsOutputBlack(null);
    setLevelsOutputWhite(null);
  }, []);

  const customPresetItems = useMemo(() => customPresets.filter((preset) => (
    (filterType === 'all' || preset.type === filterType) &&
    (!showFavoritesOnly || favorites.includes(preset.id))
  )), [customPresets, filterType, showFavoritesOnly, favorites]);

  const filteredPresets = useMemo(() => filmPresets.filter((preset) => (
    (filterType === 'all' || preset.type === filterType) &&
    (!showFavoritesOnly || favorites.includes(preset.id))
  )), [filterType, showFavoritesOnly, favorites]);

  const displayedPresets = useMemo(() => [...customPresetItems, ...filteredPresets], [customPresetItems, filteredPresets]);

  const selectPreset = useCallback((preset: FilmPreset) => {
    if (imageData) pushHistory();
    setSelectedPreset(preset);
  }, [imageData, pushHistory]);

  // Ensure compare uses the currently selected overlay blend mode
  const activeOverlayBlend = selectedOverlay ? overlayBlend : 'normal';

  // Preset navigation handlers
  const currentPresetIndex = displayedPresets.findIndex(p => p.id === selectedPreset.id);
  
  const goToNextPreset = useCallback(() => {
    if (displayedPresets.length === 0) return;
    const nextIndex = (currentPresetIndex + 1) % displayedPresets.length;
    setSelectedPreset(displayedPresets[nextIndex]);
  }, [displayedPresets, currentPresetIndex]);

  const goToPrevPreset = useCallback(() => {
    if (displayedPresets.length === 0) return;
    const prevIndex = (currentPresetIndex - 1 + displayedPresets.length) % displayedPresets.length;
    setSelectedPreset(displayedPresets[prevIndex]);
  }, [displayedPresets, currentPresetIndex]);

  // Keyboard navigation for presets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!image) return; // Only enable when image is loaded
      
      // Arrow keys: left/right
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextPreset();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevPreset();
      }
      // Bracket keys as alternative: [ and ]
      else if (e.key === '[' || e.key === '{') {
        e.preventDefault();
        goToPrevPreset();
      } else if (e.key === ']' || e.key === '}') {
        e.preventDefault();
        goToNextPreset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, goToNextPreset, goToPrevPreset]);

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
    purpleFringing: purpleFringing ?? selectedPreset.purpleFringing,
    lensDistortion: lensDistortion ?? selectedPreset.lensDistortion,
    colorShiftX: colorShiftX ?? selectedPreset.colorShiftX,
    colorShiftY: colorShiftY ?? selectedPreset.colorShiftY,
    whiteBalance: whiteBalance ?? selectedPreset.whiteBalance,
    levelsInputBlack: levelsInputBlack ?? selectedPreset.levelsInputBlack ?? 0,
    levelsInputWhite: levelsInputWhite ?? selectedPreset.levelsInputWhite ?? 1,
    levelsGamma: levelsGamma ?? selectedPreset.levelsGamma ?? 1,
    levelsOutputBlack: levelsOutputBlack ?? selectedPreset.levelsOutputBlack ?? 0,
    levelsOutputWhite: levelsOutputWhite ?? selectedPreset.levelsOutputWhite ?? 1,
  };

  const levelsHistogram = useMemo(() => {
    if (!imageData) return null;

    const sourceImage = processedImageData ?? imageData;
    const buffer = new Uint32Array(256);
    const data = sourceImage.data;
    const pixelCount = data.length / 4;
    const sampleStep = Math.max(1, Math.floor(pixelCount / 65536));
    const stepBytes = sampleStep * 4;

    for (let i = 0; i < data.length; i += stepBytes) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = Math.min(255, Math.max(0, Math.round((r * 0.299 + g * 0.587 + b * 0.114))));
      buffer[lum]++;
    }

    return buffer;
  }, [imageData, processedImageData]);

  const handleSaveCustomPreset = useCallback(() => {
    const name = customPresetName.trim() || `${selectedPreset.name} Custom`;
    const description = customPresetDescription.trim() || `Custom preset based on ${selectedPreset.name}`;
    const newPreset: FilmPreset = {
      ...selectedPreset,
      id: `custom-${Date.now()}`,
      name,
      brand: 'My Presets',
      description,
      contrast: eff.contrast,
      brightness: eff.brightness,
      saturation: eff.saturation,
      grainAmount: eff.grainAmount,
      grainSize: eff.grainSize,
      grainRoughness: eff.grainRoughness,
      vignette: eff.vignette,
      halation: eff.halation,
      fadedBlacks: eff.fadedBlacks,
      purpleFringing: eff.purpleFringing,
      lensDistortion: eff.lensDistortion,
      colorShiftX: eff.colorShiftX,
      colorShiftY: eff.colorShiftY,
      whiteBalance: eff.whiteBalance,
      levelsInputBlack: eff.levelsInputBlack,
      levelsInputWhite: eff.levelsInputWhite,
      levelsGamma: eff.levelsGamma,
      levelsOutputBlack: eff.levelsOutputBlack,
      levelsOutputWhite: eff.levelsOutputWhite,
    };
    setCustomPresets((prev) => [...prev, newPreset]);
    setSelectedPreset(newPreset);
    setCustomPresetName('');
    setCustomPresetDescription('');
  }, [customPresetDescription, customPresetName, eff, selectedPreset]);

  const deleteCustomPreset = useCallback((id: string) => {
    setCustomPresets((prev) => prev.filter((preset) => preset.id !== id));
    if (selectedPreset.id === id) {
      setSelectedPreset(filmPresets[0]);
    }
  }, [selectedPreset.id]);

  // Check if any overrides are active
  const hasOverrides = grainAmount !== null || grainSize !== null || grainRoughness !== null ||
    vignetteAmount !== null || halationAmount !== null || contrastAmount !== null ||
    saturationAmount !== null || brightnessAmount !== null || fadedBlacks !== null || exposure !== 0 ||
    purpleFringing !== null || lensDistortion !== null || colorShiftX !== null || colorShiftY !== null || whiteBalance !== null ||
    levelsInputBlack !== null || levelsInputWhite !== null || levelsGamma !== null || levelsOutputBlack !== null || levelsOutputWhite !== null;

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
            <img src={logo} alt="FilmLab logo" className="hidden md:block w-8 h-8 rounded-none object-contain" />
            <div>
              <h1 className="hidden md:block text-base font-bold tracking-tight leading-tight">FilmLab</h1>
              <p className="hidden md:block text-[9px] text-zinc-600 tracking-[0.2em] uppercase leading-tight">Film Emulator</p>
            </div>
          </div>

          {/* Toolbar - Always visible */}
          <div className="flex items-center gap-2">
            {image && (
              <>
                <button
                  onClick={() => {
                    setSplitView((prev) => !prev);
                    setShowOriginal(false);
                  }}
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
                  onClick={goToPrevPreset}
                  className="p-1.5 rounded-md text-[10px] bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border border-zinc-700/50 transition-all flex items-center justify-center flex-shrink-0"
                  title="Previous preset (← or [)"
                >
                  <ChevronLeftIcon />
                </button>
                <div className="hidden sm:block text-[10px] text-zinc-600 px-1 tabular-nums font-medium min-w-[3ch] text-center">
                  {currentPresetIndex + 1}/{filteredPresets.length}
                </div>
                <button
                  onClick={goToNextPreset}
                  className="p-1.5 rounded-md text-[10px] bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border border-zinc-700/50 transition-all flex items-center justify-center flex-shrink-0"
                  title="Next preset (→ or ])"
                >
                  <ChevronRightIcon />
                </button>
                <div className="w-px h-5 bg-zinc-800 mx-1" />
              </>
            )}
            {image && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  title="Undo"
                  aria-label="Undo"
                  className="p-2 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border-zinc-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ↶
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  title="Redo"
                  aria-label="Redo"
                  className="p-2 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border-zinc-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ↷
                </button>
                <button
                  onClick={resetOverrides}
                  disabled={!hasOverrides}
                  title="Reset all adjustments"
                  className="px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all border flex-shrink-0 bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border-zinc-700/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ResetIcon />
                  <span className="hidden md:inline ml-1">Reset All</span>
                </button>
              </>
            )}
            <button
              onClick={() => setFramingToolOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all border flex-shrink-0 bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border-zinc-700/50"
              title="Open framing tool"
            >
              <span className="inline-flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="hidden md:inline ml-1">Frame</span>
            </button>
            {image && (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 flex-shrink-0 whitespace-nowrap"
              >
                <DownloadIcon />
                <span className="hidden md:inline ml-1">Export JPG</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ─── */}
        <aside className={`${
          sidebarOpen ? 'w-[310px] min-w-[310px]' : 'w-0 min-w-0'
        } md:w-[310px] md:min-w-[310px] border-r border-zinc-800/50 bg-zinc-900/40 flex flex-col overflow-hidden transition-all duration-200 ${
          sidebarOpen ? 'md:relative fixed md:static top-16 left-0 right-auto bottom-0 z-40' : ''
        }`}>
          {/* Mobile logo (sidebar) */}
          <div className="md:hidden px-3 pt-3 pb-2 border-b border-zinc-800/40 bg-zinc-900/40 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <img src={logo} alt="FilmLab logo" className="w-8 h-8 object-contain" />
              <div>
                <h1 className="text-sm font-bold tracking-tight leading-tight">FilmLab</h1>
                <p className="text-[9px] text-zinc-500 tracking-[0.2em] uppercase leading-tight">Film Emulator</p>
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div className="sticky top-0 z-10 px-3 pt-3 pb-2 border-b border-zinc-800/40 bg-zinc-900/40 backdrop-blur-sm">
            <div className="pb-4 border-b border-zinc-800/30">
              <SectionHeader title="Levels" icon={<LevelsIcon />} />
              <div className="mt-2">
                <LevelsHistogram
                  histogram={levelsHistogram}
                  inputBlack={eff.levelsInputBlack}
                  inputWhite={eff.levelsInputWhite}
                  gamma={eff.levelsGamma}
                  onInputBlackChange={setLevelsInputBlack}
                  onInputWhiteChange={setLevelsInputWhite}
                  onGammaChange={setLevelsGamma}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1">
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
              <button
                onClick={() => setShowFavoritesOnly((prev) => !prev)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  showFavoritesOnly
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                {showFavoritesOnly ? '★ Favorites' : 'Favorites'}
              </button>
            </div>
            <div className="mt-3 px-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                <span>Batch ({batchImages.length})</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    Add Images
                  </button>
                  {batchImages.length > 0 && (
                    <button
                      onClick={handleDownloadBatch}
                      className="px-2 py-1 rounded-md bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                    >
                      Export Batch
                    </button>
                  )}
                </div>
              </div>
              {batchImages.length > 1 && (
                <>
                  <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    <span>Current Batch</span>
                    <button
                      onClick={() => {
                        setBatchImages([]);
                        setActiveBatchIndex(null);
                      }}
                      className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {batchImages.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => selectBatchImage(index)}
                        className={`aspect-square rounded overflow-hidden border ${activeBatchIndex === index ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-zinc-700/40 hover:border-zinc-500'}`}
                      >
                        <img src={item.thumbUrl || item.url} className="w-full h-full object-cover" alt={item.name} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {customPresetItems.length > 0 && (
            <div className="px-3 py-3 border-b border-zinc-800/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">My Presets</div>
                <button
                  onClick={() => setShowFavoritesOnly(false)}
                  className="px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.15em] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {customPresetItems.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(preset)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-left text-white hover:border-amber-500 transition-colors"
                  >
                    <div className="text-sm font-semibold truncate">{preset.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Film Stock + Controls scroll container */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-2 py-1.5 space-y-0.5">
              {filteredPresets.map(preset => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectPreset(preset)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectPreset(preset);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all group relative cursor-pointer ${
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
                          {favorites.includes(preset.id) && (
                            <span className="text-amber-400 text-[10px]">★</span>
                          )}
                        </div>
                        <h3 className={`text-[13px] font-semibold leading-tight ${
                          isSelected ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                        }`}>
                          {preset.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(preset.id);
                          }}
                          className={`p-1 rounded-md transition-colors ${favorites.includes(preset.id) ? 'bg-amber-500 text-black' : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}`}
                          aria-label={favorites.includes(preset.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <StarIcon filled={favorites.includes(preset.id)} />
                        </button>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${typeColors[preset.type]}`}>
                          {typeBadge[preset.type]}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">{preset.description}</p>
                    )}
                  </div>
              );
            })}
          </div>

          {/* ─── Controls ─── */}
          <div className="border-t border-zinc-800/50">
            <div className="px-3 pt-3 pb-1">
              <SectionHeader title="Tone" icon={<ToneIcon />} />
            </div>
            <div className="px-3 pb-2 space-y-1.5">
              <SliderControl label="White Balance" value={eff.whiteBalance} min={-1} max={1} step={0.05}
                defaultValue={selectedPreset.whiteBalance} onChange={setWhiteBalance} format={v => v > 0 ? `+${(v * 100).toFixed(0)}% Warm` : v < 0 ? `${(v * 100).toFixed(0)}% Cool` : 'Neutral'} icon={<WhiteBalanceIcon />} />
              <SliderControl label="Exposure" value={exposure} min={-2} max={2} step={0.05}
                defaultValue={0} onChange={(v) => setExposure(v ?? 0)} format={v => `${v > 0 ? '+' : ''}${v.toFixed(1)} EV`} icon={<ExposureIcon />} />
              <SliderControl label="Contrast" value={eff.contrast} min={-0.5} max={0.5} step={0.01}
                defaultValue={selectedPreset.contrast} onChange={setContrastAmount} format={v => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}`} icon={<ContrastIcon />} />
              <SliderControl label="Brightness" value={eff.brightness} min={-0.3} max={0.3} step={0.01}
                defaultValue={selectedPreset.brightness} onChange={setBrightnessAmount} format={v => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}`} icon={<BrightnessIcon />} />
            </div>
            <div className="px-3 pb-2 space-y-1.5">
              <SliderControl label="Saturation" value={eff.saturation} min={0} max={2} step={0.01}
                defaultValue={selectedPreset.saturation} onChange={setSaturationAmount} format={v => `${(v * 100).toFixed(0)}%`} icon={<SaturationIcon />} />
              <SliderControl label="Faded Blacks" value={eff.fadedBlacks} min={0} max={0.25} step={0.005}
                defaultValue={selectedPreset.fadedBlacks} onChange={setFadedBlacks} format={v => `${(v * 100).toFixed(0)}%`} icon={<FadedBlacksIcon />} />
            </div>

            {/* Grain Section */}
            <div className="px-3 pt-1 pb-1 flex items-center justify-between">
              <SectionHeader title="Film Grain" icon={<GrainIcon />} />
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
                defaultValue={selectedPreset.grainAmount} onChange={setGrainAmount} format={v => `${(v * 100).toFixed(0)}%`} icon={<GrainIconSmall />} />
              <SliderControl label="Size" value={eff.grainSize} min={0.3} max={5} step={0.1}
                defaultValue={selectedPreset.grainSize} onChange={setGrainSize} format={v => v.toFixed(1)} icon={<GrainIconSmall />} />
              <SliderControl label="Roughness" value={eff.grainRoughness} min={0} max={1} step={0.01}
                defaultValue={selectedPreset.grainRoughness} onChange={setGrainRoughness} format={v => `${(v * 100).toFixed(0)}%`} icon={<GrainIconSmall />} />
            </div>

            {/* Effects Section */}
            <div className="px-3 pt-1 pb-1">
              <SectionHeader title="Effects" icon={<EffectsIcon />} />
            </div>
            <div className="px-3 pb-2 space-y-1.5">
              <SliderControl label="Vignette" value={eff.vignette} min={0} max={0.6} step={0.01}
                defaultValue={selectedPreset.vignette} onChange={setVignetteAmount} format={v => `${(v * 100).toFixed(0)}%`} icon={<VignetteIcon />} />
              <SliderControl label="Halation" value={eff.halation} min={0} max={0.8} step={0.01}
                defaultValue={selectedPreset.halation} onChange={setHalationAmount} format={v => `${(v * 100).toFixed(0)}%`} icon={<HalationIcon />} />
            </div>

            {/* Optical Effects Section */}
            <div className="px-3 pt-1 pb-1">
              <SectionHeader title="Optical Effects" icon={<OpticalIcon />} />
            </div>
            <div className="px-3 pb-3 space-y-1.5">
              <SliderControl label="Purple Fringing" value={eff.purpleFringing} min={0} max={1} step={0.01}
                defaultValue={selectedPreset.purpleFringing} onChange={setPurpleFringing} format={v => `${(v * 100).toFixed(0)}%`} icon={<PurpleFringingIcon />} />
              <SliderControl label="Lens Distortion" value={eff.lensDistortion} min={0} max={0.5} step={0.01}
                defaultValue={selectedPreset.lensDistortion} onChange={setLensDistortion} format={v => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`} icon={<LensDistortionIcon />} />
              <SliderControl label="Color Shift X" value={eff.colorShiftX} min={-1} max={1} step={0.05}
                defaultValue={selectedPreset.colorShiftX} onChange={setColorShiftX} format={v => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`} icon={<ColorShiftIcon />} />
              <SliderControl label="Color Shift Y" value={eff.colorShiftY} min={-1} max={1} step={0.05}
                defaultValue={selectedPreset.colorShiftY} onChange={setColorShiftY} format={v => `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`} icon={<ColorShiftIcon />} />
            </div>

            {/* Overlays Section */}
            <div className="px-3 pt-1 pb-1">
              <SectionHeader title="Overlays" icon={<OverlayIcon />} />
            </div>
            <div className="px-3 pb-2">
              {/* Category tabs */}
              <div className="flex gap-1 mb-2">
                {(Object.keys(OVERLAYS) as OverlayCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setOverlayCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                      overlayCategory === cat
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    {OVERLAYS[cat].label}
                  </button>
                ))}
              </div>
              {/* Thumbnail grid */}
              <div className="grid grid-cols-5 gap-1">
                <button
                  onClick={() => setSelectedOverlay(null)}
                  className={`aspect-square rounded text-[9px] font-bold flex items-center justify-center transition-all border ${
                    !selectedOverlay
                      ? 'bg-zinc-700 text-zinc-100 border-zinc-600'
                      : 'bg-zinc-800/50 text-zinc-600 hover:text-zinc-300 border-zinc-700/50 hover:border-zinc-500'
                  }`}
                >
                  None
                </button>
                {OVERLAYS[overlayCategory].thumbs.map((thumb, i) => {
                  const url = OVERLAYS[overlayCategory].urls[i];
                  const isSelected = selectedOverlay === url;
                  return (
                    <button
                      key={url}
                      onClick={() => {
                        setSelectedOverlay(url);
                        if (!isSelected) setOverlayBlend(OVERLAYS[overlayCategory].defaultBlend);
                      }}
                      className={`aspect-square rounded overflow-hidden transition-all border ${
                        isSelected
                          ? 'border-amber-500 ring-1 ring-amber-500/40'
                          : 'border-zinc-700/50 hover:border-zinc-500'
                      }`}
                    >
                      <img src={thumb} className="w-full h-full object-cover" alt="" />
                    </button>
                  );
                })}
              </div>
              {/* Opacity + blend mode */}
              {selectedOverlay && (
                <div className="mt-2 space-y-1.5">
                  <SliderControl
                    label="Opacity"
                    value={overlayOpacity}
                    min={0} max={1} step={0.01}
                    defaultValue={0.6}
                    onChange={(v) => setOverlayOpacity(v ?? 0.6)}
                    format={(v) => `${Math.round(v * 100)}%`}
                  />
                  <div className="flex flex-wrap gap-1">
                    {BLEND_MODES.map(mode => (
                      <button
                        key={mode.value}
                        onClick={() => setOverlayBlend(mode.value)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                          overlayBlend === mode.value
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Frame Section */}
            <div className="px-3 pt-1 pb-1">
              <SectionHeader title="Frame" icon={<FrameIcon />} />
            </div>
            <div className="px-3 pb-3 space-y-1.5">
              <div className="flex items-center gap-2">
                {['none', 'white', 'black'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setFrameColor(color as 'none' | 'white' | 'black')}
                    className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide transition ${
                      frameColor === color
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {frameColor !== 'none' && (
                <SliderControl
                  label="Frame Thickeness"
                  value={frameThickness}
                  min={0}
                  max={20}
                  step={1}
                  defaultValue={8}
                  onChange={(v) => setFrameThickness(v ?? 0)}
                  format={(v) => `${Math.round(v)}%`}
                />
              )}
            </div>

            {/* Film Frame Section */}
            <div className="px-3 pt-1 pb-1">
              <SectionHeader title="Film Frame" icon={<FrameIcon />} />
            </div>
            <div className="px-3 pb-3">
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => setSelectedFrame(null)}
                  className={`aspect-[3/2] rounded text-[9px] font-bold flex items-center justify-center transition-all border ${
                    !selectedFrame
                      ? 'bg-zinc-700 text-zinc-100 border-zinc-600'
                      : 'bg-zinc-800/50 text-zinc-600 hover:text-zinc-300 border-zinc-700/50 hover:border-zinc-500'
                  }`}
                >
                  None
                </button>
                {FRAME_URLS.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setSelectedFrame(url)}
                    className={`aspect-[3/2] rounded overflow-hidden transition-all border ${
                      selectedFrame === url
                        ? 'border-amber-500 ring-1 ring-amber-500/40'
                        : 'border-zinc-700/50 hover:border-zinc-500'
                    }`}
                  >
                    <img src={url} className="w-full h-full object-cover opacity-80" alt={`Frame ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Crop & Rotate */}
            <div className="px-3 pt-1 pb-1">
              <SectionHeader title="Crop & Rotate" icon={<CropIcon />} />
            </div>
            <div className="px-3 pb-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {['original', '1:1', '4:3', '16:9'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => {
                      setCropRatio(ratio as 'original' | '1:1' | '4:3' | '16:9');
                      setCropMode(true);
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] transition-all ${cropRatio === ratio ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                  >
                    {ratio.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-zinc-500 leading-snug">
                Pick a ratio and enter crop mode. Drag the overlay on the canvas to reposition the crop before applying.
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCropMode(true)}
                  className={`flex-1 px-2 py-2 rounded-lg text-sm font-semibold transition-colors ${cropMode ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                >
                  {cropMode ? 'Crop Mode Active' : 'Start Crop'}
                </button>
                <button
                  onClick={() => {
                    setCropMode(false);
                    setCropRect(null);
                  }}
                  className="flex-1 px-2 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Cancel Crop
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyRotation(-90)}
                  className="flex-1 px-2 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Rotate Left
                </button>
                <button
                  onClick={() => applyRotation(90)}
                  className="flex-1 px-2 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Rotate Right
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={applyCrop}
                  disabled={!cropMode || !cropRect}
                  className={`flex-1 px-2 py-2 rounded-lg font-semibold transition-colors ${cropMode && cropRect ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                >
                  Apply Crop
                </button>
                <button
                  onClick={resetTransform}
                  className="flex-1 px-2 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Reset Transform
                </button>
              </div>
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
            <div className="border-t border-zinc-800/50 px-3 py-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <SectionHeader title="Custom Preset" icon={<PresetIcon />} />
                {selectedPreset.id.startsWith('custom-') && (
                  <button
                    onClick={() => deleteCustomPreset(selectedPreset.id)}
                    className="text-[10px] uppercase tracking-[0.2em] text-amber-400 hover:text-amber-200"
                  >
                    Delete
                  </button>
                )}
              </div>
              <input
                value={customPresetName}
                onChange={(e) => setCustomPresetName(e.target.value)}
                placeholder="Preset name"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 outline-none"
              />
              <input
                value={customPresetDescription}
                onChange={(e) => setCustomPresetDescription(e.target.value)}
                placeholder="Description"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 outline-none"
              />
              <button
                onClick={handleSaveCustomPreset}
                className="w-full py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
              >
                Save Preset
              </button>
            </div>
            <div className="border-t border-zinc-800/50 px-3 py-3">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="w-full text-center px-3 py-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-amber-500 hover:text-zinc-950 transition-all text-sm font-semibold"
              >
                About App
              </button>
            </div>
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
        <main
          ref={mainAreaRef}
          className="flex-1 flex items-center justify-center bg-zinc-950 relative overflow-hidden"
        >
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
              style={{ backgroundColor: frameBackground, padding: framePadding }}
              onMouseMove={(e) => handleSplitMove(e.clientX)}
              onMouseUp={() => setDraggingSplit(false)}
              onMouseLeave={() => setDraggingSplit(false)}
              onTouchMove={(e) => handleSplitMove(e.touches[0].clientX)}
              onTouchEnd={() => setDraggingSplit(false)}
            >
              <div
                className="relative inline-block max-w-full max-h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              >
                <canvas
                  ref={originalCanvasRef}
                  className="max-w-full max-h-[calc(100vh-52px)] object-contain block"
                />
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
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
                  Original
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white/80 text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {selectedPreset.name}
                </div>
                {/* Overlay on processed side */}
                {selectedOverlay && (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 0 0 ${splitPos}%)`, mixBlendMode: activeOverlayBlend }}
                  >
                    <img
                      src={selectedOverlay}
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: 'cover', opacity: overlayOpacity, mixBlendMode: activeOverlayBlend }}
                      alt=""
                    />
                  </div>
                )}
                {selectedFrame && (
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
                  >
                    <img
                      src={selectedFrame}
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: 'cover' }}
                      alt=""
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Normal View */
            <div
              className="relative flex items-center justify-center w-full h-full"
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              onTouchCancel={() => setShowOriginal(false)}
            >
              <div
                className="relative flex items-center justify-center max-w-full max-h-full"
                style={{ backgroundColor: frameBackground, padding: framePadding }}
              >
                <div className="relative inline-block max-w-full" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
                  <canvas
                    ref={canvasRef}
                    className={`block max-w-full max-h-[calc(100vh-52px)] shadow-2xl ${
                      showOriginal ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                    style={{ imageRendering: 'auto' }}
                  />
                  {cropMode && cropRect && (
                    <div className="absolute inset-0 pointer-events-auto">
                      <div className="absolute left-0 top-0 right-0 pointer-events-none" style={{ height: `${cropRect.y * 100}%`, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: `${(cropRect.y + cropRect.h) * 100}%`, height: `${(1 - cropRect.y - cropRect.h) * 100}%`, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                      <div className="absolute left-0 pointer-events-none" style={{ top: `${cropRect.y * 100}%`, width: `${cropRect.x * 100}%`, height: `${cropRect.h * 100}%`, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                      <div className="absolute right-0 pointer-events-none" style={{ top: `${cropRect.y * 100}%`, width: `${(1 - cropRect.x - cropRect.w) * 100}%`, height: `${cropRect.h * 100}%`, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                      <div
                        className="absolute border border-amber-400 bg-transparent cursor-move"
                        style={{ left: `${cropRect.x * 100}%`, top: `${cropRect.y * 100}%`, width: `${cropRect.w * 100}%`, height: `${cropRect.h * 100}%` }}
                        onPointerDown={onCropPointerDown('move')}
                        onPointerMove={onCropPointerMove}
                        onPointerUp={onCropPointerUp}
                        onPointerLeave={onCropPointerUp}
                      >
                        <div className={`absolute inset-0 ${draggingCrop ? 'ring-2 ring-amber-400/70' : ''}`} />
                        {['nw','ne','sw','se'].map((handle) => {
                          const positions: Record<string, string> = {
                            nw: 'top-0 left-0',
                            ne: 'top-0 right-0',
                            sw: 'bottom-0 left-0',
                            se: 'bottom-0 right-0',
                          };
                          const cursors: Record<string, string> = {
                            nw: 'cursor-nwse-resize',
                            ne: 'cursor-nesw-resize',
                            sw: 'cursor-nesw-resize',
                            se: 'cursor-nwse-resize',
                          };
                          return (
                            <div
                              key={handle}
                              className={`${positions[handle]} absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border border-white ${cursors[handle]}`}
                              onPointerDown={onCropPointerDown(handle as CropDragType)}
                              onPointerMove={onCropPointerMove}
                              onPointerUp={onCropPointerUp}
                              onPointerLeave={onCropPointerUp}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!showOriginal && selectedOverlay && (
                    <img
                      src={selectedOverlay}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ objectFit: 'cover', opacity: overlayOpacity, mixBlendMode: activeOverlayBlend }}
                      alt=""
                    />
                  )}
                  {!showOriginal && selectedFrame && (
                    <img
                      src={selectedFrame}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ objectFit: 'cover' }}
                      alt=""
                    />
                  )}
                </div>
                {showOriginal && imageData && <OriginalOverlay imageData={imageData} zoom={zoom} />}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                handleBatchFiles(files);
              }
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
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-zinc-900/70 backdrop-blur-xl border border-zinc-800/50 rounded-xl px-3 py-1.5 text-[11px] whitespace-nowrap">
              <span className={`px-1.5 py-0.5 rounded border font-medium text-[9px] ${typeColors[selectedPreset.type]}`}>
                {typeBadge[selectedPreset.type]}
              </span>
              <span className="font-semibold text-zinc-200 truncate">{selectedPreset.brand} {selectedPreset.name}</span>

              <span className="text-zinc-700">|</span>
              <span className="text-zinc-600">{Math.round(zoom * 100)}%</span>
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

        {isAboutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">About FilmLab</h2>
                  <p className="mt-2 text-sm text-zinc-400">Quickstart & info</p>
                </div>
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="text-zinc-400 hover:text-zinc-100 text-sm font-semibold"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed">
                <p>FilmLab is an in-browser analog film emulator. Upload a photo, pick a preset, and adjust tone, grain, and effects.</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  <li>Upload or drag & drop an image.</li>
                  <li>Select film stock on the left.</li>
                  <li>Use sliders to tweak exposure, contrast, grain, and more.</li>
                  <li>Use Compare and hold Original for before/after preview.</li>
                  <li>Export as JPG when ready.</li>
                </ul>
                <a
                  href="https://nefas.tv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-amber-500 hover:text-zinc-950 transition-all text-sm font-semibold"
                >
                  Author Website
                </a>
              </div>
            </div>
          </div>
        )}

        <FramingTool isOpen={framingToolOpen} onClose={() => setFramingToolOpen(false)} />
      </div>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em] flex items-center gap-2">
      {icon}
      <span>{title}</span>
    </h3>
  );
}

function SliderControl({
  label, value, min, max, step, defaultValue, onChange, format, icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (v: number | null) => void;
  format: (v: number) => string;
  icon?: ReactNode;
}) {
  const isModified = Math.abs(value - defaultValue) > step * 0.5;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-0.5">
        <label className={`text-[11px] font-medium transition-colors ${isModified ? 'text-amber-500/80' : 'text-zinc-500'}`}>
          <span className="inline-flex items-center gap-2">
            {icon ?? <SliderLabelIcon />}
            {label}
          </span>
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

function LevelsHistogram({
  histogram,
  inputBlack,
  inputWhite,
  gamma,
  onInputBlackChange,
  onInputWhiteChange,
  onGammaChange,
}: {
  histogram: Uint32Array | null;
  inputBlack: number;
  inputWhite: number;
  gamma: number;
  onInputBlackChange: (value: number | null) => void;
  onInputWhiteChange: (value: number | null) => void;
  onGammaChange: (value: number | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histogramRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    marker: 'inputBlack' | 'inputWhite' | 'gamma' | null;
    startX: number;
    startValue: number;
  }>({ marker: null, startX: 0, startValue: 0 });

  const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

  const minGamma = 0.25;
  const maxGamma = 4;

  const gammaToPosition = useCallback((gammaValue: number) => {
    const normalizedGamma = Math.min(1, Math.max(0, Math.log(gammaValue / minGamma) / Math.log(maxGamma / minGamma)));
    return inputBlack + normalizedGamma * (inputWhite - inputBlack);
  }, [inputBlack, inputWhite]);

  const positionToGamma = useCallback((position: number) => {
    const range = Math.max(0.001, inputWhite - inputBlack);
    const normalized = Math.min(1, Math.max(0, (position - inputBlack) / range));
    return minGamma * Math.pow(maxGamma / minGamma, normalized);
  }, [inputBlack, inputWhite]);

  const clampGammaPosition = useCallback((position: number) => {
    const minGap = 0.02;
    return Math.min(inputWhite - minGap, Math.max(inputBlack + minGap, position));
  }, [inputBlack, inputWhite]);

  const updateValue = useCallback((marker: 'inputBlack' | 'inputWhite' | 'gamma', x: number) => {
    const bar = histogramRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const normalized = clamp((x - rect.left) / rect.width);
    const gammaPos = gammaToPosition(gamma);
    const minGap = 0.02;

    if (marker === 'inputBlack') {
      onInputBlackChange(Math.min(normalized, gammaPos - minGap));
    } else if (marker === 'inputWhite') {
      onInputWhiteChange(Math.max(normalized, gammaPos + minGap));
    } else if (marker === 'gamma') {
      const pos = clampGammaPosition(normalized);
      onGammaChange(positionToGamma(pos));
    }
  }, [inputBlack, inputWhite, onInputBlackChange, onInputWhiteChange, onGammaChange, gamma, gammaToPosition, positionToGamma, clampGammaPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !histogram) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#10151f';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const max = Math.max(1, Math.max(...histogram));
    const barWidth = rect.width / histogram.length;

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let x = 0; x < histogram.length; x++) {
      const value = histogram[x] / max;
      const h = value * rect.height;
      ctx.fillRect(x * barWidth, rect.height - h, Math.max(1, barWidth), h);
    }

    const drawMarker = (position: number, color: string) => {
      const x = rect.width * clamp(position);
      ctx.fillStyle = color;
      ctx.fillRect(x - 1, 0, 2, rect.height);
    };

    drawMarker(inputBlack, 'rgba(250,204,21,0.85)');
    drawMarker(gammaToPosition(gamma), 'rgba(56, 189, 248, 0.85)');
    drawMarker(inputWhite, 'rgba(250,204,21,0.85)');
  }, [histogram, inputBlack, inputWhite, gamma, gammaToPosition]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current.marker) return;
      updateValue(draggingRef.current.marker, event.clientX);
    };

    const handlePointerUp = () => {
      draggingRef.current.marker = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [updateValue]);

  const startDrag = (marker: 'inputBlack' | 'inputWhite' | 'gamma') => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = {
      marker,
      startX: event.clientX,
      startValue: marker === 'inputBlack' ? inputBlack : marker === 'inputWhite' ? inputWhite : gamma,
    };
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="px-3 pt-3 pb-2">
        <div className="relative h-24 rounded-lg overflow-hidden bg-zinc-900">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div ref={histogramRef} className="relative mt-2 h-7 rounded-lg overflow-hidden bg-zinc-900">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-800 to-white opacity-90" />
          {['inputBlack', 'gamma', 'inputWhite'].map((marker) => {
            const position = marker === 'inputBlack'
              ? inputBlack
              : marker === 'inputWhite'
                ? inputWhite
                : gammaToPosition(gamma);
            const color = marker === 'gamma' ? 'bg-sky-400' : 'bg-amber-400';
            const left = `${clamp(position) * 100}%`;
            return (
              <div
                key={marker}
                onPointerDown={startDrag(marker as any)}
                className={`${color} absolute top-0 h-full w-1.5 -translate-x-1/2 cursor-ew-resize`}
                style={{ left }}
              />
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-zinc-500">
          <span>Blacks: {Math.round(inputBlack * 255)}</span>
          <span className="text-center">Mids: {gamma.toFixed(2)}</span>
          <span className="text-right">Highlights: {Math.round(inputWhite * 255)}</span>
        </div>
      </div>
    </div>
  );
}

function OriginalOverlay({ imageData, zoom }: { imageData: ImageData; zoom: number }) {
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
      className="absolute inset-0 m-auto max-w-full max-h-[calc(100vh-52px)] object-contain shadow-2xl"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
    />
  );
}
