// `ListPlot3D` of data: a grid of heights, or scattered triples binned onto an N x N grid (E#12).

import { expect, test } from "vite-plus/test";
import { listBoxOfSettings } from "../src/graphics-3d-lowering.ts";
import { graphics3dOfText } from "../src/symbols.ts";

/** The mesh's quads, and its PlotRange along x and y. */
function meshOf(text: string): { quads: number; x: number[]; y: number[] } {
  const box = listBoxOfSettings(graphics3dOfText(text)!.settings) as unknown as [
    string,
    [[string, unknown, [[string, { Indices: unknown[] }]]]],
    { PlotRange: number[][] },
  ];
  const { PlotRange } = box[2];
  return { quads: box[1][0][2][0][1].Indices.length, x: PlotRange[0]!, y: PlotRange[1]! };
}

const SCATTERED =
  "ListPlot3D([[0, 0, 1], [1, 0, 2], [2, 0, 1], [0, 1, 2], [1, 1, 4], [2, 1, 2], [0, 2, 1], [1, 2, 2], [2, 2, 1], [0.4, 0.4, 1.5], [1.6, 1.4, 3]], N -> 3)";

test("eleven triples are scattered points: a 3 x 3 grid of 4 quads, axes 0 to 2", () => {
  expect(meshOf(SCATTERED)).toEqual({ quads: 4, x: [0, 2], y: [0, 2] });
});

test("a 3 x 3 array is a small grid of heights", () => {
  expect(meshOf("ListPlot3D([[1, 2, 1], [2, 4, 2], [1, 2, 1]])")).toEqual({ quads: 4, x: [0, 2], y: [0, 2] });
});

test("a grid of heights with four columns stays a grid", () => {
  expect(meshOf("ListPlot3D([[1, 2, 1, 0], [2, 4, 2, 1]])")).toEqual({ quads: 3, x: [0, 3], y: [0, 1] });
});
