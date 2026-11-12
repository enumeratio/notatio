import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { applyPatch, iteratorUpperBound } from "../src/index.ts";

const ce = new ComputeEngine();
applyPatch(ce, iteratorUpperBound);

const value = (expr: unknown): unknown => ce.box(expr as never).evaluate().json;

test("a lone upper bound runs from 1, as Wolfram's {k, n} does", () => {
  expect(value(["Sum", ["Power", "k", 2], ["Tuple", "k", 10]])).toBe(385);
  expect(value(["Sum", ["Power", "k", 2], ["Limits", "k", "Nothing", 10]])).toBe(385);
  expect(value(["Product", "k", ["Tuple", "k", 5]])).toBe(120);
});

test("explicit bounds are untouched", () => {
  expect(value(["Sum", "k", ["Limits", "k", 3, 5]])).toBe(12);
});

test("a lone lower bound still stays unevaluated", () => {
  expect(value(["Sum", ["Power", "k", -2], ["Limits", "k", 1, "Nothing"]])).toEqual([
    "Sum",
    ["Power", "k", -2],
    ["Limits", "k", 1, "Nothing"],
  ]);
});

// compute-engine 0.187 runs an index with no bounds from 1 to infinity; the patch leaves it alone.
test("an index with no bounds runs from 1 to infinity", () => {
  const unbounded = ["Limits", "k", "Nothing", "Nothing"];
  expect(value(["Sum", ["Power", "k", -2], unbounded])).toEqual(["Divide", ["Power", "Pi", 2], 6]);
  expect(value(["Sum", ["Power", 2, ["Negate", "k"]], unbounded])).toBe(1);
  expect(value(["Sum", "k", unbounded])).toBe("PositiveInfinity");
  expect(value(["Product", ["Add", 1, ["Power", "k", -2]], unbounded])).toEqual(["Divide", ["Sinh", "Pi"], "Pi"]);
});

// Never the body at `k := Nothing` (`3 q^(2k) + 5` once answered `3 q^2 + 5`).
test("an unbounded index with an unknown value stays unevaluated", () => {
  const body = ["Add", ["Multiply", 3, ["Power", "q", ["Multiply", 2, "k"]]], 5];
  const unbounded = ["Limits", "k", "Nothing", "Nothing"];
  expect(value(["Sum", body, unbounded])).toEqual(["Sum", body, unbounded]);
  expect(value(["Sum", ["f", "k"], unbounded])).toEqual(["Sum", ["f", "k"], unbounded]);
  expect(value(["Product", ["f", "k"], unbounded])).toEqual(["Product", ["f", "k"], unbounded]);
});

test("a degenerate bound still evaluates", () => {
  const body = ["Add", ["Multiply", 3, ["Power", "q", ["Multiply", 2, "k"]]], 5];
  expect(value(["Product", body, ["Limits", "k", 1, 1]])).toEqual(["Add", ["Multiply", 3, ["Power", "q", 2]], 5]);
});
