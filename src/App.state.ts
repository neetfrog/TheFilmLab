import { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import { filmPresets } from './filmPresets';
import { processImage } from './filmProcessor';
import {
  PRESET_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  loadFromStorage,
  saveToStorage,
  CANVAS_BLEND,
  drawImageCover,
  drawImageCoverRotated,
  rotateImageData,
  cropImageDataRect,
} from './App.helpers';
import { getCropAspectRatio, clampCropRect } from './canvasUtils';
import type {
  BatchImage,
  BatchImageEditState,
  CropRect,
  CropRatio,
  CropDragType,
  HistoryEntry,
  FrameColor,
} from './App.types';
import type { ProcessingParams } from './filmProcessor';
import type { FilmPreset } from './filmPresets';

export function useFilmLabState() {
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
  const [cropRatio, setCropRatio] = useState<CropRatio>('original');
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [draggingCrop, setDraggingCrop] = useState(false);
  const cropDragRef = useRef<{ startX: number; startY: number; startRect: CropRect | null; type: CropDragType } | null>(null);
  const [canvasBounds, setCanvasBounds] = useState<DOMRect | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'color-negative' | 'bw-negative' | 'slide' | 'cinema' | 'custom'>('all');
  const [processing, setProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const [frameColor, setFrameColor] = useState<FrameColor>('none');
  const [frameThickness, setFrameThickness] = useState(8);
  const [grainSeed, setGrainSeed] = useState(42);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [framingToolOpen, setFramingToolOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [overlayCategories, setOverlayCategories] = useState<Array<'lightleaks' | 'bokeh' | 'textures'>>(['lightleaks']);
  const [selectedOverlays, setSelectedOverlays] = useState<string[]>([]);
  const [overlayOpacity, setOverlayOpacity] = useState(0.6);
  const [overlayBlend, setOverlayBlend] = useState<'screen' | 'multiply' | 'overlay' | 'soft-light' | 'normal'>('screen');
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const mainAreaRef = useRef<HTMLDivElement>(null);
  const processTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement[]>([]);
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);

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

  useEffect(() => {
    if (splitView) {
      setShowOriginal(false);
    }
  }, [splitView]);

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

  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);

    const debounceDelay = 80;
    processTimeoutRef.current = setTimeout(() => {
      setProcessing(true);
      requestAnimationFrame(() => {
        const result = processImage(imageData, selectedPreset, currentParams, grainSeed);
        const canvas = canvasRef.current!;
        canvas.width = result.width;
        canvas.height = result.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(result, 0, 0);

        setProcessedImageData(result);
        processedCanvasRef.current = canvas;
        setProcessing(false);
      });
    }, debounceDelay);

    return () => {
      if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
    };
  }, [imageData, selectedPreset, currentParams, grainSeed]);

  useEffect(() => {
    if (!imageData || !originalCanvasRef.current) return;
    const canvas = originalCanvasRef.current;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  }, [imageData]);

  useEffect(() => {
    if (!processedImageData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;
    canvas.getContext('2d')!.putImageData(processedImageData, 0, 0);
  }, [processedImageData]);

  useEffect(() => {
    if (!splitView || !imageData) return;
    if (originalCanvasRef.current) {
      originalCanvasRef.current.width = imageData.width;
      originalCanvasRef.current.height = imageData.height;
      originalCanvasRef.current.getContext('2d')!.putImageData(imageData, 0, 0);
    }
    if (canvasRef.current && processedImageData) {
      canvasRef.current.width = processedImageData.width;
      canvasRef.current.height = processedImageData.height;
      canvasRef.current.getContext('2d')!.putImageData(processedImageData, 0, 0);
    }
  }, [splitView, imageData, processedImageData]);

  useEffect(() => {
    overlayImgRef.current = [];
    selectedOverlays.forEach((url) => {
      const img = new Image();
      img.onload = () => { overlayImgRef.current.push(img); };
      img.src = url;
    });
  }, [selectedOverlays]);

  useEffect(() => {
    if (!selectedFrame) { frameImgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { frameImgRef.current = img; };
    img.src = selectedFrame;
  }, [selectedFrame]);

  const getCurrentBatchEditState = useCallback((): BatchImageEditState => ({
    selectedPreset,
    frameColor,
    frameThickness,
    selectedOverlays,
    overlayOpacity,
    overlayBlend,
    selectedFrame,
    rotation,
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
  }), [selectedPreset, frameColor, frameThickness, selectedOverlays, overlayOpacity, overlayBlend, selectedFrame, grainAmount, grainSize, grainRoughness, vignetteAmount, halationAmount, contrastAmount, saturationAmount, brightnessAmount, fadedBlacks, exposure, purpleFringing, lensDistortion, colorShiftX, colorShiftY, whiteBalance, levelsInputBlack, levelsInputWhite, levelsGamma, levelsOutputBlack, levelsOutputWhite]);

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
    setSelectedOverlays(entry.editState.selectedOverlays);
    setOverlayOpacity(entry.editState.overlayOpacity);
    setOverlayBlend(entry.editState.overlayBlend);
    setSelectedFrame(entry.editState.selectedFrame);
    setRotation(entry.editState.rotation);
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
  }, [addBatchEntry, batchImages.length, getCurrentBatchEditState]);

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
  }, [addBatchEntry, batchImages.length, getCurrentBatchEditState]);

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
    setSelectedOverlays(entry.editState.selectedOverlays);
    setOverlayOpacity(entry.editState.overlayOpacity);
    setOverlayBlend(entry.editState.overlayBlend);
    setSelectedFrame(entry.editState.selectedFrame);
    setRotation(entry.editState.rotation);
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
      selectedOverlays,
      overlayOpacity,
      overlayBlend,
      selectedFrame,
      rotation,
      activeBatchIndex,
    };
  }, [imageData, selectedPreset, grainAmount, grainSize, grainRoughness, vignetteAmount, halationAmount, contrastAmount, saturationAmount, brightnessAmount, fadedBlacks, exposure, purpleFringing, lensDistortion, colorShiftX, colorShiftY, whiteBalance, levelsInputBlack, levelsInputWhite, levelsGamma, levelsOutputBlack, levelsOutputWhite, frameColor, frameThickness, selectedOverlays, overlayOpacity, overlayBlend, selectedFrame, rotation, activeBatchIndex]);

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
    setSelectedOverlays(snapshot.selectedOverlays);
    setOverlayOpacity(snapshot.overlayOpacity);
    setOverlayBlend(snapshot.overlayBlend);
    setSelectedFrame(snapshot.selectedFrame);
    setRotation(snapshot.rotation);
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

    const targetRatio = getCropAspectRatio(cropRatio, imageData.width, imageData.height);

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
    setRotation((prev) => ((prev + angle) % 360 + 360) % 360);
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

    const aspectRatio = getCropAspectRatio(cropRatio, start.w, start.h);

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

    setCropRect(clampCropRect(next, minSize));
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
    setRotation(0);
  }, [pushHistory]);

  useEffect(() => {
    const el = mainAreaRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!image) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((prev) => Math.min(3, Math.max(0.5, prev + delta)));
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
    if (selectedOverlays.length > 0 && overlayImgRef.current.length > 0) {
      overlayImgRef.current.forEach((img) => {
        if (!img) return;
        ctx.save();
        ctx.globalAlpha = overlayOpacity;
        ctx.globalCompositeOperation = CANVAS_BLEND[overlayBlend] || 'source-over';
        drawImageCoverRotated(ctx, img, dstCanvas.width, dstCanvas.height, rotation);
        ctx.restore();
      });
    }
    if (selectedFrame && frameImgRef.current) {
      ctx.save();
      drawImageCoverRotated(ctx, frameImgRef.current, dstCanvas.width, dstCanvas.height, rotation);
      ctx.restore();
    }
    const link = document.createElement('a');
    link.download = `${selectedPreset.brand}-${selectedPreset.name.replace(/\s+/g, '-')}.jpg`;
    link.href = dstCanvas.toDataURL('image/jpeg', 0.95);
    link.click();
  }, [selectedPreset, frameColor, frameThickness, selectedOverlays, overlayOpacity, overlayBlend, selectedFrame, rotation]);

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

  const customPresetItems = useMemo(() => customPresets.filter((preset) => {
    if (showFavoritesOnly && !favorites.includes(preset.id)) return false;
    return filterType === 'custom' || (filterType === 'all' && showFavoritesOnly);
  }), [customPresets, filterType, showFavoritesOnly, favorites]);

  const filteredPresets = useMemo(() => filmPresets.filter((preset) => {
    if (showFavoritesOnly && !favorites.includes(preset.id)) return false;
    if (filterType === 'custom') return false;
    return filterType === 'all' || preset.type === filterType;
  }), [filterType, showFavoritesOnly, favorites]);

  const displayedPresets = useMemo(() => [...customPresetItems, ...filteredPresets], [customPresetItems, filteredPresets]);

  const selectPreset = useCallback((preset: FilmPreset) => {
    if (imageData) pushHistory();
    setSelectedPreset(preset);
  }, [imageData, pushHistory]);

  const activeOverlayBlend = selectedOverlays.length > 0 ? overlayBlend : 'normal';

  const currentPresetIndex = displayedPresets.findIndex((p) => p.id === selectedPreset.id);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!image) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextPreset();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevPreset();
      } else if (e.key === '[' || e.key === '{') {
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

  const eff = useMemo(() => ({
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
  }), [grainAmount, grainSize, grainRoughness, vignetteAmount, halationAmount, contrastAmount, saturationAmount, brightnessAmount, fadedBlacks, purpleFringing, lensDistortion, colorShiftX, colorShiftY, whiteBalance, levelsInputBlack, levelsInputWhite, levelsGamma, levelsOutputBlack, levelsOutputWhite, selectedPreset]);

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

  const hasOverrides = useMemo(() => (
    grainAmount !== null || grainSize !== null || grainRoughness !== null ||
    vignetteAmount !== null || halationAmount !== null || contrastAmount !== null ||
    saturationAmount !== null || brightnessAmount !== null || fadedBlacks !== null || exposure !== 0 ||
    purpleFringing !== null || lensDistortion !== null || colorShiftX !== null || colorShiftY !== null || whiteBalance !== null ||
    levelsInputBlack !== null || levelsInputWhite !== null || levelsGamma !== null || levelsOutputBlack !== null || levelsOutputWhite !== null
  ), [grainAmount, grainSize, grainRoughness, vignetteAmount, halationAmount, contrastAmount, saturationAmount, brightnessAmount, fadedBlacks, exposure, purpleFringing, lensDistortion, colorShiftX, colorShiftY, whiteBalance, levelsInputBlack, levelsInputWhite, levelsGamma, levelsOutputBlack, levelsOutputWhite]);

  const handleSplitMove = useCallback((clientX: number) => {
    if (!draggingSplit || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.max(2, Math.min(98, x)));
  }, [draggingSplit]);

  return {
    image,
    imageData,
    selectedPreset,
    customPresets,
    favorites,
    customPresetName,
    customPresetDescription,
    batchImages,
    activeBatchIndex,
    cropMode,
    cropRatio,
    cropRect,
    draggingCrop,
    canvasBounds,
    showFavoritesOnly,
    history,
    redoStack,
    filterType,
    processing,
    showOriginal,
    splitView,
    splitPos,
    draggingSplit,
    frameColor,
    frameThickness,
    grainSeed,
    loadingDemo,
    sidebarOpen,
    isAboutOpen,
    zoom,
    overlayCategories,
    selectedOverlays,
    overlayOpacity,
    overlayBlend,
    selectedFrame,
    rotation,
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
    processedImageData,
    canvasRef,
    originalCanvasRef,
    fileInputRef,
    splitContainerRef,
    mainAreaRef,
    handleBatchFiles,
    handleDrop,
    selectBatchImage,
    handleDemo,
    handleDownloadBatch,
    handleUndo,
    handleRedo,
    resetOverrides,
    handleDownload,
    applyCrop,
    applyRotation,
    resetTransform,
    onCropPointerDown,
    onCropPointerMove,
    onCropPointerUp,
    handleSaveCustomPreset,
    deleteCustomPreset,
    toggleFavorite,
    goToNextPreset,
    goToPrevPreset,
    setSidebarOpen,
    setShowOriginal,
    setSplitView,
    setSplitPos,
    setDraggingSplit,
    setCropMode,
    setCropRatio,
    setFilterType,
    setShowFavoritesOnly,
    setFrameColor,
    setFrameThickness,
    setOverlayCategories,
    setSelectedOverlays,
    setOverlayOpacity,
    setOverlayBlend,
    setSelectedFrame,
    setGrainAmount,
    setGrainSize,
    setGrainRoughness,
    setVignetteAmount,
    setHalationAmount,
    setContrastAmount,
    setSaturationAmount,
    setBrightnessAmount,
    setFadedBlacks,
    setExposure,
    setPurpleFringing,
    setLensDistortion,
    setColorShiftX,
    setColorShiftY,
    setWhiteBalance,
    setLevelsInputBlack,
    setLevelsInputWhite,
    setLevelsGamma,
    setLevelsOutputBlack,
    setLevelsOutputWhite,
    setCustomPresetName,
    setCustomPresetDescription,
    setCropRect,
    setZoom,
    setLoadingDemo,
    setIsAboutOpen,
    setFramingToolOpen,
    setGrainSeed,
    setImage,
    setImageData,
    setActiveBatchIndex,
    setProcessing,
    setSelectedPreset,
    selectPreset,
    currentParams,
    frameBackground,
    framePadding,
    getCurrentBatchEditState,
    displayedPresets,
    filteredPresets,
    customPresetItems,
    activeOverlayBlend,
    currentPresetIndex,
    hasOverrides,
    eff,
    levelsHistogram,
    handleSplitMove,
    setBatchImages,
    framingToolOpen,
  };
}
