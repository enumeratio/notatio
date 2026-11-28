// Plots of a complex-valued function by its parts: `ReImPlot` and `AbsArgPlot` over a real variable,
// and `ComplexContourPlot` over the plane. Each samples the function with the engine-free complex
// evaluator (`complexFunction`), so the page, the build and a terminal draw the same figure.

import type { Box } from "@notatio/boxes";
import type { Complex, ComplexFunction } from "./complex-eval.ts";
import { autoLevels, complexContourBox } from "./contour.ts";
import type { PlotPoint, PlotSeries } from "./plot-box.ts";
import { fieldAxes, fieldOptionsOf, type PlotSettings, spanOf } from "./plot-lowering.ts";
import { type PlotWindow, plotSeries, plotSeriesIn } from "./plot.ts";

/** The heads drawn from a complex function's parts, and the `parts` setting each fixes. */
export const COMPLEX_PART_HEADS: Readonly<Record<string, "reim" | "absarg" | "contours">> = {
  ReImPlot: "reim",
  AbsArgPlot: "absarg",
  ComplexContourPlot: "contours",
};

/** The real domain and sample count a parts plot is drawn over when it gives none: a curve plot's own. */
const DOMAIN: readonly [number, number] = [-6.283185, 6.283185];
const SAMPLES = 160;
/** Contour levels each of the two families draws when `Contours` gives no count. */
const LEVELS = 8;

/** `f` at a point, with no value where the evaluator cannot vouch for one. */
const valueAt = (f: ComplexFunction, z: Complex): Complex => {
  try {
    return f(z);
  } catch {
    return [Number.NaN, Number.NaN];
  }
};

/** The argument of a value as a color on the hue wheel: red at arg 0, cyan at arg π. */
export const argColor = ([re, im]: Complex): string | undefined => {
  if (!Number.isFinite(re) || !Number.isFinite(im)) return undefined;
  const turn = Math.atan2(im, re) / (2 * Math.PI);
  return `hsl(${Math.round(360 * (turn < 0 ? turn + 1 : turn))} 70% 50%)`;
};

/**
 * `ReImPlot`'s two curves, the real and the imaginary part of `f` over a real variable, or
 * `AbsArgPlot`'s one, its modulus with each point colored by its argument. Over `window` when a
 * reader has zoomed.
 */
export function complexPartSeries(
  kind: "reim" | "absarg",
  f: ComplexFunction,
  settings: PlotSettings,
  window?: PlotWindow,
  pixels?: number,
): PlotSeries[] {
  const items = kind === "reim" ? [{ label: "Re" }, { label: "Im" }] : [{ label: "Abs" }];
  const at =
    (k: number) =>
    (t: number): number => {
      const [re, im] = valueAt(f, [t, 0]);
      return kind === "absarg" ? Math.hypot(re, im) : k === 0 ? re : im;
    };
  const options = {
    domain: spanOf(settings["domain"]) ?? DOMAIN,
    samples: Number(settings["samples"]) || SAMPLES,
    adaptive: settings["adaptive"] !== "false",
  };
  const series =
    window === undefined ? plotSeries(items, at, options) : plotSeriesIn(items, at, options, window, pixels);
  if (kind !== "absarg") return series;
  return series.map((s) => ({
    ...s,
    points: s.points.map((p): PlotPoint => {
      const color = argColor(valueAt(f, [p.x, 0]));
      return color === undefined ? p : { ...p, color };
    }),
  }));
}

/** The levels of the two families of a `ComplexContourPlot`, fitted to the whole plot once. */
export interface ComplexLevels {
  readonly re: readonly number[];
  readonly im: readonly number[];
}

/**
 * `ComplexContourPlot`: the level curves of the real part of `f` and of its imaginary part over a
 * rectangle of the plane (`xrange` by `yrange`), in two colors. `levels` are a zoomed view's: the
 * whole plot's, so a window keeps them.
 */
export function complexContourBoxOf(
  f: ComplexFunction,
  settings: PlotSettings,
  levels?: ComplexLevels,
): { box: Box; levels: ComplexLevels } {
  const { xs, ys } = fieldAxes("ComplexContourPlot", settings);
  const values = ys.map((y) => xs.map((x) => valueAt(f, [x, y])));
  const [re, im] = [0, 1].map((part) => values.map((row) => row.map((z) => z[part]!)));
  const count = Number(settings["contours"]) || LEVELS;
  const fitted = (grid: number[][]): number[] => {
    const flat = grid.flat().filter(Number.isFinite);
    return flat.length === 0 ? [] : autoLevels(Math.min(...flat), Math.max(...flat), count);
  };
  const drawn = levels ?? { re: fitted(re!), im: fitted(im!) };
  return { box: complexContourBox(re!, im!, xs, ys, drawn, fieldOptionsOf("ContourPlot", settings)), levels: drawn };
}
