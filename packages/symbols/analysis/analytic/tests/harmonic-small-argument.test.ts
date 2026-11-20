import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// H(z, r) = ζ(r) − ζ(r, z+1) is about z·ζ(r+1) for small z; the difference of two nearly equal
// zetas loses every digit there, so the Taylor series answers. Values are mpmath's.

const ce = createEngine(declareAnalytic);

const nDigits = (expr: unknown, digits: number): string => {
  const precision = ce.precision;
  try {
    const value = ce.box(["N", expr, digits] as never).evaluate();
    return (value.json as { num: string }).num;
  } finally {
    ce.precision = precision;
  }
};

const small = { num: "1e-20" };

test("H(1e-20, 2) answers to the digits asked", () => {
  expect(nDigits(["HarmonicNumber", small, 2], 30)).toBe("2.40411380631918857076700662601e-20");
  expect(nDigits(["HarmonicNumber", small, 2], 50)).toBe("2.4041138063191885707670066260115658357849072448868e-20");
});

test("the same value through plain evaluate and N(), float and exact operands", () => {
  const want = 2.404113806319189e-20;
  const float = ["HarmonicNumber", 1e-20, 2];
  expect(ce.box(float as never).evaluate().re / want).toBeCloseTo(1, 14);
  expect(ce.box(float as never).N().re / want).toBeCloseTo(1, 14);
  const exact = ["HarmonicNumber", ["Rational", 1, 100000000000000000000], 2];
  expect(ce.box(exact as never).N().re / want).toBeCloseTo(1, 14);
});

test("a negative order is Faulhaber's polynomial, with no cancellation either", () => {
  // H(z, −3) = z²(z+1)²/4
  const value = ce.box(["N", ["HarmonicNumber", { num: "1e-40" }, -3], 30] as never).evaluate();
  expect(value.re / 2.5e-81).toBeCloseTo(1, 14);
});

test("the sign of z is carried: H(-1e-20, 2) is negative", () => {
  expect(ce.box(["HarmonicNumber", -1e-20, 2] as never).N().re).toBeLessThan(0);
});
