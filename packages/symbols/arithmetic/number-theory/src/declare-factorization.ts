import { defineOverload, integerAt, operandsOf, refusing, type Engine, type Expr } from "@notatio/engine";

// Factorization(n) for an integer n is the factorization FactorInteger finds, in the head's own
// form: Factorization(Tuple(bases, exponents)), 360 = 2³·3²·5 as Factorization(Tuple(List(2, 3, 5),
// List(3, 2, 1))). It reads FactorInteger's answer, so the two agree on a sign, on 1 and on what
// is too large to factor; where FactorInteger stays unevaluated, so does this.

/** FactorInteger's list of `Tuple(base, exponent)` as parallel lists, or undefined if it isn't one. */
const parallelLists = (ce: Engine, found: Expr): Expr | undefined => {
  if (found.operator !== "List") return undefined;
  const bases: Expr[] = [];
  const exponents: Expr[] = [];
  for (const pair of operandsOf(found)) {
    const [base, exponent] = operandsOf(pair);
    if (pair.operator !== "Tuple" || base === undefined || exponent === undefined) return undefined;
    if (integerAt(exponent) === undefined) return undefined;
    bases.push(base);
    exponents.push(exponent);
  }
  return ce.function("Tuple", [ce.function("List", bases), ce.function("List", exponents)]);
};

export function declareFactorization(ce: Engine): void {
  defineOverload(ce, "Factorization", {
    package: "number-theory",
    signature: "(integer) -> factorization",
    arity: 1,
    when: (ops) => ops[0]?.isInteger === true,
    // Held like the constructor it overloads: no target has a lowering for a factorization.
    compile: refusing(() => true, "a factorization is a held value"),
    evaluate: (ops) => {
      const lists = parallelLists(ce, ce.function("FactorInteger", [ops[0]!]).evaluate());
      return lists === undefined ? undefined : ce.function("Factorization", [lists]);
    },
  });
}
