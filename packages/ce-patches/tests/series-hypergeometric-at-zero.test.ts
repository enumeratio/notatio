import { ComputeEngine } from "@cortex-js/compute-engine";
import { operandsOf } from "@notatio/engine";
import { expect, test } from "vite-plus/test";
import { applyAllPatches } from "../src/index.ts";
import { monomial } from "../src/compute-engine/library/series-inverse-functions.ts";

const ce = new ComputeEngine();
applyAllPatches(ce);

const L = (...x: unknown[]) => ["List", ...x];
const series = (f: unknown, order = 3) => ce.box(["Series", f, "x", 0, order] as never);
const text = (e: { json: unknown }) => JSON.stringify(e.json);

/** The coefficients of x^0..x^order of a series, numerically, with the remainder checked. */
function coefficients(result: ReturnType<typeof series>, order: number): number[] {
  const parts = result.operator === "Add" ? operandsOf(result) : [result];
  const out = Array<number>(order + 1).fill(0);
  let remainder = false;
  for (const part of parts) {
    if (part.operator === "BigO") {
      expect(text(part)).toBe(`["BigO",["Power","x",${order + 1}]]`);
      remainder = true;
      continue;
    }
    const m = monomial(ce, part, "x");
    expect(m, text(part)).toBeDefined();
    out[m!.k] = m!.c.N().re;
  }
  expect(remainder).toBe(true);
  return out;
}

const close = (actual: number[], expected: number[]) =>
  actual.forEach((a, k) =>
    expect(Math.abs(a - expected[k]!)).toBeLessThanOrEqual(1e-13 * Math.max(1, Math.abs(expected[k]!))),
  );

test("Series of 1F1(a, b, x) is the defining sum, with its closed-form coefficients", () => {
  const result = series(["Hypergeometric1F1", "a", "b", "x"]).evaluate();
  expect(text(result)).not.toContain("Derivative");
  // the coefficient of x^n is (a)_n / ((b)_n n!)
  const at = result.subs({ a: 2, b: 5 });
  close(coefficients(at.evaluate(), 3), [1, 2 / 5, (2 * 3) / (5 * 6 * 2), (2 * 3 * 4) / (5 * 6 * 7 * 6)]);
});

test("Series of 2F1(a, b, c, x) and 0F1(b, x) at low order are their closed forms", () => {
  const two = series(["Hypergeometric2F1", "a", "b", "c", "x"], 2).evaluate().subs({ a: 1, b: 2, c: 3 });
  close(coefficients(two.evaluate(), 2), [1, 2 / 3, (1 * 2 * 2 * 3) / (3 * 4 * 2)]);
  const zero = series(["Hypergeometric0F1", "b", "x"], 2).evaluate().subs({ b: 3 });
  close(coefficients(zero.evaluate(), 2), [1, 1 / 3, 1 / (3 * 4 * 2)]);
});

test("numeric parameters match mpmath.taylor", () => {
  // mpmath.taylor(lambda x: hyper([1/2], [3/2], x), 0, 5)
  const f = ["Hypergeometric1F1", ["Rational", 1, 2], ["Rational", 3, 2], "x"];
  close(
    coefficients(series(f, 5).N(), 5),
    [1, 0.3333333333333333, 0.1, 0.023809523809523808, 0.004629629629629629, 0.0007575757575757576],
  );
  // hyper([1, 2, 3], [4, 5], x)
  const pfq = ["HypergeometricPFQ", L(1, 2, 3), L(4, 5), "x"];
  close(coefficients(series(pfq, 4).N(), 4), [1, 0.3, 0.12, 0.05714285714285714, 0.030612244897959183]);
});

test("the regularized heads divide by Γ of the lower parameters", () => {
  const r = series(["Hypergeometric1F1Regularized", ["Rational", 1, 2], ["Rational", 3, 2], "x"], 3);
  // 1/Γ(3/2) = 2/√π, then the 1F1 coefficients
  close(coefficients(r.N(), 3), [1.1283791670955126, 0.37612638903183754, 0.11283791670955126, 0.026866170645131252]);
  const three = series(["Hypergeometric3F2Regularized", 1, 2, 3, 4, 5, "x"], 2).N();
  close(coefficients(three, 2), [0.006944444444444444, 0.0020833333333333333, 0.0008333333333333334]);
});

test("a composite argument composes the series of the argument", () => {
  // hyper([1/2], [3/2], sin(x)), through x^3
  const f = ["Hypergeometric1F1", ["Rational", 1, 2], ["Rational", 3, 2], ["Sin", "x"]];
  close(coefficients(series(f).N(), 3), [1, 0.3333333333333333, 0.1, -0.031746031746031744]);
  // a polynomial argument: hyper([1, 2], [3], x + x^2)
  const g = ["Hypergeometric2F1", 1, 2, 3, ["Add", "x", ["Power", "x", 2]]];
  close(coefficients(series(g, 3).N(), 3), [1, 2 / 3, 1 / 2 + 2 / 3, 0.4 + 2 * 0.5 + 0]);
  // an even argument has only even powers
  expect(coefficients(series(["Hypergeometric1F1", 2, 3, ["Power", "x", 2]], 4).N(), 4)).toEqual([
    1,
    0,
    2 / 3,
    0,
    1 / 4,
  ]);
});

test("evaluate, .N(), the parse route and Normal agree", () => {
  const f = ["Hypergeometric1F1", ["Rational", 1, 2], ["Rational", 3, 2], "x"];
  const exact = series(f).evaluate();
  expect(text(exact)).not.toContain("Derivative");
  const parsed = ce.parse("\\operatorname{Series}(\\operatorname{Hypergeometric1F1}(1/2, 3/2, x), x, 0, 3)").evaluate();
  expect(text(parsed)).toBe(text(exact));
  expect(coefficients(series(f).N(), 3)[3]).toBeCloseTo(0.023809523809523808, 14);
  const normal = ce.box(["Normal", ["Series", f, "x", 0, 3]] as never).evaluate();
  expect(text(normal)).not.toContain("BigO");
  expect(text(normal)).not.toContain("Derivative");
  expect(Math.abs(normal.subs({ x: 0.5 }).N().re - (1 + 1 / 6 + 0.025 + 0.023809523809523808 / 8))).toBeLessThan(1e-13);
});

test("the cases it does not take go to native", () => {
  // a lower parameter at a pole, not cancelled
  expect(text(series(["Hypergeometric1F1", 1, -1, "x"]).evaluate())).toContain("Derivative");
  // an argument not vanishing at 0, and a point other than 0
  expect(text(series(["Hypergeometric1F1", 1, 2, ["Add", "x", 1]]).evaluate())).toContain("Derivative");
  expect(text(ce.box(["Series", ["Hypergeometric1F1", 1, 2, "x"], "x", 1, 2] as never).evaluate())).toContain(
    "Derivative",
  );
  // a pole of the regularized head's Γ is native's too
  expect(text(series(["Hypergeometric1F1Regularized", 1, -1, "x"]).evaluate())).toContain("Derivative");
});

test("an upper parameter that cancels a lower pole is dropped with it", () => {
  // 1F1(-2, -2; x) = e^x
  close(coefficients(series(["Hypergeometric1F1", -2, -2, "x"], 4).N(), 4), [1, 1, 1 / 2, 1 / 6, 1 / 24]);
});
