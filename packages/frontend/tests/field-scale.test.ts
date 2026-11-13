// A zoomed field plot keeps the whole plot's scale: its levels and its colors are fitted once, to the
// whole plot's samples, and a window resampled inside it is drawn with them.

import { type BoxNode, optionsOfBox } from "@enumeratio/boxes";
import { expect, test } from "vite-plus/test";
import { autoLevels } from "../src/contour.ts";
import { fieldAxes, fieldBoxOfGrids, fieldScaleOf } from "../src/plot-lowering.ts";

const sampled = (settings: Record<string, string>, head: string): { xs: number[]; ys: number[]; grid: number[][] } => {
  const { xs, ys } = fieldAxes(head, settings);
  return { xs, ys, grid: ys.map((y) => xs.map((x) => x * x + y * y)) };
};

const marksOf = (box: unknown): BoxNode[] => (box as BoxNode)[1] as BoxNode[];

test("a contour plot's automatic levels are written out, and a window inside it draws only those it holds", () => {
  const settings = { xrange: "-3,3", yrange: "-3,3" };
  const whole = sampled(settings, "ContourPlot");
  const scaled = fieldScaleOf("ContourPlot", settings, whole.grid);
  const levels = JSON.parse(scaled["contours"]!) as number[];
  expect(levels.length).toBeGreaterThan(2);
  expect(marksOf(fieldBoxOfGrids("ContourPlot", scaled, [whole.grid], whole.xs, whole.ys))).toHaveLength(levels.length);

  // x² + y² stays under 4.5 on [-1.5, 1.5]²: only the levels under 4.5 cross the window.
  const window = { ...scaled, xrange: "-1.5,1.5", yrange: "-1.5,1.5" };
  const inner = sampled(window, "ContourPlot");
  expect(marksOf(fieldBoxOfGrids("ContourPlot", window, [inner.grid], inner.xs, inner.ys))).toHaveLength(
    levels.filter((level) => level < 4.5).length,
  );
  // Refitted to the window, it would draw a full set of levels again.
  const refit = { ...settings, xrange: "-1.5,1.5", yrange: "-1.5,1.5" };
  expect(marksOf(fieldBoxOfGrids("ContourPlot", refit, [inner.grid], inner.xs, inner.ys)).length).toBeGreaterThan(
    levels.filter((level) => level < 4.5).length,
  );
});

test("levels and a value range the plot states are kept as stated", () => {
  const grid = sampled({}, "ContourPlot").grid;
  const listed = { contours: "[1,2,4]" };
  expect(fieldScaleOf("ContourPlot", listed, grid)).toBe(listed);
  const ranged = { zrange: "0,30" };
  expect(fieldScaleOf("DensityPlot", ranged, grid)).toBe(ranged);
  // A count is a number of levels to fit, so it is fitted once too.
  const values = grid.flat();
  expect(JSON.parse(fieldScaleOf("ContourPlot", { contours: "4" }, grid)["contours"]!)).toEqual(
    autoLevels(Math.min(...values), Math.max(...values), 4),
  );
});

test("a density plot's colors span the whole plot's values, in a window too", () => {
  const settings = { xrange: "-3,3", yrange: "-3,3" };
  const whole = sampled(settings, "DensityPlot");
  const scaled = fieldScaleOf("DensityPlot", settings, whole.grid);
  expect(scaled["zrange"]!.split(",").map(Number)).toEqual([Math.min(...whole.grid.flat()), 18]);
  const window = { ...scaled, xrange: "-1,1", yrange: "-1,1" };
  const inner = sampled(window, "DensityPlot");
  const colorsOf = (s: Record<string, string>): string[] =>
    (
      optionsOfBox(marksOf(fieldBoxOfGrids("DensityPlot", s, [inner.grid], inner.xs, inner.ys))[0]![1] as BoxNode)
        .Colors as string[][]
    ).flat();
  // Held to the whole plot's range, the window's small values share the low end of the gradient;
  // refitted, they would spread across all of it.
  const distinct = (colors: string[]): number => new Set(colors).size;
  expect(distinct(colorsOf(window))).toBeLessThan(distinct(colorsOf({ ...settings, xrange: "-1,1", yrange: "-1,1" })));
});

test("a region plot has no scale to hold", () => {
  const settings = { field: "regions" };
  expect(fieldScaleOf("RegionPlot", settings, [[1, -1]])).toBe(settings);
});
