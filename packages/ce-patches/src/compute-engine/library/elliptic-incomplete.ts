import type { ComputeEngine, Expression } from "@cortex-js/compute-engine";
import { ellipticFarFromReal, LARGE_IMAGINARY } from "../numerics/elliptic-incomplete.ts";
import { wantsBigDigits } from "../../support/precise.ts";
import { hasUnreadablePart, isExactZero, UNDERFLOW_SAFE_DIGITS } from "../../support/exact-parts.ts";
import { type EvalOptions, isFiniteNum, type NativeEval, numberResult, wantsNumber } from "../../support/box.ts";

// EllipticF(φ, m) and the two-operand EllipticE(φ, m) at a φ far from the real axis. Native's
// Carlson forms overflow there (EllipticF(0.3 + 400i, 0.5) is ComplexInfinity, where the value is
// 1.854i; EllipticE is ∞ from |Im φ| near 300), so |Im φ| ≥ LARGE_IMAGINARY takes the rescaled
// forms of numerics/elliptic-incomplete.ts (m = 0 is φ itself at any height: native's is ∞ from |Im φ| = 50 on
// the lower half-plane). Where those cannot answer, native's answer stands
// unless it is not finite: both integrals are finite at every complex point but real m = 1 with
// φ = π/2 + kπ, so an infinity here is native overflowing and the call stays unevaluated.

/** `evaluate` for `head`: the rescaled kernel far from the real axis, else native's answer. */
export const evaluateIncompleteElliptic =
  (ce: ComputeEngine, head: "EllipticF" | "EllipticE") =>
  (native: NativeEval) =>
  (ops: readonly Expression[], options: EvalOptions): Expression | undefined => {
    const [phi, m] = ops;
    if (ops.length !== 2 || phi === undefined || m === undefined) return native?.(ops, options);
    if (!isFiniteNum(phi) || !isFiniteNum(m) || !wantsNumber(ops, options)) return native?.(ops, options);
    if (isExactZero(m)) return phi.N(); // F(φ|0) = E(φ|0) = φ
    // F and E are φ·(1 + O(mφ²)): an amplitude below the double's range is its own value (the native
    // handler reads it as 0 and answers 0).
    if (phi.re === 0 && phi.im === 0 && hasUnreadablePart(phi)) return phi.N();
    // A modulus below the double's range reads as 0 below, and F, E differ from φ by about m: right
    // to that many digits, so a call asking for more stays unevaluated.
    if (hasUnreadablePart(m) && ce.precision > UNDERFLOW_SAFE_DIGITS) return undefined;
    if (Math.abs(phi.im) < LARGE_IMAGINARY) return native?.(ops, options);
    if (!wantsBigDigits(ce, options, ops)) {
      const value = ellipticFarFromReal(
        head === "EllipticF" ? "F" : "E",
        { re: phi.re, im: phi.im },
        { re: m.re, im: m.im },
      );
      if (value !== undefined) return numberResult(ce, value);
    }
    const answer = native?.(ops, options);
    return answer === undefined || answer.operator === head || answer.isFinite === false ? undefined : answer;
  };
