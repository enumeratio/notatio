import { type BigDecimal, type Expression, ComputeEngine, isNumber } from "@cortex-js/compute-engine";
import { clearKernelZero, doubleBox, inexactComplex, isBigBox, isDoubleBox, takeKernelZero } from "./box.ts";

/** Above this many digits a double is no longer the limiting factor — and neither should we be. */
export const DOUBLE_DIGITS = 15;

/** The analytic package's `N(expr, d)` (correctly-rounded.ts) reads `expr` at `d + 20` then
 * `d + 10`, and a decline on EITHER reading declines the whole `N()`, so the binding constraint
 * is the higher, `d + 20`. Compute-engine's own `N(expr, d)` reads once at `max(21, d + 5)` and
 * slips under this band for d up to 30, so the override also declines by the answer: a leaf of a
 * double's digits that is no exact value is a double-only kernel's (`hasDoubleOnly`), also when
 * the kernel boxes a complex result as a pair of doubles. A one-operand `N(expr)` runs at the
 * engine's configured precision, well under it. */
const REQUESTED_DIGITS_GUARD = 20;

/**
 * A kernel with no bignum companion should decline (stay symbolic under `N()`, per
 * "decline rather than answer wrong") once more digits than a double can supply were
 * explicitly asked for — printing a double's ~17 correct digits as if they were the 50
 * requested is silently wrong, not merely imprecise. A plain `N(expr)` at the engine's own
 * default precision (which already exceeds `DOUBLE_DIGITS` on its own) is unaffected: only
 * an explicit `N(expr, d)` with `d > DOUBLE_DIGITS` pushes `ce.precision` past the guard
 * band this checks.
 */
export const exceedsDoublePrecision = (ce: ComputeEngine, numericApproximation: boolean | undefined): boolean =>
  (numericApproximation ?? false) && ce.precision > DOUBLE_DIGITS + REQUESTED_DIGITS_GUARD;

/** A float literal operand that carries no more digits than a machine double holds (`0.5`, not `1/3` widened by `N`). */
const isFloatLiteral = (x: Expression): boolean =>
  (x as Partial<{ isExact: boolean }>).isExact === false &&
  [x.bignumRe, x.bignumIm].every((part) => part === undefined || part.toPrecision(DOUBLE_DIGITS + 2).eq(part));

/** The most digits a double's shortest print runs to. */
const MAX_DOUBLE_PRINT = 17;

/** Digits short of the precision asked for, below which a printed run of a double's digits is no
 * bignum's: one that honours the precision fills it. */
const FILLED_GUARD = 10;

/** Significant digits a decimal prints, whether the print ends in an exponent, and its two halves. */
function printOf(part: BigDecimal): { digits: number; exponent: boolean; whole: string; fraction: string } {
  const [mantissa = "", exponent] = part.abs().toString().split("e");
  const [whole = "", fraction = ""] = mantissa.split(".");
  return { digits: (whole.replace(/^0+/, "") + fraction).length, exponent: exponent !== undefined, whole, fraction };
}

/** Does a bignum part read as a double's shortest print? From 15 to 17 digits it does; fewer, only
 * when no dyadic fraction (`0.25`, `0.5`) stands behind it: `0.65440591917214` is a double's print,
 * `0.25` a value a double holds exactly. */
function readsAsDouble(part: BigDecimal): boolean {
  const { digits, exponent, whole, fraction } = printOf(part);
  if (digits > MAX_DOUBLE_PRINT) return false;
  if (digits >= DOUBLE_DIGITS) return true;
  return !exponent && BigInt(whole + fraction) % 5n ** BigInt(fraction.length) !== 0n;
}

