import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { isFiniteNum, isRealInt, numberResult, cexp, cx, sub, logGamma } from "@notatio/ce-patches";

// RisingFactorial(a, n) — Fungrim's name for CE's native `Pochhammer`, delegated to. A complex
// operand with a non-integer n is Γ(a+n)/Γ(a) here, not Pochhammer's, so the value is the same
// whichever package widens `Pochhammer` to complex (number-theory's Gamma ratio is coarser).

export function evaluateRisingFactorial(
  ce: ComputeEngine,
  a: Expression,
  n: Expression,
  numeric: boolean,
): Expression | undefined {
  const complexOrder = numeric && isFiniteNum(a) && isFiniteNum(n) && (a.im !== 0 || n.im !== 0) && !isRealInt(n);
  if (!complexOrder) {
    const native = ce.box(["Pochhammer", a.json, n.json] as never);
    return numeric ? native.N() : native.evaluate();
  }
  const av = cx(a.re, a.im);
  // 1/Γ(a) = 0 at a pole; Γ(a+n) is finite here since n is not a real integer.
  if (av.im === 0 && Number.isInteger(av.re) && av.re <= 0) return ce.number(0);
  const apn = cx(a.re + n.re, a.im + n.im);
  return numberResult(ce, cexp(sub(logGamma(apn), logGamma(av))));
}
