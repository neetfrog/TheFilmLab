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
  // RAW processing parameters (libraw level)
  exposure?: number;           // -2 to +2 EV
  brightness?: number;         // multiplier (1.0 = neutral)
  contrast?: number;           // -1 to +1
  saturation?: number;         // 0 to 2
  highlights?: number;         // -1 to +1
  shadows?: number;            // -1 to +1
  whiteBalance?: number;       // -1 to +1 (cool to warm)
  autoWhiteBalance?: boolean;
  useCameraWhiteBalance?: boolean;
  // Additional tone controls
  tint?: number;               // -150 to +150 (magenta/green)
  levelsInputBlack?: number;   // 0 to 255
  levelsInputWhite?: number;   // 0 to 255
  levelsGamma?: number;        // gamma adjustment
  levelsOutputBlack?: number;  // 0 to 255
  levelsOutputWhite?: number;  // 0 to 255
}

// Apply tone adjustments to decoded pixel data
function applyToneAdjustments(
  imageData: ImageData,
  options: {
    exposure?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    highlights?: number;
    shadows?: number;
    whiteBalance?: number;
    tint?: number;
    levelsInputBlack?: number;
    levelsInputWhite?: number;
    levelsGamma?: number;
    levelsOutputBlack?: number;
    levelsOutputWhite?: number;
  }
): ImageData {
  const {
    exposure = 0,
    brightness = 1.0,
    contrast = 0,
    saturation = 1.0,
    highlights = 0,
    shadows = 0,
    whiteBalance = 0,
    tint = 0,
    levelsInputBlack = 0,
    levelsInputWhite = 255,
    levelsGamma = 1,
    levelsOutputBlack = 0,
    levelsOutputWhite = 255,
  } = options;

  const data = imageData.data;
  const expMult = Math.pow(2, exposure);
  const brightMult = brightness * expMult;
  const contrastMult = 1 + contrast * 0.5;
  const satMult = saturation;
  const highlightsMult = 1 + highlights * 0.3;
  const shadowsMult = 1 + shadows * 0.3;
  
  // Precompute levels LUT
  const levelsLUT = new Uint8Array(256);
  const inputRange = levelsInputWhite - levelsInputBlack;
  const outputRange = levelsOutputWhite - levelsOutputBlack;
  for (let i = 0; i < 256; i++) {
    const normalized = (i - levelsInputBlack) / inputRange;
    const gammaAdjusted = Math.pow(Math.max(0, normalized), 1 / levelsGamma);
    levelsLUT[i] = Math.max(0, Math.min(255, levelsOutputBlack + gammaAdjusted * outputRange));
  }

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const a = data[i + 3];

    // Normalize to 0-1
    r /= 255;
    g /= 255;
    b /= 255;

    // Apply brightness/exposure
    r *= brightMult;
    g *= brightMult;
    b *= brightMult;

    // Apply tint (magenta/green shift)
    if (tint !== 0) {
      const tintAdjustment = tint * 0.2 / 150; // normalize to -1..1 range
      r += tintAdjustment * 0.5;
      g -= tintAdjustment;
      b += tintAdjustment * 0.5;
    }

    // Apply white balance (warm/cool shift)
    if (whiteBalance !== 0) {
      if (whiteBalance > 0) {
        // Warm: boost red/yellow
        r *= 1 + whiteBalance * 0.2;
        g *= 1 + whiteBalance * 0.1;
      } else {
        // Cool: boost blue
        b *= 1 - whiteBalance * 0.2;
      }
    }

    // Convert to HSL for saturation and tone adjustments
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let l = (max + min) / 2;

    let h = 0;
    let s = 0;
    if (max !== min) {
      s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / (max - min) + 2) / 6;
          break;
        case b:
          h = ((r - g) / (max - min) + 4) / 6;
          break;
      }
    }

    // Apply saturation
    s *= satMult;
    s = Math.min(1, s);

    // Apply highlights/shadows based on luminance
    if (l > 0.5) {
      l *= highlightsMult;
    } else {
      l *= shadowsMult;
    }

    // Apply contrast around midpoint
    let contrastL = (l - 0.5) * contrastMult + 0.5;

    // Convert back from HSL to RGB
    const hslToRgb = (h: number, s: number, l: number) => {
      let r2, g2, b2;
      if (s === 0) {
        r2 = g2 = b2 = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hueToRgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        r2 = hueToRgb(p, q, h + 1 / 3);
        g2 = hueToRgb(p, q, h);
        b2 = hueToRgb(p, q, h - 1 / 3);
      }
      return [r2, g2, b2];
    };

    [r, g, b] = hslToRgb(h, s, contrastL);

    // Clamp and convert to 0-255 before applying levels
    r = Math.max(0, Math.min(255, Math.round(r * 255)));
    g = Math.max(0, Math.min(255, Math.round(g * 255)));
    b = Math.max(0, Math.min(255, Math.round(b * 255)));

    // Apply levels LUT
    data[i] = levelsLUT[r];
    data[i + 1] = levelsLUT[g];
    data[i + 2] = levelsLUT[b];
    data[i + 3] = a;
  }

  return imageData;
}

// Decode standard image formats (JPG, PNG, TIFF, etc.)
export async function decodeStandardImage(
  blob: Blob,
  options?: DecodeOptions
): Promise<ImageData> {
  const { maxDim = 2400, onProgress, ...toneOptions } = options ?? {};
  
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
        let imageData = c.getContext('2d')!.getImageData(0, 0, w, h);

        // Apply tone adjustments if any are specified
        if (
          toneOptions.exposure || toneOptions.brightness || toneOptions.contrast ||
          toneOptions.saturation || toneOptions.highlights || toneOptions.shadows ||
          toneOptions.whiteBalance || toneOptions.tint ||
          toneOptions.levelsInputBlack || toneOptions.levelsInputWhite || 
          toneOptions.levelsGamma || toneOptions.levelsOutputBlack || toneOptions.levelsOutputWhite
        ) {
          onProgress?.('Applying tone adjustments...');
          imageData = applyToneAdjustments(imageData, toneOptions);
        }

        resolve(imageData);
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
  const {
    maxDim = 2400,
    onProgress,
    exposure = 0,
    brightness = 1.0,
    contrast = 0,
    saturation = 1.0,
    highlights = 0,
    shadows = 0,
    whiteBalance = 0,
    autoWhiteBalance = false,
    useCameraWhiteBalance = true,
  } = options ?? {};
  
  try {
    onProgress?.('Initializing RAW decoder...');
    const libraw = new LibRaw();

    // Map tone adjustments to libraw processing parameters
    const bright = brightness * Math.pow(2, exposure);  // exposure + brightness
    const sat = Math.max(0.1, saturation);              // saturation at libraw level
    const contr = 1 + contrast * 0.5;                   // convert -1..+1 to 0.5..1.5

    onProgress?.('Decoding RAW data...');
    await libraw.open(uint8Array, {
      bright,
      saturation: sat,
      contrast: contr,
      autoWb: autoWhiteBalance,
      useAutoWb: autoWhiteBalance,
      useCameraWb: useCameraWhiteBalance,
      outputColor: 1,    // sRGB
      outputBps: 8,      // 8 bits per sample
      userQual: 3,       // interpolation quality
      halfSize: false,
      // TODO: highlights/shadows control via libraw's tone curve APIs if available
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
