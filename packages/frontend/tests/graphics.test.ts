// `Graphics(primitives, options)`: primitives in a frame of their own, and the frame's options a
// plot reads the same way.

import { type BoxNode, optionsOfBox } from "@notatio/boxes";
import { GRAPHICS_HEADS } from "@notatio/formats";
import { declaredOptions } from "@notatio/formats/graphics-options";
import { expect, test } from "vite-plus/test";
import { colorOf } from "../src/graphics-rules.ts";
import { plotBox } from "../src/plot-box.ts";
import {
  graphicsBoxOfSettings,
  holdsPlaneShow,
  layerStylesOf,
  planeShowBox,
  planeShowPlan,
  plotDataSeries,
  plotOptionsOf,
} from "../src/plot-lowering.ts";
import type { CompiledPlot } from "../src/plot-compile.ts";
import {
  curvesOf,
  DEFAULT_DOMAIN,
  figurePlanOf,
  loadCompiled,
  type LoadedPlot,
  lonePlotOf,
} from "../src/plot-sample.ts";
import { primitivesOf } from "../src/primitives.ts";
import {
  DRAWING_SYMBOLS,
  GRAPHICS_3D_SETTINGS,
  PLOT_SETTINGS,
  planeShowOf,
  plotOfText,
  plotSettingsOf,
} from "../src/symbols.ts";

const at = (x: unknown, y: unknown): unknown[] => ["Tuple", x, y];
const rule = (name: string, value: unknown): unknown[] => ["Rule", name, value];
const boxOf = (...args: unknown[]): BoxNode =>
  graphicsBoxOfSettings(plotSettingsOf(["Graphics", ...args] as never)!) as BoxNode;
const marksOf = (box: BoxNode): { look: Record<string, unknown>; prim: BoxNode }[] =>
  (box[1] as BoxNode[]).map((mark) => ({
    look: mark[2] as Record<string, unknown>,
    prim: (mark[1] as BoxNode)[1] as BoxNode,
  }));

test("a Graphics is its primitives in their own extent, with no axes and true scale", () => {
  const box = boxOf(["List", "Red", ["Disk", at(0, 0), 1], ["Line", ["List", at(0, 0), at(3, 0)]]]);
  const o = optionsOfBox(box);
  expect(o.Axes).toBe(false);
  const [[x0, x1], [y0, y1]] = o.PlotRange as [[number, number], [number, number]];
  // The disk and the line reach from -1 to 3 across and -1 to 1 up, padded.
  expect(x0).toBeLessThan(-1);
  expect(x1).toBeGreaterThan(3);
  expect(y1 - y0).toBeCloseTo((x1 - x0) / 2, 5);
  // One unit of x is as long as one of y.
  const [width, height] = o.ImageSize as [number, number];
  expect(height).toBeLessThan(width);
  expect(marksOf(box).map((m) => m.prim[0])).toEqual(["PolygonBox", "LineBox"]);
  expect(marksOf(box)[0]!.look).toMatchObject({ FaceForm: colorOf("Red"), Opacity: 1 });
});

test("the frame's options: Axes, Frame, PlotRange, PlotLabel", () => {
  const box = boxOf(
    ["Circle"],
    rule("Axes", "True"),
    rule("Frame", "True"),
    rule("PlotRange", at(at(-2, 2), at(-1, 1))),
    rule("PlotLabel", "'unit circle'"),
  );
  expect(optionsOfBox(box)).toMatchObject({
    Axes: true,
    Frame: true,
    PlotRange: [
      [-2, 2],
      [-1, 1],
    ],
    PlotLabel: "unit circle",
  });
});

test("a zoomed Graphics keeps the whole figure's shape", () => {
  const settings = plotSettingsOf(["Graphics", ["Disk"]] as never)!;
  const whole = optionsOfBox(graphicsBoxOfSettings(settings) as BoxNode);
  const zoomed = optionsOfBox(graphicsBoxOfSettings(settings, { x: [0, 0.5], y: [0, 0.25] }) as BoxNode);
  expect(zoomed.ImageSize).toEqual(whole.ImageSize);
  expect(zoomed.PlotRange).toEqual([
    [0, 0.5],
    [0, 0.25],
  ]);
});