/**
 * Is the number `x` a machine double rather than a bignum that happens to print short? Decided by
 * kind wherever the kind can be read: a real with no bignum behind it is compute-engine's own
 * double (`AiryBiPrime(0.7)`), and a number our kernels boxed from a double is recorded as one
 * (`doubleBox`); a precision-honouring head's bignum is neither, however few digits it prints
 * (`1/4`, `-1/64`). A whole number is decided the same way: one a double kernel boxed, or a float with
 * no bignum behind it, is a double, and an exact integer (`ce.number(3)` from an exact route, a bignum
 * integer) is not.
 *
 * Anywhere else the kind is gone, and the print is all there is:
 *  - a bignum part printing a run of a double's digits (15 up to `precision - 10`) is a double's;
 *  - so is a complex part reading as a double's shortest print (`readsAsDouble`), since compute-engine
 *    keeps a bignum behind each part of a complex however it was built. That also declines an exact
 *    complex answer no double kernel boxed whose part prints as short as a double's (`0.1 + 0.3i`):
 *    declining is the safe side.
 *
 * `answer` is false for an operand of a call left unevaluated (`1.2` in `F(…, 1.2)`): it is an
 * input, never read by kind, and only a long double-like run of digits in it counts.
 */
export function isMachineNumber(x: Expression, precision: number, answer = true): boolean {
  if (!isNumber(x)) return false;
  // A double kernel's answer is a double whatever it rounded to: 1 for a value of 1 + 5e-401 is no exact 1. The kind is
  // read before exactness, since compute-engine boxes a whole-valued double as the exact integer.
  if (answer && isDoubleBox(x)) return Number.isFinite(x.re) && Number.isFinite(x.im);
  if (answer && isBigBox(x)) return false;
  if ((x as Partial<{ isExact: boolean }>).isExact === true) return false;
  if (answer && x.im === 0 && x.bignumRe === undefined) return Number.isFinite(x.re);
  const complex = x.im !== 0;
  return [x.bignumRe, x.bignumIm].some((part) => {
    if (part === undefined || !part.isFinite() || part.isInteger()) return false;
    const { digits } = printOf(part);
    return (digits >= DOUBLE_DIGITS && digits < precision - FILLED_GUARD) || (answer && complex && readsAsDouble(part));
  });
}

/**
 * compute-engine's default `precision`. Read when the module loads: constructing an engine resets
 * the bignum precision every engine shares, while an engine's own `precision` keeps reporting (and
 * ignoring a set to) the value it had, so an engine built inside a numeric call would leave that
 * call's first answer at the default's digits.
 */
export const DEFAULT_PRECISION: number = new ComputeEngine().precision;

/**
 * Should a bignum kernel answer this numeric call? It must be a numeric request past a double's
 * digits. `N(…, d)` runs `evaluate` at d + 20 then d + 10, so every d past a double's is covered
 * only if the gate is the plain precision, not `exceedsDoublePrecision`'s guard band. But a plain
 * `N()` runs at the engine's default precision, which is past a double's too, and a machine-float
 * operand there keeps the float answer it asks for.
 */
export const wantsBigDigits = (
  ce: ComputeEngine,
  options: { readonly numericApproximation?: boolean },
  ops: readonly Expression[],
): boolean => {
  if (!(options.numericApproximation ?? false) || ce.precision <= DOUBLE_DIGITS) return false;
  return !(ce.precision === DEFAULT_PRECISION && ops.some(isFloatLiteral));
};

/**
 * `compute()` for a route that may fall through to a double kernel: its answer stands unless more
 * digits than a double's were asked for (`exceedsDoublePrecision`) and the answer carries no more
 * than a double's, in which case the call stays unevaluated. A bignum answer, an exact one and a
 * machine-precision call pass through. (A machine double is what `isMachineNumber` reads.)
 *
 * `evaluate()` with a float operand is a numeric call at the engine's precision, the same as `.N()`, so
 * it declines alike when `ops` holds a float: `LaguerreL(1, 0.50000000000000000001)` is no machine 0.5.
 */
