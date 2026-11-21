// `Graphics(primitives, options)`: primitives in a frame of their own, and the frame's options a
// plot reads the same way.

import { type BoxNode, optionsOfBox } from "@notatio/boxes";
import { expect, test } from "vite-plus/test";
import { colorOf } from "../src/graphics-rules.ts";
import { plotBox } from "../src/plot-box.ts";
import { graphicsBoxOfSettings, plotOptionsOf } from "../src/plot-lowering.ts";
import { primitivesOf } from "../src/primitives.ts";
import { plotSettingsOf } from "../src/symbols.ts";

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
