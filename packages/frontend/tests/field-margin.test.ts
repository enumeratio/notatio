// A predicate's margin is positive exactly where the predicate holds (the wiki's Speculative-Plotting, §3.1).

import { expect, test } from "vite-plus/test";
import { fieldSourcesOf, levelOf, marginOf, regionFunctionOf } from "../src/field-margin.ts";

const r2 = ["Add", ["Power", "x", 2], ["Power", "y", 2]];

test.each([
  ["a < b", ["Less", "a", "b"], ["Subtract", "b", "a"]],
  ["a <= b", ["LessEqual", "a", "b"], ["Subtract", "b", "a"]],
  ["a > b", ["Greater", "a", "b"], ["Subtract", "a", "b"]],
  ["a >= b", ["GreaterEqual", "a", "b"], ["Subtract", "a", "b"]],
  ["a chain", ["Less", 1, r2, 4], ["Min", ["Subtract", r2, 1], ["Subtract", 4, r2]]],
  ["p && q", ["And", ["Less", "x", 1], ["Greater", "y", 0]], ["Min", ["Subtract", 1, "x"], ["Subtract", "y", 0]]],
  ["p || q", ["Or", ["Less", "x", 1], ["Greater", "y", 0]], ["Max", ["Subtract", 1, "x"], ["Subtract", "y", 0]]],
  ["!p", ["Not", ["Less", "x", 1]], ["Negate", ["Subtract", 1, "x"]]],
  ["True", "True", 1],
  ["False", "False", -1],
])("the margin of %s", (_, predicate, margin) => {
  expect(marginOf(predicate)).toEqual(margin);
});

test.each([
  ["an equation", ["Equal", "x", "y"]],
  ["membership", ["Element", "x", "Integers"]],
  ["a conjunction holding one", ["And", ["Less", "x", 1], ["Element", "y", "Integers"]]],
  ["a number", 3],
  ["a comparison of one side", ["Less", "x"]],
])("%s has no margin", (_, predicate) => {
  expect(marginOf(predicate)).toBeUndefined();
});

test("an equation's curve is where its sides' difference is zero", () => {
  expect(levelOf(["Equal", "a", "b"])).toEqual(["Subtract", "a", "b"]);
  expect(levelOf(["Less", "a", "b"])).toBeUndefined();
  expect(levelOf(["Equal", "a", "b", "c"])).toBeUndefined();
});

test("a RegionPlot samples a margin for each predicate, and declines when one has none", () => {
  expect(fieldSourcesOf("RegionPlot", ["Less", r2, 4])).toEqual({ kind: "regions", sources: [["Subtract", 4, r2]] });
  expect(fieldSourcesOf("RegionPlot", ["List", ["Less", "x", 0], ["Greater", "y", 0]])).toEqual({
    kind: "regions",
    sources: [
      ["Subtract", 0, "x"],
      ["Subtract", "y", 0],
    ],
  });
  expect(fieldSourcesOf("RegionPlot", ["List", ["Less", "x", 0], ["Equal", "y", 0]])).toBeUndefined();
  expect(fieldSourcesOf("RegionPlot", r2)).toBeUndefined();
});

test("a ContourPlot of equations samples their curves; of anything else, the function", () => {
  expect(fieldSourcesOf("ContourPlot", ["Equal", r2, 4])).toEqual({ kind: "curves", sources: [["Subtract", r2, 4]] });
  expect(fieldSourcesOf("ContourPlot", r2)).toEqual({ kind: "value", sources: [r2] });
  // An equation is a curve only to `ContourPlot`: a density of a truth value is no picture, and is left as written.
  expect(fieldSourcesOf("DensityPlot", ["Equal", r2, 4])).toEqual({ kind: "value", sources: [["Equal", r2, 4]] });
});

test("a RegionFunction is a predicate over the plot's variables, or a function of them", () => {
  expect(regionFunctionOf(["Less", r2, 9])).toEqual({ margin: ["Subtract", 9, r2], params: [] });
  expect(regionFunctionOf(["Function", ["Less", "u", "v"], "u", "v"])).toEqual({
    margin: ["Subtract", "v", "u"],
    params: ["u", "v"],
  });
  expect(regionFunctionOf(["Element", "x", "Integers"])).toBeUndefined();
});

// The margin's sign is the predicate's truth, sampled: the two are computed apart here.
test("a margin is positive exactly where its predicate holds", () => {
  const value = (json: unknown, x: number, y: number): number => {
    if (typeof json === "number") return json;
    if (json === "x") return x;
    if (json === "y") return y;
    const [head, ...args] = json as [string, ...unknown[]];
    const v = args.map((a) => value(a, x, y));
    switch (head) {
      case "Add":
        return v.reduce((s, t) => s + t, 0);
      case "Subtract":
        return v[0]! - v[1]!;
      case "Negate":
        return -v[0]!;
      case "Power":
        return v[0]! ** v[1]!;
      case "Sin":
        return Math.sin(v[0]!);
      case "Min":
        return Math.min(...v);
      case "Max":
        return Math.max(...v);
      default:
        throw new Error(head);
    }
  };
  const holds = (json: unknown, x: number, y: number): boolean => {
    const [head, ...args] = json as [string, ...unknown[]];
    const pairs = (test: (a: number, b: number) => boolean): boolean =>
      args.slice(1).every((b, k) => test(value(args[k], x, y), value(b, x, y)));
    switch (head) {
      case "Less":
        return pairs((a, b) => a < b);
      case "Greater":
        return pairs((a, b) => a > b);
      case "And":
        return args.every((a) => holds(a, x, y));
      case "Or":
        return args.some((a) => holds(a, x, y));
      case "Not":
        return !holds(args[0], x, y);
      default:
        throw new Error(head);
    }
  };
  const predicates = [
    ["Less", r2, 4],
    ["And", ["Less", r2, 4], ["Greater", "y", ["Sin", "x"]]],
    ["Or", ["Less", 1, r2, 2], ["Not", ["Less", "x", "y"]]],
    ["Not", ["And", ["Greater", "x", 0], ["Greater", "y", 0]]],
  ];
  // Offset samples stay off the boundaries, where a margin is 0 and a strict test is false.
  // The two axes are offset differently, which keeps the samples off `x = y` too.
  const axis = (offset: number): number[] => Array.from({ length: 31 }, (_, k) => -3 + k * 0.19 + offset);
  for (const predicate of predicates) {
    const margin = marginOf(predicate)!;
    for (const x of axis(0.0137))
      for (const y of axis(0.0291)) expect(value(margin, x, y) > 0).toBe(holds(predicate, x, y));
  }
});
