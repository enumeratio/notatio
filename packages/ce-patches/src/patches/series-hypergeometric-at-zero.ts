import { ComputeEngine } from "@cortex-js/compute-engine";
import type { Patch } from "../patch.ts";
import { seriesHypergeometricAtZero } from "../compute-engine/library/series-hypergeometric.ts";

// See series-hypergeometric.ts: native `Series` of `Hypergeometric1F1(a, b, x)` at 0 returns
// inert `Apply(Derivative(...), a, b, 0)` coefficients (cortex-js/compute-engine#597).
export const seriesHypergeometricAtZeroPatch: Patch = {
  id: "series-hypergeometric-at-zero",
  lands: "Series(Hypergeometric1F1(a, b, x), x, 0, 3) is the defining sum, not Apply(Derivative(...)) coefficients",
  files: ["src/compute-engine/library/series-hypergeometric.ts"],
  heads: ["Series"],

  fixed: () => {
    const ce = new ComputeEngine();
    const series = ce.box(["Series", ["Hypergeometric1F1", "a", "b", "x"], "x", 0, 2] as never).evaluate();
    return !JSON.stringify(series.json).includes("Derivative");
  },

  apply: (ce) => seriesHypergeometricAtZero(ce),
};

export { seriesHypergeometricAtZero } from "../compute-engine/library/series-hypergeometric.ts";
