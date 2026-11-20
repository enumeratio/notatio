import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { imSign, isFiniteNum, reSign } from "@notatio/ce-patches";

// Csgn(z) — the sign of Re z, falling back to the sign of Im z on the imaginary axis. The signs
// come from the bignum where there is one: a part below the double's range is signed, not 0.

export function evaluateCsgn(ce: ComputeEngine, z: Expression): Expression | undefined {
  if (!isFiniteNum(z)) return undefined;
  const s = reSign(z) || imSign(z);
  return ce.number(s);
}
