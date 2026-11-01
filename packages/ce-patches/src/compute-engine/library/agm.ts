import type { ComputeEngine, Expression } from "@cortex-js/compute-engine";
import { type BigCx, bigCx } from "../numerics/hurwitz-zeta-big.ts";
import { agm, agmBig } from "../numerics/agm.ts";
import { bigResult, wantsBigDigits } from "../../support/precise.ts";
import {
  declined,
  type EvalOptions,
  isFiniteNum,
  type NativeEval,
  numberResult,
  wantsNumber,
} from "../../support/box.ts";

// AGM(a, b) off the positive reals. Native evaluates a positive real pair to any precision and a
// complex or negative one on doubles, taking the right choice of root at each step (agm.ts);
// past a double's digits that answer was a double padded out, so this carries the same
// recurrence in BigDecimals and boxes both parts at the engine's precision.

/** An operand as BigDecimal parts at the engine's precision. */
const bigOperand = (ce: ComputeEngine, x: Expression): BigCx =>
  bigCx(x.bignumRe ?? ce.bignum(x.re), x.im === 0 ? 0 : (x.bignumIm ?? ce.bignum(x.im)));

/** Off the positive reals, where native's bignum route does not apply. */
const offPositiveReals = (x: Expression): boolean => x.im !== 0 || x.re < 0;

/** AGM(a, b), or AGM(1, b) for one operand (the Fungrim convention native states). */
export function evaluateAgm(
  ce: ComputeEngine,
  native: NativeEval,
  ops: readonly Expression[],
  options: EvalOptions,
): Expression | undefined {
  const [first, second] = ops.length === 1 ? [undefined, ops[0]] : ops;
  if (second === undefined || (first !== undefined && !isFiniteNum(first)) || !isFiniteNum(second)) {
    return native?.(ops, options);
  }
  if ((first !== undefined && offPositiveReals(first)) || offPositiveReals(second)) {
    if (wantsBigDigits(ce, options, ops)) {
      const value = agmBig(
        first === undefined ? bigCx(1) : bigOperand(ce, first),
        bigOperand(ce, second),
        ce.precision,
      );
      if (value === undefined) return undefined; // the digits asked for cannot be vouched for
      if (value.im.isZero()) return bigResult(ce, value.re);
      return ce.box(["Complex", ce.number(value.re).json, ce.number(value.im).json] as never);
    }
  }
  const answer = native?.(ops, options);
  if (!declined(answer, "AGM") || !wantsNumber(ops, options)) return answer;
  // Native declined a numeric request at machine precision: the same recurrence in doubles.
  const value = agm(first === undefined ? { re: 1, im: 0 } : { re: first.re, im: first.im }, {
    re: second.re,
    im: second.im,
  });
  return value === undefined ? answer : numberResult(ce, value);
}
