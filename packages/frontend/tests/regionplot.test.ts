// A region plot's box: the fills in one raster, a line along each boundary (the wiki's Speculative-Plotting, §3.3).

import { type BoxNode, optionsOfBox } from "@enumeratio/boxes";
import { expect, test } from "vite-plus/test";
import { implicitPlotBox } from "../src/contour.ts";
import { coverage, maskGrid, REGION_OPACITY, regionPlotBox } from "../src/regionplot.ts";

const axis = (n: number, lo = -3, hi = 3): number[] =>
  Array.from({ length: n }, (_, k) => lo + ((hi - lo) * k) / (n - 1));
const sample = (f: (x: number, y: number) => number, n: number): { xs: number[]; ys: number[]; grid: number[][] } => {
  const xs = axis(n);
  return { xs, ys: xs, grid: xs.map((y) => xs.map((x) => f(x, y))) };
};

/** The marks of a `GraphicsBox`, each as `[role, primitive, style]`. */
const marksOf = (box: unknown): [string, BoxNode, Record<string, unknown>][] =>
  ((box as BoxNode)[1] as BoxNode[]).map((mark) => {
    const styled = mark[0] === "StyleBox";
    const tagged = (styled ? mark[1] : mark) as BoxNode;
    return [tagged[2] as string, tagged[1] as BoxNode, styled ? (mark[2] as Record<string, unknown>) : {}];
  });

/** A raster cell's alpha: 1 for a hex color, 0 for a clear cell. */
const alphaOf = (color: string): number =>
  color === "" ? 0 : color.startsWith("rgba") ? Number(/, ([\d.]+)\)$/.exec(color)![1]) : 1;

test("a cell's coverage is the share of it where the margin is positive", () => {
  expect(coverage(1, 2, 3, 4)).toBe(1);
  expect(coverage(-1, -2, -3, 0)).toBe(0);
  expect(coverage(1, Number.NaN, 1, 1)).toBe(0);
  // The margin `0.5 - u` over the unit cell: its left half.
  expect(coverage(0.5, -0.5, -0.5, 0.5)).toBe(0.5);
  // One corner in: a small share, never all or none.
  const corner = coverage(1, -3, -3, -3);
  expect(corner).toBeGreaterThan(0);
  expect(corner).toBeLessThan(0.25);
});

test("a disk fills π r² of the frame and has one boundary", () => {
  const { xs, ys, grid } = sample((x, y) => 4 - x * x - y * y, 65);
  const marks = marksOf(regionPlotBox([grid], xs, ys));
  expect(marks.map(([role, prim]) => [role, prim[0]])).toEqual([
    ["Region", "RasterBox"],
    ["Boundary", "LineBox"],
  ]);
  const cells = optionsOfBox(marks[0]![1]).Colors as string[][];
  const filled = cells.flat().reduce((sum, c) => sum + alphaOf(c) / REGION_OPACITY, 0) / cells.flat().length;
  expect(filled).toBeCloseTo((Math.PI * 4) / 36, 2);
  // Every boundary point is on the circle of radius 2, to the grid's interpolation.
  for (const [x, y] of optionsOfBox(marks[1]![1]).Points as number[][]) expect(Math.hypot(x!, y!)).toBeCloseTo(2, 2);
});

test("a region and its complement tile the frame", () => {
  const { xs, ys, grid } = sample((x, y) => y - Math.sin(x), 40);
  // A cell's alpha is printed to three places, so the two shares sum to the opacity within a rounding each.
  const shares = [grid, grid.map((r) => r.map((v) => -v))].map((g) =>
    (optionsOfBox(marksOf(regionPlotBox([g], xs, ys))[0]![1]).Colors as string[][]).flat().map(alphaOf),
  );
  shares[0]!.forEach((a, k) => expect(a + shares[1]![k]!).toBeCloseTo(REGION_OPACITY, 2));
});

test("overlapping regions mix in one raster, and each keeps its boundary", () => {
  const left = sample((x) => 1 - x, 30);
  const low = sample((_, y) => 1 - y, 30);
  const box = regionPlotBox([left.grid, low.grid], left.xs, left.ys, {
    fills: [
      { color: "#ff0000", opacity: 1 },
      { color: "#0000ff", opacity: 1 },
    ],
    mixing: "Add",
  });
  const marks = marksOf(box);
  expect(marks.map(([role]) => role)).toEqual(["Region", "Boundary", "Boundary"]);
  const cells = optionsOfBox(marks[0]![1]).Colors as string[][];
  // Row 0 is the least y, column 0 the least x: both regions hold there, neither at the far corner.
  expect(cells[0]![0]).toBe("#ff00ff");
  expect(cells.at(-1)![0]).toBe("#ff0000");
  expect(cells[0]!.at(-1)).toBe("#0000ff");
  expect(cells.at(-1)!.at(-1)).toBe("");
});

test("BoundaryStyle -> None draws no boundary, and a color draws every one in it", () => {
  const { xs, ys, grid } = sample((x, y) => 4 - x * x - y * y, 30);
  expect(marksOf(regionPlotBox([grid], xs, ys, { boundary: null })).map(([role]) => role)).toEqual(["Region"]);
  const [, , look] = marksOf(regionPlotBox([grid], xs, ys, { boundary: "#123456" }))[1]!;
  expect((look["EdgeForm"] as unknown[][])[0]![0]).toBe("#123456");
});

test("a region nowhere in the frame is an empty raster and no boundary", () => {
  const { xs, ys, grid } = sample(() => -1, 10);
  const marks = marksOf(regionPlotBox([grid], xs, ys));
  expect(marks.map(([role]) => role)).toEqual(["Region"]);
  expect((optionsOfBox(marks[0]![1]).Colors as string[][]).flat().every((c) => c === "")).toBe(true);
});

test("a masked grid keeps its values inside the region only", () => {
  expect(
    maskGrid(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [1, -1],
        [0, Number.NaN],
      ],
    ),
  ).toEqual([
    [1, Number.NaN],
    [Number.NaN, Number.NaN],
  ]);
});

test("an implicit curve is its function's zero contour, a line for each equation", () => {
  const circle = sample((x, y) => x * x + y * y - 4, 81);
  const diagonal = sample((x, y) => x - y, 81);
  const marks = marksOf(implicitPlotBox([circle.grid, diagonal.grid], circle.xs, circle.ys));
  expect(marks.map(([role, prim]) => [role, prim[0]])).toEqual([
    ["Series", "LineBox"],
    ["Series", "LineBox"],
  ]);
  for (const [x, y] of optionsOfBox(marks[0]![1]).Points as number[][]) expect(Math.hypot(x!, y!)).toBeCloseTo(2, 2);
  for (const [x, y] of optionsOfBox(marks[1]![1]).Points as number[][]) expect(x).toBeCloseTo(y!, 9);
  // The two curves are told apart by color.
  expect(marks[0]![2]["EdgeForm"]).not.toEqual(marks[1]![2]["EdgeForm"]);
});
