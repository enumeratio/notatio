import { oklabToRgb } from "./palettes.ts";

// The portrait's color mapping: (arg, ln|value|) -> RGB. `complex-plot.ts` writes the
// constants below into its fragment shader and `polarColor` applies the same formulas
// on the CPU, so the GPU and CPU portraits are one mapping with one table.

export const PORTRAIT = {
  /** 1 / 2π: the argument in turns, the position along the gradient. */
  turn: 0.15915494,
  /** 1 / ln 2: bands are the integer steps of log2|value|. */
  bandsPerNeper: 1.442695,
  /** Brightness at |v| → ∞ is 1; `baseGain` scales the compressed |v| / (1 + |v|) below it. */
  baseGain: 0.9,
  /** How far a band lifts brightness toward 1. */
  bandLift: 0.22,
  /** Saturation falls from 1 toward `satFloor` by `satDrop` of the way across a band. */
  satFloor: 0.82,
  satDrop: 0.18,
  /** The output encoding: pow(rgb, gamma). */
  gamma: 0.9,
  /** Outside `mask`: a faint grid, `ground` with `check` added on the cells where both fractions are >= 1/2. */
  maskGround: 0.05,
  maskCheck: 0.03,
  maskCellsPerUnit: 4,
  /** An unvouched sample: diagonal stripes of `hatchGround` and `hatchGround + hatchStripe`. */
  hatchGround: 0.2,
  hatchStripe: 0.12,
  hatchPeriod: 8,
} as const;

/** A number as a GLSL float literal. */
export const glslFloat = (x: number): string => (Number.isInteger(x) ? x.toFixed(1) : String(x));

export type Rgb = readonly [number, number, number];

export const POLE_COLOR: Rgb = [1, 1, 1];
export const ZERO_COLOR: Rgb = [0, 0, 0];

const fract = (x: number): number => x - Math.floor(x);

/** The gray of an unvouched sample at pixel center (`x`, `y`), y up: diagonal stripes. */
export function hatchColor(x: number, y: number): Rgb {
  const g = PORTRAIT.hatchGround + (fract((x + y) / PORTRAIT.hatchPeriod) >= 0.5 ? PORTRAIT.hatchStripe : 0);
  return [g, g, g];
}

/** The dimmed ground outside the mask radius, at plane point (re, im). */
export function maskColor(re: number, im: number): Rgb {
  const k = PORTRAIT.maskCellsPerUnit;
  const g = PORTRAIT.maskGround + (fract(re * k) >= 0.5 && fract(im * k) >= 0.5 ? PORTRAIT.maskCheck : 0);
  return [g, g, g];
}

/**
 * The gradient as the shader reads its uniform (`gradientUniform`): `MAX_STOPS` stops of (color, position),
 * then (count, OKLab, cyclic, unused). Returns the color at `t`, as the shader's `gradient()` does.
 */
export function uniformRampColor(uniform: Float32Array, maxStops: number, t0: number): Rgb {
  const n = uniform[maxStops * 4]!;
  const oklab = uniform[maxStops * 4 + 1]! > 0.5;
  const cyclic = uniform[maxStops * 4 + 2]! > 0.5;
  const t = cyclic ? fract(t0) : Math.min(1, Math.max(0, t0));
  let k = 1;
  while (k < n - 1 && uniform[k * 4 + 3]! < t) k++;
  const [a, b] = [(k - 1) * 4, k * 4];
  const f = Math.min(1, Math.max(0, (t - uniform[a + 3]!) / Math.max(uniform[b + 3]! - uniform[a + 3]!, 1e-6)));
  const mixed = [0, 1, 2].map((i) => uniform[a + i]! + (uniform[b + i]! - uniform[a + i]!) * f) as unknown as Rgb;
  return oklab ? oklabToRgb(mixed) : (mixed.map((c) => Math.min(1, Math.max(0, c))) as unknown as Rgb);
}

/**
 * The color of a value with argument `arg` and log-magnitude `logMag` (ln|v|): hue is the argument along
 * `ramp`, brightness the compressed magnitude with a band every factor of two. Infinite `logMag` is a pole
 * (white) and `-Infinity` a zero (black).
 */
export function polarColor(arg: number, logMag: number, ramp: (t: number) => Rgb): Rgb {
  if (!(logMag < 1e30)) return POLE_COLOR;
  if (!(logMag > -1e30)) return ZERO_COLOR;
  const p = PORTRAIT;
  const hue = fract(arg * p.turn);
  const bands = fract(logMag * p.bandsPerNeper);
  const base = 1 / (1 + Math.exp(-logMag));
  const val = Math.min(1, Math.max(0, base * p.baseGain + (1 - base * p.baseGain) * p.bandLift * bands));
  const sat = 1 + (p.satFloor - 1) * p.satDrop * bands;
  const c = ramp(hue);
  return [0, 1, 2].map((i) => (val * (1 + (c[i]! - 1) * sat)) ** p.gamma) as unknown as Rgb;
}
