import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { operandsOf } from "@notatio/engine";
import {
  type EvalOptions,
  exceedsDoublePrecision,
  isExactZero,
  isFiniteNum,
  numberResult,
  vouchesWhenComplex,
  wantsNumber,
  cx,
  type Cx,
} from "@notatio/ce-patches";
import { pfqSeries } from "./hypergeometric.ts";

// HypergeometricPFQ(upper, lower, z) = pFq(upper; lower; z), the general series — built
// directly on `pfqSeries` from hypergeometric.ts (already generic in the operand counts;
// only the 0F1/1F1/2F1/3F2 Regularized forms needed their own declarations there). Three
// cases have exact closed forms Wolfram documents and this keeps exact, symbolic z included,
// ahead of the numeric series: 0F0(;;z) = e^z, 1F0(a;;z) = (1−z)^(−a), and pFq(…; 0) = 1 for
// any parameter lists (the series' own first term, before any convergence question arises).
// Otherwise: p ≤ q converges for any z; p = q + 1 only inside the unit disc (declined outside,
// per the same policy as the Regularized forms — no analytic continuation attempted here).

const mag = (z: Cx): number => Math.hypot(z.re, z.im);

const listOf = (expr: Expression | undefined): readonly Expression[] =>
  expr?.operator === "List" ? operandsOf(expr) : [];

// pFq(…; z) is 1 + O(z): the exact 0 gives exactly 1. A z below the double's range reads as 0 in the
// double series below, which answers a double (1 to its 16 digits, as the value is).
const isZero = isExactZero;

export function declareHypergeometricPFQ(ce: ComputeEngine): void {
  ce.declare("HypergeometricPFQ", {
    signature: "(list, list, number) -> number",
    evaluate: (ops: readonly Expression[], options: EvalOptions) => {
      const [upperExpr, lowerExpr, z] = ops;
      if (upperExpr === undefined || lowerExpr === undefined || z === undefined) return undefined;
      const upper = listOf(upperExpr);
      const lower = listOf(lowerExpr);

      if (upper.length === 0 && lower.length === 0) {
        const expr = ce.function("Power", ["ExponentialE", z]);
        return wantsNumber(ops, options) ? expr.N() : expr.evaluate();
      }
      if (upper.length === 1 && lower.length === 0) {
        const expr = ce.function("Power", [ce.function("Subtract", [ce.One, z]), ce.function("Negate", [upper[0]])]);
        return wantsNumber(ops, options) ? expr.N() : expr.evaluate();
      }
      if (isZero(z)) return ce.One; // the series' own leading term — true for any lists

      if (!wantsNumber(ops, options)) return undefined;
      // The series below runs in doubles: past a double's digits it declines rather than print them as more.
      if (exceedsDoublePrecision(ce, options.numericApproximation)) return undefined;
      if (!isFiniteNum(z) || upper.some((o) => !isFiniteNum(o)) || lower.some((o) => !isFiniteNum(o))) return undefined;
      const upperCx = upper.map((o) => cx(o.re, o.im));
      const lowerCx = lower.map((o) => cx(o.re, o.im));
      const zCx = cx(z.re, z.im);
      if (upperCx.length > lowerCx.length + 1) return undefined; // divergent series in general
      if (upperCx.length === lowerCx.length + 1 && mag(zCx) >= 1) return undefined; // outside the disc
      const r = pfqSeries(upperCx, lowerCx, zCx);
      return r === undefined ? undefined : numberResult(ce, r, vouchesWhenComplex([...upper, ...lower, z]));
    },
  });
}
