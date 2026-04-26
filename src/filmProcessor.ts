// Core film processing engine - Optimized
// Applies color grading, curves, tone mapping, halation, and vignette

import { FilmPreset } from './filmPresets';
import { generateGrainChannels, applyGrain } from './grainEngine';

const curveLUTCache = new Map<string, Uint8Array>();
const contrastLUTCache = new Map<string, Uint8Array>();
const levelsLUTCache = new Map<string, Uint8Array>();
const vignetteDistanceCache = new Map<string, Float32Array>();

function getLUTCacheKey(prefix: string, values: Array<number | string>) {
  return `${prefix}:${values.join(',')}`;
}

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

const applyWhiteBalance = (whiteBalance: number, r: number, g: number, b: number) => {
  if (whiteBalance === 0) return [r, g, b];
  const amount = Math.abs(whiteBalance) * 0.3;
  return whiteBalance > 0
    ? [
        clampByte(r * (1 + amount)),
        clampByte(g * (1 + amount * 0.5)),
        clampByte(b * (1 - amount * 0.8)),
      ]
    : [
        clampByte(r * (1 - amount * 0.5)),
        clampByte(g * (1 - amount * 0.3)),
        clampByte(b * (1 + amount)),
      ];
};

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
  const cacheKey = points.map(([x, y]) => `${x}:${y}`).join('|');
  const lookupKey = getLUTCacheKey('curve', [cacheKey]);
  const cached = curveLUTCache.get(lookupKey);
  if (cached) return cached;

  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(interpolateCurve(points, i / 255) * 255);
  }

  curveLUTCache.set(lookupKey, lut);
  return lut;
}

function getVignetteDistanceMap(width: number, height: number): Float32Array {
  const cacheKey = `${width}x${height}`;
  const cached = vignetteDistanceCache.get(cacheKey);
  if (cached) return cached;

  const distances = new Float32Array(width * height);
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    const dy2 = dy * dy;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      distances[y * width + x] = Math.sqrt(dx * dx + dy2) / maxDist;
    }
  }

  vignetteDistanceCache.set(cacheKey, distances);
  return distances;
}

// Pre-compute vignette LUT for faster application
function buildVignetteLUT(width: number, height: number, amount: number): Uint8Array {
  const distances = getVignetteDistanceMap(width, height);
  const lut = new Uint8Array(width * height);
  const a = amount * 1.5;

  for (let i = 0; i < distances.length; i++) {
    const vignette = Math.max(0, 1 - a * distances[i] * distances[i]);
    lut[i] = Math.round(vignette * 255);
  }

  return lut;
}

// S-curve for contrast with toe/shoulder control
function buildContrastLUT(contrast: number, toe: number, shoulder: number, fadedBlacks: number): Uint8Array {
  const cacheKey = getLUTCacheKey('contrast', [contrast, toe, shoulder, fadedBlacks]);
  const cached = contrastLUTCache.get(cacheKey);
  if (cached) return cached;

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

      // Additional S-curve (power-based, endpoint-preserving: 0→0, 0.5→0.5, 1→1)
      if (contrast > 0) {
        const ex = 1 + contrast * 2.5;
        if (x < 0.5) {
          x = 0.5 * Math.pow(Math.max(0, 2 * x), ex);
        } else {
          x = 1 - 0.5 * Math.pow(Math.max(0, 2 * (1 - x)), ex);
        }
      } else {
        x = 0.5 + (x - 0.5) * (1 + contrast);
      }
    }

    lut[i] = Math.max(0, Math.min(255, Math.round(x * 255)));
  }

  contrastLUTCache.set(cacheKey, lut);
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
  purpleFringingOverride?: number;
  lensDistortionOverride?: number;
  colorShiftXOverride?: number;
  colorShiftYOverride?: number;
  whiteBalanceOverride?: number;
  crossProcessOverride?: number;
  pushPullOverride?: number;
  levelsInputBlackOverride?: number;
  levelsInputWhiteOverride?: number;
  levelsGammaOverride?: number;
  levelsOutputBlackOverride?: number;
  levelsOutputWhiteOverride?: number;
}

