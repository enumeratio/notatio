import { type Expression, type ComputeEngine, isFunction } from "@cortex-js/compute-engine";
import { declareCompile } from "@enumeratio/engine";
import type { Patch } from "../patch.ts";

// Wolfram's `Sum[f, {i, lo, hi, step}]` and `Product[f, {i, lo, hi, step}]` run i over
// lo, lo + step, ... while it has not passed hi. compute-engine 0.186 boxes the four-operand
// `Limits(i, lo, hi, step)` but reads only its first three operands, so `Sum(i, (i, 1, 4, 2))`
// answers 10 (1 + 2 + 3 + 4) where the sum is 4 (1 + 3), on every route (cortex-js/compute-engine#517).
//
// The stepped iterator is the indexing set `Element(i, Range(lo, hi, step))`, which compute-engine
// already evaluates exactly (a negative step counts down; a step that does not divide the range stops
// at the last member) and leaves unevaluated when a bound or the step is not a number, or the step is 0.
// A Sum or Product of it does not compile: the compile targets decline an `Element` index set rather
// than answer wrongly.
export const steppedIterator: Patch = {
  id: "stepped-iterator",
  issue: "https://github.com/cortex-js/compute-engine/issues/517",
  lands: "Sum and Product read the step of a four-operand Limits, as Element(i, Range(lo, hi, step))",
  files: ["src/patches/stepped-iterator.ts"],
  heads: ["Sum", "Product"],

  fixed: (ce) =>
    ce
      .box(["Sum", "i", ["Limits", "i", 1, 4, 2]])
      .evaluate()
      .is(4) &&
    ce
      .box(["Product", "i", ["Limits", "i", 1, 4, 2]])
      .evaluate()
      .is(3),

  apply: (ce) => {
    for (const head of ["Sum", "Product"]) {
      const definition = ce.lookupDefinition(head);
      const operator = definition !== undefined && "operator" in definition ? definition.operator : undefined;
      const native = operator?.canonical;
      if (operator === undefined || native === undefined) continue;
      (operator as { canonical: unknown }).canonical = (ops: readonly Expression[], context: never) =>
        native(
          ops.map((op, i) => (i === 0 ? op : asIndexingSet(ce, op))),
          context,
        );
      // compile builtin: reads an iterator at canonicalization, before compile sees the expression
      declareCompile(ce, head, "builtin");
    }
  },
};

/** `Limits(i, lo, hi, step)` as `Element(i, Range(lo, hi, step))`; anything else as it is. */
function asIndexingSet(ce: ComputeEngine, op: Expression): Expression {
  if (!isFunction(op) || op.operator !== "Limits" || op.ops.length !== 4) return op;
  const [index, lower, upper, step] = op.ops;
  return ce.function("Element", [index!, ce.function("Range", [lower!, upper!, step!])]);
}
