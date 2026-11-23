// A complex function drawn by its parts: two curves, a curve colored by argument, two families of contours.

import { type BoxNode, optionsOfBox } from "@notatio/boxes";
import { expect, test } from "vite-plus/test";
import { complexFunction } from "../src/complex-eval.ts";
import { argColor, complexContourBoxOf, complexPartSeries } from "../src/complex-parts.ts";
import { plotSettingsOf } from "../src/symbols.ts";

const at = (...parts: unknown[]): unknown[] => ["Tuple", ...parts];
const square = complexFunction(["Power", "z", 2], "z")!;
const root = complexFunction(["Sqrt", "x"], "x")!;

test("ReImPlot's settings fix its parts, and its series are the real and the imaginary part", () => {
  const settings = plotSettingsOf(["ReImPlot", ["Sqrt", "x"], at("x", -4, 4)] as never)!;
  expect(settings).toMatchObject({ parts: "reim", var: "x", domain: "-4,4", legend: "true" });
  const [re, im] = complexPartSeries("reim", root, settings);
  expect([re!.label, im!.label]).toEqual(["Re", "Im"]);
  const near = (points: readonly { x: number; y: number }[], x: number): number =>
    points.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best)).y;
  // Real to the right of 0, imaginary to the left.
  expect(near(re!.points, 4)).toBeCloseTo(2);
  expect(near(im!.points, 4)).toBeCloseTo(0);
  expect(near(re!.points, -4)).toBeCloseTo(0);
  expect(near(im!.points, -4)).toBeCloseTo(2);
});

test("AbsArgPlot is the modulus, each point colored by the argument", () => {
  const settings = plotSettingsOf(["AbsArgPlot", ["Sqrt", "x"], at("x", -4, 4)] as never)!;
  const [abs] = complexPartSeries("absarg", root, settings);
  const left = abs!.points.find((p) => p.x < -1)!;
  const right = abs!.points.find((p) => p.x > 1)!;
  expect(left.y).toBeCloseTo(Math.sqrt(-left.x));
  // Arg 0 is red; arg π/2 a quarter turn round the wheel.
  expect(right.color).toBe(argColor([1, 0]));
  expect(left.color).toBe(argColor([0, 1]));
  expect(argColor([Number.NaN, 0])).toBeUndefined();
});

test("a zoomed parts plot samples its window", () => {
  const settings = plotSettingsOf(["ReImPlot", ["Sqrt", "x"], at("x", -4, 4)] as never)!;
  const [re] = complexPartSeries("reim", root, settings, { x: [1, 2] }, 200);
  expect(Math.min(...re!.points.map((p) => p.x))).toBeGreaterThanOrEqual(1 - 1e-9);
  expect(Math.max(...re!.points.map((p) => p.x))).toBeLessThanOrEqual(2 + 1e-9);
});

test("ComplexContourPlot draws both parts' levels over its rectangle, and a window keeps them", () => {
  const settings = plotSettingsOf([
    "ComplexContourPlot",
    ["Power", "z", 2],
    at("z", ["Complex", -2, -2], ["Complex", 2, 2]),
  ] as never)!;
  expect(settings).toMatchObject({ parts: "contours", var: "z", xrange: "-2,2", yrange: "-2,2" });
  const whole = complexContourBoxOf(square, settings);
  expect(optionsOfBox(whole.box as BoxNode).PlotRange).toEqual([
    [-2, 2],
    [-2, 2],
  ]);
  // z² has real part x² − y² and imaginary part 2xy: both families are there.
  expect(whole.levels.re.length).toBeGreaterThan(2);
  expect(whole.levels.im.length).toBeGreaterThan(2);
  const marks = (whole.box as BoxNode)[1] as BoxNode[];
  expect(marks.length).toBe(whole.levels.re.length + whole.levels.im.length);
  const colors = new Set(marks.map((mark) => ((mark[2] as { EdgeForm: unknown[][] }).EdgeForm[0] as unknown[])[0]));
  expect(colors.size).toBe(2);
  const zoomed = complexContourBoxOf(square, { ...settings, xrange: "0,1", yrange: "0,1" }, whole.levels);
  expect(zoomed.levels).toBe(whole.levels);
  expect(((zoomed.box as BoxNode)[1] as BoxNode[]).length).toBeLessThan(marks.length);
});
