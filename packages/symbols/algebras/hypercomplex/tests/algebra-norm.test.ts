// `AlgebraNorm` is ours; `Norm` stays compute-engine's modulus. Gaussian integers are plain
// compute-engine complex numbers, so the algebra norm answers on them as well as on units.
import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareHypercomplex } from "../src/declare.ts";

const ce = createEngine(declareHypercomplex);

type Expr = number | string | readonly [string, ...Expr[]];

const same = (input: Expr, expected: Expr) =>
  expect(ce.box(input).evaluate().json).toEqual(ce.box(expected).evaluate().json);

/** The determinant of multiplication by a + bi on ℝ² (basis 1, i): det [[a, −b], [b, a]]. */
const determinantOfMultiplication = (a: number, b: number): number => a * a + b * b;

test("AlgebraNorm of a Gaussian integer is its determinant of multiplication, a² + b²", () => {
  for (const [a, b] of [
    [3, 4],
    [1, 1],
    [-2, 5],
    [0, 7],
  ] as const) {
    same(["AlgebraNorm", ["Complex", a, b]], determinantOfMultiplication(a, b));
  }
  same(["AlgebraNorm", 5], 5); // a real literal: the norm over ℝ
});

test("AlgebraNorm agrees on evaluate and .N(), and stays inert where no answer is justified", () => {
  expect(ce.box(["AlgebraNorm", ["Complex", 3, 4]]).N().re).toBeCloseTo(25);
  expect(ce.box(["AlgebraNorm", ["Complex", 1.5, 2]]).N().re).toBeCloseTo(6.25);
  expect(ce.box(["AlgebraNorm", "x"]).evaluate().operator).toBe("AlgebraNorm");
  // A complex coefficient beside a generator has the ambient algebra ℂ[i_1], not what the blades say.
  expect(ce.box(["AlgebraNorm", ["Add", ["Complex", 1, 1], "i_1"]]).evaluate().operator).toBe("AlgebraNorm");
});

test("AlgebraNorm agrees with the multiplication determinant on a hypercomplex element", () => {
  // 1 + 2i_1 + 3i_1i_2 on the basis 1, i_1, i_2, i_1i_2: the 4×4 matrix of multiplication, by hand.
  same(["AlgebraNorm", ["Add", 1, ["Multiply", 2, "i_1"], ["Multiply", 3, "i_1", "i_2"]]], 160);
});

test("Norm is compute-engine's: never the algebra norm", () => {
  same(["Norm", ["Complex", 3, 4]], 5);
  const onHypercomplex = ce.box(["Norm", ["Add", 3, ["Multiply", 4, "i_1"]]]).evaluate();
  // A generator is a symbol to compute-engine, so its `Norm` of a scalar is `Abs`, left unevaluated.
  expect(onHypercomplex.operator).toBe("Abs");
});
