// A plot's explicit range reaches its `domain` setting as plain numbers, whatever way it is written.

import { expect, test } from "vite-plus/test";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { graphics3dOfText, optionIssuesOf, plotOfText } from "../src/symbols.ts";

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

test("a nested pair of windows is read in order in brackets or parentheses", () => {
  const nested = { x: "-1,1", y: "0,2" };
  expect(rangeSettings("[[-1, 1], [0, 2]]")).toEqual(nested);
  expect(rangeSettings("((-1, 1), (0, 2))")).toEqual(nested);
  expect(rangeSettings("[{-1, 1}, {2, 0}]")).toEqual(nested);
  expect(rangeSettings("[Automatic, [0, 2]]")).toEqual({ x: undefined, y: "0,2" });
});

test("a range's ends are real constants, not just numbers", () => {
  expect(rangeSettings("[-1, 1]")).toEqual({ x: undefined, y: "-1,1" });
  const pi = rangeSettings("[-Pi, Pi]");
  expect(pi["x"]).toBeUndefined();
  expect(pi["y"]!.split(",").map(Number)).toEqual([-Math.PI, Math.PI].map((v) => Number(v.toPrecision(12))));
  expect(rangeSettings("(-Pi, Pi)")).toEqual(pi);
  expect(rangeSettings("{Pi, -Pi}")).toEqual(pi);
  expect(rangeSettings("[0, Pi/2]")["y"]).toBe("0,1.57079632679");
  expect(rangeSettings("[-Sqrt(2), Sqrt(2)]")["y"]).toBe("-1.41421356237,1.41421356237");
  expect(rangeSettings("[1/2, 3/2]")["y"]).toBe("0.5,1.5");
  expect(rangeSettings("[-2*Pi, 2*Pi]")["y"]).toBe("-6.28318530718,6.28318530718");
});

test("windows with symbolic ends are windows", () => {
  expect(rangeSettings("[[-Pi, Pi], [-1, 1]]")).toEqual({ x: "-3.14159265359,3.14159265359", y: "-1,1" });
});

test("an end that is not a finite real is no range", () => {
  const none = { x: undefined, y: undefined };
  expect(rangeSettings("[a, 1]")).toEqual(none);
  expect(rangeSettings("[-Sqrt(2) * I, 1]")).toEqual(none);
  expect(rangeSettings("[Sqrt(-1), 1]")).toEqual(none);
  expect(rangeSettings("[0, 1/0]")).toEqual(none);
  expect(rangeSettings("[0, Infinity]")).toEqual(none);
});

test("braces around the two windows are unordered, so they are reported, not guessed", () => {
  // The engine sorts a set's elements, so `{{0, 2}, {-1, 1}}` can come back as `{{-1, 1}, {0, 2}}`.
  for (const outer of ["{{-1, 1}, {0, 2}}", "{{0, 2}, {-1, 1}}", "{Automatic, {0, 2}}", "{[-1, 1], [0, 2]}"]) {
    const plot = plotOfText(`Plot(Sin(x), (x, 0, 10), PlotRange -> ${outer})`)!;
    expect(plot.settings["plot-range"], outer).toBeUndefined();
    expect(plot.settings["plot-x-range"], outer).toBeUndefined();
    expect(optionIssuesOf(plot.json), outer).toHaveLength(1);
    expect(optionIssuesOf(plot.json)[0], outer).toContain("[...] or (...)");
  }
});

test("the engine sorts and collapses a set's elements: the reason braces keep no order", () => {
  // If this starts failing the engine keeps source order, and the outer pair (and the options
  // `lowerOptions` reports a brace set for) can be read in order again.
  const engine = new ComputeEngine();
  const boxed = (json: unknown): unknown => engine.box(json as never).json;
  expect(boxed(["Set", ["Set", 0, 2], ["Set", -1, 1]])).toEqual(["Set", ["Set", -1, 1], ["Set", 0, 2]]);
  expect(boxed(["Set", ["Set", 5, 2], ["Set", 3, 1]])).toEqual(["Set", ["Set", 1, 3], ["Set", 2, 5]]);
  expect(boxed(["Set", ["Set", -1, 1], ["Set", 1, -1]])).toEqual(["Set", ["Set", -1, 1]]);
});

test("an option that reads a pair or a position in order does not take a brace set", () => {
  const issuesOf = (option: string): string[] =>
    optionIssuesOf(
      plotOfText(
        /^(Scaling|PlotStyle)/.test(option)
          ? `Plot(Sin(x), (x, 0, 10), ${option})`
          : `Graphics([Circle((0, 0), 1)], ${option})`,
      )!.json,
    );
  for (const option of [
    "AxesOrigin -> {0, 1}",
    "GridLines -> {{1, 2}, {3}}",
    'ScalingFunctions -> {"Log", "Linear"}',
    'FrameLabel -> {"x", "y"}',
    "PlotStyle -> {Red, Blue}",
  ]) {
    const issues = issuesOf(option);
    expect(issues, option).toHaveLength(1);
    expect(issues[0], option).toContain(option.split(" ")[0]);
  }
  // In brackets or parentheses the same options read.
  expect(issuesOf("AxesOrigin -> [0, 1]")).toEqual([]);
  expect(issuesOf("GridLines -> [[1, 2], [3]]")).toEqual([]);
  expect(issuesOf('FrameLabel -> ("x", "y")')).toEqual([]);
  expect(issuesOf("PlotRange -> {-1, 1}")).toEqual([]);
});

test("an axes origin and grid positions with constants are numbers", () => {
  const s = plotOfText(
    "Plot(Sin(x), (x, 0, 10), AxesOrigin -> (0, -Pi), GridLines -> [[Pi, 2*Pi], Automatic])",
  )!.settings;
  expect(s["axes-origin"]).toBe("0,-3.14159265359");
  expect(s["grid-x"]).toBe("3.14159265359,6.28318530718");
});

test("a brace set that is not two numbers is no range, as a bad list is none", () => {
  expect(rangeSettings("{a, b}")).toEqual({ x: undefined, y: undefined });
  expect(rangeSettings("{1, 2, 3}")).toEqual({ x: undefined, y: undefined });
});
