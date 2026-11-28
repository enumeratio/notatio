// The 2-D plots as `makeBoxes` rules (the wiki's Archive-Box-Primitives-Design, §6 slice 4): a plot
// returns `Graphics`, so `Plot`, `ListPlot` and the rest lower to a `GraphicsBox`.
//
// A plot of data is a finite list and lowers whole. A plot of an expression is a producer, like a
// lattice: sampling needs a compiled kernel (the page's, or a session's), so the box holds the
// expression it came from (an `InterpretationBox`) and `Producer -> head`, and an environment that
// can sample asks for the marks (`plotBoxOfSamples`). Sampling stays with that environment.

import { type Box, type BoxNode, graphics, graphicsOf, interpretation, optionsOfBox } from "@notatio/boxes";
import { chartBox, type ChartBoxOptions, isChartKind, isNumber } from "./chart.ts";
import { autoLevels, type ContourOptions, contourPlotBox, implicitPlotBox, LINE_WIDTH } from "./contour.ts";
import { type DensityOptions, densityPlotBox } from "./densityplot.ts";
import { DIAGRAM_HEADS } from "./diagram-lowering.ts";
import type { FieldPaints } from "./field-shader.ts";
import { colorMixingOf, colorOf, paintOf } from "./graphics-rules.ts";
import { type GraphicsLook, lookOf } from "./directives.ts";
import {
  graphicsMarksBox,
  type GraphicsOptions,
  type GridSpec,
  plotArea,
  type PlotOptions,
  type PlotPoint,
  type PlotSeries,
  plotBox,
} from "./plot-box.ts";
import { categoryColors, plotPalette } from "./plot-color.ts";
import { type Primitive, primitivesOf } from "./primitives.ts";
import { type PolarPlotOptions, type PolarPoint, polarPlotBox } from "./polarplot.ts";
import {
  BOUNDARY_WIDTH,
  maskGrid,
  REGION_OPACITY,
  type RegionFill,
  type RegionOptions,
  regionPaints,
  regionPlotBox,
} from "./regionplot.ts";
import type { VectorPlotOptions } from "./vectorplot.ts";

/**
 * The heads of the field plots: a grid of values drawn as lines (`ContourPlot`), cells
 * (`DensityPlot`) or a filled region (`RegionPlot`), a `GraphicsBox` holding a `RasterBox` or
 * `LineBox`es in data coordinates.
 */
export const FIELD_PLOT_HEADS: readonly string[] = [
  "ContourPlot",
  "ListContourPlot",
  "DensityPlot",
  "ListDensityPlot",
  "RegionPlot",
];

/** The heads whose plots and diagrams are `GraphicsBox`es, drawn by `<graphics-box>`. */
export const PLOT_HEADS: readonly string[] = [
  "Graphics",
  "Plot",
  "ReImPlot",
  "AbsArgPlot",
  "ComplexContourPlot",
  "ParametricPlot",
  "PolarPlot",
  "ListPolarPlot",
  "ListPlot",
  "ListLinePlot",
  "VectorPlot",
  "StreamPlot",
  ...FIELD_PLOT_HEADS,
  ...DIAGRAM_HEADS,
];

/**
 * The heads whose charts are `GraphicsBox`es, drawn by `<graphics-box>`. `Chart` is the family's
 * head: its member is chosen from the data unless it is named.
 */
export const CHART_HEADS: readonly string[] = [
  "BarChart",
  "Histogram",
  "PieChart",
  "BoxWhiskerChart",
  "ArrayPlot",
  "DiscretePlot",
  "Chart",
];

// A head is written as Epsil spells it: a library name with its first letter lowercase (`histogram(…)`)
// or as declared (`Histogram(…)`).
const spellings = (heads: readonly string[]): string =>
  heads.flatMap((h) => [h, h.charAt(0).toLowerCase() + h.slice(1)]).join("|");

// An `ArrayPlot` of a table (`MultiplicationTable(…)`) is a `Show`'s tiled layer, not a chart of a
// matrix, so it counts only when its data is a list written out.
const valueOf = (heads: readonly string[]): RegExp =>
  new RegExp(
    `^\\s*(?:(?:${spellings([...heads, ...CHART_HEADS.filter((h) => h !== "ArrayPlot")])})\\s*\\(|(?:${spellings(["ArrayPlot"])})\\s*\\(\\s*\\[)`,
  );
