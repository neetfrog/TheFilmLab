// Realistic film grain engine - Optimized
// Generates organic-looking grain that responds to image luminance

// Fast PRNG hash (XORSHIFT-based)
function hash(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1274126177) | 0;
  h = (h >>> 13) ^ h;
  h = (h * 1103515245) | 0;
  return (((h >>> 16) ^ h) & 0x7fffffff) / 0x7fffffff;
}

// Perlin-style smooth noise
function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Smoothstep fade curve (3t² - 2t³)
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = hash(ix, iy, seed);
  const n10 = hash(ix + 1, iy, seed);
  const n01 = hash(ix, iy + 1, seed);
  const n11 = hash(ix + 1, iy + 1, seed);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);

  return nx0 + sy * (nx1 - nx0);
}

// Multi-octave fractal noise (improved roughness response)
function fractalNoise(x: number, y: number, octaves: number, roughness: number, seed: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * frequency, y * frequency, seed + i * 97) * amplitude;
    maxValue += amplitude;
    amplitude *= roughness;
    frequency *= 2;
  }

  return value / maxValue;
}

export interface GrainOptions {
  amount: number;      // 0-1
  size: number;        // 0.3-5, controls grain particle size
  roughness: number;   // 0-1, how clumpy/organic
  seed?: number;
  monochrome?: boolean; // true for B&W grain, false for color grain (chromatic)
}

// Generate a grain texture buffer (single channel, values centered around 0)
export function generateGrainTexture(
  width: number,
  height: number,
  options: GrainOptions
): Float32Array {
  const { amount, size, roughness, seed = Math.random() * 10000 } = options;
  const texture = new Float32Array(width * height);

  if (amount <= 0) return texture;

  const scale = Math.max(0.3, size);
  const octaves = roughness > 0.5 ? 4 : roughness > 0.25 ? 3 : 2;
  const invScale = 1 / scale;
  const roughnessAdjusted = 0.4 + roughness * 0.4;
  const fineAmount = 0.4 - roughness * 0.2;
  const grainScaled = amount * 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      // Base grain from fractal noise
      const nx = x * invScale;
      const ny = y * invScale;
      let grain = fractalNoise(nx, ny, octaves, roughnessAdjusted, seed);

      // Add fine detail layer
      const fineGrain = hash(x, y, seed + 500);
      grain = grain * (0.6 + roughness * 0.4) + fineGrain * fineAmount;

      // Center around 0 and scale by amount
      texture[idx] = (grain - 0.5) * grainScaled;
    }
  }

  return texture;
}

// Apply grain to image data with luminance-dependent response
// Real film grain is more visible in midtones and shadows
export function applyGrain(
  imageData: ImageData,
  grainR: Float32Array,
  grainG: Float32Array,
  grainB: Float32Array,
  strength: number
): void {
  const data = imageData.data;
  const len = imageData.width * imageData.height;
  const strengthScaled = strength * 255;

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Luminance for grain response curve
    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

    // Film grain is most visible in midtones, less in deep shadows and highlights
    // This mimics the density response of silver halide crystals: sin(lum * π) * 0.7 + 0.3
    const grainResponse = Math.sin(lum * Math.PI) * 0.7 + 0.3;
    const s = strengthScaled * grainResponse;

    data[idx] = Math.max(0, Math.min(255, r + grainR[i] * s));
    data[idx + 1] = Math.max(0, Math.min(255, g + grainG[i] * s));
    data[idx + 2] = Math.max(0, Math.min(255, b + grainB[i] * s));
  }
}

// Generate 3 channels of grain (for color or mono)
export function generateGrainChannels(
  width: number,
  height: number,
  options: GrainOptions
): [Float32Array, Float32Array, Float32Array] {
  const seed = options.seed ?? Math.floor(Math.random() * 100000);

  const grainR = generateGrainTexture(width, height, { ...options, seed });

  if (options.monochrome !== false) {
    // B&W grain: same noise for all channels
    return [grainR, grainR, grainR];
  }

  // Color grain: slightly different noise per channel (chromatic grain)
  const grainG = generateGrainTexture(width, height, { ...options, seed: seed + 1000 });
  const grainB = generateGrainTexture(width, height, { ...options, seed: seed + 2000 });
  return [grainR, grainG, grainB];
}
