import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { compileExpression } from "@notatio/engine/compiled";
import { declareNumerals } from "@notatio/numerals";
import { declareNumberTheory } from "../src/declare.ts";

// Factorization(n) is FactorInteger's answer in the head's own form; the examples on the head's
// record hold its values, so this holds the two heads together on every route.

const ce = createEngine(declareNumerals, declareNumberTheory);

/** FactorInteger's `List(Tuple(base, exponent), …)` as `Factorization(Tuple(List(bases), List(exponents)))`. */
const asFactorization = (pairs: unknown): unknown => {
  const rows = (pairs as unknown[]).slice(1) as [string, unknown, unknown][];
  return ["Factorization", ["Tuple", ["List", ...rows.map((r) => r[1])], ["List", ...rows.map((r) => r[2])]]];
};

test.each([360, 97, 1, -12, 2 ** 20, 1001])("Factorization(%d) is FactorInteger's answer, on evaluate and N", (n) => {
  const factors = ce.box(["FactorInteger", n] as never).evaluate().json;
  expect(ce.box(["Factorization", n] as never).evaluate().json).toEqual(asFactorization(factors));
  expect(ce.box(["Factorization", n] as never).N().json).toEqual(asFactorization(factors));
});

test("a symbol or a non-integer stays unevaluated", () => {
  expect(ce.box(["Factorization", "x"] as never).evaluate().json).toEqual(["Factorization", "x"]);
  expect(ce.box(["Factorization", ["Rational", 1, 2]] as never).evaluate().operator).not.toBe("Tuple");
});

test("the Tuple form is held as before", () => {
  const held = ["Factorization", ["Tuple", ["List", 2, 3], ["List", 3, 1]]];
  expect(ce.box(held as never).evaluate().json).toEqual(held);
});

test("a factorization does not compile", () => {
  expect(compileExpression(ce.box(["Factorization", 360] as never))).toBeUndefined();
});