const PLOT_VALUE = valueOf(PLOT_HEADS);
// The build samples a curve; a field plot (a grid, cell by cell) is drawn live.
const SAMPLED_VALUE = valueOf(
  PLOT_HEADS.filter((head) => !DIAGRAM_HEADS.includes(head) && !FIELD_PLOT_HEADS.includes(head)),
);

/** The heads a `Show` draws together in one plane: the curve plots, and `Graphics`. */
export const PLANE_LAYER_HEADS: readonly string[] = ["Graphics", "Plot", "ParametricPlot", "ListPlot", "ListLinePlot"];
// A `Show` is of the plane when its first layer is; its other layers are a figure's (tiles, diagrams).
const PLANE_SHOW = new RegExp(`^\\s*Show\\s*\\(\\s*(?:${PLANE_LAYER_HEADS.join("|")})\\s*\\(`);

/** Whether `value` is a `Show` of plots and graphics, drawn in one plot frame. */
export const holdsPlaneShow = (value: string | undefined): boolean => PLANE_SHOW.test(value ?? "");

/** Whether `value` is a plot or a chart the build can draw, a `Show` of plots included: a diagram, or a `Show` of tiles, is drawn live. */
export const holdsPrerenderedPlot = (value: string | undefined): boolean =>
  SAMPLED_VALUE.test(value ?? "") || holdsPlaneShow(value);

/**
 * Whether `value` is a plot, a chart or a diagram (`Plot(…)`, `BarChart([…])`), or a `Show` of plots
 * and graphics, which `<graphics-box>` draws as one.
 */
export const holdsPlot = (value: string | undefined): boolean => PLOT_VALUE.test(value ?? "") || holdsPlaneShow(value);

/** Plot settings, the attributes an expression's options lower to (`plotSettingsOf`). */
export type PlotSettings = Readonly<Record<string, string>>;

