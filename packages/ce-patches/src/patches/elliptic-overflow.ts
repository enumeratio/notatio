import { wrapOperator } from "@notatio/engine";
import type { Patch } from "../patch.ts";
import { evaluateIncompleteElliptic } from "../compute-engine/library/elliptic-incomplete.ts";

// Native EllipticF(φ, m) and EllipticE(φ, m) overflow at a φ far from the real axis: their Carlson
// forms take cos²φ and sin³φ, which leave the double range at |Im φ| near 355 and 236, so
// EllipticF(0.3 + 400i, 0.5) is ComplexInfinity where the value is 1.854i, and EllipticE is
// ComplexInfinity from |Im φ| near 300 (and at 0 + 355i, EllipticF(·, 2) is 0 where it is 1.311i).
// Both integrals are finite at every complex operand. This rescales them to bounded arguments
// (the Jacobi imaginary transformation) and reduces Re φ by the quasi-periodicity.
export const ellipticOverflow: Patch = {
  id: "elliptic-overflow",
  lands:
    "EllipticF(φ, m) and EllipticE(φ, m) at |Im φ| ≥ 100 from the Jacobi-rescaled Carlson forms, never ComplexInfinity for a finite value",
  files: [
    "src/compute-engine/numerics/carlson.ts",
    "src/compute-engine/numerics/elliptic-incomplete.ts",
    "src/compute-engine/library/elliptic-incomplete.ts",
  ],
  heads: ["EllipticF", "EllipticE"],

  fixed: (ce) => {
    const value = ce.box(["EllipticF", ce.complex(0.3, 400), 0.5] as never).N();
    return Math.abs(value.im - 1.854) < 1e-3;
  },

  // Native lowers both to real-only JavaScript calls (a complex φ is NaN there), which stays.
  apply: (ce) => {
    wrapOperator(ce, ["EllipticF"], () => true, evaluateIncompleteElliptic(ce, "EllipticF"), {
      arity: 2,
      compile: "builtin",
    });
    wrapOperator(ce, ["EllipticE"], () => true, evaluateIncompleteElliptic(ce, "EllipticE"), {
      arity: { min: 1, max: 2 },
      compile: "builtin",
    });
  },
};