function buildLevelsLUT(
  inputBlack: number,
  inputWhite: number,
  gamma: number,
  outputBlack: number,
  outputWhite: number,
): Uint8Array {
  const cacheKey = getLUTCacheKey('levels', [inputBlack, inputWhite, gamma, outputBlack, outputWhite]);
  const cached = levelsLUTCache.get(cacheKey);
  if (cached) return cached;

  const lut = new Uint8Array(256);
  const inRange = Math.max(0.001, inputWhite - inputBlack);
  const invGamma = 1 / Math.max(0.01, gamma);

  for (let i = 0; i < 256; i++) {
    let value = i / 255;
    value = (value - inputBlack) / inRange;
    value = Math.max(0, Math.min(1, value));
    value = Math.pow(value, invGamma);
    value = outputBlack + value * (outputWhite - outputBlack);
    lut[i] = Math.round(Math.max(0, Math.min(1, value)) * 255);
  }

  levelsLUTCache.set(cacheKey, lut);
  return lut;
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
  const purpleFringing = params.purpleFringingOverride ?? preset.purpleFringing;
  const lensDistortion = params.lensDistortionOverride ?? preset.lensDistortion;
  const colorShiftX = params.colorShiftXOverride ?? preset.colorShiftX;
  const colorShiftY = params.colorShiftYOverride ?? preset.colorShiftY;
  const whiteBalance = params.whiteBalanceOverride ?? preset.whiteBalance;
  const crossProcess = params.crossProcessOverride ?? 0;
  const pushPull = params.pushPullOverride ?? 0;
  const levelsInputBlack = params.levelsInputBlackOverride ?? preset.levelsInputBlack ?? 0;
  const levelsInputWhite = params.levelsInputWhiteOverride ?? preset.levelsInputWhite ?? 1;
  const levelsGamma = params.levelsGammaOverride ?? preset.levelsGamma ?? 1;
  const levelsOutputBlack = params.levelsOutputBlackOverride ?? preset.levelsOutputBlack ?? 0;
  const levelsOutputWhite = params.levelsOutputWhiteOverride ?? preset.levelsOutputWhite ?? 1;

  // Build LUTs
  const levelsLUT = buildLevelsLUT(levelsInputBlack, levelsInputWhite, levelsGamma, levelsOutputBlack, levelsOutputWhite);
  const lutR = buildCurveLUT(preset.curves.r);
  const lutG = buildCurveLUT(preset.curves.g);
  const lutB = buildCurveLUT(preset.curves.b);
  const contrastLUT = buildContrastLUT(contrast, preset.toeStrength, preset.shoulderStrength, fadedBlacks);

  // Exposure multiplier
  const exposureMult = Math.pow(2, exposure);
  const brightnessBias = brightness * 40;
  const satInv = saturation !== 1.0;
  const hasBalance = whiteBalance !== 0;
  const clamp = clampByte;

  // Process pixels with optimized loop
  const pixelCount = data.length;
  const shadowsTint = preset.shadows;
  const midtonesTint = preset.midtones;
  const highlightsTint = preset.highlights;

  for (let i = 0; i < pixelCount; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (exposure !== 0 || brightnessBias !== 0) {
      r = clamp(r * exposureMult + brightnessBias);
      g = clamp(g * exposureMult + brightnessBias);
      b = clamp(b * exposureMult + brightnessBias);
    }

    if (hasBalance) {
      [r, g, b] = applyWhiteBalance(whiteBalance, r, g, b);
    }

    const ri = levelsLUT[clamp(r)];
    const gi = levelsLUT[clamp(g)];
    const bi = levelsLUT[clamp(b)];

    r = contrastLUT[lutR[ri]];
    g = contrastLUT[lutG[gi]];
    b = contrastLUT[lutB[bi]];

    // 6. Push/pull tonal response
    if (pushPull !== 0) {
      const factor = 1 + pushPull * 0.4;
      r = Math.max(0, Math.min(255, 128 + (r - 128) * factor));
      g = Math.max(0, Math.min(255, 128 + (g - 128) * factor));
      b = Math.max(0, Math.min(255, 128 + (b - 128) * factor));
    }

    // 7. Color cast (split toning by luminance)
    const lum = r * 0.299 + g * 0.587 + b * 0.114;
    const lumNorm = lum / 255;

    // Shadow, midtone, highlight weights
    const shadowWeight = Math.max(0, 1 - lumNorm * 2.5);
    const midWeight = Math.sin(lumNorm * Math.PI);
    const highWeight = Math.max(0, lumNorm * 2 - 1);

    if (crossProcess !== 0) {
      const shift = crossProcess * 0.8;
      r = clampByte(r + shift * (highWeight * 18 - shadowWeight * 6));
      g = clampByte(g - shift * (highWeight * 8 - shadowWeight * 24));
      b = clampByte(b + shift * (highWeight * 12 - shadowWeight * 4));
    }

    r = clampByte(
      r + shadowsTint[0] * shadowWeight +
      midtonesTint[0] * midWeight +
      highlightsTint[0] * highWeight
    );
    g = clampByte(
      g + shadowsTint[1] * shadowWeight +
      midtonesTint[1] * midWeight +
      highlightsTint[1] * highWeight
    );
    b = clampByte(
      b + shadowsTint[2] * shadowWeight +
      midtonesTint[2] * midWeight +
      highlightsTint[2] * highWeight
    );

    // 6. Saturation adjustment (only if needed)
    if (satInv) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      const diff_r = r - gray;
      const diff_g = g - gray;
      const diff_b = b - gray;
      r = clampByte(gray + diff_r * saturation);
      g = clampByte(gray + diff_g * saturation);
      b = clampByte(gray + diff_b * saturation);
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  // 7. Color shift
  if (colorShiftX !== 0 || colorShiftY !== 0) {
    applyColorShift(output, colorShiftX, colorShiftY, width, height);
  }

  // 8. Halation (light bleed around bright areas - CineStill signature)
  if (halationAmount > 0) {
    applyHalation(output, halationAmount, width, height);
  }

  // 9. Vignette - optimized with LUT
  if (vignetteAmount > 0) {
    applyVignetteLUT(output, vignetteAmount, width, height);
  }

  // 10. Purple fringing (chromatic aberration)
  if (purpleFringing > 0) {
    applyPurpleFringing(output, purpleFringing, width, height);
  }

  // 11. Film grain
  if (grainAmount > 0) {
    const isBW = preset.type === 'bw-negative';
    const [grR, grG, grB] = generateGrainChannels(width, height, {
      amount: grainAmount,
      size: grainSize,
      roughness: grainRoughness,
      seed: grainSeed ?? Math.floor(Math.random() * 100000),
      monochrome: isBW ? true : undefined,
    });
    // Scale grain strength so 100% slider value corresponds to the previous 40% effect.
    applyGrain(output, grR, grG, grB, 0.4);
  }

  // 12. Lens distortion (barrel/pincushion)
  if (lensDistortion !== 0) {
    return applyLensDistortion(output, lensDistortion);
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
    // Lower threshold (0.4 instead of 0.65) and higher sensitivity for more visible halation
    brightMask[i] = Math.max(0, (lum - 0.4) / 0.6);
  }

  // Blur the bright mask (box blur approximation, multiple passes)
  const radius = Math.ceil(Math.min(width, height) * 0.025 * amount);
  const blurred = boxBlur(brightMask, width, height, radius);
  const blurred2 = boxBlur(blurred, width, height, radius);

  // Apply halation as warm/red glow with higher intensity
  const strength = amount * 120;
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const h = blurred2[i] * strength;
    data[idx] = Math.min(255, data[idx] + h * 1.2);       // Red
    data[idx + 1] = Math.min(255, data[idx + 1] + h * 0.4); // Green (slight)
    data[idx + 2] = Math.min(255, data[idx + 2] + h * 0.15); // Blue (minimal)
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

// Purple fringing: simulates chromatic aberration (color separation at edges)
function applyPurpleFringing(imageData: ImageData, amount: number, width: number, height: number): void {
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  const offset = Math.max(1, Math.ceil(amount * 3)); // Shift increases with amount (1-3 pixels)

  // Create separate channels for chromatic shift
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Red channel stays in place
      // Green channel shifts slightly toward upper-left
      // Blue channel shifts toward lower-right for purple/magenta fringing effect
      
      let gx = x - offset;
      let gy = y - offset;
      let bx = x + offset;
      let by = y + offset;

      // Clamp coordinates
      gx = Math.max(0, Math.min(width - 1, gx));
      gy = Math.max(0, Math.min(height - 1, gy));
      bx = Math.max(0, Math.min(width - 1, bx));
      by = Math.max(0, Math.min(height - 1, by));

      const rIdx = (y * width + x) * 4;
      const gIdx = (gy * width + gx) * 4;
      const bIdx = (by * width + bx) * 4;

      output[rIdx] = data[rIdx];         // R stays
      output[rIdx + 1] = data[gIdx + 1]; // G shifts
      output[rIdx + 2] = data[bIdx + 2]; // B shifts
      output[rIdx + 3] = data[rIdx + 3]; // A stays
    }
  }

  // Copy output back to data
  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }
}

