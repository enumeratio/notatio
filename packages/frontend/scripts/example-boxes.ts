// A reference example's drawn value as boxes, in Node: the lowering a page's element or a cell
// does, minus the DOM. An expression that draws lowers by `makeBoxes` with the frontend's notation;
// a plot of an expression is sampled first (the compiled code, as the page's element runs it), and
// its samples lower. `shapeOf` reads a box's shape (`BoxShape`, in `@notatio/entry`) for a test
// to hold to what a record says. Pixels never come into it.

import type { ComputeEngine } from "@cortex-js/compute-engine";
import { type Box, type BoxNode, graphics3dOf, graphicsOf, makeBoxes, notationOf } from "@notatio/boxes";
import type { BoxShape, MathJSON } from "@notatio/entry";
import { graphics3dOptionsOf, gridAxis, gridSide, sampleGrids, surfaceDomains } from "../src/graphics-3d-lowering.ts";
import { surfaceBox } from "../src/graphics-3d-box.ts";
import { unsampledGraphics3d } from "../src/graphics-3d-draw.ts";
import { optionsOf } from "@notatio/formats";
import { fieldSourcesOf, regionFunctionOf } from "../src/field-margin.ts";
import { plainJson } from "../src/graphics-rules.ts";
import { type CompiledItem, compilePlot, engineRuntime, systemHelpersOf } from "../src/plot-compile.ts";
import {
  FIELD_PLOT_HEADS,
  fieldAxes,
  fieldBoxOfGrids,
  plotBoxOfSamples,
  regionFunctionVars,
  unsampledPlot,
  vectorOptionsOf,
} from "../src/plot-lowering.ts";
import { PLOT_NOTATION } from "../src/plot-notation.ts";
import * as analytic from "@notatio/analytic";
import {
  analyticScopeOf,
  CURVE_SPEC,
  figurePlanOf,
  loadCompiled,
  lonePlotOf,
  type PlotRuntime,
  polarBoxOfCurves,
  polarCurvesOf,
} from "../src/plot-sample.ts";
import { type Primitive, primitivesOf } from "../src/primitives.ts";
import { parseExpression } from "@notatio/formats/expression";
import { FIGURE_NOTATION } from "../src/show-box.ts";
import { complexFunction } from "../src/complex-eval.ts";
import { COMPLEX_PART_HEADS, complexContourBoxOf, complexPartSeries } from "../src/complex-parts.ts";
import { complexPlotBox, complexPlotOptionsOf } from "../src/complex-plot-box.ts";
import {
  complexPlot3dSettingsOf,
  complexPlotSettingsOf,
  graphics3dSettingsOf,
  planeShowOf,
  plotSettingsOf,
} from "../src/symbols.ts";
import { complexSurfaceBox, parseComplexDomain, sampleComplexSurface } from "../src/complex-plot-3d.ts";
import { vectorPlotBox } from "../src/vectorplot.ts";

type Json = Parameters<typeof plainJson>[0];

const on = (v: string | undefined): boolean => v !== undefined && v !== "" && v !== "false";

/** compute-engine's helpers for compiled code, lent by a compiled function (as on the page). */

/** What a compiled item reads: the plot's variables by name, and nothing else. */
type Sampler = (scope: Readonly<Record<string, number>>) => number;

/** `json`'s items, each element of a list on its own, as compiled code run as the page runs it. */
function samplers(
  ce: ComputeEngine,
  json: unknown,
  vars?: readonly string[],
): { compiled: readonly CompiledItem[]; free: readonly string[]; items: readonly Sampler[] } {
  const plot = compilePlot(ce, json, { target: "javascript", each: true, ...(vars === undefined ? {} : { vars }) });
  const sys = systemHelpersOf(ce);
  const items = plot.items.map((item) => {
    if (item.code === undefined) throw new Error(`not compilable: ${JSON.stringify(item.json)}`);
    // oxlint-disable-next-line no-implied-eval -- the engine's compiled output
    const fn = new Function("_SYS", "_", `return (${item.code});`) as (sys: unknown, scope: object) => unknown;
    return (scope: Readonly<Record<string, number>>): number => {
      const v = fn(sys, scope);
      return typeof v === "number" ? v : Number.NaN;
    };
  });
  return { compiled: plot.items, free: plot.unknowns.filter((u) => !u.startsWith("_")), items };
}