export function declineMachineAnswer(
  ce: ComputeEngine,
  numericApproximation: boolean | undefined,
  compute: () => Expression | undefined,
  ops: readonly Expression[] = [],
): Expression | undefined {
  clearKernelZero();
  const value = compute();
  if (value === undefined || !exceedsDoublePrecision(ce, numericApproximation || hasFloatOperand(ops))) return value;
  // A double kernel's 0 is a double's: LaguerreL(1, 1 + 1e-20) is -1e-20, which the kernel reads as 1 - 1.
  if (isNumber(value) && value.re === 0 && value.im === 0 && takeKernelZero()) return undefined;
  return isMachineNumber(value, ce.precision) ? undefined : value;
}

/** An operand with a nonzero imaginary part: compute-engine's complex Gamma, Cos, … run in doubles. */
export const hasComplexOperand = (ops: readonly Expression[]): boolean =>
  ops.some((op) => Number.isFinite(op.re) && Number.isFinite(op.im) && op.im !== 0);

/** An operand written as a machine float (`2.5`, not `5/2`): the caller asked for a float answer. */
export const hasFloatOperand = (ops: readonly Expression[]): boolean =>
  ops.some(
    (op) => (op as Partial<{ isExact: boolean }>).isExact === false && Number.isFinite(op.re) && Number.isFinite(op.im),
  );

/**
 * `value` as the machine number it really is. Arithmetic over a double kernel's output
 * (a Gamma ratio, a sum with EulerGamma) is carried out in bignums and comes back padded to
 * the engine's precision, printing ~20 digits of which ~16 are right. Boxing the double
 * itself, as the kernels do, prints only what it holds.
 */
export function asDouble(ce: ComputeEngine, value: Expression): Expression {
  if (!isNumber(value) || !Number.isFinite(value.re) || !Number.isFinite(value.im)) return value;
  return value.im === 0 ? doubleBox(ce.number(value.re)) : inexactComplex(ce, value.re, value.im);
}

/**
 * `compute()` for a route that runs on double-only kernels: declined once an explicit digit
 * count passes a double's, else boxed as a machine number rather than padded to engine
 * precision. An exact zero (a Gamma pole in a denominator) has no digits to back, so it stands.
 */
export function inDoubles(
  ce: ComputeEngine,
  options: { readonly numericApproximation?: boolean },
  compute: () => Expression | undefined,
): Expression | undefined {
  const value = compute();
  if (value === undefined) return undefined;
  if (isNumber(value) && value.re === 0 && value.im === 0) return value;
  return exceedsDoublePrecision(ce, options.numericApproximation) ? undefined : asDouble(ce, value);
}

/**
 * `compute()` for a bignum-backed route called as plain `evaluate()`: a float operand gets the
 * float answer it asked for (a double, not 21 digits of which the last few are noise). Under
 * `N()` the operands are already numericized, so a float there cannot be told from an exact
 * input, and the engine's precision stands.
 */
export function doublesForFloats(
  ce: ComputeEngine,
  ops: readonly Expression[],
  options: { readonly numericApproximation?: boolean },
  compute: () => Expression | undefined,
): Expression | undefined {
  const value = compute();
  return value === undefined || options.numericApproximation || !hasFloatOperand(ops) ? value : asDouble(ce, value);
}

/** `inDoubles` when an operand is complex (a head whose real route is bignum-backed), else `compute()` as is. */
export function inDoublesIfComplex(
  ce: ComputeEngine,
  ops: readonly Expression[],
  options: { readonly numericApproximation?: boolean },
  compute: () => Expression | undefined,
): Expression | undefined {
  return hasComplexOperand(ops) ? inDoubles(ce, options, compute) : compute();
}

/**
 * Once a periodic double-only kernel's argument spans more than this many periods, `value`'s
 * OWN double rounding (`ulp(value) ~ |value|·2^-52`) already exceeds a period, so the reduced
 * position within it is rounding noise, not signal — no digit count can rescue that. Measured
 * against mpmath at the reported bug (`JacobiCD(10^16, 2/7)`, ~1.5·10^15 periods: wrong even
 * in sign next to a sibling head at the same scale) and at the boundary, holding steady across
 * three unrelated families (a Jacobi pq kernel, `EllipticTheta`, `ModularLambda`, each checked
 * on its own period): at 10^6 periods each still agrees with mpmath to ~9-10 digits; at 10^7,
 * only ~8-9 — already short of the loosest tolerance (1e-9) this family uses anywhere. Kept at
 * a clean order of magnitude below that crossover for margin.
 */
