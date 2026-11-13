import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { operandsOf, threadOverLists, widenSignature, wrapOperator } from "@notatio/engine";
import type { EvalOptions, NativeEval } from "@notatio/ce-patches";

/** No free variable anywhere in `expr` — a plain number, `Pi`/`ExponentialE`, or a closed
 * call over them (`Exp(Sqrt(2))`) all qualify, even though `evaluate()` alone leaves the
 * last one exactly as symbolic as `Add(1.2, Multiply(6.7, x))` does. */
const isClosed = (expr: Expression): boolean => expr.freeVariables.length === 0;

// Threading: HarmonicNumber (ours) takes the `broadcastable` flag compute-engine's own
// Listable heads already carry, so its broadcast machinery calls the operator's `evaluate`
// once per scalar element.
//
// Rationalize doesn't fit that flag -- compute-engine's own Rationalize takes a
// single real, so `List(...)` and a symbolic expression both need to be walked and
// rebuilt here rather than threaded structurally.

/**
 * Recursively rationalize every inexact number inside `expr`, leaving exact numbers and
 * free symbols alone, and rebuild every compound node that still has a free variable in
 * it (Add, Multiply, ...) around the results. `List` is always walked structurally, since
 * it never itself reduces to a single number; anything else CLOSED (no free variable —
 * see `isClosed`) is handed whole to the native single-argument evaluator, the same
 * handler a direct `Rationalize(0.5)` call already uses, so a closed but still-symbolic
 * value like `Exp(Sqrt(2))` reaches native's own numeric reduction (N()) rather than
 * being walked apart into `Sqrt(2)`, which alone would rationalize to nothing useful.
 */
function rationalizeDeep(
  ce: ComputeEngine,
  native: NativeEval,
  expr: Expression,
  tolerance: Expression | undefined,
  options: EvalOptions,
): Expression {
  if (expr.operator !== "List" && isClosed(expr)) {
    if ((expr as Partial<{ isExact: boolean }>).isExact !== false) return expr; // already exact
    const args = tolerance === undefined ? [expr] : [expr, tolerance];
    return native?.(args, options) ?? expr;
  }
  const ops = operandsOf(expr);
  if (ops.length === 0) return expr; // a bare free symbol
  const rebuilt = ops.map((op) => rationalizeDeep(ce, native, op, tolerance, options));
  return ce.function(expr.operator, rebuilt).evaluate();
}

export function declareThreading113(ce: ComputeEngine): void {
  // HarmonicNumber threads over a list or a matrix, as Wolfram's Listable heads do:
  // HarmonicNumber([n...]) and HarmonicNumber(n, matrix-of-orders). compute-engine threads
  // its own heads (HurwitzZeta, StieltjesGamma, DirichletCharacter, DirichletL) itself.
  threadOverLists(ce, ["HarmonicNumber"]);

  // Rationalize(list) and Rationalize(expression-with-floats-inside): compute-engine's
  // own Rationalize takes a single real and rejects both. Widen past its native
  // "(number, number?) -> number" signature first, so a List or a symbolic expression
  // even reaches `evaluate` -- otherwise boxing itself rejects the call with a type
  // error before the wrapper below ever runs. `nativeAccepts` gates the native path to
  // a CLOSED value (`isClosed`, no free variable) exactly as it always accepted --
  // including a compound one like `Exp(Sqrt(2))`, which native already reduces
  // internally; only a List, or an expression with a genuine free variable in it,
  // reaches the wrapper.
  widenSignature(ce, "Rationalize", "(value, number?) -> value", isClosed);
  wrapOperator(
    ce,
    ["Rationalize", 1],
    (ops) => ops[0] !== undefined && (ops[0].operator === "List" || !isClosed(ops[0])),
    (native) => (ops, options) => rationalizeDeep(ce, native, ops[0], ops[1], options),
    1,
  );
}