const jsonOf = (text: string | undefined): unknown => {
  try {
    return text?.trim() ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
};

/** The chart a chart head's settings describe; undefined for a plot, or a list that is no matrix of an `ArrayPlot`. */
export function chartBoxOfSettings(settings: PlotSettings): Box | undefined {
  const kind = settings["type"];
  if (!isChartKind(kind)) return undefined;
  const data = jsonOf(settings["data"]);
  if (kind === "array" && !(Array.isArray(data) && data.every(Array.isArray))) return undefined;
  const labels = jsonOf(settings["labels"]);
  const options: ChartBoxOptions = {
    labels: Array.isArray(labels) ? labels.map(String) : undefined,
    title: settings["label"] || undefined,
    bins: settings["bins"] ? Number(settings["bins"]) : undefined,
    gradient: settings["gradient"],
    discrete: settings["discrete"],
    reverse: on(settings["reverse"]),
    ...(settings["grid"] === "false" && { grid: false }),
  };
  return chartBox(kind, data, options);
}

/** `data` (a number list: index against value; pairs; or `{x, y}`) as points. */
export function pointsOfData(data: unknown): PlotPoint[] {
  if (!Array.isArray(data)) return [];
  if (data.every(isNumber)) return data.map((y, x) => ({ x, y }));
  if (data.every((e) => Array.isArray(e) && e.length === 2 && e.every(isNumber)))
    return (data as [number, number][]).map(([x, y]) => ({ x, y }));
  if (data.every((e) => e && typeof e === "object" && isNumber((e as PlotPoint).x) && isNumber((e as PlotPoint).y)))
    return data as PlotPoint[];
  return [];
}

const on = (v: string | undefined): boolean => v !== undefined && v !== "false";

/** `lo,hi` as a pair of finite numbers, else undefined. */
export function spanOf(text: string | undefined): [number, number] | undefined {
  const [a, b] = (text ?? "").split(",").map((s) => Number(s.trim()));
  return Number.isFinite(a) && Number.isFinite(b) ? [a!, b!] : undefined;
}

/**
 * `PlotStyle` as looks: a list is one style per curve, in order; anything else (a color, a
 * `Directive`) is the one style every curve takes. A style that does not read leaves its curve's own.
 */
export function plotStylesOf(written: string | undefined): GraphicsLook[] | undefined {
  const style = jsonOf(written);
  if (style === undefined) return undefined;
  const each = Array.isArray(style) && style[0] === "List" ? style.slice(1) : [style];
  return each.map((entry) => lookOf(entry) ?? {});
}

/**
 * The looks of a `Show`'s series, layer by layer: each layer's `PlotStyle` cycled over its own
 * curves, and a layer with none leaving its curves their own.
 */
export function layerStylesOf(
  layers: readonly { readonly style: string | undefined; readonly count: number }[],
): GraphicsLook[] {
  return layers.flatMap(({ style, count }) => {
    const styles = plotStylesOf(style);
    return Array.from({ length: count }, (_, k): GraphicsLook => (styles?.length ? styles[k % styles.length]! : {}));
  });
}

/** One direction's grid lines as its setting writes them: positions, `auto`, or nothing. */
const gridSpecOf = (text: string | undefined): GridSpec =>
  text === "auto" ? "Automatic" : text ? text.split(",").map(Number).filter(Number.isFinite) : null;

/** The grid, the ticks, the axes' crossing and the padding a frame's settings ask for. */
function chromeOf(
  settings: PlotSettings,
): Pick<PlotOptions, "gridLines" | "gridAt" | "ticks" | "axesOrigin" | "padding"> {
  const listed = settings["grid-x"] !== undefined || settings["grid-y"] !== undefined;
  const origin = spanOf(settings["axes-origin"]);
  const padding = Number(settings["range-padding"]);
  return {
    gridLines: on(settings["grid"]),
    ...(listed && { gridAt: [gridSpecOf(settings["grid-x"]), gridSpecOf(settings["grid-y"])] as const }),
    ...(settings["ticks"] === "false" && { ticks: false }),
    ...(origin && { axesOrigin: origin }),
    ...(settings["range-padding"] !== undefined && padding >= 0 && { padding }),
  };
}

/** One layer of a `Show` of the plane: its head and the settings it lowers to. */
export interface PlaneLayer {
  readonly head: string;
  readonly settings: Record<string, string>;
}

/** A `Show` of plots and graphics: its layers in order, and the frame its own options give. */
export interface PlaneShow {
  readonly layers: readonly PlaneLayer[];
  readonly frame: Readonly<Record<string, string>>;
}

/**
 * How a `Show` of the plane is drawn, once its plots are sampled (`seriesOf`, by layer): every
 * series in layer order, each with its layer's `PlotStyle`; the first plot's settings under the
 * `Show`'s own frame; a `Graphics` before the first plot under the curves, and one after it over
 * them. A `Show` of `Graphics` alone is one `Graphics` (`graphics`). Undefined when a plot has
 * no series.
 */
export function planeShowPlan(
  show: PlaneShow,
  seriesOf: (layer: PlaneLayer, index: number) => readonly PlotSeries[] | undefined,
):
  | {
      readonly settings: PlotSettings;
      readonly series: PlotSeries[];
      readonly styles: GraphicsLook[];
      readonly marks: { readonly prolog: Primitive[]; readonly epilog: Primitive[] };
    }
  | { readonly graphics: PlotSettings }
  | undefined {
  const series: PlotSeries[] = [];
  const styled: { style: string | undefined; count: number }[] = [];
  const marks = { prolog: [] as Primitive[], epilog: [] as Primitive[] };
  const written: unknown[] = [];
  let first: PlotSettings | undefined;
  for (const [index, layer] of show.layers.entries()) {
    if (layer.head === "Graphics") {
      const primitives = jsonOf(layer.settings["primitives"]);
      if (primitives === undefined) continue;
      written.push(primitives);
      (first === undefined ? marks.prolog : marks.epilog).push(...primitivesOf(primitives as never));
      continue;
    }
    const sampled = seriesOf(layer, index);
    if (sampled === undefined) return undefined;
    first ??= layer.settings;
    series.push(...sampled);
    styled.push({ style: layer.settings["plot-style"], count: sampled.length });
  }
  if (first === undefined)
    return {
      graphics: { ...show.layers[0]?.settings, ...show.frame, primitives: JSON.stringify(["List", ...written]) },
    };
  return { settings: { ...first, ...show.frame }, series, styles: layerStylesOf(styled), marks };
}

/** A `Show` of the plane as a `GraphicsBox`, its plots sampled by `seriesOf`; undefined when one has no series. */
export function planeShowBox(show: PlaneShow, seriesOf: Parameters<typeof planeShowPlan>[1]): Box | undefined {
  const plan = planeShowPlan(show, seriesOf);
  if (plan === undefined) return undefined;
  if ("graphics" in plan) return graphicsBoxOfSettings(plan.graphics);
  return plotBoxOfSamples(plan.settings, plan.series, { ...plan.marks, styles: plan.styles });
}

/** What a `Graphics`' settings say about its frame. */
export function graphicsOptionsOf(settings: PlotSettings): GraphicsOptions {
  const [x, y] = [spanOf(settings["plot-x-range"]), spanOf(settings["plot-range"])];
  const aspect = Number(settings["aspect"]);
  return {
    ...(x && y && { plotRange: [x, y] as const }),
    ...(aspect > 0 && { aspect }),
    axes: on(settings["axes"]),
    frame: on(settings["frame"]),
    ...chromeOf(settings),
    xLabel: settings["x-label"] || undefined,
    yLabel: settings["y-label"] || undefined,
    title: settings["label"] || undefined,
  };
}

/**
 * A `Graphics` as a `GraphicsBox`, or undefined when it has no primitives to read. A `window` is a
 * zoomed view: the same primitives over that range, in the whole figure's shape.
 */
export function graphicsBoxOfSettings(
  settings: PlotSettings,
  window?: { readonly x: readonly [number, number]; readonly y?: readonly [number, number] },
): Box | undefined {
  const written = jsonOf(settings["primitives"]);
  if (written === undefined) return undefined;
  const primitives = primitivesOf(written as never);
  const options = graphicsOptionsOf(settings);
  const whole = graphicsMarksBox(primitives, options);
  if (window?.y === undefined) return whole;
  const [width, height] = optionsOfBox(whole as BoxNode).ImageSize as [number, number];
  const { plotW, plotH } = plotArea(width, height, options.title !== undefined);
  return graphicsMarksBox(primitives, { ...options, plotRange: [window.x, window.y], aspect: plotH / plotW });
}

/**
 * `AspectRatio` as the plot box reads it: a number, `equal` for `Automatic` (true scale), and for a
 * parametric curve, which Wolfram draws at true scale, `equal` when the option is left out.
 */
function aspectOf(settings: PlotSettings): Pick<PlotOptions, "aspect"> {
  const written = settings["aspect"];
  if (written === "auto") return { aspect: "equal" };
  const ratio = Number(written);
  if (ratio > 0) return { aspect: ratio };
  return settings["parametric"] === "true" ? { aspect: "equal" } : {};
}

/** What a plot's settings say about how to draw it: the chrome, the scales, the colors. */
export function plotOptionsOf(
  settings: PlotSettings,
  extra: {
    epilog?: readonly Primitive[];
    prolog?: readonly Primitive[];
    hover?: number;
    xRange?: readonly [number, number];
    plotRange?: readonly [number, number];
    /** Each series' look, where the series come from several layers with a `PlotStyle` each. */
    styles?: readonly GraphicsLook[];
    /** `PlotRangePadding -> None`, as a terminal draws: the window is the data's own extent. */
    tight?: boolean;
  } = {},
): PlotOptions {
  return {
    axes: settings["axes"] !== "false",
    frame: on(settings["frame"]),
    styles: plotStylesOf(settings["plot-style"]),
    xScale: settings["x-scale"],
    yScale: settings["y-scale"],
    plotRange: spanOf(settings["plot-range"]),
    xRange: spanOf(settings["plot-x-range"]),
    ...chromeOf(settings),
    ...aspectOf(settings),
    fill: on(settings["fill"]),
    legend: on(settings["legend"]),
    xLabel: settings["x-label"] || undefined,
    yLabel: settings["y-label"] || undefined,
    title: settings["label"] || undefined,
    colorBy: settings["color-by"] === "x" ? "x" : settings["color-by"] === "y" ? "y" : undefined,
    gradient: settings["gradient"],
    discrete: settings["discrete"],
    reverse: on(settings["reverse"]),
    ...extra,
  };
}

/** A vector or stream plot's settings: the ranges it samples over and how it is drawn. */
export function vectorOptionsOf(settings: PlotSettings): {
  x: [number, number];
  y: [number, number];
  options: VectorPlotOptions;
} {
  return {
    x: spanOf(settings["xrange"]) ?? [-2, 2],
    y: spanOf(settings["yrange"]) ?? [-2, 2],
    options: {
      type: settings["type"] === "stream" ? "stream" : "vector",
      n: Number(settings["n"]) > 0 ? Number(settings["n"]) : undefined,
      steps: Number(settings["steps"]) || undefined,
      axes: settings["axes"] !== "false",
      xLabel: settings["x-label"] || undefined,
      yLabel: settings["y-label"] || undefined,
      title: settings["label"] || undefined,
      gradient: settings["gradient"],
      reverse: on(settings["reverse"]),
    },
  };
}

const isPair = (e: unknown): boolean => Array.isArray(e) && e.length === 2 && e.every(isNumber);

/** `entries` as points: a number is its value against its place, a pair or an `{x, y}` is the point; the rest is counted. */
function pointsOfEntries(entries: readonly unknown[]): { points: PlotPoint[]; dropped: number } {
  const points: PlotPoint[] = [];
  let dropped = 0;
  entries.forEach((e, x) => {
    if (isNumber(e)) points.push({ x, y: e });
    else if (isPair(e)) points.push({ x: (e as number[])[0]!, y: (e as number[])[1]! });
    else if (e && typeof e === "object" && isNumber((e as PlotPoint).x) && isNumber((e as PlotPoint).y))
      points.push(e as PlotPoint);
    else dropped++;
  });
  return { points, dropped };
}

/**
 * A plot of data's series. A list of numbers, of pairs or of `{x, y}` is one series; a list of lists
 * that are not all pairs is one series per list (`[[1, 2, 3], [2, 3, 5]]`). An entry that is neither a
 * number nor a pair is not drawn, and the series says how many (`notes`), so nothing is lost silently.
 */
export function seriesOfData(data: unknown, style: "points" | "line"): PlotSeries[] {
  if (!Array.isArray(data) || data.length === 0)
    return [{ points: [], style, given: true, notes: ["There is no data to draw."] }];
  const lists = data.every(Array.isArray) && !data.every(isPair);
  const groups = lists ? (data as unknown[][]) : [data];
  const read = groups.map(pointsOfEntries);
  const dropped = read.reduce((n, r) => n + r.dropped, 0);
  const notes =
    dropped === 0
      ? []
      : [
          dropped === 1
            ? "1 entry is not a number or a pair, so it is not drawn."
            : `${dropped} entries are not numbers or pairs, so they are not drawn.`,
        ];
  return read.map((r, k) => ({ points: r.points, style, given: true, ...(k === 0 && notes.length > 0 && { notes }) }));
}

/** The series of a plot of data (`ListPlot`, `ListLinePlot`); undefined for a plot of an expression. */
export function plotDataSeries(settings: PlotSettings): PlotSeries[] | undefined {
  const type = settings["type"];
  if (type !== "list" && type !== "listline") return undefined;
  const style = type === "list" ? "points" : "line";
  try {
    return seriesOfData(JSON.parse(settings["data"] ?? "null"), style);
  } catch {
    return [{ points: [], style, notes: ["The data could not be read, so nothing is drawn."] }];
  }
}

/** A plot of an expression, not yet sampled: its expression and what samples it (`Producer`). */
export function unsampledBox(head: string, expr: unknown): Box {
  return interpretation(graphics([], { ViewKind: "fixed", Producer: head }), expr as never);
}

/** `[[θ, r], …]` (or a bare `[r, …]`, spread evenly over `t0..t1`) as polar points. */
export function polarPointsOf(data: unknown, t0: number, t1: number): PolarPoint[] | undefined {
  if (!Array.isArray(data) || data.length === 0) return undefined;
  if (data.every((p) => Array.isArray(p) && p.length >= 2 && p.every(isNumber)))
    return (data as number[][]).map(([theta, r]) => ({ theta: theta!, r: r! }));
  if (data.every(isNumber)) {
    const n = data.length;
    return (data as number[]).map((r, i) => ({ theta: n > 1 ? t0 + ((t1 - t0) * i) / (n - 1) : t0, r }));
  }
  return undefined;
}

/** A list of lists is several curves unless every list is an (angle, radius) pair, which is one curve of points. */
const isPolarPair = (e: unknown): boolean => Array.isArray(e) && e.length === 2 && e.every(isNumber);

/**
 * A `ListPolarPlot`'s curves: its data as one curve, or one per list when it is a list of lists; a
 * list that is neither `[[θ, r], …]` nor radii is not drawn, and a note says so.
 */
export function polarListOf(settings: PlotSettings): { curves: PolarPoint[][]; notes: string[] } {
  const [t0, t1] = spanOf(settings["trange"]) ?? [0, 2 * Math.PI];
  const data = jsonOf(settings["data"]);
  if (!Array.isArray(data) || data.length === 0) return { curves: [], notes: ["There is no data to draw."] };
  const groups = data.every(Array.isArray) && !data.every(isPolarPair) ? (data as unknown[]) : [data];
  const read = groups.map((group) => polarPointsOf(group, t0, t1));
  const lost = read.filter((points) => points === undefined).length;
  return {
    curves: read.filter((points): points is PolarPoint[] => points !== undefined),
    notes:
      lost > 0
        ? [`${lost} of ${groups.length} lists are not (angle, radius) pairs or radii, so they are not drawn.`]
        : [],
  };
}

/** What a polar plot's settings say about how it is drawn: the grid, the path, the markers, the title and the looks. */
export function polarOptionsOf(settings: PlotSettings): PolarPlotOptions {
  return {
    axes: settings["axes"] !== "false",
    closed: on(settings["closed"]),
    filled: on(settings["filled"]),
    markers: on(settings["markers"]),
    max: Number(settings["max"]) > 0 ? Number(settings["max"]) : undefined,
    title: settings["label"] || undefined,
    styles: plotStylesOf(settings["plot-style"]),
  };
}

/** Samples a polar plot takes over its angle, `PlotPoints` when it gives them: at most `POLAR_MAX_SAMPLES`. */
export const polarSampleCount = (settings: PlotSettings): number =>
  Math.max(2, Math.min(POLAR_MAX_SAMPLES, Math.round(Number(settings["n"]) || POLAR_SAMPLES)));
const [POLAR_SAMPLES, POLAR_MAX_SAMPLES] = [240, 2000];

/**
 * A polar plot of `curves` as a `GraphicsBox`, from its settings. A curve with no real value over its
 * range is not drawn, and a note under the plot says which.
 */
export function polarBoxOfSettings(
  settings: PlotSettings,
  curves: readonly (readonly PolarPoint[])[],
  extra: PolarPlotOptions & { notes?: readonly string[] } = {},
): Box {
  const empty = curves.flatMap((points, k) => (points.some((p) => Number.isFinite(p.r)) ? [] : [k + 1]));
  const notes = [
    ...(extra.notes ?? []),
    ...(empty.length > 0
      ? [
          `${empty.length > 1 ? "Curves" : "Curve"} ${empty.join(", ")} ${empty.length > 1 ? "have" : "has"} no real value over the range, so not drawn.`,
        ]
      : []),
  ];
  return polarPlotBox(curves, { ...polarOptionsOf(settings), ...extra, notes });
}

/** Whether a `GraphicsBox` is a plot still to be sampled, and the expression it holds. */
export function unsampledPlot(box: Box): unknown {
  return graphicsOf(box)?.held;
}

/** A sampled plot of an expression as a `GraphicsBox`: its settings and the series sampled for them. */
export function plotBoxOfSamples(
  settings: PlotSettings,
  series: readonly PlotSeries[],
  extra: Parameters<typeof plotOptionsOf>[1] = {},
): Box {
  return plotBox(series, plotOptionsOf(settings, extra));
}

// ── Field plots ──────────────────────────────────────────────────────────────────────────

const isDensity = (head: string): boolean => head === "DensityPlot" || head === "ListDensityPlot";

/** A pre-sampled grid (`data`) as a rectangular matrix of numbers; undefined for anything else. */
export function fieldMatrixOf(data: unknown): number[][] | undefined {
  if (!Array.isArray(data) || data.length === 0 || !data.every((r) => Array.isArray(r))) return undefined;
  const rows = (data as unknown[][]).map((r) => r.filter(isNumber));
  return rows.every((r) => r.length === rows[0]!.length && r.length > 0) ? rows : undefined;
}

/** `Contours`: a bare count, or a JSON list of values. */
function levelsOf(raw: string | undefined): { levels?: readonly number[]; count?: number } {
  const text = raw?.trim();
  if (!text) return {};
  const count = Number(text);
  if (Number.isFinite(count) && !text.startsWith("[")) return { count };
  const parsed = jsonOf(text);
  return Array.isArray(parsed) && parsed.every(isNumber) ? { levels: parsed } : {};
}

/** A fill as `PlotStyle` writes it: a color, or `Opacity(a, color)`; a color alone keeps the default opacity. */
function fillOf(json: unknown): RegionFill | undefined {
  const paint = paintOf(json as never);
  if (paint === undefined || typeof paint.paint !== "string") return undefined;
  const opaque = Array.isArray(json) && json[0] === "Opacity";
  return { color: paint.paint, opacity: opaque ? paint.opacity : REGION_OPACITY };
}

/** What a `RegionPlot`'s settings say about its fills and edges (`PlotStyle`, `BoundaryStyle`, `ColorMixing`). */
function regionStyleOf(settings: PlotSettings): Pick<RegionOptions, "fills" | "boundary" | "mixing"> {
  const style = jsonOf(settings["plot-style"]);
  const fills =
    style === undefined
      ? undefined
      : Array.isArray(style) && style[0] === "List"
        ? style.slice(1).map(fillOf)
        : [fillOf(style)];
  const edge = jsonOf(settings["boundary-style"]);
  const boundary = edge === "None" ? null : edge === undefined ? undefined : colorOf(edge as never);
  return {
    ...(fills && { fills }),
    ...(boundary !== undefined && { boundary }),
    mixing: colorMixingOf(settings["color-mixing"] as never),
  };
}

/** What a field plot's settings say about how it is drawn: the chrome, the levels, the colors. */
export function fieldOptionsOf(head: string, settings: PlotSettings): ContourOptions & DensityOptions & RegionOptions {
  return {
    axes: settings["axes"] !== "false",
    xLabel: settings["x-label"] || undefined,
    yLabel: settings["y-label"] || undefined,
    title: settings["label"] || undefined,
    gradient: settings["gradient"],
    discrete: settings["discrete"],
    reverse: on(settings["reverse"]),
    ...(isDensity(head)
      ? { legend: on(settings["legend"]), zRange: spanOf(settings["zrange"]) }
      : head === "RegionPlot"
        ? regionStyleOf(settings)
        : { filled: on(settings["contour-shading"]), ...levelsOf(settings["contours"]) }),
  };
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * How a shader paints `count` regions or implicit curves (widths in the plot's own px), or undefined
 * where only the box draws them: fills mixed other than `ColorMixing -> Normal`, or a color that is
 * not `#rrggbb`.
 */
export function fieldPaintsOf(head: string, settings: PlotSettings, count: number): FieldPaints | undefined {
  const options = fieldOptionsOf(head, settings);
  const hex = (color: string | null): boolean => color === null || HEX_COLOR.test(color);
  if (settings["field"] === "curves") {
    const edges = categoryColors(plotPalette(options), count);
    return edges.every(hex) ? { edges, width: LINE_WIDTH } : undefined;
  }
  if (settings["field"] !== "regions") return undefined;
  if (options.mixing !== undefined && options.mixing !== "First" && options.mixing !== "Normal") return undefined;
  const { fills, edges } = regionPaints(count, options);
  return fills.every((fill) => hex(fill.color)) && edges.every(hex)
    ? { fills, edges, width: BOUNDARY_WIDTH }
    : undefined;
}

/** Samples per side when `PlotPoints` gives none, and the most it may ask for, by head. */
const FIELD_GRID: Readonly<Record<string, readonly [fallback: number, cap: number]>> = {
  DensityPlot: [48, 160],
  // A region's edge is its picture: a finer grid than a contour's, whose lines interpolate.
  RegionPlot: [64, 160],
};
const CONTOUR_GRID = [40, 120] as const;
/** An implicit curve is one thin level, lost between samples sooner than a family of contours. */
const CURVES_GRID = [80, 160] as const;

/** The axes a field plot of an expression is sampled on: `PlotPoints` per side over `xrange` by `yrange`. */
export function fieldAxes(head: string, settings: PlotSettings): { xs: number[]; ys: number[] } {
  const [x0, x1] = spanOf(settings["xrange"]) ?? [-3, 3];
  const [y0, y1] = spanOf(settings["yrange"]) ?? [-3, 3];
  const [fallback, cap] = settings["field"] === "curves" ? CURVES_GRID : (FIELD_GRID[head] ?? CONTOUR_GRID);
  const n = Math.max(2, Math.min(cap, Math.round(Number(settings["plot-points"]) || fallback)));
  const axis = (lo: number, hi: number): number[] =>
    Array.from({ length: n }, (_, k) => lo + ((hi - lo) * k) / (n - 1));
  return { xs: axis(x0, x1), ys: axis(y0, y1) };
}

/**
 * A field plot of an expression, as a `GraphicsBox`: `grids` are its sources sampled in order
 * (`fieldSourcesOf`: the function, or a margin per region, or a function per implicit curve), and
 * `inside` its `RegionFunction`'s margin on the same axes, outside which nothing is drawn.
 */
export function fieldBoxOfGrids(
  head: string,
  settings: PlotSettings,
  grids: readonly (readonly (readonly number[])[])[],
  xs: readonly number[],
  ys: readonly number[],
  inside?: readonly (readonly number[])[],
): Box {
  const shown = inside === undefined ? grids : grids.map((g) => maskGrid(g, inside));
  const options = fieldOptionsOf(head, settings);
  if (settings["field"] === "regions") return regionPlotBox(shown, xs, ys, options);
  if (settings["field"] === "curves") return implicitPlotBox(shown, xs, ys, options);
  return fieldBoxOfGrid(head, settings, shown[0] ?? [], xs, ys);
}

/**
 * `settings` with a value plot's scale written out from `grid`, its samples over the whole plot: the
 * contour levels, or the density's value range. A zoomed view resamples a window, and drawn with these
 * it keeps the whole plot's levels and colors instead of refitting them to what the window holds.
 */
export function fieldScaleOf(head: string, settings: PlotSettings, grid: readonly (readonly number[])[]): PlotSettings {
  if (settings["field"] !== undefined) return settings;
  const flat = grid.flat().filter(Number.isFinite);
  if (flat.length === 0) return settings;
  const [min, max] = [Math.min(...flat), Math.max(...flat)];
  if (isDensity(head)) return spanOf(settings["zrange"]) ? settings : { ...settings, zrange: `${min},${max}` };
  const { levels, count } = levelsOf(settings["contours"]);
  return levels ? settings : { ...settings, contours: JSON.stringify(autoLevels(min, max, count ?? 8)) };
}

/** The names a field plot's `RegionFunction` is written over, each with the plot variable it stands for. */
export function regionFunctionVars(
  settings: PlotSettings,
  vx: string,
  vy: string,
): readonly (readonly [string, string])[] {
  const params = (settings["region-function-vars"] ?? "").split(",").filter(Boolean);
  return params.slice(0, 2).map((name, k) => [name, k === 0 ? vx : vy] as const);
}

/** A field plot of a grid of values, as a `GraphicsBox`. */
export function fieldBoxOfGrid(
  head: string,
  settings: PlotSettings,
  grid: readonly (readonly number[])[],
  xs: readonly number[],
  ys: readonly number[],
): Box {
  const options = fieldOptionsOf(head, settings);
  return isDensity(head) ? densityPlotBox(grid, xs, ys, options) : contourPlotBox(grid, xs, ys, options);
}

/** A `ListContourPlot` or `ListDensityPlot`, lowered whole: its matrix is its data. Undefined for a plot of an expression. */
export function fieldBoxOfData(head: string, settings: PlotSettings): Box | undefined {
  const grid = fieldMatrixOf(jsonOf(settings["data"]));
  if (grid === undefined) return undefined;
  return fieldBoxOfGrid(
    head,
    settings,
    grid,
    grid[0]!.map((_, i) => i),
    grid.map((_, j) => j),
  );
}
