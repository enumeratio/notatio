import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { isReal, type Cx } from "../compute-engine/numerics/complex-arithmetic.ts";

// Shared glue between the numeric kernels and compute-engine's boxed expressions:
// the operand predicates the evaluate handlers branch on, the boxed-result helper,
// and the local-declaration helper the `compile` handlers share.

export type BoxInput = Parameters<ComputeEngine["box"]>[0];
export type NativeEval = NonNullable<Expression["operatorDefinition"]>["evaluate"];
export type EvalOptions = Parameters<NonNullable<NativeEval>>[1];

/** A concrete real integer operand (NaN re from a symbolic operand fails Number.isInteger). */
export const isRealInt = (x: Expression): boolean => x.im === 0 && Number.isInteger(x.re);

/** A concrete (finite) numeric operand — as opposed to a symbolic one (NaN re/im). */
export const isFiniteNum = (x: Expression): boolean => Number.isFinite(x.re) && Number.isFinite(x.im);

/**
 * A complex number boxed inexact. compute-engine 0.147 boxes a JS Complex with whole-number
 * parts as exact (`-911 - 1056i`); a numeric route must still yield floats, so `.N()` marks it.
 */
export const inexactComplex = (ce: ComputeEngine, re: number, im: number): Expression =>
  ce.number(ce.complex(re, im)).N();

/**
 * An imaginary part this small next to the real part it rides on is rounding noise. It is
 * relative to the result: a floor that is absolute near zero drops the true imaginary part
 * of a tiny value (`MeijerG` at -1e-12 is 1.9e-55 + 1.4e-55i).
 */
export const REAL_COLLAPSE_RELATIVE = 1e-14;

/** The smallest normal double. Below it a double keeps fewer than 53 digits and then flushes to 0. */
export const MIN_NORMAL = 2.2250738585072014e-308;

/**
 * Is a nonzero value, given by its log-magnitude, below the double range? A kernel that finds this
 * true declines: the double it would box is subnormal or an exact 0, which is no value.
 */
export const underflows = (logMagnitude: number): boolean => logMagnitude < Math.log(MIN_NORMAL);

export interface NumberResultOptions {
  /**
   * Absolute size of the noise in `im`, from the kernel's own scale (about its epsilon times
   * the terms it summed): an `im` within it is dropped even when the value is smaller, as at a
   * zero of a real function computed through complex arithmetic. A kernel that cannot bound
   * its noise leaves it unset and `im` collapses only when relatively small.
   */
  noise?: number;
  /**
   * The kernel knows a non-finite result is a pole of the function at these operands. Without
   * it a non-finite result is a double overflowing or a point outside the kernel's domain
   * (NaN), and no answer is given.
   */
  pole?: boolean;
  /**
   * The kernel computes `im` to a relative accuracy of itself, not of the result, so a small
   * `im` beside a large real part is a value, as the Eisenstein series of weight 100 at
   * 0.7 + 0.3i is real part 3.4e37 and imaginary part 3.2e23. Only `noise` then drops it.
   * A kernel whose `im` carries an absolute error leaves it unset.
   */
  vouchesImaginary?: boolean;
}

/**
 * Box a complex result, collapsing to a real number when the imaginary part is noise
 * (exactly 0, within `REAL_COLLAPSE_RELATIVE` of the real part unless the kernel
 * `vouchesImaginary`, or within `options.noise`).
 * Undefined, so the call stays symbolic, for a non-finite result unless `options.pole`.
 */
export const numberResult = (ce: ComputeEngine, r: Cx, options: NumberResultOptions = {}): Expression | undefined => {
  if (!Number.isFinite(r.re) || !Number.isFinite(r.im)) return options.pole ? ce.symbol("ComplexInfinity") : undefined;
  const floor = options.vouchesImaginary ? 0 : REAL_COLLAPSE_RELATIVE * Math.abs(r.re);
  if (isReal(r, Math.max(options.noise ?? 0, floor))) return ce.number(r.re);
  return inexactComplex(ce, r.re, r.im);
};

/**
 * `vouchesImaginary` for a kernel whose imaginary part is accurate to itself, when an operand is
 * complex. Real operands give a real function value, and an imaginary part beside it (a
 * negative `q` in a theta series, a negative real base to a real power) is rounding noise.
 */
export const vouchesWhenComplex = (ops: readonly ({ readonly im: number } | undefined)[]): NumberResultOptions => ({
  vouchesImaginary: ops.some((o) => o !== undefined && o.im !== 0),
});

/**
 * Should this call produce a number? Either N() asked for one, or an operand is
 * inexact — a float argument means a float answer, which is how compute-engine's
 * own numeric handlers behave (PolyLog(2, 0.5) evaluates, PolyLog(2, 1/2) does not).
 *
 * `isExact` is a number-literal property; compute-engine narrows to it through an
 * interface the package doesn't re-export, so it is read structurally here. A
 * non-literal operand has no float to lose and counts as exact.
 */
export const wantsNumber = (ops: readonly Expression[], options: EvalOptions): boolean =>
  (options.numericApproximation ?? false) || ops.some((o) => (o as Partial<{ isExact: boolean }>).isExact === false);

/**
 * Did the captured native handler decline to evaluate — i.e. hand back the same
 * head, unevaluated? That is compute-engine's way of staying symbolic, and it marks
 * exactly the cases our kernels are here to fill in.
 */
export const declined = (r: Expression | undefined, head: string): boolean => r === undefined || r.operator === head;

/**
 * A local of a compiled block, as MathJSON: `Declare(name, { value })`. A `compile` handler of ours
 * answers with an expression (compute-engine's compiler takes no code text from one), and a
 * recurrence is a `Block` of locals and a `Loop`, which the JavaScript and GLSL targets both lower.
 * The local's name must not occur in the operands the block reads: a handler's names start `_`
 * and are one letter or two, as `_z` and `_k`.
 */
export const local = (name: string, value: unknown): unknown => [
  "Declare",
  name,
  ["Dictionary", ["KeyValuePair", "value", value]],
];
