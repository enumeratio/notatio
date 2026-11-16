import type { ComputeEngine, Expression } from "@cortex-js/compute-engine";
import { integerAt, operandsOf, symbolNameOf } from "@notatio/engine";
import { addSeriesHandler, monomial } from "./series-inverse-functions.ts";

// cortex-js/compute-engine#597: native `Series` of a hypergeometric function at 0 leaves each
// coefficient as an inert `Apply(Derivative(f, 0, 0, n), a, b, 0)`. For `pFq(a; b; u)` with
// `u(0) = 0` the series is the defining sum Σ (a)ₙ/(b)ₙ uⁿ/n! through the order, composed with the
// series of `u`; the regularized heads divide by Γ of each lower parameter. The remainder term
// is `O(x^(order+1))`, where native puts it.

interface Shape {
  /** Upper parameters then lower ones, as operand positions, and the position of the argument. */
  upper: (ops: readonly Expression[]) => readonly Expression[] | undefined;
  lower: (ops: readonly Expression[]) => readonly Expression[] | undefined;
  argument: number;
  regularized: boolean;
}

const fixedShape = (p: number, q: number, regularized: boolean): Shape => ({
  upper: (ops) => ops.slice(0, p),
  lower: (ops) => ops.slice(p, p + q),
  argument: p + q,
  regularized,
});

const listShape = (regularized: boolean): Shape => ({
  upper: (ops) => (ops[0]?.operator === "List" ? operandsOf(ops[0]) : undefined),
  lower: (ops) => (ops[1]?.operator === "List" ? operandsOf(ops[1]) : undefined),
  argument: 2,
  regularized,
});

const SHAPES: Record<string, Shape> = {
  Hypergeometric0F1: fixedShape(0, 1, false),
  Hypergeometric1F1: fixedShape(1, 1, false),
  Hypergeometric2F1: fixedShape(2, 1, false),
  HypergeometricPFQ: listShape(false),
  Hypergeometric0F1Regularized: fixedShape(0, 1, true),
  Hypergeometric1F1Regularized: fixedShape(1, 1, true),
  Hypergeometric2F1Regularized: fixedShape(2, 1, true),
  Hypergeometric3F2Regularized: fixedShape(3, 2, true),
  HypergeometricPFQRegularized: listShape(true),
};

/** The arity each head takes, so a malformed call goes to the native handler. */
const ARITY: Record<string, number> = {
  Hypergeometric0F1: 2,
  Hypergeometric1F1: 3,
  Hypergeometric2F1: 4,
  HypergeometricPFQ: 3,
  Hypergeometric0F1Regularized: 2,
  Hypergeometric1F1Regularized: 3,
  Hypergeometric2F1Regularized: 4,
  Hypergeometric3F2Regularized: 6,
  HypergeometricPFQRegularized: 3,
};

/** The most terms of the sum a call builds; a larger order goes to the native handler. */
const MAX_ORDER = 40;

const nonpositiveInteger = (p: Expression): boolean => {
  const k = integerAt(p);
  return k !== undefined && k <= 0;
};

/** The truncated coefficients `c[0..order]` of the series of `u` about 0, or `undefined`. */
function coefficientsOf(ce: ComputeEngine, u: Expression, x: string, order: number): Expression[] | undefined {
  const coefficients: Expression[] = Array.from({ length: order + 1 }, () => ce.Zero);
  if (symbolNameOf(u) === x) {
    coefficients[1] = ce.One;
    return coefficients;
  }
  const series = ce.function("Series", [u, ce.symbol(x), ce.Zero, ce.number(order)]).evaluate();
  const parts = series.operator === "Add" ? operandsOf(series) : [series];
  for (const part of parts) {
    if (part.operator === "BigO") {
      const [inner] = operandsOf(part);
      const m = inner && (symbolNameOf(inner) === x ? 1 : integerAt(operandsOf(inner)[1]));
      if (m === undefined || m <= order) return undefined;
      continue;
    }
    const parsed = monomial(ce, part, x);
    if (parsed === undefined || parsed.k > order) return undefined;
    coefficients[parsed.k] = ce.function("Add", [coefficients[parsed.k]!, parsed.c]).evaluate();
  }
  return coefficients[0]!.isSame(0) ? coefficients : undefined;
}

/** `(a)ₙ = a (a + 1) ⋯ (a + n − 1)`, as a product of its factors. */
const pochhammer = (ce: ComputeEngine, a: Expression, n: number): Expression =>
  n === 0
    ? ce.One
    : ce.function(
        "Multiply",
        Array.from({ length: n }, (_, i) => (i === 0 ? a : ce.function("Add", [a, ce.number(i)]))),
      );

