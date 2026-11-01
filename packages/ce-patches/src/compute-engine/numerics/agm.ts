import { BigDecimal } from "@cortex-js/compute-engine";
import { type Cx, add as cadd, mul as cmul } from "./complex-arithmetic.ts";
import { type BigCx, add as badd, atDigits, mul as bmul, round, scale } from "./hurwitz-zeta-big.ts";

// AGM(a, b) for complex a and b: a₀ = a, g₀ = b, aₙ₊₁ = (aₙ + gₙ)/2, gₙ₊₁ = ±√(aₙgₙ).
//
// The sign is the "right choice" (Cox, "The arithmetic-geometric mean of Gauss"): the root
// with |aₙ₊₁ − gₙ₊₁| ≤ |aₙ₊₁ + gₙ₊₁|, i.e. Re(gₙ₊₁·conj(aₙ₊₁)) ≥ 0. On the tie (a root on the
// imaginary axis of aₙ₊₁, as at AGM(1, b) for b < 0 on the first step) the principal root
// stays, which is the limit from above the cut along the negative reals -- Wolfram's value
// there, and the machine route's. The same recurrence runs on doubles and on BigDecimals
// through `Field`, so the two routes cannot take different roots.

/** The operations the recurrence needs, over doubles or over BigDecimals. */
interface Field<T> {
  half(x: T): T;
  add(x: T, y: T): T;
  /** Principal square root of x·y. */
  sqrtProduct(x: T, y: T): T;
  neg(x: T): T;
  /** Re(x·conj(y)), the sign of which says which of ±x is nearer y. */
  dot(x: T, y: T): number;
  /** |x − y|, as a double. */
  distance(x: T, y: T): number;
  /** |x|, as a double (or ±Infinity past a double's range). */
  size(x: T): number;
}

/** Past this many steps the iteration declines: convergence is quadratic, so ~log₂(digits) steps are needed. */
const MAX_STEPS = 200;

/**
 * The relative gap that counts as small. The error of the final average is about gap²/8, so a
 * gap of 10^−(working/2) leaves the working digits, and a double's 1e-8 leaves ~1e-16.
 */
const DOUBLE_EPS = 1e-8;

/** Past this many digits the half-width gap, 10^−(digits/2), would leave a double's range. */
const MAX_DIGITS = 500;

/** Consecutive steps with a small, shrinking gap before the limit is trusted. */
const CONFIRMING_STEPS = 2;

/**
 * AGM on `field`, or undefined if it has not converged to relative `eps` within `MAX_STEPS`.
 * Converged means `CONFIRMING_STEPS` consecutive gaps |aₙ − gₙ| ≤ eps·|aₙ|, each smaller than the
 * one before; the gap squares each step, so the last aₙ₊₁ is correct far past `eps`.
 */
function agmOn<T>(field: Field<T>, a0: T, g0: T, eps: number): T | undefined {
  let a = a0;
  let g = g0;
  let previous = Infinity;
  let confirmed = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    const next = field.half(field.add(a, g));
    let root = field.sqrtProduct(a, g);
    // Strict: a tie keeps the principal root (the limit from above the negative reals).
    if (field.dot(root, next) < 0) root = field.neg(root);
    a = next;
    g = root;
    const gap = field.distance(a, g);
    const reach = field.size(a);
    if (!Number.isFinite(gap) || !Number.isFinite(reach) || reach === 0) return undefined;
    confirmed = gap <= eps * reach && (gap < previous || gap === 0) ? confirmed + 1 : 0;
    if (confirmed >= CONFIRMING_STEPS) return field.half(field.add(a, g));
    previous = gap;
  }
  return undefined;
}

