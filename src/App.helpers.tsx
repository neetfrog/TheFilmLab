import type { ReactNode } from 'react';

export type BlendMode = 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'normal';
export type OverlayCategory = 'lightleaks' | 'bokeh' | 'textures';
export type FilmType = 'all' | 'color-negative' | 'bw-negative' | 'slide' | 'cinema';

export const PRESET_STORAGE_KEY = 'filmLabCustomPresets';
export const FAVORITES_STORAGE_KEY = 'filmLabFavorites';

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const typeLabels: Record<string, string> = {
  all: 'All',
  'color-negative': 'Color',
  'bw-negative': 'B&W',
  slide: 'Slide',
  cinema: 'Cine',
  custom: 'My Presets',
};

export const typeColors: Record<string, string> = {
  'color-negative': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'bw-negative': 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25',
  slide: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  cinema: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

export const typeBadge: Record<string, string> = {
  'color-negative': 'C-41',
  'bw-negative': 'B&W',
  slide: 'E-6',
  cinema: 'ECN',
};

export const DEMO_IMAGES = [
  { label: 'Portrait', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=80' },
  { label: 'Street', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80' },
  { label: 'Landscape', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80' },
  { label: 'Still Life', url: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=1200&q=80' },
];

const SectionIcon = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-800 text-zinc-400">
    {children}
  </span>
);

export const UploadIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const CompareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

export const DiceIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
    <circle cx="8" cy="8" r="1" fill="currentColor" /><circle cx="16" cy="8" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="8" cy="16" r="1" fill="currentColor" /><circle cx="16" cy="16" r="1" fill="currentColor" />
  </svg>
);

export const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const ResetIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

export const LevelsIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 14V6m4 8V8m4 6V4m4 10V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SectionIcon>
);

export const ToneIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 4V2m0 16v-2m8-6h2M0 10h2m14.14-5.86l1.42-1.42M2.44 17.56l1.42-1.42M17.56 17.56l-1.42-1.42M2.44 2.44l1.42 1.42" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  </SectionIcon>
);

export const GrainIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <circle cx="14" cy="6" r="1.5" fill="currentColor" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
    </svg>
  </SectionIcon>
);

export const EffectsIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 3l1.5 4.5L16 9l-4 2L11.5 16 10 12 6 14l2-4-4-2 4.5-.5L10 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SectionIcon>
);

export const OpticalIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  </SectionIcon>
);

export const OverlayIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <rect x="6" y="6" width="10" height="10" rx="1" fill="currentColor" opacity="0.15" />
    </svg>
  </SectionIcon>
);

export const FrameIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="4" width="12" height="12" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4v4M4 8h4" strokeLinecap="round" />
    </svg>
  </SectionIcon>
);

const SmallIconWrapper = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    {children}
  </span>
);

export const WhiteBalanceIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 4V2m0 16v-2m8-6h2M0 10h2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  </SmallIconWrapper>
);

export const ExposureIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 5V3m0 14v-2m5-5h2M3 10H5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  </SmallIconWrapper>
);

export const ContrastIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 4v12M6 4h8" strokeLinecap="round" />
    </svg>
  </SmallIconWrapper>
);

export const BrightnessIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 6a4 4 0 100 8 4 4 0 000-8z" />
      <path d="M10 2v2M10 16v2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M2 10h2M16 10h2M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  </SmallIconWrapper>
);

export const SaturationIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="3" fill="currentColor" />
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3" strokeLinecap="round" />
    </svg>
  </SmallIconWrapper>
);

export const FadedBlacksIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 16h12M4 12h10M4 8h8M4 4h6" strokeLinecap="round" />
    </svg>
  </SmallIconWrapper>
);

export const GrainIconSmall = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6h.01M10 10h.01M14 14h.01" strokeLinecap="round" />
    </svg>
  </SmallIconWrapper>
);

export const VignetteIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="6" opacity="0.2" />
    </svg>
  </SmallIconWrapper>
);

export const HalationIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="3" />
      <circle cx="10" cy="10" r="5" opacity="0.25" />
    </svg>
  </SmallIconWrapper>
);

export const PurpleFringingIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="3" />
      <path d="M5 5l3 3M12 12l3 3" strokeLinecap="round" />
    </svg>
  </SmallIconWrapper>
);

export const LensDistortionIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 10c2-4 6-4 8 0s6 4 8 0" strokeLinecap="round" />
    </svg>
  </SmallIconWrapper>
);

