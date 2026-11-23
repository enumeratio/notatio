// The text surface's reading of a result: a `Plot` head, sampled by the session and
// drawn on braille cells, for a terminal without an image protocol and for a pipe.
// The Node host prefers an inline image where the terminal has one; this is what
// stands in where it does not, and what the control strip draws under itself.

import { JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import { type Box, notationOf } from "@notatio/boxes";
import * as analytic from "@notatio/analytic";
import {
  analyticScopeOf,
  CURVE_SPEC,
  curvesOf,
  type FigurePlan,
  figurePlanOf,
  headOf,
  loadCompiled,
  type LoadedPlot,
  lonePlotOf,
  opsOf,
  plainJson,
  type PlaneShow,
  planeShowOf,
  plotSettingsOf,
  type Primitive,
  primitivesOf,
  strOf,
  tupleOf,
  vectorOptionsOf,
  vectorPlotBox,
} from "@notatio/frontend";
import { parseExpression } from "@notatio/formats/expression";
import { compilePlot, engineRuntime } from "@notatio/frontend/plot-compile";
import type { Drawn } from "./cell-layout.ts";
import type { PlotPoint, Session } from "./engine.ts";
import { drawPlotBox } from "./cell-draw.ts";
import { figureText } from "./figure.ts";

type Json = Parameters<typeof headOf>[0];

/** A curve plot, or a `Show` of plots and graphics, read for the one sampler every host shares. */
function planeFigureOf(json: Json): PlaneShow | undefined {
  const plain = plainJson(json as never) as Json;
  const head = headOf(plain);
  if (head === "Show") return planeShowOf(plain as never);
  const settings = head === undefined ? undefined : plotSettingsOf(plain as never);
  // A plot of data and a lone `Graphics` lower whole, with no engine, by their own rules.
  return settings?.["value"]?.trim() ? lonePlotOf(head!, settings) : undefined;
}

/** An `Epilog` or `Prolog` as written, read to primitives. */
const marksOf = (written: string): Primitive[] | undefined => {
  const { json, errors } = parseExpression(written);
  return errors.length > 0 ? undefined : primitivesOf(plainJson(json as never) as never);
};

/**
 * A figure's sources compiled by the session's engine; an item with no code is substituted and
 * evaluated. Undefined when a source does not parse.
 */
function loadedOf(session: Session, plan: FigurePlan): LoadedPlot[] | undefined {
  const { ce } = session;
  const runtime = engineRuntime(ce as never, analyticScopeOf(analytic));
  const loaded: LoadedPlot[] = [];
  for (const text of plan.sources) {
    const { json, errors } = parseExpression(text, { ce: ce as never });
    if (errors.length > 0) return undefined;
    loaded.push(loadCompiled(compilePlot(ce as never, plainJson(json as never), CURVE_SPEC), runtime));
  }
  return loaded;
}

/**
 * A curve plot, or a `Show` of plots and graphics, as the `GraphicsBox` a terminal draws: sampled by
 * the sampler the page uses, in the data's own extent. Undefined when it is none, or when it cannot
 * be compiled or sampled: the result is then written as any other.
 */
export function sampledFigure(session: Session, json: Json): Box | undefined {
  try {
    const show = planeFigureOf(json);
    if (show === undefined) return undefined;
    const plan = figurePlanOf(show);
    const loaded = loadedOf(session, plan);
    const box = loaded && plan.draw(loaded, { marks: marksOf, tight: true });
    return box === undefined || "unbound" in (box as object) || "failed" in (box as object) ? undefined : (box as Box);
  } catch {
    return undefined;
  }
}

/** A `Plot`'s first curve as points, for a host that draws the picture itself; undefined as `sampledFigure` is. */
export function samplePlot(session: Session, json: Json): PlotPoint[] | undefined {
  try {
    const plain = plainJson(json as never) as Json;
    const settings = headOf(plain) === "Plot" ? plotSettingsOf(plain as never) : undefined;
    if (!settings?.["value"]?.trim()) return undefined;
    const loaded = loadedOf(session, figurePlanOf(lonePlotOf("Plot", settings)!));
    const curves = loaded?.[0] && curvesOf(settings, loaded[0]);
    return curves && "series" in curves ? [...(curves.series[0]?.points ?? [])] : undefined;
  } catch {
    return undefined;
  }
}

/** Arrows and streamline seeds per side on cells, unless `N` says otherwise. */
const TERMINAL_ARROWS = 8;
const TERMINAL_STREAMS = 4;

/** A bare compute-engine's helpers for compiled JavaScript (`_SYS`: integer powers, gamma, …). */
const systemHelpers = (ce: Session["ce"]): unknown =>
  (new JavaScriptTarget().compile(ce.box(["Power", "x", 3])).run as unknown as { SYS: unknown }).SYS;

/** `component` as a function of the plot's two variables: compiled JavaScript, else `subs` and `N`. */
function componentSampler(
  session: Session,
  component: Json,
  [vx, vy]: readonly [string, string],
): (x: number, y: number) => number {
  const { ce } = session;
  const [item] = compilePlot(ce, component, { target: "javascript", vars: [vx, vy] }).items;
  if (item?.code !== undefined && !item.code.includes("_.__")) {
    // oxlint-disable-next-line no-implied-eval -- the code is compute-engine's compiled output
    const fn = new Function("_SYS", "_", `return (${item.code});`) as (sys: unknown, scope: object) => unknown;
    const sys = systemHelpers(ce);
    return (x, y) => {
      const v = fn(sys, { [vx]: x, [vy]: y });
      return typeof v === "number" ? v : Number.NaN;
    };
  }
  const expr = ce.box(component as never);
  return (x, y) => expr.subs({ [vx]: ce.number(x), [vy]: ce.number(y) }).N().re;
}

/**
 * A `VectorPlot` or `StreamPlot` result sampled with the session: the `GraphicsBox` of its arrows
 * or streamlines, if it is one and its field is a pair.
 */
export function sampledField(session: Session, json: Json): Box | undefined {
  const head = headOf(json);
  if (head !== "VectorPlot" && head !== "StreamPlot") return undefined;
  const settings = plotSettingsOf(plainJson(json) as never);
  const parts = tupleOf(opsOf(json)[0]);
  if (settings === undefined || parts?.length !== 2) return undefined;
  const vars = [settings["xvar"] || "x", settings["yvar"] || "y"] as const;
  const [u, v] = parts.map((part) => componentSampler(session, part, vars));
  const { x, y, options } = vectorOptionsOf(settings);
  // A cell is 2 × 4 dots: the page's grid would be a smear, so a terminal's default is sparser.
  const n = options.n ?? (options.type === "stream" ? TERMINAL_STREAMS : TERMINAL_ARROWS);
  return vectorPlotBox((px, py) => [u!(px, py), v!(px, py)], x[0], x[1], y[0], y[1], { ...options, n });
}

/**
 * The result as text: a plot or a figure drawn on cells, else the session's rendering. A plot a
 * pipe pinned comes back `Labeled` with its caption, and keeps it under the cells.
 */
export function textOf(session: Session, json: Json, width = 60, height = 12): string {
  return drawnOf(session, json, width, height).text;
}

/** `textOf`, with the baseline row of a StandardForm result for `Out[n]=` to sit beside. */
export function drawnOf(session: Session, json: Json, width = 60, height = 12): Drawn {
  if (headOf(json) === "Labeled") {
    const [body, label] = opsOf(json);
    const caption = strOf(label);
    if (body !== undefined && caption !== undefined && planeFigureOf(body) !== undefined)
      return { text: `${textOf(session, body, width, height)}\n  ${caption}` };
  }
  const plotted = sampledFigure(session, json);
  if (plotted !== undefined) return { text: drawPlotBox(plotted as never, { width, height }) };
  const figure = figureText(json, {
    width,
    field: (field) => sampledField(session, field),
    notation: notationOf(session.ce),
    evaluate: (pinned) => session.render(session.ce.box(pinned as never).evaluate()),
  });
  if (figure !== undefined) return { text: figure };
  return session.renderDrawn(session.ce.box(json as never).evaluate());
}