/** The plots of an expression: a `Show`'s producers wait on a view, which a page gives them. */
const SAMPLED: ReadonlySet<string> = new Set([
  "Plot",
  "ParametricPlot",
  "DiscretePlot",
  "PolarPlot",
  "VectorPlot",
  "StreamPlot",
  ...FIELD_PLOT_HEADS,
]);

/** A surface, sampled over its domain on the grid the page uses: the box a page draws once its kernel has answered. */
function sampledSurface(ce: ComputeEngine, held: readonly unknown[]): Box {
  const settings = graphics3dSettingsOf(held as never)!;
  const { compiled, free, items } = samplers(ce, held[1]);
  const [vx, vy] = [
    settings["xvar"] || free[0] || "x",
    settings["yvar"] || free.find((u) => u !== (settings["xvar"] || free[0])) || "y",
  ];
  const [[xlo, xhi], [ylo, yhi]] = surfaceDomains(settings);
  const side = gridSide(settings);
  const [xs, ys] = [gridAxis(xlo, xhi, side), gridAxis(ylo, yhi, side)];
  const grids = sampleGrids(compiled.length, xs, ys, (k, x, y) => items[k]!({ [vx]: x, [vy]: y }));
  return surfaceBox(grids, xs, ys, graphics3dOptionsOf(settings));
}

/** A portrait, evaluated pixel by pixel on the CPU: the raster the page's shader would paint. */
function sampledPortrait(ce: ComputeEngine, held: readonly unknown[]): Box {
  const settings = complexPlotSettingsOf(held as never)!;
  const f = complexFunction(ce.box(held[1] as never).json, settings["var"] || "z");
  if (f === undefined) throw new Error(`no CPU evaluation of ${JSON.stringify(held[1])}`);
  return complexPlotBox(f, complexPlotOptionsOf(settings));
}

/** A complex surface, evaluated on the CPU grid: |f| for heights, arg f for the faces' hues. */
function sampledComplexSurface(ce: ComputeEngine, held: readonly unknown[]): Box {
  const settings = complexPlot3dSettingsOf(held as never)!;
  const f = complexFunction(ce.box(held[1] as never).json, settings["var"] || "z");
  if (f === undefined) throw new Error(`no CPU evaluation of ${JSON.stringify(held[1])}`);
  const surface = sampleComplexSurface(f, {
    domain: parseComplexDomain(settings["domain"]),
    samples: Number(settings["samples"]) || 40,
    maxHeight: Number(settings["max-height"]) || undefined,
  });
  return complexSurfaceBox(surface, { gradient: settings["gradient"], reverse: on(settings["reverse"]) });
}

/** A plot of an expression, sampled over its domain: the box a page draws once its kernel has answered. */
function sampled(ce: ComputeEngine, held: readonly unknown[]): Box {
  const settings = plotSettingsOf(held as never)!;
  const body = held[1];
  if (FIELD_PLOT_HEADS.includes(String(held[0]))) {
    const head = String(held[0]);
    if (settings["declined"] !== undefined) throw new Error(`no margin for ${settings["declined"]}`);
    const field = fieldSourcesOf(head, body)!;
    const { free, items } = samplers(ce, field.kind === "value" ? body : ["List", ...field.sources]);
    const [vx, vy] = [
      settings["xvar"] || free[0] || "x",
      settings["yvar"] || free.find((u) => u !== (settings["xvar"] || free[0])) || "y",
    ];
    const { xs, ys } = fieldAxes(head, settings);
    const gridOf = (item: Sampler, params: readonly (readonly [string, string])[] = []): number[][] =>
      ys.map((y) =>
        xs.map((x) =>
          item({ [vx]: x, [vy]: y, ...Object.fromEntries(params.map(([name, of]) => [name, of === vx ? x : y])) }),
        ),
      );
    // The `RegionFunction` as written, read as the page's settings read it: its margin, compiled.
    const written = optionsOf(held as never).options["RegionFunction"];
    const region = written === undefined ? undefined : regionFunctionOf(written);
    const inside = region && gridOf(samplers(ce, region.margin).items[0]!, regionFunctionVars(settings, vx, vy));
    return fieldBoxOfGrids(
      head,
      settings,
      items.map((item) => gridOf(item)),
      xs,
      ys,
      inside,
    );
  }
  if (held[0] === "VectorPlot" || held[0] === "StreamPlot") {
    const [vx, vy] = [settings["xvar"] || "x", settings["yvar"] || "y"];
    const parts = Array.isArray(body) && body[0] === "Tuple" ? body.slice(1) : [];
    if (parts.length !== 2) throw new Error("a field is a pair of components");
    const [u, v] = parts.map((part) => samplers(ce, part, [vx, vy]).items[0]!);
    const { x, y, options } = vectorOptionsOf(settings);
    return vectorPlotBox(
      (px, py) => [u!({ [vx]: px, [vy]: py }), v!({ [vx]: px, [vy]: py })],
      x[0],
      x[1],
      y[0],
      y[1],
      options,
    );
  }
  if (held[0] !== "PolarPlot") {
    const figure = sampledFigure(ce, held);
    if (figure === undefined) throw new Error(`nothing to draw of ${String(held[0])}`);
    return figure;
  }
  const loaded = loadCompiled(compilePlot(ce, plainJson(body as never), CURVE_SPEC), runtimeOf(ce));
  const curves = polarCurvesOf(settings, loaded);
  if ("unbound" in curves) throw new Error(`no value for ${curves.unbound.join(", ")}`);
  if ("failed" in curves) throw new Error(curves.failed);
  return polarBoxOfCurves(settings, curves);
}