test("arcs, sectors and ellipses are outlines; numbers may be written with Pi", () => {
  const [arc, sector, ellipse] = primitivesOf([
    "List",
    ["Circle", at(0, 0), 1, at(0, ["Divide", "Pi", 2])],
    ["Disk", at(0, 0), 2, at(0, "Pi")],
    ["Circle", at(0, 0), at(2, 1)],
  ] as never);
  expect(arc!.kind).toBe("line");
  const end = (arc as unknown as { points: number[][] }).points.at(-1)!;
  expect(end[0]).toBeCloseTo(0);
  expect(end[1]).toBeCloseTo(1);
  // A sector closes through its center.
  expect(sector!.kind).toBe("polygon");
  expect((sector as unknown as { points: number[][] }).points[0]).toEqual([0, 0]);
  expect(ellipse!.kind).toBe("line");
  expect(Math.max(...(ellipse as unknown as { points: number[][] }).points.map((q) => q[0]!))).toBeCloseTo(2);
});

test("a Line of several paths is a line each, and a GraphicsComplex names its points by index", () => {
  const lines = primitivesOf(["Line", ["List", ["List", at(0, 0), at(1, 0)], ["List", at(0, 1), at(1, 1)]]] as never);
  expect(lines).toHaveLength(2);
  const [triangle] = primitivesOf([
    "GraphicsComplex",
    ["List", at(0, 0), at(1, 0), at(0, 1)],
    ["Polygon", ["List", 1, 2, 3]],
  ] as never);
  expect((triangle as unknown as { points: number[][] }).points).toEqual([
    [0, 0],
    [1, 0],
    [0, 1],
  ]);
});

test("Translate, Rotate and Scale move the geometry they hold, and keep its look", () => {
  const [moved] = primitivesOf(["Translate", ["Point", at(1, 0)], at(2, 3)] as never);
  expect((moved as unknown as { points: number[][] }).points).toEqual([[3, 3]]);
  const [turned] = primitivesOf(["List", "Red", ["Rotate", ["Point", at(1, 0)], ["Divide", "Pi", 2]]] as never);
  const [x, y] = (turned as unknown as { points: number[][] }).points[0]!;
  expect(x).toBeCloseTo(0);
  expect(y).toBeCloseTo(1);
  expect(turned!.look).toEqual({ color: colorOf("Red") });
  // A circle scaled unevenly is no longer one.
  const [oval] = primitivesOf(["Scale", ["Circle"], at(2, 1)] as never);
  expect(oval!.kind).toBe("line");
});

test("curves are sampled through their control points' ends", () => {
  const control = ["List", at(0, 0), at(1, 2), at(2, -2), at(3, 0)];
  for (const head of ["BezierCurve", "BSplineCurve"]) {
    const [curve] = primitivesOf([head, control] as never);
    const points = (curve as unknown as { points: number[][] }).points;
    expect(points.length).toBeGreaterThan(8);
    expect(points[0]).toEqual([0, 0]);
    expect(points.at(-1)![0]).toBeCloseTo(3);
    expect(points.at(-1)![1]).toBeCloseTo(0);
  }
});

test("Axes -> False reaches a plot, and PlotStyle styles its curves in turn", () => {
  const settings = plotSettingsOf([
    "Plot",
    ["List", ["Sin", "x"], ["Cos", "x"]],
    at("x", 0),
    rule("Axes", "False"),
    rule("Frame", "True"),
    rule("PlotStyle", ["List", "Red", ["Directive", "Blue", "Dashed", ["AbsoluteThickness", 3]]]),
  ] as never)!;
  const options = plotOptionsOf(settings);
  expect(options.axes).toBe(false);
  expect(options.frame).toBe(true);
  const curve = (k: number) => [0, 1, 2].map((x) => ({ x, y: x * (k + 1) }));
  const box = plotBox([{ points: curve(0) }, { points: curve(1) }, { points: curve(2) }], options) as BoxNode;
  expect(optionsOfBox(box)).toMatchObject({ Axes: false, Frame: true });
  const strokes = marksOf(box).map((m) => (m.look["EdgeForm"] as unknown[][])[0]);
  expect(strokes[0]).toEqual([colorOf("Red"), 2, 1, []]);
  expect(strokes[1]).toEqual([colorOf("Blue"), 3, 1, [6, 4]]);
  // The styles are cycled.
  expect(strokes[2]![0]).toBe(colorOf("Red"));
});

