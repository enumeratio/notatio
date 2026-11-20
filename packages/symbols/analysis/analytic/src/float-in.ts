import {
  asDouble,
  belowDoubleShift,
  declineMachineAnswer,
  doublesForFloats,
  evaluateHurwitz,
  evaluateZeta,
  isExactInt,
  isExactReal,
  nearButNotInteger,
  reSign,
  wantsBigDigits,
  wantsNumber,
} from "@notatio/ce-patches";
import { type Engine, type Expr, wrapOperator } from "@notatio/engine";

// A float operand gets a float answer. These heads reach compute-engine's bignum arithmetic
// (a closed form, an AGM at m = 1, a Gamma ratio), which pads a double-precision input to
// 21 digits of which the last few are noise; `doublesForFloats` boxes the double instead,
// leaving an explicit digit count past a double's alone.
const FLOAT_IN_HEADS = [
  "LerchPhi",
  "JacobiSN",
  "JacobiCN",
  "JacobiDN",
  "JacobiCD",
  "JacobiCS",
  "JacobiDC",
  "JacobiDS",
  "JacobiNC",
  "JacobiND",
  "JacobiNS",
  "JacobiSC",
  "JacobiSD",
  "JacobiAmplitude",
  "JacobiZN",
] as const;

export function declareFloatInDoubleOut(ce: Engine): void {
  for (const head of FLOAT_IN_HEADS) {
    // compile builtin: rounds a float operand's answer to a double, and leaves a NaN unevaluated: no number differs
    wrapOperator(
      ce,
      [head],
      () => true,
      (native) => (ops, options) => doublesForFloats(ce, ops, options, () => native?.(ops, options)),
      { compile: "builtin" },
    );
  }
}

// compute-engine's complex PolyLog, PolyGamma, LogGamma, BarnesG and Zeta, and its PolyLog past |z| = 1,
// run in doubles whatever precision was asked for.
const DOUBLE_KERNEL_HEADS = ["PolyLog", "PolyGamma", "LogGamma", "BarnesG", "Zeta", "HurwitzZeta"] as const;

/** Past a double's digits these heads leave a call unevaluated where their kernel answers with a double. */
export function declineMachineAnswers(ce: Engine): void {
  for (const head of DOUBLE_KERNEL_HEADS) {
    wrapOperator(
      ce,
      [head],
      () => true,
      (native) => (ops, options) =>
        declineMachineAnswer(ce, options.numericApproximation, () => native?.(ops, options)),
      { compile: "builtin" },
    );
  }
}

/**
 * ζ(s, a) at a nonpositive integer a and Re(s) = 0, s ≠ 0: the (n + a) = 0 term is
 * 0^(−s) = 0^(−i·Im s), which winds the unit circle and has no value (Wolfram: Indeterminate).
 * compute-engine answers NaN; no numeric answer stands for that, so the call stays unevaluated.
 */
export function declineHurwitzIndeterminate(ce: Engine): void {
  // compile builtin: rounds a float operand's answer to a double, and leaves a NaN unevaluated: no number differs
  wrapOperator(
    ce,
    ["HurwitzZeta", 2],
    (ops) => {
      const [s, a] = ops;
      return (
        Number.isFinite(s.re) &&
        Number.isFinite(s.im) &&
        reSign(s) === 0 &&
        !isExactReal(s) &&
        a.im === 0 &&
        isExactInt(a) &&
        a.re <= 0
      );
    },
    () => () => undefined,
    { arity: 2, compile: "builtin" },
  );
}

/**
 * A real s that is not the same distance from its nearest integer as its double is: −2 − 1e-16 rounds to
 * the double −2, at distance 0, so a machine-precision answer would be ζ(−2) = 0 for an s that is not −2.
 * Within 1e-9 of the exact distance the double is the s (−2.0000001 is the double nearest it, to 1e-9 of 1e-7).
 */
function doubleLosesDistance(x: Expr | undefined): boolean {
  const exact = x?.bignumRe;
  if (x === undefined || exact === undefined || x.im !== 0 || !Number.isFinite(x.re)) return false;
  const nearest = Math.round(x.re);
  const distance = exact.sub(nearest).abs().toNumber();
  return Math.abs(distance - Math.abs(x.re - nearest)) > 1e-9 * distance;
}

/**
 * Numeric ζ through `compute` (the bignum kernel): at the engine's digits where it wants a
 * bignum, else as the double a float operand asks for, with the kernel at machine precision so
 * it reads each operand as the exact double it is. Where the kernel declines the call stays
 * unevaluated: compute-engine's own complex kernel is 10^-9 off at |Im s| = 10^7, and a double
 * past a double's digits is no answer.
 */
function bigOrDouble(
  ce: Engine,
  ops: readonly Expr[],
  options: { readonly numericApproximation?: boolean },
  compute: () => Expr | undefined,
): Expr | undefined {
  if (wantsBigDigits(ce, options, ops)) return compute();
  if (doubleLosesDistance(ops[0])) return undefined;
  const precision = ce.precision;
  ce.precision = "machine";
  try {
    const answer = compute();
    return answer === undefined ? undefined : asDouble(ce, answer);
  } finally {
    ce.precision = precision;
  }
}

/**
 * ζ(s) and ζ(s, a) at a complex s or a, or a real s next to an integer (compute-engine's own ζ loses
 * digits within 1e-30 of one and declines next to s = 1), on the bignum Euler–Maclaurin kernel
 * (hurwitz-zeta-big.ts), rounded once: to the double pair at machine precision, else to the
 * engine's digits in each part. compute-engine's own complex kernel runs in doubles and
 * measured 6e-13 relative off mpmath at |Im s| = 400 (5e-14 at ζ(1/2 + 14i)).
 */
export function declareComplexZeta(ce: Engine): void {
  const complex = (x: Expr | undefined): boolean =>
    x !== undefined && Number.isFinite(x.re) && Number.isFinite(x.im) && x.im !== 0;
  // compile builtin: rounds a float operand's answer to a double, and leaves a NaN unevaluated: no number differs
  wrapOperator(
    ce,
    ["Zeta", 1],
    (ops) => complex(ops[0]) || nearButNotInteger(ops[0]),
    (native) => (ops, options) =>
      !wantsNumber(ops, options)
        ? native?.(ops, options)
        : bigOrDouble(ce, ops, options, () => evaluateHurwitz(ce, [ops[0], ce.One], true)),
    { arity: 1, compile: "builtin" },
  );
  // compile builtin: rounds a float operand's answer to a double, and leaves a NaN unevaluated: no number differs
  wrapOperator(
    ce,
    ["HurwitzZeta", 2],
    (ops) => complex(ops[0]) || complex(ops[1]) || nearButNotInteger(ops[0]) || belowDoubleShift(ops[1]),
    (native) => (ops, options) =>
      !wantsNumber(ops, options)
        ? native?.(ops, options)
        : bigOrDouble(ce, ops, options, () => evaluateHurwitz(ce, ops, true)),
    { arity: 2, compile: "builtin" },
  );
  // compile builtin: rounds a float operand's answer to a double, and leaves a NaN unevaluated: no number differs
  wrapOperator(
    ce,
    ["Zeta", 2],
    (ops) => nearButNotInteger(ops[0]) || belowDoubleShift(ops[1]),
    (native) => (ops, options) =>
      !wantsNumber(ops, options)
        ? native?.(ops, options)
        : bigOrDouble(ce, ops, options, () => evaluateZeta(ce, ops, true)),
    { arity: 2, compile: "builtin" },
  );
}
