import type { Patch } from "../patch.ts";
import { evaluateShapeOfUnknownElements } from "../compute-engine/library/linear-algebra.ts";

// See linear-algebra.ts: `Shape` of a ragged list whose elements have no known type is empty;
// Wolfram's `Dimensions` keeps the dimensions its rows agree on. Native reads the structure of
// a uniform nested list, so only the ragged case is widened.
export const shapeOfUnknownElements: Patch = {
  id: "shape-of-unknown-elements",
  issue: "https://github.com/cortex-js/compute-engine/issues/525",
  pr: "https://github.com/cortex-js/compute-engine/pull/530",
  lands: "Shape of a ragged list keeps the dimensions its rows agree on",
  files: ["src/compute-engine/library/linear-algebra.ts"],
  heads: ["Shape"],

  fixed: (ce) => {
    const shape = ce.box(["Shape", ["List", ["List", ["a", 1], ["a", 2]], ["List", ["a", 3]]]]).evaluate();
    return shape.isSame(ce.tuple(2));
  },

  apply: (ce) => evaluateShapeOfUnknownElements(ce),
};

export { evaluateShapeOfUnknownElements } from "../compute-engine/library/linear-algebra.ts";
