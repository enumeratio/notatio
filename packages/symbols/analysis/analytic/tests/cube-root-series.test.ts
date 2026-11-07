// unstable: ComputeEngine, the class under test
import { compileExpression } from "@enumeratio/engine/compiled";
import { operandsOf } from "@enumeratio/engine";
import { ComputeEngine } from "@enumeratio/engine/unstable";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// The Taylor series of the real cube root about a negative point has real coefficients: the
// derivatives are the real branch, cbrt(x) = -cbrt(-x). Values are the cubic Taylor polynomial of
// mpmath's -cbrt(-x) at x0 + x0/10 (mpmath's cbrt is principal on negative reals).

const ce = new ComputeEngine();
declareAnalytic(ce);

const POINTS = [
  [-8, -2.064567901234568],
  [-2.5, -1.401024870441871],
  [-0.5, -0.8193243145698828],
  [-1000, -10.322839506172839],
] as const;

const polynomial = (series: ReturnType<typeof ce.box>) =>
  ce.function(
    "Add",
    operandsOf(series).filter((t) => t.operator !== "BigO"),
  );

test("Series of CubeRoot about a negative point: symbolic x0, then evaluated by .N()", () => {
  const series = polynomial(ce.box(["Series", ["CubeRoot", "x"], "x", "x0", 3] as never).evaluate());
  for (const [x0, expected] of POINTS) {
    const n = series.subs({ x0, x: x0 * 1.1 } as never).N();
    expect(n.re).toBeCloseTo(expected, 12);
    expect(n.im).toBe(0);
  }
});

test("Series of CubeRoot about a negative point: the compiled polynomial agrees", () => {
  const series = polynomial(ce.box(["Series", ["CubeRoot", "x"], "x", "x0", 3] as never).evaluate());
  const run = compileExpression(series);
  expect(run).toBeDefined();
  for (const [x0, expected] of POINTS) expect(run!({ x: x0 * 1.1, x0 })).toBeCloseTo(expected, 10);
});
