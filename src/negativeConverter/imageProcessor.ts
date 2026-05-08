// Film Negative Processing Engine
// C-41 color negative inversion, orange mask removal,
// dust removal, sharpening, grain, and advanced color grading

export interface ProcessingParams {
  filmType: 'color' | 'bw';
  autoWhiteBalance: boolean;
  maskRed: number;
  maskGreen: number;
  maskBlue: number;
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  saturation: number;
  vibrance: number;
  redMultiplier: number;
  greenMultiplier: number;
  blueMultiplier: number;
  dustRemoval: boolean;
  dustThreshold: number;
  dustRadius: number;
  sharpening: number;
  sharpeningRadius: number;
  grainAmount: number;
  gamma: number;
  curveMaster: Array<[number, number]>;
  curveRed: Array<[number, number]>;
  curveGreen: Array<[number, number]>;
  curveBlue: Array<[number, number]>;
}

export const defaultParams: ProcessingParams = {
  filmType: 'color',
  autoWhiteBalance: true,
  maskRed: 183,
  maskGreen: 111,
  maskBlue: 69,
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
  vibrance: 0,
  redMultiplier: 1.0,
  greenMultiplier: 1.0,
  blueMultiplier: 1.0,
  dustRemoval: false,
  dustThreshold: 50,
  dustRadius: 2,
  sharpening: 0,
  sharpeningRadius: 1,
  grainAmount: 0,
  gamma: 1.0,
  curveMaster: [[0, 0], [1, 1]],
  curveRed: [[0, 0], [1, 1]],
  curveGreen: [[0, 0], [1, 1]],
  curveBlue: [[0, 0], [1, 1]],
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 255): number {
  return Math.max(lo, Math.min(hi, v));
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function copyArray(src: Uint8ClampedArray): Uint8ClampedArray {
  const buf = new ArrayBuffer(src.length);
  const out = new Uint8ClampedArray(buf);
  out.set(src);
  return out;
}

// ─── Curve interpolation ──────────────────────────────────────────────────

function interpolateCurve(curve: Array<[number, number]>, x: number): number {
  if (curve.length === 0) return x;
  if (curve.length === 1) return curve[0][1];
  if (x <= curve[0][0]) return curve[0][1];
  if (x >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];

  for (let i = 0; i < curve.length - 1; i++) {
    if (x >= curve[i][0] && x <= curve[i + 1][0]) {
      const x0 = curve[i][0],
        y0 = curve[i][1];
      const x1 = curve[i + 1][0],
        y1 = curve[i + 1][1];
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t;
    }
  }

  return x;
}

function applyCurve(value: number, curve: Array<[number, number]>): number {
  return clamp01(interpolateCurve(curve, clamp01(value)));
}

// ─── Orange mask auto-detection ───────────────────────────────────────────

export function detectOrangeMask(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { r: number; g: number; b: number } {
  const border = Math.max(8, Math.floor(Math.min(width, height) * 0.04));
  type RGB = [number, number, number];
  const samples: RGB[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        x < border ||
        x >= width - border ||
        y < border ||
        y >= height - border
      ) {
        const i = (y * width + x) * 4;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }

  if (samples.length === 0) return { r: 183, g: 111, b: 69 };

  const pct = Math.max(1, Math.floor(samples.length * 0.05));
  samples.sort((a, b) => b[0] + b[1] + b[2] - (a[0] + a[1] + a[2]));
  const top = samples.slice(0, pct);
  return {
    r: top.reduce((s, p) => s + p[0], 0) / top.length,
    g: top.reduce((s, p) => s + p[1], 0) / top.length,
    b: top.reduce((s, p) => s + p[2], 0) / top.length,
  };
}

// ─── Gaussian blur ────────────────────────────────────────────────────────

function gaussianKernel(radius: number): number[] {
  const sigma = radius / 2;
  const kernel: number[] = [];
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(v);
    sum += v;
  }
  return kernel.map((v) => v / sum);
}

function gaussianBlur(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const kernel = gaussianKernel(radius);
  const tmp = new Uint8ClampedArray(new ArrayBuffer(src.length));
  const out = new Uint8ClampedArray(new ArrayBuffer(src.length));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = Math.max(0, Math.min(width - 1, x + k));
        const i = (y * width + sx) * 4;
        const w = kernel[k + radius];
        r += src[i] * w;
        g += src[i + 1] * w;
        b += src[i + 2] * w;
      }
      const o = (y * width + x) * 4;
      tmp[o] = r;
      tmp[o + 1] = g;
      tmp[o + 2] = b;
      tmp[o + 3] = src[o + 3];
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = Math.max(0, Math.min(height - 1, y + k));
        const i = (sy * width + x) * 4;
        const w = kernel[k + radius];
        r += tmp[i] * w;
        g += tmp[i + 1] * w;
        b += tmp[i + 2] * w;
      }
      const o = (y * width + x) * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = tmp[o + 3];
    }
  }
  return out;
}

