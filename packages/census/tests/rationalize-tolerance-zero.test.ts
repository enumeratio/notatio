// Rationalize(x, 0) stays compute-engine's: a literal is the decimal written, so 0.1 gives
// 1/10 (CE#540). The positive-tolerance wrapper in analytic (precision-113.ts) must decline
// dx = 0 and leave it native.
import { ComputeEngine } from "@cortex-js/compute-engine";
import { declareAnalytic } from "@notatio/analytic";
import { expect, test } from "vite-plus/test";

test("Rationalize(x, dx) answers a tolerance and leaves dx = 0 to native", () => {
  const ce = new ComputeEngine();
  declareAnalytic(ce);

  expect(ce.box(["Rationalize", "Pi", 0.01] as never).evaluate().json).toEqual(["Rational", 22, 7]);
  expect(ce.box(["Rationalize", 0.1, 0] as never).evaluate().json).toEqual(["Rational", 1, 10]);
  expect(ce.box(["Rationalize", 2, 0] as never).evaluate().json).toBe(2);
});
