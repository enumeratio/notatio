import type { ComputeEngine, Expression } from "@cortex-js/compute-engine";
import { BETA_IS_ZERO_SOURCE, betaIsZero } from "../numerics/beta.ts";
import { type EvalOptions, isFiniteNum, type NativeEval } from "../../support/box.ts";

// Beta(a, b) at two non-integers whose sum is a non-positive integer: Γ(a + b) is a pole in the
// denominator, so the value is 0. Native answers NaN on a float pair, and N on a rational one,
// where its Γ(a + b) is NaN; the exact `evaluate` of a rational pair already says 0.

const isExactOperand = (x: Expression): boolean => (x as Partial<{ isExact: boolean }>).isExact !== false;

/** Are `ops` two real operands with Beta(a, b) = 0? A pair of exact operands must sum to an integer exactly. */
export function betaVanishes(ce: ComputeEngine, ops: readonly Expression[]): boolean {
  const [a, b] = ops;
  if (ops.length !== 2 || a === undefined || b === undefined) return false;
  if (!isFiniteNum(a) || !isFiniteNum(b) || a.im !== 0 || b.im !== 0) return false;
  if (!betaIsZero(a.re, b.re)) return false;
  if (!isExactOperand(a) || !isExactOperand(b)) return true;
  return ce
    .function("Add", [a, b])
    .evaluate()
    .is(Math.round(a.re + b.re));
}

/** `evaluate` for Beta: 0 where the pair is at a pole of Γ(a + b), else native's answer. */
export const evaluateBeta =
  (ce: ComputeEngine) =>
  (native: NativeEval) =>
  (ops: readonly Expression[], options: EvalOptions): Expression | undefined =>
    betaVanishes(ce, ops) ? ce.Zero : native?.(ops, options);

/** JavaScript lowering of Beta: native's `_SYS.beta`, except 0 where Γ(a + b) is a pole (native is NaN there). */
export const compileBeta = (
  args: readonly Expression[],
  compile: (e: Expression) => string,
  ctx: { language?: string },
): string | undefined => {
  if (ctx.language !== "javascript" || args.length !== 2) return undefined;
  const [a, b] = args.map(compile);
  return `((a, b) => (${BETA_IS_ZERO_SOURCE})(a, b) ? 0 : _SYS.beta(a, b))(${a}, ${b})`;
};