/** What compiled code calls, from an engine in this process. */
const runtimeOf = (ce: ComputeEngine): PlotRuntime => engineRuntime(ce, analyticScopeOf(analytic));

/** An `Epilog` or `Prolog` as written, read to primitives. */
const marksOf = (written: string): Primitive[] | undefined => {
  const { json, errors } = parseExpression(written);
  return errors.length > 0 ? undefined : primitivesOf(plainJson(json as never) as never);
};

/**
 * A curve plot, a `Graphics`, or a `Show` of them, drawn by the one sampler every host shares
 * (`figurePlanOf`): each source compiled by `ce`, then sampled and composed as the page does.
 */
function sampledFigure(ce: ComputeEngine, held: readonly unknown[]): Box | undefined {
  const head = String(held[0]);
  const settings = head === "Show" ? undefined : plotSettingsOf(held as never);
  const show = head === "Show" ? planeShowOf(held as never) : settings && lonePlotOf(head, settings);
  if (!show) return undefined;
  const plan = figurePlanOf(show);
  const loaded = plan.sources.map((text) =>
    loadCompiled(compilePlot(ce, plainJson(parseExpression(text, { ce }).json as never), CURVE_SPEC), runtimeOf(ce)),
  );
  const box = plan.draw(loaded, { marks: marksOf });
  if (box !== undefined && "unbound" in (box as object))
    throw new Error(`no value for ${(box as { unbound: string[] }).unbound.join(", ")}`);
  if (box !== undefined && "failed" in (box as object)) throw new Error((box as { failed: string }).failed);
  return box as Box | undefined;
}

/**
 * `expr` evaluated in `ce` and lowered to boxes as a front end draws it, with a plot of an
 * expression sampled. A value that doesn't draw lowers to `makeBoxes`' text boxes, which a caller
 * tells by the head.
 */
/** A plot of a complex function by its parts, sampled by the evaluator the page uses. */
function sampledParts(ce: ComputeEngine, held: readonly unknown[]): Box {
  const settings = plotSettingsOf(held as never)!;
  const kind = settings["parts"];
  const f = complexFunction(ce.box(held[1] as never).json, settings["var"] || (kind === "contours" ? "z" : "x"));
  if (f === undefined) throw new Error(`no complex evaluator for ${String(held[0])}`);
  if (kind === "contours") return complexContourBoxOf(f, settings).box;
  return plotBoxOfSamples(settings, complexPartSeries(kind === "absarg" ? "absarg" : "reim", f, settings));
}

