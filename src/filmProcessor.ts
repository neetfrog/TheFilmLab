// Core film processing engine - Optimized
// Applies color grading, curves, tone mapping, halation, and vignette

import { FilmPreset } from './filmPresets';
import { generateGrainChannels, applyGrain } from './grainEngine';

// Fast cubic interpolation for curve points
function interpolateCurve(points: [number, number][], x: number): number {
  if (x <= points[0][0]) return points[0][1];
  if (x >= points[points.length - 1][0]) return points[points.length - 1][1];

  // Binary search for segment
  let left = 0, right = points.length - 1;
  while (left < right - 1) {
    const mid = (left + right) >>> 1;
    if (points[mid][0] < x) left = mid;
    else right = mid;
  }
  const i = left;

  const [x0, y0] = points[i];
  const [x1, y1] = points[i + 1];
  const dx = x1 - x0;
  const t = (x - x0) / dx;

  // Catmull-Rom tangent calculation
  const m0 = i > 0
    ? 0.5 * ((y1 - y0) / dx + (y0 - points[i - 1][1]) / (x0 - points[i - 1][0]))
    : (y1 - y0) / dx;
  const m1 = i < points.length - 2
    ? 0.5 * ((points[i + 2][1] - y1) / (points[i + 2][0] - x1) + (y1 - y0) / dx)
    : (y1 - y0) / dx;

  // Hermite basis
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return Math.max(0, Math.min(1, h00 * y0 + h10 * m0 * dx + h01 * y1 + h11 * m1 * dx));
}

// Build lookup tables for fast curve application
function buildCurveLUT(points: [number, number][]): Uint8Array {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(interpolateCurve(points, i / 255) * 255);
  }
  return lut;
}

// Pre-compute vignette LUT for faster application
function buildVignetteLUT(width: number, height: number, amount: number): Uint8Array {
  const lut = new Uint8Array(width * height);
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const a = amount * 1.5;
  
  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    const dy2 = dy * dy;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy2) / maxDist;
      const vignette = Math.max(0, 1 - a * dist * dist);
      lut[y * width + x] = Math.round(vignette * 255);
    }
  }
  
  return lut;
}

// S-curve for contrast with toe/shoulder control
function buildContrastLUT(contrast: number, toe: number, shoulder: number, fadedBlacks: number): Uint8Array {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let x = i / 255;

    // Faded blacks - lift the black point
    x = fadedBlacks + x * (1 - fadedBlacks);

    if (contrast !== 0) {
      // Modified sigmoid with toe/shoulder
      const mid = 0.5;
      if (x < mid) {
        const t = x / mid;
        const curved = Math.pow(t, 1 + toe * contrast * 3);
        x = curved * mid;
      } else {
        const t = (x - mid) / (1 - mid);
        const curved = 1 - Math.pow(1 - t, 1 + shoulder * contrast * 3);
        x = mid + curved * (1 - mid);
      }

      // Additional S-curve
      if (contrast > 0) {
        const c = contrast * 2;
        x = ((Math.atan((x - 0.5) * c * Math.PI) / Math.PI) + 0.5);
        x = x * (1 + contrast * 0.3) - contrast * 0.15;
      } else {
        x = 0.5 + (x - 0.5) * (1 + contrast);
      }
    }

    lut[i] = Math.max(0, Math.min(255, Math.round(x * 255)));
  }
  return lut;
}

export interface ProcessingParams {
  grainAmountOverride?: number;
  grainSizeOverride?: number;
  grainRoughnessOverride?: number;
  vignetteOverride?: number;
  halationOverride?: number;
  contrastOverride?: number;
  saturationOverride?: number;
  brightnessOverride?: number;
  fadedBlacksOverride?: number;
  exposureCompensation?: number;
}

