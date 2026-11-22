// One plot sampler. A host compiles a figure's sources its own way (an engine in process, a kernel
// by message); from the compiled code on, every host draws the same figure by the same steps:
// samplers from the code, the plot's variable, its series over the domain or a zoomed window, its
// `Epilog` and `Prolog`, and a `Plot` or a `Show` of plots composed into one `GraphicsBox`.

import type { Box } from "@notatio/boxes";
import type { PlotSeries } from "./plot-box.ts";
import type { CompiledItem, CompiledPlot, PlotCompileSpec } from "./plot-compile.ts";
import {
  graphicsBoxOfSettings,
  PLANE_LAYER_HEADS,
  type PlaneLayer,
  type PlaneShow,
  planeShowPlan,
  plotBoxOfSamples,
  plotDataSeries,
  type PlotSettings,
  spanOf,
} from "./plot-lowering.ts";
import { type PlotWindow, plotSeries, plotSeriesIn } from "./plot.ts";
import type { Primitive } from "./primitives.ts";

/** What a compiled function reads: the plot's variables, the wildcards, and its runtime. */
export type Scope = Record<string, unknown>;

/** One item, as a function of a scope; `NaN` where it has no real value. */
export type Sampler = (scope: Scope) => number;

/** What compiled code needs from its host. */
export interface PlotRuntime {
  /** compute-engine's helpers for compiled JavaScript (`_SYS`), where the code calls them. */
  readonly sys?: unknown;
  /** What the code reads from its scope besides variables: the analytic kernels (`__hz`, …). */
  readonly scope?: Scope;
  /** An item compiling gave no code for, sampled the host's way; without one it has no value. */
  readonly evaluate?: (item: CompiledItem) => Sampler;
}

/** A compiled plot with its items ready to sample, and the scope they read from. */
export interface LoadedPlot {
  readonly plot: CompiledPlot;
  readonly samplers: readonly Sampler[];
  /** A fresh scope for one sampling pass: the runtime the code calls, nothing else. */
  scope(): Scope;
}

/** Whether compiled code calls the analytic kernels, which it reads from its scope (`_.__hz(…)`). */
export const callsAnalytic = (plot: CompiledPlot): boolean =>
  plot.items.some((item) => item.code?.includes("_.__") === true);

/**
 * The analytic kernels as compiled code reads them from its scope, from `@notatio/analytic`'s
 * module: every host hands the same names, however it loads the module.
 */
export const analyticScopeOf = (analytic: {
  readonly hurwitzZetaReal: unknown;
  readonly zetaGeneralizedReal: unknown;
  readonly lerchPhiReal: unknown;
  readonly polyLogReal: unknown;
}): Scope => ({
  __hz: analytic.hurwitzZetaReal,
  __zg: analytic.zetaGeneralizedReal,
  __lp: analytic.lerchPhiReal,
  __pl: analytic.polyLogReal,
});

/** How a host compiles a curve plot's body: every element of a list on its own, to JavaScript. */
export const CURVE_SPEC: PlotCompileSpec = { target: "javascript", each: true };

/** The domain a plot is sampled over when it gives none, and its samples when it gives no count. */
export const DEFAULT_DOMAIN: readonly [number, number] = [-6.283185, 6.283185];
export const DEFAULT_SAMPLES = 160;

/** How far a complex sample's imaginary part may stray from 0, relative to its size, and still read as real. */
const REAL_TOLERANCE = 1e-12;

/** A sample's number: a real, or a complex value that is real up to rounding; `NaN` for any other. */
export const sampleNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v !== "object" || v === null) return Number.NaN;
  const { re, im } = v as { re?: unknown; im?: unknown };
  if (typeof re !== "number" || typeof im !== "number") return Number.NaN;
  return Math.abs(im) <= REAL_TOLERANCE * Math.max(1, Math.abs(re)) ? re : Number.NaN;
};

/** `plot`'s items as samplers over `runtime`. */
export function loadCompiled(plot: CompiledPlot, runtime: PlotRuntime = {}): LoadedPlot {
  const samplers = plot.items.map((item): Sampler => {
    if (item.code === undefined) return runtime.evaluate?.(item) ?? (() => Number.NaN);
    // oxlint-disable-next-line no-implied-eval -- the code is the compiler's output
    const fn = new Function("_SYS", "_", `return (${item.code});`) as (sys: unknown, scope: Scope) => unknown;
    return (scope) => sampleNumber(fn(runtime.sys, scope));
  });
  return { plot, samplers, scope: () => ({ ...runtime.scope }) };
}

/** A curve plot's series over its whole domain, and again over a window a reader has zoomed to. */
export interface Curves {
  readonly series: PlotSeries[];
  readonly inWindow?: (window: PlotWindow | undefined, pixels?: number) => PlotSeries[];
}

/**
 * A curve plot's series from its compiled body: the wildcards filled from `bindings`, the variable
 * the plot names or the free symbol left, sampled as its settings say. `unbound` names the symbols
 * that are neither: the plot would sample to nothing.
 */