/** Principal √z in doubles; a negative real gives exactly `i√|z|`, so a tie on the imaginary axis stays a tie. */
function doubleSqrt(z: Cx): Cx {
  if (z.im === 0) return z.re < 0 ? { re: 0, im: Math.sqrt(-z.re) } : { re: Math.sqrt(z.re), im: 0 };
  const modulus = Math.hypot(z.re, z.im);
  if (z.re >= 0) {
    const re = Math.sqrt((modulus + z.re) / 2);
    return { re, im: z.im / (2 * re) };
  }
  const im = Math.sqrt((modulus - z.re) / 2);
  return { re: Math.abs(z.im) / (2 * im), im: z.im < 0 ? -im : im };
}

const doubles: Field<Cx> = {
  half: (x) => ({ re: x.re / 2, im: x.im / 2 }),
  add: cadd,
  sqrtProduct: (x, y) => doubleSqrt(cmul(x, y)),
  neg: (x) => ({ re: -x.re, im: -x.im }),
  dot: (x, y) => x.re * y.re + x.im * y.im,
  distance: (x, y) => Math.hypot(x.re - y.re, x.im - y.im),
  size: (x) => Math.hypot(x.re, x.im),
};

/** AGM(a, b) in doubles, or undefined where it does not settle (a zero or non-finite operand, or a cap hit). */
export function agm(a: Cx, b: Cx): Cx | undefined {
  if (!isUsable(a) || !isUsable(b)) return undefined;
  return agmOn(doubles, a, b, DOUBLE_EPS);
}

const isUsable = (x: Cx): boolean => Number.isFinite(x.re) && Number.isFinite(x.im) && (x.re !== 0 || x.im !== 0);

const toDouble = (x: BigDecimal): number => x.toNumber();

/** Principal √z in BigDecimals. For re < 0 the imaginary part is im/(2·Re √z), not a difference of near-equal roots. */
function bigSqrt(z: BigCx): BigCx {
  if (z.im.isZero()) {
    return z.re.isNegative()
      ? { re: BigDecimal.ZERO, im: z.re.neg().sqrt() }
      : { re: z.re.sqrt(), im: BigDecimal.ZERO };
  }
  const modulus = z.re.mul(z.re).add(z.im.mul(z.im)).sqrt();
  if (!z.re.isNegative()) {
    const re = modulus.add(z.re).div(2).sqrt();
    return { re, im: z.im.div(re.mul(2)) };
  }
  const im = modulus.sub(z.re).div(2).sqrt();
  const signed = z.im.isNegative() ? im.neg() : im;
  return { re: z.im.abs().div(im.mul(2)), im: signed };
}

const modulusOf = (z: BigCx): number => Math.hypot(toDouble(z.re), toDouble(z.im));

const bigs: Field<BigCx> = {
  half: (x) => scale(x, new BigDecimal(0.5)),
  add: badd,
  sqrtProduct: (x, y) => bigSqrt(bmul(x, y)),
  neg: (x) => ({ re: x.re.neg(), im: x.im.neg() }),
  dot: (x, y) => toDouble(round(x.re.mul(y.re).add(x.im.mul(y.im)))),
  distance: (x, y) => modulusOf({ re: x.re.sub(y.re), im: x.im.sub(y.im) }),
  size: modulusOf,
};

/** Digits carried past the ones asked for. */
const GUARD_DIGITS = 10;

/**
 * AGM(a, b) to `digits` significant digits, or undefined where it does not settle (a zero
 * operand, or the cap). Computed with guard digits and rounded once.
 *
 * The gap test runs on doubles of the gap and of |aₙ|, which is why `MAX_DIGITS` stops at 500.
 */
export function agmBig(a: BigCx, b: BigCx, digits: number): BigCx | undefined {
  const zero = (x: BigCx) => x.re.isZero() && x.im.isZero();
  if (zero(a) || zero(b)) return undefined;
  if (digits > MAX_DIGITS) return undefined;
  const working = digits + GUARD_DIGITS;
  const result = atDigits(working, () => agmOn(bigs, a, b, 10 ** -Math.ceil(working / 2)));
  return result === undefined ? undefined : { re: result.re.toPrecision(digits), im: result.im.toPrecision(digits) };
}