test("a Show of plots and graphics is of the plane: its layers' settings, and its own frame over them", () => {
  const show = planeShowOf([
    "Show",
    ["Plot", ["Sin", "x"], at("x", 0), rule("PlotStyle", "Red")],
    ["Graphics", ["List", "Blue", ["Point", at(1, 1)]]],
    ["ListPlot", ["List", 1, 2, 3]],
    rule("Frame", "True"),
    rule("PlotRange", at(-2, 2)),
  ] as never)!;
  expect(show.layers.map((layer) => layer.head)).toEqual(["Plot", "Graphics", "ListPlot"]);
  expect(show.frame).toEqual({ frame: "true", "plot-range": "-2,2" });
  expect(holdsPlaneShow("Show(Plot(Sin(x), (x, 0, 6)), Graphics(Point((1, 1))))")).toBe(true);
  // The element's own reading of its text finds the same layers, as the page prints them.
  const text =
    "Show(\n  Plot([Sin(x), Cos(x)], (x, 0, 6.283), PlotStyle -> [Red, Blue],),\n  Graphics(Point((1, 1))),\n  Frame -> True,\n)";
  expect(holdsPlaneShow(text)).toBe(true);
  expect(planeShowOf(plotOfText(text)!.json)!.layers.map((layer) => layer.head)).toEqual(["Plot", "Graphics"]);
  expect(plotOfText("Show(LatticeTiles(GaussianIntegers))")).toBeUndefined();
  // A figure's layers are not the plane's: that `Show` is drawn as before.
  expect(planeShowOf(["Show", ["LatticeTiles", "GaussianIntegers"]] as never)).toBeUndefined();
  expect(holdsPlaneShow("Show(LatticeTiles(GaussianIntegers))")).toBe(false);
});

test("each layer's PlotStyle is cycled over its own curves", () => {
  const looks = layerStylesOf([
    { style: '["List","Red","Blue"]', count: 3 },
    { style: undefined, count: 1 },
    { style: '"Thick"', count: 1 },
  ]);
  expect(looks.map((look) => look.color)).toEqual([
    colorOf("Red"),
    colorOf("Blue"),
    colorOf("Red"),
    undefined,
    undefined,
  ]);
  expect(looks[4]).toEqual({ thickness: { px: 2.5 } });
});

test("every option a head's lowering reads is one its record declares", () => {
  const undeclared: string[] = [];
  // The heads formats declares: a library's head (`TestResultObject`) declares its options in its own records.
  const ours = [...DRAWING_SYMBOLS, ...PLOT_SETTINGS, ...GRAPHICS_3D_SETTINGS].filter((symbol) =>
    GRAPHICS_HEADS.includes(symbol.head),
  );
  for (const symbol of ours)
    for (const name of Object.keys(symbol.options ?? {}))
      if (!declaredOptions(symbol.head).has(name)) undeclared.push(`${symbol.head}: ${name}`);
  expect([...new Set(undeclared)]).toEqual([]);
});

test("Ticks, AxesOrigin, GridLines by direction and PlotRangePadding reach the box", () => {
  const box = boxOf(
    ["Circle", at(1, 1), 1],
    rule("Axes", "True"),
    rule("AxesOrigin", at(1, 1)),
    rule("Ticks", "None"),
    rule("GridLines", ["List", ["List", 0, 1, 2], "Automatic"]),
    rule("PlotRangePadding", 0.5),
  );
  const o = optionsOfBox(box);
  expect(o).toMatchObject({ AxesOrigin: [1, 1], Ticks: false, GridLines: [[0, 1, 2], "Automatic"] });
  // Half the extent again on each side of the circle's [0, 2].
  expect((o.PlotRange as number[][])[0]).toEqual([-1, 3]);
  const plot = plotOptionsOf(
    plotSettingsOf([
      "Plot",
      ["Sin", "x"],
      at("x", 0),
      rule("GridLines", "Automatic"),
      rule("PlotRangePadding", "None"),
    ] as never)!,
  );
  expect(plot).toMatchObject({ gridLines: true, padding: 0 });
  expect(plot.gridAt).toBeUndefined();
});