export function processImage(
  source: ImageData,
  preset: FilmPreset,
  params: ProcessingParams = {},
  grainSeed?: number
): ImageData {
  const width = source.width;
  const height = source.height;
  const output = new ImageData(new Uint8ClampedArray(source.data), width, height);
  const data = output.data;

  // Resolve parameters (overrides take precedence)
  const contrast = params.contrastOverride ?? preset.contrast;
  const brightness = params.brightnessOverride ?? preset.brightness;
  const saturation = params.saturationOverride ?? preset.saturation;
  const fadedBlacks = params.fadedBlacksOverride ?? preset.fadedBlacks;
  const grainAmount = params.grainAmountOverride ?? preset.grainAmount;
  const grainSize = params.grainSizeOverride ?? preset.grainSize;
  const grainRoughness = params.grainRoughnessOverride ?? preset.grainRoughness;
  const vignetteAmount = params.vignetteOverride ?? preset.vignette;
  const halationAmount = params.halationOverride ?? preset.halation;
  const exposure = params.exposureCompensation ?? 0;

  // Build LUTs
  const lutR = buildCurveLUT(preset.curves.r);
  const lutG = buildCurveLUT(preset.curves.g);
  const lutB = buildCurveLUT(preset.curves.b);
  const contrastLUT = buildContrastLUT(contrast, preset.toeStrength, preset.shoulderStrength, fadedBlacks);

  // Exposure multiplier
  const exposureMult = Math.pow(2, exposure);
  const brightnessBias = brightness * 40;
  const satInv = saturation !== 1.0;

  // Process pixels with optimized loop
  const pixelCount = data.length;
  const shadowsTint = preset.shadows;
  const midtonesTint = preset.midtones;
  const highlightsTint = preset.highlights;

  for (let i = 0; i < pixelCount; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Exposure compensation
    if (exposure !== 0) {
      r = Math.min(255, r * exposureMult);
      g = Math.min(255, g * exposureMult);
      b = Math.min(255, b * exposureMult);
    }

    // 2. Brightness (fast path when zero)
    if (brightnessBias !== 0) {
      r = Math.max(0, Math.min(255, r + brightnessBias));
      g = Math.max(0, Math.min(255, g + brightnessBias));
      b = Math.max(0, Math.min(255, b + brightnessBias));
    }

    // 3. Apply film curves (characteristic curve)
    r = lutR[Math.round(r)];
    g = lutG[Math.round(g)];
    b = lutB[Math.round(b)];

    // 4. Apply contrast with toe/shoulder
    r = contrastLUT[r];
    g = contrastLUT[g];
    b = contrastLUT[b];

    // 5. Color cast (split toning by luminance)
    const lum = r * 0.299 + g * 0.587 + b * 0.114;
    const lumNorm = lum / 255;

    // Shadow, midtone, highlight weights
    const shadowWeight = Math.max(0, 1 - lumNorm * 2.5);
    const midWeight = Math.sin(lumNorm * Math.PI);
    const highWeight = Math.max(0, lumNorm * 2 - 1);

    r = Math.max(0, Math.min(255,
      r + shadowsTint[0] * shadowWeight +
      midtonesTint[0] * midWeight +
      highlightsTint[0] * highWeight
    ));
    g = Math.max(0, Math.min(255,
      g + shadowsTint[1] * shadowWeight +
      midtonesTint[1] * midWeight +
      highlightsTint[1] * highWeight
    ));
    b = Math.max(0, Math.min(255,
      b + shadowsTint[2] * shadowWeight +
      midtonesTint[2] * midWeight +
      highlightsTint[2] * highWeight
    ));

    // 6. Saturation adjustment (only if needed)
    if (satInv) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      const diff_r = r - gray;
      const diff_g = g - gray;
      const diff_b = b - gray;
      r = Math.max(0, Math.min(255, gray + diff_r * saturation));
      g = Math.max(0, Math.min(255, gray + diff_g * saturation));
      b = Math.max(0, Math.min(255, gray + diff_b * saturation));
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  // 7. Halation (light bleed around bright areas - CineStill signature)
  if (halationAmount > 0) {
    applyHalation(output, halationAmount, width, height);
  }

  // 8. Vignette - optimized with LUT
  if (vignetteAmount > 0) {
    applyVignetteLUT(output, vignetteAmount, width, height);
  }

  // 9. Film grain
  if (grainAmount > 0) {
    const isBW = preset.type === 'bw-negative';
    const [grR, grG, grB] = generateGrainChannels(width, height, {
      amount: grainAmount,
      size: grainSize,
      roughness: grainRoughness,
      seed: grainSeed ?? Math.floor(Math.random() * 100000),
      monochrome: isBW ? true : undefined,
    });
    applyGrain(output, grR, grG, grB, 1.0);
  }

  return output;
}

// Halation: red/warm glow around bright areas (simulates light scattering through film base)
function applyHalation(imageData: ImageData, amount: number, width: number, height: number): void {
  const data = imageData.data;

  // Create brightness mask
  const brightMask = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
    // Only bright areas trigger halation
    brightMask[i] = Math.max(0, (lum - 0.65) / 0.35);
  }

  // Blur the bright mask (box blur approximation, multiple passes)
  const radius = Math.ceil(Math.min(width, height) * 0.02 * amount);
  const blurred = boxBlur(brightMask, width, height, radius);
  const blurred2 = boxBlur(blurred, width, height, radius);

  // Apply halation as warm/red glow
  const strength = amount * 80;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const h = blurred2[i] * strength;
    data[idx] = Math.min(255, data[idx] + h * 1.0);       // Red
    data[idx + 1] = Math.min(255, data[idx + 1] + h * 0.3); // Green (slight)
    data[idx + 2] = Math.min(255, data[idx + 2] + h * 0.1); // Blue (minimal)
  }
}

// Fast box blur
function boxBlur(input: Float32Array, width: number, height: number, radius: number): Float32Array {
  if (radius < 1) return new Float32Array(input);
  const output = new Float32Array(width * height);
  const temp = new Float32Array(width * height);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    let sum = 0;
    const row = y * width;

    // Initialize window
    for (let x = 0; x <= radius && x < width; x++) {
      sum += input[row + x];
    }

    for (let x = 0; x < width; x++) {
      const count = Math.min(x + radius + 1, width) - Math.max(x - radius, 0);
      temp[row + x] = sum / count;
      if (x + radius + 1 < width) sum += input[row + x + radius + 1];
      if (x - radius >= 0) sum -= input[row + x - radius];
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = 0; y <= radius && y < height; y++) {
      sum += temp[y * width + x];
    }

    for (let y = 0; y < height; y++) {
      const count = Math.min(y + radius + 1, height) - Math.max(y - radius, 0);
      output[y * width + x] = sum / count;
      if (y + radius + 1 < height) sum += temp[(y + radius + 1) * width + x];
      if (y - radius >= 0) sum -= temp[(y - radius) * width + x];
    }
  }

  return output;
}

function applyVignetteLUT(imageData: ImageData, amount: number, width: number, height: number): void {
  const data = imageData.data;
  const vignetteLUT = buildVignetteLUT(width, height, amount);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const v = vignetteLUT[i] / 255;
    data[idx] = Math.round(data[idx] * v);
    data[idx + 1] = Math.round(data[idx + 1] * v);
    data[idx + 2] = Math.round(data[idx + 2] * v);
  }
}

