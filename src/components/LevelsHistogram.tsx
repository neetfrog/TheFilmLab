import { useCallback, useEffect, useRef } from 'react';

export default function LevelsHistogram({
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
  }, [gamma, gammaToPosition, onInputBlackChange, onInputWhiteChange, onGammaChange, positionToGamma, clamp, clampGammaPosition]);

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
