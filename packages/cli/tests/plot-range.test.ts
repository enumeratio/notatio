import { optionsOfBox, type BoxNode } from "@notatio/boxes";
import { expect, test } from "vite-plus/test";
import { Session } from "../src/engine.ts";
import { sampledFigure } from "../src/textual.ts";

const session = new Session();
const yRangeOf = (input: string): number[] => {
  const box = sampledFigure(session, session.evaluate(input).expr.json as never);
  return (optionsOfBox(box as BoxNode).PlotRange as number[][])[1]!;
};

test("an explicit PlotRange is the terminal plot's y window; without one it is the data extent", () => {
  expect(yRangeOf("Plot(3 * Sin(x), (x, -6, 6), PlotRange -> (-1, 1))")).toEqual([-1, 1]);
  const [lo, hi] = yRangeOf("Plot(3 * Sin(x), (x, -6, 6))");
  expect(hi).toBeCloseTo(3, 1);
  expect(lo).toBeCloseTo(-3, 1);
});

test("PlotRange in braces is the same y window as in brackets; a collapsed pair is no window", () => {
  const bracket = yRangeOf("Plot(3 * Sin(x), (x, -6, 6), PlotRange -> [-1, 1])");
  expect(bracket).toEqual([-1, 1]);
  expect(yRangeOf("Plot(3 * Sin(x), (x, -6, 6), PlotRange -> {-1, 1})")).toEqual(bracket);
  expect(yRangeOf("Plot(3 * Sin(x), (x, -6, 6), PlotRange -> {{-6, 6}, {1, -1}})")).toEqual(bracket);
  const automatic = yRangeOf("Plot(3 * Sin(x), (x, -6, 6))");
  expect(yRangeOf("Plot(3 * Sin(x), (x, -6, 6), PlotRange -> [1, 1])")).toEqual(automatic);
  expect(yRangeOf("Plot(3 * Sin(x), (x, -6, 6), PlotRange -> {1, 1})")).toEqual(automatic);
});
