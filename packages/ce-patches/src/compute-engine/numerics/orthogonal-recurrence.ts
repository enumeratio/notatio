import { BigDecimal } from "@cortex-js/compute-engine";
import { type BigCx, add, atDigits, bigCx, mul, round, scale } from "./hurwitz-zeta-big.ts";

// The classical orthogonal polynomials at an integer degree n ≥ 1 and a concrete (real or complex) x, by the
// three-term recurrence in BigDecimal arithmetic (DLMF 18.9.1; the coefficients are DLMF Table 18.9.1):
//
//   T_{k+1} = 2x T_k − T_{k−1}                      T_0 = 1, T_1 = x
//   U_{k+1} = 2x U_k − U_{k−1}                      U_0 = 1, U_1 = 2x
//   H_{k+1} = 2x H_k − 2k H_{k−1}                   H_0 = 1, H_1 = 2x
//   (k+1) L_{k+1} = (2k+1+a−x) L_k − (k+a) L_{k−1}  L_0 = 1, L_1 = 1+a−x
//   (k+1) P_{k+1} = (2k+1) x P_k − k P_{k−1}        P_0 = 1, P_1 = x
//
// The recurrence is stable only where the polynomial is large: near a zero of T_n, or for L_n at a large x, the
// terms cancel. A second recurrence over the magnitudes (every coefficient and operand replaced by its absolute
// value, a bound on the size of the terms the first one adds) gives the digits the cancellation costs, and the
// working digits are raised by them; where that passes `MAX_WORKING_DIGITS`, or the value is below the noise of
// its own terms, the kernel declines.

export type OrthogonalFamily = "T" | "U" | "H" | "L" | "P";

/**
 * The highest degree the recurrence runs. The slowest call that answers is the one that carries the most working
 * digits: P_14000(0.3) at 50 digits works at about 1900 digits and takes 1.3 s (T, U and H take 0.25 s there; L_5000(3)
 * takes 0.45 s), and a call needing more than `MAX_WORKING_DIGITS` declines in about 0.1 s. At this cap the worst
 * answering call stays under the 2.5 s allowed.
 */
export const MAX_RECURRENCE_ORDER = 20_000;

/** Digits carried past the ones asked for, so the final rounding is (almost always) correct. */
const GUARD_DIGITS = 10;

/** Past this many working digits the cancellation is too costly to carry and the kernel declines. */
const MAX_WORKING_DIGITS = 2000;

/** Times a pass is repeated with the working digits its own cancellation measured. */
const MAX_PASSES = 3;

const zero = (): BigCx => bigCx(0);

const sub = (x: BigCx, y: BigCx): BigCx => ({ re: round(x.re.sub(y.re)), im: round(x.im.sub(y.im)) });

/** x / k for a whole k, rounded once. */
const divide = (x: BigCx, k: number): BigCx => ({ re: round(x.re.div(k)), im: round(x.im.div(k)) });

/** x·y, skipping the imaginary parts when both are zero (the real case, most calls). */
const times = (x: BigCx, y: BigCx): BigCx =>
  x.im.isZero() && y.im.isZero() ? { re: round(x.re.mul(y.re)), im: BigDecimal.ZERO } : mul(x, y);

/** |re| + |im|, an upper bound on the modulus that stays in BigDecimal. */
const size = (x: BigCx): BigDecimal => round(x.re.abs().add(x.im.abs()));

/** log10 of |v|'s order of magnitude: its digit count plus exponent, within 1 of log10|v|. */
const magnitude = (v: BigDecimal): number => (v.isZero() ? -Infinity : v.significand.toString().length + v.exponent);

interface Pass {
  value: BigCx;
  /** The magnitude recurrence's last value, a bound on the size of the terms of the sum. */
  bound: BigDecimal;
}

/** One run of the recurrence and its magnitude recurrence at the working digits in force. */
function run(family: OrthogonalFamily, n: number, a: BigCx, x: BigCx): Pass {
  const ax = size(x);
  const aa = size(a);
  const one = bigCx(1);
  let prev = one;
  let cur: BigCx;
  let mPrev = BigDecimal.ONE;
  let mCur: BigDecimal;
  switch (family) {
    case "T":
    case "P":
      cur = x;
      mCur = ax;
      break;
    case "L":
      cur = sub(add(one, a), x);
      mCur = round(aa.add(ax).add(1));
      break;
    default:
      cur = scale(x, new BigDecimal(2));
      mCur = round(ax.mul(2));
  }
  const two = new BigDecimal(2);
  for (let k = 1; k < n; k++) {
    let next: BigCx;
    let mNext: BigDecimal;
    // The recurrence is p_{k+1} = (α p_k − β p_{k−1}) / γ, with the magnitudes of α and β in the bound.
    if (family === "T" || family === "U") {
      next = sub(scale(times(x, cur), two), prev);
      mNext = round(ax.mul(2).mul(mCur).add(mPrev));
    } else if (family === "H") {
      next = sub(scale(times(x, cur), two), scale(prev, new BigDecimal(2 * k)));
      mNext = round(
        ax
          .mul(2)
          .mul(mCur)
          .add(mPrev.mul(2 * k)),
      );
    } else if (family === "P") {
      next = divide(sub(scale(times(x, cur), new BigDecimal(2 * k + 1)), scale(prev, new BigDecimal(k))), k + 1);
      mNext = round(
        ax
          .mul(2 * k + 1)
          .mul(mCur)
          .add(mPrev.mul(k))
          .div(k + 1),
      );
    } else {
      const alpha = sub(add(bigCx(2 * k + 1), a), x);
      const beta = add(a, bigCx(k));
      next = divide(sub(times(alpha, cur), times(beta, prev)), k + 1);
      mNext = round(
        aa
          .add(ax)
          .add(2 * k + 1)
          .mul(mCur)
          .add(aa.add(k).mul(mPrev))
          .div(k + 1),
      );
    }
    prev = cur;
    cur = next;
    mPrev = mCur;
    mCur = mNext;
  }
  return { value: cur, bound: mCur };
}

/**
 * p_n(x) to `digits` significant digits (relative to the result), or undefined where the kernel declines: a degree
 * past `MAX_RECURRENCE_ORDER`, a value too cancelled to resolve within `MAX_WORKING_DIGITS`, or a result of 0
 * (no digits to vouch for; an exact zero is the caller's exact route's).
 * `a` is the Laguerre parameter (ignored by the others).
 */
export function orthogonalRecurrence(
  family: OrthogonalFamily,
  n: number,
  a: BigCx | undefined,
  x: BigCx,
  digits: number,
): BigCx | undefined {
  if (!Number.isInteger(n) || n < 1 || n > MAX_RECURRENCE_ORDER) return undefined;
  const parameter = a ?? zero();
  const steps = Math.ceil(Math.log10(n + 1)) + 2;
  let working = digits + GUARD_DIGITS + steps;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (working > MAX_WORKING_DIGITS) return undefined;
    const outcome = atDigits(working, () => {
      const { value, bound } = run(family, n, parameter, x);
      const result = size(value);
      if (result.isZero()) return { needed: Infinity, value };
      // Digits the sum's own terms cancel, which every term's rounding error is multiplied by.
      const lost = Math.max(0, magnitude(bound) - magnitude(result) + 1);
      return { needed: digits + GUARD_DIGITS + steps + lost, value };
    });
    if (outcome.needed <= working) return outcome.value;
    // A zero or a value below its own noise: more digits only help if they were what was missing.
    if (!Number.isFinite(outcome.needed)) {
      working = working * 2;
    } else {
      working = Math.ceil(outcome.needed) + 2;
    }
  }
  return undefined;
}
