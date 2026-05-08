import LibRaw from 'libraw-wasm';

// RAW file extensions
const RAW_EXTENSIONS = [
  '.raw', '.dng', '.nef', '.cr2', '.crw', '.arw', '.orf', '.raf',
  '.rw2', '.pef', '.srw', '.mrw', '.3fr', '.mef', '.mos',
] as const;

export function isRawFormat(filename: string): boolean {
  return RAW_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));
}

export interface DecodeOptions {
  maxDim?: number;
  onProgress?: (stage: string) => void;
}

// Decode standard image formats (JPG, PNG, TIFF, etc.)
export async function decodeStandardImage(
  blob: Blob,
  options?: DecodeOptions
): Promise<ImageData> {
  const { maxDim = 2400, onProgress } = options ?? {};
  
  onProgress?.('Decoding image...');
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        onProgress?.('Processing image...');
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (w > maxDim || h > maxDim) {
          const scale = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }

        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d')!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.getContext('2d')!.getImageData(0, 0, w, h));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode as standard image format'));
    };

    img.src = url;
  });
}

// Decode RAW files using LibRaw
export async function decodeWithLibRaw(
  uint8Array: Uint8Array,
  options?: DecodeOptions
): Promise<ImageData> {
  const { maxDim = 2400, onProgress } = options ?? {};
  
  try {
    onProgress?.('Initializing RAW decoder...');
    const libraw = new LibRaw();

    onProgress?.('Decoding RAW data...');
    await libraw.open(uint8Array, {
      bright: 1.0,
      useAutoWb: false,
      useCameraWb: true,
      outputColor: 1, // sRGB
      outputBps: 8, // 8 bits per sample
      userQual: 3, // interpolation quality
      halfSize: false,
    });

    onProgress?.('Extracting image data...');
    const rawImageData = await libraw.imageData();

    if (!rawImageData) {
      throw new Error('Failed to extract image data from RAW file');
    }

    const { width, height, data, colors } = rawImageData;

    // Resize if too large
    let finalWidth = width;
    let finalHeight = height;

    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      finalWidth = Math.round(width * scale);
      finalHeight = Math.round(height * scale);
    }

    onProgress?.('Converting to image format...');

    // Create the target canvas/imagedata
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = finalWidth;
    targetCanvas.height = finalHeight;
    const ctx = targetCanvas.getContext('2d')!;
    const imageData = ctx.createImageData(finalWidth, finalHeight);
    const imgData = imageData.data;

    // If we need to scale, first create a temporary canvas with original dimensions
    if (finalWidth !== width || finalHeight !== height) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d')!;
      const tempImageData = tempCtx.createImageData(width, height);
      const tempData = tempImageData.data;

      // Copy RGB data to temporary canvas
      for (let i = 0; i < Math.min(data.length, width * height * (colors || 3)); i += colors || 3) {
        const pixelIdx = i / (colors || 3);
        const dstIdx = pixelIdx * 4;

        tempData[dstIdx] = data[i] || 0;
        tempData[dstIdx + 1] = colors && colors > 1 ? (data[i + 1] || 0) : data[i] || 0;
        tempData[dstIdx + 2] = colors && colors > 2 ? (data[i + 2] || 0) : data[i] || 0;
        tempData[dstIdx + 3] = 255;
      }

      tempCtx.putImageData(tempImageData, 0, 0);

      // Scale to final size
      ctx.drawImage(tempCanvas, 0, 0, finalWidth, finalHeight);
      return ctx.getImageData(0, 0, finalWidth, finalHeight);
    } else {
      // No scaling needed - direct copy
      for (let i = 0; i < Math.min(data.length, width * height * (colors || 3)); i += colors || 3) {
        const pixelIdx = i / (colors || 3);
        const dstIdx = pixelIdx * 4;

        imgData[dstIdx] = data[i] || 0;
        imgData[dstIdx + 1] = colors && colors > 1 ? (data[i + 1] || 0) : data[i] || 0;
        imgData[dstIdx + 2] = colors && colors > 2 ? (data[i + 2] || 0) : data[i] || 0;
        imgData[dstIdx + 3] = 255;
      }

      return imageData;
    }
  } catch (error) {
    throw new Error(
      `RAW decoder error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Main decode function that handles both standard and RAW formats
export async function decodeImage(
  file: File,
  options?: DecodeOptions
): Promise<ImageData> {
  try {
    // Check for RAW format FIRST (by filename) before checking MIME type
    // CR2, NEF, etc. might have image/* MIME types but should use libraw
    if (isRawFormat(file.name)) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Try canvas image loading first for DNG
      if (file.name.toLowerCase().endsWith('.dng')) {
        try {
          return await decodeStandardImage(
            new Blob([uint8Array], { type: 'image/tiff' }),
            options
          );
        } catch (e) {
          // Fall through to libraw
        }
      }

      // Use libraw for other RAW formats
      return await decodeWithLibRaw(uint8Array, options);
    }
    
    // Try standard image format
    if (file.type.startsWith('image/')) {
      return await decodeStandardImage(file, options);
    }

    throw new Error(`Unsupported file format: ${file.name}`);
  } catch (error) {
    throw new Error(
      `Failed to decode image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Get accept attribute for file inputs
export function getImageAcceptAttribute(): string {
  const standards = '.jpg,.jpeg,.png,.tif,.tiff,.bmp,.webp';
  const raw = RAW_EXTENSIONS.join(',');
  return `image/*,${raw}`;
}
