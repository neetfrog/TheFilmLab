import { useEffect, useRef } from 'react';

export default function OriginalOverlay({ imageData, zoom }: { imageData: ImageData; zoom: number }) {
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
