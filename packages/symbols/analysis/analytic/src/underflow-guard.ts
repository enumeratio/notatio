import {
  UNDERFLOW_SAFE_DIGITS,
  hasUnreadablePart,
  isExactZero,
  isFiniteNum,
  readsDifferently,
  wantsNumber,
} from "@notatio/ce-patches";
import { type Engine, isNumber, wrapOperator } from "@notatio/engine";

// An operand below the double's range (1e-400) is a bignum whose double is 0, and a kernel that reads
// doubles answers the value at 0. For a function analytic at 0 with f(0) ≠ 0 that is right to about
// 1e-300 relative (`UNDERFLOW_SAFE_DIGITS`). For one that vanishes at 0 (SinIntegral(1e-400) is 1e-400,
// not 0) or diverges there (CosIntegral(1e-400) is −920.9, not −∞) it is no value. Each head below has a
// kernel that reads its operand as a double (or a native one that does): a call whose operand has a part
// below the double's range keeps the kernel's answer only when it is a finite nonzero value, within the
// digits above, and otherwise stays unevaluated.
const READS_DOUBLES = [
  "BesselK",
  "BesselY",
  "ChebyshevT",
  "ChebyshevU",
  "CosIntegral",
  "CoshIntegral",
  "ExpIntegralEi",
  "Gudermannian",
  "HarmonicNumber",
  "HermiteH",
  "HypergeometricPFQ",
  "JacobiAmplitude",
  "JacobiCD",
  "JacobiCN",
  "JacobiCS",
  "JacobiDC",
  "JacobiDN",
  "JacobiDS",
  "JacobiNC",
  "JacobiND",
  "JacobiNS",
  "JacobiSC",
  "JacobiSD",
  "JacobiSN",
  "JacobiZN",
  "LegendrePolynomial",
  "LogIntegral",
  "NorlundB",
  "PolyGamma",
  "RiemannSiegelTheta",
  "SinIntegral",
  "SinhIntegral",
  "EllipticTheta",
] as const;

// A pole of the function at an operand whose double is the pole: Hypergeometric2F1(1, 1, 2, 1 − 1e-20) is
// 46.05 (−ln(1 − z)/z), and a kernel that reads z as 1 answers ∞. The call keeps a finite answer and
// declines an infinite one when an operand has digits its double lacks. An operand that is exactly the pole
// has no such digits, so its ∞ stands.
const READS_POLE_AT_DOUBLE = ["EllipticK", "EllipticPi", "Hypergeometric2F1", "LogIntegral", "PrimeZetaP"] as const;

export function declarePoleGuard(ce: Engine): void {
  for (const head of READS_POLE_AT_DOUBLE) {
    // compile builtin: a compiled call takes doubles, which are the poles they read as
    wrapOperator(
      ce,
      [head],
      (ops) => ops.some(readsDifferently),
      (native) => (ops, options) => {
        const value = native?.(ops, options);
        if (value === undefined || !wantsNumber(ops, options) || !isNumber(value)) return value;
        return isFiniteNum(value) ? value : undefined;
      },
      { compile: "builtin" },
    );
  }
}

export function declareUnderflowGuard(ce: Engine): void {
  declarePoleGuard(ce);
  for (const head of READS_DOUBLES) {
    // compile builtin: a compiled call takes doubles, and an operand below the double's range is none
    wrapOperator(
      ce,
      [head],
      (ops) => ops.some(hasUnreadablePart),
      (native) => (ops, options) => {
        const value = native?.(ops, options);
        if (value === undefined || !wantsNumber(ops, options) || !isNumber(value)) return value;
        if (isExactZero(value) || !isFiniteNum(value) || ce.precision > UNDERFLOW_SAFE_DIGITS) return undefined;
        return value;
      },
      { compile: "builtin" },
    );
  }
}
