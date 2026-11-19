// unstable: `compile` and a bare ComputeEngine, to run what a handler lowers to on both targets
import { ComputeEngine, compile } from "@notatio/engine/unstable";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";
import { declareFractals } from "../src/fractal.ts";

// HermiteH, LaguerreL, Mandelbrot and Julia compile as an expression the compiler lowers in place of the call
// (a block of locals and a loop), so the same lowering reaches JavaScript and GLSL. Every route gives the same
// value: `evaluate()`, `.N()`, and the compiled JavaScript.

const ce = new ComputeEngine();
declareAnalytic(ce);
declareFractals(ce);

type Lambda = { success: boolean; run: (...args: number[]) => number };
const lambda = (body: unknown, ...names: string[]): Lambda =>
  compile(ce.box(["Function", body, ...names] as never)) as unknown as Lambda;

const relative = (a: number, b: number): number => Math.abs(a - b) / Math.max(1, Math.abs(b));

test("compiled HermiteH agrees with .N() and evaluate(), NaN where the order is not a nonnegative integer", () => {
  const f = lambda(["HermiteH", "n", "x"], "n", "x");
  expect(f.success).toBe(true);
  for (const n of [0, 1, 2, 3, 7, 20])
    for (const x of [-1.5, -0.25, 0, 0.5, 2]) {
      const numeric = ce.box(["HermiteH", n, x]).N().re;
      expect(relative(f.run(n, x), numeric), `H_${n}(${x})`).toBeLessThan(1e-12);
      expect(relative(ce.box(["HermiteH", n, x]).evaluate().N().re, numeric)).toBeLessThan(1e-12);
    }
  for (const n of [-1, 2.5]) expect(f.run(n, 0.5), `H_${n}`).toBeNaN();
});

test("compiled LaguerreL agrees with .N(), with and without the parameter", () => {
  const two = lambda(["LaguerreL", "n", "x"], "n", "x");
  const three = lambda(["LaguerreL", "n", "a", "x"], "n", "a", "x");
  expect(two.success && three.success).toBe(true);
  for (const n of [0, 1, 2, 3, 6, 15])
    for (const x of [-2, 0, 0.5, 3.25]) {
      expect(relative(two.run(n, x), ce.box(["LaguerreL", n, x]).N().re), `L_${n}(${x})`).toBeLessThan(1e-12);
      for (const a of [-0.5, 0, 1.5])
        expect(relative(three.run(n, a, x), ce.box(["LaguerreL", n, a, x]).N().re), `L_${n}^${a}(${x})`).toBeLessThan(
          1e-12,
        );
    }
  expect(two.run(-1, 0.5)).toBeNaN();
});

test("compiled Mandelbrot and Julia agree with .N() on the real line, escaped orbits included", () => {
  const mandelbrot = lambda(["Mandelbrot", "c", "n"], "c", "n");
  const julia = lambda(["Julia", "z", "c", "n"], "z", "c", "n");
  expect(mandelbrot.success && julia.success).toBe(true);
  for (const c of [-2, -1.5, -0.75, 0, 0.25, 0.3, 1])
    for (const n of [1, 5, 64, 600]) {
      const numeric = ce.box(["Mandelbrot", c, n]).N().re;
      expect(relative(mandelbrot.run(c, n), numeric), `Mandelbrot(${c}, ${n})`).toBeLessThan(1e-9);
    }
  for (const [z, c] of [
    [0.5, -0.4],
    [1.2, -1],
    [-0.3, 0.2],
  ] as const)
    for (const n of [1, 8, 64]) {
      const numeric = ce.box(["Julia", z, c, n]).N().re;
      expect(relative(julia.run(z, c, n), numeric), `Julia(${z}, ${c}, ${n})`).toBeLessThan(1e-9);
    }
});

test("the same expressions lower to a GLSL loop", () => {
  ce.pushScope();
  ce.declare("x", "real");
  ce.declare("a", "real");
  try {
    for (const call of [
      ["HermiteH", 4, "x"],
      ["LaguerreL", 3, "a", "x"],
      ["Mandelbrot", "x", 32],
      ["Julia", "x", "a", 32],
    ]) {
      const glsl = compile(ce.box(call as never), { to: "glsl", fallback: false }) as unknown as { code: string };
      expect(glsl.code, JSON.stringify(call)).toMatch(/\b(for|while)\b|\bfloat\b/);
    }
  } finally {
    ce.popScope();
  }
});
