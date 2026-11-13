// A 2-D plot in `<graphics-box>`: the element holds the plot's expression (`Plot(Sin(x), (x, 0,
// 2*Pi))`, options and all, as `Show` does), the kernel samples it, and the samples lower to a
// `GraphicsBox` (`plotBox`, or `vectorPlotBox` for a field) that `svg()` draws. What the page adds is the pointer's hover readout
// and, for a plot in a Manipulate, the wildcards (`_a`) the controls fill. A plot's `Locator`
// reads its geometry through `frame`. A diagram (`GraphPlot(…)`, `TorusSquare(2, 3)`) needs no
// sampling: its box is lowered whole, and a torus square's point follows the page's clock. So does a
// chart (`BarChart([3, 1, 4])`), which holds its data (`chartBox`). A field plot (`ContourPlot`,
// `DensityPlot`) is sampled on a grid and lowers to lines or a `RasterBox`.

import type { MathJsonExpression } from "@cortex-js/compute-engine/epsil";
import { html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { type Box, type BoxNode, optionsOfBox } from "@notatio/boxes";
import {
  chartBoxOfSettings,
  debug,
  type Field2d,
  FIELD_PLOT_HEADS,
  fieldAxes,
  fieldBoxOfData,
  fieldBoxOfGrids,
  type FieldPaints,
  fieldPaintsOf,
  FieldRenderer,
  fieldScaleOf,
  fitsFieldShader,
  getGpu,
  diagramBoxOf,
  followsClock,
  gestureHandlingOf,
  pageClock,
  type PlotFrame,
  plotBoxOfSamples,
  plotDataSeries,
  type PlotSeries,
  type PlotWindow,
  type PolarPlotOptions,
  plotSeries,
  plotSeriesIn,
  slideInterval,
  polarFrameOf,
  polarPlotBox,
  polarPlotBoxSvg,
  polarPointsOf,
  primitivesOf,
  regionFunctionVars,
  type Primitive,
  renderChart,
  renderDiagram,
  renderPlot,
  samplePolar,
  samplePolarIn,
  spanOf,
  vectorOptionsOf,
  vectorPlotBox,
  wheelZooms,
} from "@notatio/frontend/core";
import { compilePlotText, type LoadedPlot, plotFunctions, readEpsil } from "./plot-kernel.ts";

const log = debug("plot");

/** The element a plot lives in: its expression, the wildcards its scope fills, and a way to redraw. */
export interface PlotHost extends HTMLElement {
  value: string;
  bindings: Readonly<Record<string, unknown>> | undefined;
  gestureHandling?: string;
  /** Resolves once the element has rendered (a Lit element's). */
  readonly updateComplete?: Promise<unknown>;
  requestUpdate(): void;
}

/** The narrowest a zoomed view gets, as a fraction of the whole plot. */
const MIN_ZOOM = 1e-6;
/** Wheel travel (px) per e-fold of zoom. */
const WHEEL_RATE = 0.0015;
/** Milliseconds before a resample runs without waiting for a frame. */
const FRAME_FALLBACK_MS = 50;
/** Pixels a wheel line is worth, where the browser reports lines (Firefox). */
const LINE_PIXELS = 16;
/** Fallback plot width (px) before the SVG has a layout. */
const DEFAULT_PIXELS = 340;
/** Pointer travel (px) below which a press is a click, not a drag. */
const SLOP = 4;
/** The most device pixels per side a shader's canvas takes. */
const MAX_CANVAS = 4096;

/** A field plot's shader: its renderer, pointed at the plot's functions, and how they are painted. */
interface FieldShader {
  readonly renderer: FieldRenderer;
  readonly paints: FieldPaints;
  /** The wildcards the functions take, in argument order. */
  readonly params: readonly string[];
}

/** A plot box with its frame and no marks: what is drawn over a shader's canvas. */
const bareOf = (box: BoxNode): BoxNode => [box[0], [], ...box.slice(2)] as unknown as BoxNode;

const POLAR = new Set(["PolarPlot", "ListPolarPlot"]);
const FIELD = new Set(["VectorPlot", "StreamPlot"]);
const on = (v: string | undefined): boolean => v !== undefined && v !== "" && v !== "false";

/**
 * Split a `field` setting into its two components. Handles an optional `\{...\}`, `{...}` or
 * `(...)` wrapper and only splits on a comma at brace / paren depth zero, so `\{\frac{y}{2}, -x\}`
 * survives intact.
 */
export function splitField(raw: string): [string, string] | undefined {
  let s = raw.trim();
  const unwrap: [string, string][] = [
    ["\\{", "\\}"],
    ["\\left(", "\\right)"],
    ["{", "}"],
    ["(", ")"],
    ["[", "]"],
  ];
  for (const [open, close] of unwrap) {
    if (s.startsWith(open) && s.endsWith(close)) {
      s = s.slice(open.length, s.length - close.length).trim();
      break;
    }
  }
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "{" || c === "(" || c === "[") depth++;
    else if (c === "}" || c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      const u = s.slice(0, i).trim();
      const v = s.slice(i + 1).trim();
      if (u && v) return [u, v];
      return undefined;
    }
  }
  return undefined;
}

