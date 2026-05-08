/**
 * White Balance Utilities
 * Provides neutral-point-based WB calculation
 * Similar to Lightroom's eyedropper tool
 */

export interface WBMultipliers {
  r: number;
  g: number;
  b: number;
}

const MIN_KELVIN = 2000;
const MAX_KELVIN = 50000;
const NEUTRAL_KELVIN = 6500;

// Convert white balance (-1 to 1) to Kelvin for display
// -1 = cold (50000K), 0 = neutral (6500K), 1 = warm (2000K)
export function whiteBalanceToKelvin(value: number): number {
  if (value >= 0) {
    return Math.round(NEUTRAL_KELVIN - value * (NEUTRAL_KELVIN - MIN_KELVIN));
  }
  return Math.round(NEUTRAL_KELVIN - value * (MAX_KELVIN - NEUTRAL_KELVIN));
}

// Convert Kelvin to white balance (-1 to 1)
export function kelvinToWhiteBalance(kelvin: number): number {
  const clamped = Math.max(MIN_KELVIN, Math.min(MAX_KELVIN, kelvin));
  if (clamped >= NEUTRAL_KELVIN) {
    return Math.max(-1, Math.min(1, (NEUTRAL_KELVIN - clamped) / (MAX_KELVIN - NEUTRAL_KELVIN)));
  }
  return Math.max(-1, Math.min(1, (NEUTRAL_KELVIN - clamped) / (NEUTRAL_KELVIN - MIN_KELVIN)));
}

export function kelvinFromRGB(r: number, g: number, b: number): number {
  const red = Math.max(r, 1);
  const blue = Math.max(b, 1);
  const ratio = blue / red;
  const kelvin = 6500 * ratio;
  return Math.round(Math.max(MIN_KELVIN, Math.min(MAX_KELVIN, kelvin)) / 100) * 100;
}

/**
 * Calculate WB multipliers from a neutral sample
 * Assumes the sampled pixel should be neutral gray (R=G=B)
 * Returns multipliers to apply to each channel to normalize it
 */
export function calculateNeutralWB(r: number, g: number, b: number): WBMultipliers {
  // Avoid division by zero
  if (r < 1 && g < 1 && b < 1) {
    return { r: 1, g: 1, b: 1 };
  }

  // Calculate average of all channels
  const avg = (r + g + b) / 3;

  // Multiplier = avg / channel, so each channel becomes avg
  const wbR = avg / Math.max(r, 1);
  const wbG = avg / Math.max(g, 1);
  const wbB = avg / Math.max(b, 1);

  // Normalize so max multiplier is 1 (preserve overall exposure)
  // Actually, normalize to max = 1 is wrong - we want to preserve the average level
  // Better: normalize so the geometric mean is 1
  const mean = Math.cbrt(wbR * wbG * wbB);

  return {
    r: wbR / mean,
    g: wbG / mean,
    b: wbB / mean,
  };
}

/**
 * Apply WB multipliers to RGB values
 */
export function applyWBMultipliers(
  r: number,
  g: number,
  b: number,
  multipliers: WBMultipliers
): [number, number, number] {
  return [
    Math.min(255, r * multipliers.r),
    Math.min(255, g * multipliers.g),
    Math.min(255, b * multipliers.b),
  ];
}

/**
 * Sample RGB at a point in ImageData
 */
export function samplePixel(imageData: ImageData, x: number, y: number): [number, number, number] {
  const { width, data } = imageData;
  const idx = (Math.floor(y) * width + Math.floor(x)) * 4;

  return [data[idx], data[idx + 1], data[idx + 2]];
}

/**
 * Sample a small region (3x3 or 5x5) to reduce noise
 */
export function sampleRegion(
  imageData: ImageData,
  x: number,
  y: number,
  radius: number = 2
): [number, number, number] {
  const { width, height, data } = imageData;
  const cx = Math.floor(x);
  const cy = Math.floor(y);

  let sumR = 0,
    sumG = 0,
    sumB = 0;
  let count = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = cx + dx;
      const py = cy + dy;

      if (px >= 0 && px < width && py >= 0 && py < height) {
        const idx = (py * width + px) * 4;
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        count++;
      }
    }
  }

  return [sumR / count, sumG / count, sumB / count];
}
