import { wrapOperator } from "@enumeratio/engine";
import type { Patch } from "../patch.ts";
import { evaluateAgm } from "../compute-engine/library/agm.ts";

// compute-engine evaluates AGM natively: positive reals to the engine's precision, and complex or
// negative arguments on doubles with the right choice of root at each step. Asked for more
// digits than a double holds at such an argument (`N(AGM(1, -10), 20)`) it hands back the
// double, so this carries the same recurrence in BigDecimals. The branch is the one native takes
// (Wolfram's): the limit from above the cut along the negative reals.
export const agmComplex: Patch = {
  id: "agm-complex",
  lands:
    "AGM(a, b) at a negative or complex argument to the engine's precision, on the same branch as the machine route",
  files: ["src/compute-engine/numerics/agm.ts", "src/compute-engine/library/agm.ts"],
  heads: ["AGM"],

  fixed: (ce) => {
    const precision = ce.precision;
    ce.precision = 30;
    try {
      const value = ce.box(["AGM", 1, -10]).N();
      return (value.bignumIm?.toString().replaceAll(/\D/g, "").length ?? 0) > 20;
    } finally {
      ce.precision = precision;
    }
  },

  // Native lowers AGM to a real-valued JavaScript call; that stays.
  apply: (ce) =>
    wrapOperator(
      ce,
      ["AGM"],
      () => true,
      (native) => (ops, options) => evaluateAgm(ce, native, ops, options),
      { arity: { min: 1, max: 2 }, compile: "builtin" },
    ),
};
