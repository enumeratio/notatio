import { BigDecimal, type Expression } from "@cortex-js/compute-engine";
import { MIN_NORMAL } from "./box.ts";

// Branch tests on an operand's exact value. `x.re` and `x.im` are doubles, so a decimal with
// more digits than a double reads as its nearest double: 1 + 1e-20 is 1, and 1e-400 is 0. A test
// that decides a case (a special point, an integer, a sign) asks the bignum where there is one;
// where the operand has no bignum its double is its value.

/** Whether the real part is exactly `value`. */
export const reEquals = (x: Expression, value: number): boolean =>
  x.re === value && (x.bignumRe === undefined || x.bignumRe.eq(value));

/** Whether the imaginary part is exactly `value`. */
export const imEquals = (x: Expression, value: number): boolean =>
  x.im === value && (x.bignumIm === undefined || x.bignumIm.eq(value));

/** Whether the operand is exactly the real number `value`. */
export const isExactly = (x: Expression, value: number): boolean => imEquals(x, 0) && reEquals(x, value);

/** Whether the operand is exactly 0 (a nonzero value below the double's range is not). */
export const isExactZero = (x: Expression): boolean => isExactly(x, 0);

/** Whether the operand has no imaginary part (one below the double's range is a part). */
export const isExactReal = (x: Expression): boolean => imEquals(x, 0);

/** The sign of the real part, from the bignum where there is one (0 only for an exact 0). */
export const reSign = (x: Expression): -1 | 0 | 1 =>
  x.bignumRe !== undefined ? x.bignumRe.cmp(0) : Math.sign(x.re) > 0 ? 1 : Math.sign(x.re) < 0 ? -1 : 0;

/** The sign of the imaginary part, from the bignum where there is one (0 only for an exact 0). */
export const imSign = (x: Expression): -1 | 0 | 1 =>
  x.bignumIm !== undefined ? x.bignumIm.cmp(0) : Math.sign(x.im) > 0 ? 1 : Math.sign(x.im) < 0 ? -1 : 0;

/** Whether the real part is greater than the integer `value`, exactly. */
export const reExceeds = (x: Expression, value: number): boolean =>
  x.bignumRe !== undefined ? x.bignumRe.gt(value) : x.re > value;

/**
 * Whether a part of the operand has digits its double lacks (1 + 1e-20 reads as 1). A kernel or a native
 * handler that reads the double can take the operand for a special point; one that answers an
 * infinity or NaN there, where the exact operand is regular, has read the double.
 */
export const readsDifferently = (x: Expression): boolean => {
  const differs = (big: Expression["bignumRe"], d: number): boolean =>
    big !== undefined && big.isFinite() && Number.isFinite(d) && !new BigDecimal(d).eq(big);
  return differs(x.bignumRe, x.re) || differs(x.bignumIm, x.im);
};

/**
 * The most digits a result carries when it is read at an operand below the double's range as the value
 * at 0. A function analytic at 0 differs from it by about the operand times a modest coefficient, so a
 * part under 1e-308 moves a result by under 1e-300 relative; past this many digits the answer declines.
 */
export const UNDERFLOW_SAFE_DIGITS = 300;

/**
 * Whether a part of the operand is nonzero but not a double: it underflows (below the smallest normal
 * double, where a double keeps fewer than 53 digits and then flushes to 0) or overflows. A kernel
 * that reads the operand as a double reads that part as 0 or ∞, and declines instead.
 */
export const hasUnreadablePart = (x: Expression): boolean => {
  const unreadable = (big: Expression["bignumRe"], d: number): boolean =>
    big !== undefined && big.isFinite() && !big.isZero() && !(Math.abs(d) >= MIN_NORMAL && Number.isFinite(d));
  return unreadable(x.bignumRe, x.re) || unreadable(x.bignumIm, x.im);
};