export const MAX_PERIODS_FOR_DOUBLE = 1e6;

/** `value`'s own double rounding has already swallowed more than `maxPeriods` worth of
 * `period` — declining is safer than returning a reduced position that's pure rounding noise.
 * `false` (never decline) for a non-finite or non-positive `period`, e.g. a family's own
 * period computation didn't converge or doesn't apply at this operand. */
export const periodsExceedDouble = (value: number, period: number, maxPeriods = MAX_PERIODS_FOR_DOUBLE): boolean =>
  Number.isFinite(value) && Number.isFinite(period) && period > 0 && Math.abs(value) / period > maxPeriods;

/**
 * Below this many multiples of `1/Im(τ)`, a modular kernel's own SL2(Z) reduction
 * (`reduceToFundamentalDomain`, modular.ts) is climbing toward a genuine cusp asymptotic —
 * the true value there really does grow roughly like `exp(π/Im τ)` (checked against mpmath:
 * `ModularLambda` matches it to ~14-16 digits well past this), not a numerical artifact. But
 * that same growth costs a double kernel digits just as fast once τ is close enough to the
 * real axis: measured against mpmath, `1/Im τ = 100` still agrees to ~12 digits, `1/Im τ = 150`
 * only ~10, and `1/Im τ = 200` just ~7 — already short of this family's loosest tolerance
 * (1e-9) — with the double kernel overflowing outright by `1/Im τ ≈ 400`.
 */
export const MAX_INVERSE_IM_TAU = 100;

/** `τ` is close enough to the real axis that its true (correct) growth there already costs a
 * double kernel more digits than `MAX_INVERSE_IM_TAU`'s measured margin allows. */
export const tauTooCloseToRealAxis = (im: number): boolean =>
  Number.isFinite(im) && Math.abs(im) < 1 / MAX_INVERSE_IM_TAU;

/**
 * `value` rounded to the digits the engine was actually asked for, or undefined if it is not
 * a number at all.
 *
 * compute-engine lets a bignum product carry more digits than its operands had — real for
 * `Sin(1)·Cos(1)`, and worse for anything we assemble out of natives, where the tail is the
 * truncation error rather than merely unwarranted. A head should hand back the precision it
 * claims and no more, so every routed result goes through here.
 */
export function atEnginePrecision(ce: ComputeEngine, value: Expression): Expression | undefined {
  if (!isNumber(value)) return undefined;
  const big = value.bignumRe;
  return big === undefined ? value : ce.number(big.toPrecision(ce.precision));
}

/**
 * `compute()` run with `guard` extra digits of working precision, its result rounded back
 * to the caller's — for a formula whose own arithmetic loses the last few.
 */
export function withGuardDigits(ce: ComputeEngine, compute: () => Expression, guard = 10): Expression {
  const precision = ce.precision;
  ce.precision = precision + guard;
  let value: Expression;
  try {
    value = compute();
  } finally {
    ce.precision = precision;
  }
  return atEnginePrecision(ce, value) ?? value;
}

/**
 * A real operand as a decimal to the engine's precision, for an arbitrary-precision kernel --
 * or undefined when the engine asks for no more than a double (the double kernel is then the
 * better trade) or `x` is not a finite real number.
 */
export function bigRealOperand(ce: ComputeEngine, x: Expression): BigDecimal | undefined {
  if (ce.precision <= DOUBLE_DIGITS || x.im !== 0 || !Number.isFinite(x.re)) return undefined;
  return x.bignumRe ?? ce.bignum(x.re);
}

/** An arbitrary-precision kernel's value, boxed at the engine's precision. */
export const bigResult = (ce: ComputeEngine, value: BigDecimal): Expression =>
  ce.number(value.toPrecision(ce.precision));
