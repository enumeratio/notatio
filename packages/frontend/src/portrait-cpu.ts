import type { Complex, ComplexFunction } from "./complex-eval.ts";
import { type ComplexPlotView, gradientUniform, MAX_STOPS } from "./complex-plot.ts";
import type { Gradient } from "./palettes.ts";
import { hatchColor, maskColor, polarColor, type Rgb, uniformRampColor } from "./portrait-color.ts";
import { Uncertain } from "./uncertain.ts";

// The portrait drawn on the CPU where the shader can't be: the same view and the same color
// mapping (`portrait-color.ts`), over `[re, im]` tuples from `complex-eval.ts`. Pure: no DOM.

/** Pixel spacing of the first pass; each pass halves it down to 1. A coarse frame lands in 1/64 of the evaluations. */
export const FIRST_STEP = 8;

/** Time one chunk may hold the thread before the render yields, so a drag or a click is heard between chunks. */
export const CHUNK_MS = 12;

/**
 * Time a whole render may take. A head that costs milliseconds a point (Hurwitz or Lerch deep in the
 * plane) would otherwise refine for minutes; past this the render stops at the pass it reached.
 */
export const BUDGET_MS = 6000;

/** Points evaluated between clock reads. */
const CLOCK_EVERY = 16;

export interface PortraitSettings {
  f: ComplexFunction;
  view: ComplexPlotView;
  width: number;
  height: number;
  /** The gradient, as `uniformRampColor` reads it. */
  ramp: (t: number) => Rgb;
}

/** The gradient as the shader reads it, as a function of position along it. */
export function gradientRamp(g: Gradient): (t: number) => Rgb {
  let ramp = ramps.get(g);
  if (!ramp) {
    const uniform = gradientUniform(g);
    ramp = (t) => uniformRampColor(uniform, MAX_STOPS, t);
    ramps.set(g, ramp);
  }
  return ramp;
}

const ramps = new WeakMap<Gradient, (t: number) => Rgb>();

/** The pixel at column `x`, row `y` (top row first), as RGB in [0, 1]; the plane point it samples is its center's. */
export function portraitPixel(s: PortraitSettings, x: number, y: number): Rgb {
  const { view, width, height } = s;
  const asp = width / height;
  const u = (x + 0.5) / width;
  // Shader rows run bottom to top.
  const v = (height - y - 0.5) / height;
  const re = view.center[0] + (u - 0.5) * view.extent * asp;
  const im = view.center[1] + (v - 0.5) * view.extent;
  if (view.mask > 0 && re * re + im * im >= view.mask * view.mask) return maskColor(re, im);
  let w: Complex;
  try {
    w = s.f([re, im]);
  } catch (error) {
    if (error instanceof Uncertain) return hatchColor(x + 0.5, height - y - 0.5);
    throw error;
  }
  // NaN is a value the evaluator has no answer for; an infinity is a pole and drawn as one.
  if (Number.isNaN(w[0]) || Number.isNaN(w[1])) return hatchColor(x + 0.5, height - y - 0.5);
  return polarColor(Math.atan2(w[1], w[0]), Math.log(Math.hypot(w[0], w[1])), s.ramp);
}

export interface PortraitProgress {
  /** The finest pass whose pixels are all drawn: 8, 4, 2 or 1; 0 when not even the first finished. */
  step: number;
  /** True when pass 1 finished; false when the budget or a cancellation stopped it. */
  complete: boolean;
}

export interface PortraitHooks {
  /** `rgba` holds the drawn pixels so far; called after each chunk. */
  paint: (rgba: Uint8ClampedArray) => void;
  /** Resolves when the thread may continue; checked for cancellation after. */
  yieldToEventLoop: () => Promise<void>;
  /** True once a newer view has replaced this one. */
  cancelled: () => boolean;
  now: () => number;
}

const byte = (v: number): number => Math.round(Math.min(1, Math.max(0, v)) * 255);

/**
 * Draw the portrait into `rgba` (width × height, top row first) coarse to fine: every `FIRST_STEP`th
 * pixel fills its block, then each pass adds the pixels the last one left out. Chunks of `CHUNK_MS`
 * yield to the event loop; the render ends at the first of: the finest pass, `budgetMs`, cancellation.
 */
export async function renderPortrait(
  s: PortraitSettings,
  rgba: Uint8ClampedArray,
  hooks: PortraitHooks,
  budgetMs: number = BUDGET_MS,
): Promise<PortraitProgress> {
  const { width, height } = s;
  const start = hooks.now();
  let chunkStart = start;
  let evaluated = 0;
  let reached = 0;
  for (let step = FIRST_STEP; step >= 1; step /= 2) {
    const done = step * 2;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        // Pass `done` drew every pixel on its lattice, and this pass's block origin is on it.
        if (step < FIRST_STEP && x % done === 0 && y % done === 0) continue;
        const [r, g, b] = portraitPixel(s, x, y);
        const [R, G, B] = [byte(r), byte(g), byte(b)];
        for (let j = y; j < Math.min(y + step, height); j++) {
          for (let i = x; i < Math.min(x + step, width); i++) {
            const o = (j * width + i) * 4;
            rgba[o] = R;
            rgba[o + 1] = G;
            rgba[o + 2] = B;
            rgba[o + 3] = 255;
          }
        }
        // The clock is read every few points: a point can cost milliseconds, but a cheap one is a microsecond.
        if (++evaluated % CLOCK_EVERY === 0 && hooks.now() - chunkStart >= CHUNK_MS) {
          hooks.paint(rgba);
          await hooks.yieldToEventLoop();
          if (hooks.cancelled() || hooks.now() - start >= budgetMs) return { step: reached, complete: false };
          chunkStart = hooks.now();
        }
      }
    }
    reached = step;
    hooks.paint(rgba);
  }
  return { step: 1, complete: true };
}
