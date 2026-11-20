import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

const ce = createEngine(declareAnalytic);

// A bignum prints as `{num: "…"}`; a machine number as a plain JS number.
const isMachine = (e: { json: unknown }) => !JSON.stringify(e.json).includes('"num"');

// The bare engine keeps the precision `N(expr, d)` set, so each call restores it.
const n = (expr: unknown, digits?: number) => {
  const precision = ce.precision;
  try {
    return digits ? ce.box(["N", expr, digits] as never).evaluate() : ce.box(expr as never).N();
  } finally {
    ce.precision = precision;
  }
};

const onePlusI = ["Complex", 1, 1];

// Complex operands run Gamma, ψ, ζ and the incomplete Gamma in doubles: the composed result
// is the machine double it is, not padded to engine precision, and an explicit digit count
// past a double declines.
const doubleOnly: [string, unknown[]][] = [
  ["HarmonicNumber of a complex", ["HarmonicNumber", onePlusI]],
  ["HarmonicNumber of order r at a complex", ["HarmonicNumber", onePlusI, 2]],
  ["FallingFactorial at a complex", ["FallingFactorial", onePlusI, 1.5]],
  ["GammaRegularized at a complex", ["GammaRegularized", ["Complex", 2.5, 0.5], 1]],
  ["three-argument Gamma at a complex", ["Gamma", onePlusI, 0, 1]],
];

for (const [name, expr] of doubleOnly) {
  test(`${name} boxes as a machine number at default precision`, () => {
    const result = n(expr);
    expect(Number.isFinite(result.re)).toBe(true);
    expect(isMachine(result)).toBe(true);
  });
  test(`${name} declines past a double's digits`, () => {
    expect(n(expr, 50).operator).toBe(expr[0]);
  });
}

test("a real operand stays bignum-backed past a double", () => {
  expect(isMachine(n(["HarmonicNumber", 2.5], 30))).toBe(false);
  expect(isMachine(n(["FallingFactorial", 2.5, 1.5], 30))).toBe(false);
});

// compute-engine's AiryBiPrime answers a double whose shortest print is 14 digits. A short print
// is no sign of an exact value: the double is what a double-only kernel hands back.
test("a double that prints in fewer than 15 digits still declines past a double's digits", () => {
  expect(n(["AiryBiPrime", 0.7], 30).operator).toBe("AiryBiPrime");
});

test("an exact answer that prints short still answers", () => {
  expect(n(["Divide", 1, 4], 30).json).toEqual(0.25);
  expect(n(["Sqrt", ["Divide", 1, 4]], 30).json).toEqual(0.5);
  expect(n(["Divide", 1, 8], 30).json).toEqual(0.125);
  expect(n(["Add", ["Divide", 1, 4], ["Divide", 1, 4]], 30).json).toEqual(0.5);
});

// ζ(-2, 1/4) is exactly -1/64: a bignum that prints short, answered by both N paths.
test("a short bignum answer from a wrapped native head still answers at 30 digits", () => {
  const hurwitz = ["HurwitzZeta", -2, ["Divide", 1, 4]];
  expect(n(hurwitz, 30).re).toBe(-0.015625);
  const precision = ce.precision;
  try {
    ce.precision = 50;
    expect(ce.box(hurwitz as never).N().re).toBe(-0.015625);
  } finally {
    ce.precision = precision;
  }
});
