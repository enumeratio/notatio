---
name: PolynomialRoot
domain: Number theory
signature: PolynomialRoot(p, x, k)
primitive: kernel
summary: "The $k$-th root of the polynomial $p$ in the variable $x$, in Wolfram's order: real roots first, increasing, then complex roots by real part and imaginary part. Wolfram's `Root`; compute-engine's `Root` is the $n$-th root."
signatures:
  - call: PolynomialRoot(p, x, k)
    description: "the $k$-th root of $p$, exact: rational and quadratic roots are written as radicals, others stay a name for the root"
    library: enumeratio-number-theory
    type: (any, any, integer) -> number
bindings:
  - origin: native
    form: typescript
    environment: engine
    source: packages/ce-patches/src/compute-engine/library/algebraic-numbers.ts
  - origin: mapped
    form: wolfram
    template: Root[Function[$2, $1], $3]
    arity: 3
    note: Wolfram's Root of the pure function of $x$, which compute-engine's nth-root Root would shadow.
seeAlso:
  - MinimalPolynomial
  - NumberFieldIntegralBasis
  - Root
---

- $x$ is bound, as in Wolfram's `Root[Function[x, p], k]`: `x` replaced outside the head, or given a value, leaves it alone, and `x` is the only unknown of $p$
- A root of degree 3 or more stays `PolynomialRoot(p, x, k)`, an exact algebraic number that [[MinimalPolynomial]], [[NumberFieldDiscriminant]] and the other number-field heads read
- Roots of a reducible $p$ are left unevaluated rather than reduced to a factor's, and so is an index outside $1$ to the degree
- Under `N` the root is a number whatever its degree: the roots are found numerically, with the real roots counted exactly, and the $k$-th taken in the order above; a polynomial with a repeated root, or roots too close to order with certainty, stays unevaluated
- Different roots of one polynomial are different numbers: an expression in two of them ($\theta_1 - \theta_2$) is left to the heads that read it, which leave it unevaluated, and a polynomial past degree 12 is not read as a field generator