export const ColorShiftIcon = () => (
  <SmallIconWrapper>
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 10h8M10 6l4 4-4 4" strokeLinecap="round" />
    </svg>
  </SmallIconWrapper>
);

export const CropIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 3v4M6 3h4M14 17v-4M14 17h-4M17 6h-4M17 6v4M3 14h4M3 14v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SectionIcon>
);

export const PresetIcon = () => (
  <SectionIcon>
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h12M4 10h12M4 14h8" strokeLinecap="round" />
    </svg>
  </SectionIcon>
);

export const SliderLabelIcon = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400">
    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="10" cy="10" r="2" />
    </svg>
  </span>
);

export const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.262 3.885a1 1 0 00.95.69h4.084c.969 0 1.371 1.24.588 1.81l-3.305 2.405a1 1 0 00-.364 1.118l1.262 3.885c.3.921-.755 1.688-1.54 1.118l-3.305-2.405a1 1 0 00-1.176 0l-3.305 2.405c-.784.57-1.838-.197-1.539-1.118l1.262-3.885a1 1 0 00-.364-1.118L2.115 9.312c-.783-.57-.38-1.81.588-1.81h4.084a1 1 0 00.95-.69l1.262-3.885z" />
  </svg>
);

export const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

export const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export const OVERLAYS: Record<OverlayCategory, { label: string; urls: string[]; thumbs: string[]; defaultBlend: BlendMode }> = {
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
    defaultBlend: 'screen',
  },
};

export const FRAME_URLS = Object.values(
  import.meta.glob('./frames/*.webp', { query: '?url', import: 'default', eager: true }) as Record<string, string>
).sort();

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'screen', label: 'Screen' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft' },
  { value: 'normal', label: 'Normal' },
];

export const CANVAS_BLEND: Record<BlendMode, GlobalCompositeOperation> = {
  screen: 'screen',
  multiply: 'multiply',
  overlay: 'overlay',
  'soft-light': 'soft-light',
  normal: 'source-over',
};

function getCanvasImageSourceDimensions(source: CanvasImageSource) {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  if (source instanceof HTMLCanvasElement) {
    return { width: source.width, height: source.height };
  }
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  return { width: 0, height: 0 };
}

export function drawImageCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number) {
  const { width: imgWidth, height: imgHeight } = getCanvasImageSourceDimensions(img);
  const imgAR = imgWidth / imgHeight;
  const canvasAR = w / h;
  let sx = 0, sy = 0, sw = imgWidth, sh = imgHeight;
  if (imgAR > canvasAR) {
    sw = imgHeight * canvasAR;
    sx = (imgWidth - sw) / 2;
  } else {
    sh = imgWidth / canvasAR;
    sy = (imgHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

export function drawImageCoverRotated(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number, angle: number) {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized === 0) {
    drawImageCover(ctx, img, w, h);
    return;
  }

  const swap = normalized === 90 || normalized === 270;
  const { width: imgWidth, height: imgHeight } = getCanvasImageSourceDimensions(img);
  const rotatedWidth = swap ? imgHeight : imgWidth;
  const rotatedHeight = swap ? imgWidth : imgHeight;
  const sourceAR = rotatedWidth / rotatedHeight;
  const targetAR = w / h;

  let sx = 0;
  let sy = 0;
  let sw = imgWidth;
  let sh = imgHeight;

  if (sourceAR > targetAR) {
    sw = Math.round(imgHeight * targetAR);
    sx = Math.round((imgWidth - sw) / 2);
  } else {
    sh = Math.round(imgWidth / targetAR);
    sy = Math.round((imgHeight - sh) / 2);
  }

  const drawWidth = swap ? h : w;
  const drawHeight = swap ? w : h;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(img, sx, sy, sw, sh, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

export function drawImageContainRotated(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number, angle: number) {
  const normalized = ((angle % 360) + 360) % 360;
  const swap = normalized === 90 || normalized === 270;
  const { width: imgWidth, height: imgHeight } = getCanvasImageSourceDimensions(img);
  const targetWidth = swap ? h : w;
  const targetHeight = swap ? w : h;
  const scale = Math.min(targetWidth / imgWidth, targetHeight / imgHeight);
  const drawWidth = Math.round(imgWidth * scale);
  const drawHeight = Math.round(imgHeight * scale);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(img, 0, 0, imgWidth, imgHeight, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

export function rotateImageData(source: ImageData, angle: number): ImageData {
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

export function cropImageDataRect(source: ImageData, rect: { x: number; y: number; w: number; h: number }): ImageData {
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
