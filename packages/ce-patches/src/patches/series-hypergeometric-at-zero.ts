import { ComputeEngine } from "@cortex-js/compute-engine";
import type { Patch } from "../patch.ts";
import { seriesHypergeometricAtZero } from "../compute-engine/library/series-hypergeometric.ts";

// See series-hypergeometric.ts: native `Series` of `Hypergeometric1F1(a, b, x)` at 0 stays unevaluated,
// as do the 0F1, PFQ and regularized heads. Native expands only Hypergeometric2F1 (compute-engine 0.193,
// #597 / #603), in a form that takes seconds at symbolic parameters, so the sum is still ours.
export const seriesHypergeometricAtZeroPatch: Patch = {
  id: "series-hypergeometric-at-zero",
  lands: "Series(Hypergeometric1F1(a, b, x), x, 0, 3) is the defining sum, not an unevaluated call",
  files: ["src/compute-engine/library/series-hypergeometric.ts"],
  heads: ["Series"],

  fixed: () => {
    const ce = new ComputeEngine();
    const series = ce.box(["Series", ["Hypergeometric1F1", "a", "b", "x"], "x", 0, 2] as never).evaluate();
    return series.operator !== "Series" && !JSON.stringify(series.json).includes("Derivative");
  },

  apply: (ce) => seriesHypergeometricAtZero(ce),
};

export { seriesHypergeometricAtZero } from "../compute-engine/library/series-hypergeometric.ts";
