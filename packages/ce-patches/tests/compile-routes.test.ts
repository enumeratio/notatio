import { ComputeEngine } from "@cortex-js/compute-engine";
import { compile } from "@cortex-js/compute-engine/compile";
import { expect, test } from "vite-plus/test";
import { applyAllPatches } from "../src/index.ts";

// A patched head has a compiled route as well as an evaluated one, and they agree: `evaluate()`, `.N()`, and the
// compiled JavaScript (and GLSL where the head has a shader lowering). Where compute-engine's compiler declines a
// patched head (`fallback: false` throws), a compile with the fallback runs the interpreter, so the value is the
// one `evaluate()` gives.

const ce = new ComputeEngine();
applyAllPatches(ce);

type Result = { success: boolean; code: string; run: (vars?: Record<string, number>) => unknown };
const compiled = (expr: unknown, declare: Record<string, string> = {}, options: object = {}): Result => {
  ce.pushScope();
  try {
    for (const [name, type] of Object.entries(declare)) ce.declare(name, type);
    return compile(ce.box(expr as never), options) as unknown as Result;
  } finally {
    ce.popScope();
  }
};
const declines = (expr: unknown, declare: Record<string, string> = {}, to = "javascript"): boolean => {
  try {
    compiled(expr, declare, { fallback: false, to });
    return false;
  } catch (error) {
    return /Could not compile/.test((error as Error).message);
  }
};
const evaluated = (expr: unknown, at: Record<string, number> = {}) =>
  ce
    .box(expr as never)
    .subs(Object.fromEntries(Object.entries(at).map(([name, v]) => [name, ce.number(v)])))
    .evaluate();

test("a one-bound Sum and Product (iterator-upper-bound) compile to JavaScript and GLSL as evaluate reads them", () => {
  for (const [head, expected] of [
    ["Sum", 385],
    ["Product", 3628800],
  ] as const) {
    const expr = [head, head === "Sum" ? ["Power", "k", 2] : "k", ["Limits", "k", "Nothing", "n"]];
    const js = compiled(expr, { n: "integer" }, { fallback: false });
    expect(js.success).toBe(true);
    expect(js.run({ n: 10 })).toBe(expected);
    expect(evaluated(expr, { n: 10 }).re).toBe(expected);
    const glsl = compiled(expr, { n: "integer" }, { fallback: false, to: "glsl" });
    expect(glsl.code).toMatch(/\bfor\b/);
  }
});

test("Zeta of one operand compiles as .N() reads it; the two-operand Zeta is closed, and falls back to the interpreter", () => {
  const js = compiled(["Zeta", "x"], { x: "real" }, { fallback: false });
  for (const x of [2, 2.5, 0, -1])
    expect(js.run({ x }) as number, `ζ(${x})`).toBeCloseTo(ce.box(["Zeta", x]).N().re, 12);
  expect(compiled(["Zeta", "x"], { x: "real" }, { fallback: false, to: "glsl" }).code).toContain("zeta");
  const two = ["Zeta", "s", "a"];
  expect(declines(two, { s: "real", a: "real" })).toBe(true);
  expect(declines(two, { s: "real", a: "real" }, "glsl")).toBe(true);
  const fallback = compiled(two, { s: "real", a: "real" });
  expect(fallback.success).toBe(false);
  expect(fallback.run({ s: 0, a: -1 })).toBe(evaluated(two, { s: 0, a: -1 }).re);
});

test("LerchPhi is closed on both targets, and its fallback gives evaluate's principal-branch value", () => {
  const expr = ["LerchPhi", "z", "s", "a"];
  const types = { z: "real", s: "real", a: "real" };
  expect(declines(expr, types)).toBe(true);
  expect(declines(expr, types, "glsl")).toBe(true);
  const fallback = compiled(expr, types);
  expect(fallback.success).toBe(false);
  const at = { z: 0, s: 2.976, a: -2.664 };
  const got = fallback.run(at) as { re: number; im: number };
  const want = evaluated(expr, at).N();
  expect(got.re).toBeCloseTo(want.re, 12);
  expect(got.im).toBeCloseTo(want.im, 12);
});

test("an integral of a power of a quadratic compiles to its value", () => {
  const expr = ["Integrate", ["Power", ["Add", 1, "x", ["Power", "x", 2]], 2], ["Limits", "x", -1, 1]];
  const js = compiled(expr, {}, { fallback: false });
  expect(js.success).toBe(true);
  expect(js.run() as number).toBeCloseTo(evaluated(expr).N().re, 12);
});

test("Shape, Series and Solve have no compiled lowering, and their fallbacks run the interpreter", () => {
  const shape = ["Shape", ["List", ["List", ["a", 1], ["a", 2]]]];
  const series = ["Series", ["Sin", "x"], "x", 0, 3];
  const solve = ["Solve", ["Equal", ["Power", "x", 2], 4], "x"];
  for (const expr of [shape, series, solve]) {
    expect(declines(expr, { x: "real" }), JSON.stringify(expr)).toBe(true);
    expect(compiled(expr, { x: "real" }).success).toBe(false);
  }
  // The interpreter's shape: a tuple of the dimensions, as plain numbers from the fallback.
  expect(compiled(shape).run()).toEqual([1, 2]);
  expect(ce.box(shape as never).evaluate().json).toEqual(["Tuple", 1, 2]);
});