test("a Show's plan: series in layer order with their styles, graphics under or over by position", () => {
  const show = planeShowOf([
    "Show",
    ["Graphics", ["Disk"]],
    ["ListLinePlot", ["List", 1, 2, 3], rule("PlotStyle", "Red")],
    ["Graphics", ["Point", at(1, 1)]],
    ["ListPlot", ["List", 3, 2, 1]],
    rule("Frame", "True"),
  ] as never)!;
  const plan = planeShowPlan(show, (layer) => plotDataSeries(layer.settings));
  if (plan === undefined || "graphics" in plan) throw new Error("a plan of plots");
  expect(plan.series).toHaveLength(2);
  expect(plan.styles).toEqual([{ color: colorOf("Red") }, {}]);
  expect([plan.marks.prolog.length, plan.marks.epilog.length]).toEqual([1, 1]);
  expect(plan.settings["frame"]).toBe("true");
  const box = planeShowBox(show, (layer) => plotDataSeries(layer.settings)) as BoxNode;
  expect(marksOf(box).map((m) => m.prim[0])).toEqual(["PolygonBox", "LineBox", "PointBox", "PointBox"]);
  // Graphics alone is one Graphics; a plot with no series leaves the Show undrawn.
  const alone = planeShowPlan(
    planeShowOf(["Show", ["Graphics", ["Disk"]], ["Graphics", ["Circle"]]] as never)!,
    () => [],
  );
  expect(alone && "graphics" in alone).toBe(true);
  expect(planeShowBox(show, () => undefined)).toBeUndefined();
});

test("one sampler: a plot's figure from compiled code, whole and zoomed, and a name with no value", () => {
  const compiled = (code: string, unknowns: string[]): CompiledPlot => ({
    unknowns,
    list: false,
    items: [{ json: null, label: "f", code }],
  });
  const settings = plotSettingsOf(["Plot", ["Sin", "x"], at("x", 0), rule("Frame", "True")] as never)!;
  const plan = figurePlanOf(lonePlotOf("Plot", settings)!);
  expect(plan.sources).toHaveLength(1);
  const sine = loadCompiled(compiled("Math.sin(_.x)", ["x"]));
  const whole = optionsOfBox(plan.draw([sine]) as BoxNode);
  expect(whole.Frame).toBe(true);
  // No range given: the page's default, on every host.
  expect((whole.PlotRange as number[][])[0]![0]).toBeCloseTo(DEFAULT_DOMAIN[0]);
  const zoomed = optionsOfBox(plan.draw([sine], { window: { x: [0, 1], y: [0, 1] } }) as BoxNode);
  expect(zoomed.PlotRange).toEqual([
    [0, 1],
    [0, 1],
  ]);
  // A wildcard is the view's; a free name that is neither the variable nor bound is reported.
  const scaled = loadCompiled(compiled("_._a * _.x", ["_a", "x"]));
  expect(curvesOf(settings, scaled, { _a: 2 })).toHaveProperty("series");
  const stray = loadCompiled(compiled("_.k * _.x", ["k", "x"]));
  expect(plan.draw([stray])).toEqual({ unbound: ["k"] });
  // An item with no code takes the host's fallback, or has no value.
  const bare: CompiledPlot = { unknowns: ["x"], list: false, items: [{ json: null, label: "g" }] };
  expect(loadCompiled(bare).samplers[0]!({ x: 1 })).toBeNaN();
  expect(loadCompiled(bare, { evaluate: () => () => 7 }).samplers[0]!({ x: 1 })).toBe(7);
});

test("one sampler: a Show's plots are its sources, in layer order, and data needs none", () => {
  const show = planeShowOf([
    "Show",
    ["ListPlot", ["List", 1, 2, 3]],
    ["Plot", ["Sin", "x"], at("x", 0)],
    ["Graphics", ["Point", at(1, 1)]],
    ["Plot", ["Cos", "x"], at("x", 0)],
  ] as never)!;
  const plan = figurePlanOf(show);
  expect(plan.sources).toHaveLength(2);
  const load = (code: string): LoadedPlot =>
    loadCompiled({ unknowns: ["x"], list: false, items: [{ json: null, label: "f", code }] });
  const box = plan.draw([load("Math.sin(_.x)"), load("Math.cos(_.x)")]) as BoxNode;
  expect(marksOf(box).map((m) => m.prim[0])).toEqual(["PointBox", "LineBox", "LineBox", "PointBox"]);
});
