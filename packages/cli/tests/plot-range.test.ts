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