export function curvesOf(
  settings: PlotSettings,
  loaded: LoadedPlot,
  bindings?: Readonly<Record<string, unknown>>,
): Curves | { readonly unbound: string[] } {
  const { plot, samplers } = loaded;
  const scope = loaded.scope();
  Object.assign(scope, bindings);
  const variable = settings["var"] || plot.unknowns.find((u) => !u.startsWith("_")) || "x";
  const unbound = plot.unknowns.filter((u) => !u.startsWith("_") && u !== variable && !(u in scope));
  if (unbound.length > 0) return { unbound };
  const at =
    (k: number) =>
    (t: number): number => {
      scope[variable] = t;
      return samplers[k]!(scope);
    };
  const options = {
    domain: spanOf(settings["domain"]) ?? DEFAULT_DOMAIN,
    samples: Number(settings["samples"]) || DEFAULT_SAMPLES,
    mode: settings["mode"],
    adaptive: settings["adaptive"] !== "false",
    parametric: settings["parametric"] !== undefined && settings["parametric"] !== "false",
  };
  return {
    series: plotSeries(plot.items, at, options),
    inWindow: (window, pixels) => plotSeriesIn(plot.items, at, options, window, pixels),
  };
}

/** How a figure is looked at: the wildcards' values, a zoomed window, and what reads its marks. */
export interface FigureView {
  readonly bindings?: Readonly<Record<string, unknown>>;
  readonly window?: PlotWindow;
  /** The figure's width in CSS px, which a zoomed window's sampling density follows. */
  readonly pixels?: number;
  /** An `Epilog` or `Prolog` as written, read to primitives; without one a plot's marks are left out. */
  readonly marks?: (written: string) => readonly Primitive[] | undefined;
  /** `PlotRangePadding -> None`, for a terminal: the window is the data's own extent. */
  readonly tight?: boolean;
}

/** A figure of the plane, read once: what to compile, and how to draw it from the compiled code. */
export interface FigurePlan {
  /** Each plot's body as Epsil, in layer order, to compile with `CURVE_SPEC`. */
  readonly sources: readonly string[];
  /**
   * The figure as a `GraphicsBox` from `loaded`, one per source in order. Undefined when a plot has
   * nothing to draw; `unbound` when one names symbols with no value.
   */
  draw(loaded: readonly LoadedPlot[], view?: FigureView): Box | { readonly unbound: string[] } | undefined;
}

/**
 * The plan for a curve plot, a plot of data, a `Graphics`, or a `Show` of them (`show`, from
 * `planeShowOf`); a lone plot is a `Show` of one layer with no frame of its own.
 */
export function figurePlanOf(show: PlaneShow): FigurePlan {
  // A plot of data needs no compiling; a `Graphics` has no series.
  const sampled = show.layers.flatMap((layer, index) =>
    layer.head !== "Graphics" && plotDataSeries(layer.settings) === undefined && layer.settings["value"]?.trim()
      ? [index]
      : [],
  );
  return {
    sources: sampled.map((index) => show.layers[index]!.settings["value"]!),
    draw(loaded, view = {}) {
      const unbound: string[] = [];
      const own: { prolog: Primitive[]; epilog: Primitive[] } = { prolog: [], epilog: [] };
      const plan = planeShowPlan(show, (layer, index) => {
        for (const name of ["prolog", "epilog"] as const) {
          const written = layer.settings[name]?.trim();
          if (written) own[name].push(...(view.marks?.(written) ?? []));
        }
        const data = plotDataSeries(layer.settings);
        if (data !== undefined) return data;
        const at = sampled.indexOf(index);
        if (at < 0 || loaded[at] === undefined) return undefined;
        const curves = curvesOf(layer.settings, loaded[at]!, view.bindings);
        if ("unbound" in curves) {
          unbound.push(...curves.unbound);
          return [];
        }
        return view.window !== undefined && curves.inWindow ? curves.inWindow(view.window, view.pixels) : curves.series;
      });
      if (unbound.length > 0) return { unbound: [...new Set(unbound)] };
      if (plan === undefined) return undefined;
      if ("graphics" in plan) return graphicsBoxOfSettings(plan.graphics, view.window);
      const w = view.window;
      return plotBoxOfSamples(plan.settings, plan.series, {
        prolog: [...plan.marks.prolog, ...own.prolog],
        epilog: [...plan.marks.epilog, ...own.epilog],
        styles: plan.styles,
        ...(view.tight && { tight: true }),
        ...(w && { xRange: w.x, ...(w.y && { plotRange: w.y }) }),
      });
    },
  };
}

/** A lone plot of the plane as the one-layer `Show` it is drawn as; undefined for any other head. */
export function lonePlotOf(head: string, settings: Record<string, string>): PlaneShow | undefined {
  if (!PLANE_LAYER_HEADS.includes(head)) return undefined;
  const layer: PlaneLayer = { head, settings };
  return { layers: [layer], frame: {} };
}
