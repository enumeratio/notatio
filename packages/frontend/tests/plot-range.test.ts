// A plot's explicit range reaches its `domain` setting as plain numbers, whatever way it is written.

import { expect, test } from "vite-plus/test";
import { graphics3dOfText, plotOfText } from "../src/symbols.ts";

const domainOf = (text: string): string | undefined => plotOfText(text)?.settings["domain"];

test("a range with a long decimal is not written with digit separators", () => {
  expect(domainOf("Plot(Sin(_k * x), (x, -3.1416, 3.1416), GridLines -> True)")).toBe("-3.1416,3.1416");
  expect(domainOf("Plot(f(x), (x, 0.001, 123456.789))")).toBe("0.001,123456.789");
});

test("a range with Pi in it is a number", () => {
  const [lo, hi] = domainOf("Plot(f(x), (x, -Pi, 2*Pi))")!.split(",").map(Number);
  expect(lo).toBeCloseTo(-Math.PI, 12);
  expect(hi).toBeCloseTo(2 * Math.PI, 12);
  expect(Number(domainOf("Plot(f(x), (x, 0, Pi/2))")?.split(",")[1])).toBeCloseTo(Math.PI / 2, 12);
});

test("a range in braces, as Wolfram writes it, is a range", () => {
  expect(domainOf("Plot(Re(Zeta(x)), {x, -5, 5})")).toBe("-5,5");
});

test("a surface's two ranges read the same way", () => {
  const settings = graphics3dOfText("Plot3D(x^2 + y^2, {x, -3.1416, 3.1416}, (y, -Pi, Pi))")?.settings;
  expect(settings?.["x-domain"]).toBe("-3.1416,3.1416");
  expect(Number(settings?.["y-domain"]?.split(",")[0])).toBeCloseTo(-Math.PI, 12);
});

const rangeSettings = (option: string): Record<string, string | undefined> => {
  const s = plotOfText(`Plot(Sin(x), (x, 0, 10), PlotRange -> ${option})`)?.settings ?? {};
  return { x: s["plot-x-range"], y: s["plot-range"] };
};

test("PlotRange in braces reads as the same range in brackets, either order", () => {
  const bracket = rangeSettings("[-1, 1]");
  expect(bracket).toEqual({ x: undefined, y: "-1,1" });
  expect(rangeSettings("{-1, 1}")).toEqual(bracket);
  expect(rangeSettings("{1, -1}")).toEqual(bracket);
});

test("a nested brace pair is the x and y windows, mixed brackets alike", () => {
  const nested = { x: "-1,1", y: "0,2" };
  expect(rangeSettings("[[-1, 1], [0, 2]]")).toEqual(nested);
  expect(rangeSettings("{{-1, 1}, {0, 2}}")).toEqual(nested);
  expect(rangeSettings("{{1, -1}, [0, 2]}")).toEqual(nested);
  expect(rangeSettings("{Automatic, {0, 2}}")).toEqual({ x: undefined, y: "0,2" });
});

test("a brace set that is not two numbers is no range, as a bad list is none", () => {
  expect(rangeSettings("{a, b}")).toEqual({ x: undefined, y: undefined });
  expect(rangeSettings("{1, 2, 3}")).toEqual({ x: undefined, y: undefined });
});
