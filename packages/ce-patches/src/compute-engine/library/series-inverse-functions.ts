import type { ComputeEngine, Expression } from "@cortex-js/compute-engine";
import { integerAt, operandsOf, symbolNameOf } from "@notatio/engine";

type Evaluate = (ops: readonly Expression[], options: { numericApproximation?: boolean }) => unknown;

// cortex-js/compute-engine: `Series` takes Taylor coefficients by differentiating the expression
// symbolically once per order, and the derivative of an inverse function grows about twofold per
// step (`Series(Arctan(x), x, 0, 7)` takes seconds, `Series(Sin(x), x, 0, 7)` milliseconds).
// For `f(u)` with `u(0) = 0` and `f' = u' · h(u)` for a rational or algebraic `h`, the series is
// the termwise integral of the series of `f'`, which is a small expression of the same order.
// The order and the position of the remainder term follow the native result: the terms through
// x^order, then `O` at the first power past that with a nonzero coefficient.

/** The derivative of each inverse function, as a function of its argument `u` and `u'`. */
const DERIVATIVES: Record<string, (ce: ComputeEngine, u: Expression, du: Expression) => Expression> = {
  Arctan: (ce, u, du) => ce.function("Divide", [du, ce.function("Add", [ce.One, ce.function("Square", [u])])]),
  Arccot: (ce, u, du) =>
    ce.function("Negate", [ce.function("Divide", [du, ce.function("Add", [ce.One, ce.function("Square", [u])])])]),
  Arctanh: (ce, u, du) => ce.function("Divide", [du, ce.function("Subtract", [ce.One, ce.function("Square", [u])])]),
  Arcsin: (ce, u, du) =>
    ce.function("Divide", [du, ce.function("Sqrt", [ce.function("Subtract", [ce.One, ce.function("Square", [u])])])]),
  Arccos: (ce, u, du) =>
    ce.function("Negate", [
      ce.function("Divide", [du, ce.function("Sqrt", [ce.function("Subtract", [ce.One, ce.function("Square", [u])])])]),
    ]),
  Arcsinh: (ce, u, du) =>
    ce.function("Divide", [du, ce.function("Sqrt", [ce.function("Add", [ce.One, ce.function("Square", [u])])])]),
};

/** The inverse functions whose value at 0 is π/2; the others vanish there. */
const AT_ZERO_IS_HALF_PI = new Set(["Arccos", "Arccot"]);

/** The exponent `k` and the coefficient of `term` read as `c · x^k`, or `undefined`. */
function monomial(ce: ComputeEngine, term: Expression, x: string): { k: number; c: Expression } | undefined {
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

/** The series of `f(u)` about 0, or `undefined` where the native handler should answer. */
function integratedSeries(
  ce: ComputeEngine,
  ops: readonly Expression[],
  numericApproximation: boolean | undefined,
): Expression | undefined {
  const [expression, variable, point, orderOp] = ops;
  const x = variable && symbolNameOf(variable);
  const derivative = expression && DERIVATIVES[expression.operator];
  if (!x || !derivative || !point?.isSame(0)) return undefined;
  const order = orderOp === undefined ? 5 : Math.floor(orderOp.N().re);
  if (!Number.isFinite(order) || order < 1) return undefined;

  const [u] = operandsOf(expression);
  if (u === undefined || !u.has(x)) return undefined;
  const atZero = u.subs({ [x]: 0 }).evaluate();
  if (!atZero.isSame(0)) return undefined;
  const du = ce.function("D", [u, variable!]).evaluate();
  if (du.has("D") || du.has("Derivative")) return undefined;

  const series = ce.function("Series", [derivative(ce, u, du), variable!, ce.Zero, ce.number(order - 1)]).evaluate();
  const parts = series.operator === "Add" ? operandsOf(series) : [series];
  const terms: Expression[] = [];
  let remainder: number | undefined;
  for (const part of parts) {
    if (part.operator === "BigO") {
      const [inner] = operandsOf(part);
      const m = inner && (symbolNameOf(inner) === x ? 1 : integerAt(operandsOf(inner)[1]));
      if (m === undefined || remainder !== undefined || m < order) return undefined;
      remainder = m + 1;
      continue;
    }
    const parsed = monomial(ce, part, x);
    if (parsed === undefined || parsed.k >= order) return undefined;
    terms.push(
      ce.function("Multiply", [
        ce.function("Divide", [parsed.c, ce.number(parsed.k + 1)]),
        ce.function("Power", [ce.symbol(x), ce.number(parsed.k + 1)]),
      ]),
    );
  }
  if (remainder === undefined) return undefined;

  if (AT_ZERO_IS_HALF_PI.has(expression.operator)) terms.push(ce.function("Divide", [ce.Pi, ce.number(2)]));
  terms.push(ce.function("BigO", [ce.function("Power", [ce.symbol(x), ce.number(remainder)])]));
  const result = ce.function("Add", terms).evaluate();
  return numericApproximation ? result.N() : result;
}

/** `Series` of an inverse function of an expression vanishing at the point 0 is the integral of
 * the series of its derivative; every other call goes to the native handler. */
export function seriesIntegratesDerivatives(ce: ComputeEngine): void {
  const definition = ce.lookupDefinition("Series");
  const operator = definition !== undefined && "operator" in definition ? definition.operator : undefined;
  const native = operator?.evaluate as Evaluate | undefined;
  if (operator === undefined || native === undefined) return;
  operator.evaluate = ((ops: readonly Expression[], options: { numericApproximation?: boolean }) => {
    const result = integratedSeries(ce, ops, options.numericApproximation);
    return result?.isValid ? result : native(ops, options);
  }) as never;
}