export function boxOfExample(ce: ComputeEngine, expr: MathJSON): Box {
  const value = plainJson(ce.box(expr as never).evaluate().json as Json);
  const shown = Array.isArray(value) && value[0] === "Show" ? sampledFigure(ce, value) : undefined;
  if (shown !== undefined) return shown;
  const notation = { ...notationOf(ce), ...FIGURE_NOTATION, ...PLOT_NOTATION };
  const box = makeBoxes(value as never, notation);
  const held = unsampledPlot(box) as readonly unknown[] | undefined;
  if (held !== undefined && held[0] === "ComplexPlot") return sampledPortrait(ce, held);
  if (held !== undefined && String(held[0]) in COMPLEX_PART_HEADS) return sampledParts(ce, held);
  if (held !== undefined && SAMPLED.has(String(held[0]))) return sampled(ce, held);
  const surface = unsampledGraphics3d(box) as readonly unknown[] | undefined;
  if (surface !== undefined && surface[0] === "ComplexPlot3D") return sampledComplexSurface(ce, surface);
  return surface !== undefined && surface[0] === "Plot3D" ? sampledSurface(ce, surface) : box;
}

const isNode = (box: unknown): box is BoxNode => Array.isArray(box) && typeof box[0] === "string";
const isOptions = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

/** Boxes that only hold others: what a drawing's marks sit in. */
const CONTAINERS = new Set([
  "RowBox",
  "StyleBox",
  "TagBox",
  "GraphicsComplexBox",
  "GraphicsComplex3DBox",
  "InterpretationBox",
]);

const ADDRESS = /^\d+,\d+(;\d+,\d+)*$/;

/** A number to 9 significant digits: the last digits of a sampled float are no claim. */
const settle = (x: unknown): unknown =>
  typeof x === "number"
    ? Number(x.toPrecision(9))
    : Array.isArray(x)
      ? x.map(settle)
      : isOptions(x)
        ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, settle(v)]))
        : x;

/**
 * `box`'s shape for the parts `asked` names: its head always; a drawing's `marks` and `roles` by
 * count, the root's options by key (numbers settled) and its operands, each only where `asked` has them.
 */
export function shapeOf(box: Box, asked: BoxShape): BoxShape {
  if (!isNode(box)) throw new Error(`not a box: ${JSON.stringify(box)}`);
  const marks: Record<string, number> = {};
  const roles: Record<string, number> = {};
  // An `InterpretationBox` around a drawing holds its expression; the shape is the drawing's.
  const drawing = graphicsOf(box)?.box ?? graphics3dOf(box)?.box ?? box;
  const walk = (node: unknown, role?: string): void => {
    if (!isNode(node)) return;
    // A figure's tags name an address (`0,1`, a link's `0,1;1,2`), a plot's name a role.
    if (node[0] === "TagBox" && typeof node[2] === "string")
      return walk(node[1], ADDRESS.test(node[2]) ? undefined : node[2]);
    if (!CONTAINERS.has(node[0])) {
      marks[node[0]] = (marks[node[0]] ?? 0) + 1;
      if (role !== undefined) roles[role] = (roles[role] ?? 0) + 1;
    } else if (node[0] === "GraphicsComplexBox" || node[0] === "GraphicsComplex3DBox") {
      // Operand 1 is the coordinates; the primitives are operand 2.
      if (Array.isArray(node[2])) for (const part of node[2]) walk(part, role);
    } else if (node[0] === "RowBox" && Array.isArray(node[1])) for (const part of node[1]) walk(part, role);
    else walk(node[1]);
  };
  if (drawing[0] === "GraphicsBox" || drawing[0] === "Graphics3DBox")
    for (const part of drawing[1] as readonly unknown[]) walk(part);
  const shape: { -readonly [K in keyof BoxShape]: BoxShape[K] } = { head: drawing[0] };
  if (asked.marks !== undefined) shape.marks = marks;
  if (asked.roles !== undefined) shape.roles = roles;
  const last = drawing.at(-1);
  if (asked.operands !== undefined)
    shape.operands = drawing.slice(1, drawing.length > 1 && isOptions(last) ? -1 : undefined);
  if (asked.options !== undefined) {
    const have: Record<string, unknown> = drawing.length > 1 && isOptions(last) ? last : {};
    shape.options = Object.fromEntries(Object.keys(asked.options).map((key) => [key, settle(have[key])]));
  }
  return shape;
}

/** `shape` with its numbers settled, for comparing with `shapeOf`'s. */
export const settledShape = (shape: BoxShape): BoxShape => ({
  ...shape,
  ...(shape.options === undefined ? {} : { options: settle(shape.options) as Record<string, unknown> }),
});
