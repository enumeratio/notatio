import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { operandsOf, wrapOperator } from "@notatio/engine";
import {
  type EvalOptions,
  isExactReal,
  isExactZero,
  isExactlyReal,
  isFiniteNum,
  reExceeds,
  wantsNumber,
  withGuardDigits,
} from "@notatio/ce-patches";

// InverseErfc(s): compute-engine has no such head. Wolfram's InverseErf is native here as
// `ErfInv` and accurate, but computing 1 − s as a plain double loses precision exactly where
// the tail matters (s → 0, y → ∞) — the whole reason a caller reaches for InverseErfc instead
// of InverseErf(1 − s) in the first place. Building `Subtract(1, s)` as a compute-engine
// expression and deferring the double conversion to the final `.N()` keeps that subtraction
// exact (rational/bignum) up to the moment ErfInv needs a float, so InverseErfc(1e-10) keeps
// every digit ErfInv(1 − 1e-10) would otherwise drop.

/**
 * The most leading zeros of s (or of 2 − s) one call carries as extra working digits. Past it the call
 * stays unevaluated: InverseErfc(1e-400) is 30.28 and needs 400 more digits than were asked for, which
 * ErfInv takes seconds at (0.1 s at 100, 1 s at 300).
 */
const MAX_TAIL_ZEROS = 100;

/** Fewer leading zeros than this cost less than the digits the engine already carries past those asked. */
const MIN_TAIL_ZEROS = 3;

/** The decimal digits 1 − s (or 1 − (2 − s) near 2) loses to its leading zeros: s = 1e-20 has 20. */
function tailZeros(ce: ComputeEngine, s: Expression, nearTwo: boolean): number {
  const distance = nearTwo ? ce.function("Subtract", [2, s]).N() : s;
  const exact = distance.bignumRe ?? ce.bignum(distance.re);
  if (exact.isZero() || exact.isNegative()) return 0;
  return Math.max(0, -exact.toPrecision(1).exponent); // one digit: its exponent is the order of magnitude
}

export function declareInverseErfc(ce: ComputeEngine): void {
  ce.declare("InverseErfc", {
    signature: "(number) -> number",
    broadcastable: true, // InverseErfc([0, 1]) threads, like Wolfram's Listable
    evaluate: (ops: readonly Expression[], options: EvalOptions) => {
      const [s] = ops;
      if (s === undefined) return undefined;
      // The special points are exact: a decimal 1e-20 from 1 is not 1, and one below the double's
      // range is not 0.
      if (isExactZero(s)) return ce.symbol("PositiveInfinity");
      if (isExactlyReal(s, 1)) return ce.Zero;
      if (isExactlyReal(s, 2)) return ce.symbol("NegativeInfinity");
      if (!wantsNumber(ops, options) || !isFiniteNum(s) || !isExactReal(s)) return undefined;
      // erfc(−y) = 2 − erfc(y), so InverseErfc(s) = −InverseErfc(2 − s) for s > 3/2, which keeps the
      // subtraction's argument small there; ErfInv(1 − s) applies directly everywhere else.
      const nearTwo = reExceeds(s, 1.5);
      // 1 − s (or 1 − (2 − s)) near ±1 keeps only the digits left after its leading 9s, so the
      // subtraction is carried with as many more digits as s has leading zeros (2 − s there).
      const tail = tailZeros(ce, s, nearTwo);
      if (tail > MAX_TAIL_ZEROS) return undefined;
      const compute = (): Expression => {
        const t = nearTwo ? ce.function("Subtract", [2, s]) : s;
        const root = ce.function("ErfInv", [ce.function("Subtract", [1, t])]).N();
        return nearTwo ? ce.function("Negate", [root]).evaluate() : root;
      };
      return tail < MIN_TAIL_ZEROS ? compute() : withGuardDigits(ce, compute, tail + 10);
    },
  });

  // Erfc(InverseErfc(x)) = x exactly, including for a symbolic x — compute-engine has no
  // general inverse-composition simplification (checked: ErfInv(Erf(x)) stays unevaluated
  // too), so this extends Erfc in place with the one structural cancellation Wolfram's page
  // documents. Evaluating InverseErfc(x) first would just decline for symbolic x and never
  // reach the identity, so this matches the AST directly instead.
  // compile builtin: Erfc(InverseErfc(x)) = x is an identity
  wrapOperator(
    ce,
    ["Erfc", 1],
    (ops) => ops[0]?.operator === "InverseErfc",
    () => (ops) => operandsOf(ops[0])[0],
    { arity: 1, compile: "builtin" },
  );
}
