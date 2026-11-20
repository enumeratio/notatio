import { BigDecimal, type Expression, type ComputeEngine } from "@cortex-js/compute-engine";
import { isReal, type Cx } from "../compute-engine/numerics/complex-arithmetic.ts";

// Shared glue between the numeric kernels and compute-engine's boxed expressions:
// the operand predicates the evaluate handlers branch on, the boxed-result helper,
// and the `compile` handler factory the heads share.

export type BoxInput = Parameters<ComputeEngine["box"]>[0];
export type NativeEval = NonNullable<Expression["operatorDefinition"]>["evaluate"];
export type EvalOptions = Parameters<NonNullable<NativeEval>>[1];

/**
 * Whether the real part is exactly an integer (a NaN re from a symbolic operand fails Number.isInteger).
 * `x.re` is a double, so a bignum such as −2 − 1e-16 reads as the integer −2; the bignum, where there
 * is one, is the exact part.
 */
export const isExactInt = (x: Expression): boolean =>
  Number.isInteger(x.re) && (x.bignumRe === undefined || x.bignumRe.isInteger());

/** The imaginary part is exactly zero: the double and, where there is one, the bignum (1e-400 reads as the double 0). */
export const isExactReal = (x: Expression): boolean => x.im === 0 && (x.bignumIm === undefined || x.bignumIm.isZero());

/** A real exact integer (see `isExactInt`). */
export const isRealInt = (x: Expression): boolean => x.im === 0 && isExactInt(x);

/** Exactly zero, both parts: a value below the double's range (1e-400) is not zero though its double is. */
export const isExactZero = (x: Expression): boolean =>
  x.re === 0 && isExactReal(x) && (x.bignumRe === undefined || x.bignumRe.isZero());

/** The sign of the real part, read from the bignum where there is one (1e-400 is positive, its double is 0). */
export const reSign = (x: Expression): -1 | 0 | 1 => {
  const big = x.bignumRe;
  if (big === undefined) return Math.sign(x.re) as -1 | 0 | 1;
  return big.isZero() ? 0 : big.isNegative() ? -1 : 1;
};

/** Exactly the real number `n`, read from the bignum where there is one (0.99999999999999999999 is not 1). */
export const isExactlyReal = (x: Expression, n: number): boolean =>
  x.re === n && isExactReal(x) && (x.bignumRe === undefined || x.bignumRe.eq(n));

/** A concrete (finite) numeric operand — as opposed to a symbolic one (NaN re/im). */
export const isFiniteNum = (x: Expression): boolean => Number.isFinite(x.re) && Number.isFinite(x.im);

/**
 * Numbers a double kernel boxed. compute-engine keeps a bignum behind every number built from a
 * double (`ce.number(0.1)`, each part of a complex), so once boxed a double's kind can't be read
 * back, and the boxer that knows records it here. Held by identity: an arithmetic step over the
 * number is a new one.
 */
const doubleBoxes = new WeakSet<object>();

/** `x`, a number a double kernel produced, recorded as one (`isMachineNumber`). */
export const doubleBox = (x: Expression): Expression => {
  doubleBoxes.add(x);
  return x;
};

/** Did a double kernel box `x`? */
export const isDoubleBox = (x: Expression): boolean => doubleBoxes.has(x);

/**
 * A complex number boxed inexact. compute-engine 0.147 boxes a JS Complex with whole-number
 * parts as exact (`-911 - 1056i`); a numeric route must still yield floats, so `.N()` marks it.
 */
export const inexactComplex = (ce: ComputeEngine, re: number, im: number): Expression =>
  doubleBox(ce.number(ce.complex(re, im)).N());

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

// Branch tests on one part of an operand's exact value. `x.re` and `x.im` are doubles, so a
// decimal with more digits than a double reads as its nearest double (1 + 1e-20 is 1); each asks
// the bignum where there is one, and where the operand has none its double is its value.

/** Whether the real part is exactly `value`. */
export const reEquals = (x: Expression, value: number): boolean =>
  x.re === value && (x.bignumRe === undefined || x.bignumRe.eq(value));

/** Whether the imaginary part is exactly `value`. */
export const imEquals = (x: Expression, value: number): boolean =>
  x.im === value && (x.bignumIm === undefined || x.bignumIm.eq(value));

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
 * that reads the operand as a double reads that part as 0 or infinity, and declines instead.
 */
export const hasUnreadablePart = (x: Expression): boolean => {
  const unreadable = (big: Expression["bignumRe"], d: number): boolean =>
    big !== undefined && big.isFinite() && !big.isZero() && !(Math.abs(d) >= MIN_NORMAL && Number.isFinite(d));
  return unreadable(x.bignumRe, x.re) || unreadable(x.bignumIm, x.im);
};

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
  if (isReal(r, Math.max(options.noise ?? 0, floor))) return doubleBox(ce.number(r.re));
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
 * A `compile` handler so `ce.compile(expr, {target})` emits a call to our kernel for
 * a head compute-engine's own compiler can't lower. Real-valued: assumes real args
 * and emits the real part, which composes in the real-scalar JS / GLSL pipelines the
 * plotters use.
 *  - javascript: `_.<js>(…)`, a real wrapper injected on the scope object.
 *  - glsl: `<glsl>(vec2(…, 0.0), …).x`, using the `zetaGLSL` kernel (which the shader
 *    host must prepend). `.x` takes the real part back to a float.
 * A target left unnamed returns undefined, which lets a native lowering (where the
 * target has one) take over instead. Other targets fall through the same way.
 */
export const realCompile =
  (arity: number, emit: { js?: string; glsl?: string; glslReal?: string }) =>
  (args: readonly Expression[], compile: (e: Expression) => string, ctx: { language?: string }): string | undefined => {
    const ops = args.slice(0, arity);
    if (ops.length < arity || ops.some((o) => o === undefined)) return undefined;
    const cs = ops.map(compile);
    if (ctx.language === "javascript" && emit.js) return `_.${emit.js}(${cs.join(", ")})`;
    // A kernel with a real-valued wrapper (NaN where the value is not real) is called as is.
    if (ctx.language === "glsl" && emit.glslReal)
      return `${emit.glslReal}(${cs.map((c) => `vec2(${c}, 0.0)`).join(", ")})`;
    if (ctx.language === "glsl" && emit.glsl) return `${emit.glsl}(${cs.map((c) => `vec2(${c}, 0.0)`).join(", ")}).x`;
    return undefined;
  };