// ─── Dust / hot-pixel removal ─────────────────────────────────────────────

function dustRemovalPass(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): Uint8ClampedArray {
  const out = copyArray(src);
  const thresh = (threshold / 100) * 255;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const ci = (y * width + x) * 4;
      let sumR = 0,
        sumG = 0,
        sumB = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ni = ((y + dy) * width + (x + dx)) * 4;
          sumR += src[ni];
          sumG += src[ni + 1];
          sumB += src[ni + 2];
        }
      }
      const aR = sumR / 8,
        aG = sumG / 8,
        aB = sumB / 8;
      if (
        Math.abs(src[ci] - aR) > thresh ||
        Math.abs(src[ci + 1] - aG) > thresh ||
        Math.abs(src[ci + 2] - aB) > thresh
      ) {
        out[ci] = aR;
        out[ci + 1] = aG;
        out[ci + 2] = aB;
      }
    }
  }
  return out;
}

// ─── Unsharp mask ─────────────────────────────────────────────────────────

function unsharpMask(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
  radius: number
): Uint8ClampedArray {
  const blurred = gaussianBlur(src, width, height, radius);
  const out = new Uint8ClampedArray(new ArrayBuffer(src.length));
  const str = amount / 100;
  for (let i = 0; i < src.length; i += 4) {
    out[i] = clamp(src[i] + (src[i] - blurred[i]) * str);
    out[i + 1] = clamp(src[i + 1] + (src[i + 1] - blurred[i + 1]) * str);
    out[i + 2] = clamp(src[i + 2] + (src[i + 2] - blurred[i + 2]) * str);
    out[i + 3] = src[i + 3];
  }
  return out;
}

// ─── Tone helpers ─────────────────────────────────────────────────────────

function sCurve(v: number, contrast: number): number {
  if (contrast === 0) return v;
  const c = contrast / 100;
  const factor = 1 + c * 2;
  const d = v - 0.5;
  return 0.5 + (d / (1 + Math.abs(d) * factor * 2)) * factor;
}

function hlSh(v: number, highlights: number, shadows: number): number {
  let out = v;
  if (highlights !== 0) {
    const m = v * v;
    out += (highlights / 200) * m * (1 - m) * 4;
  }
  if (shadows !== 0) {
    const m = (1 - v) * (1 - v);
    out += (shadows / 200) * m * (1 - m) * 4;
  }
  return out;
}

// ─── HSL ──────────────────────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function h2r(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [h2r(p, q, h + 1 / 3), h2r(p, q, h), h2r(p, q, h - 1 / 3)];
}

function satVib(
  r: number,
  g: number,
  b: number,
  sat: number,
  vib: number
): [number, number, number] {
  let cr = r,
    cg = g,
    cb = b;

  if (sat !== 0) {
    const gray = (r + g + b) / 3;
    const factor = 1 + sat / 100;
    cr = gray + (r - gray) * factor;
    cg = gray + (g - gray) * factor;
    cb = gray + (b - gray) * factor;
  }

  if (vib !== 0) {
    const max = Math.max(cr, cg, cb);
    const min = Math.min(cr, cg, cb);
    const delta = max - min;

    if (max > 0 && delta > 0) {
      const pixelSat = delta / max;
      const vibranceStrength = (1 - pixelSat) * (vib / 100) * 0.3;
      const mid = (max + min) / 2;
      cr = mid + (cr - mid) * (1 + vibranceStrength);
      cg = mid + (cg - mid) * (1 + vibranceStrength);
      cb = mid + (cb - mid) * (1 + vibranceStrength);
    }
  }

  return [clamp01(cr), clamp01(cg), clamp01(cb)];
}

// ─── Film grain ───────────────────────────────────────────────────────────

function filmGrain(src: Uint8ClampedArray, amount: number): Uint8ClampedArray {
  const out = copyArray(src);
  const str = (amount / 100) * 30;
  for (let i = 0; i < out.length; i += 4) {
    const n = (Math.random() - 0.5) * str;
    out[i] = clamp(out[i] + n);
    out[i + 1] = clamp(out[i + 1] + n * 0.95);
    out[i + 2] = clamp(out[i + 2] + n * 0.9);
  }
  return out;
}

// ─── MAIN PIPELINE ────────────────────────────────────────────────────────