function hypergeometricSeries(
  ce: ComputeEngine,
  ops: readonly Expression[],
  numericApproximation: boolean | undefined,
): Expression | undefined {
  const [expression, variable, point, orderOp] = ops;
  const x = variable && symbolNameOf(variable);
  const shape = expression && SHAPES[expression.operator];
  if (!x || !shape || !point?.isSame(0)) return undefined;
  const order = orderOp === undefined ? 5 : Math.floor(orderOp.N().re);
  if (!Number.isFinite(order) || order < 1 || order > MAX_ORDER) return undefined;

  const args = operandsOf(expression);
  if (args.length !== ARITY[expression.operator]) return undefined;
  const upperAll = shape.upper(args);
  const lowerAll = shape.lower(args);
  const u = args[shape.argument];
  if (!upperAll || !lowerAll || !u || !u.has(x) || args.slice(0, shape.argument).some((p) => p.has(x))) {
    return undefined;
  }
  if (
    !u
      .subs({ [x]: 0 })
      .evaluate()
      .isSame(0)
  )
    return undefined;

  // A lower parameter at a pole of the sum goes to native, unless an equal upper parameter cancels
  // it (the plain heads); the regularized heads leave that to the limit native does not take either.
  const upper = [...upperAll];
  const lower: Expression[] = [];
  for (const b of lowerAll) {
    if (!nonpositiveInteger(b)) {
      lower.push(b);
      continue;
    }
    const at = shape.regularized ? -1 : upper.findIndex((a) => a.isSame(b));
    if (at < 0) return undefined;
    upper.splice(at, 1);
  }

  const U = coefficientsOf(ce, u, x, order);
  if (U === undefined) return undefined;
  const valuation = U.findIndex((c) => !c.isSame(0));
  if (valuation < 1) return undefined;

  // coefficient[k] = Σₙ wₙ [uⁿ]ₖ, with uⁿ built up by truncated multiplication
  const coefficient: Expression[][] = Array.from({ length: order + 1 }, () => []);
  let power: Expression[] = Array.from({ length: order + 1 }, (_, k) => (k === 0 ? ce.One : ce.Zero));
  for (let n = 0; n * valuation <= order; n++) {
    if (n > 0) {
      const next: Expression[] = Array.from({ length: order + 1 }, () => ce.Zero);
      for (let i = n - 1; i <= order; i++) {
        if (power[i]!.isSame(0)) continue;
        for (let j = valuation; i + j <= order; j++) {
          if (U[j]!.isSame(0)) continue;
          next[i + j] = ce.function("Add", [next[i + j]!, ce.function("Multiply", [power[i]!, U[j]!])]).evaluate();
        }
      }
      power = next;
    }
    const weight = ce.function("Divide", [
      ce.function("Multiply", [...upper.map((a) => pochhammer(ce, a, n)), ce.One]),
      ce.function("Multiply", [...lower.map((b) => pochhammer(ce, b, n)), ce.number(factorial(n))]),
    ]);
    for (let k = 0; k <= order; k++) {
      if (!power[k]!.isSame(0)) coefficient[k]!.push(ce.function("Multiply", [weight, power[k]!]));
    }
  }

  const gamma = shape.regularized
    ? ce.function("Multiply", [...lowerAll.map((b) => ce.function("Gamma", [b])), ce.One])
    : undefined;
  const scaled = (value: Expression) => (gamma ? ce.function("Divide", [value, gamma]) : value);

  const terms: Expression[] = [];
  for (let k = 0; k <= order; k++) {
    const sum = coefficient[k]!;
    if (sum.length === 0) continue;
    const c = scaled(ce.function("Add", sum));
    terms.push(k === 0 ? c : ce.function("Multiply", [c, ce.function("Power", [ce.symbol(x), ce.number(k)])]));
  }
  terms.push(ce.function("BigO", [ce.function("Power", [ce.symbol(x), ce.number(order + 1)])]));
  const result = ce.function("Add", terms).evaluate();
  return numericApproximation ? result.N() : result;
}

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

/** `Series` of a hypergeometric function of an argument vanishing at 0, at the point 0, is its
 * defining sum composed with the argument's series; every other call goes to the native handler. */
export function seriesHypergeometricAtZero(ce: ComputeEngine): void {
  addSeriesHandler(ce, hypergeometricSeries);
}
