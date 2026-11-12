import { type Expression, type ComputeEngine, isFunction, isSymbol } from "@cortex-js/compute-engine";
import type { Patch } from "../patch.ts";
import { declareCompile } from "@enumeratio/engine";

// Wolfram's `Sum[f, {k, n}]` and `Product[f, {k, n}]` run k from 1 to n. compute-engine 0.157
// reads the tuple `(k, n)` that way but still leaves `Limits(k, Nothing, n)`, one bound, unevaluated
// (the same rule as an integral with one bound). Reading that single bound as the upper one with a
// lower bound of 1 is Wolfram's iterator; a lower bound written alone (`Limits(k, 1, Nothing)`)
// stays as it is. A bare index (`Limits(k, Nothing, Nothing)`) is compute-engine's own: since 0.187 it
// runs k = 1..infinity, so nothing here touches it.
export const iteratorUpperBound: Patch = {
  id: "iterator-upper-bound",
  lands: "Sum and Product of Limits(k, Nothing, n) run from 1, as Wolfram's {k, n} iterator does",
  files: ["src/patches/iterator-upper-bound.ts"],
  heads: ["Sum", "Product"],

  fixed: (ce) =>
    ce
      .box(["Sum", "k", ["Limits", "k", "Nothing", 3]])
      .evaluate()
      .is(6),

  apply: (ce) => {
    for (const head of ["Sum", "Product"]) {
      const definition = ce.lookupDefinition(head);
      const operator = definition !== undefined && "operator" in definition ? definition.operator : undefined;
      const native = operator?.canonical;
      if (operator === undefined || native === undefined) continue;
      (operator as { canonical: unknown }).canonical = (ops: readonly Expression[], context: never) =>
        native(
          ops.map((op, i) => (i === 0 ? op : withLowerBound(ce, op))),
          context,
        );
      // compile builtin: reads an iterator at canonicalization, before compile sees the expression
      declareCompile(ce, head, "builtin");
    }
  },
};

const isNothing = (op: Expression | undefined): boolean => op !== undefined && isSymbol(op) && op.symbol === "Nothing";

/** `Limits(k, Nothing, n)` as `Limits(k, 1, n)`; anything else as it is. */
function withLowerBound(ce: ComputeEngine, op: Expression): Expression {
  if (!isFunction(op)) return op;
  const parts = op.ops;
  const [index, lower, upper] = parts;
  if (op.operator === "Limits" && parts.length === 3 && isNothing(lower) && !isNothing(upper) && index !== undefined) {
    return ce.function("Limits", [index, ce.number(1), upper!], { form: "raw" });
  }
  return op;
}
