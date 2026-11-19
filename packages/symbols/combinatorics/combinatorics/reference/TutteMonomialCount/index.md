---
name: TutteMonomialCount
domain: Graph statistics
signature: TutteMonomialCount(graph)
summary: The monomials of the Tutte polynomial.
catalog:
  - system: findstat
    identity: St001546
    url: https://www.findstat.org/St001546
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: TutteMonomialCount(graph)
    description: The monomials of the Tutte polynomial.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `Length(_x[2]) <= 21 && _x[1] <= 8` holds; elsewhere the call stays unevaluated.
- FindStat's St001546. With N(a, b) the sets of edges of corank a and nullity b, the coefficient of x^i y^j is the sum over a >= i, b >= j of N(a, b) C(a, i) C(b, j) (-1)^(a - i + b - j), and the nonzero ones are counted. The graph with no vertices has the Tutte polynomial 1, one monomial, a convention and not a FindStat row: 1.
