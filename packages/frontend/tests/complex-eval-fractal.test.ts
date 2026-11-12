import { ComputeEngine } from "@cortex-js/compute-engine";
import { emitComplexGLSL } from "@enumeratio/ce-patches/glsl-complex";
import { declareFractals } from "@enumeratio/analytic";
import { parseExpression } from "@enumeratio/formats/expression";
import { expect, test } from "vite-plus/test";
import { type Complex, complexFunction, FRACTAL_DEFAULT_ITERATIONS } from "../src/complex-eval.ts";
import { Uncertain } from "../src/uncertain.ts";

// The CPU sampler's Mandelbrot and Julia: the n-th iterate of z -> z^2 + c, stopped at |z|^2 > 1e12 or 512 steps,
// as the shader's iterateQuadratic does, held to an independent loop.

const ce = new ComputeEngine();
declareFractals(ce);
const canonical = (src: string) => ce.box(parseExpression(src).json as never).json;
const fn = (src: string) => complexFunction(canonical(src), "z")!;

/** The shader's loop, written out: n clamped to 1..512, early exit past |z|^2 = 1e12. */
function reference(z0: Complex, c: Complex, n: number): Complex {
  let [re, im] = z0;
  const steps = Math.min(512, Math.max(1, Math.round(n)));
  for (let i = 0; i < steps; i++) {
    [re, im] = [re * re - im * im + c[0], 2 * re * im + c[1]];
    if (re * re + im * im > 1e12) break;
  }
  return [re, im];
}

const close = (a: Complex, b: Complex) => {
  expect(a[0]).toBeCloseTo(b[0], 9);
  expect(a[1]).toBeCloseTo(b[1], 9);
};

test("both heads lower on the CPU, and the GPU lowers them too", () => {
  for (const src of ["Mandelbrot(z, 64)", "Mandelbrot(z)", "Julia(z, -0.4 + 0.6i, 64)", "Julia(z, -0.4 + 0.6i)"]) {
    expect(complexFunction(canonical(src), "z"), src).toBeDefined();
  }
  expect(emitComplexGLSL(canonical("Mandelbrot(z, 64)") as never, "z")).toBeDefined();
});

test("Mandelbrot: inside stays bounded, outside escapes", () => {
  const m = fn("Mandelbrot(z, 64)");
  close(m([0, 0]), [0, 0]);
  // c = -1 cycles 0, -1, 0, ...: an even count lands on 0.
  close(m([-1, 0]), [0, 0]);
  // c = 1 leaves the radius at the seventh step: 1, 2, 5, 26, 677, 458330, 210066388901.
  const out = m([1, 0]);
  expect(out[0]).toBe(210066388901);
  expect(Math.hypot(...out)).toBeGreaterThan(1e6);
  expect(Math.hypot(...m([2, 2]))).toBeGreaterThan(1e6);
  // c = -0.5 + 0.5i is inside the main cardioid.
  expect(Math.hypot(...m([-0.5, 0.5]))).toBeLessThan(2);
});

test("Julia: c = 0 is z -> z^2, so |z| < 1 collapses and |z| > 1 escapes", () => {
  const j = fn("Julia(z, 0, 64)");
  close(j([0.5, 0]), [0, 0]);
  expect(Math.hypot(...j([1.5, 0]))).toBeGreaterThan(1e6);
  // |z| = 1 stays on the circle.
  expect(Math.hypot(...j([0, 1]))).toBeCloseTo(1, 9);
});

test("the default is the declared 64, and the cap is the shader's 512", () => {
  expect(FRACTAL_DEFAULT_ITERATIONS).toBe(64);
  const p: Complex = [-0.1, 0.65];
  close(fn("Mandelbrot(z)")(p), fn("Mandelbrot(z, 64)")(p));
  close(fn("Julia(z, -0.4 + 0.6i)")(p), fn("Julia(z, -0.4 + 0.6i, 64)")(p));
  // A bounded orbit reads differently at 64 and 512 steps, and 5000 is clamped to 512.
  const q: Complex = [0.3, 0.5];
  close(fn("Mandelbrot(z, 5000)")(q), reference([0, 0], q, 512));
  close(fn("Mandelbrot(z, 0)")(q), reference([0, 0], q, 1));
});

test("the CPU agrees with the loop at every point of a grid, escaping or not", () => {
  const m = fn("Mandelbrot(z, 64)");
  const j = fn("Julia(z, -0.4 + 0.6i, 64)");
  let escaped = 0;
  let bounded = 0;
  for (let a = -24; a <= 24; a++) {
    for (let b = -24; b <= 24; b++) {
      const z: Complex = [a / 12 - 0.5, b / 12];
      const want = reference([0, 0], z, 64);
      close(m(z), want);
      close(j(z), reference(z, [-0.4, 0.6], 64));
      if (want[0] * want[0] + want[1] * want[1] > 1e12) escaped++;
      else bounded++;
    }
  }
  expect(escaped).toBeGreaterThan(100);
  expect(bounded).toBeGreaterThan(100);
});

test("a non-finite input is declined, not drawn", () => {
  expect(() => fn("Mandelbrot(z, 64)")([Number.NaN, 0])).toThrow(Uncertain);
  expect(() => fn("Julia(z, 1, 64)")([Number.POSITIVE_INFINITY, 0])).toThrow(Uncertain);
});

test("an unbound iteration count is not lowered", () => {
  expect(complexFunction(canonical("Mandelbrot(z, n)"), "z")).toBeUndefined();
});

test("a default portrait's worth of samples is fast", () => {
  const m = fn("Mandelbrot(z, 64)");
  const t = performance.now();
  for (let y = 0; y < 240; y++) for (let x = 0; x < 400; x++) m([-2.5 + (x / 400) * 3, -1.5 + (y / 240) * 3]);
  const ms = performance.now() - t;
  expect(ms).toBeLessThan(2000);
});
