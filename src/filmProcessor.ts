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
  purpleFringingOverride?: number;
  lensDistortionOverride?: number;
  colorShiftXOverride?: number;
  colorShiftYOverride?: number;
  whiteBalanceOverride?: number;
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

    // 3. White balance (color temperature adjustment)
    if (whiteBalance !== 0) {
      if (whiteBalance > 0) {
        // Warm (increase red/yellow, decrease blue)
        const warmAmount = whiteBalance * 0.3;
        r = Math.min(255, r * (1 + warmAmount));
        g = Math.min(255, g * (1 + warmAmount * 0.5));
        b = Math.max(0, b * (1 - warmAmount * 0.8));
      } else {
        // Cool (increase blue, decrease red/yellow)
        const coolAmount = Math.abs(whiteBalance) * 0.3;
        r = Math.max(0, r * (1 - coolAmount * 0.5));
        g = Math.max(0, g * (1 - coolAmount * 0.3));
        b = Math.min(255, b * (1 + coolAmount));
      }
    }

    // 4. Apply film curves (characteristic curve)
    r = lutR[Math.round(r)];
    g = lutG[Math.round(g)];
    b = lutB[Math.round(b)];

    // 5. Apply contrast with toe/shoulder
    r = contrastLUT[r];
    g = contrastLUT[g];
    b = contrastLUT[b];

    // 6. Color cast (split toning by luminance)
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

  // 7. Color shift
  if (colorShiftX !== 0 || colorShiftY !== 0) {
    applyColorShift(output, colorShiftX, colorShiftY, width, height);
  }

  // 8. Lens distortion (barrel/pincushion)
  if (lensDistortion !== 0) {
    return applyLensDistortion(output, lensDistortion);
  }

  // 9. Halation (light bleed around bright areas - CineStill signature)
  if (halationAmount > 0) {
    applyHalation(output, halationAmount, width, height);
  }

  // 10. Vignette - optimized with LUT
  if (vignetteAmount > 0) {
    applyVignetteLUT(output, vignetteAmount, width, height);
  }

  // 11. Purple fringing (chromatic aberration)
  if (purpleFringing > 0) {
    applyPurpleFringing(output, purpleFringing, width, height);
  }

  // 12. Film grain
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
      const idx = (y * width + x) * 4;

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
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);
  const distortionStrength = amount * 0.5;

  // First pass: find valid bounds (where we have source data)
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let hasValidData = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x - cx) / maxRadius;
      const ny = (y - cy) / maxRadius;
      const radius = Math.sqrt(nx * nx + ny * ny);

      const distortedRadius = radius * (1 + distortionStrength * radius * radius);
      let srcX: number, srcY: number;

      if (radius > 0) {
        const scale = distortedRadius / radius;
        srcX = cx + nx * maxRadius * scale;
        srcY = cy + ny * maxRadius * scale;
      } else {
        srcX = x;
        srcY = y;
      }

      // Check if source is within bounds
      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
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

  // Second pass: sample with crop and scale
  for (let outY = 0; outY < newHeight; outY++) {
    for (let outX = 0; outX < newWidth; outX++) {
      // Map output to cropped region
      const srcCropX = outX / scale + minX;
      const srcCropY = outY / scale + minY;

      // Get source coordinates after distortion
      const nx = (srcCropX - cx) / maxRadius;
      const ny = (srcCropY - cy) / maxRadius;
      const radius = Math.sqrt(nx * nx + ny * ny);

      const distortedRadius = radius * (1 + distortionStrength * radius * radius);
      let sampleX: number, sampleY: number;

      if (radius > 0) {
        const sampleScale = distortedRadius / radius;
        sampleX = cx + nx * maxRadius * sampleScale;
        sampleY = cy + ny * maxRadius * sampleScale;
      } else {
        sampleX = srcCropX;
        sampleY = srcCropY;
      }

      // Bilinear interpolation
      const x0 = Math.floor(sampleX);
      const y0 = Math.floor(sampleY);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);

      if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
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
      } else {
        // Out of bounds - transparent
        const outIdx = (outY * newWidth + outX) * 4;
        outData[outIdx] = 0;
        outData[outIdx + 1] = 0;
        outData[outIdx + 2] = 0;
        outData[outIdx + 3] = 255;
      }
    }
  }

  return output;
}

// Color shift: adds color tint based on position in image
function applyColorShift(imageData: ImageData, shiftX: number, shiftY: number, width: number, height: number): void {
  const data = imageData.data;
  
  // Normalize shift to 0-1 range for color intensity
  const intensityX = Math.abs(shiftX) * 0.2; // Scale for reasonable effect
  const intensityY = Math.abs(shiftY) * 0.2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate position-based shift (0 = none, 1 = max shift)
      const posX = x / width;
      const posY = y / height;

      // Apply color shifts based on position
      let rShift = 0;
      let gShift = 0;
      let bShift = 0;

      // Horizontal shift (cyan to red)
      if (shiftX > 0) {
        // Red shift (toward red)
        rShift = posX * intensityX * 30;
        bShift -= posX * intensityX * 15; // Reduce blue for cyan
      } else if (shiftX < 0) {
        // Cyan shift (toward cyan)
        bShift = (1 - posX) * intensityX * 30;
        rShift -= (1 - posX) * intensityX * 15; // Reduce red
      }

      // Vertical shift (blue to yellow)
      if (shiftY > 0) {
        // Yellow shift (red + green)
        rShift += posY * intensityY * 25;
        gShift += posY * intensityY * 25;
        bShift -= posY * intensityY * 20; // Reduce blue
      } else if (shiftY < 0) {
        // Blue shift
        bShift += (1 - posY) * intensityY * 30;
        rShift -= (1 - posY) * intensityY * 15;
        gShift -= (1 - posY) * intensityY * 15;
      }

      data[idx] = Math.max(0, Math.min(255, data[idx] + rShift));
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + gShift));
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + bShift));
    }
  }
}


