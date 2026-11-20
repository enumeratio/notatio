import type { Expression, ComputeEngine } from "@notatio/engine/unstable";
import type { Json } from "@notatio/ce-patches";
import { type OrthogonalFamily, bigBox, bigCx, isFiniteNum, orthogonalRecurrence } from "@notatio/ce-patches";

// An orthogonal polynomial at an exact degree n ≥ 1 and a concrete x, from the exact operands: the three-term
// recurrence in bignums (`orthogonalRecurrence`) at the digits the engine carries, answering to them or declining.

/** An operand as the BigDecimals it holds: its bignum, else the double. */
const operand = (x: Expression) => bigCx(x.bignumRe ?? x.re, x.bignumIm ?? x.im);

/**
 * p_n(x) (`a` is Laguerre's parameter) boxed at the engine's precision, or undefined where the kernel declines, a
 * result is 0 (an exact route's to confirm) or the call is not a bignum one (`big` false).
 */
export function orthogonalBig(
  ce: ComputeEngine,
  big: boolean,
  family: OrthogonalFamily,
  index: number,
  a: Expression | undefined,
  x: Expression,
): Expression | undefined {
  if (!big || !isFiniteNum(x) || (a !== undefined && !isFiniteNum(a))) return undefined;
  const r = orthogonalRecurrence(family, index, a === undefined ? undefined : operand(a), operand(x), ce.precision);
  if (r === undefined) return undefined;
  const digits = (v: typeof r.re): Json => ({ num: v.toPrecision(ce.precision).toString() });
  return bigBox(
    r.im.isZero()
      ? ce.number(r.re.toPrecision(ce.precision))
      : ce.box(["Complex", digits(r.re), digits(r.im)] as never),
  );
}
