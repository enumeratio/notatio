import { ComputeEngine } from "@cortex-js/compute-engine";
import type { Patch } from "../patch.ts";
import { evaluateZetaAtNonpositiveShift } from "../compute-engine/library/special-functions.ts";

// Zeta(s, −1) = 1 + ζ(s) for a concrete exact s that native leaves unevaluated (Zeta(5/2, −1)).
// Zeta(0, a) and Zeta(s, −n) for an integer s ≥ 2 are native's, so only this case is widened.
export const valuesAtZero: Patch = {
  id: "values-at-zero",
  issue: "https://github.com/cortex-js/compute-engine/issues/524",
  pr: "https://github.com/cortex-js/compute-engine/pull/529",
  lands: "Zeta(5/2, −1) = 1 + ζ(5/2)",
  files: ["src/compute-engine/library/special-functions.ts"],
  heads: ["Zeta"],

  fixed: () => {
    const ce = new ComputeEngine();
    return ce.box(["Zeta", ["Rational", 5, 2], -1]).evaluate().operator !== "Zeta";
  },

  apply: (ce) => {
    evaluateZetaAtNonpositiveShift(ce);
  },
};
