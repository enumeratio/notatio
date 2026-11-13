import { bigIntegerAt, type Engine, type Expr, extendHead, operandsOf, symbolNameOf } from "@notatio/engine";
import type { EvalOptions } from "@notatio/ce-patches";
import { asymptoticSeries } from "./series-asymptotic.ts";

// `Series(f, x, DirectedInfinity(z), n)`: compute-engine runs its Taylor rule at the point with
// f and its derivatives "evaluated" at an infinity, which is no expansion (`Ai(∞) + (x − ∞)·Ai′(∞)`).
// The expansion at infinity is an asymptotic series in 1/x, which it has not got, so the call
// stays as written (a symbolic direction is the one case native does not decline already),
// unless series-asymptotic.ts has the expansion: then `Series(f, x, ∞, n)` is that, as Wolfram
// cuts it.
//
// Likewise `Series(₂F₁(a, b; c; x), x, 1, n)`: at x = 1 the function runs in powers of (1−x)^(c−a−b)
// and logarithms, so the Taylor rule's derivatives are poles, not coefficients. Only a terminating
// series is analytic there.

const isNonpositiveInteger = (op: Expr | undefined): boolean => {
  const n = bigIntegerAt(op);
  return n !== undefined && n <= 0n;
};

/** `Series(₂F₁(a, b; c; x), x, 1, n)` for a ₂F₁ that does not terminate. */
function expandsAtSingularity([f, variable, point]: readonly Expr[]): boolean {
  if (f?.operator !== "Hypergeometric2F1" || variable === undefined || bigIntegerAt(point) !== 1n) return false;
  const [a, b, , z] = operandsOf(f);
  return z !== undefined && z.isSame(variable) && !isNonpositiveInteger(a) && !isNonpositiveInteger(b);
}

/** Whether `e` is +∞, along the positive real axis: `PositiveInfinity`, a number to compute-engine, or `DirectedInfinity(1)`. */
const isPositiveInfinity = (e: Expr | undefined): boolean =>
  e !== undefined &&
  ((e.isInfinity === true && e.im === 0 && e.re > 0) ||
    (e.operator === "DirectedInfinity" && operandsOf(e).length === 1 && operandsOf(e)[0]!.is(1)));

/** The most declined expansions kept per engine. */
const MAX_DECLINED = 256;

export function declareSeriesInfinite(ce: Engine): void {
  const native = ce.lookupDefinition("Series");
  if (native === undefined || !("operator" in native)) return;
  const before = native.operator.evaluate;
  // A held Series is evaluated again by every simplify pass over it, and native's Taylor rule
  // differentiates f to the order before it declines at an infinity (about 0.4 s for
  // `Hypergeometric0F1Regularized`): the declines are remembered, so the work is done once.
  const declined = new Set<string>();
  extendHead(ce, "Series", {
    evaluate: (ops: readonly Expr[], options: EvalOptions) => {
      const [f, variable, point, order] = ops;
      if (
        f !== undefined &&
        variable !== undefined &&
        symbolNameOf(variable) !== undefined &&
        isPositiveInfinity(point)
      ) {
        const expansion = asymptoticSeries(ce, f, variable, order === undefined ? 5 : order.N().re);
        if (expansion !== undefined) return expansion;
      }
      if (point?.operator === "DirectedInfinity" || expandsAtSingularity(ops)) return undefined;
      if (!isPositiveInfinity(point)) return before?.(ops, options);
      const key = `${ce.precision}${JSON.stringify(ops.map((op) => op.json))}`;
      if (declined.has(key)) return undefined;
      const result = before?.(ops, options);
      if (result === undefined) {
        if (declined.size >= MAX_DECLINED) declined.clear();
        declined.add(key);
      }
      return result;
    },
  });
}
