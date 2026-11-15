// `Rationalize(x, dx)` for a concrete positive dx (packages/symbols/analysis/analytic/src/precision-113.ts,
// PR #146) is ours; `Rationalize(x, 0)` is compute-engine's, which reads a literal as the decimal
// written. This checks both answer in either declaration order.
import { ComputeEngine } from "@cortex-js/compute-engine";
import { declareAnalytic } from "@notatio/analytic";
import { declareCollections } from "@notatio/combinatorics/collections";
import { expect, test } from "vite-plus/test";

function engineWith(order: readonly ((ce: ComputeEngine) => void)[]): ComputeEngine {
  const ce = new ComputeEngine();
  for (const declare of order) declare(ce);
  return ce;
}

for (const [label, order] of [
  ["analytic then collections", [declareAnalytic, declareCollections]],
  ["collections then analytic", [declareCollections, declareAnalytic]],
] as const) {
  test(`Rationalize(x, dx) answers and Rationalize(x, 0) is native's, declared ${label}`, () => {
    const ce = engineWith(order);

    const tolerance = ce.box(["Rationalize", "Pi", 0.01] as never).evaluate().json;
    expect(tolerance).toEqual(["Rational", 22, 7]);

    // A zero tolerance is native's: the decimal as written (0.1 is 1/10), not the double's dyadic value.
    expect(ce.box(["Rationalize", 0.1, 0] as never).evaluate().json).toEqual(["Rational", 1, 10]);

    // An already-exact x is returned unchanged at dx = 0, same as at dx > 0.
    expect(ce.box(["Rationalize", 2, 0] as never).evaluate().json).toBe(2);
  });
}