export class PlotView {
  #generation = 0;
  #series: PlotSeries[] = [];
  #polar: BoxNode | undefined;
  #diagram: BoxNode | undefined;
  #unwatch: (() => void) | undefined;
  #box: BoxNode | undefined;
  /** Whether the box is a vector field, which has no curve for a hover to read. */
  #field = false;
  /** Whether the plot is of the plane (a field plot), whose window has a y-range of its own. */
  #plane = false;
  /** A region plot or implicit curves drawn per pixel, on `#canvas` under the frame. */
  #shader: FieldShader | undefined;
  #canvas: HTMLCanvasElement | undefined;
  #resized: ResizeObserver | undefined;
  #charted = false;
  #svg = "";
  #hover: number | undefined;
  #xAt: (px: number) => number = () => Number.NaN;
  #frame: PlotFrame | undefined;
  #settings: Readonly<Record<string, string>> = {};
  #marks = new Map<string, Primitive[] | undefined>();
  /** The expression last drawn; another resets the view. */
  #text = "";
  /** What the reader has zoomed to; undefined is the whole plot, as a static environment draws it. */
  #window: PlotWindow | undefined;
  /** The whole plot's window, read from its box. */
  #home: PlotWindow | undefined;
  /** Samples the curves again for a window (undefined: the whole plot) and redraws. */
  #redo: ((window: PlotWindow | undefined) => void) | undefined;
  #frameRequest = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #pending = false;
  /** A press on a zoomed plot: where it began, and the window and geometry it began on. */
  #drag: { x: number; y: number; id: number; moved: boolean; window: PlotWindow; frame: PlotFrame } | undefined;

  constructor(readonly host: PlotHost) {}

  /** The plot area's geometry after the last draw, for an overlay such as a locator. */
  get frame(): PlotFrame | undefined {
    return this.#frame;
  }

  /** Read the host's expression, sample it and draw. */
  async recompute(): Promise<void> {
    const generation = ++this.#generation;
    const text = this.host.value.trim();
    const { plotOfText } = await import("@notatio/frontend/symbols");
    const plot = plotOfText(text);
    if (generation !== this.#generation) return;
    if (plot === undefined) return this.#clear();
    const { json: plain, settings } = plot;
    if (text !== this.#text) {
      this.#window = undefined;
      this.#unzoomable();
    }
    this.#text = text;
    this.#settings = settings;
    this.#reset();
    if (settings["layout"] !== undefined) return this.#diagramize(settings);
    const head = Array.isArray(plain) ? plain[0] : undefined;
    const chart = chartBoxOfSettings(settings);
    if (chart !== undefined) return this.#chart(chart as BoxNode);
    try {
      if (typeof head === "string" && POLAR.has(head)) await this.#polarize(head, settings, generation);
      else if (typeof head === "string" && FIELD.has(head)) await this.#vectorize(settings, generation);
      else if (typeof head === "string" && FIELD_PLOT_HEADS.includes(head))
        await this.#rasterize(head, settings, generation);
      else await this.#sample(settings, generation);
    } catch (error) {
      log("could not plot", text, error);
      if (generation === this.#generation) this.#clear();
    }
  }

  /** A chart of data: lowered whole, so nothing is sampled and the pointer reads nothing out. */
  #chart(box: BoxNode): void {
    this.#unzoomable();
    this.#charted = true;
    this.#series = [];
    this.#box = box;
    this.#frame = undefined;
    this.#xAt = () => Number.NaN;
    this.#svg = renderChart(box);
    this.#finish();
  }

  #clear(): void {
    this.#reset();
    this.#unzoomable();
    this.#series = [];
    this.#polar = this.#box = undefined;
    this.#svg = "";
    this.host.requestUpdate();
  }

