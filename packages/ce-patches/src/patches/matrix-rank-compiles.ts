import { JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import type { Patch } from "../patch.ts";
import { compileMatrixRankToJavaScript } from "../compute-engine/library/linear-algebra.ts";

// `MatrixRank` evaluates (exactly for integers and rationals, with a tolerance for floats) but the
// JavaScript target has no lowering for it, so an expression holding one cannot be compiled.
// The lowering is the evaluator's own arithmetic: fraction-free (Bareiss) elimination over integers,
// where a literal matrix of rationals is scaled to integers first, and floating elimination with a
// relative tolerance only for a non-integer number.
export const matrixRankCompiles: Patch = {
  id: "matrix-rank-compiles",
  lands: "MatrixRank compiles to JavaScript: exact over integers and rationals, a tolerance only over floats",
  files: ["src/compute-engine/compilation/matrix-rank.ts", "src/compute-engine/numerics/matrix-rank.ts"],
  heads: ["MatrixRank"],

  fixed: (ce) => {
    try {
      return new JavaScriptTarget().compile(ce.box(["MatrixRank", "m"] as never)).success === true;
    } catch {
      return false;
    }
  },

  apply: (ce) => compileMatrixRankToJavaScript(ce),
};

export { compileMatrixRank } from "../compute-engine/compilation/matrix-rank.ts";
export { matrixRank } from "../compute-engine/numerics/matrix-rank.ts";
