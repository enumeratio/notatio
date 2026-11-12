import { ComputeEngine } from "@cortex-js/compute-engine";
import { GLSLTarget, JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import { expect, test } from "vite-plus/test";
import { applyNativeHeadPatches, applyPatch, steppedIterator } from "../src/index.ts";

const ce = new ComputeEngine();
applyPatch(ce, steppedIterator);

const stepped = (head: string, lower: unknown, upper: unknown, step: unknown) =>
  [head, "i", ["Limits", "i", lower, upper, step]] as never;

// [lower, upper, step, sum, product]: a step that divides the range, a negative step, a step that
// does not divide the range.
const cases = [
  [1, 4, 2, 4, 3],
  [5, 1, -2, 9, 15],
  [1, 6, 3, 5, 4],
  [2, 10, 4, 18, 120],
] as const;

test("a four-operand Limits steps the index", () => {
  for (const [lower, upper, step, sum, product] of cases) {
    expect(ce.box(stepped("Sum", lower, upper, step)).evaluate().json).toBe(sum);
    expect(ce.box(stepped("Product", lower, upper, step)).evaluate().json).toBe(product);
  }
});

test("a stepped iterator and its Element(i, Range) form agree on every route", () => {
  for (const [lower, upper, step, sum, product] of cases) {
    for (const [head, value] of [
      ["Sum", sum],
      ["Product", product],
    ] as const) {
      const element = ce.box([head, "i", ["Element", "i", ["Range", lower, upper, step]]] as never);
      const limits = ce.box(stepped(head, lower, upper, step));
      expect(limits.evaluate().json).toBe(value);
      expect(limits.N().json).toBe(value);
      expect(element.evaluate().json).toBe(value);
      expect(limits.simplify().json).toEqual(element.simplify().json);
    }
  }
});

test("a step that is not a number, or is 0, leaves the iterator unevaluated", () => {
  for (const head of ["Sum", "Product"]) {
    for (const step of ["s", 0]) {
      const result = ce.box(stepped(head, 1, 4, step)).evaluate();
      expect(result.operator).toBe(head);
      expect(ce.box(stepped(head, 1, 4, step)).N().operator).toBe(head);
    }
  }
});

test("a body that depends on the index is summed over the stepped members", () => {
  expect(ce.box(["Sum", ["Power", "i", 2], ["Limits", "i", 1, 7, 3]] as never).evaluate().json).toBe(66);
});

// The compile targets decline an `Element` index set: an error, never the unstepped value.
test("the compile targets decline rather than answer the unstepped value", () => {
  for (const head of ["Sum", "Product"]) {
    const expr = ce.box(stepped(head, 1, 4, 2));
    expect(() => (new JavaScriptTarget().compile(expr) as { run: () => unknown }).run()).toThrow();
    expect(() => new GLSLTarget().compileToSource(expr)).toThrow();
  }
});

test("an iterator of three operands is untouched", () => {
  expect(ce.box(["Sum", "i", ["Limits", "i", 1, 4]] as never).evaluate().json).toBe(10);
});

test("the native-head patches together, with the upper-bound patch, step the same", () => {
  const all = new ComputeEngine();
  applyNativeHeadPatches(all);
  expect(all.box(stepped("Sum", 1, 4, 2)).evaluate().json).toBe(4);
  expect(all.box(["Sum", "k", ["Limits", "k", "Nothing", 4]] as never).evaluate().json).toBe(10);
});
