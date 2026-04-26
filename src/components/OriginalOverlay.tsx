import { useEffect, useRef } from 'react';
import { drawImageDataRotated } from '../App.helpers';

export default function OriginalOverlay({ imageData, zoom, rotation }: { imageData: ImageData; zoom: number; rotation: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.width = imageData.width;
      ref.current.height = imageData.height;
      const ctx = ref.current.getContext('2d');
      if (!ctx) return;
      drawImageDataRotated(ctx, imageData, rotation);
    }
  }, [imageData, rotation]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 m-auto max-w-full max-h-[calc(100vh-52px)] object-contain shadow-2xl"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
    />
  );
}
