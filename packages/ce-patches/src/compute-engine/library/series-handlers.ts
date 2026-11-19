import type { ComputeEngine, Expression } from "@cortex-js/compute-engine";
import { declareCompile, integerAt, operandsOf, symbolNameOf } from "@notatio/engine";

// The one `Series` wrapper that every patch rewriting `Series` shares.
type Evaluate = (ops: readonly Expression[], options: { numericApproximation?: boolean }) => unknown;

/** The exponent `k` and the coefficient of `term` read as `c · x^k`, or `undefined`. */
export function monomial(ce: ComputeEngine, term: Expression, x: string): { k: number; c: Expression } | undefined {
  if (!term.has(x)) return { k: 0, c: term };
  if (term.operator === "Negate") {
    const inner = monomial(ce, operandsOf(term)[0]!, x);
    return inner && { k: inner.k, c: ce.function("Negate", [inner.c]) };
  }
  const power = (factor: Expression): number | undefined => {
    if (symbolNameOf(factor) === x) return 1;
    const [base, exponent] = operandsOf(factor);
    if (factor.operator !== "Power" || base === undefined || symbolNameOf(base) !== x) return undefined;
    const k = integerAt(exponent);
    return k !== undefined && k > 0 ? k : undefined;
  };
  const k = power(term);
  if (k !== undefined) return { k, c: ce.One };
  if (term.operator !== "Multiply") return undefined;
  const factors = operandsOf(term);
  const at = factors.findIndex((factor) => power(factor) !== undefined);
  if (at < 0) return undefined;
  const rest = factors.filter((_, i) => i !== at);
  if (rest.some((factor) => factor.has(x))) return undefined;
  return { k: power(factors[at]!)!, c: rest.length === 1 ? rest[0]! : ce.function("Multiply", rest) };
}

/** A rewrite of `Series` for one class of heads: the series, or `undefined` for the native handler. */
export type SeriesHandler = (
  ce: ComputeEngine,
  ops: readonly Expression[],
  numericApproximation: boolean | undefined,
) => Expression | undefined;

const handlers = new WeakMap<ComputeEngine, SeriesHandler[]>();

/** Tries `handler` before the native `Series`; every patch that rewrites `Series` shares the one wrapper. */
export function addSeriesHandler(ce: ComputeEngine, handler: SeriesHandler): void {
  const installed = handlers.get(ce);
  if (installed !== undefined) {
    if (!installed.includes(handler)) installed.push(handler);
    return;
  }
  const definition = ce.lookupDefinition("Series");
  const operator = definition !== undefined && "operator" in definition ? definition.operator : undefined;
  const native = operator?.evaluate as Evaluate | undefined;
  if (operator === undefined || native === undefined) return;
  const list = [handler];
  handlers.set(ce, list);
  operator.evaluate = ((ops: readonly Expression[], options: { numericApproximation?: boolean }) => {
    for (const handle of list) {
      const result = handle(ce, ops, options.numericApproximation);
      if (result?.isValid) return result;
    }
    return native(ops, options);
  }) as never;
  // compile builtin: the same series by another route, and Series has no numeric lowering
  declareCompile(ce, "Series", "builtin");
}