// Lens distortion: barrel (positive) or pincushion (negative) distortion
// Automatically crops to avoid black edges
function applyLensDistortion(imageData: ImageData, amount: number): ImageData {
  if (amount <= 0) return imageData;

  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);
  const distortionStrength = amount * 0.5;

  const invertRadius = (rDist: number): number => {
    if (distortionStrength === 0) return rDist;

    // Solve rSrc * (1 + k * rSrc^2) = rDist via Newton iteration
    let rSrc = rDist;
    for (let i = 0; i < 6; i++) {
      const f = rSrc * (1 + distortionStrength * rSrc * rSrc) - rDist;
      const df = 1 + 3 * distortionStrength * rSrc * rSrc;
      if (df === 0) break;
      const delta = f / df;
      rSrc -= delta;
      if (Math.abs(delta) < 1e-6) break;
    }

    return Math.max(0, rSrc);
  };

  const mapToSource = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);

    if (r === 0) {
      return { sx: x, sy: y };
    }

    const rNorm = r / maxRadius;
    const rSrcNorm = invertRadius(rNorm);
    const scale = rSrcNorm / rNorm;
    return {
      sx: cx + dx * scale,
      sy: cy + dy * scale,
    };
  };

  // First pass: find valid bounds (where we have source data)
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let hasValidData = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const { sx, sy } = mapToSource(x, y);
      if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        hasValidData = true;
      }
    }
  }

  // If no valid data, return original
  if (!hasValidData) return imageData;

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  // Create cropped+scaled output
  const scaleX = width / cropWidth;
  const scaleY = height / cropHeight;
  const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

  const newWidth = Math.round(cropWidth * scale);
  const newHeight = Math.round(cropHeight * scale);
  const output = new ImageData(new Uint8ClampedArray(newWidth * newHeight * 4), newWidth, newHeight);
  const outData = output.data;

  // Second pass: sample with crop and scale, and bilinearly interpolate
  for (let outY = 0; outY < newHeight; outY++) {
    for (let outX = 0; outX < newWidth; outX++) {
      const srcCropX = outX / scale + minX;
      const srcCropY = outY / scale + minY;
      const { sx, sy } = mapToSource(srcCropX, srcCropY);

      const sampleX = Math.max(0, Math.min(width - 1, sx));
      const sampleY = Math.max(0, Math.min(height - 1, sy));

      const x0 = Math.floor(sampleX);
      const y0 = Math.floor(sampleY);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);

      const fx = sampleX - x0;
      const fy = sampleY - y0;
      const outIdx = (outY * newWidth + outX) * 4;

      for (let c = 0; c < 4; c++) {
        const idx00 = (y0 * width + x0) * 4 + c;
        const idx10 = (y0 * width + x1) * 4 + c;
        const idx01 = (y1 * width + x0) * 4 + c;
        const idx11 = (y1 * width + x1) * 4 + c;

        const v00 = data[idx00];
        const v10 = data[idx10];
        const v01 = data[idx01];
        const v11 = data[idx11];

        const v0 = v00 * (1 - fx) + v10 * fx;
        const v1 = v01 * (1 - fx) + v11 * fx;
        const v = v0 * (1 - fy) + v1 * fy;

        outData[outIdx + c] = Math.round(v);
      }

      // Preserve alpha as fully opaque
      outData[outIdx + 3] = 255;
    }
  }

  return output;
}

