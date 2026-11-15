import { ComputeEngine } from "@cortex-js/compute-engine";
import { JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import { expect, test } from "vite-plus/test";
import { betaIsZero } from "../src/compute-engine/numerics/beta.ts";
import { applyPatch, betaAtPole } from "../src/index.ts";

// Beta(a, b) = Γ(a)Γ(b)/Γ(a+b) is 0 where a and b are non-integers and a + b is a non-positive
// integer (mpmath 1.3.0 `beta` answers 0 at each pair below); native answers NaN on floats and
// on N of a rational pair, and in the JavaScript lowering.

const ce = new ComputeEngine();
applyPatch(ce, betaAtPole);

const ZEROS: [number, number][] = [
  [-2.5, 0.5],
  [0.5, -0.5],
  [1.5, -2.5],
  [-7.5, 4.5],
  [-0.25, -0.75],
];
// mpmath 1.3.0 beta
const FINITE: [number, number, number][] = [
  [-2.5, 0.75, -0.419349082157457],
  [2.5, 0.5, 1.178097245096172],
  [-3.25, 1.5, 0.172040649090239],
];

const compiled = new JavaScriptTarget().compile(ce.box(["Beta", "x", "y"] as never)) as {
  run: (vars: Record<string, number>) => number;
};

test("two non-integers summing to a non-positive integer give 0, not NaN", () => {
  for (const [a, b] of ZEROS) {
    const call = ce.box(["Beta", a, b] as never);
    expect(call.evaluate().is(0), `evaluate ${a}, ${b}`).toBe(true);
    expect(call.N().is(0), `N ${a}, ${b}`).toBe(true);
    expect(compiled.run({ x: a, y: b }), `compiled ${a}, ${b}`).toBe(0);
  }
});

test("exact rational operands give 0 on evaluate and on N", () => {
  const call = ce.box(["Beta", ["Rational", -5, 2], ["Rational", 1, 2]] as never);
  expect(call.evaluate().is(0)).toBe(true);
  expect(call.N().is(0)).toBe(true);
  expect(
    ce
      .box(["Beta", ["Rational", -1, 3], ["Rational", -2, 3]] as never)
      .N()
      .is(0),
  ).toBe(true);
});

test("a pair off the poles keeps native's value on every route", () => {
  for (const [a, b, value] of FINITE) {
    const call = ce.box(["Beta", a, b] as never);
    for (const got of [call.evaluate().re, call.N().re, compiled.run({ x: a, y: b })])
      expect(Math.abs(got - value) / Math.abs(value)).toBeLessThan(1e-12);
  }
});

test("a pole of Beta itself and integer pairs stay native's", () => {
  expect(
    ce
      .box(["Beta", -1, 2] as never)
      .N()
      .toString(),
  ).toBe("~oo");
  expect(betaIsZero(-2, 2)).toBe(false);
  expect(betaIsZero(2, -3)).toBe(false);
  expect(betaIsZero(0.5, 0.5)).toBe(false);
  expect(betaIsZero(-0.5, 0.25)).toBe(false);
  expect(betaIsZero(Number.NaN, 1)).toBe(false);
});
