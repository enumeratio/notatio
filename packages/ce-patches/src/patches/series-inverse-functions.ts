import { ComputeEngine } from "@cortex-js/compute-engine";
import type { Patch } from "../patch.ts";
import { seriesIntegratesDerivatives } from "../compute-engine/library/series-inverse-functions.ts";

// See series-inverse-functions.ts: `Series(Arctan(x), x, 0, 7)` differentiates a growing
// expression once per order and takes seconds; the series of the derivative is integrated instead.
export const seriesInverseFunctions: Patch = {
  id: "series-inverse-functions",
  lands: "Series(Arctan(x), x, 0, 7) answers in milliseconds, as Series(Sin(x), x, 0, 7) does",
  files: ["src/compute-engine/library/series-inverse-functions.ts"],
  heads: ["Series"],

  // Native `Series(Arctan(x), x, 0, 3)` takes about 150 ms here and a landed fix well under 40.
  fixed: () => {
    const ce = new ComputeEngine();
    ce.box(["Series", ["Sin", "x"], "x", 0, 1] as never).evaluate();
    const started = performance.now();
    ce.box(["Series", ["Arctan", "x"], "x", 0, 3] as never).evaluate();
    return performance.now() - started < 40;
  },

  apply: (ce) => seriesIntegratesDerivatives(ce),
};

export { seriesIntegratesDerivatives } from "../compute-engine/library/series-inverse-functions.ts";