  /** Forget the last plot's mode, so a plot of another kind starts clean. */
  #reset(): void {
    this.#stop();
    this.#charted = false;
    this.#field = false;
    this.#plane = false;
    this.#shader = undefined;
    this.#resized?.disconnect();
    this.#resized = undefined;
  }

  /** Forget how to resample: the plot is no longer one the reader can zoom. */
  #unzoomable(): void {
    this.#redo = undefined;
    this.#home = undefined;
    this.#polar = undefined;
  }

  /** Stop following the clock, and forget a diagram. */
  #stop(): void {
    this.#unwatch?.();
    this.#unwatch = undefined;
    this.#diagram = undefined;
    this.host.removeAttribute("data-diagram");
  }

  /** Release what the view holds on the page: its clock. */
  dispose(): void {
    cancelAnimationFrame(this.#frameRequest);
    clearTimeout(this.#timer);
    this.#pending = false;
    this.#unwatch?.();
    this.#unwatch = undefined;
    this.#resized?.disconnect();
    this.#resized = undefined;
  }

  /** Draw a diagram, and with it a torus square's point as the page's clock moves it. */
  #diagramize(settings: Readonly<Record<string, string>>): void {
    this.#unzoomable();
    this.#series = [];
    this.#box = undefined;
    this.#frame = undefined;
    this.host.setAttribute("data-diagram", settings["layout"]!);
    const draw = (phase?: number, first = false): void => {
      const box = diagramBoxOf(settings, phase) as BoxNode;
      this.#diagram = box;
      this.#svg = renderDiagram(box);
      if (first) this.#finish();
      else this.host.requestUpdate();
    };
    draw(undefined, true);
    if (followsClock(settings)) this.#unwatch = pageClock().watch((tick) => draw(tick.phase));
  }

  async #sample(settings: Readonly<Record<string, string>>, generation: number): Promise<void> {
    const marks = await this.#readMarks(settings);
    const data = plotDataSeries(settings);
    if (data === undefined) {
      const raw = settings["value"]?.trim();
      if (!raw) return this.#clear();
      const loaded = await plotFunctions(raw, { each: true });
      if (generation !== this.#generation) return;
      const { plot, samplers } = loaded;
      // The Manipulate parameters fill the wildcard slots (`_a`); the plot variable is whatever
      // free symbol remains.
      const scope = loaded.scope();
      Object.assign(scope, this.host.bindings);
      const variable = settings["var"] || plot.unknowns.find((u) => !u.startsWith("_")) || "x";
      // A symbol that is neither the plot variable nor bound would sample to nothing: say so.
      const unbound = plot.unknowns.filter((u) => !u.startsWith("_") && u !== variable && !(u in scope));
      if (unbound.length > 0) {
        this.#clear();
        const names = unbound.map((u) => `<code>${u.replace(/[^\w$]/g, "")}</code>`).join(", ");
        this.#svg = `<span class="graphics-box-unbound" role="status">Nothing to plot: ${names} ${unbound.length > 1 ? "have" : "has"} no value.</span>`;
        this.host.requestUpdate();
        return;
      }
      // Each curve is code the kernel compiled, sampled per t: vastly faster than a subs()+N()
      // per sample, so a 1000-point sweep or an animated slider stays smooth.
      const at =
        (k: number) =>
        (t: number): number => {
          scope[variable] = t;
          return samplers[k]!(scope);
        };
      const options = {
        domain: spanOf(settings["domain"]) ?? ([-6.283185, 6.283185] as const),
        samples: Number(settings["samples"]) || 160,
        mode: settings["mode"],
        adaptive: settings["adaptive"] !== "false",
        parametric: settings["parametric"] !== undefined && settings["parametric"] !== "false",
      };
      this.#series = plotSeries(plot.items, at, options);
      // A zoomed view asks the same compiled code again, over the window and at the pixels' density.
      this.#redo = (window) => {
        this.#series = plotSeriesIn(plot.items, at, options, window, this.#pixels());
        this.#rebuild();
      };
    } else {
      this.#series = data;
      this.#unzoomable();
    }
    this.#marked = marks;
    this.#polar = undefined;
    this.#field = false;
    this.#rebuild(true);
    if (this.#window !== undefined) this.#redo?.(this.#window);
  }

  #marked: { epilog?: Primitive[]; prolog?: Primitive[] } = {};

  /** The graphics primitives an `Epilog`/`Prolog` option carries, read once each. */
  async #readMarks(
    settings: Readonly<Record<string, string>>,
  ): Promise<{ epilog?: Primitive[]; prolog?: Primitive[] }> {
    const out: { epilog?: Primitive[]; prolog?: Primitive[] } = {};
    for (const name of ["epilog", "prolog"] as const) {
      const source = settings[name];
      if (!source?.trim()) continue;
      if (!this.#marks.has(source)) {
        const json = await readEpsil(source);
        this.#marks.set(source, json === undefined ? undefined : primitivesOf(json as MathJsonExpression));
      }
      const read = this.#marks.get(source);
      if (read) out[name] = read;
    }
    return out;
  }

  async #polarize(head: string, settings: Readonly<Record<string, string>>, generation: number): Promise<void> {
    const [t0, t1] = spanOf(settings["trange"]) ?? [0, 2 * Math.PI];
    const view: PolarPlotOptions = {
      axes: settings["axes"] !== "false",
      closed: on(settings["closed"]),
      filled: on(settings["filled"]),
      markers: on(settings["markers"]),
      max: Number(settings["max"]) > 0 ? Number(settings["max"]) : undefined,
      title: settings["label"] || undefined,
    };
    let points;
    let sample: ((t: number) => number) | undefined;
    if (head === "ListPolarPlot") {
      this.#unzoomable();
      let data: unknown;
      try {
        data = JSON.parse(settings["data"] ?? "null");
      } catch {
        data = undefined;
      }
      points = polarPointsOf(data, t0, t1) ?? [];
      view.markers = settings["markers"] !== "false";
    } else {
      const raw = settings["expr"]?.trim();
      if (!raw) return this.#clear();
      const loaded = await plotFunctions(raw);
      if (generation !== this.#generation) return;
      const scope = loaded.scope();
      Object.assign(scope, this.host.bindings);
      const variable = settings["tvar"] || loaded.plot.unknowns.find((u) => !u.startsWith("_")) || "theta";
      sample = (t: number): number => {
        scope[variable] = t;
        return loaded.samplers[0]!(scope);
      };
      points = samplePolar(sample, t0, t1, Math.max(2, Math.min(2000, Number(settings["n"]) || 240)));
    }
    this.#field = false;
    this.#box = undefined;
    this.#frame = undefined;
    const whole = points;
    const drawPolar = (window: PlotWindow | undefined): void => {
      const zoomed = window && {
        center: [(window.x[0] + window.x[1]) / 2, (window.y![0] + window.y![1]) / 2] as const,
        half: (window.x[1] - window.x[0]) / 2,
      };
      const shown = zoomed && sample ? samplePolarIn(sample, t0, t1, zoomed, this.#pixels()) : whole;
      this.#polar = polarPlotBox(shown, { ...view, ...(zoomed && { window: zoomed }) }) as BoxNode;
      this.#svg = polarPlotBoxSvg(this.#polar);
    };
    drawPolar(undefined);
    this.#home = this.#windowOf(this.#polar);
    if (sample) {
      this.#redo = (window) => {
        drawPolar(window);
        this.#finish();
      };
      if (this.#window !== undefined) drawPolar(this.#window);
    }
    this.#finish();
  }

  /** The plane a plot box shows. */
  #windowOf(box: BoxNode | undefined): PlotWindow | undefined {
    const range = box === undefined ? undefined : optionsOfBox(box).PlotRange;
    if (!Array.isArray(range) || !Array.isArray(range[0]) || !Array.isArray(range[1])) return undefined;
    const [x, y] = range as [[number, number], [number, number]];
    return { x: [x[0], x[1]], y: [y[0], y[1]] };
  }

  /**
   * A vector field: its components compiled and sampled on a grid, arrows or streamlines for the
   * box. The wildcards come from a surrounding `Manipulate`'s bindings.
   */
  async #vectorize(settings: Readonly<Record<string, string>>, generation: number): Promise<void> {
    const pair =
      settings["u"]?.trim() && settings["v"]?.trim()
        ? ([settings["u"], settings["v"]] as const)
        : settings["field"]?.trim()
          ? splitField(settings["field"])
          : undefined;
    if (!pair) return this.#clear();
    const vx = settings["xvar"] || "x";
    const vy = settings["yvar"] || "y";
    const vars = { vars: [vx, vy] };
    const [lu, lv] = await Promise.all([plotFunctions(pair[0], vars), plotFunctions(pair[1], vars)]);
    if (generation !== this.#generation) return;
    const scopeU = lu.scope();
    const scopeV = lv.scope();
    Object.assign(scopeU, this.host.bindings);
    Object.assign(scopeV, this.host.bindings);
    const su = lu.samplers[0];
    const sv = lv.samplers[0];
    this.#unzoomable();
    if (!su || !sv) return this.#clear();
    const field: Field2d = (x, y) => {
      scopeU[vx] = x;
      scopeU[vy] = y;
      scopeV[vx] = x;
      scopeV[vy] = y;
      return [su(scopeU), sv(scopeV)];
    };
    const { x, y, options } = vectorOptionsOf(settings);
    this.#box = vectorPlotBox(field, x[0], x[1], y[0], y[1], options) as BoxNode;
    this.#polar = undefined;
    this.#field = true;
    this.#draw();
  }

  /**
   * A contour or density plot: a grid of values, sampled from the compiled expression over its ranges
   * (or the `data` it was given), as lines or cells. The wildcards come from a surrounding
   * `Manipulate`'s bindings.
   */
  async #rasterize(head: string, settings: Readonly<Record<string, string>>, generation: number): Promise<void> {
    this.#unzoomable();
    this.#series = [];
    this.#polar = undefined;
    this.#frame = undefined;
    const listed = fieldBoxOfData(head, settings);
    if (listed !== undefined) {
      this.#box = listed as BoxNode;
      this.#field = true;
      return this.#draw();
    }
    // A predicate with no margin has no region to draw.
    if (settings["declined"] !== undefined) log("no margin for", settings["declined"], this.host.value);
    const raw = settings["expr"]?.trim();
    if (!raw || settings["declined"] !== undefined) return this.#clear();
    // A list of sources (a margin per region, a function per implicit curve) is sampled item by item.
    const [loaded, region] = await Promise.all([
      plotFunctions(raw, settings["field"] === undefined ? {} : { each: true }),
      settings["region-function"] ? plotFunctions(settings["region-function"]) : undefined,
    ]);
    if (generation !== this.#generation) return;
    if (loaded.samplers.length === 0) return this.#clear();
    const free = loaded.plot.unknowns.filter((u) => !u.startsWith("_"));
    const vx = settings["xvar"] || free[0] || "x";
    const vy = settings["yvar"] || free.find((u) => u !== vx) || "y";
    const params = regionFunctionVars(settings, vx, vy);
    // Each sample is code the kernel compiled, read from the scope.
    const sampled = (
      plot: typeof loaded,
      sampler: (typeof loaded.samplers)[number],
      xs: readonly number[],
      ys: readonly number[],
    ): number[][] => {
      const scope = plot.scope();
      Object.assign(scope, this.host.bindings);
      return ys.map((y) =>
        xs.map((x) => {
          scope[vx] = x;
          scope[vy] = y;
          for (const [name, of] of params) scope[name] = of === vx ? x : y;
          return sampler(scope);
        }),
      );
    };
    // The plot over `over`'s ranges: the same compiled code, sampled again at the same density.
    const boxOver = (over: Readonly<Record<string, string>>): { box: BoxNode; grids: number[][][] } => {
      const { xs, ys } = fieldAxes(head, over);
      const grids = loaded.samplers.map((sampler) => sampled(loaded, sampler, xs, ys));
      const inside = region?.samplers[0] && sampled(region, region.samplers[0], xs, ys);
      return { box: fieldBoxOfGrids(head, over, grids, xs, ys, inside) as BoxNode, grids };
    };
    const whole = boxOver(settings);
    // A zoomed view keeps the whole plot's levels and colors.
    const scaled = fieldScaleOf(head, settings, whole.grids[0] ?? []);
    // A `RegionFunction` is sampled on the grid, so its plot stays the box's.
    const shader = region === undefined ? await this.#fieldShader(head, raw, settings, [vx, vy], loaded) : undefined;
    if (generation !== this.#generation) return;
    const drawIn = (window: PlotWindow | undefined): void => {
      this.#box =
        window === undefined
          ? whole.box
          : boxOver({
              ...scaled,
              xrange: window.x.join(","),
              ...(window.y && { yrange: window.y.join(",") }),
              // Under a shader the box is only the frame: its marks are the canvas's.
              ...(this.#shader && { "plot-points": "2" }),
            }).box;
      this.#draw();
    };
    this.#shader = shader;
    this.#field = true;
    this.#plane = true;
    this.#home = this.#windowOf(whole.box);
    this.#redo = drawIn;
    drawIn(this.#window);
  }

  /**
   * The shader for a region plot or implicit curves, or undefined where the box draws them: no WebGL2,
   * a function with no GLSL, more functions or wildcards than the shader's slots, a wildcard that is
   * not a number, or paints only the box has (`fieldPaintsOf`).
   */
  async #fieldShader(
    head: string,
    raw: string,
    settings: Readonly<Record<string, string>>,
    vars: readonly [string, string],
    loaded: LoadedPlot,
  ): Promise<FieldShader | undefined> {
    const kind = settings["field"];
    if ((kind !== "regions" && kind !== "curves") || typeof document === "undefined") return undefined;
    const count = loaded.samplers.length;
    const params = loaded.plot.unknowns.filter((u) => u.startsWith("_"));
    const paints = fieldPaintsOf(head, settings, count);
    if (paints === undefined || !fitsFieldShader(count, params.length, false)) return undefined;
    if (params.some((name) => typeof this.host.bindings?.[name] !== "number")) return undefined;
    try {
      const [gpu, compiled] = await Promise.all([
        getGpu(),
        compilePlotText(raw, { target: "glsl", vars, each: true, fields: true, params }),
      ]);
      if (!gpu || compiled.unit === undefined) return undefined;
      const renderer = new FieldRenderer(gpu);
      return renderer.setFields(compiled.unit, { kind, count, params: params.length, mask: false })
        ? { renderer, paints, params }
        : undefined;
    } catch (error) {
      log("no shader for", raw, error);
      return undefined;
    }
  }

  /** Draw the shader's frame on its canvas, laid over the plot area as the SVG now shows it. */
  #paint(): void {
    const shader = this.#shader;
    const frame = this.#frame;
    const canvas = this.#canvas;
    const svg = this.#liveSvg();
    if (!shader || !frame || !canvas || !svg) return;
    // The host is the one element every draw keeps; the SVG is made again each time.
    this.#resized ??= new ResizeObserver(() => this.#paint());
    this.#resized.observe(this.host);
    const rect = svg.getBoundingClientRect();
    const [, , vw, vh] = (svg.getAttribute("viewBox") ?? "0 0 340 200").split(" ").map(Number);
    if (!(rect.width > 0) || !vw || !vh) return;
    const [left, top, right, bottom] = frame.box;
    const percent = (part: number, of: number): string => `${(part / of) * 100}%`;
    Object.assign(canvas.style, {
      left: percent(left, vw),
      top: percent(top, vh),
      width: percent(right - left, vw),
      height: percent(bottom - top, vh),
    });
    // Device pixels per viewBox unit: what the shader's widths, given in the plot's px, are scaled by.
    const scale = Math.min(
      (rect.width / vw) * (globalThis.devicePixelRatio || 1),
      MAX_CANVAS / Math.max(right - left, bottom - top),
    );
    const width = Math.max(1, Math.round((right - left) * scale));
    const height = Math.max(1, Math.round((bottom - top) * scale));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const [x0, y0] = frame.toData(left, bottom);
    const [x1, y1] = frame.toData(right, top);
    const target = canvas.getContext("2d");
    const drawn =
      target !== null &&
      shader.renderer.render(
        target,
        { x: [x0, x1], y: [y0, y1] },
        shader.params.map((name) => Number(this.host.bindings?.[name])),
        { ...shader.paints, width: shader.paints.width * scale },
      );
    // A lost context: the box draws the plot from here on.
    if (!drawn && this.#shader === shader) {
      this.#shader = undefined;
      this.#redo?.(this.#window);
    }
  }

  /** The box for the current samples and settings, over the zoomed window if the reader has one. */
  #rebuild(whole = false): void {
    const w = whole ? undefined : this.#window;
    this.#box = plotBoxOfSamples(this.#settings, this.#series, {
      ...this.#marked,
      ...(w && { xRange: w.x, ...(w.y && { plotRange: w.y }) }),
    }) as BoxNode;
    if (w === undefined) this.#home = this.#windowOf(this.#box);
    this.#draw();
  }

  /** The box drawn, with the hover readout when the pointer is over it. */
  #draw(): void {
    if (this.#box === undefined) return;
    const rendered = renderPlot(this.#shader ? bareOf(this.#box) : this.#box, this.#hover);
    this.#svg = rendered.svg;
    this.#xAt = rendered.xAt;
    this.#frame = rendered.frame;
    this.#finish();
    if (this.#shader === undefined) return;
    this.#canvas ??= Object.assign(document.createElement("canvas"), { className: "graphics-box-field" });
    // Once the element has rendered the frame the canvas is laid over.
    void Promise.resolve(this.host.updateComplete).then(() => this.#paint());
  }

  #finish(): void {
    // What the build drew for this plot gives way (`data-rendered`).
    this.host.toggleAttribute("data-rendered", true);
    this.host.requestUpdate();
    // Overlays reposition on the new geometry.
    this.host.dispatchEvent(new CustomEvent("graphics-box-render"));
  }

  /** The plot as a box, for an environment that draws boxes. */
  get box(): Box | undefined {
    return this.#diagram ?? this.#polar ?? this.#box;
  }

  /** Whether the reader can zoom this plot: one sampled from an expression. */
  get #zoomable(): boolean {
    return this.#redo !== undefined && this.#home !== undefined;
  }

  /** The SVG on screen: a prerendered one may sit beside it with no size. */
  #liveSvg(): SVGSVGElement | null {
    const all = [...this.host.querySelectorAll("svg")];
    return all.find((svg) => svg.getBoundingClientRect().width > 0) ?? all[0] ?? null;
  }

  /** The plot's width in CSS px, which the samples' density matches. */
  #pixels(): number {
    const width = this.#liveSvg()?.getBoundingClientRect().width;
    return Math.max(2, Math.round(width || DEFAULT_PIXELS));
  }

  /** The plot area's geometry as drawn, polar or Cartesian. */
  get #geometry(): PlotFrame | undefined {
    return this.#polar ? polarFrameOf(this.#polar) : this.#frame;
  }

  /** A pointer's place in the SVG's viewBox units. */
  #inView(e: { clientX: number; clientY: number }): [number, number] | undefined {
    const svg = this.#liveSvg();
    if (!svg) return undefined;
    const rect = svg.getBoundingClientRect();
    const [, , vw, vh] = (svg.getAttribute("viewBox") ?? "0 0 340 200").split(" ").map(Number);
    return [((e.clientX - rect.left) / (rect.width || 1)) * vw!, ((e.clientY - rect.top) / (rect.height || 1)) * vh!];
  }

  /** The window after zooming by `k` (above 1 zooms out) about `anchor`, kept within the whole plot. */
  #zoomed(anchor: readonly [number, number], k: number): PlotWindow | undefined {
    const home = this.#home;
    const now = this.#window ?? home;
    if (!home || !now) return undefined;
    const fit = (iv: readonly [number, number], whole: readonly [number, number], at: number): [number, number] => {
      const full = whole[1] - whole[0];
      const width = Math.min(full, Math.max(full * MIN_ZOOM, (iv[1] - iv[0]) * k));
      const lo = Math.min(whole[1] - width, Math.max(whole[0], at + ((iv[0] - at) * width) / (iv[1] - iv[0])));
      return [lo, lo + width];
    };
    const x = fit(now.x, home.x, anchor[0]);
    // A curve of x fits its y to the samples; the rest zoom both ways.
    const y = now.y && home.y && this.#fitsY ? fit(now.y, home.y, anchor[1]) : undefined;
    return this.#whole({ x, ...(y && { y }) }, home);
  }

  /** Whether the view has a y-window of its own (a parametric or polar plot's), not the samples'. */
  get #fitsY(): boolean {
    return this.#polar !== undefined || this.#plane || on(this.#settings["parametric"]);
  }

  /** `window`, or undefined once it shows the whole plot. */
  #whole(window: PlotWindow, home: PlotWindow): PlotWindow | undefined {
    const same = (a: readonly [number, number], b: readonly [number, number]): boolean =>
      a[1] - a[0] >= (b[1] - b[0]) * (1 - 1e-9);
    return same(window.x, home.x) && (window.y === undefined || same(window.y, home.y!)) ? undefined : window;
  }

  /** Redraw at the window, once per frame however many wheel ticks or pointer moves came. */
  #show(window: PlotWindow | undefined): void {
    this.#window = window;
    if (this.#pending) return;
    // A frame, or the timer where the page is hidden and frames are paused.
    const run = (): void => {
      if (!this.#pending) return;
      this.#pending = false;
      cancelAnimationFrame(this.#frameRequest);
      clearTimeout(this.#timer);
      this.#redo?.(this.#window);
    };
    this.#pending = true;
    this.#frameRequest = requestAnimationFrame(run);
    this.#timer = setTimeout(run, FRAME_FALLBACK_MS);
  }

  /** A wheel's travel in px: lines and pages (`deltaMode`) are scaled to pixels. */
  #wheelPixels(e: WheelEvent): number {
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * LINE_PIXELS;
    if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * (this.host.clientHeight || DEFAULT_PIXELS);
    return e.deltaY;
  }

  #onWheel = (e: WheelEvent): void => {
    if (!this.#zoomable || !wheelZooms(e, e.currentTarget as Element, gestureHandlingOf(this.host.gestureHandling)))
      return;
    const at = this.#inView(e);
    const frame = this.#geometry;
    if (!at || !frame) return;
    e.preventDefault();
    const [ax, ay] = frame.toData(at[0], at[1]);
    this.#show(this.#zoomed([ax, ay], Math.exp(this.#wheelPixels(e) * WHEEL_RATE)));
  };

  #onPointerDown = (e: PointerEvent): void => {
    if (!this.#zoomable || this.#window === undefined || e.button !== 0 || e.pointerType === "touch") return;
    const at = this.#inView(e);
    if (!at) return;
    const frame = this.#geometry;
    if (!frame) return;
    this.#drag = { x: at[0], y: at[1], id: e.pointerId, moved: false, window: this.#window, frame };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  #onPointerUp = (e: PointerEvent): void => {
    if (this.#drag?.id === e.pointerId) this.#drag = undefined;
  };

  /** Pan: the data under the pointer stays under it. */
  #dragTo(e: PointerEvent): boolean {
    const drag = this.#drag;
    const home = this.#home;
    const at = this.#inView(e);
    if (!drag || !home || !at) return false;
    drag.moved ||= Math.hypot(at[0] - drag.x, at[1] - drag.y) > SLOP;
    if (!drag.moved) return true;
    // The whole drag so far, on the window and geometry it began on: the plot redraws between
    // moves, so the live frame is not the one the pointer is moving across.
    const [x0, y0] = drag.frame.toData(drag.x, drag.y);
    const [x1, y1] = drag.frame.toData(at[0], at[1]);
    const start = drag.window;
    this.#show({
      x: slideInterval(start.x, home.x, x0 - x1),
      ...(start.y && home.y && this.#fitsY && { y: slideInterval(start.y, home.y, y0 - y1) }),
    });
    return true;
  }

  #onDoubleClick = (): void => {
    if (this.#window !== undefined) this.#show(undefined);
  };

  /** `0` returns a zoomed plot to its whole range, as a double-click does. */
  #onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== "0" || this.#window === undefined) return;
    e.preventDefault();
    this.#show(undefined);
  };

  #onPointerMove = (e: PointerEvent): void => {
    if (this.#dragTo(e)) return;
    if (this.#polar || this.#field || this.#diagram || this.#charted) return;
    const svg = this.#liveSvg();
    if (!svg) return;
    // Map the pointer into viewBox units; the SVG scales to fit its box.
    const rect = svg.getBoundingClientRect();
    const [, , vw] = (svg.getAttribute("viewBox") ?? "0 0 340 200").split(" ").map(Number);
    this.#hover = this.#xAt(((e.clientX - rect.left) / (rect.width || 1)) * vw!);
    this.#draw();
  };

  #onPointerLeave = (): void => {
    if (this.#hover === undefined) return;
    this.#hover = undefined;
    this.#draw();
  };

  render(): unknown {
    return html`<span
      class="graphics-box-plot"
      tabindex=${this.#zoomable ? "0" : nothing}
      style=${this.#window === undefined ? nothing : "cursor:grab"}
      @keydown=${this.#onKeyDown}
      @pointermove=${this.#onPointerMove}
      @pointerleave=${this.#onPointerLeave}
      @pointerdown=${this.#onPointerDown}
      @pointerup=${this.#onPointerUp}
      @pointercancel=${this.#onPointerUp}
      @lostpointercapture=${this.#onPointerUp}
      @wheel=${this.#onWheel}
      @dblclick=${this.#onDoubleClick}
      >${this.#shader ? this.#canvas : nothing}${unsafeHTML(this.#svg)}</span
    >`;
  }
}
