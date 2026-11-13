import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { bigRationalAt, operandsOf, wrapOperator } from "@notatio/engine";
import type { EvalOptions } from "@notatio/ce-patches";

// The hyperbolic functions of ln q, q a positive rational, are rational in q:
// sinh(ln q) = (q − 1/q)/2, cosh(ln q) = (q + 1/q)/2 and the rest by division. Wolfram
// folds these (Sinh[Log[2]] is 3/4); compute-engine leaves them symbolic. Sinh(−ln q) is
// already turned into −Sinh(ln q) by the parity rules in elementary-remaining.ts. Not
// upstreamed -- stays here.

const finish = (expr: Expression, options: EvalOptions): Expression =>
  options.numericApproximation ? expr.N() : expr.evaluate();

type Rational = (q: Expression, inverse: Expression) => Expression;

const half = (ce: ComputeEngine, x: Expression): Expression => ce.function("Divide", [x, ce.number(2)]);

const RULES: Readonly<Record<string, (ce: ComputeEngine) => Rational>> = {
  Sinh: (ce) => (q, p) => half(ce, ce.function("Subtract", [q, p])),
  Cosh: (ce) => (q, p) => half(ce, ce.function("Add", [q, p])),
  Tanh: (ce) => (q, p) => ce.function("Divide", [ce.function("Subtract", [q, p]), ce.function("Add", [q, p])]),
  Coth: (ce) => (q, p) => ce.function("Divide", [ce.function("Add", [q, p]), ce.function("Subtract", [q, p])]),
  Sech: (ce) => (q, p) => ce.function("Divide", [ce.number(2), ce.function("Add", [q, p])]),
  Csch: (ce) => (q, p) => ce.function("Divide", [ce.number(2), ce.function("Subtract", [q, p])]),
};

/** The q of `Ln(q)`, for a positive exact rational q other than 1. */
function logArgument(op: Expression | undefined): readonly [bigint, bigint] | undefined {
  const args = operandsOf(op);
  if (op?.operator !== "Ln" || args.length !== 1) return undefined;
  const q = bigRationalAt(args[0]);
  return q !== undefined && q[0] > 0n && q[0] !== q[1] ? q : undefined;
}

export function declareHyperbolicExact(ce: ComputeEngine): void {
  for (const [head, rule] of Object.entries(RULES)) {
    const apply = rule(ce);
    // compile builtin: exact values and identities at exact arguments
    wrapOperator(
      ce,
      [head, 1],
      (ops) => logArgument(ops[0]) !== undefined,
      () => (ops, options) => {
        const [n, d] = logArgument(ops[0])!;
        return finish(apply(ce.number([n, d]), ce.number([d, n])), options);
      },
      { arity: 1, compile: "builtin" },
    );
  }
}
