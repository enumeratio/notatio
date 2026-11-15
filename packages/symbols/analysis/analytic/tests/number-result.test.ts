// unstable: ComputeEngine, the engine class itself; the stable entry has no constructor
import { ComputeEngine } from "@notatio/engine/unstable";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// What the shared boxed-result helper (`numberResult`) does for the kernels that call it: a
// tiny value keeps its imaginary part, a real answer on real operands stays real, a
// double overflowing or a point outside a kernel's domain stays unevaluated, and a pole the
// kernel recognizes is ComplexInfinity. The reference values are mpmath 1.3.0 at 40 digits.

const ce = new ComputeEngine();
declareAnalytic(ce);

const L = (...x: unknown[]) => ["List", ...x];
const C = (re: number, im: number) => ["Complex", re, im];
const N = (expr: unknown) => ce.box(expr as never).N();

/** Real and imaginary part each within a relative `tolerance` of the reference. */
const expectComplex = (expr: unknown, re: number, im: number, tolerance = 1e-9) => {
  const v = N(expr);
  expect(Math.abs(v.re - re) / Math.abs(re)).toBeLessThan(tolerance);
  expect(Math.abs(v.im - im) / Math.abs(im)).toBeLessThan(tolerance);
};

test("a tiny value keeps its imaginary part, at the size of the value", () => {
  expectComplex(
    ["MeijerG", L(L(31, 0.5), L()), L(L(2.2, 4.4), L()), -1e-12],
    1.876548966321225e-55,
    1.363392629916871e-55,
  );
  expectComplex(["MeijerG", L(L(), L()), L(L(2.2), L()), -1e-12], 3.220754665606253e-27, 2.34001523683463e-27);
  expectComplex(["Hypergeometric0F1Regularized", 100, C(1e-8, 1e-8)], 1.071510288232618e-156, 1.0715102882315571e-166);
  expectComplex(["Hypergeometric1F1Regularized", 31, 31, C(-1.2, 0.7)], 8.68477120282376e-34, 7.31508187111881e-34);
  expectComplex(["HypergeometricU", 31, 1.5, C(1e-8, 1e-8)], 5.183913145348554e-29, -2.150288086456326e-29);
  expectComplex(["HypergeometricUStar", 3, C(1e-12, -3), 1e-12], -2.051282051282761e-38, -2.564102564107934e-39);
});

test("a real answer on real operands stays real, near a pole of the quotient too", () => {
  // ns(1e-6 | 0.7) = 1/sn is 1e6 and its complex-arithmetic noise in im is about 8e-5.
  for (const [head, value] of [
    ["JacobiNS", 1000000.0000002834],
    ["JacobiDS", 999999.9999999334],
  ] as const) {
    const v = N([head, 1e-6, 0.7]);
    expect(v.im).toBe(0);
    expect(Math.abs(v.re - value) / value).toBeLessThan(1e-9);
  }
  for (const head of ["JacobiSN", "JacobiCN", "JacobiDN", "JacobiSC", "JacobiCS", "JacobiAmplitude", "JacobiZN"]) {
    for (const u of [0.1, 1.5])
      for (const m of [0.3, -2.5, 4.4]) {
        const v = N([head, u, m]);
        if (Number.isFinite(v.re)) expect(v.im).toBe(0); // a head may decline m outside [0, 1]
      }
  }
});

test("EisensteinG at a zero of the series is its rounding noise, a real number", () => {
  // τ = ρ (a double) is within 1e-16 of the zero of G_4 and G_8, so every digit is noise.
  for (const k of [4, 8]) {
    const v = N(["EisensteinG", k, C(-0.5, 0.8660254037844386)]);
    expect(v.im).toBe(0);
    expect(Math.abs(v.re)).toBeLessThan(1e-14);
  }
});

test("j at the zero τ = ρ is rounding noise too, a real number", () => {
  for (const head of ["ModularJ", "KleinInvariantJ"]) expect(N([head, C(-0.5, 0.8660254037844386)]).im).toBe(0);
});

test("a double overflowing, or a point outside the kernel's domain, stays unevaluated", () => {
  for (const expr of [
    ["MeijerG", L(L(), L()), L(L(100000), L()), 3],
    ["ChebyshevT", 100000, 2],
    ["ChebyshevU", 100000, 100000],
    ["HermiteH", 200, 50],
    ["KleinInvariantJ", C(2, -1)],
    ["ModularLambda", C(2, -1)],
    ["Digamma", C(1e300, 1)],
  ]) {
    const v = N(expr);
    expect(v.operator).toBe((expr as unknown[])[0]);
  }
});

test("Beta at a pole of Γ over a finite denominator is ComplexInfinity; elsewhere it is finite", () => {
  expect(N(["Beta", -2, C(0.3, 0.4)]).json).toBe("ComplexInfinity");
  expect(N(["Beta", C(0.3, 0.4), 0]).json).toBe("ComplexInfinity");
  const v = N(["Beta", C(0.3, 0.4), 1.5]);
  expect(Number.isFinite(v.re) && Number.isFinite(v.im)).toBe(true);
});
