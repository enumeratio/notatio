// A contour, density, vector or stream plot defaults to AspectRatio 1, as in Wolfram: its plot area is
// as tall as it is wide, so concentric circles are circles (E#8).

import { expect, test } from "vite-plus/test";
import { contourSvg } from "../src/contour.ts";
import { densitySvg } from "../src/densityplot.ts";
import { plotArea } from "../src/plot-box.ts";
import { vectorPlotBox } from "../src/vectorplot.ts";
import { renderPlot } from "../src/plot-box.ts";
import type { BoxNode } from "@enumeratio/boxes";

const radial = (n: number) => {
  const axis = Array.from({ length: n }, (_, k) => -3 + (6 * k) / (n - 1));
  return { xs: axis, ys: axis, grid: axis.map((y) => axis.map((x) => x * x + y * y)) };
};

/** The size of the SVG's `viewBox`. */
const viewBoxOf = (svg: string): [number, number] => {
  const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg)!;
  return [Number(w), Number(h)];
};

for (const [name, draw] of [
  ["a contour plot", (g: ReturnType<typeof radial>) => contourSvg(g.grid, g.xs, g.ys, {})],
  ["a density plot", (g: ReturnType<typeof radial>) => densitySvg(g.grid, g.xs, g.ys, {})],
  [
    "a density plot with a color bar",
    (g: ReturnType<typeof radial>) => densitySvg(g.grid, g.xs, g.ys, { legend: true }),
  ],
  ["a titled contour plot", (g: ReturnType<typeof radial>) => contourSvg(g.grid, g.xs, g.ys, { title: "circles" })],
] as const) {
  test(`${name} has a square plot area by default`, () => {
    const [w, h] = viewBoxOf(draw(radial(20)));
    const titled = name.includes("titled");
    const bar = name.includes("color bar");
    const { plotW, plotH } = plotArea(w - (bar ? 34 : 0), h, titled);
    expect(plotH).toBe(plotW);
  });
}

test("a vector plot and a stream plot have a square plot area by default", () => {
  const field = (x: number, y: number): [number, number] => [-y, x];
  for (const type of ["vector", "stream"] as const) {
    const box = vectorPlotBox(field, -3, 3, -3, 3, { type });
    const [w, h] = viewBoxOf(renderPlot(box as BoxNode).svg);
    const { plotW, plotH } = plotArea(w, h, false);
    expect(plotH).toBe(plotW);
  }
});

test("an explicit height stands", () => {
  const [, h] = viewBoxOf(contourSvg(radial(20).grid, radial(20).xs, radial(20).ys, { height: 200 }));
  expect(h).toBe(200);
});