// Color shift: adds color tint based on position in image
function applyColorShift(imageData: ImageData, shiftX: number, shiftY: number, width: number, height: number): void {
  const data = imageData.data;
  const intensityX = Math.abs(shiftX) * 0.2;
  const intensityY = Math.abs(shiftY) * 0.2;

  for (let y = 0; y < height; y++) {
    const posY = y / height;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const posX = x / width;
      let rShift = 0;
      let gShift = 0;
      let bShift = 0;

      if (shiftX !== 0) {
        const xFade = shiftX > 0 ? posX : 1 - posX;
        const xAmount = intensityX * xFade;
        rShift += xAmount * (shiftX > 0 ? 30 : -15);
        bShift += xAmount * (shiftX > 0 ? -15 : 30);
      }

      if (shiftY !== 0) {
        const yFade = shiftY > 0 ? posY : 1 - posY;
        const yAmount = intensityY * yFade;
        rShift += yAmount * (shiftY > 0 ? 25 : -15);
        gShift += yAmount * (shiftY > 0 ? 25 : -15);
        bShift += yAmount * (shiftY > 0 ? -20 : 30);
      }

      data[idx] = clampByte(data[idx] + rShift);
      data[idx + 1] = clampByte(data[idx + 1] + gShift);
      data[idx + 2] = clampByte(data[idx + 2] + bShift);
    }
  }
}