export function processNegative(
  src: ImageData,
  params: ProcessingParams
): ImageData {
  const { width, height } = src;
  let raw = copyArray(src.data);

  // 1. Dust removal on raw scan (before inversion)
  if (params.dustRemoval) {
    raw = dustRemovalPass(raw, width, height, params.dustThreshold);
  }

  // 2. Inversion into float buffer [0..1]
  const mR = Math.max(0.001, params.maskRed / 255);
  const mG = Math.max(0.001, params.maskGreen / 255);
  const mB = Math.max(0.001, params.maskBlue / 255);
  const n = width * height;
  const floatR = new Float32Array(n);
  const floatG = new Float32Array(n);
  const floatB = new Float32Array(n);

  for (let pi = 0; pi < n; pi++) {
    const i = pi * 4;
    const r = raw[i] / 255;
    const g = raw[i + 1] / 255;
    const b = raw[i + 2] / 255;

    if (params.filmType === 'bw') {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const inv = clamp01(1 - lum / Math.max(mR, mG, mB));
      floatR[pi] = inv;
      floatG[pi] = inv;
      floatB[pi] = inv;
    } else {
      floatR[pi] = clamp01(1 - r / mR);
      floatG[pi] = clamp01(1 - g / mG);
      floatB[pi] = clamp01(1 - b / mB);
    }
  }

  // 3. Auto white balance
  let awbR = 1,
    awbG = 1,
    awbB = 1;
  if (params.autoWhiteBalance && params.filmType === 'color') {
    let sR = 0,
      sG = 0,
      sB = 0;
    for (let pi = 0; pi < n; pi++) {
      sR += floatR[pi];
      sG += floatG[pi];
      sB += floatB[pi];
    }
    const aR = sR / n,
      aG = sG / n,
      aB = sB / n;
    const gray = (aR + aG + aB) / 3;
    if (aR > 0.001) awbR = gray / aR;
    if (aG > 0.001) awbG = gray / aG;
    if (aB > 0.001) awbB = gray / aB;
  }

  // 4. Per-pixel colour adjustments
  const expF = Math.pow(2, params.exposure);
  const whiteAdj = 1 + params.whites / 200;
  const blackAdj = params.blacks / 500;
  const outBuf = new ArrayBuffer(n * 4);
  const outBytes = new Uint8ClampedArray(outBuf);

  for (let pi = 0; pi < n; pi++) {
    const oi = pi * 4;
    let r =
      floatR[pi] * awbR * params.redMultiplier * expF;
    let g =
      floatG[pi] * awbG * params.greenMultiplier * expF;
    let b =
      floatB[pi] * awbB * params.blueMultiplier * expF;

    r = hlSh(r, params.highlights, params.shadows);
    g = hlSh(g, params.highlights, params.shadows);
    b = hlSh(b, params.highlights, params.shadows);

    r = r * whiteAdj + blackAdj;
    g = g * whiteAdj + blackAdj;
    b = b * whiteAdj + blackAdj;

    r = sCurve(r, params.contrast);
    g = sCurve(g, params.contrast);
    b = sCurve(b, params.contrast);

    // Temperature (warm/cool) & tint (magenta/green)
    r += params.temperature * 0.001;
    b -= params.temperature * 0.001;
    g -= Math.abs(params.tint) * 0.0005;
    if (params.tint > 0) {
      r += params.tint * 0.0003;
      b += params.tint * 0.0003;
    }

    if (params.gamma !== 1.0) {
      r = Math.pow(Math.max(0, r), 1 / params.gamma);
      g = Math.pow(Math.max(0, g), 1 / params.gamma);
      b = Math.pow(Math.max(0, b), 1 / params.gamma);
    }

    const [sr, sg, sb] = satVib(
      clamp01(r),
      clamp01(g),
      clamp01(b),
      params.saturation,
      params.vibrance
    );

    // Apply curves (master first, then individual channels)
    let cr = applyCurve(sr, params.curveMaster);
    let cg = applyCurve(sg, params.curveMaster);
    let cb = applyCurve(sb, params.curveMaster);
    cr = applyCurve(cr, params.curveRed);
    cg = applyCurve(cg, params.curveGreen);
    cb = applyCurve(cb, params.curveBlue);

    outBytes[oi] = Math.round(clamp01(cr) * 255);
    outBytes[oi + 1] = Math.round(clamp01(cg) * 255);
    outBytes[oi + 2] = Math.round(clamp01(cb) * 255);
    outBytes[oi + 3] = raw[oi + 3];
  }

  // 5. Sharpening
  let finalBytes: Uint8ClampedArray = outBytes;
  if (params.sharpening > 0) {
    finalBytes = unsharpMask(
      outBytes,
      width,
      height,
      params.sharpening,
      Math.max(1, params.sharpeningRadius)
    );
  }

  // 6. Film grain
  if (params.grainAmount > 0) {
    finalBytes = filmGrain(finalBytes, params.grainAmount);
  }

  return new ImageData(
    new Uint8ClampedArray(new ArrayBuffer(finalBytes.length))
      .fill(0)
      .map((_v, i) => finalBytes[i]),
    width,
    height
  );
}

// ─── Histogram ────────────────────────────────────────────────────────────

export function computeHistogram(data: ImageData): {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
} {
  const r = new Array<number>(256).fill(0);
  const g = new Array<number>(256).fill(0);
  const b = new Array<number>(256).fill(0);
  const lum = new Array<number>(256).fill(0);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    r[d[i]]++;
    g[d[i + 1]]++;
    b[d[i + 2]]++;
    lum[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++;
  }
  return { r, g, b, lum };
}
