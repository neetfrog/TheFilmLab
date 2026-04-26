import { useEffect, useRef } from 'react';
import { drawImageDataRotated } from '../App.helpers';

export default function OriginalOverlay({ imageData, rotation }: { imageData: ImageData; rotation: number }) {
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
      className="absolute inset-0 w-full h-full shadow-2xl"
      style={{ display: 'block' }}
    />
  );
}
