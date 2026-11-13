// A `ComplexPlot` as a `GraphicsBox` holding a `RasterBox` (the wiki's Archive-Box-Primitives-Design,
// §6 slice 7). On the web the raster's producer is a WebGL2 shader (`complex-plot.ts`, drawn by
// `<notatio-complex-plot>`: one invocation per pixel, so a drag or a Manipulate slider redraws at
// frame rate). Everywhere else -- Node, a build, a terminal -- the same picture is evaluated here on
// the CPU, pixel by pixel, from `complex-eval.ts`: the box holds its expression and
// `Producer -> ComplexPlot`, and an environment that can evaluate fills the cells (`complexPlotBox`).
// The colors are the shader's, written out: hue is the argument on a gradient, brightness a
// compressed log-magnitude, poles white and zeros black.

import { type Box, graphics, interpretation, type OptionValue, raster, tag } from "@notatio/boxes";
import type { Complex, ComplexFunction } from "./complex-eval.ts";
import type { ComplexPlotView } from "./complex-plot.ts";
import { parseNumeric } from "./manipulate.ts";
import { DEFAULT_PHASE_GRADIENT, type Gradient, rgbToHex } from "./palettes.ts";
import { type ColorOptions, gradientOf } from "./plot-color.ts";
import { hatchColor, maskColor, polarColor } from "./portrait-color.ts";
import { gradientRamp } from "./portrait-cpu.ts";
import { Uncertain } from "./uncertain.ts";

/** A portrait's view (`extent` is the plane's height, its width the same for a square frame) and how it is drawn. */
export interface ComplexPlotBoxOptions extends ColorOptions, Partial<ComplexPlotView> {
  /** Cells per side of the raster (default 96, at most 400). */
  readonly resolution?: number;
  /** A title centered above the frame (`PlotLabel`). */
  readonly title?: string;
}

const DEFAULT_VIEW: ComplexPlotView = { center: [0, 0], extent: 2.4, mask: 0 };
const DEFAULT_RESOLUTION = 96;
const MAX_RESOLUTION = 400;
/** A square frame: the plot area is as tall as it is wide. */
const SIZE: readonly [number, number] = [340, 326];

const finiteOr = (v: number, fallback: number): number => (Number.isFinite(v) ? v : fallback);

/**
 * A portrait's view from a plot's settings. `center` takes a bare `re,im` or the Epsil list
 * `[re, im]`, so a Manipulate wildcard can drive it (read here as it is on the page).
 */
export function complexViewOf(settings: Readonly<Record<string, string>>): ComplexPlotView {
  const [cx, cy] = (settings["center"] ?? "0,0")
    .replace(/^\s*[[({]|[\])}]\s*$/g, "")
    .split(",")
    .map(parseNumeric);
  const extent = Number(settings["extent"]);
  const mask = Number(settings["mask"]);
  return {
    center: [finiteOr(cx ?? Number.NaN, 0), finiteOr(cy ?? Number.NaN, 0)],
    extent: Number.isFinite(extent) && extent > 0 ? extent : DEFAULT_VIEW.extent,
    mask: Number.isFinite(mask) && mask > 0 ? mask : 0,
  };
}

/** The options a portrait's settings give its box. */
export function complexPlotOptionsOf(settings: Readonly<Record<string, string>>): ComplexPlotBoxOptions {
  return {
    ...complexViewOf(settings),
    gradient: settings["gradient"],
    reverse: settings["reverse"] !== undefined && settings["reverse"] !== "false",
    title: settings["label"] || undefined,
  };
}

/**
 * The shader's color of one value, from the one mapping `portrait-color.ts` holds. A pole (infinite
 * magnitude) is white and a zero black; anything else has hue `arg/2π` on the gradient, with its value
 * (brightness) and saturation banded by `log2|v|` so the level curves of the magnitude show as rings.
 * A value with no magnitude (NaN) is white, as the shader's `!(logMag < 1e30)` makes it.
 */
export function portraitColor(value: Complex, gradient: Gradient): string {
  const [re, im] = value;
  return rgbToHex(polarColor(Math.atan2(im, re), Math.log(Math.hypot(re, im)), gradientRamp(gradient)));
}

/** The faint grid outside a mask's disk, as the shader draws it. */
const maskCell = (x: number, y: number): string => rgbToHex(maskColor(x, y));

/** The shader's hatch for a value it cannot vouch for, at raster cell (`i`, `j`). */
const hatchCell = (i: number, j: number): string => rgbToHex(hatchColor(i + 0.5, j + 0.5));

/** The frame a portrait is drawn in: a square plot area over the plane `view` shows. */
function chrome(view: ComplexPlotView, title: string | undefined): Record<string, OptionValue> {
  const half = view.extent / 2;
  return {
    ImageSize: [...SIZE],
    Axes: false,
    Frame: true,
    ScalingFunctions: ["linear", "linear"],
    ViewKind: "fixed",
    PlotRange: [
      [view.center[0] - half, view.center[0] + half],
      [view.center[1] - half, view.center[1] + half],
    ],
    ...(title && { PlotLabel: title }),
  };
}

/** A portrait not yet evaluated: the expression it came from, and what fills the raster (`Producer`). */
export function unsampledComplexPlotBox(expr: unknown, options: ComplexPlotBoxOptions = {}): Box {
  const view = { ...DEFAULT_VIEW, ...definedOnly(options) };
  const frame = chrome(view, options.title);
  return interpretation(
    graphics([tag(raster({ Producer: "ComplexPlot", DataRange: frame["PlotRange"]! }), "Raster")], {
      ...frame,
      Producer: "ComplexPlot",
    }),
    expr as never,
  );
}

const definedOnly = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

/**
 * `f` evaluated over the plane as a `GraphicsBox`: one raster cell per sample, at the cell's center,
 * rows from the least imaginary part up. A sample that throws is clear, except one the kernel declines
 * for lost digits (`Uncertain`), which is hatched as the shader hatches it. A pure function of its inputs.
 */
export function complexPlotBox(f: ComplexFunction, options: ComplexPlotBoxOptions = {}): Box {
  const view = { ...DEFAULT_VIEW, ...definedOnly(options) };
  const n = Math.max(2, Math.min(MAX_RESOLUTION, Math.round(options.resolution ?? DEFAULT_RESOLUTION)));
  const gradient = gradientOf(options, DEFAULT_PHASE_GRADIENT);
  const frame = chrome(view, options.title);
  const [[x0, x1], [y0, y1]] = frame["PlotRange"] as unknown as [[number, number], [number, number]];
  const colors = Array.from({ length: n }, (_, j) =>
    Array.from({ length: n }, (_, i) => {
      const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
      const y = y0 + ((y1 - y0) * (j + 0.5)) / n;
      if (view.mask > 0 && x * x + y * y >= view.mask * view.mask) return maskCell(x, y);
      try {
        return portraitColor(f([x, y]), gradient);
      } catch (error) {
        return error instanceof Uncertain ? hatchCell(i, j) : "";
      }
    }),
  );
  return graphics(
    [
      tag(
        raster({
          Colors: colors,
          DataRange: [
            [x0, x1],
            [y0, y1],
          ],
        }),
        "Raster",
      ),
    ],
    frame,
  );
}
