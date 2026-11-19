import { compile } from "@cortex-js/compute-engine/compile";
import type { Patch } from "../patch.ts";
import { compileMatrixRankToJavaScript } from "../compute-engine/library/linear-algebra.ts";

// `MatrixRank` evaluates (exactly for integers and rationals, with a tolerance for floats) but the
// compiler has no lowering for it, so an expression holding one cannot be compiled.
// The lowering is the evaluator's own arithmetic: fraction-free (Bareiss) elimination over integers,
// where a literal matrix of rationals is scaled to integers first, and floating elimination with a
// relative tolerance only for a non-integer number.
//
// Since compute-engine 0.194.0 a `compile` handler that returns code text declines, and the handler
// of this patch (`compileMatrixRank`) writes text: it is kept for a compiler that takes code, and
// until then `compile()` of a `MatrixRank` runs the interpreter (`success: false`, the same value).
// A handler that returns an `Expression` cannot express it: the elimination needs a nested-list
// input, and the compiler declines `list<list<…>>` inputs.
export const matrixRankCompiles: Patch = {
  id: "matrix-rank-compiles",
  lands: "MatrixRank compiles to JavaScript: exact over integers and rationals, a tolerance only over floats",
  files: ["src/compute-engine/compilation/matrix-rank.ts", "src/compute-engine/numerics/matrix-rank.ts"],
  heads: ["MatrixRank"],

  fixed: (ce) => {
    try {
      return compile(ce.box(["MatrixRank", "m"] as never), { fallback: false }).success === true;
    } catch {
      return false;
    }
  },

  apply: (ce) => compileMatrixRankToJavaScript(ce),
};

export { compileMatrixRank } from "../compute-engine/compilation/matrix-rank.ts";
export { matrixRank } from "../compute-engine/numerics/matrix-rank.ts";
