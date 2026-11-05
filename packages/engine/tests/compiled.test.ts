import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { compileExpression, fromJs, inlineCalls, isCacheableDefinition } from "../src/compiled.ts";

const ce = new ComputeEngine();
const cacheable = (expression: unknown): boolean => isCacheableDefinition(ce, expression, { _x: "integer" });

test("a pure definition's answer can be reused", () => {
  expect(cacheable(["Add", "_x", 1])).toBe(true);
});

test("so can one that only writes to the console", () => {
  expect(cacheable(["Print", "_x"])).toBe(true);
});

test("one that draws a random number can't", () => {
  expect(cacheable(["Add", "_x", ["RandomInteger", 1, 6]])).toBe(false);
});

test("a call to one of our definitions expands into it, without capturing the argument's variables", () => {
  // Double(Permutation(x)) := Map(i ↦ 2i, x); called on a list built from an outer `i`.
  const lookup = (carrier: string, head: string) =>
    carrier === "Permutation" && head === "Double"
      ? { expression: ["Map", ["Function", ["Multiply", 2, "i"], "i"], "_x"], subject: "_x" }
      : undefined;
  const expanded = inlineCalls(["Function", ["Double", ["Permutation", ["List", "i"]]], "i"], lookup);
  expect(expanded).toEqual(["Function", ["Map", ["Function", ["Multiply", 2, "_c1_1"], "_c1_1"], ["List", "i"]], "i"]);
  expect(ce.box(["At", ["Apply", expanded, 5], 1] as never).evaluate().json).toEqual(10);
});

test("compileExpression gives a function of the free variables", () => {
  expect(compileExpression(ce.box(["Add", ["Multiply", "t", "t"], 1]))?.({ t: 3 })).toBe(10);
});

test("fromJs reads a complex value with a zero imaginary part as its real part", () => {
  expect(fromJs({ re: 1, im: 0 })).toBe(1);
  expect(fromJs([{ re: 2, im: 0 }, 3])).toEqual(["List", 2, 3]);
  expect(fromJs({ re: 1, im: 1 })).toBeUndefined();
  expect(fromJs({ re: 0.5, im: 0 })).toBeUndefined();
});
