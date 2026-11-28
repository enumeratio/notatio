// The plots, charts and figures in space as `makeBoxes` rules (the wiki's Archive-Box-Primitives-Design, §6 slice 4).
// A plot of data is a finite list and lowers whole; so does a chart. A plot of an expression is a
// producer, like a lattice: sampling needs a compiled kernel (the page's, or a session's), so the
// box holds the expression it came from and `Producer -> head`, and an environment that can sample
// asks for the marks (`plotBoxOfSamples`). Not in `/core`: reading an expression's options needs the
// engine's parser.

import type { Notation, NotationRule } from "@notatio/boxes";
import { diagramBoxOf } from "./diagram-lowering.ts";
import { plainJson } from "./graphics-rules.ts";
import { plotBox } from "./plot-box.ts";
import {
  CHART_HEADS,
  chartBoxOfSettings,
  FIELD_PLOT_HEADS,
  graphicsBoxOfSettings,
  fieldBoxOfData,
  PLOT_HEADS,
  plotDataSeries,
  plotOptionsOf,
  polarBoxOfSettings,
  polarListOf,
  unsampledBox,
} from "./plot-lowering.ts";
import { FIGURE_NOTATION } from "./show-box.ts";
import { barBoxOfSettings, GRAPHICS_3D_HEADS, listBoxOfSettings, literalCurveBox } from "./graphics-3d-lowering.ts";
import { unsampledGraphics3dBox } from "./graphics-3d-box.ts";
import { complexPlotOptionsOf, unsampledComplexPlotBox } from "./complex-plot-box.ts";
import type { Primitive } from "./primitives.ts";
import {
  complexPlot3dSettingsOf,
  complexPlotSettingsOf,
  graphics3dSettingsOf,
  marksOfText,
  plotSettingsOf,
} from "./symbols.ts";

/** A plot's `Epilog` and `Prolog`, read to the marks drawn over and under its curves. */
function marksOf(settings: Readonly<Record<string, string>>): { epilog?: Primitive[]; prolog?: Primitive[] } {
  const read = (name: string): Primitive[] | undefined => {
    const written = settings[name]?.trim();
    const marks = written ? marksOfText(written) : undefined;
    return marks && [...marks];
  };
  const [epilog, prolog] = [read("epilog"), read("prolog")];
  return { ...(epilog && { epilog }), ...(prolog && { prolog }) };
}

const plotRule =
  (head: string): NotationRule =>
  (args) => {
    const expr = plainJson([head, ...args] as never);
    const settings = plotSettingsOf(expr as never);
    if (settings === undefined) return undefined;
    const diagram = diagramBoxOf(settings);
    if (diagram !== undefined) return diagram;
    if (head === "ListPolarPlot") {
      const { curves, notes } = polarListOf(settings);
      return polarBoxOfSettings({ markers: "true", ...settings }, curves, { notes });
    }
    if (head === "Graphics") return graphicsBoxOfSettings(settings) ?? unsampledBox(head, expr);
    if (FIELD_PLOT_HEADS.includes(head)) return fieldBoxOfData(head, settings) ?? unsampledBox(head, expr);
    const series = plotDataSeries(settings);
    return series === undefined
      ? unsampledBox(head, expr)
      : plotBox(series, plotOptionsOf(settings, marksOf(settings)));
  };

/**
 * A chart head's rule. `Chart` may choose a plot (`ListPlot`'s) for the data it is given. An
 * `ArrayPlot` of anything but a matrix is a `Show`'s layer (a table), which the figure rule lowers.
 */
const chartRule =
  (head: string): NotationRule =>
  (args, ...rest) => {
    const settings = plotSettingsOf(plainJson([head, ...args] as never) as never);
    if (settings === undefined) return undefined;
    const chart = chartBoxOfSettings(settings);
    if (chart !== undefined) return chart;
    // A `DiscretePlot` of an expression is sampled at its integers by a host that can compile it.
    if (head === "DiscretePlot" && settings["value"] !== undefined)
      return unsampledBox(head, plainJson([head, ...args] as never));
    const series = plotDataSeries(settings);
    if (series !== undefined) return plotBox(series, plotOptionsOf(settings));
    return head === "ArrayPlot" ? FIGURE_NOTATION["ArrayPlot"]?.(args, ...rest) : undefined;
  };

/**
 * A figure in space's rule: `ListPlot3D` and `BarChart3D` hold their data and lower whole; a `Plot3D`
 * or a curve is sampled by the page, so its box holds the expression it came from.
 */
const graphics3dRule =
  (head: string): NotationRule =>
  (args) => {
    const expr = plainJson([head, ...args] as never);
    const settings = graphics3dSettingsOf(expr as never);
    if (settings === undefined) return undefined;
    if (head === "ListPlot3D") return listBoxOfSettings(settings);
    if (head === "BarChart3D") return barBoxOfSettings(settings);
    return (head === "Graphics3D" ? literalCurveBox(settings) : undefined) ?? unsampledGraphics3dBox(head, expr);
  };

/**
 * `ComplexPlot`'s rule: a raster whose producer is a shader on the web and `complex-eval.ts` anywhere
 * else, so the box holds the expression it came from and the frame it is drawn in.
 */
const complexPlotRule: NotationRule = (args) => {
  const expr = plainJson(["ComplexPlot", ...args] as never);
  const settings = complexPlotSettingsOf(expr as never);
  return settings === undefined ? undefined : unsampledComplexPlotBox(expr, complexPlotOptionsOf(settings));
};

/** `ComplexPlot3D`'s rule: a surface sampled by the page's shader or by `complex-eval.ts`, so the box holds the expression. */
const complexPlot3dRule: NotationRule = (args) => {
  const expr = plainJson(["ComplexPlot3D", ...args] as never);
  return complexPlot3dSettingsOf(expr as never) === undefined
    ? undefined
    : unsampledGraphics3dBox("ComplexPlot3D", expr);
};

/** The plot and chart heads as `makeBoxes` rules. */
export const PLOT_NOTATION: Notation = {
  ComplexPlot: complexPlotRule,
  ComplexPlot3D: complexPlot3dRule,
  ...Object.fromEntries(PLOT_HEADS.map((head) => [head, plotRule(head)])),
  ...Object.fromEntries(CHART_HEADS.map((head) => [head, chartRule(head)])),
  ...Object.fromEntries(GRAPHICS_3D_HEADS.map((head) => [head, graphics3dRule(head)])),
};
