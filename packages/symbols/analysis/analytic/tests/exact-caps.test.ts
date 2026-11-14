import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

const ce = createEngine(declareAnalytic);

// An exact sum or product that grows without bound in its argument stops at a cap: past it the
// call stays unevaluated (or, where a numeric kernel exists, answers a number), in well under a
// second. Each used to run for minutes.

const started = <T>(run: () => T): { value: T; ms: number } => {
  const t = performance.now();
  const value = run();
  return { value, ms: performance.now() - t };
};

test("Digamma and HarmonicNumber at a large integer stay exact-symbolic, and N answers", () => {
  for (const head of ["Digamma", "HarmonicNumber"]) {
    const exact = started(() => ce.box([head, 100000]).evaluate());
    expect(exact.value.operator).toBe(head);
    expect(exact.ms).toBeLessThan(1000);
  }
  // ψ(10⁶) = 13.81551005796419077077461538748… (mpmath).
  const psi = started(() => ce.box(["N", ["Digamma", 1000000]]).evaluate());
  expect(psi.value.re).toBeCloseTo(13.815510057964191, 12);
  expect(psi.ms).toBeLessThan(1000);
  // H(10⁵) = ψ(10⁵ + 1) + γ = 12.0901461298634279… (mpmath).
  const harmonic = started(() => ce.box(["N", ["HarmonicNumber", 100000]]).evaluate());
  expect(harmonic.value.re).toBeCloseTo(12.090146129863427, 11);
  expect(harmonic.ms).toBeLessThan(1000);
});

test("the exact value is kept up to the cap", () => {
  expect(ce.box(["HarmonicNumber", 10]).evaluate().json).toEqual(["Rational", 7381, 2520]);
  expect(ce.box(["Digamma", 10]).evaluate().operator).toBe("Add");
});

test("Hyperfactorial at a large integer stays unevaluated", () => {
  const big = started(() => ce.box(["Hyperfactorial", 100000]).evaluate());
  expect(big.value.operator).toBe("Hyperfactorial");
  expect(big.ms).toBeLessThan(1000);
  expect(ce.box(["Hyperfactorial", 4]).evaluate().json).toBe(27648);
});
