import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import {
  bernoulliPolyAt,
  bernoulliPolyAtComplex,
  bernoulliPolyExpr,
} from "../compute-engine/numerics/bernoulli-rational.ts";
import type { BoxInput } from "./box.ts";
import { isFiniteNum, isRealInt, numberResult } from "./box.ts";
import { cx } from "../compute-engine/numerics/complex-arithmetic.ts";

// BernoulliPolynomial(n, x) — Fungrim's name for Bernoulli polynomials B_n(x),
// evaluated exactly for symbolic x and by Horner's rule for a numeric one.

/**
 * The largest degree evaluated. The exact coefficients come from the tangent numbers, whose
 * recurrence costs n² big-integer steps (n = 1000 takes 0.1 s, n = 5000 over 15 s).
 */
const MAX_BERNOULLI_ORDER = 1000;

export function evaluateBernoulliPolynomial(
  ce: ComputeEngine,
  n: Expression,
  x: Expression,
  numeric: boolean,
): Expression | undefined {
  if (!isRealInt(n) || n.re < 0 || n.re > MAX_BERNOULLI_ORDER) return undefined;

  if (numeric && isFiniteNum(x)) {
    if (x.im === 0) return numberResult(ce, cx(bernoulliPolyAt(n.re, x.re)));
    const { re, im } = bernoulliPolyAtComplex(n.re, x.re, x.im);
    return numberResult(ce, cx(re, im));
  }

  // B_n(x) as a MathJSON polynomial. Never the native BernoulliB(n, x): BernoulliB is wrapped
  // to delegate here, so that route recurses without end.
  const poly = ce.box(bernoulliPolyExpr(n.re, x.json as never) as unknown as BoxInput);
  return numeric ? poly.N() : poly.evaluate();
}
