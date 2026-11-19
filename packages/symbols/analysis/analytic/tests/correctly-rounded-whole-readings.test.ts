// unstable: a bare engine to declare the analytic library against
import { ComputeEngine } from "@notatio/engine/unstable";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// A value past its digits is a whole number to a decimal: BesselK(300, 2) is 5.08e611, so at 70 or
// 370 digits its reading has no fraction. Ziv's loop took such a reading for an exact integer, never
// rounded it, found no two readings alike and answered the finest one, 370 digits for 50 asked.

const significantDigits = (json: unknown): number => {
  const text = (json as { num?: string }).num ?? String(json);
  return text.replace(/e.*$/i, "").replace(/[-.]/g, "").length;
};

test("N(x, d) of a value past d digits carries d digits", () => {
  const ce = new ComputeEngine();
  declareAnalytic(ce);
  const value = ce.box(["N", ["BesselK", 300, 2], 50] as never).evaluate();
  expect(significantDigits(value.json)).toBe(50);
  expect(ce.precision).toBe(new ComputeEngine().precision);
});
