import { type ComputeEngine, type Expression, isFunction, isSymbol } from "@cortex-js/compute-engine";
import { declareCompile } from "@notatio/engine";

const operandsOf = (expr: Expression): readonly Expression[] => (isFunction(expr) ? expr.ops : []);

/** Whether `pattern` holds a blank the pattern grammar can't read: a head-restricted blank
 *  (`_Integer`) or a trailing-underscore name (`x_`, `x_Integer`). Matching one as an ordinary
 *  symbol would answer wrongly, so the call is left to the native head. */
function hasUnsupportedBlank(pattern: Expression): boolean {
  const name = isSymbol(pattern) ? pattern.symbol : undefined;
  if (name !== undefined) return /^_{1,3}[A-Z]/.test(name) || /^[^_]\w*_/.test(name);
  return operandsOf(pattern).some(hasUnsupportedBlank);
}

/** The `[lhs, rhs]` pairs of rules given as `Rule`s or lists of `Rule`s, or `undefined` for
 *  anything else (a nested rule set, a blank the grammar can't read). */
function rulesOf(specs: readonly Expression[]): [Expression, Expression][] | undefined {
  const rules = specs.flatMap((spec) => (spec.operator === "List" ? operandsOf(spec) : [spec]));
  if (rules.length === 0 || rules.some((rule) => rule.operator !== "Rule" || operandsOf(rule).length !== 2))
    return undefined;
  const pairs = rules.map((rule) => operandsOf(rule) as [Expression, Expression]);
  return pairs.some(([lhs]) => hasUnsupportedBlank(lhs)) ? undefined : pairs;
}

/**
 * `ReplaceAll(expr, rules)` with a compound left side replaces every matching part of `expr`,
 * as Wolfram's `expr /. rules` does. Rules apply top-down, the first rule that matches a part
 * wins, and its result is not searched again. A rule whose left side is a symbol, a call with
 * no operands, or anything the pattern grammar can't read goes to the native head.
 */
export function replaceAllCompoundPatterns(ce: ComputeEngine): void {
  const definition = ce.lookupDefinition("ReplaceAll");
  const operator = definition !== undefined && "operator" in definition ? definition.operator : undefined;
  const native = operator?.evaluate;
  if (operator === undefined || native === undefined) return;
  const lazy = operator.lazy === true;

  // The compound replacement has no lowering, so ReplaceAll does not compile, as with the override this replaces.
  declareCompile(ce, "ReplaceAll", undefined);
  (operator as { evaluate: unknown }).evaluate = (
    ops: readonly Expression[],
    options: { numericApproximation?: boolean },
  ) => {
    // A held call hands over its operands as written: read them evaluated, as a rule set is
    const values = lazy ? ops.map((op) => (options.numericApproximation ? op.N() : op.evaluate())) : ops;
    const [value, ...specs] = values;
    const rules = value === undefined ? undefined : rulesOf(specs);
    if (rules === undefined || !rules.some(([lhs]) => operandsOf(lhs).length > 0)) return native(ops, options as never);
    const visit = (part: Expression): Expression => {
      for (const [lhs, rhs] of rules) {
        const substitution = part.match(lhs);
        if (substitution !== null) return rhs.subs(substitution, { canonical: true });
      }
      const operands = operandsOf(part);
      return operands.length === 0 ? part : ce.function(part.operator, operands.map(visit));
    };
    return visit(value!).evaluate();
  };
}
