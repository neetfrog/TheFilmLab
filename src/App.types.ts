import type { FilmPreset } from './filmPresets';
import type { BlendMode, OverlayCategory } from './App.helpers';

export type FrameColor = 'none' | 'white' | 'black';
export type CropRatio = 'original' | '1:1' | '4:3' | '16:9';
export type CropDragType = 'move' | 'nw' | 'ne' | 'sw' | 'se';

export interface BatchImageEditState {
  selectedPreset: FilmPreset;
  frameColor: FrameColor;
  frameThickness: number;
  selectedOverlays: string[];
  overlayOpacityByCategory: Record<OverlayCategory, number>;
  overlayBlendByCategory: Record<OverlayCategory, BlendMode>;
  selectedFrame: string | null;
  rotation: number;
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
  crossProcessAmount: number | null;
  pushPullAmount: number | null;
  levelsInputBlack: number | null;
  levelsInputWhite: number | null;
  levelsGamma: number | null;
  levelsOutputBlack: number | null;
  levelsOutputWhite: number | null;
}

export interface BatchImage {
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

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HistoryEntry {
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
  crossProcessAmount: number | null;
  pushPullAmount: number | null;
  levelsInputBlack: number | null;
  levelsInputWhite: number | null;
  levelsGamma: number | null;
  levelsOutputBlack: number | null;
  levelsOutputWhite: number | null;
  frameColor: FrameColor;
  frameThickness: number;
  selectedOverlays: string[];
  overlayOpacityByCategory: Record<OverlayCategory, number>;
  overlayBlendByCategory: Record<OverlayCategory, BlendMode>;
  selectedFrame: string | null;
  rotation: number;
  activeBatchIndex: number | null;
}
