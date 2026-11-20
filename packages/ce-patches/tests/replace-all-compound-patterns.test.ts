import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { applyPatch, replaceAllCompoundPatternsPatch } from "../src/index.ts";

const bare = new ComputeEngine();
const ce = new ComputeEngine();
applyPatch(ce, replaceAllCompoundPatternsPatch);

const run = (engine: ComputeEngine, expr: unknown): unknown => engine.box(expr as never).evaluate().json;
const x2 = ["Power", "x", 2];

test("a compound left side replaces the part wherever it sits, top-down", () => {
  expect(run(ce, ["ReplaceAll", ["List", "x", x2, ["Power", "x", 3], "a"], ["Rule", x2, "y"]])).toEqual([
    "List",
    "x",
    "y",
    ["Power", "x", 3],
    "a",
  ]);
  expect(run(ce, ["ReplaceAll", ["Sin", ["Add", "x", 1]], ["Rule", ["Add", "x", 1], "y"]])).toEqual(["Sin", "y"]);
});

test("the first matching rule wins at a part, and its result is not searched again", () => {
  expect(run(ce, ["ReplaceAll", ["List", "x", x2], ["List", ["Rule", x2, "a"], ["Rule", "x", x2]]])).toEqual([
    "List",
    x2,
    "a",
  ]);
});

test("symbol and compound rules apply together, top-down, as in Wolfram", () => {
  // compute-engine#637 applies symbol rules first, so its answer here is 6.
  const call = ["ReplaceAll", ["Add", "x", x2], ["List", ["Rule", "x", 2], ["Rule", x2, "y"]]];
  expect(
    ce
      .box(call as never)
      .evaluate()
      .isSame(ce.box(["Add", "y", 2]).evaluate()),
  ).toBe(true);
});

test("rules given as extra arguments apply as a set", () => {
  expect(run(ce, ["ReplaceAll", ["List", "x", x2], ["Rule", x2, "a"], ["Rule", "x", "b"]])).toEqual(["List", "b", "a"]);
});

test("a symbol rule, a pattern the grammar can't read and a non-rule go to the native head", () => {
  const calls = [
    ["ReplaceAll", ["List", ["Add", "x", 1], "x"], ["Rule", "x", 99]],
    ["ReplaceAll", ["Add", "x", 1], ["Rule", "x", 2]],
    ["ReplaceAll", ["List", 1, 2], ["Rule", ["Power", "_Integer", 2], "y"]],
    ["ReplaceAll", ["List", 1, 2], 5],
  ];
  for (const call of calls) expect(run(ce, call)).toEqual(run(bare, call));
});

test("the result is the same through N()", () => {
  const call = ce.box(["ReplaceAll", ["List", "x", ["Power", "x", 2]], ["Rule", ["Power", "x", 2], 0.5]]);
  expect(call.N().json).toEqual(call.evaluate().json);
});

test("native compute-engine leaves a compound left side unreplaced", () => {
  expect(run(bare, ["ReplaceAll", ["List", "x", x2], ["Rule", x2, "y"]])).toEqual(["List", "x", x2]);
});

test("the head keeps compute-engine's signature", () => {
  expect(
    String((ce.lookupDefinition("ReplaceAll") as { operator?: { signature?: unknown } }).operator?.signature),
  ).toBe(String((bare.lookupDefinition("ReplaceAll") as { operator?: { signature?: unknown } }).operator?.signature));
});
